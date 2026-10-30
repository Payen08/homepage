import { useState } from 'react';
import { motion } from 'motion/react';
import {
  Bot,
  Sparkles,
  Terminal,
  Cpu,
  Check,
  Copy,
  ArrowUpRight,
  ArrowRight,
  Play,
  Clock,
  Calendar,
  ShieldCheck,
  FileCode,
  FileText,
  FileSpreadsheet,
  Eye,
  GitBranch,
  Layers,
  Download,
  Activity,
  ChevronRight,
  CheckCircle2,
  Box,
  Code2,
} from 'lucide-react';
import './HarnessShowcase.css';
import { HomeSectionHeading } from './HomeSectionHeading';

interface HarnessShowcaseProps {
  onOpenDeveloperCenter?: () => void;
  onOpenMarket?: () => void;
}

// 4 种运行模式数据定义
const HARNESS_MODES = [
  {
    id: 'standard',
    name: '标准交付模式',
    en: 'STANDARD MODE',
    tag: '工业高可靠交付',
    icon: Box,
    desc: '功能完备的工业具身控制 Agent，内置微米级视觉定位、双向安全互锁检查、行为树生命周期流转、PLC 握手与长时序异常自治重试。',
    features: ['全链路安全互锁防护', '行为树状态机调度', 'SCADA 双向遥测流', '工位异常断点接续'],
    sampleTitle: 'CNC 上下料全流程工步',
    sampleCode: `// 标准模式：行为树编排与安全互锁闭环
const cell = new MoyingWorkcell({ stationId: 'CNC_04' });

// 1. 安全栅与机械臂互锁校验
await cell.safety.verifyInterlockReady();

// 2. 调度复合机器人进入工位并执行高精微米级对准
const pose = await cell.vision.getAlignmentPose({ confidence: 0.99 });
await cell.robot.dockToSpindle(pose.target, { maxToleranceMm: 0.05 });

// 3. 完成毛坯装夹并向机床写入加工放行握手信号
await cell.plc.writeRegister('SPINDLE_CLAMP_READY', true);`,
  },
  {
    id: 'ptc',
    name: 'PTC 敏捷代码模式',
    en: 'PROGRAMMATIC TOOL CALLING',
    tag: '代码即工具编排',
    icon: Code2,
    desc: '具备标准模式全部能力，并通过百川 Code Mode SDK 将离散工业能力呈现为强类型对象。让工程师仅用单段 TypeScript 脚本即可优雅聚合多传感器采集、运动解算与实时控制。',
    features: ['TypeScript 强类型契约', '零延迟本地函数调度', '支持链式流式编排', '微秒级多轴同步'],
    sampleTitle: '单脚本跨工位动态复合抓取',
    sampleCode: `// PTC 模式：用单段 TypeScript 脚本聚合多步复合工具调用
import { BaichuanSDK } from '@moying/baichuan-sdk';

const { vision, robot, scada } = BaichuanSDK.useCluster('CELL_B');

// 并行读取视觉激光雷达与 SCADA 力传感器流
const [partPose, torqueLimit] = await Promise.all([
  vision.detectSubMillimeterPose({ model: 'GEAR_X' }),
  scada.getDynamicTorqueLimits({ axis: 6 })
]);

// 模型生成的高阶平滑轨迹直接进给至底层伺服
await robot.arm.executeConstrainedTrajectory(partPose.spline, torqueLimit);`,
  },
  {
    id: 'minimal',
    name: '极简标定模式',
    en: 'MINIMAL CALIBRATION',
    tag: '零开销底层通道',
    icon: Terminal,
    desc: '剔除所有上层业务调度与复杂 UI 负载，仅保留毫秒级底盘驱动通道与轻量驱动编辑工具。专用于现场机器人关节机械零点标定、雷达点云基准校对与微秒级通信基准测试。',
    features: ['直通 CAN/EtherCAT 总线', '极低开销无抖动延迟', '现场零点快速校准', '最小依赖环境基准测试'],
    sampleTitle: '伺服驱动原生轴控与零点回归',
    sampleCode: `# 极简模式：直接驱动总线原生通信
$ moying-raw-bus --bus=can0 --node=0x12 --speed=1M
[READY] CAN0 Socket initialized.
> SEND 0x201 [0x2B, 0x40, 0x60, 0x00, 0x06, 0x00] # Servo Enable
< ACK  0x181 [0x60, 0x41, 0x60, 0x00, 0x27, 0x02] # State: Switched On
> CALIBRATE_ZERO --axis=1..6 --tolerance=0.001deg
[CALIBRATED] J1: 0.000° | J2: 0.000° | J3: 0.000° (Error: 0.0002°)`,
  },
  {
    id: 'creator',
    name: 'AI 创造模式',
    en: 'CREATOR / STUDIO',
    tag: '对话即做插件',
    icon: Sparkles,
    desc: '用于快速创建与定制工业插件预设。具备运行时环境反射、内存中沙箱试验插件、AI 技能辅助生成，并根据现场设备自动生成低代码控制界面。',
    features: ['自然语言意图转工业节点', '动态运行时热加载', '内置数字孪生防碰撞验证', '自动生成 Webview 仪表盘'],
    sampleTitle: '对话生成立体定位插件',
    sampleCode: `// 创造模式：AI 动态生成并注入运行时的双目对准插件
@moying/creator: 正在分析输入: "双相机立体定位与微米级闭环对准"
✓ 识别硬件提供方: 2x Basler GigE 相机, 1x 墨影 6-DOF 机械臂
✓ 动态装配行为树节点: DualCameraPrecisionAlignNode.ts
✓ 数字孪生环境碰撞干涉验证通过 (0 碰撞, 最大对齐残差 0.024mm)
✓ 实时生成配置界面并热注入百川控制台: AlignmentConfigPanel.tsx
>> 插件已就绪，立即在产线启用！`,
  },
];

