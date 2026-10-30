import { useState, useMemo } from 'react';
import { Plus, ChevronDown, ChevronRight, Trash2, AlertTriangle, X } from 'lucide-react';
import {
  PRESET_PROVIDERS,
  defaultConfiguredProviders,
  type ConfiguredProvider,
  type ProviderType,
  type ApiProtocol,
  type ModelCatalogItem,
} from './agentModelService';
import type { UpdateState, WorkbenchState } from './agentWorkbenchState';
import './AgentModelSettings.css';

interface AgentModelSettingsProps {
  state: WorkbenchState;
  update: UpdateState;
  notify: (message: string) => void;
}

interface EditableModelItem extends ModelCatalogItem {
  expanded?: boolean;
  maxTokens?: string;
  inputTypeText?: boolean;
  inputTypeImage?: boolean;
}

export default function AgentModelSettings({ state, update, notify }: AgentModelSettingsProps) {
  // 当前配置的所有模型提供商列表
  const providers: ConfiguredProvider[] = useMemo(() => {
    if (state.configuredProviders && state.configuredProviders.length > 0) {
      return state.configuredProviders;
    }
    // 默认对齐图一所示的典型配置
    return [
      {
        id: 'deepseek-account',
        type: 'preset',
        name: 'DeepSeek 账号',
        protocol: 'openai',
        baseUrl: 'https://api.deepseek.com',
        hasKey: true,
        status: 'connected',
        models: [{ id: 'deepseek-chat', name: 'DeepSeek-V3', isDefault: true }],
        enabled: true,
      },
      {
        id: 'deepseek',
        type: 'preset',
        name: 'DeepSeek',
        protocol: 'openai',
        baseUrl: 'https://api.deepseek.com',
        hasKey: false,
        status: 'error',
        models: [{ id: 'deepseek-reasoner', name: 'DeepSeek-R1', isDefault: true }],
        enabled: true,
      },
      {
        id: 'claude-gateway',
        type: 'custom',
        name: '墨影 Claude Gateway',
        protocol: 'anthropic',
        baseUrl: 'https://gateway.example/v1',
        hasKey: true,
        status: 'connected',
        models: [{ id: 'claude-3-7-sonnet', name: 'Claude 3.7 Sonnet', isDefault: true }],
        enabled: true,
      },
    ];
  }, [state.configuredProviders]);

  // 模态弹窗状态：null 关闭，'create' 新增，ConfiguredProvider 编辑
  const [editingProvider, setEditingProvider] = useState<ConfiguredProvider | 'create' | null>(null);

  // 删除确认目标
  const [deleteTarget, setDeleteTarget] = useState<ConfiguredProvider | null>(null);

  // 确认删除提供商
  const handleConfirmDelete = () => {
    if (!deleteTarget) return;

    const targetModelIds = deleteTarget.models.map(m => m.id);
    const affectedTasks = state.tasks.filter(t => targetModelIds.includes(t.model));

    update(draft => {
      const list = (draft.configuredProviders || providers).filter(
        p => p.id !== deleteTarget.id
      );
      draft.configuredProviders = list;

      // 如果有任务使用被删除的模型，重置至默认模型
      if (affectedTasks.length > 0) {
        draft.tasks.forEach(t => {
          if (targetModelIds.includes(t.model)) {
            t.model = 'GPT-5.1 Codex';
          }
        });
      }
    });

    notify(`已删除模型提供商「${deleteTarget.name}」`);
    setDeleteTarget(null);
  };

  return (
    <section className="ams-clean-page" aria-label="模型配置">
      {/* 顶部标题与轻量说明 (完全对齐图一) */}
      <div className="ams-clean-header">
        <h2>模型</h2>
        <p>填入各提供商的 API 密钥即可使用其模型。</p>
      </div>

      {/* 服务商列表卡片 */}
      <div className="ams-clean-list">
        {providers.map(p => (
          <div className="ams-clean-card" key={p.id}>
            <div className="ams-clean-card-left">
              <span className="ams-clean-title">{p.name}</span>
              {p.type === 'custom' && <span className="ams-clean-badge">自定义</span>}
              {p.status === 'connected' && <span className="ams-clean-dot green" title="已连接" />}
              {p.status === 'error' && <span className="ams-clean-dot red" title="连接异常" />}
            </div>

            <div className="ams-clean-card-right">
              <button
                className="ams-clean-btn-edit"
                onClick={() => setEditingProvider(p)}
              >
                编辑
              </button>
              {p.type === 'custom' && (
                <button
                  className="ams-clean-btn-delete"
                  onClick={() => setDeleteTarget(p)}
                >
                  删除
                </button>
              )}
            </div>
          </div>
        ))}

        {/* 虚线添加模型提供商按钮 (对齐图一) */}
        <button
          className="ams-clean-add-btn"
          onClick={() => setEditingProvider('create')}
        >
          <Plus size={16} /> 添加模型提供商
        </button>
      </div>

      {/* 添加/编辑模态弹窗 (对齐图二、图三) */}
      {editingProvider && (
        <CleanProviderModal
          target={editingProvider === 'create' ? null : editingProvider}
          existingProviders={providers}
          onClose={() => setEditingProvider(null)}
          onSave={saved => {
            update(draft => {
              const list = draft.configuredProviders || [...providers];
              const idx = list.findIndex(p => p.id === saved.id);
              if (idx >= 0) {
                list[idx] = saved;
              } else {
                list.push(saved);
              }
              draft.configuredProviders = list;
            });
            notify(`模型提供商「${saved.name}」已保存`);
            setEditingProvider(null);
          }}
        />
      )}

      {/* 删除二次确认弹窗 */}
      {deleteTarget && (
        <DeleteConfirmDialog
          provider={deleteTarget}
          tasks={state.tasks}
          onCancel={() => setDeleteTarget(null)}
          onConfirm={handleConfirmDelete}
        />
      )}
    </section>
  );
}

