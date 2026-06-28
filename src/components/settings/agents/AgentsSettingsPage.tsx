import { lazy, Suspense, useMemo } from 'react';
import type { Agent, OrganizationConfig, SystemConfig } from '@/lib/types';
import type { AgentSubRoute } from '@/components/settings/agents/constants';
import { SettingsHeader } from '@/components/settings/SettingsHeader';
import { AgentTabs } from '@/components/settings/AgentTabs';

const AgentsAssignmentPage = lazy(() => import('@/pages/settings/AgentsAssignmentPage').then((module) => ({ default: module.AgentsAssignmentPage })));
const AgentsProfilesPage = lazy(() => import('@/pages/settings/AgentsProfilesPage').then((module) => ({ default: module.AgentsProfilesPage })));
const AgentsHierarchyPage = lazy(() => import('@/pages/settings/AgentsHierarchyPage').then((module) => ({ default: module.AgentsHierarchyPage })));
const AgentsInfluencePage = lazy(() => import('@/pages/settings/AgentsInfluencePage').then((module) => ({ default: module.AgentsInfluencePage })));

interface AgentsSettingsPageProps {
  path: string;
  agents: Agent[];
  config: SystemConfig;
  activeEnvironment?: string;
  localModelFiles?: Array<{
    name: string;
    sizeBytes: number;
    mimeType?: string;
    loadedAt: string;
  }>;
  onUpdateAgent: (agentId: string, updates: Partial<Agent>) => void;
  onProfileChange: (profileId: string) => void;
  onOrganizationConfigChange: (updater: (current: OrganizationConfig | undefined) => OrganizationConfig) => void;
  navigate: (path: string) => void;
}

export function AgentsSettingsPage({
  path,
  agents,
  config,
  activeEnvironment,
  localModelFiles,
  onUpdateAgent,
  onProfileChange,
  onOrganizationConfigChange,
  navigate,
}: AgentsSettingsPageProps) {
  const activeSubRoute = useMemo<AgentSubRoute>(() => {
    const parts = path.split('/').filter(Boolean);
    const maybe = parts[2] as AgentSubRoute | undefined;
    if (!maybe || !['assignment', 'profiles', 'hierarchy', 'influence'].includes(maybe)) {
      return 'assignment';
    }
    return maybe;
  }, [path]);

  const goTo = (subRoute: AgentSubRoute) => navigate(`/settings/agents/${subRoute}`);
  const fallback = <div className="h-full" />;

  return (
    <div className="flex flex-col h-full min-h-0 space-y-6">
      <SettingsHeader
        title="Agentes"
        description="Gestion completa de agentes, roles, jerarquias y configuracion de modelos LLM"
      />

      <AgentTabs activeSubRoute={activeSubRoute} onChange={goTo} />

      <div className="flex-1 min-h-0">
        <Suspense fallback={fallback}>
          {activeSubRoute === 'assignment' && (
            <AgentsAssignmentPage
              agents={agents}
              onUpdateAgent={onUpdateAgent}
              localModelFiles={localModelFiles}
            />
          )}
          {activeSubRoute === 'profiles' && (
            <AgentsProfilesPage
              agents={agents}
              organizationConfig={config.organization}
              activeEnvironment={activeEnvironment}
              onProfileChange={onProfileChange}
              onNavigateToInfluence={(profileId) => {
                onProfileChange(profileId);
                navigate('/settings/agents/influence');
              }}
              onOrganizationConfigChange={onOrganizationConfigChange}
            />
          )}
          {activeSubRoute === 'hierarchy' && <AgentsHierarchyPage agents={agents} />}
          {activeSubRoute === 'influence' && (
            <AgentsInfluencePage
              agents={agents}
              organizationConfig={config.organization}
              onOrganizationConfigChange={onOrganizationConfigChange}
            />
          )}
        </Suspense>
      </div>
    </div>
  );
}
