import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Brain, 
  ChartLine, 
  TrendUp, 
  ShieldCheck, 
  Database,
  Coins,
  User,
  ArrowRight,
  CheckCircle,
  XCircle,
  Warning
} from '@phosphor-icons/react';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';
import type { DetailedAgentRecommendation } from '@/lib/types';
import type { ComponentType } from 'react';

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
  news: 'bg-blue-500/20 border-blue-400 text-blue-400',
  technical: 'bg-cyan-500/20 border-cyan-400 text-cyan-400',
  risk: 'bg-yellow-500/20 border-yellow-400 text-yellow-400',
  survival: 'bg-orange-500/20 border-warning text-warning',
  archivist: 'bg-purple-500/20 border-purple-400 text-purple-400',
  investor: 'bg-blue-600/20 border-primary text-primary',
  director: 'bg-green-500/20 border-accent text-accent'
};

interface DecisionFlowVisualizerProps {
  recommendations: DetailedAgentRecommendation[];
}

export function DecisionFlowVisualizer({ recommendations }: DecisionFlowVisualizerProps) {
  const sortedRecs = [...recommendations].sort((a, b) => {
    const order = ['news', 'technical', 'risk', 'survival', 'archivist', 'investor', 'director'];
    return order.indexOf(a.agentId) - order.indexOf(b.agentId);
  });

  const approvals = sortedRecs.filter(r => r.recommendation === 'approve').length;
  const rejections = sortedRecs.filter(r => r.recommendation === 'reject').length;
  const hasVeto = sortedRecs.some(r => r.recommendation === 'veto');

  return (
    <Card className="p-6 bg-card/50 backdrop-blur-sm overflow-x-auto border-primary/20">
      <div className="flex items-center justify-between mb-6">
        <h4 className="font-heading font-semibold text-sm uppercase tracking-wide">
          Flujo de Decisión Multi-Agente
        </h4>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1">
            <CheckCircle size={16} className="text-accent" weight="fill" />
            <span className="text-xs font-mono text-muted-foreground">{approvals} aprueba{approvals !== 1 ? 'n' : ''}</span>
          </div>
          <div className="flex items-center gap-1">
            <XCircle size={16} className="text-destructive" weight="fill" />
            <span className="text-xs font-mono text-muted-foreground">{rejections} rechaza{rejections !== 1 ? 'n' : ''}</span>
          </div>
          {hasVeto && (
            <div className="flex items-center gap-1">
              <Warning size={16} className="text-warning animate-pulse" weight="fill" />
              <span className="text-xs font-mono text-warning">VETO</span>
            </div>
          )}
        </div>
      </div>
      
      <div className="flex items-center gap-3 min-w-max pb-2">
        {sortedRecs.map((rec, index) => {
          const Icon = AGENT_ICONS[rec.agentId] || Brain;
          const colorClass = AGENT_COLORS[rec.agentId] || 'bg-foreground/20 border-foreground text-foreground';
          
          const isApprove = rec.recommendation === 'approve';
          const isVeto = rec.recommendation === 'veto';
          const isReject = rec.recommendation === 'reject';
          
          return (
            <div key={rec.agentId} className="flex items-center gap-3">
              <motion.div 
                className="relative group"
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: index * 0.1, type: "spring", stiffness: 200 }}
              >
                <div className={cn(
                  "w-20 h-20 rounded-xl border-2 flex flex-col items-center justify-center transition-all",
                  "hover:scale-110 cursor-pointer",
                  colorClass,
                  isVeto && "animate-pulse border-warning ring-2 ring-warning/50"
                )}>
                  <Icon size={28} weight="duotone" />
                  <span className="text-[10px] font-semibold mt-1 text-center px-1">{rec.agentName}</span>
                </div>
                
                <div className="absolute -bottom-10 left-1/2 -translate-x-1/2 whitespace-nowrap flex flex-col items-center gap-1">
                  <Badge 
                    variant={isVeto ? 'destructive' : isApprove ? 'default' : 'outline'}
                    className={cn(
                      "text-xs font-mono",
                      isVeto && "animate-pulse"
                    )}
                  >
                    {Math.round(rec.confidence)}%
                  </Badge>
                  {rec.weight > 0 && rec.weight !== 1 && (
                    <span className="text-[10px] text-muted-foreground font-mono">
                      peso {(rec.weight * 100).toFixed(0)}%
                    </span>
                  )}
                  {rec.weight === 1 && rec.agentId === 'survival' && (
                    <span className="text-[10px] text-warning font-bold uppercase">
                      VETO
                    </span>
                  )}
                </div>
                
                <div className="absolute -top-6 left-1/2 -translate-x-1/2 whitespace-nowrap">
                  <Badge 
                    variant="outline" 
                    className="text-[10px] border-border/50"
                  >
                    Rep: {rec.reputation.toFixed(0)}
                  </Badge>
                </div>
                
                <div className="absolute top-full mt-16 left-1/2 -translate-x-1/2 bg-popover/98 backdrop-blur-md border border-border rounded-lg p-4 shadow-2xl opacity-0 group-hover:opacity-100 transition-all pointer-events-none z-10 w-72">
                  <div className="flex items-start gap-2 mb-2">
                    <Icon size={20} className={colorClass.split(' ').pop()} />
                    <div>
                      <p className="text-sm text-foreground font-semibold">{rec.agentName}</p>
                      <p className="text-xs text-muted-foreground">Reputación: {rec.reputation.toFixed(0)}</p>
                    </div>
                  </div>
                  <p className="text-xs text-foreground/90 leading-relaxed">{rec.reasoning}</p>
                  <div className="mt-2 pt-2 border-t border-border/50 flex items-center justify-between">
                    <span className="text-xs text-muted-foreground">Peso en decisión</span>
                    <span className="text-xs font-mono font-semibold">{(rec.weight * 100).toFixed(0)}%</span>
                  </div>
                </div>
              </motion.div>
              
              {index < sortedRecs.length - 1 && (
                <div className="flex flex-col items-center gap-1 px-2">
                  <ArrowRight 
                    size={24} 
                    weight="bold" 
                    className={cn(
                      "transition-colors",
                      isApprove ? "text-accent" : isReject ? "text-destructive/50" : "text-muted-foreground"
                    )} 
                  />
                  <div className="h-0.5 w-8 rounded-full bg-gradient-to-r from-transparent via-border to-transparent" />
                </div>
              )}
            </div>
          );
        })}
      </div>
    </Card>
  );
}
