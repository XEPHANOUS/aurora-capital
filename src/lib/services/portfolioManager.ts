import type { 
  Portfolio, 
  PortfolioStatistics, 
  RiskControls, 
  EnvironmentType,
  StrategyStatus,
  Operation
} from '../types';

export const DEFAULT_PORTFOLIOS: Record<EnvironmentType, Omit<Portfolio, 'id' | 'createdAt' | 'lastUpdated'>> = {
  sandbox: {
    name: 'Sandbox Portfolio',
    environment: 'sandbox',
    balance: 10000,
    initialBalance: 10000,
    operations: [],
    statistics: {
      totalTrades: 0,
      successfulTrades: 0,
      failedTrades: 0,
      totalReturn: 0,
      averageReturn: 0,
      maxDrawdown: 0,
      sharpeRatio: 0,
      winRate: 0,
    },
    riskControls: {
      maxPositionSize: 1000,
      maxDailyLoss: 500,
      maxDrawdown: 2000,
      stopLossRequired: false,
      requiresApproval: false,
    },
  },
  demo: {
    name: 'Demo Portfolio',
    environment: 'demo',
    balance: 50000,
    initialBalance: 50000,
    operations: [],
    statistics: {
      totalTrades: 0,
      successfulTrades: 0,
      failedTrades: 0,
      totalReturn: 0,
      averageReturn: 0,
      maxDrawdown: 0,
      sharpeRatio: 0,
      winRate: 0,
    },
    riskControls: {
      maxPositionSize: 5000,
      maxDailyLoss: 2500,
      maxDrawdown: 10000,
      stopLossRequired: true,
      requiresApproval: false,
    },
  },
  paper: {
    name: 'Paper Live Portfolio',
    environment: 'paper',
    balance: 25000,
    initialBalance: 25000,
    operations: [],
    statistics: {
      totalTrades: 0,
      successfulTrades: 0,
      failedTrades: 0,
      totalReturn: 0,
      averageReturn: 0,
      maxDrawdown: 0,
      sharpeRatio: 0,
      winRate: 0,
    },
    riskControls: {
      maxPositionSize: 2500,
      maxDailyLoss: 1250,
      maxDrawdown: 5000,
      stopLossRequired: true,
      requiresApproval: false,
    },
  },
  real: {
    name: 'Real Portfolio',
    environment: 'real',
    balance: 2500,
    initialBalance: 2500,
    operations: [],
    statistics: {
      totalTrades: 0,
      successfulTrades: 0,
      failedTrades: 0,
      totalReturn: 0,
      averageReturn: 0,
      maxDrawdown: 0,
      sharpeRatio: 0,
      winRate: 0,
    },
    riskControls: {
      maxPositionSize: 500,
      maxDailyLoss: 250,
      maxDrawdown: 1000,
      stopLossRequired: true,
      requiresApproval: true,
    },
  },
};

export class PortfolioManager {
  static createPortfolio(environment: EnvironmentType): Portfolio {
    const template = DEFAULT_PORTFOLIOS[environment];
    return {
      ...template,
      id: `portfolio-${environment}-${Date.now()}`,
      createdAt: new Date().toISOString(),
      lastUpdated: new Date().toISOString(),
    };
  }

  static updateStatistics(portfolio: Portfolio, operations: Operation[]): PortfolioStatistics {
    const completedOps = operations.filter(op => op.result !== undefined);
    const successfulOps = completedOps.filter(op => op.result && op.result > 0);
    const failedOps = completedOps.filter(op => op.result && op.result <= 0);
    
    const totalReturn = completedOps.reduce((sum, op) => sum + (op.result || 0), 0);
    const averageReturn = completedOps.length > 0 ? totalReturn / completedOps.length : 0;
    
    const returns = completedOps.map(op => op.result || 0);
    const maxDrawdown = this.calculateMaxDrawdown(returns);
    const sharpeRatio = this.calculateSharpeRatio(returns);
    
    return {
      totalTrades: completedOps.length,
      successfulTrades: successfulOps.length,
      failedTrades: failedOps.length,
      totalReturn,
      averageReturn,
      maxDrawdown,
      sharpeRatio,
      winRate: completedOps.length > 0 ? (successfulOps.length / completedOps.length) * 100 : 0,
    };
  }

