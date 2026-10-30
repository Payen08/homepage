import { useState, type ReactNode } from "react";

type IconName =
  | "archive"
  | "arrow"
  | "briefcase"
  | "check"
  | "chevron"
  | "code"
  | "collaboration"
  | "cube"
  | "device"
  | "document"
  | "download"
  | "edit"
  | "eye"
  | "folder"
  | "globe"
  | "grid"
  | "history"
  | "key"
  | "lead"
  | "microphone"
  | "more"
  | "order"
  | "panel"
  | "plus"
  | "refresh"
  | "search"
  | "send"
  | "settings"
  | "spinner"
  | "store"
  | "support"
  | "terminal"
  | "team";

const icons: Record<IconName, ReactNode> = {
  archive: (
    <>
      <path d="M4 7h16v13H4zM3 3h18v4H3z" />
      <path d="M9 12h6" />
    </>
  ),
  arrow: <path d="m9 18 6-6-6-6" />,
  briefcase: (
    <>
      <rect x="3" y="7" width="18" height="13" rx="2" />
      <path d="M8 7V5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2M3 12h18M10 12v2h4v-2" />
    </>
  ),
  check: <path d="m5 12 4 4L19 6" />,
  chevron: <path d="m9 18 6-6-6-6" />,
  code: (
    <>
      <path d="m8 9-3 3 3 3m8-6 3 3-3 3M14 5l-4 14" />
    </>
  ),
  collaboration: (
    <>
      <circle cx="8" cy="8" r="3" />
      <circle cx="17" cy="10" r="2.5" />
      <path d="M2.5 20a5.5 5.5 0 0 1 11 0M14 15.5a4.5 4.5 0 0 1 7.5 3.4" />
    </>
  ),
  cube: (
    <>
      <path d="m12 3 8 4.5v9L12 21l-8-4.5v-9L12 3Z" />
      <path d="m4.5 7.5 7.5 4.4 7.5-4.4M12 21v-9.1" />
    </>
  ),
  device: (
    <>
      <rect x="5" y="2.5" width="14" height="19" rx="2.5" />
      <path d="M10 18h4" />
    </>
  ),
  document: (
    <>
      <path d="M6 3h8l4 4v14H6V3Z" />
      <path d="M14 3v5h4M9 12h6M9 16h6" />
    </>
  ),
  download: <path d="M12 3v12m0 0 4-4m-4 4-4-4M5 21h14" />,
  edit: (
    <>
      <path d="M12 20h9" />
      <path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L8 18l-4 1 1-4Z" />
    </>
  ),
  eye: (
    <>
      <path d="M2.5 12s3.5-6 9.5-6 9.5 6 9.5 6-3.5 6-9.5 6-9.5-6-9.5-6Z" />
      <circle cx="12" cy="12" r="2.5" />
    </>
  ),
  folder: (
    <>
      <path d="M3 6.5h6l2 2h10v9.5a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2Z" />
      <path d="M3 9V6a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v1" />
    </>
  ),
  globe: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M3 12h18M12 3a14 14 0 0 1 0 18M12 3a14 14 0 0 0 0 18" />
    </>
  ),
  grid: (
    <>
      <rect x="3" y="3" width="7" height="7" rx="1" />
      <rect x="14" y="3" width="7" height="7" rx="1" />
      <rect x="3" y="14" width="7" height="7" rx="1" />
      <rect x="14" y="14" width="7" height="7" rx="1" />
    </>
  ),
  history: (
    <>
      <path d="M3 12a9 9 0 1 0 3-6.7L3 8" />
      <path d="M3 3v5h5M12 7v5l3 2" />
    </>
  ),
  key: (
    <>
      <circle cx="8" cy="15" r="4" />
      <path d="m11 12 8-8m-3 3 2 2m-5 1 2 2" />
    </>
  ),
  lead: (
    <>
      <circle cx="10" cy="8" r="4" />
      <path d="M3 21a7 7 0 0 1 14 0M18 8h3m-1.5-1.5v3" />
    </>
  ),
  microphone: (
    <>
      <rect x="9" y="3" width="6" height="11" rx="3" />
      <path d="M5.5 11.5a6.5 6.5 0 0 0 13 0M12 18v3M9 21h6" />
    </>
  ),
  more: (
    <>
      <circle cx="5" cy="12" r="1" fill="currentColor" stroke="none" />
      <circle cx="12" cy="12" r="1" fill="currentColor" stroke="none" />
      <circle cx="19" cy="12" r="1" fill="currentColor" stroke="none" />
    </>
  ),
  order: (
    <>
      <path d="M7 3h10v3H7zM5 5v16h14V5" />
      <path d="M8 11h8M8 15h5" />
    </>
  ),
  panel: (
    <>
      <rect x="3" y="4" width="18" height="16" rx="2" />
      <path d="M15 4v16" />
    </>
  ),
  plus: <path d="M12 5v14M5 12h14" />,
  refresh: (
    <>
      <path d="M20 7v5h-5" />
      <path d="M4 17v-5h5" />
      <path d="M6.1 9a7 7 0 0 1 11.4-2.5L20 9M4 15l2.5 2.5A7 7 0 0 0 17.9 15" />
    </>
  ),
  search: (
    <>
      <circle cx="11" cy="11" r="7" />
      <path d="m20 20-4-4" />
    </>
  ),
  send: (
    <>
      <path d="m22 2-7 20-4-9-9-4Z" />
      <path d="M22 2 11 13" />
    </>
  ),
  settings: (
    <>
      <circle cx="12" cy="12" r="3" />
      <path d="M19 15.5 21 17l-4 4-1.5-2A8 8 0 0 1 13 20v2H7v-2a8 8 0 0 1-2.5-1L3 21l-4-4 2-1.5A8 8 0 0 1 0 13h-2V7h2a8 8 0 0 1 1-2.5L-1 3l4-4 1.5 2A8 8 0 0 1 7 0v-2h6v2a8 8 0 0 1 2.5 1L17-1l4 4-2 1.5A8 8 0 0 1 20 7h2v6h-2a8 8 0 0 1-1 2.5Z" />
    </>
  ),
  spinner: (
    <>
      <path d="M12 3a9 9 0 0 1 9 9" />
      <path d="M21 12a9 9 0 0 1-9 9M12 21a9 9 0 0 1-9-9" opacity=".3" />
      <path d="M3 12a9 9 0 0 1 3-6.7" opacity=".55" />
    </>
  ),
  store: (
    <>
      <path d="M4 10v10h16V10M3 4h18l-2 6a3 3 0 0 1-5 1 3 3 0 0 1-4 0 3 3 0 0 1-5-1L3 4Z" />
      <path d="M9 20v-5h6v5" />
    </>
  ),
  support: (
    <>
      <path d="M4 13a8 8 0 0 1 16 0" />
      <path d="M4 12h2v6H4a2 2 0 0 1-2-2v-2a2 2 0 0 1 2-2Zm16 0h-2v6h2a2 2 0 0 0 2-2v-2a2 2 0 0 0-2-2ZM18 19c-1 2-3 2-5 2" />
    </>
  ),
  terminal: (
    <>
      <rect x="3" y="4" width="18" height="16" rx="2" />
      <path d="m7 9 3 3-3 3M12 15h5" />
    </>
  ),
  team: (
    <>
      <circle cx="9" cy="8" r="3.5" />
      <circle cx="17.5" cy="9.5" r="2.5" />
      <path d="M2.5 20a6.5 6.5 0 0 1 13 0M15 15a5 5 0 0 1 6.5 4.8" />
    </>
  ),
};

function Icon({ name, size = 18 }: { name: IconName; size?: number }) {
  return (
    <svg
      aria-hidden="true"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {icons[name]}
    </svg>
  );
}

const menu = [
  ["销售线索", "lead"],
  ["工作台", "grid"],
  ["基本信息", "briefcase"],
  ["项目协作", "collaboration"],
  ["组织与成员", "team"],
  ["插件开发", "cube"],
  ["插件开发2", "code"],
  ["插件上架", "store"],
  ["设备上架", "device"],
  ["授权管理", "key"],
  ["订单管理", "order"],
  ["支持工单", "support"],
] as const;

const deviceProducts = [
  {
    name: "墨影 AI 会议终端",
    id: "MY-AI-1001",
    type: "智能终端",
    manufacturer: "墨影科技",
    price: "¥2,699",
    stock: 128,
    status: "已上架",
    color: "from-[#241F7D] to-[#7771B2]",
    symbol: "M1",
  },
  {
    name: "桌面语音交互屏",
    id: "MY-DISPLAY-02",
    type: "交互屏",
    manufacturer: "云声智能",
    price: "¥1,299",
    stock: 64,
    status: "待审批",
    color: "from-[#1b9cf1] to-[#55bdf4]",
    symbol: "D2",
  },
  {
    name: "边缘计算网关 Pro",
    id: "EDGE-GW-PRO",
    type: "边缘网关",
    manufacturer: "墨影科技",
    price: "¥3,899",
    stock: 32,
    status: "草稿",
    color: "from-[#16a980] to-[#50c7a2]",
    symbol: "GW",
  },
  {
    name: "全景会议摄像机",
    id: "CAM-360-S",
    type: "视频设备",
    manufacturer: "视界创新",
    price: "¥1,899",
    stock: 0,
    status: "已下架",
    color: "from-[#f59b42] to-[#f7bb62]",
    symbol: "C3",
  },
  {
    name: "智能环境传感器",
    id: "SENSOR-AIR-5",
    type: "传感器",
    manufacturer: "微感物联",
    price: "¥399",
    stock: 256,
    status: "审核驳回",
    color: "from-[#e45b66] to-[#f18a91]",
    symbol: "S5",
  },
];

const productStatuses = ["全部", "已上架", "已下架", "审核驳回", "待审批", "草稿"];

const stats = [
  { label: "已上架插件", value: "12", note: "较上月 +2", color: "text-[#241F7D]", bg: "bg-[#EDEFFF]", icon: "store" as IconName },
  { label: "审核中", value: "3", note: "预计 1–3 个工作日", color: "text-[#e49224]", bg: "bg-[#fff6e8]", icon: "document" as IconName },
  { label: "累计安装", value: "18,642", note: "本月 +1,286", color: "text-[#168f70]", bg: "bg-[#eaf9f4]", icon: "download" as IconName },
];

