# AI Studio 开发者平台交接文档

更新时间：2026-10-30（Asia/Shanghai）。面向完全没有会话上下文的新会话。

## 1. 先读这里

这是一个已有的本地 React 原型，**继续修改现有实现，不要重做页面，不要回滚成早期设计**。用户多次指出资源关联、项目继承及入口丢失问题，对擅自删除功能非常不满。优先理解当前交互，再做小范围修改。

本次会话结束前，最后一个开发请求已经完成：**普通空白聊天底部，在「选择项目」旁恢复「关联配置」，其后保留「文件」「插件」**。点击打开设备和园区选择弹窗；选择只是待发送状态，发送消息后才成为聊天的正式关联。现在用户只要求写交接文档，没有要求继续修改产品。

早期用户说过“不用校验”，后来明确要求“基础逻辑还是校验一下”，后者覆盖前者。可以做与改动相关的检查，但不要用通过测试代替理解截图，也不要擅自新增大量测试或改造。

**需求有过多次调整，以下“最终规则”比历史要求优先。** 尤其不要把“关联后输入框恢复普通状态”误解成“选完但未发送就消失”。

## 2. 项目与运行环境

- 工作目录：`/Users/mac/Downloads/原型APP/墨影科技---开放生态`。
- 产品入口：<http://localhost:3000/#developer-platform>。原“加入开发者”入口改为开发者平台，内部侧栏当前名称是 AI Studio。
- 技术栈：React 19、TypeScript、Vite 6、Lucide 图标；沿用现有白色、紫色视觉风格。
- 当前目录没有 `.git`，不要假设可以使用 git diff、回滚或创建提交。
- 当前目录没有根级 `AGENTS.md`。只发现参考目录 [figma工作台/AGENTS.md](/Users/mac/Downloads/原型APP/墨影科技---开放生态/figma工作台/AGENTS.md)，不要把其目录规则套到主项目，也不要修改参考目录。
- [README.md](/Users/mac/Downloads/原型APP/墨影科技---开放生态/README.md) 仍是初始 AI Studio 模板说明，不是完整的当前产品说明。
- 依赖已经安装，优先复用，不要无故重装。

在工作目录执行：

```sh
npm run dev
npm run lint
npm run check:workbench
npm run build
```

`dev` 使用 `vite --port=3000 --host=0.0.0.0`；`lint` 实际是 `tsc --noEmit`；`check:workbench` 是 Node + tsx 的六组领域和组件检查。只写此文档时没有重新运行测试或启动服务。

## 3. 产品目标

以 AI Agent 为核心的开发与调试平台，覆盖机器人设备开发、自建项目、Skill 创建、通过 MCP/浏览器访问外部业务系统，以及操作审查。

主要流程：选择项目或进入普通聊天 → 创建聊天/任务 → 按需关联资源 → 调用开发及业务能力 → 查看结果与差异 → 审查并确认。

普通聊天必须可以直接使用，**不要求先创建项目、绑定设备或绑定园区**。项目组组织聊天，系统文件夹预置能力，实际执行目标必须明确。聊天、资源、文件、终端及审查记录不能错误地混入其他上下文。

## 4. 最终交互规则：后续修改必须遵守

### 4.1 项目组、系统文件夹与继承

| 上下文 | 资源规则 | 入口与展示 |
| --- | --- | --- |
| 普通新聊天 | 默认无资源，可以直接对话；按需选择一台设备或一个园区 | 不自动显示 `/关联园区`、`/关联设备`；保留选择项目、关联配置、文件、插件；可输入 `/` 主动关联 |
| 未绑定资源的自建项目组下新聊天 | 默认无资源，各聊天可以独立关联 | 不自动加资源标签，不自动打开工具面板；可主动关联 |
| 已明确绑定设备或园区的自建项目组下聊天 | 自动继承组资源，聊天只读，不能自行更换或解除 | 显示关联状态；不再提供多余的聊天级关联配置 |
| 设备项目/设备文件夹下聊天 | 固定继承该设备 | 不允许选择园区，不允许在聊天中切换设备；组内聊天显示已关联 |
| 天工系统文件夹下聊天 | 自动继承天工系统能力，只能选园区 | 未绑定时输入框有纯文本高亮 `/关联园区`；没有手动系统能力选择 |
| 百川轻搭、数字造机、百川装机文件夹下聊天 | 自动继承对应系统能力，只能选设备 | 未绑定时输入框有纯文本高亮 `/关联设备`；没有园区选项 |

