import assert from 'node:assert/strict';
import { test } from 'node:test';
import {
  acceptChange, addWorkspace, confirmTask, createProjectEntry, createProjectWorkspace, ensureTaskTerminal, initialState, isStandaloneChatSpace,
  continueTask, deleteTask, normalizeWorkbenchState, openTerminal, prepareNewTask, refreshChange, removeProjectEntry, restoreProjectEntry, runQueuedTaskStep, runTerminal, selectTaskContext, startTask, workspaceFiles,
  terminalBlockReason, type FileChange, type Project,
} from '../src/components/agentWorkbenchState';

const project: Project = { id: 'project-a', name: '项目 A', path: '/projects/a' };

test('内置三项设备系统能力，恢复旧数据时补充且保留配置、启停与授权', () => {
  const state = initialState();
  for (const name of ['百川轻搭', '数字造机', '百川装机']) {
    const service = state.services.find(service => service.name === name)!;
    assert.ok(service.builtin);
    assert.equal(service.connected, true);
    assert.equal(service.mode, 'demo');
    assert.equal(service.endpoint, '');
  }
  state.services = state.services.filter(service => !service.builtin);
  normalizeWorkbenchState(state);
  const service = state.services.find(service => service.name === '百川轻搭')!;
  service.endpoint = 'https://configured.invalid/mcp';
  service.tools[0].enabled = false;
  normalizeWorkbenchState(state);
  assert.equal(state.services.filter(item => item.id === service.id).length, 1);
  assert.equal(service.endpoint, 'https://configured.invalid/mcp');
  assert.equal(service.tools[0].enabled, false);
});

test('删除运行中任务清理其操作、授权、差异和终端，保留同项目文件、Skill及其他任务', () => {
  const state = initialState();
  const group = createProjectWorkspace(state, '删除回归项目');
  const other = startTask(state, { workspaceId: group.id, kind: 'project', prompt: '你好' })!;
  const task = startTask(state, { workspaceId: group.id, kind: 'project', prompt: '开发设置页面' })!;
  runQueuedTaskStep(state, task.id);
  const terminal = ensureTaskTerminal(state, group.id, task.id)!;
  state.skills.push({ id: 'saved-skill', workspaceId: group.id, sourceTaskId: task.id, name: '已保存 Skill', description: '', content: '保留', status: 'draft', updatedAt: '', tests: [] });
  state.grants.push({ id: 'deleted-grant', workspaceId: group.id, taskId: task.id, serviceId: 'mcp-orders', resource: '工单 / WO-2026-001', read: true, write: true, revoked: false });
  const files = JSON.stringify(state.files);
  const otherSnapshot = JSON.stringify(other);
  assert.equal(deleteTask(state, task.id), true);
  assert.equal(group.activeTaskId, null);
  assert.equal(group.panel.terminalId, null);
  assert.equal(state.tasks.some(item => item.id === task.id), false);
  assert.equal(state.calls.some(item => item.taskId === task.id), false);
  assert.equal(state.grants.some(item => item.taskId === task.id), false);
  assert.equal(state.changes.some(item => item.taskId === task.id), false);
  assert.equal(state.terminals.some(item => item.id === terminal.id), false);
  assert.equal(state.skills[0].sourceTaskId, null);
  assert.equal(JSON.stringify(state.files), files);
  assert.equal(JSON.stringify(other), otherSnapshot);
  const after = JSON.stringify(state);
  runQueuedTaskStep(state, task.id);
  continueTask(state, task.id, '继续');
  assert.equal(deleteTask(state, task.id), false);
  assert.equal(JSON.stringify(state), after);
});

test('删除其他项目的任务不切换当前项目，独立聊天也能直接删除', () => {
  const state = initialState();
  const first = createProjectWorkspace(state, '第一个项目');
  const task = startTask(state, { workspaceId: first.id, kind: 'project', prompt: '你好' })!;
  const current = createProjectWorkspace(state, '当前项目');
  deleteTask(state, task.id);
  assert.equal(state.activeWorkspaceId, current.id);
  const chat = selectTaskContext(state, null, '');
  const independent = startTask(state, { workspaceId: chat.id, kind: 'chat', prompt: '你好' })!;
  assert.equal(deleteTask(state, independent.id), true);
  assert.equal(chat.activeTaskId, null);
  assert.equal(isStandaloneChatSpace(chat), true);
});

