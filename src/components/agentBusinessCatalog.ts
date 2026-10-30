import { businessApiOperations } from './agentBusinessApiCatalog';

export type BusinessCatalogId = 'baichuan-qingda' | 'digital-machine' | 'baichuan-zhuangji';
export type BusinessCapability = { id: string; name: string; description: string; services: string[]; knowledge: string[] };
export const businessCapabilities: Record<BusinessCatalogId, BusinessCapability[]> = {
  'baichuan-qingda': [
    { id: 'behavior', name: '行为树编排与运行', description: '行为树编辑、节点参考、执行状态与历史。', services: ['BehaviorTreeManagementService', 'BehaviorTreeRuntimeService', 'ScriptProgramInterpreterService'], knowledge: ['行为树引擎', '行为树节点参考', 'baichuan-btx-json-editor', 'baichuan-btx-nodes'] },
    { id: 'motion', name: '运动控制与导航', description: '机械臂、底盘、地图点位、路径与导航任务。', services: ['GeneralArmsControlService', 'BaseControlService', 'AMRNavigationService', 'TaskManagementService', 'AreaManagementService', 'MapGraphManagementService', 'MapdataManagementService', 'MapFileManagementService', 'PathManagementService', 'PoseManagementService'], knowledge: ['通用运动控制解算 GAC', '移动运动控制算法 GMC', '导航与行为树集成'] },
    { id: 'peripherals', name: '外设与视觉调试', description: 'IO、伺服、相机、媒体及视觉作业流。', services: ['CommonPeripheralsControlService', 'IOPeripheralControlService', 'DeviceMediaService', 'ServoMotorDriverControlService', 'SmartCameraControlService', 'VisionImagenXService', 'InexbotArmControllerService'], knowledge: ['外围设备集成', '视觉系统集成', '百川视觉算子插件开发指南'] },
    { id: 'diagnostics', name: '设备状态与日志诊断', description: '运行观测、日志、通知及设备系统状态。', services: ['RuntimeInsightsService', 'RemoteFilesystemService', 'DeviceGeneralControlService', 'SystemSettingService', 'OSSettingService', 'GenericsStatusHubService', 'NotificationCenterService'], knowledge: ['baichuan-robot-ops', 'baichuan-vortex-cli', 'baichuan-vortex-rest', 'Web客户端开发指南'] },
    { id: 'addons', name: '插件与界面开发', description: '插件池、界面包和设备端数据存储。', services: ['AddonManagementService', 'UiPagePackageManagementService', 'ClientDataStorageService', 'ConfigurationPanelManageService'], knowledge: ['addon插件开发指南', 'baichuan-acm', 'BPM包管理开发指南'] },
  ],
  'digital-machine': [
    { id: 'models', name: '整机模型与信息包', description: '设备模型、整机信息包与模型应用。', services: ['DeviceProfileService', 'DeviceProfilesService'], knowledge: ['整机信息包与设备模型服务', '设备整机配置模型'] },
    { id: 'assembly', name: '装配与坐标变换', description: '装配描述、URDF、关节快照、位姿和坐标变换。', services: ['DeviceSceneService'], knowledge: ['本地坐标系管理', '系统集成前端'] },
    { id: 'configuration', name: '设备配置与面板', description: '命名配置、配置合成、设备配置面板与存储。', services: ['EntityConfigurationService', 'ConfigurationPanelManageService', 'ClientDataStorageService'], knowledge: ['设备整机配置模型', '客户端数据存储服务', '配置参数文档编写指导'] },
    { id: 'integration', name: '设备接入与标定', description: '总线、设备模型接入、标定及整定流程。', services: ['FieldbusManagementService', 'CalibrationAndTuningService'], knowledge: ['设备集成与开发指南', '设备IPC协议库与整机配置下发', 'CiA402伺服电机对接指南'] },
    { id: 'packages', name: '插件与组件包管理', description: '模型相关插件池、界面组件包与交付。', services: ['AddonManagementService', 'UiPagePackageManagementService'], knowledge: ['外设插件工程规范', '插件管理架构', 'BPM包管理架构'] },
  ],
  'baichuan-zhuangji': [
    { id: 'configuration', name: '装机配置与参数', description: '查询设备配置、配置面板和系统参数，按授权提交配置变更。', services: ['EntityConfigurationService', 'ConfigurationPanelManageService', 'SystemSettingService', 'OSSettingService'], knowledge: ['设备整机配置模型', '配置参数文档编写指导', '设备IPC协议库与整机配置下发'] },
    { id: 'packages', name: '装机组件管理', description: '查询设备插件池与界面组件包，按授权管理装机组件。', services: ['AddonManagementService', 'UiPagePackageManagementService'], knowledge: ['插件管理架构', '外设插件工程规范', 'BPM包管理架构'] },
    { id: 'diagnostics', name: '装机状态与诊断', description: '查询设备系统状态、运行观测和装机日志。', services: ['DeviceGeneralControlService', 'RuntimeInsightsService', 'RemoteFilesystemService'], knowledge: ['baichuan-robot-ops', 'baichuan-vortex-cli', 'baichuan-vortex-rest'] },
  ],
};
export const capabilityOperations = (capability: BusinessCapability) => businessApiOperations.filter(operation => capability.services.includes(operation.service));
export const catalogCapability = (catalog: BusinessCatalogId, resource: string) => businessCapabilities[catalog].find(capability => capability.name === resource);
export const catalogOperations = (catalog: BusinessCatalogId) => businessApiOperations.filter(operation => businessCapabilities[catalog].some(capability => capability.services.includes(operation.service)));
export function catalogReadOnly(operation: { method: string; path: string }) {
  return operation.method === 'GET' || (operation.method === 'POST' && /:(query|export|validate|transform)$/.test(operation.path));
}
