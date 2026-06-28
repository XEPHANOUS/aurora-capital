import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { Shield } from '@phosphor-icons/react';

interface SurvivalGaugeProps {
  health: number;
  reserveAmount: number;
  totalCapital: number;
}

export function SurvivalGauge({ health, reserveAmount, totalCapital }: SurvivalGaugeProps) {
  const circumference = 2 * Math.PI * 45;
  const offset = circumference - (health / 100) * circumference;
  
  const getHealthColor = () => {
    if (health >= 80) return 'text-accent';
    if (health >= 50) return 'text-yellow-400';
    return 'text-destructive';
  };
  
  const getGlowColor = () => {
    if (health >= 80) return '#47E0A0';
    if (health >= 50) return '#facc15';
    return '#ef4444';
  };
  
  return (
    <Card className="p-6 bg-card/50 backdrop-blur-sm border-warning/30">
      <div className="flex items-center gap-2 mb-4">
        <Shield size={24} weight="duotone" className="text-warning" />
        <h3 className="font-heading font-semibold text-lg text-foreground">SUPERVIVENCIA</h3>
      </div>
      
      <div className="flex flex-col items-center gap-4">
        <div className="relative w-32 h-32">
          <svg className="w-full h-full transform -rotate-90">
            <circle
              cx="64"
              cy="64"
              r="45"
              fill="none"
              stroke="currentColor"
              strokeWidth="8"
              className="text-muted/20"
            />
            <circle
              cx="64"
              cy="64"
              r="45"
              fill="none"
              stroke={getGlowColor()}
              strokeWidth="8"
              strokeLinecap="round"
              strokeDasharray={circumference}
              strokeDashoffset={offset}
              className={cn('transition-all duration-1000', getHealthColor())}
              style={{
                filter: `drop-shadow(0 0 8px ${getGlowColor()})`,
              }}
            />
          </svg>
          
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className={cn('font-mono font-bold text-3xl', getHealthColor())}>
              {Math.round(health)}
            </span>
            <span className="text-xs text-muted-foreground uppercase tracking-wide">
              {health >= 80 ? 'Excelente' : health >= 50 ? 'Estable' : 'Crítico'}
            </span>
          </div>
        </div>
        
        <div className="w-full space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">RESERVA PROTEGIDA</span>
            <span className="font-mono font-semibold text-foreground">
              {reserveAmount.toLocaleString('es-ES')} €
            </span>
          </div>
          
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">LÍMITE OPERATIVO</span>
            <span className="font-mono font-semibold text-foreground">
              {(totalCapital - reserveAmount).toLocaleString('es-ES')} €
            </span>
          </div>
          
          <div className="pt-2 border-t border-border/50">
            <p className="text-xs text-muted-foreground text-center">
              No operativo
            </p>
          </div>
        </div>
        
        {health < 50 && (
          <div className="w-full p-2 bg-destructive/10 border border-destructive/30 rounded-md">
            <p className="text-xs text-destructive text-center font-medium">
              ⚠️ Estado de supervivencia comprometido
            </p>
          </div>
        )}
      </div>
    </Card>
  );
}
