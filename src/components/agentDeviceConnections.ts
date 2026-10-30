import { deviceConnectionIdentity, ensureTaskTerminal, syncTaskResourceSystem, message, now, uid, type Device, type WorkbenchState } from './agentWorkbenchState';
import { projectChatResources } from './agentChatResources';
import { builtinSystemForWorkspace, isPlatformAdmin } from './agentBuiltinSystems';
import { taskRequiresDevice } from './agentBuiltinMcpServices';

export type SshDeviceDraft = { method: 'SSH'; model: string; host: string; port: string; username: string; password: string };
export type SshVerification = { success: boolean; signature: string; testedAt: string; message: string; mode: 'simulation' };
export const emptySshDraft = (): SshDeviceDraft => ({ method: 'SSH', model: 'RDK X3', host: '', port: '22', username: '', password: '' });
export const sshDraftSignature = (draft: SshDeviceDraft) => JSON.stringify([draft.method, draft.model.trim(), draft.host.trim(), draft.port, draft.username.trim(), draft.password]);

export function validateSshDraft(draft: SshDeviceDraft) {
  if (draft.method !== 'SSH') return '请选择 SSH 连接方式。';
  if (!draft.model.trim()) return '请填写开发板型号。';
  const host = draft.host.trim();
  if (!host || !/^[a-zA-Z0-9][a-zA-Z0-9.-]{0,251}[a-zA-Z0-9]$|^[a-zA-Z0-9]$/.test(host)) return '请输入有效的设备 IP 或主机名，不包含协议、路径或端口。';
  if (/^\d+(\.\d+){3}$/.test(host) && host.split('.').some(part => Number(part) > 255)) return '设备 IP 地址格式不正确。';
  const port = Number(draft.port);
  if (!/^\d+$/.test(draft.port) || !Number.isInteger(port) || port < 1 || port > 65535) return '端口应为 1–65535 之间的整数。';
  if (!/^[a-zA-Z0-9_.-]+$/.test(draft.username.trim())) return '请填写有效的 SSH 用户名。';
  if (!draft.password) return '请填写密码。';
  return '';
}

// The prototype has no SSH gateway. Never report this result as a real handshake.
export async function testSshConnection(draft: SshDeviceDraft, timeoutSeconds = 15): Promise<SshVerification> {
  const signature = sshDraftSignature(draft);
  const error = validateSshDraft(draft);
  if (error) return { success: false, signature, testedAt: now(), message: error, mode: 'simulation' };
  await new Promise(resolve => setTimeout(resolve, 400));
  if (draft.host.trim().endsWith('.timeout')) return { success: false, signature, testedAt: now(), message: `演示连接超时（${timeoutSeconds} 秒），请检查设备地址或调整连接超时。`, mode: 'simulation' };
  const unavailable = ['0.0.0.0', '255.255.255.255'].includes(draft.host.trim()) || draft.host.trim().endsWith('.invalid');
  return { success: !unavailable, signature, testedAt: now(), message: unavailable ? '演示测试未通过，请检查设备地址。' : '演示连接测试通过，可以保存并关联。', mode: 'simulation' };
}

