import { AgentHierarchyPage } from '@/components/settings/agents/AgentHierarchyPage';
import type { Agent } from '@/lib/types';

interface AgentsHierarchyPageProps {
  agents: Agent[];
}

export function AgentsHierarchyPage({ agents }: AgentsHierarchyPageProps) {
  return <AgentHierarchyPage agents={agents} />;
}
