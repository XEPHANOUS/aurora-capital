/**
 * profileAnalytics.ts
 *
 * Pure calculation layer for the profile analytics UI.
 * Derives all metrics from ProfileWeights — no external state, no React, no side effects.
 *
 * ProfileWeights keys use 0-100 integers:
 *   director, supervisor, auditor, survival, investor, news, technical, analyst, risk, archivist
 */

import type { ProfileWeights } from '@/lib/types';

// ---------------------------------------------------------------------------
// Phase 1 — Derived metrics
// ---------------------------------------------------------------------------

export interface ProfileMetrics {
  aggressiveness: number; // 0-100
  protection: number;     // 0-100
  growth: number;         // 0-100
  control: number;        // 0-100
  consensus: number;      // 0-100
}

function norm(values: number[]): number {
  const sum = values.reduce((a, b) => a + b, 0);
  const count = values.length;
  // Normalise to 0-100 treating max possible (100) as ceiling
  return Math.round(Math.min(100, (sum / (count * 100)) * 100));
}

export function computeProfileMetrics(w: ProfileWeights): ProfileMetrics {
  return {
    aggressiveness: norm([w.investor, w.news, w.technical, w.analyst]),
    protection:     norm([w.risk, w.survival, w.auditor]),
    growth:         norm([w.investor, w.news, w.technical, w.analyst, w.archivist]),
    control:        norm([w.director, w.supervisor, w.auditor]),
    consensus:      norm([w.supervisor, w.director]),
  };
}

export const METRIC_LABELS: Record<keyof ProfileMetrics, string> = {
  aggressiveness: 'Agresividad',
  protection: 'Protección',
  growth: 'Crecimiento',
  control: 'Control',
  consensus: 'Consenso',
};

export function describeMetric(key: keyof ProfileMetrics, value: number): string {
  if (key === 'aggressiveness') {
    if (value >= 70) return 'El perfil favorece la búsqueda activa de oportunidades de mercado.';
    if (value >= 40) return 'Orientación moderada hacia oportunidades con criterio de riesgo.';
    return 'El perfil prioriza estabilidad sobre búsqueda de oportunidades.';
  }
  if (key === 'protection') {
    if (value >= 70) return 'Alta protección activa sobre el capital y la reserva estratégica.';
    if (value >= 40) return 'Protección de capital equilibrada con apertura al riesgo controlado.';
    return 'Protección reducida — el perfil acepta mayor exposición.';
  }
  if (key === 'growth') {
    if (value >= 70) return 'Sesgo claro hacia el crecimiento y expansión del capital.';
    if (value >= 40) return 'Crecimiento moderado con controles de preservación activos.';
    return 'Crecimiento en segundo plano — predomina la preservación.';
  }
  if (key === 'control') {
    if (value >= 70) return 'Gobernanza fuerte: Director, Supervisor y Auditor dominan el flujo.';
    if (value >= 40) return 'Control institucional presente sin bloquear la operativa.';
    return 'Gobernanza ligera — decisiones más autónomas y rápidas.';
  }
  if (key === 'consensus') {
    if (value >= 70) return 'Se requiere alto nivel de acuerdo antes de ejecutar.';
    if (value >= 40) return 'Consenso moderado — decisiones ágiles con supervisión.';
    return 'Consenso mínimo — el Director puede actuar con pocos inputs.';
  }
  return '';
}

// ---------------------------------------------------------------------------
// Phase 2 — Behavioural narrative lines
// ---------------------------------------------------------------------------

