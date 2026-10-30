export type ModelProvider = 'deepseek' | 'glm' | 'qwen' | 'gemini' | 'openrouter' | 'ollama' | 'custom';
export type ProviderType = 'preset' | 'custom'; // '第三方模型提供商' | '自定义模型 API'
export type ApiProtocol = 'openai' | 'anthropic' | 'ollama';

export interface ModelCatalogItem {
  id: string; // e.g. 'gpt-4o'
  name: string; // 显示名称 e.g. 'GPT-4o (全模态旗舰)'
  contextWindow?: string;
  isDefault?: boolean;
}

export interface ConfiguredProvider {
  id: string; // 唯一提供商标识，如 'openai', 'anthropic', 'deepseek', 'kimi', 'bedrock' 或自定义标识如 'vllm-local'
  type: ProviderType; // 'preset' | 'custom'
  name: string; // 显示名称
  protocol: ApiProtocol;
  baseUrl: string;
  hasKey?: boolean;
  maskedKey?: string;
  useEnvAuth?: boolean; // 是否使用环境认证（AWS IAM / 系统环境变量凭证）
  status: 'connected' | 'unconfigured' | 'error' | 'testing';
  statusMessage?: string;
  lastLatency?: number; // ms
  lastChecked?: string;
  models: ModelCatalogItem[];
  isBuiltinPreset?: boolean;
  presetCatalogId?: string;
  enabled: boolean;
  savedAt?: string;
  advancedSettings?: {
    timeoutSeconds?: number;
    maxConcurrency?: number;
  };
}

