import assert from 'node:assert/strict';
import { test } from 'node:test';
import { associateTaskDevice, emptySshDraft, saveSshDevice, testSshConnection, validateSshDraft } from '../src/components/agentDeviceConnections';
import { continueTask, createProjectWorkspace, ensureTaskTerminal, initialState, isStandaloneChatSpace, normalizeWorkbenchState, prepareNewTask, restoreDeviceConnections, selectTaskContext, startTask, terminalBlockReason, type FileChange, type ToolCall } from '../src/components/agentWorkbenchState';
import { resourceConnections, setResourceConnected } from '../src/components/agentResourceConnections';

test('SSH 表单验证地址、端口和凭据，失败测试不能保存', async () => {
  const state = initialState();
  const draft = { ...emptySshDraft(), host: '999.1.1.1', username: 'robot', password: 'demo-only-password' };
  assert.ok(validateSshDraft(draft));
  draft.host = 'board.invalid';
  draft.port = '70000';
  assert.ok(validateSshDraft(draft));
  draft.port = '22';
  const verification = await testSshConnection(draft);
  assert.equal(verification.success, false);
  assert.ok(saveSshDevice(state, draft, verification).error);
  assert.equal(state.devices.length, 3);
});

test('成功演示验证后保存 SSH 信息，密码不持久化，修改字段须重新验证', async () => {
  const state = initialState();
  const draft = { ...emptySshDraft(), host: '192.168.1.210', username: 'robot', password: 'demo-only-password' };
  const verification = await testSshConnection(draft);
  assert.equal(verification.success, true);
  assert.equal(verification.mode, 'simulation');
  assert.ok(saveSshDevice(state, { ...draft, port: '2222' }, verification).error);
  assert.ok(saveSshDevice(state, { ...draft, password: 'changed-password' }, verification).error);
  const result = saveSshDevice(state, draft, verification);
  assert.equal(result.device?.connection?.method, 'SSH');
  assert.equal(result.device?.connection?.port, 22);
  assert.equal(result.device?.connection?.username, 'robot');
  assert.equal(result.device?.connection?.mode, 'simulation');
  assert.equal(JSON.stringify(state).includes('demo-only-password'), false);
  assert.equal(saveSshDevice(state, draft, verification).device?.id, result.device?.id);
});

test('任务最多关联一台设备，更换与解除不改变项目、不影响其他任务或项目差异', () => {
  const state = initialState();
  const group = createProjectWorkspace(state, '项目');
  state.devices[0].connected = state.devices[1].connected = true;
  const task = startTask(state, { workspaceId: group.id, prompt: '你好', kind: 'project' })!;
  const other = startTask(state, { workspaceId: group.id, prompt: '另一个聊天', kind: 'project' })!;
  associateTaskDevice(state, other.id, 'rdk-x3');
  const projectId = group.project!.id;
  const projectChange: FileChange = { id: 'project-change', workspaceId: group.id, taskId: task.id, fileId: 'project-file', deviceId: null, path: 'src/App.tsx', baseVersion: 1, before: '', after: 'new', status: 'pending' };
  state.changes.push(projectChange);
  assert.equal(associateTaskDevice(state, task.id, 'rdk-x3'), '');
  assert.equal(projectChange.status, 'pending');
  const terminal = ensureTaskTerminal(state, group.id, task.id)!;
  const originalTerminal = JSON.stringify(terminal);
  const call: ToolCall = { id: 'old-call', workspaceId: group.id, taskId: task.id, actor: 'agent', kind: 'device-write', deviceId: 'rdk-x3', target: 'RDK X3', label: '更新参数', parameters: '{}', output: '', createdAt: '', approved: false, status: 'pending', executions: 0 };
  state.calls.push(call);
  assert.equal(associateTaskDevice(state, task.id, 'rdk-x5'), '');
  assert.equal(task.deviceId, 'rdk-x5');
  assert.equal(other.deviceId, 'rdk-x3');
  assert.equal(call.status, 'denied');
  assert.equal(call.executions, 0);
  assert.equal(projectChange.status, 'pending');
  assert.equal(JSON.stringify(terminal), originalTerminal);
  assert.ok(terminalBlockReason(state, terminal, task));
  assert.equal(ensureTaskTerminal(state, group.id, task.id)?.deviceId, 'rdk-x5');
  assert.equal(associateTaskDevice(state, task.id, null), '');
  assert.equal(task.deviceId, null);
  assert.equal(group.project?.id, projectId);
  assert.equal(task.deviceHistory?.length, 3);
  assert.equal(other.deviceId, 'rdk-x3');
});

test('解除设备任务后不会继续操作旧设备，重新关联后使用新设备', () => {
  const state = initialState();
  const group = createProjectWorkspace(state, '项目');
  state.devices[0].connected = state.devices[1].connected = true;
  group.deviceIds.push('rdk-x3');
  const task = startTask(state, { workspaceId: group.id, kind: 'device', deviceId: 'rdk-x3', prompt: '读取设备状态' })!;
  associateTaskDevice(state, task.id, null);
  const oldCalls = state.calls.length;
  continueTask(state, task.id, '读取设备状态');
  assert.equal(state.calls.length, oldCalls);
  assert.equal(task.status, 'stopped');
  associateTaskDevice(state, task.id, 'rdk-x5');
  continueTask(state, task.id, '读取设备状态');
  assert.equal(state.calls[state.calls.length - 1].deviceId, 'rdk-x5');
});

