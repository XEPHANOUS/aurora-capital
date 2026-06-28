import type {
  Asset,
  CryptoAsset,
  StockAsset,
  ETFAsset,
  ForexAsset,
  CommodityAsset,
  IndexAsset,
  RealEstateAsset,
  MacroData,
  CapitalFlow,
  SectorRotation,
  MarketOpportunity,
  MarketIntelligence,
  CryptoCategory,
  StockSector,
  ETFType,
  CommodityType,
  IndexType,
  RealEstateType,
  MacroIndicator,
} from '../marketIntelligence';

const generateTrend = (days: number = 30): number[] => {
  const trend = [];
  let value = 100;
  for (let i = 0; i < days; i++) {
    value += (Math.random() - 0.48) * 5;
    trend.push(Math.max(50, Math.min(150, value)));
  }
  return trend;
};

const randomChange = (volatility: number = 1): number => {
  return (Math.random() - 0.5) * 20 * volatility;
};

export const generateCryptoAssets = (): CryptoAsset[] => {
  const cryptos: Array<{ symbol: string; name: string; category: CryptoCategory; dominance?: number }> = [
    { symbol: 'BTC', name: 'Bitcoin', category: 'layer1', dominance: 52.4 },
    { symbol: 'ETH', name: 'Ethereum', category: 'layer1', dominance: 16.8 },
    { symbol: 'SOL', name: 'Solana', category: 'layer1' },
    { symbol: 'ADA', name: 'Cardano', category: 'layer1' },
    { symbol: 'AVAX', name: 'Avalanche', category: 'layer1' },
    { symbol: 'MATIC', name: 'Polygon', category: 'layer2' },
    { symbol: 'ARB', name: 'Arbitrum', category: 'layer2' },
    { symbol: 'OP', name: 'Optimism', category: 'layer2' },
    { symbol: 'UNI', name: 'Uniswap', category: 'defi' },
    { symbol: 'AAVE', name: 'Aave', category: 'defi' },
    { symbol: 'LINK', name: 'Chainlink', category: 'infrastructure' },
    { symbol: 'DOGE', name: 'Dogecoin', category: 'meme' },
    { symbol: 'SHIB', name: 'Shiba Inu', category: 'meme' },
    { symbol: 'PEPE', name: 'Pepe', category: 'meme' },
  ];

  return cryptos.map(crypto => {
    const price = crypto.symbol === 'BTC' ? 65000 + Math.random() * 10000 :
                  crypto.symbol === 'ETH' ? 3000 + Math.random() * 500 :
                  Math.random() * 100;
    
    return {
      symbol: crypto.symbol,
      name: crypto.name,
      assetClass: 'crypto' as const,
      category: crypto.category,
      price,
      change24h: randomChange(1.5),
      change7d: randomChange(2),
      change30d: randomChange(3),
      volume24h: Math.random() * 5000000000,
      marketCap: price * (Math.random() * 1000000000),
      dominance: crypto.dominance,
      circulatingSupply: Math.random() * 1000000000,
      maxSupply: crypto.symbol === 'BTC' ? 21000000 : undefined,
      onChainMetrics: {
        activeAddresses: Math.floor(Math.random() * 500000),
        transactions24h: Math.floor(Math.random() * 1000000),
        networkValue: Math.random() * 100000000000,
        realizedCap: Math.random() * 50000000000,
        mvrv: 0.8 + Math.random() * 1.5,
      },
      narrative: crypto.category === 'layer1' ? ['Infrastructure', 'Smart Contracts'] :
                 crypto.category === 'layer2' ? ['Scaling', 'Ethereum'] :
                 crypto.category === 'defi' ? ['DeFi', 'Yield'] :
                 crypto.category === 'meme' ? ['Community', 'Speculation'] :
                 ['Innovation', 'Tech'],
      sentiment: -100 + Math.random() * 200,
      fearGreedIndex: 20 + Math.random() * 60,
      trend: generateTrend(),
      lastUpdated: new Date().toISOString(),
    };
  });
};

