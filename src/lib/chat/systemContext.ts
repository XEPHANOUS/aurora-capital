/**
 * systemContext.ts
 *
 * Capa desacoplada de contexto del sistema para el chat estratégico.
 *
 * - No contiene lógica de UI.
 * - No contiene JSX.
 * - No depende de componentes React.
 *
 * Patrón de uso:
 *   1. StrategicChatPage lee el estado real desde useKV.
 *   2. Llama a setSystemContext(buildSystemContext(...)) antes de processChatTurn.
 *   3. buildMockAgentResponse() lee el contexto vía getSystemContext().
 *   4. consensusEngine.ts no necesita ningún cambio.
 */

import type { EnvironmentType, Agent, SystemConfig } from '@/lib/types';
import {
  calculateSurvivalReserve,
  calculateOperatingCapital,
} from '@/lib/mockData';
import { DEFAULT_ORGANIZATION_CONFIG } from '@/lib/organizationProfiles';
import { DEFAULT_CONFIG } from '@/lib/mockData';
import { getRuntimeStateProvider } from '@/runtime/stateProvider';
import type { RuntimeContextState } from '@/runtime/runtimeTypes';

// ---------------------------------------------------------------------------
// Interface pública
// ---------------------------------------------------------------------------

export interface SystemContext {
  /** Capital total del entorno activo */
  totalCapital: number;
  /** Reserva de supervivencia calculada en euros/unidades */
  survivalReserve: number;
  /** Capital operativo disponible (total − reserva) */
  operationalCapital: number;
  /** Porcentaje reservado para supervivencia */
  survivalReservePercent: number;
  /** Modo activo: sandbox | demo | paper | real */
  activeEnvironment: EnvironmentType;
  /** Etiqueta legible del entorno (ej. "Sandbox", "Paper Live") */
  environmentLabel: string;
  /** Perfil organizacional activo (ej. "balanced", "conservative") */
  organizationProfile: string;
  /** Etiqueta legible del perfil (ej. "Balanced", "Conservative") */
  organizationProfileLabel: string;
  /** Nombres de agentes activos o en seguimiento */
  activeAgents: string[];
  /** Reputación por agentId (0–100) */
  agentReputations: Record<string, number>;
  /** Estado general del sistema */
  systemStatus: 'optimal' | 'normal' | 'degraded' | 'alert';
  /** Riesgo máximo permitido por operación (%) */
  maxRiskPerOperation: number;
  /** Límite de pérdida diaria (%) */
  dailyLossLimit: number;
  /** Número de propuestas abiertas o en revisión */
  openProposalsCount: number;
}

// ---------------------------------------------------------------------------
// Labels
// ---------------------------------------------------------------------------

