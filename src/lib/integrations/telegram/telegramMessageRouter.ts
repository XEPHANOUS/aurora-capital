import {
  buildCommandPayload,
  formatHelpMessage,
  parseTelegramCommandInput,
} from '@/lib/integrations/telegram/telegramCommands';
import {
  handleAgentsQuery,
  handleAssetQuery,
  handleCapitalQuery,
  handlePnlQuery,
  handlePositionsQuery,
  handleRiskQuery,
  handleStrategyQuery,
  handleStatusQuery,
  handleStrategicQuery,
} from '@/lib/integrations/telegram/telegramAuroraBridge';
import type {
  TelegramMessage,
  TelegramRouteContext,
  TelegramRouteResult,
} from '@/lib/integrations/telegram/telegramTypes';

function cleanIncomingText(message: TelegramMessage): string {
  return message.text.trim();
}

export function buildRouteContext(message: TelegramMessage): TelegramRouteContext {
  const text = cleanIncomingText(message);
  const parsed = parseTelegramCommandInput(text);
  return {
    message,
    command: parsed.command,
  };
}

export function routeTelegramMessage(message: TelegramMessage): TelegramRouteResult {
  const ctx = buildRouteContext(message);
  const text = cleanIncomingText(message);

  if (ctx.command) {
    if (ctx.command.name === '/status') {
      const response = handleStatusQuery();
      return {
        kind: 'command',
        replyText: response.text,
        payload: response,
      };
    }

    if (ctx.command.name === '/help') {
      const payload = buildCommandPayload('/help');
      return {
        kind: 'command',
        replyText: formatHelpMessage(),
        payload,
      };
    }

    if (ctx.command.name === '/asset') {
      const parsed = parseTelegramCommandInput(text);
      const symbol = parsed.args[0]?.toUpperCase();
      const response = handleAssetQuery(symbol);
      const payload = {
        ...buildCommandPayload('/asset'),
        symbol,
      };
      return {
        kind: 'command',
        replyText: response.text,
        payload,
      };
    }

    if (ctx.command.name === '/capital') {
      const response = handleCapitalQuery();
      return {
        kind: 'command',
        replyText: response.text,
        payload: buildCommandPayload('/capital'),
      };
    }

    if (ctx.command.name === '/agents') {
      const response = handleAgentsQuery();
      return {
        kind: 'command',
        replyText: response.text,
        payload: buildCommandPayload('/agents'),
      };
    }

    if (ctx.command.name === '/positions') {
      const response = handlePositionsQuery();
      return {
        kind: 'command',
        replyText: response.text,
        payload: buildCommandPayload('/positions'),
      };
    }

    if (ctx.command.name === '/pnl') {
      const response = handlePnlQuery();
      return {
        kind: 'command',
        replyText: response.text,
        payload: buildCommandPayload('/pnl'),
      };
    }

    if (ctx.command.name === '/risk') {
      const response = handleRiskQuery();
      return {
        kind: 'command',
        replyText: response.text,
        payload: buildCommandPayload('/risk'),
      };
    }

    if (ctx.command.name === '/strategy') {
      const response = handleStrategyQuery();
      return {
        kind: 'command',
        replyText: response.text,
        payload: buildCommandPayload('/strategy'),
      };
    }

    const payload = buildCommandPayload(ctx.command.name);
    return {
      kind: 'command',
      replyText: JSON.stringify(payload, null, 2),
      payload,
    };
  }

  const response = handleStrategicQuery(text);
  return {
    kind: 'chat',
    replyText: response.text,
    payload: response,
  };
}