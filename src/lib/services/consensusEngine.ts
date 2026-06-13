import type { 
  Agent, 
  AgentType, 
  SystemConfig,
  OperationType 
} from '@/lib/types';

export type VoteDecision = 'APPROVE' | 'REJECT' | 'ABSTAIN';

export interface AgentVoteInput {
  agentId: AgentType;
  decision: VoteDecision;
  confidence: number;
  reasoning: string;
}

export interface WeightedVoteCalculation {
  agentId: AgentType;
  agentName: string;
  rawVote: VoteDecision;
  rawConfidence: number;
  influence: number;
  reputation: number;
  normalizedInfluence: number;
  normalizedReputation: number;
  normalizedConfidence: number;
  weightedScore: number;
  finalContribution: number;
  reasoning: string;
}

export interface VetoRule {
  agentId: AgentType;
  canVeto: boolean;
  vetoCondition: string;
  triggered: boolean;
  reason?: string;
}

export interface ConsensusResult {
  finalDecision: 'APPROVED' | 'REJECTED' | 'VETOED';
  consensusScore: number;
  approvalScore: number;
  rejectionScore: number;
  totalWeight: number;
  participatingAgents: number;
  vetoTriggered: boolean;
  vetoedBy?: AgentType;
  vetoReason?: string;
  breakdown: WeightedVoteCalculation[];
  vetoRules: VetoRule[];
  explanation: string;
  mathematicalSummary: string;
}

export interface ConsensusConfig {
  approvalThreshold: number;
  requireUnanimousForHighRisk: boolean;
  highRiskThreshold: number;
  vetoEnabled: boolean;
  vetoAgents: AgentType[];
}

const DEFAULT_CONSENSUS_CONFIG: ConsensusConfig = {
  approvalThreshold: 0.60,
  requireUnanimousForHighRisk: true,
  highRiskThreshold: 0.30,
  vetoEnabled: true,
  vetoAgents: ['survival', 'director'],
};

function normalizeValue(value: number, min: number = 0, max: number = 100): number {
  return Math.max(0, Math.min(1, (value - min) / (max - min)));
}

function calculateWeightedScore(
  confidence: number,
  influence: number,
  reputation: number
): number {
  const normConfidence = normalizeValue(confidence, 0, 100);
  const normInfluence = normalizeValue(influence, 0, 10);
  const normReputation = normalizeValue(reputation, 0, 100);
  
  return normConfidence * normInfluence * normReputation;
}

export function evaluateVetoRules(
  votes: AgentVoteInput[],
  agents: Agent[],
  config: SystemConfig,
  currentCapital: number,
  proposalAmount: number,
  proposalAction: OperationType,
  consensusConfig: ConsensusConfig = DEFAULT_CONSENSUS_CONFIG
): VetoRule[] {
  const vetoRules: VetoRule[] = [];
  
  agents.forEach(agent => {
    const vote = votes.find(v => v.agentId === agent.id);
    if (!vote) return;
    
    if (agent.id === 'survival') {
      const survivalReserve = (config.totalCapital * config.survivalReservePercent) / 100;
      const capitalAfterTrade = proposalAction === 'BUY' ? 
        currentCapital - proposalAmount : 
        currentCapital + proposalAmount;
      
      const wouldBreachReserve = capitalAfterTrade < survivalReserve;
      
      vetoRules.push({
        agentId: agent.id,
        canVeto: consensusConfig.vetoEnabled && consensusConfig.vetoAgents.includes(agent.id),
        vetoCondition: `Capital after trade (${capitalAfterTrade.toFixed(2)}) must remain above survival reserve (${survivalReserve.toFixed(2)})`,
        triggered: wouldBreachReserve && vote.decision === 'REJECT',
        reason: wouldBreachReserve ? 
          `SURVIVAL VETO: Trade would breach minimum survival reserve. Capital after trade: $${capitalAfterTrade.toFixed(2)}, Required reserve: $${survivalReserve.toFixed(2)}` : 
          undefined
      });
    }
    
    if (agent.id === 'director') {
      const highRiskVote = vote.confidence < 40 && vote.decision === 'REJECT';
      
      vetoRules.push({
        agentId: agent.id,
        canVeto: consensusConfig.vetoEnabled && consensusConfig.vetoAgents.includes(agent.id),
        vetoCondition: `Director can veto any decision with confidence < 40% or on strategic grounds`,
        triggered: highRiskVote,
        reason: highRiskVote ? 
          `DIRECTOR VETO: Insufficient confidence in proposal (${vote.confidence}%). Strategic rejection exercised.` : 
          undefined
      });
    }
    
    if (agent.id === 'risk') {
      const riskThreshold = config.maxRiskPerOperation / 100;
      const positionRisk = proposalAmount / currentCapital;
      const exceedsRisk = positionRisk > riskThreshold && vote.decision === 'REJECT';
      
      vetoRules.push({
        agentId: agent.id,
        canVeto: false,
        vetoCondition: `Position risk (${(positionRisk * 100).toFixed(2)}%) must not exceed max risk per operation (${(riskThreshold * 100).toFixed(2)}%)`,
        triggered: exceedsRisk,
        reason: exceedsRisk ? 
          `RISK WARNING: Position size exceeds maximum allowed risk threshold. Current: ${(positionRisk * 100).toFixed(2)}%, Max: ${(riskThreshold * 100).toFixed(2)}%` : 
          undefined
      });
    }
  });
  
  return vetoRules;
}

