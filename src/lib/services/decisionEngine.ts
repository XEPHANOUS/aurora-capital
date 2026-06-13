import type {
  Agent,
  AgentType,
  SystemConfig,
  AgentVote,
  ConsensusDistribution,
  DirectorDecision,
  SurvivalAnalysis,
  HistoricalAnalysis,
  EnhancedRiskMetrics,
  Operation,
  HistoricalTrade,
  DecisionAction,
  OperationType,
  DataSourceStatus,
  Portfolio,
  EnvironmentType
} from '../types';
import { DataProviderFactory } from '../services/dataProviders';
import { PortfolioManager } from '../services/portfolioManager';

export class DecisionEngine {
  static generateAgentVotes(
    agents: Agent[],
    proposedAction: OperationType,
    proposedAmount: number,
    config: SystemConfig,
    currentCapital: number
  ): AgentVote[] {
    const votes: AgentVote[] = [];
    const survivalReserve = (currentCapital * config.survivalReservePercent) / 100;
    const capitalAfterTrade = proposedAction === 'BUY' ? currentCapital - proposedAmount : currentCapital + proposedAmount;
    
    for (const agent of agents) {
      let recommendedAction: DecisionAction;
      let voteOnProposal: 'APPROVE' | 'REJECT' | 'VETO';
      let confidence: number;
      let reasoning: string;

      switch (agent.id) {
        case 'news':
          recommendedAction = Math.random() > 0.5 ? 'BUY' : 'HOLD';
          voteOnProposal = proposedAction === recommendedAction ? 'APPROVE' : 'REJECT';
          confidence = 60 + Math.random() * 30;
          reasoning = `Sentiment de noticias ${confidence > 75 ? 'positivo' : 'moderado'}. ${
            voteOnProposal === 'APPROVE' 
              ? 'La acción propuesta se alinea con las señales del mercado.' 
              : 'La acción propuesta no coincide con el sentiment actual.'
          }`;
          break;

        case 'technical':
          recommendedAction = Math.random() > 0.6 ? 'BUY' : Math.random() > 0.5 ? 'SELL' : 'HOLD';
          voteOnProposal = proposedAction === recommendedAction ? 'APPROVE' : 'REJECT';
          confidence = 65 + Math.random() * 25;
          reasoning = `Indicadores técnicos muestran ${recommendedAction === 'BUY' ? 'momentum alcista' : recommendedAction === 'SELL' ? 'momentum bajista' : 'consolidación'}. ${
            voteOnProposal === 'APPROVE'
              ? 'Confirmo la propuesta basada en análisis técnico.'
              : 'Los indicadores sugieren una acción diferente.'
          }`;
          break;

        case 'risk':
          const riskLevel = (proposedAmount / currentCapital) * 100;
          recommendedAction = riskLevel > config.maxRiskPerOperation ? 'REDUCE POSITION' : 
                            riskLevel < 2 ? 'INCREASE POSITION' : 'HOLD';
          voteOnProposal = riskLevel <= config.maxRiskPerOperation ? 'APPROVE' : 'REJECT';
          confidence = 70 + Math.random() * 20;
          reasoning = `Riesgo de operación: ${riskLevel.toFixed(1)}%. ${
            voteOnProposal === 'APPROVE'
              ? 'Dentro de parámetros aceptables.'
              : `Excede el límite máximo de ${config.maxRiskPerOperation}%.`
          }`;
          break;

        case 'survival':
          const threatensSurvival = capitalAfterTrade < survivalReserve;
          recommendedAction = threatensSurvival ? 'VETO' : 'HOLD';
          voteOnProposal = threatensSurvival ? 'VETO' : 'APPROVE';
          confidence = 95;
          reasoning = threatensSurvival
            ? `VETO AUTOMÁTICO: La operación reduciría el capital por debajo de la reserva de supervivencia (${survivalReserve.toFixed(0)}).`
            : 'Reserva de supervivencia está protegida. Operación aprobada desde perspectiva de supervivencia.';
          break;

        case 'archivist':
          const historicalSuccess = 50 + Math.random() * 40;
          recommendedAction = historicalSuccess > 65 ? proposedAction as DecisionAction : 'HOLD';
          voteOnProposal = historicalSuccess > 60 ? 'APPROVE' : 'REJECT';
          confidence = historicalSuccess;
          reasoning = `Operaciones similares históricas: ${historicalSuccess.toFixed(0)}% de éxito. ${
            voteOnProposal === 'APPROVE'
              ? 'Historial favorable para esta operación.'
              : 'Historial sugiere precaución.'
          }`;
          break;

        case 'investor':
          recommendedAction = proposedAction as DecisionAction;
          voteOnProposal = 'APPROVE';
          confidence = 70 + Math.random() * 20;
          reasoning = `Propuesta de inversión basada en análisis integral de todos los factores disponibles.`;
          break;

        case 'director':
          recommendedAction = 'HOLD';
          voteOnProposal = 'APPROVE';
          confidence = 75;
          reasoning = 'Evaluando consenso de agentes antes de emitir decisión final.';
          break;

        default:
          recommendedAction = 'HOLD';
          voteOnProposal = 'APPROVE';
          confidence = 50;
          reasoning = 'Análisis en proceso.';
      }

      votes.push({
        agentId: agent.id,
        recommendedAction,
        voteOnProposal,
        confidence,
        reasoning,
      });
    }

    return votes;
  }

