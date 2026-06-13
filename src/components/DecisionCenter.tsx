import { useState, useEffect } from 'react';
import { useKV } from '@github/spark/hooks';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Progress } from '@/components/ui/progress';
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
  ArrowRight,
  ChartLine,
  type Icon
} from '@phosphor-icons/react';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import type { Agent, SystemConfig, DecisionSession, DetailedAgentRecommendation } from '@/lib/types';
import { 
  generateDecisionSession, 
  generateMockDecisionSessions,
  formatCurrency,
  formatPercent,
  DEFAULT_CONFIG,
  initializeAgents
} from '@/lib/mockData';
import { DecisionFlowVisualizer } from '@/components/DecisionFlowVisualizer';

const AGENT_ICONS: Record<string, Icon> = {
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
                      "mb-3",
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
                  <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">Consenso</p>
                  <p className="font-mono font-bold text-2xl">{Math.round(sessionToDisplay.consensusLevel)}%</p>
                </div>
              </div>

              <Separator />

              <DecisionFlowVisualizer recommendations={sessionToDisplay.recommendations} />

              <Separator />

              <div>
                <h4 className="font-heading font-semibold text-sm uppercase tracking-wide mb-4 flex items-center gap-2">
                  <Clock size={16} />
                  Cadena de Decisión
                </h4>
                
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
              </div>

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
        "relative p-4 rounded-lg border bg-background/50",
        isVeto ? 'border-warning/50 bg-warning/5' :
        isApprove ? 'border-accent/30' :
        'border-border'
      )}
    >
      {index < 6 && (
        <div className="absolute left-6 top-full w-px h-4 bg-border" />
      )}
      
      <div className="flex items-start gap-4">
        <div className={cn(
          "flex-shrink-0 w-10 h-10 rounded-lg border-2 flex items-center justify-center",
          colorClass
        )}>
          <Icon size={20} />
        </div>
        
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between mb-2">
            <div>
              <p className="font-heading font-semibold text-sm">
                {recommendation.agentName}
              </p>
              <div className="flex items-center gap-2 mt-1">
                <Badge 
                  variant={isVeto ? 'destructive' : isApprove ? 'default' : 'outline'}
                  className="text-xs"
                >
                  {isVeto ? 'VETO' : isApprove ? 'APRUEBA' : 'RECHAZA'}
                </Badge>
                <span className="text-xs text-muted-foreground">
                  Reputación: {recommendation.reputation.toFixed(0)}
                </span>
              </div>
            </div>
            
            <div className="text-right">
              <p className="text-xs text-muted-foreground mb-1">Confianza</p>
              <p className="font-mono font-bold text-lg">{Math.round(recommendation.confidence)}%</p>
            </div>
          </div>
          
          <Progress value={recommendation.confidence} className="h-1 mb-3" />
          
          <p className="text-sm text-foreground/90 leading-relaxed mb-3">
            {recommendation.reasoning}
          </p>
          
          {renderAgentSpecificData(recommendation)}
          
          <div className="flex items-center justify-between mt-3 pt-3 border-t border-border/50">
            <span className="text-xs text-muted-foreground">
              {new Date(recommendation.timestamp).toLocaleTimeString('es-ES')}
            </span>
            <span className="text-xs text-muted-foreground">
              Peso: {(recommendation.weight * 100).toFixed(0)}%
            </span>
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
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground">Sentimiento:</span>
            <Badge variant="outline" className="text-xs">
              {newsRec.sentimentScore > 0 ? '+' : ''}{newsRec.sentimentScore.toFixed(0)}
            </Badge>
          </div>
          {newsRec.relevantNews.length > 0 && (
            <div className="pl-4 border-l-2 border-border/50 space-y-1">
              {newsRec.relevantNews.slice(0, 2).map((news, i) => (
                <p key={i} className="text-xs text-muted-foreground">· {news}</p>
              ))}
            </div>
          )}
        </div>
      );
    }
    case 'technical': {
      const techRec = rec as Extract<DetailedAgentRecommendation, { agentId: 'technical' }>;
      return (
        <div className="grid grid-cols-3 gap-2">
          <div>
            <p className="text-xs text-muted-foreground mb-1">RSI</p>
            <p className="font-mono text-sm font-semibold">{techRec.indicators.rsi.toFixed(0)}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground mb-1">MACD</p>
            <Badge variant="outline" className="text-xs">
              {techRec.indicators.macd}
            </Badge>
          </div>
          <div>
            <p className="text-xs text-muted-foreground mb-1">Tendencia</p>
            <Badge variant="outline" className="text-xs">
              {techRec.indicators.trend === 'up' ? '↑' : techRec.indicators.trend === 'down' ? '↓' : '→'}
            </Badge>
          </div>
        </div>
      );
    }
    case 'risk': {
      const riskRec = rec as Extract<DetailedAgentRecommendation, { agentId: 'risk' }>;
      return (
        <div className="grid grid-cols-2 gap-2">
          <div>
            <p className="text-xs text-muted-foreground mb-1">Riesgo</p>
            <p className="font-mono text-sm font-semibold">{riskRec.riskScore.toFixed(1)}/5</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground mb-1">Tamaño Recomendado</p>
            <p className="font-mono text-sm font-semibold">{formatCurrency(riskRec.positionSizeRecommendation)}</p>
          </div>
        </div>
      );
    }
    case 'survival': {
      const survRec = rec as Extract<DetailedAgentRecommendation, { agentId: 'survival' }>;
      return (
        <div className="p-3 rounded-lg bg-background/80 border border-border/50">
          <div className="flex items-center justify-between">
            <Badge 
              variant={survRec.survivalStatus === 'safe' ? 'default' : survRec.survivalStatus === 'warning' ? 'outline' : 'destructive'}
              className="text-xs"
            >
              {survRec.survivalStatus === 'safe' ? 'SEGURO' : 
               survRec.survivalStatus === 'warning' ? 'ADVERTENCIA' : 'CRÍTICO'}
            </Badge>
            {survRec.vetoStatus && (
              <Badge variant="destructive" className="text-xs">
                VETO ACTIVO
              </Badge>
            )}
          </div>
        </div>
      );
    }
    case 'archivist': {
      const archRec = rec as Extract<DetailedAgentRecommendation, { agentId: 'archivist' }>;
      return (
        <div className="grid grid-cols-2 gap-2">
          <div>
            <p className="text-xs text-muted-foreground mb-1">Ops. Similares</p>
            <p className="font-mono text-sm font-semibold">{archRec.similarOperations}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground mb-1">Éxito Histórico</p>
            <p className="font-mono text-sm font-semibold">{archRec.historicalSuccessRate.toFixed(0)}%</p>
          </div>
        </div>
      );
    }
    case 'investor': {
      const invRec = rec as Extract<DetailedAgentRecommendation, { agentId: 'investor' }>;
      return (
        <div className="flex items-center justify-between p-3 rounded-lg bg-primary/5 border border-primary/20">
          <span className="text-xs text-muted-foreground">Retorno Estimado</span>
          <span className="font-mono text-sm font-semibold text-primary">
            +{invRec.estimatedReturn.toFixed(1)}%
          </span>
        </div>
      );
    }
    case 'director': {
      const dirRec = rec as Extract<DetailedAgentRecommendation, { agentId: 'director' }>;
      return (
        <div className="p-4 rounded-lg bg-accent/10 border border-accent/30">
          <div className="flex items-center gap-2 mb-2">
            <Badge 
              variant={dirRec.finalDecision === 'approved' ? 'default' : 'destructive'}
              className="text-xs"
            >
              {dirRec.finalDecision === 'approved' ? 'APROBADA' : 'RECHAZADA'}
            </Badge>
            <span className="text-xs text-muted-foreground">
              Confianza Combinada: {Math.round(dirRec.combinedConfidence)}%
            </span>
          </div>
          <p className="text-sm text-foreground/90">{dirRec.explanation}</p>
        </div>
      );
    }
    default:
      return null;
  }
}
