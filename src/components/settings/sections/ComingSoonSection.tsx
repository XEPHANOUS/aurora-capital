import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Gear } from '@phosphor-icons/react';

interface ComingSoonSectionProps {
  category: string;
}

export function ComingSoonSection({ category }: ComingSoonSectionProps) {
  return (
    <div className="space-y-6">
      <div className="pb-2">
        <h3 className="font-heading font-bold text-3xl mb-2 tracking-tight">{category}</h3>
        <p className="text-sm text-muted-foreground/80">Esta seccion estara disponible proximamente</p>
      </div>

      <Card className="p-12 bg-card/50 backdrop-blur-sm text-center border-border/50">
        <div className="max-w-md mx-auto space-y-4">
          <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto">
            <Gear size={32} className="text-primary/60" />
          </div>
          <h4 className="font-heading font-semibold text-xl">Proximamente</h4>
          <p className="text-sm text-muted-foreground/70">
            La configuracion de {category} se encuentra en desarrollo y estara disponible en futuras
            actualizaciones.
          </p>
          <Badge variant="outline" className="text-xs border-muted-foreground/30">
            En desarrollo
          </Badge>
        </div>
      </Card>
    </div>
  );
}