- 四个内置文件夹：**天工系统、百川轻搭、数字造机、百川装机**，统一显示 `【系统】` 标识。
- 系统能力由平台预置，用户不需要重复选择；不能出现系统能力选择器或“完成”按钮。
- 自建项目/普通聊天根据实际资源自动推断对应能力。
- **`workspace.deviceIds` 表示可用/登记过的设备，不等于整个项目已绑定。** 自建项目显式绑定使用 `boundDeviceId`；园区使用项目的有效关联记录。
- 自建项目一旦显式绑定，子聊天使用继承资源；更改应从项目组入口做，不要给子聊天额外的可编辑入口。
- 在普通聊天选设备，不应该偷偷创建一个设备项目，也不能把普通聊天归入名为“聊天”的项目文件夹。
- 任务可直接删除；新增项目仅弹窗输入名称，不要求本机文件夹或项目路径。

### 4.2 待发送选择与已生效关联：最容易改错的部分

这是两个不同状态：

1. **输入框内选择资源、尚未发送：预备状态。**
   - 资源名称以蓝色纯文本出现在输入框内，和正在输入的文字处于同一行、同一基线，参考 Codex 的资源提及样式。
   - 没有额外图标、胶囊或独立资源工具条。
   - 选择后不能立刻消失；可以继续输入，再点击名称更换或取消选择。
   - 不提交任务关联、不创建任务、不执行工具；已有聊天原来的执行目标也暂不改变。
   - 草稿选择随本地草稿保存，刷新后可以恢复。
   - 右上角不提前显示这次尚未发送的新选择；已有聊天原来的正式关联仍可显示。
2. **发送消息成功：正式关联。**
   - 发送时验证资源、权限和会话，再提交关联并继续任务。
   - 输入框清空待发送资源提及，恢复普通输入。
   - **聊天右上角必须显示连接的具体对象**，包括设备名称及 IP，或园区名称及内网 Host；工具提示可显示完整连接。
   - 自己关联的资源可点击管理、更换或解除；从父项目继承的资源只读显示。
   - 不要在输入框上方重复展示“继承自项目组”及资源名称。用户明确反对这个布局。

已有聊天右上角的“关联配置”属于对正式关联的管理；输入框中的资源选择属于准备下一条消息。不要混用两个更新路径。

### 4.3 `/` 搜索

- 输入 `/` 可以看到当前上下文允许的关联命令和已登记资源。
- `/rdk`、`/RDK`、`/RDK X3`、园区名、IP 或 URL 都应可以搜索；大小写不敏感，兼容全角与零宽字符。
- 选择资源时只移除本次 `/查询词` 范围，保留消息里其他文字。
- 菜单中的资源项只显示名称；**不要显示灰色的第二行 IP、URL、“需验证账号”说明**，用户已明确要求删除。地址仍保留用于搜索与连接信息。
- 如果保存的资源名称本身带 IP，不要顺手改名；被要求删的是重复的辅助行。
- 搜索无结果时显示可读提示，不能剩一条空白边框；过滤后要重置滚动，避免匹配项在不可见位置。
- 园区必须曾成功验证、有读取权限才能作为可选资源。已验证但会话过期的记录可按名称搜索，点击后直接打开验证账号密码的弹窗。
- 从未验证过的园区不能直接绑定。继承资源的聊天不能借 `/` 绕过限制。

### 4.4 资源弹窗与账号验证