export const generateStockAssets = (): StockAsset[] => {
  const stocks: Array<{ symbol: string; name: string; sector: StockSector; exchange: string; country: string }> = [
    { symbol: 'AAPL', name: 'Apple Inc.', sector: 'technology', exchange: 'NASDAQ', country: 'US' },
    { symbol: 'MSFT', name: 'Microsoft Corp.', sector: 'technology', exchange: 'NASDAQ', country: 'US' },
    { symbol: 'GOOGL', name: 'Alphabet Inc.', sector: 'technology', exchange: 'NASDAQ', country: 'US' },
    { symbol: 'NVDA', name: 'NVIDIA Corp.', sector: 'technology', exchange: 'NASDAQ', country: 'US' },
    { symbol: 'TSLA', name: 'Tesla Inc.', sector: 'consumer', exchange: 'NASDAQ', country: 'US' },
    { symbol: 'JNJ', name: 'Johnson & Johnson', sector: 'healthcare', exchange: 'NYSE', country: 'US' },
    { symbol: 'UNH', name: 'UnitedHealth Group', sector: 'healthcare', exchange: 'NYSE', country: 'US' },
    { symbol: 'XOM', name: 'Exxon Mobil', sector: 'energy', exchange: 'NYSE', country: 'US' },
    { symbol: 'CVX', name: 'Chevron Corp.', sector: 'energy', exchange: 'NYSE', country: 'US' },
    { symbol: 'LMT', name: 'Lockheed Martin', sector: 'defense', exchange: 'NYSE', country: 'US' },
    { symbol: 'RTX', name: 'Raytheon Technologies', sector: 'defense', exchange: 'NYSE', country: 'US' },
    { symbol: 'JPM', name: 'JPMorgan Chase', sector: 'finance', exchange: 'NYSE', country: 'US' },
    { symbol: 'BAC', name: 'Bank of America', sector: 'finance', exchange: 'NYSE', country: 'US' },
    { symbol: 'WMT', name: 'Walmart Inc.', sector: 'consumer', exchange: 'NYSE', country: 'US' },
    { symbol: 'PG', name: 'Procter & Gamble', sector: 'consumer', exchange: 'NYSE', country: 'US' },
  ];

  return stocks.map(stock => ({
    symbol: stock.symbol,
    name: stock.name,
    assetClass: 'stock' as const,
    sector: stock.sector,
    exchange: stock.exchange,
    country: stock.country,
    price: 50 + Math.random() * 400,
    change24h: randomChange(0.5),
    change7d: randomChange(0.8),
    change30d: randomChange(1.2),
    volume24h: Math.random() * 100000000,
    marketCap: Math.random() * 3000000000000,
    pe: 15 + Math.random() * 35,
    eps: 2 + Math.random() * 20,
    dividendYield: Math.random() * 5,
    beta: 0.7 + Math.random() * 1,
    fundamentalScore: 50 + Math.random() * 50,
    trend: generateTrend(),
    lastUpdated: new Date().toISOString(),
  }));
};

export const generateETFAssets = (): ETFAsset[] => {
  const etfs: Array<{ symbol: string; name: string; etfType: ETFType }> = [
    { symbol: 'SPY', name: 'SPDR S&P 500 ETF', etfType: 'traditional' },
    { symbol: 'QQQ', name: 'Invesco QQQ Trust', etfType: 'traditional' },
    { symbol: 'IBIT', name: 'iShares Bitcoin Trust', etfType: 'bitcoin' },
    { symbol: 'GBTC', name: 'Grayscale Bitcoin Trust', etfType: 'bitcoin' },
    { symbol: 'ETHE', name: 'Grayscale Ethereum Trust', etfType: 'crypto' },
    { symbol: 'XLK', name: 'Technology Select Sector', etfType: 'sector' },
    { symbol: 'XLE', name: 'Energy Select Sector', etfType: 'sector' },
    { symbol: 'XLF', name: 'Financial Select Sector', etfType: 'sector' },
    { symbol: 'GLD', name: 'SPDR Gold Shares', etfType: 'commodity' },
    { symbol: 'USO', name: 'United States Oil Fund', etfType: 'commodity' },
  ];

  return etfs.map(etf => ({
    symbol: etf.symbol,
    name: etf.name,
    assetClass: 'etf' as const,
    etfType: etf.etfType,
    price: 50 + Math.random() * 450,
    change24h: randomChange(0.4),
    change7d: randomChange(0.7),
    change30d: randomChange(1),
    volume24h: Math.random() * 500000000,
    marketCap: Math.random() * 100000000000,
    holdings: Math.floor(50 + Math.random() * 500),
    expenseRatio: 0.03 + Math.random() * 0.7,
    aum: Math.random() * 50000000000,
    trend: generateTrend(),
    lastUpdated: new Date().toISOString(),
  }));
};

