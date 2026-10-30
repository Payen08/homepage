import { motion } from 'motion/react';
import { lazy, Suspense } from 'react';
import { useEffect, useMemo, useState } from 'react';
import {
  ArrowUpRight, Blocks, BookOpen, Box, Bot, ChevronRight, CircleHelp, Cpu, Factory, Filter,
  Globe2, GraduationCap, Handshake, Hexagon, Home, Laptop, Menu, MonitorCog, Network, Search,
  ShieldCheck, ShoppingBag, ShoppingCart, ClipboardList, SlidersHorizontal, Sparkles, Store, Tag, Users, Video, Wrench, X, Zap, Download,
} from 'lucide-react';
import moyingLogo from '../墨影logo.png';
import { DeveloperToolsSection } from './components/DeveloperToolsSection';
import { HomeSectionHeading } from './components/HomeSectionHeading';
import type { Equipment } from './components/equipmentCatalog';
import { DetailModal } from './components/DetailModal';
import { HotHardwareSection } from './components/HotHardwareSection';
import { DeveloperCenterPage } from './components/DeveloperCenterPage';
import { DeveloperMarketPlatform } from './components/DeveloperMarketPlatform';
import { CommunityPage } from './components/CommunityPage';
import { AcademyPage } from './components/AcademyPage';
import { IndustrialBentoSection, IndustrialFooter } from './components/IndustrialBentoSection';
const IndustrialSceneHero = lazy(() => import('./components/IndustrialSceneHero').then(({ IndustrialSceneHero }) => ({ default: IndustrialSceneHero })));

const EquipmentStorePage = lazy(() => import('./components/EquipmentStorePage').then(m => ({ default: m.EquipmentStorePage })));
const DeveloperPlatformPage = lazy(() => import('./components/DeveloperPlatformPage'));

const navigation = [
  { label: '首页', icon: Home },
  { label: '开放平台', icon: Globe2 },
  { label: '开放平台2', icon: BookOpen },
  { label: '插件商城', icon: Box },
  { label: '墨影学院', icon: GraduationCap },
  { label: '设备商城', icon: Store },
  { label: '社区', icon: Users },
];

const featurePillars = [
  {
    title: '开发',
    desc: 'SDK, Skill 与 AI Studio',
    icon: Blocks,
    tone: 'indigo',
  },
  {
    title: '共创',
    desc: '经验、方案与开发协作',
    icon: Handshake,
    tone: 'moss',
  },
  {
    title: '选型',
    desc: '插件、算法与设备能力',
    icon: Factory,
    tone: 'clay',
  },
  {
    title: '学习',
    desc: '文档、课程与项目实训',
    icon: ShieldCheck,
    tone: 'indigo',
  },
];

const ecosystems = [
  { title: '开放平台', eyebrow: 'BUILD ON MOYING', accent: 'copper', icon: Globe2, label: '核心入口', description: '把能力沉淀为可调用的模块，让每一次开发都更接近交付。', sections: [{ icon: Store, title: '插件商城', text: '页面、算法与行为树节点插件，即插即用，快速构建机器人应用。', tags: ['页面 / 组件', '算法插件', '行为树节点'] }, { icon: Sparkles, title: 'Skill 中心', text: '生成插件和工作流节点的 AI 技能库，降低复杂应用的开发门槛。', tags: ['AI 技能库', '生成插件', '节点生成'] }] },
  { title: '产品生态', eyebrow: 'CONNECT THE STACK', accent: 'moss', icon: Network, label: '协同共建', description: '连接设备、软件和场景，把每一段链路组织成更可靠的生产力。', sections: [{ icon: Cpu, title: '合作硬件部件', text: '精选适配的机器人核心部件，缩短从选型、集成到验证的路径。', tags: ['激光雷达', '机械臂', '伺服电机', '关节模组'] }, { icon: Laptop, title: '合作软件', text: '汇集机械臂、SLAM、视觉、交管和调度等算法能力。', tags: ['机械臂算法', 'SLAM 算法', '视觉算法'] }] },
  { title: '墨影学院', eyebrow: 'LEARN & SHIP', accent: 'clay', icon: GraduationCap, label: '持续赋能', description: '从上手到进阶，把复杂技术转化成团队可以复制的实战经验。', sections: [{ icon: Video, title: '培训视频课程', text: '覆盖百川、天工操作教程、机器人开发入门与场景应用案例。', tags: ['操作教程', '开发入门', '应用案例'] }, { icon: Wrench, title: '技术支持', text: '提供在线答疑、部署实施指导和故障诊断支持。', tags: ['在线答疑', '部署指导', '故障诊断'] }] },
];