export function calculateConsensus(
  votes: AgentVoteInput[],
  agents: Agent[],
  config: SystemConfig,
  currentCapital: number,
  proposalAmount: number,
  proposalAction: OperationType,
  consensusConfig: ConsensusConfig = DEFAULT_CONSENSUS_CONFIG
): ConsensusResult {
  const vetoRules = evaluateVetoRules(
    votes, 
    agents, 
    config, 
    currentCapital, 
    proposalAmount, 
    proposalAction,
    consensusConfig
  );
  
  const triggeredVeto = vetoRules.find(rule => rule.canVeto && rule.triggered);
  
  if (triggeredVeto) {
    return {
      finalDecision: 'VETOED',
      consensusScore: 0,
      approvalScore: 0,
      rejectionScore: 0,
      totalWeight: 0,
      participatingAgents: votes.length,
      vetoTriggered: true,
      vetoedBy: triggeredVeto.agentId,
      vetoReason: triggeredVeto.reason,
      breakdown: [],
      vetoRules,
      explanation: `Decision vetoed by ${triggeredVeto.agentId} agent. ${triggeredVeto.reason}`,
      mathematicalSummary: `VETO TRIGGERED - No consensus calculation performed`
    };
  }
  
  const breakdown: WeightedVoteCalculation[] = [];
  let totalApprovalWeight = 0;
  let totalRejectionWeight = 0;
  let totalWeight = 0;
  
  votes.forEach(vote => {
    const agent = agents.find(a => a.id === vote.agentId);
    if (!agent) return;
    
    const normConfidence = normalizeValue(vote.confidence, 0, 100);
    const normInfluence = normalizeValue(agent.influence, 0, 10);
    const normReputation = normalizeValue(agent.reputation, 0, 100);
    
    const weightedScore = normConfidence * normInfluence * normReputation;
    
    const voteMultiplier = vote.decision === 'APPROVE' ? 1 : vote.decision === 'REJECT' ? -1 : 0;
    const finalContribution = weightedScore * voteMultiplier;
    
    breakdown.push({
      agentId: vote.agentId,
      agentName: agent.name,
      rawVote: vote.decision,
      rawConfidence: vote.confidence,
      influence: agent.influence,
      reputation: agent.reputation,
      normalizedInfluence: normInfluence,
      normalizedReputation: normReputation,
      normalizedConfidence: normConfidence,
      weightedScore: weightedScore,
      finalContribution: finalContribution,
      reasoning: vote.reasoning
    });
    
    if (vote.decision === 'APPROVE') {
      totalApprovalWeight += weightedScore;
      totalWeight += weightedScore;
    } else if (vote.decision === 'REJECT') {
      totalRejectionWeight += weightedScore;
      totalWeight += weightedScore;
    }
  });
  
  const consensusScore = totalWeight > 0 ? 
    (totalApprovalWeight - totalRejectionWeight) / totalWeight : 
    0;
  
  const normalizedConsensusScore = (consensusScore + 1) / 2;
  
  const finalDecision = normalizedConsensusScore >= consensusConfig.approvalThreshold ? 
    'APPROVED' : 
    'REJECTED';
  
  const explanation = generateExplanation(
    finalDecision,
    normalizedConsensusScore,
    breakdown,
    consensusConfig.approvalThreshold
  );
  
  const mathematicalSummary = generateMathematicalSummary(
    breakdown,
    totalApprovalWeight,
    totalRejectionWeight,
    totalWeight,
    consensusScore,
    normalizedConsensusScore,
    consensusConfig.approvalThreshold
  );
  
  return {
    finalDecision,
    consensusScore: normalizedConsensusScore,
    approvalScore: totalApprovalWeight,
    rejectionScore: totalRejectionWeight,
    totalWeight,
    participatingAgents: votes.length,
    vetoTriggered: false,
    breakdown,
    vetoRules,
    explanation,
    mathematicalSummary
  };
}

