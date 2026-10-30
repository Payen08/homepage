import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  GraduationCap,
  BookOpen,
  Play,
  Pause,
  CheckCircle2,
  Circle,
  Clock,
  Award,
  Laptop,
  ArrowRight,
  ArrowLeft,
  ChevronRight,
  Download,
  Share2,
  HelpCircle,
  FileCode,
  FileText,
  Video,
  Sliders,
  Sparkles,
  Layers,
  Volume2,
  VolumeX,
  Maximize2,
  RotateCcw,
  ExternalLink,
  Code2,
  Check,
  Compass,
  Cpu,
  Bot,
  Terminal,
  ShieldCheck,
  FolderGit2,
} from 'lucide-react';
import './AcademyPage.css';

// 课程方向分类
export type CourseDirection =
  | '全部方向'
  | '百川插件开发入门'
  | '设备接入与能力建模'
  | '行业方案交付实训';

export type AcademyTab = 'courses' | 'paths' | 'labs' | 'certifications';

export interface CourseChapter {
  id: string;
  title: string;
  duration: string;
  durationSeconds: number;
  docReadTime?: string; // 官方技术文档预估阅读时长，如 "8 分钟阅读"
  docWordCount?: string; // 文档字数，如 "3,200 字"
  summary: string;
  objectives: string[];
  codeSnippet?: {
    language: string;
    code: string;
  };
  tips?: string[];
}

export type CourseType = 'video' | 'doc';

export interface Course {
  id: string;
  title: string;
  courseType: CourseType; // 课程形式：'video' (视频课程) | 'doc' (官方技术文档课程)
  direction: Exclude<CourseDirection, '全部方向'>;
  difficulty: '入门基础' | '进阶实战' | '专家精通';
  duration: string; // 视频展示时长如 "2.5 小时"，文档展示如 "45 分钟阅读"
  chaptersCount: number;
  wordCount?: string; // 文档课程总字数，如 "1.8 万字"
  format: string; // 如 "高清视频实操" 或 "官方权威规约手册"
  targetAudience: string;
  summary: string;
  tags: string[];
  chapters: CourseChapter[];
}

export interface RolePath {
  id: string;
  role: string;
  title: string;
  targetUser: string;
  summary: string;
  badge: string;
  iconBg: string;
  stages: {
    stageNumber: string;
    stageTitle: string;
    description: string;
    keySkills: string[];
    relatedCourseId: string;
  }[];
}

export interface ProjectLab {
  id: string;
  title: string;
  scenario: string;
  difficulty: '基础实训' | '中级挑战' | '产线级项目';
  duration: string;
  skills: string[];
  deliverables: string;
  environment: string;
  status: '可启动' | '更新中';
}

export interface Certification {
  id: string;
  level: '初级' | '中级' | '高级';
  title: string;
  targetRole: string;
  examDuration: string;
  passingScore: string;
  summary: string;
  prerequisites: string[];
  badgeColor: string;
}

