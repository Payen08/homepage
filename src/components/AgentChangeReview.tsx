import { useEffect, useMemo, useState } from 'react';
import { AlertCircle, Check, ChevronDown, FileCode2, RefreshCw } from 'lucide-react';
import { acceptChange, changeWriteBlockReason, refreshChange, type FileChange, type UpdateState, type WorkbenchState } from './agentWorkbenchState';

type DiffRow = { kind: 'same' | 'add' | 'remove'; text: string; oldLine?: number; newLine?: number };
function lines(content: string) { return content ? content.replace(/\r\n/g, '\n').split('\n') : []; }

function lineDiff(before: string, after: string): DiffRow[] {
  const old = lines(before), next = lines(after);
  let prefix = 0, suffix = 0;
  while (prefix < old.length && prefix < next.length && old[prefix] === next[prefix]) prefix++;
  while (suffix < old.length - prefix && suffix < next.length - prefix && old[old.length - suffix - 1] === next[next.length - suffix - 1]) suffix++;
  const rows: DiffRow[] = old.slice(0, prefix).map((text, i) => ({ kind: 'same', text, oldLine: i + 1, newLine: i + 1 }));
  const a = old.slice(prefix, old.length - suffix), b = next.slice(prefix, next.length - suffix);
  if (a.length * b.length <= 250000) {
    const width = b.length + 1, table = new Uint32Array((a.length + 1) * width);
    for (let i = a.length - 1; i >= 0; i--) for (let j = b.length - 1; j >= 0; j--) table[i * width + j] = a[i] === b[j] ? 1 + table[(i + 1) * width + j + 1] : Math.max(table[(i + 1) * width + j], table[i * width + j + 1]);
    let i = 0, j = 0;
    while (i < a.length || j < b.length) {
      if (i < a.length && j < b.length && a[i] === b[j]) { rows.push({ kind: 'same', text: a[i], oldLine: prefix + i + 1, newLine: prefix + j + 1 }); i++; j++; }
      else if (i < a.length && (j >= b.length || table[(i + 1) * width + j] >= table[i * width + j + 1])) { rows.push({ kind: 'remove', text: a[i], oldLine: prefix + i + 1 }); i++; }
      else { rows.push({ kind: 'add', text: b[j], newLine: prefix + j + 1 }); j++; }
    }
  } else {
    a.forEach((text, i) => rows.push({ kind: 'remove', text, oldLine: prefix + i + 1 }));
    b.forEach((text, i) => rows.push({ kind: 'add', text, newLine: prefix + i + 1 }));
  }
  old.slice(old.length - suffix).forEach((text, i) => rows.push({ kind: 'same', text, oldLine: old.length - suffix + i + 1, newLine: next.length - suffix + i + 1 }));
  return rows;
}
export function changeLineCounts(change: FileChange) {
  const rows = lineDiff(change.before, change.after);
  return { added: rows.filter(row => row.kind === 'add').length, removed: rows.filter(row => row.kind === 'remove').length };
}

function splitRows(rows: DiffRow[]) {
  const paired: { before?: DiffRow; after?: DiffRow }[] = [];
  let removed: DiffRow[] = [], added: DiffRow[] = [];
  const flush = () => {
    for (let i = 0; i < Math.max(removed.length, added.length); i++) paired.push({ before: removed[i], after: added[i] });
    removed = []; added = [];
  };
  rows.forEach(row => {
    if (row.kind === 'same') { flush(); paired.push({ before: row, after: row }); }
    else if (row.kind === 'remove') removed.push(row);
    else added.push(row);
  });
  flush();
  return paired;
}

