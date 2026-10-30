import { useEffect, useMemo, useRef, useState } from 'react';
import {
  ArrowLeft, ArrowUp, Box, Building2, Check, ChevronDown, ChevronRight, Cpu, FileCode2, FileText, Folder, FolderPlus,
  FolderX, Layers, Link2, Mic, PanelRight, Plus, Search, Upload, X,
} from 'lucide-react';
import { extensionEnabled, extensionItems } from './agentExtensions';
import { activeModelConfig, modelProviders } from './agentModelService';
import { projectChatResources, workspaceChatResourceType } from './agentChatResources';
import { findResourceMentions, resourceMentionDraft, resourceSlashRange } from './agentResourceMentions';
import AgentResourceBinding from './AgentResourceBinding';
import TaskDeviceDialog from './TaskDeviceDialog';
import { builtinSystemForProject, inferResourceSystem, builtinResourceType, builtinSystemConfiguration, isPlatformAdmin, suggestedSystemResource } from './agentBuiltinSystems';
import { effectiveTiangongLinks, tiangongResourceAccess, isTiangongRequest, type TiangongLink } from './agentTiangongResources';
import { businessCapabilities } from './agentBusinessCatalog';
import { WorkbenchSelect } from './AgentWorkbench';
import {
  createProjectWorkspace, models, selectChatTaskContext, startTask, getAvailableWorkbenchModels, workspaceFiles,
  type ComposerDraft, type Project, type TaskKind, type ToolTab, type UpdateState, type WorkbenchState, type Workspace,
} from './agentWorkbenchState';

type Props = { state: WorkbenchState; update: UpdateState; workspace?: Workspace; resourceRequest?: 'park' | 'device' | null; onResourceRequestHandled?: () => void; notify: (text: string) => void; onCreated: () => void };
type Menu = 'project' | 'add' | null;

