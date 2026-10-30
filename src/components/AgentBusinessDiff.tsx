import { useState } from 'react';
import { FileCode2, RefreshCw } from 'lucide-react';
import { refreshBusinessChange, type ToolCall, type UpdateState, type WorkbenchState } from './agentWorkbenchState';

export default function AgentBusinessDiff({ state, update, call }: { state: WorkbenchState; update: UpdateState; call: ToolCall }) {
  const [editing, setEditing] = useState(false);
  const change = call.businessChange;
  if (!change) return null;
  const resource = state.businessResources?.find(resource => resource.id === change.resourceId);
  const conflict = call.executions === 0 && call.status !== 'denied' && (resource?.version !== change.baseVersion || resource?.content !== change.before);
  const editable = call.executions === 0 && ['pending', 'blocked'].includes(call.status);
  return <section className="aw-business-diff" aria-label="天工业务差异"><header><span><FileCode2 size={14} />业务差异预览</span><small>基准 v{change.baseVersion} · 当前 v{resource?.version || '—'}</small>{editable && <button className="aw-button aw-subtle" onClick={() => setEditing(!editing)}>{editing ? '查看差异' : '编辑草案'}</button>}</header>
    {conflict && <div className="aw-inline-warning">业务数据已更新，原差异不能直接写入。{editable && <button className="aw-button" onClick={() => { update(draft => refreshBusinessChange(draft, call.id)); setEditing(false); }}><RefreshCw size={12} />重新生成差异</button>}</div>}
    <div className="aw-business-diff-columns"><div><h4>修改前</h4><pre>{change.before}</pre></div><div><h4>修改后</h4>{editing && editable ? <textarea aria-label="业务修改草案" spellCheck={false} value={change.after} onChange={event => update(draft => { const item = draft.calls.find(item => item.id === call.id); if (item?.businessChange && item.executions === 0 && ['pending', 'blocked'].includes(item.status)) { item.businessChange.after = event.target.value; item.businessChange.reviewed = false; item.approved = false; } })} /> : <pre>{change.after}</pre>}</div></div>
    {editable ? <label className="aw-checkbox-label"><input type="checkbox" aria-label="已审查天工业务差异" checked={change.reviewed} disabled={conflict} onChange={event => update(draft => { const item = draft.calls.find(item => item.id === call.id); if (item?.businessChange) item.businessChange.reviewed = event.target.checked; })} />我已审查本次差异，仅确认当前业务资源的修改</label> : <p>{call.status === 'denied' ? '本次修改已拒绝，未执行写入。' : call.status === 'done' ? '业务差异与执行结果已保留。' : '正在处理本次已确认的修改。'}</p>}
  </section>;
}