// 运行轨迹 3 泳道数据
const TRACE_STEPS = [
  {
    step: 1,
    time: '09:14:02.108',
    lane: 'input',
    laneName: '工单输入',
    title: 'CNC #04 加工完成中断',
    badge: 'INTERRUPT',
    badgeTone: 'cyan',
    desc: '机床 PLC 通过 Modbus TCP 发送放行信号，触发自动下料工单。',
    duration: '0.04ms',
    details: { payload: '{ stationId: "CNC_04", palletId: "P-882", partType: "AL-6061" }', result: '工单校验通过，进入待料就位状态' },
  },
  {
    step: 2,
    time: '09:14:02.112',
    lane: 'model',
    laneName: '具身决策',
    title: '视觉姿态解算与无碰撞进给规划',
    badge: 'AI INFERENCE',
    badgeTone: 'indigo',
    desc: '融合 3D 激光点云与相机图像，解算工件抓取位姿，规划 6 轴运动学样条。',
    duration: '2.14ms',
    details: { payload: '{ confidenceThreshold: 0.98, maxToleranceMm: 0.05 }', result: '位姿有效 (置信度 99.8%), TCP 偏移 dx=+0.02mm, dy=-0.01mm' },
  },
  {
    step: 3,
    time: '09:14:02.115',
    lane: 'tools',
    laneName: '工业执行',
    title: '执行末端微米进给与安全互锁握手',
    badge: 'ACTUATION',
    badgeTone: 'emerald',
    desc: '六轴末端以 0.2 倍速微米级进给，气爪闭合保压，向 PLC 回传安全互锁解除。',
    duration: '0.12ms',
    details: { payload: '{ gripperForce: 45N, interlockRegister: 40012, value: 1 }', result: '气爪闭合到位，保压 0.6MPa，安全互锁校验安全' },
  },
];

// 自动化定时任务场景
const SCHEDULE_SCENARIOS = [
  {
    id: 'calibration',
    title: '早班开工自检与激光雷达温漂校准',
    time: '每天 07:30 (中国标准时间)',
    badge: '等待触发',
    badgeTone: 'cyan',
    desc: '白班正式开工前半小时，复合机器人自动遍历基准点，校验底盘 32 线激光雷达测距漂移与夹爪机械零点。',
    output: '已预约于每日 07:30 自动激活自检流水线，检查报告将实时归档至 SCADA。',
  },
  {
    id: 'patrol',
    title: '夜班机床巡检与振动异音体检',
    time: '每天 02:00 (中国标准时间)',
    badge: '进行中',
    badgeTone: 'indigo',
    desc: '自主巡检全厂 12 个 CNC 加工中心，红外测温与压电传感器采集主轴振动频谱，标定超出 ISO 10816 振动阈值的部件。',
    output: '正在巡检工位 #07 / 12，当前主轴温度 38.2°C (正常)，未发现共振异常。',
  },
  {
    id: 'oee',
    title: '换模工序重平衡与 OEE 班次日报',
    time: '每周五 18:00 (中国标准时间)',
    badge: '已完成',
    badgeTone: 'emerald',
    desc: '自动聚合各工序工位节拍、空闲与报警时长，生成综合设备稼动率 (OEE) 报表并推送企业协同平台。',
    output: '本周全线综合 OEE 达到 89.4%，瓶颈工位 CNC_02 节拍已优化 14 秒。',
  },
];

// 交付物文件列表
const DELIVERABLE_FILES = [
  { name: 'PrecisionDockingNode.ts', type: 'TypeScript 行为树节点', size: '3.4 KB', icon: FileCode, tone: 'indigo' },
  { name: 'modbus_s7_mapping.yaml', type: 'PLC 寄存器配置表', size: '1.8 KB', icon: FileText, tone: 'cyan' },
  { name: 'vision_defect_eval.py', type: '视觉缺陷识别脚本', size: '4.2 KB', icon: FileCode, tone: 'orange' },
  { name: 'workcell_oee_report.xlsx', type: '工位稼动率日报', size: '48 KB', icon: FileSpreadsheet, tone: 'emerald' },
  { name: 'iso_safety_audit.pdf', type: '安全互锁认证报告', size: '1.2 MB', icon: FileText, tone: 'rose' },
];