// 模拟完整课程体系数据（严谨划分为：视频课程 / 文档课程 两大体系）
const COURSES: Course[] = [
  // =========================================================================
  // 体系一：视频课程（Video Courses · 4 门精品）
  // =========================================================================
  {
    id: 'course-plugin-intro',
    title: '百川 OS 插件开发完全指南：从零构建第一个机器人应用',
    courseType: 'video',
    direction: '百川插件开发入门',
    difficulty: '入门基础',
    duration: '2.5 小时',
    chaptersCount: 5,
    format: '高清视频实录 · 配套实操工程',
    targetAudience: '插件开发者、前端/全栈工程师、机器人软件初学者',
    summary: '以直观的视频演示与操作实录，从脚手架初始化、生命周期调度、运动原语调用到沙箱调试，手把手构建首个百川应用。',
    tags: ['视频实录', '工程脚手架', '生命周期', '机器人原语', '沙箱调试'],
    chapters: [
      {
        id: 'ch-1',
        title: '01. 百川插件生态理念与开发环境搭建',
        duration: '14:20',
        durationSeconds: 860,
        docReadTime: '8 分钟阅读',
        docWordCount: '2,600 字',
        summary: '了解百川 OS 的插件化内核机制，使用 CLI 脚手架一键初始化 TypeScript 开发工程与本地模拟器。',
        objectives: [
          '理解百川插件与宿主系统的隔离与通信沙箱',
          '安装 @moying/baichuan-cli 并配置本地模拟器环境',
          '运行默认示例工程并在浏览器中观察生命周期 Hook',
        ],
        codeSnippet: {
          language: 'bash',
          code: `# 安装百川官方开发者 CLI 脚手架
npm install -g @moying/baichuan-cli

# 初始化一个协作臂装配插件工程
baichuan create my-robot-plugin --template=action-node
cd my-robot-plugin
npm install
npm run dev -- --mock-robot`,
        },
        tips: [
          '建议使用 Node.js v18+ 及 VS Code 开发环境。',
          '本地模拟器会自动在 localhost:9090 启动虚拟机器人遥测服务。',
        ],
      },
      {
        id: 'ch-2',
        title: '02. 插件工程结构规范与 manifest.json 配置契约',
        duration: '18:45',
        durationSeconds: 1125,
        docReadTime: '10 分钟阅读',
        docWordCount: '3,100 字',
        summary: '深度剖析 manifest.json 声明规范，配置入参声明、权限申请与 UI 挂载点。',
        objectives: [
          '掌握 manifest.json 中的 capabilities 与 permissions 字段声明',
          '定义插件输入/输出参数的 JSON Schema 严格校验',
          '配置生命周期钩子（onLoad, onEnable, onDisable, onUnload）',
        ],
        codeSnippet: {
          language: 'json',
          code: `{
  "$schema": "https://developer.moying.com/schemas/plugin-manifest.v2.json",
  "id": "com.moying.precision-docking",
  "name": "协作臂精密对接插件",
  "version": "1.0.0",
  "permissions": [
    "robot.manipulator.move",
    "robot.vision.capture",
    "storage.local"
  ],
  "entry": "./src/index.ts"
}`,
        },
      },
      {
        id: 'ch-3',
        title: '03. 核心运动控制与遥测能力调用原语',
        duration: '24:10',
        durationSeconds: 1450,
        docReadTime: '12 分钟阅读',
        docWordCount: '3,800 字',
        summary: '通过百川 SDK 客户端调用机械臂笛卡尔位姿运动、关节插值及底盘导航接口。',
        objectives: [
          '使用 BaichuanSDK.useRobot() 建立安全受保护的 RPC 连接',
          '处理运动规划异常与超限急停安全边界',
          '订阅高频关节角度与力矩遥测数据流',
        ],
        codeSnippet: {
          language: 'typescript',
          code: `import { BaichuanSDK, Pose6D } from '@moying/baichuan-sdk';

const robot = BaichuanSDK.useRobot();

export async function executeDocking(targetPose: Pose6D) {
  // 校验目标位姿是否位于软限位安全工作空间内
  const isSafe = await robot.validateWorkspaceSafety(targetPose);
  if (!isSafe) {
    throw new Error('目标位姿超出工作空间安全限制');
  }

  // 以微秒级确定性轨迹下发笛卡尔平滑插补运动
  const task = await robot.moveCartesian(targetPose, {
    velocityLimit: 0.25, // m/s
    blendRadius: 0.005,  // 5mm 平滑过渡
  });

  return task.waitForCompletion();
}`,
        },
      },
      {
        id: 'ch-4',
        title: '04. 行为树 ActionNode 复合逻辑编排',
        duration: '22:30',
        durationSeconds: 1350,
        docReadTime: '9 分钟阅读',
        docWordCount: '2,800 字',
        summary: '将独立插件逻辑封装为行为树（BehaviorTree）节点，接入百川可视化编排引擎。',
        objectives: [
          '继承 ActionNode 并实现 onTick、onHalt 调度逻辑',
          '支持外部条件中断与状态回滚保护',
          '在天工调度系统中作为可视化节点拖拽配置',
        ],
      },
      {
        id: 'ch-5',
        title: '05. 插件打包、沙箱签名与应用商店发布',
        duration: '16:00',
        durationSeconds: 960,
        docReadTime: '7 分钟阅读',
        docWordCount: '2,200 字',
        summary: '掌握 baichuan build 打包规范、安全沙箱权限审核标准及插件商城上架交付流程。',
        objectives: [
          '执行预编译与代码体积树摇优化',
          '生成带签名哈希的 .mpk 插件交付安装包',
          '通过墨影安全沙箱自动化合规性扫描',
        ],
      },
    ],
  },
  {
    id: 'course-device-integration',
    title: '设备接入与能力建模：工业协议适配与驱动认证实战',
    courseType: 'video',
    direction: '设备接入与能力建模',
    difficulty: '进阶实战',
    duration: '3.2 小时',
    chaptersCount: 4,
    format: '实物协议演示 · 驱动编写实录',
    targetAudience: '设备硬件厂商、嵌入式驱动工程师、工业自动化自控人员',
    summary: '通过视频实操，演示 Modbus TCP、EtherCAT、OPC UA 硬件连线、寄存器点表配置、通信掉线自愈与自动化认证上架。',
    tags: ['视频实操', 'Modbus TCP', 'EtherCAT', '点表映射', '驱动认证'],
    chapters: [
      {
        id: 'ch-d1',
        title: '01. 工业现场设备协议拓扑与百川驱动架构',
        duration: '20:15',
        durationSeconds: 1215,
        docReadTime: '11 分钟阅读',
        docWordCount: '3,400 字',
        summary: '剖析百川统一设备接入层（UDAL），理解物理通信层、协议转换层与能力抽象层的解耦设计。',
        objectives: [
          '掌握百川设备接入层的三层解耦模型',
          '配置多品牌 PLC（西门子、三菱、欧姆龙）网络通道',
        ],
        codeSnippet: {
          language: 'typescript',
          code: `import { DeviceDriver, ModbusTCPChannel } from '@moying/baichuan-driver-core';

export class SiemensS7Driver extends DeviceDriver {
  static readonly protocol = 'modbus.tcp.s7';

  protected async initChannel() {
    return new ModbusTCPChannel({
      host: this.config.ip,
      port: 502,
      slaveId: 1,
      timeout: 1000,
    });
  }
}`,
        },
      },
      {
        id: 'ch-d2',
        title: '02. Modbus / OPC UA 寄存器映射与点表配置实战',
        duration: '26:40',
        durationSeconds: 1600,
        docReadTime: '14 分钟阅读',
        docWordCount: '4,200 字',
        summary: '手把手编写寄存器点表配置，将原始线圈与保持寄存器映射为百川标准化设备属性。',
        objectives: [
          '配置读写权限与大端/小端浮点数解析规则',
          '建立统一设备遥测数据字典',
        ],
      },
      {
        id: 'ch-d3',
        title: '03. 强电磁干扰下的断网自愈与心跳补偿机制',
        duration: '25:00',
        durationSeconds: 1500,
        docReadTime: '10 分钟阅读',
        docWordCount: '3,000 字',
        summary: '针对工业现场高频弧焊、大电机启动导致的瞬态掉包，构建微秒级断线重连与状态同步状态机。',
        objectives: [
          '实现指数退避重试算法',
          '建立带外保活心跳包监测机制',
        ],
      },
      {
        id: 'ch-d4',
        title: '04. 百川硬件认证规范与自动化兼容性测试',
        duration: '19:30',
        durationSeconds: 1170,
        docReadTime: '8 分钟阅读',
        docWordCount: '2,500 字',
        summary: '运行官方驱动兼容性测试套件，获取认证报告并上架百川设备商城。',
        objectives: [
          '执行 72 小时稳定性压力测试',
          '提交驱动认证包并获取「百川已认证」徽章',
        ],
      },
    ],
  },
  {
    id: 'course-solution-delivery',
    title: '行业方案交付实训：产线级多机器人编排与私有化部署',
    courseType: 'video',
    direction: '行业方案交付实训',
    difficulty: '专家精通',
    duration: '4.0 小时',
    chaptersCount: 4,
    format: '标杆车间实录 · 多机调度视频',
    targetAudience: '系统集成商（SI）、行业方案架构师、现场实施技术总监',
    summary: '复盘 3C/新能源标杆产线，实战多 AMR 窄道死锁预防、天工调度对接及 MES 联锁交付。',
    tags: ['产线实录', '天工调度', '死锁预防', 'MES 联锁', '私有化部署'],
    chapters: [
      {
        id: 'ch-s1',
        title: '01. 工业现场工艺流需求抽象与场景拓扑建模',
        duration: '28:10',
        durationSeconds: 1690,
        docReadTime: '15 分钟阅读',
        docWordCount: '4,500 字',
        summary: '基于百川拓扑地图工具构建双向交替通道、避让缓冲点与高精度接驳站点。',
        objectives: [
          '定义单向优先路权与死锁避让区',
          '标定工业级 3D SLAM 点云地图与建筑坐标系',
        ],
      },
      {
        id: 'ch-s2',
        title: '02. 天工调度系统接入与多机编队交管策略',
        duration: '32:00',
        durationSeconds: 1920,
        docReadTime: '16 分钟阅读',
        docWordCount: '4,800 字',
        summary: '配置 50+ 台 AMR 混合编队调度逻辑，实现卷帘门、风淋室与电梯跨楼层自动化互锁。',
        objectives: [
          '编写互斥交通区（MutexZone）仲裁逻辑',
          '实施提升机跨层出入库时序防死锁优化',
        ],
      },
      {
        id: 'ch-s3',
        title: '03. 产线 MES / WMS 系统对接与接口联锁容错',
        duration: '26:50',
        durationSeconds: 1610,
        docReadTime: '13 分钟阅读',
        docWordCount: '3,900 字',
        summary: '使用标准化 RESTful / WebSocket / MQTT 接口与客户业务系统完成握手交互。',
        objectives: [
          '掌握产线物料拉动叫料与任务闭环下发',
          '配置网络抖动时的边缘断网缓存与重传',
        ],
      },
      {
        id: 'ch-s4',
        title: '04. 边缘私有化集群部署与现场验收交付准则',
        duration: '22:40',
        durationSeconds: 1360,
        docReadTime: '11 分钟阅读',
        docWordCount: '3,300 字',
        summary: '从物理工控机高可用双机热备、容器化部署到现场验收打卡交付标准全梳理。',
        objectives: [
          '部署百川边缘高可用集群',
          '执行 FAT / SAT 现场验收标准检查清单',
        ],
      },
    ],
  },
  {
    id: 'course-video-vision',
    title: '具身视觉引导与 3D 点云高精抓取实操',
    courseType: 'video',
    direction: '百川插件开发入门',
    difficulty: '进阶实战',
    duration: '2.8 小时',
    chaptersCount: 4,
    format: '高清视频实操 · 配套点云数据集',
    targetAudience: '具身智能开发者、视觉算法工程师、机器人装配工程师',
    summary: '通过实机视觉引导抓取视频实录，掌握 3D 相机点云标定、工件 6D 位姿识别与避障路径规划。',
    tags: ['视觉实操', '3D 点云', '6D 位姿', '轨迹规划', '柔性夹爪'],
    chapters: [
      {
        id: 'ch-v1',
        title: '01. 3D 相机手眼标定与点云点位对齐实操',
        duration: '16:30',
        durationSeconds: 990,
        docReadTime: '8 分钟阅读',
        docWordCount: '2,600 字',
        summary: '视频实录眼在手外（Eye-to-Hand）与眼在手上（Eye-in-Hand）标定流程，计算高精转换矩阵。',
        objectives: [
          '掌握标定板采集与奇异值分解算法',
          '在百川点云可视化工具中验证坐标系重合误差',
        ],
      },
      {
        id: 'ch-v2',
        title: '02. 基于深度学习的无序工件 6D 位姿估计实战',
        duration: '21:10',
        durationSeconds: 1270,
        docReadTime: '11 分钟阅读',
        docWordCount: '3,400 字',
        summary: '接入百川预训练 3D 视觉模型，实现反光金属零件与半透明塑料件的高鲁棒性定位。',
        objectives: [
          '训练与微调工业工件位姿估计算法',
          '处理重叠遮挡工况下的点云分割',
        ],
      },
      {
        id: 'ch-v3',
        title: '03. 避障运动学反解与轨迹平滑规划',
        duration: '24:00',
        durationSeconds: 1440,
        docReadTime: '12 分钟阅读',
        docWordCount: '3,900 字',
        summary: '视频演示机械臂在料框边缘避障下潜、微调位姿与微秒级插补轨迹生成。',
        objectives: [
          '调用百川运动规划器生成无碰撞轨迹',
          '配置末端工具（TCP）安全软边界',
        ],
      },
      {
        id: 'ch-v4',
        title: '04. 自适应抓取力控与打滑保护逻辑',
        duration: '18:20',
        durationSeconds: 1100,
        docReadTime: '9 分钟阅读',
        docWordCount: '2,900 字',
        summary: '结合末端力传感器实时读数，动态调整柔性夹爪夹紧力矩，避免压伤工件或搬运途中滑落。',
        objectives: [
          '配置阻抗控制参数与力矩阈值',
          '编写抓取失败时的自动二次重试状态机',
        ],
      },
    ],
  },

  // =========================================================================
  // 体系二：官方技术文档课程（Document Courses · 4 门权威专栏）
  // =========================================================================
  {
    id: 'course-doc-plugin-spec',
    title: '百川 OS 插件开发规范与架构参考手册',
    courseType: 'doc',
    direction: '百川插件开发入门',
    difficulty: '入门基础',
    duration: '45 分钟阅读',
    chaptersCount: 5,
    wordCount: '1.8 万字',
    format: '官方权威规约 · 体系化技术文档',
    targetAudience: '插件开发者、系统架构师、API 开发者',
    summary: '百川官方标准开发规范，详述插件生命周期契约、manifest.json 架构声明、受限 IPC 通信规范与权限沙箱策略。',
    tags: ['规约手册', '生命周期契约', 'manifest 规范', '沙箱权限', 'API 参考'],
    chapters: [
      {
        id: 'ch-dp1',
        title: '01. 插件工程拓扑结构与目录分层规约',
        duration: '12:00',
        durationSeconds: 720,
        docReadTime: '8 分钟阅读',
        docWordCount: '2,800 字',
        summary: '详解百川推荐的标准 monorepo 与单包插件目录布局，包括 src/、manifest.json、tests/ 及构建产物目录。',
        objectives: [
          '掌握标准插件工程目录组织规范',
          '配置 TypeScript 与打包器 target 约束',
          '声明本地资源与静态资源引用路径',
        ],
        codeSnippet: {
          language: 'bash',
          code: `# 百川推荐标准插件工程目录拓扑
my-plugin/
├── manifest.json        # 插件元信息与权限声明
├── package.json         # 依赖定义与脚本入口
├── tsconfig.json        # 严格模式 TypeScript 编译配置
├── src/
│   ├── index.ts         # 插件生命周期统一导出点
│   ├── handlers/        # 业务逻辑与原语实现
│   └── views/           # UI 面板挂载组件 (可选)
└── test/                # 单元测试与沙箱模拟器用例`,
        },
      },
      {
        id: 'ch-dp2',
        title: '02. manifest.json 声明字段 Schema 与能力契约',
        duration: '14:00',
        durationSeconds: 840,
        docReadTime: '10 分钟阅读',
        docWordCount: '3,600 字',
        summary: '完整字段契约规范，涵盖 id 命名空间、版本 semver、permissions 最小特权声明与依赖注入。',
        objectives: [
          '掌握 manifest.json V2 完整规范与 JSON Schema 校验',
          '声明细粒度硬件与系统访问权限',
          '配置热重载与崩溃自恢复策略',
        ],
        codeSnippet: {
          language: 'json',
          code: `{
  "$schema": "https://developer.moying.com/schemas/plugin-manifest.v2.json",
  "id": "com.vendor.custom-gripper",
  "name": "柔性自适应夹爪驱动插件",
  "version": "1.2.0",
  "category": "driver",
  "permissions": [
    "robot.io.digital",
    "robot.hardware.serial",
    "storage.persistent"
  ],
  "entry": "./dist/index.js",
  "sandbox": {
    "isolation": "worker-thread",
    "memoryLimitMb": 256
  }
}`,
        },
      },
      {
        id: 'ch-dp3',
        title: '03. 受限 IPC 通信原语与生命周期回调契约',
        duration: '16:00',
        durationSeconds: 960,
        docReadTime: '11 分钟阅读',
        docWordCount: '4,100 字',
        summary: '深入解析 onLoad、onEnable、onDisable、onUnload 阶段职责，保障插件在极端工况下优雅释放资源。',
        objectives: [
          '实现安全生命周期钩子函数',
          '捕获非受控异常并触发保护性回滚',
          '通过 IPC 通信通道与主控守护进程安全握手',
        ],
      },
      {
        id: 'ch-dp4',
        title: '04. 权限沙箱与行为树 ActionNode 声明规约',
        duration: '15:00',
        durationSeconds: 900,
        docReadTime: '9 分钟阅读',
        docWordCount: '3,200 字',
        summary: '将业务方法导出为百川行为树调度节点，定义输入参数 Blackboard 绑定及状态返回契约。',
        objectives: [
          '继承 ActionNode 基础接口',
          '处理 onTick 与抢占式 onHalt 逻辑',
          '保障与天工可视化编排系统的元数据对齐',
        ],
      },
      {
        id: 'ch-dp5',
        title: '05. 插件打包签名与应用商店交付标准',
        duration: '10:00',
        durationSeconds: 600,
        docReadTime: '7 分钟阅读',
        docWordCount: '2,500 字',
        summary: '梳理 baichuan pack 打包、SHA256 签名证书生成、静态代码合规扫描及发布交付全流程。',
        objectives: [
          '使用私钥对插件镜像包进行安全签名',
          '通过墨影安全沙箱静态扫描与依赖审计',
          '完成插件商城版本上架与灰度发布',
        ],
      },
    ],
  },
  {
    id: 'course-doc-udal',
    title: '工业总线协议与统一设备接入层 (UDAL) 技术手册',
    courseType: 'doc',
    direction: '设备接入与能力建模',
    difficulty: '进阶实战',
    duration: '50 分钟阅读',
    chaptersCount: 4,
    wordCount: '2.1 万字',
    format: '工业总线标准 · 驱动编写手册',
    targetAudience: '硬件厂商工程师、嵌入式开发者、自动化协议架构师',
    summary: '百川底层硬件抽象层（UDAL）全套开发规约，覆盖 Modbus TCP/RTU、EtherCAT CoE、OPC UA 协议映射与驱动上架认证标准。',
    tags: ['UDAL 规约', '总线拓扑', '寄存器映射', '断网自愈', '认证指南'],
    chapters: [
      {
        id: 'ch-du1',
        title: '01. UDAL 统一设备抽象层架构设计准则',
        duration: '14:00',
        durationSeconds: 840,
        docReadTime: '12 分钟阅读',
        docWordCount: '4,500 字',
        summary: '详述设备驱动分层模型：物理层通道、协议编解码层与百川统一标准能力模型（Device Capability Model）。',
        objectives: [
          '理解 UDAL 硬件解耦架构的核心诉求',
          '定义传感器与执行机构标准化能力接口',
        ],
      },
      {
        id: 'ch-du2',
        title: '02. Modbus TCP / EtherCAT 寄存器点表标准化映射契约',
        duration: '18:00',
        durationSeconds: 1080,
        docReadTime: '15 分钟阅读',
        docWordCount: '5,800 字',
        summary: '线圈量、保持寄存器与输入寄存器的统一映射规约，覆盖大小端编码、精度浮点数缩放及数据有效性校验。',
        objectives: [
          '编写 point-table.json 声明式点表配置文件',
          '支持位掩码解析与高频数据批量轮询',
        ],
      },
      {
        id: 'ch-du3',
        title: '03. 工业强电磁干扰下的断网自愈协议规范',
        duration: '16:00',
        durationSeconds: 960,
        docReadTime: '13 分钟阅读',
        docWordCount: '5,000 字',
        summary: '规约工业现场通信瞬断时的容错降级、指数退避重连、数据补发状态机及急停联锁熔断。',
        objectives: [
          '实现微秒级通信心跳守护机制',
          '配置无扰恢复与丢包安全兜底策略',
        ],
      },
      {
        id: 'ch-du4',
        title: '04. 官方硬件认证准则与自动化测试用例清单',
        duration: '12:00',
        durationSeconds: 720,
        docReadTime: '10 分钟阅读',
        docWordCount: '3,800 字',
        summary: '百川设备生态认证测试大纲，包含 72 小时耐久性、电气隔离、抗扰度及接口契约自动化校验项。',
        objectives: [
          '掌握自动化合规测试套件的运行与报告分析',
          '准备设备商城上架认证材料',
        ],
      },
    ],
  },
  {
    id: 'course-doc-ai-skills',
    title: '百川 AI Skills 智能体与工具链开发指南',
    courseType: 'doc',
    direction: '百川插件开发入门',
    difficulty: '进阶实战',
    duration: '40 分钟阅读',
    chaptersCount: 4,
    wordCount: '1.6 万字',
    format: 'AI 架构白皮书 · 接口文档',
    targetAudience: 'AI 开发者、工业大模型应用工程师、Prompt 算法工程师',
    summary: '系统讲解大模型与工业具身机器人结合方案，涵盖 Function Calling 工具定义、工业领域知识库 RAG 与多模态指令安全校验。',
    tags: ['AI 架构', 'Function Calling', 'RAG 检索', '指令对齐', '安全围栏'],
    chapters: [
      {
        id: 'ch-da1',
        title: '01. 百川 AI Skills 运行原理与智能体拓扑',
        duration: '12:00',
        durationSeconds: 720,
        docReadTime: '9 分钟阅读',
        docWordCount: '3,400 字',
        summary: '解析具身智能体在大模型决策与底层确定性运动控制之间的两层架构桥梁。',
        objectives: [
          '理解大模型意图识别与工业指令编译的映射机制',
          '构建技能声明清单（skill-manifest.json）',
        ],
      },
      {
        id: 'ch-da2',
        title: '02. 工业指令 Function Calling 标准接口定义',
        duration: '15:00',
        durationSeconds: 900,
        docReadTime: '12 分钟阅读',
        docWordCount: '4,600 字',
        summary: '通过严密 JSON Schema 定义机器人动作工具签名，避免大模型幻觉下发非法参数。',
        objectives: [
          '编写强类型的参数校验与边界限制规则',
          '实现两阶段确认（Human-in-the-loop）工作流',
        ],
      },
      {
        id: 'ch-da3',
        title: '03. 工业知识库 RAG 向量检索与问答接入',
        duration: '13:00',
        durationSeconds: 780,
        docReadTime: '10 分钟阅读',
        docWordCount: '3,900 字',
        summary: '将现场设备故障排查手册、电气原理图与报警代码向量化，赋予智能体故障自诊断能力。',
        objectives: [
          '构建工业 Markdown 与 PDF 切片流水线',
          '集成语义向量检索与置信度过滤',
        ],
      },
      {
        id: 'ch-da4',
        title: '04. 大模型工业安全护栏与越权拦截机制',
        duration: '11:00',
        durationSeconds: 660,
        docReadTime: '9 分钟阅读',
        docWordCount: '3,500 字',
        summary: '建立物理动作与越权指令的多级安全围栏（Safety Rails），确保任何模型输出均不突破物理安全边界。',
        objectives: [
          '配置确定性安全校验拦截器',
          '编写工业动作熔断与紧急锁死协议',
        ],
      },
    ],
  },
  {
    id: 'course-doc-safety',
    title: '工业机器人安全联锁与沙箱合规规约白皮书',
    courseType: 'doc',
    direction: '行业方案交付实训',
    difficulty: '专家精通',
    duration: '35 分钟阅读',
    chaptersCount: 4,
    wordCount: '1.5 万字',
    format: '合规白皮书 · 产线安全标准',
    targetAudience: '产线安全工程师、系统集成商交付总监、工业安全专家',
    summary: '基于 ISO 10218 与 GB 11291 工业标准，阐述百川 OS 急停响应、微秒级软硬件互锁、双通道安全校验及合规验收流程。',
    tags: ['安全标准', '急停联锁', 'ISO 合规', '沙箱隔离', '双通道校验'],
    chapters: [
      {
        id: 'ch-ds1',
        title: '01. 工业机器人安全等级 (PLd/PLe) 与百川安全架构',
        duration: '10:00',
        durationSeconds: 600,
        docReadTime: '8 分钟阅读',
        docWordCount: '3,200 字',
        summary: '解析百川安全内核（Safety Core）如何与外围安全继电器、安全 PLC 达成性能等级对齐。',
        objectives: [
          '理解 ISO 13849-1 性能等级与百川安全模型',
          '配置安全区划分与减速降级保护逻辑',
        ],
      },
      {
        id: 'ch-ds2',
        title: '02. 微秒级硬件急停信号捕获与软联锁响应',
        duration: '14:00',
        durationSeconds: 840,
        docReadTime: '10 分钟阅读',
        docWordCount: '4,100 字',
        summary: '双回路急停、光栅触发与安全门联锁的物理信号中断机制，确保 10ms 内关断电机使能。',
        objectives: [
          '实现硬件急停与软件联锁的双重熔断',
          '编写安全停止时序（Stop Category 0/1/2）状态机',
        ],
      },
      {
        id: 'ch-ds3',
        title: '03. 进程沙箱内存隔离与越权指令熔断机制',
        duration: '12:00',
        durationSeconds: 720,
        docReadTime: '9 分钟阅读',
        docWordCount: '3,600 字',
        summary: 'Linux cgroups 与受限命名空间下的插件资源隔离，防止野指针崩溃或恶意进程耗尽内存。',
        objectives: [
          '配置插件进程 CPU、内存与文件系统只读沙箱',
          '建立越权系统调用 seccomp 过滤规则',
        ],
      },
      {
        id: 'ch-ds4',
        title: '04. 产线安全合规验收标准检查清单 (FAT/SAT)',
        duration: '10:00',
        durationSeconds: 600,
        docReadTime: '8 分钟阅读',
        docWordCount: '3,100 字',
        summary: '详述工厂验收测试（FAT）与现场验收测试（SAT）安全合规检查项，提供一键打印核对表。',
        objectives: [
          '对照百川官方 36 项安全准入清单逐项校验',
          '生成带有防篡改哈希的现场验收电子证明',
        ],
      },
    ],
  },
];

