import { builtinSystemBlockReason, builtinSystemForService, builtinSystemForWorkspace, builtinSystems, builtinSystemConfiguration, isPlatformAdmin, suggestedSystemResource, inferResourceSystem, isBusinessMutationRequest, type BuiltinSystemConfiguration, type BuiltinSystemId } from './agentBuiltinSystems';
import { projectChatResources } from './agentChatResources';
import { useCallback, useEffect, useState } from 'react';
import { projectTemplate, settingsSource, settingsStyles } from './agentProjectTemplate';
import { activeModelConfig, modelCredential, requestModel, ModelServiceError, type ModelServiceConfig, type ModelMessage, type ConfiguredProvider, defaultConfiguredProviders, type ProviderType } from './agentModelService';
import { defaultExtensionPreferences, extensionCallBlockReason, extensionEnabled, extensionItems, type ExtensionPreferences } from './agentExtensions';
import { businessCallBlockReason, businessResource, commitBusinessChange, prepareBusinessChange, TIANGONG_CAPABILITIES, type BusinessChange, type TiangongResource } from './agentTiangong';
import { builtinBusinessMcpServices, ensureBuiltinMcpServices, projectMcpService, taskDeviceRequirementReason, taskRequiresDevice } from './agentBuiltinMcpServices';
import { catalogCapability, capabilityOperations, catalogReadOnly, type BusinessCatalogId } from './agentBusinessCatalog';
import { effectiveTiangongLinks, executeTiangongBrowserCall, isTiangongRequest, normalizeTiangongAssociations, prepareTiangongBrowserChange, taskTiangongTarget, tiangongCallBlockReason, tiangongResourceAccess, type TiangongBrowserChange, type TiangongLink, type TiangongParkRecord, type TiangongSiteResource } from './agentTiangongResources';

export type TaskKind = 'chat' | 'general' | 'device' | 'project' | 'skill' | 'business' | 'skill-test';
export type TaskStatus = 'running' | 'authorization' | 'review' | 'completed' | 'failed' | 'stopped';
export type ToolTab = 'changes' | 'files' | 'editor' | 'terminal' | 'desktop';
export type Device = { systemId?: Exclude<BuiltinSystemId, 'tiangong'>; webConnection?: { url: string; account: string; verifiedAt: string; mode: 'simulation' }; id: string; name: string; model: string; address: string; connected: boolean;
  lastConnected?: boolean;
  connection?: { method: 'SSH'; host: string; port: number; username: string; testedAt: string; mode?: 'simulation' };
};
export type Project = { id: string; name: string; path: string; mcpServiceId?: string; builtinSystemId?: BuiltinSystemId };
export type ComposerDraft = { prompt: string; kind: TaskKind; deviceId: string; model: string; serviceId: string; resource: string; allowWrite: boolean; skillIds: string[]; project?: Project | null; mcpExplicit?: boolean; tiangongLinks?: TiangongLink[]; tiangongTargetId?: string };
export type Workspace = {
  builtinSystemId?: BuiltinSystemId;
  boundDeviceId?: string;
  tiangongLinks?: TiangongLink[];
  id: string; name: string; project: Project | null; deviceIds: string[]; mcpIds: string[];
  archived: boolean; createdAt: string; activeTaskId: string | null;
  panel: { open: boolean; draftOpen?: boolean; tab: ToolTab; terminalId: string | null; fileId: string | null; desktopDeviceId: string | null };
  composerDraft?: ComposerDraft;
  isChatSpace?: boolean;
  selectedDeviceId?: string;
  sidebarExpanded?: boolean;
  isWorkgroup?: boolean;
  isProjectGroup?: boolean;
  templateVersion?: number;
};
export type Message = { id: string; role: 'user' | 'assistant' | 'system'; text: string; time: string; model?: string };
export type AgentTask = {
  tiangongLinks?: TiangongLink[]; tiangongTargetId?: string;
  inheritsProjectResources?: boolean;
  mcpServiceId?: string; requiresDevice?: boolean;
  id: string; workspaceId: string; title: string; kind: TaskKind; deviceId: string | null;
  model: string; status: TaskStatus; messages: Message[]; createdAt: string; archived: boolean; skillIds: string[];
  draft?: string;
  resourceDraft?: import('./agentResourceMentions').PendingChatResource;
  runMode?: 'Build' | 'Plan';
  reasoning?: '默认' | '高' | '中' | '低';
  deviceHistory?: { previousDeviceId: string | null; deviceId: string | null; time: string }[];
  modelRequest?: { id: string; config: ModelServiceConfig; messages: ModelMessage[]; prompt: string; status: 'queued' | 'done' | 'failed'; deviceId: string | null; tiangongTargetId?: string; tiangongSessionRef?: string; planOnly: boolean; input: { serviceId?: string; resource?: string; skillId?: string } };
};
export type McpService = {
  id: string; name: string; endpoint: string; connected: boolean;
  resources: string[]; tools: { id: string; name: string; write: boolean; enabled?: boolean }[];
  transport?: 'stdio' | 'HTTP'; description?: string;
  builtin?: boolean;
  catalog?: BusinessCatalogId; requiresDevice?: boolean;
  command?: string; args?: string[]; env?: { key: string; value: string }[]; passEnv?: string[]; cwd?: string;
  capabilities?: { id: string; name: string; enabled?: boolean }[];
  integration?: 'tiangong'; mode?: 'remote' | 'demo'; allowWrite?: boolean; verifiedAt?: string;
};
export type TaskGrant = {
  id: string; workspaceId: string; taskId: string; serviceId: string;
  resource: string; read: boolean; write: boolean; revoked: boolean;
};
export type ToolCall = {
  tiangongResourceId?: string; tiangongSessionRef?: string; tiangongChange?: TiangongBrowserChange;
  id: string; workspaceId: string; taskId: string | null; actor: 'agent' | 'user';
  kind: 'device-read' | 'device-write' | 'mcp-read' | 'mcp-write' | 'tiangong-read' | 'tiangong-write' | 'file-proposal' | 'skill-create' | 'skill-test' | 'terminal' | 'desktop';
  label: string; target: string; deviceId?: string; serviceId?: string; resource?: string;
  status: 'queued' | 'pending' | 'done' | 'denied' | 'blocked'; approved: boolean;
  executions: number; parameters: string; output: string; createdAt: string;
  filePath?: string; content?: string; skillId?: string;
  businessChange?: BusinessChange;
};
export type WorkspaceFile = {
  id: string; workspaceId: string; deviceId: string | null; path: string;
  content: string; version: number; updatedAt: string;
  deleted?: boolean;
};
export type WorkspaceFolder = { id: string; workspaceId: string; deviceId: string | null; path: string; deleted?: boolean };
export type FileChange = {
  id: string; workspaceId: string; taskId: string; fileId: string; deviceId: string | null;
  path: string; baseVersion: number; before: string; after: string;
  status: 'pending' | 'accepted' | 'rejected' | 'conflict';
};
export type TerminalSession = {
  id: string; workspaceId: string; originTaskId: string | null; deviceId: string | null;
  environment: string; cwd: string; lines: string[]; createdAt: string;
  connectionIdentity?: string;
};
export type Skill = {
  id: string; workspaceId: string; sourceTaskId: string | null; name: string; description: string;
  content: string; status: 'draft' | 'ready'; updatedAt: string;
  tests: { id: string; input: string; output: string; time: string }[];
};
export type WorkbenchState = {
  actorRole?: 'admin' | 'member'; builtinSystemConfigurations?: Partial<Record<BuiltinSystemId, BuiltinSystemConfiguration>>;
  tiangongResources?: TiangongSiteResource[]; tiangongParkRecords?: TiangongParkRecord[];
  version: 1; activeWorkspaceId: string | null; workspaces: Workspace[]; tasks: AgentTask[];
  devices: Device[]; services: McpService[]; grants: TaskGrant[]; calls: ToolCall[];
  files: WorkspaceFile[]; changes: FileChange[]; terminals: TerminalSession[]; skills: Skill[];
  projects?: Project[];
  builtinProjectGroupsAdded?: boolean;
  folders?: WorkspaceFolder[];
  homeDraft?: ComposerDraft;
  modelService?: ModelServiceConfig;
  modelPresetConfig?: ModelServiceConfig;
  modelSource?: 'preset' | 'provider';
  configuredProviders?: ConfiguredProvider[];
  extensionPreferences?: ExtensionPreferences;
  businessResources?: TiangongResource[];
  settings: { model: string; autoRead: boolean; density: 'normal' | 'compact'; largeText: boolean; modelEndpoint: string; connectionTimeout?: number; autoConnect?: boolean; productAnalytics?: boolean };
};

