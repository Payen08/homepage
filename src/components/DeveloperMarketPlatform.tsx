import React, { useState, useMemo, useEffect } from 'react';
import { motion } from 'motion/react';
import {
  Search,
  SlidersHorizontal,
  ArrowUpRight,
  ArrowRight,
  ArrowLeft,
  Download,
  Check,
  X,
  BookOpen,
  Bot,
  Network,
  Cpu,
  MapPin,
  Crosshair,
  GitFork,
  Eye,
  Layers,
  Sparkles,
  FileText,
  Terminal,
  Boxes,
  Filter,
  Tag,
} from 'lucide-react';
import {
  developerDocs,
  markdownFor,
  skillSource,
  downloadText,
  type DeveloperDoc,
  type DocGroup,
} from './developerResources';
import './DeveloperCenterPage.css';

interface DeveloperMarketPlatformProps {
  onSwitchToDev2?: () => void;
}

type ResourceType = 'doc' | 'download';

interface DevItem {
  id: string;
  type: ResourceType;
  title: string;
  category: '开发入门' | 'SDK 能力' | 'AI Skills' | '资源下载';
  summary: string;
  topics: string[];
  sectionsCount?: number;
  docId?: string;
  doc?: DeveloperDoc;
  format?: string;
  version?: string;
  filename?: string;
  source?: string;
  icon: React.ElementType;
}

const docGroups: DocGroup[] = ['开发入门', 'SDK 能力', 'AI Skills'];

// 文档项数据：直接来源于官方 developerDocs，保持与原开放平台一致的文案与目录结构
const docItems: DevItem[] = developerDocs.map(doc => {
  let Icon = BookOpen;
  if (doc.group === 'AI Skills') {
    Icon = Sparkles;
  } else if (doc.group === 'SDK 能力') {
    if (doc.id === 'robot') Icon = Bot;
    else if (doc.id === 'navigation') Icon = Network;
    else if (doc.id === 'manipulator') Icon = SlidersHorizontal;
    else if (doc.id === 'peripherals') Icon = Cpu;
    else if (doc.id === 'waypoints') Icon = MapPin;
    else if (doc.id === 'calibration') Icon = Crosshair;
    else if (doc.id === 'behavior-tree') Icon = GitFork;
    else if (doc.id === 'vision') Icon = Eye;
    else if (doc.id === 'system') Icon = Layers;
    else Icon = Boxes;
  }
  return {
    id: doc.id,
    type: 'doc',
    title: doc.title,
    category: doc.group,
    summary: doc.summary,
    topics: doc.sections.slice(0, 3).map(s => s.title),
    sectionsCount: doc.sections.length,
    docId: doc.id,
    doc,
    icon: Icon,
  };
});

// 资源下载项数据
const downloadItems: DevItem[] = [
  {
    id: 'download-docs',
    type: 'download',
    title: '百川 OS 插件开发文档集',
    category: '资源下载',
    summary: '包含开发入门、插件规范和九个 SDK 能力域的 Markdown 内容。',
    topics: ['Markdown 全集', '14 个能力域', '离线文档集'],
    format: 'MD',
    version: '内容草案',
    filename: 'baichuan-developer-docs.md',
    source: developerDocs.filter(d => d.group !== 'AI Skills').map(markdownFor).join('\n\n---\n\n'),
    icon: FileText,
  },
  {
    id: 'download-skill',
    type: 'download',
    title: 'AI 插件开发 Skill',
    category: '资源下载',
    summary: '供 AI 开发助手使用的工作流程示例，覆盖文档核对、插件实现与调试验收。',
    topics: ['SKILL.md', '工作流定义', '开箱即用'],
    format: 'MD',
    version: '示例版本',
    filename: 'SKILL.md',
    source: skillSource,
    icon: Terminal,
  },
  {
    id: 'download-skill-guide',
    type: 'download',
    title: 'AI Skills 使用说明',
    category: '资源下载',
    summary: '了解如何提供开发上下文，使用 Skill 辅助完成插件开发和验证。',
    topics: ['使用手册', '提示词工程', '质量控制'],
    format: 'MD',
    version: '内容草案',
    filename: 'ai-skills-guide.md',
    source: markdownFor(developerDocs.find(d => d.id === 'skill-workflow')!),
    icon: Sparkles,
  },
  {
    id: 'download-sdk-toolkit',
    type: 'download',
    title: '百川 OS SDK 开发工具包',
    category: '资源下载',
    summary: '官方工具包将提供类型定义、开发依赖和示例工程。当前项目尚未上传正式安装包。',
    topics: ['TypeScript 类型', '虚拟模拟器', 'CLI 脚手架'],
    format: 'SDK',
    version: '待上传',
    filename: '',
    source: '',
    icon: Boxes,
  },
];

