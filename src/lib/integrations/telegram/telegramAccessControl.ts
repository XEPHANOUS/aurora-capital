import type {
  TelegramAccessValidation,
  TelegramBotConfig,
  TelegramMessage,
  TelegramUser,
} from '@/lib/integrations/telegram/telegramTypes';

export function isAuthorizedUser(user: TelegramUser | undefined, config: TelegramBotConfig): boolean {
  if (!user) return false;

  const allowed = new Set<number>([config.allowedUserId, ...(config.allowedUserIds ?? [])].filter((id) => id > 0));
  return allowed.has(user.id);
}

export function validateTelegramUser(
  message: TelegramMessage,
  config: TelegramBotConfig,
): TelegramAccessValidation {
  if (!config.allowGroups && message.chatType !== 'private') {
    return {
      ok: false,
      reason: 'group-chat-disabled',
      user: message.from,
    };
  }

  if (!isAuthorizedUser(message.from, config)) {
    return {
      ok: false,
      reason: 'unauthorized-user',
      user: message.from,
    };
  }

  return {
    ok: true,
    user: message.from,
  };
}