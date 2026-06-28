import { calculateOperatingCapital, calculateSurvivalReserve, DEFAULT_CONFIG } from '@/lib/mockData';
import { DEFAULT_ORGANIZATION_CONFIG } from '@/lib/organizationProfiles';
import type { Agent } from '@/lib/types';
import type {
  RuntimeContextState,
  RuntimeState,
  RuntimeStateSubscriber,
} from '@/runtime/runtimeTypes';

const ENVIRONMENT_LABELS: Record<RuntimeContextState['activeEnvironment'], string> = {
  sandbox: 'Sandbox',
  demo: 'Demo',
  paper: 'Paper Live',
  real: 'Real',
};

const PROFILE_LABELS: Record<string, string> = {
  conservative: 'Conservative',
  balanced: 'Balanced',
  aggressive: 'Aggressive',
  'survival-first': 'Survival First',
};

function buildInitialContext(): RuntimeContextState {
  const totalCapital = DEFAULT_CONFIG.totalCapital;
  const pct = DEFAULT_CONFIG.survivalReservePercent;

  return {
    totalCapital,
    survivalReserve: calculateSurvivalReserve(totalCapital, pct),
    operationalCapital: calculateOperatingCapital(totalCapital, pct),
    survivalReservePercent: pct,
    activeEnvironment: 'sandbox',
    environmentLabel: ENVIRONMENT_LABELS.sandbox,
    organizationProfile: DEFAULT_ORGANIZATION_CONFIG.profile,
    organizationProfileLabel: PROFILE_LABELS[DEFAULT_ORGANIZATION_CONFIG.profile] ?? DEFAULT_ORGANIZATION_CONFIG.profile,
    strategyId: 'default',
    activeAgents: [],
    agentReputations: {},
    systemStatus: 'normal',
    maxRiskPerOperation: DEFAULT_CONFIG.maxRiskPerOperation,
    dailyLossLimit: DEFAULT_CONFIG.dailyLossLimit,
    openProposalsCount: 0,
  };
}

function buildInitialState(): RuntimeState {
  return {
    context: buildInitialContext(),
    operationalConfig: {
      simulationMode: DEFAULT_CONFIG.simulationMode,
      notifications: DEFAULT_CONFIG.notifications,
      telegramConnected: DEFAULT_CONFIG.telegramConnected,
      telegram: {
        mode: 'polling',
        pollingEnabled: true,
        status: 'not-configured',
      },
    },
    agents: [],
    updatedAt: new Date().toISOString(),
  };
}

export class RuntimeStateProvider {
  private state: RuntimeState = buildInitialState();
  private subscribers = new Set<RuntimeStateSubscriber>();

  getState(): RuntimeState {
    return this.state;
  }

  setState(nextState: RuntimeState): void {
    this.state = {
      ...nextState,
      updatedAt: new Date().toISOString(),
    };
    this.emit();
  }

  updateState(partial: Partial<RuntimeState>): void {
    this.state = {
      ...this.state,
      ...partial,
      context: {
        ...this.state.context,
        ...(partial.context ?? {}),
      },
      operationalConfig: {
        ...this.state.operationalConfig,
        ...(partial.operationalConfig ?? {}),
      },
      updatedAt: new Date().toISOString(),
    };
    this.emit();
  }

  updateContext(partial: Partial<RuntimeContextState>): void {
    this.updateState({ context: partial });
  }

  setAgents(agents: Agent[]): void {
    const activeAgents = agents
      .filter((agent) => agent.status === 'active' || agent.status === 'analyzing' || agent.status === 'idle')
      .map((agent) => agent.name);

    const agentReputations: Record<string, number> = {};
    for (const agent of agents) {
      agentReputations[agent.id] = Math.round(agent.reputation ?? 0);
    }

    this.updateState({
      agents,
      context: {
        activeAgents,
        agentReputations,
      },
    });
  }

  subscribe(subscriber: RuntimeStateSubscriber): () => void {
    this.subscribers.add(subscriber);
    return () => {
      this.subscribers.delete(subscriber);
    };
  }

  private emit(): void {
    for (const subscriber of this.subscribers) {
      subscriber(this.state);
    }
  }
}

let runtimeStateProviderSingleton: RuntimeStateProvider | null = null;

export function getRuntimeStateProvider(): RuntimeStateProvider {
  if (!runtimeStateProviderSingleton) {
    runtimeStateProviderSingleton = new RuntimeStateProvider();
  }
  return runtimeStateProviderSingleton;
}