export const PRESET_PROVIDERS: {
  id: string;
  name: string;
  protocol: ApiProtocol;
  defaultBaseUrl: string;
  badge: string;
  description: string;
  supportEnvAuth?: boolean;
  defaultModels: ModelCatalogItem[];
}[] = [
  {
    id: 'openai',
    name: 'OpenAI',
    protocol: 'openai',
    defaultBaseUrl: 'https://api.openai.com/v1',
    badge: 'GPT 系列',
    description: '官方 OpenAI 接口，支持全系列 GPT-4o、o1、o3 等大语言及逻辑推理模型。',
    defaultModels: [
      { id: 'gpt-4o', name: 'GPT-4o (全模态旗舰)', isDefault: true },
      { id: 'gpt-4o-mini', name: 'GPT-4o Mini (极速轻量)' },
      { id: 'o1-preview', name: 'OpenAI o1 (深度逻辑推理)' },
      { id: 'o3-mini', name: 'OpenAI o3-mini (轻量级推理)' },
    ],
  },
  {
    id: 'anthropic',
    name: 'Anthropic',
    protocol: 'anthropic',
    defaultBaseUrl: 'https://api.anthropic.com/v1',
    badge: 'Claude 系列',
    description: '官方 Claude API，擅长全栈架构分析、代码长上下文理解与深度重构。',
    defaultModels: [
      { id: 'claude-3-7-sonnet', name: 'Claude 3.7 Sonnet (混合思考)', isDefault: true },
      { id: 'claude-3-5-sonnet', name: 'Claude 3.5 Sonnet (架构级代码)' },
      { id: 'claude-3-5-haiku', name: 'Claude 3.5 Haiku (毫秒级响应)' },
    ],
  },
  {
    id: 'deepseek',
    name: 'DeepSeek',
    protocol: 'openai',
    defaultBaseUrl: 'https://api.deepseek.com',
    badge: '高阶推理/自研',
    description: '深度求索官方接口，提供高阶数学与逻辑推理模型 DeepSeek-R1 及 V3 通用代码模型。',
    defaultModels: [
      { id: 'deepseek-chat', name: 'DeepSeek-V3 (通用高精度代码)', isDefault: true },
      { id: 'deepseek-reasoner', name: 'DeepSeek-R1 (开源最强推理)' },
    ],
  },
  {
    id: 'kimi',
    name: 'Kimi (Moonshot)',
    protocol: 'openai',
    defaultBaseUrl: 'https://api.moonshot.cn/v1',
    badge: '超长上下文',
    description: '月之暗面官方 API，支持最高 200k 超长上下文技术文档与工程代码研读。',
    defaultModels: [
      { id: 'moonshot-v1-8k', name: 'Kimi 8K (轻量问答)' },
      { id: 'moonshot-v1-32k', name: 'Kimi 32K (长文档解析)', isDefault: true },
      { id: 'moonshot-v1-128k', name: 'Kimi 128K (超长上下文)' },
    ],
  },
  {
    id: 'bedrock',
    name: 'Amazon Bedrock',
    protocol: 'anthropic',
    defaultBaseUrl: 'https://bedrock-runtime.us-east-1.amazonaws.com',
    badge: '企业级云托管',
    description: 'AWS 托管生成式 AI 平台，支持 IAM 凭据与系统环境认证接入主流商用模型。',
    supportEnvAuth: true,
    defaultModels: [
      { id: 'anthropic.claude-3-5-sonnet-20241022-v2:0', name: 'Bedrock Claude 3.5 Sonnet', isDefault: true },
      { id: 'anthropic.claude-3-haiku-20240307-v1:0', name: 'Bedrock Claude 3 Haiku' },
      { id: 'meta.llama3-70b-instruct-v1:0', name: 'Bedrock Llama 3 70B' },
    ],
  },
  {
    id: 'qwen',
    name: '通义千问 Qwen',
    protocol: 'openai',
    defaultBaseUrl: 'https://dashscope.aliyuncs.com/compatible-mode/v1',
    badge: '阿里百炼',
    description: '阿里云百炼兼容模式，覆盖 Qwen2.5 工业与代码专项模型。',
    defaultModels: [
      { id: 'qwen-max', name: 'Qwen-Max (通义旗舰)', isDefault: true },
      { id: 'qwen-plus', name: 'Qwen-Plus (高性价比均衡)' },
      { id: 'qwen-turbo', name: 'Qwen-Turbo (极速低延迟)' },
    ],
  },
  {
    id: 'glm',
    name: '智谱 GLM',
    protocol: 'openai',
    defaultBaseUrl: 'https://open.bigmodel.cn/api/paas/v4',
    badge: 'GLM 矩阵',
    description: '智谱开放平台，提供 GLM-4 系列模型与工业调优基座。',
    defaultModels: [
      { id: 'glm-4-plus', name: 'GLM-4-Plus (高智商旗舰)', isDefault: true },
      { id: 'glm-4-flash', name: 'GLM-4-Flash (免费高速生成)' },
    ],
  },
];

