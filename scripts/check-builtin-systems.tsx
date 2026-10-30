import assert from 'node:assert/strict';
import test from 'node:test';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { builtinSystemBlockReason, builtinSystemConfiguration, builtinSystemStatus, configureBuiltinSystem, isBusinessMutationRequest, suggestedSystemResource } from '../src/components/agentBuiltinSystems';
import { extensionItems } from '../src/components/agentExtensions';
import { callBlockReason, createProjectWorkspace, initialState, runQueuedTaskStep, startTask } from '../src/components/agentWorkbenchState';
import { emptySshDraft, saveSshDevice } from '../src/components/agentDeviceConnections';
import BuiltinSystemConfigurationDialog from '../src/components/BuiltinSystemConfiguration';
import TaskDeviceDialog from '../src/components/TaskDeviceDialog';
import TiangongResourceDialog from '../src/components/TiangongResourceDialog';
import { saveTiangongResource, verifyTiangongPrototype } from '../src/components/agentTiangongResources';
import { saveWebDeviceResource, verifyWebDeviceResource } from '../src/components/agentWebDeviceResources';

test('编辑设备 URL 保持资源身份与绑定，不另建一台设备', async () => {
  const state = initialState(); const workspace = createProjectWorkspace(state, '设备编辑');
  const proof = (await verifyWebDeviceResource(state, { url: 'http://192.168.1.103', account: 'demo', password: 'demo123' })).verification!;
  const device = saveWebDeviceResource(state, { verificationId: proof.id, deviceId: proof.devices[0].id }).device!;
  workspace.boundDeviceId = device.id;
  const count = state.devices.length;
  const changed = (await verifyWebDeviceResource(state, { url: 'http://192.168.1.211', account: 'demo', password: 'demo123' })).verification!;
  const saved = saveWebDeviceResource(state, { verificationId: changed.id, deviceId: changed.devices[0].id, editingId: device.id });
  assert.equal(saved.device?.id, device.id);
  assert.equal(device.address, '192.168.1.211');
  assert.equal(device.webConnection!.url, 'http://192.168.1.211');
  assert.equal(workspace.boundDeviceId, device.id);
  assert.equal(state.devices.length, count);
});

test('天工、百川轻搭、数字造机和百川装机统一为内置系统能力', () => {
  const state = initialState();
  const items = extensionItems(state).filter(item => item.kind === 'system');
  assert.deepEqual(items.map(item => item.name), ['天工系统', '百川轻搭', '数字造机', '百川装机']);
  assert.ok(items.every(item => item.builtin && !item.transport));
  const html = renderToStaticMarkup(<BuiltinSystemConfigurationDialog state={state} update={() => {}} systemId="baichuan-qingda" close={() => {}} />);
  assert.ok(html.includes('读取业务数据') && html.includes('提交业务变更'));
  for (const forbidden of ['服务地址', '服务器地址', '启动命令', 'Base URL', 'HTTP', 'STDIO']) assert.equal(html.includes(forbidden), false);
  assert.equal(builtinSystemStatus(state, 'baichuan-qingda'), '可用');
});

test('编辑园区直接显示当前园区和账号密码验证，不显示未获取园区中间页', async () => {
  const state = initialState(); const workspace = createProjectWorkspace(state, '天工项目');
  const session = (await verifyTiangongPrototype('http://editor.local', 'demo', 'demo123')).session!;
  const resource = saveTiangongResource(state, { sessionRef: session.id, url: session.url, parkId: session.parks[0].id }).resource!;
  const html = renderToStaticMarkup(<TiangongResourceDialog platformManaged state={state} update={() => {}} scope={{ kind: 'project', workspaceId: workspace.id }} initialResourceId={resource.id} close={() => {}} notify={() => {}} />);
  assert.ok(html.includes(resource.parkName) && html.includes('value="demo"') && html.includes('aria-label="天工密码"'));
  assert.ok(html.includes('>验证并保存</button>'));
  assert.ok(html.includes('aria-label="天工内网连接"') && html.includes(resource.url));
  for (const forbidden of ['原型验证', '当前不会连接真实内网', '使用示例账号', '账号密码不会发送或保存']) assert.equal(html.includes(forbidden), false);
  assert.equal(html.includes('尚未获取园区'), false);
  assert.equal(html.includes('更换账号'), false);
});

