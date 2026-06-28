import type {
  EnvironmentType,
  SystemMaturityMetrics,
  EnvironmentMaturityStatus,
  PromotionRequirements,
  LearningEngineState,
} from '@/lib/types';

export const DEFAULT_PROMOTION_REQUIREMENTS: PromotionRequirements = {
  minTrades: 50,
  minWinRate: 0.55,
  minProfitFactor: 1.5,
  maxDrawdown: 0.20,
  minConsistency: 0.65,
  minSystemMaturity: 75,
};

export const ENVIRONMENT_SPECIFIC_REQUIREMENTS: Record<EnvironmentType, PromotionRequirements> = {
  sandbox: {
    minTrades: 20,
    minWinRate: 0.50,
    minProfitFactor: 1.2,
    maxDrawdown: 0.30,
    minConsistency: 0.50,
    minSystemMaturity: 60,
  },
  demo: {
    minTrades: 50,
    minWinRate: 0.55,
    minProfitFactor: 1.5,
    maxDrawdown: 0.20,
    minConsistency: 0.65,
    minSystemMaturity: 70,
  },
  paper: {
    minTrades: 100,
    minWinRate: 0.60,
    minProfitFactor: 1.8,
    maxDrawdown: 0.15,
    minConsistency: 0.75,
    minSystemMaturity: 80,
  },
  real: {
    minTrades: 0,
    minWinRate: 0,
    minProfitFactor: 0,
    maxDrawdown: 1,
    minConsistency: 0,
    minSystemMaturity: 0,
  },
};

export function calculateSystemMaturity(
  learningState: LearningEngineState
): SystemMaturityMetrics {
  const stats = learningState.globalStats;

  const totalTrades = stats.totalTrades;
  const winRate = stats.winRate;
  const profitFactor = stats.profitFactor;
  const drawdown = Math.abs(stats.maxDrawdownPercent);

  const consistency = calculateConsistency(learningState);
  const consensusQuality = calculateAverageConsensusQuality(learningState);
  const agentPrecision = calculateAverageAgentPrecision(learningState);

  const tradeMaturity = Math.min((totalTrades / 100) * 100, 100);
  
  const winRateScore = Math.min(winRate * 150, 100);
  
  const profitFactorScore = Math.min((profitFactor / 2) * 100, 100);
  
  const drawdownScore = Math.max(100 - (drawdown * 200), 0);
  
  const consistencyScore = consistency * 100;
  const consensusScore = consensusQuality * 100;
  const precisionScore = agentPrecision * 100;

  const maturityScore = (
    tradeMaturity * 0.20 +
    winRateScore * 0.20 +
    profitFactorScore * 0.15 +
    drawdownScore * 0.15 +
    consistencyScore * 0.10 +
    consensusScore * 0.10 +
    precisionScore * 0.10
  );

  return {
    totalTrades,
    consistency,
    drawdown,
    winRate,
    profitFactor,
    consensusQuality,
    agentPrecision,
    maturityScore: Math.round(maturityScore),
  };
}

function calculateConsistency(learningState: LearningEngineState): number {
  const trades = learningState.completedTrades;
  
  if (trades.length < 10) return 0;

  const recentTrades = trades.slice(-20);
  const returns = recentTrades.map((t) => t.pnlPercent);

  const mean = returns.reduce((sum, r) => sum + r, 0) / returns.length;
  const variance = returns.reduce((sum, r) => sum + Math.pow(r - mean, 2), 0) / returns.length;
  const stdDev = Math.sqrt(variance);

  const coefficientOfVariation = Math.abs(mean) > 0.01 ? stdDev / Math.abs(mean) : 10;

  const consistency = Math.max(0, 1 - (coefficientOfVariation / 2));
  
  return Math.min(consistency, 1);
}

function calculateAverageConsensusQuality(learningState: LearningEngineState): number {
  const trades = learningState.completedTrades;
  
  if (trades.length === 0) return 0;

  const recentTrades = trades.slice(-30);
  const avgConsensus = recentTrades.reduce((sum, t) => sum + t.consensus, 0) / recentTrades.length;

  return Math.min(avgConsensus / 100, 1);
}

