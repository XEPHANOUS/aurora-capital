import type { Agent, EnvironmentType, SystemConfig } from '@/lib/types';

export type RuntimeLifecycleStatus = 'stopped' | 'starting' | 'running' | 'stopping';

export interface RuntimeContextState {
  totalCapital: number;
  survivalReserve: number;
  operationalCapital: number;
  survivalReservePercent: number;
  activeEnvironment: EnvironmentType;
  environmentLabel: string;
  organizationProfile: string;
  organizationProfileLabel: string;
  strategyId: string;
  activeAgents: string[];
  agentReputations: Record<string, number>;
  systemStatus: 'optimal' | 'normal' | 'degraded' | 'alert';
  maxRiskPerOperation: number;
  dailyLossLimit: number;
  openProposalsCount: number;
}

export interface RuntimeOperationalConfig {
  simulationMode: boolean;
  notifications: SystemConfig['notifications'];
  telegramConnected: boolean;
  telegram?: {
    botToken?: string;
    allowedUserId?: number;
    mode: 'polling' | 'webhook';
    webhookUrl?: string;
    pollingEnabled: boolean;
    status: 'connected' | 'disconnected' | 'not-configured' | 'error';
    lastCheckAt?: string;
    lastError?: string;
    botId?: number;
    botName?: string;
    botUsername?: string;
  };
}

export interface RuntimeState {
  context: RuntimeContextState;
  operationalConfig: RuntimeOperationalConfig;
  agents: Agent[];
  updatedAt: string;
}

export interface RuntimeService {
  name: string;
  start?: () => Promise<void> | void;
  stop?: () => Promise<void> | void;
  getHealth?: () => unknown;
}

export interface RuntimeServiceSnapshot {
  name: string;
  hasStart: boolean;
  hasStop: boolean;
  hasHealth: boolean;
  health?: unknown;
}

export type RuntimeServiceName =
  | 'telegram'
  | 'sandbox'
  | 'demo'
  | 'consensus'
  | 'chat'
  | 'marketData';

export interface RuntimeStatus {
  lifecycle: RuntimeLifecycleStatus;
  startedAt?: string;
  stoppedAt?: string;
  services: string[];
}

export type RuntimeStateSubscriber = (state: RuntimeState) => void;

export interface SandboxOperation {
  id: string;
  symbol: string;
  side: 'buy' | 'sell';
  quantity: number;
  price?: number;
  createdAt: string;
}

export interface SandboxPosition {
  symbol: string;
  quantity: number;
  averagePrice: number;
  marketPrice?: number;
}

export interface SandboxStateSnapshot {
  virtualCapital: number;
  openPositions: SandboxPosition[];
  operationHistory: SandboxOperation[];
}

export interface SandboxAdapter {
  getSnapshot: () => Promise<SandboxStateSnapshot> | SandboxStateSnapshot;
  submitOperation?: (operation: SandboxOperation) => Promise<void> | void;
}

export interface TelegramRuntimeService extends RuntimeService {
  name: 'telegram';
  sendMessage?: (chatId: number, text: string) => Promise<boolean>;
}

export interface ChatRuntimeService extends RuntimeService {
  name: 'chat';
  processPrompt?: (prompt: string) => Promise<string> | string;
}

export interface MarketDataRuntimeService extends RuntimeService {
  name: 'marketData';
  getSnapshot?: () => Promise<unknown> | unknown;
}
