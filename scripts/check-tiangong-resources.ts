import assert from 'node:assert/strict';
import test from 'node:test';
import { callBlockReason, confirmTask, createProjectWorkspace, finishModelRequest, initialState, normalizeWorkbenchState, reviewCall, runQueuedTaskStep, startTask } from '../src/components/agentWorkbenchState';
import { disconnectTiangongResource, effectiveTiangongLinks, normalizeTiangongUrl, resumeTiangongSession, saveTiangongResource, setTiangongScopeLinks, taskTiangongTarget, tiangongResourceAccess, tiangongResourceStatus, verifyTiangongPrototype } from '../src/components/agentTiangongResources';
import { modelPreset } from '../src/components/agentModelService';
import { resourceConnections, setResourceConnected } from '../src/components/agentResourceConnections';

async function setup(parkId = 'park-east', url = 'http://tiangong.example.local', account = 'demo') {
  const state = initialState(); const workspace = createProjectWorkspace(state, '天工项目');
  const session = (await verifyTiangongPrototype(url, account, 'demo123')).session!;
  const resource = saveTiangongResource(state, { sessionRef: session.id, url, parkId }).resource!;
  return { state, workspace, session, resource };
}

test('编辑园区地址更新原资源，保留项目与聊天关联，不新增重复园区', async () => {
  const { state, workspace, resource } = await setup('park-east', 'http://park-before-edit.local');
  setTiangongScopeLinks(state, { kind: 'project', workspaceId: workspace.id }, [{ resourceId: resource.id, read: true, write: true }]);
  const task = startTask(state, { workspaceId: workspace.id, kind: 'business', prompt: '查询天工园区数据' })!;
  const originalId = resource.id;
  const session = (await verifyTiangongPrototype('http://park-after-edit.local', 'demo', 'demo123')).session!;
  const saved = saveTiangongResource(state, { sessionRef: session.id, url: session.url, parkId: resource.parkId, editingId: originalId });
  assert.equal(saved.resource?.id, originalId);
  assert.equal(state.tiangongResources!.length, 1);
  assert.equal(resource.url, session.url);
  assert.equal(workspace.tiangongLinks![0].resourceId, originalId);
  assert.equal(task.tiangongLinks![0].resourceId, originalId);
  assert.equal(state.calls.find(call => call.taskId === task.id)!.status, 'blocked');
  assert.ok(tiangongResourceAccess(resource));
  assert.equal(saveTiangongResource(state, { sessionRef: session.id, url: session.url, parkId: resource.parkId, editingId: 'missing' }).resource, undefined);
  assert.equal(state.tiangongResources!.length, 1);
});

test('园区可用已保存资料直接连接与断联，保留关联且不恢复旧写入授权', async () => {
  const { state, workspace, session, resource } = await setup('park-east', 'http://connection-actions.local');
  const other = saveTiangongResource(state, { sessionRef: session.id, url: session.url, parkId: 'park-south' }).resource!;
  const task = startTask(state, { workspaceId: workspace.id, kind: 'business', prompt: '修改天工业务记录', tiangongLinks: [{ resourceId: resource.id, read: true, write: true }] })!;
  runQueuedTaskStep(state, task.id); runQueuedTaskStep(state, task.id);
  const call = state.calls.find(call => call.taskId === task.id && call.kind === 'tiangong-write')!;
  call.approved = true; call.tiangongChange!.reviewed = true;
  const oldSessionRef = resource.sessionRef;
  assert.equal(setResourceConnected(state, 'park', resource.id, false), '');
  assert.equal(tiangongResourceAccess(resource), undefined);
  assert.ok(tiangongResourceAccess(other));
  assert.equal(call.status, 'blocked'); assert.equal(call.approved, false); assert.equal(call.tiangongChange!.reviewed, false);
  assert.equal(task.tiangongLinks![0].resourceId, resource.id);
  assert.equal(resourceConnections(state).find(row => row.id === resource.id)?.connected, false);
  assert.equal(setResourceConnected(state, 'park', resource.id, true), '');
  assert.ok(tiangongResourceAccess(resource)); assert.notEqual(resource.sessionRef, oldSessionRef);
  assert.ok(tiangongResourceAccess(other));
  assert.equal(call.status, 'blocked'); assert.equal(call.executions, 0); assert.equal(call.approved, false);
  assert.match(callBlockReason(state, call), /会话已失效/);
  assert.equal(resourceConnections(state).find(row => row.id === resource.id)?.connected, true);
  assert.equal(resumeTiangongSession(session.url, session.account)?.id, session.id);
  assert.equal(JSON.stringify(state).includes('demo123'), false);
});