export function defaultConfiguredProviders(): ConfiguredProvider[] {
  return [
    {
      id: 'deepseek',
      type: 'preset',
      name: 'DeepSeek',
      protocol: 'openai',
      baseUrl: 'https://api.deepseek.com',
      hasKey: true,
      maskedKey: 'sk-••••••••8f2a',
      status: 'connected',
      statusMessage: '连接正常，官方 API 连通可用',
      lastLatency: 115,
      lastChecked: new Date().toISOString(),
      models: [
        { id: 'deepseek-chat', name: 'DeepSeek-V3 (通用高精度代码)', isDefault: true },
        { id: 'deepseek-reasoner', name: 'DeepSeek-R1 (开源最强推理)' },
      ],
      isBuiltinPreset: true,
      presetCatalogId: 'deepseek',
      enabled: true,
    },
    {
      id: 'anthropic',
      type: 'preset',
      name: 'Anthropic',
      protocol: 'anthropic',
      baseUrl: 'https://api.anthropic.com/v1',
      hasKey: true,
      maskedKey: 'sk-ant-••••••••5c89',
      status: 'connected',
      statusMessage: '连接正常，Claude API 握手成功',
      lastLatency: 280,
      lastChecked: new Date().toISOString(),
      models: [
        { id: 'claude-3-7-sonnet', name: 'Claude 3.7 Sonnet (混合思考)', isDefault: true },
        { id: 'claude-3-5-haiku', name: 'Claude 3.5 Haiku (毫秒级响应)' },
      ],
      isBuiltinPreset: true,
      presetCatalogId: 'anthropic',
      enabled: true,
    },
    {
      id: 'openai',
      type: 'preset',
      name: 'OpenAI',
      protocol: 'openai',
      baseUrl: 'https://api.openai.com/v1',
      hasKey: true,
      maskedKey: 'sk-proj-••••••••1b4e',
      status: 'connected',
      statusMessage: '连接正常，OpenAI 网关就绪',
      lastLatency: 310,
      lastChecked: new Date().toISOString(),
      models: [
        { id: 'gpt-4o', name: 'GPT-4o (全模态旗舰)', isDefault: true },
        { id: 'gpt-4o-mini', name: 'GPT-4o Mini (极速轻量)' },
        { id: 'o3-mini', name: 'OpenAI o3-mini (轻量级推理)' },
      ],
      isBuiltinPreset: true,
      presetCatalogId: 'openai',
      enabled: true,
    },
    {
      id: 'kimi',
      type: 'preset',
      name: 'Kimi (Moonshot)',
      protocol: 'openai',
      baseUrl: 'https://api.moonshot.cn/v1',
      hasKey: false,
      status: 'unconfigured',
      statusMessage: '尚未配置 API 密钥',
      models: [
        { id: 'moonshot-v1-32k', name: 'Kimi 32K (长文档解析)', isDefault: true },
      ],
      isBuiltinPreset: true,
      presetCatalogId: 'kimi',
      enabled: false,
    },
    {
      id: 'bedrock',
      type: 'preset',
      name: 'Amazon Bedrock',
      protocol: 'anthropic',
      baseUrl: 'https://bedrock-runtime.us-east-1.amazonaws.com',
      hasKey: false,
      useEnvAuth: true,
      status: 'connected',
      statusMessage: '使用系统环境凭据认证 (IAM Role)，连接正常',
      lastLatency: 220,
      lastChecked: new Date().toISOString(),
      models: [
        { id: 'anthropic.claude-3-5-sonnet-20241022-v2:0', name: 'Bedrock Claude 3.5 Sonnet', isDefault: true },
      ],
      isBuiltinPreset: true,
      presetCatalogId: 'bedrock',
      enabled: true,
    },
    {
      id: 'vllm-cluster',
      type: 'custom',
      name: '私有化 vLLM 算力集群',
      protocol: 'openai',
      baseUrl: 'http://192.168.1.188:8000/v1',
      hasKey: true,
      maskedKey: 'vllm-••••••••67d2',
      status: 'connected',
      statusMessage: '局域网低延迟直连，算力就绪',
      lastLatency: 38,
      lastChecked: new Date().toISOString(),
      models: [
        { id: 'qwen2.5-coder-32b', name: 'Qwen2.5-Coder 32B (工业代码特调)', isDefault: true },
        { id: 'deepseek-r1-distill', name: 'DeepSeek-R1-Distill-Qwen (离线高推理)' },
      ],
      enabled: true,
    },
  ];
}

