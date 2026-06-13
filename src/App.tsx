import { useState, useEffect } from 'react';
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
import { SettingsModal } from '@/components/SettingsModal';
import { MarketsCenter } from '@/components/MarketsCenter';
import { PortfolioCenter } from '@/components/PortfolioCenter';
import { Bell, TrendUp, TrendDown, Circle, Gear } from '@phosphor-icons/react';
import { cn } from '@/lib/utils';
import type { Agent, Operation, MarketPosition, NewsItem, InvestmentProposal, SystemConfig, AgentType, OrganizationalProfile, LearningEngineState, EnvironmentType, RealTradingConfirmation } from '@/lib/types';
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
import type { Asset } from '@/lib/marketIntelligence';
import { DEFAULT_ORGANIZATION_CONFIG } from '@/lib/organizationProfiles';
import { initializeLearningEngine, initializeAgentPerformance } from '@/lib/services/learningEngine';
import { DEFAULT_ENVIRONMENT_BALANCES, getEnvironmentConfig, ENVIRONMENT_CONFIGS } from '@/lib/services/environmentManager';
import { evaluateEnvironmentReadiness, calculateSystemMaturity } from '@/lib/services/maturityEngine';
import { toast } from 'sonner';

interface EnvironmentAccount {
  agents: Agent[];
  operations: Operation[];
  currentCapital: number;
  learningState: LearningEngineState;
  config: SystemConfig;
}

const createDefaultAccount = (env: EnvironmentType): EnvironmentAccount => ({
  agents: [],
  operations: [],
  currentCapital: DEFAULT_ENVIRONMENT_BALANCES[env],
  learningState: initializeLearningEngine(),
  config: { ...DEFAULT_CONFIG, totalCapital: DEFAULT_ENVIRONMENT_BALANCES[env] },
});

