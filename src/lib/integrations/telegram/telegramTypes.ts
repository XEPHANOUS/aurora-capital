import type { ChatTurnResult } from '@/lib/chat/types';
import type { SystemContext } from '@/lib/chat/systemContext';

export type TelegramChatType = 'private' | 'group' | 'supergroup' | 'channel';

export interface TelegramUser {
  id: number;
  username?: string;
  firstName?: string;
  lastName?: string;
  isBot?: boolean;
  languageCode?: string;
}

export interface TelegramMessage {
  messageId: number;
  chatId: number;
  chatType: TelegramChatType;
  text: string;
  date: number;
  from?: TelegramUser;
  raw?: unknown;
}

export type TelegramCommandName =
  | '/status'
  | '/asset'
  | '/capital'
  | '/agents'
  | '/positions'
  | '/pnl'
  | '/risk'
  | '/strategy'
  | '/recommendation'
  | '/pause'
  | '/resume'
  | '/help';

export interface TelegramCommand {
  name: TelegramCommandName;
  description: string;
  actionType: 'read' | 'control';
  requiresAuth: boolean;
}

export interface TelegramCommandPayload {
  command: TelegramCommandName;
  symbol?: string;
  acknowledged: boolean;
  actionType: 'read' | 'control';
  pendingImplementation: boolean;
  message: string;
  timestamp: string;
}

export interface TelegramBotConfig {
  token: string;
  allowedUserId: number;
  allowedUserIds?: number[];
  allowGroups?: boolean;
  unauthorizedMessage?: string;
  mode?: 'polling' | 'webhook';
  polling?: {
    enabled: boolean;
    intervalMs: number;
    timeoutSeconds: number;
  };
  webhook?: {
    enabled: boolean;
    url?: string;
    secretToken?: string;
  };
}

export interface TelegramUpdate {
  updateId: number;
  message?: TelegramMessage;
}

export interface TelegramAccessValidation {
  ok: boolean;
  reason?: string;
  user?: TelegramUser;
}

export interface TelegramRouteContext {
  message: TelegramMessage;
  command?: TelegramCommand;
}

export interface TelegramRouteResult {
  kind: 'command' | 'chat';
  replyText: string;
  payload?: TelegramCommandPayload | TelegramBridgeResponse;
}

export interface TelegramStatusSnapshot {
  activeEnvironment: SystemContext['activeEnvironment'];
  environmentLabel: SystemContext['environmentLabel'];
  totalCapital: number;
  survivalReserve: number;
  operationalCapital: number;
  activeProfile: string;
  systemStatus: SystemContext['systemStatus'];
}

export interface TelegramBridgeResponse {
  source: 'aurora-status' | 'aurora-strategic-chat';
  text: string;
  statusSnapshot?: TelegramStatusSnapshot;
  chatTurn?: ChatTurnResult;
}

export interface TelegramFutureHooks {
  onAlert?: (payload: unknown) => Promise<void>;
  onPaperTradingSignal?: (payload: unknown) => Promise<void>;
  onRealTradingSignal?: (payload: unknown) => Promise<void>;
  onAgentNotification?: (payload: unknown) => Promise<void>;
  onDailySummary?: (payload: unknown) => Promise<void>;
}