test('成员无法修改平台配置、提交业务变更或修改设备连接；管理员可配置独立权限', () => {
  const state = initialState(); state.actorRole = 'member';
  const before = JSON.stringify(state);
  assert.match(configureBuiltinSystem(state, 'baichuan-qingda', { enabled: false }), /管理员/);
  assert.equal(JSON.stringify(state), before);
  assert.match(builtinSystemBlockReason(state, 'tiangong', true), /普通项目成员/);
  assert.equal(builtinSystemBlockReason(state, 'tiangong', false), '');
  assert.match(saveSshDevice(state, emptySshDraft(), null).error!, /管理员/);
  const html = renderToStaticMarkup(<BuiltinSystemConfigurationDialog state={state} update={() => {}} systemId="tiangong" close={() => {}} />);
  assert.equal((html.match(/disabled=""/g) || []).length, 3);
  state.actorRole = 'admin';
  configureBuiltinSystem(state, 'baichuan-qingda', { read: false });
  assert.match(builtinSystemBlockReason(state, 'baichuan-qingda', false), /读取/);
  assert.equal(builtinSystemConfiguration(state, 'digital-machine').read, true);
  configureBuiltinSystem(state, 'digital-machine', { enabled: false });
  assert.match(builtinSystemBlockReason(state, 'digital-machine', false), /停用/);
});

test('里程、已完成任务和已处理工单属于查询，不生成写操作', () => {
  for (const query of ['今天这台车跑了多少公里、执行了什么任务', '查看今天已处理的工单', '查询已完成工单', '执行了什么任务']) assert.equal(isBusinessMutationRequest(query), false);
  for (const mutation of ['修改运行配置', '将业务记录标记为已处理', '关闭这张工单', '请提交业务变更', '帮我执行任务']) assert.equal(isBusinessMutationRequest(mutation), true);
  const state = initialState(); state.actorRole = 'member';
  const workspace = createProjectWorkspace(state, '百川轻搭'); workspace.deviceIds = ['rdk-x3']; state.devices[0].connected = true;
  const prompt = '今天这台车跑了多少公里、执行了什么任务';
  const task = startTask(state, { workspaceId: workspace.id, kind: 'business', prompt, serviceId: 'mcp-baichuan-qingda', deviceId: 'rdk-x3', resource: suggestedSystemResource('mcp-baichuan-qingda', prompt) })!;
  runQueuedTaskStep(state, task.id);
  const calls = state.calls.filter(call => call.taskId === task.id);
  assert.equal(calls.length, 1); assert.equal(calls[0].kind, 'mcp-read'); assert.equal(calls[0].status, 'done');
  assert.match(calls[0].output, /18.6 公里/); assert.match(calls[0].output, /物料转运/); assert.match(calls[0].output, /原型示例/);
  const denied = startTask(state, { workspaceId: workspace.id, kind: 'business', prompt: '修改设备参数', serviceId: 'mcp-baichuan-qingda', deviceId: 'rdk-x3', resource: '设备状态与日志诊断', allowWrite: true })!;
  assert.match(callBlockReason(state, state.calls.find(call => call.taskId === denied.id && call.kind === 'mcp-write')!), /普通项目成员/);
});

test('关联配置在设备与园区标题旁提供新增，列表没有底部按钮和额外权限开关', () => {
  const state = initialState(); const workspace = createProjectWorkspace(state, '项目'); workspace.deviceIds = ['rdk-x3'];
  const task = startTask(state, { workspaceId: workspace.id, kind: 'project', prompt: '你好', deviceId: 'rdk-x3' })!;
  const html = renderToStaticMarkup(<TaskDeviceDialog state={state} update={() => {}} task={task} close={() => {}} notify={() => {}} />);
  assert.ok(html.includes('解绑设备 RDK X3') && html.includes('编辑设备 RDK X3'));
  assert.ok(html.includes('关联配置') && html.includes('天工园区') && html.includes('新增设备关联') && html.includes('新增关联园区'));
  for (const forbidden of ['aw-modal-footer', '>取消</button>', '本次目标', '允许申请修改', '返回资源列表']) assert.equal(html.includes(forbidden), false);
  assert.equal(html.includes('更换设备'), false); assert.equal(html.includes('aw-current-device'), false);
  state.actorRole = 'member';
  const member = renderToStaticMarkup(<TaskDeviceDialog state={state} update={() => {}} task={task} close={() => {}} notify={() => {}} />);
  assert.equal(member.includes('编辑设备 RDK X3'), false); assert.equal(member.includes('aria-expanded="false"'), false);
});