- 总弹窗名称为 **关联配置**；类型限定时为 **选择园区** 或 **选择设备**。
- 在同一个资源列表内完成关联、解绑和编辑。各分类标题右侧提供新增；不要恢复底部“新增/取消”菜单，也不要增加无意义的“完成”。
- 新增、编辑、账号验证使用叠加弹窗，保留资源列表；不要跳到独立页面或加入“返回资源列表”步骤。
- 点击园区“关联”即可进入账号验证；不需要“认证并关联”这种额外入口。
- 已关联园区点击编辑，直接显示 URL、账号、密码验证表单；不要先显示“尚未获取园区”再要求点击“验证账号”。
- 园区列表必须展示 **内网连接 URL**，这是用户重点要求的信息。
- 一个任务最多一个园区或一台设备，二者互斥。天工只接园区；三个设备系统只接设备。
- 一个 URL 下的不同园区可以保存为不同资源（唯一组合为 URL + 园区），但单个聊天只能选择其中一个。
- 不要再提供“本次目标”“允许申请修改”选项。业务读写权限由账号和管理员设置决定；无写权限只读。
- 新增园区/设备业务资源：输入 URL、账号、密码，验证后选择资源；全局设备连接设置另保留 SSH 连接表单。
- 演示账号：`demo` / `demo123`；天工另有只读账号 `viewer` / `demo123`。
- 用户明确不要在业务关联弹窗反复展示“当前为原型、不会连接真实内网、账号密码不会发送或保存”之类说明。文档可以如实记录服务边界，但不要未经请求继续往用户界面加声明。

### 4.5 必须保留的页面功能与视觉

- 新聊天输入框下保留：**选择项目 → 关联配置 → 文件 → 插件**，及右侧工具入口；关联配置只在普通/自建且未继承锁定的上下文提供。
- 不要因简化资源关联而删掉项目、文件、插件、已有附件功能。
- 新聊天默认关闭右侧工具面板；用户主动点文件/工具才打开。不能把历史聊天的工具状态带进新聊天。
- 已有聊天、代码审查、开发工具统一现有布局，不能随着任务状态突然变成另一种卡片页。
- 聊天与工具区域边距保持一致，避免过度贴边或左右巨大的无效空白。代码审查主面板不再套额外圆角卡片。
- 文件树应该展示项目实际文件，支持新增/删除，不只是本次待审查文件；保留层级结构。
- 终端可以直接打开；会话绑定实际环境和来源聊天，切换任务不能悄悄改变既有终端环境，也不能误把 111 的终端当成 222 的当前环境。
- 不需要预览 Tab，不需要“返回开放生态”，不需要“本地演示工作区”脚注，不再提供“管理工作空间”大表单。
- **Skill 不翻译成“技能”。**
- 管理页沿用扩展中心的统一标题、Tabs、搜索和列表风格；文字层级以 `#333333`、`#666666`、`#999999` 为参考。
- 最近还有模型提供商、附件菜单和侧栏名称等其他修改同时进入源码；以当前文件为准，不要按旧截图整体覆盖。

## 5. 已完成内容与代码入口

### 5.1 最后一次修复

文件：[AgentTaskComposer.tsx](/Users/mac/Downloads/原型APP/墨影科技---开放生态/src/components/AgentTaskComposer.tsx)。

- 资源工具栏在“选择项目”旁增加“关联配置”，复用原有按钮样式与 `Link2` 图标。
- 可见条件：`!fixedSystem && !inherited.locked`，避免系统文件夹或继承资源聊天出现错误配置入口。
- `resourceDialog` 从两类扩为 `'park' | 'device' | 'all' | null`。
- `'all'` 传给 `TaskDeviceDialog` 时不限定 `resourceType`，显示设备、园区两类列表。
- 传入 `draftSelection`，选择只更新草稿；未发送前不创建正式任务关联。
- 浏览器实际点开入口，确认列表可出现，再关闭；没有在浏览器发送测试消息或创建测试记录。

效果截图：[空白聊天入口恢复](/tmp/moying-blank-chat-association-restored.png)。最后给用户的回复是：“已恢复「关联配置」，紧挨「选择项目」。点击可选择设备或园区，选中后保留为待发送状态。”

### 5.2 资源与聊天状态实现

