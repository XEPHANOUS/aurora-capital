import type {
  Agent,
  AgentType,
  ConsensusCalculation,
  DecisionExplanation,
  TradeQuality,
  VetoCheckResult,
  VetoResult,
  AgentPerformanceStats,
} from '@/lib/types';

export function calculateAdaptiveConsensus(
  agents: Agent[],
  agentPerformance: Record<AgentType, AgentPerformanceStats>,
  votes: {
    agentId: AgentType;
    vote: 'APPROVE' | 'REJECT' | 'VETO';
    confidence: number;
  }[]
): ConsensusCalculation {
  const calculations = votes.map(vote => {
    const agent = agents.find(a => a.id === vote.agentId);
    const performance = agentPerformance[vote.agentId];

    if (!agent) {
      return null;
    }

    const baseInfluence = agent.influence;
    const reputation = performance?.reputation ?? agent.reputation;
    const accuracy = performance?.accuracy ?? 70;

    const effectiveInfluence = calculateEffectiveInfluence(
      baseInfluence,
      reputation,
      accuracy
    );

    const voteValue = vote.vote === 'APPROVE' ? 1 : vote.vote === 'REJECT' ? -1 : 0;
    const weightedScore = voteValue * (vote.confidence / 100) * effectiveInfluence;

    return {
      agentId: vote.agentId,
      vote: vote.vote,
      confidence: vote.confidence,
      influence: baseInfluence,
      reputation,
      effectiveInfluence,
      weightedScore,
    };
  }).filter(Boolean) as ConsensusCalculation['votes'];

  const totalInfluence = calculations.reduce((sum, calc) => sum + calc.effectiveInfluence, 0);

  const approveScore = calculations
    .filter(calc => calc.vote === 'APPROVE')
    .reduce((sum, calc) => sum + calc.weightedScore, 0);

  const rejectScore = Math.abs(
    calculations
      .filter(calc => calc.vote === 'REJECT')
      .reduce((sum, calc) => sum + calc.weightedScore, 0)
  );

  const vetoCount = calculations.filter(calc => calc.vote === 'VETO').length;

  const rawConsensus = votes.filter(v => v.vote === 'APPROVE').length / votes.length * 100;

  const weightedConsensus = totalInfluence > 0
    ? ((approveScore / totalInfluence) * 100)
    : 0;

  return {
    rawConsensus,
    weightedConsensus,
    votes: calculations,
    totalInfluence,
    approveScore,
    rejectScore,
    vetoCount,
  };
}

export function calculateEffectiveInfluence(
  baseInfluence: number,
  reputation: number,
  accuracy: number
): number {
  const reputationMultiplier = reputation / 100;
  const accuracyMultiplier = accuracy / 100;

  const effectiveInfluence = baseInfluence * reputationMultiplier * accuracyMultiplier;

  return Math.max(1, Math.round(effectiveInfluence));
}

