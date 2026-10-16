import React, { useState } from 'react';
import { motion } from 'motion/react';
import {
  ArrowRight,
  Check,
  Copy,
  Cpu,
  Network,
  Radio,
  Zap,
  Activity,
  Car,
  Cloud,
  Bot,
  Building2,
  Share2,
  PlusCircle,
  Video,
  Sparkles,
  ExternalLink,
  SlidersHorizontal,
  Terminal,
  Monitor,
  LayoutDashboard,
} from 'lucide-react';
import './IndustrialBentoSection.css';

interface IndustrialBentoSectionProps {
  onOpenDeveloperCenter?: () => void;
  onOpenMarket?: () => void;
}

export function IndustrialBentoSection({
  onOpenDeveloperCenter,
  onOpenMarket,
}: IndustrialBentoSectionProps) {
  const [copiedCmd, setCopiedCmd] = useState(false);
  const [activeProtocol, setActiveProtocol] = useState<string | null>(null);

  const handleCopyCmd = () => {
    navigator.clipboard.writeText('npm i @nexus/industrial-sdk');
    setCopiedCmd(true);
    setTimeout(() => setCopiedCmd(false), 2000);
  };

  const protocols = [
    { id: 'modbus', name: 'MODBUS', icon: Cpu, color: '#c1c6d7', desc: '工业现场总线串行通信' },
    { id: 'opc-ua', name: 'OPC-UA', icon: Network, color: '#aec6ff', desc: '工业自动化统一架构规范' },
    { id: 'can-bus', name: 'CAN-BUS', icon: Car, color: '#dbb8ff', desc: '高鲁棒性车载与关节总线' },
    { id: 'ethercat', name: 'EtherCAT', icon: Zap, color: '#00daf3', desc: '微秒级实时以太网协议' },
    { id: 's7-comm', name: 'S7 COMM', icon: Cpu, color: '#aec6ff', desc: '西门子 PLC 原生通信握手' },
    { id: 'mqtt-sp', name: 'MQTT/SP', icon: Cloud, color: '#00daf3', desc: '工业物联网 Sparkplug B' },
    { id: 'fanuc', name: 'FANUC', icon: Activity, color: '#e3e1e9', desc: '发那科机器人专机原生协议' },
    { id: 'ros2', name: 'ROS 2', icon: Bot, color: '#dbb8ff', desc: '机器人操作系统微控制器通道' },
    { id: 'bacnet', name: 'BACNET', icon: Building2, color: '#e3e1e9', desc: '楼宇自控与动力环境数据网' },
    { id: 'profinet', name: 'PROFINET', icon: Network, color: '#aec6ff', desc: '实时工业以太网高频互锁' },
    { id: 'lidar', name: 'LIDAR', icon: Radio, color: '#00daf3', desc: '3D 激光雷达点云高速采集' },
    { id: 'more', name: '+108 More', icon: PlusCircle, color: '#8b90a0', desc: '108+ 持续扩展的工业驱动' },
  ];

  return (
    <div className="industrial-bento-wrapper w-full pt-16">
      {/* Ambient Atmosphere Glow Accents */}
      <div className="bento-ambient-glow-1" />
      <div className="bento-ambient-glow-2" />
      <div className="bento-ambient-glow-3" />

      {/* Hero Header / Intro Section */}
      <section className="relative max-w-7xl mx-auto px-6 pt-10 pb-10 text-center flex flex-col items-center">
        <motion.h2
          className="font-display text-4xl sm:text-5xl lg:text-6xl text-[#e3e1e9] max-w-4xl tracking-tight mb-4 font-bold leading-tight"
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.45, delay: 0.08 }}
        >
          赋能工业智造 · 释放极致开发潜能
        </motion.h2>
        <motion.p
          className="text-base sm:text-lg text-[#c1c6d7] max-w-2xl text-center leading-relaxed mb-0"
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.45, delay: 0.14 }}
        >
          用下一代现代化开发工具、AI能力编排与工业总线底座，打破异构硬件隔阂，构筑高鲁棒性工业自动化交付链。
        </motion.p>
      </section>

      {/* Bento Grid Canvas (Inspired by Magician / Apple Dark Bento) */}
      <section className="max-w-7xl mx-auto px-6 pb-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-6 items-stretch">
          
          {/* ================= CARD 1: AI Industrial Magic / 行为树编排 (Col 7) ================= */}
          <motion.div
            className="lg:col-span-7 group bento-card min-h-[470px]"
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
          >
            {/* Inner Glow Gradient */}
            <div className="absolute -right-20 -bottom-20 w-80 h-80 rounded-full bg-[#006fee]/20 blur-3xl pointer-events-none group-hover:bg-[#006fee]/30 transition-all duration-700" />

            {/* Top Meta Text Header */}
            <div className="relative z-10 max-w-lg mb-1">
              <h3 className="font-headline-md text-2xl sm:text-3xl text-[#e3e1e9] mb-2 font-semibold">
                Design with Industrial AI
              </h3>
              <p className="text-sm sm:text-[15px] text-[#c1c6d7] leading-relaxed">
                一键生成机器人作业流与运动学闭环，让复杂的工业控制算法、轨迹规划与硬件时序如同魔法般即时呈现。
              </p>
            </div>

            {/* Interactive Visual Deck: Substantial & Tall Studio Desktop Window */}
            <div className="relative z-10 w-full flex-1 flex flex-col pt-1">
              <div className="desktop-clean-window w-full rounded-2xl bg-[#0f1015] border border-white/10 shadow-2xl overflow-hidden flex flex-col flex-1">
                {/* Clean Mac Titlebar */}
                <div className="px-4 py-2.5 bg-[#171822] border-b border-white/5 flex items-center justify-between shrink-0">
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-1.5">
                      <span className="w-3 h-3 rounded-full bg-[#ff5f56]" />
                      <span className="w-3 h-3 rounded-full bg-[#ffbd2e]" />
                      <span className="w-3 h-3 rounded-full bg-[#27c93f]" />
                    </div>
                    <span className="font-label-caps text-xs text-[#e3e1e9] font-medium flex items-center gap-1.5">
                      <Monitor size={14} className="text-[#00daf3]" />
                      Nexus Studio · TRAJECTORY_FLOW_GEN.graph
                    </span>
                  </div>
                  <div className="flex items-center gap-3 font-label-caps text-xs">
                    <span className="px-2 py-0.5 rounded bg-[#006fee]/20 text-[#aec6ff] border border-[#006fee]/30 flex items-center gap-1 text-[11px]">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#00daf3] animate-ping" />
                      Live Synth
                    </span>
                    <span className="hidden sm:inline text-[#8b90a0]">CAN0: 1Mbps</span>
                  </div>
                </div>

                {/* Canvas Content: Generous, Prominent Content filling the desktop height */}
                <div className="p-4 flex-1 flex flex-col justify-between gap-3 bg-gradient-to-b from-[#14151e] to-[#0c0d12]">
                  {/* Pipeline Row (3 Steps) */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                    {/* Step 01 */}
                    <div className="p-2.5 rounded-xl bg-[#1c1d27] border border-white/5 flex flex-col gap-1 transition-all hover:border-[#00daf3]/30">
                      <div className="flex items-center justify-between text-[#e3e1e9]">
                        <span className="font-label-caps text-[10px] text-[#8b90a0]">Step 01</span>
                        <Radio size={14} className="text-[#00daf3]" />
                      </div>
                      <span className="font-code-inline text-xs sm:text-[13px] text-[#e3e1e9] font-semibold">
                        LiDAR Scan
                      </span>
                      <span className="font-label-caps text-[10px] text-[#8b90a0]">
                        Confidence: 99.8%
                      </span>
                    </div>

                    {/* Step 02 (AI Core Highlighted) */}
                    <div className="p-2.5 rounded-xl bg-[#006fee] text-white flex flex-col gap-1 shadow-lg shadow-[#006fee]/35 border border-white/20 transition-all hover:scale-[1.02]">
                      <div className="flex items-center justify-between">
                        <span className="font-label-caps text-[10px] font-semibold text-white/90">
                          AI Solver
                        </span>
                        <Sparkles size={14} className="text-white animate-pulse" />
                      </div>
                      <span className="font-code-inline text-xs sm:text-[13px] font-bold truncate">
                        IK 6-DOF Math
                      </span>
                      <span className="font-label-caps text-[10px] text-white/85">
                        Latency: 0.12ms
                      </span>
                    </div>

                    {/* Step 03 */}
                    <div className="p-2.5 rounded-xl bg-[#1c1d27] border border-white/5 flex flex-col gap-1 transition-all hover:border-[#dbb8ff]/30">
                      <div className="flex items-center justify-between text-[#e3e1e9]">
                        <span className="font-label-caps text-[10px] text-[#8b90a0]">Step 03</span>
                        <Cpu size={14} className="text-[#dbb8ff]" />
                      </div>
                      <span className="font-code-inline text-xs sm:text-[13px] text-[#e3e1e9] font-semibold">
                        Actuator Sync
                      </span>
                      <span className="font-label-caps text-[10px] text-[#8b90a0]">
                        Servo: Locked
                      </span>
                    </div>
                  </div>

                  {/* 6-DOF Kinematics & Trajectory Canvas (Expands desktop height, eliminates '矮' and empty space) */}
                  <div className="w-full flex-1 min-h-[96px] rounded-xl bg-[#0c0d12]/90 border border-white/5 p-3 flex flex-col sm:flex-row items-center justify-between gap-3 shadow-inner">
                    {/* Trajectory Bézier Visualizer */}
                    <div className="relative w-full sm:w-1/2 h-20 flex items-center justify-center">
                      <svg className="w-full h-full" viewBox="0 0 240 80" fill="none">
                        {/* Grid lines */}
                        <line x1="0" y1="20" x2="240" y2="20" stroke="#292a2f" strokeWidth="1" strokeDasharray="2 3" />
                        <line x1="0" y1="40" x2="240" y2="40" stroke="#292a2f" strokeWidth="1" strokeDasharray="2 3" />
                        <line x1="0" y1="60" x2="240" y2="60" stroke="#292a2f" strokeWidth="1" strokeDasharray="2 3" />
                        <line x1="60" y1="0" x2="60" y2="80" stroke="#292a2f" strokeWidth="1" strokeDasharray="2 3" />
                        <line x1="120" y1="0" x2="120" y2="80" stroke="#292a2f" strokeWidth="1" strokeDasharray="2 3" />
                        <line x1="180" y1="0" x2="180" y2="80" stroke="#292a2f" strokeWidth="1" strokeDasharray="2 3" />
                        
                        {/* Planned Smooth Trajectory Spline */}
                        <path
                          d="M 20,62 C 60,62 80,18 130,28 C 170,36 190,55 220,24"
                          stroke="#006fee"
                          strokeWidth="2"
                          strokeLinecap="round"
                        />
                        {/* Realtime Executed Trajectory Glow */}
                        <path
                          d="M 20,62 C 60,62 80,18 130,28"
                          stroke="#00daf3"
                          strokeWidth="2.5"
                          strokeLinecap="round"
                          className="rtos-waveform-glow"
                        />
                        
                        {/* Waypoints */}
                        <circle cx="20" cy="62" r="3.5" fill="#aec6ff" />
                        <circle cx="130" cy="28" r="4.5" fill="#00daf3" />
                        <circle cx="130" cy="28" r="8" stroke="#00daf3" strokeWidth="1" className="animate-ping" opacity="0.6" />
                        <circle cx="220" cy="24" r="3.5" fill="#dbb8ff" />
                        
                        {/* Labels */}
                        <text x="18" y="74" fill="#8b90a0" fontSize="8" fontFamily="monospace">P0:Home</text>
                        <text x="115" y="18" fill="#00daf3" fontSize="8" fontFamily="monospace" fontWeight="bold">P1:Target (TCP)</text>
                        <text x="195" y="18" fill="#dbb8ff" fontSize="8" fontFamily="monospace">P2:Place</text>
                      </svg>
                    </div>

                    {/* 6-DOF Joint Angles Matrix */}
                    <div className="w-full sm:w-1/2 flex flex-col justify-between h-full py-0.5">
                      <div className="flex items-center justify-between text-[10px] font-label-caps text-[#8b90a0] mb-1">
                        <span className="text-[#aec6ff] font-semibold">6-DOF JOINT MATRIX</span>
                        <span className="text-[#27c93f]">SYNC 100%</span>
                      </div>
                      <div className="grid grid-cols-3 gap-1.5">
                        <div className="px-2 py-1 rounded bg-[#171822] border border-white/5 flex justify-between items-center text-[10px] font-mono">
                          <span className="text-[#8b90a0]">J1</span>
                          <span className="text-[#00daf3] font-semibold">+14.2°</span>
                        </div>
                        <div className="px-2 py-1 rounded bg-[#171822] border border-white/5 flex justify-between items-center text-[10px] font-mono">
                          <span className="text-[#8b90a0]">J2</span>
                          <span className="text-[#e3e1e9] font-semibold">-38.5°</span>
                        </div>
                        <div className="px-2 py-1 rounded bg-[#171822] border border-white/5 flex justify-between items-center text-[10px] font-mono">
                          <span className="text-[#8b90a0]">J3</span>
                          <span className="text-[#00daf3] font-semibold">+82.1°</span>
                        </div>
                        <div className="px-2 py-1 rounded bg-[#171822] border border-white/5 flex justify-between items-center text-[10px] font-mono">
                          <span className="text-[#8b90a0]">J4</span>
                          <span className="text-[#8b90a0] font-semibold">0.0°</span>
                        </div>
                        <div className="px-2 py-1 rounded bg-[#171822] border border-white/5 flex justify-between items-center text-[10px] font-mono">
                          <span className="text-[#8b90a0]">J5</span>
                          <span className="text-[#dbb8ff] font-semibold">-43.6°</span>
                        </div>
                        <div className="px-2 py-1 rounded bg-[#171822] border border-white/5 flex justify-between items-center text-[10px] font-mono">
                          <span className="text-[#8b90a0]">J6</span>
                          <span className="text-[#00daf3] font-semibold">+18.4°</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Clean Status & Telemetry Bar */}
                  <div className="w-full flex items-center justify-between font-label-caps text-[#8b90a0] pt-2 border-t border-white/5 text-[11px] shrink-0">
                    <span className="flex items-center gap-2 text-[#e3e1e9]">
                      <span className="w-2 h-2 rounded-full bg-[#27c93f]" />
                      Realtime Kinematic Convergence: O(1)
                    </span>
                    <span className="text-[#00daf3] flex items-center gap-1.5 font-semibold">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#00daf3] animate-ping" />
                      94.2 Kops/s · 0.12ms
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>

          {/* ================= CARD 2: 工业协议与原子微图标网格 (Col 5) ================= */}
          <motion.div
            className="lg:col-span-5 group bento-card min-h-[470px]"
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.08 }}
          >
            {/* Top Text Header */}
            <div className="relative z-10 mb-1">
              <h3 className="font-headline-md text-2xl sm:text-3xl text-[#e3e1e9] mb-2 font-semibold">
                120+ 工业协议即插即用
              </h3>
              <p className="text-sm sm:text-[15px] text-[#c1c6d7] leading-relaxed">
                Modbus、OPC-UA、CANopen、EtherCAT、Siemens S7 等全栈通讯原生纳管，毫秒级原子化抽象。
              </p>
            </div>

            {/* Tactile 4x3 Industrial Micro-Icon Grid */}
            <div className="relative z-10 w-full flex-1 flex flex-col justify-center pt-1">
              <div className="grid grid-cols-4 gap-2.5 bg-[#0d0e13] p-3.5 rounded-2xl border border-white/5 shadow-inner">
                {protocols.map((proto) => {
                  const Icon = proto.icon;
                  return (
                    <div
                      key={proto.id}
                      className="tactile-icon-btn group/icon"
                      onMouseEnter={() => setActiveProtocol(proto.id)}
                      onMouseLeave={() => setActiveProtocol(null)}
                      title={`${proto.name}: ${proto.desc}`}
                    >
                      <Icon
                        size={21}
                        style={{ color: proto.color }}
                        className="transition-transform group-hover/icon:scale-110 shrink-0"
                      />
                      <span className="font-label-caps text-[9.5px] tracking-wide text-[#8b90a0] group-hover/icon:text-[#e3e1e9] text-center leading-none">
                        {proto.name}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          </motion.div>

          {/* ================= CARD 3: 零代码工业插件能力市场 (Col 4) ================= */}
          <motion.div
            className="lg:col-span-4 group bento-card min-h-[380px]"
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.12 }}
          >
            <div>
              <h3 className="font-headline-md text-2xl text-[#e3e1e9] mb-2 font-semibold">
                工业插件即刻获取
              </h3>
              <p className="text-sm text-[#c1c6d7] leading-relaxed">
                开箱即用的工业级视觉质检、3D孪生渲染与多机协同插件，拖拽即部署。
              </p>
            </div>

            {/* Layered Mockup Plugins Floating Stack (Snug and nicely centered without empty gap) */}
            <div
              className="relative w-full flex-1 min-h-[210px] flex items-center justify-center cursor-pointer"
              onClick={onOpenMarket}
              title="点击浏览插件市场"
            >
              <div className="floating-stack-card-back" />
              <div className="floating-stack-card-mid" />

              {/* Active Foreground Glass Card */}
              <div className="floating-stack-card-front">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-xl bg-[#6602b6] flex items-center justify-center text-[#cea2ff] shadow-md shadow-[#6602b6]/40">
                    <Video size={20} />
                  </div>
                  <div>
                    <div className="text-sm font-semibold text-[#e3e1e9]">CV-DefectEye</div>
                    <div className="font-label-caps text-[10px] text-[#8b90a0]">
                      v2.1.0 • 0.8ms
                    </div>
                  </div>
                </div>
                <div className="w-full bg-[#0d0e13] border border-white/5 rounded-lg p-2.5 flex items-center justify-between text-[#e3e1e9] font-label-caps text-[11px]">
                  <span>99.94% 缺陷拦截率</span>
                  <span className="text-[#00daf3] flex items-center gap-1 font-semibold">
                    <Check size={13} /> Installed
                  </span>
                </div>
              </div>
            </div>
          </motion.div>

          {/* ================= CARD 4: 实时 WebGL 孪生仿真与监控 (Col 4) ================= */}
          <motion.div
            className="lg:col-span-4 group bento-card min-h-[380px]"
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.16 }}
          >
            <div>
              <h3 className="font-headline-md text-2xl text-[#e3e1e9] mb-2 font-semibold">
                产线级 3D 监控与仿真
              </h3>
              <p className="text-sm text-[#c1c6d7] leading-relaxed">
                轻量化 WebGL 2.0 拓扑渲染，低算力开销全域感知实体产线机械臂与传感器。
              </p>
            </div>

            {/* WebGL Digital Twin Simulation Widget */}
            <div className="relative w-full flex-1 min-h-[210px] rounded-2xl bg-[#0d0e13] border border-white/5 overflow-hidden flex flex-col items-center justify-between p-4 shadow-inner">
              {/* Radar Scan Lines Visual (Inline SVG) */}
              <div className="relative w-full flex-1 flex items-center justify-center min-h-[130px]">
                <svg className="w-full h-full max-h-[140px]" viewBox="0 0 240 120" fill="none">
                  {/* Radial Grid */}
                  <circle
                    cx="120"
                    cy="60"
                    r="52"
                    stroke="#414754"
                    strokeWidth="1"
                    strokeDasharray="2 4"
                    opacity="0.45"
                  />
                  <circle
                    cx="120"
                    cy="60"
                    r="32"
                    stroke="#414754"
                    strokeWidth="1"
                    opacity="0.65"
                  />
                  <circle cx="120" cy="60" r="10" fill="#00daf3" opacity="0.18" />

                  {/* Crosshairs */}
                  <line
                    x1="55"
                    y1="60"
                    x2="185"
                    y2="60"
                    stroke="#414754"
                    strokeWidth="1"
                    opacity="0.35"
                  />
                  <line
                    x1="120"
                    y1="10"
                    x2="120"
                    y2="110"
                    stroke="#414754"
                    strokeWidth="1"
                    opacity="0.35"
                  />

                  {/* Robot Arm Skeleton */}
                  <path
                    d="M120 60 L145 35 L170 45"
                    stroke="#00daf3"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                  />
                  <circle cx="120" cy="60" r="4.5" fill="#00daf3" />
                  <circle cx="145" cy="35" r="3.5" fill="#aec6ff" />
                  <circle
                    cx="170"
                    cy="45"
                    r="4"
                    fill="#ffffff"
                    stroke="#00daf3"
                    strokeWidth="1.5"
                  />

                  {/* Pulse Point */}
                  <circle cx="95" cy="40" r="3" fill="#dbb8ff" />
                  <circle
                    cx="95"
                    cy="40"
                    r="6"
                    stroke="#dbb8ff"
                    strokeWidth="1"
                    className="animate-ping"
                    opacity="0.75"
                  />
                </svg>
              </div>

              {/* Bottom Live Telemetry Overlay */}
              <div className="w-full flex items-center justify-between font-label-caps text-[11px] pt-2 border-t border-white/5 text-[#8b90a0]">
                <span className="flex items-center gap-1.5 text-[#e3e1e9]">
                  <span className="w-2 h-2 rounded-full bg-[#00daf3]" />
                  Robot Joint #4: 42.8°
                </span>
                <span className="text-[#aec6ff] font-medium">60 FPS Smooth</span>
              </div>
            </div>
          </motion.div>

          {/* ================= CARD 5: 毫秒级确定性调度 RTOS 引擎 (Col 4) ================= */}
          <motion.div
            className="lg:col-span-4 group bento-card min-h-[380px]"
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <div>
              <h3 className="font-headline-md text-2xl text-[#e3e1e9] mb-2 font-semibold">
                &lt; 0.45ms 总线级调度
              </h3>
              <p className="text-sm text-[#c1c6d7] leading-relaxed">
                微秒级共享内存零拷贝 IPC，为严苛工业控制提供确定性无抖动安全冗余。
              </p>
            </div>

            {/* Realtime Waveform & Jitter Frequency Diagram */}
            <div className="relative w-full flex-1 min-h-[210px] rounded-2xl bg-[#0d0e13] border border-white/5 p-4 flex flex-col justify-between shadow-inner">
              <div className="flex items-center justify-between font-label-caps text-[11px]">
                <span className="text-[#e3e1e9] flex items-center gap-1.5 font-semibold">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#aec6ff] animate-pulse" />
                  Deterministic Jitter
                </span>
                <span className="px-2 py-0.5 rounded bg-[#292a2f] text-[#00daf3] text-[10px] border border-[#00daf3]/20">
                  ±1.2μs Max
                </span>
              </div>

              {/* Waveform SVG representation */}
              <div className="relative w-full flex-1 flex items-center justify-center min-h-[110px]">
                <svg className="w-full h-full max-h-[120px] rtos-waveform-glow" viewBox="0 0 200 60" preserveAspectRatio="none">
                  <line
                    x1="0"
                    y1="30"
                    x2="200"
                    y2="30"
                    stroke="#414754"
                    strokeWidth="1"
                    strokeDasharray="3 3"
                    opacity="0.4"
                  />
                  <path
                    d="M 0,30 Q 15,10 30,30 T 60,30 T 90,30 T 120,5 T 135,55 T 150,30 T 180,30 L 200,30"
                    fill="none"
                    stroke="#006fee"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                  />
                </svg>
              </div>

              <div className="flex items-center justify-between font-label-caps text-[10px] text-[#8b90a0] border-t border-white/5 pt-2">
                <span>BUFFER: RING-ZERO LOCKLESS</span>
                <span className="text-[#e3e1e9] font-semibold">STATUS: CRITICAL SYNC</span>
              </div>
            </div>
          </motion.div>

          {/* ================= CARD 6: 全异构统一驱动与代码控制台 (Col 12 Full-width Side-by-Side) ================= */}
          <motion.div
            className="lg:col-span-12 group bento-card-fullwidth"
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.24 }}
          >
            {/* Text Info Left */}
            <div className="w-full flex flex-col text-left">
              <h3 className="font-headline-md text-2xl sm:text-3xl text-[#e3e1e9] mb-3 font-semibold">
                全异构工业硬件，统一优雅纳管
              </h3>
              <p className="text-sm sm:text-[15px] text-[#c1c6d7] leading-relaxed mb-6">
                无论是 ABB、KUKA 六轴臂，还是研华工控机、倍福端子模块，统一抽象为高阶 TypeScript / C++ / Python SDK 对象。一行命令，点亮工业总线。
              </p>

              <div className="flex flex-wrap items-center gap-3">
                <button
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#006fee] text-white font-semibold text-sm hover:bg-[#005ac3] shadow-lg shadow-[#006fee]/30 active:scale-[0.98] transition-all"
                  onClick={onOpenDeveloperCenter}
                >
                  <span>快速运行驱动示例</span>
                  <ArrowRight size={15} />
                </button>

                <button
                  className="bento-copy-btn"
                  onClick={handleCopyCmd}
                  title="点击复制安装命令"
                >
                  {copiedCmd ? <Check size={14} className="text-[#00daf3]" /> : <Copy size={14} />}
                  <span>{copiedCmd ? '已复制命令' : 'npm i @nexus/industrial-sdk'}</span>
                </button>
              </div>
            </div>

            {/* Code / Interactive Live Terminal Right */}
            <div className="w-full rounded-2xl bg-[#0d0e13] border border-white/10 p-5 shadow-2xl flex flex-col gap-3 font-code-block text-[#e3e1e9]">
              {/* Window Titlebar */}
              <div className="flex items-center justify-between pb-3 border-b border-white/5">
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full bg-[#ffb4ab]/80" />
                  <span className="w-3 h-3 rounded-full bg-[#dbb8ff]/80" />
                  <span className="w-3 h-3 rounded-full bg-[#00daf3]/80" />
                  <span className="ml-2 font-label-caps text-[#8b90a0] text-xs">
                    industrial_mesh_telemetry.ts
                  </span>
                </div>
              </div>

              {/* Syntax Highlighted Code Payload */}
              <div className="space-y-1 text-xs sm:text-[13px] leading-relaxed overflow-x-auto py-2 font-mono">
                <p>
                  <span className="text-[#dbb8ff] font-semibold">import</span> &#123;{' '}
                  <span className="text-[#00daf3]">IndustrialNode</span>,{' '}
                  <span className="text-[#00daf3]">RoboticsBridge</span> &#125;{' '}
                  <span className="text-[#dbb8ff] font-semibold">from</span>{' '}
                  <span className="text-[#aec6ff]">&#39;@nexus/industrial-sdk&#39;</span>;
                </p>
                <p>
                  <span className="text-[#dbb8ff] font-semibold">const</span> node ={' '}
                  <span className="text-[#dbb8ff] font-semibold">new</span>{' '}
                  <span className="text-[#00daf3]">IndustrialNode</span>&#40;&#123; bus:{' '}
                  <span className="text-[#aec6ff]">&#39;can0&#39;</span>, deterministic:{' '}
                  <span className="text-[#00daf3]">true</span> &#125;&#41;;
                </p>
                <p className="text-[#8b90a0] italic">// 自动发现并映射产线拓扑</p>
                <p>
                  <span className="text-[#dbb8ff] font-semibold">await</span> node.
                  <span className="text-[#aec6ff]">connectAll</span>&#40;&#91;
                  <span className="text-[#aec6ff]">&#39;MODBUS_TCP&#39;</span>,{' '}
                  <span className="text-[#aec6ff]">&#39;OPC_UA&#39;</span>,{' '}
                  <span className="text-[#aec6ff]">&#39;ETHERCAT&#39;</span>&#93;&#41;;
                </p>
                <p>
                  node.<span className="text-[#aec6ff]">onTelemetry</span>&#40;&#40;frame&#41; =&gt; &#123;
                </p>
                <p className="pl-4 text-[#00daf3]">
                  console.log&#40;
                  <span className="text-[#aec6ff]">
                    &#96;[RT-SYNC] Latency: $&#123;frame.jitter&#125;μs | Joints: $&#123;frame.angles&#125;&#96;
                  </span>
                  &#41;;
                </p>
                <p>&#125;&#41;;</p>
              </div>

              {/* Terminal Output Footer */}
              <div className="pt-3 border-t border-white/5 flex items-center justify-between font-label-caps text-[#8b90a0] text-[11px]">
                <span className="flex items-center gap-1.5 text-[#e3e1e9]">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#00daf3]" />
                  Cluster: 8 Axes Synchronized (Sync error: 0.002mm)
                </span>
                <span className="text-[#8b90a0]">CPU Cycle: 4.1%</span>
              </div>
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  );
}