export function generateBehaviourLines(w: ProfileWeights): string[] {
  const lines: string[] = [];

  if (w.risk >= 80)   lines.push('Riesgo tendrá prioridad elevada y podrá vetar operaciones agresivas.');
  else if (w.risk < 40) lines.push('Riesgo tendrá capacidad de veto reducida sobre las operaciones.');

  if (w.survival >= 90) lines.push('Supervivencia puede bloquear cualquier operación que comprometa la reserva.');
  else if (w.survival < 40) lines.push('Supervivencia ejerce un control mínimo sobre el capital base.');

  if (w.investor >= 80) lines.push('Inversor tendrá alta influencia en la búsqueda de oportunidades.');
  else if (w.investor < 40) lines.push('Inversor tendrá influencia limitada — pocas propuestas de crecimiento.');

  if (w.news >= 80)   lines.push('Noticias y sentimiento de mercado tendrán gran peso en las decisiones.');
  if (w.technical >= 80) lines.push('El análisis técnico será determinante para aprobar entradas.');
  if (w.analyst >= 80) lines.push('Analista tendrá alta influencia en la correlación entre señales multiagente.');

  if (w.director >= 85) lines.push('Director exigirá mayor consenso y coherencia antes de ejecutar.');
  else if (w.director < 50) lines.push('Director operará con menor poder de síntesis — decisiones más descentralizadas.');

  if (w.auditor >= 90) lines.push('Auditor validará cada decisión con estricto criterio de compliance.');
  if (w.supervisor >= 80) lines.push('Supervisor coordinará activamente el pipeline multiagente.');

  if (w.archivist >= 80) lines.push('Archivista tendrá alta influencia: el historial guiará las decisiones.');

  if (lines.length === 0) {
    lines.push('Todos los agentes tienen influencia equilibrada sin dominante claro.');
  }

  return lines;
}

// ---------------------------------------------------------------------------
// Phase 3 — Profile classifier
// ---------------------------------------------------------------------------

export type ProfileLabel =
  | 'Ultra Conservador'
  | 'Conservador'
  | 'Balanceado'
  | 'Crecimiento'
  | 'Agresivo'
  | 'Muy Agresivo'
  | 'Especulativo';

export interface ProfileClassification {
  label: ProfileLabel;
  score: number; // 0-100, higher = more aggressive
}

export function classifyProfile(w: ProfileWeights): ProfileClassification {
  const metrics = computeProfileMetrics(w);
  // score = weighted combination: growth pulls up, protection pulls down
  const raw = metrics.aggressiveness * 0.40 + metrics.growth * 0.30 - metrics.protection * 0.30;
  const score = Math.round(Math.max(0, Math.min(100, raw)));

  let label: ProfileLabel;
  if (score >= 88)      label = 'Especulativo';
  else if (score >= 72) label = 'Muy Agresivo';
  else if (score >= 58) label = 'Agresivo';
  else if (score >= 44) label = 'Crecimiento';
  else if (score >= 30) label = 'Balanceado';
  else if (score >= 18) label = 'Conservador';
  else                  label = 'Ultra Conservador';

  return { label, score };
}

export const CLASSIFIER_COLORS: Record<ProfileLabel, string> = {
  'Ultra Conservador': 'border-blue-500 text-blue-400',
  'Conservador':       'border-cyan-500 text-cyan-400',
  'Balanceado':        'border-emerald-500 text-emerald-400',
  'Crecimiento':       'border-yellow-500 text-yellow-400',
  'Agresivo':          'border-orange-500 text-orange-400',
  'Muy Agresivo':      'border-red-500 text-red-400',
  'Especulativo':      'border-rose-600 text-rose-500',
};

// ---------------------------------------------------------------------------
// Phase 4 — Risk warnings
// ---------------------------------------------------------------------------

export interface RiskWarning {
  code: string;
  severity: 'warning' | 'error';
  message: string;
  detail: string;
}

export function detectRiskWarnings(w: ProfileWeights): RiskWarning[] {
  const warnings: RiskWarning[] = [];

  if (w.risk < 20 && w.survival < 20 && w.investor > 80) {
    warnings.push({
      code: 'EXTREME_AGGRESSION',
      severity: 'error',
      message: 'Perfil extremadamente agresivo.',
      detail: 'La protección de capital es insuficiente. Riesgo y Supervivencia están casi anulados.',
    });
  }

  const avg = Object.values(w).reduce((a, b) => a + b, 0) / Object.values(w).length;
  if (avg < 15) {
    warnings.push({
      code: 'INCONSISTENT_PROFILE',
      severity: 'warning',
      message: 'Perfil inconsistente.',
      detail: 'No existen agentes dominantes. El sistema no tiene una estrategia definida.',
    });
  }

  if (w.director < 30) {
    warnings.push({
      code: 'WEAK_GOVERNANCE',
      severity: 'warning',
      message: 'Gobernanza débil.',
      detail: 'El Director tiene muy baja influencia. Las decisiones pueden perder coherencia estratégica.',
    });
  }

  if (w.survival < 15) {
    warnings.push({
      code: 'NO_SURVIVAL_GUARD',
      severity: 'error',
      message: 'Guardia de supervivencia desactivada.',
      detail: 'La reserva de capital no tiene protección activa. Riesgo de pérdida total no controlada.',
    });
  }

  if (w.auditor < 20 && w.risk < 30) {
    warnings.push({
      code: 'NO_COMPLIANCE',
      severity: 'warning',
      message: 'Sin control de cumplimiento activo.',
      detail: 'Auditor y Riesgo están débiles. Las operaciones no serán validadas correctamente.',
    });
  }

  return warnings;
}