function App() {
  const [currentEnvironment, setCurrentEnvironment] = useKV<EnvironmentType>('aurora-current-environment', 'sandbox');
  
  const [allAccounts, setAllAccounts] = useKV<Record<EnvironmentType, EnvironmentAccount>>('aurora-all-accounts', {
    sandbox: createDefaultAccount('sandbox'),
    demo: createDefaultAccount('demo'),
    paper: createDefaultAccount('paper'),
    real: createDefaultAccount('real'),
  });
  
  const account = allAccounts?.[currentEnvironment!] || createDefaultAccount(currentEnvironment || 'sandbox');
  const { agents, operations, currentCapital, learningState, config } = account;
  
  const updateCurrentAccount = (updater: (prev: EnvironmentAccount) => EnvironmentAccount) => {
    if (!currentEnvironment || !allAccounts) return;
    setAllAccounts((prev) => {
      if (!prev) return {
        sandbox: createDefaultAccount('sandbox'),
        demo: createDefaultAccount('demo'),
        paper: createDefaultAccount('paper'),
        real: createDefaultAccount('real'),
      };
      return {
        ...prev,
        [currentEnvironment]: updater(prev[currentEnvironment]),
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
  const [showSettings, setShowSettings] = useState(false);
  const [currentTab, setCurrentTab] = useState('dashboard');
  const [realTradingConfirmation, setRealTradingConfirmation] = useKV<RealTradingConfirmation | null>(
    'aurora-real-trading-confirmation',
    null
  );
  
  const [marketPositions] = useState<MarketPosition[]>(generateMockMarketPositions());
  const [news] = useState<NewsItem[]>(generateMockNews());
  const [sentiment] = useState(generateMarketSentiment());
  const [performanceData] = useState(generateTrendData());
  
  const [cryptoAssets] = useState(generateCryptoAssets());
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
  
  const [globalOpportunities] = useState(generateGlobalOpportunities(allAssets));
  
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
  };
  
  const handleUpdateAgent = (agentId: string, updates: Partial<Agent>) => {
    setAgents((prevAgents) => 
      prevAgents ? prevAgents.map(agent => 
        agent.id === agentId ? { ...agent, ...updates } : agent
      ) : []
    );
  };
  
  const handleProfileChange = (profile: OrganizationalProfile) => {
    setConfig((prev) => prev ? {
      ...prev,
      organization: {
        ...(prev.organization ?? DEFAULT_ORGANIZATION_CONFIG),
        profile
      }
    } : DEFAULT_CONFIG);
  };
  
  const handleApproveProposal = () => {
    if (!proposal) return;
    
    const newOperation: Operation = {
      id: `op-${Date.now()}`,
      date: new Date().toISOString(),
      asset: proposal.asset,
      action: proposal.action,
      amount: proposal.amount,
      status: proposal.survivalVeto ? 'vetoed' : 'executed',
      confidence: proposal.confidence,
      agentVotes: Object.entries(proposal.agentVotes).reduce((acc, [key, value]) => {
        acc[key as keyof typeof acc] = value.vote;
        return acc;
      }, {} as Operation['agentVotes']),
      vetoReason: proposal.survivalVeto ? 'Operación amenaza reserva de supervivencia' : undefined,
    };
    
    if (!proposal.survivalVeto && proposal.action === 'BUY') {
      setCurrentCapital((prev) => (prev ?? 0) - proposal.amount);
    }
    
    setOperations((prev) => prev ? [newOperation, ...prev] : [newOperation]);
    setProposal(null);
    
    setTimeout(() => {
      if (agents.length > 0) {
        setProposal(generateMockProposal(agents, config, currentCapital));
      }
    }, 2000);
  };
  
  const handleRejectProposal = () => {
    setProposal(null);
    setTimeout(() => {
      if (agents.length > 0) {
        setProposal(generateMockProposal(agents, config, currentCapital));
      }
    }, 2000);
  };
  
  const handleEnvironmentSwitch = (newEnv: EnvironmentType) => {
    if (newEnv === 'real') {
      if (!realTradingConfirmation || new Date(realTradingConfirmation.expiresAt) < new Date()) {
        setShowRealConfirmation(true);
        return;
      }
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
  };
  
  const environmentStats = (Object.keys(allAccounts || {}) as EnvironmentType[]).map((env) => {
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
      status: (env === currentEnvironment ? 'active' : envAccount.operations.length > 0 ? 'ready' : 'inactive') as 'active' | 'inactive' | 'ready',
    };
  });
  
  const currentMaturityStatus = evaluateEnvironmentReadiness(currentEnvironment || 'sandbox', learningState || initializeLearningEngine());
  
  return (
    <>
      <RealTradingConfirmationModal
        open={showRealConfirmation}
        onConfirm={handleRealConfirm}
        onCancel={() => setShowRealConfirmation(false)}
      />
      
      <SettingsModal
        open={showSettings}
        onOpenChange={setShowSettings}
        config={config}
        agents={agents}
        onSimulationToggle={handleSimulationToggle}
        onUpdateAgent={handleUpdateAgent}
        onProfileChange={handleProfileChange}
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
              {(['sandbox', 'demo', 'paper', 'real'] as EnvironmentType[]).map((env) => {
                const envConfig = ENVIRONMENT_CONFIGS[env];
                const isActive = currentEnvironment === env;
                return (
                  <Button
                    key={env}
                    variant={isActive ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => handleEnvironmentSwitch(env)}
                    className={cn(
                      'font-heading font-semibold text-xs uppercase tracking-wider transition-all',
                      isActive && 'shadow-lg shadow-primary/30'
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
            
            <Button 
              variant="ghost" 
              size="icon" 
              className="text-muted-foreground hover:text-foreground"
              onClick={() => setShowSettings(true)}
            >
              <Gear size={20} />
            </Button>
          </div>
        </header>
        
        <NavigationMenu currentTab={currentTab} onTabChange={setCurrentTab} />
        
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
            />
          )}

          {currentTab === 'portfolio' && (
            <PortfolioCenter
              allAccounts={allAccounts!}
              currentEnvironment={currentEnvironment!}
              onSelectEnvironment={handleEnvironmentSwitch}
            />
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
            />
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
                <p className="text-muted-foreground">Próximamente: Gestión de modelos OpenAI, Claude, Gemini, DeepSeek, Mistral, Groq, Ollama, LM Studio</p>
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
                <p className="text-muted-foreground">Próximamente: Configuración de proveedores LLM</p>
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
                <p className="text-muted-foreground">Próximamente: Entrenamiento de modelos y fine-tuning</p>
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
                currentEnvironment={currentEnvironment!}
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
        </div>
      </div>
    </div>
    </>
  );
}

export default App;
