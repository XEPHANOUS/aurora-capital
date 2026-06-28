import { useEffect, useMemo, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import type { Agent, AgentType, LLMModel, LLMProvider } from '@/lib/types';
import type { PlatformConfig, PlatformConnectionStatus } from '@/lib/platformConfig';

interface LlmSettingsSectionProps {
  agents: Agent[];
  platformConfig: PlatformConfig;
  onUpdateAgent: (agentId: string, updates: Partial<Agent>) => void;
  onPlatformConfigChange: (updater: (current: PlatformConfig) => PlatformConfig) => void;
}

const SUPPORTED_MODELS: Record<LLMProvider, LLMModel[]> = {
  openai: ['gpt-4o', 'gpt-4o-mini', 'gpt-4-turbo', 'custom'],
  anthropic: ['claude-3-opus', 'claude-3-sonnet', 'claude-3-haiku', 'custom'],
  ollama: ['llama-3-70b', 'llama-3-8b', 'mistral-large', 'mixtral-8x7b', 'qwen3-14b-gguf', 'custom'],
  lmstudio: ['llama-3-70b', 'llama-3-8b', 'mistral-large', 'mixtral-8x7b', 'qwen3-14b-safetensors', 'custom'],
  local: ['qwen3-14b-gguf', 'qwen3-14b-safetensors', 'custom'],
};

function statusClass(status: PlatformConnectionStatus): string {
  if (status === 'connected') return 'border-accent text-accent';
  if (status === 'error') return 'border-destructive text-destructive';
  return 'border-muted-foreground text-muted-foreground';
}

function statusLabel(status: PlatformConnectionStatus): string {
  if (status === 'connected') return 'Connected';
  if (status === 'error') return 'Error';
  return 'Disconnected';
}

function resolveLlmHealth(config: PlatformConfig, visibleProviders?: LLMProvider[]): PlatformConnectionStatus {
  const providers = (visibleProviders && visibleProviders.length > 0
    ? visibleProviders.map((provider) => config.llmsConfig.providers[provider])
    : Object.values(config.llmsConfig.providers));
  if (providers.some((provider) => provider.status === 'connected')) return 'connected';
  if (providers.some((provider) => provider.status === 'error')) return 'error';
  return 'disconnected';
}

export function LlmSettingsSection({ agents, platformConfig, onUpdateAgent, onPlatformConfigChange }: LlmSettingsSectionProps) {
  const [testingProvider, setTestingProvider] = useState<LLMProvider | null>(null);
  const [localConfigMessage, setLocalConfigMessage] = useState<string | null>(null);
  const [selectedProviderToAdd, setSelectedProviderToAdd] = useState<LLMProvider>('openai');
  const [visibleProviders, setVisibleProviders] = useState<LLMProvider[]>([]);

  useEffect(() => {
    const configuredProviders = (Object.keys(platformConfig.llmsConfig.providers) as LLMProvider[]).filter((provider) => {
      const row = platformConfig.llmsConfig.providers[provider];

      if (row.status !== 'disconnected') return true;
      if (row.enabled) return true;
      if (row.apiKey.trim()) return true;
      if (provider !== 'local' && row.baseUrl.trim() && !row.baseUrl.includes('localhost')) return true;
      if (provider === 'local' && (row.localModelFiles?.length ?? 0) > 0) return true;
      if (provider === 'local' && row.localConfigFileName) return true;

      return false;
    });

    setVisibleProviders((prev) => Array.from(new Set([...prev, ...configuredProviders])));
  }, [platformConfig.llmsConfig.providers]);

  const availableProviders = (Object.keys(platformConfig.llmsConfig.providers) as LLMProvider[]).filter(
    (provider) => !visibleProviders.includes(provider),
  );

  useEffect(() => {
    if (availableProviders.length === 0) return;
    if (!availableProviders.includes(selectedProviderToAdd)) {
      setSelectedProviderToAdd(availableProviders[0]);
    }
  }, [availableProviders, selectedProviderToAdd]);

  const addProviderCard = () => {
    if (visibleProviders.includes(selectedProviderToAdd)) return;
    setVisibleProviders((prev) => [...prev, selectedProviderToAdd]);
  };

  const removeProviderCard = (provider: LLMProvider) => {
    setVisibleProviders((prev) => prev.filter((item) => item !== provider));
  };

  const llmAgents = useMemo(
    () => agents.filter((agent) => agent.agentType === 'llm' || agent.agentType === 'hybrid'),
    [agents]
  );

  const updateProviderField = (provider: LLMProvider, field: 'apiKey' | 'baseUrl', value: string) => {
    onPlatformConfigChange((current) => ({
      ...current,
      updatedAt: new Date().toISOString(),
      llmsConfig: {
        ...current.llmsConfig,
        providers: {
          ...current.llmsConfig.providers,
          [provider]: {
            ...current.llmsConfig.providers[provider],
            [field]: value,
          },
        },
      },
    }));
  };

  const toggleProvider = (provider: LLMProvider) => {
    onPlatformConfigChange((current) => ({
      ...current,
      updatedAt: new Date().toISOString(),
      llmsConfig: {
        ...current.llmsConfig,
        providers: {
          ...current.llmsConfig.providers,
          [provider]: {
            ...current.llmsConfig.providers[provider],
            enabled: !current.llmsConfig.providers[provider].enabled,
          },
        },
      },
    }));
  };

  const setDefaultProvider = (provider: LLMProvider) => {
    onPlatformConfigChange((current) => ({
      ...current,
      updatedAt: new Date().toISOString(),
      llmsConfig: {
        ...current.llmsConfig,
        defaultProvider: provider,
      },
    }));
  };

  const setDefaultModel = (model: LLMModel) => {
    onPlatformConfigChange((current) => ({
      ...current,
      updatedAt: new Date().toISOString(),
      llmsConfig: {
        ...current.llmsConfig,
        defaultModel: model,
      },
    }));
  };

  const setAssignmentMode = (mode: 'global' | 'per-agent') => {
    onPlatformConfigChange((current) => ({
      ...current,
      updatedAt: new Date().toISOString(),
      llmsConfig: {
        ...current.llmsConfig,
        assignmentMode: mode,
      },
    }));
  };

  const applyDefaultModelToAll = () => {
    const { defaultProvider, defaultModel } = platformConfig.llmsConfig;

    llmAgents.forEach((agent) => {
      const currentConfig = agent.modelConfig;
      onUpdateAgent(agent.id, {
        modelConfig: {
          provider: defaultProvider,
          model: defaultModel,
          temperature: currentConfig?.temperature ?? 0.6,
          contextSize: currentConfig?.contextSize ?? 8192,
          maxTokens: currentConfig?.maxTokens,
        },
      });
    });
  };

  const testProvider = async (provider: LLMProvider) => {
    if (testingProvider) return;
    setTestingProvider(provider);

    try {
      const providerConfig = platformConfig.llmsConfig.providers[provider];
      const endpoint = `${providerConfig.baseUrl.replace(/\/$/, '')}/models`;
      const headers: Record<string, string> = { Accept: 'application/json' };

      if (providerConfig.apiKey.trim()) {
        headers.Authorization = `Bearer ${providerConfig.apiKey.trim()}`;
      }

      const response = await fetch(endpoint, { method: 'GET', headers });
      if (!response.ok) {
        throw new Error(`Provider respondio con status ${response.status}`);
      }

      onPlatformConfigChange((current) => ({
        ...current,
        updatedAt: new Date().toISOString(),
        health: {
          ...current.health,
          llms: {
            status: resolveLlmHealth(current),
            detail: `Provider ${provider} validado correctamente`,
            lastCheckAt: new Date().toISOString(),
          },
        },
        llmsConfig: {
          ...current.llmsConfig,
          providers: {
            ...current.llmsConfig.providers,
            [provider]: {
              ...current.llmsConfig.providers[provider],
              status: 'connected',
              lastCheckedAt: new Date().toISOString(),
              lastError: undefined,
            },
          },
        },
      }));
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Fallo desconocido';
      onPlatformConfigChange((current) => ({
        ...current,
        updatedAt: new Date().toISOString(),
        health: {
          ...current.health,
          llms: {
            status: 'error',
            detail: `Error al validar provider ${provider}`,
            lastCheckAt: new Date().toISOString(),
          },
        },
        llmsConfig: {
          ...current.llmsConfig,
          providers: {
            ...current.llmsConfig.providers,
            [provider]: {
              ...current.llmsConfig.providers[provider],
              status: 'error',
              lastCheckedAt: new Date().toISOString(),
              lastError: message,
            },
          },
        },
      }));
    } finally {
      setTestingProvider(null);
    }
  };

  const updateAgentModel = (agentId: AgentType, provider: LLMProvider, model: LLMModel) => {
    const agent = agents.find((item) => item.id === agentId);
    const currentConfig = agent?.modelConfig;

    onUpdateAgent(agentId, {
      modelConfig: {
        provider,
        model,
        temperature: currentConfig?.temperature ?? 0.6,
        contextSize: currentConfig?.contextSize ?? 8192,
        maxTokens: currentConfig?.maxTokens,
      },
    });
  };

  const isLlmModel = (value: unknown): value is LLMModel => {
    return (
      value === 'gpt-4o' ||
      value === 'gpt-4o-mini' ||
      value === 'gpt-4-turbo' ||
      value === 'claude-3-opus' ||
      value === 'claude-3-sonnet' ||
      value === 'claude-3-haiku' ||
      value === 'llama-3-70b' ||
      value === 'llama-3-8b' ||
      value === 'mistral-large' ||
      value === 'mixtral-8x7b' ||
      value === 'qwen3-14b-gguf' ||
      value === 'qwen3-14b-safetensors' ||
      value === 'custom'
    );
  };

  const handleLocalConfigFile = async (file: File | null) => {
    if (!file) return;

    try {
      const content = await file.text();
      const parsed = JSON.parse(content) as {
        baseUrl?: string;
        apiKey?: string;
        model?: string;
      };

      const fileBaseUrl = typeof parsed.baseUrl === 'string' && parsed.baseUrl.trim().length > 0
        ? parsed.baseUrl.trim()
        : undefined;
      const fileApiKey = typeof parsed.apiKey === 'string' ? parsed.apiKey : undefined;
      const fileModel = parsed.model;

      onPlatformConfigChange((current) => {
        const nextModel = isLlmModel(fileModel) ? fileModel : current.llmsConfig.defaultModel;

        return {
          ...current,
          updatedAt: new Date().toISOString(),
          llmsConfig: {
            ...current.llmsConfig,
            defaultProvider: 'local',
            defaultModel: nextModel,
            providers: {
              ...current.llmsConfig.providers,
              local: {
                ...current.llmsConfig.providers.local,
                enabled: true,
                baseUrl: fileBaseUrl ?? current.llmsConfig.providers.local.baseUrl,
                apiKey: fileApiKey ?? current.llmsConfig.providers.local.apiKey,
                status: 'disconnected',
                lastError: undefined,
                localConfigFileName: file.name,
                localConfigLoadedAt: new Date().toISOString(),
              },
            },
          },
        };
      });

      setLocalConfigMessage(`Archivo cargado: ${file.name}`);
    } catch (error) {
      setLocalConfigMessage(error instanceof Error ? `Error al cargar archivo: ${error.message}` : 'Error al cargar archivo local');
    }
  };

  const resolveLocalModelFormat = (name: string): NonNullable<PlatformConfig['llmsConfig']['providers']['local']['localModelFormat']> => {
    const lower = name.toLowerCase();
    if (lower.endsWith('.gguf')) return 'gguf';
    if (lower.endsWith('.safetensors')) return 'safetensors';
    if (lower.endsWith('.onnx')) return 'onnx';
    if (lower.endsWith('.pt') || lower.endsWith('.pth')) return 'pt';
    if (lower.endsWith('.bin')) return 'bin';
    if (lower.endsWith('.json')) return 'json';
    return 'unknown';
  };

  const handleLocalModelFiles = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    const list = Array.from(files);
    const first = list[0];
    const format = resolveLocalModelFormat(first.name);
    const loadedAt = new Date().toISOString();

    // Compatibility mode: if single JSON is provided, parse as provider config payload.
    if (list.length === 1 && format === 'json') {
      await handleLocalConfigFile(first);
      return;
    }

    onPlatformConfigChange((current) => ({
      ...current,
      updatedAt: loadedAt,
      llmsConfig: {
        ...current.llmsConfig,
        defaultProvider: 'local',
        defaultModel: 'custom',
        providers: {
          ...current.llmsConfig.providers,
          local: {
            ...current.llmsConfig.providers.local,
            enabled: true,
            status: 'disconnected',
            lastError: undefined,
            localModelFormat: format,
            localConfigFileName: first.name,
            localConfigLoadedAt: loadedAt,
            localModelFiles: list.map((file) => ({
              name: file.name,
              sizeBytes: file.size,
              mimeType: file.type || undefined,
              loadedAt,
            })),
          },
        },
      },
    }));

    const totalBytes = list.reduce((sum, file) => sum + file.size, 0);
    const totalGb = (totalBytes / (1024 ** 3)).toFixed(2);
    const shardNote = format === 'safetensors' && list.length > 1 ? ' (shards detectados)' : '';
    setLocalConfigMessage(`Modelo local cargado: ${list.length} archivo(s), ${totalGb} GB, formato ${format}${shardNote}.`);
  };

  return (
    <div className="space-y-6">
      <div className="pb-2">
        <h3 className="font-heading font-bold text-2xl sm:text-3xl mb-2 tracking-tight">LLMs</h3>
        <p className="text-sm text-muted-foreground/80">
          Configuracion por proveedor y asignacion de modelos por agente para preparacion de IA real.
        </p>
      </div>

      <Card className="p-5 bg-card/50 backdrop-blur-sm border-border/50">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h4 className="font-heading font-semibold text-base">Estado Global LLMs</h4>
            <p className="text-xs text-muted-foreground mt-1">Gestiona proveedores desde Agregar proveedor y valida conexion real.</p>
          </div>
          <Badge variant="outline" className={statusClass(resolveLlmHealth(platformConfig, visibleProviders))}>
            {statusLabel(resolveLlmHealth(platformConfig, visibleProviders))}
          </Badge>
        </div>

        <Separator className="my-4" />

        <div className="space-y-2 mb-4">
          <Label>Modo de asignacion</Label>
          <div className="flex flex-wrap gap-2">
            <Button
              variant={platformConfig.llmsConfig.assignmentMode === 'global' ? 'default' : 'outline'}
              onClick={() => setAssignmentMode('global')}
              size="sm"
            >
              Modelo global compartido
            </Button>
            <Button
              variant={platformConfig.llmsConfig.assignmentMode === 'per-agent' ? 'default' : 'outline'}
              onClick={() => setAssignmentMode('per-agent')}
              size="sm"
            >
              Modelo individual por agente
            </Button>
          </div>
          <p className="text-xs text-muted-foreground">
            Cambia dinamicamente entre modelo unico o configuracion por agente.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="llm-default-provider">Provider por defecto</Label>
            <select
              id="llm-default-provider"
              className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm"
              value={platformConfig.llmsConfig.defaultProvider}
              onChange={(event) => setDefaultProvider(event.target.value as LLMProvider)}
            >
              <option value="openai">OpenAI</option>
              <option value="anthropic">Anthropic</option>
              <option value="ollama">Ollama</option>
              <option value="lmstudio">LM Studio</option>
              <option value="local">Local</option>
            </select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="llm-default-model">Modelo por defecto</Label>
            <select
              id="llm-default-model"
              className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm"
              value={platformConfig.llmsConfig.defaultModel}
              onChange={(event) => setDefaultModel(event.target.value as LLMModel)}
            >
              {SUPPORTED_MODELS[platformConfig.llmsConfig.defaultProvider].map((model) => (
                <option key={model} value={model}>{model}</option>
              ))}
            </select>
          </div>
        </div>

        <Button className="mt-4" variant="outline" onClick={applyDefaultModelToAll}>
          Aplicar defaults a todos los agentes IA
        </Button>

        <Separator className="my-4" />

        <div className="flex flex-col sm:flex-row gap-3">
          <div className="flex-1">
            <Select value={selectedProviderToAdd} onValueChange={(value) => setSelectedProviderToAdd(value as LLMProvider)}>
              <SelectTrigger>
                <SelectValue placeholder="Selecciona proveedor LLM" />
              </SelectTrigger>
              <SelectContent>
                {availableProviders.length === 0 ? (
                  <SelectItem value="none" disabled>Todos los proveedores disponibles ya fueron agregados</SelectItem>
                ) : (
                  availableProviders.map((provider) => (
                    <SelectItem key={provider} value={provider}>{provider.toUpperCase()}</SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
          </div>
          <Button onClick={addProviderCard} disabled={availableProviders.length === 0}>
            Agregar proveedor
          </Button>
        </div>
      </Card>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 sm:gap-6">
        {visibleProviders.map((provider) => {
          const providerConfig = platformConfig.llmsConfig.providers[provider];

          return (
            <Card key={provider} className="p-4 sm:p-6 bg-card/50 backdrop-blur-sm border-border/50">
              <div className="flex items-start justify-between gap-3 mb-5">
                <div>
                  <h4 className="font-heading font-semibold text-sm sm:text-base tracking-wide text-foreground/90 uppercase">{provider}</h4>
                  <p className="text-xs text-muted-foreground mt-1">Conector y endpoint del proveedor.</p>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className={statusClass(providerConfig.status)}>
                    {statusLabel(providerConfig.status)}
                  </Badge>
                  <Button variant="outline" size="sm" onClick={() => removeProviderCard(provider)}>
                    Quitar
                  </Button>
                </div>
              </div>

              <div className="space-y-4">
                {provider === 'local' ? (
                  <>
                    <div className="space-y-2">
                      <Label htmlFor="llm-local-file">Archivo(s) de modelo local (GGUF, Safetensors, etc.)</Label>
                      <Input
                        id="llm-local-file"
                        type="file"
                        accept=".gguf,.safetensors,.onnx,.pt,.pth,.bin,.json,application/json"
                        multiple
                        onChange={(event) => {
                          void handleLocalModelFiles(event.target.files);
                        }}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor={`llm-url-${provider}`}>Base URL (autocargada o manual)</Label>
                      <Input
                        id={`llm-url-${provider}`}
                        value={providerConfig.baseUrl}
                        onChange={(event) => updateProviderField(provider, 'baseUrl', event.target.value)}
                        placeholder="http://localhost:8080/v1"
                      />
                    </div>

                    {providerConfig.localConfigFileName && (
                      <p className="text-xs text-muted-foreground">
                        Archivo actual: {providerConfig.localConfigFileName}
                        {providerConfig.localConfigLoadedAt ? ` · ${new Date(providerConfig.localConfigLoadedAt).toLocaleString('es-ES')}` : ''}
                      </p>
                    )}

                    {providerConfig.localModelFormat && (
                      <p className="text-xs text-muted-foreground">
                        Formato detectado: {providerConfig.localModelFormat}
                      </p>
                    )}

                    {providerConfig.localModelFiles && providerConfig.localModelFiles.length > 0 && (
                      <div className="space-y-1 p-2 rounded-md bg-background/50 border border-border/50">
                        <p className="text-xs font-semibold text-muted-foreground">
                          Archivos cargados: {providerConfig.localModelFiles.length}
                        </p>
                        <div className="max-h-24 overflow-y-auto space-y-1">
                          {providerConfig.localModelFiles.slice(0, 12).map((file, index) => (
                            <p key={`${file.name}-${index}`} className="text-[11px] text-muted-foreground truncate">
                              {file.name} · {(file.sizeBytes / (1024 ** 2)).toFixed(1)} MB
                            </p>
                          ))}
                          {providerConfig.localModelFiles.length > 12 && (
                            <p className="text-[11px] text-muted-foreground">
                              +{providerConfig.localModelFiles.length - 12} archivo(s) mas...
                            </p>
                          )}
                        </div>
                      </div>
                    )}

                    {localConfigMessage && (
                      <p className="text-xs text-muted-foreground">{localConfigMessage}</p>
                    )}
                  </>
                ) : (
                  <>
                    <div className="space-y-2">
                      <Label htmlFor={`llm-key-${provider}`}>API Key</Label>
                      <Input
                        id={`llm-key-${provider}`}
                        type="password"
                        value={providerConfig.apiKey}
                        onChange={(event) => updateProviderField(provider, 'apiKey', event.target.value)}
                        placeholder="Ingresa API Key"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor={`llm-url-${provider}`}>Base URL</Label>
                      <Input
                        id={`llm-url-${provider}`}
                        value={providerConfig.baseUrl}
                        onChange={(event) => updateProviderField(provider, 'baseUrl', event.target.value)}
                        placeholder="https://..."
                      />
                    </div>
                  </>
                )}

                <div className="flex flex-wrap gap-2">
                  <Button size="sm" variant={providerConfig.enabled ? 'outline' : 'default'} onClick={() => toggleProvider(provider)}>
                    {providerConfig.enabled ? 'Desactivar' : 'Activar'}
                  </Button>
                  <Button size="sm" onClick={() => void testProvider(provider)} disabled={testingProvider === provider}>
                    {testingProvider === provider ? 'Testeando...' : 'Test provider'}
                  </Button>
                </div>

                {providerConfig.lastError && (
                  <p className="text-xs text-destructive">Error: {providerConfig.lastError}</p>
                )}
              </div>
            </Card>
          );
        })}

        {visibleProviders.length === 0 && (
          <Card className="p-6 bg-card/50 backdrop-blur-sm border-border/50">
            <p className="text-sm text-muted-foreground">
              No hay proveedores LLM agregados. Usa Agregar proveedor para crear una tarjeta de configuracion.
            </p>
          </Card>
        )}
      </div>

      <Card className="p-5 bg-card/50 backdrop-blur-sm border-border/50">
        <h4 className="font-heading font-semibold text-base mb-4">Asignacion de Modelo por Agente</h4>

        {visibleProviders.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            Agrega al menos un proveedor arriba para habilitar la asignacion de modelo por agente.
          </p>
        ) : (
          <div className="space-y-3">
            {llmAgents.map((agent) => {
              const currentProvider = agent.modelConfig?.provider ?? platformConfig.llmsConfig.defaultProvider;
              const provider = visibleProviders.includes(currentProvider) ? currentProvider : visibleProviders[0];
              const modelCandidates = SUPPORTED_MODELS[provider] ?? ['custom'];
              const currentModel = agent.modelConfig?.model ?? platformConfig.llmsConfig.defaultModel;
              const model = modelCandidates.includes(currentModel) ? currentModel : modelCandidates[0];

              return (
                <div key={agent.id} className="grid grid-cols-1 md:grid-cols-[180px_1fr_1fr] gap-3 p-3 rounded-lg bg-background/50 border border-border/50">
                  <div className="text-sm font-semibold flex items-center">{agent.name}</div>

                  <select
                    className="h-10 rounded-md border border-input bg-background px-3 text-sm"
                    value={provider}
                    onChange={(event) => {
                      const nextProvider = event.target.value as LLMProvider;
                      const nextCandidates = SUPPORTED_MODELS[nextProvider] ?? ['custom'];
                      const nextModel = nextCandidates.includes(model) ? model : nextCandidates[0];
                      updateAgentModel(agent.id, nextProvider, nextModel);
                    }}
                  >
                    {visibleProviders.map((candidateProvider) => (
                      <option key={candidateProvider} value={candidateProvider}>
                        {candidateProvider === 'openai' ? 'OpenAI' :
                          candidateProvider === 'anthropic' ? 'Anthropic' :
                          candidateProvider === 'ollama' ? 'Ollama' :
                          candidateProvider === 'lmstudio' ? 'LM Studio' : 'Local'}
                      </option>
                    ))}
                  </select>

                  <select
                    className="h-10 rounded-md border border-input bg-background px-3 text-sm"
                    value={model}
                    onChange={(event) => updateAgentModel(agent.id, provider, event.target.value as LLMModel)}
                  >
                    {modelCandidates.map((candidateModel) => (
                      <option key={candidateModel} value={candidateModel}>{candidateModel}</option>
                    ))}
                  </select>
                </div>
              );
            })}
          </div>
        )}
      </Card>
    </div>
  );
}
