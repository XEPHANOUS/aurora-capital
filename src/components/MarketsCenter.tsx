import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { MagnifyingGlass, TrendUp, TrendDown, Star, StarHalf } from '@phosphor-icons/react';
import { Sparkline } from '@/components/Sparkline';
import { cn } from '@/lib/utils';
import { formatCurrency, formatPercent, generateTrendData } from '@/lib/mockData';
import type { Asset } from '@/lib/marketIntelligence';

interface MarketsCenterProps {
  cryptoAssets: Asset[];
  stockAssets: Asset[];
  etfAssets: Asset[];
  forexAssets: Asset[];
  commodityAssets: Asset[];
  indexAssets: Asset[];
  realEstateAssets: Asset[];
}

type MarketType = 'crypto' | 'stocks' | 'etfs' | 'forex' | 'commodities' | 'bonds' | 'realestate' | 'indices';

export function MarketsCenter({
  cryptoAssets,
  stockAssets,
  etfAssets,
  forexAssets,
  commodityAssets,
  indexAssets,
  realEstateAssets,
}: MarketsCenterProps) {
  const [activeMarket, setActiveMarket] = useState<MarketType>('crypto');
  const [searchQuery, setSearchQuery] = useState('');
  const [watchlist, setWatchlist] = useState<Set<string>>(new Set());

  const marketConfig = {
    crypto: { name: 'Crypto', assets: cryptoAssets, icon: '₿' },
    stocks: { name: 'Acciones', assets: stockAssets, icon: '📈' },
    etfs: { name: 'ETFs', assets: etfAssets, icon: '📊' },
    forex: { name: 'Forex', assets: forexAssets, icon: '💱' },
    commodities: { name: 'Commodities', assets: commodityAssets, icon: '🛢️' },
    bonds: { name: 'Bonos', assets: [], icon: '🏦' },
    realestate: { name: 'Inmobiliario', assets: realEstateAssets, icon: '🏢' },
    indices: { name: 'Índices', assets: indexAssets, icon: '📉' },
  };

  const currentMarket = marketConfig[activeMarket];
  const filteredAssets = currentMarket.assets.filter(asset =>
    asset.symbol.toLowerCase().includes(searchQuery.toLowerCase()) ||
    asset.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const toggleWatchlist = (symbol: string) => {
    setWatchlist(prev => {
      const next = new Set(prev);
      if (next.has(symbol)) {
        next.delete(symbol);
      } else {
        next.add(symbol);
      }
      return next;
    });
  };

  const marketStats = {
    totalMarketCap: currentMarket.assets.reduce((sum, a) => sum + (a.marketCap || 0), 0),
    avgChange24h: currentMarket.assets.reduce((sum, a) => sum + a.change24h, 0) / Math.max(currentMarket.assets.length, 1),
    gainers: currentMarket.assets.filter(a => a.change24h > 0).length,
    losers: currentMarket.assets.filter(a => a.change24h < 0).length,
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-heading font-bold text-3xl tracking-tight text-glow">
            MERCADOS
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            Centro de análisis multi-activo
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="text-sm">
            {filteredAssets.length} Activos
          </Badge>
          <Badge variant="outline" className="text-sm">
            {watchlist.size} en Watchlist
          </Badge>
        </div>
      </div>

      <Card className="p-6 bg-card/50 backdrop-blur-sm">
        <div className="grid grid-cols-4 gap-6 mb-6">
          <div>
            <p className="text-xs text-muted-foreground uppercase tracking-wide mb-2">Market Cap Total</p>
            <p className="font-mono font-bold text-2xl">{formatCurrency(marketStats.totalMarketCap)}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground uppercase tracking-wide mb-2">Cambio 24h Promedio</p>
            <p className={cn(
              "font-mono font-bold text-2xl",
              marketStats.avgChange24h >= 0 ? "text-accent" : "text-destructive"
            )}>
              {formatPercent(marketStats.avgChange24h)}
            </p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground uppercase tracking-wide mb-2">Ganadores</p>
            <p className="font-mono font-bold text-2xl text-accent">{marketStats.gainers}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground uppercase tracking-wide mb-2">Perdedores</p>
            <p className="font-mono font-bold text-2xl text-destructive">{marketStats.losers}</p>
          </div>
        </div>

        <Tabs value={activeMarket} onValueChange={(v) => setActiveMarket(v as MarketType)}>
          <TabsList className="grid w-full grid-cols-8 mb-6">
            {(Object.keys(marketConfig) as MarketType[]).map((key) => (
              <TabsTrigger key={key} value={key} className="text-xs">
                <span className="mr-1">{marketConfig[key].icon}</span>
                {marketConfig[key].name}
              </TabsTrigger>
            ))}
          </TabsList>

          {(Object.keys(marketConfig) as MarketType[]).map((key) => (
            <TabsContent key={key} value={key} className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="relative flex-1">
                  <MagnifyingGlass className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={20} />
                  <Input
                    placeholder={`Buscar en ${marketConfig[key].name}...`}
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>

              <div className="rounded-lg border border-border/50">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-12"></TableHead>
                      <TableHead>Activo</TableHead>
                      <TableHead>Precio</TableHead>
                      <TableHead>24h</TableHead>
                      <TableHead>Market Cap</TableHead>
                      <TableHead>Volumen 24h</TableHead>
                      <TableHead>Score</TableHead>
                      <TableHead>Tendencia</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredAssets.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={8} className="text-center text-muted-foreground py-8">
                          {marketConfig[key].assets.length === 0 
                            ? 'Próximamente disponible'
                            : 'No se encontraron resultados'}
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredAssets.map((asset) => (
                        <TableRow key={asset.symbol}>
                          <TableCell>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                              onClick={() => toggleWatchlist(asset.symbol)}
                            >
                              {watchlist.has(asset.symbol) ? (
                                <Star size={16} weight="fill" className="text-accent" />
                              ) : (
                                <Star size={16} className="text-muted-foreground" />
                              )}
                            </Button>
                          </TableCell>
                          <TableCell>
                            <div>
                              <p className="font-mono font-semibold">{asset.symbol}</p>
                              <p className="text-xs text-muted-foreground">{asset.name}</p>
                            </div>
                          </TableCell>
                          <TableCell className="font-mono">{formatCurrency(asset.price)}</TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1">
                              {asset.change24h >= 0 ? (
                                <TrendUp size={16} className="text-accent" />
                              ) : (
                                <TrendDown size={16} className="text-destructive" />
                              )}
                              <span className={cn(
                                "font-mono font-semibold",
                                asset.change24h >= 0 ? "text-accent" : "text-destructive"
                              )}>
                                {formatPercent(asset.change24h)}
                              </span>
                            </div>
                          </TableCell>
                          <TableCell className="font-mono text-sm">
                            {asset.marketCap ? formatCurrency(asset.marketCap) : '-'}
                          </TableCell>
                          <TableCell className="font-mono text-sm">
                            {asset.volume24h ? formatCurrency(asset.volume24h) : '-'}
                          </TableCell>
                          <TableCell>
                            <Badge variant={'secondary'}>
                              {'fundamentalScore' in asset ? `${asset.fundamentalScore}/100` : '-'}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div className="h-8 w-24">
                              <Sparkline data={generateTrendData()} positive={asset.change24h >= 0} />
                            </div>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </TabsContent>
          ))}
        </Tabs>
      </Card>
    </div>
  );
}
