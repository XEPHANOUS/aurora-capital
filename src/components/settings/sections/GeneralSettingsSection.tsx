import { useEffect, useMemo, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import type { SystemConfig } from '@/lib/types';
import { formatCurrency } from '@/lib/mockData';
import { TelegramConfigModal } from '@/components/settings/telegram/TelegramConfigModal';
import { getRuntimeTelegramService, type TelegramRuntimeHealth } from '@/runtime/services/telegramRuntimeService';

interface GeneralSettingsSectionProps {
  config: SystemConfig;
  onSimulationToggle: (enabled: boolean) => void;
  onTelegramConfigSave: (payload: {
    botToken?: string;
    allowedUserId?: number;
    mode: 'polling' | 'webhook';
    webhookUrl?: string;
    pollingEnabled: boolean;
    lastCheckAt?: string;
    lastError?: string;
    botId?: number;
    botName?: string;
    botUsername?: string;
    status: 'connected' | 'disconnected' | 'not-configured' | 'error';
  }) => void;
}

export function GeneralSettingsSection({ config, onSimulationToggle, onTelegramConfigSave }: GeneralSettingsSectionProps) {
  const telegramService = useMemo(() => getRuntimeTelegramService(), []);
  const [telegramModalOpen, setTelegramModalOpen] = useState(false);
  const [telegramHealth, setTelegramHealth] = useState<TelegramRuntimeHealth>(telegramService.getHealth());

  useEffect(() => {
    const refresh = () => {
      setTelegramHealth(telegramService.getHealth());
    };

    refresh();
    const timer = setInterval(refresh, 3_000);
    return () => clearInterval(timer);
  }, [telegramService]);

  const telegramStatusLabel =
    telegramHealth.status === 'connected'
      ? 'Connected'
      : telegramHealth.status === 'disconnected'
      ? 'Disconnected'
      : telegramHealth.status === 'error'
      ? 'Error'
      : 'Not Configured';

  const telegramStatusClassName =
    telegramHealth.status === 'connected'
      ? 'border-emerald-500/50 text-emerald-500'
      : telegramHealth.status === 'error'
      ? 'border-destructive/50 text-destructive'
      : 'border-muted-foreground/30 text-muted-foreground';

  return (
    <div className="space-y-6">
      <div className="pb-2">
        <h3 className="font-heading font-bold text-2xl sm:text-3xl mb-2 tracking-tight">General</h3>
        <p className="text-sm text-muted-foreground/80">
          Configuracion basica del sistema de trading autonomo
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        <Card className="p-4 sm:p-6 bg-card/50 backdrop-blur-sm border-border/50">
          <h4 className="font-heading font-semibold text-sm sm:text-base mb-4 sm:mb-5 tracking-wide text-foreground/90">
            MODO DE OPERACION
          </h4>

          <div className="space-y-4 sm:space-y-6">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1">
                <p className="font-medium mb-1 text-sm sm:text-base">Modo Simulacion</p>
                <p className="text-xs sm:text-sm text-muted-foreground">
                  Ejecutar operaciones en modo simulado sin riesgo real. Desactivar para operar con capital real.
                </p>
              </div>
              <Switch checked={config.simulationMode} onCheckedChange={onSimulationToggle} />
            </div>

            <Separator />

            <div className="space-y-3">
              <div className="p-3 sm:p-4 bg-background/50 rounded-lg">
                <p className="text-xs text-muted-foreground uppercase tracking-wide mb-2">Capital Inicial</p>
                <p className="font-mono font-bold text-lg sm:text-xl">{formatCurrency(config.totalCapital)}</p>
                <p className="text-xs text-muted-foreground mt-1">Configurado por entorno</p>
              </div>

              <div className="p-3 sm:p-4 bg-background/50 rounded-lg">
                <p className="text-xs text-muted-foreground uppercase tracking-wide mb-2">Estado del Sistema</p>
                <Badge variant="outline" className="border-accent text-accent">
                  Activo
                </Badge>
                <p className="text-xs text-muted-foreground mt-1">Todos los sistemas operativos</p>
              </div>
            </div>
          </div>
        </Card>

        <Card className="p-4 sm:p-6 bg-card/50 backdrop-blur-sm border-border/50">
          <h4 className="font-heading font-semibold text-sm sm:text-base mb-4 sm:mb-5 tracking-wide text-foreground/90">
            INTEGRACIONES
          </h4>

          <div className="space-y-4">
            <div className="p-3 sm:p-4 bg-background/50 rounded-lg">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <p className="font-medium mb-1 text-sm sm:text-base">Telegram</p>
                  <p className="text-xs text-muted-foreground">Notificaciones y control remoto</p>
                </div>
                <Badge variant="outline" className={`text-xs ${telegramStatusClassName}`}>
                  {telegramStatusLabel}
                </Badge>
              </div>
              <div className="space-y-2">
                <p className="text-xs text-muted-foreground">
                  Modo: {telegramHealth.mode} · Polling {telegramHealth.pollingEnabled ? 'activo' : 'inactivo'}
                </p>
                <p className="text-xs text-muted-foreground">
                  Ultima comprobacion:{' '}
                  {telegramHealth.lastCheckAt ? new Date(telegramHealth.lastCheckAt).toLocaleString('es-ES') : 'N/A'}
                </p>
              </div>
              <Button variant="outline" className="w-full text-sm" onClick={() => setTelegramModalOpen(true)}>
                Configurar Telegram
              </Button>
            </div>
          </div>
        </Card>
      </div>

      <TelegramConfigModal
        open={telegramModalOpen}
        onOpenChange={setTelegramModalOpen}
        onSaved={(payload) => {
          setTelegramHealth(telegramService.getHealth());
          onTelegramConfigSave(payload);
        }}
      />
    </div>
  );
}