export const generateForexAssets = (): ForexAsset[] => {
  const pairs: Array<{ symbol: string; name: string; base: string; quote: string }> = [
    { symbol: 'EURUSD', name: 'Euro / US Dollar', base: 'EUR', quote: 'USD' },
    { symbol: 'GBPUSD', name: 'British Pound / US Dollar', base: 'GBP', quote: 'USD' },
    { symbol: 'USDJPY', name: 'US Dollar / Japanese Yen', base: 'USD', quote: 'JPY' },
    { symbol: 'USDCHF', name: 'US Dollar / Swiss Franc', base: 'USD', quote: 'CHF' },
    { symbol: 'AUDUSD', name: 'Australian Dollar / US Dollar', base: 'AUD', quote: 'USD' },
    { symbol: 'USDCAD', name: 'US Dollar / Canadian Dollar', base: 'USD', quote: 'CAD' },
  ];

  return pairs.map(pair => ({
    symbol: pair.symbol,
    name: pair.name,
    assetClass: 'forex' as const,
    baseCurrency: pair.base,
    quoteCurrency: pair.quote,
    price: pair.symbol === 'USDJPY' ? 140 + Math.random() * 10 : 0.9 + Math.random() * 0.3,
    change24h: randomChange(0.2),
    change7d: randomChange(0.3),
    change30d: randomChange(0.5),
    volume24h: Math.random() * 10000000000,
    spread: 0.0001 + Math.random() * 0.0005,
    interestRateDiff: -2 + Math.random() * 4,
    centralBankPolicy: ['Hawkish', 'Dovish', 'Neutral'][Math.floor(Math.random() * 3)],
    trend: generateTrend(),
    lastUpdated: new Date().toISOString(),
  }));
};

export const generateCommodityAssets = (): CommodityAsset[] => {
  const commodities: Array<{ symbol: string; name: string; type: CommodityType; unit: string }> = [
    { symbol: 'GOLD', name: 'Gold', type: 'precious-metals', unit: 'oz' },
    { symbol: 'SILVER', name: 'Silver', type: 'precious-metals', unit: 'oz' },
    { symbol: 'PLATINUM', name: 'Platinum', type: 'precious-metals', unit: 'oz' },
    { symbol: 'WTI', name: 'Crude Oil WTI', type: 'energy', unit: 'barrel' },
    { symbol: 'BRENT', name: 'Crude Oil Brent', type: 'energy', unit: 'barrel' },
    { symbol: 'NATGAS', name: 'Natural Gas', type: 'energy', unit: 'mmbtu' },
    { symbol: 'COPPER', name: 'Copper', type: 'industrial-metals', unit: 'lb' },
    { symbol: 'WHEAT', name: 'Wheat', type: 'agriculture', unit: 'bushel' },
    { symbol: 'CORN', name: 'Corn', type: 'agriculture', unit: 'bushel' },
  ];

  return commodities.map(commodity => ({
    symbol: commodity.symbol,
    name: commodity.name,
    assetClass: 'commodity' as const,
    commodityType: commodity.type,
    unit: commodity.unit,
    price: commodity.symbol === 'GOLD' ? 1900 + Math.random() * 200 :
           commodity.symbol === 'SILVER' ? 22 + Math.random() * 5 :
           commodity.symbol.includes('OIL') ? 70 + Math.random() * 20 :
           commodity.symbol === 'COPPER' ? 3.5 + Math.random() * 1 :
           5 + Math.random() * 10,
    change24h: randomChange(0.8),
    change7d: randomChange(1.2),
    change30d: randomChange(2),
    volume24h: Math.random() * 1000000000,
    marketCap: Math.random() * 5000000000000,
    supplyDemand: {
      supply: Math.random() * 1000000,
      demand: Math.random() * 1000000,
      inventory: Math.random() * 500000,
    },
    seasonality: ['Q1 Strong', 'Q2 Weak', 'Q3 Neutral', 'Q4 Strong'][Math.floor(Math.random() * 4)],
    trend: generateTrend(),
    lastUpdated: new Date().toISOString(),
  }));
};