export default function AgentTaskComposer({ state, update, workspace, notify, onCreated, resourceRequest, onResourceRequestHandled }: Props) {
  const saved = workspace?.composerDraft || (!workspace ? state.homeDraft : undefined);
  const [prompt, setPrompt] = useState(saved?.prompt || '');
  const [project, setProject] = useState<Project | null>(saved?.project !== undefined ? saved.project : workspace?.project || null);
  const inherited = projectChatResources(state, workspace);
  const [ownDeviceId, setDeviceId] = useState(saved?.deviceId ?? (!workspace?.project && !workspace?.isChatSpace ? workspace?.selectedDeviceId : '') ?? '');
  const deviceId = inherited.locked ? inherited.deviceId : ownDeviceId;
  const [kind, setKind] = useState<TaskKind>(saved?.kind === 'skill' || saved?.kind === 'business' ? saved.kind : 'general');

  // 系统配置真实模型列表（根据模型服务商配置动态更新）
  const systemModelList = useMemo(() => {
    const list = getAvailableWorkbenchModels(state);
    return list.map(m => m.name || m.id);
  }, [state]);

  const selectedModel = activeModelConfig(state);
  const defaultModelName = selectedModel?.enabled ? selectedModel.modelId : state.settings.model;
  const [chosenModel, setChosenModel] = useState(defaultModelName || systemModelList[0] || 'GPT-5.1 Codex');
  const [runMode, setRunMode] = useState<'Build' | 'Plan'>('Build');
  const [reasoningLevel, setReasoningLevel] = useState<'默认' | '高' | '中' | '低'>('默认');
  const [composerMenu, setComposerMenu] = useState<'mode' | 'reasoning' | 'model' | null>(null);
  const [attachedFiles, setAttachedFiles] = useState<{ id: string; path: string; name: string }[]>([]);
  const [addMenuView, setAddMenuView] = useState<'main' | 'files'>('main');
  const [fileSearchQuery, setFileSearchQuery] = useState('');
  const composerBoxRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleDown = (e: MouseEvent) => {
      if (composerBoxRef.current && !composerBoxRef.current.contains(e.target as Node)) {
        setComposerMenu(null); setSlashQuery(null);
      }
    };
    document.addEventListener('mousedown', handleDown);
    return () => document.removeEventListener('mousedown', handleDown);
  }, []);

  const fixedSystem = builtinSystemForProject(state, project);
  const [resource, setResource] = useState(saved?.resource || '');
  const [skillIds, setSkillIds] = useState<string[]>(saved?.skillIds || []);
  const [menu, setMenu] = useState<Menu>(null);
  const [createProjectOpen, setCreateProjectOpen] = useState(false);
  const [showSkills, setShowSkills] = useState(false);
  const [error, setError] = useState('');
  const [resourceDialog, setResourceDialog] = useState<'park' | 'device' | 'all' | null>(null);
  const [initialParkResourceId, setInitialParkResourceId] = useState<string>();
  const slashRange = useRef<{ start: number; end: number } | null>(null);
  useEffect(() => {
    if (resourceRequest) { setResourceDialog(resourceRequest); onResourceRequestHandled?.(); }
  }, [resourceRequest, onResourceRequestHandled]);
  const [slashQuery, setSlashQuery] = useState<string | null>(null);
  const [slashIndex, setSlashIndex] = useState(0);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [tiangongLinks, setTiangongLinks] = useState<TiangongLink[]>(saved?.tiangongLinks || []);
  const [tiangongTargetId, setTiangongTargetId] = useState(saved?.tiangongTargetId);
  const wasInherited = useRef(inherited.locked);
  useEffect(() => {
    if (wasInherited.current && !inherited.locked) { setDeviceId(''); setTiangongLinks([]); setTiangongTargetId(undefined); }
    wasInherited.current = inherited.locked;
  }, [inherited.locked]);
  const tiangongWorkspaceId = workspace?.id || state.workspaces.find(item => project && item.project?.id === project.id)?.id;
  const possibleLinks = inherited.locked ? inherited.links : deviceId || (fixedSystem && fixedSystem.id !== 'tiangong') ? [] : effectiveTiangongLinks(state, tiangongWorkspaceId, undefined, tiangongLinks);
  const selectedSystem = inferResourceSystem(state, { project, deviceId, links: possibleLinks, prompt });
  const serviceId = selectedSystem?.serviceId || '';
  const resourceType = builtinResourceType(selectedSystem?.id);
  const selectedTiangongLinks = resourceType === 'device' ? [] : possibleLinks;
  const mcpExplicit = false;
  const allowWrite = Boolean(selectedSystem && isPlatformAdmin(state) && builtinSystemConfiguration(state, selectedSystem.id).write);
  const draftSelection = { workspaceId: workspace?.id, readOnly: inherited.locked, deviceId, selectDevice: (id: string) => { setDeviceId(id); if (id) { const inherited = state.workspaces.find(item => item.id === tiangongWorkspaceId)?.tiangongLinks || []; setTiangongLinks(inherited.map(link => ({ ...link, enabled: false }))); setTiangongTargetId(undefined); } setError(''); }, links: selectedTiangongLinks, targetId: tiangongTargetId, saveLinks: (links: TiangongLink[], targetId?: string) => { const inherited = state.workspaces.find(item => item.id === tiangongWorkspaceId)?.tiangongLinks || []; setTiangongLinks([...inherited.filter(link => !links.some(selected => selected.resourceId === link.resourceId)).map(link => ({ ...link, enabled: false })), ...links]); setTiangongTargetId(targetId); if (links.length) setDeviceId(''); setError(''); } };
  const device = state.devices.find(item => item.id === deviceId);
  const service = state.services.find(item => item.id === serviceId);
  const availableSkills = extensionItems(state).filter(item => item.kind === 'skill' && extensionEnabled(state, 'skill', item.id, deviceId));
  const draft: ComposerDraft = { prompt, project, kind, deviceId, model: chosenModel, serviceId, resource, allowWrite, skillIds, mcpExplicit, tiangongLinks, tiangongTargetId };

  // 工作区与项目内的可用文件列表
  const availableFiles = useMemo(() => {
    const targetWorkspaceId = workspace?.id || tiangongWorkspaceId;
    const list = targetWorkspaceId ? workspaceFiles(state, targetWorkspaceId).filter(f => !f.deleted) : [];
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
  }, [state, workspace?.id, tiangongWorkspaceId]);

  const filteredAddMenuFiles = useMemo(() => {
    if (!fileSearchQuery) return availableFiles;
    return availableFiles.filter(
      f => f.name.toLowerCase().includes(fileSearchQuery.toLowerCase()) || f.path.toLowerCase().includes(fileSearchQuery.toLowerCase())
    );
  }, [availableFiles, fileSearchQuery]);

  const handleAttachFile = (file: { id: string; path: string; name: string }) => {
    if (!attachedFiles.some(f => f.path === file.path)) {
      setAttachedFiles(prev => [...prev, file]);
      notify(`已添加文件：${file.name}`);
    }
    setMenu(null);
    setAddMenuView('main');
    textareaRef.current?.focus();
  };

  const handleUploadLocalFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    handleAttachFile({
      id: `upload-${Date.now()}`,
      path: `uploads/${file.name}`,
      name: file.name,
    });
    e.target.value = '';
  };

  useEffect(() => update(next => {
    const current = next.workspaces.find(item => item.id === workspace?.id);
    const value: ComposerDraft = { prompt, project, kind, deviceId, model: chosenModel, serviceId, resource, allowWrite, skillIds, mcpExplicit, tiangongLinks, tiangongTargetId };
    if (current && !current.activeTaskId) current.composerDraft = value;
    else if (!workspace) next.homeDraft = value;
  }), [prompt, project, kind, deviceId, chosenModel, serviceId, resource, allowWrite, skillIds, mcpExplicit, tiangongLinks, tiangongTargetId, workspace?.id, update]);

  const fixedResourceType = workspaceChatResourceType(workspace) || builtinResourceType(fixedSystem?.id);
  const availableResourceTypes: ('park' | 'device')[] = inherited.locked ? [] : fixedResourceType ? [fixedResourceType] : ['park', 'device'];
  const resourceCommands = availableResourceTypes.filter(type => slashQuery === '' || (type === 'park' ? '关联园区' : '关联设备').includes(slashQuery || ''));
  const resourceMatches = slashQuery === null ? [] : findResourceMentions(state, slashQuery, availableResourceTypes);
  const resourceMenuItems = [
    ...resourceCommands.map(type => ({ id: `command-${type}`, type, label: type === 'park' ? '/关联园区' : '/关联设备', description: '', resourceId: '', needsAuthentication: false })),
    ...resourceMatches.map(resource => ({ id: `${resource.type}-${resource.id}`, type: resource.type, label: resource.name, description: '', resourceId: resource.id, needsAuthentication: resource.needsAuthentication })),
  ];
  const chooseResourceCommand = (item: typeof resourceMenuItems[number]) => {
    const range = slashRange.current;
    setPrompt(value => range ? value.slice(0, range.start) + value.slice(range.end) : value);
    slashRange.current = null; setSlashQuery(null); setInitialParkResourceId(undefined);
    if (!item.resourceId) { setResourceDialog(item.type); return; }
    const selection = resourceMentionDraft(state, item.type, item.resourceId);
    if (!selection) {
      if (item.type === 'park') { setInitialParkResourceId(item.resourceId); setResourceDialog('park'); }
      return;
    }
    if (selection.deviceId) draftSelection.selectDevice(selection.deviceId);
    else draftSelection.saveLinks(selection.tiangongLinks, selection.tiangongLinks[0]?.resourceId);
    textareaRef.current?.focus();
  };

  const chooseContext = (nextProject: Project | null, nextDeviceId: string, clearMcp = false) => {
    setProject(nextProject); setDeviceId(nextDeviceId); setMenu(null); setError('');
    const changedProject = clearMcp || nextProject?.id !== project?.id;
    if (changedProject) { setTiangongLinks([]); setTiangongTargetId(undefined); }
    const nextSystem = inferResourceSystem(state, { project: nextProject, deviceId: nextDeviceId, prompt });
    const nextServiceId = nextSystem?.serviceId || '';
    const nextResource = state.services.find(service => service.id === nextServiceId)?.resources[0] || '';
    setResource(nextResource);
    update(next => {
      const current = selectChatTaskContext(next, nextProject, nextDeviceId, workspace?.id);
      current.activeTaskId = null;
      current.panel.open = false;
      current.composerDraft = { ...draft, project: nextProject, deviceId: nextDeviceId, serviceId: nextServiceId || '', resource: nextResource, ...(clearMcp ? { mcpExplicit: true, allowWrite: false } : {}), ...(changedProject ? { tiangongLinks: [], tiangongTargetId: undefined } : {}) };
    });
  };
  const openTool = (tab?: ToolTab) => update(next => {
    const current = selectChatTaskContext(next, project, deviceId, workspace?.id);
    current.activeTaskId = null;
    current.composerDraft = draft;
    current.panel.open = tab ? true : !current.panel.open;
    current.panel.draftOpen = current.panel.open;
    if (tab) current.panel.tab = tab;
  });
  const submit = () => {
    if (!prompt.trim() && attachedFiles.length === 0) return;
    let finalPrompt = prompt.trim();
    if (attachedFiles.length > 0) {
      const filesContext = `[关联上下文文件：${attachedFiles.map(f => f.path).join(', ')}]`;
      finalPrompt = finalPrompt ? `${filesContext}\n\n${finalPrompt}` : `请分析并检查关联项目文件：${attachedFiles.map(f => f.path).join(', ')}`;
    }
    if (resourceType === 'park' && (selectedTiangongLinks.length !== 1 || !state.tiangongResources?.some(resource => resource.id === selectedTiangongLinks[0]?.resourceId && tiangongResourceAccess(resource)))) { setError('请先关联一个园区。'); setResourceDialog('park'); return; }
    if (resourceType === 'device' && !device) { setError(`${selectedSystem?.name || '当前'}任务需要绑定一台设备，请先选择设备。`); setResourceDialog('device'); return; }
    if (skillIds.some(id => !extensionEnabled(state, 'skill', id, deviceId))) { setError('所选 Skill 或插件已停用，请在扩展中心启用后再提交。'); return; }
    if (serviceId === 'mcp-tiangong' && !builtinSystemConfiguration(state, 'tiangong').enabled) { setError('天工系统能力已停用。'); return; }
    if (serviceId && serviceId !== 'mcp-tiangong' && !extensionEnabled(state, 'mcp', serviceId, deviceId)) { setError('该资源对应的系统能力已停用，请在扩展中心启用后再提交。'); return; }
    const requestedResource = suggestedSystemResource(serviceId, finalPrompt) || resource || service?.resources[0] || '';
    if (serviceId !== 'mcp-tiangong' && (kind === 'business' || serviceId) && (!service || !service.resources.includes(requestedResource))) { setError('当前资源暂无可用能力，请重新关联资源。'); return; }
    const resolvedKind: TaskKind = kind === 'skill' ? kind : serviceId || (isTiangongRequest(finalPrompt) && selectedTiangongLinks.length) ? 'business' : deviceId ? 'device' : project ? 'project' : 'chat';
    update(next => {
      const current = selectChatTaskContext(next, project, deviceId, workspace?.id);
      const newTask = startTask(next, { workspaceId: current.id, prompt: finalPrompt, kind: resolvedKind, deviceId: resourceType === 'park' ? '' : deviceId, model: chosenModel, skillIds,
        serviceId: serviceId || undefined, resource: requestedResource, allowWrite: isPlatformAdmin(state) && (selectedSystem ? builtinSystemConfiguration(state, selectedSystem.id).write : allowWrite), tiangongLinks: selectedTiangongLinks, tiangongTargetId: selectedTiangongLinks[0]?.resourceId });
      if (newTask) {
        newTask.runMode = runMode;
        newTask.reasoning = reasoningLevel;
      }
    });
    setAttachedFiles([]);
    onCreated();
  };
  const linkedParkName = state.tiangongResources?.find(r => r.id === selectedTiangongLinks[0]?.resourceId)?.parkName;
  return <div className="aw-composer-page"><div className="aw-composer-center"><h1>今天要开发什么？</h1>
    <div className="aw-prompt-box" ref={composerBoxRef}>
      {attachedFiles.length > 0 && (
        <div className="aw-attached-files-bar">
          {attachedFiles.map(file => (
            <span key={file.path} className="aw-attached-file-chip">
              <FileCode2 size={12} />
              <span className="file-name" title={file.path}>{file.name}</span>
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
      {!inherited.locked && (fixedSystem || deviceId || selectedTiangongLinks.length > 0) && <div className="aw-inline-resource-entry">
        <AgentResourceBinding type={selectedTiangongLinks.length ? 'park' : deviceId ? 'device' : builtinResourceType(fixedSystem?.id)!} state={state} update={update} deviceId={deviceId} links={selectedTiangongLinks} draftSelection={draftSelection} systemId={fixedSystem?.id} notify={notify} />
      </div>}
      {slashQuery !== null && <div key={slashQuery} className="aw-resource-command-menu" role="menu" aria-label="资源关联命令">
        {resourceMenuItems.map((item, index) => <button type="button" role="menuitem" className={index === slashIndex ? 'is-active' : ''} key={item.id} onClick={() => chooseResourceCommand(item)}><span>{item.label}</span></button>)}
        {!resourceMenuItems.length && <p className="aw-resource-menu-empty">{inherited.locked ? '当前聊天继承项目资源，无法更换关联' : '没有匹配的资源'}</p>}
      </div>}
      <textarea ref={textareaRef} aria-label="新聊天消息" autoFocus value={prompt} onChange={event => {
        setPrompt(event.target.value);
        const match = resourceSlashRange(event.target.value.slice(0, event.target.selectionStart));
        slashRange.current = match || null;
        setSlashQuery(match ? match.query : null); setSlashIndex(0);
      }} placeholder="描述你想开发、修改或检查的内容…" onKeyDown={event => {
        if (event.nativeEvent.isComposing) return;
        if (slashQuery !== null) {
          if (event.key === 'Escape') { event.preventDefault(); setSlashQuery(null); return; }
          if (resourceMenuItems.length && ['ArrowDown', 'ArrowUp'].includes(event.key)) { event.preventDefault(); setSlashIndex(index => (index + (event.key === 'ArrowDown' ? 1 : -1) + resourceMenuItems.length) % resourceMenuItems.length); return; }
          if (resourceMenuItems.length && event.key === 'Enter' && !event.shiftKey) { event.preventDefault(); chooseResourceCommand(resourceMenuItems[slashIndex] || resourceMenuItems[0]); return; }
        }
        if (event.key === 'Enter' && !event.shiftKey) { event.preventDefault(); submit(); }
      }} />
      </div>
      <div className="aw-prompt-footer">
        <div className="aw-composer-controls">
          <div className="aw-composer-add-wrap relative">
            <button
              type="button"
              className={`flex h-8 w-8 items-center justify-center rounded-xl border text-[12px] leading-none transition-colors ${
                menu === 'add' ? 'border-[#7771B2] bg-[#EDEFFF] text-[#241F7D]' : 'border-transparent bg-[#f4f4f5] text-[#62626b] hover:bg-[#e9e9ec]'
              }`}
              aria-label="新增文件"
              title="新增文件"
              aria-expanded={menu === 'add'}
              onClick={() => {
                setMenu(menu === 'add' ? null : 'add');
                setComposerMenu(null);
              }}
            >
              <Plus size={15} />
            </button>
            {menu === 'add' && <>
              <MenuDismiss close={() => setMenu(null)} />
              <div className="absolute bottom-9.5 left-0 z-30 min-w-[280px] overflow-hidden rounded-xl border border-[#e4e4e7] bg-white p-2 shadow-[0_8px_24px_rgba(0,0,0,.12)]">
                <div className="flex items-center justify-between px-2 py-1 text-[12px] font-medium text-[#27272a] border-b border-[#f0f0f2] pb-1.5">
                  <span>新增文件</span>
                  <span className="text-[10px] text-[#9a9faa]">添加文件上下文</span>
                </div>
                <div className="my-2 flex h-8 items-center gap-2 rounded-lg bg-[#f4f4f5] px-2.5 text-[#9a9faa]">
                  <Search size={13} className="shrink-0 text-[#9a9faa]" />
                  <input
                    autoFocus
                    type="text"
                    placeholder="搜索项目文件路径..."
                    value={fileSearchQuery}
                    onChange={e => setFileSearchQuery(e.target.value)}
                    className="min-w-0 flex-1 border-0 bg-transparent p-0 text-[12px] text-[#27272a] outline-none placeholder:text-[#9a9faa]"
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
            </>}
          </div>

          {/* 模式选择 (Build / Plan) —— 100% 沿用图三（插件开发）现有规范 */}
          <WorkbenchSelect
            label={runMode}
            open={composerMenu === 'mode'}
            options={['Build', 'Plan']}
            onToggle={() => {
              setComposerMenu(composerMenu === 'mode' ? null : 'mode');
              setMenu(null);
            }}
            onSelect={(val) => {
              setRunMode(val as 'Build' | 'Plan');
              setComposerMenu(null);
            }}
            onClose={() => setComposerMenu(null)}
          />

          {/* 推理强度 (默认 / 高 / 中 / 低) —— 100% 沿用图三（插件开发）现有规范 */}
          <WorkbenchSelect
            label={reasoningLevel}
            open={composerMenu === 'reasoning'}
            options={['默认', '高', '中', '低']}
            onToggle={() => {
              setComposerMenu(composerMenu === 'reasoning' ? null : 'reasoning');
              setMenu(null);
            }}
            onSelect={(val) => {
              setReasoningLevel(val as '默认' | '高' | '中' | '低');
              setComposerMenu(null);
              notify(`已将推理深度设为：${val}`);
            }}
            onClose={() => setComposerMenu(null)}
          />

          <button className="aw-composer-approval" title="自动批准只读操作；修改操作仍需审查" onClick={() => update(next => { next.settings.autoRead = !next.settings.autoRead; })}>
            <Check size={13} />{state.settings.autoRead ? '自动批准' : '逐项批准'}
          </button>
          {kind === 'skill' && <button className="aw-composer-kind" onClick={() => setKind('general')}>{kind === 'skill' ? '创建 Skill' : 'MCP 任务'}<X size={10} /></button>}
        </div>

        <div className="aw-composer-send-controls">
          {/* 系统真实配置模型选择 —— 沿用图三（插件开发）现有规范，点击空白可自动收起 */}
          <WorkbenchSelect
            label={chosenModel}
            open={composerMenu === 'model'}
            options={systemModelList}
            align="right"
            widthClass="min-w-[160px]"
            onToggle={() => {
              setComposerMenu(composerMenu === 'model' ? null : 'model');
              setMenu(null);
            }}
            onSelect={(val) => {
              setChosenModel(val);
              setComposerMenu(null);
              notify(`已切换模型为：${val}`);
            }}
            onClose={() => setComposerMenu(null)}
          />
          <button className="aw-composer-icon" aria-label="语音输入" title="语音输入" onClick={() => notify('当前演示暂未接入语音输入，可以直接输入需求文字。')}><Mic size={15} /></button>
          <button className="aw-send aw-followup-send" disabled={!prompt.trim() && attachedFiles.length === 0} onClick={submit} aria-label={!project && !deviceId && kind === 'general' ? '发送聊天消息' : '创建 Agent 任务'}><ArrowUp size={15} /></button>
        </div>
      </div>
    </div>
    <div className="aw-composer-resource-bar" aria-label="项目、文件与插件">
      <div className="aw-context-selector">
        {workspace?.project || inherited.locked ? <span className="aw-project-context-chip" title="当前项目"><Folder size={14} />{workspace?.project?.name || '无项目'}</span> : <button type="button" className={`aw-context-trigger ${menu === 'project' ? 'is-active' : ''}`} aria-label="选择项目" aria-expanded={menu === 'project'} onClick={() => setMenu(menu === 'project' ? null : 'project')}><Folder size={14} /><span>{project?.name || '选择项目'}</span><ChevronDown size={11} /></button>}
        {menu === 'project' && <><MenuDismiss close={() => setMenu(null)} /><ProjectMenu state={state} selected={project} choose={value => chooseContext(value, '')} create={() => { setMenu(null); setCreateProjectOpen(true); }} /></>}
      </div>
      {!fixedSystem && !inherited.locked && <button type="button" aria-label="关联配置" aria-expanded={resourceDialog === 'all'} onClick={() => { setInitialParkResourceId(undefined); setMenu(null); setComposerMenu(null); setResourceDialog('all'); }}><Link2 size={14} />关联配置</button>}
      <button type="button" onClick={() => openTool('files')}><FileText size={14} />文件</button>
      <button type="button" className={showSkills ? 'is-active' : ''} aria-expanded={showSkills} onClick={() => setShowSkills(!showSkills)}><Box size={14} />插件{skillIds.length > 0 && <b>{skillIds.length}</b>}</button>
      <button type="button" className="aw-composer-panel-toggle" aria-label="切换开发工具面板" onClick={() => openTool()}><PanelRight size={14} /></button>
    </div>
    {showSkills && <div className="aw-skill-picker"><strong className="aw-skill-picker-title">插件与 Skill 能力</strong>{availableSkills.length ? availableSkills.map(skill => <label key={skill.id}><input type="checkbox" checked={skillIds.includes(skill.id)} onChange={event => setSkillIds(event.target.checked ? [...skillIds, skill.id] : skillIds.filter(id => id !== skill.id))} /><Layers size={13} />{skill.name}</label>) : <span>暂无已保存能力，可从“＋”选择创建 Skill。</span>}</div>}
    {error && <p className="aw-form-error">{error}</p>}
    <div className="aw-prompt-suggestions">{[['优化现有页面', '检查布局层级并统一交互细节'], ['开发新功能', '从需求开始规划并完成实现'], ['排查项目问题', '分析报错并给出修复方案']].map(([title, description]) => <button key={title} onClick={() => setPrompt(`${title}：${description}`)}><strong>{title}</strong><small>{description}</small></button>)}</div>
  </div>
    {resourceDialog && <TaskDeviceDialog state={state} update={update} resourceType={resourceDialog === 'all' ? undefined : resourceDialog} initialParkResourceId={initialParkResourceId} systemId={fixedSystem?.id} close={() => setResourceDialog(null)} onSelected={() => { setResourceDialog(null); textareaRef.current?.focus(); }} notify={notify} draftSelection={draftSelection} />}
    {createProjectOpen && <NewProjectDialog close={() => setCreateProjectOpen(false)} create={name => {
      setCreateProjectOpen(false);
      update(next => {
        const group = createProjectWorkspace(next, name);
        selectChatTaskContext(next, group.project, deviceId, group.id);
        group.composerDraft = { ...draft, project: group.project, deviceId };
      });
      onCreated();
    }} />}
  </div>;
}

function MenuDismiss({ close }: { close: () => void }) { return <button className="aw-composer-menu-dismiss" aria-label="关闭选择菜单" onClick={close} />; }


function ProjectMenu({ state, selected, choose, create }: { state: WorkbenchState; selected: Project | null; choose: (project: Project | null) => void; create: () => void }) {
  const [query, setQuery] = useState('');
  const all = [...(state.projects || []), ...state.workspaces.flatMap(item => item.project ? [item.project] : [])];
  const projects = all.filter((item, index) => all.findIndex(other => other.id === item.id) === index && item.name.toLowerCase().includes(query.toLowerCase()));
  return <div className="aw-context-menu" role="dialog" aria-label="选择项目">
    <label className="aw-context-search"><Search size={17} /><input autoFocus aria-label="搜索项目" placeholder="搜索项目" value={query} onChange={event => setQuery(event.target.value)} /></label>
    <div className="aw-context-menu-label">最近使用</div>
    <div className="aw-context-options">{projects.map(item => <button key={item.id} className={item.id === selected?.id ? 'is-selected' : ''} onClick={() => choose(item)}><Folder size={18} /><span>{item.name}</span>{item.id === selected?.id && <Check size={16} />}</button>)}{!projects.length && <p className="aw-context-empty">{query ? '没有找到项目' : '暂无最近项目'}</p>}</div>
    <div className="aw-context-section"><button onClick={create}><FolderPlus size={18} /><span>新建项目</span></button></div>
    <div className="aw-context-section"><button onClick={() => choose(null)}><FolderX size={18} /><span>无项目</span>{!selected && <Check size={16} />}</button></div>
  </div>;
}

export function NewProjectDialog({ close, create }: { close: () => void; create: (name: string) => void }) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [name, setName] = useState('');
  useEffect(() => {
    const dialog = dialogRef.current;
    dialog?.showModal();
    return () => dialog?.close();
  }, []);
  return <dialog ref={dialogRef} className="aw-modal aw-project-name-dialog" aria-labelledby="aw-new-project-title" onCancel={event => { event.preventDefault(); close(); }} onClick={event => { if (event.target === event.currentTarget) close(); }}>
    <div className="aw-modal-header"><h2 id="aw-new-project-title">新建项目</h2><button type="button" className="aw-icon-button" aria-label="关闭新建项目" onClick={close}><X size={16} /></button></div>
    <form onSubmit={event => { event.preventDefault(); if (name.trim()) create(name.trim()); }}>
      <div className="aw-modal-body aw-form"><label htmlFor="aw-new-project-name">项目名称<input id="aw-new-project-name" autoFocus autoComplete="off" value={name} onChange={event => setName(event.target.value)} placeholder="输入项目名称" maxLength={80} /></label></div>
      <div className="aw-modal-footer"><button type="button" className="aw-button" onClick={close}>取消</button><button type="submit" className="aw-button aw-primary" disabled={!name.trim()}>创建项目</button></div>
    </form>
  </dialog>;
}

function DeviceMenu({ state, selectedId, choose }: { state: WorkbenchState; selectedId: string; choose: (id: string) => void }) {
  const [query, setQuery] = useState('');
  const devices = state.devices.filter(item => `${item.name} ${item.address}`.toLowerCase().includes(query.toLowerCase()));
  return <div className="aw-context-menu" role="dialog" aria-label="选择设备"><label className="aw-context-search"><Search size={17} /><input autoFocus placeholder="搜索设备" aria-label="搜索设备" value={query} onChange={event => setQuery(event.target.value)} /></label><div className="aw-context-menu-label">可用设备</div><div className="aw-context-options">{devices.map(item => <button key={item.id} className={item.id === selectedId ? 'is-selected' : ''} onClick={() => choose(item.id)}><Cpu size={18} /><span>{item.name}<small>{item.address} · {item.connected ? '在线' : '离线'}</small></span>{item.id === selectedId && <Check size={16} />}</button>)}{!devices.length && <p className="aw-context-empty">没有找到设备</p>}</div><div className="aw-context-section"><button onClick={() => choose('')}><Cpu size={18} /><span>不选择设备</span>{!selectedId && <Check size={16} />}</button></div><p className="aw-context-footnote">每个任务最多关联一台设备，可在任务内更换或解除。</p></div>;
}