// ---------------------------------------------------------------------------
// Phase 5 — Decision simulator
// ---------------------------------------------------------------------------

export type SimulationScenario =
  | 'buy_btc'
  | 'buy_nvda'
  | 'bear_market'
  | 'bull_market'
  | 'high_volatility';

export interface SimulationResult {
  scenario: SimulationScenario;
  label: string;
  decision: 'APROBADO' | 'APROBADO CON CAUTELA' | 'REVISAR' | 'RECHAZADO';
  confidence: number; // 0-100
  rationale: string;
}

interface ScenarioBias {
  label: string;
  growthAgents: (keyof ProfileWeights)[];
  defensiveAgents: (keyof ProfileWeights)[];
  baseConfidence: number;
  growthThreshold: number;  // avg of growthAgents needed to approve
  defenseThreshold: number; // avg of defensiveAgents that may block
}

const SCENARIOS: Record<SimulationScenario, ScenarioBias> = {
  buy_btc: {
    label: 'Comprar BTC',
    growthAgents: ['investor', 'news', 'technical', 'analyst'],
    defensiveAgents: ['risk', 'survival'],
    baseConfidence: 65,
    growthThreshold: 65,
    defenseThreshold: 75,
  },
  buy_nvda: {
    label: 'Comprar NVDA',
    growthAgents: ['investor', 'technical', 'news', 'analyst'],
    defensiveAgents: ['risk', 'auditor'],
    baseConfidence: 68,
    growthThreshold: 60,
    defenseThreshold: 80,
  },
  bear_market: {
    label: 'Mercado Bajista',
    growthAgents: ['investor'],
    defensiveAgents: ['risk', 'survival', 'auditor'],
    baseConfidence: 55,
    growthThreshold: 80,
    defenseThreshold: 50,
  },
  bull_market: {
    label: 'Mercado Alcista',
    growthAgents: ['investor', 'news', 'technical', 'analyst'],
    defensiveAgents: ['risk'],
    baseConfidence: 72,
    growthThreshold: 50,
    defenseThreshold: 90,
  },
  high_volatility: {
    label: 'Alta Volatilidad',
    growthAgents: ['investor', 'technical', 'analyst'],
    defensiveAgents: ['risk', 'survival', 'auditor', 'supervisor'],
    baseConfidence: 58,
    growthThreshold: 75,
    defenseThreshold: 60,
  },
};

function avgOf(w: ProfileWeights, keys: (keyof ProfileWeights)[]): number {
  const sum = keys.reduce((acc, k) => acc + (w[k] ?? 0), 0);
  return sum / keys.length;
}

export function runSimulation(scenario: SimulationScenario, w: ProfileWeights): SimulationResult {
  const bias = SCENARIOS[scenario];
  const growthAvg = avgOf(w, bias.growthAgents);
  const defenseAvg = avgOf(w, bias.defensiveAgents);

  // Confidence: start from base, pull toward growth or defense
  let confidence = bias.baseConfidence
    + (growthAvg - 50) * 0.2
    - (defenseAvg - 50) * 0.15;
  confidence = Math.round(Math.max(20, Math.min(98, confidence)));

  const growthDominant = growthAvg >= bias.growthThreshold;
  const defenseDominant = defenseAvg >= bias.defenseThreshold;

  let decision: SimulationResult['decision'];
  if (defenseDominant && !growthDominant) {
    decision = defenseAvg > 85 ? 'RECHAZADO' : 'REVISAR';
  } else if (growthDominant && !defenseDominant) {
    decision = 'APROBADO';
  } else if (growthDominant && defenseDominant) {
    decision = 'APROBADO CON CAUTELA';
  } else {
    decision = 'REVISAR';
  }

  // Build rationale from dominant agents
  const topGrowth = bias.growthAgents
    .map((k) => ({ k, v: w[k] }))
    .sort((a, b) => b.v - a.v)
    .slice(0, 2)
    .map(({ k }) => k.charAt(0).toUpperCase() + k.slice(1));

  const topDefense = bias.defensiveAgents
    .map((k) => ({ k, v: w[k] }))
    .sort((a, b) => b.v - a.v)
    .slice(0, 2)
    .map(({ k }) => k.charAt(0).toUpperCase() + k.slice(1));

  let rationale: string;
  if (decision === 'APROBADO') {
    rationale = `${topGrowth.join(' y ')} dominan la decisión con sesgo favorable.`;
  } else if (decision === 'APROBADO CON CAUTELA') {
    rationale = `${topGrowth[0]} impulsa la oportunidad, ${topDefense[0]} exige control de exposición.`;
  } else if (decision === 'REVISAR') {
    rationale = `${topDefense.join(' y ')} reducen la exposición propuesta.`;
  } else {
    rationale = `${topDefense.join(' y ')} bloquean la operación por criterios defensivos.`;
  }

  return { scenario, label: bias.label, decision, confidence, rationale };
}

