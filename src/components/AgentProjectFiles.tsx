import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { ChevronDown, ChevronRight, FileCode2, FilePlus2, Folder, FolderOpen, FolderPlus, Search, Trash2, Undo2, X } from 'lucide-react';
import { createProjectEntry, fileWriteBlockReason, removeProjectEntry, restoreProjectEntry, workspaceFiles, type AgentTask, type RemovedProjectEntry, type UpdateState, type WorkbenchState, type Workspace, type WorkspaceFile } from './agentWorkbenchState';

type TreeNode = { name: string; path: string; file?: WorkspaceFile; children: TreeNode[] };
function fileTree(files: WorkspaceFile[], folders: string[]) {
  const roots: TreeNode[] = [];
  const insert = (path: string, file?: WorkspaceFile) => {
    let nodes = roots;
    const parts = path.replace(/^\/+/, '').split('/');
    parts.forEach((name, index) => {
      const nodePath = parts.slice(0, index + 1).join('/');
      let node = nodes.find(item => item.name === name);
      if (!node) { node = { name, path: nodePath, children: [] }; nodes.push(node); }
      if (index === parts.length - 1 && file) node.file = file;
      nodes = node.children;
    });
  };
  folders.forEach(path => insert(path)); files.forEach(file => insert(file.path, file));
  const sort = (nodes: TreeNode[]) => { nodes.sort((a, b) => Number(Boolean(a.file)) - Number(Boolean(b.file)) || a.name.localeCompare(b.name)); nodes.forEach(node => sort(node.children)); };
  sort(roots); return roots;
}

export default function AgentProjectFiles({ state, update, workspace, task, openFile, notify }: {
  state: WorkbenchState; update: UpdateState; workspace: Workspace; task?: AgentTask; openFile: (id: string) => void; notify: (text: string) => void;
}) {
  const [query, setQuery] = useState('');
  const [expanded, setExpanded] = useState(new Set(['.opencode', '.opencode/skills', 'src', 'src/components']));
  const [parent, setParent] = useState('');
  const [entryKind, setEntryKind] = useState<'file' | 'folder' | null>(null);
  const [removed, setRemoved] = useState<RemovedProjectEntry | null>(null);
  const deviceId = task?.kind === 'device' ? task.deviceId || null : null;
  const files = workspaceFiles(state, workspace.id).filter(file => file.deviceId === deviceId);
  const folders = (state.folders || []).filter(folder => folder.workspaceId === workspace.id && folder.deviceId === deviceId && !folder.deleted).map(folder => folder.path);
  const tree = useMemo(() => fileTree(files.filter(file => !query || file.path.toLowerCase().includes(query.toLowerCase())), folders.filter(path => !query || path.toLowerCase().includes(query.toLowerCase()))), [files, folders, query]);
  const erase = (node: TreeNode) => {
    const reason = fileWriteBlockReason(state, { workspaceId: workspace.id, deviceId }, task?.id);
    if (reason) { notify(reason); return; }
    const snapshot = removeProjectEntry(structuredClone(state), workspace.id, node.file?.path || node.path, node.file ? 'file' : 'folder', deviceId, task?.id);
    update(draft => { removeProjectEntry(draft, workspace.id, node.file?.path || node.path, node.file ? 'file' : 'folder', deviceId, task?.id); });
    setRemoved(snapshot); if (parent === node.path || parent.startsWith(`${node.path}/`)) setParent('');
  };
  const render = (nodes: TreeNode[], depth = 0): ReactNode => nodes.map(node => {
    const open = Boolean(query) || expanded.has(node.path);
    const language = /\.tsx?$/.test(node.name) ? 'TS' : /\.css$/.test(node.name) ? '#' : /\.json$/.test(node.name) ? '{}' : /\.md$/.test(node.name) ? 'M' : '';
    return <div key={node.path} role="treeitem" aria-label={node.path} aria-expanded={node.file ? undefined : open}>
      <div className={`aw-project-tree-row ${(!node.file && parent === node.path) || (node.file && workspace.panel.fileId === node.file.id) ? 'is-selected' : ''}`} style={{ paddingLeft: 8 + depth * 15 }}>
        <button className="aw-project-tree-label" title={node.path} onClick={() => {
          if (node.file) { openFile(node.file.id); return; }
          setParent(node.path); setExpanded(previous => { const next = new Set(previous); if (next.has(node.path)) next.delete(node.path); else next.add(node.path); return next; });
        }}>{!node.file ? <><span className="aw-tree-chevron">{open ? <ChevronDown size={11} /> : <ChevronRight size={11} />}</span>{open ? <FolderOpen size={13} /> : <Folder size={13} />}</> : <><span className="aw-tree-chevron" />{language ? <b className={`aw-tree-language ${language === 'TS' ? 'is-typescript' : ''}`}>{language}</b> : <FileCode2 size={13} />}</>}<span>{node.name}</span>{node.file?.version === 0 && <small>待审</small>}</button>
        <button className="aw-tree-delete" aria-label={`删除${node.file ? '文件' : '文件夹'} ${node.path}`} title="删除" onClick={() => erase(node)}><Trash2 size={12} /></button>
      </div>{!node.file && open && <div role="group">{render(node.children, depth + 1)}</div>}
    </div>;
  });
  return <div className="aw-project-files">
    <div className="aw-project-files-toolbar"><label><Search size={13} /><input aria-label="搜索项目文件" placeholder="搜索文件" value={query} onChange={event => setQuery(event.target.value)} /></label><button aria-label="新建文件" title="新建文件" onClick={() => setEntryKind('file')}><FilePlus2 size={15} /></button><button aria-label="新建文件夹" title="新建文件夹" onClick={() => setEntryKind('folder')}><FolderPlus size={15} /></button></div>
    <button className="aw-project-tree-root" title="项目根目录" onClick={() => setParent('')}><FolderOpen size={13} /><span>{deviceId ? state.devices.find(device => device.id === deviceId)?.name : workspace.project?.name || '工作空间文件'}</span><small>{files.length}</small></button>
    <div className="aw-project-tree" role="tree" aria-label="项目文件">{render(tree)}{!tree.length && <p className="aw-project-tree-empty">{query ? '没有匹配的文件' : '项目中还没有文件，可以在上方新增。'}</p>}</div>
    {removed && <div className="aw-project-file-undo"><span>已删除，相关审查记录保留</span><button onClick={() => { update(draft => restoreProjectEntry(draft, removed)); setRemoved(null); }}><Undo2 size={12} />撤销删除</button><button aria-label="关闭删除提示" onClick={() => setRemoved(null)}><X size={12} /></button></div>}
    {entryKind && <EntryDialog kind={entryKind} parent={parent} state={state} update={update} workspace={workspace} deviceId={deviceId} taskId={task?.id} close={() => setEntryKind(null)} created={() => { setEntryKind(null); setExpanded(previous => new Set([...previous, parent])); }} />}
  </div>;
}

