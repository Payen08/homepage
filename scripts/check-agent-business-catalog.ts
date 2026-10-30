import assert from 'node:assert/strict';
import test from 'node:test';
import { businessApiOperations } from '../src/components/agentBusinessApiCatalog';
import { businessCapabilities, capabilityOperations, catalogReadOnly } from '../src/components/agentBusinessCatalog';
import { QINGDA_MCP_ID, DIGITAL_MCP_ID, ZHUANGJI_MCP_ID, projectMcpService, taskDeviceRequirementReason } from '../src/components/agentBuiltinMcpServices';
import { associateTaskDevice } from '../src/components/agentDeviceConnections';
import { callBlockReason, continueTask, createProjectWorkspace, initialState, normalizeWorkbenchState, runQueuedTaskStep, selectTaskContext, startTask, type ToolCall } from '../src/components/agentWorkbenchState';

test('两项 MCP 的能力来自接口清单，行为树与装配模型对应各自服务', () => {
  assert.equal(businessApiOperations.length, 551);
  assert.equal(new Set(businessApiOperations.map(operation => operation.operationId)).size, 551);
  const behavior = businessCapabilities['baichuan-qingda'].find(item => item.id === 'behavior')!;
  const assembly = businessCapabilities['digital-machine'].find(item => item.id === 'assembly')!;
  assert.ok(capabilityOperations(behavior).some(operation => operation.path === '/mapi/v1/device/btx/trees'));
  assert.ok(capabilityOperations(assembly).some(operation => operation.path === '/mapi/v1/device/scene/assembly'));
  assert.ok(capabilityOperations(assembly).some(operation => operation.path === '/mapi/v1/device/scene/urdf'));
  assert.ok(behavior.knowledge.includes('baichuan-btx-json-editor'));
  assert.equal(catalogReadOnly({ method: 'POST', path: '/mapi/v1/device/btx/runtime:launch' }), false);
  assert.equal(catalogReadOnly({ method: 'POST', path: '/mapi/v1/sched/tasks/history:query' }), true);
});

test('三项设备系统能力均要求关联设备，独立聊天不强制设备', () => {
  const state = initialState();
  const group = createProjectWorkspace(state, '百川轻搭');
  assert.equal(projectMcpService(state, group.name)?.id, QINGDA_MCP_ID);
  assert.equal(startTask(state, { workspaceId: group.id, kind: 'project', prompt: '你好' }), null);
  assert.equal(state.tasks.length, 0);
  group.project!.name = '轻搭设备调试';
  assert.equal(projectMcpService(state, group.project)?.id, QINGDA_MCP_ID);
  assert.equal(startTask(state, { workspaceId: group.id, kind: 'project', prompt: '你好' }), null);
  const chat = selectTaskContext(state, null, '');
  assert.ok(taskDeviceRequirementReason(state, { workspaceId: chat.id, serviceId: QINGDA_MCP_ID }));
  assert.equal(startTask(state, { workspaceId: chat.id, kind: 'business', prompt: '检查行为树', serviceId: QINGDA_MCP_ID }), null);
  const digital = createProjectWorkspace(state, '数字造机');
  const resource = state.services.find(service => service.id === DIGITAL_MCP_ID)!.resources[0];
  assert.equal(startTask(state, { workspaceId: digital.id, kind: 'business', prompt: '查询模型', serviceId: DIGITAL_MCP_ID, resource }), null);
  digital.deviceIds = ['rdk-x3'];
  assert.ok(startTask(state, { workspaceId: digital.id, kind: 'business', prompt: '查询模型', deviceId: 'rdk-x3', serviceId: DIGITAL_MCP_ID, resource }));
  assert.match(taskDeviceRequirementReason(state, { workspaceId: chat.id, serviceId: ZHUANGJI_MCP_ID }), /百川装机/);
  assert.equal(startTask(state, { workspaceId: chat.id, kind: 'business', prompt: '查询装机配置', serviceId: ZHUANGJI_MCP_ID }), null);
  assert.ok(startTask(state, { workspaceId: chat.id, kind: 'chat', prompt: '你好' }));
});

