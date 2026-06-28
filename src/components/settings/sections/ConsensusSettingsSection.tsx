import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';

export function ConsensusSettingsSection() {
  return (
    <div className="space-y-6">
      <div className="pb-2">
        <h3 className="font-heading font-bold text-2xl sm:text-3xl mb-2 tracking-tight">Consenso</h3>
        <p className="text-sm text-muted-foreground/80">
          Sistema de votacion, vetos y toma de decisiones colectivas
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        <Card className="p-4 sm:p-6 bg-card/50 backdrop-blur-sm border-border/50">
          <h4 className="font-heading font-semibold text-sm sm:text-base mb-4 sm:mb-5 tracking-wide text-foreground/90">
            CONFIGURACION DE CONSENSO
          </h4>

          <div className="space-y-4 sm:space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
              <div className="p-3 sm:p-4 bg-background/50 rounded-lg">
                <p className="text-xs text-muted-foreground uppercase tracking-wide mb-2">Umbral Minimo</p>
                <p className="font-mono font-bold text-lg sm:text-xl">60%</p>
                <p className="text-xs text-muted-foreground mt-1">Consenso requerido</p>
              </div>

              <div className="p-3 sm:p-4 bg-background/50 rounded-lg">
                <p className="text-xs text-muted-foreground uppercase tracking-wide mb-2">Sistema de Veto</p>
                <Badge variant="outline" className="border-accent text-accent text-xs">
                  Activo
                </Badge>
                <p className="text-xs text-muted-foreground mt-1">3 agentes con veto</p>
              </div>

              <div className="p-3 sm:p-4 bg-background/50 rounded-lg">
                <p className="text-xs text-muted-foreground uppercase tracking-wide mb-2">Director Override</p>
                <Badge variant="outline" className="border-warning text-warning text-xs">
                  Habilitado
                </Badge>
                <p className="text-xs text-muted-foreground mt-1">Autoridad maxima</p>
              </div>
            </div>

            <Separator />

            <div>
              <h5 className="font-medium mb-3 text-sm sm:text-base">Formula de Votacion</h5>
              <div className="p-3 sm:p-4 bg-background/50 rounded-lg font-mono text-xs sm:text-sm">
                <p className="mb-2">
                  Weighted Vote = <span className="text-primary">Influence</span> x{' '}
                  <span className="text-accent">Reputation</span> x{' '}
                  <span className="text-warning">Confidence</span>
                </p>
                <p className="text-xs text-muted-foreground">
                  El consenso final se calcula sumando los votos ponderados de todos los agentes
                </p>
              </div>
            </div>
          </div>
        </Card>

        <Card className="p-4 sm:p-6 bg-card/50 backdrop-blur-sm border-border/50">
          <h4 className="font-heading font-semibold text-sm sm:text-base mb-4 sm:mb-5 tracking-wide text-foreground/90">
            AGENTES CON PODER DE VETO
          </h4>

          <div className="space-y-2">
            <div className="flex items-center justify-between p-3 bg-background/50 rounded-lg">
              <span className="text-sm font-medium">Supervivencia</span>
              <Badge variant="outline" className="border-warning text-warning text-xs">
                Veto Critico
              </Badge>
            </div>
            <div className="flex items-center justify-between p-3 bg-background/50 rounded-lg">
              <span className="text-sm font-medium">Riesgo</span>
              <Badge variant="outline" className="border-warning text-warning text-xs">
                Veto Critico
              </Badge>
            </div>
            <div className="flex items-center justify-between p-3 bg-background/50 rounded-lg">
              <span className="text-sm font-medium">Auditor</span>
              <Badge variant="outline" className="border-warning text-warning text-xs">
                Veto Critico
              </Badge>
            </div>
            <div className="flex items-center justify-between p-3 bg-background/50 rounded-lg">
              <span className="text-sm font-medium">Director</span>
              <Badge variant="outline" className="border-destructive text-destructive text-xs">
                Override Absoluto
              </Badge>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
