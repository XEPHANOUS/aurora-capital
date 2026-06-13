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

export type OperationType = 'BUY' | 'SELL' | 'HOLD' | 'REDUCE POSITION' | 'INCREASE POSITION';

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

export type DecisionAction = 'BUY' | 'SELL' | 'HOLD' | 'REDUCE POSITION' | 'INCREASE POSITION' | 'VETO';
export type MarketRegime = 'bull' | 'bear' | 'sideways' | 'high-volatility' | 'low-volatility';

export interface AgentRecommendation {
  agentId: AgentType;
  agentName: string;
  recommendation: 'approve' | 'reject' | 'veto' | 'neutral';
  decisionAction: DecisionAction;
  confidence: number;
  reasoning: string;
  timestamp: string;
  reputation: number;
  weight: number;
}

export interface NewsAgentRecommendation extends AgentRecommendation {
  agentId: 'news';
  sentimentScore: number;
  relevantNews: string[];
}

export interface TechnicalAgentRecommendation extends AgentRecommendation {
  agentId: 'technical';
  indicators: {
    rsi: number;
    macd: 'bullish' | 'bearish' | 'neutral';
    trend: 'up' | 'down' | 'sideways';
  };
}

export interface RiskAgentRecommendation extends AgentRecommendation {
  agentId: 'risk';
  riskScore: number;
  positionSizeRecommendation: number;
  maxLoss: number;
}

export interface SurvivalAgentRecommendation extends AgentRecommendation {
  agentId: 'survival';
  survivalStatus: 'safe' | 'warning' | 'critical';
  vetoStatus: boolean;
  reserveImpact: number;
}

export interface ArchivistAgentRecommendation extends AgentRecommendation {
  agentId: 'archivist';
  similarOperations: number;
  historicalSuccessRate: number;
  bestMatch?: Operation;
}

export interface InvestorAgentRecommendation extends AgentRecommendation {
  agentId: 'investor';
  proposedAsset: string;
  proposedAction: OperationType;
  proposedAmount: number;
  estimatedReturn: number;
}

export interface DirectorAgentRecommendation extends AgentRecommendation {
  agentId: 'director';
  finalDecision: 'approved' | 'rejected';
  combinedConfidence: number;
  explanation: string;
}

export type DetailedAgentRecommendation = 
  | NewsAgentRecommendation
  | TechnicalAgentRecommendation
  | RiskAgentRecommendation
  | SurvivalAgentRecommendation
  | ArchivistAgentRecommendation
  | InvestorAgentRecommendation
  | DirectorAgentRecommendation;

export interface HistoricalTrade {
  asset: string;
  action: OperationType;
  amount: number;
  outcome: 'success' | 'failure';
  return: number;
  date: string;
}

export interface SurvivalMetrics {
  currentCapital: number;
  survivalReserve: number;
  maxDrawdown: number;
  dailyLossLimit: number;
  riskAfterTrade: number;
  survivalProbability: number;
}

export interface RiskMetrics {
  positionSize: number;
  stopLoss: number;
  takeProfit: number;
  riskRewardRatio: number;
  maxPotentialLoss: number;
}

export interface ConflictAnalysis {
  agreeing: AgentType[];
  disagreeing: AgentType[];
  conflicts: Array<{
    agents: [AgentType, AgentType];
    reason: string;
  }>;
}

export interface DecisionQualityScore {
  score: number;
  agentAgreement: number;
  historicalConfidence: number;
  marketConditions: number;
  survivalSafety: number;
  quality: 'low' | 'medium' | 'high';
}

export interface WeightedVote {
  agentId: AgentType;
  rawVote: 'approve' | 'reject' | 'veto' | 'neutral';
  rawConfidence: number;
  weightedScore: number;
  weight: number;
  reputation: number;
}

export interface DecisionSession {
  id: string;
  timestamp: string;
  status: 'active' | 'completed' | 'vetoed' | 'rejected';
  proposal: {
    asset: string;
    action: OperationType;
    amount: number;
  };
  recommendations: DetailedAgentRecommendation[];
  finalDecision?: {
    approved: boolean;
    reason: string;
    timestamp: string;
    executionBlocked?: boolean;
    blockReason?: string;
  };
  consensusLevel: number;
  duration: number;
  marketRegime?: MarketRegime;
  survivalMetrics?: SurvivalMetrics;
  riskMetrics?: RiskMetrics;
  conflictAnalysis?: ConflictAnalysis;
  qualityScore?: DecisionQualityScore;
  weightedVotes?: WeightedVote[];
}

export interface LearningRecord {
  sessionId: string;
  outcome: 'success' | 'failure' | 'pending';
  agentPerformance: Record<AgentType, {
    wasCorrect: boolean;
    reputationChange: number;
    newReputation: number;
  }>;
  lessons: string[];
  timestamp: string;
}
