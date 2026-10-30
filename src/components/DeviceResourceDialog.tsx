import { useEffect, useRef, useState } from 'react';
import { Cpu, Loader2 } from 'lucide-react';
import AgentResourceModal from './AgentResourceModal';
import { builtinSystems, type BuiltinSystemId } from './agentBuiltinSystems';
import { saveWebDeviceResource, verifyWebDeviceResource, type WebDeviceVerification } from './agentWebDeviceResources';
import { associateTaskDevice } from './agentDeviceConnections';
import type { UpdateState, WorkbenchState } from './agentWorkbenchState';

export default function DeviceResourceDialog({ state, update, systemId, initialDeviceId, taskId, close, saved, connectionOnly = false }: { state: WorkbenchState; update: UpdateState; systemId?: BuiltinSystemId; initialDeviceId?: string; taskId?: string; connectionOnly?: boolean; close: () => void; saved: (id: string) => void }) {
  const device = state.devices.find(device => device.id === initialDeviceId);
  const [url, setUrl] = useState(device?.webConnection?.url || (device ? `http://${device.address}` : ''));
  const [account, setAccount] = useState(device?.webConnection?.account || '');
  const [password, setPassword] = useState('');
  const [proof, setProof] = useState<WebDeviceVerification | null>(null);
  const [selectedId, setSelectedId] = useState('');
  const [testing, setTesting] = useState(false); const [error, setError] = useState('');
  const request = useRef(0); useEffect(() => () => { request.current++; }, []);
  const verify = async () => {
    const ticket = ++request.current; setTesting(true); setError('');
    const result = await verifyWebDeviceResource(state, { url, account, password, systemId: systemId || device?.systemId });
    if (ticket !== request.current) return;
    setTesting(false); setPassword('');
    if (!result.verification) { setError(result.error || '验证失败'); return; }
    setProof(result.verification); setSelectedId(result.verification.devices[0]?.id || '');
  };
  const save = () => {
    if (!proof) return;
    const preview = structuredClone(state); const input = { verificationId: proof.id, deviceId: selectedId, editingId: initialDeviceId };
    const result = saveWebDeviceResource(preview, input);
    if (!result.device) { setProof(null); setError(result.error || '无法保存设备'); return; }
    if (taskId) { const problem = associateTaskDevice(preview, taskId, result.device.id); if (problem) { setError(problem); return; } }
    update(draft => { const current = saveWebDeviceResource(draft, input); if (current.device && taskId) associateTaskDevice(draft, taskId, current.device.id); });
    saved(result.device.id);
  };
  return <AgentResourceModal title={device ? connectionOnly ? '编辑设备' : '编辑设备关联' : '新增设备关联'} close={close} className="aw-tiangong-link-dialog aw-resource-editor-dialog"><form onSubmit={event => { event.preventDefault(); if (proof) save(); else void verify(); }}><div className="aw-modal-body aw-form">
    {!proof ? <><label>设备服务 URL<input aria-label="设备服务 URL" value={url} disabled={testing} onChange={event => setUrl(event.target.value)} placeholder="http://192.168.1.103" /></label><div className="aw-form-grid"><label>账号<input aria-label="设备账号" autoComplete="off" value={account} disabled={testing} onChange={event => setAccount(event.target.value)} placeholder="请输入账号" /></label><label>密码<input aria-label="设备密码" type="password" autoComplete="new-password" value={password} disabled={testing} onChange={event => setPassword(event.target.value)} placeholder="请输入密码" /></label></div></> : <><div className="aw-tiangong-account-card"><Cpu size={18} /><div><strong>账号验证成功</strong><p>{proof.url}</p><p>{builtinSystems.find(system => system.id === proof.systemId)?.name}</p></div></div><div className="aw-field-help">{connectionOnly ? '选择设备' : '选择要关联的设备'}</div><div className="aw-tiangong-park-list">{proof.devices.map(item => <label key={item.id}><input type="radio" name="verified-device" checked={selectedId === item.id} onChange={() => setSelectedId(item.id)} /><Cpu size={18} /><span><strong>{item.name}</strong><small>{item.address}</small></span></label>)}</div></>}
    {error && <p className="aw-form-error" role="alert">{error}</p>}
  </div><div className="aw-modal-footer"><button type="button" className="aw-button" onClick={close}>取消</button><button type="submit" className="aw-button aw-primary" disabled={testing || Boolean(proof && !selectedId)}>{testing && <Loader2 size={13} className="aw-spin" />}{testing ? '正在验证…' : proof ? connectionOnly ? '保存' : '关联设备' : '验证账号'}</button></div></form></AgentResourceModal>;
}
