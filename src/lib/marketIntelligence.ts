export type AssetClass = 
  | 'crypto'
  | 'stock'
  | 'etf'
  | 'forex'
  | 'commodity'
  | 'index'
  | 'realestate'
  | 'bond';

export type CryptoCategory = 
  | 'layer1'
  | 'layer2'
  | 'defi'
  | 'nft'
  | 'gaming'
  | 'meme'
  | 'infrastructure'
  | 'stablecoin';

export type StockSector = 
  | 'technology'
  | 'healthcare'
  | 'energy'
  | 'defense'
  | 'finance'
  | 'consumer'
  | 'industrial'
  | 'materials'
  | 'utilities'
  | 'realestate';

export type ETFType = 
  | 'traditional'
  | 'bitcoin'
  | 'crypto'
  | 'sector'
  | 'commodity'
  | 'bond'
  | 'international';

export type ForexPair = string;

export type CommodityType = 
  | 'precious-metals'
  | 'energy'
  | 'agriculture'
  | 'industrial-metals';

export type IndexType = 
  | 'us'
  | 'europe'
  | 'asia'
  | 'global';

export type RealEstateType = 
  | 'residential'
  | 'commercial'
  | 'reit'
  | 'industrial';

export type MacroIndicator = 
  | 'inflation'
  | 'gdp'
  | 'interest-rates'
  | 'unemployment'
  | 'liquidity';

export interface BaseAsset {
  symbol: string;
  name: string;
  assetClass: AssetClass;
  price: number;
  change24h: number;
  change7d: number;
  change30d: number;
  volume24h: number;
  marketCap?: number;
  trend: number[];
  lastUpdated: string;
}

export interface CryptoAsset extends BaseAsset {
  assetClass: 'crypto';
  category: CryptoCategory;
  dominance?: number;
  circulatingSupply?: number;
  maxSupply?: number;
  onChainMetrics: {
    activeAddresses?: number;
    transactions24h?: number;
    networkValue?: number;
    realizedCap?: number;
    mvrv?: number;
  };
  narrative: string[];
  sentiment: number;
  fearGreedIndex?: number;
}

export interface StockAsset extends BaseAsset {
  assetClass: 'stock';
  sector: StockSector;
  exchange: string;
  country: string;
  pe?: number;
  eps?: number;
  dividendYield?: number;
  beta?: number;
  fundamentalScore: number;
}

export interface ETFAsset extends BaseAsset {
  assetClass: 'etf';
  etfType: ETFType;
  holdings?: number;
  expenseRatio?: number;
  aum?: number;
  underlyingAssets?: string[];
}

export interface ForexAsset extends BaseAsset {
  assetClass: 'forex';
  baseCurrency: string;
  quoteCurrency: string;
  spread: number;
  interestRateDiff: number;
  centralBankPolicy: string;
}

export interface CommodityAsset extends BaseAsset {
  assetClass: 'commodity';
  commodityType: CommodityType;
  unit: string;
  supplyDemand: {
    supply: number;
    demand: number;
    inventory: number;
  };
  seasonality?: string;
}

export interface IndexAsset extends BaseAsset {
  assetClass: 'index';
  indexType: IndexType;
  constituents: number;
  topHoldings: string[];
  sectorWeights: Record<string, number>;
}

export interface RealEstateAsset extends BaseAsset {
  assetClass: 'realestate';
  realEstateType: RealEstateType;
  occupancyRate?: number;
  dividendYield?: number;
  propertyCount?: number;
  region: string;
}

export type Asset = 
  | CryptoAsset 
  | StockAsset 
  | ETFAsset 
  | ForexAsset 
  | CommodityAsset 
  | IndexAsset 
  | RealEstateAsset;

export interface MacroData {
  indicator: MacroIndicator;
  value: number;
  change: number;
  date: string;
  trend: 'up' | 'down' | 'stable';
  impact: 'high' | 'medium' | 'low';
}

export interface CapitalFlow {
  from: string;
  to: string;
  amount: number;
  change: number;
  trend: 'increasing' | 'decreasing' | 'stable';
}

export interface SectorRotation {
  sector: string;
  inflow: number;
  outflow: number;
  netFlow: number;
  momentum: number;
}

export interface MarketOpportunity {
  asset: Asset;
  score: number;
  risk: number;
  potential: number;
  confidence: number;
  timeframe: '1d' | '1w' | '1m' | '3m';
  signals: string[];
  agentConsensus?: number;
}

export interface MarketIntelligence {
  timestamp: string;
  cryptoMarket: {
    totalMarketCap: number;
    totalVolume: number;
    btcDominance: number;
    ethDominance: number;
    altcoinDominance: number;
    fearGreedIndex: number;
    trending: CryptoAsset[];
  };
  stockMarket: {
    sp500: number;
    nasdaq: number;
    dowJones: number;
    vix: number;
    advanceDecline: number;
    sectors: Record<StockSector, { change: number; leaders: StockAsset[] }>;
  };
  macroEconomy: MacroData[];
  capitalFlows: CapitalFlow[];
  sectorRotation: SectorRotation[];
  riskAppetite: {
    level: number;
    trend: 'increasing' | 'decreasing' | 'stable';
    indicators: string[];
  };
}

export interface OpportunityFilter {
  assetClasses?: AssetClass[];
  minScore?: number;
  maxRisk?: number;
  minPotential?: number;
  timeframe?: '1d' | '1w' | '1m' | '3m';
  minConfidence?: number;
}
