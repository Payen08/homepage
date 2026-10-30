import { currentChatConnection } from './agentChatResources';
import type { AgentTask, WorkbenchState, Workspace } from './agentWorkbenchState';

export default function AgentChatConnection({ state, workspace, task, manage }: {
  state: WorkbenchState; workspace?: Workspace; task?: AgentTask; manage?: () => void;
}) {
  const connection = currentChatConnection(state, workspace, task);
  if (!connection) return null;
  const label = `已关联${connection.type === 'device' ? '设备' : '园区'}：${connection.name}`;
  const title = `${connection.address} · ${connection.status}${connection.locked ? ' · 继承自项目组' : ''}`;
  return !connection.locked && manage
    ? <button type="button" className="aw-chat-connection" aria-label={label} title={title} onClick={manage}>{connection.name}</button>
    : <span className="aw-chat-connection" aria-label={label} title={title}>{connection.name}</span>;
}
