import { isDeviceChatWorkspace, projectChatResources } from './agentChatResources';
import { connectTiangongResource, disconnectTiangongResource, tiangongConnectionBlockReason, tiangongResourceAccess } from './agentTiangongResources';
import type { WorkbenchState } from './agentWorkbenchState';

export type ResourceConnection = {
  id: string;
  type: 'device' | 'park';
  name: string;
  address: string;
  connected: boolean;
  projectCount: number;
  taskCount: number;
};

// The connection list contains saved or associated resources, not unused device suggestions.
export function resourceConnections(state: WorkbenchState): ResourceConnection[] {
  const workspaces = state.workspaces.filter(workspace => !workspace.archived);
  const tasks = state.tasks.filter(task => !task.archived && workspaces.some(workspace => workspace.id === task.workspaceId));
  const usage = (type: ResourceConnection['type'], id: string) => ({
    projectCount: workspaces.filter(workspace => (workspace.project || isDeviceChatWorkspace(workspace)) && (type === 'device'
      ? workspace.boundDeviceId === id || (isDeviceChatWorkspace(workspace) && workspace.deviceIds[0] === id)
      : workspace.tiangongLinks?.some(link => link.resourceId === id && link.enabled !== false && link.read))).length,
    taskCount: tasks.filter(task => {
      const inherited = projectChatResources(state, workspaces.find(workspace => workspace.id === task.workspaceId));
      return type === 'device'
        ? (inherited.locked ? inherited.deviceId : task.deviceId) === id
        : (inherited.locked ? inherited.links : task.tiangongLinks)?.some(link => link.resourceId === id && link.enabled !== false && link.read);
    }).length,
  });
  const devices = state.devices.map<ResourceConnection>(device => ({
    id: device.id, type: 'device', name: device.name,
    address: device.webConnection?.url || (device.connection ? `SSH · ${device.connection.username}@${device.connection.host}:${device.connection.port}` : device.address),
    connected: device.connected, ...usage('device', device.id),
  })).filter(row => {
    const device = state.devices.find(device => device.id === row.id)!;
    return device.connection || device.webConnection || row.projectCount || row.taskCount;
  });
  const parks = (state.tiangongResources || []).map<ResourceConnection>(resource => ({
    id: resource.id, type: 'park', name: resource.parkName, address: resource.url,
    connected: Boolean(tiangongResourceAccess(resource)), ...usage('park', resource.id),
  })).filter(row => {
    const resource = state.tiangongResources!.find(resource => resource.id === row.id)!;
    return resource.verifiedAt || resource.credentialRef || row.projectCount || row.taskCount;
  });
  return [...devices, ...parks];
}

// Connecting changes availability only. It never associates a task or retries an old operation.
export function resourceConnectionBlockReason(state: WorkbenchState, type: ResourceConnection['type'], id: string, connected: boolean): string {
  if (type === 'park') return connected ? tiangongConnectionBlockReason(state, id) : state.tiangongResources?.some(resource => resource.id === id) ? '' : '园区连接不存在。';
  const device = state.devices.find(device => device.id === id);
  if (!device) return '设备连接不存在。';
  return connected && !device.connection && !device.webConnection ? '此历史设备缺少已保存的连接资料，请重新添加设备关联。' : '';
}
export function setResourceConnected(state: WorkbenchState, type: ResourceConnection['type'], id: string, connected: boolean): string {
  const blocked = resourceConnectionBlockReason(state, type, id, connected);
  if (blocked) return blocked;
  if (type === 'park') {
    if (connected) return connectTiangongResource(state, id);
    disconnectTiangongResource(state, id);
    return '';
  }
  const device = state.devices.find(device => device.id === id)!;
  device.connected = connected;
  device.lastConnected = connected;
  if (!connected) {
    for (const call of state.calls.filter(call => call.deviceId === id && !call.executions && ['queued', 'pending', 'blocked'].includes(call.status))) {
      call.status = 'blocked'; call.approved = false; call.output = '设备已断联，请连接后重新确认操作。';
    }
    for (const task of state.tasks.filter(task => task.deviceId === id && ['running', 'authorization'].includes(task.status))) task.status = 'stopped';
  }
  return '';
}
