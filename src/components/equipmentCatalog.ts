import imgMcr100 from '../../配图/机器人配图/墨影 MCR 移动协作机器人.png';
import imgAmrHD1000 from '../../配图/机器人配图/墨影 AMR 移动底盘机器人.png';
import imgRobotDog from '../../配图/机器人配图/机械狗.png';
import imgAmrBox from '../../配图/机器人配图/墨影 AMR 箱式移动机器人.png';
import imgHumanoidDiff from '../../配图/机器人配图/墨影差速协作人形机器人.png';
import { Bot, Truck, ScanEye, Cpu } from 'lucide-react';

export const devices = [
  {
    name: 'MCR-100 复合协作机器人',
    isNew: true,
    vendor: '墨影科技 · 工业协作',
    family: '复合机器人 (MCR)',
    kind: '整机设备',
    label: '高精度复合',
    image: imgMcr100,
    specs: [['有效负载', '臂负载 10kg / 底盘 100kg'], ['重复定位', 'SLAM ±2mm / 视觉 ±0.1mm']],
    budget: '¥286,000',
    delivery: '现货 ~ 3 周',
    tone: 'indigo',
    icon: Bot,
  },
  {
    name: 'AMR-HD1000 重载移动底盘',
    vendor: '智导科技 · 厂内物流',
    family: '移动机器人 (AMR/AGV)',
    kind: '整机设备',
    label: '重载移动',
    image: imgAmrHD1000,
    specs: [['额定负载', '1000kg (峰值 1200kg)'], ['续航/补电', '8h 连续作业 / 自动快充']],
    budget: '¥98,000',
    delivery: '现货 (7 天内发货)',
    tone: 'green',
    icon: Truck,
  },
  {
    name: 'Sentinel-V 工业四足巡检机器人',
    vendor: '哨兵智能 · 特种巡查',
    family: '四足巡检机器人',
    kind: '整机设备',
    label: '巡检安防',
    image: imgRobotDog,
    specs: [['防护等级', 'IP67 全天候防尘防水'], ['传感器阵列', '双目雷达 + 双光红外热成像']],
    budget: '¥185,000',
    delivery: '2 ~ 4 周',
    tone: 'indigo',
    icon: ScanEye,
  },
  {
    name: '750W 高响应总线伺服套件',
    vendor: '步科 (Kinco) · 动力控制',
    family: '核心驱控',
    kind: '关键部件',
    label: '核心驱控',
    image: '/images/hardware/device-4.jpg',
    specs: [['额定参数', '750W / 2.39N·m / 3000rpm'], ['总线协议', 'EtherCAT / CANopen 亚毫秒']],
    budget: '¥1,850',
    delivery: '现货即发',
    tone: 'orange',
    icon: Cpu,
  },
  {
    name: 'AMR-SL500 顶升搬运机器人',
    vendor: '智导科技 · 厂内物流',
    family: '移动机器人 (AMR/AGV)',
    kind: '整机设备',
    label: '顶升移载',
    image: imgAmrBox,
    specs: [['额定负载', '500kg 旋转顶升'], ['导航方式', '激光 SLAM + 二维码融合']],
    budget: '¥62,000',
    delivery: '现货 (3 天内发货)',
    tone: 'green',
    icon: Truck,
  },
  {
    name: 'MCR-Lite 轻便协作复合臂',
    vendor: '墨影科技 · 工业协作',
    family: '复合机器人 (MCR)',
    kind: '整机设备',
    label: '柔性协作',
    image: imgHumanoidDiff,
    specs: [['有效负载', '臂负载 5kg / 底盘 50kg'], ['续航作业', '10h 连续作业 / 自动回充']],
    budget: '¥168,000',
    delivery: '现货 ~ 2 周',
    tone: 'indigo',
    icon: Bot,
  },
] as const;


export type Equipment = (typeof devices)[number];
export function modelForDevice(device: Equipment) {
  if (device.name.startsWith('MCR')) return '/models/mcr.glb';
  if (device.name.startsWith('AMR')) return '/models/agv.glb';
  return null;
}

export type EquipmentSpecCard = { label: string; value: string; unit?: string; detail: string };
export function specCardsFor(device: Equipment): EquipmentSpecCard[] {
  const text = device.specs.map(([,value]) => value).join(' / ');
  const cards: EquipmentSpecCard[] = [];
  const add = (label: string, value: string | undefined, unit: string, detail: string) => { if (value) cards.push({label,value,unit,detail}); };
  if (device.name.startsWith('MCR')) {
    add('机械臂负载', text.match(/臂负载\s*([\d.]+)kg/)?.[1], 'kg', '机械臂额定负载');
    add('底盘承载', text.match(/底盘\s*([\d.]+)kg/)?.[1], 'kg', '移动底盘额定负载');
    add('SLAM 重复定位', text.match(/SLAM\s*(±[\d.]+)mm/)?.[1], 'mm', 'SLAM 重复定位精度');
    add('视觉定位', text.match(/视觉\s*(±[\d.]+)mm/)?.[1], 'mm', '视觉辅助定位精度');
  } else if (device.name.startsWith('AMR')) {
    add('额定载荷', text.match(/^([\d.]+)kg/)?.[1], 'kg', device.specs[0][1]);
    add('峰值载荷', text.match(/峰值\s*([\d.]+)kg/)?.[1], 'kg', '峰值承载能力');
  }
  if (/^(AMR|MCR)/.test(device.name)) {
    add('连续作业续航', text.match(/(\d+)h/)?.[1], 'h', '连续作业参考时长');
    if (/自动快充|自动回充/.test(text)) cards.push({label:'充电方式',value:text.includes('自动快充')?'自动快充':'自动回充',detail:'自主补能，支持连续作业流程'});
    if (text.includes('激光 SLAM + 二维码融合')) cards.push({label:'导航方式',value:'SLAM',detail:'激光 SLAM + 二维码融合'});
  }
  if (device.name.startsWith('750W')) {
    add('额定功率',text.match(/(\d+)W/)?.[1],'W','总线伺服额定功率');
    add('额定扭矩',text.match(/([\d.]+)N·m/)?.[1],'N·m','额定输出扭矩');
    add('额定转速',text.match(/(\d+)rpm/)?.[1],'rpm','额定运行转速');
    cards.push({label:'总线协议',value:'EtherCAT',detail:device.specs[1][1]});
  }
  if (!cards.length) return device.specs.map(([label,value]) => ({label,value,detail:''}));
  return cards;
}
