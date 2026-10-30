import { associateTaskDevice } from './agentDeviceConnections';
import { setTiangongScopeLinks, tiangongResourceAccess, type TiangongLink } from './agentTiangongResources';
import type { WorkbenchState } from './agentWorkbenchState';

export type PendingChatResource = { deviceId: string; tiangongLinks: TiangongLink[] };
export type ResourceMention = { id: string; type: 'park' | 'device'; name: string; address: string; needsAuthentication: boolean };

export function normalizeResourceQuery(query: string) {
  return query.normalize('NFKC').replace(/[\u200B-\u200D\uFEFF]/g, '').trim().toLowerCase();
}

export function resourceSlashRange(textBeforeCaret: string) {
  const match = /(?:^|\s)[/／]([^\n/／]*)$/.exec(textBeforeCaret);
  return match ? { query: normalizeResourceQuery(match[1]), start: match.index + match[0].length - match[1].length - 1, end: textBeforeCaret.length } : undefined;
}

export function findResourceMentions(state: WorkbenchState, query: string, types: readonly ('park' | 'device')[]) {
  const needle = normalizeResourceQuery(query);
  const devices: ResourceMention[] = types.includes('device') ? state.devices.map(device => ({
    id: device.id, type: 'device', name: device.name, address: device.webConnection?.url || device.address, needsAuthentication: false,
  })) : [];
  const parks: ResourceMention[] = types.includes('park') ? (state.tiangongResources || [])
    .filter(resource => resource.verifiedAt && resource.permissions?.read !== false)
    .map(resource => ({ id: resource.id, type: 'park', name: resource.parkName, address: resource.url, needsAuthentication: !tiangongResourceAccess(resource) })) : [];
  return [...devices, ...parks].filter(resource => normalizeResourceQuery(`${resource.name} ${resource.address}`).includes(needle)).slice(0, 12);
}

// Selecting an autocomplete result creates a draft; it never changes a task or executes a tool.
export function resourceMentionDraft(state: WorkbenchState, type: 'park' | 'device', id: string): PendingChatResource | undefined {
  if (type === 'device') return state.devices.some(device => device.id === id) ? { deviceId: id, tiangongLinks: [] } : undefined;
  const resource = state.tiangongResources?.find(resource => resource.id === id && resource.verifiedAt);
  const access = resource && tiangongResourceAccess(resource);
  return access?.read ? { deviceId: '', tiangongLinks: [{ resourceId: id, read: true, write: access.write }] } : undefined;
}

export function commitPendingChatResource(state: WorkbenchState, taskId: string, selection?: PendingChatResource) {
  if (!selection) return '';
  if (selection.deviceId) {
    if (selection.tiangongLinks.length) return '只能选择一个园区或一台设备。';
    return associateTaskDevice(state, taskId, selection.deviceId);
  }
  const resource = state.tiangongResources?.find(resource => resource.id === selection.tiangongLinks[0]?.resourceId);
  if (selection.tiangongLinks.length !== 1 || !resource || !tiangongResourceAccess(resource)?.read) return '请先验证园区账号，再发送消息。';
  const task = state.tasks.find(task => task.id === taskId);
  return task ? setTiangongScopeLinks(state, { kind: 'task', workspaceId: task.workspaceId, taskId }, selection.tiangongLinks, resource.id) : '当前聊天不存在。';
}
