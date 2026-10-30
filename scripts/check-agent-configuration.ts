import test from 'node:test';
import assert from 'node:assert/strict';
import { activeModelConfig, modelPreset, validateModelConfig, testModelService, requestModel, rememberModelCredential, modelCredential, clearModelCredentials, classifyModelError } from '../src/components/agentModelService';
import { extensionConfigured, extensionEnabled, setExtensionEnabled, extensionCallBlockReason } from '../src/components/agentExtensions';
import { initialState, createProjectWorkspace, startTask, continueTask, finishModelRequest, failModelRequest, retryTask, callBlockReason, normalizeWorkbenchState, type ToolCall } from '../src/components/agentWorkbenchState';

const json = (payload: unknown, status = 200) => new Response(JSON.stringify(payload), { status, headers: { 'Content-Type': 'application/json' } });
test('API 测试发送真实协议请求，补全路径且不向 Ollama 发送空鉴权', async () => {
  const config = modelPreset('ollama');
  let request: { url?: string; init?: RequestInit } = {};
  const fetcher: typeof fetch = async (url, init) => { request = { url: String(url), init }; return json({ choices: [{ message: { content: 'OK' } }] }); };
  const result = await testModelService(config, '', { fetcher });
  assert.equal(result.ok, true);
  assert.equal(request.url, 'http://localhost:11434/v1/chat/completions');
  assert.equal((request.init?.headers as Record<string, string>).Authorization, undefined);
  assert.equal(request.init?.credentials, 'omit');
  const body = JSON.parse(String(request.init?.body));
  assert.equal(body.model, config.modelId); assert.equal(body.max_tokens, 64); assert.equal(body.stream, false);
  assert.equal(body.messages.length, 1);
  await requestModel({ ...config, baseUrl: 'http://localhost:11434/v1/chat/completions' }, '', [{ role: 'user', content: '你好' }], { fetcher });
  assert.equal(request.url, 'http://localhost:11434/v1/chat/completions');
});

test('测试区分认证、模型、额度、协议、网络、超时；错误反馈不回显密钥', async () => {
  const config = modelPreset('glm');
  for (const [status, payload, kind] of [[401, { error: { message: 'secret-value', code: 'invalid_api_key' } }, 'auth'], [404, { error: { code: 'model_not_found' } }, 'model'], [429, {}, 'quota'], [402, {}, 'quota'], [400, {}, 'protocol'], [503, {}, 'service']] as const) {
    const result = await testModelService(config, 'secret-value', { fetcher: async () => json(payload, status) });
    assert.equal(result.kind, kind); assert.equal(result.ok, false); assert.ok(!result.message.includes('secret-value'));
  }
  assert.equal((await testModelService(config, 'key', { fetcher: async () => json({ invalid: 'format' }) })).kind, 'protocol');
  assert.equal((await testModelService(config, 'key', { fetcher: async () => new Response('<html />') })).kind, 'protocol');
  assert.equal((await testModelService(config, 'key', { fetcher: async () => { throw new TypeError('fetch failed'); } })).kind, 'network');
  assert.equal((await testModelService(config, 'key', { timeoutMs: 5, fetcher: async (_url, init) => new Promise<Response>((_resolve, reject) => init!.signal!.addEventListener('abort', () => reject(new Error('aborted')))) })).kind, 'timeout');
  assert.equal(classifyModelError(403, { message: 'Insufficient balance' }).kind, 'quota');
});

test('模型配置验证必填项及参数，密钥按服务隔离且不进入持久化状态', () => {
  const config = modelPreset('glm');
  assert.match(validateModelConfig(config, ''), /API Key/);
  assert.match(validateModelConfig({ ...config, maxTokens: 0 }, 'key'), /Tokens/);
  assert.match(validateModelConfig({ ...config, baseUrl: 'https://key@host/v1' }, 'key'), /Base URL/);
  assert.match(validateModelConfig({ ...config, temperature: NaN }, 'key'), /Temperature/);
  assert.equal(validateModelConfig(modelPreset('ollama'), ''), '');
  rememberModelCredential(config, 'local-test-secret');
  assert.equal(modelCredential(config), 'local-test-secret');
  assert.equal(modelCredential(modelPreset('deepseek')), '');
  assert.equal(modelCredential({ ...config, baseUrl: 'https://other.invalid/v1' }), '');
  const state = initialState(); state.modelService = config;
  assert.ok(!JSON.stringify(state).includes('local-test-secret'));
  clearModelCredentials(); assert.equal(modelCredential(config), '');
});