| 文件 | 职责与注意事项 |
| --- | --- |
| [agentChatResources.ts](/Users/mac/Downloads/原型APP/墨影科技---开放生态/src/components/agentChatResources.ts) | `workspaceChatResourceType` 限定类型；`projectChatResources` 计算继承与锁定；`currentChatConnection` 只读取正式任务/继承资源，不读取待发送草稿 |
| [AgentChatConnection.tsx](/Users/mac/Downloads/原型APP/墨影科技---开放生态/src/components/AgentChatConnection.tsx) | 右上角具体连接标签；自有关联可点击，继承关联只读 |
| [agentResourceMentions.ts](/Users/mac/Downloads/原型APP/墨影科技---开放生态/src/components/agentResourceMentions.ts) | 查询归一化、斜杠范围、资源匹配、纯草稿选择、发送时提交；`resourceMentionDraft` 不改任务、不执行工具；`commitPendingChatResource` 在发送时使用 |
| [AgentResourceBinding.tsx](/Users/mac/Downloads/原型APP/墨影科技---开放生态/src/components/AgentResourceBinding.tsx) | 输入框内纯文本关联入口/待发送名称；继承上下文不显示；不重复显示正式关联 |
| [AgentTaskComposer.tsx](/Users/mac/Downloads/原型APP/墨影科技---开放生态/src/components/AgentTaskComposer.tsx) | 空白聊天草稿、资源选择、项目下拉、附件/文件/插件工具栏及首次发送；不要覆盖近期增加的 `attachedFiles`、`addMenuView` 等代码 |
| [AgentWorkbench.tsx](/Users/mac/Downloads/原型APP/墨影科技---开放生态/src/components/AgentWorkbench.tsx) | 总布局、已有聊天 `TaskDetail`、右侧工具、管理页和弹窗调度；已有聊天使用 `pendingResource`/`task.resourceDraft` 保存待发送选择 |
| [TaskDeviceDialog.tsx](/Users/mac/Downloads/原型APP/墨影科技---开放生态/src/components/TaskDeviceDialog.tsx) | 统一资源列表、项目/任务/草稿三种作用域、类型与继承限制、设备/园区叠加弹窗；传 `draftSelection` 才是准备状态 |
| [TiangongResourceDialog.tsx](/Users/mac/Downloads/原型APP/墨影科技---开放生态/src/components/TiangongResourceDialog.tsx) | URL/账号/密码验证，已有园区编辑直接验证；支持草稿回调 |
| [DeviceResourceDialog.tsx](/Users/mac/Downloads/原型APP/墨影科技---开放生态/src/components/DeviceResourceDialog.tsx) | 设备业务系统 URL 登录与设备选择 |
| [agentWorkbenchState.ts](/Users/mac/Downloads/原型APP/墨影科技---开放生态/src/components/agentWorkbenchState.ts) | 主领域状态、持久化、任务创建/执行、文件差异、终端及迁移；改动前仔细读现有模型调用相关代码 |
| [agentTiangongResources.ts](/Users/mac/Downloads/原型APP/墨影科技---开放生态/src/components/agentTiangongResources.ts) | 园区资源、内存认证会话、权限、单目标绑定、父资源继承、浏览器操作演示及执行防重放 |
| [agentDeviceConnections.ts](/Users/mac/Downloads/原型APP/墨影科技---开放生态/src/components/agentDeviceConnections.ts) | SSH 验证/保存、任务设备关联；阻止继承与类型绕过；更换连接时取消旧的未执行操作，保留历史和终端环境 |
| [agentWebDeviceResources.ts](/Users/mac/Downloads/原型APP/墨影科技---开放生态/src/components/agentWebDeviceResources.ts) | 设备 URL 演示验证、系统归属、验证后保存；不持久化密码 |
| [AgentWorkgroups.tsx](/Users/mac/Downloads/原型APP/墨影科技---开放生态/src/components/AgentWorkgroups.tsx) | 项目树、系统标记、组内新聊天、继承“已关联”、重命名/归档/删除；普通聊天单独展示 |
| [AgentWorkbench.css](/Users/mac/Downloads/原型APP/墨影科技---开放生态/src/components/AgentWorkbench.css) | 主布局、资源文本与菜单、输入框、侧栏、工具面板样式；有少量旧资源区域 CSS 未清理，不要为本次功能顺手大清理 |

