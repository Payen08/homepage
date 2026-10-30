import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  X,
  ChevronDown,
  ChevronUp,
  Clock,
  Search,
  Plus,
  ArrowUp,
  Columns2,
  History,
  Radio,
  Zap,
  ShieldCheck,
  Volume2,
  Bot,
  GitBranch,
  Cpu,
  Navigation,
  BatteryCharging,
} from 'lucide-react';
import './HarnessCapabilitiesGrid.css';

// =========================================================================
// Card 1: 一切皆插件 (工业场景定制)
// 包含三大动画阶段：
// 1.「创造模式」输入框打字：帮我写一个「CNC安全互锁与声光报警」插件 -> 点击发送
// 2.「深度求索中」智能体调用百川 SDK：加载技能 -> 编写驱动 -> install_station_plugin
// 3.「插件管理器」列表视图：显示工业机器人核心插件 + 右上角悬浮实时工位状态微件 + 新插件已启用
// =========================================================================
const CARD1_ROBOTICS_PLUGINS = [
  { id: 'fleet', name: 'AMR 多机协同调度器', tag: '协同调度', icon: Navigation, color: '#3b82f6' },
  { id: 'plc', name: 'Modbus / S7 设备协议栈', tag: '设备驱动', icon: Zap, color: '#0ea5e9' },
  { id: 'force', name: '机械臂末端自适应力控', tag: '运动算法', icon: Bot, color: '#f97316' },
  { id: 'slam', name: '激光 SLAM 实时建图插件', tag: '建图导航', icon: Radio, color: '#10b981' },
  { id: 'vision', name: '手眼高精标定与对齐', tag: '视觉伺服', icon: Cpu, color: '#8b5cf6' },
  { id: 'audio', name: '车间语音播报与警报器', tag: '声光报警', icon: Volume2, color: '#38bdf8' },
];