export function saveSshDevice(state: WorkbenchState, draft: SshDeviceDraft, verification: SshVerification | null, editingId?: string, proposedId?: string): { device?: Device; error?: string } {
  if (!isPlatformAdmin(state)) return { error: '只有管理员可以新增或编辑设备连接。' };
  const error = validateSshDraft(draft);
  if (error) return { error };
  if (!verification?.success || verification.signature !== sshDraftSignature(draft)) return { error: '连接配置已变化，请先重新测试连接。' };
  const connection = { method: 'SSH' as const, host: draft.host.trim(), port: Number(draft.port), username: draft.username.trim(), testedAt: verification.testedAt, mode: 'simulation' as const };
  let device = editingId ? state.devices.find(device => device.id === editingId) : state.devices.find(device => device.model === draft.model.trim() && device.connection?.host === connection.host && device.connection.port === connection.port && device.connection.username === connection.username);
  if (device) {
    if (device.connection && JSON.stringify([device.connection.host, device.connection.port, device.connection.username]) !== JSON.stringify([connection.host, connection.port, connection.username])) {
      state.terminals.filter(session => session.deviceId === device!.id && !session.connectionIdentity).forEach(session => { session.connectionIdentity = deviceConnectionIdentity(device); });
      state.calls.filter(call => call.deviceId === device!.id && call.executions === 0 && ['queued', 'pending', 'blocked'].includes(call.status)).forEach(call => { call.status = 'denied'; call.approved = false; call.output = '设备连接配置已更改，原连接的待执行操作已取消。'; });
      state.tasks.filter(task => task.deviceId === device!.id && ['running', 'authorization'].includes(task.status)).forEach(task => { task.status = 'stopped'; });
      state.changes.filter(change => change.deviceId === device!.id && ['pending', 'conflict'].includes(change.status)).forEach(change => { change.status = 'rejected'; });
    }
    device.connection = connection; device.connected = true; device.lastConnected = true; device.model = draft.model.trim(); device.address = connection.host; device.name = `${device.model} · ${connection.host}`;
  }
  else {
    device = { id: proposedId || uid('device'), name: `${draft.model.trim()} · ${connection.host}`, model: draft.model.trim(), address: connection.host, connected: true, lastConnected: true, connection };
    state.devices.push(device);
  }
  return { device };
}

export function associateTaskDevice(state: WorkbenchState, taskId: string, deviceId: string | null) {
  const task = state.tasks.find(task => task.id === taskId && !task.archived);
  const workspace = state.workspaces.find(workspace => workspace.id === task?.workspaceId && !workspace.archived);
  if (!task || !workspace) return '当前任务不可用。';
  if (projectChatResources(state, workspace).locked) return '资源继承自项目组，请在项目组中修改关联。';
  if (deviceId && (workspace.builtinSystemId === 'tiangong')) return '天工系统只支持关联园区，不能关联设备。';
  const device = deviceId ? state.devices.find(device => device.id === deviceId) : null;
  if (deviceId && !device) return '设备连接不存在。';
  if (task.deviceId === deviceId) return '';
  const previousDeviceId = task.deviceId;
  const previousName = state.devices.find(device => device.id === previousDeviceId)?.name;
  const cancelled = state.calls.filter(call => previousDeviceId && call.taskId === task.id && call.deviceId === previousDeviceId && call.deviceId !== deviceId && call.executions === 0 && ['queued', 'pending', 'blocked'].includes(call.status));
  cancelled.forEach(call => { call.status = 'denied'; call.approved = false; call.output = '任务设备关联已更新，本次原设备操作已取消，未执行。'; });
  state.changes.filter(change => previousDeviceId && change.taskId === task.id && change.deviceId === previousDeviceId && change.deviceId !== deviceId && ['pending', 'conflict'].includes(change.status)).forEach(change => { change.status = 'rejected'; });
  task.deviceId = deviceId;
  if (deviceId) { task.tiangongLinks = []; task.tiangongTargetId = undefined; }
  syncTaskResourceSystem(state, task.id);
  (task.deviceHistory ||= []).push({ previousDeviceId, deviceId, time: now() });
  if (deviceId && !workspace.deviceIds.includes(deviceId)) workspace.deviceIds.push(deviceId);
  if ((cancelled.length || (!deviceId && taskRequiresDevice(state, task))) && ['running', 'authorization'].includes(task.status)) task.status = 'stopped';
  task.messages.push(message('system', device ? previousDeviceId ? `已更换关联设备：${previousName} → ${device.name}。未完成的原设备操作已取消，历史记录保留。` : `已关联设备：${device.name}。本任务后续设备操作使用此连接。` : '已解除当前设备关联。未完成的原设备操作已取消，历史记录保留。'));
  if (workspace.panel.open && workspace.panel.tab === 'terminal') ensureTaskTerminal(state, workspace.id, task.id);
  const file = state.files.find(file => file.id === workspace.panel.fileId);
  if (file?.deviceId && file.deviceId !== deviceId) workspace.panel.fileId = null;
  return '';
}
