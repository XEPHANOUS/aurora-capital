import type { Agent, EnvironmentType, OrganizationConfig, SystemConfig } from '@/lib/types';
import type { PlatformConfig } from '@/lib/platformConfig';
import type { LearningEngineState, Operation } from '@/lib/types';

export interface AuroraBackupPayload {
  profiles: {
    organization?: OrganizationConfig;
    activeEnvironment: EnvironmentType;
  };
  agents: Agent[];
  weights: {
    customWeights?: OrganizationConfig['customWeights'];
    hierarchy?: OrganizationConfig['hierarchy'];
  };
  strategies: {
    simulationMode: boolean;
    maxRiskPerOperation: number;
    dailyLossLimit: number;
    survivalReservePercent: number;
  };
  llms: Array<{
    agentId: Agent['id'];
    agentType: Agent['agentType'];
    modelConfig?: Agent['modelConfig'];
  }>;
  apis: PlatformConfig['apisConfig'];
  environments: {
    accounts: Record<EnvironmentType, {
      currentCapital: number;
      totalCapital: number;
      operationsCount: number;
    }>;
    fullAccounts?: Record<EnvironmentType, {
      agents: Agent[];
      operations: Operation[];
      currentCapital: number;
      learningState: LearningEngineState;
      config: SystemConfig;
    }>;
    config: PlatformConfig['environmentsConfig'];
    autoExecution: PlatformConfig['autoExecution'];
  };
  platform: {
    featureFlags: PlatformConfig['featureFlags'];
    security: PlatformConfig['securityConfig'];
  };
  raw: {
    config: SystemConfig;
    platformConfig: PlatformConfig;
  };
}

export interface AuroraBackupSnapshot {
  version: number;
  exportedAt: string;
  source: 'aurora-capital';
  payload: AuroraBackupPayload;
}

export const AURORA_BACKUP_VERSION = 1;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

export function isValidAuroraBackupSnapshot(value: unknown): value is AuroraBackupSnapshot {
  if (!isRecord(value)) return false;
  if (value.version !== AURORA_BACKUP_VERSION) return false;
  if (value.source !== 'aurora-capital') return false;
  if (typeof value.exportedAt !== 'string') return false;
  if (!isRecord(value.payload)) return false;

  const payload = value.payload as Record<string, unknown>;
  return isRecord(payload.raw) && isRecord(payload.environments) && Array.isArray(payload.agents);
}

export function serializeBackup(snapshot: AuroraBackupSnapshot): string {
  return JSON.stringify(snapshot, null, 2);
}
