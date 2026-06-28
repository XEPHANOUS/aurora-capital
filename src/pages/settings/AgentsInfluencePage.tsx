import { AgentInfluencePage } from '@/components/settings/agents/AgentInfluencePage';
import type { Agent, OrganizationConfig } from '@/lib/types';

interface AgentsInfluencePageProps {
  agents: Agent[];
  organizationConfig?: OrganizationConfig;
  onOrganizationConfigChange?: (updater: (current: OrganizationConfig | undefined) => OrganizationConfig) => void;
}

export function AgentsInfluencePage({ agents, organizationConfig, onOrganizationConfigChange }: AgentsInfluencePageProps) {
  return <AgentInfluencePage agents={agents} organizationConfig={organizationConfig} onOrganizationConfigChange={onOrganizationConfigChange} />;
}
