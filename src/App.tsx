import { lazy, Suspense, useState, useEffect, useRef, useMemo } from 'react';
import { useKV } from '@github/spark/hooks';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { AgentCard } from '@/components/AgentCard';
import { SurvivalGauge } from '@/components/SurvivalGauge';
import { Sparkline } from '@/components/Sparkline';
import { DecisionCenter } from '@/components/DecisionCenter';
import { ProductionDecisionCenter } from '@/components/ProductionDecisionCenter';
import { LearningDashboard } from '@/components/LearningDashboard';
import { EnhancedConsensusEngine } from '@/components/EnhancedConsensusEngine';
import { EnvironmentSwitcher } from '@/components/EnvironmentSwitcher';
import { EnvironmentDashboard } from '@/components/EnvironmentDashboard';
import { StrategyPromotionPanel } from '@/components/StrategyPromotionPanel';
import { RealTradingConfirmationModal } from '@/components/RealTradingConfirmationModal';
import { MarketIntelligenceCenter } from '@/components/MarketIntelligenceCenter';
import { CapitalFlowEngine } from '@/components/CapitalFlowEngine';
import { GlobalOpportunityScanner } from '@/components/GlobalOpportunityScanner';
import { MacroEconomyDashboard } from '@/components/MacroEconomyDashboard';
import { NavigationMenu } from '@/components/NavigationMenu';
import { MarketsCenter } from '@/components/MarketsCenter';
import { PortfolioCenter } from '@/components/PortfolioCenter';
import { AssetAnalysisPage } from '@/components/AssetAnalysisPage';
import { SystemMonitorPage } from '@/components/SystemMonitorPage';
import { ObservabilityCenterPage } from '@/components/ObservabilityCenterPage';
import { OperationalMarketIntelligencePage } from '@/components/OperationalMarketIntelligencePage';
import { UserPreferencesPanel } from '@/components/UserPreferencesPanel';
import { ModeControlMenu } from '@/components/ModeControlMenu';
import { Bell, TrendUp, TrendDown, Circle, Gear } from '@phosphor-icons/react';
import { cn } from '@/lib/utils';
import type { Agent, Operation, MarketPosition, NewsItem, InvestmentProposal, SystemConfig, AgentType, OrganizationConfig, LearningEngineState, EnvironmentType, RealTradingConfirmation } from '@/lib/types';
import { 
  DEFAULT_CONFIG, 
  initializeAgents, 
  generateMockMarketPositions,
  generateMockNews,
  calculateSurvivalReserve,
  calculateOperatingCapital,
  calculateSystemHealth,
  generateMockProposal,
  generateMockOperations,
  generateMarketSentiment,
  formatCurrency,
  formatPercent,
  formatDate,
  generateTrendData
} from '@/lib/mockData';
import {
  generateCryptoAssets,
  generateStockAssets,
  generateETFAssets,
  generateForexAssets,
  generateCommodityAssets,
  generateIndexAssets,
  generateRealEstateAssets,
  generateMacroData,
  generateCapitalFlows,
  generateSectorRotation,
  generateGlobalOpportunities,
} from '@/lib/services/marketDataGenerator';
import type { Asset, CryptoAsset } from '@/lib/marketIntelligence';
import { buildAssetAnalysis } from '@/lib/assetAnalysis';
import { DEFAULT_ORGANIZATION_CONFIG, activateOrganizationProfile } from '@/lib/organizationProfiles';
import { initializeLearningEngine, initializeAgentPerformance, recordCompletedTrade, updateAgentReputations } from '@/lib/services/learningEngine';
import { applyGlobalModelToAgents } from '@/lib/services/modelManager';
import type { CompletedTrade } from '@/lib/types';
import { DEFAULT_ENVIRONMENT_BALANCES, getEnvironmentConfig, ENVIRONMENT_CONFIGS, OPERABLE_ENVIRONMENTS, shouldUpdateGlobalReputation } from '@/lib/services/environmentManager';
import { evaluateEnvironmentReadiness, calculateSystemMaturity } from '@/lib/services/maturityEngine';
import { buildDefaultTradingRules, evaluateTradingRules } from '@/lib/services/ruleEngine';
import { toast } from 'sonner';
import { createDefaultPlatformConfig, migratePlatformConfig, type PlatformConfig } from '@/lib/platformConfig';
import type { AutoExecutionStatus } from '@/lib/platformConfig';
import type { AuroraBackupSnapshot } from '@/lib/backup';

interface EnvironmentAccount {
  agents: Agent[];
  operations: Operation[];
  currentCapital: number;
  learningState: LearningEngineState;
  config: SystemConfig;
}

const SettingsAdminPage = lazy(() => import('@/components/settings/SettingsAdminPage').then((module) => ({ default: module.SettingsAdminPage })));
const StrategicChatPage = lazy(() => import('@/pages/ai/StrategicChatPage').then((module) => ({ default: module.StrategicChatPage })));
const AgentCollaborationPage = lazy(() => import('@/components/AgentCollaborationPage').then((module) => ({ default: module.AgentCollaborationPage })));

const createDefaultAccount = (env: EnvironmentType): EnvironmentAccount => ({
  agents: [],
  operations: [],
  currentCapital: DEFAULT_ENVIRONMENT_BALANCES[env],
  learningState: initializeLearningEngine(),
  config: { ...DEFAULT_CONFIG, totalCapital: DEFAULT_ENVIRONMENT_BALANCES[env] },
});

const normalizeOperableEnvironment = (env: EnvironmentType | undefined | null): EnvironmentType => {
  if (!env || env === 'real') return 'paper';
  return env;
};

const buildAlpacaAccountEndpoint = (baseUrl: string): string => {
  const normalized = baseUrl.trim().replace(/\/+$/, '');
  if (/\/v2$/i.test(normalized)) {
    return `${normalized}/account`;
  }
  return `${normalized}/v2/account`;
};

const COINMARKETPRO_SUPPORTED_SYMBOLS = new Set([
  'BTC',
  'ETH',
  'SOL',
  'ADA',
  'AVAX',
  'MATIC',
  'ARB',
  'OP',
  'UNI',
  'AAVE',
  'LINK',
  'DOGE',
  'SHIB',
  'PEPE',
  'XRP',
  'BNB',
]);

const DEFAULT_EXECUTION_AGENT_BY_ACTION: Record<'BUY' | 'SELL' | 'HOLD' | 'REDUCE POSITION' | 'INCREASE POSITION', AgentType> = {
  BUY: 'investor',
  SELL: 'director',
  HOLD: 'supervisor',
  'REDUCE POSITION': 'risk',
  'INCREASE POSITION': 'investor',
};