const ENVIRONMENT_LABELS: Record<EnvironmentType, string> = {
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

// ---------------------------------------------------------------------------
// Builder
// ---------------------------------------------------------------------------

export interface BuildSystemContextParams {
  currentCapital: number;
  config: Pick<SystemConfig, 'totalCapital' | 'survivalReservePercent' | 'maxRiskPerOperation' | 'dailyLossLimit'>;
  activeEnvironment: EnvironmentType;
  organizationProfile?: string;
  agents?: Agent[];
  openProposalsCount?: number;
}

export function buildSystemContext(params: BuildSystemContextParams): SystemContext {
  const { currentCapital, config, activeEnvironment } = params;

  // Use currentCapital (live state) as the authoritative total capital
  const totalCapital = currentCapital > 0 ? currentCapital : config.totalCapital;
  const pct = config.survivalReservePercent;

  const survivalReserve = calculateSurvivalReserve(totalCapital, pct);
  const operationalCapital = calculateOperatingCapital(totalCapital, pct);

  const orgProfile = params.organizationProfile ?? DEFAULT_ORGANIZATION_CONFIG.profile;

  const agents = params.agents ?? [];
  const activeAgents = agents
    .filter((a) => a.status === 'active' || a.status === 'analyzing' || a.status === 'idle')
    .map((a) => a.name);

  const agentReputations: Record<string, number> = {};
  for (const agent of agents) {
    agentReputations[agent.id] = Math.round(agent.reputation ?? 0);
  }

  const reserveRatio = survivalReserve / totalCapital;
  const systemStatus: SystemContext['systemStatus'] =
    reserveRatio < 0.15
      ? 'alert'
      : reserveRatio < 0.20
      ? 'degraded'
      : reserveRatio >= 0.25
      ? 'optimal'
      : 'normal';

  return {
    totalCapital,
    survivalReserve,
    operationalCapital,
    survivalReservePercent: pct,
    activeEnvironment,
    environmentLabel: ENVIRONMENT_LABELS[activeEnvironment] ?? activeEnvironment,
    organizationProfile: orgProfile,
    organizationProfileLabel: PROFILE_LABELS[orgProfile] ?? orgProfile,
    activeAgents,
    agentReputations,
    systemStatus,
    maxRiskPerOperation: config.maxRiskPerOperation,
    dailyLossLimit: config.dailyLossLimit,
    openProposalsCount: params.openProposalsCount ?? 0,
  };
}

// ---------------------------------------------------------------------------
// Default (fallback when no live state has been injected yet)
// ---------------------------------------------------------------------------

function buildDefaultSystemContext(): SystemContext {
  return buildSystemContext({
    currentCapital: DEFAULT_CONFIG.totalCapital,
    config: DEFAULT_CONFIG,
    activeEnvironment: 'sandbox',
    organizationProfile: DEFAULT_ORGANIZATION_CONFIG.profile,
    agents: [],
  });
}

// ---------------------------------------------------------------------------
// Module-level store
// Consumers: mockAgentResponses.ts reads via getSystemContext()
// Producers: StrategicChatPage writes via setSystemContext()
// ---------------------------------------------------------------------------

let _currentContext: SystemContext = buildDefaultSystemContext();

function toRuntimeContext(ctx: SystemContext): RuntimeContextState {
  return {
    totalCapital: ctx.totalCapital,
    survivalReserve: ctx.survivalReserve,
    operationalCapital: ctx.operationalCapital,
    survivalReservePercent: ctx.survivalReservePercent,
    activeEnvironment: ctx.activeEnvironment,
    environmentLabel: ctx.environmentLabel,
    organizationProfile: ctx.organizationProfile,
    organizationProfileLabel: ctx.organizationProfileLabel,
    strategyId: 'default',
    activeAgents: ctx.activeAgents,
    agentReputations: ctx.agentReputations,
    systemStatus: ctx.systemStatus,
    maxRiskPerOperation: ctx.maxRiskPerOperation,
    dailyLossLimit: ctx.dailyLossLimit,
    openProposalsCount: ctx.openProposalsCount,
  };
}

function fromRuntimeContext(ctx: RuntimeContextState): SystemContext {
  return {
    totalCapital: ctx.totalCapital,
    survivalReserve: ctx.survivalReserve,
    operationalCapital: ctx.operationalCapital,
    survivalReservePercent: ctx.survivalReservePercent,
    activeEnvironment: ctx.activeEnvironment,
    environmentLabel: ctx.environmentLabel,
    organizationProfile: ctx.organizationProfile,
    organizationProfileLabel: ctx.organizationProfileLabel,
    activeAgents: ctx.activeAgents,
    agentReputations: ctx.agentReputations,
    systemStatus: ctx.systemStatus,
    maxRiskPerOperation: ctx.maxRiskPerOperation,
    dailyLossLimit: ctx.dailyLossLimit,
    openProposalsCount: ctx.openProposalsCount,
  };
}

/** Update the active system context. Call before processChatTurn(). */
export function setSystemContext(ctx: SystemContext): void {
  _currentContext = ctx;
  getRuntimeStateProvider().updateContext(toRuntimeContext(ctx));
}

/** Read the active system context. Used internally by response generators. */
export function getSystemContext(): SystemContext {
  const runtimeContext = getRuntimeStateProvider().getState().context;
  _currentContext = fromRuntimeContext(runtimeContext);
  return _currentContext;
}

// ---------------------------------------------------------------------------
// Formatting helpers (pure, no React)
// ---------------------------------------------------------------------------

export function formatCtxCurrency(value: number): string {
  if (value >= 1_000_000) {
    return `${(value / 1_000_000).toFixed(2)} M€`;
  }
  if (value >= 1_000) {
    return `${value.toLocaleString('es-ES')} €`;
  }
  return `${value} €`;
}

export function formatCtxPercent(value: number): string {
  return `${value}%`;
}
