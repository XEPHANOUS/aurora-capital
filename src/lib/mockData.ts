import type { Agent, AgentType, InvestmentProposal, MarketPosition, NewsItem, Operation, OperationStatus, SystemConfig, MarketSentiment, DecisionSession, DetailedAgentRecommendation, NewsAgentRecommendation, TechnicalAgentRecommendation, RiskAgentRecommendation, SurvivalAgentRecommendation, ArchivistAgentRecommendation, InvestorAgentRecommendation, DirectorAgentRecommendation, DecisionAction, MarketRegime, SurvivalMetrics, RiskMetrics, ConflictAnalysis, DecisionQualityScore, WeightedVote, HistoricalTrade } from './types';

export const DEFAULT_CONFIG: SystemConfig = {
  simulationMode: true,
  totalCapital: 100000,
  survivalReservePercent: 30,
  maxRiskPerOperation: 5,
  dailyLossLimit: 15,
  telegramConnected: false,
  notifications: {
    executedOperations: true,
    riskAlerts: true,
    survivalVeto: true,
    dailyReport: false,
  },
};

export const AGENT_DEFINITIONS: Record<AgentType, Omit<Agent, 'reputation' | 'status'>> = {
  news: {
    id: 'news',
    name: 'Noticias',
    description: 'Analiza noticias y sentimiento',
  },
  technical: {
    id: 'technical',
    name: 'Técnico',
    description: 'Analiza gráficos e indicadores',
  },
  risk: {
    id: 'risk',
    name: 'Riesgo',
    description: 'Calcula exposición y tamaño',
  },
  survival: {
    id: 'survival',
    name: 'Supervivencia',
    description: 'Protege reserva y capital mínimo',
  },
  archivist: {
    id: 'archivist',
    name: 'Archivista',
    description: 'Almacena histórico y aprendizaje',
  },
  investor: {
    id: 'investor',
    name: 'Inversor',
    description: 'Crea propuestas de inversión',
  },
  director: {
    id: 'director',
    name: 'Director',
    description: 'Toma decisión final',
  },
  supervisor: {
    id: 'supervisor',
    name: 'Supervisor',
    description: 'Coordina y detecta anomalías',
  },
};

export function initializeAgents(): Agent[] {
  return Object.values(AGENT_DEFINITIONS).map(agent => ({
    ...agent,
    reputation: 50 + Math.random() * 40,
    status: 'active',
  }));
}

export function generateMockMarketPositions(): MarketPosition[] {
  const assets = [
    { name: 'BTC/USDT', entry: 67550, current: 67250, change: 2.45 },
    { name: 'ETH/USDT', entry: 3520, current: 3490, change: -1.12 },
    { name: 'BNB/USDT', entry: 605, current: 605.30, change: -0.35 },
    { name: 'SOL/USDT', entry: 152, current: 152.40, change: 3.35 },
    { name: 'XRP/USDT', entry: 0.48, current: 0.48, change: 0.75 },
  ];

  return assets.map(asset => ({
    asset: asset.name,
    amount: 10000 + Math.random() * 30000,
    entryPrice: asset.entry,
    currentPrice: asset.current,
    change24h: asset.change,
    trend: generateTrendData(),
  }));
}

export function generateTrendData(): number[] {
  const points = 20;
  const data: number[] = [];
  let value = 50 + Math.random() * 20;
  
  for (let i = 0; i < points; i++) {
    value += (Math.random() - 0.5) * 10;
    value = Math.max(30, Math.min(70, value));
    data.push(value);
  }
  
  return data;
}

export function generateMockNews(): NewsItem[] {
  const news = [
    { title: 'La SEC retrasa decisión sobre ETF de Ethereum', sentiment: 'negative' as const },
    { title: 'Bitcoin lanza nueva herramienta de IA', sentiment: 'positive' as const },
    { title: 'Inflación de EE.UU. baja más de lo esperado', sentiment: 'positive' as const },
    { title: 'Actualización importante de red de Solana', sentiment: 'neutral' as const },
  ];

  return news.map((item, i) => ({
    id: `news-${i}`,
    ...item,
    timestamp: `hace ${i + 1}h`,
  }));
}

