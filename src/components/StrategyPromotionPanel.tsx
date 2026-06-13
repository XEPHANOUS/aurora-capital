import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { 
  ArrowRight, 
  CheckCircle, 
  XCircle, 
  Warning,
  Trophy,
  Lock
} from '@phosphor-icons/react';
import { cn } from '@/lib/utils';
import type { EnvironmentType, EnvironmentMaturityStatus } from '@/lib/types';
import { ENVIRONMENT_CONFIGS, getNextEnvironment } from '@/lib/services/environmentManager';
import { formatPercent } from '@/lib/mockData';

interface StrategyPromotionPanelProps {
  maturityStatus: EnvironmentMaturityStatus;
  onPromote?: () => void;
}

export function StrategyPromotionPanel({
  maturityStatus,
  onPromote,
}: StrategyPromotionPanelProps) {
  const currentConfig = ENVIRONMENT_CONFIGS[maturityStatus.environment];
  const nextEnv = getNextEnvironment(maturityStatus.environment);
  const nextConfig = nextEnv ? ENVIRONMENT_CONFIGS[nextEnv] : null;

  const getReadinessColor = (score: number) => {
    if (score >= 80) return 'text-accent';
    if (score >= 60) return 'text-primary';
    if (score >= 40) return 'text-warning';
    return 'text-destructive';
  };

  const getReadinessGrade = (score: number) => {
    if (score >= 90) return 'S';
    if (score >= 80) return 'A';
    if (score >= 70) return 'B';
    if (score >= 60) return 'C';
    if (score >= 50) return 'D';
    return 'F';
  };

  const requirementsMet = [
    {
      label: 'Trades Completados',
      current: maturityStatus.currentMetrics.totalTrades,
      required: maturityStatus.requirements.minTrades,
      met: maturityStatus.currentMetrics.totalTrades >= maturityStatus.requirements.minTrades,
    },
    {
      label: 'Win Rate',
      current: maturityStatus.currentMetrics.winRate,
      required: maturityStatus.requirements.minWinRate,
      met: maturityStatus.currentMetrics.winRate >= maturityStatus.requirements.minWinRate,
      isPercent: true,
    },
    {
      label: 'Profit Factor',
      current: maturityStatus.currentMetrics.profitFactor,
      required: maturityStatus.requirements.minProfitFactor,
      met: maturityStatus.currentMetrics.profitFactor >= maturityStatus.requirements.minProfitFactor,
    },
    {
      label: 'Max Drawdown',
      current: maturityStatus.currentMetrics.drawdown,
      required: maturityStatus.requirements.maxDrawdown,
      met: maturityStatus.currentMetrics.drawdown <= maturityStatus.requirements.maxDrawdown,
      isPercent: true,
      inverse: true,
    },
    {
      label: 'Consistencia',
      current: maturityStatus.currentMetrics.consistency,
      required: maturityStatus.requirements.minConsistency,
      met: maturityStatus.currentMetrics.consistency >= maturityStatus.requirements.minConsistency,
      isPercent: true,
    },
  ];

  return (
    <Card className="p-6 bg-card/50 backdrop-blur-sm">
      <div className="space-y-6">
        <div className="flex items-start justify-between">
          <div>
            <h3 className="font-heading font-bold text-xl mb-2">STRATEGY READINESS</h3>
            <p className="text-sm text-muted-foreground">
              Sistema de promoción entre entornos
            </p>
          </div>

          <div className="text-right">
            <div className={cn(
              'text-5xl font-heading font-black mb-1',
              getReadinessColor(maturityStatus.maturityScore)
            )}>
              {getReadinessGrade(maturityStatus.maturityScore)}
            </div>
            <p className={cn(
              'text-sm font-mono font-bold',
              getReadinessColor(maturityStatus.maturityScore)
            )}>
              {maturityStatus.maturityScore}/100
            </p>
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-muted-foreground">Readiness Score</span>
            <span className={cn(
              'text-sm font-mono font-bold',
              getReadinessColor(maturityStatus.maturityScore)
            )}>
              {maturityStatus.maturityScore}%
            </span>
          </div>
          <Progress value={maturityStatus.maturityScore} className="h-2" />
        </div>

        <Separator />

        <div className="space-y-3">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
            Requisitos de Promoción
          </p>

          {requirementsMet.map((req) => (
            <div key={req.label} className="flex items-center justify-between p-3 bg-background/50 rounded-lg">
              <div className="flex items-center gap-3">
                {req.met ? (
                  <CheckCircle size={20} weight="fill" className="text-accent" />
                ) : (
                  <XCircle size={20} weight="fill" className="text-destructive" />
                )}
                <div>
                  <p className="text-sm font-medium">{req.label}</p>
                  <p className="text-xs text-muted-foreground">
                    {req.isPercent ? formatPercent(req.current) : req.current.toFixed(2)}
                    {' / '}
                    {req.isPercent ? formatPercent(req.required) : req.required.toFixed(2)}
                    {' '}
                    {req.inverse ? 'máximo' : 'mínimo'}
                  </p>
                </div>
              </div>
              <Badge variant={req.met ? 'default' : 'destructive'} className="text-xs">
                {req.met ? 'Cumplido' : 'Pendiente'}
              </Badge>
            </div>
          ))}
        </div>

        {maturityStatus.missingRequirements.length > 0 && (
          <>
            <Separator />
            <div className="p-4 bg-warning/10 border border-warning/30 rounded-lg">
              <div className="flex items-start gap-2">
                <Warning size={20} className="text-warning mt-0.5" />
                <div className="flex-1">
                  <p className="text-sm font-semibold text-warning mb-2">
                    Requisitos Pendientes
                  </p>
                  <ul className="space-y-1">
                    {maturityStatus.missingRequirements.map((req, index) => (
                      <li key={index} className="text-xs text-muted-foreground">
                        • {req}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          </>
        )}

        {nextConfig && (
          <>
            <Separator />
            <div className="space-y-4">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                Ruta de Promoción
              </p>

              <div className="flex items-center justify-center gap-4">
                <div className="flex items-center gap-2">
                  <span className="text-2xl">{currentConfig.icon}</span>
                  <div>
                    <p className="font-heading font-bold text-sm">{currentConfig.name}</p>
                    <p className="text-xs text-muted-foreground">Actual</p>
                  </div>
                </div>

                <ArrowRight size={24} weight="bold" className="text-muted-foreground" />

                <div className="flex items-center gap-2">
                  <span className="text-2xl">{nextConfig.icon}</span>
                  <div>
                    <p className="font-heading font-bold text-sm">{nextConfig.name}</p>
                    <p className="text-xs text-muted-foreground">Siguiente</p>
                  </div>
                </div>
              </div>

              {maturityStatus.readyForPromotion ? (
                <Button
                  onClick={onPromote}
                  className="w-full gap-2"
                  size="lg"
                >
                  <Trophy size={20} weight="fill" />
                  Promocionar a {nextConfig.name}
                </Button>
              ) : (
                <Button
                  disabled
                  className="w-full gap-2"
                  size="lg"
                  variant="outline"
                >
                  <Lock size={20} weight="fill" />
                  Completar requisitos primero
                </Button>
              )}
            </div>
          </>
        )}

        {!nextConfig && (
          <>
            <Separator />
            <div className="p-4 bg-accent/10 border border-accent/30 rounded-lg text-center">
              <Trophy size={32} weight="fill" className="text-accent mx-auto mb-2" />
              <p className="text-sm font-semibold text-accent mb-1">
                ¡Entorno Máximo Alcanzado!
              </p>
              <p className="text-xs text-muted-foreground">
                Ya estás operando en el entorno más avanzado del sistema
              </p>
            </div>
          </>
        )}
      </div>
    </Card>
  );
}
