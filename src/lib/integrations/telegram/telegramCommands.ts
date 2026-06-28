import type {
  TelegramCommand,
  TelegramCommandName,
  TelegramCommandPayload,
} from '@/lib/integrations/telegram/telegramTypes';

const COMMANDS: TelegramCommand[] = [
  {
    name: '/status',
    description: 'Estado operativo actual de Aurora Capital',
    actionType: 'read',
    requiresAuth: true,
  },
  {
    name: '/asset',
    description: 'Analisis sintetico por activo. Uso: /asset BTC',
    actionType: 'read',
    requiresAuth: true,
  },
  {
    name: '/capital',
    description: 'Resumen de capital y reserva',
    actionType: 'read',
    requiresAuth: true,
  },
  {
    name: '/agents',
    description: 'Estado de agentes y jerarquia',
    actionType: 'read',
    requiresAuth: true,
  },
  {
    name: '/positions',
    description: 'Posiciones activas y exposicion',
    actionType: 'read',
    requiresAuth: true,
  },
  {
    name: '/pnl',
    description: 'PnL realizado y no realizado',
    actionType: 'read',
    requiresAuth: true,
  },
  {
    name: '/risk',
    description: 'Resumen de riesgo operativo actual',
    actionType: 'read',
    requiresAuth: true,
  },
  {
    name: '/strategy',
    description: 'Estrategia activa y modo operativo',
    actionType: 'read',
    requiresAuth: true,
  },
  {
    name: '/recommendation',
    description: 'Ultima recomendacion del sistema',
    actionType: 'read',
    requiresAuth: true,
  },
  {
    name: '/pause',
    description: 'Pausar operativa automatica',
    actionType: 'control',
    requiresAuth: true,
  },
  {
    name: '/resume',
    description: 'Reanudar operativa automatica',
    actionType: 'control',
    requiresAuth: true,
  },
  {
    name: '/help',
    description: 'Mostrar comandos disponibles',
    actionType: 'read',
    requiresAuth: true,
  },
];

const COMMANDS_BY_NAME: Record<TelegramCommandName, TelegramCommand> = COMMANDS.reduce(
  (acc, cmd) => {
    acc[cmd.name] = cmd;
    return acc;
  },
  {} as Record<TelegramCommandName, TelegramCommand>,
);

function normalizeCommand(text: string): string {
  return text.trim().split(/\s+/)[0]?.toLowerCase() ?? '';
}

export function parseTelegramCommandInput(text: string): { command?: TelegramCommand; args: string[] } {
  const parts = text.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return { args: [] };

  const name = parts[0].toLowerCase();
  if (!name.startsWith('/')) return { args: parts };

  const command = COMMANDS.find((item) => item.name === (name as TelegramCommandName));
  return { command, args: parts.slice(1) };
}

export function parseTelegramCommand(text: string): TelegramCommand | undefined {
  const normalized = normalizeCommand(text);
  if (!normalized.startsWith('/')) return undefined;
  return COMMANDS.find((command) => command.name === normalized as TelegramCommandName);
}

export function getTelegramCommands(): TelegramCommand[] {
  return [...COMMANDS];
}

export function buildCommandPayload(commandName: TelegramCommandName): TelegramCommandPayload {
  const command = COMMANDS_BY_NAME[commandName];
  return {
    command: command.name,
    acknowledged: true,
    actionType: command.actionType,
    pendingImplementation:
      command.name !== '/status' &&
      command.name !== '/help' &&
      command.name !== '/asset' &&
      command.name !== '/capital' &&
      command.name !== '/agents' &&
      command.name !== '/positions' &&
      command.name !== '/pnl' &&
      command.name !== '/risk' &&
      command.name !== '/strategy',
    message:
      command.name === '/status'
        ? 'Comando aceptado. Se ejecuta via Aurora Bridge.'
        : command.name === '/asset'
        ? 'Comando aceptado. Generando analisis de activo.'
        : command.name === '/capital' || command.name === '/agents' || command.name === '/positions' || command.name === '/pnl' || command.name === '/risk' || command.name === '/strategy'
        ? 'Comando aceptado. Consultando estado operativo.'
        : command.name === '/help'
        ? 'Comando informativo. Sin efectos operativos.'
        : 'Comando registrado. Accion operativa aun no habilitada.',
    timestamp: new Date().toISOString(),
  };
}

export function formatHelpMessage(): string {
  return COMMANDS.map((cmd) => `${cmd.name} - ${cmd.description}`).join('\n');
}