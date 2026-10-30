import React, { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Search,
  SlidersHorizontal,
  ArrowUpRight,
  ArrowLeft,
  X,
  MessageSquare,
  Eye,
  Bookmark,
  Share2,
  CheckCircle2,
  HelpCircle,
  Sparkles,
  Flame,
  Award,
  Send,
  Plus,
  Tag,
  Clock,
  User,
  Check,
  ChevronRight,
  Filter,
  ExternalLink,
  Bot,
  Cpu,
  Layers,
  ShieldCheck,
  Code2,
} from 'lucide-react';
import './CommunityPage.css';

export type PostCategory =
  | '全部'
  | '社区动态'
  | '活动与赛事'
  | '开发问答'
  | '设备适配'
  | '方案共创'
  | '案例分享'
  | '新品内测';

export type PostType = 'all' | 'help' | 'share' | 'featured' | 'solved' | 'bookmarked';

export interface PostComment {
  id: string;
  author: string;
  role: string;
  avatarText: string;
  avatarBg?: string;
  createdAt: string;
  content: string;
  isSolution?: boolean;
  likes: number;
}

export interface CommunityPost {
  id: string;
  title: string;
  summary: string;
  content: string[];
  codeSnippet?: {
    language: string;
    code: string;
  };
  category: Exclude<PostCategory, '全部'>;
  type: 'help' | 'share' | 'dynamic';
  isFeatured?: boolean;
  isSolved?: boolean;
  author: {
    name: string;
    role: string;
    avatarText: string;
    avatarBg?: string;
    badge?: string;
  };
  createdAt: string;
  updatedAt: string;
  tags: string[];
  views: number;
  repliesCount: number;
  likesCount: number;
  comments: PostComment[];
}

export interface Contributor {
  rank: string;
  name: string;
  role: string;
  points: number;
  solvedCount: number;
  avatarText: string;
  badge: string;
  avatarColor: string;
}