export const STORAGE_KEY = 'moying.agent-workbench.v1';
export const models = ['GPT-5.1 Codex', 'Claude Sonnet 4', '本地开发模型'];
export const taskKinds: { id: TaskKind; name: string; description: string }[] = [
  { id: 'general', name: '通用任务', description: '分析问题、整理资料或生成工作空间产物' },
  { id: 'device', name: '机器人开发', description: '绑定一台设备，检查日志、调试参数与设备能力' },
  { id: 'project', name: '项目开发', description: '开发页面、修改项目文件并审查差异' },
  { id: 'skill', name: '创建 Skill', description: '将开发流程整理为可复用的 Agent 能力' },
  { id: 'business', name: '业务系统操作', description: '通过 MCP 查询与更新指定业务资源' },
];
export const statusLabels: Record<TaskStatus, string> = {
  running: '执行中', authorization: '待授权', review: '待结果确认', completed: '已完成', failed: '需要处理', stopped: '已停止',
};
let fallbackIdSequence = 0;
export function uid(prefix: string): string {
  const provider = globalThis.crypto;
  if (typeof provider?.randomUUID === 'function') return `${prefix}-${provider.randomUUID()}`;
  if (typeof provider?.getRandomValues === 'function') {
    const bytes = provider.getRandomValues(new Uint8Array(16));
    bytes[6] = (bytes[6] & 0x0f) | 0x40;
    bytes[8] = (bytes[8] & 0x3f) | 0x80;
    const hex = Array.from(bytes, byte => byte.toString(16).padStart(2, '0')).join('');
    return `${prefix}-${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
  }
  fallbackIdSequence += 1;
  return `${prefix}-${Date.now().toString(36)}-${fallbackIdSequence.toString(36)}-${Math.random().toString(36).slice(2, 12)}`;
}
export const now = () => new Date().toISOString();
export const message = (role: Message['role'], text: string): Message => ({ id: uid('msg'), role, text, time: now() });

export function initialState(): WorkbenchState {
  return {
    version: 1, activeWorkspaceId: null, workspaces: [], tasks: [], grants: [], calls: [], files: [], changes: [], terminals: [], skills: [], projects: [],
    devices: [
      { id: 'rdk-x3', name: 'RDK X3', model: '地平线 · 机器人开发板', address: '192.168.1.103', connected: false },
      { id: 'rdk-x5', name: 'RDK X5', model: '地平线 · 机器人开发板', address: '192.168.1.105', connected: false },
      { id: 'mcr-01', name: 'MCR 移动协作机器人', model: '墨影 · 复合机器人', address: '192.168.1.120', connected: false },
    ],
    services: [
      ...builtinBusinessMcpServices(),
      { id: 'mcp-orders', name: '工单系统 MCP', endpoint: 'https://mcp.example.local/work-orders', connected: false,
        resources: ['工单 / WO-2026-001', '工单 / WO-2026-002'],
        tools: [{ id: 'read', name: '查询工单', write: false }, { id: 'write', name: '更新工单', write: true }] },
      { id: 'mcp-assets', name: '设备资产 MCP', endpoint: 'https://mcp.example.local/assets', connected: false,
        resources: ['资产台账 / 机器人设备', '维保记录 / 本月计划'],
        tools: [{ id: 'read', name: '查询资产', write: false }, { id: 'write', name: '更新资产记录', write: true }] },
    ],
    configuredProviders: defaultConfiguredProviders(),
    settings: { model: models[0], autoRead: true, density: 'normal', largeText: false, modelEndpoint: '' },
  };
}

function loadState(): WorkbenchState {
  const freshState = () => ensureBuiltinProjectGroups(initialState());
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return freshState();
    const data = JSON.parse(raw) as WorkbenchState;
    if (data.version !== 1 || !Array.isArray(data.workspaces) || !Array.isArray(data.tasks)) return freshState();
    normalizeWorkbenchState(data);
    ensureBuiltinProjectGroups(data);
    restoreDeviceConnections(data);
    data.tasks.forEach(task => {
      if (task.status === 'running') {
        task.status = 'stopped';
        task.messages.push(message('system', '任务已恢复。点击“继续执行”处理剩余步骤，已完成操作不会重复执行。'));
      }
    });
    return data;
  } catch { return freshState(); }
}

export type UpdateState = (change: (draft: WorkbenchState) => void) => void;

export function useWorkbench() {
  const [state, setState] = useState<WorkbenchState>(loadState);
  const [storageError, setStorageError] = useState('');
  const update = useCallback<UpdateState>(change => {
    setState(previous => {
      const draft = structuredClone(previous);
      change(draft);
      return draft;
    });
  }, []);
  useEffect(() => update(draft => {
    ensureBuiltinMcpServices(draft);
    for (const project of [...(draft.projects || []), ...draft.workspaces.flatMap(workspace => workspace.project ? [workspace.project] : [])]) {
      if (!project.mcpServiceId) {
        const service = projectMcpService(draft, project);
        if (service) project.mcpServiceId = service.id;
      }
    }
  }), [update]);
  useEffect(() => {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); setStorageError(''); }
    catch { setStorageError('浏览器本地空间不足，最新内容暂未保存。请导出数据后释放存储空间。'); }
  }, [state]);
  const running = state.tasks.some(task => task.status === 'running');
  const modelJobs = state.tasks.filter(task => task.status === 'running' && task.modelRequest?.status === 'queued');
  const modelJobSignature = modelJobs.map(task => task.modelRequest!.id).join(',');
  useEffect(() => {
    for (const task of modelJobs) {
      const job = task.modelRequest!;
      let flight = modelFlights.get(job.id);
      if (!flight) {
        const controller = new AbortController();
        flight = { controller, promise: requestModel(job.config, modelCredential(job.config), job.messages, { signal: controller.signal }) };
        modelFlights.set(job.id, flight);
      }
      flight.promise.then(content => update(draft => finishModelRequest(draft, task.id, job.id, content)), error => update(draft => failModelRequest(draft, task.id, job.id, error instanceof ModelServiceError ? error.message : '模型请求失败，请检查系统配置后重试。')));
    }
    for (const [id, flight] of modelFlights) if (!modelJobs.some(task => task.modelRequest?.id === id)) { flight.controller.abort(); modelFlights.delete(id); }
  }, [modelJobSignature, update]);
  useEffect(() => {
    if (!running) return;
    const timer = window.setInterval(() => update(draft => {
      for (const task of draft.tasks.filter(item => item.status === 'running')) {
        if (task.modelRequest?.status === 'queued') continue;
        runQueuedTaskStep(draft, task.id);
      }
    }), 850);
    return () => window.clearInterval(timer);
  }, [running, update]);
  return { state, update, storageError };
}

const modelFlights = new Map<string, { controller: AbortController; promise: Promise<string> }>();

export function addWorkspace(state: WorkbenchState, input: { name: string; projectName: string; projectPath: string; deviceIds: string[]; mcpIds: string[] }) {
  const workspace: Workspace = {
    id: uid('ws'), name: input.name.trim(),
    project: input.projectName.trim() ? { id: uid('project'), name: input.projectName.trim(), path: input.projectPath.trim() || `/${input.projectName.trim()}` } : null,
    deviceIds: input.deviceIds, mcpIds: input.mcpIds, archived: false, createdAt: now(), activeTaskId: null, isWorkgroup: true,
    panel: { open: false, tab: 'files', terminalId: null, fileId: null, desktopDeviceId: null },
  };
  state.workspaces.push(workspace);
  if (workspace.project) {
    state.projects ||= [];
    state.projects.push(workspace.project);
  }
  state.activeWorkspaceId = workspace.id;
  return workspace;
}

export function selectTaskContext(state: WorkbenchState, project: Project | null, deviceId: string, preferredId?: string): Workspace {
  const preferred = state.workspaces.find(item => item.id === preferredId && !item.archived);
  let workspace: Workspace | undefined;
  if (project) {
    state.projects ||= [];
    if (!state.projects.some(item => item.id === project.id)) state.projects.push(project);
    workspace = preferred?.project?.id === project.id ? preferred : state.workspaces.find(item => !item.archived && item.project?.id === project.id);
    if (!workspace) {
      workspace = addWorkspace(state, { name: project.name, projectName: '', projectPath: '', deviceIds: [], mcpIds: [] });
      workspace.project = { ...project };
    }
    workspace.isChatSpace = false;
    workspace.isWorkgroup = true;
    initializeProjectFiles(state, workspace);
  } else if (deviceId) {
    workspace = preferred && !preferred.project && !preferred.isChatSpace && preferred.deviceIds.includes(deviceId) ? preferred
      : state.workspaces.find(item => !item.archived && !item.project && !item.isChatSpace && item.deviceIds.includes(deviceId));
    if (!workspace) workspace = addWorkspace(state, { name: state.devices.find(item => item.id === deviceId)?.name || '设备任务', projectName: '', projectPath: '', deviceIds: [deviceId], mcpIds: [] });
  } else if (preferred?.isWorkgroup && !preferred.project && !preferred.isChatSpace && !preferred.deviceIds.length) {
    workspace = preferred;
  } else {
    workspace = state.workspaces.find(item => !item.archived && isStandaloneChatSpace(item));
    if (!workspace) {
      workspace = addWorkspace(state, { name: '聊天', projectName: '', projectPath: '', deviceIds: [], mcpIds: [] });
      workspace.isChatSpace = true;
      workspace.isWorkgroup = false;
    }
  }
  if (deviceId && !workspace.deviceIds.includes(deviceId)) workspace.deviceIds.push(deviceId);
  workspace.selectedDeviceId = deviceId;
  state.activeWorkspaceId = workspace.id;
  return workspace;
}

// A chat-level resource does not create a device project or move a standalone chat.
export function selectChatTaskContext(state: WorkbenchState, project: Project | null, deviceId: string, preferredId?: string) {
  const preferred = state.workspaces.find(item => item.id === preferredId && !item.archived);
  const workspace = !project && preferred && !preferred.project && !isStandaloneChatSpace(preferred) && preferred.deviceIds.length
    ? preferred : selectTaskContext(state, project, '', preferredId);
  if (deviceId && !workspace.deviceIds.includes(deviceId)) workspace.deviceIds.push(deviceId);
  state.activeWorkspaceId = workspace.id;
  return workspace;
}

export function isStandaloneChatSpace(workspace: Workspace) {
  return Boolean(workspace.isChatSpace && !workspace.project && !workspace.isWorkgroup);
}

export function restoreDeviceConnections(state: WorkbenchState) {
  for (const device of state.devices) {
    const previous = device.lastConnected ?? device.connected;
    device.lastConnected = previous;
    device.connected = Boolean(state.settings.autoConnect && previous && (device.connection || device.webConnection));
  }
}

export function bindGroupProject(state: WorkbenchState, workspace: Workspace) {
  if (!workspace.project) {
    const id = uid('project');
    workspace.project = { id, name: workspace.name, path: `/projects/${id}` };
  }
  if (!workspace.project.mcpServiceId) workspace.project.mcpServiceId = projectMcpService(state, workspace.project)?.id;
  state.projects ||= [];
  const index = state.projects.findIndex(project => project.id === workspace.project!.id);
  if (index < 0) state.projects.push({ ...workspace.project });
  else state.projects[index] = { ...workspace.project };
  workspace.isProjectGroup = true;
  workspace.isWorkgroup = true;
  workspace.isChatSpace = false;
  initializeProjectFiles(state, workspace);
  if (workspace.composerDraft) workspace.composerDraft.project = { ...workspace.project };
  return workspace.project;
}

// Both the sidebar and composer use this transaction: project, group and selection.
export function createProjectWorkspace(state: WorkbenchState, name: string) {
  const workspace = addWorkspace(state, { name, projectName: '', projectPath: '', deviceIds: [], mcpIds: [] });
  const project = bindGroupProject(state, workspace);
  workspace.sidebarExpanded = true;
  workspace.panel.tab = 'changes';
  workspace.composerDraft = { prompt: '', project: { ...project }, kind: 'general', deviceId: '', model: state.settings.model, serviceId: '', resource: '', allowWrite: false, skillIds: [] };
  return workspace;
}

export function ensureBuiltinProjectGroups(state: WorkbenchState) {
  const activeWorkspaceId = state.activeWorkspaceId;
  for (const system of builtinSystems) {
    let workspace = state.workspaces.find(workspace => workspace.builtinSystemId === system.id)
      || state.workspaces.find(workspace => !workspace.builtinSystemId && (workspace.name === system.name || workspace.project?.name === system.name));
    if (!workspace) {
      workspace = addWorkspace(state, { name: system.name, projectName: '', projectPath: '', deviceIds: [], mcpIds: [] });
      workspace.builtinSystemId = system.id;
      bindGroupProject(state, workspace);
      workspace.sidebarExpanded = false;
    }
    workspace.builtinSystemId = system.id; workspace.archived = false; workspace.name = system.name;
    if (workspace.project) { workspace.project.builtinSystemId = system.id; workspace.project.mcpServiceId = system.serviceId; }
    const project = state.projects?.find(project => project.id === workspace.project?.id);
    if (project) { project.builtinSystemId = system.id; project.mcpServiceId = system.serviceId; }
    if (workspace.composerDraft) { workspace.composerDraft.project = workspace.project; workspace.composerDraft.serviceId = system.serviceId; workspace.composerDraft.mcpExplicit = false; }
    for (const task of state.tasks.filter(task => task.workspaceId === workspace!.id)) {
      task.mcpServiceId = system.serviceId;
      if (system.id === 'tiangong') {
        task.deviceId = null; task.requiresDevice = false;
        for (const call of state.calls.filter(call => call.taskId === task.id && call.deviceId && !call.executions && ['queued', 'pending', 'blocked'].includes(call.status))) { call.status = 'denied'; call.approved = false; call.output = '天工系统只支持园区资源，旧设备操作已取消。'; }
      } else { task.tiangongLinks = []; task.tiangongTargetId = undefined; task.requiresDevice = true; }
    }
  }
  state.activeWorkspaceId = activeWorkspaceId;
  state.builtinProjectGroupsAdded = true;
  return state;
}

export function syncProjectChatResources(state: WorkbenchState, workspaceId: string) {
  const workspace = state.workspaces.find(item => item.id === workspaceId);
  if (!workspace) return;
  const inherited = projectChatResources(state, workspace);
  for (const task of state.tasks.filter(task => task.workspaceId === workspaceId)) {
    if (!inherited.locked && !task.inheritsProjectResources) continue;
    const changed = task.deviceId !== (inherited.deviceId || null) || JSON.stringify(task.tiangongLinks || []) !== JSON.stringify(inherited.links);
    task.deviceId = inherited.deviceId || null;
    task.tiangongLinks = [...inherited.links];
    task.tiangongTargetId = inherited.links[0]?.resourceId;
    task.inheritsProjectResources = inherited.locked;
    if (changed) {
      for (const call of state.calls.filter(call => call.taskId === task.id && !call.executions && ['queued', 'pending', 'blocked'].includes(call.status))) {
        call.status = 'denied'; call.approved = false; call.output = '项目资源已更新，原资源的未执行操作已取消。';
      }
      for (const change of state.changes.filter(change => change.taskId === task.id && ['pending', 'conflict'].includes(change.status))) change.status = 'rejected';
      if (['running', 'authorization'].includes(task.status)) task.status = 'stopped';
      syncTaskResourceSystem(state, task.id);
    }
  }
  if (workspace.composerDraft) {
    workspace.composerDraft.deviceId = inherited.deviceId;
    workspace.composerDraft.tiangongLinks = [...inherited.links];
    workspace.composerDraft.tiangongTargetId = inherited.links[0]?.resourceId;
  }
}

export function setProjectDevice(state: WorkbenchState, workspaceId: string, deviceId: string | null) {
  const workspace = state.workspaces.find(item => item.id === workspaceId && item.project && !item.builtinSystemId);
  if (!workspace || (deviceId && !state.devices.some(device => device.id === deviceId))) return '项目或设备不存在。';
  workspace.boundDeviceId = deviceId || undefined;
  if (deviceId) { workspace.tiangongLinks = []; if (!workspace.deviceIds.includes(deviceId)) workspace.deviceIds.push(deviceId); }
  syncProjectChatResources(state, workspaceId);
  return '';
}

export function prepareNewTask(state: WorkbenchState, workspaceId?: string) {
  const workspace = state.workspaces.find(item => item.id === workspaceId && !item.archived);
  if (!workspace) { state.activeWorkspaceId = null; state.homeDraft = undefined; return; }
  workspace.activeTaskId = null;
  workspace.sidebarExpanded = true;
  workspace.panel.open = false;
  workspace.panel.draftOpen = false;
  const inherited = projectChatResources(state, workspace);
  const deviceId = inherited.deviceId || (!workspace.project && !isStandaloneChatSpace(workspace) ? workspace.selectedDeviceId || '' : '');
  workspace.selectedDeviceId = deviceId;
  workspace.composerDraft = { prompt: '', project: workspace.project, kind: 'general', deviceId, model: state.settings.model, serviceId: '', resource: '', allowWrite: false, skillIds: [] };
  state.activeWorkspaceId = workspace.id;
}

// Repair earlier demo records without dropping messages, files or tool sessions.
export function normalizeWorkbenchState(state: WorkbenchState) {
  state.projects ||= [];
  ensureBuiltinMcpServices(state);
  state.extensionPreferences ||= defaultExtensionPreferences();
  if (!Array.isArray(state.configuredProviders) || state.configuredProviders.length === 0) {
    state.configuredProviders = defaultConfiguredProviders();
  }
  const tiangong = state.services.find(service => service.id === 'mcp-tiangong');
  if (tiangong?.integration === 'tiangong') {
    const readTool = tiangong.tools.find(tool => tool.id === 'read');
    const writeTool = tiangong.tools.find(tool => tool.id === 'write');
    tiangong.mode = 'remote';
    tiangong.endpoint = tiangong.endpoint === 'demo://tiangong' ? 'https://tiangong.example.local/mcp' : tiangong.endpoint;
    tiangong.description = '提供天工业务能力。';
    tiangong.resources = ['天工业务资源'];
    tiangong.tools = [{ id: 'read', name: '读取业务数据', write: false, enabled: readTool?.enabled !== false }, { id: 'write', name: '提交业务变更', write: true, enabled: Boolean(writeTool?.enabled) }];
    tiangong.capabilities = TIANGONG_CAPABILITIES.map(capability => ({ ...capability, enabled: tiangong.capabilities?.find(item => item.id === capability.id)?.enabled !== false }));
    tiangong.allowWrite = Boolean(writeTool?.enabled);
    tiangong.connected = false;
  }
  const activeId = state.activeWorkspaceId;
  let restoredActiveId = activeId;
  const mixed = state.workspaces.filter(workspace => workspace.isChatSpace && (workspace.project || (workspace.isWorkgroup && workspace.deviceIds.length)));
  state.workspaces.forEach(workspace => {
    if (workspace.project && !workspace.project.mcpServiceId) workspace.project.mcpServiceId = projectMcpService(state, workspace.project)?.id;
    if ((workspace.panel.tab as string) === 'preview') workspace.panel.tab = 'files';
    // The earlier sidebar '+' made an empty group without its project.
    if (workspace.isProjectGroup || (workspace.isWorkgroup && !workspace.isChatSpace && !workspace.project && !workspace.deviceIds.length && !workspace.mcpIds.length && !state.tasks.some(task => task.workspaceId === workspace.id))) bindGroupProject(state, workspace);
    if (workspace.project && !state.projects!.some(project => project.id === workspace.project!.id)) state.projects!.push(workspace.project);
    if (workspace.isChatSpace && !workspace.project && !workspace.isWorkgroup) workspace.isWorkgroup = false;
    initializeProjectFiles(state, workspace);
  });
  mixed.forEach(workspace => {
    workspace.isChatSpace = false;
    workspace.isWorkgroup = true;
    if (workspace.name === '聊天') workspace.name = workspace.project?.name || state.devices.find(device => workspace.deviceIds.includes(device.id))?.name || '设备任务';
    const chats = state.tasks.filter(task => task.workspaceId === workspace.id && task.kind === 'chat');
    if (!chats.length) return;
    const target = selectTaskContext(state, null, '');
    chats.forEach(task => {
      task.workspaceId = target.id;
      state.calls.filter(call => call.taskId === task.id).forEach(call => { call.workspaceId = target.id; });
      state.grants.filter(grant => grant.taskId === task.id).forEach(grant => { grant.workspaceId = target.id; });
      state.terminals.filter(session => session.originTaskId === task.id).forEach(session => { session.workspaceId = target.id; });
      state.skills.filter(skill => skill.sourceTaskId === task.id).forEach(skill => { skill.workspaceId = target.id; });
      state.changes.filter(change => change.taskId === task.id).forEach(change => {
        change.workspaceId = target.id;
        if (!state.changes.some(other => other.fileId === change.fileId && other.taskId !== task.id)) {
          const file = state.files.find(item => item.id === change.fileId);
          if (file) file.workspaceId = target.id;
        }
      });
      if (workspace.activeTaskId === task.id) {
        target.activeTaskId = task.id;
        target.panel.open = false;
        workspace.activeTaskId = null;
        if (workspace.id === activeId) restoredActiveId = target.id;
      }
    });
  });
  // A created project remains visible in the sidebar even before its first task.
  for (const project of state.projects) {
    if (state.workspaces.some(workspace => workspace.project?.id === project.id)) continue;
    const workspace = addWorkspace(state, { name: project.name, projectName: '', projectPath: '', deviceIds: [], mcpIds: [] });
    workspace.project = { ...project };
  }
  state.activeWorkspaceId = restoredActiveId;
  normalizeTiangongAssociations(state);
  for (const workspace of state.workspaces) if (projectChatResources(state, workspace).locked || state.tasks.some(task => task.workspaceId === workspace.id && task.inheritsProjectResources)) syncProjectChatResources(state, workspace.id);
  return state;
}

function chatReply(prompt: string): string {
  if (/^(你好|您好|嗨|hi\b|hello\b)[！!。\s]*$/i.test(prompt.trim())) return '你好，有什么想一起讨论的？可以直接说你的问题或想法。';
  if (/你能|可以做什么|能做什么/.test(prompt)) return '可以直接和我讨论方案、分析问题、整理思路或编写示例代码。需要围绕具体工程工作时，选择一个项目；需要操作机器人时，选择一台设备。';
  if (/开发|设计|页面|方案|功能/.test(prompt)) return '可以，我们先讨论这个想法。建议先明确使用者、要解决的问题，以及希望得到的结果，再确定功能和交互。你可以继续补充具体场景或当前遇到的限制。';
  if (/报错|故障|异常|问题|为什么|怎么/.test(prompt)) return '我们可以先一起分析。请补充具体现象、出现条件和相关信息；如果有日志或错误内容，也可以直接粘贴到聊天里。';
  return '收到，我们直接围绕这个话题聊。你可以继续补充想法、背景，或者说明希望我帮你分析的具体部分。';
}

function isConversationOnly(kind: TaskKind, prompt: string) {
  if (kind === 'chat') return true;
  if (/^(你好|您好|嗨|hi|hello|谢谢|谢谢你|好的|好|嗯|再见|你是谁|你能做什么)[！!。？?，,\s]*$/i.test(prompt.trim())) return true;
  return kind === 'project' && !/开发|创建|新增|修改|优化|修复|实现|重构|添加|删除|更新|调整|生成|编写|排查|检查|构建|部署/.test(prompt);
}

function addCall(state: WorkbenchState, task: AgentTask, input: Pick<ToolCall, 'kind' | 'label' | 'target'> & Partial<ToolCall>) {
  state.calls.push({
    id: uid('call'), workspaceId: task.workspaceId, taskId: task.id, actor: 'agent',
    approved: false, executions: 0, status: 'queued', parameters: '{}', output: '', createdAt: now(), ...input,
  });
}

export function startTask(state: WorkbenchState, input: {
  workspaceId: string; prompt: string; kind: TaskKind; deviceId?: string; model?: string; skillIds?: string[];
  serviceId?: string; resource?: string; allowWrite?: boolean; skillId?: string;
  tiangongLinks?: TiangongLink[]; tiangongTargetId?: string;
}) {
  const workspace = state.workspaces.find(item => item.id === input.workspaceId);
  if (!workspace || !input.prompt.trim()) return null;
  const inherited = projectChatResources(state, workspace);
  if (inherited.locked) {
    if (input.deviceId && input.deviceId !== inherited.deviceId) return null;
    if (input.tiangongLinks?.some(link => link.enabled !== false && link.read && !inherited.links.some(item => item.resourceId === link.resourceId))) return null;
    input = { ...input, deviceId: inherited.deviceId, tiangongLinks: inherited.links, tiangongTargetId: inherited.links[0]?.resourceId };
  }
  const fixedSystem = builtinSystemForWorkspace(workspace);
  if (fixedSystem && input.serviceId && input.serviceId !== fixedSystem.serviceId) return null;
  const selectedSystem = fixedSystem || builtinSystemForService(input.serviceId) || (!input.serviceId ? inferResourceSystem(state, { workspace, deviceId: input.deviceId, links: input.tiangongLinks, prompt: input.prompt }) : undefined);
  const tiangongTask = selectedSystem?.id === 'tiangong';
  if (tiangongTask && input.deviceId) return null;
  if (selectedSystem && !tiangongTask && input.tiangongLinks?.some(link => link.enabled !== false && link.read)) return null;
  input = { ...input, serviceId: tiangongTask ? undefined : selectedSystem?.serviceId || input.serviceId, kind: selectedSystem && input.kind !== 'skill' && (fixedSystem || input.serviceId || ['general', 'chat', 'business'].includes(input.kind)) ? 'business' : input.kind };
  const selectedService = state.services.find(service => service.id === input.serviceId);
  if (selectedService && selectedSystem) input = { ...input, resource: suggestedSystemResource(input.serviceId, input.prompt) || input.resource || selectedService.resources[0], allowWrite: isPlatformAdmin(state) && builtinSystemConfiguration(state, selectedSystem.id).write };
  if (!tiangongTask && taskDeviceRequirementReason(state, input)) return null;
  if (input.deviceId && (!workspace.deviceIds.includes(input.deviceId) || !state.devices.some(device => device.id === input.deviceId))) return null;
  if (input.kind === 'device' && (!input.deviceId || !workspace.deviceIds.includes(input.deviceId))) return null;
  if ((input.tiangongLinks || []).filter(link => link.enabled !== false && link.read).length > 1) return null;
  const requestedParks = effectiveTiangongLinks(state, workspace.id, { tiangongLinks: input.tiangongLinks, tiangongTargetId: input.tiangongTargetId });
  if (input.tiangongLinks?.some(link => { if (link.enabled === false || !link.read) return false; const resource = state.tiangongResources?.find(resource => resource.id === link.resourceId); return !resource || !tiangongResourceAccess(resource); })) return null;
  const linkedParks = requestedParks.filter(link => { const resource = state.tiangongResources?.find(resource => resource.id === link.resourceId); return resource && tiangongResourceAccess(resource); });
  if (tiangongTask && linkedParks.length !== 1) return null;
  const task: AgentTask = {
    tiangongLinks: linkedParks, tiangongTargetId: linkedParks[0]?.resourceId, inheritsProjectResources: inherited.locked,
    id: uid('task'), workspaceId: workspace.id, title: input.prompt.trim().slice(0, 28), kind: input.kind,
    deviceId: input.deviceId || null, model: input.model || state.settings.model,
    mcpServiceId: tiangongTask ? 'mcp-tiangong' : input.serviceId, requiresDevice: !tiangongTask && taskRequiresDevice(state, { workspaceId: workspace.id }, input.serviceId),
    status: isConversationOnly(input.kind, input.prompt) ? 'completed' : 'running', messages: [message('user', input.prompt.trim())], createdAt: now(), archived: false, skillIds: input.skillIds || [], runMode: 'Build', reasoning: '默认',
  };
  state.tasks.push(task);
  workspace.activeTaskId = task.id;
  workspace.composerDraft = undefined;
  state.homeDraft = undefined;
  if (input.serviceId && input.resource) state.grants.push({
    id: uid('grant'), workspaceId: workspace.id, taskId: task.id, serviceId: input.serviceId,
    resource: input.resource, read: true, write: Boolean(input.allowWrite), revoked: false,
  });
  if (beginModelRequest(state, task, input.prompt, input)) return task;
  if (isConversationOnly(input.kind, input.prompt) && !(isTiangongRequest(input.prompt) && effectiveTiangongLinks(state, workspace.id, task).length)) {
    task.messages.push(message('assistant', chatReply(input.prompt)));
    return task;
  }
  queueTaskSteps(state, task, input.prompt, input);
  return task;
}

// Task history is removed; project files and saved Skills remain independent resources.
export function deleteTask(state: WorkbenchState, taskId: string) {
  const task = state.tasks.find(task => task.id === taskId);
  if (!task) return false;
  const activeWorkspaceId = state.activeWorkspaceId;
  const terminalIds = new Set(state.terminals.filter(session => session.originTaskId === taskId).map(session => session.id));
  const removedChangeIds = new Set(state.changes.filter(change => change.taskId === taskId).map(change => change.fileId));
  state.tasks = state.tasks.filter(task => task.id !== taskId);
  state.calls = state.calls.filter(call => call.taskId !== taskId);
  state.grants = state.grants.filter(grant => grant.taskId !== taskId);
  state.changes = state.changes.filter(change => change.taskId !== taskId);
  state.terminals = state.terminals.filter(session => session.originTaskId !== taskId);
  state.skills.filter(skill => skill.sourceTaskId === taskId).forEach(skill => { skill.sourceTaskId = null; });
  for (const workspace of state.workspaces) {
    if (workspace.activeTaskId === taskId) prepareNewTask(state, workspace.id);
    if (terminalIds.has(workspace.panel.terminalId || '')) workspace.panel.terminalId = null;
    if (removedChangeIds.has(workspace.panel.fileId || '') && !state.files.some(file => file.id === workspace.panel.fileId) && !state.changes.some(change => change.fileId === workspace.panel.fileId)) workspace.panel.fileId = null;
  }
  state.activeWorkspaceId = activeWorkspaceId;
  return true;
}

export function setTaskSystemCapability(state: WorkbenchState, taskId: string, serviceId: string) {
  const task = state.tasks.find(task => task.id === taskId);
  const workspace = state.workspaces.find(workspace => workspace.id === task?.workspaceId);
  if (!task || !workspace) return '任务不存在。';
  if (workspace.builtinSystemId) return '系统文件夹的能力由平台预置，不能修改。';
  if (serviceId && serviceId !== 'mcp-tiangong' && !state.services.some(service => service.id === serviceId)) return '系统能力不存在。';
  if (task.mcpServiceId === serviceId) return '';
  for (const call of state.calls.filter(call => call.taskId === taskId && !call.executions && ['queued', 'pending', 'blocked'].includes(call.status))) { call.status = 'denied'; call.approved = false; call.output = '系统能力已切换，旧操作已取消。'; }
  state.grants.filter(grant => grant.taskId === taskId).forEach(grant => { grant.revoked = true; });
  task.mcpServiceId = serviceId || undefined;
  task.requiresDevice = serviceId !== 'mcp-tiangong' && Boolean(state.services.find(service => service.id === serviceId)?.requiresDevice);
  task.kind = serviceId ? 'business' : workspace.project ? 'project' : task.deviceId ? 'device' : 'chat';
  if (serviceId === 'mcp-tiangong') task.deviceId = null;
  else if (builtinSystemForService(serviceId)) { task.tiangongLinks = []; task.tiangongTargetId = undefined; }
  if (['running', 'authorization'].includes(task.status)) task.status = 'stopped';
  return '';
}

export function syncTaskResourceSystem(state: WorkbenchState, taskId: string, prompt?: string) {
  const task = state.tasks.find(task => task.id === taskId);
  const workspace = state.workspaces.find(workspace => workspace.id === task?.workspaceId);
  if (!task || !workspace) return;
  const system = inferResourceSystem(state, { workspace, deviceId: task.deviceId, links: task.tiangongLinks, prompt });
  if (workspace.builtinSystemId) { task.mcpServiceId = system?.serviceId; task.requiresDevice = system?.id !== 'tiangong'; return; }
  setTaskSystemCapability(state, taskId, system?.serviceId || '');
}

export function continueTask(state: WorkbenchState, taskId: string, prompt: string) {
  const task = state.tasks.find(item => item.id === taskId);
  if (!task || !prompt.trim() || task.status === 'running' || task.status === 'authorization') return;
  syncTaskResourceSystem(state, taskId, prompt);
  task.messages.push(message('user', prompt.trim()));
  task.draft = '';
  const system = builtinSystemForWorkspace(state.workspaces.find(workspace => workspace.id === task.workspaceId)) || builtinSystemForService(task.mcpServiceId);
  const selectedService = system?.id === 'tiangong' ? undefined : state.services.find(service => service.id === (system?.serviceId || task.mcpServiceId));
  const selectedResource = suggestedSystemResource(selectedService?.id, prompt) || selectedService?.resources[0];
  if (selectedService && selectedResource && !state.grants.some(grant => grant.taskId === taskId && grant.serviceId === selectedService.id && grant.resource === selectedResource && !grant.revoked)) state.grants.push({ id: uid('grant'), workspaceId: task.workspaceId, taskId, serviceId: selectedService.id, resource: selectedResource, read: true, write: Boolean(system && isPlatformAdmin(state) && builtinSystemConfiguration(state, system.id).write), revoked: false });
  const currentGrant = state.grants.find(item => item.taskId === taskId && !item.revoked && (!selectedService || (item.serviceId === selectedService.id && item.resource === selectedResource)));
  if (beginModelRequest(state, task, prompt, { serviceId: currentGrant?.serviceId, resource: currentGrant?.resource })) return;
  if (isConversationOnly(task.kind, prompt) && !(isTiangongRequest(prompt) && effectiveTiangongLinks(state, task.workspaceId, task).length)) {
    task.messages.push(message('assistant', chatReply(prompt)));
    return;
  }
  if (task.runMode === 'Plan') {
    task.messages.push(message('assistant', `先围绕这次需求制定计划：\n1. 梳理目标、已有资源与约束。\n2. 确定需要修改的文件或调用的工具。\n3. 列出实施步骤与需要审查的操作。\n\n本轮只讨论计划；切换到 Build 后再提交实施指令。\n\n需求：${prompt}`));
    return;
  }
  task.status = 'running';
  const grant = currentGrant;
  queueTaskSteps(state, task, prompt, { serviceId: grant?.serviceId, resource: grant?.resource });
}

export function beginModelRequest(state: WorkbenchState, task: AgentTask, prompt: string, input: { serviceId?: string; resource?: string; skillId?: string }) {
  const selectedModel = activeModelConfig(state);
  if (!selectedModel?.enabled) return false;
  if (task.skillIds.some(id => !extensionEnabled(state, 'skill', id, task.deviceId))) {
    task.status = 'failed'; task.messages.push(message('system', '任务所选 Skill 或所属插件已停用，请在扩展中心启用后重新提交。')); return true;
  }
  const config = { ...selectedModel };
  const service = state.services.find(service => service.id === input.serviceId);
  const capability = service?.catalog && input.resource ? catalogCapability(service.catalog, input.resource) : undefined;
  const catalogContext = capability ? `\n已选择 MCP：${service!.name}；授权能力：${capability.name}；参考知识：${capability.knowledge.join('、')}。接口目录：${capabilityOperations(capability).map(operation => `${operation.method} ${operation.path}`).join('；')}。目录仅供规划，当前页面未调用真实业务接口。` : '';
  const workspace = state.workspaces.find(workspace => workspace.id === task.workspaceId);
  const device = state.devices.find(device => device.id === task.deviceId);
  const skills = extensionItems(state).filter(item => item.kind === 'skill' && task.skillIds.includes(item.id) && extensionEnabled(state, 'skill', item.id, task.deviceId));
  const tiangong = taskTiangongTarget(state, task);
  const system = `你是墨影开发助手，请用中文回应。当前项目：${workspace?.project?.name || '未关联项目'}。当前任务设备：${device?.name || '未关联设备'}。当前为前端工作台：你提供分析和建议，设备、MCP 和文件操作由独立的本地演示流程处理。不要声称你已经读取文件、调用工具或修改实际设备。${task.runMode === 'Plan' ? '本轮仅制定计划。' : ''}${skills.map(skill => `\n已启用 Skill ${skill.name}：${skill.content}`).join('')}`;
  task.model = config.modelId;
  task.modelRequest = { id: uid('inference'), config, messages: [{ role: 'system', content: system + catalogContext + (tiangong ? `\n天工资源：${tiangong.url}，园区：${tiangong.parkName} (${tiangong.parkId})。当前仅有原型浏览器，不可声称访问真实内网或完成真实业务修改。` : '') }, ...task.messages.filter(item => item.role !== 'system').slice(-20).map(item => ({ role: item.role as 'user' | 'assistant', content: item.text }))], prompt, status: 'queued', deviceId: task.deviceId, tiangongTargetId: tiangong?.id, tiangongSessionRef: tiangong?.sessionRef, planOnly: task.runMode === 'Plan', input };
  task.status = 'running';
  return true;
}
export function finishModelRequest(state: WorkbenchState, taskId: string, requestId: string, content: string) {
  const task = state.tasks.find(task => task.id === taskId);
  const job = task?.modelRequest;
  if (!task || task.status !== 'running' || job?.id !== requestId || job.status !== 'queued') return;
  job.status = 'done';
  task.messages.push({ ...message('assistant', content), model: job.config.modelId });
  if (task.deviceId !== job.deviceId) { task.status = 'stopped'; task.messages.push(message('system', '设备关联在模型运行期间发生变化，请确认当前设备后重新提交操作。')); return; }
  if (taskTiangongTarget(state, task)?.id !== job.tiangongTargetId || taskTiangongTarget(state, task)?.sessionRef !== job.tiangongSessionRef) { task.status = 'stopped'; task.messages.push(message('system', '天工目标园区或登录会话发生变化，请重新确认资源后提交操作。')); return; }
  if (job.planOnly || (isConversationOnly(task.kind, job.prompt) && !(isTiangongRequest(job.prompt) && effectiveTiangongLinks(state, task.workspaceId, task).length))) { task.status = 'completed'; return; }
  queueTaskSteps(state, task, job.prompt, job.input);
}
export function failModelRequest(state: WorkbenchState, taskId: string, requestId: string, error: string) {
  const task = state.tasks.find(task => task.id === taskId);
  if (!task || task.status !== 'running' || task.modelRequest?.id !== requestId || task.modelRequest.status !== 'queued') return;
  task.modelRequest.status = 'failed'; task.status = 'failed';
  task.messages.push(message('system', error));
}

function queueTaskSteps(state: WorkbenchState, task: AgentTask, prompt: string, input: { serviceId?: string; resource?: string; skillId?: string }) {
  const workspace = state.workspaces.find(item => item.id === task.workspaceId)!;
  if (task.kind === 'business' && (task.mcpServiceId === 'mcp-tiangong' || isTiangongRequest(prompt)) && !input.serviceId && !effectiveTiangongLinks(state, workspace.id, task).length) { task.status = 'stopped'; task.messages.push(message('system', '请先关联天工系统并选择目标园区，再提交业务操作。')); return; }
  if (!['skill', 'skill-test'].includes(task.kind) && (!input.serviceId || /天工|园区/.test(prompt)) && (task.mcpServiceId === 'mcp-tiangong' || isTiangongRequest(prompt)) && effectiveTiangongLinks(state, workspace.id, task).length) {
    const resource = taskTiangongTarget(state, task);
    if (!resource) { task.status = 'stopped'; task.messages.push(message('system', '请在“关联配置”中关联一个已验证的天工园区。')); return; }
    const target = `${resource.parkName} · ${resource.url}`;
    const common = { target, tiangongResourceId: resource.id, tiangongSessionRef: resource.sessionRef };
    addCall(state, task, { ...common, kind: 'tiangong-read', label: '浏览器查询天工园区', parameters: JSON.stringify({ url: resource.url, parkId: resource.parkId, parkName: resource.parkName, action: 'read', mode: resource.mode }, null, 2) });
    if (isBusinessMutationRequest(prompt)) {
      addCall(state, task, { ...common, kind: 'tiangong-write', label: '浏览器修改天工业务记录', parameters: JSON.stringify({ url: resource.url, parkId: resource.parkId, action: prompt, mode: resource.mode }, null, 2) });
      prepareTiangongBrowserChange(state, state.calls[state.calls.length - 1], prompt);
    }
    task.status = 'running'; task.messages.push(message('assistant', `本次目标为「${resource.parkName}」，只访问这条天工资源。当前使用原型浏览器示例数据，修改会提交差异并等待确认。`));
    return;
  }
  if (task.kind === 'device' && !task.deviceId) {
    task.status = 'completed';
    task.messages.push(message('assistant', '当前任务尚未关联设备。请先点击“关联设备”选择一台设备，再提交设备操作。'));
    return;
  }
  if (task.kind !== 'business' && task.deviceId && (task.kind === 'device' || /设备|机器人|SSH|日志|部署/i.test(prompt))) {
    const mentionedOther = state.devices.find(device => device.id !== task.deviceId && prompt.toLowerCase().replace(/\s/g, '').includes(device.name.toLowerCase().replace(/\s/g, '')));
    const device = state.devices.find(item => item.id === (mentionedOther?.id || task.deviceId))!;
    addCall(state, task, { kind: 'device-read', label: '读取设备状态与运行日志', target: device.name, deviceId: device.id, parameters: JSON.stringify({ deviceId: device.id, path: '/var/log/robot/runtime.log' }, null, 2) });
    if (/重启|控制|部署|写入|更新参数|修改参数|启动设备/.test(prompt)) addCall(state, task, {
      kind: 'device-write', label: '执行设备调试操作', target: device.name, deviceId: device.id,
      parameters: JSON.stringify({ deviceId: device.id, operation: prompt, mode: 'simulation' }, null, 2),
    });
    if (/文件|配置|代码|参数/.test(prompt)) addCall(state, task, {
      kind: 'file-proposal', label: '生成设备配置修改方案', target: `${device.name} / /home/robot/config/runtime.json`,
      deviceId: device.id, filePath: '/home/robot/config/runtime.json',
      parameters: JSON.stringify({ deviceId: device.id, path: '/home/robot/config/runtime.json' }, null, 2),
      content: JSON.stringify({ deviceId: device.id, logLevel: 'info', diagnostics: true, taskInstruction: prompt }, null, 2),
    });
    task.messages.push(message('assistant', `我会针对绑定设备检查连接和运行日志。每次设备操作都限定在这台设备，控制操作将在执行前请求确认。`));
  } else if (task.kind === 'business') {
    const service = state.services.find(item => item.id === input.serviceId);
    const capability = service?.catalog && input.resource ? catalogCapability(service.catalog, input.resource) : undefined;
    const operations = capability ? capabilityOperations(capability) : [];
    const device = state.devices.find(device => device.id === task.deviceId);
    const target = `${service?.name || '未选择 MCP'} · ${input.resource || '未指定业务资源'}${device ? ` · ${device.name} (${device.address})` : ''}`;
    const parameters = (write: boolean) => JSON.stringify({ instruction: prompt, tool: write ? 'write' : 'read', resource: input.resource || '', ...(device ? { deviceId: device.id, deviceAddress: device.address } : {}), ...(capability ? { capabilityId: capability.id, apiCatalog: operations.filter(operation => catalogReadOnly(operation) !== write).map(operation => ({ method: operation.method, path: operation.path, operationId: operation.operationId })), knowledge: capability.knowledge, mode: 'simulation' } : {}), ...(write ? { instruction: prompt } : {}) }, null, 2);
    addCall(state, task, { kind: 'mcp-read', label: '查询业务资源', target, deviceId: task.deviceId || undefined, serviceId: input.serviceId, resource: input.resource, parameters: parameters(false) });
    if (isBusinessMutationRequest(prompt)) addCall(state, task, {
      kind: 'mcp-write', label: '更新业务资源', target, deviceId: task.deviceId || undefined, serviceId: input.serviceId, resource: input.resource,
      parameters: parameters(true),
    });
    task.messages.push(message('assistant', '我会先查询指定业务资源。所有调用都将重新检查当前授权，写入操作需要单独确认。'));
  } else if (task.kind === 'skill') {
    addCall(state, task, { kind: 'skill-create', label: '生成 Skill 草稿', target: `${workspace.name} / Skill 草稿`, content: prompt });
    task.messages.push(message('assistant', '我会把需求整理为 Skill 草稿，包含适用范围、执行步骤和结果要求，保存后可以继续编辑与测试。'));
  } else if (task.kind === 'skill-test') {
    const skillId = input.skillId || task.skillIds[0];
    const skill = state.skills.find(item => item.id === skillId);
    addCall(state, task, { kind: 'skill-test', label: '运行 Skill 演示测试', target: skill?.name || 'Skill', skillId, content: prompt });
  } else if (workspace.project && (task.kind === 'project' || /文件|代码|页面|组件|开发|修复/.test(prompt))) {
    initializeProjectFiles(state, workspace);
    const css = state.files.find(file => file.workspaceId === workspace.id && !file.deleted && file.path === 'src/index.css')?.content || '';
    const previousCalls = state.calls.length;
    for (const [filePath, content] of [['src/components/Settings.tsx', settingsSource(prompt, true)], ['src/index.css', css.includes('.connection-status') ? css : css + settingsStyles]]) {
      if (state.files.some(file => file.workspaceId === workspace.id && !file.deviceId && !file.deleted && file.path === filePath && file.content === content)) continue;
      addCall(state, task, { kind: 'file-proposal', label: `修改 ${filePath.split('/').pop()}`, target: `${workspace.project.name} / ${filePath}`, filePath, content });
    }
    if (state.calls.length === previousCalls) {
      task.status = state.changes.some(change => change.taskId === task.id && ['pending', 'conflict'].includes(change.status)) ? 'review' : 'completed';
      task.messages.push(message('assistant', '当前项目文件已包含这次修改方案，没有新增代码差异。'));
      return;
    }
    task.messages.push(message('assistant', '我会基于当前项目文件整理修改方案，具体差异将在右侧提交审查。'));
  } else {
    const sections = `# ${task.title}\n\n## 任务目标\n${prompt}\n\n## 执行建议\n1. 明确输入与输出。\n2. 选择需要的资源与工具。\n3. 查看结果并完成审查。\n\n${task.skillIds.length ? `已选择 ${task.skillIds.length} 个 Skill 作为任务上下文。\n` : ''}`;
    addCall(state, task, { kind: 'file-proposal', label: '整理任务产物', target: `${workspace.name} / artifacts/task-notes.md`, filePath: `artifacts/${task.id.slice(-8)}-notes.md`, content: sections });
    task.messages.push(message('assistant', '我会先整理需求与执行建议，生成保存在当前工作空间的任务产物。'));
  }
}

