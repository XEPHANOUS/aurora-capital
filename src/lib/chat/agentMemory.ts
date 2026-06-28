import type { AgentType } from '@/lib/types';
import type { ChatMessage, ChatMode } from '@/lib/chat/types';

export interface ConversationRecord {
  sessionId: string;
  mode: ChatMode;
  userMessage: ChatMessage;
  agentMessages: ChatMessage[];
  createdAt: string;
}

export interface DecisionRecord {
  sessionId: string;
  prompt: string;
  summary: string;
  decidedBy?: AgentType;
  mode: ChatMode;
  createdAt: string;
  tags?: string[];
}

export interface RecentContextQuery {
  sessionId: string;
  limit?: number;
}

export interface HistoricalDecisionsQuery {
  sessionId?: string;
  limit?: number;
  fromDate?: string;
  toDate?: string;
}

export interface AgentMemoryProvider {
  recordConversation: (record: ConversationRecord) => Promise<void> | void;
  recordDecision: (record: DecisionRecord) => Promise<void> | void;
  getRecentContext: (query: RecentContextQuery) => Promise<ConversationRecord[]> | ConversationRecord[];
  getHistoricalDecisions: (query: HistoricalDecisionsQuery) => Promise<DecisionRecord[]> | DecisionRecord[];
}

export function createNoopAgentMemory(): AgentMemoryProvider {
  return {
    recordConversation: async () => {},
    recordDecision: async () => {},
    getRecentContext: async () => [],
    getHistoricalDecisions: async () => [],
  };
}