test('四个系统文件夹补全及刷新恢复幂等，平台能力固定，自建项目保留可配置属性', async () => {
  const { ensureBuiltinProjectGroups, prepareNewTask, setTaskSystemCapability } = await import('../src/components/agentWorkbenchState');
  const state = initialState();
  const custom = createProjectWorkspace(state, '自建项目'); const active = state.activeWorkspaceId;
  state.builtinProjectGroupsAdded = true;
  ensureBuiltinProjectGroups(state); ensureBuiltinProjectGroups(state);
  const systems = state.workspaces.filter(workspace => workspace.builtinSystemId);
  assert.deepEqual(systems.map(workspace => workspace.name), ['天工系统', '百川轻搭', '数字造机', '百川装机']);
  assert.equal(state.activeWorkspaceId, active); assert.equal(custom.builtinSystemId, undefined);
  for (const folder of systems) {
    assert.equal(folder.project?.mcpServiceId, `mcp-${folder.builtinSystemId}`);
    assert.equal(folder.project?.builtinSystemId, folder.builtinSystemId);
    prepareNewTask(state, folder.id);
    assert.equal(folder.composerDraft?.project?.builtinSystemId, folder.builtinSystemId);
  }
  const restored = JSON.parse(JSON.stringify(state)); ensureBuiltinProjectGroups(restored);
  assert.equal(restored.workspaces.filter((workspace: { builtinSystemId?: string }) => workspace.builtinSystemId).length, 4);
  const task = startTask(state, { workspaceId: custom.id, kind: 'chat', prompt: '你好' })!;
  assert.equal(setTaskSystemCapability(state, task.id, 'mcp-tiangong'), '');
  assert.equal(task.mcpServiceId, 'mcp-tiangong'); assert.equal(task.deviceId, null);
});

test('天工文件夹继承园区能力并拒绝设备及能力切换，设备文件夹拒绝园区', async () => {
  const { ensureBuiltinProjectGroups, setTaskSystemCapability } = await import('../src/components/agentWorkbenchState');
  const { associateTaskDevice } = await import('../src/components/agentDeviceConnections');
  const { setTiangongScopeLinks } = await import('../src/components/agentTiangongResources');
  const state = initialState(); ensureBuiltinProjectGroups(state);
  const tiangong = state.workspaces.find(workspace => workspace.builtinSystemId === 'tiangong')!;
  const session = (await verifyTiangongPrototype('http://system-folders.local', 'demo', 'demo123')).session!;
  const resource = saveTiangongResource(state, { sessionRef: session.id, url: session.url, parkId: session.parks[0].id }).resource!;
  const links = [{ resourceId: resource.id, read: true, write: false }];
  assert.equal(startTask(state, { workspaceId: tiangong.id, kind: 'business', prompt: '查询记录' }), null);
  assert.equal(startTask(state, { workspaceId: tiangong.id, kind: 'business', prompt: '查询记录', deviceId: 'rdk-x3', tiangongLinks: links }), null);
  const task = startTask(state, { workspaceId: tiangong.id, kind: 'general', prompt: '列出今天记录', tiangongLinks: links })!;
  assert.equal(task.mcpServiceId, 'mcp-tiangong'); assert.equal(task.deviceId, null);
  assert.equal(state.calls.find(call => call.taskId === task.id)?.kind, 'tiangong-read');
  assert.match(associateTaskDevice(state, task.id, 'rdk-x3'), /只支持关联园区/);
  assert.match(setTaskSystemCapability(state, task.id, 'mcp-baichuan-qingda'), /平台预置/);
  for (const folder of state.workspaces.filter(workspace => workspace.builtinSystemId && workspace.builtinSystemId !== 'tiangong')) {
    assert.match(setTiangongScopeLinks(state, { kind: 'project', workspaceId: folder.id }, links), /只支持关联设备/);
    assert.equal(startTask(state, { workspaceId: folder.id, kind: 'general', prompt: '查询状态' }), null);
    folder.deviceIds = ['rdk-x3'];
    const deviceTask = startTask(state, { workspaceId: folder.id, kind: 'general', prompt: '查询状态', deviceId: 'rdk-x3' })!;
    assert.equal(deviceTask.mcpServiceId, folder.project!.mcpServiceId);
    assert.equal(state.calls.find(call => call.taskId === deviceTask.id)?.deviceId, 'rdk-x3');
    assert.equal(startTask(state, { workspaceId: folder.id, kind: 'business', prompt: '查询状态', deviceId: 'rdk-x3', tiangongLinks: links }), null);
  }
});