function calculateAverageAgentPrecision(learningState: LearningEngineState): number {
  const agentPerformances = Object.values(learningState.agentPerformance);
  
  if (agentPerformances.length === 0) return 0;

  const avgAccuracy = agentPerformances.reduce((sum, p) => sum + p.accuracy, 0) / agentPerformances.length;

  return Math.min(avgAccuracy / 100, 1);
}

export function evaluateEnvironmentReadiness(
  environment: EnvironmentType,
  learningState: LearningEngineState
): EnvironmentMaturityStatus {
  const currentMetrics = calculateSystemMaturity(learningState);
  const requirements = ENVIRONMENT_SPECIFIC_REQUIREMENTS[environment];

  const missingRequirements: string[] = [];

  if (currentMetrics.totalTrades < requirements.minTrades) {
    missingRequirements.push(
      `Completar ${requirements.minTrades - currentMetrics.totalTrades} trades adicionales`
    );
  }

  if (currentMetrics.winRate < requirements.minWinRate) {
    missingRequirements.push(
      `Aumentar Win Rate a ${(requirements.minWinRate * 100).toFixed(0)}% (actual: ${(currentMetrics.winRate * 100).toFixed(0)}%)`
    );
  }

  if (currentMetrics.profitFactor < requirements.minProfitFactor) {
    missingRequirements.push(
      `Mejorar Profit Factor a ${requirements.minProfitFactor.toFixed(1)} (actual: ${currentMetrics.profitFactor.toFixed(1)})`
    );
  }

  if (currentMetrics.drawdown > requirements.maxDrawdown) {
    missingRequirements.push(
      `Reducir Drawdown bajo ${(requirements.maxDrawdown * 100).toFixed(0)}% (actual: ${(currentMetrics.drawdown * 100).toFixed(0)}%)`
    );
  }

  if (currentMetrics.consistency < requirements.minConsistency) {
    missingRequirements.push(
      `Mejorar consistencia a ${(requirements.minConsistency * 100).toFixed(0)}% (actual: ${(currentMetrics.consistency * 100).toFixed(0)}%)`
    );
  }

  if (currentMetrics.maturityScore < requirements.minSystemMaturity) {
    missingRequirements.push(
      `Alcanzar madurez del sistema de ${requirements.minSystemMaturity}% (actual: ${currentMetrics.maturityScore}%)`
    );
  }

  const readyForPromotion = missingRequirements.length === 0;

  return {
    environment,
    maturityScore: currentMetrics.maturityScore,
    readyForPromotion,
    requirements,
    currentMetrics,
    missingRequirements,
  };
}

export function canPromoteStrategy(
  from: EnvironmentType,
  maturityStatus: EnvironmentMaturityStatus
): boolean {
  if (from === 'real') return false;
  
  return maturityStatus.readyForPromotion;
}

export function getPromotionPath(): EnvironmentType[] {
  return ['sandbox', 'demo', 'paper', 'real'];
}

export function getEnvironmentLevel(env: EnvironmentType): number {
  const path = getPromotionPath();
  return path.indexOf(env);
}

export function calculateStrategyReadinessScore(
  maturityStatus: EnvironmentMaturityStatus
): number {
  const metrics = maturityStatus.currentMetrics;
  const req = maturityStatus.requirements;

  const scores: number[] = [
    Math.min((metrics.totalTrades / req.minTrades) * 100, 100),
    
    Math.min((metrics.winRate / req.minWinRate) * 100, 100),
    
    Math.min((metrics.profitFactor / req.minProfitFactor) * 100, 100),
    
    Math.min((req.maxDrawdown / Math.max(metrics.drawdown, 0.01)) * 100, 100),
    
    Math.min((metrics.consistency / req.minConsistency) * 100, 100),
    
    Math.min((metrics.maturityScore / req.minSystemMaturity) * 100, 100),
  ];

  const avgScore = scores.reduce((sum, s) => sum + s, 0) / scores.length;
  
  return Math.round(Math.min(avgScore, 100));
}