test('重连园区不扩展权限，缺少验证或真实连接服务的资源不能伪造在线', async () => {
  const { state, resource } = await setup('park-east', 'http://readonly-connections.local', 'viewer');
  setResourceConnected(state, 'park', resource.id, false);
  assert.equal(setResourceConnected(state, 'park', resource.id, true), '');
  assert.equal(tiangongResourceAccess(resource)?.write, false);
  setResourceConnected(state, 'park', resource.id, false);
  resource.mode = 'remote';
  assert.match(setResourceConnected(state, 'park', resource.id, true), /尚未配置/);
  assert.equal(tiangongResourceAccess(resource), undefined);
  resource.mode = 'prototype'; resource.verifiedAt = undefined;
  assert.match(setResourceConnected(state, 'park', resource.id, true), /缺少已验证/);
  assert.equal(tiangongResourceAccess(resource), undefined);
});

test('原型验证明确账号、URL 与园区权限，密码不进入会话或持久化数据', async () => {
  assert.equal(normalizeTiangongUrl('HTTP://TIANGONG.EXAMPLE.LOCAL:80/#/login'), 'http://tiangong.example.local');
  for (const url of ['file:///tmp/a', 'https://user:password@site.local', 'https://site.local?token=secret']) assert.equal(normalizeTiangongUrl(url), null);
  assert.ok((await verifyTiangongPrototype('http://site.local', 'demo', 'wrong')).error);
  const { state, session } = await setup();
  assert.equal(session.parks.length, 3);
  assert.equal(JSON.stringify(session).includes('demo123'), false);
  assert.equal(JSON.stringify(state).includes('demo123'), false);
  assert.equal(resumeTiangongSession('http://tiangong.example.local/', 'demo')!.id, session.id);
  const viewer = (await verifyTiangongPrototype('http://viewer.local', 'viewer', 'demo123')).session!;
  assert.equal(viewer.parks.length, 2);
  assert.ok(viewer.parks.every(park => !park.write));
  assert.ok(saveTiangongResource(state, { sessionRef: viewer.id, url: viewer.url, parkId: 'park-lab' }).error);
});

test('同一 URL 的不同园区独立保存，同一组合去重，不能跨 URL 复用验证', async () => {
  const { state, session, resource } = await setup();
  const other = saveTiangongResource(state, { sessionRef: session.id, url: session.url, parkId: 'park-south' }).resource!;
  assert.notEqual(other.id, resource.id);
  assert.equal(saveTiangongResource(state, { sessionRef: session.id, url: `${session.url}/#/login`, parkId: 'park-east' }).resource!.id, resource.id);
  assert.equal(state.tiangongResources!.length, 2);
  assert.ok(saveTiangongResource(state, { sessionRef: session.id, url: 'http://another.local', parkId: 'park-east' }).error);
  normalizeWorkbenchState(state);
  assert.equal(state.tiangongResources!.length, 2);
  disconnectTiangongResource(state, resource.id);
  assert.equal(tiangongResourceAccess(resource), undefined);
  assert.ok(tiangongResourceAccess(other));
});

