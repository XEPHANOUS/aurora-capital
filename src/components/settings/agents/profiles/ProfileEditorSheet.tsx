import { useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Slider } from '@/components/ui/slider';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import type { OrganizationProfileDefinition, OrganizationalProfile, ProfileWeights } from '@/lib/types';
import { SYSTEM_PROFILE_ORDER } from '@/lib/organizationProfiles';

interface ProfileEditorSheetProps {
  open: boolean;
  mode: 'create' | 'edit';
  systemProfiles: OrganizationProfileDefinition[];
  editingProfile?: OrganizationProfileDefinition;
  onOpenChange: (open: boolean) => void;
  onCreate: (input: { name: string; description: string; baseProfileId: OrganizationalProfile }) => void;
  onSave: (profile: OrganizationProfileDefinition) => void;
}

const WEIGHT_FIELDS: Array<keyof ProfileWeights> = [
  'news',
  'technical',
  'analyst',
  'risk',
  'survival',
  'investor',
  'auditor',
  'supervisor',
  'archivist',
  'director',
];

const WEIGHT_LABELS: Record<keyof ProfileWeights, string> = {
  news: 'Noticias',
  technical: 'Tecnico',
  analyst: 'Analista',
  risk: 'Riesgo',
  survival: 'Supervivencia',
  investor: 'Inversor',
  auditor: 'Auditor',
  supervisor: 'Supervisor',
  archivist: 'Archivista',
  director: 'Director',
};

export function ProfileEditorSheet({
  open,
  mode,
  systemProfiles,
  editingProfile,
  onOpenChange,
  onCreate,
  onSave,
}: ProfileEditorSheetProps) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [baseProfileId, setBaseProfileId] = useState<OrganizationalProfile>('balanced');
  const [draftWeights, setDraftWeights] = useState<ProfileWeights | null>(null);

  const isCreate = mode === 'create';

  const effectiveWeights = useMemo(() => {
    if (isCreate) return null;
    if (draftWeights) return draftWeights;
    return editingProfile?.weights ?? null;
  }, [isCreate, draftWeights, editingProfile]);

  const startCreate = (baseId: OrganizationalProfile) => {
    setBaseProfileId(baseId);
    const base = systemProfiles.find((p) => p.id === baseId);
    if (base) {
      setDraftWeights({ ...base.weights });
    }
  };

  const handleSaveCreate = () => {
    if (!name.trim()) return;
    onCreate({
      name: name.trim(),
      description: description.trim(),
      baseProfileId,
    });
    setName('');
    setDescription('');
    setBaseProfileId('balanced');
    setDraftWeights(null);
    onOpenChange(false);
  };

  const handleSaveEdit = () => {
    if (!editingProfile || !effectiveWeights || !name.trim()) return;
    onSave({
      ...editingProfile,
      name: name.trim(),
      description: description.trim(),
      weights: effectiveWeights,
    });
    onOpenChange(false);
  };

  const handleOpenChange = (nextOpen: boolean) => {
    if (nextOpen) {
      if (isCreate) {
        setName('');
        setDescription('');
        setBaseProfileId('balanced');
        setDraftWeights(null);
      } else if (editingProfile) {
        setName(editingProfile.name);
        setDescription(editingProfile.description);
        setDraftWeights({ ...editingProfile.weights });
      }
    }
    onOpenChange(nextOpen);
  };

  const weightsForRender = effectiveWeights;

  return (
    <Sheet open={open} onOpenChange={handleOpenChange}>
      <SheetContent side="right" className="sm:max-w-xl w-full overflow-y-auto">
        <SheetHeader>
          <SheetTitle>{isCreate ? 'Nuevo Perfil' : 'Editar Perfil'}</SheetTitle>
          <SheetDescription>
            {isCreate
              ? 'Crea un perfil personalizado a partir de un perfil base del sistema.'
              : 'Ajusta nombre, descripcion y pesos del perfil personalizado.'}
          </SheetDescription>
        </SheetHeader>

        <div className="px-4 pb-4 space-y-5">
          <div className="space-y-2">
            <label className="text-xs uppercase tracking-wide text-muted-foreground">Nombre</label>
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Ej: Crypto Bull Run" />
          </div>

          <div className="space-y-2">
            <label className="text-xs uppercase tracking-wide text-muted-foreground">Descripcion</label>
            <Textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Resumen del perfil" />
          </div>

          {isCreate && (
            <div className="space-y-2">
              <label className="text-xs uppercase tracking-wide text-muted-foreground">Perfil base</label>
              <div className="grid grid-cols-1 gap-2">
                {SYSTEM_PROFILE_ORDER.map((base) => (
                  <button
                    key={base}
                    type="button"
                    className={
                      baseProfileId === base
                        ? 'text-left px-3 py-2 rounded-md border border-primary bg-primary/10 text-sm'
                        : 'text-left px-3 py-2 rounded-md border border-border bg-background/40 text-sm hover:border-primary/40'
                    }
                    onClick={() => startCreate(base)}
                  >
                    {base
                      .split('-')
                      .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
                      .join(' ')}
                  </button>
                ))}
              </div>
            </div>
          )}

          {!isCreate && weightsForRender && (
            <div className="space-y-4">
              <p className="text-xs uppercase tracking-wide text-muted-foreground">Editor de pesos (0 - 200)</p>
              {WEIGHT_FIELDS.map((field) => {
                const value = weightsForRender[field];
                return (
                  <div key={field} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm">{WEIGHT_LABELS[field]}</span>
                      <span className="text-xs font-mono font-semibold">{value}</span>
                    </div>
                    <Slider
                      min={0}
                      max={200}
                      step={1}
                      value={[value]}
                      onValueChange={(next) => {
                        const v = next[0] ?? 0;
                        setDraftWeights((prev) => {
                          const safe = prev ?? (editingProfile?.weights ?? ({} as ProfileWeights));
                          return {
                            ...safe,
                            [field]: v,
                          };
                        });
                      }}
                    />
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <SheetFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
          {isCreate ? (
            <Button onClick={handleSaveCreate}>Crear Perfil</Button>
          ) : (
            <Button onClick={handleSaveEdit}>Guardar Cambios</Button>
          )}
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
