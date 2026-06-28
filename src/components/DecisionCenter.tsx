import { useState, useEffect, type ComponentType } from 'react';
import { useKV } from '@github/spark/hooks';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Brain, 
  TrendUp, 
  ShieldCheck, 
  Clock, 
  Database,
  Coins,
  User,
  CheckCircle,
  XCircle,
  Warning,
  ChartLine
} from '@phosphor-icons/react';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import type { Agent, SystemConfig, DecisionSession, DetailedAgentRecommendation, ArchivistAgentRecommendation } from '@/lib/types';
import { 
  generateDecisionSession, 
  generateMockDecisionSessions,
  formatCurrency,
  formatPercent,
  DEFAULT_CONFIG,
} from '@/lib/mockData';
import { DecisionFlowVisualizer } from '@/components/DecisionFlowVisualizer';
import {
  SurvivalMetricsPanel,
  RiskTransparencyPanel,
  ConflictAnalysisPanel,
  WeightedVotesPanel,
  DecisionQualityPanel,
  MarketContextPanel,
  ArchivistIntelligencePanel,
  ExecutionRulesPanel
} from '@/components/DecisionPanels';

const AGENT_ICONS: Record<string, ComponentType<any>> = {
  news: Brain,
  technical: ChartLine,
  risk: TrendUp,
  survival: ShieldCheck,
  archivist: Database,
  investor: Coins,
  director: User
};

const AGENT_COLORS: Record<string, string> = {
  news: 'text-blue-400 border-blue-400',
  technical: 'text-cyan-400 border-cyan-400',
  risk: 'text-yellow-400 border-yellow-400',
  survival: 'text-warning border-warning',
  archivist: 'text-purple-400 border-purple-400',
  investor: 'text-primary border-primary',
  director: 'text-accent border-accent'
};

interface DecisionCenterProps {
  agents: Agent[];
  config: SystemConfig;
  currentCapital: number;
}