test('项目资源继承账号权限且聊天不可单独修改，不污染另一个项目', async () => {
  const { state, workspace, resource } = await setup();
  setTiangongScopeLinks(state, { kind: 'project', workspaceId: workspace.id }, [{ resourceId: resource.id, read: true, write: true }]);
  assert.equal(workspace.tiangongLinks![0].write, true);
  const task = startTask(state, { workspaceId: workspace.id, kind: 'project', prompt: '查询天工园区数据' })!;
  assert.equal(effectiveTiangongLinks(state, workspace.id, task)[0].write, true);
  state.builtinSystemConfigurations = { tiangong: { enabled: true, read: true, write: false } };
  assert.equal(effectiveTiangongLinks(state, workspace.id, task)[0].write, false);
  state.builtinSystemConfigurations.tiangong!.write = true;
  assert.equal(taskTiangongTarget(state, task)!.id, resource.id);
  const other = createProjectWorkspace(state, '其他项目');
  assert.equal(effectiveTiangongLinks(state, other.id).length, 0);
  assert.match(setTiangongScopeLinks(state, { kind: 'task', workspaceId: workspace.id, taskId: task.id }, [], undefined), /继承自项目组/);
  assert.equal(effectiveTiangongLinks(state, workspace.id, task).length, 1);
  assert.equal(workspace.tiangongLinks!.length, 1);
  assert.equal(state.calls.find(call => call.taskId === task.id)!.executions, 0);
});

test('未绑定资源的项目中各聊天独立选择园区，更换取消旧园区操作', async () => {
  const { state, workspace, session, resource } = await setup();
  const second = saveTiangongResource(state, { sessionRef: session.id, url: session.url, parkId: 'park-lab' }).resource!;
  assert.match(setTiangongScopeLinks(state, { kind: 'project', workspaceId: workspace.id }, [resource, second].map(resource => ({ resourceId: resource.id, read: true, write: false }))), /最多关联一个园区/);
  const stopped = startTask(state, { workspaceId: workspace.id, kind: 'business', prompt: '查询天工园区数据' })!;
  assert.equal(stopped.status, 'stopped'); assert.equal(state.calls.length, 0);
  assert.equal(effectiveTiangongLinks(state, workspace.id, stopped).length, 0);
  const scope = { kind: 'task' as const, workspaceId: workspace.id, taskId: stopped.id };
  const both = [resource, second].map(resource => ({ resourceId: resource.id, read: true, write: false }));
  assert.match(setTiangongScopeLinks(state, scope, both), /最多关联一个园区/);
  assert.equal(startTask(state, { workspaceId: workspace.id, kind: 'business', prompt: '查询天工数据', tiangongLinks: both }), null);
  const task = startTask(state, { workspaceId: workspace.id, kind: 'project', prompt: '查询天工园区数据', tiangongLinks: [{ resourceId: second.id, read: true, write: false }], tiangongTargetId: second.id })!;
  runQueuedTaskStep(state, task.id);
  const call = state.calls.find(call => call.taskId === task.id)!;
  assert.equal(call.tiangongResourceId, second.id);
  assert.equal(JSON.parse(call.parameters).parkId, second.parkId);
  assert.equal(JSON.parse(call.parameters).url, second.url);
  assert.match(call.output, /原型浏览器.*未访问真实内网/);
  assert.deepEqual(effectiveTiangongLinks(state, workspace.id, task).map(link => link.resourceId), [second.id]);
  const pending = startTask(state, { workspaceId: workspace.id, kind: 'business', prompt: '修改天工业务记录', tiangongLinks: [{ resourceId: second.id, read: true, write: true }], tiangongTargetId: second.id })!;
  assert.equal(setTiangongScopeLinks(state, { kind: 'task', workspaceId: workspace.id, taskId: pending.id }, [{ resourceId: resource.id, read: true, write: true }]), '');
  assert.deepEqual(effectiveTiangongLinks(state, workspace.id, pending).map(link => link.resourceId), [resource.id]);
  assert.ok(state.calls.filter(call => call.taskId === pending.id).every(call => call.status === 'denied' && call.executions === 0));
  task.tiangongLinks = both; task.tiangongTargetId = second.id;
  normalizeWorkbenchState(state);
  assert.deepEqual(task.tiangongLinks.map(link => link.resourceId), [second.id]);
});

