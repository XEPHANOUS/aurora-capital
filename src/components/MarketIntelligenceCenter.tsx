import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { TrendUp, TrendDown, Circle, MagnifyingGlass } from '@phosphor-icons/react';
import { useState, useMemo } from 'react';
import { cn } from '@/lib/utils';
import { Sparkline } from '@/components/Sparkline';
import type { 
  Asset, 
  CryptoAsset, 
  StockAsset, 
  ETFAsset, 
  ForexAsset,
  CommodityAsset,
  IndexAsset,
  RealEstateAsset,
  AssetClass 
} from '@/lib/marketIntelligence';

interface MarketIntelligenceCenterProps {
  cryptoAssets: CryptoAsset[];
  stockAssets: StockAsset[];
  etfAssets: ETFAsset[];
  forexAssets: ForexAsset[];
  commodityAssets: CommodityAsset[];
  indexAssets: IndexAsset[];
  realEstateAssets: RealEstateAsset[];
}

const formatCurrency = (value: number): string => {
  if (value >= 1e12) return `$${(value / 1e12).toFixed(2)}T`;
  if (value >= 1e9) return `$${(value / 1e9).toFixed(2)}B`;
  if (value >= 1e6) return `$${(value / 1e6).toFixed(2)}M`;
  if (value >= 1e3) return `$${(value / 1e3).toFixed(2)}K`;
  return `$${value.toFixed(2)}`;
};

const formatPercent = (value: number): string => {
  return `${value >= 0 ? '+' : ''}${value.toFixed(2)}%`;
};

