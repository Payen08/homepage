import { builtinSystems, builtinSystemForService, builtinSystemConfiguration, configureBuiltinSystem, type BuiltinSystemId } from './agentBuiltinSystems';
import type { WorkbenchState, ToolCall } from './agentWorkbenchState';
export type ExtensionKind = 'plugin' | 'mcp' | 'skill' | 'system';
export type ExtensionItem = { id: string; kind: ExtensionKind; name: string; description: string; pluginId?: string; version?: string; builtin?: boolean; transport?: 'stdio' | 'HTTP'; content?: string; skillCount?: number; mcpCount?: number; systemId?: BuiltinSystemId };
export type ExtensionPreferences = { global: Record<string, boolean>; devices: Record<string, Record<string, boolean>>; selectedDeviceId: string };
export const builtinExtensions: ExtensionItem[] = [
  { id: 'robot-development', kind: 'plugin', name: '机器人开发工具', version: '1.0.0', description: '在关联设备上分析运行状态、读取日志与管理开发文件。', builtin: true, skillCount: 3, mcpCount: 2 },
  { id: 'device-files', kind: 'mcp', name: '设备文件服务', pluginId: 'robot-development', description: '读取设备日志，提交设备配置文件的待审修改。', builtin: true, transport: 'stdio' },
  { id: 'device-control', kind: 'mcp', name: '设备调试服务', pluginId: 'robot-development', description: '管理设备调试与控制操作，每次写入均需任务授权及确认。', builtin: true, transport: 'stdio' },
  { id: 'system-resources', kind: 'skill', name: '系统资源查询', pluginId: 'robot-development', description: '查看 CPU、内存及磁盘使用情况，定位资源瓶颈。', builtin: true, content: '读取所关联设备的 CPU、内存和磁盘状态，注明实际目标、采集时间与异常项。仅执行只读查询。' },
  { id: 'network-diagnostics', kind: 'skill', name: '网络故障排查', pluginId: 'robot-development', description: '按连接、地址、路由及 DNS 顺序分析网络问题。', builtin: true, content: '先检查任务关联设备的连接与地址，再检查路由和 DNS，逐项给出观测证据；修改网络配置前申请确认。' },
  { id: 'startup-logs', kind: 'skill', name: '启动日志分析', pluginId: 'robot-development', description: '整理设备启动日志，识别异常服务与启动失败原因。', builtin: true, content: '仅分析当前任务关联设备的启动日志，按时间线列出异常、可能原因及下一步操作。不要自动重启设备。' },
];
export const defaultExtensionPreferences = (): ExtensionPreferences => ({ global: {}, devices: {}, selectedDeviceId: '' });
export function extensionItems(state: WorkbenchState): ExtensionItem[] {
  return [...builtinExtensions, ...builtinSystems.map(system => ({ id: system.serviceId, kind: 'system' as const, systemId: system.id, name: system.name, description: system.description, builtin: true })), ...state.services.filter(service => !builtinSystemForService(service.id)).map(service => ({ id: service.id, kind: 'mcp' as const, builtin: service.builtin, name: service.name, description: service.description || `提供 ${service.tools.map(tool => tool.name).join('、')}，业务资源按任务授权。`, transport: service.transport || 'HTTP' as const })), ...state.skills.map(skill => ({ id: skill.id, kind: 'skill' as const, name: skill.name, description: skill.description || '自建 Agent Skill', content: skill.content }))];
}
export const extensionKey = (kind: ExtensionKind, id: string) => `${kind}:${id}`;
export function extensionConfigured(state: WorkbenchState, kind: ExtensionKind, id: string, deviceId?: string | null) {
  const system = builtinSystemForService(id);
  if (system && (kind === 'system' || kind === 'mcp')) return builtinSystemConfiguration(state, system.id).enabled;
  const prefs = state.extensionPreferences;
  const key = extensionKey(kind, id);
  return (deviceId ? prefs?.devices[deviceId]?.[key] : undefined) ?? prefs?.global[key] ?? true;
}
export function extensionEnabled(state: WorkbenchState, kind: ExtensionKind, id: string, deviceId?: string | null) {
  const item = extensionItems(state).find(item => (item.kind === kind || (kind === 'mcp' && item.kind === 'system')) && item.id === id);
  if (!item || !extensionConfigured(state, kind, id, deviceId)) return false;
  return !item.pluginId || extensionConfigured(state, 'plugin', item.pluginId, deviceId);
}
export function setExtensionEnabled(state: WorkbenchState, kind: ExtensionKind, id: string, enabled: boolean, deviceId?: string | null) {
  const system = builtinSystemForService(id);
  if (system && (kind === 'system' || kind === 'mcp')) { configureBuiltinSystem(state, system.id, { enabled }); return; }
  const prefs = state.extensionPreferences ||= defaultExtensionPreferences();
  const record = deviceId ? (prefs.devices[deviceId] ||= {}) : prefs.global;
  record[extensionKey(kind, id)] = enabled;
}
export function extensionCallBlockReason(state: WorkbenchState, call: ToolCall) {
  if (call.actor !== 'agent') return '';
  const task = state.tasks.find(task => task.id === call.taskId);
  const deviceId = call.deviceId || task?.deviceId;
  if (call.deviceId && ['device-read', 'file-proposal', 'device-write', 'terminal', 'desktop'].includes(call.kind)) {
    const id = call.kind === 'device-write' || call.kind === 'terminal' || call.kind === 'desktop' ? 'device-control' : 'device-files';
    if (!extensionEnabled(state, 'mcp', id, call.deviceId)) return '当前设备的相关扩展已停用，请在扩展中心启用后重试。';
  }
  if (call.serviceId && !extensionEnabled(state, 'mcp', call.serviceId, deviceId)) return '此 MCP 服务已在扩展中心停用，后续调用已限制。';
  if (call.kind === 'skill-test' && call.skillId && !extensionEnabled(state, 'skill', call.skillId, deviceId)) return '此 Skill 或所属插件已停用，请在扩展中心启用后重试。';
  if (task?.skillIds.some(id => !extensionEnabled(state, 'skill', id, task.deviceId))) return '任务所选 Skill 或所属插件已停用，请启用后重试。';
  return '';
}
