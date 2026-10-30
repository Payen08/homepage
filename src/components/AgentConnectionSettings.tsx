import { isPlatformAdmin } from './agentBuiltinSystems';
import { useEffect, useState } from 'react';
import { Building2, Cpu, Pencil, Plug, Plus, Unplug } from 'lucide-react';
import { resourceConnectionBlockReason, resourceConnections, setResourceConnected, type ResourceConnection } from './agentResourceConnections';
import TiangongResourceDialog from './TiangongResourceDialog';
import type { UpdateState, WorkbenchState } from './agentWorkbenchState';

export default function AgentConnectionSettings({ state, update, editDevice, notify }: { state: WorkbenchState; update: UpdateState; editDevice: (id?: string) => void; notify: (text: string) => void }) {
  const admin = isPlatformAdmin(state);
  const [editingParkId, setEditingParkId] = useState<string | null>(null);
  const [, refreshStatus] = useState(0);
  // Park sessions may expire while this settings tab remains open.
  useEffect(() => { const timer = window.setInterval(() => refreshStatus(value => value + 1), 15000); return () => window.clearInterval(timer); }, []);
  const connections = resourceConnections(state);
  const toggleConnection = (resource: ResourceConnection) => {
    const connected = !resource.connected;
    const problem = resourceConnectionBlockReason(state, resource.type, resource.id, connected);
    if (problem) { notify(problem); return; }
    update(draft => { setResourceConnected(draft, resource.type, resource.id, connected); });
    notify(connected ? `已连接 ${resource.name}` : `已断联 ${resource.name}，关联和历史记录保留`);
  };
  return <div className="aw-connections-settings">
    {(['device', 'park'] as const).map(type => {
      const rows = connections.filter(resource => resource.type === type);
      const Icon = type === 'device' ? Cpu : Building2;
      return <section className="aw-settings-surface" key={type} aria-label={type === 'device' ? '设备连接' : '园区连接'}>
        <div className="aw-connections-heading"><h2>{type === 'device' ? '设备连接' : '园区连接'} <span className="aw-connections-count">{rows.length}</span></h2>{type === 'device' && admin && <button className="aw-button" onClick={() => editDevice()}><Plus size={14} />新增设备</button>}</div>
        <div className="aw-connection-device-list">{rows.map(resource => <div className="aw-connection-device-row" key={resource.id}>
          <span className="aw-management-row-icon"><Icon size={22} strokeWidth={1.6} /></span>
          <div><strong>{resource.name}</strong><p>{type === 'park' ? '内网连接：' : ''}{resource.address}</p><small>{resource.projectCount > 0 ? `${resource.projectCount} 个项目 · ` : ''}{resource.taskCount} 个聊天已关联</small></div>
          <span className={`aw-connection-status ${resource.connected ? 'is-online' : 'is-offline'}`} role="status"><i />{resource.connected ? '在线' : '离线'}</span>
          {admin && <button className="aw-button" aria-label={`编辑${type === 'device' ? '设备' : '园区'} ${resource.name}`} onClick={() => type === 'device' ? editDevice(resource.id) : setEditingParkId(resource.id)}><Pencil size={14} />编辑</button>}
          <button className={`aw-button aw-connection-action ${resource.connected ? 'is-disconnect' : 'is-connect'}`} aria-label={`${resource.connected ? '断联' : '连接'}${type === 'device' ? '设备' : '园区'} ${resource.name}`} onClick={() => toggleConnection(resource)}>{resource.connected ? <Unplug size={14} /> : <Plug size={14} />}{resource.connected ? '断联' : '连接'}</button>
        </div>)}{!rows.length && <div className="aw-management-inline-empty">{type === 'device' ? '暂无已添加或关联的设备' : '暂无已添加或关联的园区，关联后将在这里展示'}</div>}</div>
      </section>;
    })}
    <section className="aw-settings-surface"><h2>连接偏好</h2><div className="aw-setting-row"><div><strong>连接超时</strong><p>建立设备连接的最长等待时间。</p></div><label className="aw-connection-timeout"><select aria-label="连接超时" value={state.settings.connectionTimeout || 15} onChange={event => update(draft => { draft.settings.connectionTimeout = Number(event.target.value); })}>{[5, 10, 15, 30, 60].map(seconds => <option key={seconds} value={seconds}>{seconds} 秒</option>)}</select></label></div><div className="aw-setting-row"><div><strong>启动时自动连接</strong><p>启动时自动连接上次的设备。</p></div><button role="switch" aria-label="启动时自动连接" aria-checked={Boolean(state.settings.autoConnect)} className={`aw-toggle ${state.settings.autoConnect ? 'is-on' : ''}`} onClick={() => update(draft => { draft.settings.autoConnect = !draft.settings.autoConnect; })}><span /></button></div></section>
    {editingParkId && admin && <TiangongResourceDialog key={editingParkId} state={state} update={update} scope={{ kind: 'library' }} initialResourceId={editingParkId} intent="edit" close={() => setEditingParkId(null)} notify={notify} />}
  </div>;
}