const capabilities = [
  { name: '视觉质检工作站', category: '应用插件', vendor: '墨影科技', version: 'v2.4.1', downloads: 12840, badge: '官方', tone: 'indigo', description: '面向装配与表面缺陷检测的视觉质检工作流，支持多相机标定与结果回传。', scene: '适用于 3C、汽车零部件、金属加工产线。', icon: MonitorCog },
  { name: 'Modbus TCP 设备协议', category: '设备协议', vendor: '墨影连接实验室', version: 'v1.8.0', downloads: 10920, badge: '已认证', tone: 'green', description: '快速接入 PLC、变频器与传感器，提供寄存器映射、状态订阅和异常重连。', scene: '适用于产线设备联网与数据采集。', icon: Network },
  { name: '柔性抓取策略包', category: '算法策略', vendor: '灵巧智能', version: 'v3.1.2', downloads: 9670, badge: '精选', tone: 'orange', description: '针对多品种工件的抓取姿态规划策略，支持视觉定位与碰撞约束。', scene: '适用于仓储分拣、上下料与柔性装配。', icon: Bot },
  { name: '激光雷达 LDR-32', category: '硬件部件', vendor: '北辰传感', version: 'v1.2.6', downloads: 8240, badge: '已认证', tone: 'green', description: '32 线工业级激光雷达，提供 ROS2 驱动、点云滤波与安全区域配置。', scene: '适用于 AMR 导航、避障与数字孪生建模。', icon: Zap },
  { name: '机械臂轨迹优化器', category: '算法策略', vendor: '墨影科技', version: 'v2.0.3', downloads: 7850, badge: '官方', tone: 'indigo', description: '减少机械臂空移时间和关节抖动，支持离线轨迹验证与在线动态调整。', scene: '适用于焊接、码垛与精密装配。', icon: SlidersHorizontal },
  { name: 'OPC UA 工业网关', category: '设备协议', vendor: '云枢工业', version: 'v1.5.4', downloads: 7230, badge: '精选', tone: 'orange', description: '统一接入 OPC UA Server，支持标签浏览、数据缓存和边缘侧安全策略。', scene: '适用于多品牌设备的统一数据接入。', icon: Cpu },
  { name: 'AGV 调度连接器', category: '应用插件', vendor: '墨影科技', version: 'v1.9.5', downloads: 6810, badge: '官方', tone: 'indigo', description: '连接多品牌 AGV 与任务系统，提供路径下发、交通管制及任务追踪。', scene: '适用于仓储物流和厂内运输场景。', icon: Factory },
  { name: '伺服电机 SM-750', category: '硬件部件', vendor: '恒动机电', version: 'v4.0.1', downloads: 6420, badge: '已认证', tone: 'green', description: '高响应伺服电机与驱动套装，提供 EtherCAT 配置模板及运动参数。', scene: '适用于高速定位、搬运和精密运动控制。', icon: Wrench },
];

function Logo() {
  return (
    <a className="brand" href="#top" aria-label="墨影科技首页">
      <img src={moyingLogo} alt="墨影科技" className="brand-logo-img" />
      <span className="brand-name">墨影科技</span>
      <span className="brand-en">MOYING TECH</span>
    </a>
  );
}

