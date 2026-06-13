import type {
  VetoType,
  VetoRule,
  VetoResult,
  VetoCheckResult,
  TradeQuality,
  TradeQualityFactors,
  AgentType,
  OperationType,
  SystemConfig,
  ConsensusCalculation,
} from '@/lib/types';

const DEFAULT_VETO_RULES: VetoRule[] = [
  {
    type: 'survival',
    active: true,
    agentId: 'survival',
    condition: 'Capital after trade falls below survival reserve',
    priority: 1,
  },
  {
    type: 'risk',
    active: true,
    agentId: 'risk',
    condition: 'Risk exceeds maximum threshold',
    priority: 2,
  },
  {
    type: 'auditor',
    active: true,
    agentId: 'auditor',
    condition: 'Critical compliance or audit violation detected',
    priority: 3,
  },
  {
    type: 'director-override',
    active: true,
    agentId: 'director',
    condition: 'Director manual override',
    priority: 4,
  },
];

export function getActiveVetoRules(): VetoRule[] {
  return DEFAULT_VETO_RULES.filter(rule => rule.active);
}

export function evaluateVetos(
  proposal: {
    asset: string;
    action: OperationType;
    amount: number;
  },
  config: SystemConfig,
  currentCapital: number,
  consensus: ConsensusCalculation,
  agentRecommendations: { agentId: AgentType; recommendation: 'approve' | 'reject' | 'veto' }[]
): VetoCheckResult {
  const vetos: VetoResult[] = [];
  const activeRules = getActiveVetoRules();

  activeRules.forEach(rule => {
    const vetoResult = evaluateSingleVeto(
      rule,
      proposal,
      config,
      currentCapital,
      consensus,
      agentRecommendations
    );

    if (vetoResult.triggered) {
      vetos.push(vetoResult);
    }
  });

  const sortedVetos = vetos.sort((a, b) => {
    const priorityA = activeRules.find(r => r.type === a.type)?.priority || 999;
    const priorityB = activeRules.find(r => r.type === b.type)?.priority || 999;
    return priorityA - priorityB;
  });

  const blockingVeto = sortedVetos.length > 0 ? sortedVetos[0] : undefined;
  const hasVeto = vetos.length > 0;
  const finalDecision = hasVeto ? 'REJECTED' : 'APPROVED';

  return {
    hasVeto,
    vetos: sortedVetos,
    finalDecision,
    blockingVeto,
  };
}

function evaluateSingleVeto(
  rule: VetoRule,
  proposal: { asset: string; action: OperationType; amount: number },
  config: SystemConfig,
  currentCapital: number,
  consensus: ConsensusCalculation,
  agentRecommendations: { agentId: AgentType; recommendation: 'approve' | 'reject' | 'veto' }[]
): VetoResult {
  const timestamp = new Date().toISOString();

  switch (rule.type) {
    case 'survival': {
      const survivalReserve = (config.totalCapital * config.survivalReservePercent) / 100;
      const capitalAfterTrade = proposal.action === 'BUY' 
        ? currentCapital - proposal.amount 
        : currentCapital + proposal.amount;

      if (capitalAfterTrade < survivalReserve) {
        return {
          triggered: true,
          type: 'survival',
          agentId: 'survival',
          reason: `Operation threatens survival reserve. Capital after trade (${capitalAfterTrade.toLocaleString()}) would fall below survival reserve (${survivalReserve.toLocaleString()})`,
          timestamp,
        };
      }
      break;
    }

    case 'risk': {
      const riskAgent = agentRecommendations.find(a => a.agentId === 'risk');
      const riskVote = consensus.votes.find(v => v.agentId === 'risk');
      
      if (riskAgent?.recommendation === 'veto') {
        return {
          triggered: true,
          type: 'risk',
          agentId: 'risk',
          reason: `Risk agent triggered veto. Operation risk exceeds maximum threshold of ${config.maxRiskPerOperation}%`,
          timestamp,
        };
      }

      const operationRisk = (proposal.amount / currentCapital) * 100;
      if (operationRisk > config.maxRiskPerOperation) {
        return {
          triggered: true,
          type: 'risk',
          agentId: 'risk',
          reason: `Operation risk (${operationRisk.toFixed(2)}%) exceeds maximum allowed (${config.maxRiskPerOperation}%)`,
          timestamp,
        };
      }
      break;
    }

    case 'auditor': {
      const auditorAgent = agentRecommendations.find(a => a.agentId === 'auditor');
      
      if (auditorAgent?.recommendation === 'veto') {
        return {
          triggered: true,
          type: 'auditor',
          agentId: 'auditor',
          reason: 'Auditor detected critical compliance or audit violation',
          timestamp,
        };
      }
      break;
    }

    case 'director-override': {
      const directorAgent = agentRecommendations.find(a => a.agentId === 'director');
      
      if (directorAgent?.recommendation === 'veto') {
        return {
          triggered: true,
          type: 'director-override',
          agentId: 'director',
          reason: 'Director manual override - operation rejected',
          timestamp,
        };
      }
      break;
    }
  }

  return { triggered: false };
}