export function callBlockReason(state: WorkbenchState, call: ToolCall): string {
  const workspace = state.workspaces.find(item => item.id === call.workspaceId);
  const task = state.tasks.find(item => item.id === call.taskId);
  if (!workspace || workspace.archived) return '工作空间不可用，请恢复工作空间后继续。';
  if (workspace.builtinSystemId === 'tiangong' && call.deviceId) return '天工系统只支持园区资源。';
  if (workspace.builtinSystemId && workspace.builtinSystemId !== 'tiangong' && call.kind.startsWith('tiangong-')) return '当前系统只支持设备资源。';
  if (task && taskRequiresDevice(state, task) && !task.deviceId) return '当前任务必须绑定设备，请关联设备后重试。';
  if (call.kind.startsWith('tiangong-')) return tiangongCallBlockReason(state, call);
  if (call.kind === 'desktop' && (!task?.deviceId || call.deviceId !== task.deviceId)) return '请先为当前任务绑定设备，远程桌面只能操控该设备。';
  const extensionReason = extensionCallBlockReason(state, call);
  if (extensionReason) return extensionReason;
  if (call.deviceId) {
    if (task && task.deviceId !== call.deviceId) return '实际目标与当前任务关联设备不一致，请重新确认设备与操作。';
    if (!workspace.deviceIds.includes(call.deviceId)) return '该设备已移出工作空间，不能执行后续操作。';
    if (!state.devices.find(item => item.id === call.deviceId)?.connected) return '绑定设备未连接，请连接原设备后重试。';
  }
  if (call.kind.startsWith('mcp-')) {
    if (!call.serviceId || !state.services.some(service => service.id === call.serviceId)) return 'MCP 服务不可用，请选择有效服务。';
    const service = state.services.find(item => item.id === call.serviceId);
    const builtin = builtinSystemForService(call.serviceId);
    if (builtin) { const blocked = builtinSystemBlockReason(state, builtin.id, call.kind === 'mcp-write'); if (blocked) return blocked; }
    if (!service?.connected) return 'MCP 服务未连接，请先连接服务。';
    if (!call.resource || !service.resources.includes(call.resource)) return '该业务资源已不在服务范围内，请重新选择并授权。';
    if (service.catalog) {
      const capability = catalogCapability(service.catalog, call.resource);
      if (capability && service.capabilities?.find(item => item.id === capability.id)?.enabled === false) return '该 MCP 能力已停用，请在服务配置中启用后重试。';
    }
    if (service.requiresDevice && (!task?.deviceId || call.deviceId !== task.deviceId)) return `${service.name}调用必须明确当前任务绑定的设备。`;
    const tool = service.tools.find(item => item.id === (call.kind === 'mcp-write' ? 'write' : 'read'));
    if (!tool || tool.enabled === false) return '该 MCP 工具已停用，请在服务管理中启用后重试。';
    const grant = state.grants.find(item => item.taskId === call.taskId && item.serviceId === call.serviceId && item.resource === call.resource && !item.revoked);
    if (!grant || !grant.read || (call.kind === 'mcp-write' && !grant.write)) return '当前任务未获得该资源的所需权限，请调整任务授权后重试。';
    const businessReason = businessCallBlockReason(state, call);
    if (businessReason) return businessReason;
  }
  return '';
}