// 预设真实可信的百川机器人开发者社区讨论帖子
const INITIAL_POSTS: CommunityPost[] = [
  {
    id: 'post-1',
    title: '【已解决】百川 SDK v0.2.0 中 Modbus TCP 驱动在产线强电磁干扰下的断连自动重试与心跳机制如何调优？',
    summary: '产线焊接机高频引弧工况下，AMR 底盘 Modbus TCP 从站偶发通信超时，通过重试回退退避算法及自定义心跳检测包成功实现 15ms 内无感自愈。',
    content: [
      '在某新能源电池托盘焊接工位部署 AMR 时，焊接机高频引弧瞬间会产生强烈空间电磁辐射，导致 Modbus TCP 驱动（端口 502）偶发丢包，原默认 3000ms 超时容易触发安全停车。',
      '经过与墨影官方架构师联合排查，在百川 OS 的 `/etc/baichuan/drivers/modbus.json` 调整了重试与指数退避策略，并开启了微秒级内核心跳保活。',
      '优化方案已通过 72 小时连续满载压力测试，通信故障自愈率达到 100%，无一次意外急停。现将配置与重连拦截器代码开源分享给大家。',
    ],
    codeSnippet: {
      language: 'typescript',
      code: `// 百川 SDK Modbus 连接池心跳与自愈配置
import { BaichuanModbusClient, RetryPolicy } from '@moying/baichuan-sdk';

export const modbusClient = new BaichuanModbusClient({
  host: '192.168.10.45',
  port: 502,
  timeoutMs: 800, // 缩短单次判定时间
  retryPolicy: RetryPolicy.exponentialBackoff({
    maxRetries: 4,
    initialDelayMs: 20,
    maxDelayMs: 200,
  }),
  heartbeat: {
    intervalMs: 1000,
    register: 0x0020, // 保活心跳寄存器
    expectedAck: 0xAA55,
  },
  onDisconnect: async (reason) => {
    console.warn('[Modbus] 发生瞬态扰动，启动微秒级自愈策略:', reason);
  }
});`,
    },
    category: '设备适配',
    type: 'help',
    isFeatured: true,
    isSolved: true,
    author: {
      name: '陈工',
      role: '灵巧智造 · 资深自控工程师',
      avatarText: '陈',
      avatarBg: '#4f46e5',
      badge: '认证厂商',
    },
    createdAt: '2 小时前',
    updatedAt: '10 分钟前',
    tags: ['Modbus TCP', '硬件适配', '通信自愈', '百川SDK v0.2.0'],
    views: 1840,
    repliesCount: 6,
    likesCount: 58,
    comments: [
      {
        id: 'c1',
        author: '墨影架构组-李工',
        role: '墨影官方 · 核心驱动架构师',
        avatarText: '墨',
        avatarBg: '#4f46e5',
        createdAt: '1 小时前',
        content: '陈工给出的指数退避参数非常经典！在百川 OS 2.1 补丁中，我们已将该配置固化为高抗扰工业模板，推荐在重工产线默认启用。',
        isSolution: true,
        likes: 24,
      },
      {
        id: 'c2',
        author: '张伟',
        role: '华东系统集成方案架构师',
        avatarText: '张',
        createdAt: '45 分钟前',
        content: '非常及时！我们现场西门子 S7-1500 也有类似偶发掉线，照此修改后 ping 抖动彻底抹平了。点赞！',
        likes: 9,
      },
      {
        id: 'c3',
        author: 'RoboDev-Leo',
        role: '机器人本体调试员',
        avatarText: 'L',
        createdAt: '20 分钟前',
        content: '请问如果是多台从站轮询，这个心跳包会占用总线带宽导致动作指令延迟吗？',
        likes: 3,
      },
      {
        id: 'c4',
        author: '陈工',
        role: '灵巧智造 · 资深自控工程师',
        avatarText: '陈',
        avatarBg: '#4f46e5',
        createdAt: '12 分钟前',
        content: '@RoboDev-Leo 不会，因为心跳包走的是带外低优先级时间片，百川编排引擎具备严格的微秒级抢占保障。',
        likes: 7,
      },
    ],
  },
  {
    id: 'post-2',
    title: '【精华】基于百川行为树（BehaviorTree）的协作臂微米级视觉对齐与柔顺插入节点实践',
    summary: '针对 3C 紧固件装配中孔位公差小于 0.05mm 的场景，设计了结合视觉位姿粗定位与六维力控柔顺微调的行为树复合 ActionNode。',
    content: [
      '在精密电子工件装配线中，单纯依赖 2D/3D 相机受环境反光和机械臂重复定位精度限制，往往难以满足 0.03mm 的高精插件要求。',
      '我们基于百川 OS 的 `ActionNode` 基类构建了 `HybridPrecisionInsertNode`，第一阶段通过相机坐标系变换引导机械臂快速逼近；第二阶段切换为阻抗控制模式，依据六维力矩传感器读数动态补偿姿态。',
      '整体工作流被打包为可复用的 BehaviorTree 插件，已正式上架百川插件商城，支持在天工调度系统中拖拽式可视化编排。',
    ],
    codeSnippet: {
      language: 'typescript',
      code: `import { ActionNode, NodeStatus, BaichuanSDK } from '@moying/baichuan-sdk';

export class PrecisionInsertAction extends ActionNode {
  static readonly nodeType = 'action.manipulator.precision_insert';

  private robot = BaichuanSDK.useRobot();
  private ftSensor = BaichuanSDK.useForceTorqueSensor();

  async onTick(): Promise<NodeStatus> {
    const currentForce = await this.ftSensor.readVectorZ();
    if (currentForce > 12.5) {
      // 触发阻抗回退与微调旋转
      await this.robot.spiralSearch({ stepMm: 0.02, maxRadiusMm: 1.5 });
    }
    return NodeStatus.SUCCESS;
  }
}`,
    },
    category: '方案共创',
    type: 'share',
    isFeatured: true,
    isSolved: false,
    author: {
      name: '林工',
      role: '墨影工坊 · 机器人运动规划专家',
      avatarText: '林',
      avatarBg: '#4f46e5',
      badge: '生态布道师',
    },
    createdAt: '昨天 16:30',
    updatedAt: '3 小时前',
    tags: ['机械臂', '行为树', '力控装配', '机器视觉', '方案共创'],
    views: 3260,
    repliesCount: 12,
    likesCount: 94,
    comments: [
      {
        id: 'c2-1',
        author: '精密机械研发-老王',
        role: '某精密设备厂首席工程师',
        avatarText: '王',
        createdAt: '昨天 19:10',
        content: '螺旋寻孔算法的收敛速度如何？对于有倒角的孔位，耗时能控制在多少秒以内？',
        likes: 11,
      },
      {
        id: 'c2-2',
        author: '林工',
        role: '墨影工坊 · 机器人运动规划专家',
        avatarText: '林',
        avatarBg: '#4f46e5',
        createdAt: '昨天 20:05',
        content: '实测 0.5mm 倒角情况下，单次螺旋寻孔对齐平均耗时在 0.38s ~ 0.55s 之间，相比纯盲插效率提升近 3 倍。',
        likes: 18,
      },
    ],
  },
  {
    id: 'post-3',
    title: '百川 3D SLAM 点云地图与厂区建筑 CAD/BIM 图纸的高精度快速标定工具已开源',
    summary: '解决厂区实际激光点云与建筑图纸坐标系不一致的问题，提供自动特征提取、ICP 迭代配准及拓扑站点对齐的一键式桌面工具。',
    content: [
      '现场交付工程师经常面临的问题：AMR 建图建立的局部点云地图，和甲方的工厂 WGS84 或局部建筑坐标系存在几米到几十米的偏差以及微小角度旋转。',
      '传统人工打靶点或手动对齐费时费力，且一旦厂区局部隔断改造就需要重新标定。',
      '本工具支持直接导入 DXF/DWG 格式的建筑底图和百川 OS 导出的 `.ply`/`.pcd` 点云文件，基于法向量柱面特征完成粗配准，结合 Robust ICP 自动收敛，平均误差 < 5mm。',
    ],
    category: '开发问答',
    type: 'share',
    isFeatured: false,
    isSolved: false,
    author: {
      name: '张博士',
      role: '智行感知实验室 · SLAM研究员',
      avatarText: '张',
      avatarBg: '#059669',
      badge: '核心贡献者',
    },
    createdAt: '2 天前',
    updatedAt: '1 天前',
    tags: ['3D SLAM', '点云地图', 'CAD配准', '开源工具'],
    views: 2150,
    repliesCount: 8,
    likesCount: 73,
    comments: [
      {
        id: 'c3-1',
        author: '智造交付部-小刘',
        role: '现场实施工程师',
        avatarText: '刘',
        createdAt: '1 天前',
        content: '太实用了！昨天正好在 3 万平的汽车焊装车间试了一下，半小时就完成了原本需要一整天的全厂对齐！',
        likes: 14,
      },
    ],
  },
  {
    id: 'post-4',
    title: '【求助】天工调度系统下发任务时，多台 AMR 在窄通道交叉路口的动态交管死锁如何规避？',
    summary: '现场有两条 1.8 米宽的单向交替通道，高峰期 6 台 AMR 偶发在交叉口互相对峙，交管锁释放时序似乎存在竞争。',
    content: [
      '车间南北向和东西向主干道交汇处是一个十字路口，由于两侧堆放货架，通道净宽仅容单车通过。',
      '目前我们在天工交管中配置了「互斥交通区（MutexZone）」，但当两台 AMR 同时到达临界申请点时，偶发出现双方均判定对方占用而同时倒车或等待超时。',
      '请教各位专家，如何通过百川拓扑地图中的虚拟信号灯或动态权重规避这种死锁现象？',
    ],
    category: '开发问答',
    type: 'help',
    isFeatured: false,
    isSolved: true,
    author: {
      name: '赵工',
      role: '华东智能仓储 · 调度系统主管',
      avatarText: '赵',
      avatarBg: '#d97706',
    },
    createdAt: '3 天前',
    updatedAt: '2 天前',
    tags: ['AMR调度', '天工系统', '交通管制', '死锁预防'],
    views: 1980,
    repliesCount: 9,
    likesCount: 39,
    comments: [
      {
        id: 'c4-1',
        author: '墨影调度组-孙工',
        role: '墨影官方 · 天工调度算法专家',
        avatarText: '孙',
        avatarBg: '#4f46e5',
        createdAt: '2 天前',
        content: '建议采用「单向优先路权（One-Way Priority）」+「虚拟缓冲区（Buffer Node）」模式。在互斥区前置 3 米处设置不可停留的决策触发线，基于车身任务紧急度动态仲裁路权。详细配置已私信发送。',
        isSolution: true,
        likes: 29,
      },
      {
        id: 'c4-2',
        author: '赵工',
        role: '华东智能仓储 · 调度系统主管',
        avatarText: '赵',
        avatarBg: '#d97706',
        createdAt: '2 天前',
        content: '感谢孙工！按照设置决策线后，早班峰值 200 箱出入库测试中没有发生一次交管死锁，效果立竿见影！标记为已解决。',
        likes: 15,
      },
    ],
  },
  {
    id: 'post-5',
    title: '【官方动态】2026 百川开发者共创计划第一期：工业具身智能与柔性抓取专项激励启动',
    summary: '设立百万元开发者激励奖金池，针对视觉抓取、异构协议转换及工艺插件开发者提供技术辅导、沙箱算力与商业落地支持。',
    content: [
      '为进一步繁荣百川机器人开放生态，墨影科技联合产业基金启动「2026 百川开发者共创计划（第一期）」。',
      '本次专项重点支持以下技术方向：',
      '1. 复杂杂乱工件的高鲁棒 3D 视觉抓取姿态估计模型插件；',
      '2. 工业总线与新型通信协议（如 EtherCAT、CANopen、Profinet）的原生接入适配；',
      '3. 基于百川 AI Skills 的自然语言自动化工况代码生成。',
      '入选团队将获得官方架构师一对一技术支持，成果上架百川插件商城将享受高额收益分成及首批企业项目订单直推！',
    ],
    category: '社区动态',
    type: 'dynamic',
    isFeatured: true,
    isSolved: false,
    author: {
      name: '百川生态运营团队',
      role: '墨影科技 · 开发者关系部',
      avatarText: '墨',
      avatarBg: '#4f46e5',
      badge: '官方公告',
    },
    createdAt: '3 天前',
    updatedAt: '3 天前',
    tags: ['官方活动', '开发者激励', '具身智能', '生态共建'],
    views: 4520,
    repliesCount: 18,
    likesCount: 168,
    comments: [
      {
        id: 'c5-1',
        author: '大学机器人实验室-周同学',
        role: '高校具身智能研究生',
        avatarText: '周',
        createdAt: '3 天前',
        content: '请问高校团队可以申报吗？有提供远程虚拟仿真沙箱做硬件无关性测试吗？',
        likes: 12,
      },
      {
        id: 'c5-2',
        author: '百川生态运营团队',
        role: '墨影科技 · 开发者关系部',
        avatarText: '墨',
        avatarBg: '#4f46e5',
        createdAt: '3 天前',
        content: '完全可以！我们为高校科研团队提供免费的百川云端仿真集群权限，欢迎提交申报！',
        likes: 21,
      },
    ],
  },
  {
    id: 'post-6',
    title: '【新品内测】百川 AI Skills 插件代码生成器（Dev Preview 版）开放申请，欢迎体验！',
    summary: '仅需一段工业工艺自然语言描述，即可自动生成合规的百川 TS 插件工程、行为树节点定义与状态机测试用例。',
    content: [
      '我们在百川开发体系中全新引入了 AI Skills 辅助流水线。针对开发者编写繁琐样板代码的痛点，内测版代码生成器现已支持：',
      '• 输入：「创建一个监听光电传感器并在检测到料盘后控制机械臂吸取的行为树节点」；',
      '• 自动生成：完整的 TypeScript 类继承、入参校验、异常安全锁及单元测试 Stub。',
      '诚邀广大开发者参与体验并反馈优化建议！',
    ],
    category: '新品内测',
    type: 'share',
    isFeatured: true,
    isSolved: false,
    author: {
      name: 'AI Tooling Team',
      role: '墨影研发 · AI 工具链团队',
      avatarText: 'AI',
      avatarBg: '#6366f1',
      badge: '官方新品',
    },
    createdAt: '4 天前',
    updatedAt: '4 天前',
    tags: ['AI Skills', '代码生成', '工具链', '内测邀请'],
    views: 3890,
    repliesCount: 23,
    likesCount: 142,
    comments: [],
  },
  {
    id: 'post-7',
    title: '【案例复盘】某 3C 龙头产线 48 台 AMR 混合编队调度与 PLC 实时联锁交付实战',
    summary: '全流程记录从线边仓叫料、高精度接驳、卷帘门风淋室通行到与 MES 系统的全链路打通经验与填坑记录。',
    content: [
      '本项目涵盖顶升 AMR、潜伏牵引 AMR 及复合机器人共 48 台，涉及 6 种不同工艺机台的无缝对接。',
      '重点攻克了以下几个关键难题：',
      '1. 卷帘门与风淋室的软硬件双冗余防夹机制；',
      '2. 大规模局域网内 WiFi 快速漫游掉包的边缘补传协议；',
      '3. 与欧姆龙及三菱 PLC 握手信号的时序容错。',
      '总结成 10 条现场实施铁律，希望为同行提供参考。',
    ],
    category: '案例分享',
    type: 'share',
    isFeatured: false,
    isSolved: false,
    author: {
      name: '周工',
      role: '智造交付部 · 高级实施架构师',
      avatarText: '周',
      avatarBg: '#0284c7',
      badge: '金牌交付',
    },
    createdAt: '5 天前',
    updatedAt: '5 天前',
    tags: ['3C产线', '大型编队', 'PLC联锁', '交付复盘'],
    views: 2840,
    repliesCount: 15,
    likesCount: 88,
    comments: [],
  },
  {
    id: 'post-8',
    title: '【活动与赛事】2026 墨影开发者黑客松：工业机器人具身智能创新挑战赛正式开启报名',
    summary: '总奖金 50 万元，聚焦产线无序抓取、跨工位柔性协同及数字孪生实时仿真，全国四大赛区同步启动。',
    content: [
      '由工业自动化产业联盟联合墨影科技共同举办的「2026 墨影黑客松」正式启动！',
      '比赛提供真实的工业场景测试机房与百川 OS 机器人全套软硬件平台。欢迎各类机器人软硬件极客、高校战队组队参赛！',
      '优秀项目可获得孵化资金及百万级工业场景落地验证机会。',
    ],
    category: '活动与赛事',
    type: 'dynamic',
    isFeatured: false,
    isSolved: false,
    author: {
      name: '黑客松组委会',
      role: '赛事官方运营',
      avatarText: '赛',
      avatarBg: '#d97706',
      badge: '赛事官方',
    },
    createdAt: '1 周前',
    updatedAt: '1 周前',
    tags: ['黑客松', '具身智能', '创新挑战赛', '开发者活动'],
    views: 3100,
    repliesCount: 7,
    likesCount: 95,
    comments: [],
  },
];

