import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Progress } from '@/components/ui/progress';
import { 
  ShieldCheck,
  ChartLine,
  Warning,
  TrendUp,
  Database,
  Target,
  Scales
} from '@phosphor-icons/react';
import { cn } from '@/lib/utils';
import type { 
  DecisionSession, 
  SurvivalMetrics, 
  RiskMetrics, 
  ConflictAnalysis, 
  DecisionQualityScore,
  WeightedVote,
  MarketRegime,
  DetailedAgentRecommendation,
  ArchivistAgentRecommendation
} from '@/lib/types';
import { formatCurrency, formatPercent } from '@/lib/mockData';

const MARKET_REGIME_LABELS: Record<MarketRegime, string> = {
  'bull': 'Mercado Alcista',
  'bear': 'Mercado Bajista',
  'sideways': 'Mercado Lateral',
  'high-volatility': 'Alta Volatilidad',
  'low-volatility': 'Baja Volatilidad'
};

const MARKET_REGIME_COLORS: Record<MarketRegime, string> = {
  'bull': 'border-accent text-accent',
  'bear': 'border-destructive text-destructive',
  'sideways': 'border-yellow-400 text-yellow-400',
  'high-volatility': 'border-warning text-warning',
  'low-volatility': 'border-primary text-primary'
};

interface SurvivalMetricsPanelProps {
  metrics: SurvivalMetrics;
}

export function SurvivalMetricsPanel({ metrics }: SurvivalMetricsPanelProps) {
  const isProbabilityLow = metrics.survivalProbability < 70;
  
  return (
    <Card className={cn(
      "p-6 bg-card/50 backdrop-blur-sm border-2",
      isProbabilityLow ? "border-warning/50 bg-warning/5" : "border-border"
    )}>
      <div className="flex items-center gap-2 mb-4">
        <ShieldCheck size={20} className={cn(isProbabilityLow ? "text-warning" : "text-accent")} weight="duotone" />
        <h4 className="font-heading font-semibold text-sm uppercase tracking-wide">
          Impacto en Supervivencia
        </h4>
      </div>

      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="p-3 rounded-lg bg-background/50 border border-border/50">
            <p className="text-xs text-muted-foreground mb-1">Capital Actual</p>
            <p className="font-mono font-bold text-lg">{formatCurrency(metrics.currentCapital)}</p>
          </div>
          
          <div className="p-3 rounded-lg bg-background/50 border border-border/50">
            <p className="text-xs text-muted-foreground mb-1">Reserva Supervivencia</p>
            <p className="font-mono font-bold text-lg text-warning">{formatCurrency(metrics.survivalReserve)}</p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="p-3 rounded-lg bg-background/50 border border-border/50">
            <p className="text-xs text-muted-foreground mb-1">Drawdown Máximo</p>
            <p className="font-mono font-semibold text-base">{metrics.maxDrawdown.toFixed(1)}%</p>
          </div>
          
          <div className="p-3 rounded-lg bg-background/50 border border-border/50">
            <p className="text-xs text-muted-foreground mb-1">Límite Pérdida Diaria</p>
            <p className="font-mono font-semibold text-base">{metrics.dailyLossLimit.toFixed(1)}%</p>
          </div>
        </div>

        <Separator />

        <div>
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs text-muted-foreground uppercase tracking-wide">Riesgo Post-Trade</p>
            <p className="font-mono font-bold">{metrics.riskAfterTrade.toFixed(1)}%</p>
          </div>
          <Progress 
            value={Math.min(100, metrics.riskAfterTrade)} 
            className={cn("h-2", metrics.riskAfterTrade > 50 ? "bg-warning/20" : "bg-muted/20")}
          />
        </div>

        <div className={cn(
          "p-4 rounded-lg border-2",
          isProbabilityLow ? "bg-warning/10 border-warning" : "bg-accent/10 border-accent"
        )}>
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm font-semibold uppercase tracking-wide">Probabilidad de Supervivencia</p>
            {isProbabilityLow && <Warning size={20} className="text-warning animate-pulse" weight="fill" />}
          </div>
          <div className="flex items-center gap-3">
            <div className="flex-1">
              <Progress 
                value={metrics.survivalProbability} 
                className={cn("h-3", isProbabilityLow && "bg-warning/20")}
              />
            </div>
            <p className={cn(
              "font-mono font-bold text-2xl",
              isProbabilityLow ? "text-warning" : "text-accent"
            )}>
              {metrics.survivalProbability.toFixed(0)}%
            </p>
          </div>
          
          {isProbabilityLow && (
            <div className="mt-3 p-3 rounded-md bg-warning/20 border border-warning/50">
              <p className="text-xs text-foreground/90 font-semibold">
                ⚠️ ALERTA: Probabilidad por debajo del umbral mínimo (70%). Ejecución bloqueada automáticamente.
              </p>
            </div>
          )}
        </div>
      </div>
    </Card>
  );
}

