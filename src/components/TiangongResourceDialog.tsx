import { builtinSystemBlockReason } from './agentBuiltinSystems';
import { useEffect, useRef, useState } from 'react';
import { Building2, KeyRound, Loader2, Monitor, Plus, Unplug } from 'lucide-react';
import AgentResourceModal from './AgentResourceModal';
import { disconnectTiangongResource, saveTiangongResource, setTiangongScopeLinks, tiangongResourceAccess, tiangongResourceStatus, tiangongScopeLinks, verifyTiangongPrototype, type TiangongLink, type TiangongScope, type TiangongSession } from './agentTiangongResources';
import { uid, type UpdateState, type WorkbenchState } from './agentWorkbenchState';

export function TiangongServiceStatus() {
  return <details className="aw-tiangong-service-status"><summary>服务接入状态<span>真实服务待接入</span></summary><div><p><KeyRound size={14} /><span>安全凭据与认证服务</span><small>待接入</small></p><p><Building2 size={14} /><span>账号可访问园区列表</span><small>待接入</small></p><p><Monitor size={14} /><span>可访问内网的 Agent 浏览器</span><small>待接入</small></p><p className="aw-field-help">实际环境通过安全凭据服务保存账号密码并复用授权会话，Agent 在可访问内网的浏览器中操作。当前仅提供明确标注的原型流程。</p></div></details>;
}

export function TiangongResourceSection({ state, update, scope, manage, notify }: { state: WorkbenchState; update: UpdateState; scope: TiangongScope; manage: () => void; notify: (text: string) => void }) {
  const links = tiangongScopeLinks(state, scope);
  const resources = state.tiangongResources || [];
  return <section className="aw-management-section aw-tiangong-resources"><div className="aw-management-section-heading"><h2>天工系统关联</h2><button className="aw-button" onClick={manage}><Plus size={14} />{scope.kind === 'library' ? '新增天工资源' : '关联天工系统'}</button></div><p className="aw-tiangong-section-description">每条资源对应一个 URL 与园区，可供项目及 Agent 任务关联。</p><TiangongServiceStatus />{resources.length ? <div className="aw-management-list">{resources.map(resource => <div className="aw-management-row" key={resource.id}><span className="aw-management-row-icon"><Building2 size={21} /></span><div className="aw-management-row-copy"><h3>{resource.parkName}</h3><p>{resource.url}</p><small>账号 {resource.account} · 园区 {resource.parkId}{links.some(link => link.resourceId === resource.id) ? ` · 已关联${scope.kind === 'project' ? '项目' : '当前任务'}` : ''}</small></div><span className="aw-badge muted">{tiangongResourceStatus(resource)}</span><div className="aw-management-row-actions"><button className="aw-button" onClick={manage}>查看与关联</button>{tiangongResourceAccess(resource) && <button className="aw-icon-button" aria-label={`断开天工资源 ${resource.parkName}`} onClick={() => { update(draft => disconnectTiangongResource(draft, resource.id)); notify('已断开此园区，项目与任务关联保留，后续调用需重新登录'); }}><Unplug size={15} /></button>}</div></div>)}</div> : <div className="aw-management-inline-empty">尚未添加天工资源，验证账号并选择园区后即可关联。</div>}</section>;
}