test('项目创建时保存工程文件，开发修改对应工程文件而非独立 HTML 产物', () => {
  const state = initialState();
  const group = createProjectWorkspace(state, '工程项目');
  const paths = workspaceFiles(state, group.id).map(file => file.path);
  for (const path of ['.opencode/skills/plugin-sdk.md', 'src/App.tsx', 'src/main.tsx', 'src/components/Settings.tsx', 'src/index.css', 'AGENTS.md', 'package.json', 'plugin.json']) assert.ok(paths.includes(path));
  assert.equal(state.tasks.length, 0);
  assert.equal(state.calls.length, 0);
  const task = startTask(state, { workspaceId: group.id, prompt: '开发设置页面', kind: 'project' })!;
  const calls = state.calls.filter(call => call.taskId === task.id);
  assert.ok(calls.every(call => paths.includes(call.filePath!)));
  assert.ok(calls.some(call => call.filePath === 'src/components/Settings.tsx'));
});

test('后续开发只提交有变化的工程文件，不重复提交已存在的样式', () => {
  const state = initialState();
  const group = createProjectWorkspace(state, '工程项目');
  const first = startTask(state, { workspaceId: group.id, prompt: '开发设置页面', kind: 'project' })!;
  for (const call of state.calls.filter(call => call.taskId === first.id)) {
    const file = state.files.find(file => file.workspaceId === group.id && file.path === call.filePath)!;
    file.content = call.content!;
  }
  const next = startTask(state, { workspaceId: group.id, prompt: '优化设置页面的提示内容', kind: 'project' })!;
  const changes = state.calls.filter(call => call.taskId === next.id);
  assert.equal(changes.length, 1);
  assert.equal(changes[0].filePath, 'src/components/Settings.tsx');
  const unchanged = startTask(state, { workspaceId: group.id, prompt: '开发设置页面', kind: 'project' })!;
  assert.equal(state.calls.filter(call => call.taskId === unchanged.id).length, 0);
  assert.equal(unchanged.status, 'completed');
});

test('文件树支持新增目录及文件、拒绝重名、删除和撤销，刷新不复活已删除内容', () => {
  const state = initialState();
  const group = createProjectWorkspace(state, '工程项目');
  assert.ok(createProjectEntry(state, group.id, 'src/utils', 'folder').folder);
  const file = createProjectEntry(state, group.id, 'src/utils/math.ts', 'file').file!;
  file.content = 'export const add = (a: number, b: number) => a + b;';
  assert.ok(createProjectEntry(state, group.id, file.path, 'file').error);
  const removed = removeProjectEntry(state, group.id, file.path, 'file')!;
  assert.ok(!workspaceFiles(state, group.id).some(item => item.id === file.id));
  normalizeWorkbenchState(state);
  assert.ok(!workspaceFiles(state, group.id).some(item => item.id === file.id));
  restoreProjectEntry(state, removed);
  assert.ok(workspaceFiles(state, group.id).some(item => item.id === file.id && item.content.includes('export const add')));
  const directory = removeProjectEntry(state, group.id, 'src/utils', 'folder')!;
  assert.ok(!workspaceFiles(state, group.id).some(item => item.path.startsWith('src/utils/')));
  restoreProjectEntry(state, directory);
  assert.ok(workspaceFiles(state, group.id).some(item => item.id === file.id));
});

test('删除已提议修改的文件保留历史，撤销后要求重新审查', () => {
  const state = initialState();
  const group = createProjectWorkspace(state, '工程项目');
  const file = workspaceFiles(state, group.id).find(file => file.path === 'src/App.tsx')!;
  const change: FileChange = { id: 'proposal', workspaceId: group.id, taskId: 'task', fileId: file.id, deviceId: null, path: file.path, baseVersion: file.version, before: file.content, after: 'new content', status: 'pending' };
  state.changes.push(change);
  const removed = removeProjectEntry(state, group.id, file.path, 'file')!;
  assert.equal(change.status, 'rejected');
  assert.equal(state.changes.length, 1);
  restoreProjectEntry(state, removed);
  assert.equal(change.status, 'conflict');
  acceptChange(state, change.id);
  assert.notEqual(file.content, change.after);
});