function generateExplanation(
  decision: 'APPROVED' | 'REJECTED',
  score: number,
  breakdown: WeightedVoteCalculation[],
  threshold: number
): string {
  const approvers = breakdown.filter(b => b.rawVote === 'APPROVE');
  const rejecters = breakdown.filter(b => b.rawVote === 'REJECT');
  
  const topInfluencer = [...breakdown].sort((a, b) => 
    Math.abs(b.finalContribution) - Math.abs(a.finalContribution)
  )[0];
  
  let explanation = `The consensus engine calculated a final score of ${(score * 100).toFixed(2)}% `;
  explanation += decision === 'APPROVED' ? 
    `which exceeds the approval threshold of ${(threshold * 100).toFixed(2)}%. ` :
    `which falls below the approval threshold of ${(threshold * 100).toFixed(2)}%. `;
  
  explanation += `\n\n${approvers.length} agent(s) approved and ${rejecters.length} agent(s) rejected. `;
  
  if (topInfluencer) {
    explanation += `The ${topInfluencer.agentName} had the highest influence on this decision with a weighted contribution of ${(Math.abs(topInfluencer.finalContribution) * 100).toFixed(2)}%.`;
  }
  
  return explanation;
}

function generateMathematicalSummary(
  breakdown: WeightedVoteCalculation[],
  approvalWeight: number,
  rejectionWeight: number,
  totalWeight: number,
  rawConsensus: number,
  normalizedConsensus: number,
  threshold: number
): string {
  let summary = '═══ CONSENSUS CALCULATION BREAKDOWN ═══\n\n';
  
  summary += '1. INDIVIDUAL AGENT CALCULATIONS:\n';
  breakdown.forEach((vote, index) => {
    summary += `\n   ${index + 1}. ${vote.agentName} (${vote.agentId}):\n`;
    summary += `      • Raw Vote: ${vote.rawVote}\n`;
    summary += `      • Confidence: ${vote.rawConfidence}% → Normalized: ${vote.normalizedConfidence.toFixed(4)}\n`;
    summary += `      • Influence: ${vote.influence}/10 → Normalized: ${vote.normalizedInfluence.toFixed(4)}\n`;
    summary += `      • Reputation: ${vote.reputation}/100 → Normalized: ${vote.normalizedReputation.toFixed(4)}\n`;
    summary += `      • Weighted Score: ${vote.normalizedConfidence.toFixed(4)} × ${vote.normalizedInfluence.toFixed(4)} × ${vote.normalizedReputation.toFixed(4)} = ${vote.weightedScore.toFixed(6)}\n`;
    summary += `      • Vote Multiplier: ${vote.rawVote === 'APPROVE' ? '+1' : vote.rawVote === 'REJECT' ? '-1' : '0'}\n`;
    summary += `      • Final Contribution: ${vote.weightedScore.toFixed(6)} × ${vote.rawVote === 'APPROVE' ? '+1' : vote.rawVote === 'REJECT' ? '-1' : '0'} = ${vote.finalContribution.toFixed(6)}\n`;
  });
  
  summary += `\n2. AGGREGATE SCORES:\n`;
  summary += `   • Total Approval Weight: ${approvalWeight.toFixed(6)}\n`;
  summary += `   • Total Rejection Weight: ${rejectionWeight.toFixed(6)}\n`;
  summary += `   • Total Weight: ${totalWeight.toFixed(6)}\n`;
  
  summary += `\n3. CONSENSUS SCORE CALCULATION:\n`;
  summary += `   • Raw Consensus: (${approvalWeight.toFixed(6)} - ${rejectionWeight.toFixed(6)}) / ${totalWeight.toFixed(6)} = ${rawConsensus.toFixed(6)}\n`;
  summary += `   • Normalized Consensus: (${rawConsensus.toFixed(6)} + 1) / 2 = ${normalizedConsensus.toFixed(6)}\n`;
  summary += `   • As Percentage: ${(normalizedConsensus * 100).toFixed(2)}%\n`;
  
  summary += `\n4. DECISION THRESHOLD:\n`;
  summary += `   • Required Threshold: ${(threshold * 100).toFixed(2)}%\n`;
  summary += `   • Actual Score: ${(normalizedConsensus * 100).toFixed(2)}%\n`;
  summary += `   • Difference: ${((normalizedConsensus - threshold) * 100).toFixed(2)}%\n`;
  summary += `   • Result: ${normalizedConsensus >= threshold ? '✓ APPROVED' : '✗ REJECTED'}\n`;
  
  return summary;
}

