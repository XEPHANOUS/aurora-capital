import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { TrendUp, TrendDown, CheckCircle, Warning, Circle } from '@phosphor-icons/react';
import { cn } from '@/lib/utils';
import type { EnvironmentType, SystemMaturityMetrics } from '@/lib/types';
import { ENVIRONMENT_CONFIGS } from '@/lib/services/environmentManager';
import { formatCurrency, formatPercent } from '@/lib/mockData';

interface EnvironmentStats {
  environment: EnvironmentType;
  capital: number;
  roi: number;
  trades: number;
  winRate: number;
  drawdown: number;
  maturityScore: number;
  status: 'active' | 'inactive' | 'ready';
}

interface EnvironmentDashboardProps {
  environments: EnvironmentStats[];
  currentEnvironment: EnvironmentType;
  onSelectEnvironment: (env: EnvironmentType) => void;
}

export function EnvironmentDashboard({
  environments,
  currentEnvironment,
  onSelectEnvironment,
}: EnvironmentDashboardProps) {
  const getMaturityColor = (score: number) => {
    if (score >= 80) return 'text-accent';
    if (score >= 60) return 'text-primary';
    if (score >= 40) return 'text-warning';
    return 'text-destructive';
  };

  const getMaturityLabel = (score: number) => {
    if (score >= 80) return 'ELITE';
    if (score >= 60) return 'MATURE';
    if (score >= 40) return 'DEVELOPING';
    return 'IMMATURE';
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active':
        return <Circle size={12} weight="fill" className="text-accent animate-pulse-subtle" />;
      case 'ready':
        return <CheckCircle size={12} weight="fill" className="text-primary" />;
      default:
        return <Circle size={12} weight="duotone" className="text-muted-foreground" />;
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="font-heading font-bold text-xl">MULTI-ENVIRONMENT STATUS</h2>
        <Badge variant="outline" className="font-mono text-xs">
          {environments.length} Entornos Activos
        </Badge>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {environments.map((env) => {
          const config = ENVIRONMENT_CONFIGS[env.environment];
          const isActive = env.environment === currentEnvironment;

          return (
            <Card
              key={env.environment}
              className={cn(
                'p-4 cursor-pointer transition-all hover:border-primary/50',
                isActive && 'border-2 border-primary bg-primary/5'
              )}
              onClick={() => onSelectEnvironment(env.environment)}
              style={{
                borderColor: isActive ? config.color : undefined,
              }}
            >
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-2xl">{config.icon}</span>
                    <div>
                      <p className="font-heading font-bold text-sm uppercase tracking-wide">
                        {config.name}
                      </p>
                      <p className="text-xs text-muted-foreground">{config.description}</p>
                    </div>
                  </div>
                  {getStatusIcon(env.status)}
                </div>

                <Separator />

                <div className="space-y-3">
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs text-muted-foreground">Capital</span>
                      <span className="font-mono text-sm font-semibold">
                        {formatCurrency(env.capital)}
                      </span>
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs text-muted-foreground">ROI</span>
                      <span
                        className={cn(
                          'font-mono text-sm font-semibold flex items-center gap-1',
                          env.roi >= 0 ? 'text-accent' : 'text-destructive'
                        )}
                      >
                        {env.roi >= 0 ? <TrendUp size={14} /> : <TrendDown size={14} />}
                        {formatPercent(env.roi)}
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div>
                      <p className="text-muted-foreground">Trades</p>
                      <p className="font-mono font-semibold">{env.trades}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Win Rate</p>
                      <p className="font-mono font-semibold">{formatPercent(env.winRate)}</p>
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs text-muted-foreground">Drawdown</span>
                      <span className="font-mono text-xs text-warning">
                        {formatPercent(env.drawdown)}
                      </span>
                    </div>
                  </div>

                  <Separator />

                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs text-muted-foreground">System Maturity</span>
                      <Badge
                        variant="outline"
                        className={cn('text-xs font-mono', getMaturityColor(env.maturityScore))}
                      >
                        {getMaturityLabel(env.maturityScore)}
                      </Badge>
                    </div>
                    <div className="space-y-1">
                      <Progress value={env.maturityScore} className="h-1.5" />
                      <p className={cn('text-xs font-mono font-bold text-right', getMaturityColor(env.maturityScore))}>
                        {env.maturityScore}%
                      </p>
                    </div>
                  </div>
                </div>

                {config.features.realMoney && (
                  <Badge variant="destructive" className="w-full justify-center text-xs">
                    CAPITAL REAL
                  </Badge>
                )}
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
