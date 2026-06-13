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
  type Icon
} from '@phosphor-icons/react';
import { cn } from '@/lib/utils';
import type { DetailedAgentRecommendation } from '@/lib/types';

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

  return (
    <Card className="p-6 bg-card/50 backdrop-blur-sm overflow-x-auto">
      <h4 className="font-heading font-semibold text-sm uppercase tracking-wide mb-6">
        Flujo de Decisión
      </h4>
      
      <div className="flex items-center gap-3 min-w-max pb-2">
        {sortedRecs.map((rec, index) => {
          const Icon = AGENT_ICONS[rec.agentId] || Brain;
          const colorClass = AGENT_COLORS[rec.agentId] || 'bg-foreground/20 border-foreground text-foreground';
          
          const isApprove = rec.recommendation === 'approve';
          const isVeto = rec.recommendation === 'veto';
          
          return (
            <div key={rec.agentId} className="flex items-center gap-3">
              <div className="relative group">
                <div className={cn(
                  "w-16 h-16 rounded-xl border-2 flex flex-col items-center justify-center transition-all",
                  colorClass,
                  isVeto && "animate-pulse"
                )}>
                  <Icon size={24} />
                  <span className="text-[10px] font-medium mt-1">{rec.agentName}</span>
                </div>
                
                <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 whitespace-nowrap">
                  <Badge 
                    variant={isVeto ? 'destructive' : isApprove ? 'default' : 'outline'}
                    className="text-xs"
                  >
                    {Math.round(rec.confidence)}%
                  </Badge>
                </div>
                
                <div className="absolute top-full mt-12 left-1/2 -translate-x-1/2 bg-popover/95 backdrop-blur-sm border border-border rounded-lg p-3 shadow-xl opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10 w-64">
                  <p className="text-xs text-foreground font-medium mb-1">{rec.agentName}</p>
                  <p className="text-xs text-muted-foreground">{rec.reasoning}</p>
                </div>
              </div>
              
              {index < sortedRecs.length - 1 && (
                <div className="flex flex-col items-center gap-1">
                  <ArrowRight size={20} weight="bold" className={cn(
                    "transition-colors",
                    isApprove ? "text-accent" : "text-muted-foreground"
                  )} />
                  <div className={cn(
                    "text-[10px] font-mono",
                    isApprove ? "text-accent" : "text-muted-foreground"
                  )}>
                    {rec.weight > 0 ? `${(rec.weight * 100).toFixed(0)}%` : ''}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </Card>
  );
}