export function DecisionCenter({ agents, config, currentCapital }: DecisionCenterProps) {
  const [sessions, setSessions] = useKV<DecisionSession[]>('decision-sessions', []);
  const [activeSession, setActiveSession] = useState<DecisionSession | null>(null);
  const [selectedSession, setSelectedSession] = useState<DecisionSession | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);

  useEffect(() => {
    if (!sessions || sessions.length === 0) {
      const mockSessions = generateMockDecisionSessions(agents, config, currentCapital, 5);
      setSessions(mockSessions);
    }
  }, []);

  const handleGenerateSession = () => {
    setIsGenerating(true);
    
    setTimeout(() => {
      const newSession = generateDecisionSession(agents, config, currentCapital, 'active');
      setActiveSession(newSession);
      setIsGenerating(false);
    }, 500);
  };

  const handleApproveSession = () => {
    if (!activeSession) return;
    
    const completedSession: DecisionSession = {
      ...activeSession,
      status: activeSession.recommendations.some(r => r.recommendation === 'veto') ? 'vetoed' : 'completed',
      finalDecision: {
        approved: !activeSession.recommendations.some(r => r.recommendation === 'veto'),
        reason: activeSession.recommendations.find(r => r.agentId === 'director')?.reasoning || '',
        timestamp: new Date().toISOString()
      }
    };
    
    setSessions((prev) => prev ? [completedSession, ...prev] : [completedSession]);
    setActiveSession(null);
  };

  const handleRejectSession = () => {
    if (!activeSession) return;
    
    const rejectedSession: DecisionSession = {
      ...activeSession,
      status: 'completed',
      finalDecision: {
        approved: false,
        reason: 'Rechazado manualmente por el Director.',
        timestamp: new Date().toISOString()
      }
    };
    
    setSessions((prev) => prev ? [rejectedSession, ...prev] : [rejectedSession]);
    setActiveSession(null);
  };

  const sessionToDisplay = selectedSession || activeSession;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-heading font-bold text-3xl text-foreground text-glow">
            DECISION CENTER
          </h2>
          <p className="text-sm text-muted-foreground uppercase tracking-widest mt-1">
            Sistema de Consenso Multi-Agente
          </p>
        </div>
        
        <Button 
          onClick={handleGenerateSession}
          disabled={isGenerating || !!activeSession}
          className="gap-2"
        >
          <Brain size={20} />
          {isGenerating ? 'Generando...' : 'Nueva Propuesta'}
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2 p-6 bg-card/50 backdrop-blur-sm">
          {!sessionToDisplay ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <Brain size={64} className="text-muted-foreground mb-4 opacity-50" />
              <h3 className="font-heading font-semibold text-xl mb-2">
                No hay sesión activa
              </h3>
              <p className="text-sm text-muted-foreground mb-6 max-w-md">
                Genera una nueva propuesta de inversión para iniciar el proceso de decisión del comité de agentes.
              </p>
              <Button onClick={handleGenerateSession} disabled={isGenerating}>
                Iniciar Nueva Sesión
              </Button>
            </div>
          ) : (
            <div className="space-y-6">
              <div className="flex items-start justify-between">
                <div>
                  <Badge 
                    variant="outline" 
                    className={cn(
                      "mb-3 animate-pulse-subtle",
                      sessionToDisplay.status === 'active' ? 'border-primary text-primary' :
                      sessionToDisplay.status === 'completed' ? 'border-accent text-accent' :
                      'border-warning text-warning'
                    )}
                  >
                    {sessionToDisplay.status === 'active' ? 'EN PROCESO' :
                     sessionToDisplay.status === 'completed' ? 'COMPLETADA' : 'VETADA'}
                  </Badge>
                  <h3 className="font-heading font-bold text-2xl mb-1">
                    {sessionToDisplay.proposal.action} {sessionToDisplay.proposal.asset}
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    {formatCurrency(sessionToDisplay.proposal.amount)} · {new Date(sessionToDisplay.timestamp).toLocaleString('es-ES')}
                  </p>
                </div>
                
                <div className="text-right">
                  <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">Consenso Global</p>
                  <div className="flex items-center gap-3">
                    <p className="font-mono font-bold text-3xl">{Math.round(sessionToDisplay.consensusLevel)}%</p>
                    <div className="flex flex-col items-end gap-1">
                      <Badge 
                        variant="outline" 
                        className={cn(
                          "text-xs",
                          sessionToDisplay.consensusLevel >= 70 ? 'border-accent text-accent' :
                          sessionToDisplay.consensusLevel >= 50 ? 'border-yellow-400 text-yellow-400' :
                          'border-destructive text-destructive'
                        )}
                      >
                        {sessionToDisplay.consensusLevel >= 70 ? 'ALTO' :
                         sessionToDisplay.consensusLevel >= 50 ? 'MEDIO' : 'BAJO'}
                      </Badge>
                      <span className="text-xs text-muted-foreground">
                        {sessionToDisplay.duration.toFixed(1)}s
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              <Separator />

              <DecisionFlowVisualizer recommendations={sessionToDisplay.recommendations} />

              <Separator />

              <Tabs defaultValue="chain" className="mt-6">
                <TabsList className="bg-background/50 border border-border">
                  <TabsTrigger value="chain">Cadena de Decisión</TabsTrigger>
                  <TabsTrigger value="analysis">Análisis Avanzado</TabsTrigger>
                  <TabsTrigger value="metrics">Métricas</TabsTrigger>
                </TabsList>

                <TabsContent value="chain" className="mt-6">
                  <ScrollArea className="h-[500px] pr-4">
                    <div className="space-y-4">
                      <AnimatePresence>
                        {sessionToDisplay.recommendations.map((rec, index) => (
                          <AgentRecommendationCard 
                            key={`${rec.agentId}-${index}`} 
                            recommendation={rec}
                            index={index}
                          />
                        ))}
                      </AnimatePresence>
                    </div>
                  </ScrollArea>
                </TabsContent>

                <TabsContent value="analysis" className="mt-6">
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {sessionToDisplay.marketRegime && (
                      <MarketContextPanel regime={sessionToDisplay.marketRegime} />
                    )}
                    
                    {sessionToDisplay.conflictAnalysis && (
                      <ConflictAnalysisPanel 
                        analysis={sessionToDisplay.conflictAnalysis}
                        recommendations={sessionToDisplay.recommendations}
                      />
                    )}
                    
                    {sessionToDisplay.weightedVotes && (
                      <WeightedVotesPanel 
                        votes={sessionToDisplay.weightedVotes}
                        recommendations={sessionToDisplay.recommendations}
                      />
                    )}
                    
                    {sessionToDisplay.qualityScore && (
                      <DecisionQualityPanel quality={sessionToDisplay.qualityScore} />
                    )}
                    
                    {sessionToDisplay.recommendations.find(r => r.agentId === 'archivist') && (
                      <ArchivistIntelligencePanel 
                        recommendation={sessionToDisplay.recommendations.find(r => r.agentId === 'archivist') as ArchivistAgentRecommendation}
                      />
                    )}
                    
                    <ExecutionRulesPanel session={sessionToDisplay} />
                  </div>
                </TabsContent>

                <TabsContent value="metrics" className="mt-6">
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {sessionToDisplay.survivalMetrics && (
                      <SurvivalMetricsPanel metrics={sessionToDisplay.survivalMetrics} />
                    )}
                    
                    {sessionToDisplay.riskMetrics && (
                      <RiskTransparencyPanel metrics={sessionToDisplay.riskMetrics} />
                    )}
                  </div>
                </TabsContent>
              </Tabs>

              {sessionToDisplay.status === 'active' && !selectedSession && (
                <>
                  <Separator />
                  
                  <div className="flex gap-3">
                    <Button 
                      onClick={handleApproveSession}
                      className="flex-1"
                      disabled={sessionToDisplay.recommendations.some(r => r.recommendation === 'veto')}
                    >
                      {sessionToDisplay.recommendations.some(r => r.recommendation === 'veto') 
                        ? 'Bloqueado por Veto' 
                        : 'Ejecutar Operación'}
                    </Button>
                    <Button 
                      onClick={handleRejectSession}
                      variant="outline"
                      className="flex-1"
                    >
                      Cancelar
                    </Button>
                  </div>
                </>
              )}
            </div>
          )}
        </Card>

        <div className="space-y-4">
          <Card className="p-6 bg-card/50 backdrop-blur-sm">
            <h4 className="font-heading font-semibold text-sm uppercase tracking-wide mb-4">
              Historial de Sesiones
            </h4>
            
            <ScrollArea className="h-[600px]">
              <div className="space-y-2">
                {sessions && sessions.length > 0 ? (
                  sessions.map((session) => (
                    <motion.div
                      key={session.id}
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      className={cn(
                        "p-3 rounded-lg border cursor-pointer transition-all hover:bg-accent/10",
                        selectedSession?.id === session.id ? 'bg-accent/20 border-accent' : 'bg-background/50 border-border'
                      )}
                      onClick={() => setSelectedSession(session)}
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex-1">
                          <p className="font-mono font-semibold text-sm">
                            {session.proposal.action} {session.proposal.asset}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {formatCurrency(session.proposal.amount)}
                          </p>
                        </div>
                        
                        {session.finalDecision?.approved ? (
                          <CheckCircle size={18} weight="fill" className="text-accent" />
                        ) : session.status === 'vetoed' ? (
                          <Warning size={18} weight="fill" className="text-warning" />
                        ) : (
                          <XCircle size={18} weight="fill" className="text-destructive" />
                        )}
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <Badge variant="outline" className="text-xs">
                          {Math.round(session.consensusLevel)}% consenso
                        </Badge>
                        <span className="text-xs text-muted-foreground">
                          {new Date(session.timestamp).toLocaleDateString('es-ES')}
                        </span>
                      </div>
                    </motion.div>
                  ))
                ) : (
                  <p className="text-sm text-muted-foreground text-center py-8">
                    No hay sesiones registradas
                  </p>
                )}
              </div>
            </ScrollArea>
          </Card>
        </div>
      </div>
    </div>
  );
}

