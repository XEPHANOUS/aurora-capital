import { processChatTurn } from '@/lib/chat/consensusEngine';
import { formatCtxCurrency } from '@/lib/chat/systemContext';
import { buildAssetAnalysis } from '@/lib/assetAnalysis';
import { formatOperationalTelegramMessage } from '@/lib/market/operationalMarketPipeline';
import type { MarketSymbol } from '@/lib/market/types';
import type {
  TelegramBridgeResponse,
  TelegramStatusSnapshot,
} from '@/lib/integrations/telegram/telegramTypes';
import {
  generateCryptoAssets,
  generateStockAssets,
  generateETFAssets,
  generateForexAssets,
  generateCommodityAssets,
  generateIndexAssets,
  generateRealEstateAssets,
} from '@/lib/services/marketDataGenerator';
import { getRuntimeStateProvider } from '@/runtime/stateProvider';

function normalizeStatusLabel(status: TelegramStatusSnapshot['systemStatus']): string {
  const labels: Record<TelegramStatusSnapshot['systemStatus'], string> = {
    optimal: 'Optimal',
    normal: 'Normal',
    degraded: 'Degraded',
    alert: 'Alert',
  };
  return labels[status];
}

export function buildAuroraStatusSnapshot(): TelegramStatusSnapshot {
  const ctx = getRuntimeStateProvider().getState().context;

  return {
    activeEnvironment: ctx.activeEnvironment,
    environmentLabel: ctx.environmentLabel,
    totalCapital: ctx.totalCapital,
    survivalReserve: ctx.survivalReserve,
    operationalCapital: ctx.operationalCapital,
    activeProfile: ctx.organizationProfileLabel || ctx.organizationProfile,
    systemStatus: ctx.systemStatus,
  };
}

function formatStatusReply(snapshot: TelegramStatusSnapshot): string {
  return [
    'Aurora Capital - Estado actual',
    `Entorno: ${snapshot.environmentLabel} (${snapshot.activeEnvironment})`,
    `Capital total: ${formatCtxCurrency(snapshot.totalCapital)}`,
    `Reserva: ${formatCtxCurrency(snapshot.survivalReserve)}`,
    `Capital operativo: ${formatCtxCurrency(snapshot.operationalCapital)}`,
    `Perfil activo: ${snapshot.activeProfile}`,
    `Estado del sistema: ${normalizeStatusLabel(snapshot.systemStatus)}`,
  ].join('\n');
}

export function handleStatusQuery(): TelegramBridgeResponse {
  const snapshot = buildAuroraStatusSnapshot();
  return {
    source: 'aurora-status',
    text: formatStatusReply(snapshot),
    statusSnapshot: snapshot,
  };
}

export function handleStrategicQuery(prompt: string): TelegramBridgeResponse {
  const turn = processChatTurn(prompt);
  const finalAgentMessage = turn.agentMessages[turn.agentMessages.length - 1];
  const text = finalAgentMessage?.content ?? 'No se genero respuesta desde el sistema estrategico.';

  return {
    source: 'aurora-strategic-chat',
    text,
    chatTurn: turn,
  };
}

function loadAllAssets() {
  return [
    ...generateCryptoAssets(),
    ...generateStockAssets(),
    ...generateETFAssets(),
    ...generateForexAssets(),
    ...generateCommodityAssets(),
    ...generateIndexAssets(),
    ...generateRealEstateAssets(),
  ];
}

