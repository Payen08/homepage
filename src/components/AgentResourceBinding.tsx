import { useState } from 'react';
import { projectChatResources } from './agentChatResources';
import TaskDeviceDialog, { type DraftResourceSelection } from './TaskDeviceDialog';
import { effectiveTiangongLinks, type TiangongLink } from './agentTiangongResources';
import type { AgentTask, UpdateState, WorkbenchState } from './agentWorkbenchState';

type Props = { type: 'park' | 'device'; state: WorkbenchState; update: UpdateState; task?: AgentTask; deviceId?: string; links?: TiangongLink[]; draftSelection?: DraftResourceSelection; systemId?: 'tiangong' | 'baichuan-qingda' | 'digital-machine' | 'baichuan-zhuangji'; notify: (text: string) => void };
export default function AgentResourceBinding({ type, state, update, task, deviceId, links, draftSelection, notify, systemId }: Props) {
  const [open, setOpen] = useState(false);
  const parkLinks = links || (task ? effectiveTiangongLinks(state, task.workspaceId, task) : []);
  const park = state.tiangongResources?.find(resource => resource.id === parkLinks[0]?.resourceId);
  const device = state.devices.find(device => device.id === (deviceId || task?.deviceId));
  const label = type === 'park' ? '/关联园区' : '/关联设备';
  const workspace = state.workspaces.find(item => item.id === (task?.workspaceId || draftSelection?.workspaceId));
  const locked = Boolean(draftSelection?.readOnly || projectChatResources(state, workspace).locked);
  const selected = type === 'park' ? park : device;
  if (locked || (!draftSelection && (park || device)) || (type === 'park' && device) || (type === 'device' && park)) return null;
  const text = selected ? type === 'park' ? park!.parkName : device!.name : label;
  const pendingLabel = selected ? `待关联${type === 'park' ? '园区' : '设备'} ${text}` : label;
  return <>
    <button type="button" className="aw-resource-token" aria-label={pendingLabel} title={selected ? `${type === 'park' ? park!.url : device!.address} · 发送后关联` : label} onClick={() => setOpen(true)}>{text}</button>
    {open && <TaskDeviceDialog state={state} update={update} task={task} resourceType={type} readOnly={locked} systemId={systemId} draftSelection={draftSelection} onSelected={() => setOpen(false)} close={() => setOpen(false)} notify={notify} />}
  </>;
}