test('系统配置用于后续推理，运行请求保留原配置，停止或重复回包不产生重复操作', () => {
  const state = initialState(); const group = createProjectWorkspace(state, '模型项目'); state.modelService = modelPreset('ollama');
  const task = startTask(state, { workspaceId: group.id, kind: 'project', prompt: '你好' })!;
  assert.equal(task.status, 'running'); assert.equal(state.calls.length, 0);
  const first = task.modelRequest!; assert.equal(first.config.provider, 'ollama');
  state.modelService = modelPreset('glm');
  finishModelRequest(state, task.id, first.id, '本地模型的回答');
  finishModelRequest(state, task.id, first.id, '重复回答');
  assert.equal(task.messages.filter(item => item.role === 'assistant').length, 1); assert.equal(task.status, 'completed');
  continueTask(state, task.id, '你好'); assert.equal(task.modelRequest!.config.provider, 'glm');
  const second = task.modelRequest!; failModelRequest(state, task.id, second.id, '认证失败'); assert.equal(task.status, 'failed'); assert.equal(state.calls.length, 0);
  retryTask(state, task.id); assert.notEqual(task.modelRequest!.id, second.id);
  task.status = 'stopped'; finishModelRequest(state, task.id, task.modelRequest!.id, '已过期回答');
  assert.ok(!task.messages.some(item => item.text === '已过期回答'));
});

test('免费预设和服务商表单独立，选择预设不改变服务商配置，保存服务商后可独立生效', () => {
  const state = initialState(); state.modelService = modelPreset('glm');
  const provider = JSON.stringify(state.modelService);
  state.modelPresetConfig = modelPreset('ollama'); state.modelSource = 'preset';
  assert.equal(JSON.stringify(state.modelService), provider);
  assert.equal(activeModelConfig(state)?.provider, 'ollama');
  state.modelSource = 'provider';
  assert.equal(activeModelConfig(state)?.provider, 'glm');
  assert.equal(state.modelPresetConfig.provider, 'ollama');
});

test('更换设备时模型运行结果不能沿用原设备执行工具', () => {
  const state = initialState(); const group = createProjectWorkspace(state, '设备模型'); group.deviceIds = ['rdk-x3', 'rdk-x5']; state.modelService = modelPreset('ollama');
  const task = startTask(state, { workspaceId: group.id, kind: 'device', deviceId: 'rdk-x3', prompt: '读取设备日志' })!;
  task.deviceId = 'rdk-x5'; finishModelRequest(state, task.id, task.modelRequest!.id, '准备分析日志');
  assert.equal(task.status, 'stopped'); assert.equal(state.calls.length, 0);
});

test('扩展全局与设备配置独立，插件控制子能力，恢复默认后保留子能力选择', () => {
  const state = initialState();
  setExtensionEnabled(state, 'plugin', 'robot-development', false, 'rdk-x3');
  assert.equal(extensionConfigured(state, 'mcp', 'device-files', 'rdk-x3'), true);
  assert.equal(extensionEnabled(state, 'mcp', 'device-files', 'rdk-x3'), false);
  assert.equal(extensionEnabled(state, 'skill', 'startup-logs', 'rdk-x3'), false);
  assert.equal(extensionEnabled(state, 'mcp', 'device-files', 'rdk-x5'), true);
  setExtensionEnabled(state, 'mcp', 'device-files', false, 'rdk-x3');
  setExtensionEnabled(state, 'plugin', 'robot-development', true, 'rdk-x3');
  assert.equal(extensionEnabled(state, 'mcp', 'device-files', 'rdk-x3'), false);
  const restored = JSON.parse(JSON.stringify(state)); normalizeWorkbenchState(restored);
  assert.equal(extensionEnabled(restored, 'mcp', 'device-files', 'rdk-x3'), false);
  assert.equal(extensionEnabled(restored, 'mcp', 'device-files', 'rdk-x5'), true);
});

test('停用能力限制后续设备及 MCP 调用，保留历史执行次数与任务授权', () => {
  const state = initialState(); const group = createProjectWorkspace(state, '扩展项目'); group.deviceIds = ['rdk-x3']; group.mcpIds = ['mcp-orders'];
  state.devices[0].connected = true;
  const task = startTask(state, { workspaceId: group.id, kind: 'device', deviceId: 'rdk-x3', prompt: '读取设备日志' })!;
  const call = state.calls.find(call => call.taskId === task.id)!;
  assert.equal(callBlockReason(state, call), '');
  setExtensionEnabled(state, 'mcp', 'device-files', false, 'rdk-x3');
  assert.match(callBlockReason(state, call), /扩展已停用/); assert.equal(call.executions, 0);
  const mcpCall = { ...call, kind: 'mcp-read', deviceId: undefined, serviceId: 'mcp-orders' } as ToolCall;
  setExtensionEnabled(state, 'mcp', 'mcp-orders', false, 'rdk-x3');
  assert.match(extensionCallBlockReason(state, mcpCall), /MCP 服务/);
  const saved = { ...call, status: 'done', executions: 1 } as ToolCall; state.calls.push(saved);
  setExtensionEnabled(state, 'plugin', 'robot-development', false);
  assert.equal(saved.executions, 1); assert.equal(saved.status, 'done'); assert.equal(group.mcpIds[0], 'mcp-orders');
});
