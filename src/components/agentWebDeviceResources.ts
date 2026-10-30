import { isPlatformAdmin, type BuiltinSystemId } from './agentBuiltinSystems';
import { normalizeTiangongUrl } from './agentTiangongResources';
import { deviceConnectionIdentity, now, uid, type Device, type WorkbenchState } from './agentWorkbenchState';

type DeviceSystem = Exclude<BuiltinSystemId, 'tiangong'>;
export type WebDeviceVerification = { id: string; url: string; account: string; systemId: DeviceSystem; expiresAt: number; devices: { id: string; name: string; address: string }[] };
const verifications = new Map<string, WebDeviceVerification>();
// Prototype adapter: only example credentials are accepted; no request or password persistence.
export async function verifyWebDeviceResource(state: WorkbenchState, input: { url: string; account: string; password: string; systemId?: BuiltinSystemId }) {
  const url = normalizeTiangongUrl(input.url);
  if (!url) return { error: '请输入完整的 HTTP / HTTPS 设备服务地址。' };
  if (!input.account.trim() || !input.password) return { error: '请输入账号和密码。' };
  if (input.account.trim() !== 'demo' || input.password !== 'demo123') return { error: '账号或密码不正确，请重新输入。' };
  const host = new URL(url).hostname;
  const existing = state.devices.filter(device => device.address === host);
  const systemId: DeviceSystem = input.systemId && input.systemId !== 'tiangong' ? input.systemId : existing.find(device => device.systemId)?.systemId || (/digital|zaoji|数字造机/.test(url) ? 'digital-machine' : /zhuangji|installation|装机/.test(url) ? 'baichuan-zhuangji' : 'baichuan-qingda');
  const proof: WebDeviceVerification = { id: uid('device-verification'), url, account: input.account.trim(), systemId, expiresAt: Date.now() + 10 * 60 * 1000, devices: existing.length ? existing.map(device => ({ id: device.id, name: device.name, address: device.address })) : [{ id: uid('device'), name: `设备 ${host}`, address: host }] };
  verifications.set(proof.id, proof);
  return { verification: structuredClone(proof) };
}
export function saveWebDeviceResource(state: WorkbenchState, input: { verificationId: string; deviceId: string; editingId?: string }) {
  if (!isPlatformAdmin(state)) return { error: '设备连接由管理员维护。' };
  const proof = verifications.get(input.verificationId);
  const selected = proof?.devices.find(device => device.id === input.deviceId);
  if (!proof || proof.expiresAt <= Date.now() || !selected) return { error: '验证已失效，请重新验证账号。' };
  if (input.editingId && !state.devices.some(device => device.id === input.editingId)) return { error: '设备不存在，请重新打开编辑。' };
  if (input.editingId && selected.id !== input.editingId && state.devices.some(device => device.id === selected.id)) return { error: '此连接已属于另一台设备，请使用已有设备。' };
  let device = state.devices.find(device => device.id === (input.editingId || selected.id));
  if (!device) { device = { ...selected, model: '设备', connected: false }; state.devices.push(device); }
  if (device.webConnection && (device.webConnection.url !== proof.url || device.webConnection.account !== proof.account)) {
    state.terminals.filter(session => session.deviceId === device!.id && !session.connectionIdentity).forEach(session => { session.connectionIdentity = deviceConnectionIdentity(device); });
    state.calls.filter(call => call.deviceId === device!.id && !call.executions && ['queued', 'pending', 'blocked'].includes(call.status)).forEach(call => { call.status = 'denied'; call.approved = false; call.output = '设备服务连接已变更，旧操作已取消。'; });
    state.tasks.filter(task => task.deviceId === device!.id && ['running', 'authorization'].includes(task.status)).forEach(task => { task.status = 'stopped'; });
  }
  if (device.address !== selected.address) { device.address = selected.address; device.name = selected.name; }
  device.systemId = proof.systemId;
  device.webConnection = { url: proof.url, account: proof.account, verifiedAt: now(), mode: 'simulation' };
  device.connected = true; device.lastConnected = true;
  return { device };
}
