import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import type { SurvivalAnalysis } from '@/lib/types';
import { Shield, ShieldWarning, WarningCircle } from '@phosphor-icons/react';
import { cn } from '@/lib/utils';

interface SurvivalAnalysisPanelProps {
  analysis: SurvivalAnalysis;
  className?: string;
}

export function SurvivalAnalysisPanel({ analysis, className }: SurvivalAnalysisPanelProps) {
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('es-ES', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  const probabilityColor = 
    analysis.survivalProbability >= 80 ? 'text-accent' :
    analysis.survivalProbability >= 50 ? 'text-warning' :
    'text-destructive';

  const marginColor =
    analysis.survivalMargin >= 0 ? 'text-accent' :
    'text-destructive';

  return (
    <Card className={cn('p-6 bg-card/50 backdrop-blur-sm', className)}>
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-heading font-semibold text-lg">ANÁLISIS DE SUPERVIVENCIA</h3>
        {analysis.automaticVeto ? (
          <ShieldWarning size={24} className="text-destructive" weight="fill" />
        ) : (
          <Shield size={24} className="text-accent" weight="fill" />
        )}
      </div>
      
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div>
          <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">Capital Actual</p>
          <p className="font-mono font-bold text-lg">{formatCurrency(analysis.currentCapital)}</p>
        </div>
        
        <div>
          <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">Reserva Supervivencia</p>
          <p className="font-mono font-bold text-lg text-warning">{formatCurrency(analysis.survivalReserve)}</p>
        </div>
        
        <div>
          <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">Capital Operativo</p>
          <p className="font-mono font-bold text-lg text-primary">{formatCurrency(analysis.operationalCapital)}</p>
        </div>
        
        <div>
          <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">Capital Post-Operación</p>
          <p className="font-mono font-bold text-lg">{formatCurrency(analysis.capitalAfterTrade)}</p>
        </div>
        
        <div>
          <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">Reserva Post-Operación</p>
          <p className="font-mono font-bold text-lg">{formatCurrency(analysis.reserveAfterTrade)}</p>
        </div>
        
        <div>
          <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">Margen de Supervivencia</p>
          <p className={cn('font-mono font-bold text-lg', marginColor)}>
            {formatCurrency(analysis.survivalMargin)}
          </p>
        </div>
      </div>
      
      <div className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium">Probabilidad de Supervivencia</span>
          <span className={cn('font-mono text-xl font-bold', probabilityColor)}>
            {analysis.survivalProbability.toFixed(1)}%
          </span>
        </div>
        <Progress value={analysis.survivalProbability} className="h-3" />
      </div>
      
      {analysis.automaticVeto && analysis.vetoReason && (
        <div className="p-4 bg-destructive/10 border-2 border-destructive/50 rounded-lg">
          <div className="flex items-start gap-3">
            <WarningCircle size={24} className="text-destructive flex-shrink-0 mt-0.5" weight="fill" />
            <div>
              <p className="font-semibold text-destructive mb-1">VETO AUTOMÁTICO ACTIVADO</p>
              <p className="text-sm text-destructive/90">{analysis.vetoReason}</p>
            </div>
          </div>
        </div>
      )}
    </Card>
  );
}