test('已有离线设备可直接关联，关联状态不伪造在线状态，独立聊天不变成项目组', () => {
  const state = initialState();
  const chat = selectTaskContext(state, null, '');
  const task = startTask(state, { workspaceId: chat.id, kind: 'chat', prompt: '你好' })!;
  assert.equal(associateTaskDevice(state, task.id, 'rdk-x3'), '');
  assert.equal(task.deviceId, 'rdk-x3'); assert.equal(state.devices[0].connected, false);
  normalizeWorkbenchState(state);
  assert.equal(isStandaloneChatSpace(chat), true); assert.equal(chat.project, null);
  const project = createProjectWorkspace(state, '项目');
  prepareNewTask(state);
  assert.equal(state.activeWorkspaceId, null); assert.equal(state.homeDraft, undefined); assert.ok(project.project);
});

test('启动自动连接恢复上次设备，显式断联的设备不重新连接', async () => {
  const state = initialState();
  const draft = { ...emptySshDraft(), host: '192.168.1.201', username: 'robot', password: 'demo-only' };
  const device = saveSshDevice(state, draft, await testSshConnection(draft)).device!;
  restoreDeviceConnections(state); assert.equal(device.connected, false); assert.equal(device.lastConnected, true);
  state.settings.autoConnect = true; restoreDeviceConnections(state); assert.equal(device.connected, true);
  device.connected = false; device.lastConnected = false; restoreDeviceConnections(state); assert.equal(device.connected, false);
  assert.equal(state.devices[0].connected, false);
});

test('编辑已有连接更新原设备，不新增重复记录；旧终端不能静默切到新地址', async () => {
  const state = initialState();
  const draft = { ...emptySshDraft(), host: '192.168.1.201', username: 'robot', password: 'demo-only' };
  const device = saveSshDevice(state, draft, await testSshConnection(draft)).device!;
  const group = selectTaskContext(state, null, device.id);
  const task = startTask(state, { workspaceId: group.id, kind: 'device', deviceId: device.id, prompt: '读取日志' })!;
  const session = ensureTaskTerminal(state, group.id, task.id)!;
  const updated = { ...draft, host: '192.168.1.202' };
  const saved = saveSshDevice(state, updated, await testSshConnection(updated), device.id).device!;
  assert.equal(saved.id, device.id); assert.equal(state.devices.length, 4); assert.equal(saved.address, updated.host);
  assert.match(terminalBlockReason(state, session, task), /连接配置已变化/);
  assert.notEqual(ensureTaskTerminal(state, group.id, task.id)?.id, session.id);
  assert.equal(state.calls.find(call => call.taskId === task.id)!.status, 'denied');
});

test('连接列表仅展示已添加或已绑定设备，未关联的示例候选不混入', () => {
  const state = initialState();
  assert.equal(resourceConnections(state).length, 0);
  const device = state.devices[0];
  device.webConnection = { url: `http://${device.address}`, account: 'demo', verifiedAt: 'verified', mode: 'simulation' };
  assert.deepEqual(resourceConnections(state).map(row => row.id), [device.id]);
  const workspace = createProjectWorkspace(state, '关联设备项目');
  workspace.boundDeviceId = state.devices[1].id;
  const rows = resourceConnections(state);
  assert.equal(rows.length, 2);
  assert.equal(rows.find(row => row.id === state.devices[1].id)?.projectCount, 1);
});

test('设备直接连接与断联保留绑定和终端，不重放旧操作或继续旧模型请求', () => {
  const state = initialState(); const device = state.devices[0];
  device.webConnection = { url: `http://${device.address}`, account: 'demo', verifiedAt: 'verified', mode: 'simulation' };
  assert.equal(setResourceConnected(state, 'device', device.id, true), '');
  const workspace = createProjectWorkspace(state, '连接操作');
  workspace.deviceIds.push(device.id);
  const task = startTask(state, { workspaceId: workspace.id, kind: 'device', deviceId: device.id, prompt: '读取设备状态' })!;
  const terminal = ensureTaskTerminal(state, workspace.id, task.id)!;
  const terminalBefore = JSON.stringify(terminal);
  const call = state.calls.find(call => call.taskId === task.id)!;
  call.approved = true;
  assert.equal(setResourceConnected(state, 'device', device.id, false), '');
  assert.equal(device.connected, false); assert.equal(device.lastConnected, false);
  assert.equal(task.deviceId, device.id); assert.equal(task.status, 'stopped');
  assert.equal(call.status, 'blocked'); assert.equal(call.approved, false); assert.equal(call.executions, 0);
  assert.equal(setResourceConnected(state, 'device', device.id, true), '');
  assert.equal(device.connected, true); assert.equal(task.status, 'stopped');
  assert.equal(call.status, 'blocked'); assert.equal(call.executions, 0);
  assert.equal(JSON.stringify(terminal), terminalBefore);
  assert.match(setResourceConnected(state, 'device', state.devices[1].id, true), /缺少已保存的连接资料/);
  assert.equal(state.devices[1].connected, false);
});