function Card1Plugins() {
  const [stage, setStage] = useState<'composer' | 'processing' | 'manager'>('composer');
  const [typedChars, setTypedChars] = useState(0);
  const promptText = '帮我写一个「CNC机床安全互锁与声光报警」插件';

  useEffect(() => {
    if (stage === 'composer') {
      if (typedChars < promptText.length) {
        const timer = setTimeout(() => {
          setTypedChars((prev) => prev + 1);
        }, 50);
        return () => clearTimeout(timer);
      } else {
        const timer = setTimeout(() => {
          setStage('processing');
        }, 400);
        return () => clearTimeout(timer);
      }
    }

    if (stage === 'processing') {
      // 模拟 Agent 编写机器人插件并进行沙箱防碰撞验证 (3.8s)
      const timer = setTimeout(() => {
        setStage('manager');
      }, 3800);
      return () => clearTimeout(timer);
    }

    if (stage === 'manager') {
      // 插件列表展示 6.2 秒后循环回到创造模式
      const timer = setTimeout(() => {
        setTypedChars(0);
        setStage('composer');
      }, 6200);
      return () => clearTimeout(timer);
    }
  }, [stage, typedChars, promptText.length]);

  return (
    <div className="harness-card">
      <div className="harness-card-header">
        <div className="harness-card-title-group">
          <h3 className="harness-card-title">一切皆插件</h3>
          <p className="harness-card-desc">
            安装现有工业插件，或在「创造模式」中通过对话快速创建插件，扩展机器人工具、控制技能与界面。
          </p>
        </div>
      </div>

      <div className="harness-card-canvas c1-canvas">
        <AnimatePresence mode="wait">
          {stage === 'composer' && (
            <motion.div
              key="c1-composer"
              className="c1-composer-box"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.3 }}
            >
              <div className="c1-mode-tag">
                <span className="mode-star">✦</span>
                <span>创造模式</span>
                <ChevronDown size={12} className="text-zinc-500" />
              </div>

              <div className="c1-input-bubble">
                <div className="c1-input-text font-sans">
                  <span>{promptText.slice(0, typedChars)}</span>
                  <span className="typewriter-cursor">|</span>
                </div>
                <div className="c1-input-toolbar">
                  <button type="button" className="c1-tool-plus" aria-label="添加工位配置或点表">
                    <Plus size={14} />
                  </button>
                  <button
                    type="button"
                    className={`c1-tool-send ${typedChars >= promptText.length ? 'is-active' : ''}`}
                    aria-label="发送需求"
                  >
                    <ArrowUp size={14} />
                  </button>
                </div>
              </div>
            </motion.div>
          )}

          {stage === 'processing' && (
            <motion.div
              key="c1-processing"
              className="c1-process-box"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.3 }}
            >
              <div className="c1-user-msg font-sans">{promptText}</div>

              <div className="c1-agent-process">
                <div className="c1-process-header">
                  <span>墨影智能体规划中</span>
                  <ChevronUp size={13} className="text-zinc-500" />
                </div>

                <div className="c1-tool-steps font-mono text-[11px]">
                  <div className="c1-step-row">
                    <span className="step-tag-blue">加载技能</span>
                    <span className="step-name">moying-industrial-plugin-sdk</span>
                  </div>
                  <div className="c1-step-row">
                    <span className="step-tag-blue">读取</span>
                    <span className="step-name">skills/safety-interlock/SKILL.md</span>
                  </div>
                  <div className="c1-step-row">
                    <span className="step-tag-blue">写入</span>
                    <span className="step-name">plugins/cnc-safety-alarm/driver.ts</span>
                    <span className="step-diff font-mono text-emerald-400">+382 -0</span>
                  </div>
                  <div className="c1-step-row">
                    <span className="step-tag-orange">工具调用</span>
                    <span className="step-name">plugin_manager · install_station_plugin</span>
                  </div>
                </div>

                <div className="c1-completion-note font-sans">
                  <span className="text-zinc-500 text-[11.5px]">用时 3.2秒 · </span>
                  <span className="text-zinc-300 text-[11.5px]">CNC安全光栅互锁与声光蜂鸣插件已就绪并载入工位。</span>
                </div>
              </div>
            </motion.div>
          )}

          {stage === 'manager' && (
            <motion.div
              key="c1-manager"
              className="c1-manager-box"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.3 }}
            >
              {/* 顶栏：插件管理标题 + 右上角工业工位实时微件 */}
              <div className="c1-manager-header">
                <div className="c1-heading font-semibold text-white">工位插件</div>
                <div className="c1-robotics-widget">
                  <span className="widget-status-dot" />
                  <span className="widget-text font-mono">CNC#04 互锁保护中</span>
                  <span className="widget-badge font-sans">正常</span>
                </div>
              </div>

              {/* 工业机器人插件列表 */}
              <div className="c1-plugins-track">
                <div className="c1-group-label font-sans">官方插件</div>
                {CARD1_ROBOTICS_PLUGINS.map((p) => {
                  const Icon = p.icon;
                  return (
                    <div key={p.id} className="c1-plugin-item">
                      <div className="c1-plugin-icon" style={{ color: p.color }}>
                        <Icon size={16} />
                      </div>
                      <span className="c1-plugin-name">{p.name}</span>
                      <span className="c1-plugin-badge font-sans">{p.tag}</span>
                    </div>
                  );
                })}

                <div className="c1-group-label font-sans mt-1">已安装运行</div>
                <div className="c1-plugin-item is-installed">
                  <div className="c1-plugin-icon text-blue-400">
                    <ShieldCheck size={16} />
                  </div>
                  <span className="c1-plugin-name font-semibold text-white">
                    CNC 安全互锁与声光报警
                  </span>
                  <div className="c1-toggle-slot ml-auto">
                    <div className="plugin-switch is-on">
                      <span className="switch-thumb" />
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

