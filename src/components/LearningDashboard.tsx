import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { Trophy, TrendUp, TrendDown, Target, ShieldCheck, Brain, Sparkle } from '@phosphor-icons/react';
import { cn } from '@/lib/utils';
import type { LearningEngineState, AgentPerformanceStats } from '@/lib/types';
import { getAgentRanking } from '@/lib/services/learningEngine';

interface LearningDashboardProps {
  learningState: LearningEngineState;
}

export function LearningDashboard({ learningState }: LearningDashboardProps) {
  const { globalStats, agentPerformance, completedTrades } = learningState;
  const ranking = getAgentRanking(learningState);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-3 mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-primary to-accent rounded-lg flex items-center justify-center">
            <Brain size={24} weight="bold" className="text-primary-foreground" />
          </div>
          <div>
            <h2 className="font-heading font-bold text-2xl">LEARNING & PERFORMANCE</h2>
            <p className="text-sm text-muted-foreground">
              Sistema de aprendizaje automático y métricas de rendimiento
            </p>
          </div>
        </div>
        <Badge
          variant="outline"
          className={cn(
            "flex items-center gap-1.5 px-3 py-1.5 text-sm font-mono",
            completedTrades.length > 0 ? "border-primary text-primary" : "border-muted-foreground text-muted-foreground"
          )}
        >
          <Sparkle size={14} weight="fill" />
          {completedTrades.length} trades aprendidos
        </Badge>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
        <Card className="p-4 bg-card/50 backdrop-blur-sm">
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs text-muted-foreground uppercase tracking-wide">Win Rate Global</p>
            <Target size={16} className="text-accent" />
          </div>
          <p className="font-mono font-bold text-2xl text-foreground">
            {globalStats.winRate.toFixed(1)}%
          </p>
          <div className="flex items-center gap-1 mt-1 text-sm">
            <span className="text-accent">{globalStats.winningTrades}W</span>
            <span className="text-muted-foreground">/</span>
            <span className="text-destructive">{globalStats.losingTrades}L</span>
          </div>
        </Card>

        <Card className="p-4 bg-card/50 backdrop-blur-sm">
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs text-muted-foreground uppercase tracking-wide">ROI Total</p>
            {globalStats.totalPnlPercent >= 0 ? (
              <TrendUp size={16} className="text-accent" />
            ) : (
              <TrendDown size={16} className="text-destructive" />
            )}
          </div>
          <p className={cn(
            "font-mono font-bold text-2xl",
            globalStats.totalPnlPercent >= 0 ? "text-accent" : "text-destructive"
          )}>
            {globalStats.totalPnlPercent >= 0 ? '+' : ''}{globalStats.totalPnlPercent.toFixed(2)}%
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            ${globalStats.totalPnl.toLocaleString()}
          </p>
        </Card>

        <Card className="p-4 bg-card/50 backdrop-blur-sm">
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs text-muted-foreground uppercase tracking-wide">Profit Factor</p>
            <ShieldCheck size={16} className="text-primary" />
          </div>
          <p className="font-mono font-bold text-2xl text-primary">
            {globalStats.profitFactor.toFixed(2)}
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            {globalStats.profitFactor >= 2 ? 'Excelente' : globalStats.profitFactor >= 1.5 ? 'Bueno' : 'Mejorable'}
          </p>
        </Card>

        <Card className="p-4 bg-card/50 backdrop-blur-sm">
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs text-muted-foreground uppercase tracking-wide">Sharpe Ratio</p>
            <Trophy size={16} className="text-yellow-500" />
          </div>
          <p className="font-mono font-bold text-2xl text-yellow-500">
            {globalStats.sharpeRatio.toFixed(2)}
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            {globalStats.sharpeRatio >= 2 ? 'Elite' : globalStats.sharpeRatio >= 1 ? 'Sólido' : 'En desarrollo'}
          </p>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="p-6 bg-card/50 backdrop-blur-sm">
          <h3 className="font-heading font-semibold text-lg mb-4">ESTADÍSTICAS DETALLADAS</h3>
          
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Trades Totales</span>
              <span className="font-mono font-semibold">{globalStats.totalTrades}</span>
            </div>

            <Separator />

            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Ganancia Promedio</span>
              <span className="font-mono font-semibold text-accent">
                ${globalStats.avgWin.toLocaleString()}
              </span>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Pérdida Promedio</span>
              <span className="font-mono font-semibold text-destructive">
                ${globalStats.avgLoss.toLocaleString()}
              </span>
            </div>

            <Separator />

            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Mejor Trade</span>
              <span className="font-mono font-semibold text-accent">
                +{globalStats.bestTrade.toFixed(2)}%
              </span>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Peor Trade</span>
              <span className="font-mono font-semibold text-destructive">
                {globalStats.worstTrade.toFixed(2)}%
              </span>
            </div>

            <Separator />

            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Drawdown Máximo</span>
              <span className="font-mono font-semibold text-warning">
                {globalStats.maxDrawdownPercent.toFixed(2)}%
              </span>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Rachas Ganadoras</span>
              <span className="font-mono font-semibold text-accent">
                {globalStats.consecutiveWins}
              </span>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Rachas Perdedoras</span>
              <span className="font-mono font-semibold text-destructive">
                {globalStats.consecutiveLosses}
              </span>
            </div>
          </div>
        </Card>

        <Card className="p-6 bg-card/50 backdrop-blur-sm">
          <h3 className="font-heading font-semibold text-lg mb-4">RANKING DE AGENTES</h3>
          
          <div className="space-y-3">
            {ranking.slice(0, 9).map((agent, index) => (
              <div key={agent.agentId} className="space-y-2">
                <div className="flex items-center gap-3">
                  <div className={cn(
                    "w-8 h-8 rounded-full flex items-center justify-center font-mono font-bold text-sm",
                    index === 0 ? "bg-yellow-500/20 text-yellow-500" :
                    index === 1 ? "bg-gray-400/20 text-gray-400" :
                    index === 2 ? "bg-orange-500/20 text-orange-500" :
                    "bg-muted text-muted-foreground"
                  )}>
                    #{index + 1}
                  </div>
                  
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-medium text-sm">{agent.agentName}</span>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="text-xs">
                          {agent.accuracy.toFixed(0)}% precisión
                        </Badge>
                        <span className="font-mono text-sm font-semibold">
                          Rep: {Math.round(agent.reputation)}
                        </span>
                      </div>
                    </div>
                    <Progress value={agent.reputation} className="h-1.5" />
                  </div>
                </div>

                {agent.totalVotes > 0 && (
                  <div className="ml-11 text-xs text-muted-foreground flex items-center gap-3">
                    <span>{agent.correctVotes}W / {agent.incorrectVotes}L</span>
                    <span>·</span>
                    <span>Influencia PnL: {agent.totalPnlInfluence >= 0 ? '+' : ''}{agent.totalPnlInfluence.toFixed(1)}%</span>
                  </div>
                )}

                {index < ranking.slice(0, 9).length - 1 && <Separator />}
              </div>
            ))}
          </div>
        </Card>
      </div>

      <Card className="p-6 bg-card/50 backdrop-blur-sm">
        <h3 className="font-heading font-semibold text-lg mb-4">PERFORMANCE DETALLADO POR AGENTE</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {ranking.map((agent) => (
            <Card key={agent.agentId} className="p-4 bg-background/50">
              <div className="flex items-center justify-between mb-3">
                <h4 className="font-semibold">{agent.agentName}</h4>
                <Badge 
                  variant="outline" 
                  className={cn(
                    agent.reputation >= 80 ? "border-accent text-accent" :
                    agent.reputation >= 60 ? "border-primary text-primary" :
                    agent.reputation >= 40 ? "border-yellow-400 text-yellow-400" :
                    "border-destructive text-destructive"
                  )}
                >
                  {agent.reputation}
                </Badge>
              </div>

              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Precisión</span>
                  <span className="font-mono font-semibold">{agent.accuracy.toFixed(1)}%</span>
                </div>

                <div className="flex justify-between">
                  <span className="text-muted-foreground">Votos Totales</span>
                  <span className="font-mono">{agent.totalVotes}</span>
                </div>

                <div className="flex justify-between">
                  <span className="text-muted-foreground">Correctos</span>
                  <span className="font-mono text-accent">{agent.correctVotes}</span>
                </div>

                <div className="flex justify-between">
                  <span className="text-muted-foreground">Incorrectos</span>
                  <span className="font-mono text-destructive">{agent.incorrectVotes}</span>
                </div>

                <Separator />

                <div className="flex justify-between">
                  <span className="text-muted-foreground">PnL cuando acierta</span>
                  <span className="font-mono text-xs text-accent">
                    +{agent.avgPnlWhenCorrect.toFixed(2)}%
                  </span>
                </div>

                <div className="flex justify-between">
                  <span className="text-muted-foreground">PnL cuando falla</span>
                  <span className="font-mono text-xs text-destructive">
                    {agent.avgPnlWhenWrong.toFixed(2)}%
                  </span>
                </div>

                <Separator />

                <div className="flex justify-between">
                  <span className="text-muted-foreground">Consistencia</span>
                  <span className="font-mono text-xs">{agent.consistency.toFixed(0)}%</span>
                </div>

                <div className="flex justify-between">
                  <span className="text-muted-foreground">Drawdown Causado</span>
                  <span className="font-mono text-xs text-warning">
                    {agent.drawdownCaused.toFixed(2)}%
                  </span>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </Card>

      {completedTrades.length > 0 && (
        <Card className="p-6 bg-card/50 backdrop-blur-sm">
          <h3 className="font-heading font-semibold text-lg mb-4">HISTORIAL DE APRENDIZAJE</h3>
          <div className="space-y-2">
            {completedTrades.slice(0, 20).map((trade) => (
              <div
                key={trade.id}
                className="flex items-center justify-between p-3 rounded-lg bg-background/50 border border-border/50"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <Badge
                    variant="outline"
                    className={cn(
                      "text-xs shrink-0",
                      trade.outcome === 'win' ? 'border-accent text-accent' :
                      trade.outcome === 'loss' ? 'border-destructive text-destructive' :
                      'border-muted-foreground text-muted-foreground'
                    )}
                  >
                    {trade.outcome === 'win' ? '✅ WIN' : trade.outcome === 'loss' ? '❌ LOSS' : '➡️ NEUTRAL'}
                  </Badge>
                  <span className="font-mono text-sm truncate">{trade.symbol}</span>
                  <Badge variant="outline" className="text-xs shrink-0">{trade.action}</Badge>
                </div>
                <div className="flex items-center gap-4 shrink-0">
                  <span className={cn(
                    "font-mono text-sm font-semibold",
                    trade.pnlPercent >= 0 ? 'text-accent' : 'text-destructive'
                  )}>
                    {trade.pnlPercent >= 0 ? '+' : ''}{trade.pnlPercent.toFixed(2)}%
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {new Date(trade.exitTimestamp).toLocaleDateString('es-ES')}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}