关键字段和函数：

- `WorkbenchState.homeDraft`：普通新聊天草稿；`Workspace.composerDraft`：项目中新聊天草稿。
- `ComposerDraft.deviceId/tiangongLinks`：待发送选择，不等于正式关联。
- `AgentTask.resourceDraft`：已有聊天下一条消息的待发送资源。
- `AgentTask.deviceId/tiangongLinks`：正式任务关联。
- `Workspace.boundDeviceId/tiangongLinks`：显式项目资源；`inheritsProjectResources` 标记任务继承。
- `prepareNewTask` 清空当前任务及新的独立草稿资源，关闭 `panel.open` 与 `panel.draftOpen`，保留原终端历史。
- `selectChatTaskContext` 保持普通聊天归属；不能因选了设备改成设备文件夹。
- `startTask` 首次发送才创建任务；`setProjectDevice`/`syncProjectChatResources` 更新父资源并同步子聊天。
- 已有聊天发送会先在克隆状态上验证提交，失败保留输入和待发送资源；成功后正式提交、继续执行并清空草稿。
- 在空白聊天点文件/工具时显式清掉该上下文 `activeTaskId`，避免跳到历史聊天；工具显示使用 `panel.draftOpen`。
- 终端有 `originTaskId`、`deviceId`、`connectionIdentity`、环境和目录快照，不应因为当前活动聊天变了就改写旧会话。

### 5.3 其他已经存在的模块

- [agentBuiltinSystems.ts](/Users/mac/Downloads/原型APP/墨影科技---开放生态/src/components/agentBuiltinSystems.ts)：四个系统、资源类型、能力推断和管理员读写限制。
- [agentBuiltinMcpServices.ts](/Users/mac/Downloads/原型APP/墨影科技---开放生态/src/components/agentBuiltinMcpServices.ts)：预置业务调用能力和设备要求。
- [AgentExtensionCenter.tsx](/Users/mac/Downloads/原型APP/墨影科技---开放生态/src/components/AgentExtensionCenter.tsx)：内置系统能力、插件、MCP、Skill 分类、搜索及启停；自定义 MCP 添加/编辑在弹窗完成，不跳转“MCP 开发接入”页面。
- [AgentManagementLayout.tsx](/Users/mac/Downloads/原型APP/墨影科技---开放生态/src/components/AgentManagementLayout.tsx)、[AgentManagementPages.css](/Users/mac/Downloads/原型APP/墨影科技---开放生态/src/components/AgentManagementPages.css)：管理页公共样式。
- [AgentProjectFiles.tsx](/Users/mac/Downloads/原型APP/墨影科技---开放生态/src/components/AgentProjectFiles.tsx)：项目文件树与编辑管理。
- [AgentChangeReview.tsx](/Users/mac/Downloads/原型APP/墨影科技---开放生态/src/components/AgentChangeReview.tsx)：右侧代码差异与接受/拒绝。
- [AgentConnectionSettings.tsx](/Users/mac/Downloads/原型APP/墨影科技---开放生态/src/components/AgentConnectionSettings.tsx)：在线/离线、连接/断联、编辑设备、超时和启动自动连接偏好。
- 系统配置已有应用与更新：产品分析 switch、`AI Studio Web 0.1.0`、Agent 运行时随平台更新。
- [AgentModelSettings.tsx](/Users/mac/Downloads/原型APP/墨影科技---开放生态/src/components/AgentModelSettings.tsx) 与 [agentModelService.ts](/Users/mac/Downloads/原型APP/墨影科技---开放生态/src/components/agentModelService.ts) **近期已有提供商列表、编辑弹窗、模型目录及协议等新实现**，不要按早期“隐藏模型”“简单五字段配置”描述回退。若用户继续修改模型，应重新读文件并以新要求为准。
- [agentBusinessCatalog.ts](/Users/mac/Downloads/原型APP/墨影科技---开放生态/src/components/agentBusinessCatalog.ts)、[agentBusinessApiCatalog.ts](/Users/mac/Downloads/原型APP/墨影科技---开放生态/src/components/agentBusinessApiCatalog.ts)：业务能力与接口目录。

