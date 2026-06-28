export type AgentType = 
  | 'news'
  | 'technical'
  | 'analyst'
  | 'risk'
  | 'survival'
  | 'archivist'
  | 'investor'
  | 'director'
  | 'supervisor'
  | 'auditor';

export type AgentStatus = 'active' | 'idle' | 'analyzing' | 'alert';

export type AIAgentType = 'llm' | 'rule-based' | 'hybrid';

export type LLMProvider = 'openai' | 'anthropic' | 'ollama' | 'lmstudio' | 'local';

export type LLMModel = 
  | 'gpt-4o'
  | 'gpt-4o-mini'
  | 'gpt-4-turbo'
  | 'claude-3-opus'
  | 'claude-3-sonnet'
  | 'claude-3-haiku'
  | 'llama-3-70b'
  | 'llama-3-8b'
  | 'mistral-large'
  | 'mixtral-8x7b'
  | 'qwen3-14b-gguf'
  | 'qwen3-14b-safetensors'
  | 'custom';

export type ModelAssignmentMode = 'global' | 'per-agent';
export type LocalModelFormat = 'gguf' | 'safetensors';
export type AgentExecutionRole = 'observer' | 'analyst' | 'executor' | 'guardian' | 'director';

export interface AgentGuardrails {
  maxRiskPercent?: number;
  maxPositionSize?: number;
  blockedAssets?: string[];
}

export interface AgentModelConfig {
  provider: LLMProvider;
  model: LLMModel;
  temperature: number;
  contextSize: number;
  maxTokens?: number;
  localModelFormat?: LocalModelFormat;
  localModelPath?: string;
}

export interface Agent {
  id: AgentType;
  name: string;
  description: string;
  reputation: number;
  status: AgentStatus;
  lastAction?: string;
  confidence?: number;
  agentType: AIAgentType;
  modelConfig?: AgentModelConfig;
  priority: number;
  influence: number;
  reportsTo?: AgentType;
  executionRole?: AgentExecutionRole;
  guardrails?: AgentGuardrails;
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
  agentVotes: Partial<Record<AgentType, { vote: boolean; reason: string; confidence?: number }>>;
  survivalVeto: boolean;
  directorDecision: 'pending' | 'approved' | 'rejected';
  directorReason?: string;
}

export type OrganizationalProfile = 'conservative' | 'balanced' | 'aggressive' | 'survival-first';

export interface ProfileWeights {
  director: number;
  auditor: number;
  risk: number;
  news: number;
  technical: number;
  analyst: number;
  archivist: number;
  investor: number;
  survival: number;
  supervisor: number;
}

export interface OrganizationProfileDefinition {
  id: string;
  name: string;
  description: string;
  isSystemProfile: boolean;
  weights: ProfileWeights;
}

export interface OrganizationConfig {
  profile: OrganizationalProfile;
  activeProfileId?: string;
  customProfiles?: OrganizationProfileDefinition[];
  customWeights?: ProfileWeights;
  hierarchy: Record<AgentType, AgentType | null>;
}

