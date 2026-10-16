import type { Equipment } from './equipmentCatalog';
export type EquipmentConfiguration = { navigation: string; payload: string };
export type EquipmentOption = { id: string; label: string; extra: number };
export const defaultConfiguration: EquipmentConfiguration = { navigation: 'standard', payload: 'standard' };
export function optionsFor(device: Equipment): { navigation: EquipmentOption[]; payload: EquipmentOption[] } {
  const robot = /^(AMR|MCR)/.test(device.name);
  return {
    navigation: robot ? [
      { id: 'standard', label: '双激光 SLAM', extra: 0 },
      { id: 'vision', label: '视觉 + 激光融合', extra: 8000 },
      { id: 'qr', label: '二维码磁钉混合', extra: 3500 },
    ] : [{ id: 'standard', label: '标准接入配置', extra: 0 }],
    payload: device.name.startsWith('AMR') ? [
      { id: 'standard', label: '标准承载平台', extra: 0 },
      { id: 'roller', label: '双排滚筒机构', extra: 15000 },
      { id: 'flange', label: '机械臂安装法兰', extra: 12000 },
    ] : device.name.startsWith('MCR') ? [
      { id: 'standard', label: '标准工具接口', extra: 0 },
      { id: 'quick-change', label: '末端快换模块', extra: 3500 },
      { id: 'vision-tool', label: '视觉定位组件', extra: 8000 },
    ] : [{ id: 'standard', label: '标准产品配置', extra: 0 }],
  };
}
export function resolveConfiguration(device: Equipment, config: Partial<EquipmentConfiguration> = {}) {
  const options = optionsFor(device);
  const navigation = options.navigation.find(item => item.id === config.navigation) || options.navigation[0];
  const payload = options.payload.find(item => item.id === config.payload) || options.payload[0];
  const unitPrice = Number(device.budget.replace(/[^\d.]/g, '')) + navigation.extra + payload.extra;
  return { navigation, payload, unitPrice, label: `${navigation.label} / ${payload.label}` };
}
export function cartLineKey(item: { name: string } & EquipmentConfiguration) { return `${item.name}:${item.navigation}:${item.payload}`; }