// =============================================================================
// 子组件：添加/编辑模型提供商弹窗 (完全还原图二与图三)
// =============================================================================
interface CleanProviderModalProps {
  target: ConfiguredProvider | null;
  existingProviders: ConfiguredProvider[];
  onClose: () => void;
  onSave: (provider: ConfiguredProvider) => void;
}

function CleanProviderModal({
  target,
  existingProviders,
  onClose,
  onSave,
}: CleanProviderModalProps) {
  const isEditing = Boolean(target);

  // Tab 切换：第三方模型提供商 vs 自定义模型 API
  const [activeTab, setActiveTab] = useState<ProviderType>(target?.type || 'preset');

  // 第三方下拉选项
  const [selectedPreset, setSelectedPreset] = useState<string>(
    target?.presetCatalogId || 'amazon-bedrock'
  );

  // 通用表单字段
  const [apiKey, setApiKey] = useState('');
  const [showAdvanced, setShowAdvanced] = useState(Boolean(target?.baseUrl && target.baseUrl !== 'https://api.openai.com/v1'));
  const [baseUrl, setBaseUrl] = useState(target?.baseUrl || '');

  // 自定义模型 API 专属字段
  const [providerId, setProviderId] = useState(target?.id || '');
  const [displayName, setDisplayName] = useState(target?.name || '');
  const [protocol, setProtocol] = useState<ApiProtocol>(target?.protocol || 'openai');

  // 模型目录条目
  const [models, setModels] = useState<EditableModelItem[]>(() => {
    if (target?.models && target.models.length > 0) {
      return target.models.map(m => ({
        ...m,
        expanded: target.type === 'custom',
        contextWindow: m.contextWindow || '256K',
        maxTokens: '32K',
        inputTypeText: true,
        inputTypeImage: false,
      }));
    }
    // 默认初始条目
    return [
      {
        id: '',
        name: '',
        expanded: activeTab === 'custom',
        contextWindow: '256K',
        maxTokens: '32K',
        inputTypeText: true,
        inputTypeImage: false,
      },
    ];
  });

  // 校验错误信息
  const [errorMessage, setErrorMessage] = useState('');

  // 恢复默认模型 (图二)
  const handleResetDefaultModels = () => {
    const found = PRESET_PROVIDERS.find(p => p.id === selectedPreset);
    if (found) {
      setModels(
        found.defaultModels.map(m => ({
          ...m,
          expanded: false,
          contextWindow: '256K',
          maxTokens: '32K',
          inputTypeText: true,
          inputTypeImage: false,
        }))
      );
      setErrorMessage('');
    }
  };

  // 获取可用模型 (拉取/刷新)
  const handleFetchAvailableModels = () => {
    if (activeTab === 'preset') {
      handleResetDefaultModels();
    } else {
      setModels([
        { id: 'claude-3-7-sonnet', name: 'Claude 3.7 Sonnet', expanded: true, contextWindow: '200K', maxTokens: '64K', inputTypeText: true, inputTypeImage: true },
        { id: 'claude-3-5-sonnet', name: 'Claude 3.5 Sonnet', expanded: false, contextWindow: '200K', maxTokens: '8K', inputTypeText: true, inputTypeImage: true },
      ]);
    }
  };

  // 添加新模型行
  const handleAddModelRow = () => {
    setModels(prev => [
      ...prev,
      {
        id: '',
        name: '',
        expanded: activeTab === 'custom',
        contextWindow: '256K',
        maxTokens: '32K',
        inputTypeText: true,
        inputTypeImage: false,
      },
    ]);
  };

  // 保存处理与校验
  const handleSave = () => {
    setErrorMessage('');

    // 基础校验
    if (activeTab === 'custom') {
      if (!providerId.trim()) {
        setErrorMessage('Provider ID 不能为空。');
        return;
      }
      if (!/^[a-z][a-z0-9_-]*$/.test(providerId.trim())) {
        setErrorMessage('Provider ID 必须以小写字母开头，仅允许小写字母、数字和中划线。');
        return;
      }
      if (!displayName.trim()) {
        setErrorMessage('显示名称不能为空。');
        return;
      }
      if (!baseUrl.trim()) {
        setErrorMessage('API 地址不能为空。');
        return;
      }
    }

    // 模型校验
    if (models.length === 0) {
      setErrorMessage('模型目录不能为空，请添加至少一个模型。');
      return;
    }

    for (let i = 0; i < models.length; i++) {
      if (!models[i].id.trim()) {
        setErrorMessage(`模型 ${i + 1}: 模型 ID 不能为空。`);
        return;
      }
    }

    const finalId = isEditing
      ? target!.id
      : activeTab === 'preset'
      ? selectedPreset
      : providerId.trim();

    const finalName =
      activeTab === 'preset'
        ? PRESET_PROVIDERS.find(p => p.id === selectedPreset)?.name || selectedPreset
        : displayName.trim();

    const finalBaseUrl =
      baseUrl.trim() ||
      PRESET_PROVIDERS.find(p => p.id === selectedPreset)?.defaultBaseUrl ||
      'https://api.openai.com/v1';

    const providerObj: ConfiguredProvider = {
      id: finalId,
      type: activeTab,
      name: finalName,
      protocol: activeTab === 'preset' ? 'openai' : protocol,
      baseUrl: finalBaseUrl,
      hasKey: Boolean(apiKey.trim() || target?.hasKey),
      status: apiKey.trim() || target?.hasKey ? 'connected' : 'unconfigured',
      models: models.map((m, idx) => ({
        id: m.id.trim(),
        name: m.name.trim() || m.id.trim(),
        contextWindow: m.contextWindow,
        isDefault: idx === 0,
      })),
      isBuiltinPreset: activeTab === 'preset',
      presetCatalogId: activeTab === 'preset' ? selectedPreset : undefined,
      enabled: target?.enabled ?? true,
      savedAt: new Date().toISOString(),
    };

    onSave(providerObj);
  };

  return (
    <div
      className="ams-modal-overlay"
      onClick={e => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="ams-clean-modal" role="dialog" aria-modal="true">
        {/* 顶部分段选项卡 (对齐图二、图三) */}
        <div className="ams-segment-bar">
          <button
            className={`ams-segment-btn ${activeTab === 'preset' ? 'active' : ''}`}
            onClick={() => {
              setActiveTab('preset');
              setErrorMessage('');
            }}
          >
            第三方模型提供商
          </button>
          <button
            className={`ams-segment-btn ${activeTab === 'custom' ? 'active' : ''}`}
            onClick={() => {
              setActiveTab('custom');
              setErrorMessage('');
            }}
          >
            自定义模型 API
          </button>
        </div>

        {/* 描述文案 (完全匹配截图) */}
        <p className="ams-modal-subtext">
          {activeTab === 'preset'
            ? '从内置目录中选择 OpenAI、Anthropic、Kimi 等提供商，填入其 API 密钥即可使用。'
            : '连接中转站、自部署服务或其他兼容 OpenAI / Anthropic 协议的接口，需填写 API 地址、协议和模型。'}
        </p>

        {/* ======================= Tab 1: 第三方模型提供商 ======================= */}
        {activeTab === 'preset' && (
          <div>
            {/* 提供商 */}
            <div className="ams-form-item">
              <label className="ams-label">提供商</label>
              <select
                className="ams-select-box"
                value={selectedPreset}
                onChange={e => {
                  setSelectedPreset(e.target.value);
                  const found = PRESET_PROVIDERS.find(p => p.id === e.target.value);
                  if (found) {
                    setModels(found.defaultModels.map(m => ({ ...m, expanded: false })));
                  }
                }}
              >
                <option value="amazon-bedrock">amazon-bedrock</option>
                <option value="deepseek">deepseek</option>
                <option value="openai">openai</option>
                <option value="anthropic">anthropic</option>
                <option value="kimi">kimi</option>
                <option value="qwen">qwen</option>
                <option value="glm">glm</option>
              </select>
            </div>

            {/* API 密钥 */}
            <div className="ams-form-item">
              <label className="ams-label">API 密钥</label>
              <input
                className="ams-input-box"
                type="password"
                placeholder="输入 API 密钥，或留空使用环境认证"
                value={apiKey}
                onChange={e => setApiKey(e.target.value)}
              />
            </div>

            {/* 自定义设置 (折叠栏) */}
            <button
              type="button"
              className="ams-accordion-btn"
              onClick={() => setShowAdvanced(!showAdvanced)}
            >
              {showAdvanced ? <ChevronDown size={14} /> : <ChevronRight size={14} />} 自定义设置
            </button>

            {showAdvanced && (
              <div className="ams-form-item" style={{ marginTop: '8px' }}>
                <label className="ams-label">API 地址</label>
                <input
                  className="ams-input-box"
                  placeholder="提供商默认"
                  value={baseUrl}
                  onChange={e => setBaseUrl(e.target.value)}
                />
              </div>
            )}

            <hr className="ams-divider" />

            {/* 模型目录头部 */}
            <div className="ams-catalog-header">
              <div className="ams-catalog-header-left">
                <span className="ams-catalog-title">模型目录</span>
                <span className="ams-catalog-sub">已自定义模型目录</span>
              </div>
              <div className="ams-catalog-links">
                <button
                  type="button"
                  className="ams-link-btn"
                  onClick={handleResetDefaultModels}
                >
                  恢复默认模型
                </button>
                <button
                  type="button"
                  className="ams-link-btn"
                  onClick={handleFetchAvailableModels}
                >
                  获取可用模型
                </button>
              </div>
            </div>

            {/* 模型列表项 */}
            <div className="ams-models-wrapper">
              {models.map((m, idx) => (
                <div className="ams-model-card" key={idx}>
                  <div className="ams-model-row-main">
                    <input
                      className="ams-input-box"
                      placeholder="模型 ID"
                      value={m.id}
                      onChange={e => {
                        const nextId = e.target.value;
                        setModels(prev =>
                          prev.map((item, i) => (i === idx ? { ...item, id: nextId } : item))
                        );
                      }}
                    />
                    <input
                      className="ams-input-box"
                      placeholder="显示名称"
                      value={m.name}
                      onChange={e => {
                        const nextName = e.target.value;
                        setModels(prev =>
                          prev.map((item, i) => (i === idx ? { ...item, name: nextName } : item))
                        );
                      }}
                    />
                    <button
                      type="button"
                      className="ams-model-expand-btn"
                      onClick={() => {
                        setModels(prev =>
                          prev.map((item, i) =>
                            i === idx ? { ...item, expanded: !item.expanded } : item
                          )
                        );
                      }}
                    >
                      {m.expanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                    </button>
                    <button
                      type="button"
                      className="ams-model-delete-btn"
                      onClick={() => {
                        setModels(prev => prev.filter((_, i) => i !== idx));
                      }}
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>

                  {m.expanded && (
                    <>
                      <div className="ams-model-grid-row">
                        <div>
                          <label className="ams-sublabel">上下文窗口</label>
                          <input
                            className="ams-input-box"
                            placeholder="256K"
                            value={m.contextWindow || ''}
                            onChange={e => {
                              const v = e.target.value;
                              setModels(prev =>
                                prev.map((item, i) =>
                                  i === idx ? { ...item, contextWindow: v } : item
                                )
                              );
                            }}
                          />
                        </div>
                        <div>
                          <label className="ams-sublabel">最大输出 token 数</label>
                          <input
                            className="ams-input-box"
                            placeholder="32K"
                            value={m.maxTokens || ''}
                            onChange={e => {
                              const v = e.target.value;
                              setModels(prev =>
                                prev.map((item, i) =>
                                  i === idx ? { ...item, maxTokens: v } : item
                                )
                              );
                            }}
                          />
                        </div>
                      </div>

                      <div>
                        <label className="ams-sublabel">输入类型</label>
                        <div className="ams-model-types-row">
                          <label className="ams-checkbox-label">
                            <input
                              type="checkbox"
                              checked={m.inputTypeText ?? true}
                              onChange={e => {
                                const v = e.target.checked;
                                setModels(prev =>
                                  prev.map((item, i) =>
                                    i === idx ? { ...item, inputTypeText: v } : item
                                  )
                                );
                              }}
                            />
                            <span>文本</span>
                          </label>
                          <label className="ams-checkbox-label">
                            <input
                              type="checkbox"
                              checked={m.inputTypeImage ?? false}
                              onChange={e => {
                                const v = e.target.checked;
                                setModels(prev =>
                                  prev.map((item, i) =>
                                    i === idx ? { ...item, inputTypeImage: v } : item
                                  )
                                );
                              }}
                            />
                            <span>图片</span>
                          </label>
                        </div>
                      </div>
                    </>
                  )}
                </div>
              ))}

              <button
                type="button"
                className="ams-add-model-pill"
                onClick={handleAddModelRow}
              >
                <Plus size={13} /> 添加模型
              </button>
            </div>
          </div>
        )}

        {/* ======================= Tab 2: 自定义模型 API ======================= */}
        {activeTab === 'custom' && (
          <div>
            {/* Provider ID */}
            <div className="ams-form-item">
              <label className="ams-label">Provider ID</label>
              <input
                className="ams-input-box"
                placeholder="acme-gateway"
                value={providerId}
                onChange={e => setProviderId(e.target.value.toLowerCase())}
              />
              <div className="ams-help-text">
                以小写字母开头的标识，在请求中唯一标识该提供商，并用于派生凭据名。
              </div>
            </div>

            {/* 显示名称 */}
            <div className="ams-form-item">
              <label className="ams-label">显示名称</label>
              <input
                className="ams-input-box"
                placeholder="显示名称"
                value={displayName}
                onChange={e => setDisplayName(e.target.value)}
              />
            </div>

            {/* API 地址 */}
            <div className="ams-form-item">
              <label className="ams-label">API 地址</label>
              <input
                className="ams-input-box"
                placeholder="https://gateway.example/v1"
                value={baseUrl}
                onChange={e => setBaseUrl(e.target.value)}
              />
            </div>

            {/* API 协议 */}
            <div className="ams-form-item">
              <label className="ams-label">API 协议</label>
              <select
                className="ams-select-box"
                value={protocol}
                onChange={e => setProtocol(e.target.value as ApiProtocol)}
              >
                <option value="openai">OpenAI Chat Completions</option>
                <option value="anthropic">Anthropic Messages</option>
                <option value="ollama">Ollama API</option>
              </select>
            </div>

            {/* API 密钥 */}
            <div className="ams-form-item">
              <label className="ams-label">API 密钥</label>
              <input
                className="ams-input-box"
                type="password"
                placeholder="输入 API 密钥"
                value={apiKey}
                onChange={e => setApiKey(e.target.value)}
              />
            </div>

            <hr className="ams-divider" />

            {/* 模型目录头部 */}
            <div className="ams-catalog-header">
              <div className="ams-catalog-header-left">
                <span className="ams-catalog-title">模型目录</span>
              </div>
              <div className="ams-catalog-links">
                <button
                  type="button"
                  className="ams-link-btn"
                  onClick={handleFetchAvailableModels}
                >
                  获取可用模型
                </button>
              </div>
            </div>

            {/* 模型列表项 */}
            <div className="ams-models-wrapper">
              {models.map((m, idx) => (
                <div className="ams-model-card" key={idx}>
                  <div className="ams-model-row-main">
                    <input
                      className="ams-input-box"
                      placeholder="模型 ID"
                      value={m.id}
                      onChange={e => {
                        const nextId = e.target.value;
                        setModels(prev =>
                          prev.map((item, i) => (i === idx ? { ...item, id: nextId } : item))
                        );
                      }}
                    />
                    <input
                      className="ams-input-box"
                      placeholder="显示名称"
                      value={m.name}
                      onChange={e => {
                        const nextName = e.target.value;
                        setModels(prev =>
                          prev.map((item, i) => (i === idx ? { ...item, name: nextName } : item))
                        );
                      }}
                    />
                    <button
                      type="button"
                      className="ams-model-expand-btn"
                      onClick={() => {
                        setModels(prev =>
                          prev.map((item, i) =>
                            i === idx ? { ...item, expanded: !item.expanded } : item
                          )
                        );
                      }}
                    >
                      {m.expanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                    </button>
                    <button
                      type="button"
                      className="ams-model-delete-btn"
                      onClick={() => {
                        setModels(prev => prev.filter((_, i) => i !== idx));
                      }}
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>

                  {m.expanded && (
                    <>
                      <div className="ams-model-grid-row">
                        <div>
                          <label className="ams-sublabel">上下文窗口</label>
                          <input
                            className="ams-input-box"
                            placeholder="256K"
                            value={m.contextWindow || ''}
                            onChange={e => {
                              const v = e.target.value;
                              setModels(prev =>
                                prev.map((item, i) =>
                                  i === idx ? { ...item, contextWindow: v } : item
                                )
                              );
                            }}
                          />
                        </div>
                        <div>
                          <label className="ams-sublabel">最大输出 token 数</label>
                          <input
                            className="ams-input-box"
                            placeholder="32K"
                            value={m.maxTokens || ''}
                            onChange={e => {
                              const v = e.target.value;
                              setModels(prev =>
                                prev.map((item, i) =>
                                  i === idx ? { ...item, maxTokens: v } : item
                                )
                              );
                            }}
                          />
                        </div>
                      </div>

                      <div>
                        <label className="ams-sublabel">输入类型</label>
                        <div className="ams-model-types-row">
                          <label className="ams-checkbox-label">
                            <input
                              type="checkbox"
                              checked={m.inputTypeText ?? true}
                              onChange={e => {
                                const v = e.target.checked;
                                setModels(prev =>
                                  prev.map((item, i) =>
                                    i === idx ? { ...item, inputTypeText: v } : item
                                  )
                                );
                              }}
                            />
                            <span>文本</span>
                          </label>
                          <label className="ams-checkbox-label">
                            <input
                              type="checkbox"
                              checked={m.inputTypeImage ?? false}
                              onChange={e => {
                                const v = e.target.checked;
                                setModels(prev =>
                                  prev.map((item, i) =>
                                    i === idx ? { ...item, inputTypeImage: v } : item
                                  )
                                );
                              }}
                            />
                            <span>图片</span>
                          </label>
                        </div>
                      </div>
                    </>
                  )}
                </div>
              ))}

              <button
                type="button"
                className="ams-add-model-pill"
                onClick={handleAddModelRow}
              >
                <Plus size={13} /> 添加模型
              </button>
            </div>
          </div>
        )}

        {/* 错误提示 banner (对齐图二下方的 "模型 1: 模型 ID 不能为空。") */}
        {errorMessage && <div className="ams-error-banner">{errorMessage}</div>}

        {/* 底部按钮栏 (对齐图二、图三) */}
        <div className="ams-modal-footer-clean">
          <button type="button" className="ams-clean-cancel" onClick={onClose}>
            取消
          </button>
          <button type="button" className="ams-clean-save" onClick={handleSave}>
            保存
          </button>
        </div>
      </div>
    </div>
  );
}

// =============================================================================
// 子组件：删除二次确认弹窗
// =============================================================================
function DeleteConfirmDialog({
  provider,
  tasks,
  onCancel,
  onConfirm,
}: {
  provider: ConfiguredProvider;
  tasks: WorkbenchState['tasks'];
  onCancel: () => void;
  onConfirm: () => void;
}) {
  const providerModelIds = provider.models.map(m => m.id);
  const affectedTasks = tasks.filter(t => providerModelIds.includes(t.model));

  return (
    <div className="ams-modal-overlay">
      <div
        className="ams-clean-modal"
        style={{ maxWidth: '440px', padding: '20px 24px' }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
          <AlertTriangle size={20} color="#ef4444" />
          <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 600 }}>确认删除？</h3>
        </div>

        <p style={{ margin: '0 0 12px', fontSize: '13px', color: '#57606a', lineHeight: 1.5 }}>
          确定要删除模型提供商「<strong>{provider.name}</strong>」吗？
        </p>

        {affectedTasks.length > 0 && (
          <div
            style={{
              background: '#fff8eb',
              border: '1px solid #fde8ca',
              borderRadius: '8px',
              padding: '10px 12px',
              fontSize: '12px',
              color: '#9e5a07',
              marginBottom: '14px',
            }}
          >
            当前有 {affectedTasks.length} 个任务正在使用此提供商的模型，删除后将自动回退至默认模型。
          </div>
        )}

        <div className="ams-modal-footer-clean" style={{ marginTop: '16px' }}>
          <button className="ams-clean-cancel" onClick={onCancel}>
            取消
          </button>
          <button
            className="ams-clean-save"
            style={{ background: '#ef4444' }}
            onClick={onConfirm}
          >
            确认删除
          </button>
        </div>
      </div>
    </div>
  );
}