test('园区与设备选择窗口按资源类型隔离，园区新增 URL 可填写', () => {
  const state = initialState();
  const parkPicker = renderToStaticMarkup(<TaskDeviceDialog resourceType="park" state={state} update={() => {}} close={() => {}} notify={() => {}} draftSelection={{ deviceId: '', selectDevice: () => {}, links: [], saveLinks: () => {} }} />);
  assert.ok(parkPicker.includes('选择园区') && parkPicker.includes('新增关联'));
  assert.equal(parkPicker.includes('RDK X3'), false);
  const devicePicker = renderToStaticMarkup(<TaskDeviceDialog resourceType="device" state={state} update={() => {}} close={() => {}} notify={() => {}} draftSelection={{ deviceId: '', selectDevice: () => {}, links: [], saveLinks: () => {} }} />);
  assert.ok(devicePicker.includes('选择设备') && devicePicker.includes('RDK X3'));
  assert.equal(devicePicker.includes('天工园区'), false);
  const create = renderToStaticMarkup(<TiangongResourceDialog state={state} update={() => {}} scope={{ kind: 'library' }} close={() => {}} notify={() => {}} />);
  assert.ok(create.includes('aria-label="天工内网连接"')); assert.equal(create.includes('readOnly'), false);
});

test('自建聊天按关联对象自动加载能力，不需要手动选择系统', async () => {
  const { inferResourceSystem } = await import('../src/components/agentBuiltinSystems');
  const { associateTaskDevice } = await import('../src/components/agentDeviceConnections');
  const { continueTask, syncTaskResourceSystem } = await import('../src/components/agentWorkbenchState');
  const state = initialState(); const workspace = createProjectWorkspace(state, '资源自动继承'); workspace.deviceIds = ['rdk-x3']; state.devices[0].connected = true;
  const task = startTask(state, { workspaceId: workspace.id, kind: 'chat', prompt: '你好' })!;
  assert.equal(inferResourceSystem(state, { workspace }), undefined);
  associateTaskDevice(state, task.id, 'rdk-x3');
  assert.equal(task.mcpServiceId, 'mcp-baichuan-qingda');
  assert.equal(inferResourceSystem(state, { workspace, deviceId: 'rdk-x3', prompt: '查询数字造机整机模型' })?.id, 'digital-machine');
  continueTask(state, task.id, '查询数字造机整机模型');
  assert.equal(task.mcpServiceId, 'mcp-digital-machine');
  assert.equal(state.calls.find(call => call.taskId === task.id)?.deviceId, 'rdk-x3');
  associateTaskDevice(state, task.id, null); syncTaskResourceSystem(state, task.id);
  assert.equal(task.mcpServiceId, undefined);
});

