import { useEffect, useRef, useState } from 'react';
import { LockKeyhole, X } from 'lucide-react';
import { builtinSystemConfiguration, builtinSystemStatus, builtinSystems, configureBuiltinSystem, isPlatformAdmin, type BuiltinSystemId } from './agentBuiltinSystems';
import type { UpdateState, WorkbenchState } from './agentWorkbenchState';

export default function BuiltinSystemConfigurationDialog({ state, update, systemId, close }: { state: WorkbenchState; update: UpdateState; systemId: BuiltinSystemId; close: () => void }) {
  const ref = useRef<HTMLDialogElement>(null);
  const system = builtinSystems.find(system => system.id === systemId)!;
  const [configuration, setConfiguration] = useState(builtinSystemConfiguration(state, systemId));
  const admin = isPlatformAdmin(state);
  useEffect(() => { const element = ref.current; element?.showModal(); return () => element?.close(); }, []);
  return <dialog ref={ref} className="aw-modal aw-name-dialog aw-builtin-system-dialog" aria-label={`${system.name}能力设置`} onCancel={event => { event.preventDefault(); close(); }}><div className="aw-modal-header"><h2>{system.name}</h2><button className="aw-icon-button" aria-label="关闭系统能力设置" onClick={close}><X size={16} /></button></div><div className="aw-modal-body"><div className="aw-builtin-readonly"><span>系统名称</span><strong>{system.name}</strong><LockKeyhole size={13} /></div><div className="aw-builtin-readonly"><span>连接状态</span><strong>{builtinSystemStatus(state, systemId)}</strong><small>平台统一维护</small></div>{([['enabled', '启用系统能力', '停用后限制后续调用，历史记录保留。'], ['read', '读取业务数据', '允许 Agent 查询当前授权的设备、配置及业务数据。'], ['write', '提交业务变更', '仅管理员可修改业务内容，每次执行前仍需审查确认。']] as const).map(([key, title, description]) => <div className="aw-setting-row" key={key}><div><strong>{title}</strong><p>{description}</p></div><button role="switch" aria-label={title} aria-checked={configuration[key]} disabled={!admin} className={`aw-toggle ${configuration[key] ? 'is-on' : ''}`} onClick={() => setConfiguration(current => ({ ...current, [key]: !current[key] }))}><span /></button></div>)}<p className="aw-field-help">{admin ? '连接方式由平台预置，这里只管理启停与业务权限。' : '系统配置由管理员维护。普通项目成员可在已授权的项目或任务中查询业务数据。'}</p></div><div className="aw-modal-footer"><button className="aw-button" onClick={close}>{admin ? '取消' : '关闭'}</button>{admin && <button className="aw-button aw-primary" onClick={() => { update(draft => { configureBuiltinSystem(draft, systemId, configuration); }); close(); }}>保存</button>}</div></dialog>;
}