export const generateIndexAssets = (): IndexAsset[] => {
  const indices: Array<{ symbol: string; name: string; type: IndexType; constituents: number }> = [
    { symbol: 'SPX', name: 'S&P 500', type: 'us', constituents: 500 },
    { symbol: 'IXIC', name: 'NASDAQ Composite', type: 'us', constituents: 3000 },
    { symbol: 'DJI', name: 'Dow Jones Industrial', type: 'us', constituents: 30 },
    { symbol: 'DAX', name: 'DAX', type: 'europe', constituents: 40 },
    { symbol: 'FTSE', name: 'FTSE 100', type: 'europe', constituents: 100 },
    { symbol: 'N225', name: 'Nikkei 225', type: 'asia', constituents: 225 },
  ];

  return indices.map(index => ({
    symbol: index.symbol,
    name: index.name,
    assetClass: 'index' as const,
    indexType: index.type,
    constituents: index.constituents,
    price: index.symbol === 'SPX' ? 4800 + Math.random() * 400 :
           index.symbol === 'IXIC' ? 15000 + Math.random() * 2000 :
           index.symbol === 'DJI' ? 37000 + Math.random() * 3000 :
           13000 + Math.random() * 5000,
    change24h: randomChange(0.3),
    change7d: randomChange(0.6),
    change30d: randomChange(1),
    volume24h: Math.random() * 50000000000,
    topHoldings: ['AAPL', 'MSFT', 'GOOGL', 'AMZN', 'NVDA'].slice(0, 5),
    sectorWeights: {
      technology: 25 + Math.random() * 10,
      healthcare: 12 + Math.random() * 5,
      finance: 13 + Math.random() * 5,
      consumer: 11 + Math.random() * 5,
      energy: 8 + Math.random() * 5,
    },
    trend: generateTrend(),
    lastUpdated: new Date().toISOString(),
  }));
};

export const generateRealEstateAssets = (): RealEstateAsset[] => {
  const reits: Array<{ symbol: string; name: string; type: RealEstateType; region: string }> = [
    { symbol: 'AMT', name: 'American Tower REIT', type: 'commercial', region: 'US' },
    { symbol: 'PLD', name: 'Prologis REIT', type: 'industrial', region: 'US' },
    { symbol: 'EQIX', name: 'Equinix REIT', type: 'commercial', region: 'Global' },
    { symbol: 'SPG', name: 'Simon Property Group', type: 'commercial', region: 'US' },
    { symbol: 'AVB', name: 'AvalonBay Communities', type: 'residential', region: 'US' },
  ];

  return reits.map(reit => ({
    symbol: reit.symbol,
    name: reit.name,
    assetClass: 'realestate' as const,
    realEstateType: reit.type,
    region: reit.region,
    price: 100 + Math.random() * 300,
    change24h: randomChange(0.4),
    change7d: randomChange(0.6),
    change30d: randomChange(1),
    volume24h: Math.random() * 50000000,
    marketCap: Math.random() * 100000000000,
    occupancyRate: 85 + Math.random() * 12,
    dividendYield: 2.5 + Math.random() * 4,
    propertyCount: Math.floor(50 + Math.random() * 500),
    trend: generateTrend(),
    lastUpdated: new Date().toISOString(),
  }));
};

export const generateMacroData = (): MacroData[] => {
  const indicators: Array<{ indicator: MacroIndicator; value: number; impact: 'high' | 'medium' | 'low' }> = [
    { indicator: 'inflation', value: 3.2, impact: 'high' },
    { indicator: 'gdp', value: 2.1, impact: 'high' },
    { indicator: 'interest-rates', value: 5.25, impact: 'high' },
    { indicator: 'unemployment', value: 3.8, impact: 'medium' },
    { indicator: 'liquidity', value: 7800, impact: 'high' },
  ];

  return indicators.map(ind => ({
    indicator: ind.indicator,
    value: ind.value,
    change: randomChange(0.2),
    date: new Date().toISOString(),
    trend: Math.random() > 0.5 ? 'up' : Math.random() > 0.5 ? 'down' : 'stable',
    impact: ind.impact,
  }));
};

export const generateCapitalFlows = (): CapitalFlow[] => {
  const flows = [
    { from: 'Cash', to: 'Stocks', amount: 45000000000 },
    { from: 'Bonds', to: 'Crypto', amount: 12000000000 },
    { from: 'Stocks', to: 'Commodities', amount: 28000000000 },
    { from: 'Cash', to: 'Crypto', amount: 18000000000 },
    { from: 'Commodities', to: 'Bonds', amount: 15000000000 },
  ];

  return flows.map(flow => ({
    ...flow,
    change: randomChange(1.5),
    trend: Math.random() > 0.5 ? 'increasing' : Math.random() > 0.5 ? 'decreasing' : 'stable',
  }));
};