export function handleAssetQuery(symbol?: string): TelegramBridgeResponse {
  if (!symbol) {
    return {
      source: 'aurora-status',
      text: 'Uso: /asset SYMBOL. Ejemplo: /asset BTC',
    };
  }

  const assets = loadAllAssets();
  const asset = assets.find((item) => item.symbol.toUpperCase() === symbol.toUpperCase());
  const operationalSymbols: MarketSymbol[] = ['BTC', 'ETH', 'NVDA', 'SPY'];

  if (operationalSymbols.includes(symbol.toUpperCase() as MarketSymbol)) {
    return {
      source: 'aurora-status',
      text: formatOperationalTelegramMessage(symbol.toUpperCase() as MarketSymbol, '1h'),
    };
  }

  if (!asset) {
    return {
      source: 'aurora-status',
      text: `No se encontro el activo ${symbol}.`,
    };
  }

  const analysis = buildAssetAnalysis(asset);
  const text = [
    `Analisis ${analysis.symbol} (${analysis.assetClass})`,
    `Precio: ${analysis.price.toFixed(4)} | 24h: ${analysis.change24h.toFixed(2)}%`,
    `Noticias: ${analysis.newsSummary.state} (${analysis.newsSummary.confidence}%)`,
    `Tecnico: ${analysis.technicalSummary.state} (${analysis.technicalSummary.confidence}%)`,
    `Analista: ${analysis.analystSummary.state} (${analysis.analystSummary.confidence}%)`,
    `Riesgo: ${analysis.riskSummary.state} (${analysis.riskSummary.confidence}%)`,
    `Director: ${analysis.directorDecision.summary}`,
    'Nota: soporte de imagen de grafico preparado para fase futura.',
  ].join('\n');

  return {
    source: 'aurora-status',
    text,
  };
}

export function handleCapitalQuery(): TelegramBridgeResponse {
  const snapshot = buildAuroraStatusSnapshot();
  return {
    source: 'aurora-status',
    text: [
      'Capital',
      `Total: ${formatCtxCurrency(snapshot.totalCapital)}`,
      `Reserva: ${formatCtxCurrency(snapshot.survivalReserve)}`,
      `Operativo: ${formatCtxCurrency(snapshot.operationalCapital)}`,
    ].join('\n'),
    statusSnapshot: snapshot,
  };
}

export function handleAgentsQuery(): TelegramBridgeResponse {
  const state = getRuntimeStateProvider().getState();
  const agents = state.agents ?? [];
  const lines = agents.slice(0, 12).map((agent) => `- ${agent.name} (${agent.status}) rep:${agent.reputation}`);
  return {
    source: 'aurora-status',
    text: ['Agentes', ...lines].join('\n'),
  };
}

export function handlePositionsQuery(): TelegramBridgeResponse {
  const state = getRuntimeStateProvider().getState();
  const operations = state.operations ?? [];
  const open = operations.filter((operation) => operation.status === 'executed' && operation.result === undefined);

  if (open.length === 0) {
    return { source: 'aurora-status', text: 'Posiciones: sin posiciones abiertas.' };
  }

  return {
    source: 'aurora-status',
    text: [
      'Posiciones abiertas',
      ...open.slice(0, 10).map((operation) => `- ${operation.asset} ${operation.action} ${formatCtxCurrency(operation.amount)}`),
    ].join('\n'),
  };
}

export function handlePnlQuery(): TelegramBridgeResponse {
  const state = getRuntimeStateProvider().getState();
  const operations = state.operations ?? [];
  const closed = operations.filter((operation) => typeof operation.result === 'number');
  const pnl = closed.reduce((sum, operation) => sum + (operation.result ?? 0), 0);

  return {
    source: 'aurora-status',
    text: [
      'PnL',
      `Operaciones cerradas: ${closed.length}`,
      `Resultado acumulado: ${formatCtxCurrency(pnl)}`,
    ].join('\n'),
  };
}

export function handleRiskQuery(): TelegramBridgeResponse {
  const snapshot = buildAuroraStatusSnapshot();
  const riskPct = snapshot.totalCapital > 0
    ? ((snapshot.totalCapital - snapshot.survivalReserve) / snapshot.totalCapital) * 100
    : 0;

  return {
    source: 'aurora-status',
    text: [
      'Riesgo',
      `Capital operativo sobre total: ${riskPct.toFixed(2)}%`,
      `Estado sistema: ${normalizeStatusLabel(snapshot.systemStatus)}`,
      `Perfil: ${snapshot.activeProfile}`,
    ].join('\n'),
    statusSnapshot: snapshot,
  };
}

export function handleStrategyQuery(): TelegramBridgeResponse {
  const snapshot = buildAuroraStatusSnapshot();
  return {
    source: 'aurora-status',
    text: [
      'Strategy',
      `Perfil activo: ${snapshot.activeProfile}`,
      `Entorno: ${snapshot.environmentLabel}`,
      'Modo real: deshabilitado',
    ].join('\n'),
    statusSnapshot: snapshot,
  };
}