export function generateMockVotes(
  agents: Agent[],
  proposalAction: OperationType,
  proposalAmount: number,
  currentCapital: number,
  config: SystemConfig
): AgentVoteInput[] {
  const votes: AgentVoteInput[] = [];
  
  const survivalReserve = (config.totalCapital * config.survivalReservePercent) / 100;
  const capitalAfterTrade = proposalAction === 'BUY' ? 
    currentCapital - proposalAmount : 
    currentCapital + proposalAmount;
  const wouldBreachReserve = capitalAfterTrade < survivalReserve;
  
  agents.forEach(agent => {
    let decision: VoteDecision;
    let confidence: number;
    let reasoning: string;
    
    switch (agent.id) {
      case 'survival':
        if (wouldBreachReserve) {
          decision = 'REJECT';
          confidence = 100;
          reasoning = `Trade would breach survival reserve. Capital after trade: $${capitalAfterTrade.toFixed(2)}, Reserve: $${survivalReserve.toFixed(2)}`;
        } else {
          decision = 'APPROVE';
          confidence = 95;
          reasoning = `Trade preserves survival reserve with adequate margin.`;
        }
        break;
        
      case 'risk':
        const riskPct = (proposalAmount / currentCapital) * 100;
        if (riskPct > config.maxRiskPerOperation) {
          decision = 'REJECT';
          confidence = 85;
          reasoning = `Position size (${riskPct.toFixed(2)}%) exceeds max risk threshold (${config.maxRiskPerOperation}%)`;
        } else {
          decision = 'APPROVE';
          confidence = 75 + Math.random() * 15;
          reasoning = `Risk metrics within acceptable parameters. Position size: ${riskPct.toFixed(2)}%`;
        }
        break;
        
      case 'technical':
        decision = Math.random() > 0.3 ? 'APPROVE' : 'REJECT';
        confidence = 60 + Math.random() * 30;
        reasoning = decision === 'APPROVE' ? 
          `Technical indicators show favorable momentum. RSI: ${(45 + Math.random() * 20).toFixed(1)}, MACD: bullish` :
          `Technical signals suggest caution. Overbought conditions detected.`;
        break;
        
      case 'news':
        decision = Math.random() > 0.35 ? 'APPROVE' : 'REJECT';
        confidence = 55 + Math.random() * 30;
        reasoning = decision === 'APPROVE' ? 
          `Positive sentiment detected across ${Math.floor(Math.random() * 10 + 5)} news sources` :
          `Negative market sentiment. Recent news shows bearish indicators.`;
        break;
        
      case 'archivist':
        decision = Math.random() > 0.4 ? 'APPROVE' : 'REJECT';
        confidence = 65 + Math.random() * 25;
        const successRate = 55 + Math.random() * 25;
        reasoning = decision === 'APPROVE' ? 
          `Historical data shows ${successRate.toFixed(1)}% success rate for similar operations` :
          `Past performance indicates elevated risk. Similar trades had ${(100 - successRate).toFixed(1)}% failure rate`;
        break;
        
      case 'investor':
        decision = Math.random() > 0.25 ? 'APPROVE' : 'REJECT';
        confidence = 70 + Math.random() * 20;
        const expectedReturn = 5 + Math.random() * 15;
        reasoning = decision === 'APPROVE' ? 
          `Strong opportunity with estimated ${expectedReturn.toFixed(1)}% return potential` :
          `Risk/reward ratio unfavorable. Better opportunities available.`;
        break;
        
      case 'director':
        decision = Math.random() > 0.35 ? 'APPROVE' : 'REJECT';
        confidence = 70 + Math.random() * 25;
        reasoning = decision === 'APPROVE' ? 
          `Strategic alignment confirmed. Consensus from specialized agents supports execution.` :
          `Strategic concerns identified. Recommend waiting for better market conditions.`;
        break;
        
      default:
        decision = Math.random() > 0.5 ? 'APPROVE' : 'REJECT';
        confidence = 50 + Math.random() * 40;
        reasoning = `Standard analysis completed. ${decision === 'APPROVE' ? 'Favorable' : 'Unfavorable'} conditions detected.`;
    }
    
    votes.push({
      agentId: agent.id,
      decision,
      confidence,
      reasoning
    });
  });
  
  return votes;
}