interface RiskTransparencyPanelProps {
  metrics: RiskMetrics;
}

export function RiskTransparencyPanel({ metrics }: RiskTransparencyPanelProps) {
  return (
    <Card className="p-6 bg-card/50 backdrop-blur-sm">
      <div className="flex items-center gap-2 mb-4">
        <ChartLine size={20} className="text-yellow-400" weight="duotone" />
        <h4 className="font-heading font-semibold text-sm uppercase tracking-wide">
          Transparencia de Riesgo
        </h4>
      </div>

      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="p-3 rounded-lg bg-background/50 border border-border/50">
            <p className="text-xs text-muted-foreground mb-1">Tamaño Posición</p>
            <p className="font-mono font-bold text-lg">{formatCurrency(metrics.positionSize)}</p>
          </div>
          
          <div className="p-3 rounded-lg bg-background/50 border border-border/50">
            <p className="text-xs text-muted-foreground mb-1">Pérdida Máxima</p>
            <p className="font-mono font-bold text-lg text-destructive">{formatCurrency(metrics.maxPotentialLoss)}</p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="p-3 rounded-lg bg-background/50 border border-border/50">
            <p className="text-xs text-muted-foreground mb-1">Stop Loss</p>
            <p className="font-mono font-semibold text-base">{formatCurrency(metrics.stopLoss)}</p>
          </div>
          
          <div className="p-3 rounded-lg bg-background/50 border border-border/50">
            <p className="text-xs text-muted-foreground mb-1">Take Profit</p>
            <p className="font-mono font-semibold text-base text-accent">{formatCurrency(metrics.takeProfit)}</p>
          </div>
        </div>

        <div className="p-4 rounded-lg bg-primary/10 border-2 border-primary/30">
          <p className="text-xs text-muted-foreground mb-2">Ratio Riesgo/Recompensa</p>
          <div className="flex items-center gap-2">
            <Scales size={24} className="text-primary" weight="duotone" />
            <p className="font-mono font-bold text-3xl text-primary">1:{metrics.riskRewardRatio.toFixed(2)}</p>
          </div>
        </div>
      </div>
    </Card>
  );
}

interface ConflictAnalysisPanelProps {
  analysis: ConflictAnalysis;
  recommendations: DetailedAgentRecommendation[];
}