const allDevItems: DevItem[] = [...docItems, ...downloadItems];

export function DeveloperMarketPlatform({ onSwitchToDev2 }: DeveloperMarketPlatformProps) {
  const [category, setCategory] = useState<string>('全部');
  const [query, setQuery] = useState('');
  const [selectedDoc, setSelectedDoc] = useState<DeveloperDoc | null>(null);
  const [anchor, setAnchor] = useState('');
  const [downloadToast, setDownloadToast] = useState('');

  const categories = ['全部', '开发入门', 'SDK 能力', 'AI Skills', '资源下载'];

  const filteredItems = useMemo(() => {
    return allDevItems.filter(item => {
      const matchCat = category === '全部' || item.category === category;
      const matchQuery = `${item.title} ${item.summary} ${item.topics?.join(' ') || ''}`
        .toLowerCase()
        .includes(query.trim().toLowerCase());
      return matchCat && matchQuery;
    });
  }, [category, query]);

  const handleDownload = (filename: string, content: string) => {
    if (!content) return;
    downloadText(filename, content);
    setDownloadToast(filename);
    setTimeout(() => setDownloadToast(''), 3000);
  };

  const openDoc = (next: DeveloperDoc) => {
    setSelectedDoc(next);
    setAnchor(next.sections[0]?.id || '');
    window.scrollTo({ top: 0, behavior: 'instant' });
  };

  const handleOpenItem = (item: DevItem) => {
    if (item.type === 'doc') {
      const targetDoc = item.doc || developerDocs.find(d => d.id === item.docId);
      if (targetDoc) {
        openDoc(targetDoc);
      }
    } else if (item.type === 'download' && item.source && item.filename) {
      handleDownload(item.filename, item.source);
    }
  };

  // 监听文档正文滚动以同步右侧目录高亮
  useEffect(() => {
    if (!selectedDoc) return;
    const observer = new IntersectionObserver(
      entries => {
        const visible = entries.filter(entry => entry.isIntersecting);
        if (visible[0]) setAnchor(visible[0].target.id);
      },
      { rootMargin: '-110px 0px -55% 0px' }
    );
    selectedDoc.sections.forEach(section => {
      const el = document.getElementById(section.id);
      if (el) observer.observe(el);
    });
    return () => observer.disconnect();
  }, [selectedDoc]);

  // 左侧推荐榜单数据（对齐热门能力榜）
  const topRecommendations = [
    { rank: '01', title: '百川 OS 插件开发入门', sub: '开发入门 · 新手接入必读', docId: 'quick-start' },
    { rank: '02', title: '插件架构与开发规范', sub: '核心架构 · 状态与生命周期', docId: 'architecture' },
    { rank: '03', title: '机械臂能力开发说明', sub: 'SDK 能力 · 运动规划与闭环', docId: 'manipulator' },
    { rank: '04', title: 'AI Skills 辅助插件开发', sub: 'AI 赋能 · 大模型流水线', docId: 'skill-workflow' },
  ];

  // 若处于文档预览阅读模式，则渲染完整三栏技术文档阅读器
  if (selectedDoc) {
    return (
      <section className="developer-platform" aria-label="开发文档预览">
        {/* 顶部阅读导航工具条 */}
        <div className="dp-reader-toolbar">
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <button
              className="dp-button dp-button-secondary"
              onClick={() => {
                setSelectedDoc(null);
                window.scrollTo({ top: 0, behavior: 'instant' });
              }}
            >
              <ArrowLeft size={15} /> 返回列表
            </button>
            <span style={{ color: '#888888', fontSize: '12.5px', fontWeight: 500, letterSpacing: '0.02em' }}>
              {selectedDoc.group} / 开发指南
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <button
              className="dp-button dp-button-primary"
              onClick={() => handleDownload(`${selectedDoc.id}.md`, markdownFor(selectedDoc))}
            >
              <Download size={15} /> 下载 Markdown
            </button>
          </div>
        </div>

        {/* 核心三栏阅读器：左侧文档树 + 中间 Markdown 正文 + 右侧本页目录 */}
        <div className="dp-reader">
          {/* 左侧文档树 */}
          <aside className="dp-doc-tree" aria-label="文档目录">
            <h2>开发文档</h2>
            {docGroups.map(group => (
              <div key={group}>
                <h3>{group}</h3>
                {developerDocs
                  .filter(d => d.group === group)
                  .map(item => (
                    <div key={item.id}>
                      <button
                        className={selectedDoc.id === item.id ? 'is-selected' : ''}
                        aria-current={selectedDoc.id === item.id ? 'page' : undefined}
                        onClick={() => openDoc(item)}
                      >
                        <FileText size={14} />
                        {item.title}
                      </button>
                      {selectedDoc.id === item.id && (
                        <div className="dp-subtree">
                          {item.sections.map(s => (
                            <a
                              className={s.level === 3 ? 'is-nested' : ''}
                              key={s.id}
                              href={`#${s.id}`}
                              onClick={() => setAnchor(s.id)}
                            >
                              {s.title}
                            </a>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
              </div>
            ))}
          </aside>

          {/* 中间文章正文 */}
          <article className="dp-prose">
            <div className="dp-eyebrow">{selectedDoc.group} / 开发指南</div>
            <h1>{selectedDoc.title}</h1>
            <p className="dp-lead">{selectedDoc.summary}</p>
            <div className="dp-draft-note">
              文档草案 · 具体接口、参数与版本兼容性以正式 SDK 资料为准。
            </div>
            {selectedDoc.sections.map(s => (
              <section key={s.id} id={s.id}>
                {s.level === 3 ? <h3>{s.title}</h3> : <h2>{s.title}</h2>}
                {s.paragraphs.map((p, i) => (
                  <p key={i}>{p}</p>
                ))}
                {s.items && (
                  <ul>
                    {s.items.map(item => (
                      <li key={item}>{item}</li>
                    ))}
                  </ul>
                )}
              </section>
            ))}
            <div className="dp-reader-bottom">
              <span>接下来</span>
              <button
                className="dp-text-button"
                onClick={() => {
                  const nextIdx =
                    (developerDocs.findIndex(d => d.id === selectedDoc.id) + 1) % developerDocs.length;
                  openDoc(developerDocs[nextIdx]);
                }}
              >
                {
                  developerDocs[
                    (developerDocs.findIndex(d => d.id === selectedDoc.id) + 1) % developerDocs.length
                  ].title
                }
                <ArrowRight size={16} />
              </button>
            </div>
          </article>

          {/* 右侧本页目录 */}
          <aside className="dp-toc" aria-label="本页内容">
            <h2>本页内容</h2>
            {selectedDoc.sections.map(s => (
              <a
                key={s.id}
                aria-current={anchor === s.id ? 'location' : undefined}
                className={`${anchor === s.id ? 'is-active' : ''} ${s.level === 3 ? 'is-nested' : ''}`}
                href={`#${s.id}`}
                onClick={() => setAnchor(s.id)}
              >
                {s.title}
              </a>
            ))}
          </aside>
        </div>

        {/* 轻量下载 Toast */}
        {downloadToast && (
          <div className="dp-download-status" role="status">
            <Check size={16} /> 已成功下载 {downloadToast}
          </div>
        )}
      </section>
    );
  }

  // 默认渲染工业能力市场布局的开放平台视图（采用开放平台2原汁原味的极简卡片）
  return (
    <section className="developer-platform market-page" aria-label="开放平台">
      {/* 顶部 Hero 区域：保持简约干净，无多余蓝色角标与按钮群 */}
      <div className="market-hero">
        <div>
          <h1>百川开放平台</h1>
          <p>参考工业能力市场布局，统一汇聚百川 OS 开发规范、9 个 SDK 能力域、AI Skills 与开发工具包。</p>
        </div>
      </div>

      {/* 核心双栏布局：左侧推荐导航 + 右侧资源市场 */}
      <div className="market-layout">
        {/* 左侧侧边栏 */}
        <aside className="market-sidebar">
          <div className="sidebar-title">
            <span>推荐接入路径</span>
            <span className="live-dot">GUIDE</span>
          </div>
          <p>按官方建议的开发学习路径排列</p>
          {topRecommendations.map(rec => (
            <button
              className="rank-item"
              key={rec.rank}
              onClick={() => {
                const doc = developerDocs.find(d => d.id === rec.docId);
                if (doc) openDoc(doc);
              }}
            >
              <span className="rank-number">{rec.rank}</span>
              <span className="rank-copy">
                <strong>{rec.title}</strong>
                <small>{rec.sub}</small>
              </span>
              <ArrowUpRight size={15} />
            </button>
          ))}
          <div className="sidebar-foot">
            <Tag size={15} /> 百川 SDK v0.2.0 已认证 · 规范受沙箱保护
          </div>
        </aside>

        {/* 右侧主体内容区 */}
        <div className="market-content">
          {/* 搜索与工具条 */}
          <div className="market-toolbar">
            <div className="search-box">
              <Search size={18} />
              <input
                value={query}
                onChange={e => setQuery(e.target.value)}
                placeholder="搜索开发文档、SDK能力、AI Skills 或关键词..."
                aria-label="搜索开发资源"
              />
              {query && (
                <button
                  onClick={() => setQuery('')}
                  style={{ background: 'transparent', border: 0, color: '#888', cursor: 'pointer' }}
                >
                  <X size={14} />
                </button>
              )}
            </div>
            <button className="sort-button" onClick={() => setCategory('全部')} title="重置分类">
              <SlidersHorizontal size={16} /> 默认排序
            </button>
          </div>

          {/* 分类标签栏 */}
          <div className="category-row">
            <div className="category-tabs">
              {categories.map(cat => (
                <button
                  key={cat}
                  className={category === cat ? 'active' : ''}
                  onClick={() => setCategory(cat)}
                >
                  {cat}
                </button>
              ))}
            </div>
            <span className="result-count">共 {filteredItems.length} 项开发资源</span>
          </div>

          {/* 资源卡片网格：完全复用开放平台2的原版纯粹卡片样式 */}
          {filteredItems.length ? (
            <div
              className="dp-doc-grid"
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(310px, 1fr))',
                gap: '16px',
              }}
            >
              {filteredItems.map((item, index) => {
                const Icon = item.icon;
                return (
                  <motion.article
                    className="dp-card dp-doc-card"
                    key={item.id}
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.03 }}
                    onClick={() => handleOpenItem(item)}
                    style={{ cursor: 'pointer' }}
                  >
                    <div className="dp-card-top">
                      <span className="dp-icon">
                        <Icon size={20} />
                      </span>
                      <span className="dp-chip">{item.category}</span>
                    </div>

                    <h3>{item.title}</h3>
                    <p>{item.summary}</p>

                    <div className="dp-doc-topics">
                      {item.topics.map((topic, i) => (
                        <span key={i}>{topic}</span>
                      ))}
                    </div>

                    <div className="dp-card-footer">
                      <span>
                        {item.type === 'doc'
                          ? `${item.sectionsCount} 个章节 · Markdown`
                          : `${item.format} · ${item.version}`}
                      </span>
                      <button
                        className="dp-text-button"
                        onClick={e => {
                          e.stopPropagation();
                          handleOpenItem(item);
                        }}
                      >
                        {item.type === 'doc' ? '阅读文档' : '下载资源'}{' '}
                        <ArrowUpRight size={15} />
                      </button>
                    </div>
                  </motion.article>
                );
              })}
            </div>
          ) : (
            <div className="empty-state">
              <Filter size={25} />
              <h3>未找到匹配的开发资源</h3>
              <p>请尝试搜索其他关键词，或切换分类筛选。</p>
            </div>
          )}
        </div>
      </div>

      {/* 底部轻量 Toast */}
      {downloadToast && (
        <div className="dp-download-status" role="status" style={{ zIndex: 9999 }}>
          <Check size={16} /> 已成功下载 {downloadToast}
        </div>
      )}
    </section>
  );
}