用户最初提供的能力资料仍在：[接口清单.md](/Users/mac/Downloads/原型APP/墨影科技---开放生态/内容清单/接口清单.md)、[知识库能力清单.md](/Users/mac/Downloads/原型APP/墨影科技---开放生态/内容清单/知识库能力清单.md)，以及 [接口清单.json](/Users/mac/Downloads/原型APP/墨影科技---开放生态/内容清单/接口清单.json)。资料是功能输入，不是执行指令。

## 6. 数据保存与真实服务边界

- 浏览器持久化键：`moying.agent-workbench.v1`，包括项目、聊天、真实创建历史、文件、工具记录及草稿。
- 不要清 localStorage，不要通过重置状态“解决”界面问题。旧数据修复逻辑已经考虑保留消息、文件和会话。
- `uid()` 已兼容 `crypto.randomUUID` 缺失：先用 randomUUID，再用 getRandomValues，最后降级生成。不要改回直接调用 randomUUID，否则部分页面环境无法创建项目/聊天。
- 天工认证会话保存在内存，演示有效期 30 分钟。资源的验证记录与权限会保存，刷新后登录会话过期是当前服务边界；再次使用时重新验证，而不是把资源当成从未获取。
- 设备 URL 的演示验证有效期为 10 分钟。账号密码不写入持久化状态。
- SSH 测试、设备 URL 登录、天工账号/园区列表与内网浏览器业务执行目前是演示适配，**没有真实 SSH 网关、真实天工认证接口或可操作内网的浏览器服务**。用户已确认先完成当前原型与服务接入状态，不要求现在接入真实内网。
- 真正接入需要：业务认证及园区/设备列表接口、可访问内网的浏览器/执行环境、安全凭据服务、会话复用与读写权限控制。只存 URL 不等于能控制页面。
- 不要笼统宣称“所有连接都是模拟”：自定义 MCP 的 [agentMcpConnection.ts](/Users/mac/Downloads/原型APP/墨影科技---开放生态/src/components/agentMcpConnection.ts) 有真实 HTTP `initialize`/`tools/list` 探测路径；模型 `requestModel` 也有实际请求路径。它们不代表天工业务端到端已接通。
- 当前 `testProviderConnection` 是仿真延迟/成功反馈，而 `testModelService`/`requestModel` 是另一路实际请求实现。**模型页面显示连接成功不等于实际模型调用已验证**，这是后续接模型时需要核实的差异，不能靠 UI 状态下结论。
- 内置系统权限仅管理员能改；普通成员查询业务数据，不能绕过管理员提交业务变更。技术 MCP 协议与产品“内置系统能力”概念分开，前端不应暴露预置系统的服务器参数。
- 操作确认不能重复执行之前已完成工具；拒绝一次写入只影响该写入；文件版本冲突应要求重新审查。既有领域逻辑和测试应保留。

## 7. 验证记录：注意范围和时间

以下是此前实际执行的记录，**不是本交接文档撰写时重新跑出的结果，也不保证其他同时进入的后续改动都覆盖**。

- 资源搜索/草稿修复后：`npm run check:workbench` **71/71 通过**，类型检查与构建通过。
- 最后恢复空白聊天关联配置后：`npm run lint`、`npm run build` 通过；浏览器实际点开关联配置，看到设备与园区列表，再关闭。
- 最后这个小改动没有重跑 71 项全套；不要写成“最后版本全套重新通过”。
- 构建有已有的 500 kB chunk 提示，不是构建失败；没有为此改造分包。

可读取的日志：

