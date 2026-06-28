import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import type { AgentType, OrganizationProfileDefinition } from '@/lib/types';
import { AGENT_ICONS } from '@/components/settings/agents/constants';
import {
  computeProfileMetrics,
  classifyProfile,
  generateBehaviourLines,
  runSimulation,
  CLASSIFIER_COLORS,
} from '@/lib/profileAnalytics';

interface ProfileCardProps {
  profile: OrganizationProfileDefinition;
  isActive: boolean;
  onActivate: (profileId: string) => void;
  onViewAnalysis: (profileId: string) => void;
  onEdit: (profileId: string) => void;
  onDuplicate: (profileId: string) => void;
  onDelete: (profileId: string) => void;
}

export function ProfileCard({
  profile,
  isActive,
  onActivate,
  onViewAnalysis,
  onEdit,
  onDuplicate,
  onDelete,
}: ProfileCardProps) {
  const metrics = computeProfileMetrics(profile.weights);
  const classification = classifyProfile(profile.weights);
  const behaviorLines = generateBehaviourLines(profile.weights).slice(0, 3);
  const bullSimulation = runSimulation('bull_market', profile.weights);

  const topInfluences = Object.entries(profile.weights)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 3);

  return (
    <Card
      className={
        isActive
          ? 'p-4 transition-all border-2 bg-primary/10 border-primary'
          : 'p-4 transition-all border-2 bg-card/50 backdrop-blur-sm border-border hover:border-primary/50'
      }
    >
      <div className="space-y-3">
        <div className="flex items-center justify-between gap-2">
          <h3 className="font-heading font-semibold text-sm uppercase tracking-wide">{profile.name}</h3>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-[10px] tracking-wide">
              {profile.isSystemProfile ? 'SYSTEM' : 'CUSTOM'}
            </Badge>
            {isActive && <Badge variant="default" className="text-xs">Active</Badge>}
          </div>
        </div>

        <p className="text-xs text-muted-foreground">{profile.description}</p>
        <Separator />

        <div className="space-y-1">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">Top Influences</p>
          {topInfluences.map(([agentId, weight]) => {
            const Icon = AGENT_ICONS[agentId as AgentType];
            return (
              <div key={agentId} className="flex items-center justify-between text-xs">
                <span className="flex items-center gap-1">
                  <Icon size={12} className="text-primary" />
                  <span className="capitalize">{agentId}</span>
                </span>
                <span className="font-mono font-semibold">{weight}</span>
              </div>
            );
          })}
        </div>

        <Separator />

        <div className="space-y-2">
          <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wide">Tipo detectado</p>
          <Badge variant="outline" className={`text-[10px] tracking-wide ${CLASSIFIER_COLORS[classification.label]}`}>
            {classification.label.toUpperCase()}
          </Badge>
        </div>

        <div className="grid grid-cols-3 gap-2 text-xs">
          <div className="p-2 rounded bg-background/40">
            <p className="text-muted-foreground">Agresividad</p>
            <p className="font-mono font-semibold">{metrics.aggressiveness}%</p>
          </div>
          <div className="p-2 rounded bg-background/40">
            <p className="text-muted-foreground">Protección</p>
            <p className="font-mono font-semibold">{metrics.protection}%</p>
          </div>
          <div className="p-2 rounded bg-background/40">
            <p className="text-muted-foreground">Control</p>
            <p className="font-mono font-semibold">{metrics.control}%</p>
          </div>
        </div>

        <div className="space-y-1">
          <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wide">Comportamiento</p>
          {behaviorLines.map((line, i) => (
            <p key={i} className="text-xs text-muted-foreground leading-snug">✓ {line}</p>
          ))}
        </div>

        <div className="p-3 rounded border border-border bg-background/30 space-y-1">
          <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wide">Decisión esperada</p>
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs text-muted-foreground">Mercado Alcista</span>
            <Badge variant="outline" className="text-[10px] tracking-wide">
              {bullSimulation.decision}
            </Badge>
          </div>
        </div>

        <div className="flex flex-wrap gap-2 pt-1">
          <Button size="sm" variant={isActive ? 'secondary' : 'default'} onClick={() => onActivate(profile.id)}>
            {isActive ? 'Activo' : 'Activar'}
          </Button>

          <Button size="sm" variant="outline" onClick={() => onViewAnalysis(profile.id)}>
            Ver analisis
          </Button>

          {!profile.isSystemProfile && (
            <>
              <Button size="sm" variant="outline" onClick={() => onEdit(profile.id)}>
                Editar
              </Button>
              <Button size="sm" variant="outline" onClick={() => onDuplicate(profile.id)}>
                Duplicar
              </Button>
              <Button size="sm" variant="destructive" onClick={() => onDelete(profile.id)}>
                Eliminar
              </Button>
            </>
          )}

          {profile.isSystemProfile && (
            <Button size="sm" variant="outline" onClick={() => onDuplicate(profile.id)}>
              Duplicar
            </Button>
          )}
        </div>
      </div>
    </Card>
  );
}