test('未验证或会话失效的园区不能新增绑定，刷新保留已绑定园区的验证记录', async () => {
  const { state, workspace, resource } = await setup();
  const linked = startTask(state, { workspaceId: workspace.id, kind: 'business', prompt: '查询天工园区', tiangongLinks: [{ resourceId: resource.id, read: true, write: false }] })!;
  const empty = startTask(state, { workspaceId: workspace.id, kind: 'chat', prompt: '你好', tiangongLinks: [] })!;
  disconnectTiangongResource(state, resource.id);
  const before = JSON.stringify(state);
  assert.match(setTiangongScopeLinks(state, { kind: 'task', workspaceId: workspace.id, taskId: empty.id }, [{ resourceId: resource.id, read: true, write: false }]), /先验证/);
  assert.equal(JSON.stringify(state), before);
  assert.equal(startTask(state, { workspaceId: workspace.id, kind: 'business', prompt: '查询天工数据', tiangongLinks: [{ resourceId: resource.id, read: true, write: false }] }), null);
  const restored = normalizeWorkbenchState(JSON.parse(JSON.stringify(state)));
  assert.ok(restored.tiangongResources![0].verifiedAt);
  assert.deepEqual(restored.tiangongResources![0].permissions, { read: true, write: true });
  assert.deepEqual(effectiveTiangongLinks(restored, workspace.id, restored.tasks.find(task => task.id === linked.id)).map(link => link.resourceId), [resource.id]);
  assert.equal(tiangongResourceStatus(restored.tiangongResources![0]), '已验证 · 会话需更新');
  assert.equal(JSON.stringify(restored).includes('demo123'), false);
  const unverified = { ...resource, id: 'unverified-park', verifiedAt: undefined, sessionRef: undefined };
  restored.tiangongResources!.push(unverified);
  assert.match(setTiangongScopeLinks(restored, { kind: 'task', workspaceId: workspace.id, taskId: empty.id }, [{ resourceId: unverified.id, read: true, write: false }]), /先验证/);
});

test('修改需账号权限、任务权限、差异审查和逐次确认；确认结果不重复执行', async () => {
  const { state, workspace, resource } = await setup();
  const task = startTask(state, { workspaceId: workspace.id, kind: 'business', prompt: '将天工业务记录标记为已处理', tiangongLinks: [{ resourceId: resource.id, read: true, write: true }] })!;
  runQueuedTaskStep(state, task.id); runQueuedTaskStep(state, task.id);
  const write = state.calls.find(call => call.taskId === task.id && call.kind === 'tiangong-write')!;
  assert.equal(write.status, 'pending'); assert.match(callBlockReason(state, write), /审查/);
  write.tiangongChange!.reviewed = true; reviewCall(state, write.id, true); runQueuedTaskStep(state, task.id);
  assert.equal(write.executions, 1); assert.equal(write.status, 'done');
  assert.equal(state.tiangongParkRecords![0].note, '已处理');
  const record = JSON.stringify(state.tiangongParkRecords);
  confirmTask(state, task.id); confirmTask(state, task.id); runQueuedTaskStep(state, task.id);
  assert.equal(JSON.stringify(state.tiangongParkRecords), record); assert.equal(write.executions, 1);
});

