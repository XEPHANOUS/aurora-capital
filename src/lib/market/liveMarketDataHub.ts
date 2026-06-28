import { buildMockMarketSnapshot } from '@/lib/market/mockMarketData';
import type { MarketSnapshot, MarketSymbol, MarketTimeframe, OHLCV } from '@/lib/market/types';

interface OrderBookLevel {
  price: number;
  quantity: number;
}

interface TradeTick {
  id: string;
  price: number;
  quantity: number;
  timestamp: string;
  side: 'buy' | 'sell';
}

interface ExtendedMarketSnapshot extends MarketSnapshot {
  orderBook: {
    bids: OrderBookLevel[];
    asks: OrderBookLevel[];
  };
  trades: TradeTick[];
  marketCapUsd?: number;
  btcDominance?: number;
  dataSource: 'live' | 'fallback';
}

const BINANCE_SYMBOL_BY_MARKET: Partial<Record<MarketSymbol, string>> = {
  BTC: 'BTCUSDT',
  ETH: 'ETHUSDT',
};

const INTERVAL_BY_TIMEFRAME: Record<MarketTimeframe, string> = {
  '1m': '1m',
  '5m': '5m',
  '15m': '15m',
  '1h': '1h',
  '4h': '4h',
  '1d': '1d',
};

function toNumber(value: string | number): number {
  if (typeof value === 'number') return value;
  const parsed = Number.parseFloat(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function parseKline(kline: unknown): OHLCV | null {
  if (!Array.isArray(kline) || kline.length < 6) return null;
  return {
    timestamp: new Date(Number(kline[0])).toISOString(),
    open: toNumber(kline[1] as string),
    high: toNumber(kline[2] as string),
    low: toNumber(kline[3] as string),
    close: toNumber(kline[4] as string),
    volume: toNumber(kline[5] as string),
  };
}

function buildFallback(symbol: MarketSymbol, timeframe: MarketTimeframe): ExtendedMarketSnapshot {
  const fallback = buildMockMarketSnapshot(symbol, timeframe);
  return {
    ...fallback,
    orderBook: { bids: [], asks: [] },
    trades: [],
    dataSource: 'fallback',
  };
}

export class LiveMarketDataHub {
  private cache = new Map<string, ExtendedMarketSnapshot>();

  private key(symbol: MarketSymbol, timeframe: MarketTimeframe): string {
    return `${symbol}:${timeframe}`;
  }

  getSnapshot(symbol: MarketSymbol, timeframe: MarketTimeframe): ExtendedMarketSnapshot {
    return this.cache.get(this.key(symbol, timeframe)) ?? buildFallback(symbol, timeframe);
  }

  async refreshSnapshot(symbol: MarketSymbol, timeframe: MarketTimeframe): Promise<ExtendedMarketSnapshot> {
    const binanceSymbol = BINANCE_SYMBOL_BY_MARKET[symbol];

    if (!binanceSymbol) {
      const fallback = buildFallback(symbol, timeframe);
      this.cache.set(this.key(symbol, timeframe), fallback);
      return fallback;
    }

    try {
      const interval = INTERVAL_BY_TIMEFRAME[timeframe];
      const [klineRes, tickerRes, depthRes, tradesRes] = await Promise.all([
        fetch(`https://api.binance.com/api/v3/klines?symbol=${binanceSymbol}&interval=${interval}&limit=160`),
        fetch(`https://api.binance.com/api/v3/ticker/24hr?symbol=${binanceSymbol}`),
        fetch(`https://api.binance.com/api/v3/depth?symbol=${binanceSymbol}&limit=20`),
        fetch(`https://api.binance.com/api/v3/trades?symbol=${binanceSymbol}&limit=30`),
      ]);

      if (!klineRes.ok || !tickerRes.ok || !depthRes.ok || !tradesRes.ok) {
        throw new Error('live endpoints returned non-ok response');
      }

      const klinePayload = (await klineRes.json()) as unknown[];
      const tickerPayload = (await tickerRes.json()) as {
        lastPrice?: string;
        priceChangePercent?: string;
        volume?: string;
      };
      const depthPayload = (await depthRes.json()) as {
        bids?: Array<[string, string]>;
        asks?: Array<[string, string]>;
      };
      const tradesPayload = (await tradesRes.json()) as Array<{
        id: number;
        price: string;
        qty: string;
        time: number;
        isBuyerMaker: boolean;
      }>;

      const candles = klinePayload.map(parseKline).filter((row): row is OHLCV => Boolean(row));
      if (!candles.length) throw new Error('empty candles');

      const last = candles[candles.length - 1];
      const price = toNumber(tickerPayload.lastPrice ?? last.close);
      const changePercent = toNumber(tickerPayload.priceChangePercent ?? 0);
      const volume = toNumber(tickerPayload.volume ?? last.volume);

      const snapshot: ExtendedMarketSnapshot = {
        asset: {
          symbol,
          name: symbol,
          assetClass: 'crypto',
          currency: 'USD',
          price,
          changePercent,
          volume,
        },
        timeframe,
        candles,
        lastUpdated: new Date().toISOString(),
        orderBook: {
          bids: (depthPayload.bids ?? []).slice(0, 20).map((row) => ({
            price: toNumber(row[0]),
            quantity: toNumber(row[1]),
          })),
          asks: (depthPayload.asks ?? []).slice(0, 20).map((row) => ({
            price: toNumber(row[0]),
            quantity: toNumber(row[1]),
          })),
        },
        trades: (tradesPayload ?? []).map((row) => ({
          id: String(row.id),
          price: toNumber(row.price),
          quantity: toNumber(row.qty),
          timestamp: new Date(row.time).toISOString(),
          side: row.isBuyerMaker ? 'sell' : 'buy',
        })),
        dataSource: 'live',
      };

      this.cache.set(this.key(symbol, timeframe), snapshot);
      return snapshot;
    } catch {
      const fallback = buildFallback(symbol, timeframe);
      this.cache.set(this.key(symbol, timeframe), fallback);
      return fallback;
    }
  }
}

let liveHub: LiveMarketDataHub | null = null;

export function getLiveMarketDataHub(): LiveMarketDataHub {
  if (!liveHub) {
    liveHub = new LiveMarketDataHub();
  }
  return liveHub;
}
