import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import type { PlatformConfig, SecurityRole } from '@/lib/platformConfig';

interface SecuritySettingsSectionProps {
  platformConfig: PlatformConfig;
  onPlatformConfigChange: (updater: (current: PlatformConfig) => PlatformConfig) => void;
  onEmergencyClosePositions: () => { closed: number };
}

const ROLE_LABELS: Record<SecurityRole, string> = {
  admin: 'Admin',
  operator: 'Operator',
  viewer: 'Viewer',
};

function canManageKillSwitch(role: SecurityRole): boolean {
  return role === 'admin';
}

function canStopAutoTrading(role: SecurityRole): boolean {
  return role === 'admin' || role === 'operator';
}

function canEmergencyClose(role: SecurityRole): boolean {
  return role === 'admin' || role === 'operator';
}

function eventTypeLabel(type: string): string {
  switch (type) {
    case 'login':
      return 'Login';
    case 'config-change':
      return 'Cambio configuración';
    case 'profile-change':
      return 'Cambio perfil';
    case 'strategy-change':
      return 'Cambio estrategia';
    case 'kill-switch':
      return 'Kill Switch';
    case 'stop-auto-trading':
      return 'Stop Auto Trading';
    case 'emergency-close':
      return 'Emergency Close';
    default:
      return type;
  }
}

function appendAuditEvent(
  config: PlatformConfig,
  type: PlatformConfig['securityConfig']['auditEvents'][number]['type'],
  detail: string,
): PlatformConfig {
  const role = config.securityConfig.currentRole;
  return {
    ...config,
    updatedAt: new Date().toISOString(),
    securityConfig: {
      ...config.securityConfig,
      auditEvents: [
        {
          id: `audit-${Date.now()}-${Math.round(Math.random() * 1000)}`,
          type,
          role,
          actor: `aurora-${role}`,
          detail,
          timestamp: new Date().toISOString(),
        },
        ...config.securityConfig.auditEvents,
      ].slice(0, 300),
    },
  };
}

export function SecuritySettingsSection({ platformConfig, onPlatformConfigChange, onEmergencyClosePositions }: SecuritySettingsSectionProps) {
  const currentRole = platformConfig.securityConfig.currentRole;

  const changeRole = (role: SecurityRole) => {
    onPlatformConfigChange((current) => {
      const next = {
        ...current,
        updatedAt: new Date().toISOString(),
        securityConfig: {
          ...current.securityConfig,
          currentRole: role,
        },
      };
      return appendAuditEvent(next, 'config-change', `Rol de seguridad actualizado a ${ROLE_LABELS[role]}`);
    });
  };

  const toggleKillSwitch = (enabled: boolean) => {
    onPlatformConfigChange((current) => {
      const next = {
        ...current,
        updatedAt: new Date().toISOString(),
        securityConfig: {
          ...current.securityConfig,
          killSwitchEnabled: enabled,
        },
      };
      return appendAuditEvent(next, 'kill-switch', enabled ? 'Kill Switch activado' : 'Kill Switch desactivado');
    });
  };

  const toggleStopAutoTrading = (enabled: boolean) => {
    onPlatformConfigChange((current) => {
      const next = {
        ...current,
        updatedAt: new Date().toISOString(),
        securityConfig: {
          ...current.securityConfig,
          stopAutoTradingEnabled: enabled,
        },
      };
      return appendAuditEvent(next, 'stop-auto-trading', enabled ? 'Stop Auto Trading activado' : 'Stop Auto Trading desactivado');
    });
  };

  const runEmergencyClose = () => {
    onEmergencyClosePositions();
  };

  return (
    <div className="space-y-6">
      <div className="pb-2">
        <h3 className="font-heading font-bold text-2xl sm:text-3xl mb-2 tracking-tight">Seguridad</h3>
        <p className="text-sm text-muted-foreground/80">
          Roles, protecciones operativas y auditoría de eventos críticos.
        </p>
      </div>

      <Card className="p-5 bg-card/50 backdrop-blur-sm border-border/50">
        <h4 className="font-heading font-semibold text-base">Roles</h4>
        <p className="text-xs text-muted-foreground mt-1 mb-3">Admin, Operator y Viewer con permisos diferenciados.</p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 items-end">
          <div>
            <p className="text-xs text-muted-foreground uppercase tracking-wide mb-2">Rol activo</p>
            <Select value={currentRole} onValueChange={(value) => changeRole(value as SecurityRole)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="admin">Admin</SelectItem>
                <SelectItem value="operator">Operator</SelectItem>
                <SelectItem value="viewer">Viewer</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Badge variant="outline" className="w-fit">{ROLE_LABELS[currentRole]}</Badge>
        </div>
      </Card>

      <Card className="p-5 bg-card/50 backdrop-blur-sm border-border/50">
        <h4 className="font-heading font-semibold text-base">Protecciones</h4>
        <p className="text-xs text-muted-foreground mt-1 mb-4">Control de riesgo operativo global.</p>

        <div className="space-y-4">
          <div className="flex items-center justify-between gap-3 rounded-lg bg-background/50 p-3">
            <div>
              <p className="text-sm font-medium">Kill Switch global</p>
              <p className="text-xs text-muted-foreground">Bloquea toda ejecución nueva.</p>
            </div>
            <Switch
              checked={platformConfig.securityConfig.killSwitchEnabled}
              onCheckedChange={toggleKillSwitch}
              disabled={!canManageKillSwitch(currentRole)}
            />
          </div>

          <div className="flex items-center justify-between gap-3 rounded-lg bg-background/50 p-3">
            <div>
              <p className="text-sm font-medium">Stop Auto Trading</p>
              <p className="text-xs text-muted-foreground">Pausa la ejecución automática sin apagar el sistema.</p>
            </div>
            <Switch
              checked={platformConfig.securityConfig.stopAutoTradingEnabled}
              onCheckedChange={toggleStopAutoTrading}
              disabled={!canStopAutoTrading(currentRole)}
            />
          </div>

          <div className="rounded-lg bg-background/50 p-3">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-sm font-medium">Emergency Close Positions</p>
                <p className="text-xs text-muted-foreground">Cierra todas las posiciones abiertas de inmediato.</p>
              </div>
              <Button variant="destructive" onClick={runEmergencyClose} disabled={!canEmergencyClose(currentRole)}>
                Ejecutar
              </Button>
            </div>
          </div>
        </div>
      </Card>

      <Card className="p-5 bg-card/50 backdrop-blur-sm border-border/50">
        <h4 className="font-heading font-semibold text-base">Registro de Eventos</h4>
        <p className="text-xs text-muted-foreground mt-1">Login, cambios de configuración, perfil y estrategia.</p>

        <Separator className="my-4" />

        <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
          {platformConfig.securityConfig.auditEvents.length === 0 ? (
            <p className="text-sm text-muted-foreground">Sin eventos de auditoría registrados.</p>
          ) : (
            platformConfig.securityConfig.auditEvents.slice(0, 30).map((event) => (
              <div key={event.id} className="rounded-lg border border-border/60 bg-background/40 p-3">
                <div className="flex items-center justify-between gap-3">
                  <p className="text-sm font-medium">{eventTypeLabel(event.type)}</p>
                  <p className="text-xs text-muted-foreground">{new Date(event.timestamp).toLocaleString('es-ES')}</p>
                </div>
                <p className="text-xs text-muted-foreground mt-1">{event.detail}</p>
                <p className="text-[11px] text-muted-foreground mt-1">Actor: {event.actor} · Rol: {ROLE_LABELS[event.role]}</p>
              </div>
            ))
          )}
        </div>
      </Card>
    </div>
  );
}