function HomePage({ onMarket, onDeveloperCenter, onEquipmentStore, onDevice }: { onMarket: () => void; onDeveloperCenter: () => void; onEquipmentStore: () => void; onDevice: (device: Equipment) => void }) {
  const [selected, setSelected] = useState<Capability | null>(null);
  const popularPlugins = capabilities
    .filter((item) => item.category !== '硬件部件')
    .sort((a, b) => b.downloads - a.downloads)
    .slice(0, 3);

  return <>
    <section className="hero-section">
      <div className="hero-grid" aria-hidden="true" />
      <div className="hero-ambient-glow" aria-hidden="true" />
      <motion.div
        className="hero-content"
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.55, ease: 'easeOut' }}
      >
        <div className="hero-kicker">
          <span className="status-dot" /> MOYING OPEN PLATFORM
        </div>
        <h1>
          <span className="hero-title-line">让每一种工业能力</span>
          <span className="hero-title-line"><em>在真实世界创造价值</em></span>
        </h1>
        <p>
          连接机器人、开发者与工业现场。<br />
          从一行代码，到一套可落地的解决方案。
        </p>
        <div className="hero-actions">
          <button
            className="button button-primary button-large"
            onClick={onDeveloperCenter}
          >
            进入开发者中心 <ArrowUpRight size={16} />
          </button>
        </div>
      </motion.div>
      <Suspense fallback={<div className="industrial-scene industrial-scene--loading" role="status">正在准备场景…</div>}>
        <IndustrialSceneHero />
      </Suspense>
    </section>
    {/* 四大支撑支柱（按需暂时隐藏） */}
    {/*
    <section className="pillars-section" aria-label="核心能力与生态支撑">
      <div className="pillars-grid">
        {featurePillars.map(({ title, desc, icon: Icon, tone }, index) => (
          <motion.div
            className={`pillar-item pillar-item--${tone}`}
            key={title}
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.4, delay: index * 0.07 }}
          >
            <div className={`pillar-icon-box pillar-icon--${tone}`}>
              <Icon size={20} strokeWidth={1.8} />
            </div>
            <div className="pillar-text-group">
              <strong className="pillar-title">{title}</strong>
              <span className="pillar-desc">{desc}</span>
            </div>
          </motion.div>
        ))}
      </div>
    </section>
    */}
    {/* 提至首屏下方的工业能力 Bento 展示区 */}
    <IndustrialBentoSection onOpenDeveloperCenter={onDeveloperCenter} onOpenMarket={onMarket} />
    {/* 三大核心板块（按需暂时隐藏） */}
    {/*
    <section className="ecosystem-section" id="ecosystem"><HomeSectionHeading eyebrow="THE ECOSYSTEM / 开放生态" title="三大核心板块" description="开放 · 共建 · 赋能，打造 CNC 智能制造开放生态。" /><div className="ecosystem-grid">{ecosystems.map((ecosystem, index) => { const Icon = ecosystem.icon; return <motion.article className={`ecosystem-card ${ecosystem.accent}`} key={ecosystem.title} initial={{ opacity: 0, y: 18 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, amount: .2 }} transition={{ duration: .45, delay: index * .08 }}><div className="card-topline"><span>{ecosystem.eyebrow}</span><span>0{index + 1}</span></div><div className="card-title-row"><div className="card-icon"><Icon size={27} strokeWidth={1.65} /></div><div><h3>{ecosystem.title}</h3><span className="card-label">{ecosystem.label}</span></div></div><p className="card-intro">{ecosystem.description}</p><div className="card-content">{ecosystem.sections.map(({ icon: SectionIcon, title, text, tags }) => <section className="card-section" key={title}><div className="section-title"><SectionIcon size={17} /><h4>{title}</h4></div><p>{text}</p><div className="tags">{tags.map((tag) => <span className="tag" key={tag}>{tag}</span>)}</div></section>)}</div><button className="card-link" onClick={ecosystem.title === '开放平台' ? onMarket : undefined}>进入{ecosystem.title}<ArrowUpRight size={17} /></button></motion.article>; })}</div></section>
    */}
    <DeveloperToolsSection onOpenDeveloperCenter={onDeveloperCenter} />
    <section className="market-page home-market-section" aria-labelledby="popular-plugins-title">
      <HomeSectionHeading eyebrow="INDUSTRIAL CAPABILITIES / 工业能力市场" title="工业能力市场" id="popular-plugins-title" description="热门插件 · 从工业应用到设备连接，发现可快速接入的成熟能力。" action={<button className="button button-outline home-market-more" onClick={onMarket}>查看全部能力 <ArrowUpRight size={16} /></button>} />
      <div className="capability-grid home-market-grid">
        {popularPlugins.map((item, index) => <CapabilityCard key={item.name} item={item} index={index} onSelect={setSelected} />)}
      </div>
      <CapabilityDetail item={selected} onClose={() => setSelected(null)} />
    </section>
    <HotHardwareSection onOpenMarket={onEquipmentStore} onOpenDevice={onDevice} />
    <IndustrialFooter onOpenDeveloperCenter={onDeveloperCenter} onOpenMarket={onMarket} onOpenEquipmentStore={onEquipmentStore} />
  </>;
}

type Capability = (typeof capabilities)[number];

