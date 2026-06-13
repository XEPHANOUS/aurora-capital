export type AgentType = 
  | 'news'
  | 'technical'
  | 'risk'
  | 'survival'
  | 'archivist'
  | 'investor'
  | 'director'
  | 'supervisor';

export type AgentStatus = 'active' | 'idle' | 'analyzing' | 'alert';

export interface Agent {
  id: AgentType;
  name: string;
  description: string;
  reputation: number;
  status: AgentStatus;
  lastAction?: string;
  confidence?: number;
}

export type OperationType = 'BUY' | 'SELL' | 'HOLD';

export type OperationStatus = 'pending' | 'approved' | 'vetoed' | 'executed' | 'cancelled';

export interface Operation {
  id: string;
  date: string;
  asset: string;
  action: OperationType;
  amount: number;
  result?: number;
  status: OperationStatus;
  confidence: number;
  agentVotes: Record<AgentType, boolean>;
  vetoReason?: string;
}

export interface MarketPosition {
  asset: string;
  amount: number;
  entryPrice: number;
  currentPrice: number;
  change24h: number;
  trend: number[];
}

export interface NewsItem {
  id: string;
  title: string;
  sentiment: 'positive' | 'negative' | 'neutral';
  timestamp: string;
}

export interface InvestmentProposal {
  id: string;
  asset: string;
  action: OperationType;
  amount: number;
  confidence: number;
  globalConfidence: number;
  risk: number;
  estimatedReturn: number;
  agentVotes: Partial<Record<AgentType, { vote: boolean; reason: string }>>;
  survivalVeto: boolean;
  directorDecision: 'pending' | 'approved' | 'rejected';
  directorReason?: string;
}

export interface SystemConfig {
  simulationMode: boolean;
  totalCapital: number;
  survivalReservePercent: number;
  maxRiskPerOperation: number;
  dailyLossLimit: number;
  telegramConnected: boolean;
  notifications: {
    executedOperations: boolean;
    riskAlerts: boolean;
    survivalVeto: boolean;
    dailyReport: boolean;
  };
}

export interface MarketSentiment {
  overall: 'positive' | 'negative' | 'neutral';
  score: number;
  summary: string;
  lastUpdate: string;
}