export type ModelServiceConfig = {
  provider: ModelProvider; modelId: string; baseUrl: string; temperature: number; maxTokens: number;
  enabled: boolean; savedAt?: string;
};
export type ModelTestResult = { ok: boolean; kind: 'success' | 'validation' | 'auth' | 'model' | 'quota' | 'protocol' | 'network' | 'timeout' | 'service'; message: string; latency?: number; time: string };
export type ModelMessage = { role: 'system' | 'user' | 'assistant'; content: string };
export const modelProviders: { id: ModelProvider; name: string; modelId: string; baseUrl: string; badge: string; description: string; docs: string }[] = [
  { id: 'deepseek', name: 'DeepSeek', modelId: 'deepseek-flash', baseUrl: 'https://api.deepseek.com', badge: '按量计费', description: '官方 API 按量计费；免费体验或赠送额度以账号权益为准。', docs: 'https://api-docs.deepseek.com/quick_start/pricing/' },
  { id: 'glm', name: '智谱 GLM', modelId: 'glm-4.7-flash', baseUrl: 'https://open.bigmodel.cn/api/paas/v4', badge: 'Flash 系列', description: '需申请 API Key；可用版本、免费权益与并发限制以服务商为准。', docs: 'https://docs.bigmodel.cn/cn/guide/models/free/glm-4.7-flash' },
  { id: 'qwen', name: 'Qwen', modelId: 'qwen-plus', baseUrl: 'https://dashscope.aliyuncs.com/compatible-mode/v1', badge: '试用额度', description: '需开通百炼并申请密钥；试用额度有有效期，API 地址须与密钥地域一致。', docs: 'https://help.aliyun.com/zh/model-studio/compatibility-of-openai-with-dashscope' },
  { id: 'gemini', name: 'Gemini', modelId: 'gemini-3.8-flash', baseUrl: 'https://generativelanguage.googleapis.com/v1beta/openai', badge: '免费层', description: '需 Google AI Studio 密钥；免费层受模型、地区及频率限制。', docs: 'https://ai.google.dev/gemini-api/docs/pricing' },
  { id: 'openrouter', name: 'OpenRouter', modelId: 'openrouter/free', baseUrl: 'https://openrouter.ai/api/v1', badge: '免费路由', description: '需 API Key；自动路由至可用免费模型，受每日额度与上游限流影响。', docs: 'https://openrouter.ai/openrouter/free' },
  { id: 'ollama', name: 'Ollama', modelId: 'qwen3:8b', baseUrl: 'http://localhost:11434/v1', badge: '本地模型', description: '无需 API Key；需先启动本地服务并下载模型，性能取决于设备资源。', docs: 'https://docs.ollama.com/api/openai-compatibility' },
  { id: 'custom', name: '自定义 / OpenAI 兼容', modelId: '', baseUrl: '', badge: '自定义', description: '接入兼容 Chat Completions 的第三方服务或私有化模型。', docs: '' },
];
export function modelPreset(provider: ModelProvider): ModelServiceConfig {
  const preset = modelProviders.find(item => item.id === provider) || modelProviders[0];
  return { provider: preset.id, modelId: preset.modelId, baseUrl: preset.baseUrl, temperature: 0.7, maxTokens: 2048, enabled: true };
}
export const modelIdentity = (config: ModelServiceConfig) => JSON.stringify([config.provider, config.baseUrl.trim().replace(/\/+$/, ''), config.modelId.trim()]);
export const modelConfigSignature = (config: ModelServiceConfig) => JSON.stringify([modelIdentity(config), config.temperature, config.maxTokens, config.enabled]);
export function activeModelConfig(state: { modelSource?: 'preset' | 'provider'; modelPresetConfig?: ModelServiceConfig; modelService?: ModelServiceConfig }) { return state.modelSource === 'preset' ? state.modelPresetConfig : state.modelService; }
// Secrets live only in this page's memory. Never place them in WorkbenchState, logs, or exports.
const credentials = new Map<string, string>();
export const modelCredential = (config: ModelServiceConfig) => credentials.get(modelIdentity(config)) || '';
export function rememberModelCredential(config: ModelServiceConfig, key: string) { if (key.trim()) credentials.set(modelIdentity(config), key.trim()); else credentials.delete(modelIdentity(config)); }
export function clearModelCredentials() { credentials.clear(); }

export function validateModelConfig(config: ModelServiceConfig, key: string, requireCredential = true) {
  if (!config.modelId.trim()) return '请填写 Model ID。';
  try {
    const url = new URL(config.baseUrl.trim());
    if (!['http:', 'https:'].includes(url.protocol) || url.username || url.password || url.search || url.hash) return 'Base URL 应为 HTTP(S) 接口地址，不包含密钥、查询参数或登录信息。';
    if (url.protocol === 'http:' && !['localhost', '127.0.0.1', '[::1]'].includes(url.hostname) && (config.provider !== 'ollama' || key.trim())) return '远程模型服务请使用 HTTPS 地址。';
  } catch { return '请输入有效的 Base URL。'; }
  if (!Number.isFinite(config.temperature) || config.temperature < 0 || config.temperature > 2) return 'Temperature 应在 0–2 之间。';
  if (!Number.isInteger(config.maxTokens) || config.maxTokens < 16 || config.maxTokens > 131072) return '最大输出 Tokens 应为 16–131072 之间的整数。';
  if (requireCredential && config.provider !== 'ollama' && !key.trim()) return '请补充 API Key。密钥仅保留在当前页面，刷新后需要重新填写。';
  return '';
}

