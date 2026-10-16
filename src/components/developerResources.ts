export type DocGroup = '开发入门' | 'SDK 能力' | 'AI Skills';
export type DocSection = { id: string; title: string; paragraphs: string[]; items?: string[]; code?: string; level?: 2 | 3 };
export type DeveloperDoc = { id: string; title: string; group: DocGroup; summary: string; sections: DocSection[] };
const section = (id: string, title: string, paragraphs: string[], items?: string[]): DocSection => ({ id, title, paragraphs, items });
export const capabilityNames = ['机器人', '导航', '机械臂', '通用外设', '场景点位', '标定', '行为树', '视觉流程', '系统'];
const capabilities = [
  ['robot', '机器人', '了解机器人连接、状态订阅与控制任务的组织方式。', ['连接与设备身份', '状态订阅与运行模式', '控制任务与异常处理']],
  ['navigation', '导航', '理解地图、定位、路径任务与导航状态的开发流程。', ['地图与定位状态', '目标点与导航任务', '取消任务与失败恢复']],
  ['manipulator', '机械臂', '了解机械臂坐标、运动任务与执行状态的集成方式。', ['关节与工具坐标', '运动任务与执行反馈', '限位与任务中止']],
  ['peripherals', '通用外设', '统一整理外设连接、数据读写与设备状态的开发要点。', ['外设发现与连接', '数据读写与状态订阅', '断线重连与资源释放']],
  ['waypoints', '场景点位', '管理场景坐标、点位信息及点位在业务任务中的引用。', ['场景坐标与点位定义', '点位查询与更新', '任务引用与一致性检查']],
  ['calibration', '标定', '理解标定数据的准备、执行、校验与结果管理。', ['坐标系与数据准备', '标定流程与结果校验', '结果保存与版本管理']],
  ['behavior-tree', '行为树', '了解行为树节点、组合关系、运行状态及调试方法。', ['节点职责与组合', '生命周期与异步状态', '取消、超时与调试']],
  ['vision', '视觉流程', '连接图像输入、视觉处理步骤与识别结果消费流程。', ['图像输入与参数', '流程编排与执行', '结果解析与失败分支']],
  ['system', '系统', '整理插件运行环境、配置、日志和资源管理的开发要求。', ['环境与配置管理', '日志与诊断信息', '资源释放与运行状态']],
] as const;
export const developerDocs: DeveloperDoc[] = [
  { id: 'quick-start', title: '百川 OS 插件开发入门', group: '开发入门', summary: '从环境准备到调试验证，了解第一个插件的开发流程。', sections: [
    section('overview', '开发流程概览', ['插件是围绕百川 OS 能力构建的功能单元。开发前应先确认应用场景、目标设备和需要调用的能力。本文为平台原型的开发流程说明，具体命令与接口签名以正式 SDK 随附资料为准。'], ['准备环境 → 创建插件 → 调用能力 → 调试验证 → 打包交付']),
    section('environment', '准备开发环境', ['获取与目标百川 OS 版本配套的 SDK，核对运行环境要求和示例工程。先使用模拟设备或测试环境完成连接验证。'], ['确认百川 OS 与 SDK 兼容版本。', '按 SDK 随附说明安装工具链和依赖。', '为测试环境配置设备连接信息，避免把凭据写入源码。']),
    section('create', '创建与组织插件', ['按官方模板建立插件工程，将业务逻辑、能力适配与界面组件分开组织。插件声明应准确描述需要的能力及配置项。']),
    section('capabilities', '调用与验证能力', ['根据业务需要选择机器人、导航、机械臂等能力域。处理连接、运行中、完成、取消和失败等状态，避免把请求提交成功视为任务完成。']),
    section('debugging', '调试与交付检查', ['记录任务标识、输入参数和状态变化，便于定位失败原因。交付前检查配置、资源释放和异常恢复。'], ['验证正常执行、超时、取消和断线分支。', '检查日志中是否包含凭据或敏感配置。', '记录兼容版本、已知限制与部署步骤。']),
  ]},
  { id: 'architecture', title: '插件架构与开发规范', group: '开发入门', summary: '理解插件边界、生命周期、能力调用与工程组织。', sections: [
    section('boundaries', '插件职责与架构边界', ['插件负责特定场景的业务编排，通过 SDK 访问系统能力。将设备通信与界面状态隔离，减少业务逻辑对特定设备的直接依赖。']),
    section('lifecycle', '插件生命周期', ['围绕初始化、运行、停止与销毁组织代码。初始化阶段校验配置，停止阶段取消任务，销毁阶段清理订阅、计时器和连接。']),
    section('config', '配置与接口约定', ['为配置字段提供明确类型、默认值与校验规则。不要在插件内部固定设备地址或环境凭据。调用失败应保留可定位问题的错误上下文。']),
    section('validation', '开发与验证规范', ['对能力调用建立可替换的适配层，以便在模拟环境验证流程。交付说明应包含版本要求、配置方法、调试方法和资源依赖。']),
  ]},
  ...capabilities.map(([id, title, summary, topics]): DeveloperDoc => ({ id, title: `${title}能力开发说明`, group: 'SDK 能力', summary, sections: [
    section('scope', '能力范围', [`本节介绍${title}能力在插件中的使用范围与接入流程。具体支持的设备、方法和参数以所用 SDK 版本为准。`], [...topics]),
    section('prepare', '接入准备', ['确认目标设备、运行环境、权限与 SDK 版本。连接测试设备后检查初始状态，再开始业务任务。']),
    ...topics.map((topic, index) => ({ ...section(`topic-${index}`, topic, [`将“${topic}”作为独立步骤实现，明确输入、执行状态、输出及失败处理。订阅状态变化时，应在插件停止或卸载时释放相关资源。`]), level: 3 as const })),
    section('verify', '调试与验证', ['在测试环境验证成功、失败、取消和超时等分支。保留任务标识和状态日志，检查异常恢复后是否仍能发起下一次任务。']),
  ]})),
  { id: 'skill-workflow', title: 'AI Skills 使用与插件开发流程', group: 'AI Skills', summary: '在 AI 辅助开发中组织上下文、约束和验证步骤。', sections: [
    section('intro', 'Skill 的使用范围', ['Skill 为 AI 开发助手提供可复用的工作步骤和开发约束。它辅助理解文档和实现插件，不替代实际 SDK 文档与调试验证。本页提供可下载的示例 Skill，供原型体验与后续维护。']),
    section('context', '准备开发上下文', ['提供目标百川 OS / SDK 版本、设备场景、插件需求与相关接口文档。明确哪些信息已经确认、哪些需要进一步核实。']),
    section('workflow', '执行辅助开发流程', ['先梳理需求和能力依赖，再生成实现计划。分步实现插件，逐项检查接口依据、任务状态处理和资源清理。'], ['阅读当前版本文档并确认接口。', '建立插件结构与配置校验。', '实现能力调用及异常分支。', '完成测试环境调试并记录结果。']),
    section('rules', '开发约束与验收', ['不要编造未提供的接口、SDK 包名或版本。缺少正式资料时明确列出待确认项。涉及真实设备的控制流程须在对应测试环境完成验证。']),
  ]},
];
export const integrationServices = ['设备连接', '状态订阅', '任务调度'];
export function markdownFor(doc: DeveloperDoc) {
  return `# ${doc.title}\n\n${doc.summary}\n\n> 平台原型内容草案；接口与版本以正式 SDK 资料为准。\n\n` + doc.sections.map(s => `${s.level === 3 ? '###' : '##'} ${s.title}\n\n${s.paragraphs.join('\n\n')}${s.items ? '\n\n' + s.items.map(i => `- ${i}`).join('\n') : ''}${s.code ? '\n\n```\n' + s.code + '\n```' : ''}`).join('\n\n');
}
export const skillSource = `---\nname: baichuan-plugin-development-example\ndescription: 百川 OS 插件开发辅助流程示例；使用时需提供正式 SDK 文档。\n---\n\n# 百川 OS 插件开发辅助\n\n1. 阅读用户提供的目标 OS 与 SDK 版本资料，不编造接口或安装命令。\n2. 明确插件职责、能力依赖、配置项与验收标准。\n3. 按初始化、运行、停止、销毁组织实现。\n4. 为能力调用处理完成、失败、取消和超时状态。\n5. 清理订阅、连接与计时器，避免凭据进入代码或日志。\n6. 在测试环境验证并报告实际结果与待确认项。\n\n此 Skill 是平台原型提供的示例，不代表官方发布资源。\n`;
export function downloadText(name: string, content: string, type = 'text/markdown;charset=utf-8') {
  const url = URL.createObjectURL(new Blob([content], { type }));
  const link = document.createElement('a'); link.href = url; link.download = name; link.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
