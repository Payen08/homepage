import { useEffect, useRef, useState } from 'react';
import { Building2, CheckCircle2, Cpu, Loader2, Pencil, Plus } from 'lucide-react';
import { associateTaskDevice, emptySshDraft, saveSshDevice, sshDraftSignature, testSshConnection, type SshDeviceDraft, type SshVerification } from './agentDeviceConnections';
import { builtinSystemBlockReason, isPlatformAdmin } from './agentBuiltinSystems';
import { effectiveTiangongLinks, setTiangongScopeLinks, tiangongResourceAccess, tiangongResourceStatus, type TiangongLink, type TiangongScope } from './agentTiangongResources';
import DeviceResourceDialog from './DeviceResourceDialog';
import AgentResourceModal from './AgentResourceModal';
import TiangongResourceDialog from './TiangongResourceDialog';
import { isDeviceChatWorkspace, projectChatResources, workspaceChatResourceType } from './agentChatResources';
import { setProjectDevice, type AgentTask, type Device, type UpdateState, type WorkbenchState } from './agentWorkbenchState';

export type DraftResourceSelection = { workspaceId?: string; readOnly?: boolean; deviceId: string; selectDevice: (id: string) => void; links: TiangongLink[]; targetId?: string; saveLinks: (links: TiangongLink[], targetId?: string) => void };
export default function TaskDeviceDialog({ state, update, task, scope, draftSelection, close, notify, connectionOnly = false, initialDeviceId, resourceType: requestedResourceType, onSelected, systemId, initialParkResourceId, readOnly = false }: {
  state: WorkbenchState; update: UpdateState; task?: AgentTask; initialParkResourceId?: string; readOnly?: boolean; scope?: TiangongScope; draftSelection?: DraftResourceSelection; resourceType?: 'park' | 'device'; systemId?: import('./agentBuiltinSystems').BuiltinSystemId; onSelected?: () => void; connectionOnly?: boolean; initialDeviceId?: string; close: () => void; notify: (text: string) => void;
}) {
  const request = useRef(0);
  const [step, setStep] = useState<'list' | 'ssh' | 'park' | 'web-device'>(connectionOnly ? state.devices.find(device => device.id === initialDeviceId)?.webConnection ? 'web-device' : 'ssh' : initialParkResourceId ? 'park' : 'list');
  const [parkEditing, setParkEditing] = useState<string | undefined>(initialParkResourceId);
  const [parkIntent, setParkIntent] = useState<'associate' | 'edit'>('associate');
  const [editingId, setEditingId] = useState<string | undefined>(initialDeviceId);
  const [draft, setDraft] = useState<SshDeviceDraft>(() => { const device = state.devices.find(item => item.id === initialDeviceId); return device ? { method: 'SSH', model: device.connection ? device.model : device.name, host: device.connection?.host || device.address, port: String(device.connection?.port || 22), username: device.connection?.username || '', password: '' } : emptySshDraft(); });
  const [testing, setTesting] = useState(false); const [saving, setSaving] = useState(false);
  const [verification, setVerification] = useState<SshVerification | null>(null); const [error, setError] = useState('');
  useEffect(() => () => { request.current++; }, []);
  const admin = isPlatformAdmin(state);
  const resourceScope: TiangongScope = scope || (task ? { kind: 'task', workspaceId: task.workspaceId, taskId: task.id } : { kind: 'library' });
  const workspaceId = resourceScope.kind === 'library' ? draftSelection?.workspaceId : resourceScope.workspaceId;
  const workspace = state.workspaces.find(item => item.id === workspaceId);
  const inherited = projectChatResources(state, workspace);
  const links = draftSelection?.links || (resourceScope.kind === 'project' ? workspace?.tiangongLinks || [] : effectiveTiangongLinks(state, task?.workspaceId, task));
  const boundDeviceId = inherited.locked ? inherited.deviceId : draftSelection?.deviceId || task?.deviceId || workspace?.boundDeviceId;
  const locked = readOnly || Boolean(draftSelection?.readOnly) || isDeviceChatWorkspace(workspace) || Boolean((task || draftSelection) && inherited.locked);
  const resourceType = workspaceChatResourceType(workspace) || (locked && inherited.locked ? inherited.deviceId ? 'device' : 'park' : requestedResourceType);
  const taskMode = Boolean(task || draftSelection);
  const change = (key: keyof SshDeviceDraft, value: string) => { request.current++; setDraft(previous => ({ ...previous, [key]: value })); setVerification(null); setError(''); };
  const configure = (device?: Device) => {
    if (!admin || locked) return;
    if (device?.webConnection || (!device && !connectionOnly)) { setEditingId(device?.id); setStep('web-device'); return; }
    setDraft(device ? { method: 'SSH', model: device.connection ? device.model : device.name, host: device.connection?.host || device.address, port: String(device.connection?.port || 22), username: device.connection?.username || '', password: '' } : emptySshDraft());
    setEditingId(device?.id); setVerification(null); setError(''); setStep('ssh');
  };
  const associate = (deviceId: string | null) => {
    if (locked) return;
    if (draftSelection) { draftSelection.selectDevice(deviceId || ''); setError(''); onSelected?.(); return; }
    if (task) {
      const problem = associateTaskDevice(structuredClone(state), task.id, deviceId);
      if (problem) { setError(problem); return; }
      update(next => { associateTaskDevice(next, task.id, deviceId); });
    } else if (workspace?.project) update(next => { setProjectDevice(next, workspace.id, deviceId); });
    setError(''); onSelected?.(); notify(deviceId ? '设备关联已更新' : '设备已解绑，相关操作需重新关联设备后执行');
  };
  const unlinkProjectDevice = (_deviceId: string) => { if (!locked && workspace) update(next => { setProjectDevice(next, workspace.id, null); }); };
  const saveLinks = (nextLinks: TiangongLink[], nextTarget?: string) => {
    if (locked) return;
    if (taskMode && nextLinks.length > 1) { setError('每个任务最多关联一个园区。'); return; }
    if (draftSelection) { draftSelection.saveLinks(nextLinks, nextLinks[0]?.resourceId); setError(''); onSelected?.(); return; }
    const problem = setTiangongScopeLinks(structuredClone(state), resourceScope, nextLinks, nextTarget);
    if (problem) { setError(problem); return; }
    update(next => { setTiangongScopeLinks(next, resourceScope, nextLinks, nextTarget); }); setError(''); onSelected?.();
  };
  const test = async () => {
    const id = ++request.current; setTesting(true); setError(''); setVerification(null);
    const result = await testSshConnection({ ...draft }, state.settings.connectionTimeout || 15);
    if (id !== request.current) return null;
    setTesting(false); setVerification(result); if (!result.success) setError(result.message); return result;
  };
  const verified = Boolean(verification?.success && verification.signature === sshDraftSignature(draft));
  const save = async () => {
    if (!admin || saving || testing) return;
    setSaving(true); const proof = verified ? verification : await test(); if (!proof) return;
    if (!proof.success) { setSaving(false); return; }
    const result = saveSshDevice(structuredClone(state), draft, proof, editingId);
    if (!result.device) { setError(result.error || '无法保存设备'); setSaving(false); return; }
    const id = result.device.id;
    update(next => { const saved = saveSshDevice(next, draft, proof, editingId, id); if (saved.device && task) associateTaskDevice(next, task.id, saved.device.id); if (saved.device && workspace?.project && !task && !draftSelection) setProjectDevice(next, workspace.id, saved.device.id); });
    draftSelection?.selectDevice(id); setSaving(false); setDraft(emptySshDraft()); setStep('list');
    notify('设备连接已保存'); if (connectionOnly) close(); else onSelected?.();
  };
  const scopeLabel = connectionOnly ? state.devices.find(device => device.id === editingId)?.name || '设备连接' : task?.title || workspace?.name || '新 Agent 任务';
  const closeEditor = () => { request.current++; setTesting(false); setSaving(false); setError(''); setVerification(null); if (connectionOnly) close(); else setStep('list'); };
  return <>
    {!connectionOnly && <AgentResourceModal title={resourceType === 'park' ? '选择园区' : resourceType === 'device' ? '选择设备' : '关联配置'} subtitle={`${scopeLabel} · ${resourceType === 'park' ? '选择当前任务使用的园区' : resourceType === 'device' ? '选择当前任务使用的设备' : taskMode ? '关联仅作用于当前聊天，可选择园区或设备' : '项目资源由组内聊天只读继承'}`} close={close} className="aw-device-dialog aw-resource-association-dialog">
      <div className="aw-modal-body aw-device-picker">
        {locked && <p className="aw-field-help">继承自项目组，需在项目组中更换或解除关联。</p>}
        {resourceType !== 'park' && (!locked || boundDeviceId) && <><div className="aw-device-picker-heading"><span>设备连接</span>{admin && !locked && <button className="aw-button" onClick={() => configure()}><Plus size={13} />{resourceType === 'device' ? '新增关联' : '新增设备关联'}</button>}</div>
        <div className="aw-device-connection-list">{state.devices.filter(device => !locked || device.id === boundDeviceId).map(device => {
          const linked = taskMode ? device.id === boundDeviceId : device.id === workspace?.boundDeviceId;
          return <div className="aw-device-connection-row" key={device.id}><Cpu size={17} /><div><strong>{device.name}</strong><small>{device.webConnection ? device.webConnection.url : device.connection ? `SSH · ${device.connection.username}@${device.connection.host}:${device.connection.port}` : `${device.address} · 尚未配置连接`}</small></div><span className={`aw-badge ${device.connected ? 'success' : 'muted'}`}>{device.connected ? '在线' : '离线'}</span><button className="aw-button" disabled={locked} aria-label={`${locked ? '查看项目组关联' : linked ? '解绑' : '关联'}设备 ${device.name}`} onClick={() => linked && !taskMode ? unlinkProjectDevice(device.id) : associate(linked ? null : device.id)}>{locked ? '继承关联' : linked ? '解绑' : '关联'}</button>{admin && !locked && <button className="aw-icon-button" aria-label={`编辑设备 ${device.name}`} onClick={() => configure(device)}><Pencil size={14} /></button>}</div>;
        })}</div></>}
        {resourceType !== 'device' && (!locked || links.length > 0) && <><div className={`aw-device-picker-heading ${resourceType === 'park' ? '' : 'aw-park-picker-heading'}`}><span>天工园区</span>{admin && !locked && <button className="aw-button" onClick={() => { setParkEditing(undefined); setStep('park'); }}><Plus size={13} />{resourceType === 'park' ? '新增关联' : '新增关联园区'}</button>}</div>
        {state.tiangongResources?.length ? <div className="aw-device-connection-list">{state.tiangongResources.filter(resource => !locked || links.some(link => link.resourceId === resource.id)).map(resource => {
          const linked = links.some(link => link.resourceId === resource.id);
          const access = tiangongResourceAccess(resource);
          return <div className="aw-device-connection-row aw-park-connection-row" key={resource.id}><Building2 size={17} /><div><strong>{resource.parkName}</strong><small className="aw-park-connection-url">内网连接：{resource.url}</small><small>{tiangongResourceStatus(resource)} · 账号 {resource.account}</small></div><span className="aw-badge muted">{!access ? resource.verifiedAt ? '已验证' : '未验证' : access.write && !builtinSystemBlockReason(state, 'tiangong', true) ? '可读取与修改' : '只读'}</span><button className="aw-button" disabled={locked || (!linked && !access && !admin)} aria-label={`${locked ? '查看项目组关联' : linked ? '解绑' : '关联'}园区 ${resource.parkName}`} onClick={() => {
            if (linked) { saveLinks(links.filter(item => item.resourceId !== resource.id)); return; }
            if (access) { const selected = { resourceId: resource.id, read: true, write: Boolean(access.write && !builtinSystemBlockReason(state, 'tiangong', true)) }; saveLinks([selected]); return; }
            setParkIntent('associate'); setParkEditing(resource.id); setStep('park');
          }}>{locked ? '继承关联' : linked ? '解绑' : '关联'}</button>{admin && !locked && <button className="aw-icon-button" aria-label={`编辑园区 ${resource.parkName}`} onClick={() => { setParkIntent('edit'); setParkEditing(resource.id); setStep('park'); }}><Pencil size={14} /></button>}</div>;
        })}</div> : <div className="aw-resource-list-empty">暂无园区，点击“新增关联”添加。</div>}</>}
        {error && <p className="aw-form-error" role="alert">{error}</p>}
      </div>
    </AgentResourceModal>}
    {step === 'ssh' && <AgentResourceModal title={editingId ? connectionOnly ? '编辑设备' : '编辑设备连接' : '新增设备连接'} subtitle={scopeLabel} close={closeEditor} className="aw-device-dialog aw-resource-editor-dialog"><form onSubmit={event => { event.preventDefault(); void save(); }}><div className="aw-modal-body aw-form"><div className="aw-form-grid"><label>连接方式<select aria-label="连接方式" value="SSH" disabled><option>SSH</option></select></label><label>开发板型号<input aria-label="开发板型号" value={draft.model} disabled={testing || !admin} onChange={event => change('model', event.target.value)} placeholder="例如：RDK X3" /></label></div><div className="aw-form-grid aw-device-address-fields"><label>设备地址（IP / Host）<input aria-label="设备地址" autoComplete="off" value={draft.host} disabled={testing || !admin} onChange={event => change('host', event.target.value)} placeholder="例如：192.168.1.103" /></label><label>端口<input aria-label="端口" inputMode="numeric" value={draft.port} disabled={testing || !admin} onChange={event => change('port', event.target.value)} /></label></div><div className="aw-form-grid"><label>用户名<input aria-label="用户名" autoComplete="off" value={draft.username} disabled={testing || !admin} onChange={event => change('username', event.target.value)} placeholder="SSH 用户名" /></label><label>密码<input aria-label="密码" type="password" autoComplete="new-password" value={draft.password} disabled={testing || !admin} onChange={event => change('password', event.target.value)} placeholder="输入密码" /></label></div><p className="aw-field-help">保存时自动测试连接。</p>{verified && <div className="aw-device-test-result" role="status"><CheckCircle2 size={15} />{verification?.message}</div>}{error && <p className="aw-form-error" role="alert">{error}</p>}</div><div className="aw-modal-footer"><button type="button" className="aw-button" onClick={closeEditor} disabled={testing || saving}>取消</button><button type="button" className="aw-button" onClick={() => void test()} disabled={testing || saving || !admin}>{testing && <Loader2 size={13} className="aw-spin" />}测试连接</button><button type="submit" className="aw-button aw-primary" disabled={testing || saving || !admin}>{saving ? '验证并保存…' : connectionOnly ? '保存' : '保存并关联'}</button></div></form></AgentResourceModal>}
    {step === 'web-device' && <DeviceResourceDialog connectionOnly={connectionOnly} state={state} update={update} systemId={systemId || workspace?.builtinSystemId} initialDeviceId={editingId} taskId={task?.id} close={closeEditor} saved={id => { if (workspace?.project && !task && !draftSelection) update(next => { setProjectDevice(next, workspace.id, id); }); draftSelection?.selectDevice(id); setStep('list'); notify(connectionOnly ? '设备信息已保存' : draftSelection ? '已选择设备，发送消息后关联' : '设备已关联'); if (connectionOnly) close(); else onSelected?.(); }} />}
    {step === 'park' && <TiangongResourceDialog onLinked={onSelected} intent={parkIntent} initialResourceId={parkEditing} state={state} update={update} scope={resourceScope} close={() => setStep('list')} notify={notify} draftSelection={draftSelection ? { links, save: saveLinks } : undefined} />}
  </>;
}
