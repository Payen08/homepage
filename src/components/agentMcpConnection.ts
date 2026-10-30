// Streamable HTTP connection verification only; business tool mapping is configured separately.
const tokens = new Map<string, string>();
export const mcpToken = (endpoint: string) => tokens.get(endpoint) || '';
export const rememberMcpToken = (endpoint: string, token: string) => { if (token.trim()) tokens.set(endpoint, token.trim()); else tokens.delete(endpoint); };
export async function testMcpEndpoint(endpoint: string, token: string, options: { fetcher?: typeof fetch; signal?: AbortSignal } = {}): Promise<{ ok: boolean; message: string; time?: string; toolCount?: number }> {
  try { const url = new URL(endpoint); if (!['http:', 'https:'].includes(url.protocol) || url.username || url.password || url.search || url.hash) throw new Error(); } catch { return { ok: false, message: '请填写有效的 MCP 服务地址。' }; }
  const controller = new AbortController();
  const cancel = () => controller.abort(); options.signal?.addEventListener('abort', cancel, { once: true });
  if (options.signal?.aborted) cancel();
  const timeout = setTimeout(cancel, 15000);
  let session = ''; let version = '2025-11-25'; let sequence = 0;
  const rpc = async (method: string, params?: unknown, notification = false) => {
    const id = ++sequence;
    const headers: Record<string, string> = { 'Content-Type': 'application/json', Accept: 'application/json, text/event-stream' };
    if (method !== 'initialize') headers['MCP-Protocol-Version'] = version;
    if (session) headers['Mcp-Session-Id'] = session;
    if (token.trim()) headers.Authorization = `Bearer ${token.trim()}`;
    const response = await (options.fetcher || fetch)(endpoint, { method: 'POST', headers, credentials: 'omit', referrerPolicy: 'no-referrer', redirect: 'error', signal: controller.signal, body: JSON.stringify({ jsonrpc: '2.0', ...(notification ? {} : { id }), method, ...(params === undefined ? {} : { params }) }) });
    if ([401, 403].includes(response.status)) throw new Error('认证失败，请检查接入令牌与接口权限。');
    if (!response.ok) throw new Error(`MCP 接口请求失败（HTTP ${response.status}）。`);
    session = response.headers.get('Mcp-Session-Id') || session;
    if (notification) { await response.body?.cancel(); return null; }
    let payload: any;
    if (response.headers.get('Content-Type')?.includes('text/event-stream')) {
      const reader = response.body!.getReader(); const decoder = new TextDecoder(); let buffer = '';
      try {
        while (true) {
          const { done, value } = await reader.read(); buffer += decoder.decode(value || new Uint8Array(), { stream: !done }).replace(/\r\n/g, '\n');
          const events = buffer.split('\n\n'); buffer = events.pop() || '';
          for (const event of events) { const data = event.split('\n').filter(line => line.startsWith('data:')).map(line => line.slice(5).trim()).join('\n'); if (!data) continue; const parsed = JSON.parse(data); if (parsed.id === id) { payload = parsed; break; } }
          if (payload || done) break;
        }
      } finally { await reader.cancel(); }
    } else payload = await response.json();
    if (!payload || payload.jsonrpc !== '2.0' || payload.id !== id || payload.error || !payload.result) throw new Error('接口返回与 MCP 协议不兼容，请检查服务地址。');
    return payload.result;
  };
  try {
    const initialized = await rpc('initialize', { protocolVersion: version, capabilities: {}, clientInfo: { name: 'moying-ai-studio-web', version: '0.1.0' } });
    if (!initialized.protocolVersion || !initialized.capabilities?.tools) return { ok: false, message: '服务没有声明 MCP 工具能力，需由天工系统提供可调用的业务接口。' };
    version = initialized.protocolVersion;
    await rpc('notifications/initialized', undefined, true);
    const result = await rpc('tools/list');
    if (!Array.isArray(result.tools)) return { ok: false, message: '接口未返回有效的 MCP 工具列表。' };
    return { ok: true, message: `MCP 接口验证通过，当前页发现 ${result.tools.length} 个工具；业务调用仍需完成接口适配与任务授权。`, time: new Date().toISOString(), toolCount: result.tools.length };
  } catch (error) { return { ok: false, message: controller.signal.aborted ? '连接已取消或超时，请检查内网服务。' : error instanceof Error && /认证失败|MCP 接口|MCP 协议/.test(error.message) ? error.message : '网络连接失败，请检查内网地址、服务状态及跨域配置。' }; }
  finally { clearTimeout(timeout); options.signal?.removeEventListener('abort', cancel); }
}