test('111 和 222 打开各自终端并复用自己的会话，保留原会话目录和输出', () => {
  const state = initialState();
  const group = createProjectWorkspace(state, '项目 111');
  const first = startTask(state, { workspaceId: group.id, prompt: '111', kind: 'project' })!;
  const terminal111 = ensureTaskTerminal(state, group.id, first.id)!;
  runTerminal(state, terminal111.id, first.id, 'echo session-111');
  runTerminal(state, terminal111.id, first.id, 'cd /projects/custom');
  const firstSnapshot = JSON.stringify(terminal111);
  const second = startTask(state, { workspaceId: group.id, prompt: '222', kind: 'project' })!;
  const terminal222 = ensureTaskTerminal(state, group.id, second.id)!;
  assert.notEqual(terminal111.id, terminal222.id);
  assert.equal(terminal222.originTaskId, second.id);
  assert.ok(!terminal222.lines.some(line => line.includes('session-111')));
  assert.equal(JSON.stringify(terminal111), firstSnapshot);
  assert.ok(terminalBlockReason(state, terminal111, second));
  assert.equal(ensureTaskTerminal(state, group.id, first.id)?.id, terminal111.id);
  assert.equal(terminal111.cwd, '/projects/custom');
  assert.equal(ensureTaskTerminal(state, group.id, second.id)?.id, terminal222.id);
});

test('终端不能被错误地创建到另一个项目中', () => {
  const state = initialState();
  const first = createProjectWorkspace(state, '项目一');
  const task = startTask(state, { workspaceId: first.id, prompt: '111', kind: 'project' })!;
  const second = createProjectWorkspace(state, '项目二');
  assert.equal(ensureTaskTerminal(state, second.id, task.id), null);
  assert.equal(state.terminals.length, 0);
});

test('项目组内新建聊天保留项目、清空旧草稿，问候后仍可继续开发', () => {
  const state = initialState();
  const group = createProjectWorkspace(state, '项目组');
  const first = startTask(state, { workspaceId: group.id, prompt: '你好', kind: 'project' })!;
  const terminal = openTerminal(state, group.id, first.id)!;
  group.composerDraft = { prompt: '不应带入新聊天的草稿', project: group.project, kind: 'general', deviceId: 'rdk-x3', model: state.settings.model, serviceId: '', resource: '', allowWrite: false, skillIds: [] };
  prepareNewTask(state, group.id);
  assert.equal(state.activeWorkspaceId, group.id);
  assert.equal(group.activeTaskId, null);
  assert.equal(group.composerDraft.prompt, '');
  assert.equal(group.composerDraft.project?.id, group.project?.id);
  assert.equal(group.composerDraft.deviceId, '');
  assert.equal(group.panel.open, false);
  assert.equal(group.panel.terminalId, terminal.id);
  const chat = startTask(state, { workspaceId: group.id, prompt: '222', kind: 'project' })!;
  assert.equal(chat.workspaceId, group.id);
  assert.equal(state.calls.filter(call => call.taskId === chat.id).length, 0);
  assert.equal(group.panel.open, false);
  continueTask(state, chat.id, '开发设置页面');
  assert.ok(state.calls.some(call => call.taskId === chat.id && call.kind === 'file-proposal'));
  assert.equal(group.panel.terminalId, terminal.id);
});

test('明确新建独立聊天时不继承项目组，项目内的历史保留', () => {
  const state = initialState();
  const group = createProjectWorkspace(state, '项目组');
  const task = startTask(state, { workspaceId: group.id, prompt: '你好', kind: 'project' })!;
  prepareNewTask(state);
  assert.equal(state.activeWorkspaceId, null);
  const standalone = selectTaskContext(state, null, '');
  assert.notEqual(standalone.id, group.id);
  assert.equal(isStandaloneChatSpace(standalone), true);
  assert.equal(task.workspaceId, group.id);
  assert.equal(group.project?.name, '项目组');
});