function executeCall(state: WorkbenchState, call: ToolCall) {
  if (call.status !== 'queued' || call.executions > 0) return;
  if (call.kind === 'mcp-write' && state.services.find(service => service.id === call.serviceId)?.integration === 'tiangong') prepareBusinessChange(state, call);
  const task = state.tasks.find(item => item.id === call.taskId);
  const reason = callBlockReason(state, call);
  if (reason) { call.status = 'blocked'; call.output = reason; return; }
  const write = call.kind === 'device-write' || call.kind === 'mcp-write' || call.kind === 'tiangong-write';
  const read = call.kind === 'device-read' || call.kind === 'mcp-read' || call.kind === 'tiangong-read';
  if ((write || (read && !state.settings.autoRead)) && !call.approved) { call.status = 'pending'; return; }
  if (call.kind.startsWith('tiangong-')) {
    call.output = executeTiangongBrowserCall(state, call);
  } else if (call.kind === 'file-proposal' && task) {
    const file = state.files.find(item => item.workspaceId === call.workspaceId && !item.deleted && item.path === call.filePath && item.deviceId === (call.deviceId || null));
    const existingProposal = state.changes.find(item => item.workspaceId === call.workspaceId && item.path === call.filePath && item.deviceId === (call.deviceId || null) && ['pending', 'conflict'].includes(item.status));
    state.changes.push({ id: uid('change'), workspaceId: call.workspaceId, taskId: task.id, fileId: file?.id || existingProposal?.fileId || uid('file'), deviceId: call.deviceId || null,
      path: call.filePath!, baseVersion: file?.version || 0, before: file?.content || '', after: call.content || '', status: 'pending' });
    const workspace = state.workspaces.find(item => item.id === call.workspaceId)!;
    if (state.activeWorkspaceId === workspace.id && workspace.activeTaskId === task.id && !workspace.panel.open) {
      workspace.panel.open = true; workspace.panel.tab = 'changes';
      workspace.panel.fileId = file?.id || existingProposal?.fileId || state.changes[state.changes.length - 1].fileId;
    }
    call.output = '已生成待审差异。请审查并接受修改后查看文件产物。';
  } else if (call.kind === 'skill-create' && task) {
    const skill = makeSkill(call.workspaceId, task.id, task.title, call.content || '');
    state.skills.push(skill);
    call.skillId = skill.id;
    call.output = `已保存「${skill.name}」草稿，可以在 Skill 管理中继续编辑与测试。`;
  } else if (call.kind === 'skill-test') {
    const skill = state.skills.find(item => item.id === call.skillId);
    if (!skill) { call.status = 'blocked'; call.output = 'Skill 已不存在，请重新选择。'; return; }
    call.output = `已加载「${skill.name}」\n测试输入：${call.content}\n执行方式：按 Skill 中的步骤组织任务。\n演示结果：已生成执行摘要，等待用户确认。`;
    skill.tests.push({ id: uid('test'), input: call.content || '', output: call.output, time: now() });
  } else if (call.kind === 'device-read') {
    call.output = `[演示] ${call.target}\n连接状态：已连接\n运行状态：空闲\n日志路径：/var/log/robot/runtime.log\n未发送设备控制指令。`;
  } else if (call.kind === 'device-write') {
    call.output = `[演示] 已对 ${call.target} 完成本次已授权调试操作。`;
  } else if (call.kind === 'mcp-read') {
    const resource = businessResource(state, call);
    const service = state.services.find(service => service.id === call.serviceId);
    const capability = service?.catalog && call.resource ? catalogCapability(service.catalog, call.resource) : undefined;
    let instruction = ''; try { instruction = JSON.parse(call.parameters).instruction || ''; } catch { /* Legacy calls may not have an instruction. */ }
    const vehicleQuery = service?.catalog === 'baichuan-qingda' && /里程|公里|跑了多远|执行.*任务|任务记录/.test(instruction);
    call.output = vehicleQuery ? `[原型业务查询] ${call.target}\n${[/里程|公里|跑了多远/.test(instruction) ? '今日行驶里程：18.6 公里\n累计行驶里程：1284.2 公里' : '', /执行.*任务|任务记录/.test(instruction) ? '今日示例任务：08:30 物料转运（已完成）；09:45 站点配送（已完成）；11:20 回充（已完成）' : ''].filter(Boolean).join('\n')}\n仅查询业务数据，未提交变更。数值为原型示例。` : capability ? `[演示 · 接口映射] ${capability.name}\n${capability.description}\n知识参考：${capability.knowledge.join('、')}\n已关联 ${capabilityOperations(capability).length} 项接口定义。实际查询结果需接入 MCP 服务后获取，当前未请求设备接口。` : resource ? `${resource.name} · v${resource.version}\n${resource.content}\n\n分析：${resource.kind === 'behavior-tree' ? '按顺序检查连接、读取状态并汇总结果。可审查重试次数与超时参数。' : '检查日志级别、轮询间隔与超时参数。'}\n仅当前任务获授权的资源可被修改。` : `${call.resource}\n当前状态：待处理\n资源范围：仅当前任务授权的业务资源\n可提交更新请求，执行前需用户确认。`;
  } else if (call.kind === 'mcp-write') {
    if (state.services.find(service => service.id === call.serviceId)?.integration === 'tiangong') {
      const error = commitBusinessChange(state, call);
      if (error) { call.status = 'blocked'; call.output = error; return; }
      call.output = `已更新 ${call.resource} 至 v${businessResource(state, call)!.version}。审查差异与执行结果已保留，确认任务结果不会重复写入。`;
    } else call.output = `[演示] 已更新 ${call.resource}。本次写入已记录，不会在结果确认时重复执行。`;
  }
  call.executions = 1;
  call.status = 'done';
}