function EntryDialog({ kind, parent, state, update, workspace, deviceId, taskId, close, created }: {
  kind: 'file' | 'folder'; parent: string; state: WorkbenchState; update: UpdateState; workspace: Workspace; deviceId: string | null; taskId?: string; close: () => void; created: () => void;
}) {
  const dialog = useRef<HTMLDialogElement>(null);
  const [name, setName] = useState(''); const [error, setError] = useState('');
  useEffect(() => { const current = dialog.current; current?.showModal(); return () => current?.close(); }, []);
  const label = kind === 'file' ? '文件' : '文件夹';
  return <dialog ref={dialog} className="aw-modal aw-name-dialog" aria-labelledby="aw-entry-title" onCancel={event => { event.preventDefault(); close(); }}>
    <div className="aw-modal-header"><div><h2 id="aw-entry-title">新建{label}</h2><p>{workspace.project?.name || workspace.name} / {parent || '根目录'}</p></div><button className="aw-icon-button" aria-label="关闭新建窗口" onClick={close}><X size={16} /></button></div>
    <form onSubmit={event => { event.preventDefault(); const path = [parent, name.trim()].filter(Boolean).join('/'); const result = createProjectEntry(structuredClone(state), workspace.id, path, kind, deviceId, taskId); if (result.error) { setError(result.error); return; }
      update(draft => { const entry = createProjectEntry(draft, workspace.id, path, kind, deviceId, taskId); if (entry.file) { const group = draft.workspaces.find(item => item.id === workspace.id)!; group.panel.fileId = entry.file.id; group.panel.tab = 'editor'; } }); created();
    }}><div className="aw-modal-body aw-form"><label>{label}名称<input aria-label={`${label}名称`} autoFocus autoComplete="off" value={name} onChange={event => { setName(event.target.value); setError(''); }} placeholder={kind === 'file' ? '例如：utils.ts' : '例如：utils'} /></label>{error && <p className="aw-form-error" role="alert">{error}</p>}</div><div className="aw-modal-footer"><button type="button" className="aw-button" onClick={close}>取消</button><button type="submit" className="aw-button aw-primary" disabled={!name.trim()}>创建{label}</button></div></form>
  </dialog>;
}