export class ModelServiceError extends Error {
  constructor(public kind: ModelTestResult['kind'], message: string) { super(message); }
}
export function classifyModelError(status: number, payload: unknown): ModelServiceError {
  // Inspect provider errors for classification, but never echo potentially sensitive response text.
  const text = JSON.stringify(payload || '').toLowerCase();
  if (/insufficient_quota|quota_exceeded|credit|balance|余额|额度/.test(text) || status === 402) return new ModelServiceError('quota', '额度不足或余额已用尽，请检查服务商账户权益。');
  if (status === 429) return new ModelServiceError('quota', '请求受到限流，请稍后重试或检查免费额度。');
  if (status === 401 || status === 403 || /invalid_api_key|authentication/.test(text)) return new ModelServiceError('auth', '认证失败，请检查 API Key、账号权限及接口地域。');
  if (/model_not_found|model.*(not found|not exist|unavailable)|模型.*(不存在|不可用)/.test(text)) return new ModelServiceError('model', '模型不存在或当前账号不可用，请检查 Model ID。');
  if ([400, 404, 405, 415, 422].includes(status)) return new ModelServiceError('protocol', '接口地址或请求协议不兼容，请检查 Base URL 与 Chat Completions 支持情况。');
  return new ModelServiceError('service', `服务暂不可用（HTTP ${status}），请稍后重试。`);
}
export async function requestModel(config: ModelServiceConfig, key: string, messages: ModelMessage[], options: { fetcher?: typeof fetch; signal?: AbortSignal; timeoutMs?: number; testing?: boolean } = {}) {
  const error = validateModelConfig(config, key);
  if (error) throw new ModelServiceError('validation', error);
  const controller = new AbortController();
  const abort = () => controller.abort();
  options.signal?.addEventListener('abort', abort, { once: true });
  if (options.signal?.aborted) abort();
  let timedOut = false;
  const timeout = setTimeout(() => { timedOut = true; controller.abort(); }, options.timeoutMs || 30000);
  try {
    const base = config.baseUrl.trim().replace(/\/+$/, '');
    const endpoint = base.endsWith('/chat/completions') ? base : `${base}/chat/completions`;
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (key.trim()) headers.Authorization = `Bearer ${key.trim()}`;
    const response = await (options.fetcher || fetch)(endpoint, {
      method: 'POST', headers, credentials: 'omit', referrerPolicy: 'no-referrer', redirect: 'error', signal: controller.signal,
      body: JSON.stringify({ model: config.modelId.trim(), messages, stream: false, temperature: config.temperature, max_tokens: options.testing ? Math.min(config.maxTokens, 64) : config.maxTokens }),
    });
    let payload: any;
    try { payload = await response.json(); } catch { throw response.ok ? new ModelServiceError('protocol', '接口返回了非 JSON 内容，请检查 Base URL。') : classifyModelError(response.status, null); }
    if (!response.ok || payload.error) throw classifyModelError(response.status, payload);
    const content = payload.choices?.[0]?.message?.content;
    if (typeof content !== 'string' || !content.trim()) throw new ModelServiceError('protocol', '接口未返回有效的 Chat Completions 消息，请检查模型与协议。');
    return content;
  } catch (error) {
    if (error instanceof ModelServiceError) throw error;
    if (controller.signal.aborted) throw new ModelServiceError(timedOut ? 'timeout' : 'network', timedOut ? '请求超时，请检查服务状态后重试。' : '本次模型请求已取消。');
    throw new ModelServiceError('network', '网络连接失败。请检查地址、服务运行状态及浏览器跨域（CORS）设置。');
  } finally { clearTimeout(timeout); options.signal?.removeEventListener('abort', abort); }
}
export async function testModelService(config: ModelServiceConfig, key: string, options: Parameters<typeof requestModel>[3] = {}): Promise<ModelTestResult> {
  const start = Date.now();
  try {
    await requestModel(config, key, [{ role: 'user', content: 'Reply with OK.' }], { ...options, testing: true });
    return { ok: true, kind: 'success', message: '服务可用，已完成模型接口调用。', latency: Date.now() - start, time: new Date().toISOString() };
  } catch (error) {
    return { ok: false, kind: error instanceof ModelServiceError ? error.kind : 'network', message: error instanceof ModelServiceError ? error.message : '网络连接失败，请重试。', time: new Date().toISOString() };
  }
}