export function runQueuedTaskStep(state: WorkbenchState, taskId: string) {
  const task = state.tasks.find(task => task.id === taskId);
  if (!task || task.status !== 'running' || task.modelRequest?.status === 'queued') return;
  const call = state.calls.find(call => call.taskId === taskId && call.actor === 'agent' && call.status === 'queued');
  if (call) executeCall(state, call);
  settleTask(state, taskId);
}

export function refreshBusinessChange(state: WorkbenchState, callId: string) {
  const call = state.calls.find(call => call.id === callId);
  if (!call || call.executions || !['pending', 'blocked'].includes(call.status) || !call.businessChange) return;
  call.businessChange = undefined; call.approved = false; prepareBusinessChange(state, call); call.status = 'pending'; call.output = '差异已重新生成，请重新审查后确认。';
  const task = state.tasks.find(task => task.id === call.taskId);
  if (task) task.status = 'authorization';
}

function settleTask(state: WorkbenchState, taskId: string) {
  const task = state.tasks.find(item => item.id === taskId);
  if (!task || task.status === 'stopped' || task.status === 'completed') return;
  const calls = state.calls.filter(item => item.taskId === taskId && item.actor === 'agent');
  if (calls.some(item => item.status === 'blocked')) { task.status = 'failed'; return; }
  if (calls.some(item => item.status === 'pending')) { task.status = 'authorization'; return; }
  if (calls.some(item => item.status === 'queued')) { task.status = 'running'; return; }
  const wasReview = task.status === 'review';
  task.status = 'review';
  if (!wasReview) task.messages.push(message('assistant', '本轮执行已结束。请查看操作结果与待审差异，处理完成后确认任务结果。'));
}

