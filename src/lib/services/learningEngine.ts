import type { 
  CompletedTrade, 
  LearningEngineState, 
  AgentPerformanceStats, 
  AgentType,
  ReputationUpdate 
} from '@/lib/types';

const MIN_REPUTATION = 0;
const MAX_REPUTATION = 100;
const INITIAL_REPUTATION = 70;

const REPUTATION_REWARD = {
  STRONG_WIN: 3,
  WIN: 2,
  SMALL_WIN: 1,
  BREAKEVEN: 0,
  SMALL_LOSS: -1,
  LOSS: -2,
  STRONG_LOSS: -3,
};

export function initializeLearningEngine(): LearningEngineState {
  return {
    completedTrades: [],
    agentPerformance: {} as Record<AgentType, AgentPerformanceStats>,
    globalStats: {
      totalTrades: 0,
      winningTrades: 0,
      losingTrades: 0,
      breakEvenTrades: 0,
      winRate: 0,
      totalPnl: 0,
      totalPnlPercent: 0,
      avgWin: 0,
      avgLoss: 0,
      profitFactor: 0,
      sharpeRatio: 0,
      maxDrawdown: 0,
      maxDrawdownPercent: 0,
      currentDrawdown: 0,
      consecutiveWins: 0,
      consecutiveLosses: 0,
      bestTrade: 0,
      worstTrade: 0,
    },
    lastUpdated: new Date().toISOString(),
  };
}

export function initializeAgentPerformance(
  agentId: AgentType,
  agentName: string,
  initialReputation: number = INITIAL_REPUTATION
): AgentPerformanceStats {
  return {
    agentId,
    agentName,
    reputation: initialReputation,
    totalVotes: 0,
    correctVotes: 0,
    incorrectVotes: 0,
    accuracy: 0,
    winRate: 0,
    avgPnlWhenCorrect: 0,
    avgPnlWhenWrong: 0,
    totalPnlInfluence: 0,
    consistency: 0,
    drawdownCaused: 0,
    reputationHistory: [
      {
        timestamp: new Date().toISOString(),
        reputation: initialReputation,
        reason: 'Initial reputation',
      },
    ],
  };
}

export function recordCompletedTrade(
  state: LearningEngineState,
  trade: CompletedTrade
): LearningEngineState {
  const newTrades = [...state.completedTrades, trade];
  const globalStats = calculateGlobalStats(newTrades);

  return {
    ...state,
    completedTrades: newTrades,
    globalStats,
    lastUpdated: new Date().toISOString(),
  };
}

export function updateAgentReputations(
  state: LearningEngineState,
  trade: CompletedTrade
): { state: LearningEngineState; updates: ReputationUpdate[] } {
  const updates: ReputationUpdate[] = [];
  const newPerformance = { ...state.agentPerformance };

  Object.entries(trade.agentVotes).forEach(([agentId, voteData]) => {
    const agent = agentId as AgentType;
    
    if (!newPerformance[agent]) {
      return;
    }

    const stats = { ...newPerformance[agent] };
    const wasCorrect = evaluateAgentVote(voteData.vote, trade.outcome);
    
    const oldReputation = stats.reputation;
    const reputationChange = calculateReputationChange(trade.pnlPercent, wasCorrect);
    const newReputation = clampReputation(oldReputation + reputationChange);

    stats.reputation = newReputation;
    stats.totalVotes += 1;
    
    if (wasCorrect) {
      stats.correctVotes += 1;
      stats.avgPnlWhenCorrect = 
        (stats.avgPnlWhenCorrect * (stats.correctVotes - 1) + trade.pnlPercent) / stats.correctVotes;
    } else {
      stats.incorrectVotes += 1;
      stats.avgPnlWhenWrong = 
        (stats.avgPnlWhenWrong * (stats.incorrectVotes - 1) + trade.pnlPercent) / stats.incorrectVotes;
      
      if (trade.pnlPercent < 0) {
        stats.drawdownCaused += Math.abs(trade.pnlPercent);
      }
    }

    stats.accuracy = (stats.correctVotes / stats.totalVotes) * 100;
    stats.winRate = trade.outcome === 'win' ? stats.winRate + 1 : stats.winRate;
    stats.totalPnlInfluence += trade.pnlPercent;
    stats.consistency = calculateConsistency(stats);

    stats.reputationHistory.push({
      timestamp: trade.exitTimestamp,
      reputation: newReputation,
      reason: wasCorrect 
        ? `Correct prediction on ${trade.symbol} (${trade.pnlPercent.toFixed(2)}%)` 
        : `Incorrect prediction on ${trade.symbol} (${trade.pnlPercent.toFixed(2)}%)`,
    });

    if (stats.reputationHistory.length > 100) {
      stats.reputationHistory = stats.reputationHistory.slice(-100);
    }

    newPerformance[agent] = stats;

    updates.push({
      agentId: agent,
      oldReputation,
      newReputation,
      change: reputationChange,
      reason: wasCorrect ? 'Correct prediction' : 'Incorrect prediction',
      tradeId: trade.id,
      timestamp: trade.exitTimestamp,
    });
  });

  return {
    state: {
      ...state,
      agentPerformance: newPerformance,
      lastUpdated: new Date().toISOString(),
    },
    updates,
  };
}

