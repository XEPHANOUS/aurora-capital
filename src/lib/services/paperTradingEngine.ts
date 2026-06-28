import type { PaperPosition, PaperTradingSnapshot } from '@/lib/types';

export interface OpenPaperPositionInput {
  environment: 'sandbox' | 'demo' | 'paper';
  symbol: string;
  side: 'long' | 'short';
  quantity: number;
  entryPrice: number;
  stopLoss?: number;
  takeProfit?: number;
  trailingStopPercent?: number;
  maxRiskAmount?: number;
}

export function openPaperPosition(input: OpenPaperPositionInput): PaperPosition {
  return {
    id: `paper-${input.environment}-${Date.now()}-${Math.round(Math.random() * 1000)}`,
    environment: input.environment,
    symbol: input.symbol,
    side: input.side,
    quantity: input.quantity,
    entryPrice: input.entryPrice,
    currentPrice: input.entryPrice,
    stopLoss: input.stopLoss,
    takeProfit: input.takeProfit,
    trailingStopPercent: input.trailingStopPercent,
    trailingStopPrice:
      input.trailingStopPercent !== undefined
        ? input.entryPrice * (1 - input.trailingStopPercent / 100)
        : undefined,
    status: 'open',
    openedAt: new Date().toISOString(),
    maxRiskAmount: input.maxRiskAmount,
  };
}

export function updatePaperPositionPrice(position: PaperPosition, currentPrice: number): PaperPosition {
  const next = { ...position, currentPrice };

  if (next.trailingStopPercent !== undefined && next.side === 'long') {
    const candidate = currentPrice * (1 - next.trailingStopPercent / 100);
    next.trailingStopPrice = Math.max(next.trailingStopPrice ?? 0, candidate);
  }

  return next;
}

export function shouldAutoClose(position: PaperPosition): { close: boolean; reason?: string } {
  if (position.status !== 'open') return { close: false };

  if (position.side === 'long') {
    if (position.stopLoss !== undefined && position.currentPrice <= position.stopLoss) {
      return { close: true, reason: 'Stop Loss alcanzado' };
    }
    if (position.takeProfit !== undefined && position.currentPrice >= position.takeProfit) {
      return { close: true, reason: 'Take Profit alcanzado' };
    }
    if (position.trailingStopPrice !== undefined && position.currentPrice <= position.trailingStopPrice) {
      return { close: true, reason: 'Trailing Stop alcanzado' };
    }
  }

  return { close: false };
}

export function closePaperPosition(position: PaperPosition, exitPrice: number): PaperPosition {
  const gross = (exitPrice - position.entryPrice) * position.quantity;
  const pnl = position.side === 'long' ? gross : -gross;
  const pnlPercent = position.entryPrice > 0 ? (pnl / (position.entryPrice * position.quantity)) * 100 : 0;

  return {
    ...position,
    status: 'closed',
    currentPrice: exitPrice,
    closedAt: new Date().toISOString(),
    realizedPnl: pnl,
    realizedPnlPercent: pnlPercent,
  };
}

export function buildPaperTradingSnapshot(positions: PaperPosition[], history: PaperPosition[]): PaperTradingSnapshot {
  const openPositions = positions.filter((position) => position.status === 'open');
  const closedPositions = history.filter((position) => position.status === 'closed');

  const realizedPnl = closedPositions.reduce((sum, position) => sum + (position.realizedPnl ?? 0), 0);
  const unrealizedPnl = openPositions.reduce((sum, position) => {
    const gross = (position.currentPrice - position.entryPrice) * position.quantity;
    const pnl = position.side === 'long' ? gross : -gross;
    return sum + pnl;
  }, 0);

  const totalRiskAmount = openPositions.reduce((sum, position) => sum + (position.maxRiskAmount ?? 0), 0);

  return {
    positions,
    realizedPnl,
    unrealizedPnl,
    totalRiskAmount,
    historyCount: history.length,
  };
}
