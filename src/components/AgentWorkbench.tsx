import { isPlatformAdmin, builtinSystemForWorkspace, builtinSystemForService, builtinResourceType, inferResourceSystem } from './agentBuiltinSystems';
import { useEffect, useRef, useState, useMemo, type ButtonHTMLAttributes, type ReactNode } from 'react';
import {
  ArrowLeft, ArrowRight, ArrowUp, Archive, Bot, Box, Check, CheckCircle2, ChevronDown, ChevronRight,
  Circle, Clock3, Code2, Cpu, Building2, Download, FileCode2, FileText, Folder, FolderOpen, Layers,
  Link2, Loader2, MessageSquare, Mic, Monitor, MoreHorizontal, PanelLeft, PanelRight, PanelRightClose, Pencil, Play,
  Plug, Plus, RefreshCw, RotateCcw, Save, Search, Settings, ShieldCheck, Square,
  Terminal, Trash2, Unplug, Upload, X, Zap, AlertCircle, type LucideIcon,
} from 'lucide-react';
import {
  acceptChange, addWorkspace, bindGroupProject, callBlockReason, changeWriteBlockReason, confirmTask, continueTask, deleteTask, createProjectWorkspace, ensureTaskTerminal, fileWriteBlockReason, isStandaloneChatSpace, makeSkill, message,
  models, now, openTerminal, prepareNewTask, refreshChange, retryTask, reviewCall, runTerminal, saveFile, selectTaskContext,
  startTask, statusLabels, taskKinds, terminalBlockReason, uid, unlinkMcp, useWorkbench, workspaceFiles, getAvailableWorkbenchModels,
  type AgentTask, type FileChange, type Skill, type TaskKind, type ToolCall, type ToolTab,
  type UpdateState, type WorkbenchState, type Workspace, type WorkspaceFile,
} from './agentWorkbenchState';
import { activeModelConfig, modelProviders } from './agentModelService';
import { taskDeviceRequirementReason, taskRequiresDevice } from './agentBuiltinMcpServices';
import './AgentWorkbench.css';
import './AgentConfiguration.css';
import './AgentManagementPages.css';
import TaskComposer, { NewProjectDialog } from './AgentTaskComposer';
import AgentWorkgroups from './AgentWorkgroups';
import AgentChangeReview, { changeLineCounts } from './AgentChangeReview';
import AgentProjectFiles from './AgentProjectFiles';
import { canConfigureChatResources, currentChatConnection, projectChatResources, workspaceChatResourceType } from './agentChatResources';
import { commitPendingChatResource, findResourceMentions, resourceMentionDraft, resourceSlashRange, type PendingChatResource } from './agentResourceMentions';
import AgentResourceBinding from './AgentResourceBinding';
import AgentChatConnection from './AgentChatConnection';
import TaskDeviceDialog from './TaskDeviceDialog';
import AgentModelSettings from './AgentModelSettings';
import AgentExtensionCenter from './AgentExtensionCenter';
import AgentConnectionSettings from './AgentConnectionSettings';
import AgentBusinessDiff from './AgentBusinessDiff';
import { TiangongResourceSection } from './TiangongResourceDialog';
import TiangongActionDiff from './AgentTiangongActionDiff';
import { effectiveTiangongLinks, type TiangongScope } from './agentTiangongResources';
import { ManagementPage, ManagementHeading, ManagementTabs } from './AgentManagementLayout';
import { useWorkbenchPreference } from './workbenchPreferences';

type View = 'tasks' | 'resources' | 'extensions' | 'skills' | 'reviews' | 'settings';
type Context = { state: WorkbenchState; update: UpdateState; workspace: Workspace; task?: AgentTask; notify: (text: string) => void };
const tools: { id: ToolTab; label: string; icon: LucideIcon }[] = [
  { id: 'changes', label: '代码变更', icon: FileCode2 },
  { id: 'files', label: '文件', icon: Folder }, { id: 'editor', label: '编辑器', icon: Code2 },
  { id: 'terminal', label: '终端', icon: Terminal },
  { id: 'desktop', label: '远程桌面', icon: Cpu },
];
const viewNames: Record<View, string> = { tasks: 'Agent 任务', resources: '资源连接', extensions: '扩展中心', skills: 'Skill 管理', reviews: '操作审查', settings: '系统配置' };
const management: { id: View; icon: LucideIcon; name: string }[] = [
{ id: 'extensions', icon: Box, name: '扩展中心' }, { id: 'reviews', icon: ShieldCheck, name: '操作审查' },
];
const formatTime = (date: string) => new Intl.DateTimeFormat('zh-CN', { month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' }).format(new Date(date));

function Button({ icon: Icon, primary, subtle, children, className = '', ...props }: ButtonHTMLAttributes<HTMLButtonElement> & { icon?: LucideIcon; primary?: boolean; subtle?: boolean }) {
  return <button {...props} className={`aw-button ${primary ? 'aw-primary' : ''} ${subtle ? 'aw-subtle' : ''} ${className}`}>
    {Icon && <Icon size={14} />}{children}
  </button>;
}
function IconButton({ icon: Icon, label, ...props }: ButtonHTMLAttributes<HTMLButtonElement> & { icon: LucideIcon; label: string }) {
  return <button {...props} className="aw-icon-button" aria-label={label} title={label}><Icon size={16} /></button>;
}
function Empty({ icon: Icon = FolderOpen, title, text, children }: { icon?: LucideIcon; title: string; text: string; children?: ReactNode }) {
  return <div className="aw-empty"><span className="aw-empty-icon"><Icon size={24} /></span><h2>{title}</h2><p>{text}</p>{children}</div>;
}
function Badge({ children, tone = '' }: { children: ReactNode; tone?: string }) { return <span className={`aw-badge ${tone}`}>{children}</span>; }
function PageHeading({ title, description, children }: { title: string; description: string; children?: ReactNode }) {
  return <div className="aw-page-heading"><div><h1>{title}</h1><p>{description}</p></div><div className="aw-heading-actions">{children}</div></div>;
}
function Modal({ title, subtitle, onClose, children, wide, compact }: { title: string; subtitle?: string; onClose: () => void; children: ReactNode; wide?: boolean; compact?: boolean }) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const previous = document.activeElement as HTMLElement | null;
    const dialog = ref.current;
    dialog?.showModal();
    return () => { dialog?.close(); previous?.focus({ preventScroll: true }); };
  }, []);
  return <dialog ref={ref} className={`aw-modal ${wide ? 'aw-modal-wide' : ''} ${compact ? 'aw-name-dialog' : ''}`} onCancel={event => { event.preventDefault(); onClose(); }}
    onClick={event => { if (event.target === event.currentTarget) onClose(); }}>
    <div className="aw-modal-header"><div><h2>{title}</h2>{subtitle && <p>{subtitle}</p>}</div><IconButton icon={X} label="关闭" onClick={onClose} /></div>{children}
  </dialog>;
}

