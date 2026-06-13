import { Card } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import type { ConsensusDistribution } from '@/lib/types';
import { cn } from '@/lib/utils';

interface ConsensusPanelProps {
  distribution: ConsensusDistribution;
  className?: string;
}

export function ConsensusPanel({ distribution, className }: ConsensusPanelProps) {
  const total = distribution.buy + distribution.sell + distribution.hold + 
                distribution.reducePosition + distribution.increasePosition + distribution.veto;
  
  const getPercentage = (value: number) => total > 0 ? (value / total) * 100 : 0;
  
  const items = [
    { label: 'COMPRAR', value: distribution.buy, color: 'bg-accent', textColor: 'text-accent' },
    { label: 'VENDER', value: distribution.sell, color: 'bg-destructive', textColor: 'text-destructive' },
    { label: 'MANTENER', value: distribution.hold, color: 'bg-primary', textColor: 'text-primary' },
    { label: 'REDUCIR', value: distribution.reducePosition, color: 'bg-warning', textColor: 'text-warning' },
    { label: 'AUMENTAR', value: distribution.increasePosition, color: 'bg-accent/70', textColor: 'text-accent/70' },
    { label: 'VETO', value: distribution.veto, color: 'bg-destructive/80', textColor: 'text-destructive' },
  ];

  return (
    <Card className={cn('p-6 bg-card/50 backdrop-blur-sm', className)}>
      <h3 className="font-heading font-semibold text-lg mb-4">CONSENSO DE AGENTES</h3>
      
      <div className="space-y-4">
        {items.map(item => {
          const percentage = getPercentage(item.value);
          return percentage > 0 ? (
            <div key={item.label}>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">{item.label}</span>
                <span className={cn('font-mono text-sm font-semibold', item.textColor)}>
                  {percentage.toFixed(1)}%
                </span>
              </div>
              <div className="relative h-3 bg-background rounded-full overflow-hidden">
                <div 
                  className={cn('h-full transition-all duration-500 rounded-full', item.color)}
                  style={{ width: `${percentage}%` }}
                />
              </div>
            </div>
          ) : null;
        })}
      </div>
      
      <div className="mt-6 p-4 bg-background/50 rounded-lg">
        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">Total de Votos</span>
          <span className="font-mono font-semibold">{total}</span>
        </div>
      </div>
    </Card>
  );
}
