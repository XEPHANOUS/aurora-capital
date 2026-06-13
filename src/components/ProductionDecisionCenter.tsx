import { useState, useEffect } from 'react';
import { useKV } from '@github/spark/hooks';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ConsensusPanel } from '@/components/ConsensusPanel';
import { DirectorDecisionPanel } from '@/components/DirectorDecisionPanel';
import { SurvivalAnalysisPanel } from '@/components/SurvivalAnalysisPanel';
import { DataSourceStatusPanel } from '@/components/DataSourceStatusPanel';
import type { 
  Agent, 
  SystemConfig, 
  AgentVote, 
  Operation,
  EnvironmentType,
  Portfolio,
  OperationType
} from '@/lib/types';
import { DecisionEngine } from '@/lib/services/decisionEngine';
import { PortfolioManager, DEFAULT_PORTFOLIOS } from '@/lib/services/portfolioManager';
import { cn } from '@/lib/utils';
import { Circle, CheckCircle, XCircle } from '@phosphor-icons/react';

interface ProductionDecisionCenterProps {
  agents: Agent[];
  config: SystemConfig;
  currentCapital: number;
}

export function ProductionDecisionCenter({ agents, config, currentCapital }: ProductionDecisionCenterProps) {
  const [portfolios, setPortfolios] = useKV<Record<EnvironmentType, Portfolio>>('aurora-portfolios', {
    sandbox: { ...DEFAULT_PORTFOLIOS.sandbox, id: 'sandbox-1', createdAt: new Date().toISOString(), lastUpdated: new Date().toISOString() },
    demo: { ...DEFAULT_PORTFOLIOS.demo, id: 'demo-1', createdAt: new Date().toISOString(), lastUpdated: new Date().toISOString() },
    real: { ...DEFAULT_PORTFOLIOS.real, id: 'real-1', createdAt: new Date().toISOString(), lastUpdated: new Date().toISOString() },
  });
  
  const [currentEnvironment, setCurrentEnvironment] = useKV<EnvironmentType>('aurora-current-env', 'sandbox');
  const [operations, setOperations] = useKV<Operation[]>('aurora-operations', []);
  
  const [proposedAction] = useState<OperationType>('BUY');
  const [proposedAsset] = useState<string>('BTC/USDT');
  const [proposedAmount] = useState<number>(5000);

  const [agentVotes, setAgentVotes] = useState<AgentVote[]>([]);

  const currentPortfolio = portfolios && currentEnvironment ? portfolios[currentEnvironment] : null;

  useEffect(() => {
    if (agents && agents.length > 0 && currentPortfolio) {
      const votes = DecisionEngine.generateAgentVotes(
        agents,
        proposedAction,
        proposedAmount,
        config,
        currentPortfolio.balance
      );
      setAgentVotes(votes);
    }
  }, [agents, proposedAction, proposedAmount, config, currentPortfolio?.balance]);

  if (!currentPortfolio || !agentVotes.length) {
    return null;
  }

  const consensus = DecisionEngine.calculateConsensus(agentVotes);
  const directorDecision = DecisionEngine.generateDirectorDecision(agentVotes, consensus, agents);
  const survivalAnalysis = DecisionEngine.generateSurvivalAnalysis(
    currentPortfolio.balance,
    proposedAmount,
    proposedAction,
    config
  );
  const historicalAnalysis = DecisionEngine.generateHistoricalAnalysis(proposedAction, operations || []);
  const riskMetrics = DecisionEngine.generateEnhancedRiskMetrics(proposedAmount, currentPortfolio.balance, config);
  const dataSource = DecisionEngine.createDataSourceStatus();

  const strategyStatus = PortfolioManager.getStrategyStatus(currentPortfolio);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('es-ES', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  const handleEnvironmentChange = (env: EnvironmentType) => {
    setCurrentEnvironment(env);
  };

  const actionColors = {
    BUY: 'border-accent text-accent',
    SELL: 'border-destructive text-destructive',
    HOLD: 'border-primary text-primary',
    'REDUCE POSITION': 'border-warning text-warning',
    'INCREASE POSITION': 'border-accent text-accent',
    VETO: 'border-destructive text-destructive',
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-heading font-bold text-2xl mb-2">CENTRO DE DECISIONES - MODO PRODUCCIÓN</h2>
          <p className="text-sm text-muted-foreground">Sistema de decisión autónoma con governance multi-agente</p>
        </div>
        
        <div className="flex items-center gap-4">
          <div>
            <p className="text-xs text-muted-foreground mb-1">Entorno Activo</p>
            <Select value={currentEnvironment} onValueChange={handleEnvironmentChange}>
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="sandbox">Sandbox</SelectItem>
                <SelectItem value="demo">Demo</SelectItem>
                <SelectItem value="real">Real</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          {strategyStatus.certified && (
            <Badge variant="outline" className="border-accent text-accent">
              <CheckCircle size={16} className="mr-1" weight="fill" />
              Estrategia Certificada
            </Badge>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="p-6 bg-card/50 backdrop-blur-sm">
          <h3 className="font-heading font-semibold text-sm mb-4">PORTFOLIO ACTUAL</h3>
          <div className="space-y-3">
            <div>
              <p className="text-xs text-muted-foreground mb-1">Balance</p>
              <p className="font-mono font-bold text-xl">{formatCurrency(currentPortfolio.balance)}</p>
            </div>
            <Separator />
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <p className="text-xs text-muted-foreground">Operaciones</p>
                <p className="font-mono font-semibold">{currentPortfolio.statistics.totalTrades}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Tasa Éxito</p>
                <p className="font-mono font-semibold">{currentPortfolio.statistics.winRate.toFixed(0)}%</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Retorno Total</p>
                <p className={cn('font-mono font-semibold', currentPortfolio.statistics.totalReturn >= 0 ? 'text-accent' : 'text-destructive')}>
                  {formatCurrency(currentPortfolio.statistics.totalReturn)}
                </p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Max Drawdown</p>
                <p className="font-mono font-semibold text-destructive">{formatCurrency(currentPortfolio.statistics.maxDrawdown)}</p>
              </div>
            </div>
          </div>
        </Card>

        <Card className="p-6 bg-card/50 backdrop-blur-sm">
          <h3 className="font-heading font-semibold text-sm mb-4">PROPUESTA ACTUAL</h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Activo</span>
              <span className="font-mono font-semibold">{proposedAsset}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Acción</span>
              <Badge variant="outline" className={cn('text-sm', actionColors[proposedAction])}>
                {proposedAction}
              </Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Importe</span>
              <span className="font-mono font-semibold">{formatCurrency(proposedAmount)}</span>
            </div>
            <Separator />
            <div>
              <p className="text-xs text-muted-foreground mb-2">Exposición</p>
              <p className="font-mono text-sm">{((proposedAmount / currentPortfolio.balance) * 100).toFixed(1)}% del capital</p>
            </div>
          </div>
        </Card>

        <DataSourceStatusPanel dataSource={dataSource} />
      </div>

      <Card className="p-6 bg-card/50 backdrop-blur-sm">
        <h3 className="font-heading font-semibold text-lg mb-4">VOTOS DE AGENTES</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {agentVotes.map((vote) => {
            const agent = agents.find(a => a.id === vote.agentId);
            return (
              <div key={vote.agentId} className="p-4 bg-background/50 rounded-lg border border-border">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <div className={cn(
                      'w-2 h-2 rounded-full',
                      vote.voteOnProposal === 'APPROVE' ? 'bg-accent' :
                      vote.voteOnProposal === 'VETO' ? 'bg-destructive' : 'bg-warning'
                    )} />
                    <span className="font-mono text-sm font-semibold">{agent?.name}</span>
                  </div>
                  <span className="text-xs text-muted-foreground">{vote.confidence.toFixed(0)}%</span>
                </div>
                
                <div className="space-y-2 mb-3">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground">Recomienda:</span>
                    <Badge variant="outline" className={cn('text-xs', actionColors[vote.recommendedAction])}>
                      {vote.recommendedAction}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground">Voto:</span>
                    <Badge variant="outline" className={cn(
                      'text-xs',
                      vote.voteOnProposal === 'APPROVE' ? 'border-accent text-accent' :
                      vote.voteOnProposal === 'VETO' ? 'border-destructive text-destructive' :
                      'border-warning text-warning'
                    )}>
                      {vote.voteOnProposal}
                    </Badge>
                  </div>
                </div>
                
                <p className="text-xs text-muted-foreground leading-relaxed">{vote.reasoning}</p>
              </div>
            );
          })}
        </div>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ConsensusPanel distribution={consensus} />
        <Card className="p-6 bg-card/50 backdrop-blur-sm">
          <h3 className="font-heading font-semibold text-lg mb-4">ANÁLISIS HISTÓRICO</h3>
          <div className="space-y-4">
            <div className="grid grid-cols-3 gap-4">
              <div>
                <p className="text-xs text-muted-foreground mb-1">Similares</p>
                <p className="font-mono font-bold text-xl">{historicalAnalysis.totalSimilar}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground mb-1">Tasa Éxito</p>
                <p className={cn('font-mono font-bold text-xl', historicalAnalysis.successRate >= 60 ? 'text-accent' : 'text-warning')}>
                  {historicalAnalysis.successRate.toFixed(0)}%
                </p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground mb-1">Retorno Prom</p>
                <p className={cn('font-mono font-bold text-xl', historicalAnalysis.averageReturn >= 0 ? 'text-accent' : 'text-destructive')}>
                  {formatCurrency(historicalAnalysis.averageReturn)}
                </p>
              </div>
            </div>
            <Separator />
            <div>
              <p className="text-sm font-semibold text-muted-foreground mb-2">Lecciones Aprendidas</p>
              <div className="space-y-2">
                {historicalAnalysis.lessonsLearned.length > 0 ? (
                  historicalAnalysis.lessonsLearned.map((lesson, i) => (
                    <div key={i} className="flex items-start gap-2">
                      <Circle size={12} className="text-primary flex-shrink-0 mt-1" weight="fill" />
                      <p className="text-xs">{lesson}</p>
                    </div>
                  ))
                ) : (
                  <p className="text-xs text-muted-foreground">Sin datos históricos suficientes</p>
                )}
              </div>
            </div>
          </div>
        </Card>
      </div>

      <SurvivalAnalysisPanel analysis={survivalAnalysis} />

      <Card className="p-6 bg-card/50 backdrop-blur-sm">
        <h3 className="font-heading font-semibold text-lg mb-4">MÉTRICAS DE RIESGO EXTENDIDAS</h3>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          <div>
            <p className="text-xs text-muted-foreground mb-1">Tamaño Posición</p>
            <p className="font-mono font-semibold">{formatCurrency(riskMetrics.positionSize)}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground mb-1">Stop Loss</p>
            <p className="font-mono font-semibold text-destructive">{formatCurrency(riskMetrics.stopLoss)}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground mb-1">Take Profit</p>
            <p className="font-mono font-semibold text-accent">{formatCurrency(riskMetrics.takeProfit)}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground mb-1">Ratio R/R</p>
            <p className="font-mono font-semibold">{riskMetrics.riskRewardRatio.toFixed(2)}:1</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground mb-1">Pérdida Máx</p>
            <p className="font-mono font-semibold text-destructive">{formatCurrency(riskMetrics.maxPotentialLoss)}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground mb-1">Exposición Total</p>
            <p className="font-mono font-semibold">{riskMetrics.totalExposure.toFixed(1)}%</p>
          </div>
        </div>
      </Card>

      <DirectorDecisionPanel decision={directorDecision} />

      <Card className="p-6 bg-card/50 backdrop-blur-sm">
        <h3 className="font-heading font-semibold text-lg mb-4">EJECUCIÓN</h3>
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-sm">
              {survivalAnalysis.automaticVeto 
                ? 'Operación bloqueada por veto automático de supervivencia.'
                : directorDecision.finalAction === 'VETO'
                ? 'Operación vetada por el director.'
                : directorDecision.qualityScore < 50
                ? 'Calidad de decisión insuficiente para ejecución automática.'
                : 'Operación lista para ejecución.'}
            </p>
            <p className="text-xs text-muted-foreground">
              Consenso: {directorDecision.consensusScore.toFixed(0)}% | Calidad: {directorDecision.qualityScore.toFixed(0)}%
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm">
              Rechazar
            </Button>
            <Button 
              size="sm" 
              disabled={survivalAnalysis.automaticVeto || directorDecision.finalAction === 'VETO' || directorDecision.qualityScore < 50}
            >
              Ejecutar
            </Button>
          </div>
        </div>
      </Card>

      {currentEnvironment !== 'real' && strategyStatus.canPromote && (
        <Card className="p-6 bg-accent/10 border-accent/30">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-heading font-semibold text-lg mb-2">🎉 Estrategia Lista para Promoción</h3>
              <p className="text-sm text-muted-foreground">
                Has completado {strategyStatus.tradesCompleted} operaciones con {strategyStatus.successRate.toFixed(0)}% de éxito.
                Tu estrategia está certificada para el siguiente entorno.
              </p>
            </div>
            <Button variant="default">
              Promover a {currentEnvironment === 'sandbox' ? 'Demo' : 'Real'}
            </Button>
          </div>
        </Card>
      )}
    </div>
  );
}