export function reviewCall(state: WorkbenchState, callId: string, accept: boolean) {
  const call = state.calls.find(item => item.id === callId);
  if (!call || call.status !== 'pending' || call.executions > 0) return;
  if (!accept) {
    call.status = 'denied'; call.output = '用户拒绝本次操作，未执行写入；其他已完成步骤保持不变。';
  } else {
    const reason = callBlockReason(state, call);
    if (reason) { call.status = 'blocked'; call.output = reason; }
    else { call.approved = true; call.status = 'queued'; }
  }
  const task = state.tasks.find(item => item.id === call.taskId);
  if (task && task.status !== 'stopped') { task.status = 'running'; settleTask(state, task.id); }
}

export function retryTask(state: WorkbenchState, taskId: string) {
  const task = state.tasks.find(item => item.id === taskId);
  if (!task || task.status === 'completed') return;
  if (task.modelRequest && task.modelRequest.status !== 'done') {
    const job = task.modelRequest;
    if (beginModelRequest(state, task, job.prompt, job.input)) return;
    task.messages.push(message('system', '模型服务已停用。请重新提交指令以使用当前模式。'));
    task.status = 'stopped'; return;
  }
  for (const call of state.calls.filter(item => item.taskId === taskId && item.actor === 'agent' && item.status === 'blocked' && item.executions === 0)) {
    call.status = 'queued'; call.approved = false; call.output = '';
  }
  task.status = 'running';
  task.messages.push(message('system', '继续处理未完成步骤，保持原绑定设备，跳过已执行和已拒绝的操作。'));
  settleTask(state, taskId);
}

