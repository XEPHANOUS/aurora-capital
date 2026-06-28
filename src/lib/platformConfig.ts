import type { EnvironmentType, LLMProvider, LLMModel, ModelAssignmentMode } from '@/lib/types';

export type PlatformModuleCategory = 'apis' | 'llms' | 'environments' | 'security' | 'backups';

export type PlatformConnectionStatus = 'connected' | 'disconnected' | 'error';

export interface PlatformFeatureFlags {
  apis: boolean;
  llms: boolean;
  environments: boolean;
  security: boolean;
  backups: boolean;
}

export interface PlatformModuleHealth {
  status: PlatformConnectionStatus;
  lastCheckAt?: string;
  detail?: string;
}

export interface PlatformHealth {
  apis: PlatformModuleHealth;
  llms: PlatformModuleHealth;
  environments: PlatformModuleHealth;
  security: PlatformModuleHealth;
  backups: PlatformModuleHealth;
}

export interface PlatformCompatibility {
  runtimeCore: boolean;
  telegram: boolean;
  consensusEngine: boolean;
  organizationProfiles: boolean;
  agentCollaboration: boolean;
}

export interface CoinMarketProApiConfig {
  apiKey: string;
  baseUrl: string;
  status: PlatformConnectionStatus;
  creditsAvailable?: number;
  lastCheckedAt?: string;
  lastError?: string;
}

export interface AlpacaPaperApiConfig {
  apiKey: string;
  secretKey: string;
  baseUrl: string;
  status: PlatformConnectionStatus;
  lastCheckedAt?: string;
  lastError?: string;
}

export interface PlatformApisConfig {
  coinmarketpro: CoinMarketProApiConfig;
  alpacaPaper: AlpacaPaperApiConfig;
}

export interface LlmProviderConfig {
  enabled: boolean;
  apiKey: string;
  baseUrl: string;
  status: PlatformConnectionStatus;
  lastCheckedAt?: string;
  lastError?: string;
  localConfigFileName?: string;
  localConfigLoadedAt?: string;
  localModelFormat?: 'gguf' | 'safetensors' | 'onnx' | 'pt' | 'bin' | 'json' | 'unknown';
  localModelFiles?: Array<{
    name: string;
    sizeBytes: number;
    mimeType?: string;
    loadedAt: string;
  }>;
}

export interface PlatformLlmsConfig {
  assignmentMode: ModelAssignmentMode;
  defaultProvider: LLMProvider;
  defaultModel: LLMModel;
  providers: Record<LLMProvider, LlmProviderConfig>;
}

export type EnvironmentExecutionProvider =
  | 'sandbox-provider'
  | 'demo-provider'
  | 'alpaca-paper-provider'
  | 'broker-provider';

export interface EnvironmentProviderConfig {
  enabled: boolean;
  executionProvider: EnvironmentExecutionProvider;
}

export interface PlatformEnvironmentsConfig {
  activeEnvironment: EnvironmentType;
  sandbox: EnvironmentProviderConfig;
  demo: EnvironmentProviderConfig;
  paper: EnvironmentProviderConfig;
  real: EnvironmentProviderConfig;
}

export type AutoExecutionStatus = 'running' | 'paused' | 'stopped';

export type AutoExecutionLogAction = 'entry' | 'exit' | 'blocked';

export interface AutoExecutionEnvironmentConfig {
  status: AutoExecutionStatus;
}

export interface AutoExecutionLog {
  id: string;
  environment: EnvironmentType;
  asset: string;
  action: AutoExecutionLogAction;
  entryAmount: number;
  exitAmount?: number;
  pnlAmount?: number;
  reason: string;
  timestamp: string;
}

export interface PlatformAutoExecutionConfig {
  sandbox: AutoExecutionEnvironmentConfig;
  demo: AutoExecutionEnvironmentConfig;
  paper: AutoExecutionEnvironmentConfig;
  real: AutoExecutionEnvironmentConfig;
  logs: AutoExecutionLog[];
}

export type SecurityRole = 'admin' | 'operator' | 'viewer';

export type SecurityAuditEventType =
  | 'login'
  | 'config-change'
  | 'profile-change'
  | 'strategy-change'
  | 'kill-switch'
  | 'stop-auto-trading'
  | 'emergency-close';

export interface SecurityAuditEvent {
  id: string;
  type: SecurityAuditEventType;
  role: SecurityRole;
  actor: string;
  detail: string;
  timestamp: string;
}

