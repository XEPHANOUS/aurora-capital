import { useMemo, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import type { Agent, AgentType, OrganizationConfig, OrganizationProfileDefinition, OrganizationalProfile } from '@/lib/types';
import {
  createCustomProfile,
  deleteCustomProfile,
  duplicateProfileWithResult,
  getActiveProfile,
  getAllProfiles,
  getSystemProfiles,
  updateCustomProfile,
} from '@/lib/organizationProfiles';
import { AGENT_ICONS } from '@/components/settings/agents/constants';
import { ProfileCard } from '@/components/settings/agents/profiles/ProfileCard';
import { ProfileEditorSheet } from '@/components/settings/agents/profiles/ProfileEditorSheet';
import { recommendProfile, CLASSIFIER_COLORS } from '@/lib/profileAnalytics';

interface AgentProfilesPageProps {
  agents: Agent[];
  organizationConfig?: OrganizationConfig;
  activeEnvironment?: string;
  onProfileChange: (profileId: string) => void;
  onNavigateToInfluence: (profileId: string) => void;
  onOrganizationConfigChange: (updater: (current: OrganizationConfig | undefined) => OrganizationConfig) => void;
}

export function AgentProfilesPage({
  agents,
  organizationConfig,
  activeEnvironment,
  onProfileChange,
  onNavigateToInfluence,
  onOrganizationConfigChange,
}: AgentProfilesPageProps) {
  const [editorOpen, setEditorOpen] = useState(false);
  const [editorMode, setEditorMode] = useState<'create' | 'edit'>('create');
  const [editingProfileId, setEditingProfileId] = useState<string | null>(null);
  const [deleteProfileId, setDeleteProfileId] = useState<string | null>(null);

  const profiles = useMemo(() => getAllProfiles(organizationConfig), [organizationConfig]);
  const systemProfiles = useMemo(() => getSystemProfiles(), []);
  const activeProfile = useMemo(() => getActiveProfile(organizationConfig), [organizationConfig]);
  const recommendation = useMemo(
    () => recommendProfile(systemProfiles, {
      currentEnvironment: activeEnvironment,
      currentProfileId: activeProfile.id,
      currentWeights: activeProfile.weights,
    }),
    [systemProfiles, activeEnvironment, activeProfile.id, activeProfile.weights],
  );

  const editingProfile: OrganizationProfileDefinition | undefined = useMemo(
    () => profiles.find((p) => p.id === editingProfileId),
    [profiles, editingProfileId],
  );

  const openCreate = () => {
    setEditorMode('create');
    setEditingProfileId(null);
    setEditorOpen(true);
  };

  const openEdit = (profileId: string) => {
    setEditorMode('edit');
    setEditingProfileId(profileId);
    setEditorOpen(true);
  };

  const handleCreate = (input: { name: string; description: string; baseProfileId: OrganizationalProfile }) => {
    onOrganizationConfigChange((current) => createCustomProfile(current, input));
  };

  const handleSaveCustom = (profile: OrganizationProfileDefinition) => {
    onOrganizationConfigChange((current) => updateCustomProfile(current, profile));
  };

  const handleDuplicate = (profileId: string) => {
    let duplicatedId: string | null = null;
    onOrganizationConfigChange((current) => {
      const result = duplicateProfileWithResult(current, profileId);
      duplicatedId = result.duplicatedProfileId;
      return result.config;
    });

    if (duplicatedId) {
      setEditorMode('edit');
      setEditingProfileId(duplicatedId);
      setEditorOpen(true);
    }
  };

  const confirmDelete = () => {
    if (!deleteProfileId) return;
    onOrganizationConfigChange((current) => deleteCustomProfile(current, deleteProfileId));
    setDeleteProfileId(null);
  };

  const currentWeights = activeProfile.weights;
  const recommendedDetected = recommendation.recommendedProfileName;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h3 className="font-heading font-semibold text-base">Perfiles Organizativos</h3>
          <p className="text-xs text-muted-foreground">System y Custom profiles con pesos explicitos por agente.</p>
        </div>
        <Button onClick={openCreate}>+ Nuevo Perfil</Button>
      </div>

      <Card className="p-6 bg-card/50 backdrop-blur-sm border border-primary/30">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h3 className="font-heading font-semibold text-base">Perfil recomendado</h3>
            <p className="text-xs text-muted-foreground mt-1">Recomendación heurística basada en entorno activo y estado operativo.</p>
          </div>
          <Badge variant="outline" className={`text-xs ${CLASSIFIER_COLORS['Crecimiento']}`}>
            {recommendedDetected.toUpperCase()}
          </Badge>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mt-4">
          <div className="p-3 rounded bg-background/40">
            <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Perfil</p>
            <p className="font-semibold text-sm mt-1">{recommendation.recommendedProfileName}</p>
          </div>
          <div className="p-3 rounded bg-background/40">
            <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Confianza</p>
            <p className="font-mono font-semibold text-sm mt-1">{recommendation.confidence}%</p>
          </div>
          <div className="p-3 rounded bg-background/40">
            <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Entorno</p>
            <p className="font-semibold text-sm mt-1">{(activeEnvironment ?? 'sandbox').toUpperCase()}</p>
          </div>
        </div>
        <p className="text-xs text-muted-foreground mt-3">Motivo: {recommendation.reason}</p>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {profiles.map((profile) => (
          <ProfileCard
            key={profile.id}
            profile={profile}
            isActive={activeProfile.id === profile.id}
            onActivate={onProfileChange}
            onViewAnalysis={onNavigateToInfluence}
            onEdit={openEdit}
            onDuplicate={handleDuplicate}
            onDelete={setDeleteProfileId}
          />
        ))}
      </div>

      <Card className="p-6 bg-card/50 backdrop-blur-sm">
        <h3 className="font-heading font-semibold text-lg mb-4">Current Weight Distribution</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {Object.entries(currentWeights).map(([agentId, weight]) => {
            const Icon = AGENT_ICONS[agentId as AgentType];
            const agentData = agents.find((a) => a.id === agentId);
            return (
              <div key={agentId} className="space-y-2">
                <div className="flex items-center gap-2">
                  <Icon size={16} className="text-primary" />
                  <span className="text-sm font-medium capitalize">{agentData?.name ?? agentId}</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="flex-1 h-2 bg-background rounded-full overflow-hidden">
                    <div className="h-full bg-primary rounded-full transition-all duration-500" style={{ width: `${weight}%` }} />
                  </div>
                  <span className="text-xs font-mono font-semibold w-8">{weight}</span>
                </div>
              </div>
            );
          })}
        </div>
      </Card>

      <ProfileEditorSheet
        open={editorOpen}
        mode={editorMode}
        systemProfiles={systemProfiles}
        editingProfile={editingProfile}
        onOpenChange={setEditorOpen}
        onCreate={handleCreate}
        onSave={handleSaveCustom}
      />

      <AlertDialog open={Boolean(deleteProfileId)} onOpenChange={(open) => !open && setDeleteProfileId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Eliminar Perfil Personalizado</AlertDialogTitle>
            <AlertDialogDescription>
              Esta accion eliminara el perfil custom de forma permanente. Los perfiles del sistema no se pueden borrar.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete}>Eliminar</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
