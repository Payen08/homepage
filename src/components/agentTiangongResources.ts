import { builtinSystemBlockReason, builtinSystemForService } from './agentBuiltinSystems';
import { projectChatResources, workspaceChatResourceType } from './agentChatResources';
import { uid, now, syncProjectChatResources, syncTaskResourceSystem, type AgentTask, type ToolCall, type WorkbenchState } from './agentWorkbenchState';

export type TiangongLink = { resourceId: string; read: boolean; write: boolean; enabled?: boolean };
export type TiangongSiteResource = { id: string; url: string; parkId: string; parkName: string; account: string; mode: 'prototype' | 'remote'; sessionRef?: string; credentialRef?: string; verifiedAt?: string; permissions?: { read: boolean; write: boolean }; createdAt: string };
export type TiangongPark = { id: string; name: string; read: boolean; write: boolean };
export type TiangongSession = { id: string; url: string; account: string; parks: TiangongPark[]; expiresAt: number; mode: 'prototype'; resourceOnly?: boolean };
export type TiangongScope = { kind: 'library' } | { kind: 'project'; workspaceId: string } | { kind: 'task'; workspaceId: string; taskId: string };
export type TiangongBrowserChange = { before: string; after: string; baseVersion: number; reviewed: boolean };
export type TiangongParkRecord = { resourceId: string; version: number; note: string; pendingOrders: number; devicesOnline: number };
const sessions = new Map<string, TiangongSession>();

