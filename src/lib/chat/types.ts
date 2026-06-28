import type { AgentType } from '@/lib/types';

export type ChatAgentId = AgentType | 'analyst';

export type ChatMode = 'direct' | 'consensus' | 'debate';

export type ChatMessageRole = 'user' | 'agent' | 'system';

export interface ChatAgentIdentity {
  id: ChatAgentId;
  mention: string;
  name: string;
  title: string;
}

export interface ChatAgentProfile {
  identity: ChatAgentIdentity;
  personality: string;
  capabilities: string[];
  responseStyle: {
    tone: string;
    maxSentences: number;
    includeRiskFlag: boolean;
  };
  routing: {
    directEnabled: boolean;
    consensusEnabled: boolean;
    aliases: string[];
  };
  consensus: {
    role: 'analyst' | 'reviewer' | 'guardian' | 'coordinator' | 'synthesizer';
    order: number;
    finalSynthesizer: boolean;
  };
}

export interface ChatMessage {
  id: string;
  role: ChatMessageRole;
  mode: ChatMode;
  content: string;
  createdAt: string;
  agentId?: ChatAgentId;
  agentName?: string;
  confidenceScore?: number;
}

export interface AgentReply {
  agentId: ChatAgentId;
  agentName: string;
  content: string;
  confidenceScore: number;
  order: number;
}

export interface DirectRouteResult {
  mode: 'direct';
  cleanedPrompt: string;
  targetAgentId: ChatAgentId;
}

export interface ConsensusRouteResult {
  mode: 'consensus';
  cleanedPrompt: string;
}

export interface DebateRouteResult {
  mode: 'debate';
  cleanedPrompt: string;
}

export type ChatRouteResult = DirectRouteResult | ConsensusRouteResult | DebateRouteResult;

export interface ChatTurnResult {
  mode: ChatMode;
  userMessage: ChatMessage;
  agentMessages: ChatMessage[];
}