function App() {
  const normalizeSettingsPath = (path: string): string => {
    if (!path.startsWith('/settings')) return '/settings/general';
    if (path === '/settings' || path === '/settings/') return '/settings/general';
    if (path === '/settings/agents' || path === '/settings/agents/') {
      return '/settings/agents/assignment';
    }
    return path;
  };

  const getInitialTab = (): string => {
    if (typeof window !== 'undefined' && window.location.pathname.startsWith('/settings')) {
      return 'settings';
    }
    return 'dashboard';
  };

  const getInitialSettingsPath = (): string => {
    if (typeof window !== 'undefined') {
      return normalizeSettingsPath(window.location.pathname);
    }
    return '/settings/general';
  };

  const [currentEnvironment, setCurrentEnvironment] = useKV<EnvironmentType>('aurora-current-environment', 'sandbox');
  const activeEnvironment = normalizeOperableEnvironment(currentEnvironment);
  
  const [allAccounts, setAllAccounts] = useKV<Record<EnvironmentType, EnvironmentAccount>>('aurora-all-accounts', {
    sandbox: createDefaultAccount('sandbox'),
    demo: createDefaultAccount('demo'),
    paper: createDefaultAccount('paper'),
    real: createDefaultAccount('real'),
  });
  
  const account = allAccounts?.[activeEnvironment] || createDefaultAccount(activeEnvironment);
  const { agents, operations, currentCapital, learningState, config } = account;
  
  const updateCurrentAccount = (updater: (prev: EnvironmentAccount) => EnvironmentAccount) => {
    if (!activeEnvironment || !allAccounts) return;
    setAllAccounts((prev) => {
      if (!prev) return {
        sandbox: createDefaultAccount('sandbox'),
        demo: createDefaultAccount('demo'),
        paper: createDefaultAccount('paper'),
        real: createDefaultAccount('real'),
      };
      return {
        ...prev,
        [activeEnvironment]: updater(prev[activeEnvironment]),
      };
    });
  };
  
  const setAgents = (updater: React.SetStateAction<Agent[]>) => {
    updateCurrentAccount((prev) => ({
      ...prev,
      agents: typeof updater === 'function' ? updater(prev.agents) : updater,
    }));
  };
  
  const setOperations = (updater: React.SetStateAction<Operation[]>) => {
    updateCurrentAccount((prev) => ({
      ...prev,
      operations: typeof updater === 'function' ? updater(prev.operations) : updater,
    }));
  };
  
  const setCurrentCapital = (updater: React.SetStateAction<number>) => {
    updateCurrentAccount((prev) => ({
      ...prev,
      currentCapital: typeof updater === 'function' ? updater(prev.currentCapital) : updater,
    }));
  };

  useEffect(() => {
    if (!currentEnvironment) return;
    const normalized = normalizeOperableEnvironment(currentEnvironment);
    if (normalized !== currentEnvironment) {
      setCurrentEnvironment(normalized);
      toast.info('Modo REAL bloqueado. Cambiado automaticamente a Paper Live.');
    }
  }, [currentEnvironment, setCurrentEnvironment]);
  
  const setLearningState = (updater: React.SetStateAction<LearningEngineState>) => {
    updateCurrentAccount((prev) => ({
      ...prev,
      learningState: typeof updater === 'function' ? updater(prev.learningState) : updater,
    }));
  };
  
  const setConfig = (updater: React.SetStateAction<SystemConfig>) => {
    updateCurrentAccount((prev) => ({
      ...prev,
      config: typeof updater === 'function' ? updater(prev.config) : updater,
    }));
  };
  
  const [proposal, setProposal] = useState<InvestmentProposal | null>(null);
  const [showRealConfirmation, setShowRealConfirmation] = useState(false);
  const [showUserPreferences, setShowUserPreferences] = useState(false);
  const [currentTab, setCurrentTab] = useState(getInitialTab);
  const [settingsPath, setSettingsPath] = useState(getInitialSettingsPath);
  const [realTradingConfirmation, setRealTradingConfirmation] = useKV<RealTradingConfirmation | null>(
    'aurora-real-trading-confirmation',
    null
  );
  const [platformConfig, setPlatformConfig] = useKV<PlatformConfig>(
    'aurora-platform-config',
    createDefaultPlatformConfig()
  );
  const paperSyncStateRef = useRef<{ lastEquity?: number; lastError?: string }>({});
  const autoExecutionRef = useRef(false);
  
  const [marketPositions, setMarketPositions] = useState<MarketPosition[]>(generateMockMarketPositions());
  const [news] = useState<NewsItem[]>(generateMockNews());
  const [sentiment] = useState(generateMarketSentiment());
  const [performanceData] = useState(generateTrendData());
  
  const [cryptoAssets, setCryptoAssets] = useState(generateCryptoAssets());
  const [stockAssets] = useState(generateStockAssets());
  const [etfAssets] = useState(generateETFAssets());
  const [forexAssets] = useState(generateForexAssets());
  const [commodityAssets] = useState(generateCommodityAssets());
  const [indexAssets] = useState(generateIndexAssets());
  const [realEstateAssets] = useState(generateRealEstateAssets());
  const [macroData] = useState(generateMacroData());
  const [capitalFlows] = useState(generateCapitalFlows());
  const [sectorRotation] = useState(generateSectorRotation());
  
  const allAssets: Asset[] = [
    ...cryptoAssets,
    ...stockAssets,
    ...etfAssets,
    ...forexAssets,
    ...commodityAssets,
    ...indexAssets,
    ...realEstateAssets,
  ];
  const cryptoSymbols = useMemo(
    () => Array.from(new Set(cryptoAssets.map((asset) => asset.symbol.toUpperCase()))).join(','),
    [cryptoAssets]
  );
  
  const [globalOpportunities] = useState(generateGlobalOpportunities(allAssets));
  const [selectedAssetSymbol, setSelectedAssetSymbol] = useState<string>('BTC');

  const safePlatformConfig = migratePlatformConfig(platformConfig);

  useEffect(() => {
    const shouldSyncPaper =
      activeEnvironment === 'paper' &&
      safePlatformConfig.apisConfig.alpacaPaper.status === 'connected' &&
      safePlatformConfig.apisConfig.alpacaPaper.apiKey.trim() &&
      safePlatformConfig.apisConfig.alpacaPaper.secretKey.trim() &&
      safePlatformConfig.apisConfig.alpacaPaper.baseUrl.trim();

    if (!shouldSyncPaper) return;

    let cancelled = false;

    const syncFromAlpaca = async () => {
      try {
        const endpoint = buildAlpacaAccountEndpoint(safePlatformConfig.apisConfig.alpacaPaper.baseUrl);
        const response = await fetch(endpoint, {
          method: 'GET',
          headers: {
            Accept: 'application/json',
            'APCA-API-KEY-ID': safePlatformConfig.apisConfig.alpacaPaper.apiKey.trim(),
            'APCA-API-SECRET-KEY': safePlatformConfig.apisConfig.alpacaPaper.secretKey.trim(),
          },
        });

        if (!response.ok) {
          throw new Error(`status ${response.status}`);
        }

        const payload = await response.json() as { equity?: string; cash?: string };
        const equityRaw = payload.equity ?? payload.cash;
        const equity = equityRaw ? Number.parseFloat(equityRaw) : Number.NaN;

        if (!Number.isFinite(equity) || equity <= 0) {
          throw new Error('equity invalida');
        }

        if (cancelled) return;

        setCurrentCapital((prev) => {
          if (Math.abs(prev - equity) < 0.01) return prev;
          return equity;
        });

        if (paperSyncStateRef.current.lastEquity === undefined) {
          toast.success('Paper Live sincronizado con saldo de Alpaca');
        }

        paperSyncStateRef.current.lastEquity = equity;
        paperSyncStateRef.current.lastError = undefined;
      } catch (error) {
        if (cancelled) return;
        const message = error instanceof Error ? error.message : 'error desconocido';
        if (paperSyncStateRef.current.lastError !== message) {
          toast.error(`No se pudo sincronizar Paper Live: ${message}`);
          paperSyncStateRef.current.lastError = message;
        }
      }
    };

    void syncFromAlpaca();
    const timer = setInterval(() => {
      void syncFromAlpaca();
    }, 60_000);

    return () => {
      cancelled = true;
      clearInterval(timer);
    };
  }, [
    activeEnvironment,
    safePlatformConfig.apisConfig.alpacaPaper.apiKey,
    safePlatformConfig.apisConfig.alpacaPaper.baseUrl,
    safePlatformConfig.apisConfig.alpacaPaper.secretKey,
    safePlatformConfig.apisConfig.alpacaPaper.status,
  ]);

  useEffect(() => {
    const coinMarketProApiKey = safePlatformConfig.apisConfig.coinmarketpro.apiKey.trim();
    const coinMarketProBaseUrl = safePlatformConfig.apisConfig.coinmarketpro.baseUrl.trim().replace(/\/+$/, '');
    const coinMarketProConnected = safePlatformConfig.apisConfig.coinmarketpro.status === 'connected';
    if (!coinMarketProApiKey || !coinMarketProBaseUrl || !coinMarketProConnected || !cryptoSymbols) return;

    let cancelled = false;

    const syncCryptoPrices = async () => {
      try {
        const symbols = cryptoSymbols.split(',').filter(Boolean);
        const supportedSymbols = symbols.filter((symbol) => COINMARKETPRO_SUPPORTED_SYMBOLS.has(symbol));
        if (supportedSymbols.length === 0) return;

        const endpoint = `/api/coinmarketpro/quotes?symbols=${encodeURIComponent(
          supportedSymbols.join(','),
        )}&convert=USD&baseUrl=${encodeURIComponent(coinMarketProBaseUrl)}&apiKey=${encodeURIComponent(
          coinMarketProApiKey,
        )}`;
        const response = await fetch(endpoint, { method: 'GET', headers: { Accept: 'application/json' } });

        if (!response.ok) {
          throw new Error(`status ${response.status}`);
        }

        const payload = await response.json() as {
          data?: Record<string, {
            quote?: {
              USD?: {
                price?: number;
                percent_change_24h?: number;
                volume_24h?: number;
                market_cap?: number;
              };
            };
          }>;
        };

        if (!payload?.data || typeof payload.data !== 'object') {
          throw new Error('payload invalido');
        }

        if (cancelled) return;

        setCryptoAssets((prev: CryptoAsset[]) =>
          prev.map((asset) => {
            const symbol = asset.symbol.toUpperCase();
            const quote = payload.data?.[symbol]?.quote?.USD;
            if (!quote || typeof quote.price !== 'number' || !Number.isFinite(quote.price)) {
              return asset;
            }

            const nextTrend = [...asset.trend.slice(-29), quote.price];
            return {
              ...asset,
              price: quote.price,
              change24h:
                typeof quote.percent_change_24h === 'number' && Number.isFinite(quote.percent_change_24h)
                  ? quote.percent_change_24h
                  : asset.change24h,
              volume24h:
                typeof quote.volume_24h === 'number' && Number.isFinite(quote.volume_24h)
                  ? quote.volume_24h
                  : asset.volume24h,
              marketCap:
                typeof quote.market_cap === 'number' && Number.isFinite(quote.market_cap)
                  ? quote.market_cap
                  : asset.marketCap,
              trend: nextTrend,
              lastUpdated: new Date().toISOString(),
            };
          })
        );

        setMarketPositions((prev) =>
          prev.map((position) => {
            const symbol = position.asset.split('/')[0]?.toUpperCase();
            const quote = symbol ? payload.data?.[symbol]?.quote?.USD : undefined;
            if (!quote || typeof quote.price !== 'number' || !Number.isFinite(quote.price)) {
              return position;
            }

            const nextTrend = [...position.trend.slice(-19), quote.price];
            return {
              ...position,
              currentPrice: quote.price,
              change24h:
                typeof quote.percent_change_24h === 'number' && Number.isFinite(quote.percent_change_24h)
                  ? quote.percent_change_24h
                  : position.change24h,
              trend: nextTrend,
            };
          })
        );
      } catch {
        return;
      }
    };

    void syncCryptoPrices();
    const timer = setInterval(() => {
      void syncCryptoPrices();
    }, 45_000);

    return () => {
      cancelled = true;
      clearInterval(timer);
    };
  }, [
    cryptoSymbols,
    safePlatformConfig.apisConfig.coinmarketpro.apiKey,
    safePlatformConfig.apisConfig.coinmarketpro.baseUrl,
    safePlatformConfig.apisConfig.coinmarketpro.status,
  ]);

  const selectedAsset = allAssets.find((asset) => asset.symbol === selectedAssetSymbol) ?? allAssets[0];
  const selectedAssetAnalysis = selectedAsset ? buildAssetAnalysis(selectedAsset) : null;

  const handleAssetSelection = (symbol: string) => {
    setSelectedAssetSymbol(symbol);
    setCurrentTab('asset-analysis');
  };

  const updatePlatformConfig = (updater: (current: PlatformConfig) => PlatformConfig) => {
    setPlatformConfig((prev) => {
      const current = migratePlatformConfig(prev);
      return migratePlatformConfig(updater(current));
    });
  };

  const appendAutoExecutionLog = (payload: {
    environment: EnvironmentType;
    asset: string;
    action: 'entry' | 'exit' | 'blocked';
    entryAmount: number;
    exitAmount?: number;
    pnlAmount?: number;
    reason: string;
  }) => {
    updatePlatformConfig((current) => ({
      ...current,
      updatedAt: new Date().toISOString(),
      autoExecution: {
        ...current.autoExecution,
        logs: [
          {
            id: `exec-${payload.environment}-${Date.now()}`,
            environment: payload.environment,
            asset: payload.asset,
            action: payload.action,
            entryAmount: payload.entryAmount,
            exitAmount: payload.exitAmount,
            pnlAmount: payload.pnlAmount,
            reason: payload.reason,
            timestamp: new Date().toISOString(),
          },
          ...current.autoExecution.logs,
        ].slice(0, 250),
      },
    }));
  };

  const appendSecurityAudit = (payload: {
    type:
      | 'login'
      | 'config-change'
      | 'profile-change'
      | 'strategy-change'
      | 'kill-switch'
      | 'stop-auto-trading'
      | 'emergency-close';
    detail: string;
  }) => {
    updatePlatformConfig((current) => ({
      ...current,
      updatedAt: new Date().toISOString(),
      securityConfig: {
        ...current.securityConfig,
        auditEvents: [
          {
            id: `audit-${Date.now()}-${Math.round(Math.random() * 1000)}`,
            type: payload.type,
            role: current.securityConfig.currentRole,
            actor: `aurora-${current.securityConfig.currentRole}`,
            detail: payload.detail,
            timestamp: new Date().toISOString(),
          },
          ...current.securityConfig.auditEvents,
        ].slice(0, 300),
      },
    }));
  };

  const executeVirtualProposal = (
    proposalToExecute: InvestmentProposal,
    options: { automated?: boolean } = {},
  ) => {
    const environment = activeEnvironment;
    const actingAgentId = DEFAULT_EXECUTION_AGENT_BY_ACTION[proposalToExecute.action] ?? 'director';
    const actingAgent = agents.find((a) => a.id === actingAgentId);

    const agentGuardrailRules = actingAgent?.guardrails
      ? [
          {
            id: `guardrail-${actingAgent.id}`,
            name: `Guardrails ${actingAgent.name}`,
            enabled: true,
            scope: 'agent' as const,
            agentId: actingAgent.id,
            priority: 0,
            conditions: {
              maxRiskPercent: actingAgent.guardrails.maxRiskPercent,
              maxPositionSize: actingAgent.guardrails.maxPositionSize,
              blockedAssets: actingAgent.guardrails.blockedAssets,
            },
            action: 'reject' as const,
            reason: `Operacion bloqueada por guardrails del agente ${actingAgent.name}`,
          },
        ]
      : [];

    if (actingAgent?.executionRole === 'observer') {
      appendAutoExecutionLog({
        environment,
        asset: proposalToExecute.asset,
        action: 'blocked',
        entryAmount: proposalToExecute.amount,
        reason: `Agente ${actingAgent.name} en rol observer no puede ejecutar operaciones`,
      });
      if (!options.automated) {
        toast.error(`Rol observer: ${actingAgent.name} no tiene permisos de ejecucion`);
      }
      return false;
    }

    const estimatedPnl = proposalToExecute.survivalVeto
      ? 0
      : (proposalToExecute.amount * proposalToExecute.estimatedReturn) / 100;

    const ruleCheck = evaluateTradingRules([...agentGuardrailRules, ...buildDefaultTradingRules()], {
      environment,
      agentId: actingAgentId,
      asset: proposalToExecute.asset,
      action: proposalToExecute.action,
      amount: proposalToExecute.amount,
      currentCapital,
      estimatedRiskPercent: proposalToExecute.risk,
    });

    if (!ruleCheck.allowed) {
      appendAutoExecutionLog({
        environment,
        asset: proposalToExecute.asset,
        action: 'blocked',
        entryAmount: proposalToExecute.amount,
        reason: ruleCheck.reason,
      });

      if (!options.automated) {
        toast.error(`Regla bloqueó la operación: ${ruleCheck.reason}`);
      }

      return false;
    }

    if (safePlatformConfig.securityConfig.killSwitchEnabled) {
      appendAutoExecutionLog({
        environment,
        asset: proposalToExecute.asset,
        action: 'blocked',
        entryAmount: proposalToExecute.amount,
        reason: 'Bloqueada por Kill Switch global',
      });
      if (!options.automated) toast.error('Kill Switch activo: ejecucion bloqueada');
      return false;
    }

    if (safePlatformConfig.securityConfig.stopAutoTradingEnabled) {
      appendAutoExecutionLog({
        environment,
        asset: proposalToExecute.asset,
        action: 'blocked',
        entryAmount: proposalToExecute.amount,
        reason: 'Bloqueada por Stop Auto Trading',
      });
      if (!options.automated) toast.error('Stop Auto Trading activo: ejecucion pausada');
      return false;
    }

    const newOperation: Operation = {
      id: `op-${environment}-${Date.now()}`,
      date: new Date().toISOString(),
      asset: proposalToExecute.asset,
      action: proposalToExecute.action,
      amount: proposalToExecute.amount,
      result: proposalToExecute.survivalVeto ? undefined : estimatedPnl,
      status: proposalToExecute.survivalVeto ? 'vetoed' : 'executed',
      confidence: proposalToExecute.confidence,
      agentVotes: Object.entries(proposalToExecute.agentVotes).reduce((acc, [key, value]) => {
        acc[key as keyof typeof acc] = value.vote;
        return acc;
      }, {} as Operation['agentVotes']),
      vetoReason: proposalToExecute.survivalVeto ? 'Operacion amenaza reserva de supervivencia' : undefined,
    };

    if (proposalToExecute.survivalVeto) {
      appendAutoExecutionLog({
        environment,
        asset: proposalToExecute.asset,
        action: 'blocked',
        entryAmount: proposalToExecute.amount,
        reason: 'Bloqueada por veto de supervivencia',
      });
    } else {
      setCurrentCapital((prev) => Math.max(0, (prev ?? 0) + estimatedPnl));
      appendAutoExecutionLog({
        environment,
        asset: proposalToExecute.asset,
        action: proposalToExecute.action === 'SELL' ? 'exit' : 'entry',
        entryAmount: proposalToExecute.amount,
        exitAmount: proposalToExecute.amount + estimatedPnl,
        pnlAmount: estimatedPnl,
        reason: options.automated
          ? `${ENVIRONMENT_CONFIGS[environment].name}: ejecucion virtual automatica por consenso`
          : 'Ejecucion virtual aprobada por consenso',
      });

      const estimatedPnlPct = proposalToExecute.estimatedReturn;
      const outcome: CompletedTrade['outcome'] =
        estimatedPnlPct > 1 ? 'win' : estimatedPnlPct < -1 ? 'loss' : 'breakeven';

      const agentVotesForLearning = Object.entries(proposalToExecute.agentVotes).reduce(
        (acc, [agentId, voteData]) => {
          acc[agentId as AgentType] = {
            vote: voteData.vote === true ? 'APPROVE' : 'REJECT',
            confidence: voteData.confidence ?? proposalToExecute.confidence ?? 70,
          };
          return acc;
        },
        {} as CompletedTrade['agentVotes'],
      );

      const agentReputationsUsed = agents.reduce((acc, agent) => {
        acc[agent.id as AgentType] = agent.reputation;
        return acc;
      }, {} as CompletedTrade['agentReputationsUsed']);

      const completedTrade: CompletedTrade = {
        id: `trade-${newOperation.id}`,
        sessionId: newOperation.id,
        symbol: proposalToExecute.asset,
        action: proposalToExecute.action as CompletedTrade['action'],
        entryPrice: proposalToExecute.amount,
        exitPrice: proposalToExecute.amount + estimatedPnl,
        amount: proposalToExecute.amount,
        pnl: estimatedPnl,
        pnlPercent: estimatedPnlPct,
        consensus: proposalToExecute.confidence,
        agentVotes: agentVotesForLearning,
        agentReputationsUsed,
        outcome,
        timestamp: newOperation.date,
        exitTimestamp: new Date().toISOString(),
        duration: options.automated ? 1 : 0,
      };

      const stateAfterRecord = recordCompletedTrade(learningState || initializeLearningEngine(), completedTrade);

      if (shouldUpdateGlobalReputation(environment)) {
        const { state: stateAfterRep, updates } = updateAgentReputations(stateAfterRecord, completedTrade);
        setLearningState(stateAfterRep);

        if (updates.length > 0) {
          setAgents((prev) =>
            prev.map((agent) => {
              const update = updates.find((u) => u.agentId === agent.id);
              if (!update) return agent;
              return { ...agent, reputation: update.newReputation };
            })
          );

          if (!options.automated) {
            const topUpdate = updates.sort((a, b) => Math.abs(b.change) - Math.abs(a.change))[0];
            if (topUpdate) {
              const sign = topUpdate.change > 0 ? '+' : '';
              const agentName = agents.find((a) => a.id === topUpdate.agentId)?.name ?? topUpdate.agentId;
              toast(
                `${agentName}: ${sign}${topUpdate.change} rep. -> ${topUpdate.newReputation}`,
                { description: `Operacion: ${outcome === 'win' ? 'Ganadora' : outcome === 'loss' ? 'Perdedora' : 'Neutral'}` }
              );
            }
          }
        }
      } else {
        setLearningState(stateAfterRecord);
      }
    }

    setOperations((prev) => prev ? [newOperation, ...prev] : [newOperation]);
    return true;
  };

  const handleEmergencyClosePositions = () => {
    let closed = 0;

    setOperations((prev) => {
      if (!prev) return prev;
      return prev.map((operation) => {
        if (operation.status === 'executed' && operation.result === undefined) {
          closed += 1;
          return {
            ...operation,
            result: 0,
          };
        }
        return operation;
      });
    });

    appendSecurityAudit({
      type: 'emergency-close',
      detail: `Emergency close ejecutado. Posiciones cerradas: ${closed}.`,
    });

    return { closed };
  };
  
  useEffect(() => {
    if (!agents || agents.length === 0) {
      setAgents(initializeAgents());
    }
    if (!operations || operations.length === 0) {
      setOperations(generateMockOperations());
    }
  }, []);

  useEffect(() => {
    if (agents && agents.length > 0 && learningState) {
      const newPerformance = { ...learningState.agentPerformance };
      let needsUpdate = false;

      agents.forEach(agent => {
        if (!newPerformance[agent.id]) {
          newPerformance[agent.id] = initializeAgentPerformance(
            agent.id,
            agent.name,
            agent.reputation
          );
          needsUpdate = true;
        }
      });

      if (needsUpdate) {
        setLearningState((prev) => prev ? {
          ...prev,
          agentPerformance: newPerformance,
        } : initializeLearningEngine());
      }
    }
  }, [agents, learningState, setLearningState]);
  
  useEffect(() => {
    if (agents && agents.length > 0 && config && currentCapital !== undefined && !proposal) {
      const newProposal = generateMockProposal(agents, config, currentCapital);
      setProposal(newProposal);
    }
  }, [agents, config, currentCapital]);

  useEffect(() => {
    if (!agents.length) return;
    if (safePlatformConfig.llmsConfig.assignmentMode !== 'global') return;

    const globalizedAgents = applyGlobalModelToAgents(agents, {
      provider: safePlatformConfig.llmsConfig.defaultProvider,
      model: safePlatformConfig.llmsConfig.defaultModel,
    });

    const changed = globalizedAgents.some((nextAgent, index) => {
      const current = agents[index];
      return (
        current?.modelConfig?.provider !== nextAgent.modelConfig?.provider ||
        current?.modelConfig?.model !== nextAgent.modelConfig?.model
      );
    });

    if (changed) {
      setAgents(globalizedAgents);
    }
  }, [
    agents,
    safePlatformConfig.llmsConfig.assignmentMode,
    safePlatformConfig.llmsConfig.defaultModel,
    safePlatformConfig.llmsConfig.defaultProvider,
  ]);

  useEffect(() => {
    const engineStatus = safePlatformConfig.autoExecution[activeEnvironment]?.status;
    const canRun =
      engineStatus === 'running' &&
      activeEnvironment !== 'real' &&
      agents.length > 0 &&
      Boolean(config) &&
      currentCapital !== undefined;

    if (!canRun) return;

    const intervalMs =
      activeEnvironment === 'sandbox' ? 8_000 :
      activeEnvironment === 'demo' ? 12_000 :
      15_000;

    const runAutoCycle = () => {
      if (autoExecutionRef.current) return;
      autoExecutionRef.current = true;

      try {
        const nextProposal = proposal ?? generateMockProposal(agents, config, currentCapital);
        executeVirtualProposal(nextProposal, { automated: true });
        setProposal(generateMockProposal(agents, config, currentCapital));
      } finally {
        autoExecutionRef.current = false;
      }
    };

    const timer = setInterval(runAutoCycle, intervalMs);
    return () => clearInterval(timer);
  }, [
    activeEnvironment,
    agents,
    config,
    currentCapital,
    proposal,
    safePlatformConfig.autoExecution,
    safePlatformConfig.securityConfig.killSwitchEnabled,
    safePlatformConfig.securityConfig.stopAutoTradingEnabled,
  ]);

  useEffect(() => {
    if (!platformConfig || platformConfig.schemaVersion !== safePlatformConfig.schemaVersion) {
      setPlatformConfig(safePlatformConfig);
    }
  }, [platformConfig, safePlatformConfig, setPlatformConfig]);

  useEffect(() => {
    if (safePlatformConfig.securityConfig.auditEvents.some((event) => event.type === 'login')) {
      return;
    }

    appendSecurityAudit({
      type: 'login',
      detail: 'Sesion local iniciada en Aurora Capital.',
    });
  }, []);
  
  if (!config || !agents || !operations || currentCapital === undefined || !learningState) {
    return null;
  }
  
  const survivalReserve = calculateSurvivalReserve(config.totalCapital, config.survivalReservePercent);
  const operatingCapital = calculateOperatingCapital(config.totalCapital, config.survivalReservePercent);
  const systemHealth = calculateSystemHealth(config, currentCapital);
  const capitalChange = ((currentCapital - config.totalCapital) / config.totalCapital) * 100;
  
  const totalMarketCap = marketPositions.reduce((sum, pos) => sum + pos.amount, 0);
  const totalMarket24h = marketPositions.reduce((sum, pos) => sum + (pos.amount * pos.change24h / 100), 0);
  
  const handleSimulationToggle = (enabled: boolean) => {
    setConfig((prev) => prev ? { ...prev, simulationMode: enabled } : DEFAULT_CONFIG);
    appendSecurityAudit({
      type: 'config-change',
      detail: `Modo simulacion actualizado a ${enabled ? 'activo' : 'inactivo'}.`,
    });
  };

  const handleSetAutoExecutionStatus = (status: AutoExecutionStatus) => {
    updatePlatformConfig((current) => ({
      ...current,
      updatedAt: new Date().toISOString(),
      autoExecution: {
        ...current.autoExecution,
        [activeEnvironment]: {
          ...current.autoExecution[activeEnvironment],
          status,
        },
        logs: [
          {
            id: `mode-engine-${activeEnvironment}-${Date.now()}`,
            environment: activeEnvironment,
            asset: 'SYSTEM',
            action: status === 'stopped' ? 'blocked' : 'entry',
            entryAmount: 0,
            reason:
              status === 'running'
                ? 'Auto Execution activado desde menu de modos'
                : status === 'paused'
                ? 'Auto Execution pausado desde menu de modos'
                : 'Auto Execution detenido desde menu de modos',
            timestamp: new Date().toISOString(),
          },
          ...current.autoExecution.logs,
        ].slice(0, 250),
      },
    }));
  };

  const handleSetKillSwitch = (enabled: boolean) => {
    updatePlatformConfig((current) => ({
      ...current,
      updatedAt: new Date().toISOString(),
      securityConfig: {
        ...current.securityConfig,
        killSwitchEnabled: enabled,
      },
    }));

    appendSecurityAudit({
      type: 'kill-switch',
      detail: `Kill Switch ${enabled ? 'activado' : 'desactivado'} desde menu de modos.`,
    });
  };

  const handleSetStopAutoTrading = (enabled: boolean) => {
    updatePlatformConfig((current) => ({
      ...current,
      updatedAt: new Date().toISOString(),
      securityConfig: {
        ...current.securityConfig,
        stopAutoTradingEnabled: enabled,
      },
    }));

    appendSecurityAudit({
      type: 'stop-auto-trading',
      detail: `Stop Auto Trading ${enabled ? 'activado' : 'desactivado'} desde menu de modos.`,
    });
  };

  const handleSetEnvironmentEnabled = (environment: EnvironmentType, enabled: boolean) => {
    updatePlatformConfig((current) => ({
      ...current,
      updatedAt: new Date().toISOString(),
      environmentsConfig: {
        ...current.environmentsConfig,
        [environment]: {
          ...current.environmentsConfig[environment],
          enabled,
        },
      },
    }));

    if (!enabled && activeEnvironment === environment) {
      const fallback = (['sandbox', 'demo', 'paper'] as EnvironmentType[]).find(
        (env) => env !== environment && safePlatformConfig.environmentsConfig[env].enabled,
      ) ?? 'paper';
      setCurrentEnvironment(fallback);
      toast.info(`Entorno ${ENVIRONMENT_CONFIGS[environment].name} desactivado. Cambiando a ${ENVIRONMENT_CONFIGS[fallback].name}.`);
    }

    appendSecurityAudit({
      type: 'config-change',
      detail: `Entorno ${ENVIRONMENT_CONFIGS[environment].name} ${enabled ? 'habilitado' : 'deshabilitado'} desde menu de modos.`,
    });
  };

  const handleTelegramConfigSave = (payload: {
    botToken?: string;
    allowedUserId?: number;
    mode: 'polling' | 'webhook';
    webhookUrl?: string;
    pollingEnabled: boolean;
    lastCheckAt?: string;
    lastError?: string;
    botId?: number;
    botName?: string;
    botUsername?: string;
    status: 'connected' | 'disconnected' | 'not-configured' | 'error';
  }) => {
    setConfig((prev) => prev ? {
      ...prev,
      telegramConnected: payload.status === 'connected',
      telegramSettings: {
        ...(prev.telegramSettings ?? {}),
        botToken: payload.botToken,
        allowedUserId: payload.allowedUserId,
        mode: payload.mode,
        webhookUrl: payload.webhookUrl,
        pollingEnabled: payload.pollingEnabled,
        lastCheckAt: payload.lastCheckAt,
        lastError: payload.lastError,
        botId: payload.botId,
        botName: payload.botName,
        botUsername: payload.botUsername,
      },
    } : DEFAULT_CONFIG);

    appendSecurityAudit({
      type: 'config-change',
      detail: `Configuracion de Telegram actualizada. Estado: ${payload.status}.`,
    });
  };
  
  const handleUpdateAgent = (agentId: string, updates: Partial<Agent>) => {
    setAgents((prevAgents) => 
      prevAgents ? prevAgents.map(agent => 
        agent.id === agentId ? { ...agent, ...updates } : agent
      ) : []
    );
  };
  
  const handleProfileChange = (profileId: string) => {
    setConfig((prev) => prev ? {
      ...prev,
      organization: activateOrganizationProfile(prev.organization ?? DEFAULT_ORGANIZATION_CONFIG, profileId),
    } : DEFAULT_CONFIG);

    appendSecurityAudit({
      type: 'profile-change',
      detail: `Perfil organizacional cambiado a ${profileId}.`,
    });
  };

  const handleOrganizationConfigChange = (
    updater: (current: OrganizationConfig | undefined) => OrganizationConfig,
  ) => {
    setConfig((prev) => prev ? {
      ...prev,
      organization: updater(prev.organization),
    } : DEFAULT_CONFIG);
  };
  
  const handleApproveProposal = () => {
    if (!proposal) return;
    executeVirtualProposal(proposal);
    setProposal(null);
    
    setTimeout(() => {
      if (agents.length > 0) {
        setProposal(generateMockProposal(agents, config, currentCapital));
      }
    }, 2000);
  };
  
  const handleRejectProposal = () => {
    if (proposal) {
      appendAutoExecutionLog({
        environment: activeEnvironment,
        asset: proposal.asset,
        action: 'blocked',
        entryAmount: proposal.amount,
        reason: 'Propuesta cancelada por decision del director',
      });
    }

    setProposal(null);
    setTimeout(() => {
      if (agents.length > 0) {
        setProposal(generateMockProposal(agents, config, currentCapital));
      }
    }, 2000);
  };
  
  const handleEnvironmentSwitch = (newEnv: EnvironmentType) => {
    if (newEnv === 'real') {
      toast.error('Modo REAL bloqueado en esta version. Usa Sandbox, Demo o Paper Live.');
      return;
    }
    if (!safePlatformConfig.environmentsConfig[newEnv].enabled) {
      toast.error(`El entorno ${ENVIRONMENT_CONFIGS[newEnv].name} esta deshabilitado.`);
      return;
    }
    setCurrentEnvironment(newEnv);
    toast.success(`Cambiado a entorno ${ENVIRONMENT_CONFIGS[newEnv].name}`);
  };
  
  const handleRealConfirm = () => {
    const now = new Date();
    const expiresAt = new Date(now.getTime() + 24 * 60 * 60 * 1000);
    setRealTradingConfirmation({
      confirmed: true,
      timestamp: now.toISOString(),
      expiresAt: expiresAt.toISOString(),
      acknowledgedRisks: [
        'Utilizaré dinero real',
        'Las pérdidas serán reales',
        'Las órdenes serán enviadas al exchange',
        'He leído y acepto los términos',
      ],
    });
    setShowRealConfirmation(false);
    setCurrentEnvironment('real');
    toast.success('Entorno REAL activado - Válido por 24 horas');
  };
  
  const handlePromoteStrategy = () => {
    toast.success('Estrategia promocionada al siguiente entorno');
    appendSecurityAudit({
      type: 'strategy-change',
      detail: 'Estrategia promovida al siguiente entorno.',
    });
  };

  const handleExportBackup = (): AuroraBackupSnapshot => {
    const snapshot: AuroraBackupSnapshot = {
      version: 1,
      exportedAt: new Date().toISOString(),
      source: 'aurora-capital',
      payload: {
        profiles: {
          organization: config.organization,
          activeEnvironment,
        },
        agents,
        weights: {
          customWeights: config.organization?.customWeights,
          hierarchy: config.organization?.hierarchy,
        },
        strategies: {
          simulationMode: config.simulationMode,
          maxRiskPerOperation: config.maxRiskPerOperation,
          dailyLossLimit: config.dailyLossLimit,
          survivalReservePercent: config.survivalReservePercent,
        },
        llms: agents.map((agent) => ({
          agentId: agent.id,
          agentType: agent.agentType,
          modelConfig: agent.modelConfig,
        })),
        apis: safePlatformConfig.apisConfig,
        environments: {
          accounts: (Object.keys(allAccounts || {}) as EnvironmentType[]).reduce((acc, env) => {
            const account = allAccounts?.[env] || createDefaultAccount(env);
            acc[env] = {
              currentCapital: account.currentCapital,
              totalCapital: account.config.totalCapital,
              operationsCount: account.operations.length,
            };
            return acc;
          }, {} as Record<EnvironmentType, { currentCapital: number; totalCapital: number; operationsCount: number }>),
          fullAccounts: allAccounts || undefined,
          config: safePlatformConfig.environmentsConfig,
          autoExecution: safePlatformConfig.autoExecution,
        },
        platform: {
          featureFlags: safePlatformConfig.featureFlags,
          security: safePlatformConfig.securityConfig,
        },
        raw: {
          config,
          platformConfig: safePlatformConfig,
        },
      },
    };

    appendSecurityAudit({
      type: 'config-change',
      detail: 'Backup JSON exportado.',
    });

    return snapshot;
  };

  const handleRestoreBackup = (snapshot: AuroraBackupSnapshot): { ok: boolean; message: string } => {
    try {
      const payload = snapshot.payload;

      if (!payload?.raw?.config || !payload?.raw?.platformConfig) {
        return { ok: false, message: 'Backup incompleto: faltan secciones críticas.' };
      }

      const restoredPlatformConfig = migratePlatformConfig(payload.raw.platformConfig);
      setConfig(payload.raw.config);
      setPlatformConfig(restoredPlatformConfig);

      if (Array.isArray(payload.agents) && payload.agents.length > 0) {
        setAgents(payload.agents);
      }

      if (payload.profiles?.activeEnvironment) {
        setCurrentEnvironment(normalizeOperableEnvironment(payload.profiles.activeEnvironment));
      }

      if (payload.environments?.fullAccounts) {
        setAllAccounts(payload.environments.fullAccounts);
      }

      appendSecurityAudit({
        type: 'config-change',
        detail: `Backup restaurado desde ${snapshot.exportedAt}.`,
      });

      return { ok: true, message: 'Backup restaurado correctamente.' };
    } catch (error) {
      return {
        ok: false,
        message: error instanceof Error ? error.message : 'No fue posible restaurar el backup.',
      };
    }
  };

  const navigateSettings = (path: string) => {
    const nextPath = normalizeSettingsPath(path);
    setSettingsPath(nextPath);

    if (typeof window !== 'undefined' && window.location.pathname !== nextPath) {
      window.history.pushState({}, '', nextPath);
    }
  };

  const handleTabChange = (tab: string) => {
    if (tab === 'models' || tab === 'providers') {
      setCurrentTab('settings');
      navigateSettings('/settings/llms');
      return;
    }

    if (tab === 'training') {
      setCurrentTab('learning');

      if (typeof window !== 'undefined' && window.location.pathname.startsWith('/settings')) {
        window.history.pushState({}, '', '/');
      }
      return;
    }

    setCurrentTab(tab);

    if (tab === 'settings') {
      navigateSettings('/settings');
      return;
    }

    if (typeof window !== 'undefined' && window.location.pathname.startsWith('/settings')) {
      window.history.pushState({}, '', '/');
    }
  };

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const onPopState = () => {
      if (window.location.pathname.startsWith('/settings')) {
        setCurrentTab('settings');
        setSettingsPath(normalizeSettingsPath(window.location.pathname));
      }
    };

    window.addEventListener('popstate', onPopState);
    return () => window.removeEventListener('popstate', onPopState);
  }, []);
  
  const environmentStats = OPERABLE_ENVIRONMENTS.map((env) => {
    const envAccount = allAccounts?.[env] || createDefaultAccount(env);
    const maturity = calculateSystemMaturity(envAccount.learningState);
    return {
      environment: env,
      capital: envAccount.currentCapital,
      roi: ((envAccount.currentCapital - envAccount.config.totalCapital) / envAccount.config.totalCapital) * 100,
      trades: envAccount.learningState.globalStats.totalTrades,
      winRate: envAccount.learningState.globalStats.winRate / 100,
      drawdown: Math.abs(envAccount.learningState.globalStats.maxDrawdownPercent / 100),
      maturityScore: maturity.maturityScore,
      status: (env === activeEnvironment ? 'active' : envAccount.operations.length > 0 ? 'ready' : 'inactive') as 'active' | 'inactive' | 'ready',
    };
  });

  const settingsEnvironmentOverview = OPERABLE_ENVIRONMENTS.reduce((acc, env) => {
    const envAccount = allAccounts?.[env] || createDefaultAccount(env);
    const baseCapital = envAccount.config.totalCapital || DEFAULT_ENVIRONMENT_BALANCES[env];
    const pnl = ((envAccount.currentCapital - baseCapital) / Math.max(baseCapital, 1)) * 100;

    acc[env] = {
      initialCapital: baseCapital,
      currentCapital: envAccount.currentCapital,
      positions: envAccount.operations.filter((operation) => operation.status === 'executed' && operation.result === undefined).length,
      pnl,
      status: env === activeEnvironment ? 'running' : envAccount.operations.length > 0 ? 'paused' : 'stopped',
    };

    return acc;
  }, {} as Record<EnvironmentType, { initialCapital: number; currentCapital: number; positions: number; pnl: number; status: 'running' | 'paused' | 'stopped' }>);
  
  const currentMaturityStatus = evaluateEnvironmentReadiness(activeEnvironment, learningState || initializeLearningEngine());
  
  return (
    <>
      <RealTradingConfirmationModal
        open={showRealConfirmation}
        onConfirm={handleRealConfirm}
        onCancel={() => setShowRealConfirmation(false)}
      />

      <UserPreferencesPanel
        open={showUserPreferences}
        onClose={() => setShowUserPreferences(false)}
      />

      <div className="min-h-screen bg-gradient-to-br from-background via-background to-secondary/20">
      <div className="container mx-auto px-4 py-6 space-y-6">
        <header className="flex items-center justify-between mb-6">
          <div 
            className="flex items-center gap-3 cursor-pointer group" 
            onClick={() => setCurrentTab('dashboard')}
          >
            <div className="w-10 h-10 bg-gradient-to-br from-primary to-accent rounded-lg flex items-center justify-center group-hover:scale-105 transition-transform">
              <svg className="w-6 h-6 text-primary-foreground" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2L2 7v10c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V7l-10-5z"/>
              </svg>
            </div>
            <div>
              <h1 className="font-heading font-bold text-2xl tracking-tight text-glow group-hover:text-primary transition-colors">
                AURORA CAPITAL
              </h1>
              <p className="text-xs text-muted-foreground uppercase tracking-widest">
                AI Autonomous Investment System
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              {OPERABLE_ENVIRONMENTS.map((env) => {
                const envConfig = ENVIRONMENT_CONFIGS[env];
                const isActive = activeEnvironment === env;
                const isEnabled = safePlatformConfig.environmentsConfig[env].enabled;
                return (
                  <Button
                    key={env}
                    variant={isActive ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => handleEnvironmentSwitch(env)}
                    disabled={!isEnabled}
                    className={cn(
                      'font-heading font-semibold text-xs uppercase tracking-wider transition-all',
                      isActive && 'shadow-lg shadow-primary/30',
                      !isEnabled && 'opacity-50'
                    )}
                  >
                    <span className="mr-1">{envConfig.icon}</span>
                    {envConfig.name}
                  </Button>
                );
              })}
            </div>
            
            <Badge 
              variant={config.simulationMode ? "outline" : "default"}
              className={cn(
                "gap-2 px-3 py-1",
                config.simulationMode ? "border-accent text-accent" : "bg-warning/20 text-warning border-warning"
              )}
            >
              <Circle size={8} weight="fill" className="animate-pulse-subtle" />
              {config.simulationMode ? 'SIMULACIÓN ACTIVA' : 'MODO REAL'}
            </Badge>
            
            <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-foreground">
              <Bell size={20} />
            </Button>

            <ModeControlMenu
              activeEnvironment={activeEnvironment}
              platformConfig={safePlatformConfig}
              simulationMode={config.simulationMode}
              onToggleSimulationMode={handleSimulationToggle}
              onSetAutoExecutionStatus={handleSetAutoExecutionStatus}
              onSetKillSwitch={handleSetKillSwitch}
              onSetStopAutoTrading={handleSetStopAutoTrading}
              onSetEnvironmentEnabled={handleSetEnvironmentEnabled}
              onSwitchEnvironment={handleEnvironmentSwitch}
            />
            
            <Button 
              variant="ghost" 
              size="icon" 
              className="text-muted-foreground hover:text-foreground"
              onClick={() => setShowUserPreferences(true)}
            >
              <Gear size={20} />
            </Button>
          </div>
        </header>
        
        <NavigationMenu currentTab={currentTab} onTabChange={handleTabChange} />
        
        <div className="space-y-6">
          {currentTab === 'dashboard' && (
            <>
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <Card className="lg:col-span-2 p-6 bg-card/50 backdrop-blur-sm">
                  <div className="grid grid-cols-3 gap-6">
                    <div>
                      <p className="text-xs text-muted-foreground uppercase tracking-wide mb-2">Capital Total</p>
                      <p className="font-mono font-bold text-3xl text-foreground">{formatCurrency(currentCapital)}</p>
                      <p className={cn(
                        "text-sm font-medium flex items-center gap-1 mt-1",
                        capitalChange >= 0 ? "text-accent" : "text-destructive"
                      )}>
                        {capitalChange >= 0 ? <TrendUp size={16} /> : <TrendDown size={16} />}
                        {formatPercent(capitalChange)}
                      </p>
                    </div>
                    
                    <div>
                      <p className="text-xs text-muted-foreground uppercase tracking-wide mb-2">Reserva Supervivencia</p>
                      <p className="font-mono font-bold text-3xl text-warning">{formatCurrency(survivalReserve)}</p>
                      <p className="text-sm text-muted-foreground mt-1">{config.survivalReservePercent}% del capital</p>
                    </div>
                    
                    <div>
                      <p className="text-xs text-muted-foreground uppercase tracking-wide mb-2">Capital Operativo</p>
                      <p className="font-mono font-bold text-3xl text-primary">{formatCurrency(currentCapital - survivalReserve)}</p>
                      <p className="text-sm text-muted-foreground mt-1">70% del capital</p>
                    </div>
                  </div>
                  
                  <Separator className="my-6" />
                  
                  <div>
                    <p className="text-xs text-muted-foreground uppercase tracking-wide mb-3">Estado del Sistema</p>
                    <Badge 
                      variant="outline" 
                      className={cn(
                        "text-sm px-3 py-1",
                        systemHealth >= 80 ? "border-accent text-accent" :
                        systemHealth >= 50 ? "border-yellow-400 text-yellow-400" :
                        "border-destructive text-destructive"
                      )}
                    >
                      {systemHealth >= 80 ? 'ÓPTIMO' : systemHealth >= 50 ? 'ESTABLE' : 'EN RIESGO'}
                    </Badge>
                    <p className="text-xs text-muted-foreground mt-2">Todos los sistemas activos</p>
                  </div>
                  
                  <div className="mt-6 h-32">
                    <p className="text-xs text-muted-foreground uppercase tracking-wide mb-3">Rendimiento</p>
                    <Sparkline data={performanceData} positive={capitalChange >= 0} className="h-full" />
                  </div>
                </Card>
                
                <SurvivalGauge 
                  health={systemHealth}
                  reserveAmount={survivalReserve}
                  totalCapital={config.totalCapital}
                />
              </div>
              
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {agents.slice(0, 4).map((agent) => (
                  <AgentCard key={agent.id} agent={agent} />
                ))}
              </div>
              
              {proposal && (
                <Card className="p-6 bg-card/50 backdrop-blur-sm border-primary/30">
                  <h3 className="font-heading font-semibold text-lg mb-4">PROPUESTA DE INVERSIÓN ACTUAL</h3>
                  
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <div className="lg:col-span-2 space-y-4">
                      <div className="grid grid-cols-3 gap-4">
                        <div>
                          <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">Activo</p>
                          <p className="font-mono font-bold text-lg">{proposal.asset}</p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">Acción</p>
                          <Badge variant={proposal.action === 'BUY' ? 'default' : 'destructive'} className="text-sm">
                            {proposal.action === 'BUY' ? 'COMPRAR' : 'VENDER'}
                          </Badge>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">Importe Propuesto</p>
                          <p className="font-mono font-semibold text-lg">{formatCurrency(proposal.amount)}</p>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <p className="text-xs text-muted-foreground uppercase tracking-wide mb-2">Confianza Global</p>
                          <div className="flex items-center gap-2">
                            <div className="flex-1 h-2 bg-background rounded-full overflow-hidden">
                              <div 
                                className="h-full bg-primary rounded-full transition-all duration-500"
                                style={{ width: `${proposal.globalConfidence}%` }}
                              />
                            </div>
                            <span className="font-mono text-sm font-semibold">{Math.round(proposal.globalConfidence)}%</span>
                          </div>
                        </div>
                        
                        <div>
                          <p className="text-xs text-muted-foreground uppercase tracking-wide mb-2">Riesgo Estimado</p>
                          <div className="flex items-center gap-2">
                            <div className="flex-1 h-2 bg-background rounded-full overflow-hidden">
                              <div 
                                className="h-full bg-yellow-500 rounded-full transition-all duration-500"
                                style={{ width: `${(proposal.risk / 5) * 100}%` }}
                              />
                            </div>
                            <span className="font-mono text-sm font-semibold">{proposal.risk.toFixed(1)}%</span>
                          </div>
                        </div>
                      </div>
                      
                      {proposal.survivalVeto && (
                        <div className="p-4 bg-warning/10 border-2 border-warning/50 rounded-lg">
                          <p className="text-sm font-semibold text-warning flex items-center gap-2">
                            <Circle size={12} weight="fill" className="animate-pulse" />
                            VETO DE SUPERVIVENCIA
                          </p>
                          <p className="text-xs text-muted-foreground mt-1">
                            Este agente tiene autoridad absoluta para bloquear cualquier operación
                          </p>
                        </div>
                      )}
                    </div>
                    
                    <div className="space-y-3">
                      <p className="text-xs text-muted-foreground uppercase tracking-wide">Decisión Final</p>
                      <Badge 
                        variant="outline" 
                        className="text-sm border-yellow-400 text-yellow-400 mb-4"
                      >
                        Pendiente
                      </Badge>
                      <p className="text-xs text-muted-foreground mb-3">Evaluación del Director</p>
                      
                      <div className="flex flex-col gap-2">
                        <Button 
                          onClick={handleApproveProposal}
                          className="w-full"
                          disabled={proposal.survivalVeto}
                        >
                          {proposal.survivalVeto ? 'Bloqueado por Veto' : 'Aprobar'}
                        </Button>
                        <Button 
                          onClick={handleRejectProposal}
                          variant="outline"
                          className="w-full"
                        >
                          Cancelar
                        </Button>
                      </div>
                    </div>
                  </div>
                </Card>
              )}
              
              <Card className="p-6 bg-card/50 backdrop-blur-sm">
                <h3 className="font-heading font-semibold text-lg mb-4">OPERACIONES RECIENTES</h3>
                <div className="space-y-2">
                  {operations.slice(0, 5).map((op) => (
                    <div key={op.id} className="flex items-center justify-between p-3 bg-background/50 rounded-lg">
                      <div className="flex items-center gap-3">
                        <Badge 
                          variant={op.action === 'BUY' ? 'default' : 'destructive'}
                          className="text-xs"
                        >
                          {op.action}
                        </Badge>
                        <span className="font-mono text-sm font-medium">{op.asset}</span>
                        <span className="text-xs text-muted-foreground">{formatDate(op.date)}</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="font-mono text-sm">{formatCurrency(op.amount)}</span>
                        {op.result !== undefined && (
                          <span className={cn(
                            "font-mono text-sm font-semibold",
                            op.result >= 0 ? "text-accent" : "text-destructive"
                          )}>
                            {formatPercent((op.result / op.amount) * 100)}
                          </span>
                        )}
                        <Badge 
                          variant={op.status === 'executed' ? 'default' : 'destructive'}
                          className="text-xs"
                        >
                          {op.status === 'executed' ? 'Ejecutado' : 'Vetado'}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            </>
          )}
          
          {currentTab === 'markets' && (
            <MarketsCenter
              cryptoAssets={cryptoAssets}
              stockAssets={stockAssets}
              etfAssets={etfAssets}
              forexAssets={forexAssets}
              commodityAssets={commodityAssets}
              indexAssets={indexAssets}
              realEstateAssets={realEstateAssets}
              onAssetSelect={handleAssetSelection}
            />
          )}

          {currentTab === 'portfolio' && (
            <PortfolioCenter
              allAccounts={allAccounts!}
              currentEnvironment={activeEnvironment}
              onSelectEnvironment={handleEnvironmentSwitch}
            />
          )}

          {currentTab === 'asset-analysis' && selectedAssetAnalysis && (
            <AssetAnalysisPage analysis={selectedAssetAnalysis} />
          )}

          {currentTab === 'intelligence' && (
            <MarketIntelligenceCenter
              cryptoAssets={cryptoAssets}
              stockAssets={stockAssets}
              etfAssets={etfAssets}
              forexAssets={forexAssets}
              commodityAssets={commodityAssets}
              indexAssets={indexAssets}
              realEstateAssets={realEstateAssets}
              onAssetSelect={handleAssetSelection}
            />
          )}

          {currentTab === 'market-intelligence' && (
            <OperationalMarketIntelligencePage />
          )}

          {currentTab === 'opportunities' && (
            <GlobalOpportunityScanner opportunities={globalOpportunities} />
          )}

          {currentTab === 'capitalflow' && (
            <CapitalFlowEngine
              capitalFlows={capitalFlows}
              sectorRotation={sectorRotation}
              riskAppetite={{
                level: 65 + Math.random() * 20,
                trend: Math.random() > 0.5 ? 'increasing' : Math.random() > 0.5 ? 'decreasing' : 'stable',
                indicators: ['VIX Low', 'High Yield Spreads Tight', 'Risk-On Sentiment'],
              }}
            />
          )}

          {currentTab === 'macro' && (
            <MacroEconomyDashboard macroData={macroData} />
          )}

          {currentTab === 'consensus' && (
            <EnhancedConsensusEngine 
              agents={agents}
              config={config}
              currentCapital={currentCapital}
              learningState={learningState}
              proposal={proposal}
            />
          )}

          {currentTab === 'learning' && (
            <LearningDashboard learningState={learningState} />
          )}
          
          {currentTab === 'production' && (
            <ProductionDecisionCenter 
              agents={agents}
              config={config}
              currentCapital={currentCapital}
            />
          )}

          {currentTab === 'strategic-chat' && (
            <Suspense fallback={<div className="h-full" />}>
              <StrategicChatPage />
            </Suspense>
          )}

          {currentTab === 'agent-collaboration' && (
            <Suspense fallback={<div className="h-full" />}>
              <AgentCollaborationPage />
            </Suspense>
          )}

          {currentTab === 'system-monitor' && (
            <SystemMonitorPage agents={agents} platformConfig={safePlatformConfig} />
          )}

          {currentTab === 'observability' && (
            <ObservabilityCenterPage
              agents={agents}
              config={config}
              learningState={learningState}
              platformConfig={safePlatformConfig}
            />
          )}
          
          {currentTab === 'decisions' && (
            <DecisionCenter 
              agents={agents}
              config={config}
              currentCapital={currentCapital}
            />
          )}
          
          {currentTab === 'market' && (
            <>
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <Card className="lg:col-span-2 p-6 bg-card/50 backdrop-blur-sm">
                  <h3 className="font-heading font-semibold text-lg mb-4">RESUMEN DE MERCADO</h3>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Sentimiento General</span>
                      <Badge 
                        variant="outline"
                        className={cn(
                          sentiment.overall === 'positive' ? 'border-accent text-accent' :
                          sentiment.overall === 'negative' ? 'border-destructive text-destructive' :
                          'border-muted text-muted-foreground'
                        )}
                      >
                        {sentiment.overall === 'positive' ? 'Positivo' : 
                         sentiment.overall === 'negative' ? 'Negativo' : 'Neutral'}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">{sentiment.summary}</p>
                    <Separator />
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Capitalización (24h)</span>
                        <span className="font-mono font-semibold">{formatCurrency(totalMarketCap)}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Volumen 24h</span>
                        <span className="font-mono font-semibold">{formatCurrency(totalMarket24h * 10)}</span>
                      </div>
                    </div>
                  </div>
                </Card>
                
                <Card className="p-6 bg-card/50 backdrop-blur-sm">
                  <h3 className="font-heading font-semibold text-lg mb-4">NOTICIAS RECIENTES</h3>
                  <div className="space-y-3">
                    {news.map((item) => (
                      <div key={item.id} className="p-3 bg-background/50 rounded-lg">
                        <p className="text-xs text-foreground line-clamp-2 mb-1">{item.title}</p>
                        <div className="flex items-center justify-between">
                          <Badge 
                            variant="outline"
                            className={cn(
                              "text-xs",
                              item.sentiment === 'positive' ? 'border-accent/50 text-accent' :
                              item.sentiment === 'negative' ? 'border-destructive/50 text-destructive' :
                              'border-muted/50 text-muted-foreground'
                            )}
                          >
                            {item.sentiment}
                          </Badge>
                          <span className="text-xs text-muted-foreground">{item.timestamp}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </Card>
              </div>
              
              <Card className="p-6 bg-card/50 backdrop-blur-sm">
                <h3 className="font-heading font-semibold text-lg mb-4">ACTIVOS PRINCIPALES</h3>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Activo</TableHead>
                      <TableHead>Precio</TableHead>
                      <TableHead>24h</TableHead>
                      <TableHead>Tendencia</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {marketPositions.map((position) => (
                      <TableRow key={position.asset}>
                        <TableCell className="font-mono font-medium">{position.asset}</TableCell>
                        <TableCell className="font-mono">{formatCurrency(position.currentPrice)}</TableCell>
                        <TableCell>
                          <span className={cn(
                            "font-mono font-semibold",
                            position.change24h >= 0 ? "text-accent" : "text-destructive"
                          )}>
                            {formatPercent(position.change24h)}
                          </span>
                        </TableCell>
                        <TableCell>
                          <div className="h-8 w-24">
                            <Sparkline data={position.trend} positive={position.change24h >= 0} />
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </Card>
            </>
          )}
          
          {currentTab === 'models' && (
            <div className="space-y-6">
              <div>
                <h2 className="font-heading font-bold text-3xl tracking-tight text-glow">
                  MODELOS
                </h2>
                <p className="text-sm text-muted-foreground mt-1">
                  Gestión de modelos LLM disponibles
                </p>
              </div>
              <Card className="p-6 bg-card/50 backdrop-blur-sm">
                <p className="text-muted-foreground">Usa Configuración → LLMs para gestionar modelos y proveedores activos.</p>
              </Card>
            </div>
          )}

          {currentTab === 'providers' && (
            <div className="space-y-6">
              <div>
                <h2 className="font-heading font-bold text-3xl tracking-tight text-glow">
                  PROVEEDORES LLM
                </h2>
                <p className="text-sm text-muted-foreground mt-1">
                  Configuración de APIs y proveedores
                </p>
              </div>
              <Card className="p-6 bg-card/50 backdrop-blur-sm">
                <p className="text-muted-foreground">Usa Configuración → LLMs para agregar proveedores y testear conexión.</p>
              </Card>
            </div>
          )}

          {currentTab === 'training' && (
            <div className="space-y-6">
              <div>
                <h2 className="font-heading font-bold text-3xl tracking-tight text-glow">
                  ENTRENAMIENTO
                </h2>
                <p className="text-sm text-muted-foreground mt-1">
                  Sistema de entrenamiento y fine-tuning
                </p>
              </div>
              <Card className="p-6 bg-card/50 backdrop-blur-sm">
                <p className="text-muted-foreground">Usa Learning para revisar desempeño y evolución de agentes en tiempo real.</p>
              </Card>
            </div>
          )}

          {currentTab === 'agents' && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {agents.map((agent) => (
                <AgentCard key={agent.id} agent={agent} />
              ))}
            </div>
          )}
          
          {currentTab === 'history' && (
            <Card className="p-6 bg-card/50 backdrop-blur-sm">
              <h3 className="font-heading font-semibold text-lg mb-4">HISTORIAL DE OPERACIONES</h3>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Fecha</TableHead>
                    <TableHead>Activo</TableHead>
                    <TableHead>Acción</TableHead>
                    <TableHead>Importe</TableHead>
                    <TableHead>Resultado</TableHead>
                    <TableHead>Confianza</TableHead>
                    <TableHead>Estado</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {operations.map((op) => (
                    <TableRow key={op.id}>
                      <TableCell className="text-sm text-muted-foreground">{formatDate(op.date)}</TableCell>
                      <TableCell className="font-mono font-medium">{op.asset}</TableCell>
                      <TableCell>
                        <Badge variant={op.action === 'BUY' ? 'default' : 'destructive'} className="text-xs">
                          {op.action}
                        </Badge>
                      </TableCell>
                      <TableCell className="font-mono">{formatCurrency(op.amount)}</TableCell>
                      <TableCell>
                        {op.result !== undefined ? (
                          <span className={cn(
                            "font-mono font-semibold",
                            op.result >= 0 ? "text-accent" : "text-destructive"
                          )}>
                            {formatPercent((op.result / op.amount) * 100)}
                          </span>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </TableCell>
                      <TableCell className="font-mono text-sm">{op.confidence.toFixed(0)}%</TableCell>
                      <TableCell>
                        <Badge 
                          variant={op.status === 'executed' ? 'default' : 'destructive'}
                          className="text-xs"
                        >
                          {op.status === 'executed' ? 'Ejecutado' : 'Vetado'}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Card>
          )}
          
          {currentTab === 'environments' && (
            <>
              <EnvironmentDashboard
                environments={environmentStats}
                currentEnvironment={activeEnvironment}
                onSelectEnvironment={handleEnvironmentSwitch}
              />
              
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <StrategyPromotionPanel
                  maturityStatus={currentMaturityStatus}
                  onPromote={handlePromoteStrategy}
                />
                
                <Card className="p-6 bg-card/50 backdrop-blur-sm">
                  <h3 className="font-heading font-bold text-xl mb-4">ENVIRONMENT FEATURES</h3>
                  <div className="space-y-4">
                    {(Object.keys(ENVIRONMENT_CONFIGS) as EnvironmentType[]).map((envKey) => {
                      const envConfig = ENVIRONMENT_CONFIGS[envKey];
                      return (
                        <div key={envKey} className="p-4 bg-background/50 rounded-lg">
                          <div className="flex items-center gap-2 mb-2">
                            <span className="text-xl">{envConfig.icon}</span>
                            <span className="font-heading font-bold">{envConfig.name}</span>
                          </div>
                          <p className="text-xs text-muted-foreground mb-2">{envConfig.description}</p>
                          <div className="flex flex-wrap gap-2">
                            {envConfig.features.realMarketData && (
                              <Badge variant="secondary" className="text-xs">Datos Reales</Badge>
                            )}
                            {envConfig.features.updatesReputation && (
                              <Badge variant="secondary" className="text-xs">Actualiza Reputación</Badge>
                            )}
                            {envConfig.features.generatesOrders && (
                              <Badge variant="outline" className="text-xs border-warning text-warning">
                                Genera Órdenes
                              </Badge>
                            )}
                            {envConfig.features.executesOrders && (
                              <Badge variant="destructive" className="text-xs">Ejecuta Real</Badge>
                            )}
                            {envConfig.features.realMoney && (
                              <Badge variant="destructive" className="text-xs">Capital Real</Badge>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </Card>
              </div>
            </>
          )}

          {currentTab === 'settings' && (
            <Suspense fallback={<div className="h-full" />}>
              <SettingsAdminPage
                path={settingsPath}
                navigate={navigateSettings}
                config={config}
                platformConfig={safePlatformConfig}
                agents={agents}
                activeEnvironment={activeEnvironment}
                environmentOverview={settingsEnvironmentOverview}
                onSimulationToggle={handleSimulationToggle}
                onTelegramConfigSave={handleTelegramConfigSave}
                onUpdateAgent={handleUpdateAgent}
                onProfileChange={handleProfileChange}
                onSelectEnvironment={handleEnvironmentSwitch}
                onEmergencyClosePositions={handleEmergencyClosePositions}
                onExportBackup={handleExportBackup}
                onRestoreBackup={handleRestoreBackup}
                onOrganizationConfigChange={handleOrganizationConfigChange}
                onPlatformConfigChange={updatePlatformConfig}
              />
            </Suspense>
          )}
        </div>
      </div>
    </div>
    </>
  );
}

export default App;