// 本月贡献者排行榜数据
const MONTHLY_CONTRIBUTORS: Contributor[] = [
  {
    rank: '01',
    name: '林工 (墨影工坊)',
    role: '机器人运动规划专家 · 生态布道师',
    points: 3420,
    solvedCount: 46,
    avatarText: '林',
    badge: '月度领航者',
    avatarColor: '#4f46e5',
  },
  {
    rank: '02',
    name: '张博士 (智行感知)',
    role: '3D SLAM 与感知算法专家',
    points: 2980,
    solvedCount: 38,
    avatarText: '张',
    badge: '算法大师',
    avatarColor: '#059669',
  },
  {
    rank: '03',
    name: '陈工 (灵巧智造)',
    role: '自控与硬件协议适配专家',
    points: 2740,
    solvedCount: 35,
    avatarText: '陈',
    badge: '硬件极客',
    avatarColor: '#d97706',
  },
  {
    rank: '04',
    name: '周工 (智造交付)',
    role: '大型产线交管编队工程师',
    points: 2190,
    solvedCount: 27,
    avatarText: '周',
    badge: '实战专家',
    avatarColor: '#0284c7',
  },
  {
    rank: '05',
    name: '李晨 (灵巧控制)',
    role: '力控与视觉伺服开发者',
    points: 1850,
    solvedCount: 22,
    avatarText: '李',
    badge: '活跃贡献者',
    avatarColor: '#7c3aed',
  },
];

