import type { AgentTask, McpService, Project, WorkbenchState } from './agentWorkbenchState';
import { businessCapabilities, type BusinessCatalogId } from './agentBusinessCatalog';

export const QINGDA_MCP_ID = 'mcp-baichuan-qingda';
export const DIGITAL_MCP_ID = 'mcp-digital-machine';
export const ZHUANGJI_MCP_ID = 'mcp-baichuan-zhuangji';
const deviceSystemIds = new Set([QINGDA_MCP_ID, DIGITAL_MCP_ID, ZHUANGJI_MCP_ID]);
export function projectMcpService(state: WorkbenchState, project?: Project | string | null) {
  const projectName = typeof project === 'string' ? project : project?.name;
  const id = (typeof project === 'object' && project?.mcpServiceId) || (projectName === '百川轻搭' ? QINGDA_MCP_ID : projectName === '数字造机' ? DIGITAL_MCP_ID : projectName === '百川装机' ? ZHUANGJI_MCP_ID : '');
  return state.services.find(service => service.id === id);
}
export function taskRequiresDevice(state: WorkbenchState, task: Pick<AgentTask, 'workspaceId'> & { id?: string; mcpServiceId?: string; requiresDevice?: boolean }, serviceId?: string) {
  const workspace = state.workspaces.find(workspace => workspace.id === task.workspaceId);
  const id = serviceId ?? task.mcpServiceId;
  if (id === 'mcp-tiangong') return false;
  return Boolean(task.requiresDevice || (!id && projectMcpService(state, workspace?.project)?.requiresDevice) || (id && deviceSystemIds.has(id)) || state.services.find(service => service.id === id)?.requiresDevice || (task.id && state.grants.some(grant => grant.taskId === task.id && !grant.revoked && (deviceSystemIds.has(grant.serviceId) || state.services.find(service => service.id === grant.serviceId)?.requiresDevice))));
}
export function taskDeviceRequirementReason(state: WorkbenchState, input: { workspaceId: string; serviceId?: string; deviceId?: string | null }) {
  if (taskRequiresDevice(state, input, input.serviceId) && (!input.deviceId || !state.devices.some(device => device.id === input.deviceId))) {
    const workspace = state.workspaces.find(workspace => workspace.id === input.workspaceId);
    const service = [state.services.find(service => service.id === input.serviceId), projectMcpService(state, workspace?.project)].find(service => service?.requiresDevice);
    return `${service?.name || '当前'}任务需要绑定一台设备，请先选择设备。`;
  }
  return '';
}

export function builtinBusinessMcpServices(): McpService[] {
  return [
    { id: QINGDA_MCP_ID, name: '百川轻搭', description: '行为树编排、设备控制、外设调试、日志诊断与插件开发。', catalog: 'baichuan-qingda' as BusinessCatalogId, requiresDevice: true },
    { id: DIGITAL_MCP_ID, name: '数字造机', description: '整机模型、装配与坐标变换、设备配置、总线接入和标定。', catalog: 'digital-machine' as BusinessCatalogId, requiresDevice: true },
    { id: ZHUANGJI_MCP_ID, name: '百川装机', description: '通过任务关联的设备 IP 查询装机状态、管理设备配置与装机组件。', catalog: 'baichuan-zhuangji' as BusinessCatalogId, requiresDevice: true },
  ].map(service => ({ ...service, builtin: true, transport: 'HTTP', endpoint: '', connected: true, mode: 'demo',
    resources: businessCapabilities[service.catalog].map(capability => capability.name),
    capabilities: businessCapabilities[service.catalog].map(capability => ({ id: capability.id, name: capability.name, enabled: true })),
    tools: [{ id: 'read', name: '读取业务数据', write: false }, { id: 'write', name: '提交业务变更', write: true }],
  }));
}

export function ensureBuiltinMcpServices(state: WorkbenchState) {
  for (const service of builtinBusinessMcpServices()) {
    const existing = state.services.find(existing => existing.id === service.id || existing.name.replace(/\s*MCP$/i, '') === service.name.replace(/\s*MCP$/i, ''));
    if (existing) {
      existing.builtin = true; existing.name = service.name;
      if (!existing.endpoint && !existing.command) { existing.connected = true; existing.mode = 'demo'; }
      existing.catalog = service.catalog; existing.requiresDevice = service.requiresDevice;
      existing.description = service.description;
      if (existing.resources.length === 1 && /^(百川轻搭|数字造机|百川装机)业务资源$/.test(existing.resources[0])) existing.resources = service.resources;
      existing.capabilities = service.capabilities!.map(capability => ({ ...capability, enabled: existing.capabilities?.find(item => item.id === capability.id)?.enabled !== false }));
      continue;
    }
    state.services.push(service);
  }
}
