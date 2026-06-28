import { useMemo, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import type { AuroraBackupSnapshot } from '@/lib/backup';
import { isValidAuroraBackupSnapshot, serializeBackup } from '@/lib/backup';

interface BackupSettingsSectionProps {
  onExportBackup: () => AuroraBackupSnapshot;
  onRestoreBackup: (snapshot: AuroraBackupSnapshot) => { ok: boolean; message: string };
}

export function BackupSettingsSection({ onExportBackup, onRestoreBackup }: BackupSettingsSectionProps) {
  const [backupJson, setBackupJson] = useState('');
  const [lastMessage, setLastMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const parsedBackup = useMemo(() => {
    if (!backupJson.trim()) return null;
    try {
      const candidate = JSON.parse(backupJson) as unknown;
      if (!isValidAuroraBackupSnapshot(candidate)) return null;
      return candidate;
    } catch {
      return null;
    }
  }, [backupJson]);

  const handleExportBackup = () => {
    const snapshot = onExportBackup();
    const serialized = serializeBackup(snapshot);
    setBackupJson(serialized);

    const blob = new Blob([serialized], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = `aurora-backup-${snapshot.exportedAt.replace(/[:.]/g, '-')}.json`;
    anchor.click();
    URL.revokeObjectURL(url);

    setLastMessage({ type: 'success', text: 'Backup exportado correctamente.' });
  };

  const handleRestoreBackup = () => {
    if (!parsedBackup) {
      setLastMessage({ type: 'error', text: 'JSON inválido o formato de backup no reconocido.' });
      return;
    }

    const result = onRestoreBackup(parsedBackup);
    setLastMessage({ type: result.ok ? 'success' : 'error', text: result.message });
  };

  const handleFileImport = async (file: File | null) => {
    if (!file) return;

    const content = await file.text();
    setBackupJson(content);
  };

  return (
    <div className="space-y-6">
      <div className="pb-2">
        <h3 className="font-heading font-bold text-2xl sm:text-3xl mb-2 tracking-tight">Backups</h3>
        <p className="text-sm text-muted-foreground/80">
          Exporta e importa la configuración completa de Aurora en formato JSON.
        </p>
      </div>

      <Card className="p-5 bg-card/50 backdrop-blur-sm border-border/50 space-y-4">
        <div className="flex flex-wrap items-center gap-3">
          <Button onClick={handleExportBackup}>Exportar backup JSON</Button>
          <Label htmlFor="backup-file" className="cursor-pointer">
            <span className="inline-flex h-9 items-center justify-center rounded-md border border-border bg-background px-4 text-sm font-medium">
              Importar archivo JSON
            </span>
          </Label>
          <input
            id="backup-file"
            type="file"
            accept="application/json"
            className="hidden"
            onChange={(event) => {
              const file = event.target.files?.[0] ?? null;
              void handleFileImport(file);
            }}
          />
          <Button variant="outline" onClick={handleRestoreBackup}>Restaurar backup</Button>

          {parsedBackup ? (
            <Badge variant="outline" className="border-accent text-accent">Backup válido</Badge>
          ) : (
            <Badge variant="outline" className="border-muted-foreground text-muted-foreground">Backup pendiente</Badge>
          )}
        </div>

        {lastMessage && (
          <p className={lastMessage.type === 'success' ? 'text-sm text-accent' : 'text-sm text-destructive'}>
            {lastMessage.text}
          </p>
        )}

        <div className="space-y-2">
          <Label htmlFor="backup-json">Contenido JSON</Label>
          <Textarea
            id="backup-json"
            className="min-h-[360px] font-mono text-xs"
            value={backupJson}
            onChange={(event) => setBackupJson(event.target.value)}
            placeholder="Pega aquí tu backup JSON para restaurar..."
          />
        </div>
      </Card>
    </div>
  );
}