export function IndustrialFooter({
  onOpenDeveloperCenter,
}: {
  onOpenDeveloperCenter?: () => void;
}) {
  return (
    <footer className="w-full bg-[#0d0e13] border-t border-white/5 py-12 px-6">
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-8 mb-10">
          <div className="col-span-2">
            <div className="flex items-center gap-2.5 mb-3">
              <div className="w-8 h-8 rounded-lg bg-[#1e1f25] flex items-center justify-center text-[#00daf3] border border-white/5">
                <Share2 size={18} />
              </div>
              <span className="font-headline-md text-base font-semibold tracking-tight text-[#e3e1e9]">
                NEXUS INDUSTRIAL
              </span>
            </div>
            <p className="text-xs sm:text-sm text-[#c1c6d7] max-w-sm mb-4 leading-relaxed">
              面向工业物联网、高频遥测监测与边缘控制系统的高可用架构开发套件与 API 生态矩阵。
            </p>
            <div className="flex items-center gap-2 font-label-caps text-[11px] text-[#c1c6d7]">
              <span className="w-2 h-2 rounded-full bg-[#00daf3] animate-pulse" />
              <span>Edge Mesh Cluster: Online (99.995%)</span>
            </div>
          </div>

          <div>
            <div className="font-label-caps text-[11px] text-[#e3e1e9] uppercase mb-3 font-semibold tracking-wider">
              产品矩阵
            </div>
            <ul className="space-y-2 text-xs text-[#c1c6d7]">
              <li className="hover:text-white cursor-pointer transition-colors">IoT Telemetry Hub</li>
              <li className="hover:text-white cursor-pointer transition-colors">Edge RTOS Runner</li>
              <li className="hover:text-white cursor-pointer transition-colors">Robotics Driver SDK</li>
              <li className="hover:text-white cursor-pointer transition-colors">PLC Protocol Proxy</li>
            </ul>
          </div>

          <div>
            <div className="font-label-caps text-[11px] text-[#e3e1e9] uppercase mb-3 font-semibold tracking-wider">
              资源与协议
            </div>
            <ul className="space-y-2 text-xs text-[#c1c6d7]">
              <li className="hover:text-white cursor-pointer transition-colors" onClick={onOpenDeveloperCenter}>Modbus/CANopen Specs</li>
              <li className="hover:text-white cursor-pointer transition-colors" onClick={onOpenDeveloperCenter}>OpenAPI 3.1 Registry</li>
              <li className="hover:text-white cursor-pointer transition-colors" onClick={onOpenDeveloperCenter}>SDK Download Center</li>
              <li className="hover:text-white cursor-pointer transition-colors" onClick={onOpenDeveloperCenter}>System Architecture</li>
            </ul>
          </div>

          <div>
            <div className="font-label-caps text-[11px] text-[#e3e1e9] uppercase mb-3 font-semibold tracking-wider">
              合规与状态
            </div>
            <ul className="space-y-2 text-xs text-[#c1c6d7]">
              <li className="hover:text-white cursor-pointer transition-colors">IEC 62443 Security</li>
              <li className="hover:text-white cursor-pointer transition-colors">Telemetry SLA Status</li>
              <li className="hover:text-white cursor-pointer transition-colors">Release Notes v4.18</li>
              <li className="hover:text-white cursor-pointer transition-colors">Privacy &amp; Terms</li>
            </ul>
          </div>
        </div>

        <div className="pt-6 border-t border-white/5 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-[#8b90a0]">
          <span>© 2025 Nexus Industrial Platform, Inc. All rights reserved.</span>
          <div className="flex items-center gap-4 font-label-caps text-[10px]">
            <span>LATENCY: 4.2ms</span>
            <span>REGION: AP-EAST-1</span>
            <span>KERNEL: 6.8.0-RT</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
