import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import type { EnvironmentType } from '@/lib/types';
import type { EnvironmentOverview } from '@/components/settings/types';
import type { AutoExecutionLogAction, AutoExecutionStatus, EnvironmentExecutionProvider, PlatformConfig } from '@/lib/platformConfig';
import { ENVIRONMENT_CONFIGS, OPERABLE_ENVIRONMENTS } from '@/lib/services/environmentManager';
import { formatCurrency, formatPercent } from '@/lib/mockData';
import { cn } from '@/lib/utils';

interface EnvironmentSettingsSectionProps {
  activeEnvironment?: EnvironmentType;
  environmentOverview: Record<EnvironmentType, EnvironmentOverview>;
  platformConfig: PlatformConfig;
  onPlatformConfigChange: (updater: (current: PlatformConfig) => PlatformConfig) => void;
  onSelectEnvironment: (environment: EnvironmentType) => void;
}

const PROVIDER_OPTIONS: Array<{ value: EnvironmentExecutionProvider; label: string }> = [
  { value: 'sandbox-provider', label: 'Sandbox Provider' },
  { value: 'demo-provider', label: 'Demo Provider' },
  { value: 'alpaca-paper-provider', label: 'Alpaca Paper Provider' },
  { value: 'broker-provider', label: 'Broker Provider (futuro)' },
];

function environmentStatusTone(status: EnvironmentOverview['status']): string {
  if (status === 'running') return 'border-accent text-accent';
  if (status === 'paused') return 'border-warning text-warning';
  return 'border-muted-foreground text-muted-foreground';
}

function autoExecutionTone(status: AutoExecutionStatus): string {
  if (status === 'running') return 'border-accent text-accent';
  if (status === 'paused') return 'border-warning text-warning';
  return 'border-muted-foreground text-muted-foreground';
}

function providerLabel(provider: EnvironmentExecutionProvider): string {
  return PROVIDER_OPTIONS.find((option) => option.value === provider)?.label ?? provider;
}