export default function AgentWorkbench() {
  const { state, update, storageError } = useWorkbench();
  const [view, setView] = useState<View>('tasks');
  const [sidebarCollapsed, setSidebarCollapsed] = useWorkbenchPreference('groups-collapsed', () => window.matchMedia('(max-width: 1000px)').matches);
  const closeSidebarOverlay = () => { if (window.matchMedia('(max-width: 1000px)').matches) setSidebarCollapsed(true); };
  const [createProjectOpen, setCreateProjectOpen] = useState(false);
  const [deviceDialogTaskId, setDeviceDialogTaskId] = useState<string | null>(null);
  const [connectionEditorId, setConnectionEditorId] = useState<string | null>(null);
  const [nameDialog, setNameDialog] = useState<{ kind: 'group' | 'task'; id?: string } | null>(null);
  const [skillDialog, setSkillDialog] = useState<string | 'new' | null>(null);
  const [grantTask, setGrantTask] = useState<string | null>(null);
  const [tiangongScope, setTiangongScope] = useState<TiangongScope | null>(null);
  const [notice, setNotice] = useState('');
  const [draftResourceRequest, setDraftResourceRequest] = useState<'park' | 'device' | null>(null);
  const workspace = state.workspaces.find(item => item.id === state.activeWorkspaceId);
  const task = state.tasks.find(item => item.id === workspace?.activeTaskId && item.workspaceId === workspace.id);
  const pendingCount = state.calls.filter(item => item.workspaceId === workspace?.id && item.status === 'pending').length + state.changes.filter(item => item.workspaceId === workspace?.id && ['pending', 'conflict'].includes(item.status)).length;
  const context = workspace ? { state, update, workspace, task, notify: setNotice } : null;
  const deviceDialogTask = state.tasks.find(item => item.id === deviceDialogTaskId);
  const chatConnection = currentChatConnection(state, workspace, task);
  const taskHasWork = Boolean(task && (state.calls.some(item => item.taskId === task.id && item.actor === 'agent') || state.changes.some(item => item.taskId === task.id)));
  useEffect(() => { if (!notice) return; const timer = window.setTimeout(() => setNotice(''), 5000); return () => window.clearTimeout(timer); }, [notice]);
  const chooseWorkspace = (id: string) => {
    update(draft => prepareNewTask(draft, id));
    closeSidebarOverlay(); setView('tasks');
  };
  const newTask = (workspaceId?: string) => {
    update(draft => prepareNewTask(draft, workspaceId));
    closeSidebarOverlay(); setView('tasks');
  };
  const openTool = (tab: ToolTab) => {
    if (!workspace) return;
    update(draft => {
      const current = draft.workspaces.find(item => item.id === workspace.id)!;
      if (tab === 'terminal') ensureTaskTerminal(draft, workspace.id, task?.id || null);
      else { current.panel.open = true; current.panel.tab = tab; }
    });
  };
  const standalone = workspace ? isStandaloneChatSpace(workspace) : true;
  const busy = task?.status === 'running' || task?.status === 'authorization';
  const openExtensionPage = (target: 'skills') => { if (!workspace) update(draft => { selectTaskContext(draft, null, ''); }); setView(target); };
  const createExtensionSkill = () => { if (!workspace) update(draft => { selectTaskContext(draft, null, ''); }); setSkillDialog('new'); };

  return <div className={`aw ${state.settings.density === 'compact' ? 'aw-compact' : ''} ${state.settings.largeText ? 'aw-large-text' : ''} ${sidebarCollapsed ? 'aw-sidebar-collapsed' : ''}`}>
    <aside id="aw-project-sidebar" className="aw-sidebar"><button className="aw-sidebar-mobile-close" aria-label="收起项目组" onClick={() => setSidebarCollapsed(true)}><X size={15} /></button>
      <div className="aw-sidebar-header">
        <span className="aw-sidebar-title">AI Studio</span>
      </div>
      <button type="button" className="aw-new-task" onClick={() => newTask()}>
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M12 3H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
          <path d="M18.375 2.625a1 1 0 0 1 3 3l-9.013 9.014a2 2 0 0 1-.853.505l-2.873.84a.5.5 0 0 1-.62-.62l.84-2.873a2 2 0 0 1 .506-.852z" />
        </svg>
        <span>新建聊天</span>
      </button>
      <AgentWorkgroups state={state} update={update} activeWorkspaceId={workspace?.id} activeTaskId={view === 'tasks' ? task?.id : undefined}
        openGroup={chooseWorkspace} newTask={newTask} newStandaloneChat={() => newTask()} createGroup={() => setCreateProjectOpen(true)}
        associateResources={({ workspaceId, taskId }) => setTiangongScope(taskId ? { kind: 'task', workspaceId, taskId } : { kind: 'project', workspaceId })}
        rename={(kind, id) => setNameDialog({ kind, id })}
        openTask={(workspaceId, taskId) => {
          update(draft => { const group = draft.workspaces.find(item => item.id === workspaceId)!; group.activeTaskId = taskId; group.sidebarExpanded = true; draft.activeWorkspaceId = workspaceId; });
          closeSidebarOverlay(); setView('tasks');
        }} />
      <nav className="aw-management" aria-label="AI Studio管理">
        {management.map(({ id, name, icon: Icon }) => <button key={id} className={view === id || (id === 'extensions' && view === 'skills') ? 'is-current' : ''} onClick={() => { if (id === 'extensions' && task?.deviceId && state.devices.find(device => device.id === task.deviceId)?.connected) update(draft => { draft.extensionPreferences ||= { global: {}, devices: {}, selectedDeviceId: '' }; draft.extensionPreferences.selectedDeviceId = task.deviceId!; }); setView(id); }}><Icon size={15} /><span>{name}</span>{id === 'reviews' && pendingCount > 0 && <b>{pendingCount}</b>}</button>)}
        <button className={view === 'settings' ? 'is-current' : ''} onClick={() => setView('settings')}><Settings size={15} /><span>系统配置</span></button>
      </nav>
    </aside>
    {!sidebarCollapsed && <button className="aw-sidebar-shade" aria-label="关闭项目组列表" onClick={() => setSidebarCollapsed(true)} />}
    <section className="aw-content">
      <header className="aw-topbar">
        <button className="aw-sidebar-toggle" title={sidebarCollapsed ? '展开项目组与聊天' : '收起项目组与聊天'} aria-label={sidebarCollapsed ? '展开项目组与聊天' : '收起项目组与聊天'} aria-expanded={!sidebarCollapsed} aria-controls="aw-project-sidebar" onClick={() => setSidebarCollapsed(!sidebarCollapsed)}><PanelLeft size={18} /></button>
        <div className="aw-breadcrumb">
          {view === 'tasks' && workspace && !standalone && <><Folder size={16} /><button onClick={() => chooseWorkspace(workspace.id)} title={workspace.name}>{workspace.name}</button><ChevronRight size={14} /></>}
          {view === 'tasks' ? <><h1 className="aw-active-task-title">{task?.title || '新聊天'}</h1>{task && <Badge tone={taskHasWork ? task.status : 'muted'}>{taskHasWork ? statusLabels[task.status] : standalone ? '聊天' : !workspace?.project && workspace?.deviceIds.length ? '设备任务' : '项目任务'}</Badge>}</> : <h1 className="aw-active-task-title">{viewNames[view]}</h1>}
        </div>
        <div className="aw-topbar-actions">
          {view === 'tasks' && <AgentChatConnection state={state} workspace={workspace} task={task} manage={() => task ? setTiangongScope({ kind: 'task', workspaceId: task.workspaceId, taskId: task.id }) : chatConnection && setDraftResourceRequest(chatConnection.type)} />}
          {view === 'tasks' && task && !chatConnection && canConfigureChatResources(state, workspace) && <Button subtle onClick={() => setTiangongScope({ kind: 'task', workspaceId: task.workspaceId, taskId: task.id })}>关联配置</Button>}
          {view === 'tasks' && task && <>{!workspace?.builtinSystemId && !builtinSystemForService(task.mcpServiceId) && task.kind === 'business' && (task.mcpServiceId || state.grants.some(grant => grant.taskId === task.id)) && <Button icon={ShieldCheck} subtle onClick={() => setGrantTask(task.id)}>任务授权</Button>}{busy && <Button icon={Square} onClick={() => update(draft => { const current = draft.tasks.find(item => item.id === task.id)!; current.status = 'stopped'; current.messages.push(message('system', '已停止任务，已完成结果保持不变。')); })}>停止</Button>}{['failed', 'stopped'].includes(task.status) && <Button icon={Play} onClick={() => update(draft => retryTask(draft, task.id))}>继续执行</Button>}</>}
          {view === 'tasks' && taskHasWork && workspace?.project && <Button icon={FileCode2} subtle aria-label="打开代码审查" onClick={() => openTool('changes')}>代码审查</Button>}
          {view === 'tasks' && taskHasWork && workspace && <Button icon={workspace.panel.open ? PanelRightClose : PanelRight} subtle aria-expanded={workspace.panel.open} aria-label={workspace.panel.open ? '收起开发工具' : '打开开发工具'} onClick={() => update(draft => { const current = draft.workspaces.find(item => item.id === workspace.id)!; current.panel.open = !current.panel.open; })}>开发工具</Button>}
        </div>
      </header>
      {storageError && <div className="aw-inline-warning"><AlertCircle size={15} />{storageError}<Button subtle icon={Download} onClick={() => downloadJson(state)}>导出数据</Button></div>}
      <div className="aw-body">
        <main className={`aw-main ${view === 'tasks' ? 'aw-task-main' : ['resources', 'extensions', 'reviews', 'settings', 'mcp'].includes(view) ? 'aw-management-main' : ''}`}>
          {view === 'settings' ? <SettingsPage state={state} update={update} notify={setNotice} editDevice={id => setConnectionEditorId(id || 'new')} />
            : view === 'extensions' ? <AgentExtensionCenter state={state} update={update} createSkill={createExtensionSkill} manageSkills={() => openExtensionPage('skills')} />
            : view === 'resources' ? <ResourcesPage state={state} workspace={workspace} task={task} manageDevice={() => task && setDeviceDialogTaskId(task.id)} goMcp={() => setView('extensions')} manageTiangong={() => setTiangongScope(task ? { kind: 'task', workspaceId: workspace!.id, taskId: task.id } : workspace?.project ? { kind: 'project', workspaceId: workspace.id } : { kind: 'library' })} update={update} notify={setNotice} />
            : view === 'reviews' ? <ReviewsPage state={state} update={update} workspace={workspace} grantTask={setGrantTask} goTask={id => { update(draft => { const target = draft.tasks.find(item => item.id === id); const group = draft.workspaces.find(item => item.id === target?.workspaceId); if (group) { group.activeTaskId = id; draft.activeWorkspaceId = group.id; } }); setView('tasks'); }} />
            : !context ? <TaskComposer key="home" resourceRequest={draftResourceRequest} onResourceRequestHandled={() => setDraftResourceRequest(null)} state={state} update={update} notify={setNotice} onCreated={() => setView('tasks')} />
            : view === 'skills' ? <><div className="aw-extension-back"><Button subtle icon={ArrowLeft} onClick={() => setView('extensions')}>返回扩展中心</Button></div><SkillsPage {...context} edit={setSkillDialog} goTask={() => setView('tasks')} /></>
            : task ? <TaskDetail key={task.id} {...context} task={task} grant={() => setGrantTask(task.id)} openTool={openTool} goSkills={() => setView('skills')} />
            : <TaskComposer key={`${workspace.id}:${workspace.project?.id || 'none'}`} resourceRequest={draftResourceRequest} onResourceRequestHandled={() => setDraftResourceRequest(null)} {...context} onCreated={() => setView('tasks')} />}
        </main>
        {view === 'tasks' && context && workspace.panel.open && (task || workspace.panel.draftOpen) && <ToolsPanel key={workspace.id} {...context} />}
      </div>
    </section>
    {notice && <div className="aw-toast" role="status"><CheckCircle2 size={16} /><span>{notice}</span><button aria-label="关闭提示" onClick={() => setNotice('')}><X size={13} /></button></div>}
    {deviceDialogTask && <TaskDeviceDialog key={deviceDialogTask.id} state={state} update={update} task={deviceDialogTask} close={() => setDeviceDialogTaskId(null)} notify={setNotice} />}
    {connectionEditorId && <TaskDeviceDialog key={connectionEditorId} state={state} update={update} connectionOnly initialDeviceId={connectionEditorId === 'new' ? undefined : connectionEditorId} close={() => setConnectionEditorId(null)} notify={setNotice} />}
    {createProjectOpen && <NewProjectDialog close={() => setCreateProjectOpen(false)} create={name => { update(draft => { createProjectWorkspace(draft, name); }); setCreateProjectOpen(false); closeSidebarOverlay(); setView('tasks'); }} />}
    {nameDialog && <WorkgroupNameDialog state={state} update={update} target={nameDialog} close={() => setNameDialog(null)} saved={() => { setNameDialog(null); setView('tasks'); }} />}
    {skillDialog && context && <SkillDialog state={state} update={update} workspaceId={workspace.id} skillId={skillDialog === 'new' ? null : skillDialog} onClose={() => setSkillDialog(null)} />}
    {tiangongScope && <TaskDeviceDialog state={state} update={update} resourceType={workspaceChatResourceType(state.workspaces.find(item => item.id === (tiangongScope.kind === 'library' ? '' : tiangongScope.workspaceId)))} scope={tiangongScope} task={tiangongScope.kind === 'task' ? state.tasks.find(item => item.id === tiangongScope.taskId) : undefined} close={() => setTiangongScope(null)} notify={setNotice} />}
    {grantTask && <GrantDialog state={state} update={update} taskId={grantTask} onClose={() => setGrantTask(null)} />}
  </div>;
}

function WorkgroupNameDialog({ state, update, target, close, saved }: {
  state: WorkbenchState; update: UpdateState; target: { kind: 'group' | 'task'; id?: string }; close: () => void; saved: () => void;
}) {
  const existing = target.kind === 'group' ? state.workspaces.find(item => item.id === target.id)?.name : state.tasks.find(item => item.id === target.id)?.title;
  const [name, setName] = useState(existing || '');
  const label = target.kind === 'group' ? '项目组' : '任务';
  return <Modal compact title={`${target.id ? '重命名' : '新建'}${label}`} onClose={close}>
    <form onSubmit={event => {
      event.preventDefault(); if (!name.trim()) return;
      update(draft => {
        if (target.kind === 'task') draft.tasks.find(item => item.id === target.id)!.title = name.trim();
        else if (target.id) { const group = draft.workspaces.find(item => item.id === target.id)!; group.name = name.trim(); group.isWorkgroup = true; if (group.project) { group.project.name = name.trim(); bindGroupProject(draft, group); } }
        else { createProjectWorkspace(draft, name.trim()); }
      }); saved();
    }}><div className="aw-modal-body aw-form"><label>{label}名称<input autoFocus autoComplete="off" value={name} onChange={event => setName(event.target.value)} placeholder={`输入${label}名称`} maxLength={80} /></label></div>
    <div className="aw-modal-footer"><Button type="button" onClick={close}>取消</Button><Button primary type="submit" disabled={!name.trim()}>{target.id ? '保存' : '创建项目组'}</Button></div></form>
  </Modal>;
}