test('统一创建入口同时保存项目、绑定项目组、选中输入上下文，开发需求生成代码步骤', () => {
  const state = initialState();
  const group = createProjectWorkspace(state, '111');
  assert.equal(group.name, '111');
  assert.equal(group.project?.name, '111');
  assert.equal(state.activeWorkspaceId, group.id);
  assert.equal(state.projects?.[0].id, group.project?.id);
  assert.equal(group.composerDraft?.project?.id, group.project?.id);
  assert.equal(group.activeTaskId, null);
  assert.equal(group.panel.open, false);
  assert.equal(group.panel.tab, 'changes');
  const task = startTask(state, { workspaceId: group.id, prompt: '开发设置页面', kind: 'project' })!;
  assert.equal(task.workspaceId, group.id);
  assert.ok(state.calls.some(call => call.taskId === task.id && call.kind === 'file-proposal'));
});

test('旧侧栏入口创建的空项目组会恢复同名项目和输入栏绑定', () => {
  const state = initialState();
  const group = addWorkspace(state, { name: '111', projectName: '', projectPath: '', deviceIds: [], mcpIds: [] });
  group.composerDraft = { prompt: '开发设置页面', project: null, kind: 'general', deviceId: '', model: state.settings.model, serviceId: '', resource: '', allowWrite: false, skillIds: [] };
  normalizeWorkbenchState(state);
  assert.equal(group.project?.name, '111');
  assert.equal(group.composerDraft.project?.id, group.project?.id);
  assert.equal(state.projects?.filter(project => project.id === group.project?.id).length, 1);
  assert.equal(state.activeWorkspaceId, group.id);
  const snapshot = JSON.stringify(state);
  normalizeWorkbenchState(state);
  assert.equal(JSON.stringify(state), snapshot);
});

test('普通聊天独立保存，选项目立即创建空项目组且不污染聊天上下文', () => {
  const state = initialState();
  const chat = selectTaskContext(state, null, '');
  const task = startTask(state, { workspaceId: chat.id, prompt: '你好', kind: 'chat' })!;
  const group = selectTaskContext(state, project, '', chat.id);
  assert.notEqual(group.id, chat.id);
  assert.equal(isStandaloneChatSpace(chat), true);
  assert.equal(chat.project, null);
  assert.equal(task.workspaceId, chat.id);
  assert.equal(group.name, project.name);
  assert.equal(group.activeTaskId, null);
  assert.equal(group.panel.open, false);
  assert.equal(state.tasks.filter(item => item.workspaceId === group.id).length, 0);
  assert.equal(selectTaskContext(state, project, '').id, group.id);
  assert.equal(selectTaskContext(state, null, '', group.id).id, chat.id);
  assert.equal(state.calls.length, 0);
  assert.equal(state.changes.length, 0);
});

test('切换项目不改名、不合并，也不会把普通问候生成为文件', () => {
  const state = initialState();
  const a = selectTaskContext(state, project, '');
  const b = selectTaskContext(state, { ...project, id: 'project-b', name: '项目 B' }, '', a.id);
  assert.notEqual(a.id, b.id);
  assert.equal(a.project?.name, '项目 A');
  const task = startTask(state, { workspaceId: b.id, prompt: '你好', kind: 'project' })!;
  assert.equal(task.status, 'completed');
  assert.equal(state.changes.length, 0);
  assert.equal(state.calls.length, 0);
  assert.equal(b.panel.open, false);
});