export const ALL_SCENARIOS: SimulationScenario[] = [
  'buy_btc',
  'buy_nvda',
  'bull_market',
  'bear_market',
  'high_volatility',
];

// ---------------------------------------------------------------------------
// Profiles page — recommendation helper (heuristic, no AI)
// ---------------------------------------------------------------------------

export interface RecommendationCandidate {
  id: string;
  name: string;
  weights: ProfileWeights;
}

export interface RecommendationContext {
  currentEnvironment?: string;
  currentProfileId?: string;
  currentWeights: ProfileWeights;
}

export interface RecommendationResult {
  recommendedProfileId: string;
  recommendedProfileName: string;
  confidence: number;
  reason: string;
}

export function recommendProfile(
  candidates: RecommendationCandidate[],
  context: RecommendationContext,
): RecommendationResult {
  const env = (context.currentEnvironment ?? 'sandbox').toLowerCase();
  const currentMetrics = computeProfileMetrics(context.currentWeights);
  const warnings = detectRiskWarnings(context.currentWeights);

  const pick = (idFallbacks: string[]): RecommendationCandidate | undefined => {
    for (const id of idFallbacks) {
      const found = candidates.find((c) => c.id === id);
      if (found) return found;
    }
    return candidates[0];
  };

  // Priority 1: high danger -> conservative protection first
  if (
    currentMetrics.protection < 35 ||
    warnings.some((w) => w.code === 'EXTREME_AGGRESSION' || w.code === 'NO_SURVIVAL_GUARD')
  ) {
    const target = pick(['conservative', 'survival-first', 'balanced']);
    return {
      recommendedProfileId: target?.id ?? 'balanced',
      recommendedProfileName: target?.name ?? 'Balanced',
      confidence: 84,
      reason: 'Protección insuficiente detectada. Se recomienda reforzar control de riesgo y supervivencia.',
    };
  }

  // Priority 2: real/paper environments require stronger controls
  if ((env === 'real' || env === 'paper') && (currentMetrics.control < 55 || currentMetrics.consensus < 50)) {
    const target = pick(['balanced', 'conservative']);
    return {
      recommendedProfileId: target?.id ?? 'balanced',
      recommendedProfileName: target?.name ?? 'Balanced',
      confidence: 78,
      reason: 'Entorno operativo exigente con gobernanza moderada. Conviene aumentar control y consenso.',
    };
  }

  // Priority 3: favourable growth setup in low-risk environments
  if ((env === 'sandbox' || env === 'demo') && currentMetrics.growth >= 65 && currentMetrics.protection >= 45) {
    const target = pick(['aggressive', 'balanced']);
    return {
      recommendedProfileId: target?.id ?? 'aggressive',
      recommendedProfileName: target?.name ?? 'Aggressive',
      confidence: 76,
      reason: 'Predominio de señales favorables y exposición controlada para priorizar crecimiento.',
    };
  }

  // Default: stability baseline
  const target = pick(['balanced', 'conservative']);
  return {
    recommendedProfileId: target?.id ?? 'balanced',
    recommendedProfileName: target?.name ?? 'Balanced',
    confidence: 68,
    reason: 'Sin contexto concluyente adicional. Se recomienda mantener un perfil equilibrado.',
  };
}