  static calculateConsensus(votes: AgentVote[]): ConsensusDistribution {
    const distribution: ConsensusDistribution = {
      buy: 0,
      sell: 0,
      hold: 0,
      reducePosition: 0,
      increasePosition: 0,
      veto: 0,
    };

    for (const vote of votes) {
      switch (vote.recommendedAction) {
        case 'BUY':
          distribution.buy++;
          break;
        case 'SELL':
          distribution.sell++;
          break;
        case 'HOLD':
          distribution.hold++;
          break;
        case 'REDUCE POSITION':
          distribution.reducePosition++;
          break;
        case 'INCREASE POSITION':
          distribution.increasePosition++;
          break;
        case 'VETO':
          distribution.veto++;
          break;
      }
    }

    return distribution;
  }

  static generateDirectorDecision(
    votes: AgentVote[],
    consensus: ConsensusDistribution,
    agents: Agent[]
  ): DirectorDecision {
    const hasVeto = consensus.veto > 0;
    const total = votes.length;
    const approvals = votes.filter(v => v.voteOnProposal === 'APPROVE').length;
    const consensusScore = (approvals / total) * 100;
    
    const avgConfidence = votes.reduce((sum, v) => sum + v.confidence, 0) / votes.length;
    const qualityScore = Math.min(100, (consensusScore * 0.6) + (avgConfidence * 0.4));

    let finalAction: DecisionAction;
    if (hasVeto) {
      finalAction = 'VETO';
    } else if (consensus.buy > consensus.sell && consensus.buy > consensus.hold) {
      finalAction = 'BUY';
    } else if (consensus.sell > consensus.buy && consensus.sell > consensus.hold) {
      finalAction = 'SELL';
    } else {
      finalAction = 'HOLD';
    }

    const supportingFactors: string[] = [];
    const riskFactors: string[] = [];

    const approveVotes = votes.filter(v => v.voteOnProposal === 'APPROVE');
    const rejectVotes = votes.filter(v => v.voteOnProposal === 'REJECT');

    if (approveVotes.length > 0) {
      supportingFactors.push(`${approveVotes.length} agente(s) aprueban la operación`);
      const highConfidence = approveVotes.filter(v => v.confidence > 75);
      if (highConfidence.length > 0) {
        supportingFactors.push(`${highConfidence.length} agente(s) con alta confianza (>75%)`);
      }
    }

    if (rejectVotes.length > 0) {
      riskFactors.push(`${rejectVotes.length} agente(s) rechazan la operación`);
    }

    if (hasVeto) {
      riskFactors.push('Veto de supervivencia activado - operación amenaza reserva mínima');
    }

    if (consensusScore < 60) {
      riskFactors.push('Bajo consenso entre agentes (<60%)');
    }

    const explanation = hasVeto
      ? 'La operación ha sido vetada automáticamente por el Agente de Supervivencia. La reserva de supervivencia no puede ser comprometida bajo ninguna circunstancia.'
      : `Basado en el análisis de ${total} agentes, con un consenso del ${consensusScore.toFixed(0)}% y calidad de decisión ${
          qualityScore >= 80 ? 'alta' : qualityScore >= 50 ? 'media' : 'baja'
        }, la decisión final es ${finalAction}. ${
          finalAction === 'BUY' || finalAction === 'SELL'
            ? 'La mayoría de los agentes coinciden en esta dirección.'
            : 'Se recomienda mantener la posición actual debido a señales mixtas.'
        }`;

    return {
      finalAction,
      consensusScore,
      qualityScore,
      supportingFactors,
      riskFactors,
      explanation,
    };
  }