test('旧聊天组挂项目的数据修复保留历史、当前任务且可重复加载', () => {
  const state = initialState();
  const legacy = selectTaskContext(state, null, '');
  const chat = startTask(state, { workspaceId: legacy.id, prompt: '你好', kind: 'chat' })!;
  legacy.project = project;
  legacy.isWorkgroup = true;
  const development = startTask(state, { workspaceId: legacy.id, prompt: '优化页面', kind: 'project' })!;
  legacy.activeTaskId = chat.id;
  const originalMessages = JSON.stringify(chat.messages);
  normalizeWorkbenchState(state);
  assert.equal(legacy.name, '项目 A');
  assert.equal(legacy.isChatSpace, false);
  assert.equal(development.workspaceId, legacy.id);
  assert.notEqual(chat.workspaceId, legacy.id);
  assert.equal(state.activeWorkspaceId, chat.workspaceId);
  assert.equal(state.workspaces.find(item => item.id === chat.workspaceId)?.activeTaskId, chat.id);
  assert.equal(JSON.stringify(chat.messages), originalMessages);
  const normalized = JSON.stringify(state);
  normalizeWorkbenchState(state);
  assert.equal(JSON.stringify(state), normalized);
});

test('已创建但没发任务的项目在恢复时仍有项目组，显式空项目组不变成聊天组', () => {
  const state = initialState();
  state.projects = [project];
  normalizeWorkbenchState(state);
  assert.equal(state.activeWorkspaceId, null);
  assert.equal(state.workspaces.filter(item => item.project?.id === project.id).length, 1);
  const custom = addWorkspace(state, { name: '调试组', projectName: '', projectPath: '', deviceIds: [], mcpIds: [] });
  assert.equal(selectTaskContext(state, null, '', custom.id).id, custom.id);
  assert.equal(isStandaloneChatSpace(custom), false);
});

test('两台设备的任务分别绑定，切换任务不篡改终端设备、目录和输出', () => {
  const state = initialState();
  const group = selectTaskContext(state, project, 'rdk-x3');
  const x3 = startTask(state, { workspaceId: group.id, prompt: '检查设备状态', kind: 'device', deviceId: 'rdk-x3' })!;
  const terminal = openTerminal(state, group.id, x3.id)!;
  const snapshot = JSON.stringify(terminal);
  selectTaskContext(state, project, 'rdk-x5', group.id);
  const x5 = startTask(state, { workspaceId: group.id, prompt: '检查设备状态', kind: 'device', deviceId: 'rdk-x5' })!;
  assert.equal(x3.deviceId, 'rdk-x3');
  assert.equal(x5.deviceId, 'rdk-x5');
  assert.equal(JSON.stringify(terminal), snapshot);
  assert.equal(group.panel.terminalId, terminal.id);
  assert.equal(group.panel.tab, 'terminal');
  assert.ok(terminalBlockReason(state, terminal, x5));
});

test('文件冲突需重新审查，结果确认不重复执行已完成工具', () => {
  const state = initialState();
  const group = selectTaskContext(state, project, '');
  const task = startTask(state, { workspaceId: group.id, prompt: '修改页面', kind: 'project' })!;
  state.calls.filter(call => call.taskId === task.id).forEach(call => { call.status = 'done'; call.executions = 1; });
  task.status = 'review';
  state.files.push({ id: 'f', workspaceId: group.id, deviceId: null, path: 'index.html', content: '用户修改', version: 2, updatedAt: '' });
  const change: FileChange = { id: 'c', workspaceId: group.id, taskId: task.id, fileId: 'f', deviceId: null, path: 'index.html', before: '旧版本', after: 'Agent 修改', baseVersion: 1, status: 'pending' };
  state.changes.push(change);
  acceptChange(state, change.id);
  assert.equal(change.status, 'conflict');
  assert.equal(state.files.find(file => file.id === 'f')!.content, '用户修改');
  confirmTask(state, task.id);
  assert.equal(task.status, 'review');
  refreshChange(state, change.id);
  assert.equal(change.before, '用户修改');
  acceptChange(state, change.id);
  assert.equal(state.files.find(file => file.id === 'f')!.version, 3);
  const executions = state.calls.map(call => call.executions);
  confirmTask(state, task.id);
  confirmTask(state, task.id);
  assert.equal(task.status, 'completed');
  assert.deepEqual(state.calls.map(call => call.executions), executions);
});

