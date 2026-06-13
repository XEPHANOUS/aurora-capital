import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Warning, ShieldWarning, CurrencyDollar } from '@phosphor-icons/react';
import { cn } from '@/lib/utils';

interface RealTradingConfirmationModalProps {
  open: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export function RealTradingConfirmationModal({
  open,
  onConfirm,
  onCancel,
}: RealTradingConfirmationModalProps) {
  const [confirmations, setConfirmations] = useState({
    realMoney: false,
    realLosses: false,
    realExecution: false,
    readTerms: false,
  });

  const allConfirmed = Object.values(confirmations).every((v) => v);

  const handleConfirmation = (key: keyof typeof confirmations) => {
    setConfirmations((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  const handleConfirm = () => {
    if (allConfirmed) {
      onConfirm();
      setConfirmations({
        realMoney: false,
        realLosses: false,
        realExecution: false,
        readTerms: false,
      });
    }
  };

  const handleCancel = () => {
    setConfirmations({
      realMoney: false,
      realLosses: false,
      realExecution: false,
      readTerms: false,
    });
    onCancel();
  };

  return (
    <Dialog open={open} onOpenChange={handleCancel}>
      <DialogContent className={cn(
        "bg-card/95 backdrop-blur-sm border-destructive/50",
        "w-[95vw] max-w-[550px]",
        "sm:w-[90vw]",
        "md:w-auto md:max-w-[550px]"
      )}>
        <DialogHeader>
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-lg bg-destructive/20 flex items-center justify-center flex-shrink-0">
              <ShieldWarning size={24} weight="fill" className="text-destructive sm:w-7 sm:h-7" />
            </div>
            <div className="flex-1 min-w-0">
              <DialogTitle className="font-heading text-xl sm:text-2xl text-destructive leading-tight">
                ⚠ REAL MONEY MODE
              </DialogTitle>
              <Badge variant="destructive" className="mt-1 text-xs">
                Confirmación Requerida
              </Badge>
            </div>
          </div>
          <DialogDescription className="text-xs sm:text-sm text-muted-foreground">
            Estás a punto de activar el modo de operación con dinero real. Por favor, lee y confirma cada punto cuidadosamente.
          </DialogDescription>
        </DialogHeader>

        <Separator />

        <div className="space-y-4 py-4 max-h-[50vh] overflow-y-auto">
          <div className="p-3 sm:p-4 bg-warning/10 border border-warning/30 rounded-lg">
            <div className="flex items-start gap-2">
              <Warning size={18} className="text-warning mt-0.5 flex-shrink-0 sm:w-5 sm:h-5" />
              <div className="flex-1 space-y-2">
                <p className="text-xs sm:text-sm font-semibold text-warning">
                  Advertencia Importante
                </p>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  El trading con dinero real implica riesgos significativos. Puedes perder toda tu inversión. Solo opera con capital que puedas permitirte perder.
                </p>
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
              Confirma que entiendes:
            </p>

            <div
              className="flex items-start gap-3 p-2.5 sm:p-3 rounded-lg border cursor-pointer hover:bg-accent/5 transition-colors"
              onClick={() => handleConfirmation('realMoney')}
            >
              <Checkbox
                checked={confirmations.realMoney}
                onCheckedChange={() => handleConfirmation('realMoney')}
                className="mt-0.5"
              />
              <div className="flex-1">
                <p className="text-xs sm:text-sm font-medium flex items-center gap-2">
                  <CurrencyDollar size={14} className="text-destructive sm:w-4 sm:h-4" />
                  Se utilizará dinero real
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  Las operaciones se ejecutarán con tu capital real conectado al exchange
                </p>
              </div>
            </div>

            <div
              className="flex items-start gap-3 p-2.5 sm:p-3 rounded-lg border cursor-pointer hover:bg-accent/5 transition-colors"
              onClick={() => handleConfirmation('realLosses')}
            >
              <Checkbox
                checked={confirmations.realLosses}
                onCheckedChange={() => handleConfirmation('realLosses')}
                className="mt-0.5"
              />
              <div className="flex-1">
                <p className="text-xs sm:text-sm font-medium flex items-center gap-2">
                  <Warning size={14} className="text-warning sm:w-4 sm:h-4" />
                  Las pérdidas serán reales
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  Cualquier pérdida afectará directamente tu capital real
                </p>
              </div>
            </div>

            <div
              className="flex items-start gap-3 p-2.5 sm:p-3 rounded-lg border cursor-pointer hover:bg-accent/5 transition-colors"
              onClick={() => handleConfirmation('realExecution')}
            >
              <Checkbox
                checked={confirmations.realExecution}
                onCheckedChange={() => handleConfirmation('realExecution')}
                className="mt-0.5"
              />
              <div className="flex-1">
                <p className="text-xs sm:text-sm font-medium flex items-center gap-2">
                  <ShieldWarning size={14} className="text-destructive sm:w-4 sm:h-4" />
                  Las órdenes serán enviadas al exchange
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  Aurora ejecutará órdenes reales en tu exchange configurado
                </p>
              </div>
            </div>

            <div
              className="flex items-start gap-3 p-2.5 sm:p-3 rounded-lg border cursor-pointer hover:bg-accent/5 transition-colors"
              onClick={() => handleConfirmation('readTerms')}
            >
              <Checkbox
                checked={confirmations.readTerms}
                onCheckedChange={() => handleConfirmation('readTerms')}
                className="mt-0.5"
              />
              <div className="flex-1">
                <p className="text-xs sm:text-sm font-medium">
                  He leído y acepto los términos
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  Entiendo los riesgos y acepto la responsabilidad de mis decisiones de inversión
                </p>
              </div>
            </div>
          </div>
        </div>

        <Separator />

        <DialogFooter className="flex-col sm:flex-row gap-2">
          <Button
            variant="outline"
            onClick={handleCancel}
            className="w-full sm:w-auto text-sm"
          >
            Cancelar
          </Button>
          <Button
            variant="destructive"
            onClick={handleConfirm}
            disabled={!allConfirmed}
            className={cn(
              'w-full sm:w-auto gap-2 font-bold text-sm',
              !allConfirmed && 'opacity-50 cursor-not-allowed'
            )}
          >
            <ShieldWarning size={18} weight="fill" />
            CONFIRM REAL TRADING
          </Button>
        </DialogFooter>

        {allConfirmed && (
          <div className="p-2.5 sm:p-3 bg-accent/10 border border-accent/30 rounded-lg">
            <p className="text-xs text-center text-muted-foreground">
              Esta confirmación será válida por 24 horas
            </p>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
