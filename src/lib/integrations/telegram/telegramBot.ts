import { validateTelegramUser } from '@/lib/integrations/telegram/telegramAccessControl';
import { createTelegramBotConfig, getTelegramApiBaseUrl, isTelegramConfigured } from '@/lib/integrations/telegram/telegramConfig';
import { routeTelegramMessage } from '@/lib/integrations/telegram/telegramMessageRouter';
import type {
  TelegramBotConfig,
  TelegramFutureHooks,
  TelegramMessage,
  TelegramUpdate,
} from '@/lib/integrations/telegram/telegramTypes';

interface TelegramApiUpdate {
  update_id: number;
  message?: {
    message_id: number;
    date: number;
    text?: string;
    chat: {
      id: number;
      type: 'private' | 'group' | 'supergroup' | 'channel';
    };
    from?: {
      id: number;
      is_bot?: boolean;
      first_name?: string;
      last_name?: string;
      username?: string;
      language_code?: string;
    };
  };
}

interface TelegramGetUpdatesResponse {
  ok: boolean;
  result: TelegramApiUpdate[];
}

interface TelegramGetMeResponse {
  ok: boolean;
  result?: {
    id: number;
    is_bot: boolean;
    first_name: string;
    username?: string;
  };
}

interface TelegramSendMessageResponse {
  ok: boolean;
}

interface TelegramBotServiceOptions {
  config?: Partial<TelegramBotConfig>;
  hooks?: TelegramFutureHooks;
  fetchImpl?: typeof fetch;
}

function createSafeFetch(fetchImpl?: typeof fetch): typeof fetch {
  if (fetchImpl) {
    return ((input: RequestInfo | URL, init?: RequestInit) => fetchImpl(input, init)) as typeof fetch;
  }

  return ((input: RequestInfo | URL, init?: RequestInit) => globalThis.fetch(input, init)) as typeof fetch;
}

export interface TelegramBotHealth {
  configured: boolean;
  running: boolean;
  mode: 'polling' | 'webhook';
  pollingEnabled: boolean;
  updateOffset: number;
}

export interface TelegramConnectionCheckResult {
  ok: boolean;
  botId?: number;
  botName?: string;
  botUsername?: string;
  error?: string;
}

function mapTelegramApiMessage(raw: TelegramApiUpdate['message']): TelegramMessage | undefined {
  if (!raw?.text) return undefined;

  return {
    messageId: raw.message_id,
    chatId: raw.chat.id,
    chatType: raw.chat.type,
    text: raw.text,
    date: raw.date,
    from: raw.from
      ? {
          id: raw.from.id,
          username: raw.from.username,
          firstName: raw.from.first_name,
          lastName: raw.from.last_name,
          isBot: raw.from.is_bot,
          languageCode: raw.from.language_code,
        }
      : undefined,
    raw,
  };
}

export class TelegramBotService {
  private readonly config: TelegramBotConfig;
  private readonly apiBaseUrl: string;
  private readonly fetchImpl: typeof fetch;
  private readonly hooks: TelegramFutureHooks;

  private running = false;
  private pollingTimer: ReturnType<typeof setTimeout> | null = null;
  private updateOffset = 0;

  constructor(options: TelegramBotServiceOptions = {}) {
    this.config = createTelegramBotConfig(options.config);
    this.apiBaseUrl = getTelegramApiBaseUrl(this.config);
    this.fetchImpl = createSafeFetch(options.fetchImpl);
    this.hooks = options.hooks ?? {};
  }

  isConfigured(): boolean {
    return isTelegramConfigured(this.config);
  }

  getHealth(): TelegramBotHealth {
    return {
      configured: this.isConfigured(),
      running: this.running,
      mode: this.config.mode ?? 'polling',
      pollingEnabled: this.config.polling?.enabled ?? true,
      updateOffset: this.updateOffset,
    };
  }

  async start(): Promise<void> {
    if (this.running) return;
    if (!isTelegramConfigured(this.config)) {
      throw new Error('Telegram no configurado. Define TELEGRAM_BOT_TOKEN y TELEGRAM_ALLOWED_USER_ID.');
    }

    this.running = true;

    if (this.config.mode === 'webhook' && this.config.webhook?.enabled) {
      return;
    }

    this.schedulePolling(0);
  }

  stop(): void {
    this.running = false;
    if (this.pollingTimer) {
      clearTimeout(this.pollingTimer);
      this.pollingTimer = null;
    }
  }

  async sendMessage(chatId: number, text: string): Promise<boolean> {
    const payload = {
      chat_id: chatId,
      text,
      parse_mode: 'HTML',
    };

    const response = await this.fetchImpl(`${this.apiBaseUrl}/sendMessage`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) return false;
    const body = (await response.json()) as TelegramSendMessageResponse;
    return body.ok;
  }

  async testConnection(): Promise<TelegramConnectionCheckResult> {
    try {
      if (!this.isConfigured()) {
        return {
          ok: false,
          error: 'Telegram no configurado. Define token y allowed user id.',
        };
      }

      const response = await this.fetchImpl(`${this.apiBaseUrl}/getMe`, {
        method: 'GET',
      });

      if (!response.ok) {
        return {
          ok: false,
          error: `Telegram API error (${response.status}).`,
        };
      }

      const body = (await response.json()) as TelegramGetMeResponse;
      if (!body.ok || !body.result) {
        return {
          ok: false,
          error: 'Respuesta invalida desde Telegram getMe.',
        };
      }

      return {
        ok: true,
        botId: body.result.id,
        botName: body.result.first_name,
        botUsername: body.result.username,
      };
    } catch (error) {
      const detail = error instanceof Error ? error.message : 'Unknown error';
      return {
        ok: false,
        error: `No se pudo conectar con Telegram API. ${detail}`,
      };
    }
  }

  async handleUpdate(update: TelegramUpdate): Promise<void> {
    if (!update.message) return;

    const access = validateTelegramUser(update.message, this.config);
    if (!access.ok) {
      await this.sendMessage(update.message.chatId, this.config.unauthorizedMessage ?? 'Acceso no autorizado.');
      return;
    }

    const routeResult = routeTelegramMessage(update.message);
    await this.sendMessage(update.message.chatId, routeResult.replyText);
  }

  private schedulePolling(delayMs: number): void {
    if (!this.running) return;
    this.pollingTimer = setTimeout(() => {
      void this.pollOnce();
    }, delayMs);
  }

  private async pollOnce(): Promise<void> {
    if (!this.running) return;

    try {
      const timeout = this.config.polling?.timeoutSeconds ?? 25;
      const response = await this.fetchImpl(
        `${this.apiBaseUrl}/getUpdates?offset=${this.updateOffset}&timeout=${timeout}`,
      );

      if (response.ok) {
        const body = (await response.json()) as TelegramGetUpdatesResponse;
        for (const rawUpdate of body.result ?? []) {
          this.updateOffset = Math.max(this.updateOffset, rawUpdate.update_id + 1);

          const mappedMessage = mapTelegramApiMessage(rawUpdate.message);
          if (!mappedMessage) continue;

          await this.handleUpdate({
            updateId: rawUpdate.update_id,
            message: mappedMessage,
          });
        }
      }
    } catch {
      // Keep polling alive; hook reserved for future telemetry/alerts.
      void this.hooks.onAlert?.({
        source: 'telegram-bot-service',
        type: 'polling-error',
        at: new Date().toISOString(),
      });
    } finally {
      const interval = this.config.polling?.intervalMs ?? 1_500;
      this.schedulePolling(interval);
    }
  }
}