test('自建项目可用设备不自动成为资源，新聊天保持未绑定且互不影响', async () => {
  const { associateTaskDevice } = await import('../src/components/agentDeviceConnections');
  const { projectChatResources } = await import('../src/components/agentChatResources');
  const state = initialState(); const group = createProjectWorkspace(state, '资源隔离项目');
  group.deviceIds = ['rdk-x3', 'rdk-x5'];
  const first = startTask(state, { workspaceId: group.id, kind: 'project', prompt: '你好' })!;
  const second = startTask(state, { workspaceId: group.id, kind: 'project', prompt: '讨论方案' })!;
  assert.equal(first.deviceId, null); assert.equal(second.deviceId, null);
  assert.equal(projectChatResources(state, group).locked, false);
  assert.equal(associateTaskDevice(state, first.id, 'rdk-x3'), '');
  assert.equal(second.deviceId, null); assert.deepEqual(second.tiangongLinks, []);
  prepareNewTask(state, group.id);
  assert.equal(group.composerDraft!.deviceId, '');
  assert.equal(group.panel.open, false);
  assert.equal(associateTaskDevice(state, first.id, null), '');
  assert.equal(second.deviceId, null);
});

test('项目组绑定设备后聊天只读继承，更换或解绑从项目生效且终端会话保持原环境', async () => {
  const { setProjectDevice } = await import('../src/components/agentWorkbenchState');
  const { associateTaskDevice } = await import('../src/components/agentDeviceConnections');
  const { setTiangongScopeLinks } = await import('../src/components/agentTiangongResources');
  const state = initialState(); const group = createProjectWorkspace(state, '共享设备项目');
  state.devices[0].connected = true;
  assert.equal(setProjectDevice(state, group.id, 'rdk-x3'), '');
  const task = startTask(state, { workspaceId: group.id, kind: 'project', prompt: '查询设备运行状态' })!;
  assert.equal(task.deviceId, 'rdk-x3'); assert.equal(task.inheritsProjectResources, true);
  const terminal = openTerminal(state, group.id, task.id)!;
  const before = JSON.stringify(state);
  assert.match(associateTaskDevice(state, task.id, 'rdk-x5'), /继承自项目组/);
  assert.match(setTiangongScopeLinks(state, { kind: 'task', workspaceId: group.id, taskId: task.id }, []), /继承自项目组/);
  assert.equal(JSON.stringify(state), before);
  assert.equal(setProjectDevice(state, group.id, 'rdk-x5'), '');
  assert.equal(task.deviceId, 'rdk-x5');
  assert.equal(terminal.deviceId, 'rdk-x3');
  assert.ok(state.calls.filter(call => call.taskId === task.id).every(call => call.executions === 0 && call.status === 'denied'));
  prepareNewTask(state, group.id);
  assert.equal(group.composerDraft!.deviceId, 'rdk-x5'); assert.equal(group.panel.open, false);
  assert.equal(setProjectDevice(state, group.id, null), '');
  assert.equal(task.deviceId, null); assert.equal(task.inheritsProjectResources, false);
  assert.equal(associateTaskDevice(state, task.id, 'rdk-x3'), '');
});

test('普通聊天绑定设备仍属于聊天，新开聊天不继承前一聊天的设备', async () => {
  const { selectChatTaskContext } = await import('../src/components/agentWorkbenchState');
  const state = initialState();
  const context = selectChatTaskContext(state, null, 'rdk-x3');
  assert.equal(isStandaloneChatSpace(context), true);
  const first = startTask(state, { workspaceId: context.id, kind: 'chat', deviceId: 'rdk-x3', prompt: '你好' })!;
  assert.equal(first.deviceId, 'rdk-x3');
  prepareNewTask(state, context.id);
  assert.equal(context.composerDraft!.deviceId, '');
  const second = startTask(state, { workspaceId: context.id, kind: 'chat', prompt: '直接聊聊' })!;
  assert.equal(second.deviceId, null); assert.deepEqual(second.tiangongLinks, []);
  assert.equal(first.deviceId, 'rdk-x3');
  const restored = normalizeWorkbenchState(JSON.parse(JSON.stringify(state)));
  assert.equal(isStandaloneChatSpace(restored.workspaces.find(item => item.id === context.id)!), true);
  assert.equal(restored.tasks.find(item => item.id === second.id)!.deviceId, null);
});