test('百川装机沿用任务设备 IP，离线或目标不一致时阻止调用，恢复旧数据不重复添加', () => {
  const state = initialState(); const group = createProjectWorkspace(state, '百川装机');
  const service = projectMcpService(state, group.project)!;
  assert.equal(service.id, ZHUANGJI_MCP_ID); assert.equal(service.requiresDevice, true);
  group.deviceIds = ['rdk-x3', 'rdk-x5'];
  const task = startTask(state, { workspaceId: group.id, kind: 'business', prompt: '查询装机配置', deviceId: 'rdk-x3', serviceId: service.id, resource: service.resources[0] })!;
  const call = state.calls.find(call => call.taskId === task.id)!;
  const parameters = JSON.parse(call.parameters);
  assert.equal(call.deviceId, 'rdk-x3'); assert.equal(parameters.deviceAddress, state.devices[0].address);
  assert.ok(parameters.apiCatalog.length > 0);
  assert.match(callBlockReason(state, call), /未连接/);
  state.devices[0].connected = true;
  assert.equal(callBlockReason(state, call), '');
  call.deviceId = 'rdk-x5'; assert.match(callBlockReason(state, call), /关联设备不一致/); call.deviceId = 'rdk-x3';
  runQueuedTaskStep(state, task.id); assert.equal(call.status, 'done');
  service.capabilities![0].enabled = false;
  normalizeWorkbenchState(state); normalizeWorkbenchState(state);
  assert.equal(state.services.filter(item => item.id === ZHUANGJI_MCP_ID).length, 1);
  assert.equal(service.capabilities![0].enabled, false);
});

test('百川轻搭 MCP 任务保留实际设备、接口映射与授权，换设备取消旧调用', () => {
  const state = initialState();
  const group = createProjectWorkspace(state, '百川轻搭');
  group.deviceIds = ['rdk-x3', 'rdk-x5'];
  const service = state.services.find(service => service.id === QINGDA_MCP_ID)!;
  service.connected = true;
  state.devices[0].connected = true; state.devices[1].connected = true;
  const task = startTask(state, { workspaceId: group.id, kind: 'business', prompt: '修改行为树', deviceId: 'rdk-x3', serviceId: service.id, resource: service.resources[0], allowWrite: true })!;
  assert.equal(task.deviceId, 'rdk-x3');
  const call = state.calls.find(call => call.taskId === task.id)!;
  assert.equal(call.deviceId, task.deviceId);
  assert.equal(JSON.parse(call.parameters).deviceAddress, '192.168.1.103');
  assert.ok(JSON.parse(call.parameters).apiCatalog.some((item: { path: string }) => item.path === '/mapi/v1/device/btx/trees'));
  service.capabilities![0].enabled = false;
  assert.match(callBlockReason(state, call), /能力已停用/);
  service.capabilities![0].enabled = true;
  runQueuedTaskStep(state, task.id);
  assert.equal(call.executions, 1);
  assert.match(call.output, /未请求设备接口/);
  assert.equal(associateTaskDevice(state, task.id, null), '');
  assert.equal(associateTaskDevice(state, task.id, 'rdk-x5'), '');
  assert.equal(state.calls.find(call => call.kind === 'mcp-write')!.status, 'denied');
  assert.equal(call.executions, 1);
  task.status = 'review'; continueTask(state, task.id, '查询行为树');
  assert.equal(state.calls.at(-1)!.deviceId, 'rdk-x5');
});

test('远程桌面不能借用工作空间设备或其他任务设备，离线时不能操作', () => {
  const state = initialState();
  const group = createProjectWorkspace(state, '普通项目');
  group.deviceIds = ['rdk-x3', 'rdk-x5']; group.panel.desktopDeviceId = 'rdk-x3';
  state.devices[0].connected = true;
  const task = startTask(state, { workspaceId: group.id, kind: 'project', prompt: '你好' })!;
  const call: ToolCall = { id: 'desktop-check', actor: 'user', taskId: task.id, workspaceId: group.id, kind: 'desktop', deviceId: 'rdk-x3', label: '', target: '', status: 'queued', executions: 0, approved: true, parameters: '{}', output: '', createdAt: '' };
  assert.match(callBlockReason(state, call), /绑定设备/);
  associateTaskDevice(state, task.id, 'rdk-x5');
  assert.match(callBlockReason(state, call), /绑定设备/);
  call.deviceId = 'rdk-x5';
  assert.match(callBlockReason(state, call), /未连接/);
  state.devices[1].connected = true;
  assert.equal(callBlockReason(state, call), '');
});

test('旧内置 MCP 升级能力目录时保留地址、工具和能力启停', () => {
  const state = initialState();
  const service = state.services.find(service => service.id === QINGDA_MCP_ID)!;
  service.resources = ['百川轻搭业务资源']; service.endpoint = 'https://configured.invalid/mcp';
  service.capabilities![0].enabled = false; service.tools[1].enabled = false;
  normalizeWorkbenchState(state); normalizeWorkbenchState(state);
  assert.equal(service.resources[0], '行为树编排与运行');
  assert.equal(service.endpoint, 'https://configured.invalid/mcp');
  assert.equal(service.capabilities![0].enabled, false);
  assert.equal(service.tools[1].enabled, false);
  assert.equal(state.services.filter(item => item.id === QINGDA_MCP_ID).length, 1);
});
