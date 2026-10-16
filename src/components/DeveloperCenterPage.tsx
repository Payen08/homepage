import { useEffect, useMemo, useState } from 'react';
import { Button, Card, Tabs } from '@heroui/react';
import { ArrowLeft, ArrowRight, ArrowUpRight, BookOpen, Boxes, Check, ChevronRight, Code2, Download, FileText, Layers, Search, Sparkles, Terminal, X } from 'lucide-react';
import { capabilityNames, developerDocs, downloadText, integrationServices, markdownFor, skillSource, type DeveloperDoc, type DocGroup } from './developerResources';
import './DeveloperCenterPage.css';

type View = 'overview' | 'docs' | 'skills' | 'downloads';
const groups: DocGroup[] = ['开发入门', 'SDK 能力', 'AI Skills'];
const navigation = [ ['overview', '开发者首页', Layers], ['docs', '开发文档', BookOpen], ['skills', 'AI Skills', Sparkles], ['downloads', '资源下载', Download] ] as const;

export function DeveloperCenterPage({ onBack, mode = 'platform' }: { onBack: () => void; mode?: 'platform' | 'docs' }) {
  const [view, setView] = useState<View>(mode === 'docs' ? 'docs' : 'overview');
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState('全部文档');
  const [doc, setDoc] = useState<DeveloperDoc | null>(null);
  const [anchor, setAnchor] = useState('');
  const [downloaded, setDownloaded] = useState('');
  const matching = useMemo(() => developerDocs.filter(d => (view !== 'skills' || d.group === 'AI Skills') && (category === '全部文档' || d.group === category || view === 'skills') && `${d.title} ${d.summary} ${d.sections.map(s => s.title).join(' ')}`.toLowerCase().includes(query.trim().toLowerCase())), [view, query, category]);
  const openDoc = (next: DeveloperDoc) => { setDoc(next); setAnchor(next.sections[0].id); window.scrollTo({ top: 0, behavior: 'instant' }); };
  const changeView = (next: View) => { setView(next); setDoc(null); setQuery(''); setCategory('全部文档'); };
  const download = (name: string, text: string) => { downloadText(name, text); setDownloaded(name); };
  useEffect(() => { if (!downloaded) return; const timer = setTimeout(() => setDownloaded(''), 2500); return () => clearTimeout(timer); }, [downloaded]);
  useEffect(() => {
    if (!doc) return;
    const observer = new IntersectionObserver(entries => { const visible = entries.filter(entry => entry.isIntersecting); if (visible[0]) setAnchor(visible[0].target.id); }, { rootMargin: '-110px 0px -55% 0px' });
    doc.sections.forEach(section => { const el = document.getElementById(section.id); if (el) observer.observe(el); });
    return () => observer.disconnect();
  }, [doc]);
  const renderDocCard = (item: DeveloperDoc) => <Card className="dp-card dp-doc-card" key={item.id}>
    <div className="dp-card-top"><span className="dp-icon">{item.group === 'AI Skills' ? <Sparkles size={20} /> : item.group === 'SDK 能力' ? <Boxes size={20} /> : <BookOpen size={20} />}</span><span className="dp-chip">{item.group}</span></div>
    <h3>{item.title}</h3><p>{item.summary}</p>
    <div className="dp-doc-topics">{item.sections.slice(0, 3).map(s => <span key={s.id}>{s.title}</span>)}</div>
    <div className="dp-card-footer"><span>{item.sections.length} 个章节 · Markdown</span><Button className="dp-text-button" onPress={() => openDoc(item)}>阅读文档 <ArrowUpRight size={15} /></Button></div>
  </Card>;

  const downloads = [
    { name: '百川 OS 插件开发文档集', summary: '包含开发入门、插件规范和九个 SDK 能力域的 Markdown 内容。', format: 'MD', version: '内容草案', filename: 'baichuan-developer-docs.md', source: developerDocs.filter(d => d.group !== 'AI Skills').map(markdownFor).join('\n\n---\n\n') },
    { name: 'AI 插件开发 Skill', summary: '供 AI 开发助手使用的工作流程示例，覆盖文档核对、插件实现与调试验收。', format: 'MD', version: '示例版本', filename: 'SKILL.md', source: skillSource },
    { name: 'AI Skills 使用说明', summary: '了解如何提供开发上下文，使用 Skill 辅助完成插件开发和验证。', format: 'MD', version: '内容草案', filename: 'ai-skills-guide.md', source: markdownFor(developerDocs.find(d => d.id === 'skill-workflow')!) },
    { name: '百川 OS SDK 开发工具包', summary: '官方工具包将提供类型定义、开发依赖和示例工程。当前项目尚未上传正式安装包。', format: 'SDK', version: '待上传', filename: '', source: '' },
  ];

  return <section className="developer-platform" aria-label="百川 OS 开发者平台">

    {doc ? <>
      <div className="dp-reader-toolbar"><Button className="dp-button dp-button-secondary" onPress={() => { setDoc(null); setView('docs'); }}><ArrowLeft size={15} /> 返回文档列表</Button><Button className="dp-button dp-button-primary" onPress={() => download(`${doc.id}.md`, markdownFor(doc))}><Download size={15} /> 下载 Markdown</Button></div>
      <div className="dp-reader">
        <aside className="dp-doc-tree" aria-label="文档目录"><h2>开发文档</h2>{groups.map(group => <div key={group}><h3>{group}</h3>{developerDocs.filter(d => d.group === group).map(item => <div key={item.id}><button className={doc.id === item.id ? 'is-selected' : ''} aria-current={doc.id === item.id ? 'page' : undefined} onClick={() => openDoc(item)}><FileText size={14} />{item.title}</button>{doc.id === item.id && <div className="dp-subtree">{item.sections.map(s => <a className={s.level === 3 ? 'is-nested' : ''} key={s.id} href={`#${s.id}`} onClick={() => setAnchor(s.id)}>{s.title}</a>)}</div>}</div>)}</div>)}</aside>
        <article className="dp-prose"><div className="dp-eyebrow">{doc.group} / 开发指南</div><h1>{doc.title}</h1><p className="dp-lead">{doc.summary}</p><div className="dp-draft-note">文档草案 · 具体接口、参数与版本兼容性以正式 SDK 资料为准。</div>{doc.sections.map(s => <section key={s.id} id={s.id}>{s.level === 3 ? <h3>{s.title}</h3> : <h2>{s.title}</h2>}{s.paragraphs.map((p, i) => <p key={i}>{p}</p>)}{s.items && <ul>{s.items.map(item => <li key={item}>{item}</li>)}</ul>}</section>)}<div className="dp-reader-bottom"><span>接下来</span><Button className="dp-text-button" onPress={() => openDoc(developerDocs[(developerDocs.findIndex(d => d.id === doc.id) + 1) % developerDocs.length])}>{developerDocs[(developerDocs.findIndex(d => d.id === doc.id) + 1) % developerDocs.length].title}<ArrowRight size={16} /></Button></div></article>
        <aside className="dp-toc" aria-label="本页章节"><h2>本页内容</h2>{doc.sections.map(s => <a key={s.id} aria-current={anchor === s.id ? 'location' : undefined} className={`${anchor === s.id ? 'is-active' : ''} ${s.level === 3 ? 'is-nested' : ''}`} href={`#${s.id}`} onClick={() => setAnchor(s.id)}>{s.title}</a>)}</aside>
      </div>
    </> : <>
      {view === 'overview' && <><header className="dp-hero"><div><div className="dp-eyebrow"><span /> BAICHUAN OS · DEVELOPERS</div><h1>{view === 'overview' ? '为每一次插件开发，\n找到下一步。' : view === 'downloads' ? '开发资源，一处获取。' : view === 'skills' ? '让 AI 理解你的开发流程。' : '从理解架构，到实现能力。'}</h1><p>百川 OS 插件开发者的统一技术资源平台。<br />查阅开发文档、探索 SDK 能力，获取 AI Skills 与开发工具。</p><div className="dp-hero-actions"><Button className="dp-button dp-button-primary" onPress={() => openDoc(developerDocs[0])}>开始开发 <ArrowRight size={16} /></Button><Button className="dp-button dp-button-secondary" onPress={() => changeView('downloads')}><Download size={16} /> 获取开发资源</Button></div></div><div className="dp-hero-code" aria-hidden="true"><div><span /><span /><span /><small>plugin / development</small></div><pre><span>// 从需求到可运行的插件</span>{'\n'}<b>百川 OS</b> / Plugin{'\n\n'}<em>01</em>  准备开发环境{'\n'}<em>02</em>  构建插件与调用能力{'\n'}<em>03</em>  调试、验证与交付{'\n\n'}<i>→</i>  Build with Baichuan OS</pre></div></header>
      <div className="dp-stats">{[[BookOpen, '开放文档', developerDocs.length, 'docs'], [Layers, '集成服务', integrationServices.length, 'docs'], [Code2, '开放接口', capabilityNames.length, 'docs'], [Sparkles, 'AI Skills', 1, 'skills']].map(([Icon, label, count, target]) => { const MetricIcon = Icon as typeof BookOpen; return <button key={String(label)} onClick={() => { changeView(target as View); if (label === '开放接口') setCategory('SDK 能力'); }}><MetricIcon size={19} /><span>{String(label)}<small>{label === '开放接口' ? 'SDK 能力域' : label === '集成服务' ? integrationServices.join(' / ') : label === 'AI Skills' ? '插件开发辅助示例' : '开发指南与能力说明'}</small></span><strong>{String(count).padStart(2, '0')}</strong><ChevronRight size={15} /></button>; })}</div>
      </>}
      <Tabs className="dp-tabs" selectedKey={view} onSelectionChange={key => changeView(key as View)}>
        <Tabs.ListContainer className="dp-tab-container"><Tabs.List className="dp-tab-list" aria-label="开发者平台栏目">{navigation.map(([id, label, Icon]) => <Tabs.Tab className="dp-tab" id={id} key={id}><Icon size={16} />{label}<Tabs.Indicator className="dp-tab-indicator" /></Tabs.Tab>)}</Tabs.List></Tabs.ListContainer>
        {navigation.map(([id]) => <Tabs.Panel className="dp-panel" key={id} id={id}>
          <div className="dp-section-heading"><div><h2>{id === 'overview' ? '开发，从这里开始' : id === 'downloads' ? '开发资源下载' : id === 'skills' ? 'AI Skills 文档' : '开发文档中心'}</h2><p>{id === 'overview' ? '沿着开发路径查阅资料，或直接找到需要的能力。' : id === 'downloads' ? '版本、格式与文件大小清晰可查，下载所需资源。' : id === 'skills' ? '为 AI 辅助插件开发提供可复用的流程与规范。' : '按开发场景筛选文档，在线阅读或下载 Markdown 原文。'}</p></div>{id === 'overview' ? <Button className="dp-text-button" onPress={() => changeView('docs')}>全部文档 <ArrowUpRight size={16} /></Button> : <div className="dp-search"><Search size={17} /><input aria-label="搜索开发资源" value={query} onChange={e => setQuery(e.target.value)} placeholder="搜索文档、能力或资源…" />{query && <button aria-label="清除搜索" onClick={() => setQuery('')}><X size={14} /></button>}</div>}</div>
          {id === 'overview' ? <><div className="dp-start-grid">{developerDocs.filter(d => d.group === '开发入门' || d.group === 'AI Skills').map(renderDocCard)}</div><div className="dp-section-heading dp-secondary-heading"><div><h2>探索 SDK 能力</h2><p>围绕机器人应用开发的九个能力域。</p></div><span className="dp-muted">{capabilityNames.length} 个能力域</span></div><div className="dp-capabilities">{developerDocs.filter(d => d.group === 'SDK 能力').map((item, index) => <button key={item.id} onClick={() => openDoc(item)}><span>{String(index + 1).padStart(2, '0')}</span><div><strong>{capabilityNames[index]}</strong><small>{item.summary}</small></div><ArrowUpRight size={16} /></button>)}</div></> : id === 'downloads' ? <div className="dp-downloads">{downloads.filter(item => `${item.name} ${item.summary}`.toLowerCase().includes(query.toLowerCase())).map(item => <Card className="dp-card dp-download" key={item.name}><span className="dp-file-icon">{item.format === 'SDK' ? <Boxes size={24} /> : <FileText size={24} />}<small>{item.format}</small></span><div className="dp-download-description"><h3>{item.name}<span className="dp-chip">{item.version}</span></h3><p>{item.summary}</p><small>{item.format} · {item.source ? `${(new Blob([item.source]).size / 1024).toFixed(1)} KB` : '文件大小待上传后显示'}</small></div><Button className="dp-button dp-button-secondary" isDisabled={!item.source} onPress={() => download(item.filename, item.source)}><Download size={15} />{item.source ? '下载资源' : '待上传'}</Button></Card>)}{!downloads.some(item => `${item.name} ${item.summary}`.toLowerCase().includes(query.toLowerCase())) && <div className="dp-empty">没有找到匹配资源<Button className="dp-text-button" onPress={() => setQuery('')}>清除搜索</Button></div>}</div> : <>{id === 'docs' && <div className="dp-filters" aria-label="文档分类">{['全部文档', ...groups].map(group => <button aria-pressed={category === group} className={category === group ? 'is-active' : ''} key={group} onClick={() => setCategory(group)}>{group}</button>)}<span>共 {matching.length} 篇文档</span></div>}<div className="dp-doc-grid">{matching.map(renderDocCard)}</div>{!matching.length && <div className="dp-empty"><Search size={25} />没有找到匹配文档<Button className="dp-text-button" onPress={() => { setQuery(''); setCategory('全部文档'); }}>重置筛选</Button></div>}{id === 'skills' && <div className="dp-skill-callout"><Terminal size={24} /><div><h3>把开发流程交给你的 AI 助手</h3><p>下载示例 SKILL.md，并结合正式 SDK 文档使用。</p></div><Button className="dp-button dp-button-secondary" onPress={() => download('SKILL.md', skillSource)}>下载 Skill <Download size={15} /></Button></div>}</>}
        </Tabs.Panel>)}
      </Tabs>
      <footer className="dp-footer"><span>BAICHUAN OS / 开发者资源</span><span>环境准备 → 插件开发 → 能力调用 → 调试验证 → 资源下载</span></footer>
    </>}
    <div className="dp-download-status" role="status">{downloaded && <><Check size={16} />已开始下载 {downloaded}</>}</div>
  </section>;
}