export function normalizeTiangongUrl(value: string) {
  try {
    const url = new URL(value.trim());
    if (!['http:', 'https:'].includes(url.protocol) || url.username || url.password || url.search) return null;
    url.hash = ''; url.pathname = url.pathname.replace(/\/+$/, '') || '/';
    return url.toString().replace(/\/$/, '');
  } catch { return null; }
}
export function resumeTiangongSession(url: string, account?: string) {
  const canonical = normalizeTiangongUrl(url);
  const session = [...sessions.values()].reverse().find(session => !session.resourceOnly && session.url === canonical && (!account || session.account === account.trim()) && session.expiresAt > Date.now());
  return session ? structuredClone(session) : null;
}
// Explicit prototype login. No network request, password storage or real identity claim.
export async function verifyTiangongPrototype(url: string, account: string, password: string): Promise<{ session?: TiangongSession; error?: string }> {
  const canonical = normalizeTiangongUrl(url);
  if (!canonical) return { error: '请输入完整的 HTTP / HTTPS 系统入口，不包含账号、令牌或查询参数。' };
  if (!account.trim() || !password) return { error: '请输入账号和密码。' };
  if (!['demo', 'viewer'].includes(account.trim()) || password !== 'demo123') return { error: '账号或密码不正确，请重新输入。' };
  const reusable = resumeTiangongSession(canonical, account);
  if (reusable) return { session: reusable };
  const session: TiangongSession = { id: uid('tiangong-session'), url: canonical, account: account.trim(), mode: 'prototype', expiresAt: Date.now() + 30 * 60 * 1000,
    parks: [{ id: 'park-east', name: '示例 · 华东智造园区', read: true, write: account.trim() === 'demo' }, { id: 'park-south', name: '示例 · 华南物流园区', read: true, write: false }, ...(account.trim() === 'demo' ? [{ id: 'park-lab', name: '示例 · 研发试验园区', read: true, write: true }] : [])] };
  sessions.set(session.id, session);
  return { session: structuredClone(session) };
}
export function tiangongResourceAccess(resource: TiangongSiteResource) {
  const session = sessions.get(resource.sessionRef || '');
  return session && session.url === resource.url && session.account === resource.account && session.expiresAt > Date.now() ? session.parks.find(park => park.id === resource.parkId) : undefined;
}
export function tiangongResourceStatus(resource: TiangongSiteResource) {
  return resource.mode === 'remote' ? '服务待接入' : tiangongResourceAccess(resource) ? '已验证 · 示例会话有效' : resource.verifiedAt ? '已验证 · 会话需更新' : '尚未验证';
}
export function saveTiangongResource(state: WorkbenchState, input: { sessionRef: string; url: string; parkId: string; proposedId?: string; editingId?: string }) {
  const session = sessions.get(input.sessionRef);
  if (!session || session.expiresAt <= Date.now() || normalizeTiangongUrl(input.url) !== session.url) return { error: '登录验证已失效或 URL 已更改，请重新验证。' };
  const park = session.parks.find(park => park.id === input.parkId && park.read);
  if (!park) return { error: '当前账号没有此园区的访问权限，请从授权园区列表中选择。' };
  const resources = state.tiangongResources ||= [];
  const matching = resources.find(resource => resource.url === session.url && resource.parkId === park.id);
  let resource = input.editingId ? resources.find(resource => resource.id === input.editingId) : matching;
  if (input.editingId && !resource) return { error: '园区资源不存在，请重新打开编辑。' };
  if (input.editingId && matching && matching.id !== input.editingId) return { error: '该连接与园区已存在，请使用已有资源。' };
  if (!resource) {
    if (input.proposedId && resources.some(resource => resource.id === input.proposedId)) return { error: '资源标识已存在，请重新添加。' };
    resource = { id: input.proposedId || uid('tiangong-resource'), url: session.url, parkId: park.id, parkName: park.name, account: session.account, mode: 'prototype', createdAt: now() }; resources.push(resource);
  }
  if (resource.sessionRef && (resource.url !== session.url || resource.account !== session.account || resource.parkId !== park.id || resource.sessionRef !== session.id)) disconnectTiangongResource(state, resource.id);
  resource.url = session.url; resource.parkId = park.id; resource.parkName = park.name;
  resource.account = session.account; resource.sessionRef = session.id; resource.verifiedAt = now(); resource.permissions = { read: park.read, write: park.write };
  state.tiangongParkRecords ||= [];
  if (!state.tiangongParkRecords.some(record => record.resourceId === resource!.id)) state.tiangongParkRecords.push({ resourceId: resource.id, version: 1, note: '待处理', pendingOrders: 6, devicesOnline: 12 });
  return { resource };
}
export function effectiveTiangongLinks(state: WorkbenchState, workspaceId?: string, task?: Pick<AgentTask, 'tiangongLinks'> & Partial<Pick<AgentTask, 'tiangongTargetId'>>, overrides?: TiangongLink[]) {
  const workspace = state.workspaces.find(workspace => workspace.id === workspaceId);
  const projectLinks = workspace?.project ? workspace.tiangongLinks || [] : [];
  const inherited = projectChatResources(state, workspace);
  const candidates = inherited.locked ? inherited.links : task?.tiangongLinks !== undefined ? task.tiangongLinks : overrides !== undefined ? overrides : projectLinks;
  let links = [...new Map(candidates.map(link => [link.resourceId, link])).values()].filter(link => link.enabled !== false && link.read && state.tiangongResources?.some(resource => resource.id === link.resourceId));
  if (task || overrides) links = links.length <= 1 ? links : links.filter(link => link.resourceId === task?.tiangongTargetId);
  return links.map(link => {
    const resource = state.tiangongResources!.find(resource => resource.id === link.resourceId)!;
    return { ...link, write: Boolean(!builtinSystemBlockReason(state, 'tiangong', true) && tiangongResourceAccess(resource)?.write) };
  });
}
export function tiangongScopeLinks(state: WorkbenchState, scope: TiangongScope) {
  if (scope.kind === 'library') return [];
  const workspace = state.workspaces.find(workspace => workspace.id === scope.workspaceId);
  return scope.kind === 'project' ? workspace?.tiangongLinks || [] : effectiveTiangongLinks(state, scope.workspaceId, state.tasks.find(task => task.id === scope.taskId));
}
export function setTiangongScopeLinks(state: WorkbenchState, scope: TiangongScope, links: TiangongLink[], targetId?: string) {
  if (scope.kind === 'library') return '';
  const workspace = state.workspaces.find(workspace => workspace.id === scope.workspaceId && !workspace.archived);
  const task = scope.kind === 'task' ? state.tasks.find(task => task.id === scope.taskId && task.workspaceId === workspace?.id && !task.archived) : undefined;
  if (!workspace || (scope.kind === 'project' && !workspace.project) || (scope.kind === 'task' && !task)) return '关联目标不存在，请重新打开项目或任务。';
  const requested = [...new Map(links.filter(link => link.enabled !== false && link.read).map(link => [link.resourceId, link])).values()];
  if (requested.length && workspaceChatResourceType(workspace) === 'device') return '当前系统只支持关联设备，不能关联园区。';
  if (task && requested.length > 1) return '每个任务最多关联一个园区，请先更换或解除当前关联。';
  if (task && projectChatResources(state, workspace).locked) return '资源继承自项目组，请在项目组中修改关联。';
  if (scope.kind === 'project' && requested.length > 1) return '项目组最多关联一个园区，聊天将自动继承。';
  const existing = task ? effectiveTiangongLinks(state, workspace.id, task) : workspace.tiangongLinks || [];
  if (requested.some(link => !state.tiangongResources?.some(resource => resource.id === link.resourceId))) return '园区资源不存在，请重新验证账号。';
  if (requested.some(link => {
    const resource = state.tiangongResources!.find(resource => resource.id === link.resourceId)!;
    return !tiangongResourceAccess(resource) && (!resource.verifiedAt || !existing.some(item => item.resourceId === link.resourceId));
  })) return '请先验证园区账号，验证成功后才能关联。';
  const normalized = requested.map(link => {
    const resource = state.tiangongResources!.find(resource => resource.id === link.resourceId)!;
    return { ...link, write: Boolean(!builtinSystemBlockReason(state, 'tiangong', true) && tiangongResourceAccess(resource)?.write) };
  });
  if (task) {
    // Each task keeps its own single selection, independent of later project changes.
    task.tiangongLinks = normalized;
    if (normalized.length) task.deviceId = null;
    syncTaskResourceSystem(state, task.id);
    task.tiangongTargetId = normalized.some(link => link.resourceId === targetId) ? targetId : normalized.length === 1 ? normalized[0].resourceId : undefined;
  } else { workspace.tiangongLinks = normalized; if (normalized.length) workspace.boundDeviceId = undefined; syncProjectChatResources(state, workspace.id); }
  for (const call of state.calls.filter(call => call.tiangongResourceId && !call.executions && ['queued', 'pending', 'blocked'].includes(call.status))) {
    const owner = state.tasks.find(task => task.id === call.taskId);
    if (!owner || (task ? owner.id !== task.id : owner.workspaceId !== workspace.id)) continue;
    const permission = effectiveTiangongLinks(state, owner.workspaceId, owner).find(link => link.resourceId === call.tiangongResourceId);
    if (!permission || !permission.read || (call.kind === 'tiangong-write' && !permission.write) || (task && owner.tiangongTargetId !== call.tiangongResourceId)) {
      call.status = 'denied'; call.approved = false; call.output = '天工关联或授权已变更，本次未执行操作已取消。';
      if (['running', 'authorization'].includes(owner.status)) owner.status = 'stopped';
    }
  }
  return '';
}
export function normalizeTiangongAssociations(state: WorkbenchState) {
  for (const resource of state.tiangongResources || []) {
    // Earlier prototype versions issued session references only after verification.
    if (!resource.verifiedAt && resource.mode === 'prototype' && resource.sessionRef) resource.verifiedAt = resource.createdAt;
  }
  const verified = (link: TiangongLink) => state.tiangongResources?.some(resource => resource.id === link.resourceId && resource.verifiedAt);
  for (const workspace of state.workspaces) if (workspace.tiangongLinks) workspace.tiangongLinks = workspace.tiangongLinks.filter(verified);
  for (const task of state.tasks) {
    const workspace = state.workspaces.find(workspace => workspace.id === task.workspaceId);
    const candidates = (task.tiangongLinks ?? workspace?.tiangongLinks ?? []).filter(link => verified(link) && link.enabled !== false && link.read);
    const lastCall = [...state.calls].reverse().find(call => call.taskId === task.id && call.tiangongResourceId);
    const preferred = task.tiangongTargetId || lastCall?.tiangongResourceId || task.modelRequest?.tiangongTargetId;
    task.tiangongLinks = candidates.length <= 1 ? candidates : candidates.filter(link => link.resourceId === preferred).slice(0, 1);
    task.tiangongTargetId = task.tiangongLinks[0]?.resourceId;
    for (const call of state.calls.filter(call => call.taskId === task.id && call.tiangongResourceId && !call.executions && ['queued', 'pending', 'blocked'].includes(call.status))) {
      if (call.tiangongResourceId === task.tiangongTargetId) continue;
      call.status = 'denied'; call.approved = false; call.output = '任务园区关联已调整，本次旧园区操作已取消。';
      if (['running', 'authorization'].includes(task.status)) task.status = 'stopped';
    }
  }
}
export function disconnectTiangongResource(state: WorkbenchState, resourceId: string) {
  const resource = state.tiangongResources?.find(resource => resource.id === resourceId);
  if (!resource) return;
  resource.sessionRef = undefined;
  for (const call of state.calls.filter(call => call.tiangongResourceId === resourceId && !call.executions && ['queued', 'pending', 'blocked'].includes(call.status))) {
    if (call.tiangongChange) call.tiangongChange.reviewed = false;
    call.status = 'blocked'; call.approved = false; call.output = '天工资源已断开，请重新登录并重新审查操作。';
    const task = state.tasks.find(task => task.id === call.taskId); if (task) task.status = 'failed';
  }
}
// Reuse the saved, verified resource in the prototype adapter. Real resources require
// a credential-backed connector and must never be marked online by this adapter.
export function tiangongConnectionBlockReason(state: WorkbenchState, resourceId: string): string {
  const resource = state.tiangongResources?.find(resource => resource.id === resourceId);
  if (!resource) return '园区连接不存在。';
  if (tiangongResourceAccess(resource)) return '';
  if (resource.mode !== 'prototype') return '园区连接服务尚未配置。';
  if (!resource.verifiedAt || !resource.permissions?.read || !resource.account || !resource.parkId || normalizeTiangongUrl(resource.url) !== resource.url) return '此历史园区缺少已验证的连接资料，请重新添加园区关联。';
  return '';
}
export function connectTiangongResource(state: WorkbenchState, resourceId: string): string {
  const blocked = tiangongConnectionBlockReason(state, resourceId);
  if (blocked) return blocked;
  const resource = state.tiangongResources!.find(resource => resource.id === resourceId)!;
  if (tiangongResourceAccess(resource)) return '';
  const session: TiangongSession = {
    id: uid('tiangong-session'), url: resource.url, account: resource.account,
    mode: 'prototype', resourceOnly: true, expiresAt: Date.now() + 30 * 60 * 1000,
    parks: [{ id: resource.parkId, name: resource.parkName, read: true, write: resource.permissions!.write }],
  };
  sessions.set(session.id, session);
  resource.sessionRef = session.id;
  return '';
}
export const isTiangongRequest = (prompt: string) => /天工|园区|业务数据|运单|业务记录|这台车|车辆|里程|公里|执行.*任务|任务记录/.test(prompt);
export function taskTiangongTarget(state: WorkbenchState, task: Pick<AgentTask, 'workspaceId' | 'tiangongLinks' | 'tiangongTargetId'> & Partial<Pick<AgentTask, 'messages'>>) {
  const links = effectiveTiangongLinks(state, task.workspaceId, task);
  return state.tiangongResources?.find(resource => resource.id === links[0]?.resourceId);
}
export function tiangongCallBlockReason(state: WorkbenchState, call: ToolCall) {
  const systemBlock = builtinSystemBlockReason(state, 'tiangong', call.kind === 'tiangong-write');
  if (systemBlock) return systemBlock;
  const task = state.tasks.find(task => task.id === call.taskId);
  const resource = state.tiangongResources?.find(resource => resource.id === call.tiangongResourceId);
  if (!task || !resource) return '天工资源或任务不存在。';
  const target = taskTiangongTarget(state, task);
  const link = effectiveTiangongLinks(state, task.workspaceId, task).find(link => link.resourceId === resource.id);
  if (target?.id !== resource.id || !link?.read) return '当前任务没有此天工园区的访问权限，请调整关联配置。';
  if (resource.mode !== 'prototype') return '安全凭据服务与内网浏览器尚未接入，仅关联 URL 无法控制页面。';
  const access = tiangongResourceAccess(resource);
  if (!access || call.tiangongSessionRef !== resource.sessionRef) return '天工登录会话已失效或发生变化，请重新登录并重新提交操作。';
  if (call.kind === 'tiangong-write') {
    if (!access.write) return '当前天工账号对此园区仅有读取权限。';
    const change = call.tiangongChange;
    const record = state.tiangongParkRecords?.find(record => record.resourceId === resource.id);
    if (!change || !record) return '尚未生成业务差异，请重新提交修改需求。';
    if (record.version !== change.baseVersion || parkRecordContent(record) !== change.before) return '园区业务数据已更新，请重新提交并审查最新差异。';
    try { const next = JSON.parse(change.after); if (typeof next.note !== 'string' || next.note.length > 200 || next.pendingOrders !== record.pendingOrders || next.devicesOnline !== record.devicesOnline) return '本次示例操作仅允许更新业务记录状态，请重新生成差异。'; } catch { return '业务差异无效，请重新生成。'; }
    if (!change.reviewed && (call.status === 'pending' || call.approved)) return '请先审查本次园区差异，再确认修改。';
  }
  return '';
}
const parkRecordContent = (record: TiangongParkRecord) => JSON.stringify({ note: record.note, pendingOrders: record.pendingOrders, devicesOnline: record.devicesOnline }, null, 2);
export function prepareTiangongBrowserChange(state: WorkbenchState, call: ToolCall, prompt: string) {
  const record = state.tiangongParkRecords?.find(record => record.resourceId === call.tiangongResourceId);
  if (!record) return;
  call.tiangongChange = { before: parkRecordContent(record), after: JSON.stringify({ note: /完成|已处理/.test(prompt) ? '已处理' : '待复核', pendingOrders: record.pendingOrders, devicesOnline: record.devicesOnline }, null, 2), baseVersion: record.version, reviewed: false };
}
export function executeTiangongBrowserCall(state: WorkbenchState, call: ToolCall) {
  const blocked = tiangongCallBlockReason(state, call);
  if (blocked) throw new Error(blocked);
  if (call.kind === 'tiangong-write' && (!call.approved || call.executions > 0)) throw new Error('本次修改未确认或已经执行。');
  const resource = state.tiangongResources!.find(resource => resource.id === call.tiangongResourceId)!;
  const record = state.tiangongParkRecords?.find(record => record.resourceId === resource.id);
  if (call.kind === 'tiangong-write' && record && call.tiangongChange && call.approved && call.executions === 0) { record.note = JSON.parse(call.tiangongChange.after).note; record.version++; }
  return `[原型浏览器 · 未访问真实内网]\nURL：${resource.url}\n园区：${resource.parkName} (${resource.parkId})\n账号：${resource.account}\n${call.kind === 'tiangong-write' ? '已更新本次审查通过的示例业务记录。' : '示例园区业务数据：'}\n${record ? parkRecordContent(record) : '暂无示例数据'}`;
}