interface CommunityPageProps {
  onBackToPlatform?: () => void;
}

export function CommunityPage({ onBackToPlatform }: CommunityPageProps) {
  // 数据与交互状态
  const [posts, setPosts] = useState<CommunityPost[]>(INITIAL_POSTS);
  const [selectedCategory, setSelectedCategory] = useState<PostCategory>('全部');
  const [selectedType, setSelectedType] = useState<PostType>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'reply' | 'newest' | 'views'>('reply');

  // 抽屉详情与评论交互状态
  const [activePostId, setActivePostId] = useState<string | null>(null);
  const [replyInput, setReplyInput] = useState('');
  const [bookmarkedIds, setBookmarkedIds] = useState<Set<string>>(new Set(['post-1', 'post-2']));

  // 发起讨论弹窗状态
  const [isPublishModalOpen, setIsPublishModalOpen] = useState(false);
  const [publishForm, setPublishForm] = useState({
    title: '',
    category: '开发问答' as Exclude<PostCategory, '全部'>,
    type: 'help' as 'help' | 'share',
    tags: '',
    content: '',
  });

  // 全局轻量 Toast 提示
  const [toastMessage, setToastMessage] = useState<string>('');

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(''), 3000);
  };

  // 支持按 Esc 键快捷收起抽屉与关闭弹窗
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setActivePostId(null);
        setIsPublishModalOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // 收藏切换（保持卡片与抽屉实时严格同步）
  const toggleBookmark = (postId: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setBookmarkedIds(prev => {
      const next = new Set(prev);
      if (next.has(postId)) {
        next.delete(postId);
        showToast('已取消收藏');
      } else {
        next.add(postId);
        showToast('已加入我的收藏');
      }
      return next;
    });
  };

  // 提交讨论回复
  const handleAddComment = () => {
    if (!replyInput.trim() || !activePostId) return;

    const newComment: PostComment = {
      id: `comment-${Date.now()}`,
      author: '我 (开发者)',
      role: '百川注册开发者',
      avatarText: '我',
      avatarBg: '#4f46e5',
      createdAt: '刚刚',
      content: replyInput.trim(),
      likes: 0,
    };

    setPosts(prev =>
      prev.map(p => {
        if (p.id === activePostId) {
          return {
            ...p,
            repliesCount: p.repliesCount + 1,
            updatedAt: '刚刚',
            comments: [...p.comments, newComment],
          };
        }
        return p;
      })
    );

    setReplyInput('');
    showToast('回复已成功发布！');
  };

  // 提交新建讨论
  const handlePublishPost = (e: React.FormEvent) => {
    e.preventDefault();
    if (!publishForm.title.trim() || !publishForm.content.trim()) {
      showToast('请完整填写标题与讨论内容');
      return;
    }

    const tagList = publishForm.tags
      .split(/[,，\s]+/)
      .map(t => t.trim())
      .filter(Boolean);

    const newPost: CommunityPost = {
      id: `post-${Date.now()}`,
      title: publishForm.title.trim(),
      summary: publishForm.content.trim().slice(0, 100) + '...',
      content: publishForm.content.split('\n\n').filter(Boolean),
      category: publishForm.category,
      type: publishForm.type,
      isFeatured: false,
      isSolved: false,
      author: {
        name: '我 (开发者)',
        role: '百川生态开发者',
        avatarText: '我',
        avatarBg: '#4f46e5',
        badge: '创作者',
      },
      createdAt: '刚刚',
      updatedAt: '刚刚',
      tags: tagList.length ? tagList : ['技术讨论'],
      views: 1,
      repliesCount: 0,
      likesCount: 1,
      comments: [],
    };

    setPosts(prev => [newPost, ...prev]);
    setIsPublishModalOpen(false);
    setPublishForm({
      title: '',
      category: '开发问答',
      type: 'help',
      tags: '',
      content: '',
    });
    showToast('技术讨论发布成功！');
    setActivePostId(newPost.id); // 自动打开新建帖子的详情
  };

  // 当前打开的帖子详情
  const activePost = useMemo(() => {
    return posts.find(p => p.id === activePostId) || null;
  }, [posts, activePostId]);

  // 过滤与排序列表
  const filteredPosts = useMemo(() => {
    return posts
      .filter(post => {
        // 分类筛选
        if (selectedCategory !== '全部' && post.category !== selectedCategory) {
          return false;
        }
        // 帖子类型筛选
        if (selectedType === 'help' && post.type !== 'help') return false;
        if (selectedType === 'share' && post.type !== 'share') return false;
        if (selectedType === 'featured' && !post.isFeatured) return false;
        if (selectedType === 'solved' && !post.isSolved) return false;
        if (selectedType === 'bookmarked' && !bookmarkedIds.has(post.id)) return false;

        // 关键词搜索（支持匹配标题、正文、作者姓名、标签）
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase().trim();
          const matchTitle = post.title.toLowerCase().includes(q);
          const matchSummary = post.summary.toLowerCase().includes(q);
          const matchAuthor = post.author.name.toLowerCase().includes(q);
          const matchTags = post.tags.some(t => t.toLowerCase().includes(q));
          if (!matchTitle && !matchSummary && !matchAuthor && !matchTags) {
            return false;
          }
        }
        return true;
      })
      .sort((a, b) => {
        if (sortBy === 'newest') return b.createdAt.localeCompare(a.createdAt);
        if (sortBy === 'views') return b.views - a.views;
        // 默认按回复热度
        return b.repliesCount - a.repliesCount;
      });
  }, [posts, selectedCategory, selectedType, searchQuery, sortBy, bookmarkedIds]);

  const categories: PostCategory[] = [
    '全部',
    '社区动态',
    '活动与赛事',
    '开发问答',
    '设备适配',
    '方案共创',
    '案例分享',
    '新品内测',
  ];

  return (
    <div className="community-page">
      {/* 社区顶部 Hero 与核心指标看板 */}
      <header className="community-hero">
        <div className="community-hero-main">
          <h1 className="community-hero-title">开发者社区</h1>
          <p className="community-hero-desc">
            面向机器人开发者、设备厂商、系统集成商及技术工程师，提供技术交流、问题求助、经验分享与方案共创平台。
          </p>

          <div className="community-hero-metrics">
            <div className="metric-box">
              <span className="metric-num">1,428+</span>
              <span className="metric-label">技术讨论</span>
            </div>
            <div className="metric-divider" />
            <div className="metric-box">
              <span className="metric-num highlight">95.2%</span>
              <span className="metric-label">问题解决率</span>
            </div>
            <div className="metric-divider" />
            <div className="metric-box">
              <span className="metric-num">186+</span>
              <span className="metric-label">共创技术方案</span>
            </div>
            <div className="metric-divider" />
            <div className="metric-box">
              <span className="metric-num">320+</span>
              <span className="metric-label">活跃开发者</span>
            </div>
          </div>
        </div>
      </header>

      {/* 核心双栏架构：左侧讨论主体 + 右侧贡献者与社区指南 */}
      <div className="community-layout">
        {/* 左侧讨论主体 */}
        <main className="community-main">
          {/* 1. 分类筛选 Tabs */}
          <div className="community-category-row">
            <div className="community-categories">
              {categories.map(cat => (
                <button
                  key={cat}
                  className={`category-tab ${selectedCategory === cat ? 'active' : ''}`}
                  onClick={() => setSelectedCategory(cat)}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {/* 2. 二级状态筛选胶囊 */}
          <div className="community-subfilter-row">
            <div className="subfilter-capsules">
              <button
                className={`subfilter-pill ${selectedType === 'all' ? 'active' : ''}`}
                onClick={() => setSelectedType('all')}
              >
                全部帖子
              </button>
              <button
                className={`subfilter-pill ${selectedType === 'help' ? 'active' : ''}`}
                onClick={() => setSelectedType('help')}
              >
                <HelpCircle size={13} /> 求助帖
              </button>
              <button
                className={`subfilter-pill ${selectedType === 'share' ? 'active' : ''}`}
                onClick={() => setSelectedType('share')}
              >
                <Sparkles size={13} /> 分享帖
              </button>
              <button
                className={`subfilter-pill ${selectedType === 'featured' ? 'active' : ''}`}
                onClick={() => setSelectedType('featured')}
              >
                <Flame size={13} /> 精华
              </button>
              <button
                className={`subfilter-pill ${selectedType === 'solved' ? 'active' : ''}`}
                onClick={() => setSelectedType('solved')}
              >
                <CheckCircle2 size={13} /> 已解决
              </button>
              <button
                className={`subfilter-pill ${selectedType === 'bookmarked' ? 'active' : ''}`}
                onClick={() => setSelectedType('bookmarked')}
              >
                <Bookmark size={13} /> 我的收藏 ({bookmarkedIds.size})
              </button>
            </div>
            <span className="community-result-count">共 {filteredPosts.length} 篇讨论</span>
          </div>

          {/* 3. 标签下方：搜索 + 排序筛选 + 发起技术讨论 */}
          <div className="community-toolbar">
            <div className="community-search-box">
              <Search size={17} />
              <input
                type="text"
                placeholder="搜索问题关键词、标签（如 SLAM、Modbus）或作者..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
              />
              {searchQuery && (
                <button
                  className="search-clear-btn"
                  onClick={() => setSearchQuery('')}
                  title="清除"
                >
                  <X size={14} />
                </button>
              )}
            </div>

            <div className="community-toolbar-actions">
              <div className="community-sort-group">
                <button
                  className={`sort-tab ${sortBy === 'reply' ? 'active' : ''}`}
                  onClick={() => setSortBy('reply')}
                >
                  最近回复
                </button>
                <button
                  className={`sort-tab ${sortBy === 'newest' ? 'active' : ''}`}
                  onClick={() => setSortBy('newest')}
                >
                  最新发布
                </button>
                <button
                  className={`sort-tab ${sortBy === 'views' ? 'active' : ''}`}
                  onClick={() => setSortBy('views')}
                >
                  最多浏览
                </button>
              </div>

              <button
                className="comm-btn comm-btn-primary"
                onClick={() => setIsPublishModalOpen(true)}
              >
                <Plus size={16} /> 发起技术讨论
              </button>
            </div>
          </div>

          {/* 讨论卡片列表 */}
          {filteredPosts.length > 0 ? (
            <div className="community-post-list">
              {filteredPosts.map(post => {
                const isBookmarked = bookmarkedIds.has(post.id);
                return (
                  <article
                    key={post.id}
                    className={`comm-card ${activePostId === post.id ? 'is-active' : ''}`}
                    onClick={() => setActivePostId(prev => (prev === post.id ? null : post.id))}
                  >
                    <div className="comm-card-header">
                      <div className="comm-card-badges">
                        <span className="comm-chip comm-chip-category">{post.category}</span>
                        {post.isFeatured && (
                          <span className="comm-chip comm-chip-featured">
                            <Flame size={12} /> 精华
                          </span>
                        )}
                        {post.type === 'help' && (
                          <span className="comm-chip comm-chip-help">求助</span>
                        )}
                        {post.isSolved && (
                          <span className="comm-chip comm-chip-solved">
                            <CheckCircle2 size={12} /> 已解决
                          </span>
                        )}
                      </div>

                      <button
                        className={`comm-bookmark-btn ${isBookmarked ? 'is-bookmarked' : ''}`}
                        onClick={e => toggleBookmark(post.id, e)}
                        title={isBookmarked ? '取消收藏' : '收藏讨论'}
                      >
                        <Bookmark size={16} fill={isBookmarked ? 'currentColor' : 'none'} />
                      </button>
                    </div>

                    <h3 className="comm-card-title">{post.title}</h3>
                    <p className="comm-card-summary">{post.summary}</p>

                    {/* 标签 */}
                    <div className="comm-card-tags">
                      {post.tags.map(t => (
                        <span key={t} className="comm-tag">
                          #{t}
                        </span>
                      ))}
                    </div>

                    {/* 底栏信息：作者 + 状态数据 */}
                    <div className="comm-card-footer">
                      <div className="comm-author">
                        <div
                          className="comm-avatar"
                          style={{ background: post.author.avatarBg || '#2e2e2e' }}
                        >
                          {post.author.avatarText}
                        </div>
                        <div className="comm-author-meta">
                          <span className="comm-author-name">{post.author.name}</span>
                          <span className="comm-author-role">{post.author.role}</span>
                        </div>
                      </div>

                      <div className="comm-stats">
                        <span className="comm-stat-item" title="发布时间">
                          <Clock size={13} /> {post.createdAt}
                        </span>
                        <span className="comm-stat-item" title="浏览量">
                          <Eye size={13} /> {post.views}
                        </span>
                        <span className="comm-stat-item highlight" title="回复数">
                          <MessageSquare size={13} /> {post.repliesCount}
                        </span>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          ) : (
            <div className="comm-empty-state">
              <Filter size={32} />
              <h3>暂无匹配的技术讨论</h3>
              <p>请尝试更换分类筛选，或点击右上角「发起技术讨论」开启新的交流。</p>
            </div>
          )}
        </main>

        {/* 右侧侧边栏：本月贡献者榜单与社区快速通道 */}
        <aside className="community-sidebar">
          {/* 活跃贡献者排名 */}
          <div className="comm-sidebar-card">
            <div className="sidebar-card-header">
              <div className="sidebar-title-group">
                <Award size={18} className="title-icon" />
                <h3>本月贡献者榜单</h3>
              </div>
            </div>

            <div className="contributors-list">
              {MONTHLY_CONTRIBUTORS.map(c => (
                <div className="contributor-item" key={c.rank}>
                  <div className={`contributor-rank rank-${c.rank}`}>{c.rank}</div>
                  <div className="contributor-avatar" style={{ background: c.avatarColor }}>
                    {c.avatarText}
                  </div>
                  <div className="contributor-info">
                    <div className="contributor-name-row">
                      <span className="contributor-name">{c.name}</span>
                      <span className="contributor-badge">{c.badge}</span>
                    </div>
                    <span className="contributor-role">{c.role}</span>
                  </div>
                  <div className="contributor-points">
                    <strong>{c.points}</strong>
                  </div>
                </div>
              ))}
            </div>

            <div className="sidebar-foot-note">
              <Sparkles size={14} /> 解答技术求助或分享经认证方案可获积分加成
            </div>
          </div>

          {/* 社区规范与共创快捷链接 */}
          <div className="comm-sidebar-card">
            <div className="sidebar-card-header">
              <div className="sidebar-title-group">
                <ShieldCheck size={18} className="title-icon" />
                <h3>社区共创准则</h3>
              </div>
            </div>
            <ul className="guidelines-list">
              <li>
                <Check size={14} /> 鼓励提供可复现的完整代码段与硬件型号
              </li>
              <li>
                <Check size={14} /> 求助帖获得解决方案后请及时标记「已解决」
              </li>
              <li>
                <Check size={14} /> 优质方案可直接入选百川插件商城并获商业激励
              </li>
            </ul>

            <div className="quick-actions">
              <a
                href="#developer-platform"
                className="comm-sidebar-link"
                onClick={e => {
                  e.preventDefault();
                  if (onBackToPlatform) onBackToPlatform();
                }}
              >
                <span>查阅百川 OS 官方开发文档</span>
                <ArrowUpRight size={14} />
              </a>
              <button
                className="comm-sidebar-link"
                onClick={() => {
                  setSelectedCategory('社区动态');
                  window.scrollTo({ top: 300, behavior: 'smooth' });
                }}
              >
                <span>查看最新官方技术公告与赛事</span>
                <ChevronRight size={14} />
              </button>
            </div>
          </div>
        </aside>
      </div>

      {/* 核心交互规则 2 & 3：右侧详情抽屉 (Right Slide-over Drawer) */}
      <AnimatePresence>
        {activePost && (
          <>
            {/* 背景遮罩 */}
            <motion.div
              className="comm-drawer-backdrop"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setActivePostId(null)}
            />

            {/* 抽屉面板 */}
            <motion.aside
              className="comm-drawer"
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 28, stiffness: 300 }}
              aria-label="帖子详情与讨论抽屉"
            >
              {/* 抽屉头部导航 */}
              <div className="comm-drawer-header">
                <div className="comm-drawer-actions-left">
                  <span className="comm-chip comm-chip-category">{activePost.category}</span>
                  {activePost.isFeatured && (
                    <span className="comm-chip comm-chip-featured">
                      <Flame size={12} /> 精华
                    </span>
                  )}
                  {activePost.isSolved && (
                    <span className="comm-chip comm-chip-solved">
                      <CheckCircle2 size={12} /> 已解决
                    </span>
                  )}
                </div>

                <div className="comm-drawer-actions-right">
                  <button
                    className={`drawer-action-btn ${
                      bookmarkedIds.has(activePost.id) ? 'active' : ''
                    }`}
                    onClick={() => toggleBookmark(activePost.id)}
                    title={bookmarkedIds.has(activePost.id) ? '已收藏' : '收藏'}
                  >
                    <Bookmark
                      size={16}
                      fill={bookmarkedIds.has(activePost.id) ? 'currentColor' : 'none'}
                    />
                    <span>{bookmarkedIds.has(activePost.id) ? '已收藏' : '收藏'}</span>
                  </button>

                  <button
                    className="drawer-action-btn"
                    onClick={() => {
                      navigator.clipboard?.writeText(window.location.href);
                      showToast('讨论链接已复制到剪贴板！');
                    }}
                    title="分享"
                  >
                    <Share2 size={16} />
                  </button>

                  <button
                    className="drawer-close-btn"
                    onClick={() => setActivePostId(null)}
                    title="关闭详情"
                  >
                    <X size={18} />
                  </button>
                </div>
              </div>

              {/* 抽屉内部滚动区域 */}
              <div className="comm-drawer-scroll">
                {/* 帖子标题 */}
                <h2 className="comm-drawer-title">{activePost.title}</h2>

                {/* 发帖人信息卡片 */}
                <div className="comm-drawer-author-card">
                  <div
                    className="drawer-avatar"
                    style={{ background: activePost.author.avatarBg || '#2e2e2e' }}
                  >
                    {activePost.author.avatarText}
                  </div>
                  <div className="drawer-author-info">
                    <div className="author-name-line">
                      <strong>{activePost.author.name}</strong>
                      {activePost.author.badge && (
                        <span className="author-pill-badge">{activePost.author.badge}</span>
                      )}
                    </div>
                    <span className="author-desc">{activePost.author.role}</span>
                  </div>
                  <div className="drawer-meta-stamp">
                    <span>发布于 {activePost.createdAt}</span>
                    <small>
                      <Eye size={12} /> {activePost.views} 次浏览
                    </small>
                  </div>
                </div>

                {/* 帖子正文 */}
                <div className="comm-drawer-prose">
                  {activePost.content.map((p, idx) => (
                    <p key={idx}>{p}</p>
                  ))}

                  {/* 代码片段展示（如有） */}
                  {activePost.codeSnippet && (
                    <div className="comm-code-block">
                      <div className="comm-code-header">
                        <span className="code-lang-label">
                          <Code2 size={14} /> {activePost.codeSnippet.language}
                        </span>
                        <button
                          className="code-copy-btn"
                          onClick={() => {
                            navigator.clipboard?.writeText(activePost.codeSnippet!.code);
                            showToast('代码已复制到剪切板');
                          }}
                        >
                          复制代码
                        </button>
                      </div>
                      <pre>
                        <code>{activePost.codeSnippet.code}</code>
                      </pre>
                    </div>
                  )}
                </div>

                {/* 标签列表 */}
                <div className="comm-drawer-tags">
                  {activePost.tags.map(t => (
                    <span key={t} className="comm-tag-pill">
                      <Tag size={12} /> {t}
                    </span>
                  ))}
                </div>

                {/* 收藏与互动条 */}
                <div className="comm-drawer-reaction-bar">
                  <button
                    className={`drawer-bookmark-action ${
                      bookmarkedIds.has(activePost.id) ? 'is-bookmarked' : ''
                    }`}
                    onClick={() => toggleBookmark(activePost.id)}
                  >
                    <Bookmark
                      size={16}
                      fill={bookmarkedIds.has(activePost.id) ? 'currentColor' : 'none'}
                    />
                    <span>{bookmarkedIds.has(activePost.id) ? '已收藏此讨论' : '收藏此讨论'}</span>
                  </button>
                  <span className="reaction-note">收藏后可在「我的收藏」中随时快速查阅</span>
                </div>

                {/* 讨论与回复列表 */}
                <div className="comm-drawer-comments-section">
                  <div className="comments-section-header">
                    <h3>
                      全部回复 <span>({activePost.comments.length})</span>
                    </h3>
                  </div>

                  {activePost.comments.length > 0 ? (
                    <div className="comments-stream">
                      {activePost.comments.map(c => (
                        <div
                          key={c.id}
                          className={`comment-bubble ${c.isSolution ? 'is-solution' : ''}`}
                        >
                          <div className="comment-header">
                            <div className="comment-user">
                              <div
                                className="comment-avatar"
                                style={{ background: c.avatarBg || '#333333' }}
                              >
                                {c.avatarText}
                              </div>
                              <div>
                                <span className="comment-author-name">{c.author}</span>
                                <span className="comment-author-role">{c.role}</span>
                              </div>
                            </div>

                            {c.isSolution && (
                              <span className="solution-badge">
                                <CheckCircle2 size={13} /> 最佳答案 / 解决方案
                              </span>
                            )}
                          </div>

                          <div className="comment-body">
                            <p>{c.content}</p>
                          </div>

                          <div className="comment-footer">
                            <span className="comment-time">{c.createdAt}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="empty-comments-box">
                      <MessageSquare size={24} />
                      <p>当前暂无回复，输入下方内容成为第一个解答者吧！</p>
                    </div>
                  )}
                </div>
              </div>

              {/* 抽屉底部固定回复输入栏 */}
              <div className="comm-drawer-footer-reply">
                <div className="reply-input-wrap">
                  <textarea
                    rows={2}
                    placeholder="输入你的技术观点、排查思路或解决方案..."
                    value={replyInput}
                    onChange={e => setReplyInput(e.target.value)}
                    onKeyDown={e => {
                      if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
                        handleAddComment();
                      }
                    }}
                  />
                  <div className="reply-bottom-line">
                    <span className="reply-tip">支持快捷键 ⌘ + Enter 发布</span>
                    <button
                      className="comm-btn comm-btn-primary reply-send-btn"
                      onClick={handleAddComment}
                      disabled={!replyInput.trim()}
                    >
                      <Send size={14} /> 发布回复
                    </button>
                  </div>
                </div>
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* 发起讨论弹窗 (Publish Modal) */}
      <AnimatePresence>
        {isPublishModalOpen && (
          <div
            className="comm-modal-backdrop"
            onClick={() => setIsPublishModalOpen(false)}
          >
            <motion.div
              className="comm-modal-box"
              onClick={e => e.stopPropagation()}
              initial={{ opacity: 0, scale: 0.95, y: 16 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 16 }}
              transition={{ duration: 0.2 }}
            >
              <div className="comm-modal-header">
                <div>
                  <h2>发起技术讨论</h2>
                  <p>向机器人开发者、设备厂商与集成商提出问题或分享方案</p>
                </div>
                <button
                  className="modal-close-btn"
                  onClick={() => setIsPublishModalOpen(false)}
                >
                  <X size={18} />
                </button>
              </div>

              <form onSubmit={handlePublishPost} className="comm-modal-form">
                <div className="form-group">
                  <label>讨论标题 *</label>
                  <input
                    type="text"
                    required
                    placeholder="请简明清晰地概括问题或方案（如：【求助】关于百川 SDK 中激光 SLAM 漂移问题）"
                    value={publishForm.title}
                    onChange={e =>
                      setPublishForm({ ...publishForm, title: e.target.value })
                    }
                  />
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label>讨论分类 *</label>
                    <select
                      value={publishForm.category}
                      onChange={e =>
                        setPublishForm({
                          ...publishForm,
                          category: e.target.value as Exclude<PostCategory, '全部'>,
                        })
                      }
                    >
                      <option value="开发问答">开发问答</option>
                      <option value="设备适配">设备适配</option>
                      <option value="方案共创">方案共创</option>
                      <option value="案例分享">案例分享</option>
                      <option value="新品内测">新品内测</option>
                      <option value="社区动态">社区动态</option>
                      <option value="活动与赛事">活动与赛事</option>
                    </select>
                  </div>

                  <div className="form-group">
                    <label>帖子类型 *</label>
                    <select
                      value={publishForm.type}
                      onChange={e =>
                        setPublishForm({
                          ...publishForm,
                          type: e.target.value as 'help' | 'share',
                        })
                      }
                    >
                      <option value="help">求助帖（带已解决状态跟踪）</option>
                      <option value="share">分享帖（技术经验/工具开源）</option>
                    </select>
                  </div>
                </div>

                <div className="form-group">
                  <label>技术标签</label>
                  <input
                    type="text"
                    placeholder="输入标签，用逗号或空格隔开（如：SLAM, Modbus, 机械臂, ROS2）"
                    value={publishForm.tags}
                    onChange={e =>
                      setPublishForm({ ...publishForm, tags: e.target.value })
                    }
                  />
                </div>

                <div className="form-group">
                  <label>讨论内容与技术细节 *</label>
                  <textarea
                    rows={6}
                    required
                    placeholder="详细描述你的问题背景、环境版本、复现步骤、报错日志或方案设计..."
                    value={publishForm.content}
                    onChange={e =>
                      setPublishForm({ ...publishForm, content: e.target.value })
                    }
                  />
                </div>

                <div className="comm-modal-footer">
                  <button
                    type="button"
                    className="comm-btn comm-btn-secondary"
                    onClick={() => setIsPublishModalOpen(false)}
                  >
                    取消
                  </button>
                  <button type="submit" className="comm-btn comm-btn-primary">
                    <Send size={15} /> 立即发布讨论
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* 底部轻量 Toast 提示 */}
      {toastMessage && (
        <div className="comm-toast" role="status">
          <Check size={16} /> {toastMessage}
        </div>
      )}
    </div>
  );
}
