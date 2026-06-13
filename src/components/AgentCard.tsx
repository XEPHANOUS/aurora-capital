import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import type { Agent } from '@/lib/types';
import { 
  Newspaper, 
  TrendUp, 
  ShieldWarning, 
  Heart, 
  Archive, 
  Coins, 
  Crown,
  Eye
} from '@phosphor-icons/react';

interface AgentCardProps {
  agent: Agent;
  onClick?: () => void;
}

const agentIcons = {
  news: Newspaper,
  technical: TrendUp,
  risk: ShieldWarning,
  survival: Heart,
  archivist: Archive,
  investor: Coins,
  director: Crown,
  supervisor: Eye,
};

const agentColors = {
  news: 'text-primary',
  technical: 'text-accent',
  risk: 'text-yellow-400',
  survival: 'text-warning',
  archivist: 'text-blue-400',
  investor: 'text-emerald-400',
  director: 'text-amber-400',
  supervisor: 'text-cyan-400',
};

export function AgentCard({ agent, onClick }: AgentCardProps) {
  const Icon = agentIcons[agent.id];
  const color = agentColors[agent.id];
  
  return (
    <Card
      className={cn(
        'p-4 cursor-pointer transition-all duration-300 hover:scale-105',
        'bg-card/50 backdrop-blur-sm border-border/50',
        'hover:border-primary/50 hover:shadow-lg hover:shadow-primary/20'
      )}
      onClick={onClick}
    >
      <div className="flex items-start gap-3">
        <div className={cn('p-2 rounded-lg bg-background/80', color)}>
          <Icon size={24} weight="duotone" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2 mb-1">
            <h3 className="font-heading font-semibold text-sm text-foreground truncate">
              {agent.name}
            </h3>
            {agent.status === 'active' && (
              <Badge variant="outline" className="text-xs border-accent/50 text-accent animate-pulse-subtle">
                Activo
              </Badge>
            )}
          </div>
          <p className="text-xs text-muted-foreground mb-2 line-clamp-2">
            {agent.description}
          </p>
          <div className="space-y-1">
            <div className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground">Reputación</span>
              <span className="font-mono font-medium text-foreground">
                {Math.round(agent.reputation)}/100
              </span>
            </div>
            <div className="h-1.5 bg-background rounded-full overflow-hidden">
              <div
                className={cn(
                  'h-full transition-all duration-500 rounded-full',
                  agent.reputation >= 70 ? 'bg-accent' :
                  agent.reputation >= 40 ? 'bg-yellow-500' :
                  'bg-destructive'
                )}
                style={{ width: `${agent.reputation}%` }}
              />
            </div>
          </div>
          {agent.lastAction && (
            <div className="mt-2 pt-2 border-t border-border/50">
              <p className="text-xs text-muted-foreground line-clamp-1">
                {agent.lastAction}
              </p>
            </div>
          )}
        </div>
      </div>
    </Card>
  );
}