export interface PlatformSecurityConfig {
  currentRole: SecurityRole;
  killSwitchEnabled: boolean;
  stopAutoTradingEnabled: boolean;
  auditEvents: SecurityAuditEvent[];
}

export interface PlatformConfig {
  schemaVersion: number;
  updatedAt: string;
  featureFlags: PlatformFeatureFlags;
  health: PlatformHealth;
  compatibility: PlatformCompatibility;
  apisConfig: PlatformApisConfig;
  llmsConfig: PlatformLlmsConfig;
  environmentsConfig: PlatformEnvironmentsConfig;
  autoExecution: PlatformAutoExecutionConfig;
  securityConfig: PlatformSecurityConfig;
}

export const PLATFORM_CONFIG_SCHEMA_VERSION = 1;

function defaultHealthEntry(status: PlatformConnectionStatus = 'disconnected'): PlatformModuleHealth {
  return {
    status,
  };
}

export function createDefaultPlatformConfig(): PlatformConfig {
  return {
    schemaVersion: PLATFORM_CONFIG_SCHEMA_VERSION,
    updatedAt: new Date().toISOString(),
    featureFlags: {
      apis: true,
      llms: true,
      environments: true,
      security: true,
      backups: true,
    },
    health: {
      apis: defaultHealthEntry(),
      llms: defaultHealthEntry(),
      environments: defaultHealthEntry(),
      security: defaultHealthEntry(),
      backups: defaultHealthEntry(),
    },
    compatibility: {
      runtimeCore: true,
      telegram: true,
      consensusEngine: true,
      organizationProfiles: true,
      agentCollaboration: true,
    },
    apisConfig: {
      coinmarketpro: {
        apiKey: '',
        baseUrl: 'https://pro-api.coinmarketcap.com',
        status: 'disconnected',
      },
      alpacaPaper: {
        apiKey: '',
        secretKey: '',
        baseUrl: 'https://paper-api.alpaca.markets',
        status: 'disconnected',
      },
    },
    llmsConfig: {
      assignmentMode: 'global',
      defaultProvider: 'openai',
      defaultModel: 'gpt-4o-mini',
      providers: {
        openai: {
          enabled: true,
          apiKey: '',
          baseUrl: 'https://api.openai.com/v1',
          status: 'disconnected',
        },
        anthropic: {
          enabled: true,
          apiKey: '',
          baseUrl: 'https://api.anthropic.com/v1',
          status: 'disconnected',
        },
        ollama: {
          enabled: false,
          apiKey: '',
          baseUrl: 'http://localhost:11434',
          status: 'disconnected',
        },
        lmstudio: {
          enabled: false,
          apiKey: '',
          baseUrl: 'http://localhost:1234/v1',
          status: 'disconnected',
        },
        local: {
          enabled: false,
          apiKey: '',
          baseUrl: 'http://localhost:8080/v1',
          status: 'disconnected',
        },
      },
    },
    environmentsConfig: {
      activeEnvironment: 'sandbox',
      sandbox: {
        enabled: true,
        executionProvider: 'sandbox-provider',
      },
      demo: {
        enabled: true,
        executionProvider: 'demo-provider',
      },
      paper: {
        enabled: true,
        executionProvider: 'alpaca-paper-provider',
      },
      real: {
        enabled: false,
        executionProvider: 'broker-provider',
      },
    },
    autoExecution: {
      sandbox: { status: 'stopped' },
      demo: { status: 'stopped' },
      paper: { status: 'stopped' },
      real: { status: 'stopped' },
      logs: [],
    },
    securityConfig: {
      currentRole: 'admin',
      killSwitchEnabled: false,
      stopAutoTradingEnabled: false,
      auditEvents: [],
    },
  };
}

function asRecord(value: unknown): Record<string, unknown> {
  return typeof value === 'object' && value !== null ? (value as Record<string, unknown>) : {};
}

function normalizeStatus(status: unknown): PlatformConnectionStatus {
  if (status === 'connected' || status === 'disconnected' || status === 'error') {
    return status;
  }
  return 'disconnected';
}

function normalizeLlmProvider(value: unknown): LLMProvider {
  if (value === 'openai' || value === 'anthropic' || value === 'ollama' || value === 'lmstudio' || value === 'local') {
    return value;
  }
  return 'openai';
}

function normalizeLlmModel(value: unknown): LLMModel {
  if (
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
  ) {
    return value;
  }
  return 'gpt-4o-mini';
}

function normalizeModelAssignmentMode(value: unknown): ModelAssignmentMode {
  if (value === 'global' || value === 'per-agent') {
    return value;
  }
  return 'global';
}