export function generateDecisionExplanation(
  consensus: ConsensusCalculation,
  tradeQuality: TradeQuality,
  vetoCheck: VetoCheckResult,
  agents: Agent[]
): DecisionExplanation {
  const supportingAgents = consensus.votes
    .filter(v => v.vote === 'APPROVE')
    .map(v => {
      const agent = agents.find(a => a.id === v.agentId);
      return {
        agentId: v.agentId,
        name: agent?.name ?? v.agentId,
        confidence: v.confidence,
      };
    })
    .sort((a, b) => b.confidence - a.confidence);

  const opposingAgents = consensus.votes
    .filter(v => v.vote === 'REJECT')
    .map(v => {
      const agent = agents.find(a => a.id === v.agentId);
      return {
        agentId: v.agentId,
        name: agent?.name ?? v.agentId,
        confidence: v.confidence,
      };
    })
    .sort((a, b) => b.confidence - a.confidence);

  const neutralAgents = consensus.votes
    .filter(v => v.vote === 'VETO')
    .map(v => {
      const agent = agents.find(a => a.id === v.agentId);
      return {
        agentId: v.agentId,
        name: agent?.name ?? v.agentId,
        confidence: v.confidence,
      };
    });

  const riskFactors: string[] = [];

  if (tradeQuality.score < 60) {
    riskFactors.push(`Low trade quality score (${tradeQuality.score}/100)`);
  }

  if (consensus.weightedConsensus < 60) {
    riskFactors.push(`Low consensus (${consensus.weightedConsensus.toFixed(1)}%)`);
  }

  if (tradeQuality.factors.risk > 70) {
    riskFactors.push('High risk level detected');
  }

  if (tradeQuality.factors.volatility > 70) {
    riskFactors.push('High volatility detected');
  }

  if (opposingAgents.length > supportingAgents.length) {
    riskFactors.push('Majority of agents oppose the operation');
  }

  if (vetoCheck.vetos.length > 0) {
    vetoCheck.vetos.forEach(veto => {
      riskFactors.push(`${veto.type} veto: ${veto.reason}`);
    });
  }

  const finalDecision = vetoCheck.finalDecision;
  let decisionReason: string;

  if (vetoCheck.hasVeto && vetoCheck.blockingVeto) {
    decisionReason = `Operation blocked by ${vetoCheck.blockingVeto.type} veto: ${vetoCheck.blockingVeto.reason}`;
  } else if (consensus.weightedConsensus >= 60) {
    decisionReason = `Operation approved with ${consensus.weightedConsensus.toFixed(1)}% weighted consensus`;
  } else {
    decisionReason = `Operation rejected due to insufficient consensus (${consensus.weightedConsensus.toFixed(1)}%)`;
  }

  const summary = generateSummary(
    finalDecision,
    supportingAgents,
    opposingAgents,
    neutralAgents,
    vetoCheck,
    tradeQuality
  );

  return {
    summary,
    consensusScore: consensus.weightedConsensus,
    tradeQuality,
    supportingAgents,
    opposingAgents,
    neutralAgents,
    vetosEvaluated: vetoCheck.vetos,
    riskFactors,
    finalDecision,
    decisionReason,
  };
}

function generateSummary(
  finalDecision: 'APPROVED' | 'REJECTED',
  supportingAgents: { agentId: AgentType; name: string; confidence: number }[],
  opposingAgents: { agentId: AgentType; name: string; confidence: number }[],
  neutralAgents: { agentId: AgentType; name: string; confidence: number }[],
  vetoCheck: VetoCheckResult,
  tradeQuality: TradeQuality
): string {
  let summary = '';

  if (finalDecision === 'REJECTED' && vetoCheck.hasVeto) {
    summary = `The operation was REJECTED due to an active veto. `;
    if (vetoCheck.blockingVeto) {
      summary += `${vetoCheck.blockingVeto.type} veto was triggered: ${vetoCheck.blockingVeto.reason}. `;
    }
  } else if (finalDecision === 'APPROVED') {
    summary = `The operation was APPROVED by consensus. `;
  } else {
    summary = `The operation was REJECTED due to insufficient consensus. `;
  }

  if (supportingAgents.length > 0) {
    const names = supportingAgents.slice(0, 3).map(a => a.name).join(', ');
    summary += `Agents supporting: ${names}. `;
  }

  if (opposingAgents.length > 0) {
    const names = opposingAgents.slice(0, 3).map(a => a.name).join(', ');
    summary += `Agents opposing: ${names}. `;
  }

  if (neutralAgents.length > 0) {
    const names = neutralAgents.map(a => a.name).join(', ');
    summary += `${names} expressed concern. `;
  }

  if (!vetoCheck.hasVeto) {
    summary += `No critical vetos were activated. `;
  }

  summary += `The estimated trade quality is ${tradeQuality.score}/100 (${tradeQuality.grade}).`;

  return summary;
}

export function formatInfluenceBreakdown(vote: ConsensusCalculation['votes'][0]): string {
  return `${vote.agentId}: Base ${vote.influence} × Reputation ${vote.reputation}% × Confidence ${vote.confidence}% = ${vote.effectiveInfluence.toFixed(1)}`;
}

export function getAgentVoteColor(vote: 'APPROVE' | 'REJECT' | 'VETO'): string {
  switch (vote) {
    case 'APPROVE':
      return 'text-accent';
    case 'REJECT':
      return 'text-destructive';
    case 'VETO':
      return 'text-warning';
  }
}

export function getAgentVoteIcon(vote: 'APPROVE' | 'REJECT' | 'VETO'): string {
  switch (vote) {
    case 'APPROVE':
      return '✓';
    case 'REJECT':
      return '✗';
    case 'VETO':
      return '⚠';
  }
}