// 角色学习路径数据
const ROLE_PATHS: RolePath[] = [
  {
    id: 'path-plugin-dev',
    role: '插件开发者',
    title: '百川机器人应用插件开发工程师',
    targetUser: '面向需要基于百川 OS 开发业务页面、算法策略与行为树节点的开发者',
    summary: '从 TypeScript 脚手架起步，逐步掌握机器人微秒级运动原语、微米级视觉插拔与商城上架。',
    badge: '官方主推',
    iconBg: '#4f46e5',
    stages: [
      {
        stageNumber: '01',
        stageTitle: '环境搭建与脚手架',
        description: '安装 CLI 工具链，运行虚拟机器人模拟器，理解沙箱生命周期与权限契约。',
        keySkills: ['@moying/baichuan-cli', 'manifest.json 规范', '模拟器沙箱'],
        relatedCourseId: 'course-plugin-intro',
      },
      {
        stageNumber: '02',
        stageTitle: '能力原语与视觉交互',
        description: '调用底盘导航、协作臂笛卡尔平滑插补及 3D 相机位姿识别能力。',
        keySkills: ['笛卡尔运动原语', '视觉坐标转换', '力控实时订阅'],
        relatedCourseId: 'course-plugin-intro',
      },
      {
        stageNumber: '03',
        stageTitle: '行为树任务编排',
        description: '开发可重用的 ActionNode，构建带状态回滚与异常安全锁的工业流程。',
        keySkills: ['BehaviorTree 节点', '抢占式中断', '天工调度拖拽'],
        relatedCourseId: 'course-plugin-intro',
      },
      {
        stageNumber: '04',
        stageTitle: '签名打包与商业化',
        description: '通过沙箱合规安全扫描，打包为 .mpk 镜像并上架百川插件商城。',
        keySkills: ['安全沙箱验证', '性能调优', '插件商城交付'],
        relatedCourseId: 'course-plugin-intro',
      },
    ],
  },
  {
    id: 'path-device-vendor',
    role: '设备厂商',
    title: '百川硬件设备接入与互联架构师',
    targetUser: '面向激光雷达、协作臂、电机、夹爪及传感器等硬件制造商的技术研发团队',
    summary: '统一接入百川底层硬件抽象层，完成工业总线协议转换、数据点表映射与自动化认证。',
    badge: '生态认证',
    iconBg: '#059669',
    stages: [
      {
        stageNumber: '01',
        stageTitle: '总线协议接入基础',
        description: '梳理 Modbus TCP、EtherCAT、CANopen 与 OPC UA 设备通信接口拓扑。',
        keySkills: ['工业总线协议', '报文解析', '网络拓扑配置'],
        relatedCourseId: 'course-device-integration',
      },
      {
        stageNumber: '02',
        stageTitle: '百川能力模型抽象',
        description: '将硬件专有指令映射为百川标准化能力模型（如速度环、力矩环、点云流）。',
        keySkills: ['UDAL 架构', '寄存器点表', '数据类型转换'],
        relatedCourseId: 'course-device-integration',
      },
      {
        stageNumber: '03',
        stageTitle: '高抗扰与掉线自愈',
        description: '针对复杂工业电磁辐射与网络抖动，实操 15ms 内无感自愈与心跳保活。',
        keySkills: ['指数退避算法', '自愈状态机', '零急停容错'],
        relatedCourseId: 'course-device-integration',
      },
      {
        stageNumber: '04',
        stageTitle: '官方硬件合规测试',
        description: '完成 72 小时满载压力测试，获取百川官方认证徽章并进入选型库。',
        keySkills: ['自动化测试套件', '可靠性报告', '设备商城上架'],
        relatedCourseId: 'course-device-integration',
      },
    ],
  },
  {
    id: 'path-system-integrator',
    role: '系统集成商',
    title: '百川工业场景方案集成交付专家',
    targetUser: '面向负责智能工厂、仓储物流及柔性制造产线规划与实施交付的技术人员',
    summary: '掌握大规模 AMR 编队调度、窄道动态死锁预防、MES/WMS 业务联锁及私有化交付。',
    badge: '产线实战',
    iconBg: '#d97706',
    stages: [
      {
        stageNumber: '01',
        stageTitle: '厂区数字孪生建图',
        description: '采集厂区 3D SLAM 点云，与工厂 CAD/BIM 施工底图完成高精度拓扑对齐。',
        keySkills: ['3D SLAM 建图', 'CAD 坐标标定', '拓扑站点定义'],
        relatedCourseId: 'course-solution-delivery',
      },
      {
        stageNumber: '02',
        stageTitle: '多机交管与死锁预防',
        description: '规划单向交替通道、互斥区域与虚拟信号灯，消除数十台 AMR 的交叉口对峙。',
        keySkills: ['天工交管策略', '死锁避让', '动态路权分配'],
        relatedCourseId: 'course-solution-delivery',
      },
      {
        stageNumber: '03',
        stageTitle: '上位系统与硬件联锁',
        description: '对接产线 MES、WMS 及提升机、自动卷帘门、风淋室，实现全闭环自动化。',
        keySkills: ['RESTful / MQTT', 'PLC 握手信号', '断网边缘重传'],
        relatedCourseId: 'course-solution-delivery',
      },
      {
        stageNumber: '04',
        stageTitle: '高可用私有化交付',
        description: '工业边缘计算集群双机热备部署，完成客户现场验收标准检查与交付。',
        keySkills: ['边缘集群高可用', 'FAT/SAT 验收', '运维监控看盘'],
        relatedCourseId: 'course-solution-delivery',
      },
    ],
  },
];

