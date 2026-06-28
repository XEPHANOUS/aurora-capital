import type { TelegramBotConfig } from '@/lib/integrations/telegram/telegramTypes';

type PartialConfig = Partial<TelegramBotConfig>;

function readEnv(name: string): string | undefined {
  const importMetaEnv = (import.meta as unknown as { env?: Record<string, string | undefined> }).env;
  const fromVite = importMetaEnv?.[name] ?? importMetaEnv?.[`VITE_${name}`];
  const fromProcess = (globalThis as { process?: { env?: Record<string, string | undefined> } }).process?.env?.[name];
  return fromVite ?? fromProcess;
}

function parseAllowedUserId(value: string | undefined): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

export function createTelegramBotConfig(overrides: PartialConfig = {}): TelegramBotConfig {
  const token = overrides.token ?? readEnv('TELEGRAM_BOT_TOKEN') ?? '';
  const allowedUserId = overrides.allowedUserId ?? parseAllowedUserId(readEnv('TELEGRAM_ALLOWED_USER_ID'));

  return {
    token,
    allowedUserId,
    allowedUserIds: overrides.allowedUserIds,
    allowGroups: overrides.allowGroups ?? false,
    unauthorizedMessage: overrides.unauthorizedMessage ?? 'Acceso no autorizado.',
    mode: overrides.mode ?? 'polling',
    polling: {
      enabled: overrides.polling?.enabled ?? true,
      intervalMs: overrides.polling?.intervalMs ?? 1_500,
      timeoutSeconds: overrides.polling?.timeoutSeconds ?? 25,
    },
    webhook: {
      enabled: overrides.webhook?.enabled ?? false,
      url: overrides.webhook?.url,
      secretToken: overrides.webhook?.secretToken,
    },
  };
}

export function isTelegramConfigured(config: TelegramBotConfig): boolean {
  return Boolean(config.token) && Number.isFinite(config.allowedUserId) && config.allowedUserId > 0;
}

export function getTelegramApiBaseUrl(config: TelegramBotConfig): string {
  return `https://api.telegram.org/bot${config.token}`;
}