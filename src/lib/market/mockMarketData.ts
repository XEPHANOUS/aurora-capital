import type { MarketAsset, MarketSnapshot, MarketSymbol, MarketTimeframe, OHLCV } from '@/lib/market/types';

const TIMEFRAME_MINUTES: Record<MarketTimeframe, number> = {
  '1m': 1,
  '5m': 5,
  '15m': 15,
  '1h': 60,
  '4h': 240,
  '1d': 1440,
};

const BASE_ASSETS: Record<MarketSymbol, { name: string; assetClass: MarketAsset['assetClass']; basePrice: number; baseVolume: number; volatility: number; drift: number }> = {
  BTC: { name: 'Bitcoin', assetClass: 'crypto', basePrice: 68420, baseVolume: 34200000000, volatility: 0.008, drift: 0.0007 },
  ETH: { name: 'Ethereum', assetClass: 'crypto', basePrice: 3525, baseVolume: 18900000000, volatility: 0.009, drift: 0.0005 },
  NVDA: { name: 'NVIDIA', assetClass: 'stock', basePrice: 132.6, baseVolume: 51000000, volatility: 0.006, drift: 0.0006 },
  SPY: { name: 'SPDR S&P 500 ETF', assetClass: 'etf', basePrice: 540.8, baseVolume: 78000000, volatility: 0.003, drift: 0.0003 },
};

function symbolSeed(symbol: MarketSymbol): number {
  return symbol.split('').reduce((sum, char) => sum + char.charCodeAt(0), 0) / 100;
}

function timeframeSeed(timeframe: MarketTimeframe): number {
  return TIMEFRAME_MINUTES[timeframe] / 100;
}

function round(value: number, decimals: number = 2): number {
  return Number(value.toFixed(decimals));
}

function generateCandleSeries(symbol: MarketSymbol, timeframe: MarketTimeframe, count: number = 160): OHLCV[] {
  const asset = BASE_ASSETS[symbol];
  const tfSeed = timeframeSeed(timeframe);
  const seed = symbolSeed(symbol);
  const intervalMs = TIMEFRAME_MINUTES[timeframe] * 60 * 1000;
  const startTimestamp = Date.now() - count * intervalMs;
  const candles: OHLCV[] = [];

  let previousClose = asset.basePrice * (1 + tfSeed * 0.08);

  for (let index = 0; index < count; index += 1) {
    const phase = index * 0.21 + seed * 0.9 + tfSeed * 1.4;
    const momentum = Math.sin(phase) * asset.volatility;
    const cycle = Math.cos(phase / 2.3) * asset.volatility * 0.65;
    const drift = asset.drift * (1 + tfSeed * 0.4);
    const move = momentum + cycle + drift;

    const open = previousClose;
    const close = open * (1 + move);
    const wickRange = Math.abs(move) + asset.volatility * 1.8;
    const high = Math.max(open, close) * (1 + wickRange * 0.55);
    const low = Math.min(open, close) * (1 - wickRange * 0.55);
    const volumeWave = 1 + Math.abs(Math.sin(phase * 1.4)) * 0.55 + Math.abs(move) * 12;
    const volume = asset.baseVolume / Math.max(12, TIMEFRAME_MINUTES[timeframe]) * volumeWave;

    candles.push({
      timestamp: new Date(startTimestamp + index * intervalMs).toISOString(),
      open: round(open),
      high: round(high),
      low: round(low),
      close: round(close),
      volume: Math.round(volume),
    });

    previousClose = close;
  }

  return candles;
}

export function buildMockMarketSnapshot(symbol: MarketSymbol, timeframe: MarketTimeframe): MarketSnapshot {
  const candles = generateCandleSeries(symbol, timeframe);
  const last = candles[candles.length - 1];
  const prev = candles[candles.length - 2] ?? last;
  const assetConfig = BASE_ASSETS[symbol];
  const changePercent = ((last.close - prev.close) / prev.close) * 100;
  const volume = candles.slice(-24).reduce((sum, candle) => sum + candle.volume, 0);

  const asset: MarketAsset = {
    symbol,
    name: assetConfig.name,
    assetClass: assetConfig.assetClass,
    currency: 'USD',
    price: last.close,
    changePercent: round(changePercent),
    volume,
  };

  return {
    asset,
    timeframe,
    candles,
    lastUpdated: last.timestamp,
  };
}

export function listMockMarketAssets(): MarketAsset[] {
  return (Object.keys(BASE_ASSETS) as MarketSymbol[]).map((symbol) => buildMockMarketSnapshot(symbol, '1h').asset);
}
