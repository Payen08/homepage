import { HomeSectionHeading } from './HomeSectionHeading';
import { HarnessCapabilitiesGrid } from './HarnessCapabilitiesGrid';
import React, { useState } from 'react';
import { motion } from 'motion/react';
import {
  Code2,
  Copy,
  Check,
  ArrowRight,
  ExternalLink,
  Bot,
  Network,
  Cpu,
  GitFork,
  FileCode,
  Info,
  BookOpen,
} from 'lucide-react';

interface DeveloperToolsSectionProps {
  onOpenDeveloperCenter: () => void;
}

// 两个示例的代码内容
const codeExamples = {
  behaviorTree: {
    tabName: '行为树节点',
    fileName: 'PrecisionDockingNode.ts',
    summary: '继承 ActionNode 基类，接入视觉与机械臂能力域，支持百川编排引擎生命周期调度与微米级闭环对准。',
    tags: ['生命周期调度', '视觉位姿识别', '机械臂闭环对准'],
    code: `import { 
  ActionNode, 
  NodeStatus, 
  BehaviorTreeContext, 
  BaichuanSDK 
} from '@moying/baichuan-sdk'; // 百川 SDK v0.2.0

/**
 * 自定义工业搬运与高精度视觉对齐行为树节点
 * 注册于百川任务编排引擎，支持生命周期调度与动态中断
 */
export class PrecisionDockingNode extends ActionNode {
  static readonly nodeType = 'action.manipulator.precision_dock';
  
  // 注入百川核心能力域客户端
  private robotClient = BaichuanSDK.useRobot();
  private visionClient = BaichuanSDK.useVision();

  async onTick(context: BehaviorTreeContext): Promise<NodeStatus> {
    const { targetStationId, toleranceMm } = this.parameters;
    
    // 1. 订阅视觉对准数据并执行多传感器置信度校验
    const pose = await this.visionClient.getAlignmentPose({
      stationId: targetStationId,
      confidenceThreshold: 0.98,
    });

    if (!pose.isValid) {
      context.logWarning(\`视觉对准置信度不足 (\${pose.confidence}), 重试中...\`);
      return NodeStatus.RUNNING;
    }

    // 2. 调度机械臂执行微米级末端对准与进给
    const result = await this.robotClient.arm.moveToPose({
      targetPose: pose.coordinates,
      velocityFactor: 0.2,
      maxToleranceMm: toleranceMm ?? 0.5,
    });

    return result.success ? NodeStatus.SUCCESS : NodeStatus.FAILURE;
  }
}`,
  },
  componentNode: {
    tabName: '组件节点',
    fileName: 'MachineFeedingComponent.tsx',
    summary: '适配 Webview、Dashboard 及 Pad 终端，响应式消费 SCADA 汇聚的 PLC 信号并通过天工 API 调度作业。',
    tags: ['多端响应式', 'SCADA 遥测流订阅', '安全互锁防护'],
    code: `import React, { useState } from 'react';
import { 
  BaichuanComponent, 
  useDeviceStream, 
  useTaskDispatcher 
} from '@moying/baichuan-sdk'; // 百川 SDK v0.2.0

/**
 * 百川工业组件节点：机床自动上下料状态监控与交互面板
 * 适配终端：Webview / Dashboard / Pad 响应式自动布局
 */
export const MachineFeedingComponent: BaichuanComponent = ({ nodeId, config }) => {
  // 1. 响应式订阅 SCADA API 汇聚的 PLC 与传感器遥测流
  const { deviceState, telemetry } = useDeviceStream({ deviceId: config.deviceId });
  const dispatcher = useTaskDispatcher();
  const [isProcessing, setIsProcessing] = useState(false);

  // 2. 读取安全互锁状态，确保设备允许介入
  const isSafeToFeed = telemetry?.interlockStatus === 'READY';

  // 3. 通过天工 API 触发工厂多设备协同任务
  const handleStartTask = async () => {
    setIsProcessing(true);
    await dispatcher.dispatch({
      taskType: 'cnc.material_feeding',
      parameters: { stationId: config.stationId, slotIndex: 1 },
      priority: 'HIGH',
    });
    setIsProcessing(false);
  };

  return (
    <div className="component-node-card p-4 rounded-xl bg-zinc-900 border border-zinc-800">
      <div className="flex items-center justify-between mb-3">
        <h4 className="font-semibold text-zinc-100">加工工位 #{config.stationId}</h4>
        <span className={\`status-badge \${isSafeToFeed ? 'ready' : 'locked'}\`}>
          {isSafeToFeed ? '安全允许介入' : '互锁保护中'}
        </span>
      </div>
      <p className="text-xs text-zinc-400 mb-4">
        主轴转速: {telemetry?.spindleRpm ?? 0} RPM | 气压: {telemetry?.pressureBar ?? 0} Bar
      </p>
      <button 
        disabled={!isSafeToFeed || isProcessing}
        onClick={handleStartTask}
        className="action-btn"
      >
        {isProcessing ? '任务下发中...' : '触发自动上下料'}
      </button>
    </div>
  );
};`,
  },
};

