import type {
  MarketSnapshot,
  MarketSymbol,
  MarketTimeframe,
  OHLCV,
  TechnicalAnalysisReport,
  TechnicalSignal,
  TechnicalSnapshot,
} from '@/lib/market/types';

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

function average(values: number[]): number {
  if (values.length === 0) return 0;
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function last(values: number[]): number {
  return values[values.length - 1] ?? 0;
}

export function calculateSMA(values: number[], period: number): number {
  const slice = values.slice(-period);
  return average(slice);
}

export function calculateEMA(values: number[], period: number): number {
  if (values.length === 0) return 0;

  const multiplier = 2 / (period + 1);
  let ema = values[0];

  for (let index = 1; index < values.length; index += 1) {
    ema = (values[index] - ema) * multiplier + ema;
  }

  return ema;
}

export function calculateRSI(values: number[], period: number = 14): number {
  if (values.length <= period) return 50;

  let gains = 0;
  let losses = 0;

  for (let index = values.length - period; index < values.length; index += 1) {
    const delta = values[index] - values[index - 1];
    if (delta >= 0) gains += delta;
    else losses += Math.abs(delta);
  }

  if (losses === 0) return 100;

  const relativeStrength = gains / losses;
  return 100 - 100 / (1 + relativeStrength);
}

export function calculateMACD(values: number[]): { line: number; signal: number; histogram: number } {
  const ema12Series: number[] = [];
  const ema26Series: number[] = [];
  let ema12 = values[0] ?? 0;
  let ema26 = values[0] ?? 0;
  const multiplier12 = 2 / 13;
  const multiplier26 = 2 / 27;

  for (const value of values) {
    ema12 = (value - ema12) * multiplier12 + ema12;
    ema26 = (value - ema26) * multiplier26 + ema26;
    ema12Series.push(ema12);
    ema26Series.push(ema26);
  }

  const macdSeries = ema12Series.map((value, index) => value - ema26Series[index]);
  const signal = calculateEMA(macdSeries, 9);
  const line = last(macdSeries);

  return {
    line,
    signal,
    histogram: line - signal,
  };
}

export function calculateATR(candles: OHLCV[], period: number = 14): number {
  if (candles.length < 2) return 0;

  const trueRanges: number[] = [];
  for (let index = 1; index < candles.length; index += 1) {
    const current = candles[index];
    const previous = candles[index - 1];
    const range = Math.max(
      current.high - current.low,
      Math.abs(current.high - previous.close),
      Math.abs(current.low - previous.close),
    );
    trueRanges.push(range);
  }

  return average(trueRanges.slice(-period));
}

function resolveSignal(price: number, sma: number, ema: number, rsi: number, macdHistogram: number): TechnicalSignal {
  const bullishScore = Number(price > ema) + Number(ema > sma) + Number(macdHistogram > 0) + Number(rsi >= 52 && rsi <= 72);
  const bearishScore = Number(price < ema) + Number(ema < sma) + Number(macdHistogram < 0) + Number(rsi <= 48);

  if (bullishScore >= 3) return 'Bullish';
  if (bearishScore >= 3) return 'Bearish';
  return 'Neutral';
}

export function buildTechnicalSnapshot(snapshot: MarketSnapshot): TechnicalSnapshot {
  const closes = snapshot.candles.map((candle) => candle.close);
  const volumes = snapshot.candles.map((candle) => candle.volume);
  const sma = calculateSMA(closes, 20);
  const ema = calculateEMA(closes, 20);
  const rsi = calculateRSI(closes, 14);
  const macd = calculateMACD(closes);
  const atr = calculateATR(snapshot.candles, 14);
  const averageVolume = average(volumes.slice(-20));
  const currentVolume = last(volumes);
  const ratio = averageVolume === 0 ? 1 : currentVolume / averageVolume;
  const signal = resolveSignal(last(closes), sma, ema, rsi, macd.histogram);
  const strength = clamp(
    Math.round(
      50 +
      (signal === 'Bullish' ? 12 : signal === 'Bearish' ? -12 : 0) +
      (rsi - 50) * 0.45 +
      macd.histogram * 28 +
      (ratio - 1) * 18,
    ),
    0,
    100,
  );

  return {
    symbol: snapshot.asset.symbol,
    timeframe: snapshot.timeframe,
    trend: signal,
    strength,
    indicators: {
      rsi: Number(rsi.toFixed(2)),
      sma: Number(sma.toFixed(2)),
      ema: Number(ema.toFixed(2)),
      macd: {
        line: Number(macd.line.toFixed(4)),
        signal: Number(macd.signal.toFixed(4)),
        histogram: Number(macd.histogram.toFixed(4)),
      },
      atr: Number(atr.toFixed(2)),
      volume: {
        current: Math.round(currentVolume),
        average: Math.round(averageVolume),
        ratio: Number(ratio.toFixed(2)),
      },
    },
    signal,
  };
}

export function buildTechnicalAnalysisReport(symbol: MarketSymbol, timeframe: MarketTimeframe, snapshot: MarketSnapshot): TechnicalAnalysisReport {
  const technical = buildTechnicalSnapshot(snapshot);
  const volumeLabel = technical.indicators.volume.ratio >= 1.1 ? 'volumen confirmatorio' : 'volumen estable';
  const summary =
    technical.signal === 'Bullish'
      ? `Tendencia alcista con ${volumeLabel}, RSI ${technical.indicators.rsi} y MACD positivo.`
      : technical.signal === 'Bearish'
      ? `Tendencia bajista con presión vendedora, RSI ${technical.indicators.rsi} y MACD negativo.`
      : `Mercado en compresión. RSI ${technical.indicators.rsi} y estructura mixta entre EMA y SMA.`;

  return {
    symbol,
    timeframe,
    trend: technical.trend,
    strength: technical.strength,
    indicators: technical.indicators,
    finalSignal: technical.signal,
    summary,
  };
}
