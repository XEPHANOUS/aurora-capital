import type { Agent, AgentType, InvestmentProposal, MarketPosition, NewsItem, Operation, OperationStatus, SystemConfig, MarketSentiment } from './types';

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
