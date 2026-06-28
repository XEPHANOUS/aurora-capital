import type { Asset, AssetClass } from '@/lib/marketIntelligence';

export type AnalysisMode = 'standard' | 'momentum';

export interface AssetQuickChartPoint {
  timestamp: string;
  price: number;
}

export interface AssetCandle {
  timestamp: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export interface AssetAdvancedChartData {
  ohlc: AssetCandle[];
  ema20?: number[];
  ema50?: number[];
  rsi?: number[];
  macd?: number[];
}

export interface AgentAnalysisBlock {
  state: 'bullish' | 'neutral' | 'bearish';
  confidence: number;
  summary: string;
}

export interface AssetAnalysis {
  symbol: string;
  name: string;
  assetClass: AssetClass;
  price: number;
  change24h: number;
  newsSummary: AgentAnalysisBlock;
  technicalSummary: AgentAnalysisBlock;
  analystSummary: AgentAnalysisBlock;
  riskSummary: AgentAnalysisBlock;
  directorDecision: AgentAnalysisBlock;
  confidence: number;
  quickChart: AssetQuickChartPoint[];
  advancedChart: AssetAdvancedChartData;
  analysisMode: AnalysisMode;
}

function clampConfidence(value: number): number {
  return Math.max(0, Math.min(100, Math.round(value)));
}

function stateFromChange(change: number): AgentAnalysisBlock['state'] {
  if (change > 1.2) return 'bullish';
  if (change < -1.2) return 'bearish';
  return 'neutral';
}

function buildQuickChart(asset: Asset): AssetQuickChartPoint[] {
  return asset.trend.map((price, index) => ({
    timestamp: new Date(Date.now() - (asset.trend.length - index) * 60 * 60 * 1000).toISOString(),
    price,
  }));
}

function buildAdvancedChart(asset: Asset): AssetAdvancedChartData {
  const ohlc = asset.trend.map((value, index) => {
    const open = index === 0 ? value : asset.trend[index - 1];
    const close = value;
    const high = Math.max(open, close) * 1.004;
    const low = Math.min(open, close) * 0.996;
    return {
      timestamp: new Date(Date.now() - (asset.trend.length - index) * 60 * 60 * 1000).toISOString(),
      open,
      high,
      low,
      close,
      volume: Math.max(1, Math.round(asset.volume24h / asset.trend.length)),
    };
  });

  return {
    ohlc,
    ema20: [],
    ema50: [],
    rsi: [],
    macd: [],
  };
}

export function buildAssetAnalysis(asset: Asset, mode: AnalysisMode = 'standard'): AssetAnalysis {
  const baseState = stateFromChange(asset.change24h);
  const baseConfidence = clampConfidence(58 + Math.abs(asset.change24h) * 6);

  const newsSummary: AgentAnalysisBlock = {
    state: baseState,
    confidence: clampConfidence(baseConfidence - 3),
    summary: asset.change24h >= 0
      ? `Narrativa de mercado constructiva para ${asset.symbol}.`
      : `Narrativa de mercado cautelosa para ${asset.symbol}.`,
  };

  const technicalSummary: AgentAnalysisBlock = {
    state: baseState,
    confidence: clampConfidence(baseConfidence + 2),
    summary: asset.change24h >= 0
      ? 'Estructura tecnica con sesgo alcista moderado.'
      : 'Estructura tecnica con sesgo bajista moderado.',
  };

  const analystSummary: AgentAnalysisBlock = {
    state: baseState,
    confidence: clampConfidence((newsSummary.confidence + technicalSummary.confidence + baseConfidence) / 3),
    summary:
      newsSummary.state === technicalSummary.state
        ? 'Coincidencia alta entre narrativa, tecnico e inversor.'
        : 'Se detectan contradicciones parciales entre señales.',
  };

  const riskSummary: AgentAnalysisBlock = {
    state: asset.change24h > 3 || asset.change24h < -3 ? 'bearish' : 'neutral',
    confidence: clampConfidence(64 - Math.abs(asset.change24h)),
    summary:
      Math.abs(asset.change24h) > 4
        ? 'Volatilidad elevada. Requiere reducir size.'
        : 'Riesgo contenido dentro de rangos operativos.',
  };

  const directorDecision: AgentAnalysisBlock = {
    state: analystSummary.state,
    confidence: clampConfidence((analystSummary.confidence + riskSummary.confidence) / 2),
    summary:
      analystSummary.state === 'bullish' && riskSummary.state !== 'bearish'
        ? 'Proceder a evaluacion final con sesgo favorable.'
        : analystSummary.state === 'bearish'
        ? 'Revisar antes de ejecutar. Señales no concluyentes.'
        : 'Mantener vigilancia y confirmar señal adicional.',
  };

  return {
    symbol: asset.symbol,
    name: asset.name,
    assetClass: asset.assetClass,
    price: asset.price,
    change24h: asset.change24h,
    newsSummary,
    technicalSummary,
    analystSummary,
    riskSummary,
    directorDecision,
    confidence: directorDecision.confidence,
    quickChart: buildQuickChart(asset),
    advancedChart: buildAdvancedChart(asset),
    analysisMode: mode,
  };
}
