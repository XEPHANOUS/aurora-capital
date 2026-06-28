import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { Palette, Bell, UserCircle, ShieldCheck, IdentificationCard } from '@phosphor-icons/react';

interface UserPreferencesPanelProps {
  open: boolean;
  onClose: () => void;
}

export function UserPreferencesPanel({ open, onClose }: UserPreferencesPanelProps) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm" onClick={onClose}>
      <div className="absolute right-0 top-0 h-full w-full max-w-[460px] border-l border-border bg-card/95 p-6 overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="font-heading font-bold text-2xl tracking-tight">Preferencias</h3>
            <p className="text-sm text-muted-foreground">Configuracion personal de usuario</p>
          </div>
          <Button variant="ghost" size="sm" onClick={onClose}>Cerrar</Button>
        </div>

        <div className="space-y-4">
          <Card className="p-4 bg-background/50 border-border/60">
            <div className="flex items-center gap-2 mb-3">
              <Palette size={18} className="text-primary" />
              <h4 className="font-heading font-semibold">Apariencia y Tema</h4>
            </div>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm">Tema oscuro Aurora</span>
                <Badge variant="outline" className="text-xs border-accent text-accent">Activo</Badge>
              </div>
              <p className="text-xs text-muted-foreground">Soporte multi-tema en proxima iteracion.</p>
            </div>
          </Card>

          <Card className="p-4 bg-background/50 border-border/60">
            <div className="flex items-center gap-2 mb-3">
              <Bell size={18} className="text-primary" />
              <h4 className="font-heading font-semibold">Notificaciones</h4>
            </div>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm">Alertas del sistema</span>
                <Switch checked={true} onCheckedChange={() => undefined} />
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Resumen diario</span>
                <Switch checked={false} onCheckedChange={() => undefined} />
              </div>
            </div>
          </Card>

          <Card className="p-4 bg-background/50 border-border/60">
            <div className="flex items-center gap-2 mb-3">
              <UserCircle size={18} className="text-primary" />
              <h4 className="font-heading font-semibold">Perfil</h4>
            </div>
            <p className="text-sm text-muted-foreground">Usuario: Aurora Operator</p>
            <p className="text-xs text-muted-foreground mt-1">Edicion de perfil en proxima iteracion.</p>
          </Card>

          <Card className="p-4 bg-background/50 border-border/60">
            <div className="flex items-center gap-2 mb-3">
              <ShieldCheck size={18} className="text-primary" />
              <h4 className="font-heading font-semibold">Cuenta</h4>
            </div>
            <p className="text-sm text-muted-foreground">Sesion local activa</p>
            <p className="text-xs text-muted-foreground mt-1">Gestion de seguridad personal en roadmap.</p>
          </Card>

          <Card className="p-4 bg-background/50 border-border/60">
            <div className="flex items-center gap-2 mb-3">
              <IdentificationCard size={18} className="text-primary" />
              <h4 className="font-heading font-semibold">Licencia</h4>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm">Aurora Professional</span>
              <Badge variant="outline" className="text-xs border-primary text-primary">Activa</Badge>
            </div>
            <Separator className="my-3" />
            <p className="text-xs text-muted-foreground">Renovacion automatica habilitada.</p>
          </Card>
        </div>
      </div>
    </div>
  );
}
