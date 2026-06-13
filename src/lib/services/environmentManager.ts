import type { 
  EnvironmentType, 
  Agent,
  LearningEngineState,
  SystemConfig,
  Operation
} from '@/lib/types';

export interface EnvironmentConfig {
  type: EnvironmentType;
  name: string;
  description: string;
  icon: string;
  features: {
    simulatedData: boolean;
    simulatedNews: boolean;
    realMarketData: boolean;
    realNews: boolean;
    virtualMoney: boolean;
    realMoney: boolean;
    generatesOrders: boolean;
    executesOrders: boolean;
    updatesReputation: boolean;
    learningSpeed: 'fast' | 'normal' | 'validated';
    requiresApproval: boolean;
  };
  riskLevel: 'none' | 'low' | 'medium' | 'high';
  color: string;
  badge: string;
}

export interface EnvironmentAccount {
  environmentType: EnvironmentType;
  balance: number;
  initialBalance: number;
  operations: Operation[];
  agents: Agent[];
  learningState: LearningEngineState;
  config: SystemConfig;
  createdAt: string;
  lastUpdated: string;
}

export const ENVIRONMENT_CONFIGS: Record<EnvironmentType, EnvironmentConfig> = {
  sandbox: {
    type: 'sandbox',
    name: 'Sandbox',
    description: 'Experimentación y entrenamiento',
    icon: '🧪',
    features: {
      simulatedData: true,
      simulatedNews: true,
      realMarketData: false,
      realNews: false,
      virtualMoney: true,
      realMoney: false,
      generatesOrders: false,
      executesOrders: false,
      updatesReputation: false,
      learningSpeed: 'fast',
      requiresApproval: false,
    },
    riskLevel: 'none',
    color: 'oklch(0.70 0.18 150)',
    badge: 'SANDBOX',
  },
  demo: {
    type: 'demo',
    name: 'Demo',
    description: 'Validación con mercado real',
    icon: '📊',
    features: {
      simulatedData: false,
      simulatedNews: false,
      realMarketData: true,
      realNews: true,
      virtualMoney: true,
      realMoney: false,
      generatesOrders: false,
      executesOrders: false,
      updatesReputation: true,
      learningSpeed: 'normal',
      requiresApproval: false,
    },
    riskLevel: 'low',
    color: 'oklch(0.75 0.15 210)',
    badge: 'DEMO',
  },
  paper: {
    type: 'paper',
    name: 'Paper Live',
    description: 'Verificación antes de operar',
    icon: '📝',
    features: {
      simulatedData: false,
      simulatedNews: false,
      realMarketData: true,
      realNews: true,
      virtualMoney: true,
      realMoney: false,
      generatesOrders: true,
      executesOrders: false,
      updatesReputation: true,
      learningSpeed: 'normal',
      requiresApproval: false,
    },
    riskLevel: 'medium',
    color: 'oklch(0.65 0.20 300)',
    badge: 'PAPER',
  },
  real: {
    type: 'real',
    name: 'Real',
    description: 'Operación real',
    icon: '💰',
    features: {
      simulatedData: false,
      simulatedNews: false,
      realMarketData: true,
      realNews: true,
      virtualMoney: false,
      realMoney: true,
      generatesOrders: true,
      executesOrders: true,
      updatesReputation: true,
      learningSpeed: 'validated',
      requiresApproval: true,
    },
    riskLevel: 'high',
    color: 'oklch(0.55 0.25 25)',
    badge: 'REAL',
  },
};

export const DEFAULT_ENVIRONMENT_BALANCES: Record<EnvironmentType, number> = {
  sandbox: 100000,
  demo: 50000,
  paper: 25000,
  real: 2500,
};

export function getEnvironmentConfig(env: EnvironmentType): EnvironmentConfig {
  return ENVIRONMENT_CONFIGS[env];
}

export function getEnvironmentColor(env: EnvironmentType): string {
  return ENVIRONMENT_CONFIGS[env].color;
}

export function getEnvironmentName(env: EnvironmentType): string {
  return ENVIRONMENT_CONFIGS[env].name;
}

export function getEnvironmentBadge(env: EnvironmentType): string {
  return ENVIRONMENT_CONFIGS[env].badge;
}

export function canPromoteToEnvironment(
  from: EnvironmentType,
  to: EnvironmentType
): boolean {
  const order: EnvironmentType[] = ['sandbox', 'demo', 'paper', 'real'];
  const fromIndex = order.indexOf(from);
  const toIndex = order.indexOf(to);
  return toIndex === fromIndex + 1;
}

export function getNextEnvironment(
  current: EnvironmentType
): EnvironmentType | null {
  const order: EnvironmentType[] = ['sandbox', 'demo', 'paper', 'real'];
  const currentIndex = order.indexOf(current);
  if (currentIndex < order.length - 1) {
    return order[currentIndex + 1];
  }
  return null;
}

export function getLearningWeightMultiplier(env: EnvironmentType): number {
  switch (env) {
    case 'sandbox':
      return 0.5;
    case 'demo':
      return 1.0;
    case 'paper':
      return 1.5;
    case 'real':
      return 3.0;
    default:
      return 1.0;
  }
}

export function getReputationImpactMultiplier(env: EnvironmentType): number {
  switch (env) {
    case 'sandbox':
      return 0;
    case 'demo':
      return 0.7;
    case 'paper':
      return 1.0;
    case 'real':
      return 2.0;
    default:
      return 1.0;
  }
}

export function shouldUpdateGlobalReputation(env: EnvironmentType): boolean {
  return env !== 'sandbox';
}

export function generateOrdersWithoutExecution(env: EnvironmentType): boolean {
  return env === 'paper';
}

export function requiresRealExchange(env: EnvironmentType): boolean {
  return env === 'real';
}

export function getEnvironmentDescription(env: EnvironmentType): string {
  const config = ENVIRONMENT_CONFIGS[env];
  const features: string[] = [];
  
  if (config.features.simulatedData) features.push('Datos simulados');
  if (config.features.realMarketData) features.push('Datos reales');
  if (config.features.simulatedNews) features.push('Noticias simuladas');
  if (config.features.realNews) features.push('Noticias reales');
  if (config.features.virtualMoney) features.push('Dinero virtual');
  if (config.features.realMoney) features.push('Capital real');
  if (config.features.generatesOrders && !config.features.executesOrders) {
    features.push('Genera órdenes (NO ejecuta)');
  }
  if (config.features.executesOrders) features.push('Ejecuta órdenes reales');
  if (config.features.updatesReputation) features.push('Actualiza reputaciones');
  
  return features.join(' • ');
}
