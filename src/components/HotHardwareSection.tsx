import { devices, type Equipment } from './equipmentCatalog';
import { useState } from 'react';
import { motion } from 'motion/react';
import {
  ArrowUpRight,
  Bot,
  Boxes,
  Cpu,
  ScanEye,
  SlidersHorizontal,
  Truck,
  X,
  ShieldCheck,
  Zap,
} from 'lucide-react';
import quanjiafuBanner from '../../配图/全家福2026.2.png';
import './HotHardwareSection.css';
import { HomeSectionHeading } from './HomeSectionHeading';
import { DetailModal } from './DetailModal';

const families = [
  { label: '全部设备', icon: Boxes },
  { label: '移动机器人 (AMR/AGV)', icon: Truck },
  { label: '复合机器人 (MCR)', icon: Bot },
  { label: '四足巡检机器人', icon: ScanEye },
  { label: '核心驱控', icon: Cpu },
] as const;


type Device = (typeof devices)[number];
type Family = (typeof families)[number]['label'];

export function HotHardwareSection({ onOpenMarket, onOpenDevice }: { onOpenMarket: () => void; onOpenDevice?: (device: Equipment) => void }) {
  const [family, setFamily] = useState<Family>('全部设备');
  const [selected, setSelected] = useState<Device | null>(null);

  const visibleDevices = family === '全部设备' ? devices : devices.filter((device) => device.family === family);

  return (
    <section className="market-page home-market-section hot-hardware-unified-section" id="hot-hardware" aria-labelledby="hot-hardware-title">
      {/* 统一的头部样式（参考工业能力市场/插件板块） */}
      <HomeSectionHeading eyebrow="HOT HARDWARE & ROBOTICS / 热门设备" title="热门设备 · 从整机到关键部件" id="hot-hardware-title" description="展示推荐设备核心参数与选型入口，覆盖移动底盘、复合机器人至核心驱控硬件。" action={<button className="button button-outline home-market-more" onClick={onOpenMarket}>进入设备商城 <ArrowUpRight size={16} /></button>} />

      {/* 选项上方的大 Banner 位（全宽大图 Banner） */}
      <div
        className="hardware-featured-banner"
        onClick={onOpenMarket}
        role="button"
        tabIndex={0}
        aria-label="查看热门设备"
        onKeyDown={(event) => { if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); onOpenMarket(); } }}
      >
        <img
          src={quanjiafuBanner}
          alt="墨影机器人家族全家福 · 热门设备与智造生态"
          className="hardware-banner-full-image"
        />

      </div>

      {/* 统一分类选项卡（参考插件分类栏 category-tabs 样式） */}
      <div className="category-row hardware-category-row">
        <div className="category-tabs">
          {families.map(({ label, icon: Icon }) => (
            <button
              key={label}
              type="button"
              className={family === label ? 'active' : ''}
              onClick={() => setFamily(label)}
            >
              <Icon size={14} style={{ display: 'inline-block', verticalAlign: '-2px', marginRight: 6 }} />
              {label}
            </button>
          ))}
        </div>
        <span className="result-count">共 {visibleDevices.length} 项设备</span>
      </div>

      {/* 产品展示网格：一行放 3 个 */}
      <div className="hardware-capability-grid">
        {visibleDevices.map((device, index) => {
          const Icon = device.icon;
          return (
            <motion.article
              className="capability-card hardware-card-unified"
              key={device.name}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.04 }}
            >
              {/* 卡片顶部：图标、标题、分类标签与徽章 */}
              <div className="capability-top">
                <div className="capability-heading">
                  <div className={`capability-icon ${device.tone}`}>
                    <Icon size={21} />
                  </div>
                  <div className="capability-title-group">
                    <h3>{device.name}</h3>
                    <div className="capability-meta">
                      <span className="category-tag">{device.kind}</span>
                      <span>{device.family}</span>
                    </div>
                  </div>
                </div>
                <span className={`badge ${device.tone}`}>{device.label}</span>
              </div>

              {/* 产品图片展示 */}
              <div className="hardware-card-photo">
                <img src={device.image} alt={device.name} loading="lazy" />
              </div>



              {/* 底部信息：供应商与参考预算 */}
              <div className="capability-bottom">
                <span className="vendor">
                  <span className="vendor-avatar">{device.vendor.slice(0, 1)}</span>
                  {device.vendor}
                </span>
                <span className="hardware-budget-meta">
                  <strong>{device.budget}</strong> <small>起</small>
                  <span className="hardware-delivery">· {device.delivery}</span>
                </span>
              </div>

              {/* 底部操作按钮：统一采用插件的 detail-button 与 card-purchase 按钮 */}
              <div className="card-actions">
                <button className="detail-button" onClick={() => onOpenDevice ? onOpenDevice(device) : setSelected(device)}>
                  查看参数与选型 <ArrowUpRight size={15} />
                </button>
                <button className="card-purchase" onClick={() => onOpenDevice ? onOpenDevice(device) : setSelected(device)}>
                  <SlidersHorizontal size={14} /> 选型咨询
                </button>
              </div>
            </motion.article>
          );
        })}
      </div>


      {/* 设备详情使用居中弹窗，与插件购买入口保持一致。 */}
      {selected && (
        <DetailModal label={`${selected.name}详情`} onClose={() => setSelected(null)}>
          <div className="detail-drawer" onClick={(e) => e.stopPropagation()}>
            <button className="drawer-close" onClick={() => setSelected(null)} aria-label="关闭详情"><X size={19} /></button>
            <div className="detail-product-header">
              <div className={`drawer-icon ${selected.tone}`}><selected.icon size={22} /></div>
              <div className="detail-product-title">
                <h2>{selected.name}</h2>
                <div className="detail-product-meta"><span className="category-tag">{selected.kind}</span><span>{selected.family}</span></div>
              </div>
              <span className={`badge ${selected.tone}`}>{selected.label}</span>
            </div>
            <div className="drawer-photo-preview">
              <img src={selected.image} alt={selected.name} />
            </div>
            <p className="drawer-intro">{selected.vendor}</p>
            <div className="drawer-specs">
              <div><span>设备类型</span><strong>{selected.kind}</strong></div>
              <div><span>产品族</span><strong>{selected.family}</strong></div>
              <div><span>参考预算</span><strong>{selected.budget} 起</strong></div>
              <div><span>交付周期</span><strong>{selected.delivery}</strong></div>
            </div>
            <div className="drawer-scene">
              <span>核心规格参数</span>
              <div style={{ marginTop: 8 }}>
                {selected.specs.map(([label, value]) => (
                  <p key={label} style={{ margin: '6px 0', fontSize: '12px' }}>
                    <strong style={{ color: '#eee' }}>{label}：</strong>{value}
                  </p>
                ))}
              </div>
            </div>
            <button className="button button-primary purchase-button">
              <SlidersHorizontal size={17} /> 立即咨询选型 <ArrowUpRight size={16} />
            </button>
          </div>
        </DetailModal>
      )}
    </section>
  );
}
