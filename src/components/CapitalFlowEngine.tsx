import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { ArrowRight, TrendUp, TrendDown } from '@phosphor-icons/react';
import { cn } from '@/lib/utils';
import type { CapitalFlow, SectorRotation } from '@/lib/marketIntelligence';

interface CapitalFlowEngineProps {
  capitalFlows: CapitalFlow[];
  sectorRotation: SectorRotation[];
  riskAppetite: {
    level: number;
    trend: 'increasing' | 'decreasing' | 'stable';
    indicators: string[];
  };
}

const formatCurrency = (value: number): string => {
  if (value >= 1e12) return `$${(value / 1e12).toFixed(2)}T`;
  if (value >= 1e9) return `$${(value / 1e9).toFixed(2)}B`;
  if (value >= 1e6) return `$${(value / 1e6).toFixed(2)}M`;
  return `$${value.toFixed(2)}`;
};

const getTrendColor = (trend: string) => {
  if (trend === 'increasing') return 'text-accent';
  if (trend === 'decreasing') return 'text-destructive';
  return 'text-muted-foreground';
};

const getTrendIcon = (trend: string) => {
  if (trend === 'increasing') return <TrendUp size={16} />;
  if (trend === 'decreasing') return <TrendDown size={16} />;
  return null;
};

export const CapitalFlowEngine = ({
  capitalFlows,
  sectorRotation,
  riskAppetite,
}: CapitalFlowEngineProps) => {
  const sortedRotation = [...sectorRotation].sort((a, b) => b.netFlow - a.netFlow);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-heading font-bold text-2xl tracking-tight mb-1">
          CAPITAL FLOW ENGINE
        </h2>
        <p className="text-sm text-muted-foreground">
          Movimiento de capital entre clases de activos
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2 p-6 bg-card/50 backdrop-blur-sm">
          <h3 className="font-heading font-semibold text-lg mb-4">FLUJOS DE CAPITAL</h3>
          <div className="space-y-4">
            {capitalFlows.map((flow, index) => (
              <div key={index} className="p-4 bg-background/50 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-3">
                    <span className="font-mono font-semibold">{flow.from}</span>
                    <ArrowRight size={20} className="text-muted-foreground" />
                    <span className="font-mono font-semibold">{flow.to}</span>
                  </div>
                  <Badge
                    variant="outline"
                    className={cn(
                      "gap-1",
                      getTrendColor(flow.trend)
                    )}
                  >
                    {getTrendIcon(flow.trend)}
                    {flow.trend}
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Volumen</span>
                  <span className="font-mono font-bold text-lg">{formatCurrency(flow.amount)}</span>
                </div>
                <div className="flex items-center justify-between mt-1">
                  <span className="text-sm text-muted-foreground">Cambio</span>
                  <span className={cn(
                    "font-mono font-semibold text-sm",
                    flow.change >= 0 ? "text-accent" : "text-destructive"
                  )}>
                    {flow.change >= 0 ? '+' : ''}{flow.change.toFixed(2)}%
                  </span>
                </div>
              </div>
            ))}
          </div>
        </Card>

        <Card className="p-6 bg-card/50 backdrop-blur-sm">
          <h3 className="font-heading font-semibold text-lg mb-4">RISK APPETITE</h3>
          <div className="space-y-6">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-muted-foreground">Nivel</span>
                <span className="font-mono font-bold text-2xl">{riskAppetite.level.toFixed(0)}</span>
              </div>
              <Progress value={riskAppetite.level} className="h-3" />
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-muted-foreground">Tendencia</span>
                <Badge
                  variant="outline"
                  className={cn(
                    "gap-1",
                    getTrendColor(riskAppetite.trend)
                  )}
                >
                  {getTrendIcon(riskAppetite.trend)}
                  {riskAppetite.trend}
                </Badge>
              </div>
            </div>

            <div>
              <p className="text-xs text-muted-foreground uppercase tracking-wide mb-2">Indicadores</p>
              <div className="space-y-2">
                {riskAppetite.indicators.map((indicator, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                    <span className="text-xs">{indicator}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </Card>
      </div>

      <Card className="p-6 bg-card/50 backdrop-blur-sm">
        <h3 className="font-heading font-semibold text-lg mb-4">SECTOR ROTATION</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {sortedRotation.map((sector, index) => (
            <div key={index} className="p-4 bg-background/50 rounded-lg">
              <div className="flex items-center justify-between mb-3">
                <span className="font-heading font-semibold">{sector.sector}</span>
                <Badge
                  variant={sector.netFlow > 0 ? 'default' : 'destructive'}
                  className="text-xs"
                >
                  {sector.netFlow > 0 ? 'INFLOW' : 'OUTFLOW'}
                </Badge>
              </div>
              
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Inflow</span>
                  <span className="font-mono text-accent">+{formatCurrency(sector.inflow)}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Outflow</span>
                  <span className="font-mono text-destructive">-{formatCurrency(sector.outflow)}</span>
                </div>
                <div className="pt-2 border-t border-border">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Net Flow</span>
                    <span className={cn(
                      "font-mono font-bold",
                      sector.netFlow > 0 ? "text-accent" : "text-destructive"
                    )}>
                      {sector.netFlow > 0 ? '+' : ''}{formatCurrency(sector.netFlow)}
                    </span>
                  </div>
                </div>
                <div className="mt-2">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs text-muted-foreground">Momentum</span>
                    <span className="text-xs font-mono">{sector.momentum.toFixed(0)}</span>
                  </div>
                  <Progress 
                    value={50 + sector.momentum / 2} 
                    className="h-1.5"
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
};
