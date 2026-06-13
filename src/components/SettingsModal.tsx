import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Card } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { AgentAssignmentConfig } from '@/components/AgentAssignmentConfig';
import type { Agent, SystemConfig, OrganizationalProfile } from '@/lib/types';
import { formatCurrency } from '@/lib/mockData';

interface SettingsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  config: SystemConfig;
  agents: Agent[];
  onSimulationToggle: (enabled: boolean) => void;
  onUpdateAgent: (agentId: string, updates: Partial<Agent>) => void;
  onProfileChange: (profile: OrganizationalProfile) => void;
}

export function SettingsModal({
  open,
  onOpenChange,
  config,
  agents,
  onSimulationToggle,
  onUpdateAgent,
  onProfileChange,
}: SettingsModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-heading font-bold text-2xl">
            CONFIGURACIÓN DEL SISTEMA
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-4">
          <Card className="p-6 bg-card/50 backdrop-blur-sm">
            <h3 className="font-heading font-semibold text-lg mb-4">AGENT ASSIGNMENT & ORGANIZATION</h3>
            <AgentAssignmentConfig
              agents={agents}
              onUpdateAgent={onUpdateAgent}
              onProfileChange={onProfileChange}
              currentProfile={config.organization?.profile ?? 'balanced'}
            />
          </Card>

          <Card className="p-6 bg-card/50 backdrop-blur-sm">
            <h3 className="font-heading font-semibold text-lg mb-4">MODO DE OPERACIÓN</h3>

            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Modo de Operación</p>
                  <p className="text-sm text-muted-foreground">
                    Ejecutar en simulación sin riesgo real
                  </p>
                </div>
                <Switch
                  checked={config.simulationMode}
                  onCheckedChange={onSimulationToggle}
                />
              </div>

              <Separator />

              <div className="space-y-4">
                <div>
                  <p className="text-sm font-medium mb-2">Capital Inicial</p>
                  <p className="font-mono text-lg">{formatCurrency(config.totalCapital)}</p>
                </div>

                <div>
                  <p className="text-sm font-medium mb-2">Reserva de Supervivencia</p>
                  <p className="font-mono text-lg">{config.survivalReservePercent}%</p>
                </div>

                <div>
                  <p className="text-sm font-medium mb-2">Riesgo Máximo por Operación</p>
                  <p className="font-mono text-lg">{config.maxRiskPerOperation}%</p>
                </div>

                <div>
                  <p className="text-sm font-medium mb-2">Límite de Pérdida Diaria</p>
                  <p className="font-mono text-lg">{config.dailyLossLimit}%</p>
                </div>
              </div>

              <Separator />

              <div>
                <h4 className="font-medium mb-4">Integración Telegram</h4>
                <div className="p-4 bg-background/50 rounded-lg">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-sm text-muted-foreground">Estado de Conexión</span>
                    <span className="text-xs px-2 py-1 rounded border border-destructive/50 text-destructive">
                      No conectado
                    </span>
                  </div>
                  <Button variant="outline" className="w-full" disabled>
                    Configurar
                  </Button>
                </div>
              </div>
            </div>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  );
}