// =========================================================================
// Card 2: 完成各类任务 (机器人与工厂场景定制)
// 左侧：竖向向上轮播真实工业交付物 (XML行为树、TS伺服进给、YAML点表、JSON轨迹、CSV节拍)
// 右侧：悬浮工业对位代码差异面板 (+2 -1，双列行号，红绿高亮)
// =========================================================================
const CARD2_ROBOTICS_FILES = [
  { name: 'docking_servo.ts', desc: '机械臂视觉伺服进给', badge: 'TS', badgeBg: '#1d4ed8', badgeColor: '#bfdbfe' },
  { name: 'station_tree.xml', desc: '百川行为树工位工程', badge: 'XML', badgeBg: '#312e81', badgeColor: '#c7d2fe' },
  { name: 'plc_s7_map.yaml', desc: '西门子 S7 寄存器映射', badge: 'YML', badgeBg: '#27272a', badgeColor: '#e4e4e7' },
  { name: 'trajectory.json', desc: '6轴末端样条轨迹点集', badge: 'JSON', badgeBg: '#1e293b', badgeColor: '#94a3b8' },
  { name: 'kinematics.py', desc: '移动底盘差速运动逆解', badge: 'PY', badgeBg: '#0369a1', badgeColor: '#7dd3fc' },
  { name: 'oee_telemetry.csv', desc: '工位生产节拍与稼动率', badge: 'CSV', badgeBg: '#047857', badgeColor: '#a7f3d0' },
  { name: 'safety_interlock.pdf', desc: '双通道安全光栅核验证书', badge: 'PDF', badgeBg: '#991b1b', badgeColor: '#fecaca' },
];

