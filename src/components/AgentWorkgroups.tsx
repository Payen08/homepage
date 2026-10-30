import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { AlertCircle, Archive, ChevronDown, Folder, FolderOpen, Loader2, MessageSquare, MoreHorizontal, Pencil, Plus, Search, Settings, Trash2, X } from 'lucide-react';
import { isDeviceChatWorkspace, projectChatResources } from './agentChatResources';
import { deleteTask, isStandaloneChatSpace, type UpdateState, type WorkbenchState } from './agentWorkbenchState';

type Props = {
  state: WorkbenchState; update: UpdateState; activeWorkspaceId?: string; activeTaskId?: string;
  openGroup: (id: string) => void; openTask: (workspaceId: string, taskId: string) => void;
  newTask: (workspaceId: string) => void; newStandaloneChat: () => void; createGroup: () => void;
  associateResources: (target: { workspaceId: string; taskId?: string }) => void;
  rename: (kind: 'group' | 'task', id: string) => void;
};
type Menu = { kind: 'group' | 'task'; id: string; left: number; top: number };

function ComposeIcon({ size = 14 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M12 3H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
      <path d="M18.375 2.625a1 1 0 0 1 3 3l-9.013 9.014a2 2 0 0 1-.853.505l-2.873.84a.5.5 0 0 1-.62-.62l.84-2.873a2 2 0 0 1 .506-.852z" />
    </svg>
  );
}