function normalizeLlmProviderConfig(value: unknown, fallback: LlmProviderConfig): LlmProviderConfig {
  const record = asRecord(value);
  const localModelFiles = Array.isArray(record.localModelFiles)
    ? record.localModelFiles
        .map((item) => {
          const row = asRecord(item);
          if (typeof row.name !== 'string') return null;
          const sizeBytes = typeof row.sizeBytes === 'number' ? row.sizeBytes : Number.NaN;
          if (!Number.isFinite(sizeBytes)) return null;
          return {
            name: row.name,
            sizeBytes,
            mimeType: typeof row.mimeType === 'string' ? row.mimeType : undefined,
            loadedAt: typeof row.loadedAt === 'string' ? row.loadedAt : new Date().toISOString(),
          };
        })
        .filter((item): item is NonNullable<LlmProviderConfig['localModelFiles']>[number] => Boolean(item))
    : fallback.localModelFiles;

  const localModelFormat =
    record.localModelFormat === 'gguf' ||
    record.localModelFormat === 'safetensors' ||
    record.localModelFormat === 'onnx' ||
    record.localModelFormat === 'pt' ||
    record.localModelFormat === 'bin' ||
    record.localModelFormat === 'json' ||
    record.localModelFormat === 'unknown'
      ? record.localModelFormat
      : fallback.localModelFormat;

  return {
    enabled: typeof record.enabled === 'boolean' ? record.enabled : fallback.enabled,
    apiKey: typeof record.apiKey === 'string' ? record.apiKey : fallback.apiKey,
    baseUrl: typeof record.baseUrl === 'string' ? record.baseUrl : fallback.baseUrl,
    status: normalizeStatus(record.status),
    lastCheckedAt: typeof record.lastCheckedAt === 'string' ? record.lastCheckedAt : fallback.lastCheckedAt,
    lastError: typeof record.lastError === 'string' ? record.lastError : fallback.lastError,
    localConfigFileName:
      typeof record.localConfigFileName === 'string' ? record.localConfigFileName : fallback.localConfigFileName,
    localConfigLoadedAt:
      typeof record.localConfigLoadedAt === 'string' ? record.localConfigLoadedAt : fallback.localConfigLoadedAt,
    localModelFormat,
    localModelFiles,
  };
}

function normalizeEnvironmentProvider(value: unknown): EnvironmentExecutionProvider {
  if (
    value === 'sandbox-provider' ||
    value === 'demo-provider' ||
    value === 'alpaca-paper-provider' ||
    value === 'broker-provider'
  ) {
    return value;
  }
  return 'sandbox-provider';
}

function normalizeAutoExecutionStatus(value: unknown): AutoExecutionStatus {
  if (value === 'running' || value === 'paused' || value === 'stopped') {
    return value;
  }
  return 'stopped';
}

function normalizeAutoExecutionLog(value: unknown): AutoExecutionLog | null {
  const record = asRecord(value);
  const environment = record.environment;
  if (environment !== 'sandbox' && environment !== 'demo' && environment !== 'paper' && environment !== 'real') {
    return null;
  }

  const action = record.action;
  if (action !== 'entry' && action !== 'exit' && action !== 'blocked') {
    return null;
  }

  if (typeof record.id !== 'string' || typeof record.asset !== 'string' || typeof record.reason !== 'string' || typeof record.timestamp !== 'string') {
    return null;
  }

  const entryAmount = typeof record.entryAmount === 'number' ? record.entryAmount : Number.NaN;
  if (!Number.isFinite(entryAmount)) {
    return null;
  }

  return {
    id: record.id,
    environment,
    asset: record.asset,
    action,
    entryAmount,
    exitAmount: typeof record.exitAmount === 'number' ? record.exitAmount : undefined,
    pnlAmount: typeof record.pnlAmount === 'number' ? record.pnlAmount : undefined,
    reason: record.reason,
    timestamp: record.timestamp,
  };
}

function normalizeSecurityRole(value: unknown): SecurityRole {
  if (value === 'admin' || value === 'operator' || value === 'viewer') {
    return value;
  }
  return 'viewer';
}

