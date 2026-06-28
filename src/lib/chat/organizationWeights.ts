import type { AgentType } from '@/lib/types';

export type OrganizationDecisionProfile =
  | 'conservative'
  | 'balanced'
  | 'aggressive'
  | 'hyperaggressive';

export type OrganizationAgentWeights = Record<AgentType, number>;

export interface ResolvedOrganizationWeights {
  profile: OrganizationDecisionProfile;
  profileLabel: 'Conservative' | 'Balanced' | 'Aggressive' | 'HyperAggressive';
  weights: OrganizationAgentWeights;
}

const BASE_WEIGHTS: OrganizationAgentWeights = {
  director: 1.0,
  supervisor: 1.0,
  auditor: 1.0,
  survival: 1.0,
  investor: 1.0,
  news: 1.0,
  technical: 1.0,
  analyst: 1.0,
  risk: 1.0,
  archivist: 1.0,
};

const PROFILE_WEIGHTS: Record<OrganizationDecisionProfile, OrganizationAgentWeights> = {
  conservative: {
    ...BASE_WEIGHTS,
    survival: 1.5,
    risk: 1.4,
    auditor: 1.2,
    investor: 0.7,
    news: 0.8,
    technical: 0.9,
    analyst: 1.0,
    archivist: 1.0,
    supervisor: 1.0,
    director: 1.0,
  },
  balanced: {
    ...BASE_WEIGHTS,
  },
  aggressive: {
    ...BASE_WEIGHTS,
    investor: 1.5,
    news: 1.2,
    technical: 1.3,
    analyst: 1.2,
    risk: 0.8,
    survival: 0.8,
    auditor: 0.9,
    archivist: 1.0,
    supervisor: 1.0,
    director: 1.0,
  },
  hyperaggressive: {
    ...BASE_WEIGHTS,
    investor: 1.8,
    news: 1.5,
    technical: 1.5,
    analyst: 1.3,
    risk: 0.5,
    survival: 0.5,
    auditor: 0.8,
    archivist: 0.9,
    supervisor: 1.0,
    director: 1.0,
  },
};

const PROFILE_LABELS: Record<OrganizationDecisionProfile, ResolvedOrganizationWeights['profileLabel']> = {
  conservative: 'Conservative',
  balanced: 'Balanced',
  aggressive: 'Aggressive',
  hyperaggressive: 'HyperAggressive',
};

export function normalizeOrganizationProfile(raw: string | null | undefined): OrganizationDecisionProfile {
  const value = (raw ?? '').trim().toLowerCase();

  if (value.includes('hyper')) return 'hyperaggressive';
  if (value === 'aggressive') return 'aggressive';
  if (value === 'balanced') return 'balanced';

  // Compatibility: the existing app profile "survival-first" is defensive.
  if (value === 'survival-first' || value.includes('survival')) return 'conservative';

  return 'conservative';
}

export function resolveOrganizationWeights(rawProfile: string | null | undefined): ResolvedOrganizationWeights {
  const profile = normalizeOrganizationProfile(rawProfile);
  return {
    profile,
    profileLabel: PROFILE_LABELS[profile],
    weights: PROFILE_WEIGHTS[profile],
  };
}

export function weightedAverageByAgents(
  scores: Partial<Record<AgentType, number>>,
  weights: OrganizationAgentWeights,
  agents: AgentType[],
): number {
  let weightedSum = 0;
  let totalWeight = 0;

  for (const agent of agents) {
    const score = scores[agent];
    if (typeof score !== 'number') continue;
    const weight = weights[agent] ?? 1;
    weightedSum += score * weight;
    totalWeight += weight;
  }

  if (totalWeight <= 0) return 0;
  return Math.round(weightedSum / totalWeight);
}

export function describeAnalystInfluence(weights: OrganizationAgentWeights): string {
  const growth = (weights.news + weights.technical + weights.analyst) / 3;
  const defense = (weights.risk + weights.archivist) / 2;

  if (growth > defense + 0.2) {
    return 'Las señales alcistas presentan influencia superior por la configuración organizativa activa.';
  }
  if (defense > growth + 0.2) {
    return 'Los factores defensivos y de control tienen mayor influencia por la configuración organizativa activa.';
  }
  return 'La influencia entre señales alcistas y defensivas se mantiene equilibrada por la configuración organizativa activa.';
}
