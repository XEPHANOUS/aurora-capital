import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';
import type { EnvironmentType } from '@/lib/types';
import type { AutoExecutionStatus, PlatformConfig } from '@/lib/platformConfig';
import { ENVIRONMENT_CONFIGS } from '@/lib/services/environmentManager';

interface ModeControlMenuProps {
  activeEnvironment: EnvironmentType;
  platformConfig: PlatformConfig;
  simulationMode: boolean;
  onToggleSimulationMode: (enabled: boolean) => void;
  onSetAutoExecutionStatus: (status: AutoExecutionStatus) => void;
  onSetKillSwitch: (enabled: boolean) => void;
  onSetStopAutoTrading: (enabled: boolean) => void;
  onSetEnvironmentEnabled: (environment: EnvironmentType, enabled: boolean) => void;
  onSwitchEnvironment: (environment: EnvironmentType) => void;
}

const MODE_ENVIRONMENTS: EnvironmentType[] = ['sandbox', 'demo', 'paper'];

export function ModeControlMenu({
  activeEnvironment,
  platformConfig,
  simulationMode,
  onToggleSimulationMode,
  onSetAutoExecutionStatus,
  onSetKillSwitch,
  onSetStopAutoTrading,
  onSetEnvironmentEnabled,
  onSwitchEnvironment,
}: ModeControlMenuProps) {
  const activeEngine = platformConfig.autoExecution[activeEnvironment].status;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" className="font-heading font-semibold text-xs uppercase tracking-wider">
          Modos
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" className="min-w-[280px]">
        <DropdownMenuLabel>Operacion</DropdownMenuLabel>
        <DropdownMenuCheckboxItem
          checked={simulationMode}
          onCheckedChange={(checked) => onToggleSimulationMode(Boolean(checked))}
        >
          Simulacion activa
        </DropdownMenuCheckboxItem>

        <DropdownMenuSeparator />

        <DropdownMenuLabel>Entorno Activo</DropdownMenuLabel>
        {MODE_ENVIRONMENTS.map((environment) => {
          const isActive = activeEnvironment === environment;
          const isEnabled = platformConfig.environmentsConfig[environment].enabled;

          return (
            <DropdownMenuItem
              key={environment}
              disabled={!isEnabled}
              onClick={() => onSwitchEnvironment(environment)}
              className={cn(isActive && 'bg-primary/10 text-primary')}
            >
              {ENVIRONMENT_CONFIGS[environment].icon} {ENVIRONMENT_CONFIGS[environment].name}
              {!isEnabled ? ' (deshabilitado)' : ''}
            </DropdownMenuItem>
          );
        })}

        <DropdownMenuSeparator />

        <DropdownMenuLabel>Auto Execution ({ENVIRONMENT_CONFIGS[activeEnvironment].name})</DropdownMenuLabel>
        <DropdownMenuRadioGroup value={activeEngine} onValueChange={(value) => onSetAutoExecutionStatus(value as AutoExecutionStatus)}>
          <DropdownMenuRadioItem value="running">Running</DropdownMenuRadioItem>
          <DropdownMenuRadioItem value="paused">Paused</DropdownMenuRadioItem>
          <DropdownMenuRadioItem value="stopped">Stopped</DropdownMenuRadioItem>
        </DropdownMenuRadioGroup>

        <DropdownMenuSeparator />

        <DropdownMenuLabel>Seguridad</DropdownMenuLabel>
        <DropdownMenuCheckboxItem
          checked={platformConfig.securityConfig.killSwitchEnabled}
          onCheckedChange={(checked) => onSetKillSwitch(Boolean(checked))}
        >
          Kill Switch
        </DropdownMenuCheckboxItem>
        <DropdownMenuCheckboxItem
          checked={platformConfig.securityConfig.stopAutoTradingEnabled}
          onCheckedChange={(checked) => onSetStopAutoTrading(Boolean(checked))}
        >
          Stop Auto Trading
        </DropdownMenuCheckboxItem>

        <DropdownMenuSeparator />

        <DropdownMenuLabel>Entornos Habilitados</DropdownMenuLabel>
        {MODE_ENVIRONMENTS.map((environment) => (
          <DropdownMenuCheckboxItem
            key={`enabled-${environment}`}
            checked={platformConfig.environmentsConfig[environment].enabled}
            onCheckedChange={(checked) => onSetEnvironmentEnabled(environment, Boolean(checked))}
          >
            {ENVIRONMENT_CONFIGS[environment].name}
          </DropdownMenuCheckboxItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