const AssetTable = ({ assets, type }: { assets: Asset[]; type: AssetClass }) => {
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState<'price' | 'change24h' | 'volume' | 'marketCap'>('marketCap');
  
  const filteredAssets = useMemo(() => {
    return assets
      .filter(asset => 
        asset.name.toLowerCase().includes(search.toLowerCase()) ||
        asset.symbol.toLowerCase().includes(search.toLowerCase())
      )
      .sort((a, b) => {
        if (sortBy === 'marketCap') {
          return (b.marketCap || 0) - (a.marketCap || 0);
        }
        if (sortBy === 'volume') {
          return b.volume24h - a.volume24h;
        }
        if (sortBy === 'change24h') {
          return b.change24h - a.change24h;
        }
        return b.price - a.price;
      });
  }, [assets, search, sortBy]);

  return (
    <div className="space-y-4">
      <div className="flex gap-4">
        <div className="relative flex-1">
          <MagnifyingGlass className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={20} />
          <Input
            placeholder="Buscar activo..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={sortBy} onValueChange={(v) => setSortBy(v as any)}>
          <SelectTrigger className="w-48">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="marketCap">Market Cap</SelectItem>
            <SelectItem value="volume">Volumen 24h</SelectItem>
            <SelectItem value="change24h">Cambio 24h</SelectItem>
            <SelectItem value="price">Precio</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="border border-border rounded-lg overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-12">#</TableHead>
              <TableHead>Activo</TableHead>
              <TableHead className="text-right">Precio</TableHead>
              <TableHead className="text-right">24h</TableHead>
              <TableHead className="text-right">7d</TableHead>
              <TableHead className="text-right">Volumen 24h</TableHead>
              {assets.some(a => a.marketCap) && <TableHead className="text-right">Market Cap</TableHead>}
              <TableHead className="text-right">Tendencia</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredAssets.map((asset, index) => (
              <TableRow key={asset.symbol} className="hover:bg-muted/50">
                <TableCell className="text-muted-foreground font-mono text-sm">{index + 1}</TableCell>
                <TableCell>
                  <div>
                    <div className="font-mono font-semibold">{asset.symbol}</div>
                    <div className="text-xs text-muted-foreground">{asset.name}</div>
                  </div>
                </TableCell>
                <TableCell className="text-right font-mono">{formatCurrency(asset.price)}</TableCell>
                <TableCell className="text-right">
                  <span className={cn(
                    "font-mono font-semibold flex items-center justify-end gap-1",
                    asset.change24h >= 0 ? "text-accent" : "text-destructive"
                  )}>
                    {asset.change24h >= 0 ? <TrendUp size={14} /> : <TrendDown size={14} />}
                    {formatPercent(asset.change24h)}
                  </span>
                </TableCell>
                <TableCell className="text-right">
                  <span className={cn(
                    "font-mono font-semibold",
                    asset.change7d >= 0 ? "text-accent" : "text-destructive"
                  )}>
                    {formatPercent(asset.change7d)}
                  </span>
                </TableCell>
                <TableCell className="text-right font-mono text-sm">{formatCurrency(asset.volume24h)}</TableCell>
                {asset.marketCap && (
                  <TableCell className="text-right font-mono text-sm">{formatCurrency(asset.marketCap)}</TableCell>
                )}
                <TableCell>
                  <div className="h-8 w-24 ml-auto">
                    <Sparkline data={asset.trend} positive={asset.change24h >= 0} />
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};

export const MarketIntelligenceCenter = ({
  cryptoAssets,
  stockAssets,
  etfAssets,
  forexAssets,
  commodityAssets,
  indexAssets,
  realEstateAssets,
}: MarketIntelligenceCenterProps) => {
  const totalCryptoMarketCap = cryptoAssets.reduce((sum, c) => sum + (c.marketCap || 0), 0);
  const totalCryptoVolume = cryptoAssets.reduce((sum, c) => sum + c.volume24h, 0);
  const btcDominance = cryptoAssets.find(c => c.symbol === 'BTC')?.dominance || 0;
  
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-heading font-bold text-3xl tracking-tight text-glow">
            MARKET INTELLIGENCE CENTER
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            Análisis Multi-Activo en Tiempo Real
          </p>
        </div>
        <Badge variant="outline" className="border-primary/50 text-primary gap-2">
          <Circle size={8} weight="fill" className="animate-pulse-subtle" />
          {cryptoAssets.length + stockAssets.length + etfAssets.length + forexAssets.length + commodityAssets.length + indexAssets.length + realEstateAssets.length} Activos Monitoreados
        </Badge>
      </div>

      <Tabs defaultValue="crypto" className="space-y-6">
        <TabsList className="bg-card/50 backdrop-blur-sm border border-border grid grid-cols-7 w-full">
          <TabsTrigger value="crypto">Crypto</TabsTrigger>
          <TabsTrigger value="stocks">Stocks</TabsTrigger>
          <TabsTrigger value="etf">ETFs</TabsTrigger>
          <TabsTrigger value="forex">Forex</TabsTrigger>
          <TabsTrigger value="commodities">Commodities</TabsTrigger>
          <TabsTrigger value="indices">Índices</TabsTrigger>
          <TabsTrigger value="realestate">Real Estate</TabsTrigger>
        </TabsList>

        <TabsContent value="crypto" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card className="p-4 bg-card/50 backdrop-blur-sm">
              <p className="text-xs text-muted-foreground uppercase tracking-wide mb-2">Total Market Cap</p>
              <p className="font-mono font-bold text-2xl">{formatCurrency(totalCryptoMarketCap)}</p>
            </Card>
            <Card className="p-4 bg-card/50 backdrop-blur-sm">
              <p className="text-xs text-muted-foreground uppercase tracking-wide mb-2">24h Volume</p>
              <p className="font-mono font-bold text-2xl">{formatCurrency(totalCryptoVolume)}</p>
            </Card>
            <Card className="p-4 bg-card/50 backdrop-blur-sm">
              <p className="text-xs text-muted-foreground uppercase tracking-wide mb-2">BTC Dominance</p>
              <p className="font-mono font-bold text-2xl">{btcDominance.toFixed(1)}%</p>
            </Card>
            <Card className="p-4 bg-card/50 backdrop-blur-sm">
              <p className="text-xs text-muted-foreground uppercase tracking-wide mb-2">Fear & Greed</p>
              <p className="font-mono font-bold text-2xl text-accent">{(cryptoAssets[0]?.fearGreedIndex || 50).toFixed(0)}</p>
            </Card>
          </div>

          <Card className="p-6 bg-card/50 backdrop-blur-sm">
            <AssetTable assets={cryptoAssets} type="crypto" />
          </Card>
        </TabsContent>

        <TabsContent value="stocks" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="p-4 bg-card/50 backdrop-blur-sm">
              <p className="text-xs text-muted-foreground uppercase tracking-wide mb-2">Technology</p>
              <p className="font-mono font-bold text-2xl">{stockAssets.filter(s => s.sector === 'technology').length}</p>
            </Card>
            <Card className="p-4 bg-card/50 backdrop-blur-sm">
              <p className="text-xs text-muted-foreground uppercase tracking-wide mb-2">Healthcare</p>
              <p className="font-mono font-bold text-2xl">{stockAssets.filter(s => s.sector === 'healthcare').length}</p>
            </Card>
            <Card className="p-4 bg-card/50 backdrop-blur-sm">
              <p className="text-xs text-muted-foreground uppercase tracking-wide mb-2">Energy</p>
              <p className="font-mono font-bold text-2xl">{stockAssets.filter(s => s.sector === 'energy').length}</p>
            </Card>
          </div>

          <Card className="p-6 bg-card/50 backdrop-blur-sm">
            <AssetTable assets={stockAssets} type="stock" />
          </Card>
        </TabsContent>

        <TabsContent value="etf" className="space-y-6">
          <Card className="p-6 bg-card/50 backdrop-blur-sm">
            <AssetTable assets={etfAssets} type="etf" />
          </Card>
        </TabsContent>

        <TabsContent value="forex" className="space-y-6">
          <Card className="p-6 bg-card/50 backdrop-blur-sm">
            <AssetTable assets={forexAssets} type="forex" />
          </Card>
        </TabsContent>

        <TabsContent value="commodities" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {['precious-metals', 'energy', 'agriculture', 'industrial-metals'].map(type => (
              <Card key={type} className="p-4 bg-card/50 backdrop-blur-sm">
                <p className="text-xs text-muted-foreground uppercase tracking-wide mb-2">
                  {type.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')}
                </p>
                <p className="font-mono font-bold text-2xl">
                  {commodityAssets.filter(c => c.commodityType === type).length}
                </p>
              </Card>
            ))}
          </div>

          <Card className="p-6 bg-card/50 backdrop-blur-sm">
            <AssetTable assets={commodityAssets} type="commodity" />
          </Card>
        </TabsContent>

        <TabsContent value="indices" className="space-y-6">
          <Card className="p-6 bg-card/50 backdrop-blur-sm">
            <AssetTable assets={indexAssets} type="index" />
          </Card>
        </TabsContent>

        <TabsContent value="realestate" className="space-y-6">
          <Card className="p-6 bg-card/50 backdrop-blur-sm">
            <AssetTable assets={realEstateAssets} type="realestate" />
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};