// 沿用图三（插件开发）现有规范的选择器组件，支持点击空白自动收起
export function WorkbenchSelect({
  label,
  open,
  options,
  onToggle,
  onSelect,
  onClose,
  align = 'left',
  widthClass = 'min-w-[120px]',
}: {
  label: string;
  open: boolean;
  options: string[];
  onToggle: () => void;
  onSelect: (value: string) => void;
  onClose?: () => void;
  align?: 'left' | 'right';
  widthClass?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const handleOutside = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        if (onClose) onClose();
        else onToggle();
      }
    };
    document.addEventListener('mousedown', handleOutside);
    return () => document.removeEventListener('mousedown', handleOutside);
  }, [open, onClose, onToggle]);

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={onToggle}
        className={`flex h-8 items-center gap-1.5 rounded-xl border px-2.5 text-[12px] leading-none transition-colors ${
          open ? 'border-[#7771B2] bg-[#EDEFFF] text-[#241F7D]' : 'border-transparent bg-[#f4f4f5] text-[#62626b] hover:bg-[#e9e9ec]'
        }`}
      >
        <span className="leading-none">{label}</span>
        <span className={`flex h-4 w-4 shrink-0 items-center justify-center transition-transform ${open ? '-rotate-180' : ''}`}>
          <ChevronDown size={12} />
        </span>
      </button>
      {open && (
        <>
          <div
            className="fixed inset-0 z-20 cursor-default bg-transparent"
            onClick={onClose || onToggle}
          />
          <div className={`absolute bottom-9.5 ${align === 'right' ? 'right-0' : 'left-0'} z-30 ${widthClass} overflow-hidden rounded-xl border border-[#e4e4e7] bg-white p-1 shadow-[0_8px_24px_rgba(0,0,0,.12)]`}>
            {options.map((option) => (
              <button
                key={option}
                type="button"
                onClick={() => onSelect(option)}
                className={`flex h-8 w-full items-center justify-between rounded-lg px-2.5 text-left text-[12px] ${
                  option === label ? 'bg-[#EDEFFF] font-medium text-[#241F7D]' : 'text-[#52525b] hover:bg-[#f4f4f5]'
                }`}
              >
                <span>{option}</span>
                {option === label && <Check size={12} className="text-[#241F7D]" />}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

function TaskDetail({ state, update, workspace, task, notify, grant, openTool, goSkills }: Context & { task: AgentTask; grant: () => void; openTool: (tab: ToolTab) => void; goSkills: () => void }) {
  const [input, setInput] = useState(task.draft || '');
  const selectedSystem = inferResourceSystem(state, { workspace, deviceId: task.deviceId, links: task.tiangongLinks, prompt: input });
  const bindingType = workspaceChatResourceType(workspace);
  const inheritedResources = projectChatResources(state, workspace);
  const [resourceDialog, setResourceDialog] = useState<'park' | 'device' | null>(null);
  const [initialParkResourceId, setInitialParkResourceId] = useState<string>();
  const [pendingResource, setPendingResource] = useState<PendingChatResource | undefined>(task.resourceDraft);
  const resourceSlash = useRef<{ start: number; end: number } | null>(null);
  const pendingSelection = {
    workspaceId: workspace.id, readOnly: inheritedResources.locked,
    deviceId: pendingResource?.deviceId || '', links: pendingResource?.tiangongLinks || [],
    selectDevice: (id: string) => setPendingResource(id ? { deviceId: id, tiangongLinks: [] } : undefined),
    saveLinks: (links: import('./agentTiangongResources').TiangongLink[]) => setPendingResource(links.length ? { deviceId: '', tiangongLinks: links } : undefined),
  };
  useEffect(() => {
    if (inheritedResources.locked) setPendingResource(undefined);
    update(next => { const current = next.tasks.find(item => item.id === task.id); if (current) current.resourceDraft = inheritedResources.locked ? undefined : pendingResource; });
  }, [pendingResource, inheritedResources.locked, task.id, update]);
  const [attachedFiles, setAttachedFiles] = useState<{ id: string; path: string; name: string }[]>([]);
  const [showSlashMenu, setShowSlashMenu] = useState(false);
  const [slashQuery, setSlashQuery] = useState('');
  const [showSlashFileSubmenu, setShowSlashFileSubmenu] = useState(false);
  const [showAddFileMenu, setShowAddFileMenu] = useState(false);
  const [addMenuView, setAddMenuView] = useState<'main' | 'files'>('main');
  const [fileSearchQuery, setFileSearchQuery] = useState('');
  const [composerMenu, setComposerMenu] = useState<'mode' | 'reasoning' | 'model' | null>(null);
  const [selectedSlashIndex, setSelectedSlashIndex] = useState(0);

  // 系统配置真实模型列表（根据模型服务商配置动态同步）
  const systemModelList = useMemo(() => {
    const list = getAvailableWorkbenchModels(state);
    return list.map(m => m.name || m.id);
  }, [state]);

  // 模型与推理强度状态（推理强度对齐图三：默认 / 高 / 中 / 低）
  const [currentModel, setCurrentModel] = useState(task.model || systemModelList[0] || 'GPT-5.1 Codex');
  const [reasoningLevel, setReasoningLevel] = useState<'默认' | '高' | '中' | '低'>(
    (['默认', '高', '中', '低'].includes(task.reasoning as any) ? (task.reasoning as any) : '默认')
  );

  const bottom = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const followupContainerRef = useRef<HTMLDivElement>(null);
  const previousMessageCount = useRef(task.messages.length);

  const calls = state.calls.filter(item => item.taskId === task.id && item.actor === 'agent');
  const changes = state.changes.filter(item => item.taskId === task.id);
  const device = state.devices.find(item => item.id === task.deviceId);
  const hasWork = calls.length > 0 || changes.length > 0;
  const hasChanges = changes.length > 0;
  const busy = task.status === 'running' || task.status === 'authorization';

  // 工作区与项目内的可用文件列表
  const availableFiles = useMemo(() => {
    const list = workspaceFiles(state, workspace.id).filter(f => !f.deleted);
    if (list.length > 0) {
      return list.map(f => ({
        id: f.id,
        path: f.path,
        name: f.path.split('/').pop() || f.path,
      }));
    }
    return [
      { id: 'f-1', path: 'src/index.ts', name: 'index.ts' },
      { id: 'f-2', path: 'src/manifest.json', name: 'manifest.json' },
      { id: 'f-3', path: 'src/components/Settings.tsx', name: 'Settings.tsx' },
      { id: 'f-4', path: 'src/index.css', name: 'index.css' },
      { id: 'f-5', path: 'package.json', name: 'package.json' },
      { id: 'f-6', path: 'README.md', name: 'README.md' },
    ];
  }, [state, workspace.id]);

  // 点击外部收起各类弹出菜单
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (followupContainerRef.current && !followupContainerRef.current.contains(e.target as Node)) {
        setShowSlashMenu(false);
        setShowSlashFileSubmenu(false);
        setShowAddFileMenu(false);
        setComposerMenu(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => update(draft => {
    const current = draft.tasks.find(item => item.id === task.id);
    if (current) current.draft = input;
  }), [input, task.id, update]);

  useEffect(() => {
    if (hasChanges) update(draft => {
      const current = draft.workspaces.find(item => item.id === workspace.id)!;
      if (!current.panel.open) {
        current.panel.open = true;
        current.panel.tab = 'changes';
      }
    });
  }, [task.id, hasChanges, workspace.id, update]);

  useEffect(() => {
    const incoming = task.messages.slice(previousMessageCount.current);
    previousMessageCount.current = task.messages.length;
    if (incoming.some(item => !(hasWork && item.role === 'assistant' && item.text.startsWith('本轮执行已结束')))) {
      bottom.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
    }
  }, [task.messages.length, hasWork]);

  const clearResourceSlash = () => {
    const range = resourceSlash.current;
    setInput(value => range ? value.slice(0, range.start) + value.slice(range.end) : value);
    resourceSlash.current = null;
  };

  // Resource names and commands share the slash menu.
  const slashCommands = useMemo(() => [
    ...(!inheritedResources.locked && bindingType !== 'device' ? [{ id: 'associate-park', icon: Building2, title: '关联园区', desc: '选择、更换或解除当前聊天的园区', action: () => { setInitialParkResourceId(undefined); setResourceDialog('park'); } }] : []),
    ...(!inheritedResources.locked && bindingType !== 'park' ? [{ id: 'associate-device', icon: Cpu, title: '关联设备', desc: '选择、更换或解除当前聊天的设备', action: () => { setInitialParkResourceId(undefined); setResourceDialog('device'); } }] : []),
    {
      id: 'mcp',
      icon: Plug,
      title: 'MCP',
      desc: '显示 MCP 服务器状态',
      action: () => {
        openTool('terminal');
        notify('已打开终端，正在检查当前工作空间 MCP 服务器状态...');
      },
      isSubmenu: true,
    },
    {
      id: 'usage',
      icon: Clock3,
      title: '使用情况和计费',
      desc: '打开用量和账单设置',
      action: () => notify('当前会话 Token 用量：14,250 Tokens · 账单配额充足'),
    },
    {
      id: 'share',
      icon: Upload,
      title: '分享聊天',
      desc: '创建此聊天快照的链接',
      action: () => {
        navigator.clipboard?.writeText(window.location.href);
        notify('已创建快照并将分享链接复制到剪贴板！');
      },
    },
    {
      id: 'branch',
      icon: RotateCcw,
      title: '创建聊天分支',
      desc: '为此聊天创建分支',
      action: () => {
        update(draft => {
          startTask(draft, {
            workspaceId: workspace.id,
            prompt: `[分支] 继续深入开发：${task.title}`,
            kind: task.kind,
            deviceId: task.deviceId || undefined,
            model: currentModel,
          });
        });
        notify('已成功为此任务创建全新讨论分支');
      },
      isSubmenu: true,
    },
    {
      id: 'compact',
      icon: RefreshCw,
      title: '压缩',
      desc: '压缩此聊天的上下文（已使用 90%）',
      action: () => notify('已执行上下文智能压缩，释放 45% Token 缓冲区空间。'),
    },
    {
      id: 'feedback',
      icon: MessageSquare,
      title: '反馈',
      desc: '发送有关此聊天的反馈',
      action: () => notify('感谢反馈！我们将持续改进百川 Agent 编码智能体体验。'),
    },
    {
      id: 'add-file',
      icon: Folder,
      title: '在项目中工作',
      desc: '在项目中开始聊天',
      action: () => setShowSlashFileSubmenu(true),
      isSubmenu: true,
    },
    {
      id: 'archive',
      icon: Archive,
      title: '归档',
      desc: '归档当前聊天',
      action: () => {
        update(draft => {
          const t = draft.tasks.find(item => item.id === task.id);
          if (t) t.archived = true;
        });
        notify('当前任务已移入归档区');
      },
    },
    {
      id: 'delete',
      icon: Trash2,
      title: '删除任务',
      desc: '删除当前聊天及任务记录，保留项目文件与已保存的 Skill',
      action: () => { update(draft => { deleteTask(draft, task.id); }); notify('任务已删除'); },
    },
    {
      id: 'fast',
      icon: Zap,
      title: '快速',
      desc: '1.5 倍速，增加使用量',
      action: () => notify('已开启 1.5 倍速加速模式'),
    },
    {
      id: 'reasoning',
      icon: Cpu,
      title: '推理',
      desc: `${reasoningLevel}`,
      action: () => setComposerMenu('reasoning'),
      isSubmenu: true,
    },
    {
      id: 'new',
      icon: Plus,
      title: '新聊天',
      desc: '在同一工作空间中开启空白聊天',
      action: () => update(draft => prepareNewTask(draft, workspace.id)),
    },
  ], [workspace.id, task.id, task.title, task.kind, task.deviceId, currentModel, reasoningLevel, update, openTool, notify, inheritedResources.locked, bindingType]);

  // 根据用户在 / 后输入的关键词检索命令
  const filteredSlashCommands = useMemo(() => {
    const commands = slashQuery ? slashCommands.filter(command => command.title.toLowerCase().includes(slashQuery) || command.desc.toLowerCase().includes(slashQuery) || command.id.includes(slashQuery)) : slashCommands;
    const types: ('park' | 'device')[] = inheritedResources.locked ? [] : bindingType ? [bindingType] : ['park', 'device'];
    const resources = findResourceMentions(state, slashQuery, types).map(resource => ({
      id: `resource-${resource.type}-${resource.id}`, icon: resource.type === 'park' ? Building2 : Cpu,
      title: resource.name, desc: '', isSubmenu: false,
      action: () => {
        const selection = resourceMentionDraft(state, resource.type, resource.id);
        if (selection) { setPendingResource(selection); textareaRef.current?.focus(); }
        else if (resource.type === 'park') { setInitialParkResourceId(resource.id); setResourceDialog('park'); }
      },
    }));
    return [...commands.filter(command => command.id.startsWith('associate-')), ...resources, ...commands.filter(command => !command.id.startsWith('associate-'))];
  }, [slashCommands, slashQuery, state, inheritedResources.locked, bindingType]);

  // / 子菜单中的文件列表检索
  const filteredSlashFiles = useMemo(() => {
    if (!slashQuery || slashQuery === 'file') return availableFiles;
    return availableFiles.filter(
      f => f.name.toLowerCase().includes(slashQuery) || f.path.toLowerCase().includes(slashQuery)
    );
  }, [availableFiles, slashQuery]);

  // "+" 菜单中的文件列表检索
  const filteredAddMenuFiles = useMemo(() => {
    if (!fileSearchQuery) return availableFiles;
    return availableFiles.filter(
      f => f.name.toLowerCase().includes(fileSearchQuery.toLowerCase()) || f.path.toLowerCase().includes(fileSearchQuery.toLowerCase())
    );
  }, [availableFiles, fileSearchQuery]);

  // 监听输入，实时捕获 / 触发
  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const val = e.target.value;
    setInput(val);

    const cursorPos = e.target.selectionStart || val.length;
    const textBefore = val.slice(0, cursorPos);
    const slashMatch = resourceSlashRange(textBefore);
    resourceSlash.current = slashMatch || null;

    if (slashMatch) {
      setShowSlashMenu(true);
      setSlashQuery(slashMatch.query);
      setShowSlashFileSubmenu(false);
      setSelectedSlashIndex(0);
    } else {
      setShowSlashMenu(false);
      setSlashQuery('');
      setShowSlashFileSubmenu(false);
    }
  };

  // 添加上下文文件
  const handleAttachFile = (file: { id: string; path: string; name: string }) => {
    if (!attachedFiles.some(f => f.path === file.path)) {
      setAttachedFiles(prev => [...prev, file]);
      notify(`已关联文件上下文：${file.name}`);
    }
    // 移除末尾输入的 / 或 /关键词
    clearResourceSlash();
    setShowSlashMenu(false);
    setShowSlashFileSubmenu(false);
    setShowAddFileMenu(false);
    textareaRef.current?.focus();
  };

  // 本地文件上传
  const handleUploadLocalFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const uploaded = {
      id: `upload-${Date.now()}`,
      path: `uploads/${file.name}`,
      name: file.name,
    };
    handleAttachFile(uploaded);
    e.target.value = '';
  };

  // 提交需求与关联文件
  const submit = () => {
    if ((!input.trim() && attachedFiles.length === 0) || busy) return;
    let fullPrompt = input.trim();
    if (attachedFiles.length > 0) {
      const filesContext = `[关联上下文文件：${attachedFiles.map(f => f.path).join(', ')}]`;
      fullPrompt = fullPrompt ? `${filesContext}\n\n${fullPrompt}` : `请分析并检查关联项目文件：${attachedFiles.map(f => f.path).join(', ')}`;
    }
    const resourceProblem = commitPendingChatResource(structuredClone(state), task.id, pendingResource);
    if (resourceProblem) { notify(resourceProblem); return; }
    update(draft => {
      if (commitPendingChatResource(draft, task.id, pendingResource)) return;
      const t = draft.tasks.find(item => item.id === task.id);
      if (t) {
        t.model = currentModel;
        t.reasoning = reasoningLevel;
        t.resourceDraft = undefined;
      }
      continueTask(draft, task.id, fullPrompt);
    });
    setInput('');
    setPendingResource(undefined);
    setAttachedFiles([]);
    setShowSlashMenu(false);
    setShowSlashFileSubmenu(false);
  };

  // 键盘快捷响应（上下方向键与回车直达命令）
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (showSlashMenu) {
      if (e.key === 'Escape') {
        e.preventDefault();
        setShowSlashMenu(false);
        setShowSlashFileSubmenu(false);
        return;
      }
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        const max = showSlashFileSubmenu ? filteredSlashFiles.length : filteredSlashCommands.length;
        setSelectedSlashIndex(prev => (prev + 1) % Math.max(1, max));
        return;
      }
      if (e.key === 'ArrowUp') {
        e.preventDefault();
        const max = showSlashFileSubmenu ? filteredSlashFiles.length : filteredSlashCommands.length;
        setSelectedSlashIndex(prev => (prev - 1 + max) % Math.max(1, max));
        return;
      }
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        if (showSlashFileSubmenu) {
          const file = filteredSlashFiles[selectedSlashIndex] || filteredSlashFiles[0];
          if (file) handleAttachFile(file);
        } else {
          const cmd = filteredSlashCommands[selectedSlashIndex] || filteredSlashCommands[0];
          if (cmd) {
            if (cmd.id === 'add-file') {
              setShowSlashFileSubmenu(true);
            } else {
              cmd.action();
              clearResourceSlash();
              setShowSlashMenu(false);
            }
          }
        }
        return;
      }
    }

    if (e.key === 'Enter' && !e.shiftKey && !e.nativeEvent.isComposing) {
      e.preventDefault();
      submit();
    }
  };

  const showChanges = (fileId?: string) => update(draft => {
    const current = draft.workspaces.find(item => item.id === workspace.id)!;
    current.panel.open = true;
    current.panel.tab = 'changes';
    if (fileId) current.panel.fileId = fileId;
  });

  return (
    <div className="aw-task-detail">
      <div className="aw-conversation">
        <div className="aw-conversation-inner">
          {task.messages.map(item => {
            if (hasWork && item.role === 'assistant' && item.text.startsWith('本轮执行已结束')) return null;
            return item.role === 'user' ? (
              <div className="aw-user-message" key={item.id}>
                <p>{item.text}</p>
              </div>
            ) : item.role === 'system' ? (
              <div className="aw-system-message" key={item.id}>
                <CheckCircle2 size={13} />
                {item.text}
              </div>
            ) : (
              <div className="aw-chat-assistant" key={item.id}>
                <span className="aw-ai-avatar">AI</span>
                <div>
                  {item.model && <small className="aw-model-reply-label">{item.model}</small>}
                  <p>{item.text}</p>
                </div>
              </div>
            );
          })}
          {task.modelRequest?.status === 'queued' && task.status === 'running' && (
            <div className="aw-model-pending">
              <Loader2 size={14} className="aw-spin" />
              正在请求模型回复…
            </div>
          )}
          {hasWork && (
            <TaskWorkSummary
              state={state}
              update={update}
              workspace={workspace}
              task={task}
              calls={calls}
              changes={changes}
              grant={grant}
              showChanges={showChanges}
              optimize={() => setInput('继续完善当前任务的交互和内容，保留现有结构。')}
              notify={notify}
            />
          )}
          {state.skills.some(item => item.sourceTaskId === task.id) && (
            <Button subtle icon={Layers} onClick={goSkills}>
              查看生成的 Skill 草稿
            </Button>
          )}
          {hasWork && (
            <div className="aw-task-tool-shortcuts">
              <Button
                subtle
                icon={Terminal}
                onClick={() =>
                  update(draft => {
                    ensureTaskTerminal(draft, workspace.id, task.id);
                  })
                }
              >
                打开终端
              </Button>
              <Button subtle icon={FolderOpen} onClick={() => openTool('files')}>
                查看文件
              </Button>
              <Button
                subtle
                icon={Layers}
                onClick={() => {
                  update(draft => {
                    draft.skills.push(
                      makeSkill(
                        workspace.id,
                        task.id,
                        `${task.title.slice(0, 16)} Skill`,
                        task.messages.find(item => item.role === 'user')?.text || task.title
                      )
                    );
                  });
                  notify('已将任务整理为 Skill 草稿');
                }}
              >
                保存为 Skill
              </Button>
            </div>
          )}
          <div ref={bottom} />
        </div>
      </div>

      {/* 补充指令交互区（完全重构支持 新增文件 / 快捷/添加文件 / 模型切换，对齐图一与图二） */}
      <div className="aw-followup">
        <div className="aw-followup-box" ref={followupContainerRef}>
          {/* 1. 浮动 Slash 快捷菜单（精准复刻图二布局与命令） */}
          {showSlashMenu && (
            <>
              <div
                className="fixed inset-0 z-20 cursor-default bg-transparent"
                onClick={() => {
                  setShowSlashMenu(false);
                  setShowSlashFileSubmenu(false);
                }}
              />
              <div key={`${slashQuery}:${showSlashFileSubmenu}`} className="aw-slash-menu-popover">
                {showSlashFileSubmenu ? (
                  <div className="slash-submenu-files">
                    <div className="slash-header">
                      <button
                        type="button"
                        className="slash-back-btn"
                        onClick={() => {
                          setShowSlashFileSubmenu(false);
                          setSlashQuery('');
                        }}
                      >
                        <ArrowLeft size={13} /> 返回命令菜单
                      </button>
                      <span>选择工作区上下文文件</span>
                    </div>
                    <div className="slash-file-list">
                      {filteredSlashFiles.length > 0 ? (
                        filteredSlashFiles.map(file => (
                          <button
                            key={file.path}
                            type="button"
                            className="slash-file-item"
                            onClick={() => handleAttachFile(file)}
                          >
                            <FileCode2 size={15} />
                            <div className="slash-file-text">
                              <strong>{file.name}</strong>
                              <small>{file.path}</small>
                            </div>
                            <Plus size={13} />
                          </button>
                        ))
                      ) : (
                        <div className="slash-empty">未匹配到项目文件</div>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="slash-menu-list">
                    {!filteredSlashCommands.length && <p className="aw-resource-menu-empty">{inheritedResources.locked ? '当前聊天继承项目资源，无法更换关联' : '没有匹配的资源或命令'}</p>}
                    {filteredSlashCommands.map((cmd, idx) => {
                      const CmdIcon = cmd.icon;
                      return (
                        <button
                          key={cmd.id}
                          type="button"
                          className={`slash-menu-item ${idx === selectedSlashIndex ? 'is-active' : ''}`}
                          onClick={() => {
                            if (cmd.id === 'add-file') {
                              setShowSlashFileSubmenu(true);
                            } else {
                              cmd.action();
                              clearResourceSlash();
                              setShowSlashMenu(false);
                            }
                          }}
                        >
                          {!cmd.id.startsWith('associate-') && !cmd.id.startsWith('resource-') && <span className="slash-item-icon"><CmdIcon size={16} /></span>}
                          <div className="slash-item-content">
                            <strong className="slash-item-title">{cmd.title}</strong>
                            {cmd.desc && <span className="slash-item-desc">{cmd.desc}</span>}
                          </div>
                          {cmd.isSubmenu && <ChevronRight size={14} className="slash-item-arrow" />}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            </>
          )}

          {/* 2. 已附加的文件上下文标签 */}
          {attachedFiles.length > 0 && (
            <div className="aw-attached-files-bar">
              {attachedFiles.map(file => (
                <span key={file.path} className="aw-attached-file-chip">
                  <FileCode2 size={12} />
                  <span className="file-name" title={file.path}>
                    {file.name}
                  </span>
                  <button
                    type="button"
                    className="remove-file-btn"
                    onClick={() => setAttachedFiles(prev => prev.filter(f => f.path !== file.path))}
                    title="移除文件"
                    aria-label="移除文件"
                  >
                    <X size={11} />
                  </button>
                </span>
              ))}
            </div>
          )}

          <div className="aw-inline-composer-input">
          {!inheritedResources.locked && (pendingResource || (workspace.builtinSystemId && !task.deviceId && !effectiveTiangongLinks(state, workspace.id, task).length)) && <div className="aw-inline-resource-entry">
            <AgentResourceBinding type={pendingResource?.tiangongLinks.length ? 'park' : pendingResource?.deviceId ? 'device' : bindingType!} state={state} update={update} deviceId={pendingResource?.deviceId} links={pendingResource?.tiangongLinks || []} draftSelection={pendingSelection} systemId={workspace.builtinSystemId} notify={notify} />
          </div>}
          {resourceDialog && <TaskDeviceDialog state={state} update={update} draftSelection={pendingSelection} resourceType={resourceDialog} initialParkResourceId={initialParkResourceId} systemId={workspace.builtinSystemId} close={() => { setResourceDialog(null); setInitialParkResourceId(undefined); }} onSelected={() => { setResourceDialog(null); setInitialParkResourceId(undefined); textareaRef.current?.focus(); }} notify={notify} />}
          {/* 3. 核心文本输入框 */}
          <textarea
            ref={textareaRef}
            aria-label="补充任务指令"
            value={input}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            disabled={busy}
            placeholder={
              busy
                ? 'Agent 正在处理当前步骤…'
                : hasWork
                ? '描述你想要开发或修改的内容… (输入 / 可添加文件或快捷操作)'
                : '输入你想讨论的问题… (输入 / 可添加文件或快捷操作)'
            }
          />

          </div>
          {/* 4. 底栏操作条：左侧[+]新增文件、[Build ⌵]开发模式、[默认 ⌵]推理强度；右侧[系统模型 ⌵]、[语音]与[发送]（100% 沿用图三规范，点击空白自动收起） */}
          <div className="aw-followup-footer flex items-center justify-between gap-2 mt-2">
            {/* 左侧控制区（100% 对齐图三现有设计） */}
            <div className="flex items-center gap-1.5 flex-wrap">
              {/* 新增（文件）弹出菜单按钮 */}
              <div className="relative">
                <button
                  type="button"
                  className={`flex h-8 w-8 items-center justify-center rounded-xl border text-[12px] leading-none transition-colors ${
                    showAddFileMenu ? 'border-[#7771B2] bg-[#EDEFFF] text-[#241F7D]' : 'border-transparent bg-[#f4f4f5] text-[#62626b] hover:bg-[#e9e9ec]'
                  }`}
                  title="新增文件"
                  aria-label="新增文件"
                  onClick={() => {
                    setShowAddFileMenu(prev => !prev);
                    setComposerMenu(null);
                  }}
                >
                  <Plus size={15} />
                </button>
                {showAddFileMenu && (
                  <>
                    <div
                      className="fixed inset-0 z-20 cursor-default bg-transparent"
                      onClick={() => setShowAddFileMenu(false)}
                    />
                    <div className="absolute bottom-9.5 left-0 z-30 min-w-[280px] overflow-hidden rounded-xl border border-[#e4e4e7] bg-white p-2 shadow-[0_8px_24px_rgba(0,0,0,.12)]">
                      <div className="flex items-center justify-between px-2 py-1 text-[12px] font-medium text-[#27272a] border-b border-[#f0f0f2] pb-1.5">
                        <span>新增文件</span>
                        <span className="text-[10px] text-[#9a9faa]">添加文件上下文</span>
                      </div>
                      {/* 纯净无蓝框搜索栏 */}
                      <div className="my-2 flex h-8 items-center gap-2 rounded-lg bg-[#f4f4f5] px-2.5 text-[#9a9faa]">
                        <Search size={13} className="shrink-0 text-[#9a9faa]" />
                        <input
                          autoFocus
                          type="text"
                          placeholder="搜索项目文件路径..."
                          value={fileSearchQuery}
                          onChange={e => setFileSearchQuery(e.target.value)}
                          className="min-w-0 flex-1 border-0 bg-transparent p-0 text-[12px] text-[#27272a] outline-none placeholder:text-[#9a9faa] focus:outline-none focus:ring-0 focus:border-0"
                          style={{ outline: 'none', border: 'none', boxShadow: 'none' }}
                        />
                        {fileSearchQuery && (
                          <button
                            type="button"
                            onClick={() => setFileSearchQuery('')}
                            className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full text-[#9a9faa] hover:bg-[#e4e4e7] hover:text-[#52525b]"
                            title="清空搜索"
                          >
                            <X size={10} />
                          </button>
                        )}
                      </div>
                      <div className="max-h-[200px] overflow-y-auto space-y-0.5">
                        {filteredAddMenuFiles.length > 0 ? (
                          filteredAddMenuFiles.map(file => {
                            const isAttached = attachedFiles.some(f => f.path === file.path);
                            return (
                              <button
                                key={file.path}
                                type="button"
                                onClick={() => handleAttachFile(file)}
                                className={`flex h-8 w-full items-center gap-2 rounded-lg px-2 text-left text-[12px] transition-colors ${
                                  isAttached ? 'bg-[#EDEFFF] font-medium text-[#241F7D]' : 'text-[#3f3f46] hover:bg-[#f4f4f5]'
                                }`}
                              >
                                <FileCode2 size={13} className={`shrink-0 ${isAttached ? 'text-[#241F7D]' : 'text-[#8e8e98]'}`} />
                                <span className="min-w-0 flex-1 truncate">{file.name}</span>
                                {isAttached && <Check size={12} className="shrink-0 text-[#241F7D]" />}
                              </button>
                            );
                          })
                        ) : (
                          <div className="p-3 text-center text-[#9a9faa] text-[11px]">未匹配到相关项目文件</div>
                        )}
                      </div>
                      <div className="border-t border-[#f0f0f2] pt-1.5 mt-1">
                        <label className="flex h-7.5 items-center justify-center gap-1.5 rounded-lg text-[11px] font-medium text-[#62626b] hover:bg-[#f4f4f5] hover:text-[#241F7D] cursor-pointer transition-colors">
                          <Upload size={12} /> 从本地选择文件...
                          <input
                            type="file"
                            style={{ display: 'none' }}
                            onChange={handleUploadLocalFile}
                          />
                        </label>
                      </div>
                    </div>
                  </>
                )}
              </div>

              {/* 模式选择 (Build / Plan) —— 100% 沿用图三现有设计 */}
              <WorkbenchSelect
                label={task.runMode || 'Build'}
                open={composerMenu === 'mode'}
                options={['Build', 'Plan']}
                onToggle={() => {
                  setComposerMenu(composerMenu === 'mode' ? null : 'mode');
                  setShowAddFileMenu(false);
                }}
                onSelect={(val) => {
                  update(draft => {
                    draft.tasks.find(item => item.id === task.id)!.runMode = val as 'Build' | 'Plan';
                  });
                  setComposerMenu(null);
                }}
                onClose={() => setComposerMenu(null)}
              />

              {/* 推理强度 (默认 / 高 / 中 / 低) —— 100% 沿用图三现有设计 */}
              <WorkbenchSelect
                label={reasoningLevel}
                open={composerMenu === 'reasoning'}
                options={['默认', '高', '中', '低']}
                onToggle={() => {
                  setComposerMenu(composerMenu === 'reasoning' ? null : 'reasoning');
                  setShowAddFileMenu(false);
                }}
                onSelect={(val) => {
                  setReasoningLevel(val as '默认' | '高' | '中' | '低');
                  update(draft => {
                    const t = draft.tasks.find(item => item.id === task.id);
                    if (t) t.reasoning = val as any;
                  });
                  setComposerMenu(null);
                  notify(`已将推理深度设为：${val}`);
                }}
                onClose={() => setComposerMenu(null)}
              />
            </div>

            {/* 右侧控制区：系统模型切换、语音与发送 */}
            <div className="flex items-center gap-2">
              {/* 系统配置模型选择器（真实系统配置模型，沿用图三现有设计） */}
              <WorkbenchSelect
                label={currentModel}
                open={composerMenu === 'model'}
                options={systemModelList}
                align="right"
                widthClass="min-w-[160px]"
                onToggle={() => {
                  setComposerMenu(composerMenu === 'model' ? null : 'model');
                  setShowAddFileMenu(false);
                }}
                onSelect={(val) => {
                  setCurrentModel(val);
                  update(draft => {
                    const t = draft.tasks.find(item => item.id === task.id);
                    if (t) t.model = val;
                  });
                  setComposerMenu(null);
                  notify(`已切换模型为：${val}`);
                }}
                onClose={() => setComposerMenu(null)}
              />

              {/* 语音输入按钮 */}
              <button
                type="button"
                className="flex h-8 w-8 items-center justify-center rounded-xl text-[#858a96] hover:bg-[#f4f4f7] transition-colors"
                aria-label="语音输入"
                title="语音输入"
                onClick={() => notify('当前环境未启用麦克风输入，可直接输入需求文字。')}
              >
                <Mic size={15} />
              </button>

              {/* 发送按钮 */}
              <button
                type="button"
                className="flex h-8 w-8 items-center justify-center rounded-xl bg-[#241F7D] text-white disabled:bg-[#d9d9e3] shadow-sm transition hover:bg-[#1B175F]"
                disabled={(!input.trim() && attachedFiles.length === 0) || busy}
                onClick={submit}
                aria-label="发送指令"
              >
                <ArrowUp size={14} />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function TaskWorkSummary({ state, update, workspace, task, calls, changes, grant, showChanges, optimize, notify }: {
  state: WorkbenchState; update: UpdateState; workspace: Workspace; task: AgentTask; calls: ToolCall[]; changes: FileChange[];
  grant: () => void; showChanges: (id?: string) => void; optimize: () => void; notify: (text: string) => void;
}) {
  const finishedCalls = calls.filter(call => call.status === 'done' || call.status === 'denied').length;
  const reviewed = changes.every(change => change.status === 'accepted' || change.status === 'rejected');
  const steps = [...calls.map(call => ({ id: call.id, name: call.label, done: call.status === 'done' || call.status === 'denied', denied: call.status === 'denied', active: call.status === 'queued' || call.status === 'pending', error: call.status === 'blocked' })),
    ...(changes.length ? [{ id: 'review-files', name: '审查文件修改与版本差异', done: reviewed, denied: false, active: !reviewed, error: changes.some(change => change.status === 'conflict') }] : []),
    { id: 'confirm-result', name: '确认任务结果', done: task.status === 'completed', denied: false, active: false, error: false }];
  const finishedSteps = steps.filter(step => step.done).length;
  const active = calls.find(call => call.status === 'queued' || call.status === 'pending' || call.status === 'blocked');
  const device = state.devices.find(item => item.id === task.deviceId);
  const actionCalls = calls.filter(call => call.status === 'pending' || call.status === 'blocked');
  return <div className="aw-work-summary">
    <section><h2>1. AI 分析反馈</h2><div className="aw-summary-card"><div className="aw-summary-card-title"><span><CheckCircle2 size={15} />任务上下文已整理</span><small className="aw-summary-success">已完成</small></div><p>{device ? <>当前任务关联 <code>{device.name}</code>，设备操作使用这台设备。</> : workspace.project ? <>当前项目为 <code>{workspace.project.name}</code>，任务根据你的需求组织开发步骤与产物。</> : <>本次任务在 <code>{workspace.name}</code> 中执行，使用明确选择的资源。</>}</p><p className="aw-summary-muted">执行目标、工具调用和修改结果分别保留记录，文件修改完成审查后生效。</p></div></section>
    <section><h2>2. 开发任务规划</h2><div className="aw-summary-card"><div className="aw-summary-card-title"><span>任务执行计划</span><small>{finishedSteps}/{steps.length} 已完成</small></div><div className="aw-summary-progress"><span style={{ width: `${steps.length ? finishedSteps / steps.length * 100 : 0}%` }} /></div><div className="aw-summary-steps">{steps.map(step => <div key={step.id} className={`${step.done ? 'is-done' : ''} ${step.error ? 'has-error' : ''}`}><span className="aw-summary-step-icon">{step.done ? <Check size={10} /> : step.error ? <AlertCircle size={11} /> : <i />}</span><span>{step.name}{step.denied ? '（已拒绝）' : ''}</span></div>)}</div></div></section>
    {changes.length > 0 && <section><h2>3. 文件修改记录</h2><div className="aw-summary-card aw-summary-files"><div className="aw-summary-card-title"><span>修改项目文件</span><small>{reviewed ? '已审查' : `${changes.length} 个文件`}</small></div>{changes.map(change => { const count = changeLineCounts(change); return <button key={change.id} onClick={() => showChanges(change.fileId)}><FileCode2 size={12} /><span>{change.path}</span><b className="aw-review-added">+{count.added}</b><b className="aw-review-removed">−{count.removed}</b></button>; })}</div></section>}
    {(task.status === 'running' || task.status === 'authorization' || task.status === 'failed') && <section><h2>{changes.length ? '4' : '3'}. 执行状态</h2><div className={`aw-summary-card ${task.status === 'failed' ? 'has-error' : ''}`}><div className="aw-summary-card-title"><span>{task.status === 'running' ? <Loader2 size={14} className="aw-spin" /> : <AlertCircle size={14} />}{active?.label || '处理任务步骤'}</span><small>{statusLabels[task.status]}</small></div><p>{active?.status === 'pending' ? '本次操作等待确认，实际目标与参数如下。' : active?.output || `${finishedCalls} / ${calls.length} 个工具步骤已结束。`}</p></div></section>}
    {actionCalls.length > 0 && <div className="aw-summary-approval-calls">{actionCalls.map(call => <CallCard key={call.id} state={state} update={update} call={call} grant={grant} />)}</div>}
    {calls.length > 0 && <details className="aw-summary-call-history"><summary>查看执行记录 <span>{calls.length} 项</span></summary><div>{calls.map(call => <CallCard key={call.id} state={state} update={update} call={call} grant={grant} />)}</div></details>}
    {(task.status === 'review' || task.status === 'completed') && <section className="aw-summary-completion"><h2>{changes.length ? '4' : '3'}. AI 完成反馈</h2><p>{task.status === 'completed' ? '任务结果已确认，操作记录和产物已保留。' : changes.length ? `已生成 ${changes.length} 个文件的修改方案，可在右侧代码审查面板查看具体差异。${reviewed ? '文件审查已完成，可以确认任务结果。' : '请先接受或放弃修改，再确认任务结果。'}` : '本轮工具执行已结束，请查看输出并确认任务结果。'}</p><div className="aw-summary-completion-actions"><Button primary onClick={optimize}>继续优化</Button>{changes.length > 0 && <Button onClick={() => showChanges()}>查看代码变更</Button>}{task.status === 'review' && <Button icon={Check} disabled={!reviewed} onClick={() => { update(draft => confirmTask(draft, task.id)); notify('已确认结果，不会重复执行工具操作'); }}>确认结果</Button>}</div></section>}
  </div>;
}

function CallCard({ call, state, update, index, grant }: { call: ToolCall; state: WorkbenchState; update: UpdateState; index?: number; grant?: () => void }) {
  const [expanded, setExpanded] = useState(call.status === 'pending' || call.status === 'blocked');
  const labels = { queued: '等待执行', pending: '等待确认', done: '已执行', denied: '已拒绝', blocked: '已阻止' };
  const Icon = call.status === 'done' ? CheckCircle2 : call.status === 'blocked' ? AlertCircle : call.status === 'pending' ? ShieldCheck : call.status === 'denied' ? X : Clock3;
  const reason = call.status === 'pending' ? callBlockReason(state, call) : '';
  return <article className={`aw-call-card ${call.status}`}><button className="aw-call-heading" aria-expanded={expanded} onClick={() => setExpanded(!expanded)}><span className={`aw-call-icon ${call.status}`}><Icon size={15} /></span><span><strong>{index !== undefined && <small>{String(index + 1).padStart(2, '0')}</small>}{call.label}</strong><small>{call.target}</small></span><Badge tone={call.status}>{labels[call.status]}</Badge><ChevronDown size={13} className={expanded ? 'is-expanded' : ''} /></button>
    {(expanded || call.status === 'pending' || call.status === 'blocked') && <div className="aw-call-details"><div className="aw-detail-label">实际目标</div><p className="aw-call-target">{call.target}{call.deviceId && <code>{call.deviceId}</code>}</p><AgentBusinessDiff state={state} update={update} call={call} /><TiangongActionDiff state={state} update={update} call={call} /><div className="aw-detail-label">调用参数</div><pre>{call.parameters}</pre>{call.output && <><div className="aw-detail-label">执行结果</div><pre className="aw-call-output">{call.output}</pre></>}{call.status === 'pending' && <div className="aw-approval"><p>{reason || '确认后仅执行这一次操作。参数或授权范围改变时需要重新确认。'}</p><Button onClick={() => update(draft => reviewCall(draft, call.id, false))}>拒绝本次操作</Button><Button primary icon={Check} disabled={Boolean(reason)} onClick={() => update(draft => reviewCall(draft, call.id, true))}>确认执行</Button></div>}{call.status === 'blocked' && call.kind.startsWith('mcp-') && grant && <Button icon={ShieldCheck} onClick={grant}>调整任务授权</Button>}</div>}
  </article>;
}

function ChangeCard({ change, state, update, openEditor }: { change: FileChange; state: WorkbenchState; update: UpdateState; openEditor: () => void }) {
  const [expanded, setExpanded] = useState(true);
  const [split, setSplit] = useState(false);
  const file = state.files.find(item => item.id === change.fileId);
  const conflict = change.status === 'conflict' || (change.status === 'pending' && (file?.version || 0) !== change.baseVersion);
  const blocked = changeWriteBlockReason(state, change);
  const actionable = change.status === 'pending' || change.status === 'conflict';
  return <article className="aw-change-card"><div className="aw-change-heading"><button onClick={() => setExpanded(!expanded)}><ChevronDown size={13} className={expanded ? 'is-expanded' : ''} /><FileCode2 size={14} /><span>{change.path}</span></button><Badge tone={conflict ? 'blocked' : change.status}>{conflict ? '版本冲突' : { pending: '待审查', accepted: '已接受', rejected: '已拒绝', conflict: '版本冲突' }[change.status]}</Badge></div>
    {expanded && <><div className="aw-diff-toolbar"><span>基准 v{change.baseVersion} · 当前 v{file?.version || 0}</span><div className="aw-segmented"><button className={!split ? 'is-active' : ''} onClick={() => setSplit(false)}>统一</button><button className={split ? 'is-active' : ''} onClick={() => setSplit(true)}>拆分</button></div></div>
      {conflict && <div className="aw-inline-warning"><AlertCircle size={14} /><span>文件已更新，请重新审查。手动修改内容不会被自动覆盖。</span></div>}
      {blocked && actionable && <div className="aw-inline-warning"><AlertCircle size={14} />{blocked}</div>}
      <div className={`aw-diff ${split ? 'aw-diff-split' : ''}`}><pre className="aw-diff-before">{(conflict ? file?.content || '' : change.before).split('\n').map((line, i) => <div key={i}><span>{i + 1}</span><code>− {line || ' '}</code></div>)}</pre><pre className="aw-diff-after">{change.after.split('\n').map((line, i) => <div key={i}><span>{i + 1}</span><code>+ {line || ' '}</code></div>)}</pre></div>
      <div className="aw-change-actions"><Button subtle icon={Pencil} onClick={openEditor}>在编辑器打开</Button>{actionable && <><Button onClick={() => update(draft => { const item = draft.changes.find(current => current.id === change.id)!; item.status = 'rejected'; })}>拒绝修改</Button>{conflict ? <Button icon={RefreshCw} onClick={() => update(draft => { const item = draft.changes.find(current => current.id === change.id)!; item.status = 'conflict'; refreshChange(draft, change.id); })}>更新差异并重新审查</Button> : <Button primary icon={Check} disabled={Boolean(blocked)} onClick={() => update(draft => acceptChange(draft, change.id))}>接受修改</Button>}</>}</div>
    </>}
  </article>;
}

function ResourcesPage({ state, workspace, task, manageDevice, goMcp, manageTiangong, update, notify }: { state: WorkbenchState; workspace?: Workspace; task?: AgentTask; manageDevice: () => void; goMcp: () => void; manageTiangong: () => void; update: UpdateState; notify: (text: string) => void }) {
  const device = state.devices.find(item => item.id === task?.deviceId);
  const services = state.services;
  return <ManagementPage className="aw-resources-page"><ManagementHeading title="资源连接" description="设备关联仅作用于当前任务，项目上下文沿用任务所在项目。">{task && <Button icon={Cpu} primary onClick={manageDevice}>关联设备</Button>}</ManagementHeading>
    <section className="aw-management-section"><div className="aw-management-section-heading"><h2>当前任务设备</h2><span>最多一台设备</span></div>
      {task ? device ? <div className="aw-management-list"><div className="aw-management-row"><span className="aw-management-row-icon"><Cpu size={22} strokeWidth={1.6} /></span><div className="aw-management-row-copy"><h3>{device.name}</h3><p>{device.connection ? `SSH · ${device.connection.username}@${device.connection.host}:${device.connection.port}` : device.address}</p><small>{task.title}</small></div><div className="aw-management-row-actions"><Badge tone={device.connected ? 'success' : 'muted'}>{device.connected ? '在线' : '离线'}</Badge><Button onClick={manageDevice}>查看与管理</Button></div></div></div>
        : <div className="aw-management-row"><span className="aw-management-row-icon"><Cpu size={22} strokeWidth={1.6} /></span><div className="aw-management-row-copy"><h3>当前任务未关联设备</h3><p>选择设备作为当前任务的执行目标。</p></div><Button icon={Plus} onClick={manageDevice}>关联设备</Button></div>
        : <Empty icon={Cpu} title="先打开一个任务" text="设备按任务单独关联。进入任务后可新增、查看、更换或解除设备连接。" />}
    </section>
    <TiangongResourceSection state={state} update={update} notify={notify} scope={task ? { kind: 'task', workspaceId: workspace!.id, taskId: task.id } : workspace?.project ? { kind: 'project', workspaceId: workspace.id } : { kind: 'library' }} manage={manageTiangong} />
    <section className="aw-management-section"><div className="aw-management-section-heading"><h2>MCP 服务</h2><Button subtle onClick={goMcp}>查看 MCP<ArrowRight size={13} /></Button></div>{services.length ? <div className="aw-management-list">{services.map(service => <div className="aw-management-row" key={service.id}><span className="aw-management-row-icon"><Plug size={22} strokeWidth={1.6} /></span><div className="aw-management-row-copy"><h3>{service.name}</h3><p>{service.tools.length} 个工具，按任务授权业务资源</p></div><Badge tone={service.connected ? 'success' : 'muted'}>{service.connected ? '已连接' : '未连接'}</Badge></div>)}</div> : <div className="aw-management-inline-empty">还没有启用的 MCP 服务</div>}</section>
  </ManagementPage>;
}

function GrantDialog({ state, update, taskId, onClose }: { state: WorkbenchState; update: UpdateState; taskId: string; onClose: () => void }) {
  const task = state.tasks.find(item => item.id === taskId);
  const workspace = state.workspaces.find(item => item.id === task?.workspaceId);
  const existing = [...state.grants].reverse().find(item => item.taskId === taskId);
  const serviceId = task?.mcpServiceId || existing?.serviceId || '';
  const [resource, setResource] = useState(existing?.resource || '');
  const [read, setRead] = useState(existing?.read ?? true);
  const [write, setWrite] = useState(existing?.write || false);
  const [error, setError] = useState('');
  const service = state.services.find(item => item.id === serviceId);
  return <Modal title="任务授权" subtitle={state.tasks.find(item => item.id === taskId)?.title} onClose={onClose}><form onSubmit={event => {
    event.preventDefault();
    if (!task || !workspace || !serviceId || !resource || !service?.resources.includes(resource)) { setError('请选择可用的 MCP 服务及有效业务资源。'); return; }
    const requirement = taskDeviceRequirementReason(state, { workspaceId: workspace.id, serviceId, deviceId: task.deviceId });
    if (requirement) { setError(requirement); return; }
    update(draft => {
      draft.grants.filter(item => item.taskId === taskId).forEach(item => { item.revoked = true; });
      draft.grants.push({ id: uid('grant'), workspaceId: workspace.id, taskId, serviceId, resource, read, write, revoked: false });
      const currentTask = draft.tasks.find(item => item.id === taskId)!;
      currentTask.mcpServiceId = serviceId; currentTask.requiresDevice = taskRequiresDevice(draft, { workspaceId: workspace.id }, serviceId);
      draft.calls.filter(item => item.taskId === taskId && item.executions === 0 && ['queued', 'pending', 'blocked'].includes(item.status) && item.kind.startsWith('mcp-')).forEach(item => {
        const actualDevice = draft.devices.find(device => device.id === currentTask.deviceId);
        item.deviceId = actualDevice?.id;
        item.serviceId = serviceId; item.resource = resource; item.target = `${service?.name} · ${resource}${actualDevice ? ` · ${actualDevice.name} (${actualDevice.address})` : ''}`;
        let instruction = ''; try { instruction = JSON.parse(item.parameters).instruction || ''; } catch { /* Keep a missing instruction empty. */ }
        item.parameters = JSON.stringify({ tool: item.kind === 'mcp-write' ? 'write' : 'read', resource, ...(actualDevice ? { deviceId: actualDevice.id, deviceAddress: actualDevice.address } : {}), ...(instruction ? { instruction } : {}) }, null, 2); item.approved = false; item.businessChange = undefined;
        item.status = 'blocked'; item.output = '任务授权已更新，请重试剩余步骤。写入仍需单独确认。';
      });
      if (currentTask.status !== 'completed') currentTask.status = 'failed';
    }); onClose();
  }}><div className="aw-modal-body aw-form"><label>关联服务<input readOnly value={service?.name || '未关联'} /></label><label>业务资源<select value={resource} onChange={event => setResource(event.target.value)}><option value="">选择具体资源</option>{service?.resources.map(item => <option key={item}>{item}</option>)}</select></label><fieldset><legend>允许的工具权限</legend><label className="aw-checkbox-label"><input type="checkbox" checked={read} onChange={event => { setRead(event.target.checked); if (!event.target.checked) setWrite(false); }} />读取所选资源</label><label className="aw-checkbox-label"><input type="checkbox" disabled={!read || !isPlatformAdmin(state)} checked={write} onChange={event => setWrite(event.target.checked)} />申请更新所选资源，执行前仍需确认</label></fieldset><p className="aw-field-help">授权实时生效，已执行步骤与原始调用记录保持不变。</p>{error && <p className="aw-form-error">{error}</p>}</div><div className="aw-modal-footer"><Button type="button" onClick={onClose}>取消</Button><Button primary type="submit" icon={ShieldCheck}>保存任务授权</Button></div></form></Modal>;
}

function SkillsPage({ state, update, workspace, notify, edit, goTask }: Context & { edit: (id: string) => void; goTask: () => void }) {
  const [query, setQuery] = useState('');
  const [scope, setScope] = useState<'workspace' | 'library'>('workspace');
  const [testSkillId, setTestSkillId] = useState<string | null>(null);
  const [testInput, setTestInput] = useState('');
  const skill = state.skills.find(item => item.id === testSkillId);
  const skills = state.skills.filter(item => (scope === 'library' || item.workspaceId === workspace.id) && `${item.name}${item.description}`.toLowerCase().includes(query.toLowerCase()));
  return <div className="aw-page"><PageHeading title="Skill" description="把开发与调试经验保存为可编辑、可测试的 Agent 能力。"><Button primary icon={Plus} onClick={() => edit('new')}>创建 Skill</Button></PageHeading><div className="aw-filter-row"><div className="aw-segmented"><button className={scope === 'workspace' ? 'is-active' : ''} onClick={() => setScope('workspace')}>当前空间</button><button className={scope === 'library' ? 'is-active' : ''} onClick={() => setScope('library')}>可复用 Skill 库</button></div><label className="aw-search"><Search size={14} /><input placeholder="搜索 Skill" value={query} onChange={event => setQuery(event.target.value)} /></label></div>
    {!skills.length ? <Empty icon={Layers} title="把一次经验，变成下一次能力" text="可以直接创建 Skill 草稿，也可以把 Agent 任务成果保存为 Skill，无需关联主项目。"><Button icon={Plus} onClick={() => edit('new')}>创建第一个 Skill</Button></Empty> : <div className="aw-resource-grid">{skills.map(item => <article className="aw-resource-card" key={item.id}><div className="aw-resource-card-top"><span className="aw-resource-icon"><Layers size={20} /></span><Badge tone={item.status === 'ready' ? 'success' : 'muted'}>{item.status === 'ready' ? '可复用' : '草稿'}</Badge></div><h3>{item.name}</h3><p className="aw-skill-description">{item.description}</p><div className="aw-resource-meta">{state.workspaces.find(space => space.id === item.workspaceId)?.name || '原工作空间'} · {item.tests.length} 次演示测试</div><div className="aw-card-footer"><Button icon={Pencil} onClick={() => edit(item.id)}>编辑</Button><Button icon={Play} onClick={() => { setTestSkillId(item.id); setTestInput(''); }}>测试</Button><IconButton icon={Download} label={`下载 ${item.name}`} onClick={() => downloadText(`${item.name.replace(/[^\p{L}\p{N}-]/gu, '-')}-SKILL.md`, item.content)} /></div></article>)}</div>}
    {testSkillId && skill && <Modal title="测试 Skill" subtitle={`${skill.name} · 使用当前工作空间执行演示测试`} onClose={() => setTestSkillId(null)}><div className="aw-modal-body aw-form"><label>测试输入<textarea autoFocus rows={5} value={testInput} onChange={event => setTestInput(event.target.value)} placeholder="输入要交给这个 Skill 的任务…" /></label>{skill.tests.length > 0 && <div className="aw-skill-test-history"><h3>最近测试</h3>{skill.tests.slice(-2).map(test => <div key={test.id}><small>{formatTime(test.time)}</small><pre>{test.output}</pre></div>)}</div>}</div><div className="aw-modal-footer"><Button onClick={() => setTestSkillId(null)}>取消</Button><Button primary icon={Play} disabled={!testInput.trim()} onClick={() => { update(draft => { startTask(draft, { workspaceId: workspace.id, prompt: testInput, kind: 'skill-test', skillId: skill.id, skillIds: [skill.id] }); }); setTestSkillId(null); goTask(); notify('已创建 Skill 测试任务'); }}>运行演示测试</Button></div></Modal>}
  </div>;
}

function SkillDialog({ state, update, workspaceId, skillId, onClose }: { state: WorkbenchState; update: UpdateState; workspaceId: string; skillId: string | null; onClose: () => void }) {
  const skill = state.skills.find(item => item.id === skillId);
  const [name, setName] = useState(skill?.name || '');
  const [description, setDescription] = useState(skill?.description || '');
  const [content, setContent] = useState(skill?.content || '');
  const [ready, setReady] = useState(skill?.status === 'ready');
  const [error, setError] = useState('');
  return <Modal wide title={skill ? '编辑 Skill' : '创建 Skill'} subtitle="草稿独立保存在 Skill 库中，不要求关联主项目。" onClose={onClose}><form onSubmit={event => {
    event.preventDefault(); if (!name.trim()) { setError('请填写 Skill 名称'); return; }
    update(draft => {
      const current = draft.skills.find(item => item.id === skillId);
      if (current) { current.name = name.trim(); current.description = description; current.content = content || makeSkill(workspaceId, null, name, description).content; current.status = ready ? 'ready' : 'draft'; current.updatedAt = now(); }
      else { const item = makeSkill(workspaceId, null, name.trim(), description); item.content = content || item.content; item.status = ready ? 'ready' : 'draft'; draft.skills.push(item); }
    }); onClose();
  }}><div className="aw-modal-body aw-form"><div className="aw-form-grid"><label>Skill 名称<input autoFocus value={name} onChange={event => setName(event.target.value)} placeholder="例如：机器人日志分析" /></label><label>适用说明<input value={description} onChange={event => setDescription(event.target.value)} placeholder="说明何时使用这项能力" /></label></div><div className="aw-field-heading"><label htmlFor="aw-skill-content">SKILL.md</label><Button type="button" subtle icon={FileText} onClick={() => { if (!name.trim()) { setError('先填写 Skill 名称即可生成模板'); return; } setContent(makeSkill(workspaceId, null, name, description).content); }}>填入模板</Button></div><textarea id="aw-skill-content" className="aw-code-input" rows={13} value={content} onChange={event => setContent(event.target.value)} placeholder="编写适用范围、操作步骤、资源约束和预期结果…" /><label className="aw-checkbox-label"><input type="checkbox" checked={ready} onChange={event => setReady(event.target.checked)} />标记为可复用</label>{error && <p className="aw-form-error">{error}</p>}</div><div className="aw-modal-footer"><Button type="button" onClick={onClose}>取消</Button><Button primary type="submit" icon={Save}>保存{ready ? ' Skill' : '草稿'}</Button></div></form></Modal>;
}

function ReviewsPage({ state, update, workspace, grantTask, goTask }: { state: WorkbenchState; update: UpdateState; workspace?: Workspace; grantTask: (id: string) => void; goTask: (id: string) => void }) {
  const [history, setHistory] = useState(false);
  const [filterTask, setFilterTask] = useState('');
  const calls = state.calls.filter(item => item.workspaceId === workspace?.id && (!filterTask || item.taskId === filterTask) && (history ? ['done', 'denied'].includes(item.status) : ['pending', 'blocked'].includes(item.status)));
  const changes = state.changes.filter(item => item.workspaceId === workspace?.id && (!filterTask || item.taskId === filterTask) && (history ? ['accepted', 'rejected'].includes(item.status) : ['pending', 'conflict'].includes(item.status)));
  return <ManagementPage className="aw-reviews-page"><ManagementHeading title="操作审查" description="查看实际执行目标、操作参数及文件差异，每次确认只对应一次操作。" /><div className="aw-management-toolbar"><ManagementTabs label="审查分类" value={history ? 'history' : 'pending'} options={[{ id: 'pending', label: '待处理' }, { id: 'history', label: '历史记录' }]} onChange={value => setHistory(value === 'history')} /><select aria-label="按任务筛选审查记录" value={filterTask} onChange={event => setFilterTask(event.target.value)}><option value="">{workspace ? '当前空间全部任务' : '暂无任务'}</option>{state.tasks.filter(item => item.workspaceId === workspace?.id).map(item => <option key={item.id} value={item.id}>{item.title}</option>)}</select></div>
    {!calls.length && !changes.length ? <Empty icon={ShieldCheck} title={history ? '还没有审查记录' : '当前没有待处理操作'} text="Agent 生成的修改与调用会出现在这里，记录仅来自当前空间的实际任务。" /> : <div className="aw-review-list">{calls.map(call => <section key={call.id}><div className="aw-review-source">{call.taskId ? <button onClick={() => goTask(call.taskId!)}><Bot size={12} />{state.tasks.find(item => item.id === call.taskId)?.title}<ArrowRight size={12} /></button> : <span>独立手动操作</span>}<small>{formatTime(call.createdAt)}</small></div><CallCard call={call} state={state} update={update} grant={call.taskId ? () => grantTask(call.taskId!) : undefined} /></section>)}{changes.map(change => <section key={change.id}><div className="aw-review-source"><button onClick={() => goTask(change.taskId)}><Bot size={12} />{state.tasks.find(item => item.id === change.taskId)?.title}<ArrowRight size={12} /></button></div><ChangeCard change={change} state={state} update={update} openEditor={() => { update(draft => { const item = draft.workspaces.find(current => current.id === change.workspaceId)!; item.panel.open = true; item.panel.tab = 'editor'; item.panel.fileId = change.fileId; }); goTask(change.taskId); }} /></section>)}</div>}
  </ManagementPage>;
}

function SettingsPage({ state, update, notify, editDevice }: { state: WorkbenchState; update: UpdateState; notify: (text: string) => void; editDevice: (id?: string) => void }) {
  const [tab, setTab] = useState('models');
  const tabs = [['models', 'AI 模型'], ['permissions', '权限'], ['connections', '连接'], ['appearance', '界面'], ['usage', '用量'], ['application', '应用与更新']];
  const completed = state.calls.filter(item => item.executions > 0);
  return <ManagementPage className="aw-settings-page"><ManagementHeading title="系统配置" description="管理 Agent 的模型服务、权限与运行偏好。" /><div className="aw-management-toolbar"><ManagementTabs label="系统配置分类" value={tab} options={tabs.map(([id, label]) => ({ id, label }))} onChange={setTab} /></div>
    {tab === 'models' && <AgentModelSettings state={state} update={update} notify={notify} />}
    {tab === 'permissions' && <div className="aw-settings-surface"><h2>操作确认规则</h2><div className="aw-setting-row"><div><strong>只读工具自动执行</strong><p>关闭后，设备和 MCP 读取也需要逐次确认。</p></div><button role="switch" aria-checked={state.settings.autoRead} aria-label="只读工具自动执行" className={`aw-toggle ${state.settings.autoRead ? 'is-on' : ''}`} onClick={() => update(draft => { draft.settings.autoRead = !draft.settings.autoRead; })}><span /></button></div><div className="aw-setting-row"><div><strong>文件修改先审查差异</strong><p>接受前检查文件版本，发现冲突需要重新审查。</p></div><Badge>始终开启</Badge></div><div className="aw-setting-row"><div><strong>设备控制与 MCP 写入先确认</strong><p>授权范围和执行确认分别管理，每次执行重新检查。</p></div><Badge>始终开启</Badge></div><div className="aw-setting-row"><div><strong>任务最多关联一台设备</strong><p>在任务内查看、更换或解除设备；更换时取消原设备未完成的操作。</p></div><Badge>始终开启</Badge></div></div>}
    {tab === 'connections' && <AgentConnectionSettings state={state} update={update} editDevice={editDevice} notify={notify} />}
    {tab === 'appearance' && <div className="aw-settings-surface"><h2>界面偏好</h2><div className="aw-setting-row"><div><strong>布局密度</strong><p>沿用当前工作台的浅色界面。</p></div><div className="aw-segmented"><button className={state.settings.density === 'normal' ? 'is-active' : ''} onClick={() => update(draft => { draft.settings.density = 'normal'; })}>标准</button><button className={state.settings.density === 'compact' ? 'is-active' : ''} onClick={() => update(draft => { draft.settings.density = 'compact'; })}>紧凑</button></div></div><div className="aw-setting-row"><div><strong>放大文字</strong><p>提高任务与工具内容的阅读字号。</p></div><button role="switch" aria-checked={state.settings.largeText} aria-label="放大文字" className={`aw-toggle ${state.settings.largeText ? 'is-on' : ''}`} onClick={() => update(draft => { draft.settings.largeText = !draft.settings.largeText; })}><span /></button></div></div>}
    {tab === 'application' && <div className="aw-settings-surface"><h2>应用与更新</h2><div className="aw-setting-row"><div><strong>产品分析</strong><p>开启帮助我们了解功能使用情况和错误趋势。</p></div><button role="switch" aria-label="产品分析" aria-checked={Boolean(state.settings.productAnalytics)} className={`aw-toggle ${state.settings.productAnalytics ? 'is-on' : ''}`} onClick={() => update(draft => { draft.settings.productAnalytics = !draft.settings.productAnalytics; })}><span /></button></div><div className="aw-setting-row"><div><strong>版本</strong></div><span>AI Studio Web 0.1.0</span></div><div className="aw-setting-row"><div><strong>Agent 运行时</strong></div><span>随平台版本一起更新</span></div></div>}
    {tab === 'usage' && <><div className="aw-usage-grid">{[['工作空间', state.workspaces.length, Folder], ['Agent 任务', state.tasks.length, Bot], ['已执行调用', completed.length, Code2], ['已确认任务', state.tasks.filter(item => item.status === 'completed').length, CheckCircle2]].map(([label, value, Icon]) => { const MetricIcon = Icon as LucideIcon; return <div key={String(label)}><MetricIcon size={18} /><span>{String(label)}</span><strong>{String(value)}</strong></div>; })}</div><div className="aw-settings-surface"><h2>调用记录</h2><p>仅统计实际产生的演示操作，不展示虚构的 Token 或费用。</p>{!completed.length ? <div className="aw-inline-empty">暂无已执行调用</div> : <div className="aw-usage-log">{completed.slice(-20).reverse().map(call => <div key={call.id}><span>{call.label}<small>{call.target}</small></span><Badge>{call.actor === 'agent' ? 'Agent' : '手动'}</Badge><small>{formatTime(call.createdAt)}</small></div>)}</div>}</div></>}
  </ManagementPage>;
}

function ToolsPanel(context: Context) {
  const { state, workspace, task, update, notify } = context;
  const [moreTools, setMoreTools] = useState(false);
  const files = workspaceFiles(state, workspace.id).filter(file => file.deviceId === (task?.kind === 'device' ? task.deviceId : null));
  const file = files.find(item => item.id === workspace.panel.fileId) || files[0];
  const terminals = state.terminals.filter(item => item.workspaceId === workspace.id && item.originTaskId === (task?.id || null));
  const session = terminals.find(item => item.id === workspace.panel.terminalId) || terminals[terminals.length - 1];
  const tab = workspace.panel.tab;
  const reviewChanges = state.changes.filter(item => item.workspaceId === workspace.id && task && item.taskId === task.id);
  useEffect(() => {
    if (tab === 'terminal') update(draft => { ensureTaskTerminal(draft, workspace.id, task?.id || null); });
  }, [tab, workspace.id, task?.id, update]);
  const selectTab = (nextTab: ToolTab) => update(draft => {
    if (nextTab === 'terminal') ensureTaskTerminal(draft, workspace.id, task?.id || null);
    else draft.workspaces.find(item => item.id === workspace.id)!.panel.tab = nextTab;
  });
  const openFile = (id: string) => update(draft => { const current = draft.workspaces.find(item => item.id === workspace.id)!; current.panel.fileId = id; current.panel.tab = 'editor'; });
  return <aside className="aw-tools-panel aw-review-tools" aria-label="开发工具面板">
    <header className="aw-review-panel-tabs">
      {(['changes', 'files', 'terminal'] as const).map(id => <button key={id} className={`aw-review-panel-tab ${tab === id || (id === 'files' && tab === 'editor') ? 'is-current' : ''}`} onClick={() => selectTab(id)}>{tools.find(item => item.id === id)!.label}{id === 'changes' && <span>{reviewChanges.length}</span>}</button>)}
      <div className="aw-review-panel-menu-wrap"><IconButton icon={MoreHorizontal} label="更多开发工具" onClick={() => setMoreTools(!moreTools)} />{moreTools && <><button className="aw-composer-menu-dismiss" aria-label="关闭工具菜单" onClick={() => setMoreTools(false)} /><div className="aw-review-panel-menu">{tools.filter(item => item.id === 'editor' || item.id === 'desktop').map(({ id, label, icon: Icon }) => <button key={id} onClick={() => { selectTab(id); setMoreTools(false); }}><Icon size={13} />{label}</button>)}</div></>}</div><IconButton icon={X} label="收起开发工具" onClick={() => update(draft => { draft.workspaces.find(item => item.id === workspace.id)!.panel.open = false; })} />
    </header>
    {tab === 'changes' && <AgentChangeReview key={task?.id || workspace.id} state={state} update={update} changes={reviewChanges} selectedFileId={workspace.panel.fileId} openEditor={openFile} />}
    {tab === 'files' && <AgentProjectFiles key={`${workspace.id}:${task?.deviceId || 'project'}`} {...context} openFile={openFile} />}
    {tab === 'editor' && (file ? <FileEditor key={`${workspace.id}-${file.id}`} {...context} file={file} /> : <Empty icon={Code2} title="选择或创建一个文件" text="在项目文件树中选择文件进行编辑。"><Button icon={FolderOpen} onClick={() => selectTab('files')}>查看项目文件</Button></Empty>)}
    {tab === 'terminal' && <div className="aw-terminal-container"><div className="aw-terminal-tabs">{terminals.map((item, index) => <button key={item.id} className={session?.id === item.id ? 'is-current' : ''} title={`${task?.title || '独立项目终端'} · 会话 ${index + 1}`} onClick={() => update(draft => { draft.workspaces.find(current => current.id === workspace.id)!.panel.terminalId = item.id; })}><Terminal size={12} /><span>{task?.title || '项目终端'} · {index + 1}</span></button>)}<IconButton icon={Plus} label="新建终端会话" onClick={() => update(draft => { openTerminal(draft, workspace.id, task?.id || null); })} /></div>
      {session ? <TerminalView key={session.id} {...context} sessionId={session.id} /> : <div className="aw-inline-empty">正在打开当前聊天的终端…</div>}
    </div>}
    {tab === 'desktop' && <DesktopPanel key={`${workspace.id}-${task?.deviceId || workspace.panel.desktopDeviceId || 'empty'}`} {...context} />}
  </aside>;
}

function FileEditor({ state, update, workspace, task, notify, file }: Context & { file: WorkspaceFile }) {
  const [text, setText] = useState(file.content);
  const [baseVersion, setBaseVersion] = useState(file.version);
  const [dirty, setDirty] = useState(false);
  const candidate = state.changes.find(item => item.fileId === file.id && ['pending', 'conflict'].includes(item.status));
  const changedElsewhere = file.version !== baseVersion;
  const blocked = fileWriteBlockReason(state, file, task?.id);
  useEffect(() => { if (!dirty) { setText(file.content); setBaseVersion(file.version); } }, [file.content, file.version, dirty]);
  const save = () => {
    if (blocked) { notify(blocked); return; }
    if (changedElsewhere) { notify('文件版本已变化，请加载最新内容后再保存'); return; }
    update(draft => { saveFile(draft, file, text, baseVersion, task?.id); }); setDirty(false); notify('文件已保存，相关 Agent 差异需要重新审查');
  };
  return <div className="aw-editor"><div className="aw-editor-path"><FileCode2 size={13} /><span>{file.path}</span><Badge tone="muted">v{file.version}</Badge></div><div className="aw-editor-toolbar"><span>{dirty ? '有未保存修改' : file.version === 0 ? '新文件 · 差异待审查' : '已保存'}</span><Button icon={Save} primary disabled={!dirty || Boolean(blocked)} onClick={save}>保存</Button><IconButton icon={Download} label="下载当前文件" onClick={() => downloadText(file.path.split('/').pop() || 'file.txt', text, 'text/plain;charset=utf-8')} /></div>
    {changedElsewhere && <div className="aw-editor-warning"><AlertCircle size={14} /><span>文件已更新，当前编辑基于 v{baseVersion}。</span><button onClick={() => { setText(file.content); setBaseVersion(file.version); setDirty(false); }}>加载最新内容</button></div>}
    {blocked && <div className="aw-inline-warning"><AlertCircle size={14} />{blocked}</div>}
    {candidate && <div className="aw-editor-candidate"><span>Agent 候选修改保存在审查记录中</span><button onClick={() => { setText(candidate.after); setDirty(true); }}>载入候选内容</button></div>}
    <div className="aw-editor-code"><div className="aw-line-numbers" aria-hidden="true">{text.split('\n').map((_, index) => <div key={index}>{index + 1}</div>)}</div><textarea spellCheck={false} aria-label={`编辑 ${file.path}`} value={text} onChange={event => { setText(event.target.value); setDirty(true); }} onKeyDown={event => { if ((event.metaKey || event.ctrlKey) && event.key === 's') { event.preventDefault(); save(); } if (event.key === 'Tab') { event.preventDefault(); const start = event.currentTarget.selectionStart; const end = event.currentTarget.selectionEnd; setText(text.slice(0, start) + '  ' + text.slice(end)); setDirty(true); const target = event.currentTarget; requestAnimationFrame(() => { target.selectionStart = target.selectionEnd = start + 2; }); } }} /></div><footer className="aw-editor-status"><span>{text.split('\n').length} 行 · UTF-8</span><span>{file.deviceId ? state.devices.find(item => item.id === file.deviceId)?.name : workspace.project?.name || '工作空间产物'}</span></footer>
  </div>;
}

function TerminalView({ state, update, workspace, task, sessionId }: Context & { sessionId: string }) {
  const session = state.terminals.find(item => item.id === sessionId)!;
  const [command, setCommand] = useState('');
  const end = useRef<HTMLDivElement>(null);
  const reason = terminalBlockReason(state, session, task);
  const originTask = state.tasks.find(item => item.id === session.originTaskId);
  useEffect(() => { end.current?.scrollIntoView({ block: 'nearest' }); }, [session.lines.length]);
  return <div className="aw-terminal"><div className="aw-terminal-environment"><span><span className={reason ? 'aw-disconnected-dot' : 'aw-connection-dot'} />{session.deviceId ? '设备' : '项目'}：{session.environment}</span><IconButton icon={Trash2} label="清空终端输出" onClick={() => update(draft => { draft.terminals.find(item => item.id === session.id)!.lines = []; })} /></div><div className="aw-terminal-origin"><span>聊天：{originTask?.title || '独立项目终端'}</span><span>工作目录：{session.cwd}</span></div>
    {reason && <div className="aw-terminal-warning"><AlertCircle size={14} /><span>{reason}</span>{originTask && originTask.id !== task?.id && <button onClick={() => update(draft => { draft.workspaces.find(item => item.id === workspace.id)!.activeTaskId = originTask.id; })}>切回来源任务</button>}</div>}
    <div className="aw-terminal-output">{session.lines.map((line, index) => <pre key={index} className={line.includes(' ❯ ') ? 'aw-terminal-command' : ''}>{line || ' '}</pre>)}<div ref={end} /></div>
    <form className="aw-terminal-input" onSubmit={event => { event.preventDefault(); if (!command.trim() || reason) return; update(draft => runTerminal(draft, session.id, task?.id || null, command)); setCommand(''); }}><span>❯</span><input aria-label="终端命令" value={command} onChange={event => setCommand(event.target.value)} disabled={Boolean(reason)} placeholder={reason ? '执行环境暂不可用' : '输入命令，按 Enter 执行'} /><button disabled={!command.trim() || Boolean(reason)} type="submit"><ArrowRight size={14} /></button></form><div className="aw-terminal-caption">当前聊天的终端会话 · 执行环境固定保存</div>
  </div>;
}

function DesktopPanel({ state, workspace, task, update, notify }: Context) {
  const [info, setInfo] = useState('');
  const deviceId = task?.deviceId;
  const device = state.devices.find(item => item.id === deviceId);
  const linked = device && workspace.deviceIds.includes(device.id);
  const connected = linked && device.connected;
  return <div className="aw-desktop"><div className="aw-desktop-selector"><Cpu size={14} /><strong>{device ? `绑定设备：${device.name}` : '未绑定任务设备'}</strong><Badge tone="muted">演示桌面</Badge></div>
    {!connected ? <Empty icon={Monitor} title={device ? linked ? '设备尚未连接' : '任务设备关联已失效' : '请先绑定任务设备'} text={device ? '请通过任务顶部的“关联设备”配置并连接此设备，远程桌面只使用当前任务的绑定设备。' : task ? '请通过任务顶部的“关联设备”选择一台设备后，再使用远程桌面。' : '创建任务并绑定设备后，才可以使用远程桌面。'} />
      : <><div className="aw-desktop-screen"><div className="aw-desktop-osbar"><span><span className="aw-connection-dot" />{device.name}</span><span>Robot Desktop</span></div><div className="aw-desktop-icons"><button onClick={() => update(draft => { openTerminal(draft, workspace.id, task?.id || null, device.id); })}><span><Terminal size={23} /></span>终端</button><button onClick={() => {
        update(draft => {
          const call: ToolCall = { id: uid('call'), workspaceId: workspace.id, taskId: task?.id || null, actor: 'user', kind: 'desktop', label: '查看设备系统信息', target: device.name, deviceId: device.id,
            status: 'queued', approved: true, executions: 0, parameters: JSON.stringify({ deviceId: device.id, operation: 'system-info' }, null, 2), output: '', createdAt: now() };
          const reason = callBlockReason(draft, call); call.status = reason ? 'blocked' : 'done'; call.executions = reason ? 0 : 1; call.output = reason || `${device.name} · ${device.model} · ${device.address}（演示）`; draft.calls.push(call);
        }); setInfo(`${device.name}\n${device.model}\n${device.address}\n当前为本地模拟桌面`);
      }}><span><Cpu size={24} /></span>系统信息</button></div><div className="aw-desktop-welcome"><span className="aw-desktop-robot"><Bot size={46} /></span><h3>{device.name}</h3><p>机器人开发环境</p></div>{info && <div className="aw-desktop-info"><div><strong>系统信息</strong><IconButton icon={X} label="关闭系统信息" onClick={() => setInfo('')} /></div><pre>{info}</pre></div>}<div className="aw-desktop-dock"><Terminal size={19} /><Folder size={20} /><Settings size={19} /></div></div><div className="aw-desktop-footer"><span><span className="aw-connection-dot" />{device.address}</span><Button subtle icon={Terminal} onClick={() => update(draft => { openTerminal(draft, workspace.id, task?.id || null, device.id); })}>打开设备终端</Button></div></>}
  </div>;
}

function downloadText(name: string, text: string, type = 'text/markdown;charset=utf-8') {
  const url = URL.createObjectURL(new Blob([text], { type }));
  const link = document.createElement('a'); link.href = url; link.download = name; link.click();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}
function downloadJson(state: WorkbenchState) { downloadText('moying-workbench-data.json', JSON.stringify(state, null, 2), 'application/json'); }
