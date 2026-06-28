import type { 
  MarketDataProvider, 
  DataSourceStatus, 
  DataProviderType,
  ConnectionStatus,
  MarketPosition,
  NewsItem,
  MarketSentiment
} from '../types';

export interface IMarketDataProvider {
  getMarketPositions(): Promise<MarketPosition[]>;
  getAssetPrice(symbol: string): Promise<number>;
  getMarketStatus(): Promise<'open' | 'closed' | 'pre-market' | 'after-hours' | 'unknown'>;
}

export interface INewsProvider {
  getNews(limit?: number): Promise<NewsItem[]>;
  getSentiment(): Promise<MarketSentiment>;
}

export interface ISentimentProvider {
  analyzeSentiment(text: string): Promise<'positive' | 'negative' | 'neutral'>;
  getMarketSentiment(): Promise<MarketSentiment>;
}

export class MockMarketDataProvider implements IMarketDataProvider {
  private provider: MarketDataProvider;

  constructor() {
    this.provider = {
      id: 'mock-provider',
      name: 'Mock Data Provider',
      type: 'mock',
      status: 'connected',
      lastUpdate: new Date().toISOString(),
      latency: 50,
      config: {
        updateInterval: 5000,
      },
    };
  }

  getProviderInfo(): MarketDataProvider {
    return { ...this.provider, lastUpdate: new Date().toISOString() };
  }

  async getMarketPositions(): Promise<MarketPosition[]> {
    const assets = [
      { name: 'BTC/USDT', entry: 67550, current: 67250 + (Math.random() - 0.5) * 1000, change: 2.45 + (Math.random() - 0.5) * 2 },
      { name: 'ETH/USDT', entry: 3520, current: 3490 + (Math.random() - 0.5) * 100, change: -1.12 + (Math.random() - 0.5) * 2 },
      { name: 'BNB/USDT', entry: 605, current: 605.30 + (Math.random() - 0.5) * 20, change: -0.35 + (Math.random() - 0.5) * 2 },
      { name: 'SOL/USDT', entry: 152, current: 152.40 + (Math.random() - 0.5) * 10, change: 3.35 + (Math.random() - 0.5) * 2 },
      { name: 'XRP/USDT', entry: 0.48, current: 0.48 + (Math.random() - 0.5) * 0.05, change: 0.75 + (Math.random() - 0.5) * 2 },
    ];

    return assets.map(asset => ({
      asset: asset.name,
      amount: 10000 + Math.random() * 30000,
      entryPrice: asset.entry,
      currentPrice: asset.current,
      change24h: asset.change,
      trend: this.generateTrendData(),
    }));
  }

  async getAssetPrice(symbol: string): Promise<number> {
    const prices: Record<string, number> = {
      'BTC/USDT': 67250,
      'ETH/USDT': 3490,
      'BNB/USDT': 605.30,
      'SOL/USDT': 152.40,
      'XRP/USDT': 0.48,
    };
    return prices[symbol] || 0;
  }

  async getMarketStatus(): Promise<'open' | 'closed' | 'pre-market' | 'after-hours' | 'unknown'> {
    return 'open';
  }

  private generateTrendData(): number[] {
    const points = 20;
    const data: number[] = [];
    let value = 50 + Math.random() * 20;
    
    for (let i = 0; i < points; i++) {
      value += (Math.random() - 0.5) * 10;
      value = Math.max(30, Math.min(70, value));
      data.push(value);
    }
    
    return data;
  }
}

export class MockNewsProvider implements INewsProvider {
  async getNews(limit: number = 5): Promise<NewsItem[]> {
    const titles = [
      'Bitcoin muestra señales de recuperación tras semana de alta volatilidad',
      'Ethereum actualización próxima podría impulsar precio',
      'Reguladores discuten marco normativo para criptomonedas',
      'Adopción institucional de cripto alcanza nuevo máximo',
      'Análisis técnico sugiere consolidación en principales activos',
    ];

    return titles.slice(0, limit).map((title, i) => ({
      id: `news-${Date.now()}-${i}`,
      title,
      sentiment: ['positive', 'neutral', 'negative'][Math.floor(Math.random() * 3)] as 'positive' | 'neutral' | 'negative',
      timestamp: new Date(Date.now() - i * 3600000).toLocaleTimeString('es-ES', { 
        hour: '2-digit', 
        minute: '2-digit' 
      }),
    }));
  }

  async getSentiment(): Promise<MarketSentiment> {
    const sentiments: Array<'positive' | 'negative' | 'neutral'> = ['positive', 'neutral', 'negative'];
    const overall = sentiments[Math.floor(Math.random() * sentiments.length)];
    
    return {
      overall,
      score: 50 + (Math.random() - 0.5) * 40,
      summary: overall === 'positive' 
        ? 'El mercado muestra señales positivas con volumen creciente y sentiment alcista.'
        : overall === 'negative'
        ? 'Cautela en el mercado debido a incertidumbre macroeconómica y baja en volumen.'
        : 'Mercado lateral con señales mixtas, esperando catalizadores claros.',
      lastUpdate: new Date().toISOString(),
    };
  }
}

export class LiveMarketDataProvider implements IMarketDataProvider {
  private provider: MarketDataProvider;

  constructor(apiKey?: string) {
    this.provider = {
      id: 'coinmarketpro-live',
      name: 'CoinMarketPro API',
      type: 'live',
      status: 'disconnected',
      config: {
        apiKey,
        baseUrl: 'https://pro-api.coinmarketcap.com',
        updateInterval: 60000,
      },
    };
  }

  getProviderInfo(): MarketDataProvider {
    return this.provider;
  }

  async getMarketPositions(): Promise<MarketPosition[]> {
    throw new Error('Live data provider not yet implemented');
  }

  async getAssetPrice(symbol: string): Promise<number> {
    throw new Error('Live data provider not yet implemented');
  }

  async getMarketStatus(): Promise<'open' | 'closed' | 'pre-market' | 'after-hours' | 'unknown'> {
    return 'unknown';
  }
}

export class DataProviderFactory {
  static create(type: DataProviderType, config?: { apiKey?: string }): {
    marketData: IMarketDataProvider;
    news: INewsProvider;
  } {
    if (type === 'mock') {
      return {
        marketData: new MockMarketDataProvider(),
        news: new MockNewsProvider(),
      };
    } else {
      return {
        marketData: new LiveMarketDataProvider(config?.apiKey),
        news: new MockNewsProvider(),
      };
    }
  }

  static createDataSourceStatus(
    provider: IMarketDataProvider,
    providerType: DataProviderType
  ): DataSourceStatus {
    const providerInfo = provider instanceof MockMarketDataProvider || provider instanceof LiveMarketDataProvider
      ? provider.getProviderInfo()
      : {
          id: 'unknown',
          name: 'Unknown Provider',
          type: providerType,
          status: 'connected' as ConnectionStatus,
          config: {},
        };

    return {
      provider: providerInfo,
      marketStatus: 'open',
      lastSuccessfulUpdate: new Date().toISOString(),
      errorCount: 0,
    };
  }
}
