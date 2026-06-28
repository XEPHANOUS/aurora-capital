import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ShieldCheck } from '@phosphor-icons/react';
import type { SystemConfig } from '@/lib/types';

interface TradingSettingsSectionProps {
  config: SystemConfig;
}

export function TradingSettingsSection({ config }: TradingSettingsSectionProps) {
  return (
    <div className="space-y-6">
      <div className="pb-2">
        <h3 className="font-heading font-bold text-2xl sm:text-3xl mb-2 tracking-tight">Trading</h3>
        <p className="text-sm text-muted-foreground/80">
          Parametros de riesgo, limites de operacion y protecciones
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        <Card className="p-4 sm:p-6 bg-card/50 backdrop-blur-sm border-border/50">
          <h4 className="font-heading font-semibold text-sm sm:text-base mb-4 sm:mb-5 tracking-wide text-foreground/90">
            PARAMETROS DE RIESGO
          </h4>

          <div className="space-y-4 sm:space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
              <div className="p-3 sm:p-4 bg-background/50 rounded-lg">
                <p className="text-xs text-muted-foreground uppercase tracking-wide mb-2">Reserva de Supervivencia</p>
                <p className="font-mono font-bold text-xl sm:text-2xl text-warning">
                  {config.survivalReservePercent}%
                </p>
                <p className="text-xs text-muted-foreground mt-1">Capital bloqueado intocable</p>
              </div>

              <div className="p-3 sm:p-4 bg-background/50 rounded-lg">
                <p className="text-xs text-muted-foreground uppercase tracking-wide mb-2">Capital Operativo</p>
                <p className="font-mono font-bold text-xl sm:text-2xl text-primary">
                  {100 - config.survivalReservePercent}%
                </p>
                <p className="text-xs text-muted-foreground mt-1">Disponible para trading</p>
              </div>
            </div>

            <Separator />

            <div className="space-y-4">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <p className="text-xs sm:text-sm font-medium">Riesgo Maximo por Operacion</p>
                  <p className="font-mono font-semibold text-base sm:text-lg">{config.maxRiskPerOperation}%</p>
                </div>
                <div className="h-2 bg-background rounded-full overflow-hidden">
                  <div className="h-full bg-warning rounded-full" style={{ width: `${config.maxRiskPerOperation}%` }} />
                </div>
                <p className="text-xs text-muted-foreground mt-1">Del capital operativo</p>
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <p className="text-xs sm:text-sm font-medium">Limite de Perdida Diaria</p>
                  <p className="font-mono font-semibold text-base sm:text-lg">{config.dailyLossLimit}%</p>
                </div>
                <div className="h-2 bg-background rounded-full overflow-hidden">
                  <div className="h-full bg-destructive rounded-full" style={{ width: `${config.dailyLossLimit}%` }} />
                </div>
                <p className="text-xs text-muted-foreground mt-1">Freno automatico</p>
              </div>
            </div>
          </div>
        </Card>

        <Card className="p-4 sm:p-6 bg-card/50 backdrop-blur-sm border-border/50">
          <h4 className="font-heading font-semibold text-sm sm:text-base mb-4 sm:mb-5 tracking-wide text-foreground/90">
            PROTECCIONES ACTIVAS
          </h4>

          <div className="space-y-3">
            <div className="flex items-center gap-2 p-3 bg-accent/10 border border-accent/30 rounded-lg">
              <ShieldCheck size={18} className="text-accent flex-shrink-0" />
              <span className="text-xs sm:text-sm font-medium">Veto de Supervivencia</span>
            </div>
            <div className="flex items-center gap-2 p-3 bg-accent/10 border border-accent/30 rounded-lg">
              <ShieldCheck size={18} className="text-accent flex-shrink-0" />
              <span className="text-xs sm:text-sm font-medium">Control de Riesgo</span>
            </div>
            <div className="flex items-center gap-2 p-3 bg-accent/10 border border-accent/30 rounded-lg">
              <ShieldCheck size={18} className="text-accent flex-shrink-0" />
              <span className="text-xs sm:text-sm font-medium">Auditoria Obligatoria</span>
            </div>
            <div className="flex items-center gap-2 p-3 bg-accent/10 border border-accent/30 rounded-lg">
              <ShieldCheck size={18} className="text-accent flex-shrink-0" />
              <span className="text-xs sm:text-sm font-medium">Limite Diario</span>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
