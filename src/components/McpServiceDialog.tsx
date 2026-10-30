import { builtinSystemForService, isPlatformAdmin } from './agentBuiltinSystems';
import { useEffect, useRef, useState, type FormEvent, type ReactNode } from 'react';
import { X } from 'lucide-react';
import AgentBusinessCapabilities from './AgentBusinessCapabilities';
import { uid, type UpdateState, type WorkbenchState } from './agentWorkbenchState';

type ConnectionType = 'stdio' | 'HTTP';
const parseLines = (value: string) => value.split('\n').map(item => item.trim()).filter(Boolean);
const parseEnv = (value: string) => parseLines(value).map(line => { const index = line.indexOf('='); return { key: (index < 0 ? line : line.slice(0, index)).trim(), value: index < 0 ? '' : line.slice(index + 1).trim() }; }).filter(item => item.key);
const formatEnv = (items?: { key: string; value: string }[]) => items?.map(item => `${item.key}=${item.value}`).join('\n') || '';

function Dialog({ title, children, close }: { title: string; children: ReactNode; close: () => void }) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => { const element = ref.current; element?.showModal(); return () => element?.close(); }, []);
  return <dialog ref={ref} className="aw-modal aw-device-dialog" aria-label={title} onCancel={event => { event.preventDefault(); close(); }}><div className="aw-modal-header"><h2>{title}</h2><button className="aw-icon-button" aria-label={`关闭${title}`} onClick={close}><X size={16} /></button></div>{children}</dialog>;
}

export default function McpServiceDialog({ state, update, serviceId, close }: { state: WorkbenchState; update: UpdateState; serviceId: string | null; close: () => void }) {
  const existing = state.services.find(service => service.id === serviceId && !builtinSystemForService(service.id));
  const [transport, setTransport] = useState<ConnectionType>(existing?.transport === 'stdio' ? 'stdio' : 'HTTP');
  const [name, setName] = useState(existing?.name || '');
  const [endpoint, setEndpoint] = useState(existing?.endpoint || '');
  const [command, setCommand] = useState(existing?.command || '');
  const [args, setArgs] = useState(existing?.args?.join('\n') || '');
  const [env, setEnv] = useState(formatEnv(existing?.env));
  const [passEnv, setPassEnv] = useState(existing?.passEnv?.join('\n') || '');
  const [cwd, setCwd] = useState(existing?.cwd || '');
  const [resources, setResources] = useState(existing?.resources.join('\n') || '');
  const [capabilities, setCapabilities] = useState(existing?.capabilities || []);
  const [tools, setTools] = useState(existing?.tools || [{ id: 'read', name: '查询资源', write: false }, { id: 'write', name: '更新资源', write: true }]);
  const [error, setError] = useState('');
  const submit = (event: FormEvent) => {
    event.preventDefault();
    if (!isPlatformAdmin(state)) return;
    if (!name.trim() || !resources.trim()) { setError('请填写服务名称与至少一个业务资源。'); return; }
    if (transport === 'stdio' && !command.trim()) { setError('STDIO 连接需要填写启动命令。'); return; }
    if (transport === 'HTTP' && !endpoint.trim()) { setError('流式 HTTP 连接需要填写服务地址。'); return; }
    update(draft => {
      const current = draft.services.find(service => service.id === serviceId);
      const resourceList = [...new Set(resources.split('\n').map(value => value.trim()).filter(Boolean))];
      const nextTools = tools.map(tool => ({ ...tool }));
      const next = { transport, endpoint: transport === 'HTTP' ? endpoint.trim() : '', command: transport === 'stdio' ? command.trim() : undefined, args: transport === 'stdio' ? parseLines(args) : undefined, env: transport === 'stdio' ? parseEnv(env) : undefined, passEnv: transport === 'stdio' ? parseLines(passEnv) : undefined, cwd: transport === 'stdio' ? cwd.trim() || undefined : undefined };
      if (current) {
        current.name = name.trim(); current.resources = resourceList; current.tools = nextTools; current.capabilities = capabilities; Object.assign(current, next); current.connected = false;
        draft.grants.filter(grant => grant.serviceId === current.id).forEach(grant => { grant.revoked = true; });
      } else draft.services.push({ id: uid('mcp'), name: name.trim(), endpoint: next.endpoint, connected: false, ...next, resources: resourceList, tools: nextTools });
    });
    close();
  };
  if (!isPlatformAdmin(state) || (serviceId && builtinSystemForService(serviceId))) return null;
  return <Dialog title={existing ? '编辑 MCP' : '添加 MCP'} close={close}><form onSubmit={submit}><div className="aw-modal-body aw-form"><label>服务名称<input aria-label="MCP 服务名称" value={name} onChange={event => setName(event.target.value)} placeholder="输入服务名称" /></label><fieldset className="aw-mcp-capability-fieldset"><legend>连接类型</legend><div className="aw-segmented aw-mcp-transport-switch"><button type="button" className={transport === 'stdio' ? 'is-active' : ''} onClick={() => setTransport('stdio')}>STDIO</button><button type="button" className={transport === 'HTTP' ? 'is-active' : ''} onClick={() => setTransport('HTTP')}>流式 HTTP</button></div></fieldset>{transport === 'stdio' ? <><label>启动命令<input aria-label="MCP 启动命令" value={command} onChange={event => setCommand(event.target.value)} placeholder="例如：npx -y @modelcontextprotocol/server" /></label><label>启动参数<textarea aria-label="MCP 启动参数" rows={3} value={args} onChange={event => setArgs(event.target.value)} placeholder="每行一个参数" /></label><label>环境变量<textarea aria-label="MCP 环境变量" rows={3} value={env} onChange={event => setEnv(event.target.value)} placeholder="每行一个 KEY=VALUE" /></label><label>环境变量传递<textarea aria-label="MCP 环境变量传递" rows={2} value={passEnv} onChange={event => setPassEnv(event.target.value)} placeholder="每行一个环境变量名" /></label><label>工作目录<input aria-label="MCP 工作目录" value={cwd} onChange={event => setCwd(event.target.value)} placeholder="例如：~/code" /></label></> : <label>服务地址<input aria-label="MCP 服务地址" value={endpoint} onChange={event => setEndpoint(event.target.value)} placeholder="https://your-service/mcp" /></label>}<label>可授权业务资源<textarea aria-label="MCP 业务资源" rows={3} value={resources} onChange={event => setResources(event.target.value)} placeholder="每行一个业务资源" /></label><fieldset className="aw-mcp-capability-fieldset"><legend>工具能力</legend>{tools.map((tool, index) => <label className="aw-mcp-capability-switch" key={tool.id}><span><strong>{tool.name}</strong><small>{tool.write ? '可修改' : '只读'}</small></span><input type="checkbox" checked={tool.enabled !== false} onChange={event => setTools(current => current.map((item, itemIndex) => itemIndex === index ? { ...item, enabled: event.target.checked } : item))} /><span className={`aw-toggle ${tool.enabled !== false ? 'is-on' : ''}`} aria-hidden="true"><span /></span></label>)}</fieldset>{existing?.catalog && <AgentBusinessCapabilities catalog={existing.catalog} value={capabilities} change={setCapabilities} />}{error && <p className="aw-form-error" role="alert">{error}</p>}</div><div className="aw-modal-footer"><button className="aw-button" type="button" onClick={close}>取消</button><button className="aw-button aw-primary" type="submit">保存配置</button></div></form></Dialog>;
}
