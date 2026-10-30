export function settingsSource(description = '管理项目的基础设置', enhanced = false) {
  return enhanced ? `import { useState } from 'react';

export default function Settings() {
  const [apiKey, setApiKey] = useState('');
  const [model, setModel] = useState('gpt-4.1');
  const [connected, setConnected] = useState(false);
  const description = ${JSON.stringify(description)};

  function testConnection() {
    setConnected(apiKey.trim().length > 0);
  }

  return (
    <section className="settings">
      <h2>模型服务设置</h2>
      <p>{description}</p>
      <label>API Key
        <input type="password" value={apiKey} onChange={event => {
          setApiKey(event.target.value);
          setConnected(false);
        }} placeholder="输入 API Key" />
      </label>
      <label>模型
        <select value={model} onChange={event => setModel(event.target.value)}>
          <option value="gpt-4.1">GPT-4.1</option>
          <option value="local">本地模型</option>
        </select>
      </label>
      <button onClick={testConnection}>测试连接</button>
      <span className="connection-status" role="status">
        {connected ? '演示连接已就绪' : '等待配置'}
      </span>
    </section>
  );
}
` : `export default function Settings() {
  return (
    <section className="settings">
      <h2>项目设置</h2>
      <p>${description}</p>
    </section>
  );
}
`;
}

export const settingsStyles = `
.settings label { display: grid; gap: 8px; margin-top: 20px; }
.settings input, .settings select {
  width: 100%; padding: 10px 12px; border: 1px solid #dddfe6;
  border-radius: 8px; font: inherit; background: white;
}
.settings button {
  margin-top: 20px; padding: 10px 16px; border: 0;
  border-radius: 8px; background: #241f7d; color: white;
}
.connection-status { margin-left: 12px; color: #747985; }
`;

export function projectTemplate(name: string): Record<string, string> {
  return {
    '.opencode/skills/plugin-sdk.md': '# 插件开发能力\n\n根据项目中的 plugin.json 声明能力，修改项目文件后提交代码审查。\n',
    'src/components/Settings.tsx': settingsSource(),
    'src/App.tsx': `import Settings from './components/Settings';
import './index.css';

export default function App() {
  const projectName = ${JSON.stringify(name)};
  return (
    <main>
      <h1>{projectName}</h1>
      <Settings />
    </main>
  );
}
`,
    'src/index.css': `* { box-sizing: border-box; }
body { margin: 0; color: #343742; background: #f7f7fb; font-family: system-ui, sans-serif; }
main { max-width: 760px; margin: 40px auto; padding: 28px; background: white; }
h1 { font-size: 24px; }
.settings { margin-top: 24px; }
.settings p { color: #9296a2; line-height: 1.8; }
`,
    'src/main.tsx': `import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';

createRoot(document.getElementById('root')!).render(
  <StrictMode><App /></StrictMode>,
);
`,
    'AGENTS.md': '# 项目开发约定\n\n沿用当前项目样式。文件变更先提交审查，保留现有内容和用户修改。\n',
    'package.json': JSON.stringify({ name: 'moying-project', version: '0.1.0', private: true, type: 'module', scripts: { dev: 'vite', build: 'vite build' }, dependencies: { react: '^19.0.0', 'react-dom': '^19.0.0' }, devDependencies: { vite: '^6.0.0', typescript: '^5.8.0' } }, null, 2) + '\n',
    'plugin.json': JSON.stringify({ name, version: '0.1.0', entry: 'src/main.tsx', capabilities: [] }, null, 2) + '\n',
    'index.html': '<!doctype html>\n<html lang="zh-CN">\n  <head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"></head>\n  <body><div id="root"></div><script type="module" src="/src/main.tsx"></script></body>\n</html>\n',
  };
}