export function calculateSurvivalReserve(totalCapital: number, reservePercent: number): number {
  return (totalCapital * reservePercent) / 100;
}

export function calculateOperatingCapital(totalCapital: number, reservePercent: number): number {
  return totalCapital - calculateSurvivalReserve(totalCapital, reservePercent);
}

export function calculateSystemHealth(config: SystemConfig, currentCapital: number): number {
  const reserve = calculateSurvivalReserve(config.totalCapital, config.survivalReservePercent);
  const operatingCapital = currentCapital - reserve;
  const maxOperating = calculateOperatingCapital(config.totalCapital, config.survivalReservePercent);
  
  if (operatingCapital < 0) return 0;
  if (operatingCapital >= maxOperating) return 100;
  
  return (operatingCapital / maxOperating) * 100;
}

export function wouldBreachSurvivalReserve(
  currentCapital: number,
  operationAmount: number,
  config: SystemConfig
): boolean {
  const reserve = calculateSurvivalReserve(config.totalCapital, config.survivalReservePercent);
  const afterOperation = currentCapital - operationAmount;
  return afterOperation < reserve;
}

export function generateMockProposal(agents: Agent[], config: SystemConfig, currentCapital: number): InvestmentProposal {
  const assets = ['BTC/USDT', 'ETH/USDT', 'SOL/USDT', 'BNB/USDT'];
  const actions: ('BUY' | 'SELL')[] = ['BUY', 'SELL'];
  
  const asset = assets[Math.floor(Math.random() * assets.length)];
  const action = actions[Math.floor(Math.random() * actions.length)];
  const amount = 5000 + Math.random() * 10000;
  const confidence = 60 + Math.random() * 35;
  const globalConfidence = 55 + Math.random() * 30;
  const risk = 1.5 + Math.random() * 3.5;
  
  const wouldBreachReserve = wouldBreachSurvivalReserve(currentCapital, amount, config);
  
  const agentVotes: InvestmentProposal['agentVotes'] = {};
  
  agents.forEach(agent => {
    if (agent.id !== 'director' && agent.id !== 'investor') {
      const voteChance = agent.reputation / 100;
      agentVotes[agent.id] = {
        vote: Math.random() < voteChance,
        reason: getAgentVoteReason(agent.id, Math.random() < voteChance),
      };
    }
  });
  
  return {
    id: `proposal-${Date.now()}`,
    asset,
    action,
    amount,
    confidence,
    globalConfidence,
    risk,
    estimatedReturn: confidence > 75 ? 3.2 : 2.1,
    agentVotes,
    survivalVeto: wouldBreachReserve,
    directorDecision: 'pending',
  };
}

function getAgentVoteReason(agentType: AgentType, positive: boolean): string {
  const reasons: Record<AgentType, { positive: string; negative: string }> = {
    news: {
      positive: 'Sentimiento positivo en noticias',
      negative: 'Noticias negativas detectadas',
    },
    technical: {
      positive: 'Indicadores técnicos favorables',
      negative: 'Señales técnicas débiles',
    },
    risk: {
      positive: 'Riesgo dentro de límites',
      negative: 'Exposición excesiva',
    },
    survival: {
      positive: 'No afecta reserva',
      negative: 'Amenaza capital mínimo',
    },
    archivist: {
      positive: 'Historial favorable',
      negative: 'Patrón de pérdidas similar',
    },
    investor: {
      positive: 'Oportunidad identificada',
      negative: 'Baja probabilidad de éxito',
    },
    director: {
      positive: 'Decisión aprobada',
      negative: 'Decisión rechazada',
    },
    supervisor: {
      positive: 'Sin anomalías',
      negative: 'Comportamiento inusual detectado',
    },
  };
  
  return positive ? reasons[agentType].positive : reasons[agentType].negative;
}