// 项目实训任务
const PROJECT_LABS: ProjectLab[] = [
  {
    id: 'lab-1',
    title: '实训一：协作臂微米级视觉装配 ActionNode 插件开发',
    scenario: '3C 手机主板螺丝紧固工位微米级对齐插拔',
    difficulty: '产线级项目',
    duration: '45 分钟',
    skills: ['TypeScript', 'ActionNode', '力矩阻抗控制', '视觉位姿识别'],
    deliverables: '包含完整生命周期的 ActionNode 插件包与单元测试',
    environment: '百川云端虚拟仿真沙箱（集成协作臂与 3D 相机）',
    status: '可启动',
  },
  {
    id: 'lab-2',
    title: '实训二：异构 PLC (西门子 S7-1500 / 欧姆龙) 快速接入驱动适配',
    scenario: '新能源电池包入壳机与输送线实时握手通信',
    difficulty: '中级挑战',
    duration: '35 分钟',
    skills: ['Modbus TCP', '寄存器点表映射', '网络抖动自愈'],
    deliverables: '标准化驱动配置文件与通信自愈验证测试报告',
    environment: '虚拟 PLC 工业协议仿真器',
    status: '可启动',
  },
  {
    id: 'lab-3',
    title: '实训三：3C 产线 24 台 AMR 狭窄通道动态交管与死锁预防编排',
    scenario: '高密度仓储通道十字路口高峰期多车防死锁',
    difficulty: '产线级项目',
    duration: '50 分钟',
    skills: ['天工调度算法', '互斥区配置', '动态路权仲裁'],
    deliverables: '天工交通管制策略配置文件及 72 小时无死锁仿真结果',
    environment: '天工多智能体交通编排仿真平台',
    status: '可启动',
  },
  {
    id: 'lab-4',
    title: '实训四：基于百川 AI Skills 的自然语言指令到插件代码生成',
    scenario: '使用大模型流水线辅助生成传感器监听与搬运工作流节点',
    difficulty: '基础实训',
    duration: '25 分钟',
    skills: ['AI Skills', 'Prompt 工程', '自动化流水线', '代码审查'],
    deliverables: '符合官方规范的自动化生成 TypeScript 插件工程',
    environment: '百川 AI Studio 交互沙箱',
    status: '可启动',
  },
];

