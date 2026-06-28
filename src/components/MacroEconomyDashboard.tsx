import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { TrendUp, TrendDown, Minus } from '@phosphor-icons/react';
import { cn } from '@/lib/utils';
import type { MacroData } from '@/lib/marketIntelligence';

interface MacroEconomyDashboardProps {
  macroData: MacroData[];
}

const getTrendIcon = (trend: 'up' | 'down' | 'stable') => {
  if (trend === 'up') return <TrendUp size={16} className="text-accent" />;
  if (trend === 'down') return <TrendDown size={16} className="text-destructive" />;
  return <Minus size={16} className="text-muted-foreground" />;
};

const getImpactColor = (impact: 'high' | 'medium' | 'low') => {
  if (impact === 'high') return 'border-destructive text-destructive';
  if (impact === 'medium') return 'border-yellow-400 text-yellow-400';
  return 'border-muted text-muted-foreground';
};

const getIndicatorName = (indicator: string): string => {
  const names: Record<string, string> = {
    'inflation': 'Inflación',
    'gdp': 'PIB',
    'interest-rates': 'Tipos de Interés',
    'unemployment': 'Desempleo',
    'liquidity': 'Liquidez Global',
  };
  return names[indicator] || indicator;
};

const getIndicatorUnit = (indicator: string): string => {
  const units: Record<string, string> = {
    'inflation': '%',
    'gdp': '%',
    'interest-rates': '%',
    'unemployment': '%',
    'liquidity': 'T$',
  };
  return units[indicator] || '';
};

export const MacroEconomyDashboard = ({ macroData }: MacroEconomyDashboardProps) => {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-heading font-bold text-2xl tracking-tight mb-1">
          MACRO ECONOMY
        </h2>
        <p className="text-sm text-muted-foreground">
          Indicadores macroeconómicos globales
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {macroData.map((data, index) => (
          <Card key={index} className="p-6 bg-card/50 backdrop-blur-sm">
            <div className="flex items-start justify-between mb-4">
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">
                  {getIndicatorName(data.indicator)}
                </p>
                <div className="flex items-baseline gap-2">
                  <span className="font-mono font-bold text-3xl">
                    {data.value.toFixed(data.indicator === 'liquidity' ? 1 : 2)}
                  </span>
                  <span className="text-lg text-muted-foreground">
                    {getIndicatorUnit(data.indicator)}
                  </span>
                </div>
              </div>
              <Badge 
                variant="outline" 
                className={cn("text-xs", getImpactColor(data.impact))}
              >
                {data.impact.toUpperCase()}
              </Badge>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Cambio</span>
                <span className={cn(
                  "font-mono font-semibold flex items-center gap-1",
                  data.change >= 0 ? "text-accent" : "text-destructive"
                )}>
                  {data.change >= 0 ? '+' : ''}{data.change.toFixed(2)}%
                </span>
              </div>

              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Tendencia</span>
                <div className="flex items-center gap-1">
                  {getTrendIcon(data.trend)}
                  <span className="text-xs capitalize">{data.trend}</span>
                </div>
              </div>

              <div className="pt-3 border-t border-border">
                <p className="text-xs text-muted-foreground mb-2">
                  Última actualización: {new Date(data.date).toLocaleString()}
                </p>
              </div>
            </div>
          </Card>
        ))}
      </div>

      <Card className="p-6 bg-card/50 backdrop-blur-sm">
        <h3 className="font-heading font-semibold text-lg mb-4">ANÁLISIS GLOBAL</h3>
        <div className="space-y-4">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium">Condiciones Monetarias</span>
              <Badge variant="outline" className="border-accent text-accent">ACOMODATICIAS</Badge>
            </div>
            <p className="text-xs text-muted-foreground">
              Los tipos de interés se mantienen en niveles elevados pero la liquidez global muestra signos de recuperación.
            </p>
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium">Ciclo Económico</span>
              <Badge variant="outline" className="border-yellow-400 text-yellow-400">EXPANSIÓN TARDÍA</Badge>
            </div>
            <p className="text-xs text-muted-foreground">
              El crecimiento económico se mantiene positivo pero la inflación persistente sugiere presiones en el sistema.
            </p>
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium">Sentimiento de Mercado</span>
              <Badge variant="outline" className="border-accent text-accent">OPTIMISTA</Badge>
            </div>
            <p className="text-xs text-muted-foreground">
              Los mercados anticipan un aterrizaje suave con reducción gradual de tipos de interés en los próximos trimestres.
            </p>
          </div>
        </div>
      </Card>
    </div>
  );
};