function App() {
  const [activeMenu, setActiveMenu] = useState("插件开发");
  const [statusFilter, setStatusFilter] = useState("全部");
  const [keyword, setKeyword] = useState("");
  const [showCreate, setShowCreate] = useState(false);
  const [products, setProducts] = useState(deviceProducts);
  const [actionNotice, setActionNotice] = useState("");

  const filteredProducts = products.filter(
    (product) =>
      (statusFilter === "全部" || product.status === statusFilter) &&
      (product.name.toLowerCase().includes(keyword.toLowerCase()) ||
        product.id.toLowerCase().includes(keyword.toLowerCase()) ||
        product.manufacturer.toLowerCase().includes(keyword.toLowerCase())),
  );

  const updateProductStatus = (id: string, status: string, message: string) => {
    setProducts((current) =>
      current.map((product) => (product.id === id ? { ...product, status } : product)),
    );
    setActionNotice(message);
  };

  return (
    <main className="flex h-screen min-h-[700px] overflow-hidden bg-[#f6f7fb] text-[#202431]">
      <aside className="flex w-[224px] shrink-0 flex-col border-r border-[#e9eaf0] bg-white">
        <div className="flex h-[68px] items-center gap-3 border-b border-[#f0f1f4] px-5">
          <div className="flex h-9 w-9 items-center justify-center rounded-[11px] bg-[#241F7D] text-white shadow-[0_5px_14px_rgba(99,91,255,.23)]">
            <Icon name="cube" size={20} />
          </div>
          <div>
            <div className="text-[16px] font-bold tracking-[0.08em] text-[#222533]">MOYING</div>
            <div className="mt-0.5 text-[12px] tracking-[0.12em] text-[#9a9eaa]">开放平台</div>
          </div>
        </div>

        <nav className="flex-1 overflow-y-auto px-3 py-5">
          <div className="mb-2 px-3 text-[12px] font-medium uppercase tracking-[0.12em] text-[#b2b5bf]">平台管理</div>
          <div className="space-y-1">
            {menu.map(([label, icon]) => (
              <button
                key={label}
                onClick={() => setActiveMenu(label)}
                className={`group flex h-10 w-full items-center justify-between rounded-xl px-3 text-[14px] transition ${
                  activeMenu === label
                    ? "bg-[#EDEFFF] font-medium text-[#241F7D]"
                    : "text-[#646977] hover:bg-[#f7f7fa] hover:text-[#282c38]"
                }`}
              >
                <span className="flex items-center gap-3">
                  <span className={activeMenu === label ? "text-[#241F7D]" : "text-[#9ca1ae] group-hover:text-[#6f7480]"}>
                    <Icon name={icon} size={17} />
                  </span>
                  {label}
                </span>
                {activeMenu === label && <span className="h-1.5 w-1.5 rounded-full bg-[#241F7D]" />}
              </button>
            ))}
          </div>
        </nav>

        <div className="border-t border-[#f0f1f4] p-3">
          <button className="flex w-full items-center gap-3 rounded-xl p-2 text-left hover:bg-[#f7f7fa]">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#EDEFFF] text-[12px] font-semibold text-[#241F7D]">MY</div>
            <div className="min-w-0 flex-1">
              <div className="truncate text-[12px] font-medium text-[#393d49]">墨影科技</div>
              <div className="mt-0.5 truncate text-[12px] text-[#9ca1ae]">企业管理员</div>
            </div>
            <Icon name="more" size={16} />
          </button>
        </div>
      </aside>

      <section className="flex min-w-0 flex-1 flex-col">
        <header className="flex h-[68px] shrink-0 items-center justify-between border-b border-[#e9eaf0] bg-white px-7">
          <div className="flex items-center gap-2 text-[12px]">
            <span className="text-[#a0a4af]">开放平台</span>
            <Icon name="chevron" size={12} />
            <span className="font-medium text-[#383c48]">{activeMenu}</span>
          </div>
          <div className="flex items-center gap-4">
            <button className="relative flex h-9 w-9 items-center justify-center rounded-full border border-[#e8e9ee] text-[#7d8290] hover:bg-[#f7f7fa]">
              <Icon name="support" size={17} />
              <span className="absolute right-0 top-0 h-2 w-2 rounded-full border-2 border-white bg-[#f15c67]" />
            </button>
            <div className="h-5 w-px bg-[#ececf0]" />
            <div className="flex items-center gap-2.5">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-[#4E48A5] to-[#1B175F] text-[12px] font-semibold text-white">ML</div>
              <div className="hidden xl:block">
                <div className="text-[12px] font-medium text-[#383c48]">Molin</div>
                <div className="text-[12px] text-[#a1a5b0]">管理员</div>
              </div>
            </div>
          </div>
        </header>

        {activeMenu === "插件开发" ? (
          <DeveloperWorkbench />
        ) : activeMenu === "插件开发2" ? (
          <CodexWorkbench />
        ) : (
        <div className="flex-1 overflow-auto">
          <div className="w-full px-6 py-6">
            <div className="mb-5 flex items-center justify-between gap-6">
              <div>
                <h1 className="text-[20px] font-semibold tracking-[-0.02em] text-[#20232e]">插件上架</h1>
                <p className="mt-1.5 text-[12px] text-[#8a8f9c]">管理插件版本、提交审核并跟踪应用市场中的上架状态</p>
              </div>
              <div className="flex shrink-0 items-center gap-2">
                <label className="flex h-9 w-[240px] items-center gap-2 rounded-xl border border-[#e4e5ea] bg-white px-3 shadow-[0_1px_2px_rgba(31,35,48,.02)] focus-within:border-[#7771B2]">
                  <span className="text-[#999eaa]"><Icon name="search" size={14} /></span>
                  <input
                    value={keyword}
                    onChange={(event) => setKeyword(event.target.value)}
                    placeholder="搜索商品、编号或制造商"
                    className="min-w-0 flex-1 bg-transparent text-[12px] text-[#3f434e] outline-none placeholder:text-[#a8acb6]"
                  />
                </label>
                <label className="relative flex h-9 w-[132px] items-center rounded-xl border border-[#e4e5ea] bg-white shadow-[0_1px_2px_rgba(31,35,48,.02)]">
                  <select
                    value={statusFilter}
                    onChange={(event) => setStatusFilter(event.target.value)}
                    className="h-full w-full appearance-none bg-transparent pl-3 pr-8 text-[12px] text-[#555a67] outline-none"
                    aria-label="按状态筛选"
                  >
                    {productStatuses.map((status) => <option key={status}>{status}</option>)}
                  </select>
                  <span className="pointer-events-none absolute right-3 rotate-90 text-[#9296a1]"><Icon name="chevron" size={12} /></span>
                </label>
                <button
                  onClick={() => setShowCreate(true)}
                  className="flex h-9 items-center gap-2 rounded-xl bg-[#241F7D] px-4 text-[12px] font-medium text-white shadow-[0_5px_13px_rgba(99,91,255,.2)] transition hover:bg-[#1B175F]"
                >
                  <Icon name="plus" size={15} />
                  提交新商品
                </button>
              </div>
            </div>

            <div className="mb-6 grid grid-cols-3 gap-4">
              {stats.map((stat) => (
                <div key={stat.label} className="flex items-center rounded-xl border border-[#ececf1] bg-white p-5 shadow-[0_2px_7px_rgba(31,35,48,.025)]">
                  <div className={`mr-4 flex h-11 w-11 items-center justify-center rounded-xl ${stat.bg} ${stat.color}`}>
                    <Icon name={stat.icon} size={20} />
                  </div>
                  <div className="min-w-0">
                    <p className="text-[12px] text-[#9296a2]">{stat.label}</p>
                    <div className="mt-1 flex items-baseline gap-2.5">
                      <strong className="text-[20px] font-semibold tracking-[-0.02em] text-[#292c37]">{stat.value}</strong>
                      <span className={`text-[12px] ${stat.color}`}>{stat.note}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {actionNotice && (
              <div className="mb-3 flex h-9 items-center justify-between rounded-xl border border-[#dfe2ff] bg-[#f5f6ff] px-4 text-[12px] text-[#241F7D]">
                <span>{actionNotice}</span>
                <button onClick={() => setActionNotice("")} className="text-[16px] text-[#7771B2]">×</button>
              </div>
            )}

            <div className="overflow-x-auto rounded-xl border border-[#e9eaf0] bg-white shadow-[0_2px_8px_rgba(31,35,48,.025)]">
              <div className="min-w-[980px]">
                <div className="grid h-11 grid-cols-[minmax(230px,1.7fr)_minmax(110px,.75fr)_minmax(130px,.9fr)_100px_90px_110px_minmax(230px,1.35fr)] items-center border-b border-[#f0f0f3] bg-[#fafafd] px-5 text-[12px] font-medium text-[#9599a5]">
                  <span>设备商品</span>
                  <span>设备类型</span>
                  <span>制造商</span>
                  <span>价格</span>
                  <span>库存</span>
                  <span>状态</span>
                  <span className="text-right">操作</span>
                </div>

                <div className="min-h-[330px]">
                {filteredProducts.length ? (
                  filteredProducts.map((product) => (
                    <div
                      key={product.id}
                      className="grid min-h-[74px] grid-cols-[minmax(230px,1.7fr)_minmax(110px,.75fr)_minmax(130px,.9fr)_100px_90px_110px_minmax(230px,1.35fr)] items-center border-b border-[#f1f1f4] px-5 text-[12px] transition last:border-b-0 hover:bg-[#fbfbfd]"
                    >
                      <div className="flex min-w-0 items-center gap-3">
                        <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br ${product.color} text-[12px] font-semibold text-white shadow-sm`}>
                          {product.symbol}
                        </div>
                        <div className="min-w-0">
                          <div className="truncate font-medium text-[#343742]">{product.name}</div>
                          <div className="mt-1 truncate font-mono text-[12px] text-[#a1a5af]">{product.id}</div>
                        </div>
                      </div>
                      <span className="text-[#707582]">{product.type}</span>
                      <span className="text-[#707582]">{product.manufacturer}</span>
                      <span className="font-medium text-[#3d414d]">{product.price}</span>
                      <span className={product.stock === 0 ? "text-[#d84f5c]" : "text-[#656a76]"}>{product.stock}</span>
                      <StatusBadge status={product.status} />
                      <div className="flex items-center justify-end gap-1">
                        <ActionButton icon="eye" label="查看" onClick={() => setActionNotice(`正在查看「${product.name}」`)} />
                        <ActionButton icon="edit" label="编辑" onClick={() => setActionNotice(`已打开「${product.name}」的编辑页`)} />
                        {product.status === "已上架" && (
                          <ActionButton icon="archive" label="下架" onClick={() => updateProductStatus(product.id, "已下架", `「${product.name}」已下架`)} />
                        )}
                        {["草稿", "审核驳回", "已下架"].includes(product.status) && (
                          <ActionButton icon="send" label="提交审核" onClick={() => updateProductStatus(product.id, "待审批", `「${product.name}」已提交审核`)} />
                        )}
                        {product.status === "待审批" && (
                          <ActionButton icon="refresh" label="刷新状态" onClick={() => setActionNotice(`「${product.name}」仍在审批中`)} />
                        )}
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="flex h-[300px] flex-col items-center justify-center text-[#a0a4ae]">
                    <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-[#f4f4f8]"><Icon name="search" size={20} /></div>
                    <p className="text-[12px]">未找到符合条件的设备商品</p>
                  </div>
                )}
                </div>

                <div className="flex h-12 items-center justify-between border-t border-[#eeeef2] px-5 text-[12px] text-[#9296a1]">
                  <span>共 {filteredProducts.length} 个商品</span>
                  <div className="flex items-center gap-1">
                    <button className="flex h-7 w-7 items-center justify-center rounded-lg border border-[#e5e6eb] text-[#b1b4bd]">
                      <Icon name="arrow" size={12} />
                    </button>
                    <button className="h-7 min-w-7 rounded-lg bg-[#241F7D] px-2 text-white">1</button>
                    <button className="flex h-7 w-7 items-center justify-center rounded-lg border border-[#e5e6eb] text-[#686d79]">
                      <Icon name="chevron" size={12} />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        )}
      </section>

      {showCreate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#202330]/30 backdrop-blur-[2px]" onMouseDown={() => setShowCreate(false)}>
          <div className="w-[420px] rounded-2xl border border-white/80 bg-white p-6 shadow-[0_20px_70px_rgba(25,28,38,.18)]" onMouseDown={(event) => event.stopPropagation()}>
            <div className="mb-5 flex items-center justify-between">
              <div>
                <h2 className="text-[16px] font-semibold text-[#272a35]">提交新商品</h2>
                <p className="mt-1 text-[12px] text-[#9296a1]">选择设备商品并提交至应用市场审核</p>
              </div>
              <button onClick={() => setShowCreate(false)} className="text-[18px] text-[#999da7]">×</button>
            </div>
            <label className="mb-2 block text-[12px] font-medium text-[#4b4f5b]">设备商品</label>
            <button className="mb-5 flex h-10 w-full items-center justify-between rounded-xl border border-[#e1e2e7] px-3 text-[12px] text-[#7e838f]">
              请选择需要上架的设备商品 <Icon name="chevron" size={13} />
            </button>
            <div className="flex justify-end gap-2">
              <button onClick={() => setShowCreate(false)} className="h-9 rounded-xl border border-[#e2e3e8] px-4 text-[12px] text-[#656a76]">取消</button>
              <button className="h-9 rounded-xl bg-[#241F7D] px-4 text-[12px] font-medium text-white">下一步</button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    已上架: "bg-[#eaf8f2] text-[#168863]",
    待审批: "bg-[#fff4e5] text-[#d38319]",
    审核驳回: "bg-[#fff0f1] text-[#d84f5c]",
    草稿: "bg-[#EDEFFF] text-[#241F7D]",
    已下架: "bg-[#f1f2f5] text-[#7d828d]",
  };
  return (
    <span className={`inline-flex h-6 w-fit items-center justify-center rounded-full px-2.5 text-[12px] font-medium ${styles[status]}`}>
      {status}
    </span>
  );
}

function ActionButton({
  icon,
  label,
  onClick,
}: {
  icon?: IconName;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="flex h-7 shrink-0 items-center gap-1.5 rounded-lg px-2 text-[12px] font-medium text-[#6f7480] hover:bg-[#f0f0f4] hover:text-[#241F7D]"
    >
      {icon && <Icon name={icon} size={12} />}
      {label}
    </button>
  );
}

function AiWorkSummary({
  onContinue,
  onReview,
}: {
  onContinue: () => void;
  onReview: () => void;
}) {
  const steps = [
    ["分析现有页面结构及组件规范", true],
    ["新增 API Key 配置与验证", true],
    ["实现模型选择及连接状态反馈", true],
    ["优化页面布局与响应式样式", false],
  ] as const;
  const changedFiles = [
    ["src/App.tsx", "+86", "−24"],
    ["src/components/Setting.tsx", "+128", ""],
    ["src/index.css", "+42", "−18"],
  ];

  return (
    <div className="space-y-4 text-[12px] text-[#5f6470]">
      <div>
        <div className="mb-2 font-medium text-[#27272a]">1. AI 分析反馈</div>
        <div className="rounded-xl border border-[#e6e7ed] bg-white p-3">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2 font-medium text-[#35363b]">
              <span className="flex h-4 w-4 items-center justify-center rounded-full border border-[#35b77e] text-[#20a96c]">
                <Icon name="check" size={10} />
              </span>
              项目结构分析完成
            </div>
            <span className="shrink-0 text-[#20a96c]">已完成</span>
          </div>
          <p className="mt-2 leading-5">
            已读取项目配置及现有组件，当前项目基于 React + TypeScript 开发，设置页面主要由
            <code className="mx-1 rounded bg-[#f4f4f5] px-1.5 py-0.5 font-mono text-[#52525b]">App.tsx</code>
            管理，样式定义集中在
            <code className="ml-1 rounded bg-[#f4f4f5] px-1.5 py-0.5 font-mono text-[#52525b]">index.css</code>。
          </p>
          <p className="mt-1 leading-5 text-[#9a9faa]">建议将 API 配置、模型选择及连接测试拆分为独立功能模块，以便后续维护。</p>
        </div>
      </div>

      <div>
        <div className="mb-2 font-medium text-[#27272a]">2. 开发任务规划</div>
        <div className="rounded-xl border border-[#e6e7ed] bg-white p-3">
          <div className="flex items-center justify-between gap-3">
            <span className="font-medium text-[#35363b]">设置页面优化计划</span>
            <span className="text-[#8e939e]">3/4 已完成</span>
          </div>
          <div className="my-2.5 h-1 overflow-hidden rounded-full bg-[#f0f1f4]">
            <div className="h-full w-3/4 rounded-full bg-[#5b6ff2]" />
          </div>
          <div className="space-y-2">
            {steps.map(([label, completed]) => (
              <div key={label} className={`flex items-center gap-2 ${completed ? "text-[#5f6470]" : "text-[#a5a9b2]"}`}>
                <span className={`flex h-4 w-4 items-center justify-center rounded-full border ${completed ? "border-[#35b77e] text-[#20a96c]" : "border-dashed border-[#bfc2ca]"}`}>
                  {completed ? <Icon name="check" size={9} /> : <span className="h-1 w-1 rounded-full bg-[#bfc2ca]" />}
                </span>
                {label}
              </div>
            ))}
          </div>
        </div>
      </div>

      <div>
        <div className="mb-2 font-medium text-[#27272a]">3. 文件修改记录</div>
        <div className="overflow-hidden rounded-xl border border-[#e6e7ed] bg-white">
          <div className="flex items-center justify-between border-b border-[#eeeef2] px-3 py-2.5">
            <span className="font-medium text-[#35363b]">修改项目文件</span>
            <span className="text-[#20a96c]">已完成</span>
          </div>
          <div className="space-y-2.5 px-3 py-3 font-mono">
            {changedFiles.map(([path, added, removed]) => (
              <div key={path} className="flex items-center gap-2">
                <span className="text-[#8d929e]"><Icon name="code" size={12} /></span>
                <span className="min-w-0 flex-1 truncate text-[#52525b]">{path}</span>
                <span className="text-[#20a96c]">{added}</span>
                {removed && <span className="text-[#e45b66]">{removed}</span>}
              </div>
            ))}
          </div>
        </div>
      </div>

      <div>
        <div className="mb-2 font-medium text-[#27272a]">4. 执行中状态</div>
        <div className="rounded-xl border border-[#e6e7ed] bg-white p-3">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2 font-medium text-[#35363b]">
              <span className="animate-spin text-[#4d78e8]"><Icon name="spinner" size={14} /></span>
              正在检查 TypeScript 类型及构建结果
            </div>
            <span className="shrink-0 text-[#4d78e8]">执行中</span>
          </div>
          <div className="mt-3 text-[#9a9faa]">执行命令</div>
          <code className="mt-1 block font-mono text-[#52525b]">pnpm run build</code>
          <p className="mt-3 leading-5 text-[#9a9faa]">正在执行项目构建，检查组件引用、类型定义及依赖配置。</p>
        </div>
      </div>

      <div>
        <div className="mb-2 font-medium text-[#27272a]">5. AI 完成反馈</div>
        <div className="flex gap-2.5">
          <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-[#241F7D] text-[12px] font-medium text-white">AI</div>
          <div className="min-w-0 flex-1">
            <p className="leading-5 text-[#52525b]">
              已完成插件设置页面的功能优化，新增 API Key 配置、模型选择和连接测试功能，并按照当前项目的视觉规范调整了表单布局、交互状态及提示信息。
            </p>
            <p className="mt-1 leading-5 text-[#52525b]">本次共修改 3 个文件，相关代码变更已生成，可在代码审查面板查看具体内容。</p>
            <div className="mt-2.5 flex flex-wrap gap-2">
              <button onClick={onContinue} className="h-7 rounded-xl bg-[#241F7D] px-3 font-medium text-white hover:bg-[#1B175F]">继续优化</button>
              <button onClick={onReview} className="h-7 rounded-xl border border-[#dedfe6] bg-white px-3 text-[#686d79] hover:bg-[#f7f7fa]">查看变更设计</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function DeveloperWorkbench() {
  const [leftTab, setLeftTab] = useState<"文件" | "变更">("文件");
  const [rightTab, setRightTab] = useState<"代码变更" | "终端">("代码变更");
  const [message, setMessage] = useState("");
  const [model, setModel] = useState("Claude Sonnet 4");
  const [devMode, setDevMode] = useState<"Build" | "Plan">("Build");
  const [reasoning, setReasoning] = useState<"默认" | "高" | "中" | "低">("默认");
  const [composerMenu, setComposerMenu] = useState<"model" | "mode" | "reasoning" | null>(null);
  const [fileSearch, setFileSearch] = useState("");
  const [activeFile, setActiveFile] = useState("App.tsx");
  const [centerView, setCenterView] = useState<"ai" | "editor">("ai");
  const [sessions, setSessions] = useState(["优化插件设置页面", "修复 API 请求错误", "初始化插件项目"]);
  const [activeSession, setActiveSession] = useState(0);
  const [diffMode, setDiffMode] = useState<"统一" | "拆分">("统一");
  const [expandedDiffFiles, setExpandedDiffFiles] = useState(["Setting.tsx"]);
  const [terminalSessions, setTerminalSessions] = useState(["dev server", "bash"]);
  const [activeTerminal, setActiveTerminal] = useState(0);
  const [terminalCommand, setTerminalCommand] = useState("");
  const [terminalOutput, setTerminalOutput] = useState<string[]>([
    "moying-ai-plugin on main",
    "❯ pnpm dev",
    "sh: pnpm: command not found",
    "请确认 pnpm 已安装并已添加到 PATH 环境变量。",
  ]);
  const files = [
    [".opencode", "folder", 0],
    ["skills", "folder", 1],
    ["plugin-sdk.md", "file", 2],
    ["src", "folder", 0],
    ["components", "folder", 1],
    ["App.tsx", "ts", 1],
    ["index.css", "css", 1],
    ["main.tsx", "ts", 1],
    ["AGENTS.md", "file", 0],
    ["package.json", "json", 0],
    ["plugin.json", "json", 0],
  ];
  const diff = [
    ["", "18", "  const [apiKey, setApiKey] = useState('');"],
    ["", "19", "  const [model, setModel] = useState('gpt-4.1');"],
    ["+", "20", "+ const [testing, setTesting] = useState(false);"],
    ["+", "21", "+ const [connected, setConnected] = useState(false);"],
    ["", "22", ""],
    ["+", "23", "+ async function testConnection() {"],
    ["+", "24", "+   setTesting(true);"],
    ["+", "25", "+   const result = await client.verify(apiKey);"],
    ["+", "26", "+   setConnected(result.ok);"],
    ["+", "27", "+   setTesting(false);"],
    ["+", "28", "+ }"],
    ["", "29", ""],
    ["", "30", "  return ("],
    ["-", "31", "-   <h2>Settings</h2>"],
    ["+", "32", "+   <header className=\"settings-header\">"],
    ["+", "33", "+     <h2>模型服务设置</h2>"],
    ["+", "34", "+     <Status connected={connected} />"],
    ["+", "35", "+   </header>"],
  ];
  const changedFiles = [
    { name: "Setting.tsx", path: "src/components/Setting.tsx", added: 128, removed: 24 },
    { name: "App.tsx", path: "src/App.tsx", added: 36, removed: 8 },
    { name: "index.css", path: "src/index.css", added: 22, removed: 4 },
  ];
  const allDiffExpanded = expandedDiffFiles.length === changedFiles.length;
  const visibleFiles = files.filter(([name]) =>
    String(name).toLowerCase().includes(fileSearch.trim().toLowerCase()),
  );

  const createSession = () => {
    const next = `新会话 ${sessions.length + 1}`;
    setSessions([...sessions, next]);
    setActiveSession(sessions.length);
    setCenterView("ai");
  };

  const createTerminal = () => {
    const next = `bash ${terminalSessions.length}`;
    setTerminalSessions([...terminalSessions, next]);
    setActiveTerminal(terminalSessions.length);
    setTerminalOutput([`已创建终端会话 ${next}`, "❯"]);
  };

  const runTerminalCommand = () => {
    const command = terminalCommand.trim();
    if (!command) return;
    const response = command === "pnpm install"
      ? "Packages: +128  Done in 4.2s"
      : command === "pnpm build"
        ? "✓ built successfully in 1.8s"
        : `sh: ${command.split(" ")[0]}: command not found`;
    setTerminalOutput([...terminalOutput, `❯ ${command}`, response, "❯"]);
    setTerminalCommand("");
  };

  return (
    <div className="developer-workbench flex min-h-0 flex-1 flex-col overflow-hidden bg-[#f6f7fb]">
      <div className="flex h-[52px] shrink-0 items-center justify-between gap-4 border-b border-[#e8e9ef] bg-white px-4">
        <div className="flex min-w-0 flex-1 items-center gap-1.5">
          <button
            onClick={() => setCenterView("ai")}
            className={`flex h-9 shrink-0 items-center gap-2 rounded-xl px-3 text-[12px] ${
              centerView === "ai" ? "bg-[#EDEFFF] font-medium text-[#241F7D]" : "text-[#71717a] hover:bg-[#f4f4f5]"
            }`}
          >
            <span className="flex h-5 w-5 items-center justify-center rounded-md bg-[#241F7D] text-[12px] text-white">AI</span>
            OpenCode AI <i className="h-1.5 w-1.5 rounded-full bg-[#25b57f]" />
          </button>
          <button
            onClick={() => setCenterView("editor")}
            className={`flex h-9 shrink-0 items-center gap-2 rounded-xl px-3 font-mono text-[12px] ${
              centerView === "editor" ? "bg-[#EDEFFF] text-[#241F7D]" : "text-[#71717a] hover:bg-[#f4f4f5]"
            }`}
          >
            <b className="font-semibold text-[#4897dc]">TS</b>{activeFile}
            <span className="h-1.5 w-1.5 rounded-full bg-[#f5a524]" title="未保存" />
          </button>
          <span className="mx-1 h-5 w-px shrink-0 bg-[#e4e4e7]" />
          {centerView === "ai" ? (
            <div className="flex min-w-0 items-center gap-1 overflow-x-auto">
              {sessions.map((session, index) => (
                <button
                  key={`${session}-${index}`}
                  onClick={() => setActiveSession(index)}
                  className={`flex h-8 shrink-0 items-center gap-1.5 rounded-xl px-2.5 text-[12px] ${
                    activeSession === index ? "bg-[#f4f4f5] font-medium text-[#27272a]" : "text-[#8a8a93] hover:bg-[#f4f4f5]"
                  }`}
                >
                  <i className={`h-1.5 w-1.5 rounded-full ${activeSession === index ? "bg-[#17c964]" : "bg-[#d4d4d8]"}`} />
                  {session}
                </button>
              ))}
              <button onClick={createSession} className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl text-[#858a95] hover:bg-[#f4f4f7]" title="新建会话"><Icon name="plus" size={14} /></button>
            </div>
          ) : (
            <span className="truncate text-[12px] text-[#71717a]">src / {activeFile}　<b className="font-normal text-[#f5a524]">● 已修改</b></span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <span className="flex h-8 shrink-0 items-center gap-2 rounded-xl border border-[#e5e6eb] px-3 text-[12px] text-[#747985]">
            <i className="h-1.5 w-1.5 rounded-full bg-[#24b47e]" /> OpenCode v1.2.4
          </span>
          <button className="hidden h-8 shrink-0 rounded-xl border border-[#e3e4e9] px-3 text-[12px] text-[#686d79] hover:bg-[#f7f7fa] xl:block">重新连接</button>
          <button className="hidden h-8 shrink-0 rounded-xl border border-[#e3e4e9] px-3 text-[12px] text-[#686d79] hover:bg-[#f7f7fa] 2xl:block">独立窗口</button>
          <button className="h-8 shrink-0 rounded-xl bg-[#241F7D] px-3 text-[12px] font-medium text-white">ZIP 包管理</button>
        </div>
      </div>

      <div className="flex min-h-0 flex-1 gap-3 p-3">
        <section className="flex w-[205px] shrink-0 flex-col overflow-hidden rounded-xl border border-[#e6e7ed] bg-white">
          <div className="flex h-10 border-b border-[#ececf1] px-2">
            {(["文件", "变更"] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setLeftTab(tab)}
                className={`relative flex flex-1 items-center justify-center gap-1.5 text-[12px] ${leftTab === tab ? "font-medium text-[#241F7D]" : "text-[#8e939e]"}`}
              >
                <Icon name={tab === "文件" ? "document" : "collaboration"} size={13} />
                {tab}
                {tab === "变更" && <span className="rounded-full bg-[#EDEFFF] px-1.5 text-[12px] text-[#241F7D]">3</span>}
                {leftTab === tab && <i className="absolute bottom-0 h-0.5 w-8 rounded bg-[#241F7D]" />}
              </button>
            ))}
          </div>
          <div className="flex h-9 items-center justify-between px-3 text-[12px] font-medium uppercase tracking-[.08em] text-[#a1a5b0]">
            <span>{leftTab === "文件" ? "moying-ai-plugin" : "源代码管理"}</span>
            <button className="text-[16px] text-[#8f94a0]">+</button>
          </div>
          {leftTab === "文件" && (
            <div className="mx-2 mb-2 flex h-8 items-center gap-2 rounded-xl border border-[#e4e4e7] bg-[#fafafa] px-2.5 text-[#a1a1aa] focus-within:border-[#7771B2] focus-within:bg-white">
              <Icon name="search" size={12} />
              <input
                value={fileSearch}
                onChange={(event) => setFileSearch(event.target.value)}
                placeholder="搜索文件"
                className="min-w-0 flex-1 bg-transparent text-[12px] text-[#52525b] outline-none placeholder:text-[#a1a1aa]"
              />
            </div>
          )}
          <div className="flex-1 overflow-auto px-1.5">
            {leftTab === "文件" ? visibleFiles.map(([name, type, indent]) => (
              <button
                key={name}
                onClick={() => {
                  if (type !== "folder") {
                    setActiveFile(String(name));
                    setCenterView("editor");
                  }
                }}
                className={`flex h-7 w-full items-center gap-2 rounded-md pr-2 text-left font-mono text-[12px] ${
                  indent === 2 ? "pl-8" : indent === 1 ? "pl-5" : "pl-2"
                } ${activeFile === name && centerView === "editor" ? "bg-[#EDEFFF] text-[#241F7D]" : "text-[#6f7480] hover:bg-[#f7f7fa]"}`}
              >
                <span className={type === "folder" ? "text-[#e5a93c]" : type === "ts" ? "text-[#4b9be8]" : type === "css" ? "text-[#9d6ed5]" : "text-[#9fa4ae]"}>
                  {type === "folder" ? "▸" : type === "ts" ? "TS" : type === "css" ? "#" : type === "json" ? "{}" : "M"}
                </span>
                <span className="truncate">{name}</span>
              </button>
            )) : (
              <div className="space-y-1">
                {[["M", "src/App.tsx", "text-[#df9a2b]"], ["M", "src/index.css", "text-[#df9a2b]"], ["A", "components/Setting.tsx", "text-[#1b9b72]"]].map(([tag, name, color]) => (
                  <button key={name} className="flex h-8 w-full items-center gap-2 rounded-md px-2 text-left text-[12px] text-[#696e7a] hover:bg-[#f7f7fa]">
                    <span className={`font-mono ${color}`}>{tag}</span><span className="truncate">{name}</span>
                  </button>
                ))}
                <div className="mx-1 mt-3 rounded-xl bg-[#f8f8fb] p-2.5 text-[12px] text-[#8e939e]">
                  3 个文件 <span className="float-right font-mono text-[#1b9b72]">+128 <b className="font-normal text-[#df626c]">−24</b></span>
                </div>
              </div>
            )}
          </div>
          <button className="m-2 flex h-8 items-center gap-2 rounded-xl border-t border-[#eeeef2] px-2 text-[12px] text-[#858a96] hover:bg-[#f7f7fa]">
            <Icon name="settings" size={13} /> 项目设置
          </button>
        </section>

        <section className="flex min-w-[340px] flex-1 flex-col overflow-hidden rounded-xl border border-[#e6e7ed] bg-white">
          {centerView === "ai" ? (
          <>
          <div className="flex-1 overflow-auto px-4 py-5">
            <div className="mb-5 flex w-full justify-end">
              <div className="max-w-[78%] rounded-xl rounded-tr-sm bg-[#EDEFFF] px-3.5 py-3 text-[12px] leading-5 text-[#241F7D]">
                请帮我优化插件的设置页面。需要增加 API Key 配置、模型选择和连接测试功能，并保持和当前项目一致的视觉风格。
              </div>
            </div>
            <div className="mb-4 flex w-full gap-2.5">
              <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-[#241F7D] text-[12px] text-white">AI</div>
              <div className="min-w-0 flex-1">
                <p className="text-[12px] leading-5 text-[#5f6470]">我会先检查现有项目结构和开发规范，然后完成设置页面的设计与实现。</p>
              </div>
            </div>
            <div className="ml-8">
              <AiWorkSummary
                onContinue={() => setMessage("继续优化设置页面的响应式布局和交互细节")}
                onReview={() => setRightTab("代码变更")}
              />
            </div>
          </div>
          <div className="shrink-0 border-t border-[#ececf1] bg-[#fcfcfe] px-4 py-3">
            <div className="rounded-xl border border-[#dedfe6] bg-white p-2 focus-within:border-[#7771B2]">
              <textarea value={message} onChange={(event) => setMessage(event.target.value)} className="h-12 w-full resize-none bg-transparent px-1 text-[12px] outline-none placeholder:text-[#a9adb6]" placeholder="描述你想要开发或修改的内容..." />
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1">
                  <ComposerSelect
                    label={model}
                    open={composerMenu === "model"}
                    onToggle={() => setComposerMenu(composerMenu === "model" ? null : "model")}
                    options={["Claude Sonnet 4", "GPT-4.1", "Gemini 2.5 Pro"]}
                    onSelect={(value) => {
                      setModel(value);
                      setComposerMenu(null);
                    }}
                  />
                  <ComposerSelect
                    label={devMode}
                    open={composerMenu === "mode"}
                    onToggle={() => setComposerMenu(composerMenu === "mode" ? null : "mode")}
                    options={["Build", "Plan"]}
                    onSelect={(value) => {
                      setDevMode(value as "Build" | "Plan");
                      setComposerMenu(null);
                    }}
                  />
                  <ComposerSelect
                    label={reasoning}
                    open={composerMenu === "reasoning"}
                    onToggle={() => setComposerMenu(composerMenu === "reasoning" ? null : "reasoning")}
                    options={["默认", "高", "中", "低"]}
                    onSelect={(value) => {
                      setReasoning(value as "默认" | "高" | "中" | "低");
                      setComposerMenu(null);
                    }}
                  />
                </div>
                <button className="flex h-7 w-7 items-center justify-center rounded-xl bg-[#241F7D] text-white disabled:bg-[#d9d9e3]" disabled={!message.trim()}><Icon name="arrow" size={13} /></button>
              </div>
            </div>
          </div>
          </>
          ) : (
            <CodeEditor file={activeFile} />
          )}
        </section>

        <section className="flex w-[42%] min-w-[380px] max-w-[600px] flex-col overflow-hidden rounded-xl border border-[#e6e7ed] bg-white">
          <div className="flex h-10 shrink-0 items-center justify-between border-b border-[#ececf1] px-2">
            <div className="flex h-full">
              {(["代码变更", "终端"] as const).map((tab) => (
                <button key={tab} onClick={() => setRightTab(tab)} className={`relative px-3 text-[12px] ${rightTab === tab ? "font-medium text-[#241F7D]" : "text-[#888d98]"}`}>
                  {tab}{tab === "代码变更" && <span className="ml-1 rounded bg-[#EDEFFF] px-1 text-[12px] text-[#241F7D]">3</span>}
                  {rightTab === tab && <i className="absolute bottom-0 left-3 right-3 h-0.5 rounded bg-[#241F7D]" />}
                </button>
              ))}
            </div>
            <button className="text-[#9499a4]"><Icon name="more" size={15} /></button>
          </div>
          {rightTab === "代码变更" ? (
            <>
              <div className="flex h-11 shrink-0 items-center justify-between border-b border-[#e4e4e7] bg-[#fafafa] px-3 text-[12px]">
                <div className="flex items-center gap-2">
                  <span className="font-medium text-[#3f3f46]">变更概览</span>
                  <span className="rounded-full bg-[#EDEFFF] px-2 py-0.5 text-[#241F7D]">3 个文件</span>
                </div>
                <div className="flex items-center rounded-xl bg-[#f0f0f2] p-1 text-[#71717a]">
                  {(["统一", "拆分"] as const).map((mode) => (
                    <button
                      key={mode}
                      onClick={() => setDiffMode(mode)}
                      className={`h-7 rounded-lg px-2.5 ${diffMode === mode ? "bg-white font-medium text-[#241F7D] shadow-sm" : "hover:text-[#3f3f46]"}`}
                    >
                      {mode}
                    </button>
                  ))}
                  <span className="mx-1 h-4 w-px bg-[#d4d4d8]" />
                  <button
                    onClick={() => setExpandedDiffFiles(allDiffExpanded ? [] : changedFiles.map((file) => file.name))}
                    className="h-7 rounded-lg px-2.5 hover:bg-white hover:text-[#3f3f46]"
                  >
                    {allDiffExpanded ? "全部收起" : "全部展开"}
                  </button>
                </div>
              </div>
              <div className="flex-1 overflow-auto bg-[#f8f8fa]">
                {changedFiles.map((file, fileIndex) => {
                  const expanded = expandedDiffFiles.includes(file.name);
                  return (
                    <div key={file.name} className="border-b border-[#e4e4e7] bg-white">
                      <button
                        onClick={() => setExpandedDiffFiles(
                          expanded
                            ? expandedDiffFiles.filter((name) => name !== file.name)
                            : [...expandedDiffFiles, file.name],
                        )}
                        className={`flex h-11 w-full items-center justify-between gap-3 px-3 text-[12px] ${
                          expanded ? "bg-[#EDEFFF]" : "hover:bg-[#fafafa]"
                        }`}
                      >
                        <span className="flex min-w-0 items-center gap-2 font-mono text-[#52525b]">
                          <span className={`flex h-5 w-5 shrink-0 items-center justify-center transition-transform ${expanded ? "rotate-90" : ""}`}>
                            <Icon name="chevron" size={13} />
                          </span>
                          <b className="shrink-0 font-semibold text-[#4897dc]">{file.name.endsWith(".css") ? "#" : "TS"}</b>
                          <span className="truncate">{file.path}</span>
                        </span>
                        <span className="flex shrink-0 items-center gap-2 font-mono">
                          <b className="font-normal text-[#1b9b72]">+{file.added}</b>
                          <b className="font-normal text-[#dc626b]">−{file.removed}</b>
                        </span>
                      </button>
                      {expanded && (
                        <div className="overflow-auto bg-[#fcfcfe] py-2 font-mono text-[12px] leading-[19px]">
                          <div className="mb-1 bg-[#eef4ff] px-3 text-[#78889f]">
                            @@ -{18 + fileIndex * 4},8 +{18 + fileIndex * 4},23 @@ {file.name}
                          </div>
                          {diffMode === "拆分" && (
                            <div className="grid grid-cols-2 border-b border-[#e4e4e7] bg-white text-[#71717a]">
                              <span className="border-r border-[#e4e4e7] px-3">修改前</span><span className="px-3">修改后</span>
                            </div>
                          )}
                          {diff.map(([type, line, code], index) => diffMode === "统一" ? (
                            <div key={index} className={`flex min-w-max ${type === "+" ? "bg-[#eaf8f1] text-[#39795f]" : type === "-" ? "bg-[#fff0f1] text-[#a4565d]" : "text-[#626874]"}`}>
                              <span className="w-9 shrink-0 border-r border-[#ececf1] px-2 text-right text-[#a7abb4]">{line}</span>
                              <span className={`w-5 text-center ${type === "+" ? "text-[#1b9b72]" : "text-[#d85c66]"}`}>{type}</span>
                              <code className="whitespace-pre pr-5">{code.replace(/^[+-] /, "")}</code>
                            </div>
                          ) : (
                            <div key={index} className="grid min-w-max grid-cols-2">
                              <div className={`border-r border-[#e4e4e7] px-3 ${type === "-" ? "bg-[#fff0f1] text-[#a4565d]" : "text-[#a1a1aa]"}`}>{type !== "+" ? code.replace(/^- /, "") : " "}</div>
                              <div className={`px-3 ${type === "+" ? "bg-[#eaf8f1] text-[#39795f]" : "text-[#626874]"}`}>{type !== "-" ? code.replace(/^\+ /, "") : " "}</div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
              <div className="flex h-11 shrink-0 items-center justify-end gap-2 border-t border-[#e9eaf0] px-3">
                <button className="h-7 rounded-md border border-[#e1e2e7] px-3 text-[12px] text-[#737884]">放弃更改</button>
                <button className="h-7 rounded-md bg-[#241F7D] px-3 text-[12px] text-white">接受所有更改</button>
              </div>
            </>
          ) : (
            <div className="flex flex-1 flex-col bg-[#262a33] text-[#dfe3ea]">
              <div className="flex h-10 items-center justify-between border-b border-white/10 px-2 text-[12px]">
                <div className="flex h-full min-w-0 items-center overflow-x-auto">
                  {terminalSessions.map((session, index) => (
                    <button
                      key={`${session}-${index}`}
                      onClick={() => setActiveTerminal(index)}
                      className={`h-full shrink-0 border-b-2 px-3 ${activeTerminal === index ? "border-[#7771B2] bg-white/5 text-white" : "border-transparent text-[#9299a7]"}`}
                    >
                      {session}{activeTerminal === index && " ×"}
                    </button>
                  ))}
                </div>
                <button onClick={createTerminal} className="flex h-7 w-7 shrink-0 items-center justify-center rounded-xl text-[14px] hover:bg-white/10" title="新建终端">＋</button>
              </div>
              <div className="flex-1 overflow-auto p-4 font-mono text-[12px] leading-6">
                {terminalOutput.map((line, index) => (
                  <div key={`${line}-${index}`} className={line.includes("not found") ? "text-[#f2858d]" : line.startsWith("Packages") || line.startsWith("✓") ? "text-[#53cf99]" : line.startsWith("请确认") ? "text-[#858d9b]" : ""}>{line}</div>
                ))}
              </div>
              <div className="flex h-10 shrink-0 items-center gap-2 border-t border-white/10 px-3 font-mono text-[12px]">
                <span className="text-[#53cf99]">❯</span>
                <input
                  value={terminalCommand}
                  onChange={(event) => setTerminalCommand(event.target.value)}
                  onKeyDown={(event) => event.key === "Enter" && runTerminalCommand()}
                  placeholder="输入命令并按 Enter 执行"
                  className="min-w-0 flex-1 bg-transparent text-white outline-none placeholder:text-[#697180]"
                />
                <button onClick={runTerminalCommand} className="rounded-xl bg-white/10 px-2 py-1 text-[12px] hover:bg-white/15">运行</button>
              </div>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}

const codexProjects = [
  {
    name: "智能会议助手",
    branch: "main",
    threads: ["优化设置页交互", "接入实时转写能力", "修复模型切换状态"],
  },
  {
    name: "设备控制插件",
    branch: "feature/panel",
    threads: ["重构设备控制面板", "补充离线状态提示"],
  },
  {
    name: "数据洞察看板",
    branch: "develop",
    threads: ["新增趋势图表", "统一指标卡片规范"],
  },
] as const;

function CodexWorkbench() {
  const [activeProject, setActiveProject] = useState(0);
  const [activeThread, setActiveThread] = useState(0);
  const [isNewSession, setIsNewSession] = useState(true);
  const [workspaceMode, setWorkspaceMode] = useState<"聊天" | "工作">("工作");
  const [projectMenuOpen, setProjectMenuOpen] = useState(false);
  const [projectSearch, setProjectSearch] = useState("");
  const [rightTool, setRightTool] = useState<"预览" | "文件" | "终端">("预览");
  const [message, setMessage] = useState("");
  const [approval, setApproval] = useState(true);
  const [sentMessages, setSentMessages] = useState<string[]>([]);
  const [notice, setNotice] = useState("");
  const [sessionPrompt, setSessionPrompt] = useState("请检查当前插件的设置页面，优化表单层级和反馈状态，同时保持现有数据结构不变。");
  const project = codexProjects[activeProject];
  const visibleProjects = codexProjects.filter((item) =>
    item.name.toLowerCase().includes(projectSearch.trim().toLowerCase()),
  );

  const sendMessage = () => {
    const nextMessage = message.trim();
    if (!nextMessage) return;
    if (isNewSession) {
      setSessionPrompt(nextMessage);
      setSentMessages([]);
      setIsNewSession(false);
      setNotice("");
      setMessage("");
      return;
    }
    setSentMessages((current) => [...current, nextMessage]);
    setMessage("");
  };

  return (
    <div className="flex min-h-0 flex-1 overflow-hidden bg-white">
      <aside className="flex w-[228px] shrink-0 flex-col border-r border-[#e8e9ee] bg-[#fbfbfc]">
        <div className="border-b border-[#ececf0] p-3">
          <button
            onClick={() => {
              setActiveThread(0);
              setSentMessages([]);
              setMessage("");
              setProjectMenuOpen(false);
              setIsNewSession(true);
              setNotice("");
            }}
            className="flex h-9 w-full items-center justify-center gap-2 rounded-xl bg-[#241F7D] text-[12px] font-medium text-white shadow-[0_4px_12px_rgba(36,31,125,.18)] hover:bg-[#1B175F]"
          >
            <Icon name="edit" size={14} />
            新建开发会话
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-2 py-3">
          <div className="mb-2 flex items-center justify-between px-2">
            <span className="text-[12px] font-medium text-[#9a9eaa]">项目</span>
            <button className="flex h-6 w-6 items-center justify-center rounded-lg text-[#8f94a0] hover:bg-[#eeeef2] hover:text-[#241F7D]">
              <Icon name="plus" size={13} />
            </button>
          </div>
          <div className="space-y-1">
            {codexProjects.map((item, index) => (
              <button
                key={item.name}
                onClick={() => {
                  setActiveProject(index);
                  setActiveThread(0);
                  setSentMessages([]);
                  setIsNewSession(false);
                }}
                className={`flex w-full items-center gap-2 rounded-xl px-2.5 py-2 text-left text-[12px] ${
                  activeProject === index
                    ? "bg-[#EDEFFF] font-medium text-[#241F7D]"
                    : "text-[#5f6470] hover:bg-[#f0f0f3]"
                }`}
              >
                <span className={activeProject === index ? "text-[#241F7D]" : "text-[#8f94a0]"}>
                  <Icon name="folder" size={14} />
                </span>
                <span className="min-w-0 flex-1 truncate">{item.name}</span>
                {activeProject === index && <span className="h-1.5 w-1.5 rounded-full bg-[#241F7D]" />}
              </button>
            ))}
          </div>

          <div className="mb-2 mt-5 flex items-center justify-between px-2">
            <span className="text-[12px] font-medium text-[#9a9eaa]">最近会话</span>
            <Icon name="history" size={13} />
          </div>
          <div className="space-y-0.5">
            {project.threads.map((thread, index) => (
              <button
                key={thread}
                onClick={() => {
                  setActiveThread(index);
                  setSentMessages([]);
                  setIsNewSession(false);
                }}
                className={`flex h-8 w-full items-center rounded-lg px-2.5 text-left text-[12px] ${
                  activeThread === index
                    ? "bg-white font-medium text-[#343742] shadow-[0_1px_3px_rgba(31,35,48,.08)]"
                    : "text-[#747985] hover:bg-[#f0f0f3]"
                }`}
              >
                <span className="truncate">{thread}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="border-t border-[#ececf0] p-3">
          <div className="mb-2 flex items-center gap-2 px-1 text-[12px] text-[#737884]">
            <span className="h-2 w-2 rounded-full bg-[#25b57f]" />
            工作区已连接
          </div>
          <button className="flex h-8 w-full items-center gap-2 rounded-xl px-2 text-[12px] text-[#737884] hover:bg-[#f0f0f3]">
            <Icon name="settings" size={14} />
            开发环境设置
          </button>
        </div>
      </aside>

      {isNewSession ? (
        <section className="relative flex min-w-0 flex-1 flex-col overflow-y-auto bg-white">
          <div className="flex h-[64px] shrink-0 items-center justify-center">
            <div className="flex rounded-2xl bg-[#f5f5f7] p-1">
              {(["聊天", "工作"] as const).map((mode) => (
                <button
                  key={mode}
                  onClick={() => setWorkspaceMode(mode)}
                  className={`h-9 min-w-[88px] rounded-xl px-5 text-[14px] ${
                    workspaceMode === mode
                      ? "bg-white font-medium text-[#292c37] shadow-[0_2px_8px_rgba(31,35,48,.08)]"
                      : "text-[#777c88] hover:text-[#3d414d]"
                  }`}
                >
                  {mode}
                </button>
              ))}
            </div>
          </div>

          <div className="flex flex-1 items-center justify-center px-8 pb-20">
            <div className="w-full max-w-[760px]">
              <div className="mb-7 text-center text-[20px] font-medium tracking-[-0.02em] text-[#252833]">
                {workspaceMode === "工作" ? "今天要开发什么？" : "有什么想一起讨论的？"}
              </div>

              <div className="relative">
                <div className="rounded-2xl border border-[#dddfe6] bg-white p-3 shadow-[0_12px_38px_rgba(31,35,48,.08)] focus-within:border-[#7771B2]">
                  <textarea
                    autoFocus
                    value={message}
                    onChange={(event) => setMessage(event.target.value)}
                    onKeyDown={(event) => {
                      if (event.key === "Enter" && !event.shiftKey) {
                        event.preventDefault();
                        sendMessage();
                      }
                    }}
                    className="h-20 w-full resize-none bg-transparent px-2 py-1 text-[14px] leading-6 text-[#3f434e] outline-none placeholder:text-[#b0b3bc]"
                    placeholder={workspaceMode === "工作" ? "描述你想开发、修改或检查的内容…" : "输入你想讨论的问题…"}
                  />
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1">
                      <button className="flex h-9 w-9 items-center justify-center rounded-xl text-[#747985] hover:bg-[#f4f4f6]">
                        <Icon name="plus" size={16} />
                      </button>
                      <button
                        onClick={() => setApproval(!approval)}
                        className={`flex h-9 items-center gap-1.5 rounded-xl px-3 text-[12px] ${
                          approval ? "text-[#707582] hover:bg-[#f4f4f6]" : "bg-[#fff4e5] text-[#b56d13]"
                        }`}
                      >
                        <Icon name="check" size={13} />
                        {approval ? "自动批准" : "逐项批准"}
                      </button>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <button className="flex h-9 items-center gap-1.5 rounded-xl px-2.5 text-[12px] text-[#555a67] hover:bg-[#f4f4f6]">
                        GPT-5.1 Codex
                        <span className="rotate-90"><Icon name="chevron" size={11} /></span>
                      </button>
                      <button className="flex h-9 w-9 items-center justify-center rounded-xl text-[#747985] hover:bg-[#f4f4f6]">
                        <Icon name="microphone" size={15} />
                      </button>
                      <button
                        onClick={sendMessage}
                        disabled={!message.trim()}
                        className="flex h-9 w-9 items-center justify-center rounded-full bg-[#241F7D] text-white shadow-[0_4px_12px_rgba(36,31,125,.18)] disabled:bg-[#e2e3e7] disabled:shadow-none"
                      >
                        <Icon name="arrow" size={15} />
                      </button>
                    </div>
                  </div>
                </div>

                <div className="mt-2 flex h-11 items-center gap-1 rounded-2xl bg-[#f5f5f7] p-1.5">
                  <div className="relative">
                    <button
                      onClick={() => setProjectMenuOpen(!projectMenuOpen)}
                      className={`flex h-8 max-w-[250px] items-center gap-2 rounded-xl px-3 text-[12px] ${
                        projectMenuOpen ? "bg-white text-[#241F7D] shadow-sm" : "text-[#555a67] hover:bg-white"
                      }`}
                    >
                      <Icon name="folder" size={14} />
                      <span className="truncate">{project.name}</span>
                      <span className="rotate-90"><Icon name="chevron" size={11} /></span>
                    </button>

                    {projectMenuOpen && (
                      <div className="absolute bottom-10 left-0 z-30 w-[320px] overflow-hidden rounded-2xl border border-[#e1e2e7] bg-white shadow-[0_16px_48px_rgba(31,35,48,.16)]">
                        <label className="flex h-11 items-center gap-2 border-b border-[#ececf0] px-3 text-[#969aa5]">
                          <Icon name="search" size={14} />
                          <input
                            value={projectSearch}
                            onChange={(event) => setProjectSearch(event.target.value)}
                            placeholder="搜索项目"
                            className="min-w-0 flex-1 bg-transparent text-[12px] text-[#4b4f5b] outline-none placeholder:text-[#a6aab4]"
                          />
                        </label>
                        <div className="px-2 py-2">
                          <div className="mb-1 px-2 text-[10px] font-medium text-[#a0a4af]">最近使用</div>
                          {visibleProjects.map((item) => {
                            const index = codexProjects.findIndex((projectItem) => projectItem.name === item.name);
                            return (
                              <button
                                key={item.name}
                                onClick={() => {
                                  setActiveProject(index);
                                  setActiveThread(0);
                                  setProjectMenuOpen(false);
                                  setProjectSearch("");
                                }}
                                className={`flex h-9 w-full items-center gap-2 rounded-xl px-2 text-left text-[12px] ${
                                  activeProject === index ? "bg-[#EDEFFF] text-[#241F7D]" : "text-[#555a67] hover:bg-[#f5f5f7]"
                                }`}
                              >
                                <Icon name="folder" size={14} />
                                <span className="min-w-0 flex-1 truncate">{item.name}</span>
                                {activeProject === index && <Icon name="check" size={13} />}
                              </button>
                            );
                          })}
                          {visibleProjects.length === 0 && (
                            <div className="px-2 py-4 text-center text-[12px] text-[#9a9eaa]">未找到相关项目</div>
                          )}
                        </div>
                        <div className="border-t border-[#ececf0] p-2">
                          <button
                            onClick={() => {
                              setProjectMenuOpen(false);
                              setNotice("新项目创建入口已打开");
                            }}
                            className="flex h-9 w-full items-center gap-2 rounded-xl px-2 text-left text-[12px] text-[#555a67] hover:bg-[#f5f5f7]"
                          >
                            <Icon name="plus" size={14} />
                            新建项目
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                  <button className="flex h-8 items-center gap-2 rounded-xl px-3 text-[12px] text-[#666b77] hover:bg-white">
                    <Icon name="document" size={14} />
                    文件
                  </button>
                  <button className="flex h-8 items-center gap-2 rounded-xl px-3 text-[12px] text-[#666b77] hover:bg-white">
                    <Icon name="cube" size={14} />
                    插件
                  </button>
                  <button className="ml-auto flex h-8 w-8 items-center justify-center rounded-xl text-[#858a96] hover:bg-white">
                    <Icon name="panel" size={14} />
                  </button>
                </div>
              </div>

              <div className="mt-7 grid grid-cols-3 gap-3">
                {[
                  ["优化现有页面", "检查布局层级并统一交互细节"],
                  ["开发新功能", "从需求开始规划并完成实现"],
                  ["排查项目问题", "分析报错并给出修复方案"],
                ].map(([title, description]) => (
                  <button
                    key={title}
                    onClick={() => setMessage(`${title}：${description}`)}
                    className="rounded-xl border border-[#ececf0] bg-white p-3 text-left hover:border-[#d9daf0] hover:bg-[#fafaff]"
                  >
                    <span className="block text-[12px] font-medium text-[#4b4f5b]">{title}</span>
                    <span className="mt-1 block text-[10px] leading-4 text-[#999eaa]">{description}</span>
                  </button>
                ))}
              </div>
              {notice && <div className="mt-3 text-center text-[10px] text-[#8f94a0]">{notice}</div>}
            </div>
          </div>
        </section>
      ) : (
      <>
      <section className="flex min-w-[420px] flex-1 flex-col bg-white">
        <div className="flex h-[52px] shrink-0 items-center justify-between border-b border-[#ececf0] px-5">
          <div className="min-w-0">
            <div className="truncate text-[14px] font-medium text-[#2b2e39]">{project.threads[activeThread]}</div>
            <div className="mt-0.5 flex items-center gap-2 text-[10px] text-[#9a9eaa]">
              <span>{project.name}</span>
              <span>·</span>
              <span className="font-mono">{project.branch}</span>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <button className="flex h-8 w-8 items-center justify-center rounded-xl text-[#888d98] hover:bg-[#f4f4f6]">
              <Icon name="search" size={14} />
            </button>
            <button className="flex h-8 w-8 items-center justify-center rounded-xl text-[#888d98] hover:bg-[#f4f4f6]">
              <Icon name="more" size={15} />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-7 py-6">
          <div className="mx-auto max-w-[720px]">
            <div className="mb-7 flex justify-end">
              <div className="max-w-[78%] rounded-2xl rounded-tr-md bg-[#EDEFFF] px-4 py-3 text-[12px] leading-5 text-[#241F7D]">
                {sessionPrompt}
              </div>
            </div>

            <div className="flex gap-3">
              <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-[#241F7D] text-[10px] font-semibold text-white">AI</div>
              <div className="min-w-0 flex-1">
                <p className="text-[12px] leading-5 text-[#4f5460]">
                  我已检查项目结构，并完成设置页面的视觉与交互优化。数据字段和接口调用保持不变。
                </p>

                <div className="mt-4 overflow-hidden rounded-xl border border-[#e7e8ed] bg-white">
                  <div className="flex items-center justify-between border-b border-[#ececf0] px-4 py-3">
                    <div className="flex items-center gap-2 text-[12px] font-medium text-[#343742]">
                      <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[#e9f8f2] text-[#168863]">
                        <Icon name="check" size={11} />
                      </span>
                      已完成页面优化
                    </div>
                    <span className="text-[10px] text-[#999eaa]">用时 42 秒</span>
                  </div>
                  <div className="grid grid-cols-3 divide-x divide-[#ececf0]">
                    {[
                      ["修改文件", "3"],
                      ["新增代码", "+186"],
                      ["删除代码", "−36"],
                    ].map(([label, value]) => (
                      <div key={label} className="px-4 py-3">
                        <div className="text-[10px] text-[#999eaa]">{label}</div>
                        <div className="mt-1 font-mono text-[14px] font-medium text-[#3d414d]">{value}</div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="mt-4 rounded-xl border border-[#e7e8ed] bg-[#fafafd] p-4">
                  <div className="mb-3 text-[12px] font-medium text-[#343742]">本次变更</div>
                  <div className="space-y-2.5 text-[12px] text-[#656a76]">
                    {[
                      "重组 API Key、模型选择和连接测试的内容层级",
                      "增加连接中、连接成功与失败反馈状态",
                      "统一输入框、按钮及帮助信息的间距规范",
                    ].map((item) => (
                      <div key={item} className="flex items-start gap-2">
                        <span className="mt-1 flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-[#EDEFFF] text-[#241F7D]">
                          <Icon name="check" size={9} />
                        </span>
                        <span className="leading-5">{item}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="mt-4 flex flex-wrap gap-2">
                  <button
                    onClick={() => {
                      setRightTool("预览");
                      setNotice("右侧已切换到运行预览");
                    }}
                    className="flex h-8 items-center gap-1.5 rounded-xl bg-[#241F7D] px-3 text-[12px] font-medium text-white hover:bg-[#1B175F]"
                  >
                    <Icon name="globe" size={13} />
                    查看运行预览
                  </button>
                  <button
                    onClick={() => setRightTool("文件")}
                    className="flex h-8 items-center gap-1.5 rounded-xl border border-[#e0e1e6] px-3 text-[12px] text-[#656a76] hover:bg-[#f7f7fa]"
                  >
                    <Icon name="document" size={13} />
                    查看修改文件
                  </button>
                </div>
              </div>
            </div>

            {sentMessages.map((item, index) => (
              <div key={`${item}-${index}`} className="mt-7 flex justify-end">
                <div className="max-w-[78%] rounded-2xl rounded-tr-md bg-[#EDEFFF] px-4 py-3 text-[12px] leading-5 text-[#241F7D]">
                  {item}
                </div>
              </div>
            ))}
            {sentMessages.length > 0 && (
              <div className="mt-5 flex items-center gap-3 text-[12px] text-[#777c88]">
                <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#241F7D] text-[10px] font-semibold text-white">AI</span>
                <span className="flex items-center gap-2">
                  <span className="animate-spin"><Icon name="spinner" size={14} /></span>
                  正在分析并执行你的请求…
                </span>
              </div>
            )}
          </div>
        </div>

        <div className="shrink-0 px-6 pb-5 pt-2">
          <div className="mx-auto max-w-[760px] rounded-2xl border border-[#dddfe6] bg-white p-2 shadow-[0_8px_30px_rgba(31,35,48,.08)] focus-within:border-[#7771B2]">
            <textarea
              value={message}
              onChange={(event) => setMessage(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter" && !event.shiftKey) {
                  event.preventDefault();
                  sendMessage();
                }
              }}
              className="h-14 w-full resize-none bg-transparent px-2 py-1 text-[12px] leading-5 text-[#3f434e] outline-none placeholder:text-[#a6aab4]"
              placeholder="描述你想开发、修改或检查的内容…"
            />
            <div className="flex items-center justify-between px-1">
              <div className="flex items-center gap-1">
                <button className="flex h-8 w-8 items-center justify-center rounded-xl text-[#858a96] hover:bg-[#f4f4f6]">
                  <Icon name="plus" size={15} />
                </button>
                <button
                  onClick={() => setApproval(!approval)}
                  className={`flex h-8 items-center gap-1.5 rounded-xl px-2.5 text-[12px] ${
                    approval ? "bg-[#f4f4f6] text-[#696e7a]" : "bg-[#fff4e5] text-[#b56d13]"
                  }`}
                >
                  <Icon name="check" size={12} />
                  {approval ? "自动批准" : "逐项批准"}
                </button>
              </div>
              <div className="flex items-center gap-1.5">
                <button className="flex h-8 items-center gap-1.5 rounded-xl px-2 text-[12px] text-[#656a76] hover:bg-[#f4f4f6]">
                  GPT-5.1 Codex
                  <span className="rotate-90"><Icon name="chevron" size={11} /></span>
                </button>
                <button className="flex h-8 w-8 items-center justify-center rounded-xl text-[#858a96] hover:bg-[#f4f4f6]">
                  <Icon name="microphone" size={14} />
                </button>
                <button
                  onClick={sendMessage}
                  disabled={!message.trim()}
                  className="flex h-8 w-8 items-center justify-center rounded-xl bg-[#241F7D] text-white disabled:bg-[#d9d9e3]"
                >
                  <Icon name="arrow" size={14} />
                </button>
              </div>
            </div>
          </div>
          {notice && <div className="mt-2 text-center text-[10px] text-[#8f94a0]">{notice}</div>}
        </div>
      </section>

      <aside className="flex w-[36%] min-w-[360px] max-w-[520px] shrink-0 flex-col border-l border-[#e8e9ee] bg-[#fafafd]">
        <div className="flex h-[52px] shrink-0 items-center justify-between border-b border-[#e8e9ee] bg-white px-3">
          <div className="flex items-center gap-1 rounded-xl bg-[#f4f4f6] p-1">
            {(["预览", "文件", "终端"] as const).map((tool) => (
              <button
                key={tool}
                onClick={() => setRightTool(tool)}
                className={`flex h-7 items-center gap-1.5 rounded-lg px-2.5 text-[12px] ${
                  rightTool === tool
                    ? "bg-white font-medium text-[#241F7D] shadow-[0_1px_3px_rgba(31,35,48,.1)]"
                    : "text-[#7d828e] hover:text-[#454955]"
                }`}
              >
                <Icon name={tool === "预览" ? "globe" : tool === "文件" ? "folder" : "terminal"} size={12} />
                {tool}
              </button>
            ))}
          </div>
          <button className="flex h-8 w-8 items-center justify-center rounded-xl text-[#898e99] hover:bg-[#f4f4f6]">
            <Icon name="panel" size={14} />
          </button>
        </div>

        {rightTool === "预览" ? (
          <div className="flex min-h-0 flex-1 flex-col p-3">
            <div className="mb-3 flex h-9 shrink-0 items-center gap-2 rounded-xl border border-[#e1e2e7] bg-white px-3 text-[10px] text-[#8d929e]">
              <Icon name="refresh" size={12} />
              <div className="flex-1 truncate rounded-lg bg-[#f6f6f8] px-3 py-1.5 text-center">localhost:4173/settings</div>
              <Icon name="more" size={13} />
            </div>
            <div className="flex-1 overflow-y-auto rounded-xl border border-[#e3e4e9] bg-white shadow-[0_2px_8px_rgba(31,35,48,.03)]">
              <div className="border-b border-[#ececf0] px-5 py-4">
                <div className="text-[14px] font-semibold text-[#292c37]">模型服务设置</div>
                <p className="mt-1 text-[10px] text-[#9599a5]">配置插件使用的 AI 模型与访问凭证</p>
              </div>
              <div className="space-y-4 p-5">
                <div>
                  <div className="mb-1.5 flex items-center justify-between text-[12px]">
                    <span className="font-medium text-[#4b4f5b]">API Key</span>
                    <span className="text-[10px] text-[#168863]">已安全保存</span>
                  </div>
                  <div className="flex h-9 items-center justify-between rounded-xl border border-[#dfe1e7] px-3 font-mono text-[10px] text-[#737884]">
                    sk-proj-••••••••••••4d2f
                    <Icon name="eye" size={13} />
                  </div>
                </div>
                <div>
                  <div className="mb-1.5 text-[12px] font-medium text-[#4b4f5b]">默认模型</div>
                  <div className="flex h-9 items-center justify-between rounded-xl border border-[#dfe1e7] px-3 text-[12px] text-[#555a67]">
                    GPT-5.1
                    <span className="rotate-90"><Icon name="chevron" size={12} /></span>
                  </div>
                </div>
                <div className="rounded-xl border border-[#dfeee8] bg-[#f2fbf7] p-3">
                  <div className="flex items-center gap-2 text-[12px] font-medium text-[#168863]">
                    <span className="flex h-5 w-5 items-center justify-center rounded-full bg-white">
                      <Icon name="check" size={11} />
                    </span>
                    模型服务连接正常
                  </div>
                  <p className="mt-1.5 pl-7 text-[10px] leading-4 text-[#6e8f82]">平均响应延迟 328ms，上次检查于刚刚</p>
                </div>
                <button className="h-9 w-full rounded-xl bg-[#241F7D] text-[12px] font-medium text-white hover:bg-[#1B175F]">测试连接</button>
              </div>
            </div>
          </div>
        ) : rightTool === "文件" ? (
          <div className="flex-1 overflow-y-auto p-3">
            <div className="overflow-hidden rounded-xl border border-[#e3e4e9] bg-white">
              <div className="flex items-center justify-between border-b border-[#ececf0] px-4 py-3">
                <span className="text-[12px] font-medium text-[#3f434e]">已修改 3 个文件</span>
                <span className="font-mono text-[10px] text-[#168863]">+186 <b className="font-normal text-[#d84f5c]">−36</b></span>
              </div>
              {[
                ["Setting.tsx", "src/components", "+128", "−24"],
                ["App.tsx", "src", "+36", "−8"],
                ["index.css", "src", "+22", "−4"],
              ].map(([name, path, added, removed]) => (
                <button key={name} className="flex h-12 w-full items-center gap-3 border-b border-[#f0f0f3] px-4 text-left last:border-b-0 hover:bg-[#fafafd]">
                  <span className="font-mono text-[10px] font-semibold text-[#4897dc]">{name.endsWith("css") ? "#" : "TS"}</span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-[12px] font-medium text-[#4b4f5b]">{name}</span>
                    <span className="block truncate text-[10px] text-[#a0a4af]">{path}</span>
                  </span>
                  <span className="font-mono text-[10px] text-[#168863]">{added} <b className="font-normal text-[#d84f5c]">{removed}</b></span>
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="flex flex-1 flex-col bg-[#242832] text-[#dfe3ea]">
            <div className="flex h-9 items-center border-b border-white/10 px-4 font-mono text-[10px] text-[#9299a7]">moying-plugin — bash</div>
            <div className="flex-1 overflow-auto p-4 font-mono text-[12px] leading-6">
              <div className="text-[#9299a7]">moying-plugin on main</div>
              <div><span className="text-[#53cf99]">❯</span> pnpm build</div>
              <div className="mt-2 text-[#9299a7]">vite v8.0.5 building for production...</div>
              <div className="text-[#53cf99]">✓ 32 modules transformed.</div>
              <div className="text-[#53cf99]">✓ built in 1.42s</div>
              <div className="mt-2"><span className="text-[#53cf99]">❯</span> <span className="animate-pulse">▋</span></div>
            </div>
          </div>
        )}
      </aside>
      </>
      )}
    </div>
  );
}

function ComposerSelect({
  label,
  open,
  options,
  onToggle,
  onSelect,
}: {
  label: string;
  open: boolean;
  options: string[];
  onToggle: () => void;
  onSelect: (value: string) => void;
}) {
  return (
    <div className="relative">
      <button
        onClick={onToggle}
        className={`flex h-8 items-center gap-1.5 rounded-xl border px-2.5 text-[12px] leading-none ${
          open ? "border-[#7771B2] bg-[#EDEFFF] text-[#241F7D]" : "border-transparent bg-[#f4f4f5] text-[#62626b] hover:bg-[#e9e9ec]"
        }`}
      >
        <span className="leading-none">{label}</span>
        <span className={`flex h-4 w-4 shrink-0 items-center justify-center transition-transform ${open ? "-rotate-90" : "rotate-90"}`}>
          <Icon name="chevron" size={12} />
        </span>
      </button>
      {open && (
        <div className="absolute bottom-9 left-0 z-30 min-w-[120px] overflow-hidden rounded-xl border border-[#e4e4e7] bg-white p-1 shadow-[0_8px_24px_rgba(0,0,0,.12)]">
          {options.map((option) => (
            <button
              key={option}
              onClick={() => onSelect(option)}
              className={`flex h-8 w-full items-center justify-between rounded-lg px-2.5 text-left text-[12px] ${
                option === label ? "bg-[#EDEFFF] font-medium text-[#241F7D]" : "text-[#52525b] hover:bg-[#f4f4f5]"
              }`}
            >
              {option}
              {option === label && <Icon name="check" size={12} />}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function CodeEditor({ file }: { file: string }) {
  const [copied, setCopied] = useState(false);
  const filePath = ["AGENTS.md", "package.json", "plugin.json"].includes(file) ? file : `src/${file}`;
  const copyPath = async () => {
    await navigator.clipboard?.writeText(filePath);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1600);
  };
  const code = [
    ["1", "import { useState } from \"react\";"],
    ["2", "import { Button, Input, Select } from \"@/components/ui\";"],
    ["3", ""],
    ["4", "export default function Settings() {"],
    ["5", "  const [apiKey, setApiKey] = useState(\"\");"],
    ["6", "  const [model, setModel] = useState(\"gpt-4.1\");"],
    ["7", "  const [testing, setTesting] = useState(false);"],
    ["8", ""],
    ["9", "  async function testConnection() {"],
    ["10", "    setTesting(true);"],
    ["11", "    await client.verify(apiKey);"],
    ["12", "    setTesting(false);"],
    ["13", "  }"],
    ["14", ""],
    ["15", "  return ("],
    ["16", "    <section className=\"settings-panel\">"],
    ["17", "      <h2>模型服务设置</h2>"],
    ["18", "      <Input value={apiKey} onChange={setApiKey} />"],
    ["19", "      <Select value={model} onChange={setModel} />"],
    ["20", "      <Button onPress={testConnection}>测试连接</Button>"],
    ["21", "    </section>"],
    ["22", "  );"],
    ["23", "}"],
  ];
  return (
    <div className="flex min-h-0 flex-1 flex-col bg-[#fcfcfd]">
      <div className="flex h-9 shrink-0 items-center justify-between border-b border-[#e4e4e7] px-3 text-[12px] text-[#71717a]">
        <div className="flex min-w-0 items-center gap-2">
          <span className="truncate font-mono">{filePath}</span>
          <button
            onClick={copyPath}
            className={`shrink-0 rounded-xl px-2 py-1 ${copied ? "bg-[#e8faf0] text-[#168f63]" : "hover:bg-[#f4f4f5]"}`}
            title={`复制 ${filePath}`}
          >
            {copied ? "已复制" : "复制路径"}
          </button>
        </div>
        <div className="flex items-center gap-1">
          <button className="rounded-xl px-2 py-1 hover:bg-[#f4f4f5]">格式化</button>
          <button className="rounded-xl bg-[#241F7D] px-2.5 py-1 text-white">保存</button>
        </div>
      </div>
      <div className="flex-1 overflow-auto py-3 font-mono text-[12px] leading-[21px]">
        {code.map(([line, content]) => (
          <div key={line} className={`flex min-w-max ${line === "10" ? "bg-[#EDEFFF]" : "hover:bg-[#f7f7f8]"}`}>
            <span className="w-11 shrink-0 border-r border-[#eeeeef] pr-3 text-right text-[#a1a1aa]">{line}</span>
            <code className="whitespace-pre px-4 text-[#3f3f46]">
              {content.includes("import") || content.includes("export") || content.includes("const") || content.includes("return")
                ? <><span className="text-[#7c3aed]">{content.match(/^(\\s*)(import|export default|const|return)/)?.[0]}</span>{content.replace(/^(\\s*)(import|export default|const|return)/, "")}</>
                : content}
            </code>
          </div>
        ))}
      </div>
      <div className="flex h-7 shrink-0 items-center justify-between border-t border-[#e4e4e7] bg-white px-3 text-[12px] text-[#71717a]">
        <span>Ln 10, Col 5　Spaces: 2</span>
        <span className="flex items-center gap-3"><b className="font-normal text-[#f5a524]">● 1 个未保存更改</b> TypeScript React</span>
      </div>
    </div>
  );
}

export default App;