export function generateMockOperations(): Operation[] {
  const operations: Operation[] = [];
  const assets = ['BTC/USDT', 'ETH/USDT', 'SOL/USDT', 'BNB/USDT', 'XRP/USDT'];
  const actions: ('BUY' | 'SELL')[] = ['BUY', 'SELL'];
  const statuses: OperationStatus[] = ['executed', 'vetoed', 'executed', 'executed'];
  
  for (let i = 0; i < 10; i++) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    
    const status = statuses[Math.floor(Math.random() * statuses.length)];
    const asset = assets[Math.floor(Math.random() * assets.length)];
    const action = actions[Math.floor(Math.random() * actions.length)];
    const amount = 3000 + Math.random() * 8000;
    const confidence = 50 + Math.random() * 45;
    
    operations.push({
      id: `op-${i}`,
      date: date.toISOString(),
      asset,
      action,
      amount,
      result: status === 'executed' ? (Math.random() - 0.4) * amount * 0.1 : undefined,
      status,
      confidence,
      agentVotes: {
        news: Math.random() > 0.3,
        technical: Math.random() > 0.3,
        risk: Math.random() > 0.4,
        survival: status !== 'vetoed',
        archivist: Math.random() > 0.3,
        investor: true,
        director: status === 'executed',
        supervisor: Math.random() > 0.2,
      },
      vetoReason: status === 'vetoed' ? 'Operación amenaza reserva de supervivencia' : undefined,
    });
  }
  
  return operations;
}