test('设备新增通过 URL 和账号密码验证后选择设备，保存关联系统且不保存密码', async () => {
  const { verifyWebDeviceResource, saveWebDeviceResource } = await import('../src/components/agentWebDeviceResources');
  const { inferResourceSystem } = await import('../src/components/agentBuiltinSystems');
  const state = initialState();
  assert.ok((await verifyWebDeviceResource(state, { url: 'http://192.168.1.103', account: 'demo', password: 'wrong' })).error);
  const result = await verifyWebDeviceResource(state, { url: 'http://192.168.1.103', account: 'demo', password: 'demo123', systemId: 'baichuan-zhuangji' });
  const proof = result.verification!;
  assert.equal(proof.devices[0].id, 'rdk-x3');
  assert.equal(saveWebDeviceResource(state, { verificationId: proof.id, deviceId: 'other-device' }).device, undefined);
  const saved = saveWebDeviceResource(state, { verificationId: proof.id, deviceId: proof.devices[0].id }).device!;
  assert.equal(saved.webConnection?.url, 'http://192.168.1.103');
  assert.equal(saved.connected, true);
  assert.equal(inferResourceSystem(state, { deviceId: saved.id })?.id, 'baichuan-zhuangji');
  const reused = (await verifyWebDeviceResource(state, { url: 'http://192.168.1.103', account: 'demo', password: 'demo123' })).verification!;
  assert.equal(reused.systemId, 'baichuan-zhuangji');
  assert.equal(JSON.stringify(state).includes('demo123'), false);
  assert.equal(JSON.stringify(proof).includes('demo123'), false);
});

test('输入区保留待发送资源，草稿不会提前显示为已关联连接', async () => {
  const { default: AgentResourceBinding } = await import('../src/components/AgentResourceBinding');
  const { default: AgentChatConnection } = await import('../src/components/AgentChatConnection');
  const state = initialState(); const update = () => {}; const notify = () => {};
  const empty = renderToStaticMarkup(<AgentResourceBinding type="device" state={state} update={update} notify={notify} />);
  assert.ok(empty.includes('/关联设备'));
  const entry = renderToStaticMarkup(<AgentResourceBinding type="device" deviceId="rdk-x3" state={state} update={update} notify={notify} />);
  assert.equal(entry, '');
  state.homeDraft = { prompt: '', kind: 'general', deviceId: 'rdk-x3', model: state.settings.model, serviceId: '', resource: '', allowWrite: false, skillIds: [] };
  const pending = renderToStaticMarkup(<AgentResourceBinding type="device" deviceId="rdk-x3" draftSelection={{ deviceId: 'rdk-x3', selectDevice: () => {}, links: [], saveLinks: () => {} }} state={state} update={update} notify={notify} />);
  assert.ok(pending.includes('待关联设备 RDK X3') && pending.includes('发送后关联'));
  assert.equal(pending.includes('<svg'), false);
  const header = renderToStaticMarkup(<AgentChatConnection state={state} />);
  assert.equal(header, '');
});

test('设备文件夹的新聊天固定继承设备，不能选择园区或单独改绑', async () => {
  const { selectTaskContext, prepareNewTask } = await import('../src/components/agentWorkbenchState');
  const { projectChatResources, workspaceChatResourceType, canConfigureChatResources } = await import('../src/components/agentChatResources');
  const { associateTaskDevice } = await import('../src/components/agentDeviceConnections');
  const { setTiangongScopeLinks } = await import('../src/components/agentTiangongResources');
  const state = initialState(); const group = selectTaskContext(state, null, 'rdk-x3');
  prepareNewTask(state, group.id);
  assert.equal(workspaceChatResourceType(group), 'device');
  assert.equal(projectChatResources(state, group).deviceId, 'rdk-x3');
  assert.equal(group.composerDraft!.deviceId, 'rdk-x3');
  assert.equal(canConfigureChatResources(state, group), false);
  const task = startTask(state, { workspaceId: group.id, kind: 'chat', prompt: '检查这台设备' })!;
  assert.equal(task.deviceId, 'rdk-x3');
  assert.equal(task.inheritsProjectResources, true);
  assert.match(associateTaskDevice(state, task.id, 'rdk-x5'), /继承/);
  assert.match(setTiangongScopeLinks(state, { kind: 'task', workspaceId: group.id, taskId: task.id }, [{ resourceId: 'a-park', read: true, write: false }]), /只支持关联设备/);
  assert.equal(startTask(state, { workspaceId: group.id, kind: 'business', prompt: '查询园区', tiangongLinks: [{ resourceId: 'a-park', read: true, write: false }] }), null);
  const picker = renderToStaticMarkup(<TaskDeviceDialog state={state} update={() => {}} task={task} resourceType="park" close={() => {}} notify={() => {}} />);
  assert.ok(picker.includes('选择设备') && picker.includes('RDK X3'));
  assert.equal(picker.includes('天工园区'), false);
  assert.equal(picker.includes('新增关联'), false);
});