function Card2Deliverables() {
  // 复制一份实现无缝无感连续纵向平滑跑马灯 (60fps CSS 硬件加速)
  const infiniteFiles = [...CARD2_ROBOTICS_FILES, ...CARD2_ROBOTICS_FILES];

  return (
    <div className="harness-card">
      <div className="harness-card-header">
        <div className="harness-card-title-group">
          <h3 className="harness-card-title">完成各类任务</h3>
          <p className="harness-card-desc">
            编排行为树节点、配置 PLC 寄存器、生成运动轨迹，直接预览任务成果，并通过对话持续完善。
          </p>
        </div>
      </div>

      <div className="harness-card-canvas c2-canvas">
        {/* 左侧：向上无缝连续平滑轮播真实工业交付物 */}
        <div className="c2-files-scroller-wrap">
          <div className="c2-files-scroller">
            {infiniteFiles.map((file, idx) => (
              <div key={`${file.name}-${idx}`} className="c2-file-card">
                <div
                  className="c2-file-badge font-mono"
                  style={{ backgroundColor: file.badgeBg, color: file.badgeColor }}
                >
                  {file.badge}
                </div>
                <div className="c2-file-meta">
                  <span className="c2-file-name font-mono">{file.name}</span>
                  <span className="c2-file-desc font-sans">{file.desc}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 右侧：悬浮机械臂视觉对位代码 Diff 审查卡片 */}
        <div className="c2-diff-panel">
          <div className="c2-tab-bar">
            <span className="c2-tab-title">第 1 轮改动</span>
            <button type="button" className="c2-tab-close" aria-label="关闭">
              <X size={12} />
            </button>
          </div>

          <div className="c2-diff-subbar">
            <span className="c2-ts-pill font-mono">TS</span>
            <span className="c2-filename font-mono">src/docking_servo.ts</span>
            <span className="c2-chevron">▾</span>
            <div className="c2-counts font-mono">
              <span className="text-emerald-400 font-bold">+2</span>
              <span className="text-rose-400 font-bold ml-1.5">−1</span>
            </div>
            <div className="c2-tools-icons">
              <Columns2 size={12} className="text-zinc-500" aria-label="并排对比视图" />
              <History size={12} className="text-zinc-500 ml-1.5" aria-label="历史版本" />
            </div>
          </div>

          <div className="c2-code-window font-mono text-[11px] leading-[1.6]">
            <div className="c2-chunk-header">@@ -8,3 +8,4 @@</div>
            <div className="c2-diff-row normal-row">
              <span className="ln-col">8</span>
              <span className="ln-col">8</span>
              <span className="sign-col"> </span>
              <span className="code-col">async function dockToCnc(pose: Pose6D) &#123;</span>
            </div>
            <div className="c2-diff-row del-row">
              <span className="ln-col">9</span>
              <span className="ln-col"> </span>
              <span className="sign-col">−</span>
              <span className="code-col">  await robot.arm.moveTo(pose);</span>
            </div>
            <div className="c2-diff-row add-row">
              <span className="ln-col"> </span>
              <span className="ln-col">9</span>
              <span className="sign-col">+</span>
              <span className="code-col">  await safety.verifyInterlock('CNC_04');</span>
            </div>
            <div className="c2-diff-row add-row">
              <span className="ln-col"> </span>
              <span className="ln-col">10</span>
              <span className="sign-col">+</span>
              <span className="code-col">  await robot.arm.dockWithServo(pose, &#123; tol: 0.05 &#125;);</span>
            </div>
            <div className="c2-diff-row normal-row">
              <span className="ln-col">10</span>
              <span className="ln-col">11</span>
              <span className="sign-col"> </span>
              <span className="code-col">&#125;</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// =========================================================================
// Card 3: 适应你的工作方式 (行为树与工位编排：车辆行驶节点 + 声音播放 + 消息通知)
// 包含三大阶段循环：
// 1. 用户提问气泡打字：输入行为树节点关联需求（导航、警报蜂鸣、MES通知）
// 2. 深度求索中 ⌃：展开创建行为树节点编排 (compose_action_nodes)
// 3. 已完成编排 ▾：自动折叠为行为树卡片（带节点图标、关联节点列表与操作按钮）
// =========================================================================
const CARD3_BEHAVIOR_SCENARIOS = [
  {
    id: 'amr-nav-audio',
    prompt: 'AMR 前往 CNC_04 工位，行驶中循环播放提示音，遇到避障自动降速，到达后向 MES 发送消息通知。',
    treeName: 'amr_navigation_with_audio_notify',
    jsonArgs: `{\n  "root": "Sequence",\n  "nodes": [\n    {"type": "Action", "name": "speaker.play_audio", "args": {"file": "robot_passing.wav", "loop": true}},\n    {"type": "Action", "name": "amr.navigate_to", "args": {"station": "CNC_04", "obstacle_mode": "slowdown"}},\n    {"type": "Action", "name": "mes.send_notify", "args": {"event": "ARRIVED", "payload": "CNC_04_READY"}}\n  ]\n}`,
    confirmText: '已生成「AMR工位行驶与声光通知」行为树，随时可注入调度系统。',
    taskTitle: 'AMR工位行驶与声光通知行为树',
    nodeList: '关联节点: 路径导航 · 避障减速 · 蜂鸣播报 · MES通知',
    icon: Navigation,
  },
  {
    id: 'safety-pick-alarm',
    prompt: '规划 CNC 机械臂安全取料：校验安全光栅后开门抓取，若异常触发声光报警并急停。',
    treeName: 'arm_compliant_dock_and_alarm',
    jsonArgs: `{\n  "root": "Fallback",\n  "nodes": [\n    {"type": "Sequence", "children": ["safety.verify_grid", "door.open", "arm.dock_and_pick"]},\n    {"type": "Sequence", "children": ["speaker.alarm_high", "system.emergency_stop"]}\n  ]\n}`,
    confirmText: '已生成「CNC取件与防撞报警」行为树，双通道互锁生效。',
    taskTitle: 'CNC安全取件与异常报警行为树',
    nodeList: '关联节点: 光栅互锁 · 自动开门 · 伺服抓取 · 紧急声光',
    icon: ShieldCheck,
  },
  {
    id: 'auto-recharge',
    prompt: '编排低电量自主回充：电量低于 20% 时播放返航语音，导航至充电桩并通知调度台。',
    treeName: 'amr_auto_recharge_dispatch',
    jsonArgs: `{\n  "root": "Sequence",\n  "nodes": [\n    {"type": "Condition", "name": "battery.check_level", "args": {"min_pct": 20}},\n    {"type": "Action", "name": "speaker.speak", "args": {"text": "电量不足，正在返航充电"}},\n    {"type": "Action", "name": "amr.dock_charger", "args": {"station": "CHG_02"}},\n    {"type": "Action", "name": "dispatch.notify", "args": {"status": "CHARGING"}}\n  ]\n}`,
    confirmText: '已生成「自主回充与状态播报」行为树，已同步调度系统。',
    taskTitle: 'AMR自主回充与状态播报行为树',
    nodeList: '关联节点: 电量判定 · 语音播报 · 自动对接 · 调度同步',
    icon: BatteryCharging,
  },
];

function Card3Workflow() {
  const [scenarioIdx, setScenarioIdx] = useState(0);
  const [typedChars, setTypedChars] = useState(0);
  const [phase, setPhase] = useState<'typing' | 'thinking' | 'completed'>('typing');
  const [isOpenDisclosure, setIsOpenDisclosure] = useState(false);

  const cur = CARD3_BEHAVIOR_SCENARIOS[scenarioIdx];
  const Icon = cur.icon;

  useEffect(() => {
    if (phase === 'typing') {
      if (typedChars < cur.prompt.length) {
        const timer = setTimeout(() => {
          setTypedChars((c) => c + 1);
        }, 35);
        return () => clearTimeout(timer);
      } else {
        const timer = setTimeout(() => {
          setPhase('thinking');
        }, 400);
        return () => clearTimeout(timer);
      }
    }

    if (phase === 'thinking') {
      const timer = setTimeout(() => {
        setPhase('completed');
        setIsOpenDisclosure(false);
      }, 2600);
      return () => clearTimeout(timer);
    }

    if (phase === 'completed') {
      const timer = setTimeout(() => {
        setTypedChars(0);
        setScenarioIdx((prev) => (prev + 1) % CARD3_BEHAVIOR_SCENARIOS.length);
        setPhase('typing');
        setIsOpenDisclosure(false);
      }, 6500);
      return () => clearTimeout(timer);
    }
  }, [phase, typedChars, cur.prompt.length]);

  return (
    <div className="harness-card">
      <div className="harness-card-header">
        <div className="harness-card-title-group">
          <h3 className="harness-card-title">适应你的工作方式</h3>
          <p className="harness-card-desc">
            通过行为树串联机器人车辆行驶、声光报警与消息通知，让复杂工位逻辑按需灵活编排与执行。
          </p>
        </div>
      </div>

      <div className="harness-card-canvas c3-canvas">
        {/* 用户提问气泡：打字机动效 */}
        <div className="c3-user-bubble font-sans">
          <span>{cur.prompt.slice(0, typedChars)}</span>
          {phase === 'typing' && <span className="typewriter-cursor">|</span>}
        </div>

        {/* 思考状态：展开代码生成 */}
        {phase === 'thinking' && (
          <motion.div
            key="c3-thinking-block"
            className="c3-thinking-wrapper"
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.25 }}
          >
            <div className="c3-agent-status font-sans">
              <GitBranch size={13} className="text-blue-400 animate-pulse" />
              <span>智能体正在编排行为树节点...</span>
            </div>

            <div className="c3-disclosure-panel">
              <div className="c3-tool-header">
                <span className="c3-tool-icon">⌃</span>
                <span className="c3-tool-title">编排行为树节点 · {cur.treeName}</span>
              </div>
              <div className="c3-code-block font-mono text-[11px] leading-[1.6]">
                <div className="text-zinc-500 mb-1">输入 bt_builder · compose_action_nodes</div>
                <pre className="text-zinc-300">
                  <code>{cur.jsonArgs}</code>
                </pre>
              </div>
            </div>
          </motion.div>
        )}

        {/* 完成确认提示与行为树卡片 */}
        {phase === 'completed' && (
          <motion.div
            key="c3-completed-block"
            className="c3-completed-wrapper"
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            <div
              className="c3-disclosure-toggle"
              onClick={() => setIsOpenDisclosure(!isOpenDisclosure)}
              role="button"
              tabIndex={0}
              aria-expanded={isOpenDisclosure}
            >
              <GitBranch size={13} className="text-blue-400" />
              <span>已完成行为树编排</span>
              {isOpenDisclosure ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
            </div>

            <AnimatePresence>
              {isOpenDisclosure && (
                <motion.div
                  key="c3-manual-disclosure"
                  className="c3-disclosure-panel"
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.25 }}
                >
                  <div className="c3-tool-header">
                    <span className="c3-tool-icon">⌃</span>
                    <span className="c3-tool-title">编排行为树节点 · {cur.treeName}</span>
                  </div>
                  <div className="c3-code-block font-mono text-[11px] leading-[1.6]">
                    <div className="text-zinc-500 mb-1">输入 bt_builder · compose_action_nodes</div>
                    <pre className="text-zinc-300">
                      <code>{cur.jsonArgs}</code>
                    </pre>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <p className="c3-confirm-text font-sans">{cur.confirmText}</p>

            <div className="c3-task-card">
              <div className="c3-robot-node-well">
                <Icon size={17} className="text-blue-400" />
              </div>
              <div className="c3-task-meta">
                <span className="c3-task-name font-sans">{cur.taskTitle}</span>
                <span className="c3-task-time font-sans">{cur.nodeList}</span>
              </div>
              <button type="button" className="c3-open-btn font-sans">
                进入编排
              </button>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}

// =========================================================================
// Card 4: 开发者工具 (机器人运行轨迹与遥测排查)
// 顶格工具栏 + 3 泳道时间线 (输入 / 模型 / 工具) + 工业轨迹日志 + 右侧悬浮审查卡片
// =========================================================================
function Card4Trace() {
  const [activeTab, setActiveTab] = useState<'summary' | 'params' | 'result' | 'schema' | 'timing'>('result');

  return (
    <div className="harness-card">
      <div className="harness-card-header">
        <div className="harness-card-title-group">
          <h3 className="harness-card-title">开发者工具</h3>
          <p className="harness-card-desc">
            支持开发者查看机器人执行轨迹与详细运行信息，排查工具调用和工位协同中的各类问题。
          </p>
        </div>
      </div>

      <div className="harness-card-canvas c4-canvas">
        {/* 顶部工具栏 (紧贴标题，充满上方) */}
        <div className="c4-toolbar">
          <div className="c4-toggle-group">
            <span className="c4-pill is-active">
              <Clock size={12} /> 耗时: 18ms
            </span>
            <span className="c4-pill">轮次 ⊟</span>
            <span className="c4-pill">调用 ⊟</span>
          </div>
          <div className="c4-search-box">
            <Search size={12} className="text-zinc-500" />
            <span className="text-zinc-500 text-[11px]">搜索轨迹...</span>
          </div>
        </div>

        {/* 3 泳道时间线 (输入 / 模型 / 工具) */}
        <div className="c4-timeline">
          <div className="c4-lane-row">
            <span className="c4-lane-label">输入</span>
            <div className="c4-lane-track">
              <span className="c4-span span-input" style={{ left: '0.5%', width: '6%' }} title="CNC#04 就绪信号" />
              <span className="c4-span span-input" style={{ left: '18%', width: '4%' }} title="光栅互锁信号" />
              <span className="c4-span span-input" style={{ left: '42%', width: '5%' }} title="避障传感器触发" />
              <span className="c4-span span-input" style={{ left: '68%', width: '4%' }} title="物料到位" />
              <span className="c4-span span-input" style={{ left: '88%', width: '5%' }} title="MES 确认响应" />
            </div>
          </div>
          <div className="c4-lane-row">
            <span className="c4-lane-label">模型</span>
            <div className="c4-lane-track">
              <span className="c4-span span-model" style={{ left: '8%', width: '8%' }} title="6-DOF 运动学逆解" />
              <span className="c4-span span-model" style={{ left: '26%', width: '12%' }} title="手眼标定矩阵滤波" />
              <span className="c4-span span-model" style={{ left: '49%', width: '10%' }} title="柔顺阻尼力矩计算" />
              <span className="c4-span span-model" style={{ left: '74%', width: '9%' }} title="避障样条平滑插补" />
            </div>
          </div>
          <div className="c4-lane-row">
            <span className="c4-lane-label">工具</span>
            <div className="c4-lane-track">
              <span className="c4-span span-tool" style={{ left: '3%', width: '7%' }} title="speaker.play_warning" />
              <span className="c4-span span-tool" style={{ left: '16%', width: '8%' }} title="amr.navigate" />
              <span className="c4-span span-tool" style={{ left: '36%', width: '6%' }} title="plc.read_interlock" />
              <span className="c4-span span-tool" style={{ left: '56%', width: '10%' }} title="robot.arm.dockWithServo" />
              <span className="c4-span span-tool" style={{ left: '80%', width: '7%' }} title="mes.notify" />
            </div>
          </div>
        </div>

        {/* 下半部分：左侧机器人轨迹事件流 + 右侧悬浮审查卡片 */}
        <div className="c4-body-grid">
          {/* 会话事件流 */}
          <div className="c4-event-stream font-mono text-[10.5px]">
            <div className="c4-turn-tag">第 2 轮 · 工位协同轨迹</div>
            <div className="c4-event-row">
              <span className="tag-user">用户</span>
              <span className="c4-event-text">调度 AMR 前往 CNC_04 供料...</span>
            </div>
            <div className="c4-event-row">
              <span className="tag-assistant">助手</span>
              <span className="c4-event-text">规划样条避障，启动警报提示音...</span>
            </div>
            <div className="c4-event-row">
              <span className="tag-tool">工具</span>
              <span className="c4-event-text">speaker.play {"{\"sound\": \"passing.wav\"}"}</span>
            </div>
            <div className="c4-event-row">
              <span className="tag-tool">工具</span>
              <span className="c4-event-text">amr.navigate {"{\"target\": \"CNC_04\"}"}</span>
            </div>
            <div className="c4-event-row">
              <span className="tag-tool">工具</span>
              <span className="c4-event-text">plc.readRegister {"{\"addr\": \"DB1.0\"}"}</span>
            </div>
            <div className="c4-event-row">
              <span className="tag-tool">工具</span>
              <span className="c4-event-text">robot.arm.dock {"{\"tol\": 0.05}"}</span>
            </div>
            <div className="c4-event-row">
              <span className="tag-assistant">助手</span>
              <span className="c4-event-text">对位完成，释放光栅，通知调度就绪。</span>
            </div>
          </div>

          {/* 右侧悬浮审查详情卡片 */}
          <div className="c4-inspector-card">
            <div className="c4-inspect-head">
              <span className="tag-tool-solid">工具</span>
              <span className="c4-inspect-title">第 1 轮 · 第 1 步</span>
              <span className="c4-inspect-close">✕</span>
            </div>

            <div className="c4-inspect-tabs font-sans">
              {(['summary', 'params', 'result', 'schema', 'timing'] as const).map((tab) => {
                const tabNames: Record<string, string> = {
                  summary: '概述',
                  params: '参数',
                  result: '结果',
                  schema: 'Schema',
                  timing: '计时',
                };
                return (
                  <button
                    key={tab}
                    type="button"
                    className={`c4-tab-btn ${activeTab === tab ? 'is-active' : ''}`}
                    onClick={() => setActiveTab(tab)}
                  >
                    {tabNames[tab]}
                  </button>
                );
              })}
            </div>

            <div className="c4-inspect-content font-mono">
              {activeTab === 'result' && (
                <div>
                  <div className="text-emerald-400 font-bold text-[11.5px]">DOCKING_OK</div>
                  <div className="text-[10px] text-zinc-400 mt-1">dx: +0.02mm · dy: -0.01mm · 伺服闭环锁定</div>
                </div>
              )}
              {activeTab === 'summary' && (
                <div className="text-zinc-400 text-[10.5px]">机械臂视觉伺服进给对位与光栅互锁校验</div>
              )}
              {activeTab === 'params' && (
                <div className="text-zinc-400 text-[10.5px]">
                  {"{\"station\": \"CNC_04\", \"toleranceMm\": 0.05}"}
                </div>
              )}
              {activeTab === 'schema' && (
                <div className="text-zinc-400 text-[10.5px]">RobotDockingServoSchema (v2)</div>
              )}
              {activeTab === 'timing' && (
                <div className="text-emerald-400 text-[10.5px]">
                  <div>开始: 10:28:14.320</div>
                  <div>耗时: 18 毫秒 (确定性抖动 &lt; 0.4ms)</div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// =========================================================================
// Main 2x2 Grid Component Export
// =========================================================================
export function HarnessCapabilitiesGrid({ embedded = false }: { embedded?: boolean } = {}) {
  if (embedded) {
    return (
      <div className="capabilities-2x2-grid harness-embedded-grid">
        <Card1Plugins />
        <Card2Deliverables />
        <Card3Workflow />
        <Card4Trace />
      </div>
    );
  }

  return (
    <section className="harness-capabilities-section" aria-label="核心能力演示">
      <div className="capabilities-container">
        <div className="capabilities-2x2-grid">
          <Card1Plugins />
          <Card2Deliverables />
          <Card3Workflow />
          <Card4Trace />
        </div>
      </div>
    </section>
  );
}