type DraftSelection = { links: TiangongLink[]; targetId?: string; save: (links: TiangongLink[], targetId?: string) => void };
export default function TiangongResourceDialog({ state, update, scope, close, notify, draftSelection, initialResourceId, platformManaged = false, intent = 'edit', onLinked }: { state: WorkbenchState; update: UpdateState; scope: TiangongScope; close: () => void; notify: (text: string) => void; draftSelection?: DraftSelection; initialResourceId?: string; platformManaged?: boolean; intent?: 'associate' | 'edit'; onLinked?: () => void }) {
  const initialResource = state.tiangongResources?.find(resource => resource.id === initialResourceId);
  const request = useRef(0);
  const [stage, setStage] = useState<'login' | 'parks'>('login');
  const [url, setUrl] = useState(initialResource?.url || (platformManaged ? 'http://tiangong.example.local' : ''));
  const [account, setAccount] = useState(initialResource?.account || '');
  const [password, setPassword] = useState('');
  const [session, setSession] = useState<TiangongSession | null>(null);
  const [parkId, setParkId] = useState(initialResource?.parkId || '');
  const [testing, setTesting] = useState(false);
  const [error, setError] = useState('');
  const links = draftSelection?.links || tiangongScopeLinks(state, scope);
  const taskScope = Boolean(draftSelection || scope.kind === 'task');
  const owner = scope.kind === 'task' ? state.tasks.find(task => task.id === scope.taskId) : undefined;
  const scopeLabel = draftSelection ? '新 Agent 任务' : scope.kind === 'task' ? owner?.title || '当前任务' : scope.kind === 'project' ? state.workspaces.find(workspace => workspace.id === scope.workspaceId)?.name || '当前项目' : '天工资源';
  useEffect(() => () => { request.current++; }, []);
  const verify = async () => {
    const ticket = ++request.current; setTesting(true); setError('');
    const result = await verifyTiangongPrototype(url, account, password);
    if (ticket !== request.current) return;
    setPassword(''); setTesting(false);
    if (!result.session) { setError(result.error || '账号验证失败'); return; }
    if (initialResource && !result.session.parks.some(park => park.id === initialResource.parkId)) { setError('该账号没有当前园区的访问权限，原关联保持不变。'); return; }
    setSession(result.session); setUrl(result.session.url);
    if (initialResource) { save(result.session, initialResource.parkId); return; }
    setParkId(result.session.parks.some(park => park.id === parkId) ? parkId : result.session.parks[0]?.id || '');
    setStage('parks');
  };
  const save = (verifiedSession = session, selectedParkId = parkId) => {
    if (!verifiedSession) { setStage('login'); setError('请先验证账号。'); return; }
    const input = { sessionRef: verifiedSession.id, url: verifiedSession.url, parkId: selectedParkId, proposedId: uid('tiangong-resource'), editingId: initialResource && intent === 'edit' ? initialResource.id : undefined };
    const preview = structuredClone(state);
    const result = saveTiangongResource(preview, input);
    if (!result.resource) { setStage('login'); setError(result.error || '请重新验证园区账号'); return; }
    const selected = { resourceId: result.resource.id, read: true, write: Boolean(verifiedSession.parks.find(park => park.id === selectedParkId)?.write && !builtinSystemBlockReason(state, 'tiangong', true)) };
    const nextLinks = taskScope ? [selected] : [...links.filter(link => link.resourceId !== selected.resourceId && link.resourceId !== initialResourceId), selected];
    const problem = draftSelection ? '' : setTiangongScopeLinks(preview, scope, nextLinks, taskScope ? selected.resourceId : undefined);
    if (problem) { setError(problem); return; }
    update(draft => { saveTiangongResource(draft, input); if (!draftSelection) setTiangongScopeLinks(draft, scope, nextLinks, taskScope ? selected.resourceId : undefined); });
    draftSelection?.save(nextLinks, selected.resourceId);
    notify(initialResource && intent === 'edit' ? '园区信息已更新' : draftSelection ? '已选择园区，发送消息后关联' : '园区已关联'); close(); onLinked?.();
  };
  return <AgentResourceModal title={initialResource ? intent === 'associate' ? '关联园区' : scope.kind === 'library' ? '编辑园区' : '编辑关联园区' : '新增关联园区'} subtitle={scopeLabel} close={close} className="aw-tiangong-link-dialog aw-resource-editor-dialog">
    <form onSubmit={event => { event.preventDefault(); if (stage === 'login') void verify(); else save(); }}>
      <div className="aw-modal-body aw-form">
        {stage === 'login' ? <>
          {initialResource && <div className="aw-tiangong-account-card"><Building2 size={18} /><div><strong>{initialResource.parkName}</strong><p>账号 {initialResource.account} · {scope.kind === 'library' ? '验证后保存园区信息' : '验证后保存关联配置'}</p></div></div>}
          <label>内网连接<input aria-label="天工内网连接" readOnly={platformManaged} disabled={testing} autoComplete="off" value={url} onChange={event => { setUrl(event.target.value); setError(''); }} placeholder="输入内网连接地址" /></label>
          <div className="aw-form-grid"><label>账号<input aria-label="天工账号" disabled={testing} autoComplete="off" value={account} onChange={event => { setAccount(event.target.value); setError(''); }} placeholder="请输入账号" /></label><label>密码<input aria-label="天工密码" disabled={testing} type="password" autoComplete="new-password" value={password} onChange={event => { setPassword(event.target.value); setError(''); }} placeholder="输入密码" /></label></div>
        </> : <>
          <div className="aw-tiangong-account-card"><KeyRound size={18} /><div><strong>账号 {session?.account} · 验证成功</strong><p className="aw-park-connection-url">内网连接：{session?.url}</p><p>{taskScope ? '当前任务只能关联一个园区，更换后替代原关联' : '园区权限沿用当前账号权限'}</p></div><button type="button" className="aw-button" onClick={() => { setStage('login'); setSession(null); setError(''); }}>重新验证</button></div>
          <div className="aw-field-help">选择有权限访问的园区</div><div className="aw-tiangong-park-list">{session?.parks.map(park => <label key={park.id}><input type="radio" name="tiangong-park" aria-label={`选择园区 ${park.name}`} checked={parkId === park.id} onChange={() => { setParkId(park.id); setError(''); }} /><Building2 size={18} /><span><strong>{park.name}</strong></span><span className="aw-badge muted">{park.write && !builtinSystemBlockReason(state, 'tiangong', true) ? '可读取与修改' : '只读'}</span></label>)}</div>
        </>}
        {error && <p role="alert" className="aw-form-error">{error}</p>}
      </div>
      <div className="aw-modal-footer"><button className="aw-button" type="button" onClick={close}>取消</button><button className="aw-button aw-primary" type="submit" disabled={testing || (stage === 'parks' && (!session || !parkId))}>{testing && <Loader2 size={13} className="aw-spin" />}{stage === 'login' ? testing ? '正在验证…' : initialResource ? intent === 'associate' ? '确认关联' : '验证并保存' : '验证账号' : initialResource ? '保存关联' : '关联园区'}</button></div>
    </form>
  </AgentResourceModal>;
}