export function HarnessShowcase({ onOpenDeveloperCenter, onOpenMarket }: HarnessShowcaseProps) {
  // 运行模式激活项
  const [activeMode, setActiveMode] = useState<string>('standard');
  const [copiedCode, setCopiedCode] = useState(false);

  // 能力预览选项卡 (4项：运行轨迹 / 自动化任务 / 交付物代码Diff / 创造模式)
  const [activeCapTab, setActiveCapTab] = useState<'trace' | 'schedule' | 'deliverables' | 'creator'>('trace');

  // 轨迹详情交互展开
  const [selectedTraceStep, setSelectedTraceStep] = useState<number>(2);

  // 自动化任务当前选中场景
  const [activeScenario, setActiveScenario] = useState<string>('calibration');

  // 开发者体验快速开始方式 (cli / git / desktop)
  const [quickstartTab, setQuickstartTab] = useState<'cli' | 'git' | 'desktop'>('cli');
  const [copiedCmd, setCopiedCmd] = useState<string | null>(null);

  const currentMode = HARNESS_MODES.find((m) => m.id === activeMode) || HARNESS_MODES[0];

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedCmd(id);
    setTimeout(() => setCopiedCmd(null), 2000);
  };

  return (
    <section className="harness-root-section" id="harness-ecosystem" aria-label="墨影工业 Harness 开放生态">
      {/* 氛围渐变光晕 */}
      <div className="harness-glow harness-glow-1" aria-hidden="true" />
      <div className="harness-glow harness-glow-2" aria-hidden="true" />

      <div className="harness-container">
        {/* ================= 1. 核心架构与设计思路 (Agent = Model + Harness) ================= */}
        <div className="harness-hero-block">
          <div className="harness-badge-row">
            <span className="harness-preview-pill">
              <Sparkles size={13} className="text-indigo-400" />
              <span>MOYING HARNESS 工业具身引擎</span>
            </span>
            <span className="harness-badge-dot">
              <span className="pulse-indicator" />
              <span>开源 · 开放 · 确定性</span>
            </span>
          </div>

          <h2 className="harness-hero-title">
            能力不断拓展，现场由你掌握
          </h2>

          <p className="harness-hero-subtitle">
            Harness 连接具身大模型与工业现场工具，协助完成严苛工业任务。<br className="hidden sm:inline" />
            让工业 Agent 在真实产线中持续稳定工作，把每一次模型推理转化为确定性的物理生产力。
          </p>

          {/* 具身智能公式卡片: Agent = Model + Harness */}
          <motion.div
            className="harness-formula-card"
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
          >
            <div className="formula-part">
              <div className="formula-icon-box bg-purple-500/10 text-purple-400 border-purple-500/20">
                <Bot size={22} />
              </div>
              <div className="formula-text">
                <span className="formula-label">具身核心大脑</span>
                <strong>Model &amp; Brain</strong>
                <small>多模态感知与任务级推理规划</small>
              </div>
            </div>

            <div className="formula-operator">+</div>

            <div className="formula-part highlight">
              <div className="formula-icon-box bg-indigo-500/10 text-indigo-400 border-indigo-500/30">
                <Box size={22} />
              </div>
              <div className="formula-text">
                <span className="formula-label text-indigo-400">墨影工业底座</span>
                <strong className="text-indigo-300">Moying Harness</strong>
                <small>微内核 · 插件总线 · 确定性调度</small>
              </div>
            </div>

            <div className="formula-operator">=</div>

            <div className="formula-part">
              <div className="formula-icon-box bg-cyan-500/10 text-cyan-400 border-cyan-500/20">
                <Cpu size={22} />
              </div>
              <div className="formula-text">
                <span className="formula-label">高可靠生产力</span>
                <strong>Industrial Agent</strong>
                <small>微米级执行与现场安全闭环</small>
              </div>
            </div>
          </motion.div>

          {/* 三大设计基石 Pillars */}
          <div className="harness-pillars-grid">
            {/* Pillar 1 */}
            <motion.div
              className="harness-pillar-card"
              initial={{ opacity: 0, y: 14 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.45, delay: 0.05 }}
            >
              <div className="pillar-num">01</div>
              <div className="pillar-meta">
                <span className="pillar-en">MICRO-KERNEL ARCHITECTURE</span>
                <h3>工业微内核</h3>
                <p>
                  底座微内核专注插件生命周期、总线协议调度、热插拔加载与沙箱隔离，不硬编码具体业务逻辑，保障 7×24h 零抖动运行。
                </p>
              </div>
            </motion.div>

            {/* Pillar 2 */}
            <motion.div
              className="harness-pillar-card"
              initial={{ opacity: 0, y: 14 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.45, delay: 0.12 }}
            >
              <div className="pillar-num">02</div>
              <div className="pillar-meta">
                <span className="pillar-en">CAPABILITIES AS PLUGINS</span>
                <h3>一切皆插件</h3>
                <p>
                  视觉质检、末端夹爪对齐、SLAM 建图、PLC 寄存器映射、SCADA 遥测流与 UI 监控面板均由插件承载，通过总线与事件驱动流转。
                </p>
              </div>
            </motion.div>

            {/* Pillar 3 */}
            <motion.div
              className="harness-pillar-card"
              initial={{ opacity: 0, y: 14 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.45, delay: 0.18 }}
            >
              <div className="pillar-num">03</div>
              <div className="pillar-meta">
                <span className="pillar-en">COMPOSE IN CONFIGURATION</span>
                <h3>配置层自由组合</h3>
                <p>
                  工程师无需重新编译底层机器人固件或控制器源码，即可在配置层或行为树可视化画布中，自由插拔、替换或定制任一工位能力。
                </p>
              </div>
            </motion.div>
          </div>
        </div>

        {/* ================= 2. 四大工业运行模式 (Interactive Modes Switcher) ================= */}
        <div className="harness-section-block">
          <HomeSectionHeading
            eyebrow="EXECUTION MODES / 运行模式"
            title="多种运行模式，自如应对多样现场"
            description="无论是标准化产线交付、敏捷脚本编排，还是底层传感器零点标定与新插件创造，墨影 Harness 提供四种深度契合的执行模式。"
          />

          <div className="modes-showcase-container">
            {/* 模式选择按钮组 (Segmented Grid) */}
            <div className="modes-tab-grid">
              {HARNESS_MODES.map((mode) => {
                const Icon = mode.icon;
                const isActive = activeMode === mode.id;
                return (
                  <button
                    key={mode.id}
                    type="button"
                    className={`mode-tab-card ${isActive ? 'is-active' : ''}`}
                    onClick={() => setActiveMode(mode.id)}
                  >
                    <div className="mode-tab-top">
                      <div className="mode-tab-icon">
                        <Icon size={18} />
                      </div>
                      <span className="mode-tab-tag">{mode.tag}</span>
                    </div>
                    <strong className="mode-tab-title">{mode.name}</strong>
                    <span className="mode-tab-en">{mode.en}</span>
                  </button>
                );
              })}
            </div>

            {/* 激活模式的动态详情与代码展示面板 */}
            <div className="mode-preview-window">
              <div className="window-header">
                <div className="window-traffic-lights">
                  <span className="light light-close" />
                  <span className="light light-min" />
                  <span className="light light-max" />
                </div>
                <div className="window-title">
                  <Terminal size={14} className="text-indigo-400" />
                  <span>{currentMode.sampleTitle}</span>
                  <span className="window-badge">{currentMode.tag}</span>
                </div>
                <button
                  type="button"
                  className="copy-snippet-btn"
                  onClick={() => {
                    navigator.clipboard.writeText(currentMode.sampleCode);
                    setCopiedCode(true);
                    setTimeout(() => setCopiedCode(false), 2000);
                  }}
                >
                  {copiedCode ? <Check size={13} className="text-emerald-400" /> : <Copy size={13} />}
                  <span>{copiedCode ? '已复制' : '复制代码'}</span>
                </button>
              </div>

              <div className="window-body">
                {/* 左侧说明与特性 */}
                <div className="window-sidebar">
                  <h4>{currentMode.name}</h4>
                  <p>{currentMode.desc}</p>
                  <div className="window-feature-list">
                    <span className="feature-header">模式核心优势</span>
                    {currentMode.features.map((feat) => (
                      <div key={feat} className="feature-item">
                        <CheckCircle2 size={13} className="text-indigo-400 shrink-0" />
                        <span>{feat}</span>
                      </div>
                    ))}
                  </div>
                  <button
                    type="button"
                    className="mode-cta-link"
                    onClick={onOpenDeveloperCenter}
                  >
                    进入文档查阅完整 API <ArrowUpRight size={14} />
                  </button>
                </div>

                {/* 右侧代码展示 */}
                <div className="window-code-pane">
                  <pre className="code-content">
                    <code>{currentMode.sampleCode}</code>
                  </pre>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ================= 3. 核心能力深度互动体验区 (4 大 Tab Previews) ================= */}
        <div className="harness-section-block">
          <HomeSectionHeading
            eyebrow="CAPABILITIES & TRACE / 能力全貌"
            title="一切皆插件，运行有迹可循"
            description="从任务执行黑匣子、周期性自动化任务，到多样化工业交付物与对话式插件创建，全方位赋能工业开发者。"
          />

          <div className="interactive-caps-wrapper">
            {/* 顶栏能力切换 Tabs */}
            <div className="caps-nav-bar" role="tablist">
              <button
                type="button"
                className={`cap-nav-btn ${activeCapTab === 'trace' ? 'is-active' : ''}`}
                onClick={() => setActiveCapTab('trace')}
              >
                <Activity size={16} />
                <span>运行轨迹与黑匣子</span>
              </button>
              <button
                type="button"
                className={`cap-nav-btn ${activeCapTab === 'schedule' ? 'is-active' : ''}`}
                onClick={() => setActiveCapTab('schedule')}
              >
                <Clock size={16} />
                <span>自动化与定时任务</span>
              </button>
              <button
                type="button"
                className={`cap-nav-btn ${activeCapTab === 'deliverables' ? 'is-active' : ''}`}
                onClick={() => setActiveCapTab('deliverables')}
              >
                <Layers size={16} />
                <span>工业交付物与代码审查</span>
              </button>
              <button
                type="button"
                className={`cap-nav-btn ${activeCapTab === 'creator' ? 'is-active' : ''}`}
                onClick={() => setActiveCapTab('creator')}
              >
                <Sparkles size={16} />
                <span>对话式插件生成演示</span>
              </button>
            </div>

            {/* Tab 1: 运行轨迹黑匣子 (Trajectory / Trace View) */}
            {activeCapTab === 'trace' && (
              <motion.div
                className="cap-panel-card"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.35 }}
              >
                <div className="trace-header-strip">
                  <div className="trace-strip-left">
                    <span className="trace-live-badge">
                      <span className="live-dot" /> LIVE TRACE RECORDER
                    </span>
                    <span className="trace-meta-text">会话 ID: SES_20261019_CNC04 · 状态: 全部完成</span>
                  </div>
                  <div className="trace-strip-right">
                    <span>总耗时: <strong>2.30ms</strong></span>
                    <span>调用工具: <strong>3 项</strong></span>
                    <span>互锁状态: <strong className="text-emerald-400">SAFE LOCKED</strong></span>
                  </div>
                </div>

                {/* 3-Lane 泳道时间线 */}
                <div className="trace-lanes-container">
                  <div className="trace-steps-list">
                    {TRACE_STEPS.map((stepItem) => {
                      const isSelected = selectedTraceStep === stepItem.step;
                      return (
                        <div
                          key={stepItem.step}
                          className={`trace-step-row ${isSelected ? 'is-selected' : ''}`}
                          onClick={() => setSelectedTraceStep(stepItem.step)}
                        >
                          <div className="trace-step-number">0{stepItem.step}</div>
                          <div className="trace-step-lane-tag">
                            <span className={`lane-badge lane-${stepItem.lane}`}>
                              {stepItem.laneName}
                            </span>
                            <span className="step-timestamp">{stepItem.time}</span>
                          </div>
                          <div className="trace-step-info">
                            <h5>{stepItem.title}</h5>
                            <p>{stepItem.desc}</p>
                          </div>
                          <div className="trace-step-timing">
                            <span className="timing-duration">{stepItem.duration}</span>
                            <ChevronRight size={14} className="step-arrow" />
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* 选中的步骤详情黑匣子抽屉 */}
                  {selectedTraceStep && (
                    <div className="trace-step-detail-card">
                      <div className="detail-card-head">
                        <span className="font-semibold text-zinc-100 flex items-center gap-2">
                          <Eye size={14} className="text-indigo-400" />
                          步骤 0{selectedTraceStep} 运行黑匣子快照
                        </span>
                        <span className="status-pill status-ready">已通过审计</span>
                      </div>
                      <div className="detail-meta-box">
                        <div className="meta-subgroup">
                          <span className="meta-sublabel">输入参数 (Payload)</span>
                          <pre className="meta-code-block">{TRACE_STEPS[selectedTraceStep - 1].details.payload}</pre>
                        </div>
                        <div className="meta-subgroup">
                          <span className="meta-sublabel">执行结果 (Result / Feedback)</span>
                          <div className="meta-result-block">{TRACE_STEPS[selectedTraceStep - 1].details.result}</div>
                        </div>
                      </div>
                      <div className="detail-footer-note">
                        <ShieldCheck size={13} className="text-emerald-400" />
                        <span>所有系统提示词、轨迹样条、传感器快照与安全校验均写入不可篡改的工业日志流。</span>
                      </div>
                    </div>
                  )}
                </div>
              </motion.div>
            )}

            {/* Tab 2: 自动化与定时任务 (Scheduled Workflows) */}
            {activeCapTab === 'schedule' && (
              <motion.div
                className="cap-panel-card"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.35 }}
              >
                <div className="workflow-scenarios-grid">
                  {/* 左侧任务列表 */}
                  <div className="scenarios-list">
                    <div className="scenarios-title-row">
                      <span className="text-xs uppercase text-zinc-400 font-semibold tracking-wider">
                        自动化任务清单
                      </span>
                      <span className="text-xs text-indigo-400">已调度 3 个周期任务</span>
                    </div>

                    {SCHEDULE_SCENARIOS.map((item) => {
                      const isCur = activeScenario === item.id;
                      return (
                        <div
                          key={item.id}
                          className={`scenario-card ${isCur ? 'is-active' : ''}`}
                          onClick={() => setActiveScenario(item.id)}
                        >
                          <div className="scenario-top">
                            <span className="scenario-clock flex items-center gap-1.5 text-xs text-zinc-400">
                              <Calendar size={13} className="text-indigo-400" />
                              {item.time}
                            </span>
                            <span className={`status-badge status-${item.badgeTone}`}>
                              {item.badge}
                            </span>
                          </div>
                          <h4>{item.title}</h4>
                          <p>{item.desc}</p>
                        </div>
                      );
                    })}
                  </div>

                  {/* 右侧调度模拟器面板 */}
                  <div className="scenario-runner-panel">
                    <div className="runner-head">
                      <span className="runner-title flex items-center gap-2">
                        <Clock size={15} className="text-cyan-400" />
                        定时作业执行预览 · 仅供演示
                      </span>
                      <div className="flex items-center gap-2">
                        <button type="button" className="runner-action-btn" title="演示操作">
                          <Play size={12} /> 模拟执行
                        </button>
                      </div>
                    </div>

                    {(() => {
                      const cur = SCHEDULE_SCENARIOS.find((s) => s.id === activeScenario) || SCHEDULE_SCENARIOS[0];
                      return (
                        <div className="runner-body">
                          <div className="runner-item">
                            <span className="runner-label">任务触发策略</span>
                            <div className="runner-val font-mono">{cur.time}</div>
                          </div>
                          <div className="runner-item">
                            <span className="runner-label">调度目标与参数</span>
                            <div className="runner-prompt-box">
                              <span className="prompt-quote">“</span>
                              {cur.desc}
                            </div>
                          </div>
                          <div className="runner-item">
                            <span className="runner-label">当前运行输出与反馈</span>
                            <div className="runner-output-box">
                              <div className="flex items-center gap-2 text-xs font-semibold text-emerald-400 mb-1">
                                <CheckCircle2 size={13} /> 执行链路就绪
                              </div>
                              <p className="text-xs text-zinc-300">{cur.output}</p>
                            </div>
                          </div>
                        </div>
                      );
                    })()}
                  </div>
                </div>
              </motion.div>
            )}

            {/* Tab 3: 工业交付物与代码审查 (Deliverables & Code Diff) */}
            {activeCapTab === 'deliverables' && (
              <motion.div
                className="cap-panel-card"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.35 }}
              >
                <div className="deliverables-layout">
                  {/* 文件列表 */}
                  <div className="deliverable-files-pane">
                    <span className="pane-header">工业项目产出交付物</span>
                    <div className="file-items-stack">
                      {DELIVERABLE_FILES.map((file) => {
                        const Icon = file.icon;
                        return (
                          <div key={file.name} className="deliverable-file-item">
                            <div className="file-icon-box">
                              <Icon size={16} className={`text-${file.tone}-400`} />
                            </div>
                            <div className="file-meta">
                              <strong>{file.name}</strong>
                              <span>{file.type} · {file.size}</span>
                            </div>
                            <span className="file-action-tag">就绪</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* 差异比对审查 Code Review Diff */}
                  <div className="diff-review-pane">
                    <div className="diff-header">
                      <div className="flex items-center gap-2">
                        <GitBranch size={15} className="text-indigo-400" />
                        <span className="font-semibold text-zinc-100 text-sm">
                          PrecisionDockingNode.ts · 代码变更审查 (Review Diff)
                        </span>
                      </div>
                      <span className="diff-pill">第 2 轮安全增强评审</span>
                    </div>

                    <div className="diff-code-body font-mono text-xs">
                      <div className="diff-line diff-context">
                        <span className="line-num">48</span>
                        <span className="line-sign"> </span>
                        <span>  async onTick(context: BehaviorTreeContext): Promise&lt;NodeStatus&gt; &#123;</span>
                      </div>
                      <div className="diff-line diff-del">
                        <span className="line-num">49</span>
                        <span className="line-sign">-</span>
                        <span>    const toleranceMm = this.parameters.toleranceMm ?? 2.0; // 粗略装配公差</span>
                      </div>
                      <div className="diff-line diff-add">
                        <span className="line-num">49</span>
                        <span className="line-sign">+</span>
                        <span>    const toleranceMm = this.parameters.toleranceMm ?? 0.05; // 升级微米级精密对准公差</span>
                      </div>
                      <div className="diff-line diff-add">
                        <span className="line-num">50</span>
                        <span className="line-sign">+</span>
                        <span>    await this.safetyClient.assertLaserInterlockSafe(); // 新增双通道安全光栅强制互锁校验</span>
                      </div>
                      <div className="diff-line diff-context">
                        <span className="line-num">51</span>
                        <span className="line-sign"> </span>
                        <span>    const pose = await this.visionClient.getAlignmentPose(&#123;</span>
                      </div>
                      <div className="diff-line diff-context">
                        <span className="line-num">52</span>
                        <span className="line-sign"> </span>
                        <span>      confidenceThreshold: 0.99,</span>
                      </div>
                      <div className="diff-line diff-context">
                        <span className="line-num">53</span>
                        <span className="line-sign"> </span>
                        <span>    &#125;);</span>
                      </div>
                    </div>

                    <div className="diff-footer">
                      <span className="text-zinc-400 text-xs">
                        +2 行新增，-1 行修改 · 自动通过工业安全合规检查 (ISO 13849 PL-d)
                      </span>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {/* Tab 4: 创造模式体验 / 对话生成工业插件 (Creator Flow) */}
            {activeCapTab === 'creator' && (
              <motion.div
                className="cap-panel-card"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.35 }}
              >
                <div className="creator-flow-container">
                  {/* 用户提示词输入模拟框 */}
                  <div className="creator-input-bar">
                    <span className="input-prompt-label">自然语言输入:</span>
                    <span className="input-prompt-text font-mono">
                      “帮我写一个高精度双目定位与微米级闭环对准插件，支持 Basler 相机与 6 轴机械臂”
                    </span>
                    <span className="creator-mode-tag">
                      <Sparkles size={13} /> 创造模式
                    </span>
                  </div>

                  {/* 步骤流水线 */}
                  <div className="creator-steps-pipeline">
                    <div className="creator-step-card is-done">
                      <div className="c-step-head">
                        <span className="c-step-num">Step 1</span>
                        <Check size={14} className="text-emerald-400" />
                      </div>
                      <strong>加载工业技能</strong>
                      <small>加载视觉装配与手眼标定 Skill</small>
                    </div>

                    <div className="creator-step-card is-done">
                      <div className="c-step-head">
                        <span className="c-step-num">Step 2</span>
                        <Check size={14} className="text-emerald-400" />
                      </div>
                      <strong>检查硬件提供方</strong>
                      <small>反射 2x Basler 相机与 6 轴臂驱动</small>
                    </div>

                    <div className="creator-step-card is-done">
                      <div className="c-step-head">
                        <span className="c-step-num">Step 3</span>
                        <Check size={14} className="text-emerald-400" />
                      </div>
                      <strong>生成代码与契约</strong>
                      <small>生成 DualCamDockNode.ts 节点</small>
                    </div>

                    <div className="creator-step-card is-done">
                      <div className="c-step-head">
                        <span className="c-step-num">Step 4</span>
                        <Check size={14} className="text-emerald-400" />
                      </div>
                      <strong>虚拟沙箱仿真验证</strong>
                      <small>干涉碰撞检测无干涉，残差 &lt; 0.03mm</small>
                    </div>

                    <div className="creator-step-card is-active">
                      <div className="c-step-head">
                        <span className="c-step-num">Step 5</span>
                        <Sparkles size={14} className="text-indigo-400 animate-spin" />
                      </div>
                      <strong className="text-indigo-300">热加载并启用</strong>
                      <small className="text-indigo-400">已部署至现场百川控制台</small>
                    </div>
                  </div>

                  {/* 即刻生成的悬浮小挂件 */}
                  <div className="creator-preview-result">
                    <div className="plugin-preview-card">
                      <div className="plugin-top">
                        <div className="plugin-icon-box bg-purple-500/20 text-purple-300">
                          <Eye size={20} />
                        </div>
                        <div>
                          <h4 className="text-sm font-semibold text-zinc-100">双目对准实时微件 (DualCamAlignWidget)</h4>
                          <span className="text-xs text-zinc-400 font-mono">v1.0.0 · 官方沙箱认证 · 0.18ms</span>
                        </div>
                        <span className="status-badge status-emerald ml-auto">已启用</span>
                      </div>
                      <div className="grid grid-cols-3 gap-2 mt-3 pt-3 border-t border-zinc-800 text-xs font-mono">
                        <div className="p-2 rounded bg-zinc-900 border border-zinc-800 text-center">
                          <span className="text-zinc-500 block text-[10px]">CAM-L 置信度</span>
                          <strong className="text-cyan-400">99.8%</strong>
                        </div>
                        <div className="p-2 rounded bg-zinc-900 border border-zinc-800 text-center">
                          <span className="text-zinc-500 block text-[10px]">CAM-R 置信度</span>
                          <strong className="text-cyan-400">99.7%</strong>
                        </div>
                        <div className="p-2 rounded bg-zinc-900 border border-zinc-800 text-center">
                          <span className="text-zinc-500 block text-[10px]">闭环公差 (TCP)</span>
                          <strong className="text-emerald-400">0.018 mm</strong>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </div>
        </div>

        {/* ================= 4. 开发者极速开始体验 (CLI vs Git vs Desktop) ================= */}
        <div className="harness-section-block">
          <HomeSectionHeading
            eyebrow="DEVELOPER EXPERIENCE / 快速开始"
            title="开发者体验 · 开箱即用"
            description="几秒钟内启动开发环境，无论是通过 npx 命令一键启动 Web 工作台，还是下载工控机原生桌面客户端。"
          />

          <div className="quickstart-box">
            {/* 切换 Tab */}
            <div className="quickstart-nav">
              <button
                type="button"
                className={`qs-tab ${quickstartTab === 'cli' ? 'is-active' : ''}`}
                onClick={() => setQuickstartTab('cli')}
              >
                <Terminal size={14} />
                <span>命令一键启动</span>
              </button>
              <button
                type="button"
                className={`qs-tab ${quickstartTab === 'git' ? 'is-active' : ''}`}
                onClick={() => setQuickstartTab('git')}
              >
                <GitBranch size={14} />
                <span>源码编译安装</span>
              </button>
              <button
                type="button"
                className={`qs-tab ${quickstartTab === 'desktop' ? 'is-active' : ''}`}
                onClick={() => setQuickstartTab('desktop')}
              >
                <Download size={14} />
                <span>桌面客户端下载</span>
              </button>
            </div>

            {/* Tab 1: CLI */}
            {quickstartTab === 'cli' && (
              <div className="qs-content-block">
                <div className="qs-desc">
                  安装 Node.js (v18+) 后，通过 npx 快速启动墨影 Harness 本地开发工作台与 Web 控制台：
                </div>
                <div className="qs-terminal-row">
                  <span className="terminal-prompt">$</span>
                  <code className="terminal-code">npx @moying/harness dev --workspace ./my-workcell --port 8080</code>
                  <button
                    type="button"
                    className="copy-cmd-btn"
                    onClick={() => handleCopy('npx @moying/harness dev --workspace ./my-workcell --port 8080', 'cli')}
                  >
                    {copiedCmd === 'cli' ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
                    <span>{copiedCmd === 'cli' ? '已复制' : '复制命令'}</span>
                  </button>
                </div>
                <div className="qs-hints">
                  <span>💡 提示：该命令会自动检测本地已接入的工业总线通道与相机设备。</span>
                </div>
              </div>
            )}

            {/* Tab 2: Git Clone */}
            {quickstartTab === 'git' && (
              <div className="qs-content-block">
                <div className="qs-desc">
                  从官方开源仓库获取完整代码，在本地调试扩展自己的 Harness 预设：
                </div>
                <div className="qs-terminal-row">
                  <span className="terminal-prompt">$</span>
                  <code className="terminal-code">git clone https://github.com/moying-tech/moying-harness.git &amp;&amp; cd moying-harness &amp;&amp; pnpm install &amp;&amp; pnpm dev</code>
                  <button
                    type="button"
                    className="copy-cmd-btn"
                    onClick={() => handleCopy('git clone https://github.com/moying-tech/moying-harness.git && cd moying-harness && pnpm install && pnpm dev', 'git')}
                  >
                    {copiedCmd === 'git' ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
                    <span>{copiedCmd === 'git' ? '已复制' : '复制命令'}</span>
                  </button>
                </div>
                <div className="qs-hints">
                  <span>支持基于 Cordis 规范扩展任意第三方驱动、插件及行为树算子。</span>
                </div>
              </div>
            )}

            {/* Tab 3: Desktop App Downloads */}
            {quickstartTab === 'desktop' && (
              <div className="qs-content-block">
                <div className="qs-desc">
                  提供专为工业工控机与现场工程师打造的桌面端应用，支持后台静默服务与硬件直通：
                </div>
                <div className="desktop-downloads-grid">
                  <div className="desktop-dl-card">
                    <div className="dl-card-icon">🍎</div>
                    <div className="dl-card-meta">
                      <strong>macOS 桌面客户端</strong>
                      <span>Apple 芯片 (M1/M2/M3/M4) · macOS 13+</span>
                    </div>
                    <button type="button" className="dl-btn">
                      <Download size={14} /> 下载 .dmg
                    </button>
                  </div>

                  <div className="desktop-dl-card">
                    <div className="dl-card-icon">🪟</div>
                    <div className="dl-card-meta">
                      <strong>Windows 客户端</strong>
                      <span>64 位安装包 · Windows 10 / 11 工控机</span>
                    </div>
                    <button type="button" className="dl-btn">
                      <Download size={14} /> 下载 .exe
                    </button>
                  </div>

                  <div className="desktop-dl-card">
                    <div className="dl-card-icon">🐧</div>
                    <div className="dl-card-meta">
                      <strong>Linux RTOS 工业包</strong>
                      <span>Ubuntu 22.04 LTS / RT-Preempt 实时内核</span>
                    </div>
                    <button type="button" className="dl-btn">
                      <Download size={14} /> 下载 .deb
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* ================= 5. 加入生态倡议 Banner (Ecosystem Call To Action) ================= */}
        <div className="harness-cta-banner">
          <div className="cta-banner-content">
            <span className="cta-banner-badge">JOIN THE ECOSYSTEM / 共创生态</span>
            <h3>加入墨影 Harness 工业插件生态</h3>
            <p>
              墨影 Harness 的核心插件与基础 API 面向全球持续迭代。我们期待与生态合作伙伴、自动化集成商及开发者一起，在开源、开放、可复用、确定性的工业基础设施之上，共同探索工业具身智能的上限。
            </p>
            <div className="cta-banner-actions">
              <button
                type="button"
                className="button button-primary"
                onClick={onOpenDeveloperCenter}
              >
                查阅开发者文档 <ArrowRight size={16} />
              </button>
              <button
                type="button"
                className="button button-outline"
                onClick={onOpenMarket}
              >
                探索社区插件库 <ArrowUpRight size={16} />
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
