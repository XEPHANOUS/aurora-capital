import type { ChatTurnResult } from '@/lib/chat/types';
import type { AgentType } from '@/lib/types';

export type TaskStatus = 'pending' | 'running' | 'completed' | 'failed';

export interface AgentReport {
  id: string;
  timestamp: string;
  agentId: AgentType;
  title: string;
  summary: string;
  confidence: number;
  recommendations: string[];
  metadata: Record<string, string | number | boolean | null>;
}

export interface AgentTask {
  id: string;
  assignedBy: AgentType;
  assignedTo: AgentType;
  title: string;
  description: string;
  status: TaskStatus;
  createdAt: string;
  completedAt?: string;
}

export interface AgentConversationMessage {
  sender: AgentType;
  receiver: AgentType;
  content: string;
  timestamp: string;
}

export interface AgentConversation {
  id: string;
  topic: string;
  messages: AgentConversationMessage[];
}

export interface CollaborationArtifact {
  id: string;
  type: 'alignment-score' | 'decision-trace' | 'archive-packet';
  title: string;
  summary: string;
  createdBy: AgentType;
  createdAt: string;
  metadata: Record<string, string | number | boolean | null>;
}

export interface DecisionTraceability {
  decisionId: string;
  timestamp: string;
  finalDecision: string;
  finalDecisionAgent: AgentType;
  reportsUsed: string[];
  agentsConsulted: AgentType[];
  alignmentScore: number;
  risksDetected: string[];
  auditorValidations: string[];
  survivalValidations: string[];
  why: string;
}

export interface ArchivistArchiveEntry {
  id: string;
  cycleId: string;
  timestamp: string;
  title: string;
  summary: string;
  reports: AgentReport[];
  tasks: AgentTask[];
  conversations: AgentConversation[];
  decisions: DecisionTraceability[];
  artifacts: CollaborationArtifact[];
}

export interface CollaborationCycle {
  id: string;
  prompt: string;
  timestamp: string;
  collaborationEnabled: boolean;
  consensusTurn: ChatTurnResult;
  reports: AgentReport[];
  tasks: AgentTask[];
  conversations: AgentConversation[];
  artifacts: CollaborationArtifact[];
  traceability: DecisionTraceability;
  archiveEntry: ArchivistArchiveEntry;
}

export interface CollaborationRunOptions {
  enabled: boolean;
}

export interface CollaborationPersistenceAdapter {
  saveCycle?: (cycle: CollaborationCycle) => Promise<void>;
  searchArchive?: (query: string) => Promise<ArchivistArchiveEntry[]>;
  listCycles?: () => Promise<CollaborationCycle[]>;
}