export function EnvironmentSettingsSection({
  activeEnvironment = 'sandbox',
  environmentOverview,
  platformConfig,
  onPlatformConfigChange,
  onSelectEnvironment,
}: EnvironmentSettingsSectionProps) {
  const updateProvider = (environment: EnvironmentType, provider: EnvironmentExecutionProvider) => {
    onPlatformConfigChange((current) => ({
      ...current,
      updatedAt: new Date().toISOString(),
      environmentsConfig: {
        ...current.environmentsConfig,
        [environment]: {
          ...current.environmentsConfig[environment],
          executionProvider: provider,
        },
      },
    }));
  };

  const markActiveEnvironment = (environment: EnvironmentType) => {
    if (environment === 'real') {
      return;
    }

    onSelectEnvironment(environment);
    onPlatformConfigChange((current) => ({
      ...current,
      updatedAt: new Date().toISOString(),
      environmentsConfig: {
        ...current.environmentsConfig,
        activeEnvironment: environment,
      },
    }));
  };

  const setEngineStatus = (environment: EnvironmentType, status: AutoExecutionStatus) => {
    onPlatformConfigChange((current) => {
      if (environment === 'real' && status !== 'stopped') {
        return current;
      }

      const logAction: AutoExecutionLogAction = status === 'stopped' ? 'blocked' : 'entry';

      return {
        ...current,
        updatedAt: new Date().toISOString(),
        autoExecution: {
          ...current.autoExecution,
          [environment]: {
            ...current.autoExecution[environment],
            status,
          },
          logs: [
            {
              id: `engine-${environment}-${Date.now()}`,
              environment,
              asset: 'SYSTEM',
              action: logAction,
              entryAmount: 0,
              reason:
                status === 'running'
                  ? 'Auto Execution Engine iniciado'
                  : status === 'paused'
                  ? 'Auto Execution Engine pausado'
                  : 'Auto Execution Engine detenido',
              timestamp: new Date().toISOString(),
            },
            ...current.autoExecution.logs,
          ].slice(0, 250),
        },
      };
    });
  };

  const engineLogs = platformConfig.autoExecution.logs
    .slice(0, 20)
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

  return (
    <div className="space-y-6">
      <div className="pb-2">
        <h3 className="font-heading font-bold text-2xl sm:text-3xl mb-2 tracking-tight">Entornos</h3>
        <p className="text-sm text-muted-foreground/80">
          Configuracion operativa de Sandbox, Demo y Paper Live. El modo Real se mantiene bloqueado por seguridad.
        </p>
      </div>

      <Card className="p-5 bg-card/50 backdrop-blur-sm border-border/50">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h4 className="font-heading font-semibold text-base">Entorno Activo</h4>
            <p className="text-xs text-muted-foreground mt-1">Seleccion actual para decisiones y ejecucion virtual.</p>
          </div>
          <Badge variant="outline" className="border-primary text-primary uppercase">
            {ENVIRONMENT_CONFIGS[activeEnvironment].name}
          </Badge>
        </div>
      </Card>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 sm:gap-6">
        {OPERABLE_ENVIRONMENTS.map((environment) => {
          const overview = environmentOverview[environment];
          const config = ENVIRONMENT_CONFIGS[environment];
          const providerConfig = platformConfig.environmentsConfig[environment];
          const isActive = activeEnvironment === environment;

          return (
            <Card
              key={environment}
              className={cn(
                'p-4 sm:p-6 bg-card/50 backdrop-blur-sm border-border/50',
                isActive && 'border-primary/60 shadow-[0_0_0_1px_hsl(var(--primary)/0.35)]',
              )}
            >
              <div className="flex items-start justify-between gap-3 mb-4">
                <div>
                  <h4 className="font-heading font-semibold text-sm sm:text-base tracking-wide text-foreground/90">
                    {config.icon} {config.name}
                  </h4>
                  <p className="text-xs text-muted-foreground mt-1">{config.description}</p>
                </div>
                <Badge variant="outline" className={environmentStatusTone(overview.status)}>
                  {overview.status.toUpperCase()}
                </Badge>
              </div>

              <div className="grid grid-cols-2 gap-3 mb-4">
                <div className="p-3 bg-background/50 rounded-lg">
                  <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">Capital inicial</p>
                  <p className="font-mono text-sm font-semibold">{formatCurrency(overview.initialCapital)}</p>
                </div>
                <div className="p-3 bg-background/50 rounded-lg">
                  <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">Capital actual</p>
                  <p className="font-mono text-sm font-semibold">{formatCurrency(overview.currentCapital)}</p>
                </div>
                <div className="p-3 bg-background/50 rounded-lg">
                  <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">Posiciones</p>
                  <p className="font-mono text-sm font-semibold">{overview.positions}</p>
                </div>
                <div className="p-3 bg-background/50 rounded-lg">
                  <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">PnL</p>
                  <p className={cn('font-mono text-sm font-semibold', overview.pnl >= 0 ? 'text-accent' : 'text-destructive')}>
                    {formatPercent(overview.pnl)}
                  </p>
                </div>
              </div>

              <Separator className="my-4" />

              <div className="space-y-3">
                <div>
                  <p className="text-xs text-muted-foreground uppercase tracking-wide mb-2">Execution Provider</p>
                  <Select
                    value={providerConfig.executionProvider}
                    onValueChange={(value) => updateProvider(environment, value as EnvironmentExecutionProvider)}
                    disabled={environment === 'real'}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecciona provider" />
                    </SelectTrigger>
                    <SelectContent>
                      {PROVIDER_OPTIONS.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground mt-1">Actual: {providerLabel(providerConfig.executionProvider)}</p>
                </div>

                <Button
                  className="w-full"
                  variant={isActive ? 'outline' : 'default'}
                  onClick={() => markActiveEnvironment(environment)}
                  disabled={environment === 'real'}
                >
                  {environment === 'real' ? 'Real deshabilitado' : isActive ? 'Entorno activo' : 'Activar entorno'}
                </Button>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <p className="text-xs text-muted-foreground uppercase tracking-wide">Auto Execution Engine</p>
                    <Badge variant="outline" className={autoExecutionTone(platformConfig.autoExecution[environment].status)}>
                      {platformConfig.autoExecution[environment].status.toUpperCase()}
                    </Badge>
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setEngineStatus(environment, 'running')}
                      disabled={environment === 'real'}
                    >
                      Running
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setEngineStatus(environment, 'paused')}
                      disabled={environment === 'real'}
                    >
                      Paused
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setEngineStatus(environment, 'stopped')}
                    >
                      Stopped
                    </Button>
                  </div>
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      <Card className="p-5 bg-card/50 backdrop-blur-sm border-border/50">
        <div className="flex items-center justify-between gap-3 mb-4">
          <div>
            <h4 className="font-heading font-semibold text-base">Registro de Auto Execution</h4>
            <p className="text-xs text-muted-foreground mt-1">Entradas, salidas, pnl y motivo por entorno.</p>
          </div>
          <Badge variant="outline">{engineLogs.length} eventos</Badge>
        </div>

        <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
          {engineLogs.length === 0 ? (
            <p className="text-sm text-muted-foreground">Sin eventos registrados todavia.</p>
          ) : (
            engineLogs.map((log) => (
              <div key={log.id} className="rounded-lg border border-border/60 bg-background/40 p-3">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold">
                      {log.environment.toUpperCase()} · {log.asset} · {log.action.toUpperCase()}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">{log.reason}</p>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {new Date(log.timestamp).toLocaleString('es-ES')}
                  </p>
                </div>
                <div className="mt-2 grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
                  <div className="rounded bg-background/60 p-2">Entrada: {formatCurrency(log.entryAmount)}</div>
                  <div className="rounded bg-background/60 p-2">Salida: {log.exitAmount !== undefined ? formatCurrency(log.exitAmount) : 'N/D'}</div>
                  <div className={cn('rounded p-2', log.pnlAmount !== undefined && log.pnlAmount < 0 ? 'bg-destructive/10 text-destructive' : 'bg-accent/10 text-accent')}>
                    PnL: {log.pnlAmount !== undefined ? formatCurrency(log.pnlAmount) : 'N/D'}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </Card>
    </div>
  );
}
