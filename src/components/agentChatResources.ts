import type { AgentTask, WorkbenchState, Workspace } from './agentWorkbenchState';

export function isDeviceChatWorkspace(workspace?: Workspace) {
  return Boolean(workspace && !workspace.project && !workspace.isChatSpace && !workspace.builtinSystemId && workspace.deviceIds.length);
}

// A device folder has a fixed resource type; a standalone chat with a device does not.
export function workspaceChatResourceType(workspace?: Workspace): 'park' | 'device' | undefined {
  if (workspace?.builtinSystemId) return workspace.builtinSystemId === 'tiangong' ? 'park' : 'device';
  return isDeviceChatWorkspace(workspace) ? 'device' : undefined;
}

// Available project devices are separate from an explicit project-wide binding.
export function projectChatResources(state: WorkbenchState, workspace?: Workspace) {
  if (isDeviceChatWorkspace(workspace)) {
    const deviceId = workspace!.boundDeviceId || workspace!.deviceIds[0];
    return { deviceId: state.devices.some(device => device.id === deviceId) ? deviceId : '', links: [], locked: true };
  }
  if (!workspace?.project || workspace.builtinSystemId) return { deviceId: '', links: [], locked: false };
  const deviceId = state.devices.some(device => device.id === workspace.boundDeviceId) ? workspace.boundDeviceId! : '';
  const links = deviceId ? [] : (workspace.tiangongLinks || []).filter(link => link.enabled !== false && link.read && state.tiangongResources?.some(resource => resource.id === link.resourceId && resource.verifiedAt)).slice(0, 1);
  return { deviceId, links, locked: Boolean(deviceId || links.length) };
}

export function canConfigureChatResources(state: WorkbenchState, workspace?: Workspace) {
  return !workspace?.builtinSystemId && !projectChatResources(state, workspace).locked;
}

export function currentChatConnection(state: WorkbenchState, workspace?: Workspace, task?: AgentTask) {
  const inherited = projectChatResources(state, workspace);
  const deviceId = inherited.locked ? inherited.deviceId : task?.deviceId;
  const links = inherited.locked ? inherited.links : task?.tiangongLinks || [];
  const device = state.devices.find(device => device.id === deviceId);
  if (device) return {
    type: 'device' as const, id: device.id, locked: inherited.locked,
    name: device.name.includes(device.address) ? device.name : `${device.name} · ${device.address}`,
    address: device.webConnection?.url || (device.connection ? `SSH · ${device.connection.username}@${device.connection.host}:${device.connection.port}` : device.address),
    status: device.connected ? '在线' : '离线',
  };
  const link = links.find(link => link.enabled !== false && link.read);
  const park = state.tiangongResources?.find(resource => resource.id === link?.resourceId);
  if (park) {
    let host = park.url;
    try { host = new URL(park.url).host; } catch { /* Keep saved connection text readable. */ }
    return { type: 'park' as const, id: park.id, locked: inherited.locked, name: `${park.parkName} · ${host}`, address: park.url, status: '已关联' };
  }
  return undefined;
}