function CapabilityCard({ item, index, onSelect }: { key?: string; item: Capability; index: number; onSelect: (item: Capability) => void }) {
  const Icon = item.icon;

  return (
    <motion.article className="capability-card" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * .04 }}>
      <div className="capability-top">
        <div className="capability-heading">
          <div className={`capability-icon ${item.tone}`}><Icon size={21} /></div>
          <div className="capability-title-group">
            <h3>{item.name}</h3>
            <div className="capability-meta"><span className="category-tag">{item.category}</span><span>{item.version}</span></div>
          </div>
        </div>
        <span className={`badge ${item.tone}`}>{item.badge}</span>
      </div>
      <p>{item.description}</p>
      <div className="scene-line"><span>应用场景</span>{item.scene}</div>
      <div className="capability-bottom">
        <span className="vendor"><span className="vendor-avatar">{item.vendor.slice(0, 1)}</span>{item.vendor}</span>
        <span className="downloads"><DownloadIcon /> {item.downloads.toLocaleString()}</span>
      </div>
      <div className="card-actions">
        <button className="detail-button" onClick={() => onSelect(item)}>查看详情 <ArrowUpRight size={15} /></button>
        <button className="card-purchase" onClick={() => onSelect(item)}><ShoppingBag size={14} /> 立即购买</button>
      </div>
    </motion.article>
  );
}

function CapabilityDetail({ item, onClose }: { item: Capability | null; onClose: () => void }) {
  if (!item) return null;
  const Icon = item.icon;

  return (
    <DetailModal label={`${item.name}详情`} onClose={onClose}>
      <div className="detail-drawer" onClick={(event) => event.stopPropagation()}>
        <button className="drawer-close" onClick={onClose} aria-label="关闭详情"><X size={19} /></button>
        <div className="detail-product-header">
          <div className={`drawer-icon ${item.tone}`}><Icon size={22} /></div>
          <div className="detail-product-title">
            <h2>{item.name}</h2>
            <div className="detail-product-meta"><span className="category-tag">{item.category}</span><span>{item.version}</span></div>
          </div>
          <span className={`badge ${item.tone}`}>{item.badge}</span>
        </div>
        <p className="drawer-intro">{item.description}</p>
        <div className="drawer-specs">
          <div><span>所属类别</span><strong>{item.category}</strong></div>
          <div><span>发布方</span><strong>{item.vendor}</strong></div>
          <div><span>当前版本</span><strong>{item.version}</strong></div>
          <div><span>累计下载</span><strong>{item.downloads.toLocaleString()} 次</strong></div>
        </div>
        <div className="drawer-scene"><span>适用场景</span><p>{item.scene}</p></div>
        <button className="button button-primary purchase-button"><ShoppingBag size={17} /> 立即购买 <ArrowUpRight size={16} /></button>
      </div>
    </DetailModal>
  );
}

function MarketPage() {
  const [category, setCategory] = useState('全部');
  const [query, setQuery] = useState('');
  const [selected, setSelected] = useState<typeof capabilities[number] | null>(null);
  const categories = ['全部', '应用插件', '设备协议', '算法策略', '硬件部件'];
  const filtered = useMemo(() => capabilities.filter((item) => (category === '全部' || item.category === category) && `${item.name}${item.vendor}${item.scene}`.toLowerCase().includes(query.toLowerCase())), [category, query]);
  return <section className="market-page"><div className="market-hero"><div><h1>工业能力市场</h1><p>连接应用、设备、算法与硬件，让每项工业能力都能快速落地。</p></div><div className="market-hero-actions"><button className="market-action" aria-label="采购订单"><ClipboardList size={18} /><span>采购订单</span></button><button className="market-action" aria-label="购物车"><ShoppingCart size={18} /><span>购物车</span><b>2</b></button></div></div><div className="market-layout"><aside className="market-sidebar"><div className="sidebar-title"><span>热门能力</span></div><p>按累计下载量排序</p>{capabilities.slice(0, 4).map((item, index) => <button className="rank-item" key={item.name} onClick={() => setSelected(item)}><span className="rank-number">0{index + 1}</span><span className="rank-copy"><strong>{item.name}</strong><small>{item.category} · {item.downloads.toLocaleString()} 次下载</small></span><ArrowUpRight size={15} /></button>)}<div className="sidebar-foot"><Tag size={15} /> 资源均经过安全审核</div></aside><div className="market-content"><div className="market-toolbar"><div className="search-box"><Search size={18} /><input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="搜索能力名称、厂商或应用场景" aria-label="搜索能力" /></div><button className="sort-button"><SlidersHorizontal size={16} /> 下载量排序</button></div><div className="category-row"><div className="category-tabs">{categories.map((item) => <button key={item} className={category === item ? 'active' : ''} onClick={() => setCategory(item)}>{item}</button>)}</div><span className="result-count">共 {filtered.length} 项能力</span></div>{filtered.length ? <div className="capability-grid">{filtered.map((item, index) => <CapabilityCard key={item.name} item={item} index={index} onSelect={setSelected} />)}</div> : <div className="empty-state"><Filter size={25} /><h3>没有找到匹配能力</h3><p>试试更换关键词或分类筛选。</p></div>}</div></div><CapabilityDetail item={selected} onClose={() => setSelected(null)} /></section>;
}
function DownloadIcon() { return <Download size={14} />; }