export function ConflictAnalysisPanel({ analysis, recommendations }: ConflictAnalysisPanelProps) {
  return (
    <Card className="p-6 bg-card/50 backdrop-blur-sm">
      <div className="flex items-center gap-2 mb-4">
        <Target size={20} className="text-destructive" weight="duotone" />
        <h4 className="font-heading font-semibold text-sm uppercase tracking-wide">
          Análisis de Conflictos
        </h4>
      </div>

      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="p-3 rounded-lg bg-accent/10 border border-accent/30">
            <p className="text-xs text-muted-foreground mb-2">Agentes en Acuerdo</p>
            <p className="font-mono font-bold text-2xl text-accent mb-2">{analysis.agreeing.length}</p>
            <div className="flex flex-wrap gap-1">
              {analysis.agreeing.map(agentId => {
                const agent = recommendations.find(r => r.agentId === agentId);
                return agent ? (
                  <Badge key={agentId} variant="outline" className="text-xs border-accent/50 text-accent">
                    {agent.agentName}
                  </Badge>
                ) : null;
              })}
            </div>
          </div>
          
          <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/30">
            <p className="text-xs text-muted-foreground mb-2">Agentes en Desacuerdo</p>
            <p className="font-mono font-bold text-2xl text-destructive mb-2">{analysis.disagreeing.length}</p>
            <div className="flex flex-wrap gap-1">
              {analysis.disagreeing.map(agentId => {
                const agent = recommendations.find(r => r.agentId === agentId);
                return agent ? (
                  <Badge key={agentId} variant="outline" className="text-xs border-destructive/50 text-destructive">
                    {agent.agentName}
                  </Badge>
                ) : null;
              })}
            </div>
          </div>
        </div>

        {analysis.conflicts.length > 0 && (
          <>
            <Separator />
            <div>
              <p className="text-sm font-semibold mb-3">Conflictos Detectados</p>
              <div className="space-y-2">
                {analysis.conflicts.map((conflict, index) => {
                  const agent1 = recommendations.find(r => r.agentId === conflict.agents[0]);
                  const agent2 = recommendations.find(r => r.agentId === conflict.agents[1]);
                  
                  return (
                    <div key={index} className="p-3 rounded-lg bg-warning/10 border border-warning/30">
                      <div className="flex items-center gap-2 mb-2">
                        <Badge variant="outline" className="text-xs border-yellow-400 text-yellow-400">
                          {agent1?.agentName}: <span className="font-bold ml-1">{agent1?.decisionAction}</span>
                        </Badge>
                        <span className="text-xs text-muted-foreground">vs</span>
                        <Badge variant="outline" className="text-xs border-yellow-400 text-yellow-400">
                          {agent2?.agentName}: <span className="font-bold ml-1">{agent2?.decisionAction}</span>
                        </Badge>
                      </div>
                      <p className="text-xs text-foreground/80">{conflict.reason}</p>
                    </div>
                  );
                })}
              </div>
            </div>
          </>
        )}
      </div>
    </Card>
  );
}

interface WeightedVotesPanelProps {
  votes: WeightedVote[];
  recommendations: DetailedAgentRecommendation[];
}