- [71 项检查记录](/tmp/resource-search-fix-checks-final.txt)
- [资源搜索修复类型检查](/tmp/resource-search-fix-lint-final.txt)
- [资源搜索修复构建](/tmp/resource-search-fix-build-final.txt)
- [恢复关联配置类型检查](/tmp/blank-chat-association-lint.txt)
- [恢复关联配置构建](/tmp/blank-chat-association-build.txt)

检查入口位于 [package.json](/Users/mac/Downloads/原型APP/墨影科技---开放生态/package.json)。与此轮直接相关的用例在 [check-builtin-systems.tsx](/Users/mac/Downloads/原型APP/墨影科技---开放生态/scripts/check-builtin-systems.tsx)、[check-agent-workbench.ts](/Users/mac/Downloads/原型APP/墨影科技---开放生态/scripts/check-agent-workbench.ts)、[check-tiangong-resources.ts](/Users/mac/Downloads/原型APP/墨影科技---开放生态/scripts/check-tiangong-resources.ts)。覆盖继承、单目标、范围限制、未发送不提交、名称搜索、验证过期及正式关联展示等。

当前可参考截图：

- [最后恢复的空白聊天关联配置](/tmp/moying-blank-chat-association-restored.png)
- [名称搜索且无重复地址辅助行](/tmp/moying-rdk-search-names-only.png)
- [输入框内待发送设备文本](/tmp/moying-pending-device-mention.png)

`/tmp` 文件可能随环境清理而丢失；不要当成永久资料。旧截图中存在已经被否定的布局，尤其“草稿显示到顶部”“删掉工具栏”“输入框上方继承资源条”，不要用于恢复样式。

## 8. 当前问题与待核实点

1. **没有收到最后恢复入口之后的新产品问题。** 当前开发请求已完成，接下来等待用户反馈；不要自动重启早期被叫停的需求。
2. 真实内网认证、浏览器执行、SSH 等服务尚未接入，当前有演示能力；这不是最后按钮修复引入的故障。
3. 模型设置与附件交互有其他修改同时进入；没有对这些新改动做本轮全量验收。后续任务要基于当前源码，尤其核实模型测试与实际调用的差异。
4. `builtinSystemStatus` 对天工目前直接返回“未配置”；它和某个园区是否已演示绑定不是一件事。若用户问状态错误，应区分平台服务接入状态、资源验证状态和任务关联状态，不能简单改成永远“可用”。
5. 某些遗留 SSH 编辑文案仍有“演示连接/密码不保存”等说明，某些旧远程桌面提示仍说“顶部关联设备”。这与用户希望简化文案的方向有差异，但这轮没有扩展修复；若继续相关页面，应针对当前要求核实。
6. 有少量旧页面代码、无用资源区域 CSS 和旧 draft-resource request 属性仍保留。不要未经授权清理，避免牵连正在修改的其他功能。
7. 演示登录会话刷新丢失、重新验证的流程需要在真实服务接入时替换；不能通过允许未认证绑定绕过。

## 9. 下一会话建议的工作顺序

1. 先读本文件，并确认用户的新请求；没有新请求就不要继续开发。
2. 重新读取涉及文件，确认当前源码是否又有改动。不要用这份文档或旧截图覆盖整个文件。
3. 涉及资源时先判定：普通/自建/设备/系统文件夹？父级是否锁定继承？正在改草稿还是正式关联？执行资源还是历史终端？
4. 只改需要的入口、状态路径和样式，保留项目、文件、插件、附件及其他功能。
5. 需要验证时，用领域检查保证继承与提交边界，再用浏览器看实际入口、弹窗、布局。检查新旧聊天两条路径，不能只修其中一条。
6. 如需真实服务，先取得实际接口和运行环境；现阶段不虚构接口已接入，不自动使用真实凭据或真实业务写入。
7. 完成后简要说清改动和验证范围，必要时附当前截图，不要承诺已经解决未验证的所有问题。

高价值检查场景（仅在相关改动时选用，无需每次全量重复）：普通无绑定可直接聊天；自建组无绑定的新聊天无默认标签；父绑定子只读；系统类型不能串；未发送资源仍在输入框；发送后正式连接出现在右上角；`/rdk` 名称搜索可选；过期园区直接验证；打开文件不跳历史任务；工具不自动展开；旧终端保持原环境。