export function confirmTask(state: WorkbenchState, taskId: string) {
  const task = state.tasks.find(item => item.id === taskId);
  if (!task || task.status !== 'review') return;
  if (state.changes.some(item => item.taskId === taskId && (item.status === 'pending' || item.status === 'conflict'))) return;
  if (state.calls.some(item => item.taskId === taskId && item.actor === 'agent' && ['queued', 'pending', 'blocked'].includes(item.status))) return;
  task.status = 'completed';
  task.messages.push(message('system', '已确认任务结果。本次确认仅更新任务状态。'));
}

export function acceptChange(state: WorkbenchState, changeId: string) {
  const change = state.changes.find(item => item.id === changeId);
  if (!change || change.status !== 'pending') return;
  if (changeWriteBlockReason(state, change)) return;
  const file = state.files.find(item => item.id === change.fileId);
  if ((file?.version || 0) !== change.baseVersion) { change.status = 'conflict'; return; }
  if (file) { file.content = change.after; file.version += 1; file.updatedAt = now(); }
  else state.files.push({ id: change.fileId, workspaceId: change.workspaceId, deviceId: change.deviceId, path: change.path, content: change.after, version: 1, updatedAt: now() });
  change.status = 'accepted';
  state.changes.filter(item => item.id !== changeId && item.fileId === change.fileId && item.status === 'pending').forEach(item => { item.status = 'conflict'; });
}

export function refreshChange(state: WorkbenchState, changeId: string) {
  const change = state.changes.find(item => item.id === changeId);
  if (!change || change.status !== 'conflict') return;
  const file = state.files.find(item => item.id === change.fileId);
  change.before = file?.content || ''; change.baseVersion = file?.version || 0; change.status = 'pending';
}

export function changeWriteBlockReason(state: WorkbenchState, change: FileChange) {
  if (change.deviceId && !extensionEnabled(state, 'mcp', 'device-files', change.deviceId)) return '当前设备的文件扩展已停用，请在扩展中心启用后再接受修改。';
  return fileWriteBlockReason(state, change, change.taskId);
}

export function fileWriteBlockReason(state: WorkbenchState, file: Pick<WorkspaceFile, 'workspaceId' | 'deviceId'>, taskId?: string | null): string {
  const workspace = state.workspaces.find(item => item.id === file.workspaceId);
  if (!workspace || workspace.archived) return '工作空间不可用。';
  if (!file.deviceId) return '';
  const task = state.tasks.find(item => item.id === taskId);
  if (task && task.deviceId !== file.deviceId) return '文件不属于当前任务关联设备，不能执行跨设备修改。';
  if (!workspace.deviceIds.includes(file.deviceId)) return '设备已移出空间，当前不能写入该设备文件。';
  if (!state.devices.find(item => item.id === file.deviceId)?.connected) return '设备未连接，连接原设备后才能接受修改。';
  return '';
}

export function saveFile(state: WorkbenchState, file: WorkspaceFile, content: string, expectedVersion: number, taskId?: string | null): boolean {
  if (fileWriteBlockReason(state, file, taskId)) return false;
  const current = state.files.find(item => item.id === file.id);
  if (current?.deleted) return false;
  if ((current?.version || 0) !== expectedVersion) return false;
  if (current) { current.content = content; current.version += 1; current.updatedAt = now(); }
  else state.files.push({ ...file, content, version: 1, updatedAt: now() });
  state.changes.filter(item => item.fileId === file.id && item.status === 'pending').forEach(item => { item.status = 'conflict'; });
  return true;
}

export function workspaceFiles(state: WorkbenchState, workspaceId: string): WorkspaceFile[] {
  const files = state.files.filter(item => item.workspaceId === workspaceId && !item.deleted);
  const pending = state.changes.filter(item => item.workspaceId === workspaceId && !['accepted', 'rejected'].includes(item.status) && !state.files.some(file => file.id === item.fileId));
  return [...files, ...pending.filter((item, index) => pending.findIndex(other => other.fileId === item.fileId) === index).map(item => ({ id: item.fileId, workspaceId, deviceId: item.deviceId, path: item.path, content: '', version: 0, updatedAt: '' }))];
}

export function initializeProjectFiles(state: WorkbenchState, workspace: Workspace) {
  if (workspace.builtinSystemId) return;
  if (!workspace.project || workspace.templateVersion) return;
  for (const [path, content] of Object.entries(projectTemplate(workspace.project.name))) {
    const parts = path.split('/');
    for (let i = 1; i < parts.length; i++) {
      const parent = parts.slice(0, i).join('/');
      if (!(state.folders || []).some(folder => folder.workspaceId === workspace.id && !folder.deviceId && folder.path === parent)) (state.folders ||= []).push({ id: uid('folder'), workspaceId: workspace.id, deviceId: null, path: parent });
    }
    if (state.files.some(file => file.workspaceId === workspace.id && file.path === path && !file.deviceId) || state.changes.some(change => change.workspaceId === workspace.id && change.path === path && !change.deviceId)) continue;
    state.files.push({ id: uid('file'), workspaceId: workspace.id, deviceId: null, path, content, version: 1, updatedAt: now() });
  }
  workspace.templateVersion = 1;
}

export function createProjectEntry(state: WorkbenchState, workspaceId: string, name: string, kind: 'file' | 'folder', deviceId: string | null = null, taskId?: string) {
  const path = name.trim().replace(/\\/g, '/').replace(/^\/+|\/+$/g, '');
  if (!path || path.split('/').some(part => !part || part === '.' || part === '..')) return { error: '请输入有效名称，不使用空目录或上级目录。' };
  const reason = fileWriteBlockReason(state, { workspaceId, deviceId }, taskId);
  if (reason) return { error: reason };
  const files = workspaceFiles(state, workspaceId).filter(file => file.deviceId === deviceId);
  const folders = (state.folders || []).filter(folder => folder.workspaceId === workspaceId && folder.deviceId === deviceId && !folder.deleted);
  if (files.some(file => file.path === path || path.startsWith(`${file.path}/`)) || folders.some(folder => folder.path === path) || files.some(file => file.path.startsWith(`${path}/`))) return { error: '同名文件或文件夹已存在。' };
  const parts = path.split('/');
  for (let i = 1; i < parts.length; i++) {
    const parent = parts.slice(0, i).join('/');
    if (!folders.some(folder => folder.path === parent)) (state.folders ||= []).push({ id: uid('folder'), workspaceId, deviceId, path: parent });
  }
  if (kind === 'folder') {
    const folder: WorkspaceFolder = { id: uid('folder'), workspaceId, deviceId, path };
    (state.folders ||= []).push(folder);
    return { folder };
  }
  const file: WorkspaceFile = { id: uid('file'), workspaceId, deviceId, path, content: '', version: 1, updatedAt: now() };
  state.files.push(file);
  return { file };
}

