export type MarketSymbol = 'BTC' | 'ETH' | 'NVDA' | 'SPY';

export type MarketTimeframe = '1m' | '5m' | '15m' | '1h' | '4h' | '1d';

export type MarketAssetClass = 'crypto' | 'stock' | 'etf';

export type TechnicalSignal = 'Bullish' | 'Bearish' | 'Neutral';

export interface OHLCV {
  timestamp: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export interface MarketAsset {
  symbol: MarketSymbol;
  name: string;
  assetClass: MarketAssetClass;
  currency: 'USD';
  price: number;
  changePercent: number;
  volume: number;
}

export interface MarketSnapshot {
  asset: MarketAsset;
  timeframe: MarketTimeframe;
  candles: OHLCV[];
  lastUpdated: string;
  orderBook?: {
    bids: Array<{ price: number; quantity: number }>;
    asks: Array<{ price: number; quantity: number }>;
  };
  trades?: Array<{
    id: string;
    price: number;
    quantity: number;
    timestamp: string;
    side: 'buy' | 'sell';
  }>;
  marketCapUsd?: number;
  btcDominance?: number;
  dataSource?: 'live' | 'fallback';
}

export interface TechnicalSnapshot {
  symbol: MarketSymbol;
  timeframe: MarketTimeframe;
  trend: TechnicalSignal;
  strength: number;
  indicators: {
    rsi: number;
    sma: number;
    ema: number;
    macd: {
      line: number;
      signal: number;
      histogram: number;
    };
    atr: number;
    volume: {
      current: number;
      average: number;
      ratio: number;
    };
  };
  signal: TechnicalSignal;
}

export interface TechnicalAnalysisReport {
  symbol: MarketSymbol;
  timeframe: MarketTimeframe;
  trend: TechnicalSignal;
  strength: number;
  indicators: TechnicalSnapshot['indicators'];
  finalSignal: TechnicalSignal;
  summary: string;
}

export interface CorrelationReport {
  symbol: MarketSymbol;
  timeframe: MarketTimeframe;
  newsAlignment: 'Alcistas' | 'Bajistas' | 'Neutrales';
  technicalAlignment: TechnicalSignal;
  investorAlignment: 'Compra' | 'Venta' | 'Esperar';
  confidence: number;
  summary: string;
  recommendation: string;
}

export interface DirectorDecisionReport {
  symbol: MarketSymbol;
  timeframe: MarketTimeframe;
  decision: 'APROBADO' | 'APROBADO CON CAUTELA' | 'RECHAZADO';
  confidence: number;
  summary: string;
}

export interface OperationalMarketIntelligence {
  snapshot: MarketSnapshot;
  technical: TechnicalAnalysisReport;
  analyst: CorrelationReport;
  director: DirectorDecisionReport;
}