export function calculateTradeQuality(
  consensus: number,
  risk: number,
  volatility: number,
  averageConfidence: number,
  profitRiskRatio: number,
  agentAlignment: number
): TradeQuality {
  const factors: TradeQualityFactors = {
    consensus,
    risk,
    volatility,
    averageConfidence,
    profitRiskRatio,
    agentAlignment,
  };

  const consensusScore = normalizeScore(consensus, 0, 100) * 0.25;
  
  const riskScore = normalizeScore(100 - risk, 0, 100) * 0.20;
  
  const volatilityScore = normalizeScore(100 - volatility, 0, 100) * 0.15;
  
  const confidenceScore = normalizeScore(averageConfidence, 0, 100) * 0.20;
  
  const profitRiskScore = normalizeScore(
    Math.min(profitRiskRatio * 20, 100),
    0,
    100
  ) * 0.10;
  
  const alignmentScore = normalizeScore(agentAlignment, 0, 100) * 0.10;

  const totalScore = Math.round(
    consensusScore +
    riskScore +
    volatilityScore +
    confidenceScore +
    profitRiskScore +
    alignmentScore
  );

  const grade = getTradeGrade(totalScore);

  return {
    score: totalScore,
    grade,
    factors,
  };
}

function normalizeScore(value: number, min: number, max: number): number {
  return Math.max(0, Math.min(100, ((value - min) / (max - min)) * 100));
}

function getTradeGrade(score: number): 'Poor' | 'Weak' | 'Average' | 'Good' | 'Elite' {
  if (score >= 90) return 'Elite';
  if (score >= 75) return 'Good';
  if (score >= 60) return 'Average';
  if (score >= 40) return 'Weak';
  return 'Poor';
}

export function getTradeQualityColor(grade: 'Poor' | 'Weak' | 'Average' | 'Good' | 'Elite'): string {
  switch (grade) {
    case 'Elite':
      return 'text-accent border-accent';
    case 'Good':
      return 'text-primary border-primary';
    case 'Average':
      return 'text-yellow-400 border-yellow-400';
    case 'Weak':
      return 'text-orange-400 border-orange-400';
    case 'Poor':
      return 'text-destructive border-destructive';
  }
}

export function getVetoTypeLabel(type: VetoType): string {
  switch (type) {
    case 'survival':
      return 'Survival Veto';
    case 'risk':
      return 'Risk Veto';
    case 'auditor':
      return 'Auditor Veto';
    case 'director-override':
      return 'Director Override';
  }
}

export function getVetoIcon(type: VetoType): string {
  switch (type) {
    case 'survival':
      return '🛡️';
    case 'risk':
      return '⚠️';
    case 'auditor':
      return '📋';
    case 'director-override':
      return '👤';
  }
}
