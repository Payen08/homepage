import type { Project, Workspace, WorkbenchState } from './agentWorkbenchState';

export type BuiltinSystemId = 'tiangong' | 'baichuan-qingda' | 'digital-machine' | 'baichuan-zhuangji';
export type BuiltinSystemConfiguration = { enabled: boolean; read: boolean; write: boolean };
export const builtinSystems = [
  { id: 'tiangong' as const, serviceId: 'mcp-tiangong', name: '天工系统', description: '查询园区、车辆运行及业务任务，按授权提交业务变更。' },
  { id: 'baichuan-qingda' as const, serviceId: 'mcp-baichuan-qingda', name: '百川轻搭', description: '查询设备里程、执行任务与运行状态，管理设备开发能力。' },
  { id: 'digital-machine' as const, serviceId: 'mcp-digital-machine', name: '数字造机', description: '查询整机模型、装配与设备配置，按授权提交工程变更。' },
  { id: 'baichuan-zhuangji' as const, serviceId: 'mcp-baichuan-zhuangji', name: '百川装机', description: '通过关联设备 IP 查询装机状态、管理设备配置与装机组件。' },
];
export const builtinSystemForWorkspace = (workspace?: Pick<Workspace, 'builtinSystemId'>) => builtinSystems.find(system => system.id === workspace?.builtinSystemId);
export const builtinSystemForProject = (state: WorkbenchState, project?: Project | null) => project ? builtinSystems.find(system => system.id === (project.builtinSystemId || state.workspaces.find(workspace => workspace.project?.id === project.id)?.builtinSystemId)) : undefined;
export function inferResourceSystem(state: WorkbenchState, input: { workspace?: Workspace; project?: Project | null; deviceId?: string | null; links?: { resourceId: string; enabled?: boolean }[]; prompt?: string }) {
  const fixed = builtinSystemForWorkspace(input.workspace) || builtinSystemForProject(state, input.project);
  if (fixed) return fixed;
  if (input.links?.some(link => link.enabled !== false && state.tiangongResources?.some(resource => resource.id === link.resourceId))) return builtinSystems[0];
  const device = state.devices.find(device => device.id === input.deviceId);
  if (!device) return undefined;
  const systemId = device.systemId || (/装机|安装组件|部署组件/.test(input.prompt || '') ? 'baichuan-zhuangji' : /数字造机|整机模型|装配|URDF|坐标变换/.test(input.prompt || '') ? 'digital-machine' : 'baichuan-qingda');
  return builtinSystems.find(system => system.id === systemId);
}
export const builtinResourceType = (systemId?: BuiltinSystemId) => systemId === 'tiangong' ? 'park' : systemId ? 'device' : undefined;
export const builtinSystemForService = (id?: string) => builtinSystems.find(system => system.serviceId === id);
export const isPlatformAdmin = (state: WorkbenchState) => state.actorRole !== 'member';
export function isBusinessMutationRequest(prompt: string) {
  return /修改|更新|删除|提交|写入|下发|设置|重启|标记|(?:启动|停止)设备|(?:将|把).{0,60}(?:处理|关闭|完成|同步)|^(?:请|帮我|麻烦|立即|现在|\s)*(?:处理|关闭|完成|同步|执行(?:任务|控制|导航))/.test(prompt);
}
export function suggestedSystemResource(serviceId: string | undefined, prompt: string) {
  if (serviceId === 'mcp-baichuan-qingda') {
    if (/里程|公里|跑了多远|运行状态/.test(prompt)) return '设备状态与日志诊断';
    if (/执行.*任务|任务记录|导航/.test(prompt)) return '运动控制与导航';
  }
  if (serviceId === 'mcp-digital-machine' && /装配|坐标|URDF/i.test(prompt)) return '装配与坐标变换';
  if (serviceId === 'mcp-baichuan-zhuangji') {
    if (/状态|日志|诊断|检查/.test(prompt)) return '装机状态与诊断';
    if (/软件|组件|插件|安装|部署/.test(prompt)) return '装机组件管理';
    return '装机配置与参数';
  }
  return undefined;
}
export function builtinSystemConfiguration(state: WorkbenchState, id: BuiltinSystemId): BuiltinSystemConfiguration {
  return state.builtinSystemConfigurations?.[id] || { enabled: true, read: true, write: true };
}
export function configureBuiltinSystem(state: WorkbenchState, id: BuiltinSystemId, change: Partial<BuiltinSystemConfiguration>) {
  if (!isPlatformAdmin(state)) return '只有管理员可以修改内置系统能力配置。';
  (state.builtinSystemConfigurations ||= {})[id] = { ...builtinSystemConfiguration(state, id), ...change };
  return '';
}
export function builtinSystemBlockReason(state: WorkbenchState, id: BuiltinSystemId, write: boolean) {
  const settings = builtinSystemConfiguration(state, id);
  if (!settings.enabled) return '该内置系统能力已停用。';
  if (!settings.read) return '管理员尚未开放读取业务数据权限。';
  if (write && !isPlatformAdmin(state)) return '普通项目成员仅可查询业务数据，业务变更需要管理员操作。';
  if (write && !settings.write) return '管理员尚未开放提交业务变更权限。';
  return '';
}
export function builtinSystemStatus(state: WorkbenchState, id: BuiltinSystemId) {
  if (!builtinSystemConfiguration(state, id).enabled) return '已停用';
  if (id === 'tiangong') return '未配置';
  const system = builtinSystems.find(system => system.id === id)!;
  const service = state.services.find(service => service.id === system.serviceId);
  if (service?.mode === 'demo') return '可用';
  if (!service?.endpoint && !service?.command) return '未配置';
  return service.connected ? '可用' : '异常';
}