// 技能认证体系
const CERTIFICATIONS: Certification[] = [
  {
    id: 'cert-1',
    level: '初级',
    title: '百川认证插件开发工程师 (Associate Plugin Developer)',
    targetRole: '软件开发工程师、前端开发人员、初级机器人算法开发者',
    examDuration: '60 分钟',
    passingScore: '80 分 (满分 100 分)',
    summary: '验证开发者对百川插件架构、SDK 调用原语及本地调试交付规范的掌握程度。',
    prerequisites: ['完成《百川 OS 插件开发完全指南》学习', '独立提交并通过 1 项实训任务'],
    badgeColor: '#4f46e5',
  },
  {
    id: 'cert-2',
    level: '中级',
    title: '百川认证硬件设备互联专家 (Certified Device Specialist)',
    targetRole: '硬件厂商研发工程师、自控系统工程师、嵌入式驱动人员',
    examDuration: '90 分钟',
    passingScore: '85 分 (满分 100 分)',
    summary: '验证在工业环境下进行设备协议适配、掉线无感自愈与数据抽象建模的实战能力。',
    prerequisites: ['完成《设备接入与能力建模》课程', '完成异构 PLC 接入实训 Lab'],
    badgeColor: '#059669',
  },
  {
    id: 'cert-3',
    level: '高级',
    title: '百川认证工业方案架构师 (Master Solution Architect)',
    targetRole: '系统集成商方案总监、资深交付架构师、工业数字化顾问',
    examDuration: '120 分钟 (含综合案例方案答辩)',
    passingScore: '90 分 (满分 100 分)',
    summary: '考核大规模多机交管编排、复杂工业上位系统联锁、私有化部署及现场交付综合实力。',
    prerequisites: ['完成《行业方案交付实训》课程', '通过 2 项产线级多机器人实训挑战'],
    badgeColor: '#d97706',
  },
];

// 生成章节 Markdown 完整技术文档
function generateChapterMarkdown(course: Course, chapter: CourseChapter): string {
  return `# ${chapter.title}

> **所属课程**：${course.title}
> **课程方向**：${course.direction}
> **预计阅读**：${chapter.docReadTime || '8 分钟阅读'} | **配套视频**：${chapter.duration}
> **标准环境**：百川 OS v0.2.0+ 工业安全沙箱规范

---

## 章节导读与教学目标
${chapter.summary}

### 核心掌握要点：
${chapter.objectives.map(obj => `- [x] ${obj}`).join('\n')}

---

## 一、架构机制与工程设计
在百川 OS 运行时体系中，该章节能力依托百川微内核总线进行调度。所有针对机器人动作原语、外设协议交互或现场拓扑调度的操作，均受到安全生命周期控制与权限隔离沙箱约束。

### 核心规约参数表
| 参数字段 | 数据类型 | 必填 | 缺省值 | 说明 |
| :--- | :--- | :--- | :--- | :--- |
| \`target.id\` | \`string\` | 是 | - | 百川生态全局唯一能力标识符 |
| \`runtime.env\` | \`'node18' | 'embedded'\` | 是 | \`'node18'\` | 宿主运行时沙箱环境 |
| \`safety.estopOnFault\` | \`boolean\` | 否 | \`true\` | 触发严重故障时是否联锁硬件急停 |
| \`telemetry.frequencyHz\` | \`number\` | 否 | \`50\` | 实时遥测数据流发布频率 |

---

## 二、核心 API 原语实现
\`\`\`${chapter.codeSnippet?.language || 'typescript'}
${chapter.codeSnippet?.code || '// 百川 SDK 示例代码'}
\`\`\`

---

## 三、工业现场实操避坑建议
${(chapter.tips || ['严格遵循百川开发者规范进行本地与现场联调。']).map(t => `> 💡 **提示**：${t}`).join('\n\n')}

---
*墨影科技 · 墨影学院技术资料库 编纂*
`;
}

interface AcademyPageProps {
  onBackToHome?: () => void;
  onOpenCommunity?: () => void;
}

