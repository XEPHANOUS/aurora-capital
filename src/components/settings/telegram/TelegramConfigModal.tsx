import { useEffect, useMemo, useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { getRuntimeStateProvider } from '@/runtime/stateProvider';
import { getRuntimeTelegramService, type TelegramRuntimeHealth } from '@/runtime/services/telegramRuntimeService';

interface TelegramConfigModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSaved?: (payload: {
    botToken?: string;
    allowedUserId?: number;
    mode: 'polling' | 'webhook';
    webhookUrl?: string;
    pollingEnabled: boolean;
    lastCheckAt?: string;
    lastError?: string;
    botId?: number;
    botName?: string;
    botUsername?: string;
    status: 'connected' | 'disconnected' | 'not-configured' | 'error';
  }) => void;
}

function formatStatusLabel(status: TelegramRuntimeHealth['status']): string {
  if (status === 'connected') return 'Connected';
  if (status === 'disconnected') return 'Disconnected';
  if (status === 'error') return 'Error';
  return 'Not Configured';
}

export function TelegramConfigModal({ open, onOpenChange, onSaved }: TelegramConfigModalProps) {
  const telegramService = useMemo(() => getRuntimeTelegramService(), []);

  const [tokenInput, setTokenInput] = useState('');
  const [allowedUserIdInput, setAllowedUserIdInput] = useState('');
  const [mode, setMode] = useState<'polling' | 'webhook'>('polling');
  const [webhookUrl, setWebhookUrl] = useState('');
  const [health, setHealth] = useState<TelegramRuntimeHealth>(telegramService.getHealth());
  const [busyAction, setBusyAction] = useState<'test' | 'send' | 'save' | null>(null);
  const [feedback, setFeedback] = useState('');

  const runtimeTelegram = getRuntimeStateProvider().getState().operationalConfig.telegram;
  const maskedToken = telegramService.getMaskedToken();

  useEffect(() => {
    if (!open) return;
    const current = getRuntimeStateProvider().getState().operationalConfig.telegram;
    setAllowedUserIdInput(current?.allowedUserId ? String(current.allowedUserId) : '');
    setMode(current?.mode ?? 'polling');
    setWebhookUrl(current?.webhookUrl ?? '');
    setTokenInput('');
    setFeedback('');
    setHealth(telegramService.getHealth());
  }, [open, telegramService]);

  const parsedAllowedUserId = Number(allowedUserIdInput);
  const allowedUserIdIsValid = Number.isFinite(parsedAllowedUserId) && parsedAllowedUserId > 0;
  const tokenForValidation = tokenInput.trim() || runtimeTelegram?.botToken || '';
  const tokenIsValid = tokenForValidation.length > 20;

  const canSubmit = tokenIsValid && allowedUserIdIsValid;

  const applyRuntimeConfig = async (): Promise<void> => {
    await telegramService.configure({
      botToken: tokenInput.trim() || runtimeTelegram?.botToken,
      allowedUserId: parsedAllowedUserId,
      mode,
      webhookUrl: mode === 'webhook' ? webhookUrl.trim() : undefined,
      pollingEnabled: mode === 'polling',
    });
  };

  const handleSave = async (): Promise<void> => {
    setBusyAction('save');
    setFeedback('');

    if (!canSubmit) {
      setFeedback('Completa Bot Token y Allowed User ID con valores validos.');
      setBusyAction(null);
      return;
    }

    await applyRuntimeConfig();
    await telegramService.start();
    const nextHealth = telegramService.getHealth();
    setHealth(nextHealth);
    setFeedback('Configuracion de Telegram guardada.');
    onSaved?.({
      botToken: tokenInput.trim() || runtimeTelegram?.botToken,
      allowedUserId: parsedAllowedUserId,
      mode,
      webhookUrl: mode === 'webhook' ? webhookUrl.trim() : undefined,
      pollingEnabled: mode === 'polling',
      lastCheckAt: nextHealth.lastCheckAt,
      lastError: nextHealth.lastError,
      botId: nextHealth.botId,
      botName: nextHealth.botName,
      botUsername: nextHealth.botUsername,
      status: nextHealth.status,
    });
    setBusyAction(null);
  };

  const handleTestConnection = async (): Promise<void> => {
    setBusyAction('test');
    setFeedback('');

    if (!canSubmit) {
      setFeedback('Configura token y usuario antes de probar la conexion.');
      setBusyAction(null);
      return;
    }

    await applyRuntimeConfig();
    const result = await telegramService.testConnection();
    const nextHealth = telegramService.getHealth();
    setHealth(nextHealth);

    if (!result.ok) {
      setFeedback(result.error ?? 'Conexion Telegram fallida.');
      setBusyAction(null);
      return;
    }

    setFeedback(
      `Conexion OK. Bot: ${result.botName ?? 'N/A'} (@${result.botUsername ?? 'sin-username'}) ID: ${result.botId ?? 'N/A'}`,
    );
    setBusyAction(null);
  };

  const handleSendTestMessage = async (): Promise<void> => {
    setBusyAction('send');
    setFeedback('');

    await applyRuntimeConfig();
    const result = await telegramService.sendTestMessage();
    const nextHealth = telegramService.getHealth();
    setHealth(nextHealth);

    if (!result.ok) {
      setFeedback(result.error ?? 'No se pudo enviar mensaje de prueba.');
      setBusyAction(null);
      return;
    }

    setFeedback('Mensaje de prueba enviado correctamente.');
    setBusyAction(null);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[640px]">
        <DialogHeader>
          <DialogTitle>Configurar Telegram</DialogTitle>
          <DialogDescription>
            Gestiona credenciales y valida la integracion real con Telegram API.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <Badge variant="outline">{formatStatusLabel(health.status)}</Badge>
            <span className="text-xs text-muted-foreground">
              Modo: {health.mode} · Polling: {health.pollingEnabled ? 'activo' : 'inactivo'}
            </span>
          </div>

          <div className="space-y-2">
            <Label htmlFor="telegram-bot-token">Bot Token</Label>
            <Input
              id="telegram-bot-token"
              type="password"
              autoComplete="off"
              value={tokenInput}
              onChange={(event) => setTokenInput(event.target.value)}
              placeholder={maskedToken || 'Introduce el bot token'}
            />
            <p className="text-xs text-muted-foreground">
              {maskedToken ? `Token actual: ${maskedToken}` : 'Sin token guardado en runtime.'}
            </p>
            {!tokenIsValid && <p className="text-xs text-destructive">El token parece incompleto.</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="telegram-allowed-user">Allowed User ID</Label>
            <Input
              id="telegram-allowed-user"
              inputMode="numeric"
              value={allowedUserIdInput}
              onChange={(event) => setAllowedUserIdInput(event.target.value)}
              placeholder="Ej: 123456789"
            />
            {!allowedUserIdIsValid && <p className="text-xs text-destructive">Introduce un user id valido mayor que 0.</p>}
          </div>

          <div className="space-y-2">
            <Label>Connection Mode</Label>
            <Select value={mode} onValueChange={(value) => setMode(value as 'polling' | 'webhook')}>
              <SelectTrigger>
                <SelectValue placeholder="Selecciona modo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="polling">Polling</SelectItem>
                <SelectItem value="webhook">Webhook (placeholder)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {mode === 'webhook' && (
            <div className="space-y-2">
              <Label htmlFor="telegram-webhook-url">Webhook URL (placeholder)</Label>
              <Input
                id="telegram-webhook-url"
                value={webhookUrl}
                onChange={(event) => setWebhookUrl(event.target.value)}
                placeholder="https://tu-host/telegram/webhook"
              />
            </div>
          )}

          <div className="rounded-md border border-border/60 p-3 text-xs text-muted-foreground space-y-1">
            <p>Ultima comprobacion: {health.lastCheckAt ? new Date(health.lastCheckAt).toLocaleString('es-ES') : 'N/A'}</p>
            <p>Bot: {health.botName ? `${health.botName} (@${health.botUsername ?? 'sin-username'})` : 'N/A'}</p>
            {health.lastError && <p className="text-destructive">Error: {health.lastError}</p>}
          </div>

          {feedback && (
            <div className="rounded-md border border-border/60 bg-background/60 p-3 text-sm">
              {feedback}
            </div>
          )}
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button type="button" variant="outline" onClick={handleTestConnection} disabled={busyAction !== null}>
            Test Connection
          </Button>
          <Button type="button" variant="outline" onClick={handleSendTestMessage} disabled={busyAction !== null}>
            Send Test Message
          </Button>
          <Button type="button" variant="default" onClick={handleSave} disabled={busyAction !== null}>
            Save
          </Button>
          <Button type="button" variant="ghost" onClick={() => onOpenChange(false)} disabled={busyAction !== null}>
            Cancel
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