test('项目绑定的子聊天只显示关联状态，不提供聊天配置或输入区资源名称', async () => {
  const { setProjectDevice } = await import('../src/components/agentWorkbenchState');
  const { canConfigureChatResources } = await import('../src/components/agentChatResources');
  const { default: AgentResourceBinding } = await import('../src/components/AgentResourceBinding');
  const { default: AgentWorkgroups } = await import('../src/components/AgentWorkgroups');
  const state = initialState(); const group = createProjectWorkspace(state, '父项目');
  const independent = startTask(state, { workspaceId: group.id, kind: 'project', prompt: '讨论方案' })!;
  assert.equal(canConfigureChatResources(state, group), true);
  setProjectDevice(state, group.id, 'rdk-x3');
  assert.equal(canConfigureChatResources(state, group), false);
  const label = renderToStaticMarkup(<AgentResourceBinding type="device" state={state} update={() => {}} task={independent} notify={() => {}} />);
  assert.equal(label, '');
  const entry = renderToStaticMarkup(<AgentResourceBinding type="device" deviceId="rdk-x3" draftSelection={{ readOnly: true, deviceId: 'rdk-x3', selectDevice: () => {}, links: [], saveLinks: () => {} }} state={state} update={() => {}} notify={() => {}} />);
  assert.equal(entry, '');
  const sidebar = renderToStaticMarkup(<AgentWorkgroups state={state} update={() => {}} activeWorkspaceId={group.id} activeTaskId={independent.id} openGroup={() => {}} openTask={() => {}} newTask={() => {}} newStandaloneChat={() => {}} createGroup={() => {}} associateResources={() => {}} rename={() => {}} />);
  assert.ok(sidebar.includes('讨论方案') && sidebar.includes('aw-chat-inherited-status'));
  assert.ok(sidebar.includes('已关联设备：RDK X3') && sidebar.includes('192.168.1.103'));
});

test('园区项目的关联状态由项目统一管理，普通聊天仍可自行配置', async () => {
  const { setTiangongScopeLinks } = await import('../src/components/agentTiangongResources');
  const { canConfigureChatResources } = await import('../src/components/agentChatResources');
  const { selectChatTaskContext } = await import('../src/components/agentWorkbenchState');
  const state = initialState(); const group = createProjectWorkspace(state, '园区项目');
  const session = (await verifyTiangongPrototype('http://park-inheritance.local', 'demo', 'demo123')).session!;
  const park = saveTiangongResource(state, { sessionRef: session.id, url: session.url, parkId: session.parks[0].id }).resource!;
  setTiangongScopeLinks(state, { kind: 'project', workspaceId: group.id }, [{ resourceId: park.id, read: true, write: false }]);
  assert.equal(canConfigureChatResources(state, group), false);
  const standalone = selectChatTaskContext(state, null, 'rdk-x3');
  assert.equal(canConfigureChatResources(state, standalone), true);
  assert.equal(standalone.boundDeviceId, undefined);
});