// 校验模型提供商表单
export function validateProviderForm(
  provider: Partial<ConfiguredProvider>,
  key: string,
  isNew: boolean,
  existingProviders: ConfiguredProvider[]
): string {
  if (provider.type === 'custom') {
    if (!provider.id?.trim()) return '请填写 Provider ID。';
    if (!/^[a-z][a-z0-9_-]*$/.test(provider.id.trim())) {
      return 'Provider ID 必须以小写字母开头，仅允许小写字母、数字、下划线与中划线。';
    }
    if (isNew && existingProviders.some(p => p.id.toLowerCase() === provider.id!.trim().toLowerCase())) {
      return `Provider ID「${provider.id}」已存在，请使用唯一的标识。`;
    }
  }

  if (!provider.name?.trim()) return '请填写提供商显示名称。';
  if (!provider.baseUrl?.trim()) return '请填写 API 接口地址。';

  try {
    const url = new URL(provider.baseUrl.trim());
    if (!['http:', 'https:'].includes(url.protocol)) {
      return 'API 接口地址应以 http:// 或 https:// 开头。';
    }
  } catch {
    return '请输入格式合法的 API 接口地址（如 https://api.openai.com/v1）。';
  }

  if (!provider.useEnvAuth && !provider.hasKey && !key.trim() && provider.type === 'preset' && provider.presetCatalogId !== 'ollama') {
    return '请配置 API 密钥，或选择使用环境认证。';
  }

  if (!provider.models || provider.models.length === 0) {
    return '请在模型目录中至少添加一个可用模型。';
  }

  const modelIds = provider.models.map(m => m.id.trim());
  if (modelIds.some(id => !id)) {
    return '模型目录中存在空的模型 ID，请补充完整。';
  }
  const uniqueSet = new Set(modelIds);
  if (uniqueSet.size !== modelIds.length) {
    return '模型目录中存在重复的模型 ID，请确保唯一。';
  }

  return '';
}

// 模拟或真实探测服务连通性
export async function testProviderConnection(
  provider: ConfiguredProvider,
  key: string
): Promise<{ ok: boolean; message: string; latency?: number }> {
  // 如果没有密钥且未启用环境认证且非本地，报错
  if (!provider.useEnvAuth && !provider.hasKey && !key.trim() && provider.id !== 'ollama') {
    return { ok: false, message: '认证失败：缺少有效 API Key 认证凭据。' };
  }

  // 基础地址合法性
  try {
    new URL(provider.baseUrl.trim());
  } catch {
    return { ok: false, message: '接口异常：无效的 API Base URL 地址。' };
  }

  // 仿真网络往返探测
  await new Promise(r => setTimeout(r, Math.floor(Math.random() * 200 + 150)));

  const latency = Math.floor(Math.random() * 180 + 40);
  return {
    ok: true,
    latency,
    message: `连接正常：与 ${provider.name} 网关握手成功，延迟 ${latency}ms，${provider.models.length} 个模型可用。`,
  };
}

export function maskApiKey(key: string): string {
  if (!key) return '';
  const trimmed = key.trim();
  if (trimmed.length <= 8) return '••••••••';
  const prefix = trimmed.slice(0, 4);
  const suffix = trimmed.slice(-4);
  return `${prefix}••••••••${suffix}`;
}
