import type {
  OrganizationalProfile,
  ProfileWeights,
  AgentType,
  OrganizationConfig,
  OrganizationProfileDefinition,
} from './types';

export const PROFILE_PRESETS: Record<OrganizationalProfile, ProfileWeights> = {
  'conservative': {
    director: 85,
    auditor: 95,
    risk: 100,
    news: 50,
    technical: 60,
    analyst: 70,
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
    analyst: 75,
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
    analyst: 85,
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
    analyst: 70,
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
  analyst: 'supervisor',
  archivist: 'supervisor',
  news: 'supervisor',
  technical: 'supervisor',
  investor: 'director',
};

export const DEFAULT_ORGANIZATION_CONFIG: OrganizationConfig = {
  profile: 'balanced',
  activeProfileId: 'balanced',
  customProfiles: [],
  customWeights: undefined,
  hierarchy: DEFAULT_HIERARCHY,
};

export const SYSTEM_PROFILE_ORDER: OrganizationalProfile[] = [
  'conservative',
  'balanced',
  'aggressive',
  'survival-first',
];

function formatSystemName(profile: OrganizationalProfile): string {
  return profile
    .split('-')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');
}

export function getSystemProfiles(): OrganizationProfileDefinition[] {
  return SYSTEM_PROFILE_ORDER.map((profile) => ({
    id: profile,
    name: formatSystemName(profile),
    description: PROFILE_DESCRIPTIONS[profile],
    isSystemProfile: true,
    weights: PROFILE_PRESETS[profile],
  }));
}

export function getAllProfiles(config?: OrganizationConfig): OrganizationProfileDefinition[] {
  const custom = config?.customProfiles ?? [];
  return [...getSystemProfiles(), ...custom];
}

export function getActiveProfile(config?: OrganizationConfig): OrganizationProfileDefinition {
  const profiles = getAllProfiles(config);
  const activeId = config?.activeProfileId ?? config?.profile ?? 'balanced';
  const direct = profiles.find((p) => p.id === activeId);
  if (direct) return direct;

  const bySystem = profiles.find((p) => p.id === (config?.profile ?? 'balanced'));
  return bySystem ?? getSystemProfiles()[1];
}

export function activateOrganizationProfile(config: OrganizationConfig | undefined, profileId: string): OrganizationConfig {
  const base = config ?? DEFAULT_ORGANIZATION_CONFIG;
  const profiles = getAllProfiles(base);
  const found = profiles.find((p) => p.id === profileId);

  if (!found) return base;

  const systemProfile = SYSTEM_PROFILE_ORDER.includes(found.id as OrganizationalProfile)
    ? (found.id as OrganizationalProfile)
    : base.profile;

  return {
    ...base,
    profile: systemProfile,
    activeProfileId: found.id,
    customWeights: found.isSystemProfile ? undefined : found.weights,
  };
}

export function createCustomProfile(
  config: OrganizationConfig | undefined,
  input: { name: string; description: string; baseProfileId: OrganizationalProfile },
): OrganizationConfig {
  const base = config ?? DEFAULT_ORGANIZATION_CONFIG;
  const newProfile: OrganizationProfileDefinition = {
    id: `custom-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    name: input.name.trim(),
    description: input.description.trim(),
    isSystemProfile: false,
    weights: { ...PROFILE_PRESETS[input.baseProfileId] },
  };

  return {
    ...base,
    customProfiles: [...(base.customProfiles ?? []), newProfile],
  };
}

export function updateCustomProfile(
  config: OrganizationConfig | undefined,
  updated: OrganizationProfileDefinition,
): OrganizationConfig {
  const base = config ?? DEFAULT_ORGANIZATION_CONFIG;
  const nextCustom = (base.customProfiles ?? []).map((p) => (p.id === updated.id ? updated : p));

  const isActive = (base.activeProfileId ?? base.profile) === updated.id;

  return {
    ...base,
    customProfiles: nextCustom,
    customWeights: isActive ? updated.weights : base.customWeights,
  };
}

export function duplicateProfile(config: OrganizationConfig | undefined, profileId: string): OrganizationConfig {
  return duplicateProfileWithResult(config, profileId).config;
}

export function duplicateProfileWithResult(
  config: OrganizationConfig | undefined,
  profileId: string,
): { config: OrganizationConfig; duplicatedProfileId: string | null } {
  const base = config ?? DEFAULT_ORGANIZATION_CONFIG;
  const source = getAllProfiles(base).find((p) => p.id === profileId);
  if (!source) return { config: base, duplicatedProfileId: null };

  const duplicatedProfileId = `custom-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
  const copy: OrganizationProfileDefinition = {
    id: duplicatedProfileId,
    name: `${source.name} Copy`,
    description: source.description,
    isSystemProfile: false,
    weights: { ...source.weights },
  };

  return {
    config: {
      ...base,
      customProfiles: [...(base.customProfiles ?? []), copy],
    },
    duplicatedProfileId,
  };
}

export function deleteCustomProfile(config: OrganizationConfig | undefined, profileId: string): OrganizationConfig {
  const base = config ?? DEFAULT_ORGANIZATION_CONFIG;
  const nextCustom = (base.customProfiles ?? []).filter((p) => p.id !== profileId);

  const isDeletedActive = (base.activeProfileId ?? base.profile) === profileId;
  if (!isDeletedActive) {
    return {
      ...base,
      customProfiles: nextCustom,
    };
  }

  return {
    ...base,
    customProfiles: nextCustom,
    activeProfileId: base.profile,
    customWeights: undefined,
  };
}

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
