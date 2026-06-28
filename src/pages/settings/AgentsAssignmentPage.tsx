import { AgentAssignmentPage } from '@/components/settings/agents/AgentAssignmentPage';
import type { Agent } from '@/lib/types';

interface AgentsAssignmentPageProps {
  agents: Agent[];
  onUpdateAgent: (agentId: string, updates: Partial<Agent>) => void;
  localModelFiles?: Array<{
    name: string;
    sizeBytes: number;
    mimeType?: string;
    loadedAt: string;
  }>;
}

export function AgentsAssignmentPage({ agents, onUpdateAgent, localModelFiles }: AgentsAssignmentPageProps) {
  return <AgentAssignmentPage agents={agents} onUpdateAgent={onUpdateAgent} localModelFiles={localModelFiles} />;
}