function evaluateAgentVote(
  vote: 'APPROVE' | 'REJECT' | 'VETO',
  outcome: 'win' | 'loss' | 'breakeven'
): boolean {
  if (vote === 'VETO') {
    return outcome === 'loss';
  }
  
  if (vote === 'APPROVE') {
    return outcome === 'win' || outcome === 'breakeven';
  }
  
  if (vote === 'REJECT') {
    return outcome === 'loss' || outcome === 'breakeven';
  }
  
  return false;
}

function calculateReputationChange(pnlPercent: number, wasCorrect: boolean): number {
  if (!wasCorrect) {
    if (pnlPercent < -10) return REPUTATION_REWARD.STRONG_LOSS;
    if (pnlPercent < -5) return REPUTATION_REWARD.LOSS;
    return REPUTATION_REWARD.SMALL_LOSS;
  }

  if (pnlPercent > 10) return REPUTATION_REWARD.STRONG_WIN;
  if (pnlPercent > 5) return REPUTATION_REWARD.WIN;
  if (pnlPercent > 0) return REPUTATION_REWARD.SMALL_WIN;
  return REPUTATION_REWARD.BREAKEVEN;
}

function clampReputation(reputation: number): number {
  return Math.max(MIN_REPUTATION, Math.min(MAX_REPUTATION, reputation));
}

function calculateConsistency(stats: AgentPerformanceStats): number {
  if (stats.totalVotes < 5) return 50;
  
  const recentHistory = stats.reputationHistory.slice(-10);
  const variance = calculateVariance(recentHistory.map(h => h.reputation));
  
  return Math.max(0, Math.min(100, 100 - variance));
}

function calculateVariance(values: number[]): number {
  if (values.length === 0) return 0;
  
  const mean = values.reduce((sum, val) => sum + val, 0) / values.length;
  const squaredDiffs = values.map(val => Math.pow(val - mean, 2));
  const variance = squaredDiffs.reduce((sum, val) => sum + val, 0) / values.length;
  
  return Math.sqrt(variance);
}

