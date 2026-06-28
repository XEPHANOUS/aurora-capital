import { buildMockMarketSnapshot, listMockMarketAssets } from '@/lib/market/mockMarketData';
import { getLiveMarketDataHub } from '@/lib/market/liveMarketDataHub';
import type { MarketAsset, MarketSnapshot, MarketSymbol, MarketTimeframe } from '@/lib/market/types';

export const SUPPORTED_MARKET_SYMBOLS: MarketSymbol[] = ['BTC', 'ETH', 'NVDA', 'SPY'];

export const SUPPORTED_MARKET_TIMEFRAMES: MarketTimeframe[] = ['1m', '5m', '15m', '1h', '4h', '1d'];

export class MarketDataProvider {
  getAssets(): MarketAsset[] {
    return listMockMarketAssets();
  }

  getSnapshot(symbol: MarketSymbol, timeframe: MarketTimeframe): MarketSnapshot {
    const hub = getLiveMarketDataHub();
    const cached = hub.getSnapshot(symbol, timeframe);
    void hub.refreshSnapshot(symbol, timeframe);
    return cached ?? buildMockMarketSnapshot(symbol, timeframe);
  }
}

let provider: MarketDataProvider | null = null;

export function getMarketDataProvider(): MarketDataProvider {
  if (!provider) {
    provider = new MarketDataProvider();
  }

  return provider;
}
