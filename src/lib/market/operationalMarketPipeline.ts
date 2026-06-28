import { getSystemContext } from '@/lib/chat/systemContext';
import { getMarketDataProvider } from '@/lib/market/marketDataProvider';
import type {
  CorrelationReport,
  DirectorDecisionReport,
  MarketSnapshot,
  MarketSymbol,
  MarketTimeframe,
  OperationalMarketIntelligence,
  TechnicalAnalysisReport,
  TechnicalSignal,
} from '@/lib/market/types';
import { buildTechnicalAnalysisReport } from '@/lib/technical/indicators';

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

function resolveNewsAlignment(snapshot: MarketSnapshot, technical: TechnicalAnalysisReport): CorrelationReport['newsAlignment'] {
  if (snapshot.asset.changePercent >= 0.8 && technical.indicators.volume.ratio >= 1) return 'Alcistas';
  if (snapshot.asset.changePercent <= -0.8 && technical.indicators.volume.ratio >= 1) return 'Bajistas';
  return 'Neutrales';
}

function resolveInvestorAlignment(technical: TechnicalAnalysisReport): CorrelationReport['investorAlignment'] {
  if (technical.finalSignal === 'Bullish' && technical.strength >= 60) return 'Compra';
  if (technical.finalSignal === 'Bearish' && technical.strength >= 60) return 'Venta';
  return 'Esperar';
}

function signalFromNews(news: CorrelationReport['newsAlignment']): TechnicalSignal {
  if (news === 'Alcistas') return 'Bullish';
  if (news === 'Bajistas') return 'Bearish';
  return 'Neutral';
}

function buildCorrelationReport(snapshot: MarketSnapshot, technical: TechnicalAnalysisReport): CorrelationReport {
  const newsAlignment = resolveNewsAlignment(snapshot, technical);
  const technicalAlignment = technical.finalSignal;
  const investorAlignment = resolveInvestorAlignment(technical);

  const positiveVotes = [
    signalFromNews(newsAlignment) === 'Bullish',
    technicalAlignment === 'Bullish',
    investorAlignment === 'Compra',
  ].filter(Boolean).length;

  const negativeVotes = [
    signalFromNews(newsAlignment) === 'Bearish',
    technicalAlignment === 'Bearish',
    investorAlignment === 'Venta',
  ].filter(Boolean).length;

  const mixedPenalty = positiveVotes > 0 && negativeVotes > 0 ? 10 : 0;
  const confidence = clamp(Math.round(52 + technical.strength * 0.32 + positiveVotes * 8 - negativeVotes * 6 - mixedPenalty), 35, 95);

  let summary = 'Las fuentes mantienen una lectura mixta.';
  let recommendation = 'Esperar confirmación adicional.';

  if (positiveVotes >= 3) {
    summary = 'Las tres fuentes están alineadas en sesgo alcista.';
    recommendation = 'Aprobar propuesta.';
  } else if (negativeVotes >= 2) {
    summary = 'Predominan señales defensivas entre mercado, técnico e inversor.';
    recommendation = 'Rechazar propuesta.';
  } else if (positiveVotes >= 2 && negativeVotes === 0) {
    summary = 'Existe alineación favorable, pero aún con necesidad de vigilancia operativa.';
    recommendation = 'Aprobar con cautela.';
  }

  return {
    symbol: snapshot.asset.symbol,
    timeframe: snapshot.timeframe,
    newsAlignment,
    technicalAlignment,
    investorAlignment,
    confidence,
    summary,
    recommendation,
  };
}

function buildDirectorDecision(snapshot: MarketSnapshot, technical: TechnicalAnalysisReport, analyst: CorrelationReport): DirectorDecisionReport {
  const cautionFlag = technical.indicators.rsi >= 72 || technical.indicators.atr > snapshot.asset.price * 0.03;
  let decision: DirectorDecisionReport['decision'] = 'RECHAZADO';

  if (analyst.recommendation === 'Aprobar propuesta.' && analyst.confidence >= 78) {
    decision = cautionFlag ? 'APROBADO CON CAUTELA' : 'APROBADO';
  } else if (analyst.recommendation === 'Aprobar con cautela.' || analyst.confidence >= 68) {
    decision = 'APROBADO CON CAUTELA';
  }

  const confidence = clamp(Math.round((technical.strength + analyst.confidence) / 2), 40, 96);
  const summary =
    decision === 'APROBADO'
      ? 'Director valida la operación por alineación técnica y correlación sólida.'
      : decision === 'APROBADO CON CAUTELA'
      ? 'Director valida con límites por volatilidad o momentum extendido.'
      : 'Director rechaza por falta de alineación suficiente en el pipeline operativo.';

  return {
    symbol: snapshot.asset.symbol,
    timeframe: snapshot.timeframe,
    decision,
    confidence,
    summary,
  };
}

export function buildOperationalMarketIntelligence(symbol: MarketSymbol, timeframe: MarketTimeframe): OperationalMarketIntelligence {
  const provider = getMarketDataProvider();
  const snapshot = provider.getSnapshot(symbol, timeframe);
  const technical = buildTechnicalAnalysisReport(symbol, timeframe, snapshot);
  const analyst = buildCorrelationReport(snapshot, technical);
  const director = buildDirectorDecision(snapshot, technical, analyst);

  return {
    snapshot,
    technical,
    analyst,
    director,
  };
}

export function formatOperationalTelegramMessage(symbol: MarketSymbol, timeframe: MarketTimeframe): string {
  const operational = buildOperationalMarketIntelligence(symbol, timeframe);
  const system = getSystemContext();

  return [
    `ACTIVO: ${operational.snapshot.asset.symbol}`,
    '',
    'DECISIÓN:',
    operational.director.decision,
    '',
    'CONFIANZA:',
    `${operational.director.confidence}%`,
    '',
    'TÉCNICO:',
    operational.technical.finalSignal,
    '',
    'ANALISTA:',
    `${operational.analyst.confidence}% correlación`,
    '',
    'PERFIL:',
    system.organizationProfileLabel,
  ].join('\n');
}