export const generateSectorRotation = (): SectorRotation[] => {
  const sectors = ['Technology', 'Healthcare', 'Finance', 'Energy', 'Consumer', 'Industrial'];
  
  return sectors.map(sector => {
    const inflow = Math.random() * 10000000000;
    const outflow = Math.random() * 8000000000;
    return {
      sector,
      inflow,
      outflow,
      netFlow: inflow - outflow,
      momentum: -50 + Math.random() * 100,
    };
  });
};

export const generateMarketIntelligence = (): MarketIntelligence => {
  const cryptoAssets = generateCryptoAssets();
  
  return {
    timestamp: new Date().toISOString(),
    cryptoMarket: {
      totalMarketCap: 2400000000000 + Math.random() * 400000000000,
      totalVolume: 120000000000 + Math.random() * 30000000000,
      btcDominance: 52.4,
      ethDominance: 16.8,
      altcoinDominance: 30.8,
      fearGreedIndex: 50 + Math.random() * 30,
      trending: cryptoAssets.slice(0, 10),
    },
    stockMarket: {
      sp500: 4850 + Math.random() * 200,
      nasdaq: 15800 + Math.random() * 500,
      dowJones: 38000 + Math.random() * 1000,
      vix: 12 + Math.random() * 8,
      advanceDecline: -100 + Math.random() * 200,
      sectors: {
        technology: { change: randomChange(0.5), leaders: [] },
        healthcare: { change: randomChange(0.5), leaders: [] },
        energy: { change: randomChange(0.8), leaders: [] },
        defense: { change: randomChange(0.4), leaders: [] },
        finance: { change: randomChange(0.6), leaders: [] },
        consumer: { change: randomChange(0.5), leaders: [] },
        industrial: { change: randomChange(0.5), leaders: [] },
        materials: { change: randomChange(0.7), leaders: [] },
        utilities: { change: randomChange(0.3), leaders: [] },
        realestate: { change: randomChange(0.4), leaders: [] },
      },
    },
    macroEconomy: generateMacroData(),
    capitalFlows: generateCapitalFlows(),
    sectorRotation: generateSectorRotation(),
    riskAppetite: {
      level: 50 + Math.random() * 40,
      trend: Math.random() > 0.5 ? 'increasing' : Math.random() > 0.5 ? 'decreasing' : 'stable',
      indicators: ['VIX Low', 'High Yield Spreads Tight', 'Risk-On Sentiment'],
    },
  };
};

export const calculateOpportunityScore = (asset: Asset): number => {
  const momentumScore = (asset.change7d > 0 ? 1 : 0) * 30;
  const volumeScore = Math.min(asset.volume24h / 100000000, 1) * 20;
  const trendScore = Math.min(asset.trend[asset.trend.length - 1] / 100, 1) * 30;
  const volatilityBonus = Math.abs(asset.change24h) > 3 ? 10 : 0;
  const randomFactor = Math.random() * 10;
  
  return Math.min(100, momentumScore + volumeScore + trendScore + volatilityBonus + randomFactor);
};

export const generateGlobalOpportunities = (allAssets: Asset[]): MarketOpportunity[] => {
  return allAssets.map(asset => {
    const score = calculateOpportunityScore(asset);
    const risk = 20 + Math.random() * 60;
    const potential = score * (1 + Math.random() * 0.5);
    
    const signals = [];
    if (asset.change7d > 5) signals.push('Strong Uptrend');
    if (asset.change7d < -5) signals.push('Oversold');
    if (asset.volume24h > 1000000000) signals.push('High Volume');
    if (Math.abs(asset.change24h) > 5) signals.push('High Volatility');
    
    return {
      asset,
      score,
      risk,
      potential,
      confidence: 60 + Math.random() * 35,
      timeframe: ['1d', '1w', '1m', '3m'][Math.floor(Math.random() * 4)] as '1d' | '1w' | '1m' | '3m',
      signals,
      agentConsensus: 50 + Math.random() * 40,
    };
  }).sort((a, b) => b.score - a.score);
};