test('右上角显示当前聊天设备与地址，项目继承连接只读，未关联时不显示连接', async () => {
  const { default: AgentChatConnection } = await import('../src/components/AgentChatConnection');
  const { setProjectDevice, selectChatTaskContext } = await import('../src/components/agentWorkbenchState');
  const { currentChatConnection } = await import('../src/components/agentChatResources');
  const { associateTaskDevice } = await import('../src/components/agentDeviceConnections');
  const state = initialState(); const group = createProjectWorkspace(state, '连接展示项目');
  const task = startTask(state, { workspaceId: group.id, kind: 'project', prompt: '你好' })!;
  assert.equal(currentChatConnection(state, group, task), undefined);
  assert.equal(renderToStaticMarkup(<AgentChatConnection state={state} workspace={group} task={task} manage={() => {}} />), '');
  setProjectDevice(state, group.id, 'rdk-x3');
  const readonly = renderToStaticMarkup(<AgentChatConnection state={state} workspace={group} task={task} manage={() => {}} />);
  assert.ok(readonly.includes('RDK X3') && readonly.includes('192.168.1.103'));
  assert.ok(readonly.startsWith('<span') && !readonly.includes('<button'));
  const standalone = selectChatTaskContext(state, null, '');
  const first = startTask(state, { workspaceId: standalone.id, kind: 'chat', prompt: '讨论设备方案' })!;
  const second = startTask(state, { workspaceId: standalone.id, kind: 'chat', prompt: '独立对话' })!;
  associateTaskDevice(state, first.id, 'rdk-x5');
  assert.equal(currentChatConnection(state, standalone, first)!.id, 'rdk-x5');
  assert.equal(currentChatConnection(state, standalone, second), undefined);
  const editable = renderToStaticMarkup(<AgentChatConnection state={state} workspace={standalone} task={first} manage={() => {}} />);
  assert.ok(editable.startsWith('<button') && editable.includes('192.168.1.105'));
});

test('右上角显示已发送聊天的园区及内网连接，未发送草稿保持待关联', async () => {
  const { default: AgentChatConnection } = await import('../src/components/AgentChatConnection');
  const { currentChatConnection } = await import('../src/components/agentChatResources');
  const state = initialState(); const group = createProjectWorkspace(state, '园区连接展示');
  const session = (await verifyTiangongPrototype('http://192.168.10.50:8080', 'demo', 'demo123')).session!;
  const park = saveTiangongResource(state, { sessionRef: session.id, url: session.url, parkId: session.parks[0].id }).resource!;
  const task = startTask(state, { workspaceId: group.id, kind: 'project', prompt: '查询园区', tiangongLinks: [{ resourceId: park.id, read: true, write: false }] })!;
  const html = renderToStaticMarkup(<AgentChatConnection state={state} workspace={group} task={task} manage={() => {}} />);
  assert.ok(html.includes(park.parkName) && html.includes('192.168.10.50:8080') && html.includes(park.url));
  state.homeDraft = { prompt: '', kind: 'general', project: null, deviceId: 'rdk-x3', model: state.settings.model, serviceId: '', resource: '', allowWrite: false, skillIds: [] };
  assert.equal(currentChatConnection(state), undefined);
});

test('/名称支持设备名、园区名、IP 和带空格的名称，并按聊天类型过滤', async () => {
  const { findResourceMentions, resourceSlashRange } = await import('../src/components/agentResourceMentions');
  const state = initialState();
  const session = (await verifyTiangongPrototype('http://192.168.10.60', 'demo', 'demo123')).session!;
  const park = saveTiangongResource(state, { sessionRef: session.id, url: session.url, parkId: session.parks[0].id }).resource!;
  assert.ok(findResourceMentions(state, 'rDk', ['device']).some(item => item.id === 'rdk-x3'));
  assert.ok(findResourceMentions(state, 'ｒｄｋ', ['device']).some(item => item.id === 'rdk-x3'));
  assert.equal(resourceSlashRange('／ｒｄｋ')!.query, 'rdk');
  assert.ok(findResourceMentions(state, '\u200Brdk', ['device']).some(item => item.id === 'rdk-x3'));
  assert.deepEqual(findResourceMentions(state, 'RDK X3', ['device']).map(item => item.id), ['rdk-x3']);
  assert.deepEqual(findResourceMentions(state, '192.168.1.103', ['device']).map(item => item.id), ['rdk-x3']);
  assert.deepEqual(findResourceMentions(state, park.parkName, ['park']).map(item => item.id), [park.id]);
  assert.equal(findResourceMentions(state, park.parkName, ['device']).length, 0);
  assert.equal(findResourceMentions(state, 'RDK', ['park']).length, 0);
  state.tiangongResources!.push({ ...park, id: 'never-verified', parkName: '未验证园区', verifiedAt: undefined, sessionRef: undefined });
  assert.equal(findResourceMentions(state, '未验证', ['park']).length, 0);
  const value = '请查询 /RDK X3';
  const range = resourceSlashRange(value)!;
  assert.equal(range.query, 'rdk x3');
  assert.equal(value.slice(0, range.start) + value.slice(range.end), '请查询 ');
  assert.equal(resourceSlashRange('http://192.168.1.103'), undefined);
});

