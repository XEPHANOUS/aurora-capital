import { AgentProfilesPage } from '@/components/settings/agents/AgentProfilesPage';
import type { Agent, OrganizationConfig } from '@/lib/types';

interface AgentsProfilesPageProps {
  agents: Agent[];
  organizationConfig?: OrganizationConfig;
  activeEnvironment?: string;
  onProfileChange: (profileId: string) => void;
  onNavigateToInfluence: (profileId: string) => void;
  onOrganizationConfigChange: (updater: (current: OrganizationConfig | undefined) => OrganizationConfig) => void;
}

export function AgentsProfilesPage({
  agents,
  organizationConfig,
  activeEnvironment,
  onProfileChange,
  onNavigateToInfluence,
  onOrganizationConfigChange,
}: AgentsProfilesPageProps) {
  return (
    <AgentProfilesPage
      agents={agents}
      organizationConfig={organizationConfig}
      activeEnvironment={activeEnvironment}
      onProfileChange={onProfileChange}
      onNavigateToInfluence={onNavigateToInfluence}
      onOrganizationConfigChange={onOrganizationConfigChange}
    />
  );
}
