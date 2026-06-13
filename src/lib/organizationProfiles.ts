import type { OrganizationalProfile, ProfileWeights, AgentType, OrganizationConfig } from './types';

export const PROFILE_PRESETS: Record<OrganizationalProfile, ProfileWeights> = {
  'conservative': {
    director: 85,
    auditor: 95,
    risk: 100,
    news: 50,
    technical: 60,
    archivist: 90,
    investor: 45,
    survival: 100,
    supervisor: 80,
  },
  'balanced': {
    director: 80,
    auditor: 90,
    risk: 85,
    news: 70,
    technical: 75,
    archivist: 80,
    investor: 70,
    survival: 95,
    supervisor: 75,
  },
  'aggressive': {
    director: 90,
    auditor: 70,
    risk: 60,
    news: 95,
    technical: 90,
    archivist: 50,
    investor: 95,
    survival: 85,
    supervisor: 65,
  },
  'survival-first': {
    director: 95,
    auditor: 100,
    risk: 95,
    news: 40,
    technical: 50,
    archivist: 85,
    investor: 30,
    survival: 100,
    supervisor: 90,
  },
};

export const PROFILE_DESCRIPTIONS: Record<OrganizationalProfile, string> = {
  'conservative': 'Prioritizes capital preservation and risk management. Survival and Auditor agents have maximum influence.',
  'balanced': 'Equal weight between growth and protection. All agents contribute meaningfully to decisions.',
  'aggressive': 'Focuses on returns and market opportunities. News and Investor agents drive strategy.',
  'survival-first': 'Ultimate protection mode. Every decision filtered through strict survival criteria.',
};

export const DEFAULT_HIERARCHY: Record<AgentType, AgentType | null> = {
  director: null,
  auditor: 'director',
  supervisor: 'director',
  survival: 'director',
  risk: 'supervisor',
  archivist: 'supervisor',
  news: 'supervisor',
  technical: 'supervisor',
  investor: 'director',
};

export const DEFAULT_ORGANIZATION_CONFIG: OrganizationConfig = {
  profile: 'balanced',
  customWeights: undefined,
  hierarchy: DEFAULT_HIERARCHY,
};

export function getProfileWeights(profile: OrganizationalProfile): ProfileWeights {
  return PROFILE_PRESETS[profile];
}

export function calculateInfluencedWeight(
  agentId: AgentType,
  reputation: number,
  confidence: number,
  weights: ProfileWeights
): number {
  const profileWeight = weights[agentId];
  const normalizedReputation = reputation / 100;
  const normalizedConfidence = confidence / 100;
  
  return profileWeight * normalizedReputation * normalizedConfidence;
}

export function getAgentReportingLine(agentId: AgentType, hierarchy: Record<AgentType, AgentType | null>): AgentType[] {
  const line: AgentType[] = [agentId];
  let current = hierarchy[agentId];
  
  while (current !== null) {
    line.push(current);
    current = hierarchy[current];
  }
  
  return line;
}

export function getDirectReports(agentId: AgentType, hierarchy: Record<AgentType, AgentType | null>): AgentType[] {
  return Object.entries(hierarchy)
    .filter(([_, reportsTo]) => reportsTo === agentId)
    .map(([id]) => id as AgentType);
}