function normalizeSecurityAuditEvent(value: unknown): SecurityAuditEvent | null {
  const record = asRecord(value);
  const type = record.type;
  if (
    type !== 'login' &&
    type !== 'config-change' &&
    type !== 'profile-change' &&
    type !== 'strategy-change' &&
    type !== 'kill-switch' &&
    type !== 'stop-auto-trading' &&
    type !== 'emergency-close'
  ) {
    return null;
  }

  if (
    typeof record.id !== 'string' ||
    typeof record.actor !== 'string' ||
    typeof record.detail !== 'string' ||
    typeof record.timestamp !== 'string'
  ) {
    return null;
  }

  return {
    id: record.id,
    type,
    role: normalizeSecurityRole(record.role),
    actor: record.actor,
    detail: record.detail,
    timestamp: record.timestamp,
  };
}

function normalizeHealthEntry(value: unknown, fallback: PlatformModuleHealth): PlatformModuleHealth {
  const record = asRecord(value);
  return {
    status: normalizeStatus(record.status),
    lastCheckAt: typeof record.lastCheckAt === 'string' ? record.lastCheckAt : fallback.lastCheckAt,
    detail: typeof record.detail === 'string' ? record.detail : fallback.detail,
  };
}

export function migratePlatformConfig(value: unknown): PlatformConfig {
  const defaults = createDefaultPlatformConfig();
  const record = asRecord(value);

  const featureFlagsRecord = asRecord(record.featureFlags);
  const healthRecord = asRecord(record.health);
  const compatibilityRecord = asRecord(record.compatibility);
  const apisConfigRecord = asRecord(record.apisConfig);
  const llmsConfigRecord = asRecord(record.llmsConfig);
  const llmProvidersRecord = asRecord(llmsConfigRecord.providers);
  const coinMarketProRecord = asRecord(apisConfigRecord.coinmarketpro);
  const coinGeckoRecord = asRecord(apisConfigRecord.coingecko);
  const alpacaPaperRecord = asRecord(apisConfigRecord.alpacaPaper);
  const coinMarketCapRecord = asRecord(apisConfigRecord.coinmarketcap);
  const environmentsConfigRecord = asRecord(record.environmentsConfig);
  const sandboxEnvRecord = asRecord(environmentsConfigRecord.sandbox);
  const demoEnvRecord = asRecord(environmentsConfigRecord.demo);
  const paperEnvRecord = asRecord(environmentsConfigRecord.paper);
  const realEnvRecord = asRecord(environmentsConfigRecord.real);
  const autoExecutionRecord = asRecord(record.autoExecution);
  const autoExecutionSandboxRecord = asRecord(autoExecutionRecord.sandbox);
  const autoExecutionDemoRecord = asRecord(autoExecutionRecord.demo);
  const autoExecutionPaperRecord = asRecord(autoExecutionRecord.paper);
  const autoExecutionRealRecord = asRecord(autoExecutionRecord.real);
  const autoExecutionLogs = Array.isArray(autoExecutionRecord.logs)
    ? autoExecutionRecord.logs.map((item) => normalizeAutoExecutionLog(item)).filter((item): item is AutoExecutionLog => Boolean(item))
    : defaults.autoExecution.logs;
  const securityConfigRecord = asRecord(record.securityConfig);
  const securityAuditEvents = Array.isArray(securityConfigRecord.auditEvents)
    ? securityConfigRecord.auditEvents
        .map((item) => normalizeSecurityAuditEvent(item))
        .filter((item): item is SecurityAuditEvent => Boolean(item))
    : defaults.securityConfig.auditEvents;

  return {
    schemaVersion: PLATFORM_CONFIG_SCHEMA_VERSION,
    updatedAt: typeof record.updatedAt === 'string' ? record.updatedAt : defaults.updatedAt,
    featureFlags: {
      apis: typeof featureFlagsRecord.apis === 'boolean' ? featureFlagsRecord.apis : defaults.featureFlags.apis,
      llms: typeof featureFlagsRecord.llms === 'boolean' ? featureFlagsRecord.llms : defaults.featureFlags.llms,
      environments:
        typeof featureFlagsRecord.environments === 'boolean'
          ? featureFlagsRecord.environments
          : defaults.featureFlags.environments,
      security: typeof featureFlagsRecord.security === 'boolean' ? featureFlagsRecord.security : defaults.featureFlags.security,
      backups: typeof featureFlagsRecord.backups === 'boolean' ? featureFlagsRecord.backups : defaults.featureFlags.backups,
    },
    health: {
      apis: normalizeHealthEntry(healthRecord.apis, defaults.health.apis),
      llms: normalizeHealthEntry(healthRecord.llms, defaults.health.llms),
      environments: normalizeHealthEntry(healthRecord.environments, defaults.health.environments),
      security: normalizeHealthEntry(healthRecord.security, defaults.health.security),
      backups: normalizeHealthEntry(healthRecord.backups, defaults.health.backups),
    },
    compatibility: {
      runtimeCore:
        typeof compatibilityRecord.runtimeCore === 'boolean'
          ? compatibilityRecord.runtimeCore
          : defaults.compatibility.runtimeCore,
      telegram:
        typeof compatibilityRecord.telegram === 'boolean' ? compatibilityRecord.telegram : defaults.compatibility.telegram,
      consensusEngine:
        typeof compatibilityRecord.consensusEngine === 'boolean'
          ? compatibilityRecord.consensusEngine
          : defaults.compatibility.consensusEngine,
      organizationProfiles:
        typeof compatibilityRecord.organizationProfiles === 'boolean'
          ? compatibilityRecord.organizationProfiles
          : defaults.compatibility.organizationProfiles,
      agentCollaboration:
        typeof compatibilityRecord.agentCollaboration === 'boolean'
          ? compatibilityRecord.agentCollaboration
          : defaults.compatibility.agentCollaboration,
    },
    apisConfig: {
      coinmarketpro: {
        apiKey:
          typeof coinMarketProRecord.apiKey === 'string'
            ? coinMarketProRecord.apiKey
            : typeof coinMarketCapRecord.apiKey === 'string'
            ? coinMarketCapRecord.apiKey
            : typeof coinGeckoRecord.apiKey === 'string'
            ? coinGeckoRecord.apiKey
            : defaults.apisConfig.coinmarketpro.apiKey,
        baseUrl:
          typeof coinMarketProRecord.baseUrl === 'string'
            ? coinMarketProRecord.baseUrl
            : typeof coinMarketCapRecord.baseUrl === 'string'
            ? coinMarketCapRecord.baseUrl
            : defaults.apisConfig.coinmarketpro.baseUrl,
        status: normalizeStatus(
          coinMarketProRecord.status ?? coinMarketCapRecord.status ?? coinGeckoRecord.status,
        ),
        creditsAvailable:
          typeof coinMarketProRecord.creditsAvailable === 'number'
            ? coinMarketProRecord.creditsAvailable
            : typeof coinGeckoRecord.creditsAvailable === 'number'
            ? coinGeckoRecord.creditsAvailable
            : defaults.apisConfig.coinmarketpro.creditsAvailable,
        lastCheckedAt:
          typeof coinMarketProRecord.lastCheckedAt === 'string'
            ? coinMarketProRecord.lastCheckedAt
            : typeof coinMarketCapRecord.lastCheckedAt === 'string'
            ? coinMarketCapRecord.lastCheckedAt
            : typeof coinGeckoRecord.lastCheckedAt === 'string'
            ? coinGeckoRecord.lastCheckedAt
            : defaults.apisConfig.coinmarketpro.lastCheckedAt,
        lastError:
          typeof coinMarketProRecord.lastError === 'string'
            ? coinMarketProRecord.lastError
            : typeof coinMarketCapRecord.lastError === 'string'
            ? coinMarketCapRecord.lastError
            : typeof coinGeckoRecord.lastError === 'string'
            ? coinGeckoRecord.lastError
            : defaults.apisConfig.coinmarketpro.lastError,
      },
      alpacaPaper: {
        apiKey:
          typeof alpacaPaperRecord.apiKey === 'string' ? alpacaPaperRecord.apiKey : defaults.apisConfig.alpacaPaper.apiKey,
        secretKey:
          typeof alpacaPaperRecord.secretKey === 'string'
            ? alpacaPaperRecord.secretKey
            : defaults.apisConfig.alpacaPaper.secretKey,
        baseUrl:
          typeof alpacaPaperRecord.baseUrl === 'string'
            ? alpacaPaperRecord.baseUrl
            : defaults.apisConfig.alpacaPaper.baseUrl,
        status: normalizeStatus(alpacaPaperRecord.status),
        lastCheckedAt:
          typeof alpacaPaperRecord.lastCheckedAt === 'string'
            ? alpacaPaperRecord.lastCheckedAt
            : defaults.apisConfig.alpacaPaper.lastCheckedAt,
        lastError:
          typeof alpacaPaperRecord.lastError === 'string'
            ? alpacaPaperRecord.lastError
            : defaults.apisConfig.alpacaPaper.lastError,
      },
    },
    llmsConfig: {
      assignmentMode: normalizeModelAssignmentMode(llmsConfigRecord.assignmentMode),
      defaultProvider: normalizeLlmProvider(llmsConfigRecord.defaultProvider),
      defaultModel: normalizeLlmModel(llmsConfigRecord.defaultModel),
      providers: {
        openai: normalizeLlmProviderConfig(llmProvidersRecord.openai, defaults.llmsConfig.providers.openai),
        anthropic: normalizeLlmProviderConfig(llmProvidersRecord.anthropic, defaults.llmsConfig.providers.anthropic),
        ollama: normalizeLlmProviderConfig(llmProvidersRecord.ollama, defaults.llmsConfig.providers.ollama),
        lmstudio: normalizeLlmProviderConfig(llmProvidersRecord.lmstudio, defaults.llmsConfig.providers.lmstudio),
        local: normalizeLlmProviderConfig(llmProvidersRecord.local, defaults.llmsConfig.providers.local),
      },
    },
    environmentsConfig: {
      activeEnvironment:
        environmentsConfigRecord.activeEnvironment === 'sandbox' ||
        environmentsConfigRecord.activeEnvironment === 'demo' ||
        environmentsConfigRecord.activeEnvironment === 'paper' ||
        environmentsConfigRecord.activeEnvironment === 'real'
          ? environmentsConfigRecord.activeEnvironment
          : defaults.environmentsConfig.activeEnvironment,
      sandbox: {
        enabled:
          typeof sandboxEnvRecord.enabled === 'boolean'
            ? sandboxEnvRecord.enabled
            : defaults.environmentsConfig.sandbox.enabled,
        executionProvider:
          normalizeEnvironmentProvider(sandboxEnvRecord.executionProvider) ||
          defaults.environmentsConfig.sandbox.executionProvider,
      },
      demo: {
        enabled:
          typeof demoEnvRecord.enabled === 'boolean'
            ? demoEnvRecord.enabled
            : defaults.environmentsConfig.demo.enabled,
        executionProvider:
          normalizeEnvironmentProvider(demoEnvRecord.executionProvider) ||
          defaults.environmentsConfig.demo.executionProvider,
      },
      paper: {
        enabled:
          typeof paperEnvRecord.enabled === 'boolean'
            ? paperEnvRecord.enabled
            : defaults.environmentsConfig.paper.enabled,
        executionProvider:
          normalizeEnvironmentProvider(paperEnvRecord.executionProvider) ||
          defaults.environmentsConfig.paper.executionProvider,
      },
      real: {
        enabled:
          typeof realEnvRecord.enabled === 'boolean'
            ? realEnvRecord.enabled
            : defaults.environmentsConfig.real.enabled,
        executionProvider:
          normalizeEnvironmentProvider(realEnvRecord.executionProvider) ||
          defaults.environmentsConfig.real.executionProvider,
      },
    },
    autoExecution: {
      sandbox: {
        status:
          normalizeAutoExecutionStatus(autoExecutionSandboxRecord.status) ||
          defaults.autoExecution.sandbox.status,
      },
      demo: {
        status:
          normalizeAutoExecutionStatus(autoExecutionDemoRecord.status) ||
          defaults.autoExecution.demo.status,
      },
      paper: {
        status:
          normalizeAutoExecutionStatus(autoExecutionPaperRecord.status) ||
          defaults.autoExecution.paper.status,
      },
      real: {
        status:
          normalizeAutoExecutionStatus(autoExecutionRealRecord.status) ||
          defaults.autoExecution.real.status,
      },
      logs: autoExecutionLogs,
    },
    securityConfig: {
      currentRole:
        normalizeSecurityRole(securityConfigRecord.currentRole) || defaults.securityConfig.currentRole,
      killSwitchEnabled:
        typeof securityConfigRecord.killSwitchEnabled === 'boolean'
          ? securityConfigRecord.killSwitchEnabled
          : defaults.securityConfig.killSwitchEnabled,
      stopAutoTradingEnabled:
        typeof securityConfigRecord.stopAutoTradingEnabled === 'boolean'
          ? securityConfigRecord.stopAutoTradingEnabled
          : defaults.securityConfig.stopAutoTradingEnabled,
      auditEvents: securityAuditEvents,
    },
  };
}

export function updatePlatformHealth(
  config: PlatformConfig,
  module: PlatformModuleCategory,
  status: PlatformConnectionStatus,
  detail?: string,
): PlatformConfig {
  return {
    ...config,
    updatedAt: new Date().toISOString(),
    health: {
      ...config.health,
      [module]: {
        status,
        detail,
        lastCheckAt: new Date().toISOString(),
      },
    },
  };
}