test('拒绝修改保留已完成查询，业务权限直接沿用账号与角色，无需任务开关', async () => {
  const { state, workspace, resource } = await setup();
  const task = startTask(state, { workspaceId: workspace.id, kind: 'business', prompt: '修改天工业务记录', tiangongLinks: [{ resourceId: resource.id, read: true, write: true }] })!;
  runQueuedTaskStep(state, task.id); runQueuedTaskStep(state, task.id);
  const write = state.calls.find(call => call.kind === 'tiangong-write')!;
  reviewCall(state, write.id, false);
  assert.equal(write.executions, 0); assert.equal(write.status, 'denied');
  assert.equal(state.calls.find(call => call.kind === 'tiangong-read')!.executions, 1);
  assert.equal(state.tiangongParkRecords![0].version, 1);
  const readonly = startTask(state, { workspaceId: workspace.id, kind: 'business', prompt: '修改天工业务记录', tiangongLinks: [{ resourceId: resource.id, read: true, write: false }] })!;
  runQueuedTaskStep(state, readonly.id); runQueuedTaskStep(state, readonly.id);
  assert.match(callBlockReason(state, state.calls.find(call => call.taskId === readonly.id && call.kind === 'tiangong-write')!), /审查/);
  state.actorRole = 'member';
  assert.equal(effectiveTiangongLinks(state, workspace.id, readonly)[0].write, false);
  assert.match(callBlockReason(state, state.calls.find(call => call.taskId === readonly.id && call.kind === 'tiangong-write')!), /普通项目成员/);
  state.actorRole = 'admin';
  const viewer = (await verifyTiangongPrototype(resource.url, 'viewer', 'demo123')).session!;
  saveTiangongResource(state, { sessionRef: viewer.id, url: resource.url, parkId: resource.parkId });
  const accountReadonly = startTask(state, { workspaceId: workspace.id, kind: 'business', prompt: '修改天工业务记录', tiangongLinks: [{ resourceId: resource.id, read: true, write: true }] })!;
  assert.match(callBlockReason(state, state.calls.find(call => call.taskId === accountReadonly.id && call.kind === 'tiangong-write')!), /账号.*仅有读取权限/);
});

test('会话变化或断开阻止旧操作，旧模型结果不能沿用新园区或新账号', async () => {
  const { state, workspace, resource } = await setup('park-east', 'http://model-target.local');
  state.modelService = modelPreset('ollama');
  const task = startTask(state, { workspaceId: workspace.id, kind: 'business', prompt: '查询天工园区', tiangongLinks: [{ resourceId: resource.id, read: true, write: false }] })!;
  const job = task.modelRequest!;
  const changed = (await verifyTiangongPrototype(resource.url, 'viewer', 'demo123')).session!;
  saveTiangongResource(state, { sessionRef: changed.id, url: resource.url, parkId: resource.parkId });
  finishModelRequest(state, task.id, job.id, '查询计划');
  assert.equal(task.status, 'stopped'); assert.equal(state.calls.length, 0);
  state.modelService.enabled = false;
  const next = startTask(state, { workspaceId: workspace.id, kind: 'business', prompt: '查询天工园区', tiangongLinks: [{ resourceId: resource.id, read: true, write: false }] })!;
  disconnectTiangongResource(state, resource.id);
  const call = state.calls.find(call => call.taskId === next.id)!;
  assert.match(callBlockReason(state, call), /会话已失效/); assert.equal(call.executions, 0);
  assert.equal(tiangongResourceStatus(resource), '已验证 · 会话需更新');
});

test('并发修改检测园区数据版本冲突，真实 URL 不能伪装为就绪浏览器', async () => {
  const { state, workspace, resource } = await setup('park-east', 'http://conflict.local');
  const input = { workspaceId: workspace.id, kind: 'business' as const, prompt: '修改天工业务记录', tiangongLinks: [{ resourceId: resource.id, read: true, write: true }] };
  const first = startTask(state, input)!; const second = startTask(state, input)!;
  for (const task of [first, second]) { runQueuedTaskStep(state, task.id); runQueuedTaskStep(state, task.id); }
  const a = state.calls.find(call => call.taskId === first.id && call.kind === 'tiangong-write')!;
  a.tiangongChange!.reviewed = true; reviewCall(state, a.id, true); runQueuedTaskStep(state, first.id);
  const b = state.calls.find(call => call.taskId === second.id && call.kind === 'tiangong-write')!;
  b.tiangongChange!.reviewed = true;
  assert.match(callBlockReason(state, b), /数据已更新/); assert.equal(b.executions, 0);
  resource.mode = 'remote';
  assert.match(callBlockReason(state, b), /内网浏览器尚未接入/);
});