  static calculateMaxDrawdown(returns: number[]): number {
    let maxDrawdown = 0;
    let peak = 0;
    let cumulative = 0;

    for (const ret of returns) {
      cumulative += ret;
      if (cumulative > peak) {
        peak = cumulative;
      }
      const drawdown = peak - cumulative;
      if (drawdown > maxDrawdown) {
        maxDrawdown = drawdown;
      }
    }

    return maxDrawdown;
  }

  static calculateSharpeRatio(returns: number[], riskFreeRate: number = 0): number {
    if (returns.length === 0) return 0;

    const avgReturn = returns.reduce((sum, ret) => sum + ret, 0) / returns.length;
    const variance = returns.reduce((sum, ret) => sum + Math.pow(ret - avgReturn, 2), 0) / returns.length;
    const stdDev = Math.sqrt(variance);

    if (stdDev === 0) return 0;

    return (avgReturn - riskFreeRate) / stdDev;
  }

  static canPromoteStrategy(
    currentEnv: EnvironmentType,
    statistics: PortfolioStatistics
  ): { canPromote: boolean; requirements: StrategyStatus['promotionRequirements'] } {
    const requirements: Record<EnvironmentType, StrategyStatus['promotionRequirements']> = {
      sandbox: {
        minTrades: 20,
        minSuccessRate: 60,
        minReturn: 500,
      },
      demo: {
        minTrades: 50,
        minSuccessRate: 65,
        minReturn: 2500,
      },
      paper: {
        minTrades: 100,
        minSuccessRate: 70,
        minReturn: 5000,
      },
      real: undefined,
    };

    const req = requirements[currentEnv];
    if (!req) return { canPromote: false, requirements: undefined };

    const canPromote =
      statistics.totalTrades >= req.minTrades &&
      statistics.winRate >= req.minSuccessRate &&
      statistics.totalReturn >= req.minReturn;

    return { canPromote, requirements: req };
  }

  static getStrategyStatus(portfolio: Portfolio): StrategyStatus {
    const { canPromote, requirements } = this.canPromoteStrategy(
      portfolio.environment,
      portfolio.statistics
    );

    return {
      environment: portfolio.environment,
      certified: canPromote,
      tradesCompleted: portfolio.statistics.totalTrades,
      successRate: portfolio.statistics.winRate,
      totalReturn: portfolio.statistics.totalReturn,
      certificationDate: canPromote ? new Date().toISOString() : undefined,
      canPromote,
      promotionRequirements: requirements,
    };
  }

  static validateOperation(
    portfolio: Portfolio,
    operationAmount: number
  ): { valid: boolean; reason?: string } {
    const { riskControls } = portfolio;

    if (operationAmount > riskControls.maxPositionSize) {
      return {
        valid: false,
        reason: `Operación excede tamaño máximo de posición (${riskControls.maxPositionSize})`,
      };
    }

    const todayOps = portfolio.operations.filter(op => {
      const opDate = new Date(op.date);
      const today = new Date();
      return opDate.toDateString() === today.toDateString();
    });

    const todayLoss = todayOps
      .filter(op => op.result && op.result < 0)
      .reduce((sum, op) => sum + Math.abs(op.result || 0), 0);

    if (todayLoss >= riskControls.maxDailyLoss) {
      return {
        valid: false,
        reason: `Límite de pérdida diaria alcanzado (${riskControls.maxDailyLoss})`,
      };
    }

    if (portfolio.statistics.maxDrawdown >= riskControls.maxDrawdown) {
      return {
        valid: false,
        reason: `Drawdown máximo alcanzado (${riskControls.maxDrawdown})`,
      };
    }

    if (operationAmount > portfolio.balance) {
      return {
        valid: false,
        reason: 'Balance insuficiente para la operación',
      };
    }

    return { valid: true };
  }
}