export default function AgentWorkgroups({ state, update, activeWorkspaceId, activeTaskId, openGroup, openTask, newTask, newStandaloneChat, createGroup, rename, associateResources }: Props) {
  const [searchOpen, setSearchOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [archived, setArchived] = useState(false);
  const [projectsCollapsed, setProjectsCollapsed] = useState(false);
  const [chatsCollapsed, setChatsCollapsed] = useState(false);
  const [menu, setMenu] = useState<Menu | null>(null);
  const groups = state.workspaces.filter(group => {
    if (group.archived || isStandaloneChatSpace(group)) return false;
    const tasks = state.tasks.filter(task => task.workspaceId === group.id && task.archived === archived);
    if (archived && !tasks.length) return false;
    return !query || group.name.toLowerCase().includes(query.toLowerCase()) || tasks.some(task => task.title.toLowerCase().includes(query.toLowerCase()));
  });
  const chatSpaceIds = new Set(state.workspaces.filter(group => !group.archived && isStandaloneChatSpace(group)).map(group => group.id));
  const chats = state.tasks.filter(task => chatSpaceIds.has(task.workspaceId) && task.archived === archived && (!query || task.title.toLowerCase().includes(query.toLowerCase())));

  useEffect(() => {
    if (!activeWorkspaceId) return;
    update(draft => {
      const group = draft.workspaces.find(item => item.id === activeWorkspaceId);
      if (group) group.sidebarExpanded = true;
    });
  }, [activeWorkspaceId, update]);

  useEffect(() => {
    if (!menu) return;
    const close = (event: KeyboardEvent) => { if (event.key === 'Escape') setMenu(null); };
    window.addEventListener('keydown', close);
    return () => window.removeEventListener('keydown', close);
  }, [menu]);

  const showMenu = (kind: Menu['kind'], id: string, element: HTMLElement) => {
    if (menu?.kind === kind && menu.id === id) { setMenu(null); return; }
    const rect = element.getBoundingClientRect();
    setMenu({ kind, id, left: Math.max(8, rect.right - 180), top: Math.min(rect.bottom + 5, window.innerHeight - 190) });
  };
  const archive = () => {
    if (!menu) return;
    update(draft => {
      if (menu.kind === 'group') {
        const group = draft.workspaces.find(item => item.id === menu.id)!;
        group.archived = true;
        draft.tasks.filter(task => task.workspaceId === group.id && task.status === 'running').forEach(task => { task.status = 'stopped'; });
        if (draft.activeWorkspaceId === group.id) draft.activeWorkspaceId = null;
      } else {
        const task = draft.tasks.find(item => item.id === menu.id)!;
        task.archived = !task.archived;
        const group = draft.workspaces.find(item => item.id === task.workspaceId);
        if (task.archived && group?.activeTaskId === task.id) group.activeTaskId = null;
      }
    });
    setMenu(null);
  };

  const menuTask = menu?.kind === 'task' ? state.tasks.find(task => task.id === menu.id) : undefined;
  const menuGroup = state.workspaces.find(group => group.id === (menuTask?.workspaceId || menu?.id));
  return <section className="aw-groups" aria-label="项目组与聊天">
    <div className="aw-groups-heading">
      <button type="button" className="aw-section-collapse-btn" onClick={() => setProjectsCollapsed(!projectsCollapsed)} aria-expanded={!projectsCollapsed}>
        <span>{archived ? '归档项目' : '项目'}</span>
        <ChevronDown size={12} className={projectsCollapsed ? 'is-collapsed' : ''} />
      </button>
      <div>
        <button aria-label={searchOpen ? '关闭搜索' : '搜索项目组与聊天'} title="搜索" onClick={() => { setSearchOpen(!searchOpen); setQuery(''); }}>{searchOpen ? <X size={13} /> : <Search size={13} />}</button>
        <button aria-label={archived ? '查看当前任务' : '查看归档任务'} title={archived ? '当前任务' : '归档任务'} className={archived ? 'is-active' : ''} onClick={() => setArchived(!archived)}><Archive size={13} /></button>
        <button aria-label="新建项目" title="新建项目并关联项目组" onClick={createGroup}><Plus size={14} /></button>
      </div>
    </div>
    {searchOpen && <label className="aw-sidebar-search"><Search size={12} /><input autoFocus placeholder="搜索项目或聊天…" value={query} onChange={event => setQuery(event.target.value)} /></label>}
    <div className="aw-group-tree" onScroll={() => { if (menu) setMenu(null); }}>
      {!projectsCollapsed && groups.map(group => {
        const expanded = Boolean(query) || (group.sidebarExpanded ?? group.id === activeWorkspaceId);
        const selected = group.id === activeWorkspaceId;
        const groupMatches = group.name.toLowerCase().includes(query.toLowerCase());
        const tasks = state.tasks.filter(task => task.workspaceId === group.id && task.archived === archived && (!query || groupMatches || task.title.toLowerCase().includes(query.toLowerCase())));
        const hasVisibleChildren = expanded && tasks.length > 0;
        const FolderIcon = hasVisibleChildren ? FolderOpen : Folder;
        const inherited = projectChatResources(state, group);
        const inheritedDevice = state.devices.find(device => device.id === inherited.deviceId);
        const inheritedPark = state.tiangongResources?.find(resource => resource.id === inherited.links[0]?.resourceId);
        const associationTitle = inheritedDevice ? `已关联设备：${inheritedDevice.name} · ${inheritedDevice.address}` : inheritedPark ? `已关联园区：${inheritedPark.parkName} · ${inheritedPark.url}` : '';
        return <div className="aw-group" key={group.id}>
          <div className={`aw-group-row ${selected && !activeTaskId ? 'is-selected' : ''} ${menu?.id === group.id ? 'has-menu' : ''}`}>
            <button className="aw-group-toggle" aria-expanded={hasVisibleChildren} title={group.name} onClick={() => {
              update(draft => {
                const current = draft.workspaces.find(item => item.id === group.id)!;
                current.sidebarExpanded = selected ? !expanded : true;
              });
              if (!selected) openGroup(group.id);
            }}><FolderIcon size={15} strokeWidth={1.7} /><span>{group.name}</span>{group.builtinSystemId && <small className="aw-system-group-badge">系统</small>}{!group.project && group.deviceIds.length > 0 && <small className="aw-device-group-badge">设备</small>}</button>
            <div className="aw-group-actions"><button className="aw-group-more" aria-label={`更多工作组操作 ${group.name}`} title="更多" onClick={event => showMenu('group', group.id, event.currentTarget)}><MoreHorizontal size={15} /></button><button className="aw-group-new-chat" aria-label={`在 ${group.name} 新建聊天`} title="新建聊天" onClick={() => newTask(group.id)}><Plus size={15} /></button></div>
          </div>
          {hasVisibleChildren && <div className="aw-group-children">{tasks.map(task => <div className={`aw-group-task-row ${selected && activeTaskId === task.id ? 'is-current' : ''}`} key={task.id}>
            <button className="aw-group-task" title={task.title} onClick={() => openTask(group.id, task.id)}>
              {task.status === 'running' && <Loader2 size={12} className="aw-spin" />}
              <span>{task.title}</span>
              {(task.status === 'failed' || task.status === 'authorization') && <AlertCircle size={13} className={`aw-task-alert ${task.status}`} />}
              {inherited.locked && associationTitle && <small className="aw-chat-inherited-status" title={associationTitle} aria-label={associationTitle}>已关联</small>}
            </button>
            <button className="aw-group-task-more" aria-label={`管理任务 ${task.title}`} onClick={event => showMenu('task', task.id, event.currentTarget)}><MoreHorizontal size={13} /></button>
          </div>)}</div>}
        </div>;
      })}
      {!projectsCollapsed && !groups.length && <div className="aw-sidebar-empty">{query ? '没有匹配的项目' : archived ? '暂无归档项目任务' : '暂无项目'}</div>}
      {(chats.length > 0 || !query) && <div className="aw-standalone-chats">
        <div className="aw-chat-list-heading">
          <button type="button" className="aw-section-collapse-btn" onClick={() => setChatsCollapsed(!chatsCollapsed)} aria-expanded={!chatsCollapsed}>
            <span>{archived ? '归档聊天' : '聊天'}</span>
            <ChevronDown size={12} className={chatsCollapsed ? 'is-collapsed' : ''} />
          </button>
          {!archived && <button aria-label="新建独立聊天" title="新建独立聊天" onClick={newStandaloneChat}><Plus size={14} /></button>}
        </div>
        {!chatsCollapsed && chats.map(task => <div className={`aw-group-task-row aw-chat-row ${activeTaskId === task.id ? 'is-current' : ''}`} key={task.id}>
          <button className="aw-group-task" title={task.title} onClick={() => openTask(task.workspaceId, task.id)}><span>{task.title}</span></button>
          <button className="aw-group-task-more" aria-label={`管理聊天 ${task.title}`} onClick={event => showMenu('task', task.id, event.currentTarget)}><MoreHorizontal size={13} /></button>
        </div>)}
        {!chatsCollapsed && !chats.length && <div className="aw-sidebar-empty">{archived ? '暂无归档聊天' : '还没有聊天记录'}</div>}
      </div>}
    </div>
    {menu && createPortal(<><button className="aw-group-menu-backdrop" aria-label="关闭操作菜单" onClick={() => setMenu(null)} /><div className="aw-group-context-menu" role="menu" style={{ left: menu.left, top: menu.top }}>
      {menu.kind === 'group' && <button role="menuitem" onClick={() => { newTask(menu.id); setMenu(null); }}><MessageSquare size={13} />新建聊天</button>}
      {menu.kind === 'group' && !isDeviceChatWorkspace(menuGroup) && <button role="menuitem" onClick={() => { associateResources({ workspaceId: menu.id }); setMenu(null); }}><Settings size={13} />关联配置</button>}
      {(menu.kind === 'task' || !menuGroup?.builtinSystemId) && <button role="menuitem" onClick={() => { rename(menu.kind, menu.id); setMenu(null); }}><Pencil size={13} />{menu.kind === 'group' ? '重命名项目' : '重命名任务'}</button>}
      {(menu.kind === 'task' || !menuGroup?.builtinSystemId) && <button role="menuitem" onClick={archive}><Archive size={13} />{menu.kind === 'group' ? '归档项目' : state.tasks.find(task => task.id === menu.id)?.archived ? '恢复任务' : '归档任务'}</button>}
      {menu.kind === 'task' && <button role="menuitem" className="aw-delete-task" onClick={() => { update(draft => { deleteTask(draft, menu.id); }); setMenu(null); }}><Trash2 size={13} />删除任务</button>}
    </div></>, document.body)}
  </section>;
}
