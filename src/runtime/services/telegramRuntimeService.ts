import {
  TelegramBotService,
  type TelegramBotHealth,
  type TelegramConnectionCheckResult,
} from '@/lib/integrations/telegram/telegramBot';
import type { RuntimeService } from '@/runtime/runtimeTypes';
import { getRuntimeStateProvider } from '@/runtime/stateProvider';

export interface TelegramRuntimeHealth {
  status: 'connected' | 'disconnected' | 'not-configured' | 'error';
  configured: boolean;
  running: boolean;
  mode: 'polling' | 'webhook';
  pollingEnabled: boolean;
  updateOffset: number;
  lastCheckAt?: string;
  lastError?: string;
  botId?: number;
  botName?: string;
  botUsername?: string;
}

export interface TelegramRuntimeConfigInput {
  botToken?: string;
  allowedUserId?: number;
  mode?: 'polling' | 'webhook';
  webhookUrl?: string;
  pollingEnabled?: boolean;
}

function resolveRuntimeConfig(input: TelegramRuntimeConfigInput = {}): TelegramRuntimeConfigInput {
  const operational = getRuntimeStateProvider().getState().operationalConfig.telegram;
  return {
    botToken: input.botToken ?? operational?.botToken,
    allowedUserId: input.allowedUserId ?? operational?.allowedUserId,
    mode: input.mode ?? operational?.mode ?? 'polling',
    webhookUrl: input.webhookUrl ?? operational?.webhookUrl,
    pollingEnabled: input.pollingEnabled ?? operational?.pollingEnabled ?? true,
  };
}

function mapHealth(health: TelegramBotHealth): TelegramRuntimeHealth {
  const operational = getRuntimeStateProvider().getState().operationalConfig.telegram;
  return {
    status: !health.configured
      ? 'not-configured'
      : operational?.lastError
      ? 'error'
      : health.running
      ? 'connected'
      : 'disconnected',
    configured: health.configured,
    running: health.running,
    mode: health.mode,
    pollingEnabled: health.pollingEnabled,
    updateOffset: health.updateOffset,
    lastCheckAt: operational?.lastCheckAt,
    lastError: operational?.lastError,
    botId: operational?.botId,
    botName: operational?.botName,
    botUsername: operational?.botUsername,
  };
}

export class RuntimeTelegramService implements RuntimeService {
  readonly name = 'telegram';
  private botService: TelegramBotService | null = null;

  async start(): Promise<void> {
    this.ensureBot();
    if (!this.botService || !this.botService.isConfigured()) {
      this.updateOperationalState({
        status: 'not-configured',
      });
      return;
    }

    try {
      await this.botService.start();
      this.updateOperationalState({
        status: 'connected',
        lastError: undefined,
      });
    } catch {
      this.updateOperationalState({
        status: 'error',
        lastError: 'No se pudo iniciar Telegram polling.',
      });
    }
  }

  async stop(): Promise<void> {
    this.botService?.stop();
    const current = this.getHealth();
    this.updateOperationalState({
      status: current.configured ? 'disconnected' : 'not-configured',
    });
  }

  async configure(input: TelegramRuntimeConfigInput): Promise<void> {
    const resolved = resolveRuntimeConfig(input);
    this.botService?.stop();
    this.botService = new TelegramBotService({
      config: {
        token: resolved.botToken,
        allowedUserId: resolved.allowedUserId,
        mode: resolved.mode,
        allowGroups: false,
        polling: {
          enabled: resolved.pollingEnabled ?? true,
          intervalMs: 1_500,
          timeoutSeconds: 25,
        },
        webhook: {
          enabled: resolved.mode === 'webhook',
          url: resolved.webhookUrl,
        },
      },
    });

    const configured = this.botService.isConfigured();
    this.updateOperationalState({
      botToken: resolved.botToken,
      allowedUserId: resolved.allowedUserId,
      mode: resolved.mode ?? 'polling',
      webhookUrl: resolved.webhookUrl,
      pollingEnabled: resolved.pollingEnabled ?? true,
      status: configured ? 'disconnected' : 'not-configured',
      lastError: undefined,
    });
  }

