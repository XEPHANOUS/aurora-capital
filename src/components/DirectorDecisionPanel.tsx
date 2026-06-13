import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import type { DirectorDecision } from '@/lib/types';
import { CheckCircle, XCircle, Circle } from '@phosphor-icons/react';
import { cn } from '@/lib/utils';

interface DirectorDecisionPanelProps {
  decision: DirectorDecision;
  className?: string;
}

export function DirectorDecisionPanel({ decision, className }: DirectorDecisionPanelProps) {
  const actionColors = {
    BUY: 'border-accent text-accent',
    SELL: 'border-destructive text-destructive',
    HOLD: 'border-primary text-primary',
    'REDUCE POSITION': 'border-warning text-warning',
    'INCREASE POSITION': 'border-accent text-accent',
    VETO: 'border-destructive text-destructive',
  };

  const qualityLevel =
    decision.qualityScore >= 80 ? { label: 'ALTA', color: 'text-accent' } :
    decision.qualityScore >= 50 ? { label: 'MEDIA', color: 'text-warning' } :
    { label: 'BAJA', color: 'text-destructive' };

  return (
    <Card className={cn('p-6 bg-card/50 backdrop-blur-sm border-primary/30', className)}>
      <h3 className="font-heading font-semibold text-lg mb-4">DECISIÓN DEL DIRECTOR</h3>
      
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div>
          <p className="text-xs text-muted-foreground uppercase tracking-wide mb-2">Acción Final</p>
          <Badge 
            variant="outline" 
            className={cn('text-sm px-3 py-1', actionColors[decision.finalAction])}
          >
            {decision.finalAction}
          </Badge>
        </div>
        
        <div>
          <p className="text-xs text-muted-foreground uppercase tracking-wide mb-2">Consenso</p>
          <div className="flex items-center gap-2">
            <div className="flex-1 h-2 bg-background rounded-full overflow-hidden">
              <div 
                className="h-full bg-primary rounded-full transition-all duration-500"
                style={{ width: `${decision.consensusScore}%` }}
              />
            </div>
            <span className="font-mono text-sm font-semibold">{decision.consensusScore.toFixed(0)}%</span>
          </div>
        </div>
        
        <div>
          <p className="text-xs text-muted-foreground uppercase tracking-wide mb-2">Calidad</p>
          <div className="flex items-center gap-2">
            <div className="flex-1 h-2 bg-background rounded-full overflow-hidden">
              <div 
                className={cn(
                  'h-full rounded-full transition-all duration-500',
                  decision.qualityScore >= 80 ? 'bg-accent' :
                  decision.qualityScore >= 50 ? 'bg-warning' : 'bg-destructive'
                )}
                style={{ width: `${decision.qualityScore}%` }}
              />
            </div>
            <span className={cn('text-sm font-semibold', qualityLevel.color)}>
              {qualityLevel.label}
            </span>
          </div>
        </div>
      </div>
      
      <Separator className="my-6" />
      
      <div className="space-y-4">
        <div>
          <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3">
            Factores de Apoyo
          </h4>
          <div className="space-y-2">
            {decision.supportingFactors.map((factor, i) => (
              <div key={i} className="flex items-start gap-2">
                <CheckCircle size={16} className="text-accent flex-shrink-0 mt-0.5" weight="fill" />
                <p className="text-sm">{factor}</p>
              </div>
            ))}
          </div>
        </div>
        
        <div>
          <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3">
            Factores de Riesgo
          </h4>
          <div className="space-y-2">
            {decision.riskFactors.map((factor, i) => (
              <div key={i} className="flex items-start gap-2">
                <XCircle size={16} className="text-warning flex-shrink-0 mt-0.5" weight="fill" />
                <p className="text-sm">{factor}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
      
      <Separator className="my-6" />
      
      <div>
        <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3">
          Explicación de la Decisión
        </h4>
        <p className="text-sm leading-relaxed bg-background/50 p-4 rounded-lg">
          {decision.explanation}
        </p>
      </div>
    </Card>
  );
}