interface AgentRecommendationCardProps {
  recommendation: DetailedAgentRecommendation;
  index: number;
}

function AgentRecommendationCard({ recommendation, index }: AgentRecommendationCardProps) {
  const Icon = AGENT_ICONS[recommendation.agentId] || Brain;
  const colorClass = AGENT_COLORS[recommendation.agentId] || 'text-foreground border-foreground';
  
  const isApprove = recommendation.recommendation === 'approve';
  const isReject = recommendation.recommendation === 'reject';
  const isVeto = recommendation.recommendation === 'veto';
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1 }}
      className={cn(
        "relative p-5 rounded-xl border-2 bg-background/60 backdrop-blur-sm",
        isVeto ? 'border-warning/50 bg-warning/5 shadow-lg shadow-warning/10' :
        isApprove ? 'border-accent/30 bg-accent/5' :
        'border-border bg-card/30'
      )}
    >
      {index < 6 && (
        <div className="absolute left-8 top-full w-0.5 h-4 bg-gradient-to-b from-border to-transparent" />
      )}
      
      <div className="flex items-start gap-4">
        <div className={cn(
          "flex-shrink-0 w-12 h-12 rounded-xl border-2 flex items-center justify-center transition-all",
          colorClass,
          isVeto && "animate-pulse ring-2 ring-warning/30"
        )}>
          <Icon size={24} weight="duotone" />
        </div>
        
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between mb-3">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <p className="font-heading font-bold text-base">
                  {recommendation.agentName}
                </p>
                <Badge 
                  variant={isVeto ? 'destructive' : isApprove ? 'default' : 'outline'}
                  className={cn("text-sm font-bold px-3 py-1", isVeto && "animate-pulse")}
                >
                  {recommendation.decisionAction}
                </Badge>
                {isVeto && (
                  <Badge variant="destructive" className="text-xs animate-pulse">
                    VETO ABSOLUTO
                  </Badge>
                )}
              </div>
              <div className="flex items-center gap-2 flex-wrap">
                <Badge 
                  variant={isVeto ? 'destructive' : isApprove ? 'default' : 'outline'}
                  className="text-xs font-semibold"
                >
                  {isVeto ? '⛔ VETO' : isApprove ? '✓ APRUEBA' : '✗ RECHAZA'}
                </Badge>
                <div className="flex items-center gap-1">
                  <span className="text-xs text-muted-foreground">Rep:</span>
                  <div className="flex items-center gap-1">
                    <div className="w-16 h-1.5 bg-background rounded-full overflow-hidden">
                      <div 
                        className={cn(
                          "h-full transition-all",
                          recommendation.reputation >= 70 ? 'bg-accent' :
                          recommendation.reputation >= 40 ? 'bg-yellow-500' :
                          'bg-destructive'
                        )}
                        style={{ width: `${recommendation.reputation}%` }}
                      />
                    </div>
                    <span className="text-xs font-mono font-medium">
                      {recommendation.reputation.toFixed(0)}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <span className="text-xs text-muted-foreground">Peso:</span>
                  <span className="text-xs font-mono font-semibold text-foreground">
                    {(recommendation.weight * 100).toFixed(0)}%
                  </span>
                </div>
              </div>
            </div>
            
            <div className="text-right">
              <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">Confianza</p>
              <p className={cn(
                "font-mono font-bold text-2xl",
                isApprove ? 'text-accent' : isReject ? 'text-destructive' : 'text-warning'
              )}>
                {Math.round(recommendation.confidence)}%
              </p>
            </div>
          </div>
          
          <div className="mb-3">
            <Progress 
              value={recommendation.confidence} 
              className={cn(
                "h-2",
                isVeto && "bg-warning/20"
              )}
            />
          </div>
          
          <div className={cn(
            "p-3 rounded-lg mb-3",
            isVeto ? 'bg-warning/10 border border-warning/30' :
            'bg-muted/30 border border-border/50'
          )}>
            <p className="text-sm text-foreground leading-relaxed">
              {recommendation.reasoning}
            </p>
          </div>
          
          {renderAgentSpecificData(recommendation)}
          
          <div className="flex items-center justify-between mt-3 pt-3 border-t border-border/50">
            <div className="flex items-center gap-2">
              <Clock size={14} className="text-muted-foreground" />
              <span className="text-xs text-muted-foreground">
                {new Date(recommendation.timestamp).toLocaleTimeString('es-ES')}
              </span>
            </div>
            {recommendation.agentId === 'survival' && recommendation.weight === 1 && (
              <Badge variant="outline" className="text-xs border-warning text-warning">
                Autoridad de Veto
              </Badge>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
}

function renderAgentSpecificData(rec: DetailedAgentRecommendation) {
  switch (rec.agentId) {
    case 'news': {
      const newsRec = rec as Extract<DetailedAgentRecommendation, { agentId: 'news' }>;
      return (
        <div className="space-y-3 p-3 rounded-lg bg-blue-500/5 border border-blue-400/20">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Análisis de Sentimiento</span>
            <Badge 
              variant="outline" 
              className={cn(
                "text-xs font-mono",
                newsRec.sentimentScore > 20 ? 'border-accent text-accent' :
                newsRec.sentimentScore < -20 ? 'border-destructive text-destructive' :
                'border-muted-foreground text-muted-foreground'
              )}
            >
              {newsRec.sentimentScore > 0 ? '+' : ''}{newsRec.sentimentScore.toFixed(0)}
            </Badge>
          </div>
          {newsRec.relevantNews.length > 0 && (
            <div className="space-y-1.5">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Noticias Relevantes</p>
              <div className="space-y-1">
                {newsRec.relevantNews.slice(0, 3).map((news, i) => (
                  <div key={i} className="flex items-start gap-2">
                    <div className="w-1 h-1 rounded-full bg-blue-400 mt-1.5 flex-shrink-0" />
                    <p className="text-xs text-foreground/80 leading-relaxed">{news}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      );
    }
    case 'technical': {
      const techRec = rec as Extract<DetailedAgentRecommendation, { agentId: 'technical' }>;
      return (
        <div className="p-3 rounded-lg bg-cyan-500/5 border border-cyan-400/20">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">Indicadores Técnicos</p>
          <div className="grid grid-cols-3 gap-3">
            <div className="p-2 rounded-md bg-background/50 border border-border/50">
              <p className="text-xs text-muted-foreground mb-1">RSI</p>
              <div className="flex items-center gap-2">
                <p className="font-mono text-lg font-bold">{techRec.indicators.rsi.toFixed(0)}</p>
                <Badge 
                  variant="outline" 
                  className={cn(
                    "text-xs",
                    techRec.indicators.rsi < 30 ? 'border-accent text-accent' :
                    techRec.indicators.rsi > 70 ? 'border-destructive text-destructive' :
                    'border-muted-foreground text-muted-foreground'
                  )}
                >
                  {techRec.indicators.rsi < 30 ? 'Sobrevendido' : 
                   techRec.indicators.rsi > 70 ? 'Sobrecomprado' : 'Neutral'}
                </Badge>
              </div>
            </div>
            <div className="p-2 rounded-md bg-background/50 border border-border/50">
              <p className="text-xs text-muted-foreground mb-1">MACD</p>
              <Badge 
                variant={techRec.indicators.macd === 'bullish' ? 'default' : 'destructive'}
                className="text-xs mt-1"
              >
                {techRec.indicators.macd === 'bullish' ? '↗ Alcista' : 
                 techRec.indicators.macd === 'bearish' ? '↘ Bajista' : '→ Neutral'}
              </Badge>
            </div>
            <div className="p-2 rounded-md bg-background/50 border border-border/50">
              <p className="text-xs text-muted-foreground mb-1">Tendencia</p>
              <Badge 
                variant="outline"
                className={cn(
                  "text-xs mt-1",
                  techRec.indicators.trend === 'up' ? 'border-accent text-accent' :
                  techRec.indicators.trend === 'down' ? 'border-destructive text-destructive' :
                  'border-muted-foreground text-muted-foreground'
                )}
              >
                {techRec.indicators.trend === 'up' ? '↑ Subiendo' : 
                 techRec.indicators.trend === 'down' ? '↓ Bajando' : '→ Lateral'}
              </Badge>
            </div>
          </div>
        </div>
      );
    }
    case 'risk': {
      const riskRec = rec as Extract<DetailedAgentRecommendation, { agentId: 'risk' }>;
      return (
        <div className="p-3 rounded-lg bg-yellow-500/5 border border-yellow-400/20">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">Análisis de Riesgo</p>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <p className="text-xs text-muted-foreground mb-1">Score de Riesgo</p>
              <div className="flex items-center gap-2">
                <p className="font-mono text-xl font-bold">{riskRec.riskScore.toFixed(1)}</p>
                <span className="text-xs text-muted-foreground">/ 5.0</span>
              </div>
              <div className="w-full h-1.5 bg-background rounded-full overflow-hidden mt-2">
                <div 
                  className={cn(
                    "h-full transition-all",
                    riskRec.riskScore < 2 ? 'bg-accent' :
                    riskRec.riskScore < 3.5 ? 'bg-yellow-500' :
                    'bg-destructive'
                  )}
                  style={{ width: `${(riskRec.riskScore / 5) * 100}%` }}
                />
              </div>
            </div>
            <div>
              <p className="text-xs text-muted-foreground mb-1">Tamaño Recomendado</p>
              <p className="font-mono text-sm font-semibold">{formatCurrency(riskRec.positionSizeRecommendation)}</p>
              <p className="text-xs text-muted-foreground mt-1">
                Pérdida máx: {formatCurrency(riskRec.maxLoss)}
              </p>
            </div>
          </div>
        </div>
      );
    }
    case 'survival': {
      const survRec = rec as Extract<DetailedAgentRecommendation, { agentId: 'survival' }>;
      return (
        <div className={cn(
          "p-4 rounded-lg border-2",
          survRec.vetoStatus ? 'bg-warning/10 border-warning' : 'bg-orange-500/5 border-orange-400/20'
        )}>
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Estado de Supervivencia</p>
            <Badge 
              variant={survRec.survivalStatus === 'safe' ? 'default' : survRec.survivalStatus === 'warning' ? 'outline' : 'destructive'}
              className={cn(
                "text-xs font-semibold",
                survRec.vetoStatus && "animate-pulse"
              )}
            >
              {survRec.survivalStatus === 'safe' ? '✓ SEGURO' : 
               survRec.survivalStatus === 'warning' ? '⚠ ADVERTENCIA' : '⛔ CRÍTICO'}
            </Badge>
          </div>
          {survRec.vetoStatus && (
            <div className="p-3 rounded-md bg-warning/20 border border-warning/50">
              <div className="flex items-center gap-2 mb-2">
                <Warning size={16} className="text-warning" weight="fill" />
                <span className="text-sm font-bold text-warning">VETO ACTIVADO</span>
              </div>
              <p className="text-xs text-foreground/90">
                Esta operación ha sido bloqueada automáticamente para proteger la reserva de supervivencia del sistema.
              </p>
            </div>
          )}
          {!survRec.vetoStatus && (
            <div className="flex items-center justify-between p-2 rounded-md bg-background/50 border border-border/50">
              <span className="text-xs text-muted-foreground">Impacto en Reserva</span>
              <span className="font-mono text-sm font-semibold">
                {survRec.reserveImpact > 0 ? '-' : '+'}{Math.abs(survRec.reserveImpact).toFixed(1)}%
              </span>
            </div>
          )}
        </div>
      );
    }
    case 'archivist': {
      const archRec = rec as Extract<DetailedAgentRecommendation, { agentId: 'archivist' }>;
      return (
        <div className="p-3 rounded-lg bg-purple-500/5 border border-purple-400/20">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">Datos Históricos</p>
          <div className="grid grid-cols-2 gap-3">
            <div className="p-2 rounded-md bg-background/50 border border-border/50">
              <p className="text-xs text-muted-foreground mb-1">Ops. Similares</p>
              <div className="flex items-center gap-2">
                <Database size={16} className="text-purple-400" />
                <p className="font-mono text-lg font-bold">{archRec.similarOperations}</p>
              </div>
            </div>
            <div className="p-2 rounded-md bg-background/50 border border-border/50">
              <p className="text-xs text-muted-foreground mb-1">Tasa de Éxito</p>
              <div className="flex items-center gap-2">
                <p className={cn(
                  "font-mono text-lg font-bold",
                  archRec.historicalSuccessRate >= 60 ? 'text-accent' :
                  archRec.historicalSuccessRate >= 40 ? 'text-yellow-500' :
                  'text-destructive'
                )}>
                  {archRec.historicalSuccessRate.toFixed(0)}%
                </p>
              </div>
              <div className="w-full h-1.5 bg-background rounded-full overflow-hidden mt-1">
                <div 
                  className={cn(
                    "h-full transition-all",
                    archRec.historicalSuccessRate >= 60 ? 'bg-accent' :
                    archRec.historicalSuccessRate >= 40 ? 'bg-yellow-500' :
                    'bg-destructive'
                  )}
                  style={{ width: `${archRec.historicalSuccessRate}%` }}
                />
              </div>
            </div>
          </div>
        </div>
      );
    }
    case 'investor': {
      const invRec = rec as Extract<DetailedAgentRecommendation, { agentId: 'investor' }>;
      return (
        <div className="p-4 rounded-lg bg-primary/10 border-2 border-primary/30">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">Propuesta de Inversión</p>
              <p className="font-mono text-sm">
                <Badge variant="default" className="mr-2">{invRec.proposedAction}</Badge>
                {invRec.proposedAsset}
              </p>
            </div>
            <div className="text-right">
              <p className="text-xs text-muted-foreground mb-1">Retorno Estimado</p>
              <p className="font-mono text-xl font-bold text-primary">
                +{invRec.estimatedReturn.toFixed(1)}%
              </p>
            </div>
          </div>
          <div className="mt-3 pt-3 border-t border-border/50">
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">Importe</span>
              <span className="font-mono text-sm font-semibold">{formatCurrency(invRec.proposedAmount)}</span>
            </div>
          </div>
        </div>
      );
    }
    case 'director': {
      const dirRec = rec as Extract<DetailedAgentRecommendation, { agentId: 'director' }>;
      return (
        <div className="p-4 rounded-lg bg-accent/10 border-2 border-accent/30">
          <div className="flex items-center gap-2 mb-3">
            <User size={20} className="text-accent" weight="duotone" />
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Decisión Final del Director</p>
          </div>
          <div className="flex items-center justify-between mb-3">
            <Badge 
              variant={dirRec.finalDecision === 'approved' ? 'default' : 'destructive'}
              className="text-sm px-3 py-1"
            >
              {dirRec.finalDecision === 'approved' ? '✓ APROBADA' : '✗ RECHAZADA'}
            </Badge>
            <div className="text-right">
              <p className="text-xs text-muted-foreground">Confianza Combinada</p>
              <p className="font-mono text-lg font-bold">{Math.round(dirRec.combinedConfidence)}%</p>
            </div>
          </div>
          <div className="p-3 rounded-md bg-background/50 border border-border/50">
            <p className="text-sm text-foreground/90 leading-relaxed">{dirRec.explanation}</p>
          </div>
        </div>
      );
    }
    default:
      return null;
  }
}