function calculateGlobalStats(trades: CompletedTrade[]) {
  if (trades.length === 0) {
    return {
      totalTrades: 0,
      winningTrades: 0,
      losingTrades: 0,
      breakEvenTrades: 0,
      winRate: 0,
      totalPnl: 0,
      totalPnlPercent: 0,
      avgWin: 0,
      avgLoss: 0,
      profitFactor: 0,
      sharpeRatio: 0,
      maxDrawdown: 0,
      maxDrawdownPercent: 0,
      currentDrawdown: 0,
      consecutiveWins: 0,
      consecutiveLosses: 0,
      bestTrade: 0,
      worstTrade: 0,
    };
  }

  const winningTrades = trades.filter(t => t.outcome === 'win');
  const losingTrades = trades.filter(t => t.outcome === 'loss');
  const breakEvenTrades = trades.filter(t => t.outcome === 'breakeven');

  const totalPnl = trades.reduce((sum, t) => sum + t.pnl, 0);
  const totalPnlPercent = trades.reduce((sum, t) => sum + t.pnlPercent, 0);

  const avgWin = winningTrades.length > 0
    ? winningTrades.reduce((sum, t) => sum + t.pnl, 0) / winningTrades.length
    : 0;

  const avgLoss = losingTrades.length > 0
    ? Math.abs(losingTrades.reduce((sum, t) => sum + t.pnl, 0) / losingTrades.length)
    : 0;

  const profitFactor = avgLoss > 0 ? (avgWin * winningTrades.length) / (avgLoss * losingTrades.length) : 0;

  const { maxDrawdown, maxDrawdownPercent, currentDrawdown } = calculateDrawdown(trades);

  const { consecutiveWins, consecutiveLosses } = calculateConsecutiveStreaks(trades);

  const bestTrade = trades.reduce((max, t) => Math.max(max, t.pnlPercent), 0);
  const worstTrade = trades.reduce((min, t) => Math.min(min, t.pnlPercent), 0);

  const returns = trades.map(t => t.pnlPercent);
  const sharpeRatio = calculateSharpeRatio(returns);

  return {
    totalTrades: trades.length,
    winningTrades: winningTrades.length,
    losingTrades: losingTrades.length,
    breakEvenTrades: breakEvenTrades.length,
    winRate: (winningTrades.length / trades.length) * 100,
    totalPnl,
    totalPnlPercent,
    avgWin,
    avgLoss,
    profitFactor,
    sharpeRatio,
    maxDrawdown,
    maxDrawdownPercent,
    currentDrawdown,
    consecutiveWins,
    consecutiveLosses,
    bestTrade,
    worstTrade,
  };
}

function calculateDrawdown(trades: CompletedTrade[]) {
  let peak = 0;
  let maxDrawdown = 0;
  let maxDrawdownPercent = 0;
  let cumulative = 0;

  trades.forEach(trade => {
    cumulative += trade.pnl;
    
    if (cumulative > peak) {
      peak = cumulative;
    }

    const drawdown = peak - cumulative;
    const drawdownPercent = peak > 0 ? (drawdown / peak) * 100 : 0;

    if (drawdown > maxDrawdown) {
      maxDrawdown = drawdown;
      maxDrawdownPercent = drawdownPercent;
    }
  });

  const currentDrawdown = peak - cumulative;

  return { maxDrawdown, maxDrawdownPercent, currentDrawdown };
}

function calculateConsecutiveStreaks(trades: CompletedTrade[]) {
  let consecutiveWins = 0;
  let consecutiveLosses = 0;
  let currentWinStreak = 0;
  let currentLossStreak = 0;

  trades.forEach(trade => {
    if (trade.outcome === 'win') {
      currentWinStreak += 1;
      currentLossStreak = 0;
      consecutiveWins = Math.max(consecutiveWins, currentWinStreak);
    } else if (trade.outcome === 'loss') {
      currentLossStreak += 1;
      currentWinStreak = 0;
      consecutiveLosses = Math.max(consecutiveLosses, currentLossStreak);
    } else {
      currentWinStreak = 0;
      currentLossStreak = 0;
    }
  });

  return { consecutiveWins, consecutiveLosses };
}

function calculateSharpeRatio(returns: number[]): number {
  if (returns.length < 2) return 0;

  const avgReturn = returns.reduce((sum, r) => sum + r, 0) / returns.length;
  const variance = returns.reduce((sum, r) => sum + Math.pow(r - avgReturn, 2), 0) / returns.length;
  const stdDev = Math.sqrt(variance);

  if (stdDev === 0) return 0;

  const riskFreeRate = 0;
  const sharpe = (avgReturn - riskFreeRate) / stdDev;

  return sharpe * Math.sqrt(252);
}

export function getAgentRanking(state: LearningEngineState): AgentPerformanceStats[] {
  const agents = Object.values(state.agentPerformance);
  
  return agents.sort((a, b) => {
    if (b.reputation !== a.reputation) {
      return b.reputation - a.reputation;
    }
    if (b.accuracy !== a.accuracy) {
      return b.accuracy - a.accuracy;
    }
    return b.totalPnlInfluence - a.totalPnlInfluence;
  });
}

export function getHistoricalTradesForAsset(
  state: LearningEngineState,
  asset: string,
  limit: number = 10
): CompletedTrade[] {
  return state.completedTrades
    .filter(t => t.symbol === asset)
    .slice(-limit);
}