export function generateMarketSentiment(): MarketSentiment {
  const sentiments: ('positive' | 'negative' | 'neutral')[] = ['positive', 'neutral', 'negative'];
  const overall = sentiments[Math.floor(Math.random() * sentiments.length)];
  
  const summaries = {
    positive: 'El mercado muestra una tendencia alcista creciente en las últimas 24h.',
    negative: 'Tendencia bajista detectada. Cautela recomendada.',
    neutral: 'Mercado lateral. Esperando catalizador.',
  };
  
  return {
    overall,
    score: overall === 'positive' ? 72 : overall === 'negative' ? 38 : 55,
    summary: summaries[overall],
    lastUpdate: new Date().toLocaleTimeString(),
  };
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('es-ES', {
    style: 'currency',
    currency: 'EUR',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

export function formatPercent(value: number): string {
  const sign = value > 0 ? '+' : '';
  return `${sign}${value.toFixed(2)}%`;
}

export function formatDate(date: string): string {
  return new Date(date).toLocaleDateString('es-ES', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
}

export function generateDecisionSession(
  agents: Agent[], 
  config: SystemConfig, 
  currentCapital: number,
  status: 'active' | 'completed' | 'vetoed' | 'rejected' = 'active'
): DecisionSession {
  const assets = ['BTC/USDT', 'ETH/USDT', 'SOL/USDT', 'BNB/USDT', 'ADA/USDT'];
  const allActions: ('BUY' | 'SELL' | 'HOLD' | 'REDUCE POSITION' | 'INCREASE POSITION')[] = ['BUY', 'SELL', 'HOLD', 'REDUCE POSITION', 'INCREASE POSITION'];
  
  const asset = assets[Math.floor(Math.random() * assets.length)];
  const action = allActions[Math.floor(Math.random() * 2)];
  const amount = 5000 + Math.random() * 15000;
  
  const timestamp = new Date();
  const recommendations: DetailedAgentRecommendation[] = [];
  
  const newsAgent = agents.find(a => a.id === 'news');
  if (newsAgent) {
    const newsRecommendation: 'approve' | 'reject' = Math.random() > 0.3 ? 'approve' : 'reject';
    const newsRec: NewsAgentRecommendation = {
      agentId: 'news',
      agentName: newsAgent.name,
      recommendation: newsRecommendation,
      decisionAction: mapRecommendationToDecisionAction(newsRecommendation, action, 'news'),
      confidence: 60 + Math.random() * 35,
      reasoning: Math.random() > 0.5 
        ? 'Sentimiento del mercado positivo. Noticias recientes favorables sobre adopción institucional.' 
        : 'Sentimiento negativo detectado. Preocupaciones sobre regulación en mercados clave.',
      timestamp: new Date(timestamp.getTime() + 1000).toISOString(),
      reputation: newsAgent.reputation,
      weight: 0.15,
      sentimentScore: 50 + Math.random() * 40 - 20,
      relevantNews: [
        'Bitcoin alcanza nuevo máximo en volumen de trading',
        'Instituciones aumentan exposición a criptomonedas',
        'Reguladores consideran nuevas políticas'
      ]
    };
    recommendations.push(newsRec);
  }
  
  const technicalAgent = agents.find(a => a.id === 'technical');
  if (technicalAgent) {
    const indicators = {
      rsi: 30 + Math.random() * 40,
      macd: Math.random() > 0.5 ? 'bullish' : 'bearish' as 'bullish' | 'bearish',
      trend: Math.random() > 0.4 ? 'up' : Math.random() > 0.5 ? 'down' : 'sideways' as 'up' | 'down' | 'sideways'
    };
    
    const techRecommendation: 'approve' | 'reject' = indicators.trend === 'up' && indicators.macd === 'bullish' ? 'approve' : 'reject';
    const techRec: TechnicalAgentRecommendation = {
      agentId: 'technical',
      agentName: technicalAgent.name,
      recommendation: techRecommendation,
      decisionAction: mapRecommendationToDecisionAction(techRecommendation, action, 'technical'),
      confidence: 55 + Math.random() * 40,
      reasoning: `RSI en ${indicators.rsi.toFixed(0)}. MACD muestra señal ${indicators.macd}. Tendencia ${indicators.trend === 'up' ? 'alcista' : indicators.trend === 'down' ? 'bajista' : 'lateral'} confirmada.`,
      timestamp: new Date(timestamp.getTime() + 2000).toISOString(),
      reputation: technicalAgent.reputation,
      weight: 0.20,
      indicators
    };
    recommendations.push(techRec);
  }
  
  const riskAgent = agents.find(a => a.id === 'risk');
  if (riskAgent) {
    const riskScore = 1 + Math.random() * 4;
    const positionSize = Math.min(amount, (currentCapital * config.maxRiskPerOperation) / 100);
    const riskRecommendation: 'approve' | 'reject' = riskScore < 3 && amount <= positionSize ? 'approve' : 'reject';
    
    const riskRec: RiskAgentRecommendation = {
      agentId: 'risk',
      agentName: riskAgent.name,
      recommendation: riskRecommendation,
      decisionAction: mapRecommendationToDecisionAction(riskRecommendation, action, 'risk'),
      confidence: 70 + Math.random() * 25,
      reasoning: riskScore < 3 
        ? `Riesgo calculado de ${riskScore.toFixed(1)}/5. Tamaño de posición dentro de límites permitidos.`
        : `Riesgo elevado (${riskScore.toFixed(1)}/5). Excede parámetros de exposición máxima.`,
      timestamp: new Date(timestamp.getTime() + 3000).toISOString(),
      reputation: riskAgent.reputation,
      weight: 0.25,
      riskScore,
      positionSizeRecommendation: positionSize,
      maxLoss: positionSize * 0.15
    };
    recommendations.push(riskRec);
  }
  
  const survivalAgent = agents.find(a => a.id === 'survival');
  const wouldBreachReserve = wouldBreachSurvivalReserve(currentCapital, amount, config);
  
  if (survivalAgent) {
    const reserve = calculateSurvivalReserve(config.totalCapital, config.survivalReservePercent);
    const afterOp = currentCapital - amount;
    const survivalStatus: 'safe' | 'warning' | 'critical' = 
      afterOp > reserve * 1.2 ? 'safe' : 
      afterOp > reserve ? 'warning' : 'critical';
    
    const survivalRecommendation: 'veto' | 'approve' | 'neutral' = wouldBreachReserve ? 'veto' : survivalStatus === 'safe' ? 'approve' : 'neutral';
    
    const survivalRec: SurvivalAgentRecommendation = {
      agentId: 'survival',
      agentName: survivalAgent.name,
      recommendation: survivalRecommendation,
      decisionAction: mapRecommendationToDecisionAction(survivalRecommendation, action, 'survival'),
      confidence: 100,
      reasoning: wouldBreachReserve 
        ? `VETO ABSOLUTO: Esta operación rompería la reserva de supervivencia. Capital resultante ${formatCurrency(afterOp)} vs. reserva mínima ${formatCurrency(reserve)}.`
        : `Reserva de supervivencia protegida. Estado: ${survivalStatus}. Margen disponible: ${formatCurrency(afterOp - reserve)}.`,
      timestamp: new Date(timestamp.getTime() + 4000).toISOString(),
      reputation: survivalAgent.reputation,
      weight: 1.0,
      survivalStatus,
      vetoStatus: wouldBreachReserve,
      reserveImpact: ((reserve - afterOp) / reserve) * 100
    };
    recommendations.push(survivalRec);
  }
  
  const archivistAgent = agents.find(a => a.id === 'archivist');
  if (archivistAgent) {
    const similarOps = Math.floor(Math.random() * 20) + 5;
    const successRate = 40 + Math.random() * 50;
    const archRecommendation: 'approve' | 'reject' = successRate > 60 ? 'approve' : 'reject';
    
    const archRec: ArchivistAgentRecommendation = {
      agentId: 'archivist',
      agentName: archivistAgent.name,
      recommendation: archRecommendation,
      decisionAction: mapRecommendationToDecisionAction(archRecommendation, action, 'archivist'),
      confidence: 50 + Math.random() * 30,
      reasoning: `Análisis de ${similarOps} operaciones similares. Tasa de éxito histórica: ${successRate.toFixed(0)}%. ${successRate > 60 ? 'Patrón favorable identificado.' : 'Patrón de riesgo elevado.'}`,
      timestamp: new Date(timestamp.getTime() + 5000).toISOString(),
      reputation: archivistAgent.reputation,
      weight: 0.15,
      similarOperations: similarOps,
      historicalSuccessRate: successRate
    };
    recommendations.push(archRec);
  }
  
  const investorAgent = agents.find(a => a.id === 'investor');
  if (investorAgent) {
    const invRec: InvestorAgentRecommendation = {
      agentId: 'investor',
      agentName: investorAgent.name,
      recommendation: 'approve',
      decisionAction: action,
      confidence: 65 + Math.random() * 30,
      reasoning: `Oportunidad identificada en ${asset}. Análisis de riesgo/retorno favorable. Momento óptimo para ${action === 'BUY' ? 'entrada' : 'salida'}.`,
      timestamp: new Date(timestamp.getTime() + 6000).toISOString(),
      reputation: investorAgent.reputation,
      weight: 0.20,
      proposedAsset: asset,
      proposedAction: action,
      proposedAmount: amount,
      estimatedReturn: 2.5 + Math.random() * 3
    };
    recommendations.push(invRec);
  }
  
  const directorAgent = agents.find(a => a.id === 'director');
  const hasVeto = recommendations.some(r => r.recommendation === 'veto');
  const approvals = recommendations.filter(r => r.recommendation === 'approve').length;
  const rejections = recommendations.filter(r => r.recommendation === 'reject').length;
  
  let finalDecision: 'approved' | 'rejected' = 'approved';
  let combinedConfidence = 0;
  let explanation = '';
  
  if (hasVeto) {
    finalDecision = 'rejected';
    combinedConfidence = 0;
    explanation = 'Operación vetada por el Agente de Supervivencia. La protección de la reserva es prioritaria.';
  } else if (approvals > rejections) {
    finalDecision = 'approved';
    const weightedSum = recommendations.reduce((sum, r) => 
      r.recommendation === 'approve' ? sum + (r.confidence * r.weight) : sum, 0
    );
    const totalWeight = recommendations.reduce((sum, r) => 
      r.recommendation === 'approve' ? sum + r.weight : sum, 0
    );
    combinedConfidence = totalWeight > 0 ? weightedSum / totalWeight : 0;
    explanation = `Consenso alcanzado con ${approvals} votos favorables. Análisis técnico y de riesgo positivos. Proceder con ejecución.`;
  } else {
    finalDecision = 'rejected';
    combinedConfidence = 20 + Math.random() * 30;
    explanation = `Consenso insuficiente. ${rejections} agentes recomiendan rechazo. Factores de riesgo identificados superan oportunidad potencial.`;
  }
  
  if (directorAgent) {
    const dirRecommendation: 'approve' | 'reject' = finalDecision === 'approved' ? 'approve' : 'reject';
    const dirRec: DirectorAgentRecommendation = {
      agentId: 'director',
      agentName: directorAgent.name,
      recommendation: dirRecommendation,
      decisionAction: hasVeto ? 'VETO' : mapRecommendationToDecisionAction(dirRecommendation, action, 'director'),
      confidence: combinedConfidence,
      reasoning: explanation,
      timestamp: new Date(timestamp.getTime() + 7000).toISOString(),
      reputation: directorAgent.reputation,
      weight: 1.0,
      finalDecision,
      combinedConfidence,
      explanation
    };
    recommendations.push(dirRec);
  }
  
  const consensusLevel = (approvals / (approvals + rejections)) * 100;
  
  const marketRegime = generateMarketRegime();
  const riskRec = recommendations.find(r => r.agentId === 'risk') as RiskAgentRecommendation | undefined;
  const currentPrice = 50000 + Math.random() * 20000;
  
  const survivalMetrics = calculateSurvivalMetrics(currentCapital, config, amount);
  const riskMetrics = riskRec ? calculateRiskMetrics(amount, currentPrice, riskRec.riskScore) : undefined;
  const conflictAnalysis = analyzeConflicts(recommendations);
  const qualityScore = calculateDecisionQuality(recommendations, survivalMetrics, marketRegime);
  const weightedVotes = calculateWeightedVotes(recommendations);
  
  const executionBlocked = hasVeto || 
                          survivalMetrics.survivalProbability < 70 ||
                          consensusLevel < 50 ||
                          combinedConfidence < 40;
  
  let blockReason: string | undefined;
  if (hasVeto) {
    blockReason = 'Veto activado por el Agente de Supervivencia';
  } else if (survivalMetrics.survivalProbability < 70) {
    blockReason = 'Probabilidad de supervivencia por debajo del umbral mínimo (70%)';
  } else if (consensusLevel < 50) {
    blockReason = 'Consenso insuficiente entre agentes (mínimo 50%)';
  } else if (combinedConfidence < 40) {
    blockReason = 'Confianza combinada por debajo del umbral mínimo (40%)';
  }
  
  return {
    id: `session-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    timestamp: timestamp.toISOString(),
    status: hasVeto ? 'vetoed' : status,
    proposal: {
      asset,
      action,
      amount
    },
    recommendations,
    finalDecision: status !== 'active' ? {
      approved: finalDecision === 'approved' && !executionBlocked,
      reason: executionBlocked && blockReason ? blockReason : explanation,
      timestamp: new Date(timestamp.getTime() + 8000).toISOString(),
      executionBlocked,
      blockReason
    } : undefined,
    consensusLevel,
    duration: 7 + Math.random() * 5,
    marketRegime,
    survivalMetrics,
    riskMetrics,
    conflictAnalysis,
    qualityScore,
    weightedVotes
  };
}

export function generateMockDecisionSessions(agents: Agent[], config: SystemConfig, currentCapital: number, count: number = 5): DecisionSession[] {
  const sessions: DecisionSession[] = [];
  const statuses: ('completed' | 'vetoed')[] = ['completed', 'completed', 'completed', 'vetoed', 'completed'];
  
  for (let i = 0; i < count; i++) {
    const session = generateDecisionSession(agents, config, currentCapital, statuses[i % statuses.length]);
    const pastTime = new Date();
    pastTime.setHours(pastTime.getHours() - (i * 3));
    session.timestamp = pastTime.toISOString();
    sessions.push(session);
  }
  
  return sessions.reverse();
}

export function generateMarketRegime(): MarketRegime {
  const regimes: MarketRegime[] = ['bull', 'bear', 'sideways', 'high-volatility', 'low-volatility'];
  return regimes[Math.floor(Math.random() * regimes.length)];
}

export function calculateSurvivalMetrics(
  currentCapital: number,
  config: SystemConfig,
  proposedAmount: number
): SurvivalMetrics {
  const reserve = calculateSurvivalReserve(config.totalCapital, config.survivalReservePercent);
  const afterTrade = currentCapital - proposedAmount;
  const maxDrawdown = ((config.totalCapital - currentCapital) / config.totalCapital) * 100;
  const dailyLossLimit = config.dailyLossLimit;
  const riskAfterTrade = ((config.totalCapital - afterTrade) / config.totalCapital) * 100;
  
  let survivalProbability = 100;
  if (afterTrade < reserve) {
    survivalProbability = Math.max(0, (afterTrade / reserve) * 100);
  } else if (afterTrade < reserve * 1.2) {
    survivalProbability = 70 + ((afterTrade - reserve) / (reserve * 0.2)) * 30;
  }
  
  return {
    currentCapital,
    survivalReserve: reserve,
    maxDrawdown,
    dailyLossLimit,
    riskAfterTrade,
    survivalProbability
  };
}

export function calculateRiskMetrics(
  amount: number,
  currentPrice: number,
  riskScore: number
): RiskMetrics {
  const positionSize = amount;
  const stopLoss = currentPrice * (1 - (riskScore / 100));
  const takeProfit = currentPrice * (1 + (riskScore * 2 / 100));
  const maxPotentialLoss = amount * (riskScore / 100);
  const potentialGain = amount * (riskScore * 2 / 100);
  const riskRewardRatio = potentialGain / maxPotentialLoss;
  
  return {
    positionSize,
    stopLoss,
    takeProfit,
    riskRewardRatio,
    maxPotentialLoss
  };
}

export function analyzeConflicts(recommendations: DetailedAgentRecommendation[]): ConflictAnalysis {
  const agreeing: AgentType[] = [];
  const disagreeing: AgentType[] = [];
  const conflicts: Array<{agents: [AgentType, AgentType]; reason: string}> = [];
  
  const approvers = recommendations.filter(r => r.recommendation === 'approve');
  const rejecters = recommendations.filter(r => r.recommendation === 'reject' || r.recommendation === 'veto');
  
  approvers.forEach(a => agreeing.push(a.agentId));
  rejecters.forEach(r => disagreeing.push(r.agentId));
  
  const technical = recommendations.find(r => r.agentId === 'technical');
  const archivist = recommendations.find(r => r.agentId === 'archivist');
  
  if (technical && archivist && technical.recommendation !== archivist.recommendation) {
    conflicts.push({
      agents: ['technical', 'archivist'],
      reason: 'Los patrones históricos contradicen los indicadores técnicos actuales'
    });
  }
  
  const news = recommendations.find(r => r.agentId === 'news');
  if (news && technical && news.recommendation !== technical.recommendation) {
    conflicts.push({
      agents: ['news', 'technical'],
      reason: 'El sentimiento del mercado no coincide con las señales técnicas'
    });
  }
  
  return {
    agreeing,
    disagreeing,
    conflicts
  };
}

export function calculateDecisionQuality(
  recommendations: DetailedAgentRecommendation[],
  survivalMetrics: SurvivalMetrics,
  marketRegime: MarketRegime
): DecisionQualityScore {
  const approvals = recommendations.filter(r => r.recommendation === 'approve').length;
  const total = recommendations.filter(r => r.agentId !== 'director').length;
  const agentAgreement = (approvals / total) * 100;
  
  const avgConfidence = recommendations.reduce((sum, r) => sum + r.confidence, 0) / recommendations.length;
  const historicalConfidence = avgConfidence;
  
  const archivistRec = recommendations.find(r => r.agentId === 'archivist') as ArchivistAgentRecommendation | undefined;
  const historicalSuccess = archivistRec?.historicalSuccessRate || 50;
  
  const marketConditions = marketRegime === 'bull' || marketRegime === 'low-volatility' ? 80 : 
                          marketRegime === 'high-volatility' ? 40 : 60;
  
  const survivalSafety = survivalMetrics.survivalProbability;
  
  const score = (agentAgreement * 0.3 + historicalConfidence * 0.2 + marketConditions * 0.2 + survivalSafety * 0.3);
  
  const quality = score >= 75 ? 'high' : score >= 50 ? 'medium' : 'low';
  
  return {
    score,
    agentAgreement,
    historicalConfidence,
    marketConditions,
    survivalSafety,
    quality
  };
}

export function calculateWeightedVotes(recommendations: DetailedAgentRecommendation[]): WeightedVote[] {
  return recommendations
    .filter(r => r.agentId !== 'director')
    .map(r => ({
      agentId: r.agentId,
      rawVote: r.recommendation,
      rawConfidence: r.confidence,
      weightedScore: (r.confidence / 100) * r.weight * (r.reputation / 100),
      weight: r.weight,
      reputation: r.reputation
    }));
}

export function generateHistoricalTrades(count: number = 10): HistoricalTrade[] {
  const assets = ['BTC/USDT', 'ETH/USDT', 'SOL/USDT', 'BNB/USDT', 'ADA/USDT'];
  const actions: ('BUY' | 'SELL')[] = ['BUY', 'SELL'];
  const trades: HistoricalTrade[] = [];
  
  for (let i = 0; i < count; i++) {
    const outcome: 'success' | 'failure' = Math.random() > 0.4 ? 'success' : 'failure';
    const returnValue = outcome === 'success' ? 
      (Math.random() * 15 + 2) : 
      (-(Math.random() * 10 + 1));
    
    const date = new Date();
    date.setDate(date.getDate() - i * 3);
    
    trades.push({
      asset: assets[Math.floor(Math.random() * assets.length)],
      action: actions[Math.floor(Math.random() * actions.length)],
      amount: 3000 + Math.random() * 7000,
      outcome,
      return: returnValue,
      date: date.toISOString()
    });
  }
  
  return trades;
}

function mapRecommendationToDecisionAction(
  recommendation: 'approve' | 'reject' | 'veto' | 'neutral',
  proposedAction: 'BUY' | 'SELL' | 'HOLD' | 'REDUCE POSITION' | 'INCREASE POSITION',
  agentId: AgentType
): DecisionAction {
  if (recommendation === 'veto') return 'VETO';
  if (recommendation === 'neutral') return 'HOLD';
  
  if (agentId === 'survival') {
    if (recommendation === 'reject') return 'VETO';
    return proposedAction;
  }
  
  if (recommendation === 'reject') {
    return proposedAction === 'BUY' ? 'SELL' : 
           proposedAction === 'SELL' ? 'HOLD' :
           proposedAction === 'INCREASE POSITION' ? 'REDUCE POSITION' :
           'HOLD';
  }
  
  return proposedAction;
}