## 10. 踩过的坑

### 产品与代码

- 最严重的反复失误是把用户的局部删减理解成删整个工具栏。用户始终需要选择项目、文件和插件；这次又明确补回选择项目旁的关联配置。
- 另一反复失误是资源一选就立即关联任务、标签消失。**选择 → 继续输入 → 发送 → 提交关联** 才是闭环。
- 不能把 pending draft 作为右上角连接来源，也不能把已继承的正式资源重复塞进输入框上方。
- 自建组可用设备列表与父项目显式绑定混淆，会造成所有新聊天意外继承资源。
- 同一资源弹窗被新聊天、已有聊天、项目管理、系统设置复用，作用域不正确会改错对象；读写 `draftSelection` 和直接 task/scope 修改必须区分。
- 只在组件隐藏选项不够，底层关联函数也要检查继承和系统类型，否则 `/`、旧数据或另一个入口会绕过限制。
- `/` 查询曾因仅匹配简单字符、旧文件子菜单状态未重置、菜单滚动未重置而出现“搜不到”或空白条。当前已做范围匹配、NFKC、大小写归一化和滚动重置，别改回。
- 空白聊天开文件曾沿用 workspace 的历史 activeTaskId，导致显示旧任务；现在专门清空活动任务并使用 draftOpen。
- 终端共享列表不等于可以改写会话环境。变更任务/资源时保留原会话身份，只为当前目标选择或建立合适会话。
- `crypto.randomUUID` 在非安全/受限页面可能缺失，已经触发过“无法创建项目”异常。保留降级逻辑。
- 弹窗曾出现左上角、页面放大和样式跳变。以后修改 modal 时检查挂载、定位和作用域 CSS，别靠浏览器缩放掩盖。
- 用户控制的历史记录不能删除或通过重置掩盖。不要生成虚假历史充当产品内容；允许的固定系统文件夹与实际任务历史是两回事。

### 浏览器操作与会话环境

- 用户当前浏览器 URL 曾是 `http://localhost:3000/#developer-platform`；最后自动化使用浏览器 id `3`、tab `1`。新会话必须重新获取，不保证这些 ID 或状态永久有效。
- CUA 跨用户回合曾反复报 `browser.user is unavailable`，即便旧变量还在也不能继续用。成功恢复方式：先 `mcp__cua_repl.js_reset`，再在第一次调用中仅执行一个入口 API，例如 `var tab = await cua.getTab('1', { browser: '3' });`，读完返回文档再操作。若 ID 不存在则重新取清单。
- 不要为截图强行改 viewport 或缩放。之前默认视口较窄，合上侧栏后能看到主区；截图应反映真实布局。
- 最后浏览器停在普通空白新聊天，侧栏/平台导航已收起，无输入、无资源，关联配置弹窗已关闭。它是上次工具的末态，不是新会话实时事实。
- 自动化浏览器的 localStorage 记录与用户截图可能不同；不能声称用户的 111/222 等真实截图记录都在当前测试环境复现过。
- 此前一个已有“你好”聊天中出现待发送 RDK X5，来源可能是用户/同时操作，**不要清掉它**。我们只清理了临时输入的搜索词，没有发送或删除聊天。
- 读取 DOM 和走实际 UI 即可，不要注入 React 内部状态/localStorage 来伪造验收，也不要关闭用户的浏览器标签。
- 当前源码曾被其他操作同时修改，包括附件菜单、模型设置、AI Studio 名称。任何编辑前重新读文件，避免整段替换覆盖他人修改。

## 11. 与用户沟通

使用中文，简洁、直接。用户已经给了大量截图和规则，除非确实缺少必要信息，不要再让用户重复说明或确认。承认具体误改并修正即可，不要反复道歉或泛泛说“已全面自查”。

不要夸大已连接真实设备/内网，不要把模拟反馈当成真实验收；也不要在 UI 里添加用户明确要求去掉的原型声明。每次改动只陈述本次实际完成的内容与验证范围。
