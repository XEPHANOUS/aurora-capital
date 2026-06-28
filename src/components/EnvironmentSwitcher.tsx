import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from '@/components/ui/dropdown-menu';
import { Circle, CaretDown } from '@phosphor-icons/react';
import { cn } from '@/lib/utils';
import type { EnvironmentType } from '@/lib/types';
import { ENVIRONMENT_CONFIGS, getEnvironmentDescription } from '@/lib/services/environmentManager';

interface EnvironmentSwitcherProps {
  currentEnvironment: EnvironmentType;
  onEnvironmentChange: (env: EnvironmentType) => void;
}

export function EnvironmentSwitcher({
  currentEnvironment,
  onEnvironmentChange,
}: EnvironmentSwitcherProps) {
  const current = ENVIRONMENT_CONFIGS[currentEnvironment];
  
  const getRiskLevelColor = (riskLevel: string) => {
    switch (riskLevel) {
      case 'none':
        return 'text-accent border-accent';
      case 'low':
        return 'text-primary border-primary';
      case 'medium':
        return 'text-warning border-warning';
      case 'high':
        return 'text-destructive border-destructive';
      default:
        return 'text-muted-foreground border-muted-foreground';
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          className={cn(
            'gap-2 px-4 py-2 font-mono border-2 transition-all',
            getRiskLevelColor(current.riskLevel)
          )}
          style={{
            backgroundColor: `color-mix(in oklch, ${current.color} 10%, transparent)`,
          }}
        >
          <Circle size={10} weight="fill" className="animate-pulse-subtle" />
          <span className="font-bold tracking-wide">{current.badge}</span>
          <CaretDown size={16} weight="bold" />
        </Button>
      </DropdownMenuTrigger>
      
      <DropdownMenuContent align="end" className="w-80 bg-card/95 backdrop-blur-sm">
        <DropdownMenuLabel className="font-heading">
          ENTORNO DE OPERACIÓN
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        
        {(Object.keys(ENVIRONMENT_CONFIGS) as EnvironmentType[]).map((envKey) => {
          const env = ENVIRONMENT_CONFIGS[envKey];
          const isActive = envKey === currentEnvironment;
          
          return (
            <DropdownMenuItem
              key={envKey}
              onClick={() => onEnvironmentChange(envKey)}
              className={cn(
                'flex flex-col items-start gap-2 p-3 cursor-pointer',
                isActive && 'bg-accent/10'
              )}
            >
              <div className="flex items-center justify-between w-full">
                <div className="flex items-center gap-2">
                  <span className="text-xl">{env.icon}</span>
                  <span className="font-semibold font-heading">{env.name}</span>
                </div>
                {isActive && (
                  <Badge
                    variant="outline"
                    className={cn('text-xs', getRiskLevelColor(env.riskLevel))}
                  >
                    ACTIVO
                  </Badge>
                )}
              </div>
              
              <p className="text-xs text-muted-foreground">
                {env.description}
              </p>
              
              <div className="flex flex-wrap gap-1 mt-1">
                {env.features.updatesReputation && (
                  <Badge variant="secondary" className="text-xs">
                    Actualiza reputación
                  </Badge>
                )}
                {env.features.realMoney && (
                  <Badge variant="destructive" className="text-xs">
                    Capital real
                  </Badge>
                )}
                {env.features.generatesOrders && !env.features.executesOrders && (
                  <Badge variant="outline" className="text-xs border-warning text-warning">
                    Genera órdenes
                  </Badge>
                )}
                {env.features.executesOrders && (
                  <Badge variant="destructive" className="text-xs">
                    Ejecuta real
                  </Badge>
                )}
              </div>
              
              <div className="text-xs text-muted-foreground mt-1 leading-tight">
                {getEnvironmentDescription(envKey)}
              </div>
            </DropdownMenuItem>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
