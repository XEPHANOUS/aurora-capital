import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { CheckCircle, WarningCircle } from '@phosphor-icons/react';
import {
  type PlatformConfig,
  type PlatformModuleCategory,
  type PlatformConnectionStatus,
  updatePlatformHealth,
} from '@/lib/platformConfig';
import { cn } from '@/lib/utils';

interface InfrastructureModuleSectionProps {
  focusedCategory: PlatformModuleCategory;
  platformConfig: PlatformConfig;
  onPlatformConfigChange: (updater: (current: PlatformConfig) => PlatformConfig) => void;
}

const MODULES: Array<{ id: PlatformModuleCategory; title: string; description: string }> = [
  {
    id: 'apis',
    title: 'APIs',
    description: 'Conectores a proveedores de datos y ejecucion virtual.',
  },
  {
    id: 'llms',
    title: 'LLMs',
    description: 'Ruteo de modelos y estrategias por agente.',
  },
  {
    id: 'environments',
    title: 'Entornos',
    description: 'Sandbox, Demo, Paper Live y control de entorno activo.',
  },
  {
    id: 'security',
    title: 'Seguridad',
    description: 'Roles operativos, protecciones y auditoria.',
  },
  {
    id: 'backups',
    title: 'Backups',
    description: 'Exportacion, importacion y recuperacion de configuracion.',
  },
];

function statusTone(status: PlatformConnectionStatus): string {
  if (status === 'connected') return 'border-accent text-accent';
  if (status === 'error') return 'border-destructive text-destructive';
  return 'border-muted-foreground text-muted-foreground';
}

function statusLabel(status: PlatformConnectionStatus): string {
  if (status === 'connected') return 'Connected';
  if (status === 'error') return 'Error';
  return 'Disconnected';
}

export function InfrastructureModuleSection({
  focusedCategory,
  platformConfig,
  onPlatformConfigChange,
}: InfrastructureModuleSectionProps) {
  const runHealthCheck = (moduleId: PlatformModuleCategory) => {
    onPlatformConfigChange((current) => {
      const isEnabled = current.featureFlags[moduleId];
      if (!isEnabled) {
        return updatePlatformHealth(current, moduleId, 'disconnected', 'Modulo desactivado por feature flag.');
      }

      return updatePlatformHealth(current, moduleId, 'connected', 'Health check base completado.');
    });
  };

  const toggleModule = (moduleId: PlatformModuleCategory) => {
    onPlatformConfigChange((current) => {
      const enabled = !current.featureFlags[moduleId];
      const nextStatus: PlatformConnectionStatus = enabled ? 'connected' : 'disconnected';
      const nextDetail = enabled ? 'Modulo habilitado en fase base.' : 'Modulo deshabilitado manualmente.';

      return {
        ...current,
        updatedAt: new Date().toISOString(),
        featureFlags: {
          ...current.featureFlags,
          [moduleId]: enabled,
        },
        health: {
          ...current.health,
          [moduleId]: {
            status: nextStatus,
            detail: nextDetail,
            lastCheckAt: new Date().toISOString(),
          },
        },
      };
    });
  };

  return (
    <div className="space-y-6">
      <Card className="p-5 bg-card/50 backdrop-blur-sm border-border/50">
        <h3 className="font-heading font-semibold text-lg">Fase 1: Base de Modulos</h3>
        <p className="text-sm text-muted-foreground mt-2">
          Los modulos estrategicos ya no estan en "Proximamente". Esta capa activa feature flags, estado de salud y compatibilidad sin romper Runtime Core.
        </p>
        <div className="flex flex-wrap gap-2 mt-4">
          <Badge variant="outline" className="border-primary text-primary">
            Schema v{platformConfig.schemaVersion}
          </Badge>
          <Badge variant="outline">Updated: {new Date(platformConfig.updatedAt).toLocaleString('es-ES')}</Badge>
        </div>
      </Card>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        {MODULES.map((moduleDef) => {
          const moduleHealth = platformConfig.health[moduleDef.id];
          const enabled = platformConfig.featureFlags[moduleDef.id];
          const isFocused = focusedCategory === moduleDef.id;

          return (
            <Card
              key={moduleDef.id}
              className={cn(
                'p-5 bg-card/50 backdrop-blur-sm border-border/50',
                isFocused && 'border-primary/60 shadow-[0_0_0_1px_hsl(var(--primary)/0.35)]',
              )}
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h4 className="font-heading font-semibold text-base">{moduleDef.title}</h4>
                  <p className="text-sm text-muted-foreground mt-1">{moduleDef.description}</p>
                </div>
                <Badge variant="outline" className={statusTone(moduleHealth.status)}>
                  {statusLabel(moduleHealth.status)}
                </Badge>
              </div>

              <div className="flex flex-wrap items-center gap-3 mt-4">
                <Badge variant={enabled ? 'default' : 'outline'}>{enabled ? 'Activo' : 'Inactivo'}</Badge>
                <Button size="sm" variant={enabled ? 'outline' : 'default'} onClick={() => toggleModule(moduleDef.id)}>
                  {enabled ? 'Desactivar' : 'Activar'}
                </Button>
                <Button size="sm" variant="outline" onClick={() => runHealthCheck(moduleDef.id)}>
                  Health Check
                </Button>
              </div>

              <p className="text-xs text-muted-foreground mt-3">
                Ultimo check:{' '}
                {moduleHealth.lastCheckAt
                  ? new Date(moduleHealth.lastCheckAt).toLocaleString('es-ES')
                  : 'Sin checks'}
              </p>
              {moduleHealth.detail && (
                <p className="text-xs text-muted-foreground mt-1">Detalle: {moduleHealth.detail}</p>
              )}
            </Card>
          );
        })}
      </div>

      <Card className="p-5 bg-card/50 backdrop-blur-sm border-border/50">
        <h4 className="font-heading font-semibold text-base">Compatibilidad Garantizada</h4>
        <p className="text-sm text-muted-foreground mt-1">
          Esta fase mantiene compatibilidad con todos los subsistemas criticos antes de avanzar a implementaciones profundas.
        </p>
        <Separator className="my-4" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          <div className="flex items-center gap-2 text-sm">
            {platformConfig.compatibility.runtimeCore ? <CheckCircle className="text-accent" size={16} /> : <WarningCircle className="text-destructive" size={16} />}
            Runtime Core
          </div>
          <div className="flex items-center gap-2 text-sm">
            {platformConfig.compatibility.telegram ? <CheckCircle className="text-accent" size={16} /> : <WarningCircle className="text-destructive" size={16} />}
            Telegram
          </div>
          <div className="flex items-center gap-2 text-sm">
            {platformConfig.compatibility.consensusEngine ? <CheckCircle className="text-accent" size={16} /> : <WarningCircle className="text-destructive" size={16} />}
            Consensus Engine
          </div>
          <div className="flex items-center gap-2 text-sm">
            {platformConfig.compatibility.organizationProfiles ? <CheckCircle className="text-accent" size={16} /> : <WarningCircle className="text-destructive" size={16} />}
            Organization Profiles
          </div>
          <div className="flex items-center gap-2 text-sm">
            {platformConfig.compatibility.agentCollaboration ? <CheckCircle className="text-accent" size={16} /> : <WarningCircle className="text-destructive" size={16} />}
            Agent Collaboration
          </div>
        </div>
      </Card>
    </div>
  );
}