type ExampleKey = keyof typeof codeExamples;

// 语法高亮辅助函数
function highlightCodeLine(line: string): React.ReactNode {
  const trimmed = line.trim();
  if (trimmed.startsWith('//') || trimmed.startsWith('/*') || trimmed.startsWith('*')) {
    return <span className="token-comment">{line}</span>;
  }

  const tokenRegex = /(\/\/.*$)|(['"`].*?['"`])|(\b(?:import|from|export|class|extends|async|await|const|let|var|private|public|static|readonly|return|if|else|new|function|type|interface|as)\b)|(\b(?:ActionNode|NodeStatus|BehaviorTreeContext|BaichuanSDK|BaichuanComponent|React|Promise|void|string|number|boolean|any)\b)|(\b\d+(\.\d+)?\b)|(\b(?:useRobot|useVision|getAlignmentPose|moveToPose|useDeviceStream|useTaskDispatcher|dispatch|logWarning|useState|useEffect|init)\b)/g;

  const elements: React.ReactNode[] = [];
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = tokenRegex.exec(line)) !== null) {
    if (match.index > lastIndex) {
      elements.push(line.substring(lastIndex, match.index));
    }
    const [full, comment, str, kw, type, num, fn] = match;
    const key = `${match.index}-${full}`;
    if (comment) {
      elements.push(<span key={key} className="token-comment">{comment}</span>);
    } else if (str) {
      elements.push(<span key={key} className="token-string">{str}</span>);
    } else if (kw) {
      elements.push(<span key={key} className="token-keyword">{kw}</span>);
    } else if (type) {
      elements.push(<span key={key} className="token-type">{type}</span>);
    } else if (num) {
      elements.push(<span key={key} className="token-num">{num}</span>);
    } else if (fn) {
      elements.push(<span key={key} className="token-fn">{fn}</span>);
    }
    lastIndex = tokenRegex.lastIndex;
  }

  if (lastIndex < line.length) {
    elements.push(line.substring(lastIndex));
  }

  return elements.length > 0 ? elements : line;
}

