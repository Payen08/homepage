import type { McpService, ToolCall, WorkbenchState } from './agentWorkbenchState';

export type TiangongResource = { id: string; serviceId: string; name: string; kind: 'behavior-tree' | 'device-config'; content: string; version: number };
export type BusinessChange = { resourceId: string; before: string; after: string; baseVersion: number; reviewed: boolean };
export const TIANGONG_ID = 'mcp-tiangong';
export const TIANGONG_CAPABILITIES = [
  { id: 'business-template', name: '业务模板' },
  { id: 'behavior-management', name: '行为管理' },
  { id: 'park-management', name: '园区管理' },
  { id: 'area-management', name: '区域管理' },
  { id: 'map-management', name: '地图管理' },
  { id: 'dispatch-orders', name: '调度运单' },
  { id: 'control-command', name: '控制指令' },
  { id: 'off-peak-dispatch', name: '闲时调度' },
  { id: 'product-management', name: '产品管理' },
  { id: 'device-management', name: '设备管理' },
  { id: 'station-management', name: '站点管理' },
  { id: 'status-monitoring', name: '状态监控' },
  { id: 'rules-engine', name: '规则引擎' },
] as const;
export function tiangongDemoResources(): TiangongResource[] {
  return [
    { id: 'tiangong-behavior-tree', serviceId: TIANGONG_ID, name: '行为树 / 设备巡检', kind: 'behavior-tree', version: 1, content: JSON.stringify({ name: '设备巡检', root: { type: 'Sequence', children: [{ type: 'CheckConnection' }, { type: 'ReadStatus' }, { type: 'ReportResult' }] }, parameters: { retryCount: 2, timeoutSeconds: 10 } }, null, 2) },
    { id: 'tiangong-device-config', serviceId: TIANGONG_ID, name: '设备配置 / 机器人运行配置', kind: 'device-config', version: 1, content: JSON.stringify({ name: '机器人运行配置', deviceModel: 'RDK X3', parameters: { logLevel: 'info', pollIntervalMs: 1000, timeoutSeconds: 15 } }, null, 2) },
  ];
}
export function saveTiangongService(state: WorkbenchState, input: { mode: 'remote' | 'demo'; endpoint: string; allowWrite: boolean; enabledTools?: { read?: boolean; write?: boolean }; enabledCapabilities?: Record<string, boolean>; verifiedAt?: string }) {
  if (input.mode === 'remote') {
    try { const url = new URL(input.endpoint); if (!['http:', 'https:'].includes(url.protocol) || url.username || url.password || url.search || url.hash) return '请输入有效的天工 MCP 地址，不包含密钥或查询参数。'; } catch { return '请填写天工系统提供的 MCP 服务地址。'; }
  }
  const address = input.mode === 'demo' ? 'demo://tiangong' : input.endpoint.trim();
  const readEnabled = input.enabledTools?.read ?? true;
  const writeEnabled = input.enabledTools?.write ?? input.allowWrite;
  const capabilities = TIANGONG_CAPABILITIES.map(capability => ({ ...capability, enabled: input.enabledCapabilities?.[capability.id] ?? true }));
  const existing = state.services.find(service => service.id === TIANGONG_ID);
  const changed = existing && (existing.endpoint !== address || existing.mode !== input.mode || existing.allowWrite !== input.allowWrite);
  if (changed) state.grants.filter(grant => grant.serviceId === TIANGONG_ID).forEach(grant => { grant.revoked = true; });
  const service: McpService = { id: TIANGONG_ID, name: '天工系统', integration: 'tiangong', mode: input.mode, endpoint: input.mode === 'demo' ? 'demo://tiangong' : input.endpoint.trim(), connected: input.mode === 'demo', verifiedAt: input.verifiedAt, allowWrite: writeEnabled, transport: 'HTTP', description: '提供天工业务能力。', resources: ['天工业务资源'], tools: [{ id: 'read', name: '读取业务数据', write: false, enabled: readEnabled }, { id: 'write', name: '提交业务变更', write: true, enabled: writeEnabled }], capabilities };
  if (existing) { const tools = existing.tools; Object.assign(existing, service); if (!changed) existing.tools = tools; } else state.services.push(service);
  state.businessResources ||= [];
  if (input.mode === 'demo') for (const resource of tiangongDemoResources()) if (!state.businessResources.some(item => item.id === resource.id)) state.businessResources.push(resource);
  return '';
}
export function businessResource(state: WorkbenchState, call: Pick<ToolCall, 'serviceId' | 'resource'>) { return state.businessResources?.find(resource => resource.serviceId === call.serviceId && resource.name === call.resource); }
export function prepareBusinessChange(state: WorkbenchState, call: ToolCall) {
  if (call.businessChange) return;
  const resource = businessResource(state, call);
  if (!resource) return;
  const next = JSON.parse(resource.content);
  let instruction = '';
  try { instruction = JSON.parse(call.parameters).instruction || ''; } catch { /* Parameters are displayed and validated separately. */ }
  const count = instruction.match(/重试(?:次数)?[^\d]{0,8}(\d+)/)?.[1];
  const seconds = instruction.match(/超时[^\d]{0,8}(\d+)/)?.[1];
  next.parameters ||= {};
  if (resource.kind === 'behavior-tree') next.parameters.retryCount = count ? Number(count) : Number(next.parameters.retryCount || 0) + 1;
  else next.parameters.logLevel = /warn|警告/.test(instruction) ? 'warn' : /error|错误/.test(instruction) ? 'error' : 'debug';
  if (seconds) next.parameters.timeoutSeconds = Number(seconds);
  call.businessChange = { resourceId: resource.id, before: resource.content, after: JSON.stringify(next, null, 2), baseVersion: resource.version, reviewed: false };
}
export function businessCallBlockReason(state: WorkbenchState, call: ToolCall) {
  const service = state.services.find(service => service.id === call.serviceId);
  if (service?.integration !== 'tiangong') return '';
  if (service.mode !== 'demo') return '天工真实业务接口与操作权限尚未就绪，请完成业务适配后再调用。';
  const resource = businessResource(state, call);
  if (!resource) return '该天工业务资源当前不可用，请重新选择资源。';
  if (call.kind === 'mcp-write') {
    if (!service.allowWrite) return '天工接入仅允许查询与分析，尚未开放修改权限。';
    if (!call.businessChange) return '尚未生成业务差异，请先生成修改草案。';
    if (resource.version !== call.businessChange.baseVersion || resource.content !== call.businessChange.before) return '业务数据已更新，请重新生成并审查差异。';
    try { const value = JSON.parse(call.businessChange.after); if (!value || typeof value !== 'object' || Array.isArray(value)) return '业务修改必须是有效的 JSON 对象。'; } catch { return '业务修改包含无效 JSON，请修正后重新审查。'; }
    if (!call.businessChange.reviewed && (call.status === 'pending' || call.approved)) return '请先审查业务差异，再确认本次修改。';
  }
  return '';
}
export function commitBusinessChange(state: WorkbenchState, call: ToolCall) {
  const error = businessCallBlockReason(state, call);
  if (error) return error;
  if (call.executions > 0 || !call.approved) return '本次操作未确认或已经执行。';
  const resource = businessResource(state, call)!;
  resource.content = call.businessChange!.after;
  resource.version++;
  return '';
}
