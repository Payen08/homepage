import { Check, FileCode2 } from 'lucide-react';
import { prepareTiangongBrowserChange } from './agentTiangongResources';
import type { ToolCall, UpdateState, WorkbenchState } from './agentWorkbenchState';

export default function TiangongActionDiff({ state, update, call }: { state: WorkbenchState; update: UpdateState; call: ToolCall }) {
  const change = call.tiangongChange;
  if (!change) return null;
  const editable = !call.executions && ['pending', 'blocked'].includes(call.status);
  const version = state.tiangongParkRecords?.find(record => record.resourceId === call.tiangongResourceId)?.version;
  const conflict = editable && version !== change.baseVersion;
  return <section className="aw-business-diff" aria-label="天工园区差异"><header><span><FileCode2 size={14} />园区业务差异</span><small>示例数据 · 基准 v{change.baseVersion}</small></header>{conflict && <div className="aw-inline-warning">园区数据已更新，需要重新生成差异。<button className="aw-button" onClick={() => update(draft => { const current = draft.calls.find(item => item.id === call.id); if (!current || current.executions) return; prepareTiangongBrowserChange(draft, current, JSON.parse(current.parameters).action || '修改记录'); current.approved = false; current.status = 'pending'; const task = draft.tasks.find(item => item.id === current.taskId); if (task) task.status = 'authorization'; })}>更新并重新审查</button></div>}<div className="aw-business-diff-columns"><div><h4>修改前</h4><pre>{change.before}</pre></div><div><h4>修改后</h4><pre>{change.after}</pre></div></div>{editable ? <label className="aw-checkbox-label"><input type="checkbox" aria-label="已审查天工园区差异" disabled={conflict} checked={change.reviewed} onChange={event => update(draft => { const current = draft.calls.find(item => item.id === call.id); if (current?.tiangongChange && !current.executions && ['pending', 'blocked'].includes(current.status)) current.tiangongChange.reviewed = event.target.checked; })} />已审查目标园区及本次差异</label> : <p><Check size={12} />{call.status === 'denied' ? '本次修改已拒绝，未写入示例记录。' : '差异与执行记录已保留。'}</p>}</section>;
}