export function DeveloperToolsSection({ onOpenDeveloperCenter }: DeveloperToolsSectionProps) {
  const [activeTab, setActiveTab] = useState<ExampleKey>('behaviorTree');
  const [copied, setCopied] = useState(false);

  const currentExample = codeExamples[activeTab];

  const handleCopy = () => {
    navigator.clipboard.writeText(currentExample.code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <section className="dev-tools-section" id="developer-tools" aria-label="开发工具与 SDK 展示">
      <div className="dev-container">
        {/* 区域标题与简洁描述 */}
        <HomeSectionHeading eyebrow="DEVELOPER TOOLS & SDK / 开发工具" title="工业能力接入与开发者套件" description="通过开发工具介绍卡片与代码示例，展示 SDK、API 及其应用场景，了解工业能力的接入方式和基础调用方法。" action={<button onClick={onOpenDeveloperCenter}>进入开发者中心 <ArrowRight size={16} /></button>} />

        {/* 4 大核心能力展示 (一切皆插件 / 完成各类任务 / 适应你的工作方式 / 开发者工具) */}
        <HarnessCapabilitiesGrid embedded />

        {/* 3 张简约平衡的 Hero UI 卡片 */}
        <div className="dev-cards-minimal-grid">
          {/* 1. 百川 SDK 重点卡片 */}
          <motion.div
            className="heroui-card-minimal is-featured"
            initial={{ opacity: 0, y: 14 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.4 }}
          >
            <div className="card-mini-top">
              <div className="card-mini-icon icon-baichuan">
                <Bot size={22} />
              </div>
              <div className="card-mini-meta">
                <div className="card-mini-title-row">
                  <h3>百川 SDK</h3>
                  <span className="card-pill-ver">
                    <span className="pulse-dot" /> v0.2.0
                  </span>
                </div>
                <span className="card-mini-alias">原百川插件 SDK</span>
              </div>
            </div>

            <p className="card-mini-desc">
              面向机器人与工业自动化核心应用开发套件，支持跨平台低代码与自由编码结合。
            </p>

            <div className="card-mini-details">
              <div className="detail-row">
                <span className="detail-label">能力范围</span>
                <span className="detail-value">
                  机器人、导航、机械臂、视觉、任务、系统及数据中心等 14 个能力域
                </span>
              </div>
              <div className="detail-row">
                <span className="detail-label">适用场景</span>
                <div className="terminal-pills">
                  <span className="term-pill">Webview</span>
                  <span className="term-pill">Dashboard</span>
                  <span className="term-pill">Pad</span>
                </div>
              </div>
            </div>

            <div className="card-mini-footer">
              <button
                className="mini-link-btn"
                onClick={onOpenDeveloperCenter}
              >
                查阅接入说明 <ExternalLink size={13} />
              </button>
            </div>
          </motion.div>

          {/* 2. 天工 API */}
          <motion.div
            className="heroui-card-minimal"
            initial={{ opacity: 0, y: 14 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.4, delay: 0.08 }}
          >
            <div className="card-mini-top">
              <div className="card-mini-icon icon-tiangong">
                <Network size={22} />
              </div>
              <div className="card-mini-meta">
                <div className="card-mini-title-row">
                  <h3>天工 API</h3>
                  <span className="card-pill-tag">业务协同</span>
                </div>
                <span className="card-mini-alias">原天工应用 SDK</span>
              </div>
            </div>

            <p className="card-mini-desc">
              面向工业应用场景的高阶 API，统一向上层业务提供任务级抽象与工艺流转。
            </p>

            <div className="card-mini-details">
              <div className="detail-row">
                <span className="detail-label">核心场景</span>
                <ul className="simple-list">
                  <li><strong>多设备协同</strong>：AGV 与产线专机动作同步与互锁</li>
                  <li><strong>工厂任务编排</strong>：柔性工艺工单下发与异常自治重规</li>
                  <li><strong>数字化运营</strong>：全局 OEE 稼动率与生产全周期数据汇聚</li>
                </ul>
              </div>
            </div>

            <div className="card-mini-footer">
              <button
                className="mini-link-btn"
                onClick={onOpenDeveloperCenter}
              >
                查看 API 契约 <ExternalLink size={13} />
              </button>
            </div>
          </motion.div>

          {/* 3. SCADA API */}
          <motion.div
            className="heroui-card-minimal"
            initial={{ opacity: 0, y: 14 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.4, delay: 0.16 }}
          >
            <div className="card-mini-top">
              <div className="card-mini-icon icon-scada">
                <Cpu size={22} />
              </div>
              <div className="card-mini-meta">
                <div className="card-mini-title-row">
                  <h3>SCADA API</h3>
                  <span className="card-pill-tag tag-cyan">设备适配</span>
                </div>
                <span className="card-mini-alias">原设备适配 SDK</span>
              </div>
            </div>

            <p className="card-mini-desc">
              工业设备接入与协议适配层，打破硬件私有协议壁垒，实现异构硬件统一纳管。
            </p>

            <div className="card-mini-details">
              <div className="detail-row">
                <span className="detail-label">适配能力</span>
                <ul className="simple-list">
                  <li><strong>PLC 连接控制</strong>：西门子 S7、三菱、欧姆龙主流 PLC</li>
                  <li><strong>工业传感器</strong>：激光测距、力控、温振遥测数据毫秒级采集</li>
                  <li><strong>第三方机器人</strong>：发那科、ABB、库卡等机械臂协议统一集成</li>
                </ul>
              </div>
            </div>

            <div className="card-mini-footer">
              <button
                className="mini-link-btn"
                onClick={onOpenDeveloperCenter}
              >
                查看设备协议 <ExternalLink size={13} />
              </button>
            </div>
          </motion.div>
        </div>

        {/* 快速开始代码示例区（简约单栏聚焦模式） */}
        <motion.div
          className="heroui-code-container-minimal"
          initial={{ opacity: 0, y: 18 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.45 }}
        >
          {/* 代码区头部：标题 + 选项卡 */}
          <div className="code-bar-minimal">
            <div className="code-bar-left">
              <div className="code-bar-title">
                <Code2 size={16} className="text-indigo-400" />
                <span>快速开始代码示例</span>
              </div>
              <span className="code-bar-hint">
                示例选项卡仅控制展示切换，不执行代码
              </span>
            </div>

            {/* 选项卡切换 (Hero UI Segmented Tab) */}
            <div className="heroui-segmented-tabs" role="tablist">
              <button
                type="button"
                role="tab"
                aria-selected={activeTab === 'behaviorTree'}
                className={`seg-tab ${activeTab === 'behaviorTree' ? 'is-active' : ''}`}
                onClick={() => setActiveTab('behaviorTree')}
              >
                <GitFork size={14} />
                <span>行为树节点</span>
              </button>

              <button
                type="button"
                role="tab"
                aria-selected={activeTab === 'componentNode'}
                className={`seg-tab ${activeTab === 'componentNode' ? 'is-active' : ''}`}
                onClick={() => setActiveTab('componentNode')}
              >
                <FileCode size={14} />
                <span>组件节点</span>
              </button>
            </div>
          </div>

          {/* 代码编辑器卡片 */}
          <div className="editor-card-minimal">
            {/* 窗口顶栏 */}
            <div className="editor-window-bar">
              <div className="editor-traffic-lights" aria-hidden="true">
                <span className="dot dot-close" />
                <span className="dot dot-minimize" />
                <span className="dot dot-maximize" />
              </div>

              <div className="editor-filename">
                <FileCode size={14} className="text-indigo-400" />
                <span>{currentExample.fileName}</span>
              </div>

              <div className="editor-window-actions">
                <button
                  className="copy-btn-minimal"
                  onClick={handleCopy}
                  title="复制代码"
                >
                  {copied ? (
                    <>
                      <Check size={13} className="text-emerald-400" />
                      <span className="text-emerald-400">已复制</span>
                    </>
                  ) : (
                    <>
                      <Copy size={13} />
                      <span>复制代码</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* 代码内容区 */}
            <div className="editor-code-body">
              <div className="code-lines-wrapper">
                {currentExample.code.split('\n').map((line, idx) => (
                  <div className="code-line" key={idx}>
                    <span className="line-num">{idx + 1}</span>
                    <span className="line-content">{highlightCodeLine(line)}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* 相关能力说明与底栏条 */}
            <div className="editor-info-bar">
              <div className="info-summary">
                <span className="info-badge">{currentExample.tabName}能力说明</span>
                <p className="info-text">{currentExample.summary}</p>
                <div className="info-tags">
                  {currentExample.tags.map((t) => (
                    <span key={t} className="info-tag-pill">{t}</span>
                  ))}
                </div>
              </div>

              <div className="info-footer-line">
                <div className="disclaimer">
                  <Info size={12} />
                  <span>交互规则：仅供阅读参考，不会连接实际机器人或调用真实设备接口。</span>
                </div>
                <button
                  className="mini-center-btn"
                  onClick={onOpenDeveloperCenter}
                >
                  <BookOpen size={13} />
                  <span>进入开发者中心查阅完整文档</span>
                </button>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