export interface SystemConfig {
  simulationMode: boolean;
  totalCapital: number;
  survivalReservePercent: number;
  maxRiskPerOperation: number;
  dailyLossLimit: number;
  telegramConnected: boolean;
  telegramSettings?: {
    botToken?: string;
    allowedUserId?: number;
    mode?: 'polling' | 'webhook';
    webhookUrl?: string;
    pollingEnabled?: boolean;
    lastCheckAt?: string;
    lastError?: string;
    botId?: number;
    botName?: string;
    botUsername?: string;
  };
  notifications: {
    executedOperations: boolean;
    riskAlerts: boolean;
    survivalVeto: boolean;
    dailyReport: boolean;
  };
  organization?: OrganizationConfig;
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

export type EnvironmentType = 'sandbox' | 'demo' | 'paper' | 'real';
export type DataProviderType = 'mock' | 'live';
export type ConnectionStatus = 'connected' | 'disconnected' | 'connecting' | 'error';

export interface Portfolio {
  id: string;
  name: string;
  environment: EnvironmentType;
  balance: number;
  initialBalance: number;
  operations: Operation[];
  statistics: PortfolioStatistics;
  riskControls: RiskControls;
  createdAt: string;
  lastUpdated: string;
}

export interface PortfolioStatistics {
  totalTrades: number;
  successfulTrades: number;
  failedTrades: number;
  totalReturn: number;
  averageReturn: number;
  maxDrawdown: number;
  sharpeRatio: number;
  winRate: number;
}

export interface RiskControls {
  maxPositionSize: number;
  maxDailyLoss: number;
  maxDrawdown: number;
  stopLossRequired: boolean;
  requiresApproval: boolean;
}

export interface StrategyStatus {
  environment: EnvironmentType;
  certified: boolean;
  tradesCompleted: number;
  successRate: number;
  totalReturn: number;
  certificationDate?: string;
  nextReviewDate?: string;
  canPromote: boolean;
  promotionRequirements?: {
    minTrades: number;
    minSuccessRate: number;
    minReturn: number;
  };
}

export interface MarketDataProvider {
  id: string;
  name: string;
  type: DataProviderType;
  status: ConnectionStatus;
  lastUpdate?: string;
  latency?: number;
  config: {
    apiKey?: string;
    baseUrl?: string;
    updateInterval?: number;
  };
}

export interface DataSourceStatus {
  provider: MarketDataProvider;
  marketStatus: 'open' | 'closed' | 'pre-market' | 'after-hours' | 'unknown';
  lastSuccessfulUpdate?: string;
  errorCount: number;
  lastError?: string;
}

export interface AgentVote {
  agentId: AgentType;
  recommendedAction: DecisionAction;
  voteOnProposal: 'APPROVE' | 'REJECT' | 'VETO';
  confidence: number;
  reasoning: string;
}

export interface ConsensusDistribution {
  buy: number;
  sell: number;
  hold: number;
  reducePosition: number;
  increasePosition: number;
  veto: number;
}

export interface DirectorDecision {
  finalAction: DecisionAction;
  consensusScore: number;
  qualityScore: number;
  supportingFactors: string[];
  riskFactors: string[];
  explanation: string;
}

export interface SurvivalAnalysis {
  currentCapital: number;
  survivalReserve: number;
  operationalCapital: number;
  capitalAfterTrade: number;
  reserveAfterTrade: number;
  survivalMargin: number;
  survivalProbability: number;
  automaticVeto: boolean;
  vetoReason?: string;
}

export interface HistoricalAnalysis {
  similarTrades: HistoricalTrade[];
  totalSimilar: number;
  successRate: number;
  failureRate: number;
  averageReturn: number;
  averageLoss: number;
  lessonsLearned: string[];
}

export interface ReputationChange {
  agentId: AgentType;
  previousReputation: number;
  currentReputation: number;
  change: number;
  reason: string;
  timestamp: string;
}

export interface EnhancedRiskMetrics extends RiskMetrics {
  dailyRiskExposure: number;
  totalExposure: number;
  concentrationRisk: number;
}

export interface APIIntegrationConfig {
  coinGecko?: {
    enabled: boolean;
    apiKey?: string;
    status: ConnectionStatus;
    lastCheck?: string;
  };
  newsAPI?: {
    enabled: boolean;
    apiKey?: string;
    status: ConnectionStatus;
    lastCheck?: string;
  };
  telegram?: {
    enabled: boolean;
    botToken?: string;
    chatId?: string;
    status: ConnectionStatus;
    lastCheck?: string;
  };
  rssFeed?: {
    enabled: boolean;
    feeds: string[];
    status: ConnectionStatus;
    lastCheck?: string;
  };
}

export interface EnhancedDecisionSession extends DecisionSession {
  agentVotes: AgentVote[];
  consensusDistribution: ConsensusDistribution;
  directorDecision: DirectorDecision;
  survivalAnalysis: SurvivalAnalysis;
  historicalAnalysis?: HistoricalAnalysis;
  enhancedRiskMetrics?: EnhancedRiskMetrics;
  dataSource: DataSourceStatus;
  portfolio: {
    id: string;
    environment: EnvironmentType;
  };
}

export type VetoType = 'risk' | 'survival' | 'auditor' | 'director-override';

export interface VetoRule {
  type: VetoType;
  active: boolean;
  agentId: AgentType;
  condition: string;
  priority: number;
}

export interface VetoResult {
  triggered: boolean;
  type?: VetoType;
  agentId?: AgentType;
  reason?: string;
  timestamp?: string;
}

export interface TradeQualityFactors {
  consensus: number;
  risk: number;
  volatility: number;
  averageConfidence: number;
  profitRiskRatio: number;
  agentAlignment: number;
}

export interface TradeQuality {
  score: number;
  grade: 'Poor' | 'Weak' | 'Average' | 'Good' | 'Elite';
  factors: TradeQualityFactors;
}

export interface CompletedTrade {
  id: string;
  sessionId: string;
  symbol: string;
  action: OperationType;
  entryPrice: number;
  exitPrice: number;
  amount: number;
  pnl: number;
  pnlPercent: number;
  consensus: number;
  agentVotes: Record<AgentType, { vote: 'APPROVE' | 'REJECT' | 'VETO'; confidence: number }>;
  agentReputationsUsed: Record<AgentType, number>;
  outcome: 'win' | 'loss' | 'breakeven';
  timestamp: string;
  exitTimestamp: string;
  duration: number;
  tradeQuality?: TradeQuality;
}

export interface AgentPerformanceStats {
  agentId: AgentType;
  agentName: string;
  reputation: number;
  totalVotes: number;
  correctVotes: number;
  incorrectVotes: number;
  accuracy: number;
  winRate: number;
  avgPnlWhenCorrect: number;
  avgPnlWhenWrong: number;
  totalPnlInfluence: number;
  consistency: number;
  drawdownCaused: number;
  reputationHistory: { timestamp: string; reputation: number; reason: string }[];
}

export interface LearningEngineState {
  completedTrades: CompletedTrade[];
  agentPerformance: Record<AgentType, AgentPerformanceStats>;
  globalStats: {
    totalTrades: number;
    winningTrades: number;
    losingTrades: number;
    breakEvenTrades: number;
    winRate: number;
    totalPnl: number;
    totalPnlPercent: number;
    avgWin: number;
    avgLoss: number;
    profitFactor: number;
    sharpeRatio: number;
    maxDrawdown: number;
    maxDrawdownPercent: number;
    currentDrawdown: number;
    consecutiveWins: number;
    consecutiveLosses: number;
    bestTrade: number;
    worstTrade: number;
  };
  lastUpdated: string;
}

export interface ReputationUpdate {
  agentId: AgentType;
  oldReputation: number;
  newReputation: number;
  change: number;
  reason: string;
  tradeId: string;
  timestamp: string;
}

export interface ConsensusCalculation {
  rawConsensus: number;
  weightedConsensus: number;
  votes: {
    agentId: AgentType;
    vote: 'APPROVE' | 'REJECT' | 'VETO';
    confidence: number;
    influence: number;
    reputation: number;
    effectiveInfluence: number;
    weightedScore: number;
  }[];
  totalInfluence: number;
  approveScore: number;
  rejectScore: number;
  vetoCount: number;
}

export interface VetoCheckResult {
  hasVeto: boolean;
  vetos: VetoResult[];
  finalDecision: 'APPROVED' | 'REJECTED';
  blockingVeto?: VetoResult;
}

export interface DecisionExplanation {
  summary: string;
  consensusScore: number;
  tradeQuality: TradeQuality;
  supportingAgents: { agentId: AgentType; name: string; confidence: number }[];
  opposingAgents: { agentId: AgentType; name: string; confidence: number }[];
  neutralAgents: { agentId: AgentType; name: string; confidence: number }[];
  vetosEvaluated: VetoResult[];
  riskFactors: string[];
  finalDecision: 'APPROVED' | 'REJECTED';
  decisionReason: string;
}

export interface PromotionRequirements {
  minTrades: number;
  minWinRate: number;
  minProfitFactor: number;
  maxDrawdown: number;
  minConsistency: number;
  minSystemMaturity: number;
}

export interface SystemMaturityMetrics {
  totalTrades: number;
  consistency: number;
  drawdown: number;
  winRate: number;
  profitFactor: number;
  consensusQuality: number;
  agentPrecision: number;
  maturityScore: number;
}

export interface EnvironmentMaturityStatus {
  environment: EnvironmentType;
  maturityScore: number;
  readyForPromotion: boolean;
  requirements: PromotionRequirements;
  currentMetrics: SystemMaturityMetrics;
  missingRequirements: string[];
}

export interface ShadowModeComparison {
  auroraReturn: number;
  realPortfolioReturn: number;
  difference: number;
  alphaGenerated: number;
  period: string;
  trades: number;
}

export interface RealTradingConfirmation {
  confirmed: boolean;
  timestamp: string;
  expiresAt: string;
  acknowledgedRisks: string[];
}

export interface EnvironmentSettings {
  sandbox: {
    initialCapital: number;
    learningRate: number;
  };
  demo: {
    initialCapital: number;
    dataRefreshInterval: number;
  };
  paper: {
    initialCapital: number;
    orderSimulationDelay: number;
  };
  real: {
    exchangeConnected: boolean;
    apiKeys: {
      configured: boolean;
      lastValidated?: string;
    };
    safetyChecks: {
      requiresConfirmation: boolean;
      confirmationExpiryHours: number;
      maxDailyTrades: number;
      maxTradeSize: number;
    };
  };
  promotionRequirements: PromotionRequirements;
  apiIntegrations: APIIntegrationConfig;
}

export type RuleAction = 'allow' | 'reject';

export interface TradingRule {
  id: string;
  name: string;
  enabled: boolean;
  scope: 'agent' | 'strategy' | 'global';
  agentId?: AgentType;
  strategyId?: string;
  priority: number;
  conditions: {
    maxRiskPercent?: number;
    maxPositionSize?: number;
    allowedActions?: OperationType[];
    blockedAssets?: string[];
    allowedEnvironments?: EnvironmentType[];
  };
  action: RuleAction;
  reason: string;
}

export interface RuleEvaluationInput {
  environment: EnvironmentType;
  agentId?: AgentType;
  strategyId?: string;
  asset: string;
  action: OperationType;
  amount: number;
  currentCapital: number;
  estimatedRiskPercent?: number;
}

export interface RuleEvaluationResult {
  allowed: boolean;
  blockingRule?: TradingRule;
  matchedRules: TradingRule[];
  reason: string;
}

export interface PaperPosition {
  id: string;
  environment: Extract<EnvironmentType, 'sandbox' | 'demo' | 'paper'>;
  symbol: string;
  side: 'long' | 'short';
  quantity: number;
  entryPrice: number;
  currentPrice: number;
  stopLoss?: number;
  takeProfit?: number;
  trailingStopPercent?: number;
  trailingStopPrice?: number;
  status: 'open' | 'closed';
  openedAt: string;
  closedAt?: string;
  realizedPnl?: number;
  realizedPnlPercent?: number;
  maxRiskAmount?: number;
}

export interface PaperTradingSnapshot {
  positions: PaperPosition[];
  realizedPnl: number;
  unrealizedPnl: number;
  totalRiskAmount: number;
  historyCount: number;
}

export interface ArchivistRecord {
  id: string;
  type: 'consensus' | 'conversation' | 'operation' | 'rule' | 'strategy' | 'report';
  title: string;
  content: string;
  metadata?: Record<string, string | number | boolean>;
  embedding?: number[];
  createdAt: string;
}