export type RemovedProjectEntry = { workspaceId: string; fileIds: string[]; folderIds: string[]; changes: { id: string; status: FileChange['status'] }[] };
export function removeProjectEntry(state: WorkbenchState, workspaceId: string, path: string, kind: 'file' | 'folder', deviceId: string | null = null, taskId?: string): RemovedProjectEntry | null {
  if (fileWriteBlockReason(state, { workspaceId, deviceId }, taskId)) return null;
  const root = path.replace(/^\/+/, '');
  const matches = (candidate: string) => { const value = candidate.replace(/^\/+/, ''); return value === root || (kind === 'folder' && value.startsWith(`${root}/`)); };
  const fileIds = workspaceFiles(state, workspaceId).filter(file => file.deviceId === deviceId && matches(file.path)).map(file => file.id);
  const folders = (state.folders || []).filter(folder => folder.workspaceId === workspaceId && folder.deviceId === deviceId && !folder.deleted && matches(folder.path));
  const changes = state.changes.filter(change => change.workspaceId === workspaceId && change.deviceId === deviceId && matches(change.path) && ['pending', 'conflict'].includes(change.status));
  const removed: RemovedProjectEntry = { workspaceId, fileIds, folderIds: folders.map(folder => folder.id), changes: changes.map(change => ({ id: change.id, status: change.status })) };
  state.files.filter(file => fileIds.includes(file.id) && !file.deleted).forEach(file => { file.deleted = true; file.version++; });
  folders.forEach(folder => { folder.deleted = true; });
  changes.forEach(change => { change.status = 'rejected'; });
  const workspace = state.workspaces.find(item => item.id === workspaceId);
  if (workspace && fileIds.includes(workspace.panel.fileId || '')) workspace.panel.fileId = null;
  return removed;
}

export function restoreProjectEntry(state: WorkbenchState, removed: RemovedProjectEntry) {
  state.files.filter(file => removed.fileIds.includes(file.id) && file.deleted).forEach(file => { file.deleted = false; file.version++; });
  (state.folders || []).filter(folder => removed.folderIds.includes(folder.id)).forEach(folder => { folder.deleted = false; });
  removed.changes.forEach(previous => {
    const change = state.changes.find(item => item.id === previous.id && item.status === 'rejected');
    if (!change) return;
    const file = state.files.find(item => item.id === change.fileId);
    change.status = (file?.version || 0) === change.baseVersion ? previous.status : 'conflict';
  });
}

export function unlinkMcp(state: WorkbenchState, workspaceId: string, serviceId: string) {
  const workspace = state.workspaces.find(item => item.id === workspaceId);
  if (!workspace) return;
  workspace.mcpIds = workspace.mcpIds.filter(id => id !== serviceId);
  state.grants.filter(item => item.workspaceId === workspaceId && item.serviceId === serviceId).forEach(item => { item.revoked = true; });
  state.calls.filter(item => item.workspaceId === workspaceId && item.serviceId === serviceId && ['pending', 'queued'].includes(item.status)).forEach(item => {
    item.status = 'blocked'; item.approved = false; item.output = 'MCP 已移除，后续调用已停止。任务历史保留。';
    if (item.taskId) settleTask(state, item.taskId);
  });
}

export function makeSkill(workspaceId: string, sourceTaskId: string | null, name: string, description: string): Skill {
  return { id: uid('skill'), workspaceId, sourceTaskId, name, description, status: 'draft', updatedAt: now(), tests: [],
    content: `---\nname: ${name}\ndescription: ${description}\n---\n\n# ${name}\n\n## 适用范围\n${description}\n\n## 执行步骤\n1. 读取任务目标与授权资源。\n2. 按步骤调用可用工具，记录实际目标和输出。\n3. 对修改行为提交审查。\n4. 整理结果，交由用户确认。\n\n## 约束\n设备任务仅操作其绑定设备；MCP 访问遵守任务当前授权。\n` };
}

export const deviceConnectionIdentity = (device?: Device) => device ? JSON.stringify([device.id, device.connection?.host || device.address, device.connection?.port || 22, device.connection?.username || '']) : '';

export function openTerminal(state: WorkbenchState, workspaceId: string, taskId: string | null, selectedDeviceId?: string): TerminalSession | null {
  const workspace = state.workspaces.find(item => item.id === workspaceId);
  const task = state.tasks.find(item => item.id === taskId);
  if (!workspace) return null;
  if (taskId && (!task || task.workspaceId !== workspaceId)) return null;
  if (task?.deviceId && selectedDeviceId && selectedDeviceId !== task.deviceId) return null;
  const deviceId = task?.deviceId || selectedDeviceId;
  if (deviceId && !workspace.deviceIds.includes(deviceId)) return null;
  const device = deviceId ? state.devices.find(item => item.id === deviceId) : null;
  const environment = device?.name || workspace.project?.name || `${workspace.name} · 临时环境`;
  const cwd = device ? '/home/robot' : workspace.project?.path || '/workspace/artifacts';
  const session: TerminalSession = { id: uid('term'), workspaceId, originTaskId: task?.id || null, deviceId: device?.id || null,
    environment, cwd, connectionIdentity: deviceConnectionIdentity(device), lines: [`${environment} — bash（演示）`, `工作目录：${cwd}`], createdAt: now() };
  state.terminals.push(session);
  workspace.panel.terminalId = session.id; workspace.panel.tab = 'terminal'; workspace.panel.open = true;
  return session;
}

export function ensureTaskTerminal(state: WorkbenchState, workspaceId: string, taskId: string | null) {
  const workspace = state.workspaces.find(item => item.id === workspaceId);
  if (!workspace) return null;
  const task = state.tasks.find(item => item.id === taskId);
  const device = state.devices.find(device => device.id === task?.deviceId);
  const sessions = state.terminals.filter(session => session.workspaceId === workspaceId && session.originTaskId === taskId && session.deviceId === (task?.deviceId || null) && (!session.connectionIdentity || session.connectionIdentity === deviceConnectionIdentity(device)));
  const session = sessions.find(item => item.id === workspace.panel.terminalId) || sessions[sessions.length - 1];
  if (!session) return openTerminal(state, workspaceId, taskId);
  workspace.panel.open = true; workspace.panel.tab = 'terminal'; workspace.panel.terminalId = session.id;
  return session;
}

export function terminalBlockReason(state: WorkbenchState, session: TerminalSession, currentTask: AgentTask | undefined) {
  if (session.originTaskId !== (currentTask?.id || null)) return '该终端属于另一个聊天，请打开当前聊天的终端。';
  if (currentTask && currentTask.deviceId !== session.deviceId) return '该终端保留的是之前的执行环境。请打开当前关联设备的终端。';
  if (session.deviceId) {
    if (session.connectionIdentity && session.connectionIdentity !== deviceConnectionIdentity(state.devices.find(device => device.id === session.deviceId))) return '设备连接配置已变化，此会话保留原环境。请新建终端会话。';
    const call: ToolCall = { id: '', workspaceId: session.workspaceId, taskId: session.originTaskId, actor: 'user', kind: 'terminal', label: '', target: session.environment, deviceId: session.deviceId, status: 'queued', approved: true, executions: 0, parameters: '', output: '', createdAt: '' };
    return callBlockReason(state, call);
  }
  return '';
}

export function runTerminal(state: WorkbenchState, sessionId: string, currentTaskId: string | null, command: string) {
  const session = state.terminals.find(item => item.id === sessionId);
  const task = state.tasks.find(item => item.id === currentTaskId);
  if (!session || !command.trim()) return;
  let reason = terminalBlockReason(state, session, task);
  const other = state.devices.find(item => item.id !== session.deviceId && (command.includes(item.address) || command.toLowerCase().replace(/\s/g, '').includes(item.name.toLowerCase().replace(/\s/g, ''))));
  if (session.deviceId && (other || /\bssh\b|\bscp\b/.test(command))) reason = '设备终端固定绑定当前设备，不能切换或转发到其他设备。请创建对应设备任务。';
  let output = '';
  if (reason) output = reason;
  else if (command.trim() === 'pwd') output = session.cwd;
  else if (command.trim() === 'ls') output = workspaceFiles(state, session.workspaceId).filter(item => item.deviceId === session.deviceId).map(item => item.path).join('\n') || '当前目录暂无文件';
  else if (/^(pnpm|npm) (run )?build/.test(command)) output = '[演示] 项目构建命令已记录。';
  else if (/^(pnpm|npm) (run )?dev/.test(command)) output = '[演示] 项目开发命令已记录。';
  else if (/^(pnpm|npm) install/.test(command)) output = '[演示] 依赖安装步骤已记录。';
  else if (command.startsWith('echo ')) output = command.slice(5);
  else if (command.startsWith('cd ')) { session.cwd = command.slice(3).trim() || session.cwd; output = session.cwd; }
  else if (command.startsWith('cat ')) output = workspaceFiles(state, session.workspaceId).find(item => item.path === command.slice(4).trim() && item.deviceId === session.deviceId)?.content || '未找到文件';
  else output = `[演示] 已记录命令：${command}。当前终端支持 pwd、ls、cat、cd、echo 和 npm / pnpm 开发命令。`;
  session.lines.push(`${session.cwd} ❯ ${command}`, output);
  state.calls.push({ id: uid('call'), workspaceId: session.workspaceId, taskId: session.originTaskId, actor: 'user', kind: 'terminal', label: '手动终端操作', target: session.environment,
    deviceId: session.deviceId || undefined, status: reason ? 'blocked' : 'done', approved: true, executions: reason ? 0 : 1, parameters: command, output, createdAt: now() });
}

// 聚合系统配置中已启用的所有模型提供商与可用模型列表
export function getAvailableWorkbenchModels(state: WorkbenchState): {
  id: string;
  name: string;
  providerId: string;
  providerName: string;
  type: ProviderType;
  isDefault?: boolean;
}[] {
  const providers = (state.configuredProviders && state.configuredProviders.length > 0)
    ? state.configuredProviders
    : defaultConfiguredProviders();

  const result: {
    id: string;
    name: string;
    providerId: string;
    providerName: string;
    type: ProviderType;
    isDefault?: boolean;
  }[] = [];

  providers
    .filter(p => p.enabled)
    .forEach(p => {
      p.models.forEach(m => {
        result.push({
          id: m.id,
          name: m.name || m.id,
          providerId: p.id,
          providerName: p.name,
          type: p.type,
          isDefault: m.isDefault,
        });
      });
    });

  if (result.length === 0) {
    result.push(
      { id: 'GPT-5.1 Codex', name: 'GPT-5.1 Codex (系统默认)', providerId: 'openai', providerName: 'OpenAI', type: 'preset', isDefault: true },
      { id: 'Claude 3.7 Sonnet', name: 'Claude 3.7 Sonnet (混合思考)', providerId: 'anthropic', providerName: 'Anthropic', type: 'preset' },
      { id: 'DeepSeek-V3', name: 'DeepSeek-V3 (通用高精度代码)', providerId: 'deepseek', providerName: 'DeepSeek', type: 'preset' },
    );
  }

  return result;
}