export default function AgentChangeReview({ state, update, changes, selectedFileId, openEditor }: {
  state: WorkbenchState; update: UpdateState; changes: FileChange[]; selectedFileId: string | null; openEditor: (fileId: string) => void;
}) {
  const [split, setSplit] = useState(false);
  const [expanded, setExpanded] = useState<string[]>([]);
  const fileKey = changes.map(change => change.id).join(',');
  useEffect(() => {
    const selected = changes.find(change => change.fileId === selectedFileId) || changes[0];
    if (selected) setExpanded(previous => previous.includes(selected.id) ? previous : [...previous, selected.id]);
  }, [fileKey, selectedFileId]);
  const pending = changes.filter(change => change.status === 'pending' || change.status === 'conflict');
  const conflict = pending.some(change => change.status === 'conflict' || (state.files.find(file => file.id === change.fileId)?.version || 0) !== change.baseVersion);
  const blocked = pending.some(change => Boolean(changeWriteBlockReason(state, change)));
  const allExpanded = changes.length > 0 && changes.every(change => expanded.includes(change.id));
  return <div className="aw-code-review">
    <div className="aw-code-review-toolbar"><div><strong>变更概览</strong><span>{changes.length} 个文件</span></div><div className="aw-code-review-modes"><button className={!split ? 'is-active' : ''} onClick={() => setSplit(false)}>统一</button><button className={split ? 'is-active' : ''} onClick={() => setSplit(true)}>拆分</button><i /><button onClick={() => setExpanded(allExpanded ? [] : changes.map(change => change.id))}>{allExpanded ? '全部收起' : '全部展开'}</button></div></div>
    <div className="aw-code-review-scroll">{changes.length ? changes.map(change => <ReviewFile key={change.id} state={state} update={update} change={change} split={split} expanded={expanded.includes(change.id)} toggle={() => setExpanded(previous => previous.includes(change.id) ? previous.filter(id => id !== change.id) : [...previous, change.id])} openEditor={() => openEditor(change.fileId)} />) : <div className="aw-code-review-empty"><FileCode2 size={24} /><strong>还没有代码变更</strong><p>向 Agent 提交项目开发需求后，代码差异会自动展示在这里。<br />可以切换到“文件”管理项目代码，或点击“终端”直接执行命令。</p></div>}</div>
    {conflict && <div className="aw-code-review-notice"><AlertCircle size={12} />文件已更新，请重新审查冲突文件。</div>}
    <footer className="aw-code-review-footer"><button className="aw-button" disabled={!pending.length} onClick={() => update(draft => { const ids = new Set(pending.map(change => change.id)); draft.changes.filter(change => ids.has(change.id)).forEach(change => { change.status = 'rejected'; }); })}>放弃更改</button><button className="aw-button aw-primary" disabled={!pending.length || conflict || blocked} onClick={() => update(draft => { pending.forEach(change => acceptChange(draft, change.id)); })}>接受所有更改</button></footer>
  </div>;
}

function ReviewFile({ state, update, change, split, expanded, toggle, openEditor }: {
  state: WorkbenchState; update: UpdateState; change: FileChange; split: boolean; expanded: boolean; toggle: () => void; openEditor: () => void;
}) {
  const file = state.files.find(item => item.id === change.fileId);
  const actionable = change.status === 'pending' || change.status === 'conflict';
  const conflict = actionable && (change.status === 'conflict' || (file?.version || 0) !== change.baseVersion);
  const before = conflict ? file?.content || '' : change.before;
  const rows = useMemo(() => lineDiff(before, change.after), [before, change.after]);
  const paired = useMemo(() => splitRows(rows), [rows]);
  const added = rows.filter(row => row.kind === 'add').length, removed = rows.filter(row => row.kind === 'remove').length;
  const blocked = changeWriteBlockReason(state, change);
  const type = /\.tsx?$/.test(change.path) ? 'TS' : /\.jsx?$/.test(change.path) ? 'JS' : /\.css$/.test(change.path) ? '#' : /\.html?$/.test(change.path) ? '<>' : '{}';
  return <section className="aw-review-file"><button className={`aw-review-file-heading ${expanded ? 'is-expanded-file' : ''}`} onClick={toggle}><ChevronDown size={12} className={expanded ? '' : 'aw-review-file-collapsed'} /><b className="aw-file-language">{type}</b><span>{change.path}</span>{change.status === 'accepted' && <Check size={12} className="aw-review-accepted" />}{change.status === 'rejected' && <small>已放弃</small>}<strong className="aw-review-added">+{added}</strong><strong className="aw-review-removed">−{removed}</strong></button>
    {expanded && <><div className="aw-review-hunk">@@ −1,{lines(before).length} +1,{lines(change.after).length} @@ <span>{change.path.split('/').pop()}</span></div>
      {conflict && <div className="aw-code-review-notice"><AlertCircle size={12} />文件已更新，请重新审查。<button onClick={() => update(draft => { draft.changes.find(item => item.id === change.id)!.status = 'conflict'; refreshChange(draft, change.id); })}><RefreshCw size={11} />更新差异</button></div>}
      {blocked && actionable && <div className="aw-code-review-notice"><AlertCircle size={12} />{blocked}</div>}
      <div className={`aw-review-code ${split && before && change.after ? 'is-split' : ''}`}>{split && before && change.after ? (['before', 'after'] as const).map(side => <div className="aw-review-split-column" key={side}>{paired.map((pair, i) => { const row = pair[side]; return <div key={i} className={`aw-review-code-row ${row?.kind || 'same'}`}><span>{side === 'before' ? row?.oldLine : row?.newLine}</span><code>{row?.text || ' '}</code></div>; })}</div>) : rows.map((row, i) => <div key={i} className={`aw-review-code-row ${row.kind}`}><span>{row.newLine || row.oldLine}</span><i>{row.kind === 'add' ? '+' : row.kind === 'remove' ? '−' : ' '}</i><code>{row.text || ' '}</code></div>)}</div>
      <div className="aw-review-file-actions"><button onClick={openEditor}><FileCode2 size={11} />在编辑器打开</button>{actionable && <><button onClick={() => update(draft => { draft.changes.find(item => item.id === change.id)!.status = 'rejected'; })}>放弃</button><button disabled={conflict || Boolean(blocked)} onClick={() => update(draft => acceptChange(draft, change.id))}><Check size={11} />接受</button></>}</div>
    </>}
  </section>;
}