test('选择资源只生成待发送草稿，发送时才更改当前聊天，其他聊天及工具执行保持不变', async () => {
  const { resourceMentionDraft, commitPendingChatResource } = await import('../src/components/agentResourceMentions');
  const { currentChatConnection } = await import('../src/components/agentChatResources');
  const state = initialState(); const group = createProjectWorkspace(state, '待发送资源项目');
  const first = startTask(state, { workspaceId: group.id, kind: 'chat', prompt: '你好' })!;
  const second = startTask(state, { workspaceId: group.id, kind: 'chat', prompt: '独立讨论' })!;
  const before = JSON.stringify(state);
  const pending = resourceMentionDraft(state, 'device', 'rdk-x3')!;
  assert.equal(JSON.stringify(state), before);
  first.resourceDraft = pending;
  assert.equal(first.deviceId, null);
  assert.equal(currentChatConnection(state, group, first), undefined);
  assert.equal(state.calls.length, 0);
  const restored = JSON.parse(JSON.stringify(state));
  assert.equal(restored.tasks.find((item: { id: string }) => item.id === first.id).resourceDraft.deviceId, 'rdk-x3');
  assert.equal(commitPendingChatResource(state, first.id, pending), '');
  assert.equal(first.deviceId, 'rdk-x3');
  assert.equal(currentChatConnection(state, group, first)!.id, 'rdk-x3');
  assert.equal(second.deviceId, null);
  assert.equal(state.calls.length, 0);
  assert.equal(first.messages.filter(item => item.role === 'user').length, 1);
});

test('已保存园区会话过期时，/名称需先验证，不能直接关联或发送', async () => {
  const { findResourceMentions, resourceMentionDraft, commitPendingChatResource } = await import('../src/components/agentResourceMentions');
  const { disconnectTiangongResource } = await import('../src/components/agentTiangongResources');
  const state = initialState(); const group = createProjectWorkspace(state, '园区草稿');
  const session = (await verifyTiangongPrototype('http://park-pending.local', 'demo', 'demo123')).session!;
  const park = saveTiangongResource(state, { sessionRef: session.id, url: session.url, parkId: session.parks[0].id }).resource!;
  const task = startTask(state, { workspaceId: group.id, kind: 'chat', prompt: '你好' })!;
  const pending = resourceMentionDraft(state, 'park', park.id)!;
  assert.ok(pending && !task.tiangongLinks!.length);
  const { default: AgentResourceBinding } = await import('../src/components/AgentResourceBinding');
  const pendingLabel = renderToStaticMarkup(<AgentResourceBinding type="park" state={state} update={() => {}} links={pending.tiangongLinks} draftSelection={{ deviceId: '', selectDevice: () => {}, links: pending.tiangongLinks, saveLinks: () => {} }} notify={() => {}} />);
  assert.ok(pendingLabel.includes(park.parkName) && pendingLabel.includes('待关联园区'));
  disconnectTiangongResource(state, park.id);
  assert.equal(findResourceMentions(state, park.parkName, ['park'])[0].needsAuthentication, true);
  assert.equal(resourceMentionDraft(state, 'park', park.id), undefined);
  const before = JSON.stringify(state);
  assert.match(commitPendingChatResource(state, task.id, pending), /验证园区账号/);
  assert.equal(JSON.stringify(state), before);
  const html = renderToStaticMarkup(<TaskDeviceDialog state={state} update={() => {}} resourceType="park" initialParkResourceId={park.id} draftSelection={{ deviceId: '', selectDevice: () => {}, links: [], saveLinks: () => {} }} close={() => {}} notify={() => {}} />);
  assert.ok(html.includes('天工密码') && html.includes(park.parkName));
  assert.equal(html.includes('尚未获取园区'), false);
});