export function WeightedVotesPanel({ votes, recommendations }: WeightedVotesPanelProps) {
  const totalWeightedScore = votes.reduce((sum, v) => sum + v.weightedScore, 0);
  const finalConsensus = (totalWeightedScore / votes.length) * 100;
  
  return (
    <Card className="p-6 bg-card/50 backdrop-blur-sm">
      <div className="flex items-center gap-2 mb-4">
        <Scales size={20} className="text-primary" weight="duotone" />
        <h4 className="font-heading font-semibold text-sm uppercase tracking-wide">
          Sistema de Votación Ponderada
        </h4>
      </div>

      <div className="space-y-4">
        <div className="p-4 rounded-lg bg-primary/10 border-2 border-primary/30">
          <p className="text-xs text-muted-foreground mb-1">Consenso Ponderado Final</p>
          <div className="flex items-center gap-3">
            <div className="flex-1">
              <Progress value={finalConsensus} className="h-3" />
            </div>
            <p className="font-mono font-bold text-3xl text-primary">{finalConsensus.toFixed(0)}%</p>
          </div>
          <p className="text-xs text-muted-foreground mt-2">
            Fórmula: Reputación × Confianza × Peso del Rol
          </p>
        </div>

        <div className="space-y-2">
          {votes.map(vote => {
            const agent = recommendations.find(r => r.agentId === vote.agentId);
            if (!agent) return null;
            
            return (
              <div key={vote.agentId} className="p-3 rounded-lg bg-background/50 border border-border/50">
                <div className="flex items-center justify-between mb-2">
                  <p className="font-medium text-sm">{agent.agentName}</p>
                  <Badge 
                    variant={vote.rawVote === 'approve' ? 'default' : vote.rawVote === 'veto' ? 'destructive' : 'outline'}
                    className="text-xs"
                  >
                    {vote.rawVote === 'approve' ? '✓' : vote.rawVote === 'reject' ? '✗' : vote.rawVote === 'veto' ? '⛔' : '○'} {agent.decisionAction}
                  </Badge>
                </div>
                
                <div className="grid grid-cols-4 gap-2 text-xs">
                  <div>
                    <p className="text-muted-foreground">Voto</p>
                    <p className="font-mono font-semibold">{vote.rawConfidence.toFixed(0)}%</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Rep.</p>
                    <p className="font-mono font-semibold">{vote.reputation.toFixed(0)}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Peso</p>
                    <p className="font-mono font-semibold">{(vote.weight * 100).toFixed(0)}%</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Ponderado</p>
                    <p className="font-mono font-semibold text-primary">{(vote.weightedScore * 100).toFixed(0)}</p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </Card>
  );
}

interface DecisionQualityPanelProps {
  quality: DecisionQualityScore;
}

export function DecisionQualityPanel({ quality }: DecisionQualityPanelProps) {
  return (
    <Card className={cn(
      "p-6 bg-card/50 backdrop-blur-sm border-2",
      quality.quality === 'high' ? "border-accent/50 bg-accent/5" :
      quality.quality === 'medium' ? "border-yellow-400/50 bg-yellow-400/5" :
      "border-destructive/50 bg-destructive/5"
    )}>
      <div className="flex items-center gap-2 mb-4">
        <TrendUp size={20} className={cn(
          quality.quality === 'high' ? "text-accent" :
          quality.quality === 'medium' ? "text-yellow-400" :
          "text-destructive"
        )} weight="duotone" />
        <h4 className="font-heading font-semibold text-sm uppercase tracking-wide">
          Puntuación de Calidad
        </h4>
      </div>

      <div className="space-y-4">
        <div className="text-center p-6 rounded-lg bg-background/50 border border-border/50">
          <p className="text-xs text-muted-foreground uppercase tracking-wide mb-2">Score Global</p>
          <p className={cn(
            "font-mono font-bold text-6xl mb-2",
            quality.quality === 'high' ? "text-accent" :
            quality.quality === 'medium' ? "text-yellow-400" :
            "text-destructive"
          )}>
            {quality.score.toFixed(0)}
          </p>
          <Badge 
            variant={quality.quality === 'high' ? 'default' : quality.quality === 'medium' ? 'outline' : 'destructive'}
            className={cn(
              "text-sm px-4 py-1",
              quality.quality === 'medium' && "border-yellow-400 text-yellow-400"
            )}
          >
            {quality.quality === 'high' ? 'CALIDAD ALTA' :
             quality.quality === 'medium' ? 'CALIDAD MEDIA' :
             'CALIDAD BAJA'}
          </Badge>
        </div>

        <Separator />

        <div className="space-y-3">
          <div>
            <div className="flex items-center justify-between mb-1">
              <p className="text-xs text-muted-foreground">Acuerdo de Agentes</p>
              <p className="font-mono text-sm font-semibold">{quality.agentAgreement.toFixed(0)}%</p>
            </div>
            <Progress value={quality.agentAgreement} className="h-2" />
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <p className="text-xs text-muted-foreground">Confianza Histórica</p>
              <p className="font-mono text-sm font-semibold">{quality.historicalConfidence.toFixed(0)}%</p>
            </div>
            <Progress value={quality.historicalConfidence} className="h-2" />
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <p className="text-xs text-muted-foreground">Condiciones de Mercado</p>
              <p className="font-mono text-sm font-semibold">{quality.marketConditions.toFixed(0)}%</p>
            </div>
            <Progress value={quality.marketConditions} className="h-2" />
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <p className="text-xs text-muted-foreground">Seguridad de Supervivencia</p>
              <p className="font-mono text-sm font-semibold">{quality.survivalSafety.toFixed(0)}%</p>
            </div>
            <Progress value={quality.survivalSafety} className="h-2" />
          </div>
        </div>
      </div>
    </Card>
  );
}

interface MarketContextPanelProps {
  regime: MarketRegime;
}

export function MarketContextPanel({ regime }: MarketContextPanelProps) {
  return (
    <Card className="p-6 bg-card/50 backdrop-blur-sm">
      <div className="flex items-center gap-2 mb-4">
        <ChartLine size={20} className="text-foreground" weight="duotone" />
        <h4 className="font-heading font-semibold text-sm uppercase tracking-wide">
          Contexto de Mercado
        </h4>
      </div>

      <div className="p-6 rounded-lg bg-background/50 border-2 border-border/50 text-center">
        <p className="text-xs text-muted-foreground uppercase tracking-wide mb-3">Régimen Actual</p>
        <Badge 
          variant="outline" 
          className={cn("text-lg px-6 py-2 font-semibold", MARKET_REGIME_COLORS[regime])}
        >
          {MARKET_REGIME_LABELS[regime]}
        </Badge>
      </div>
    </Card>
  );
}

interface ArchivistIntelligencePanelProps {
  recommendation: ArchivistAgentRecommendation;
}

export function ArchivistIntelligencePanel({ recommendation }: ArchivistIntelligencePanelProps) {
  const avgReturn = recommendation.historicalSuccessRate > 60 ? 8.5 + Math.random() * 6 : -(2 + Math.random() * 4);
  const avgLoss = -(3 + Math.random() * 5);
  
  return (
    <Card className="p-6 bg-card/50 backdrop-blur-sm">
      <div className="flex items-center gap-2 mb-4">
        <Database size={20} className="text-purple-400" weight="duotone" />
        <h4 className="font-heading font-semibold text-sm uppercase tracking-wide">
          Inteligencia del Archivista
        </h4>
      </div>

      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="p-3 rounded-lg bg-purple-500/10 border border-purple-400/30">
            <p className="text-xs text-muted-foreground mb-1">Ops. Similares</p>
            <div className="flex items-center gap-2">
              <Database size={20} className="text-purple-400" />
              <p className="font-mono font-bold text-2xl">{recommendation.similarOperations}</p>
            </div>
          </div>
          
          <div className="p-3 rounded-lg bg-purple-500/10 border border-purple-400/30">
            <p className="text-xs text-muted-foreground mb-1">Tasa de Éxito</p>
            <p className={cn(
              "font-mono font-bold text-2xl",
              recommendation.historicalSuccessRate >= 60 ? "text-accent" :
              recommendation.historicalSuccessRate >= 40 ? "text-yellow-400" :
              "text-destructive"
            )}>
              {recommendation.historicalSuccessRate.toFixed(0)}%
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="p-3 rounded-lg bg-background/50 border border-border/50">
            <p className="text-xs text-muted-foreground mb-1">Retorno Promedio</p>
            <p className={cn(
              "font-mono font-semibold text-lg",
              avgReturn >= 0 ? "text-accent" : "text-destructive"
            )}>
              {formatPercent(avgReturn)}
            </p>
          </div>
          
          <div className="p-3 rounded-lg bg-background/50 border border-border/50">
            <p className="text-xs text-muted-foreground mb-1">Pérdida Promedio</p>
            <p className="font-mono font-semibold text-lg text-destructive">
              {formatPercent(avgLoss)}
            </p>
          </div>
        </div>

        <div className="p-4 rounded-lg bg-purple-500/5 border border-purple-400/20">
          <p className="text-xs text-muted-foreground uppercase tracking-wide mb-2">Evidencia Histórica</p>
          <p className="text-sm text-foreground/90 leading-relaxed">
            {recommendation.historicalSuccessRate > 60 
              ? `Patrón favorable detectado. ${recommendation.similarOperations} operaciones anteriores muestran alta probabilidad de éxito en condiciones similares.`
              : `Patrón de riesgo identificado. Operaciones históricas similares muestran resultados mixtos. Se recomienda precaución.`
            }
          </p>
        </div>
      </div>
    </Card>
  );
}

export function ExecutionRulesPanel({ session }: { session: DecisionSession }) {
  const { finalDecision } = session;
  const canExecute = finalDecision && !finalDecision.executionBlocked;
  
  if (!finalDecision) return null;
  
  return (
    <Card className={cn(
      "p-6 border-2",
      finalDecision.executionBlocked ? "bg-destructive/5 border-destructive/50" : "bg-accent/5 border-accent/50"
    )}>
      <div className="flex items-center gap-2 mb-4">
        <ShieldCheck size={20} className={canExecute ? "text-accent" : "text-destructive"} weight="duotone" />
        <h4 className="font-heading font-semibold text-sm uppercase tracking-wide">
          Reglas de Ejecución
        </h4>
      </div>

      <div className="space-y-3">
        <div className="flex items-center justify-between p-3 rounded-lg bg-background/50 border border-border/50">
          <span className="text-sm">Veto de Supervivencia</span>
          <Badge variant={session.recommendations.some(r => r.recommendation === 'veto') ? 'destructive' : 'default'}>
            {session.recommendations.some(r => r.recommendation === 'veto') ? '✗ Activo' : '✓ OK'}
          </Badge>
        </div>

        <div className="flex items-center justify-between p-3 rounded-lg bg-background/50 border border-border/50">
          <span className="text-sm">Límite de Pérdida Diaria</span>
          <Badge variant={session.survivalMetrics && session.survivalMetrics.maxDrawdown > session.survivalMetrics.dailyLossLimit ? 'destructive' : 'default'}>
            {session.survivalMetrics && session.survivalMetrics.maxDrawdown > session.survivalMetrics.dailyLossLimit ? '✗ Excedido' : '✓ OK'}
          </Badge>
        </div>

        <div className="flex items-center justify-between p-3 rounded-lg bg-background/50 border border-border/50">
          <span className="text-sm">Consenso Mínimo (50%)</span>
          <Badge variant={session.consensusLevel < 50 ? 'destructive' : 'default'}>
            {session.consensusLevel < 50 ? `✗ ${session.consensusLevel.toFixed(0)}%` : `✓ ${session.consensusLevel.toFixed(0)}%`}
          </Badge>
        </div>

        <div className="flex items-center justify-between p-3 rounded-lg bg-background/50 border border-border/50">
          <span className="text-sm">Confianza Mínima (40%)</span>
          <Badge variant={!session.recommendations.find(r => r.agentId === 'director') || session.recommendations.find(r => r.agentId === 'director')!.confidence < 40 ? 'destructive' : 'default'}>
            {!session.recommendations.find(r => r.agentId === 'director') 
              ? '✗ N/A' 
              : session.recommendations.find(r => r.agentId === 'director')!.confidence < 40 
                ? `✗ ${session.recommendations.find(r => r.agentId === 'director')!.confidence.toFixed(0)}%`
                : `✓ ${session.recommendations.find(r => r.agentId === 'director')!.confidence.toFixed(0)}%`
            }
          </Badge>
        </div>

        {finalDecision.executionBlocked && finalDecision.blockReason && (
          <div className="p-4 rounded-lg bg-destructive/10 border-2 border-destructive/50 mt-4">
            <div className="flex items-center gap-2 mb-2">
              <Warning size={18} className="text-destructive" weight="fill" />
              <p className="font-semibold text-sm text-destructive">EJECUCIÓN BLOQUEADA</p>
            </div>
            <p className="text-xs text-foreground/90">{finalDecision.blockReason}</p>
          </div>
        )}
      </div>
    </Card>
  );
}