export default function App() {
  const [page, setPage] = useState<'home' | 'market' | 'developer' | 'developer2' | 'equipment' | 'community' | 'academy'>('home');
  const [platformOpen, setPlatformOpen] = useState(() => window.location.hash === '#developer-platform');
  const [equipmentVisit, setEquipmentVisit] = useState(0);
  const [initialDevice, setInitialDevice] = useState<Equipment | null>(null);
  useEffect(() => {
    const syncPlatformRoute = () => {
      setPlatformOpen(window.location.hash === '#developer-platform');
      window.scrollTo(0, 0);
    };
    window.addEventListener('hashchange', syncPlatformRoute);
    return () => window.removeEventListener('hashchange', syncPlatformRoute);
  }, []);
  const activeNavLabel = { home: '首页', market: '插件商城', developer: '开放平台', developer2: '开放平台2', equipment: '设备商城', community: '社区', academy: '墨影学院' }[page];
  const navigateTo = (nextPage: 'home' | 'market' | 'developer' | 'developer2' | 'equipment' | 'community' | 'academy') => {
    if (nextPage === 'equipment') setEquipmentVisit(value => value + 1);
    setPage(nextPage);
    window.scrollTo(0, 0);
  };
  if (platformOpen) {
    return (
      <Suspense fallback={<div className="es-viewer-loading" role="status">正在打开开发者平台…</div>}>
        <DeveloperPlatformPage onBack={() => { window.location.hash = 'top'; }} />
      </Suspense>
    );
  }
  return (
    <main id="top" className="site-shell">
      <header className="site-header">
        <nav className="nav-shell" aria-label="主导航">
          <Logo />
          <div className="nav-capsule">
            {navigation.map(({ label, icon: Icon }) => (
              <button
                className={`nav-link ${
                  activeNavLabel === label
                    ? 'is-current'
                    : ''
                }`}
                aria-current={activeNavLabel === label ? 'page' : undefined}
                key={label}
                onClick={() => {
                  if (label === '插件商城') navigateTo('market');
                  else if (label === '首页') navigateTo('home');
                  else if (label === '开放平台') navigateTo('developer');
                  else if (label === '开放平台2') navigateTo('developer2');
                  else if (label === '墨影学院') navigateTo('academy');
                  else if (label === '设备商城') { setInitialDevice(null); navigateTo('equipment'); }
                  else if (label === '社区') navigateTo('community');
                }}
              >
                <Icon size={15} strokeWidth={1.8} />
                {label}
              </button>
            ))}
          </div>
          <div className="nav-actions">
            <button className="icon-button" aria-label="帮助中心"><CircleHelp size={19} /></button>
            <button className="button button-quiet">登录</button>
            <button className="button button-primary nav-cta-pill" onClick={() => { window.location.hash = 'developer-platform'; }}>
              开发者平台 <ArrowUpRight size={15} />
            </button>
            <button className="menu-button" aria-label="打开菜单"><Menu size={21} /></button>
          </div>
        </nav>
      </header>
      {page === 'developer' ? (
        <DeveloperMarketPlatform onSwitchToDev2={() => navigateTo('developer2')} />
      ) : page === 'developer2' ? (
        <DeveloperCenterPage onBack={() => navigateTo('home')} onSwitchToPlatform1={() => navigateTo('developer')} />
      ) : page === 'equipment' ? (
        <Suspense fallback={<div className="es-viewer-loading">正在打开设备商城…</div>}><EquipmentStorePage key={`${equipmentVisit}-${initialDevice?.name || 'catalog'}`} initialDevice={initialDevice} onBack={() => navigateTo('home')} /></Suspense>
      ) : page === 'market' ? (
        <MarketPage />
      ) : page === 'community' ? (
        <CommunityPage onBackToPlatform={() => navigateTo('developer')} />
      ) : page === 'academy' ? (
        <AcademyPage onBackToHome={() => navigateTo('home')} onOpenCommunity={() => navigateTo('community')} />
      ) : (
        <HomePage onMarket={() => navigateTo('market')} onDeveloperCenter={() => navigateTo('developer')} onEquipmentStore={() => { setInitialDevice(null); navigateTo('equipment'); }} onDevice={device => { setInitialDevice(device); navigateTo('equipment'); }} />
      )}
    </main>
  );
}