export function AcademyPage({ onBackToHome, onOpenCommunity }: AcademyPageProps) {
  // 页面模式：'catalog' (学院大厅/目录浏览) | 'classroom' (视频课程与章节学习)
  const [viewMode, setViewMode] = useState<'catalog' | 'classroom'>('catalog');
  const [activeTab, setActiveTab] = useState<AcademyTab>('courses');
  const [selectedDirection, setSelectedDirection] = useState<CourseDirection>('全部方向');

  // 当前学习中的课程与章节状态
  const [currentCourse, setCurrentCourse] = useState<Course>(COURSES[0]);
  const [currentChapterIndex, setCurrentChapterIndex] = useState<number>(0);

  // 用户学习进度状态记忆（存储已完成的章节集合与当前播放进度）
  const [completedChapters, setCompletedChapters] = useState<Record<string, Set<string>>>({
    'course-plugin-intro': new Set(['ch-1', 'ch-2']),
    'course-device-integration': new Set(['ch-d1']),
    'course-doc-plugin-spec': new Set(['ch-dp1']),
  });

  // 视频播放器控制状态
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState<number>(1.0);
  const [videoProgressSeconds, setVideoProgressSeconds] = useState<number>(45);

  // 全局轻量 Toast 提示
  const [toastMessage, setToastMessage] = useState<string>('');
  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(''), 3000);
  };

  // 下载当前章节 Markdown 官方文档
  const handleDownloadDoc = (docTitle: string, markdownContent: string) => {
    const blob = new Blob([markdownContent], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${docTitle.replace(/[\/\s]/g, '_')}.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    showToast(`已开始下载技术文档：${docTitle}.md`);
  };

  // 进入课程学习（视频就纯视频，文档就纯文档，无缝进入）
  const handleStartCourse = (course: Course, chapterIndex?: number) => {
    setCurrentCourse(course);
    if (chapterIndex !== undefined) {
      setCurrentChapterIndex(chapterIndex);
    } else {
      const courseCompletedSet = completedChapters[course.id] || new Set();
      const firstUncompleted = course.chapters.findIndex(ch => !courseCompletedSet.has(ch.id));
      setCurrentChapterIndex(firstUncompleted >= 0 ? firstUncompleted : 0);
    }
    setViewMode('classroom');
    setIsPlaying(course.courseType === 'video');
    setVideoProgressSeconds(0);
    window.scrollTo({ top: 0, behavior: 'instant' });
  };

  // 标记当前章节为已完成并自动提示
  const handleToggleChapterComplete = (chapterId: string) => {
    setCompletedChapters(prev => {
      const currentSet = new Set(prev[currentCourse.id] || []);
      if (currentSet.has(chapterId)) {
        currentSet.delete(chapterId);
        showToast('已取消该节完成标记');
      } else {
        currentSet.add(chapterId);
        showToast('🎉 该章节已学完！进度已保存');
      }
      return {
        ...prev,
        [currentCourse.id]: currentSet,
      };
    });
  };

  // 计算当前课程整体完成进度百分比
  const currentCourseProgress = useMemo(() => {
    if (!currentCourse) return 0;
    const completedSet = completedChapters[currentCourse.id] || new Set();
    return Math.round((completedSet.size / currentCourse.chapters.length) * 100);
  }, [currentCourse, completedChapters]);

  // 格式化秒数为 mm:ss
  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  // 过滤后的课程列表（全部混排呈现，不划分视频/文档专区）
  const filteredCourses = useMemo(() => {
    if (selectedDirection === '全部方向') return COURSES;
    return COURSES.filter(c => c.direction === selectedDirection);
  }, [selectedDirection]);

  // 当前章节对象
  const currentChapter = currentCourse.chapters[currentChapterIndex] || currentCourse.chapters[0];

  // =========================================================================
  // 视图二：视频课程详情与章节学习教室（Classroom View）
  // =========================================================================
  if (viewMode === 'classroom') {
    const isCurrentChapterDone = (completedChapters[currentCourse.id] || new Set()).has(
      currentChapter.id
    );

    return (
      <div className="academy-classroom">
        {/* 顶部学习导航栏 */}
        <header className="classroom-topbar">
          <div className="classroom-topbar-left">
            <button
              className="classroom-back-btn"
              onClick={() => {
                setViewMode('catalog');
                window.scrollTo({ top: 0, behavior: 'instant' });
              }}
            >
              <ArrowLeft size={15} /> 返回学院首页
            </button>
            <div className="classroom-breadcrumbs">
              <span className={`crumb-type-tag is-${currentCourse.courseType}`}>
                {currentCourse.courseType === 'video' ? <Video size={11} /> : <FileText size={11} />}
                {currentCourse.courseType === 'video' ? '视频' : '文档'}
              </span>
              <span className="crumb-sep">/</span>
              <span className="crumb-dir">{currentCourse.direction}</span>
              <span className="crumb-sep">/</span>
              <span className="crumb-course">{currentCourse.title}</span>
            </div>
          </div>

          <div className="classroom-topbar-right">
            <div className="classroom-progress-info">
              <span>
                课程进度 <strong>{currentCourseProgress}%</strong> (
                {(completedChapters[currentCourse.id] || new Set()).size}/
                {currentCourse.chapters.length} 节)
              </span>
              <div className="classroom-progress-bar">
                <div
                  className="classroom-progress-fill"
                  style={{ width: `${currentCourseProgress}%` }}
                />
              </div>
            </div>
          </div>
        </header>

        {/* 教室双栏主体：左侧播放器/技术文档 + 右侧章节目录 */}
        <div className="classroom-layout">
          {/* 左侧主要学习区 */}
          <main className="classroom-main">
            {/* 严格纯粹模式：视频课程只展示视频，文档课程只展示文档，绝不突然交叉阅读文档或视频 */}
            {currentCourse.courseType === 'doc' ? (
              <div className="chapter-doc-reader">
                {/* 文档顶部操作栏 */}
                <div className="doc-reader-topbar">
                  <div className="doc-reader-meta">
                    <span className="doc-type-badge">
                      <FileText size={13} /> 官方技术规约手册
                    </span>
                    <span className="doc-meta-item">
                      <Clock size={12} /> {currentChapter.docReadTime || '8 分钟阅读'}
                    </span>
                    <span className="doc-meta-item">字数：{currentChapter.docWordCount || '3,000 字'}</span>
                    <span className="doc-meta-item">适用：百川 OS v0.2.0+</span>
                  </div>

                  <div className="doc-reader-actions">
                    <button
                      className="doc-action-btn"
                      onClick={() => {
                        const md = generateChapterMarkdown(currentCourse, currentChapter);
                        handleDownloadDoc(currentChapter.title, md);
                      }}
                    >
                      <Download size={13} /> 下载 Markdown
                    </button>
                  </div>
                </div>

                {/* 文档核心内容区 */}
                <article className="doc-article-body">
                  <h1 className="doc-title">{currentChapter.title}</h1>
                  <p className="doc-lead-summary">{currentChapter.summary}</p>

                  {/* 核心教学目标与预备知识 */}
                  <div className="doc-objectives-box">
                    <h4>
                      <Compass size={15} /> 章节核心概念与技术目标
                    </h4>
                    <ul>
                      {currentChapter.objectives.map((obj, i) => (
                        <li key={i}>
                          <Check size={14} /> {obj}
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* 文档段落详述与架构规约 */}
                  <div className="doc-section">
                    <h2>一、架构拓扑与运行机制</h2>
                    <p>
                      在百川 OS 运行时架构中，每一个功能模块均以独立插件（Plugin Container）形态加载。
                      宿主系统通过受控 IPC 管道对外透出机器人底层控制原语，并通过双向权限沙箱机制拦截越权调用。
                      本章节重点指导开发者在工业标准环境中配置工程依赖、声明能力清单以及完成首个通信握手。
                    </p>
                    <div className="doc-callout info">
                      <Sparkles size={16} />
                      <div>
                        <strong>百川架构设计原则：</strong>
                        <span>所有涉及硬件物理动作（如协作臂轴动、AGV 行走、夹爪动作）的指令，必须在 manifest.json 中显式申请 permissions，并在执行前通过工业急停安全校验。</span>
                      </div>
                    </div>
                  </div>

                  {/* 规约参数表格 */}
                  <div className="doc-section">
                    <h2>二、核心规约与配置参数清单</h2>
                    <p>以下为当前章节涉及的标准化配置字段契约，供开发与接入时对照校验：</p>
                    <div className="doc-table-wrapper">
                      <table className="doc-spec-table">
                        <thead>
                          <tr>
                            <th>参数字段</th>
                            <th>数据类型</th>
                            <th>必填</th>
                            <th>缺省值</th>
                            <th>规范描述与约束</th>
                          </tr>
                        </thead>
                        <tbody>
                          <tr>
                            <td><code>target.id</code></td>
                            <td><code>string</code></td>
                            <td><span className="required-tag">必填</span></td>
                            <td>-</td>
                            <td>遵循反向域名规范，如 <code>com.vendor.plugin-name</code></td>
                          </tr>
                          <tr>
                            <td><code>runtime.target</code></td>
                            <td><code>'node18' | 'es2022'</code></td>
                            <td><span className="required-tag">必填</span></td>
                            <td><code>node18</code></td>
                            <td>指定百川插件编译目标运行环境</td>
                          </tr>
                          <tr>
                            <td><code>telemetry.intervalMs</code></td>
                            <td><code>number</code></td>
                            <td>可选</td>
                            <td><code>20</code></td>
                            <td>高频遥测心跳上报周期（单位：毫秒，最小 10ms）</td>
                          </tr>
                          <tr>
                            <td><code>safety.timeoutMs</code></td>
                            <td><code>number</code></td>
                            <td>可选</td>
                            <td><code>3000</code></td>
                            <td>通信异常后触发软急停安全阻断的超时阈值</td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* 核心原语代码示例 */}
                  {currentChapter.codeSnippet && (
                    <div className="doc-section">
                      <h2>三、核心 API 原语实现与调用示例</h2>
                      <p>
                        以下代码展示了标准 TypeScript 实现样例，开发者可直接复制到本地工程调试运行：
                      </p>
                      <div className="material-code-block">
                        <div className="code-block-header">
                          <span>
                            <FileCode size={14} /> 核心代码实现 ({currentChapter.codeSnippet.language})
                          </span>
                          <button
                            className="copy-code-btn"
                            onClick={() => {
                              navigator.clipboard?.writeText(currentChapter.codeSnippet!.code);
                              showToast('代码已成功复制到剪贴板！');
                            }}
                          >
                            复制代码
                          </button>
                        </div>
                        <pre>
                          <code>{currentChapter.codeSnippet.code}</code>
                        </pre>
                      </div>
                    </div>
                  )}

                  {/* 工业避坑指南 */}
                  {currentChapter.tips && currentChapter.tips.length > 0 && (
                    <div className="doc-section">
                      <h2>四、工业现场实战避坑指南</h2>
                      <div className="material-tips-card">
                        <strong>💡 工业实操排错建议：</strong>
                        <ul>
                          {currentChapter.tips.map((tip, idx) => (
                            <li key={idx}>{tip}</li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  )}

                  {/* 文档底部操作区 */}
                  <div className="doc-footer-bar">
                    <button
                      className={`mark-done-btn ${isCurrentChapterDone ? 'is-done' : ''}`}
                      onClick={() => handleToggleChapterComplete(currentChapter.id)}
                    >
                      <CheckCircle2 size={16} />
                      <span>{isCurrentChapterDone ? '已读完本节文档' : '标记为已读完'}</span>
                    </button>

                    <div className="doc-nav-buttons">
                      {currentChapterIndex > 0 && (
                        <button
                          className="chapter-nav-btn"
                          onClick={() => {
                            setCurrentChapterIndex(currentChapterIndex - 1);
                            setVideoProgressSeconds(0);
                            window.scrollTo({ top: 0, behavior: 'instant' });
                          }}
                        >
                          <ArrowLeft size={14} /> 上一节文档
                        </button>
                      )}
                      {currentChapterIndex < currentCourse.chapters.length - 1 && (
                        <button
                          className="chapter-nav-btn is-next"
                          onClick={() => {
                            setCurrentChapterIndex(currentChapterIndex + 1);
                            setVideoProgressSeconds(0);
                            window.scrollTo({ top: 0, behavior: 'instant' });
                          }}
                        >
                          下一节文档 <ArrowRight size={14} />
                        </button>
                      )}
                    </div>
                  </div>
                </article>
              </div>
            ) : (
              /* 模式二：核心视频播放器与精炼提要 */
              <>
                <div className="video-player-container">
                  <div className="video-screen">
                    {/* 仿真视频画面背景与工业动效演示 */}
                    <div className="video-canvas-mock">
                      <div className="video-ambient-glow" />
                      <div className="video-overlay-info">
                        <span className="video-indicator">
                          {isPlaying ? '● 正在播放' : '❚❚ 已暂停'} · {playbackSpeed}x 速度
                        </span>
                        <h2 className="video-chapter-title">{currentChapter.title}</h2>
                        <p className="video-course-name">{currentCourse.title}</p>
                      </div>

                      {/* 工业机械手/协议接入动画图形指示 */}
                      <div className="video-visual-art">
                        <div className="radar-circle circle-1" />
                        <div className="radar-circle circle-2" />
                        <div className="center-node">
                          <Cpu size={32} />
                        </div>
                      </div>
                    </div>

                    {/* 视频控制器条 */}
                    <div className="video-controls">
                      {/* 进度条 */}
                      <div
                        className="video-progress-track"
                        onClick={e => {
                          const rect = e.currentTarget.getBoundingClientRect();
                          const ratio = (e.clientX - rect.left) / rect.width;
                          setVideoProgressSeconds(Math.floor(ratio * currentChapter.durationSeconds));
                        }}
                      >
                        <div
                          className="video-progress-current"
                          style={{
                            width: `${(videoProgressSeconds / currentChapter.durationSeconds) * 100}%`,
                          }}
                        />
                      </div>

                      <div className="video-controls-bottom">
                        <div className="controls-left">
                          <button
                            className="ctrl-btn ctrl-play"
                            onClick={() => setIsPlaying(!isPlaying)}
                            title={isPlaying ? '暂停' : '播放'}
                          >
                            {isPlaying ? <Pause size={18} /> : <Play size={18} />}
                          </button>

                          <div className="ctrl-time">
                            <span>{formatTime(videoProgressSeconds)}</span>
                            <span>/</span>
                            <span>{currentChapter.duration}</span>
                          </div>

                          <button
                            className="ctrl-btn"
                            onClick={() => setIsMuted(!isMuted)}
                            title={isMuted ? '取消静音' : '静音'}
                          >
                            {isMuted ? <VolumeX size={16} /> : <Volume2 size={16} />}
                          </button>
                        </div>

                        <div className="controls-right">
                          {/* 倍速切换 */}
                          <div className="speed-selector">
                            {[1.0, 1.25, 1.5, 2.0].map(speed => (
                              <button
                                key={speed}
                                className={`speed-btn ${playbackSpeed === speed ? 'active' : ''}`}
                                onClick={() => setPlaybackSpeed(speed)}
                              >
                                {speed}x
                              </button>
                            ))}
                          </div>

                          <button
                            className="ctrl-btn"
                            onClick={() => showToast('已切换至全屏模式 (模拟演示)')}
                            title="全屏"
                          >
                            <Maximize2 size={16} />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* 播放器下方快速操作条 */}
                  <div className="video-action-bar">
                    <div className="action-left">
                      <button
                        className={`mark-done-btn ${isCurrentChapterDone ? 'is-done' : ''}`}
                        onClick={() => handleToggleChapterComplete(currentChapter.id)}
                      >
                        <CheckCircle2 size={16} />
                        <span>{isCurrentChapterDone ? '已完成本节学习' : '标记为已学完'}</span>
                      </button>
                    </div>

                    <div className="action-right">
                      {currentChapterIndex > 0 && (
                        <button
                          className="chapter-nav-btn"
                          onClick={() => {
                            setCurrentChapterIndex(currentChapterIndex - 1);
                            setVideoProgressSeconds(0);
                          }}
                        >
                          <ArrowLeft size={14} /> 上一节
                        </button>
                      )}
                      {currentChapterIndex < currentCourse.chapters.length - 1 && (
                        <button
                          className="chapter-nav-btn is-next"
                          onClick={() => {
                            setCurrentChapterIndex(currentChapterIndex + 1);
                            setVideoProgressSeconds(0);
                          }}
                        >
                          下一节 <ArrowRight size={14} />
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                {/* 章节学习资料与说明文档 (Chapter Material) */}
                <div className="chapter-material-section">
                  <div className="material-header">
                    <div className="material-header-main">
                      <span className="material-badge">章节学习资料与技术说明</span>
                      <h3>{currentChapter.title}</h3>
                    </div>
                    <div className="material-header-actions">
                      <button
                        className="download-notes-btn"
                        onClick={() => showToast('已开始下载本节课件与配套源码包 (.zip)')}
                      >
                        <Download size={14} /> 下载配套工程资料
                      </button>
                    </div>
                  </div>

                  <div className="material-content">
                    <div className="material-summary-block">
                      <h4>
                        <Compass size={16} /> 本节教学目标与核心概念
                      </h4>
                      <p>{currentChapter.summary}</p>
                      <ul className="objectives-list">
                        {currentChapter.objectives.map((obj, i) => (
                          <li key={i}>
                            <Check size={14} /> {obj}
                          </li>
                        ))}
                      </ul>
                    </div>

                    {/* 代码高亮与核心原语示例 */}
                    {currentChapter.codeSnippet && (
                      <div className="material-code-block">
                        <div className="code-block-header">
                          <span>
                            <FileCode size={14} /> 核心原语代码示例 (
                            {currentChapter.codeSnippet.language})
                          </span>
                          <button
                            className="copy-code-btn"
                            onClick={() => {
                              navigator.clipboard?.writeText(currentChapter.codeSnippet!.code);
                              showToast('代码已成功复制到剪贴板！');
                            }}
                          >
                            复制代码
                          </button>
                        </div>
                        <pre>
                          <code>{currentChapter.codeSnippet.code}</code>
                        </pre>
                      </div>
                    )}

                    {/* 关键提示与注意事项 */}
                    {currentChapter.tips && (
                      <div className="material-tips-card">
                        <strong>💡 工业实战避坑提示：</strong>
                        <ul>
                          {currentChapter.tips.map((tip, idx) => (
                            <li key={idx}>{tip}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                </div>
              </>
            )}
          </main>

          {/* 右侧课程完整章节目录 */}
          <aside className="classroom-sidebar">
            <div className="syllabus-card">
              <div className="syllabus-header">
                <h3>课程目录</h3>
                <span className="syllabus-count">共 {currentCourse.chapters.length} 节</span>
              </div>

              <div className="syllabus-list">
                {currentCourse.chapters.map((ch, idx) => {
                  const isSelected = idx === currentChapterIndex;
                  const isDone = (completedChapters[currentCourse.id] || new Set()).has(ch.id);

                  return (
                    <button
                      key={ch.id}
                      className={`syllabus-item ${isSelected ? 'is-selected' : ''} ${
                        isDone ? 'is-done' : ''
                      }`}
                      onClick={() => {
                        setCurrentChapterIndex(idx);
                        setVideoProgressSeconds(0);
                        if (currentCourse.courseType === 'video') {
                          setIsPlaying(true);
                        }
                      }}
                    >
                      <div className="syllabus-item-status">
                        {isDone ? (
                          <CheckCircle2 size={16} className="status-icon done" />
                        ) : isSelected ? (
                          <Play size={14} className="status-icon active" />
                        ) : (
                          <Circle size={14} className="status-icon pending" />
                        )}
                      </div>

                      <div className="syllabus-item-info">
                        <span className="syllabus-item-title">{ch.title}</span>
                        <div className="syllabus-item-meta">
                          {currentCourse.courseType === 'video' ? (
                            <span className="ch-meta-item">
                              <Video size={11} /> {ch.duration}
                            </span>
                          ) : (
                            <span className="ch-meta-item ch-meta-doc">
                              <FileText size={11} /> {ch.docReadTime || '10分钟'}
                            </span>
                          )}
                          <span className="ch-meta-sep">·</span>
                          <span className="ch-state">
                            {isDone ? '已完成' : isSelected ? '学习中' : '未开始'}
                          </span>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* 学习答疑支持入口 */}
              <div className="syllabus-support-box">
                <div className="support-title">
                  <HelpCircle size={15} />
                  <span>学习中遇到疑问？</span>
                </div>
                <p>百川官方架构师与技术专家在开发者社区随时提供代码级答疑与方案辅导。</p>
                {onOpenCommunity && (
                  <button className="support-link-btn" onClick={onOpenCommunity}>
                    <span>前往开发者社区求助</span>
                    <ExternalLink size={13} />
                  </button>
                )}
              </div>
            </div>
          </aside>
        </div>

        {/* 轻量全局 Toast */}
        {toastMessage && (
          <div className="academy-toast" role="status">
            <Check size={16} /> {toastMessage}
          </div>
        )}
      </div>
    );
  }

  // =========================================================================
  // 视图一：墨影学院大厅与课程资源概况（Catalog View）
  // =========================================================================
  return (
    <div className="academy-page">
      {/* 顶部 Hero 与学院定位概况 */}
      <header className="academy-hero">
        <div className="academy-hero-main">
          <div className="academy-hero-copy">
            <h1 className="academy-hero-title">墨影学院</h1>
            <p className="academy-hero-desc">
              面向插件开发者、设备厂商及系统集成商，提供体系化的技术课程、角色学习路径、项目实训及技能认证，掌握百川生态核心开发技能。
            </p>
          </div>
        </div>
      </header>

      {/* 核心四大功能模块导航 Tabs */}
      <nav className="academy-nav-tabs" aria-label="学院模块导航">
        <div className="nav-tab-pills">
          <button
            className={`nav-pill ${activeTab === 'courses' ? 'active' : ''}`}
            onClick={() => setActiveTab('courses')}
          >
            <BookOpen size={16} />
            <span>推荐课程</span>
          </button>
          <button
            className={`nav-pill ${activeTab === 'paths' ? 'active' : ''}`}
            onClick={() => setActiveTab('paths')}
          >
            <Compass size={16} />
            <span>角色学习路径</span>
          </button>
          <button
            className={`nav-pill ${activeTab === 'labs' ? 'active' : ''}`}
            onClick={() => setActiveTab('labs')}
          >
            <Laptop size={16} />
            <span>项目实训</span>
          </button>
          <button
            className={`nav-pill ${activeTab === 'certifications' ? 'active' : ''}`}
            onClick={() => setActiveTab('certifications')}
          >
            <Award size={16} />
            <span>技能认证</span>
          </button>
        </div>
      </nav>

      {/* 模块内容区 */}
      <div className="academy-content">
        {/* ===================================================================
            TAB 1: 推荐课程模块 (Recommended Courses)
            =================================================================== */}
        {activeTab === 'courses' && (() => {
          // 渲染统一规格的课程卡片（严格区分视频课程与文档课程展示规范）
          const renderCard = (course: Course) => {
            const completedSet = completedChapters[course.id] || new Set();
            const hasStarted = completedSet.size > 0;
            const progressPct = Math.round(
              (completedSet.size / course.chapters.length) * 100
            );

            return (
              <article key={course.id} className={`course-card is-${course.courseType}`}>
                <div className="course-card-top">
                  <div className="course-card-badges">
                    {course.courseType === 'video' ? (
                      <span className="course-type-badge video-badge">
                        <Video size={11} /> 视频
                      </span>
                    ) : (
                      <span className="course-type-badge doc-badge">
                        <FileText size={11} /> 文档
                      </span>
                    )}
                    <span className="course-direction-tag">{course.direction}</span>
                  </div>
                  <span className={`course-difficulty-pill diff-${course.difficulty}`}>
                    {course.difficulty}
                  </span>
                </div>

                <h3 className="course-card-title">{course.title}</h3>
                <p className="course-card-desc">{course.summary}</p>

                {/* 适合人群与教学形式 */}
                <div className="course-card-target">
                  <span className="target-label">适合对象：</span>
                  <span>{course.targetAudience}</span>
                </div>

                {/* 核心学习要点标签 */}
                <div className="course-card-tags">
                  {course.tags.map(t => (
                    <span key={t} className="c-tag">
                      #{t}
                    </span>
                  ))}
                </div>

                {/* 学习进度条（若已有学习记录） */}
                {hasStarted && (
                  <div className="course-card-progress">
                    <div className="progress-labels">
                      <span>
                        已学完 {completedSet.size}/{course.chapters.length}{' '}
                        {course.courseType === 'video' ? '节' : '篇'}
                      </span>
                      <span className="pct-text">{progressPct}%</span>
                    </div>
                    <div className="card-progress-track">
                      <div
                        className="card-progress-bar"
                        style={{ width: `${progressPct}%` }}
                      />
                    </div>
                  </div>
                )}

                {/* 卡片底栏：严格单行水平对齐 */}
                <div className="course-card-footer">
                  <div className="course-meta-text">
                    <span className="course-meta-item">
                      <Clock size={13} />
                      <span>{course.duration}</span>
                    </span>
                    <span className="course-meta-dot">·</span>
                    {course.courseType === 'video' ? (
                      <span className="course-meta-item">
                        <Video size={13} />
                        <span>{course.chaptersCount} 节视频</span>
                      </span>
                    ) : (
                      <span className="course-meta-item course-meta-doc">
                        <FileText size={13} />
                        <span>{course.chaptersCount} 篇文档</span>
                      </span>
                    )}
                    {course.wordCount && (
                      <>
                        <span className="course-meta-dot">·</span>
                        <span className="course-meta-item course-meta-words">
                          <span>{course.wordCount}</span>
                        </span>
                      </>
                    )}
                  </div>

                  <button
                    className="start-learning-btn"
                    onClick={() => handleStartCourse(course)}
                  >
                    {hasStarted ? '继续学习' : '开始学习'}
                    <ArrowRight size={14} />
                  </button>
                </div>
              </article>
            );
          };

          return (
            <section className="courses-tab-section">
              {/* 技术方向筛选栏 */}
              <div className="direction-filter-row">
                <div className="direction-tabs">
                  {(
                    [
                      '全部方向',
                      '百川插件开发入门',
                      '设备接入与能力建模',
                      '行业方案交付实训',
                    ] as CourseDirection[]
                  ).map(dir => (
                    <button
                      key={dir}
                      className={`dir-btn ${selectedDirection === dir ? 'active' : ''}`}
                      onClick={() => setSelectedDirection(dir)}
                    >
                      {dir}
                    </button>
                  ))}
                </div>

                <div className="courses-count">
                  共计 <strong>{filteredCourses.length}</strong> 门推荐课程
                </div>
              </div>

              {/* 课程列表：全部混排呈现，不划分视频/文档专区，不分两截 */}
              <div className="courses-grid">
                {filteredCourses.map(course => renderCard(course))}
              </div>
            </section>
          );
        })()}

        {/* ===================================================================
            TAB 2: 角色学习路径模块 (Role Learning Paths)
            =================================================================== */}
        {activeTab === 'paths' && (
          <section className="paths-tab-section">
            <div className="section-head-note">
              <h2>角色化技术成长路径</h2>
              <p>
                根据插件开发者、设备厂商及系统集成商不同定位量身定制阶段性学习路线，按图索骥掌握产业实战技能。
              </p>
            </div>

            <div className="role-paths-grid">
              {ROLE_PATHS.map(path => (
                <div key={path.id} className="role-path-card">
                  <div className="path-card-header">
                    <div className="path-role-badge" style={{ background: path.iconBg }}>
                      <Compass size={18} />
                      <span>{path.role}</span>
                    </div>
                    <span className="path-highlight-tag">{path.badge}</span>
                  </div>

                  <h3 className="path-title">{path.title}</h3>
                  <p className="path-desc">{path.summary}</p>
                  <div className="path-target-box">
                    <strong>目标受众：</strong> {path.targetUser}
                  </div>

                  {/* 阶段性路线列表 */}
                  <div className="path-stages-flow">
                    {path.stages.map(st => (
                      <div key={st.stageNumber} className="stage-step-item">
                        <div className="stage-number">{st.stageNumber}</div>
                        <div className="stage-info">
                          <h4>{st.stageTitle}</h4>
                          <p>{st.description}</p>
                          <div className="stage-skills">
                            {st.keySkills.map(sk => (
                              <span key={sk} className="skill-chip">
                                {sk}
                              </span>
                            ))}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="path-card-footer">
                    <button
                      className="select-path-btn"
                      onClick={() => {
                        const targetCourse =
                          COURSES.find(c => c.id === path.stages[0].relatedCourseId) || COURSES[0];
                        handleStartCourse(targetCourse);
                      }}
                    >
                      <span>选择该学习路径并开启课程</span>
                      <ArrowRight size={15} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* ===================================================================
            TAB 3: 项目实训模块 (Hands-on Project Labs)
            =================================================================== */}
        {activeTab === 'labs' && (
          <section className="labs-tab-section">
            <div className="section-head-note">
              <h2>产线级工业项目实训</h2>
              <p>
                脱离纸上谈兵，依托百川云端虚拟仿真沙箱与真实工业协议，动手攻克真实产线工程挑战。
              </p>
            </div>

            <div className="labs-grid">
              {PROJECT_LABS.map(lab => (
                <article key={lab.id} className="lab-card">
                  <div className="lab-card-header">
                    <span className="lab-level-badge">{lab.difficulty}</span>
                    <span className="lab-time">
                      <Clock size={13} /> {lab.duration}
                    </span>
                  </div>

                  <h3 className="lab-title">{lab.title}</h3>
                  <div className="lab-scenario-line">
                    <strong>真实工业场景：</strong>
                    <span>{lab.scenario}</span>
                  </div>

                  <div className="lab-detail-row">
                    <span className="row-label">实训环境：</span>
                    <span className="row-val">{lab.environment}</span>
                  </div>

                  <div className="lab-detail-row">
                    <span className="row-label">考核成果：</span>
                    <span className="row-val">{lab.deliverables}</span>
                  </div>

                  <div className="lab-skills-tags">
                    {lab.skills.map(sk => (
                      <span key={sk} className="lab-sk-pill">
                        #{sk}
                      </span>
                    ))}
                  </div>

                  <div className="lab-card-footer">
                    <button
                      className="launch-lab-btn"
                      onClick={() => showToast(`已启动实训沙箱环境：${lab.title}`)}
                    >
                      <Terminal size={15} />
                      <span>启动云端实训沙箱</span>
                      <ChevronRight size={14} />
                    </button>
                  </div>
                </article>
              ))}
            </div>
          </section>
        )}

        {/* ===================================================================
            TAB 4: 技能认证体系模块 (Skill Certification)
            =================================================================== */}
        {activeTab === 'certifications' && (
          <section className="cert-tab-section">
            <div className="section-head-note">
              <h2>百川官方技术认证体系</h2>
              <p>
                通过体系化技术学习与产线级实训考核，获取墨影官方认证工程师凭证，成为受行业认可的生态专家。
              </p>
            </div>

            <div className="cert-cards-grid">
              {CERTIFICATIONS.map(cert => (
                <div key={cert.id} className="cert-card">
                  <div className="cert-badge-shield" style={{ color: cert.badgeColor }}>
                    <ShieldCheck size={36} />
                    <span className="shield-level">{cert.level}认证</span>
                  </div>

                  <h3 className="cert-title">{cert.title}</h3>
                  <p className="cert-summary">{cert.summary}</p>

                  <div className="cert-specs-box">
                    <div className="spec-col">
                      <span className="spec-lbl">考核时长</span>
                      <strong>{cert.examDuration}</strong>
                    </div>
                    <div className="spec-col">
                      <span className="spec-lbl">及格标准</span>
                      <strong>{cert.passingScore}</strong>
                    </div>
                    <div className="spec-col">
                      <span className="spec-lbl">面向角色</span>
                      <strong>{cert.targetRole.split('、')[0]}</strong>
                    </div>
                  </div>

                  <div className="cert-prerequisites">
                    <strong>报名资格与准入条件：</strong>
                    <ul>
                      {cert.prerequisites.map((p, i) => (
                        <li key={i}>
                          <Check size={13} /> {p}
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="cert-footer">
                    <button
                      className="apply-cert-btn"
                      onClick={() => showToast(`已提交「${cert.title}」考核预约申请，稍后将推送考题须知`)}
                    >
                      <span>预约在线考核认证</span>
                      <ArrowRight size={15} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}
      </div>

      {/* 底部轻量 Toast 提示 */}
      {toastMessage && (
        <div className="academy-toast" role="status">
          <Check size={16} /> {toastMessage}
        </div>
      )}
    </div>
  );
}