  getMaskedToken(): string {
    const token = getRuntimeStateProvider().getState().operationalConfig.telegram?.botToken;
    if (!token) return '';
    if (token.length <= 8) return '********';
    return `${token.slice(0, 4)}********${token.slice(-4)}`;
  }

  getHealth(): TelegramRuntimeHealth {
    this.ensureBot();
    if (!this.botService) {
      return {
        status: 'not-configured',
        configured: false,
        running: false,
        mode: 'polling',
        pollingEnabled: true,
        updateOffset: 0,
      };
    }
    return mapHealth(this.botService.getHealth());
  }

  async testConnection(): Promise<TelegramConnectionCheckResult> {
    this.ensureBot();
    if (!this.botService) {
      const result = {
        ok: false,
        error: 'Servicio Telegram no inicializado.',
      };
      this.updateCheckResult(result);
      return result;
    }

    const result = await this.botService.testConnection();
    this.updateCheckResult(result);
    return result;
  }

  async sendTestMessage(): Promise<{ ok: boolean; error?: string }> {
    this.ensureBot();
    if (!this.botService) {
      return { ok: false, error: 'Servicio Telegram no inicializado.' };
    }

    const operational = getRuntimeStateProvider().getState().operationalConfig.telegram;
    const userId = operational?.allowedUserId;
    if (!userId || userId <= 0) {
      return { ok: false, error: 'Allowed User ID no configurado.' };
    }

    const ok = await this.botService.sendMessage(
      userId,
      'Aurora Capital: conexión Telegram verificada correctamente.',
    );

    if (!ok) {
      this.updateOperationalState({
        status: 'error',
        lastError: 'No se pudo enviar mensaje de prueba.',
        lastCheckAt: new Date().toISOString(),
      });
      return { ok: false, error: 'Telegram API rechazo el envio de prueba.' };
    }

    this.updateOperationalState({
      status: 'connected',
      lastError: undefined,
      lastCheckAt: new Date().toISOString(),
    });
    return { ok: true };
  }

  private ensureBot(): void {
    if (this.botService) return;
    const operational = getRuntimeStateProvider().getState().operationalConfig.telegram;
    this.botService = new TelegramBotService({
      config: {
        token: operational?.botToken,
        allowedUserId: operational?.allowedUserId,
        mode: operational?.mode ?? 'polling',
        allowGroups: false,
        polling: {
          enabled: operational?.pollingEnabled ?? true,
          intervalMs: 1_500,
          timeoutSeconds: 25,
        },
        webhook: {
          enabled: (operational?.mode ?? 'polling') === 'webhook',
          url: operational?.webhookUrl,
        },
      },
    });
  }

  private updateCheckResult(result: TelegramConnectionCheckResult): void {
    this.updateOperationalState({
      status: result.ok ? 'connected' : 'error',
      lastCheckAt: new Date().toISOString(),
      lastError: result.ok ? undefined : result.error,
      botId: result.botId,
      botName: result.botName,
      botUsername: result.botUsername,
    });
  }

  private updateOperationalState(
    patch: Partial<NonNullable<ReturnType<typeof getRuntimeStateProvider>['getState']>['operationalConfig']['telegram']>,
  ): void {
    const provider = getRuntimeStateProvider();
    const currentTelegram = provider.getState().operationalConfig.telegram;

    provider.updateState({
      operationalConfig: {
        telegramConnected: patch.status ? patch.status === 'connected' : provider.getState().operationalConfig.telegramConnected,
        telegram: {
          mode: 'polling',
          pollingEnabled: true,
          status: 'not-configured',
          ...currentTelegram,
          ...patch,
        },
      },
    });
  }
}

let runtimeTelegramServiceSingleton: RuntimeTelegramService | null = null;

export function getRuntimeTelegramService(): RuntimeTelegramService {
  if (!runtimeTelegramServiceSingleton) {
    runtimeTelegramServiceSingleton = new RuntimeTelegramService();
  }
  return runtimeTelegramServiceSingleton;
}