  static generateSurvivalAnalysis(
    currentCapital: number,
    proposedAmount: number,
    proposedAction: OperationType,
    config: SystemConfig
  ): SurvivalAnalysis {
    const survivalReserve = (config.totalCapital * config.survivalReservePercent) / 100;
    const operationalCapital = currentCapital - survivalReserve;
    
    const capitalAfterTrade = proposedAction === 'BUY' 
      ? currentCapital - proposedAmount 
      : currentCapital + proposedAmount;
    
    const reserveAfterTrade = Math.max(0, capitalAfterTrade - operationalCapital);
    const survivalMargin = capitalAfterTrade - survivalReserve;
    
    const survivalProbability = Math.min(100, Math.max(0, (survivalMargin / survivalReserve) * 100 + 50));
    
    const automaticVeto = capitalAfterTrade < survivalReserve;
    const vetoReason = automaticVeto
      ? `Capital post-operación (${capitalAfterTrade.toFixed(0)}) sería menor que reserva de supervivencia (${survivalReserve.toFixed(0)}). Margen: ${survivalMargin.toFixed(0)}.`
      : undefined;

    return {
      currentCapital,
      survivalReserve,
      operationalCapital,
      capitalAfterTrade,
      reserveAfterTrade,
      survivalMargin,
      survivalProbability,
      automaticVeto,
      vetoReason,
    };
  }

  static generateHistoricalAnalysis(
    proposedAction: OperationType,
    operations: Operation[]
  ): HistoricalAnalysis {
    const similarTrades: HistoricalTrade[] = operations
      .filter(op => op.action === proposedAction && op.result !== undefined)
      .slice(0, 10)
      .map(op => ({
        asset: op.asset,
        action: op.action,
        amount: op.amount,
        outcome: op.result && op.result > 0 ? 'success' as const : 'failure' as const,
        return: op.result || 0,
        date: op.date,
      }));

    const totalSimilar = similarTrades.length;
    const successful = similarTrades.filter(t => t.outcome === 'success').length;
    const failed = similarTrades.filter(t => t.outcome === 'failure').length;
    
    const successRate = totalSimilar > 0 ? (successful / totalSimilar) * 100 : 0;
    const failureRate = totalSimilar > 0 ? (failed / totalSimilar) * 100 : 0;
    
    const successfulReturns = similarTrades.filter(t => t.return > 0).map(t => t.return);
    const failedReturns = similarTrades.filter(t => t.return <= 0).map(t => t.return);
    
    const averageReturn = successfulReturns.length > 0
      ? successfulReturns.reduce((sum, r) => sum + r, 0) / successfulReturns.length
      : 0;
    
    const averageLoss = failedReturns.length > 0
      ? failedReturns.reduce((sum, r) => sum + r, 0) / failedReturns.length
      : 0;

    const lessonsLearned: string[] = [];
    if (successRate > 70) {
      lessonsLearned.push(`Alta tasa de éxito histórica (${successRate.toFixed(0)}%) en operaciones similares.`);
    } else if (successRate < 40) {
      lessonsLearned.push(`Baja tasa de éxito histórica (${successRate.toFixed(0)}%). Revisar estrategia.`);
    }
    
    if (averageReturn > averageLoss * 2) {
      lessonsLearned.push('Ratio riesgo/beneficio favorable en operaciones exitosas.');
    }
    
    if (totalSimilar < 5) {
      lessonsLearned.push('Datos históricos limitados. Proceder con cautela.');
    }

    return {
      similarTrades,
      totalSimilar,
      successRate,
      failureRate,
      averageReturn,
      averageLoss,
      lessonsLearned,
    };
  }

  static generateEnhancedRiskMetrics(
    proposedAmount: number,
    currentCapital: number,
    config: SystemConfig
  ): EnhancedRiskMetrics {
    const positionSize = proposedAmount;
    const stopLoss = proposedAmount * 0.05;
    const takeProfit = proposedAmount * 0.15;
    const riskRewardRatio = takeProfit / stopLoss;
    const maxPotentialLoss = stopLoss;
    
    const dailyRiskExposure = (stopLoss / currentCapital) * 100;
    const totalExposure = (proposedAmount / currentCapital) * 100;
    const concentrationRisk = totalExposure > 20 ? 'high' : totalExposure > 10 ? 'medium' : 'low';

    return {
      positionSize,
      stopLoss,
      takeProfit,
      riskRewardRatio,
      maxPotentialLoss,
      dailyRiskExposure,
      totalExposure,
      concentrationRisk: totalExposure,
    };
  }

  static createDataSourceStatus(): DataSourceStatus {
    const providers = DataProviderFactory.create('mock');
    return DataProviderFactory.createDataSourceStatus(providers.marketData, 'mock');
  }
}
