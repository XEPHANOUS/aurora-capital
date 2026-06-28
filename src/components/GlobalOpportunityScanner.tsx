import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Target, TrendUp, Warning, Sparkle } from '@phosphor-icons/react';
import { useState, useMemo } from 'react';
import { cn } from '@/lib/utils';
import { Sparkline } from '@/components/Sparkline';
import type { MarketOpportunity, AssetClass } from '@/lib/marketIntelligence';

interface GlobalOpportunityScannerProps {
  opportunities: MarketOpportunity[];
}

const formatCurrency = (value: number): string => {
  if (value >= 1e12) return `$${(value / 1e12).toFixed(2)}T`;
  if (value >= 1e9) return `$${(value / 1e9).toFixed(2)}B`;
  if (value >= 1e6) return `$${(value / 1e6).toFixed(2)}M`;
  if (value >= 1e3) return `$${(value / 1e3).toFixed(2)}K`;
  return `$${value.toFixed(2)}`;
};

const getAssetClassColor = (assetClass: AssetClass): string => {
  const colors: Record<AssetClass, string> = {
    crypto: 'text-blue-400 border-blue-400/50',
    stock: 'text-green-400 border-green-400/50',
    etf: 'text-purple-400 border-purple-400/50',
    forex: 'text-yellow-400 border-yellow-400/50',
    commodity: 'text-orange-400 border-orange-400/50',
    index: 'text-cyan-400 border-cyan-400/50',
    realestate: 'text-pink-400 border-pink-400/50',
    bond: 'text-gray-400 border-gray-400/50',
  };
  return colors[assetClass] || 'text-muted-foreground border-muted';
};

const getAssetClassLabel = (assetClass: AssetClass): string => {
  const labels: Record<AssetClass, string> = {
    crypto: 'Crypto',
    stock: 'Stock',
    etf: 'ETF',
    forex: 'Forex',
    commodity: 'Commodity',
    index: 'Index',
    realestate: 'Real Estate',
    bond: 'Bond',
  };
  return labels[assetClass];
};

const getScoreGrade = (score: number): { label: string; color: string } => {
  if (score >= 90) return { label: 'ELITE', color: 'text-accent border-accent' };
  if (score >= 75) return { label: 'GOOD', color: 'text-accent border-accent' };
  if (score >= 60) return { label: 'AVERAGE', color: 'text-yellow-400 border-yellow-400' };
  if (score >= 40) return { label: 'WEAK', color: 'text-orange-400 border-orange-400' };
  return { label: 'POOR', color: 'text-destructive border-destructive' };
};

const getRiskLevel = (risk: number): { label: string; color: string } => {
  if (risk >= 70) return { label: 'HIGH', color: 'text-destructive' };
  if (risk >= 40) return { label: 'MEDIUM', color: 'text-yellow-400' };
  return { label: 'LOW', color: 'text-accent' };
};

export const GlobalOpportunityScanner = ({ opportunities }: GlobalOpportunityScannerProps) => {
  const [filterAssetClass, setFilterAssetClass] = useState<AssetClass | 'all'>('all');
  const [filterTimeframe, setFilterTimeframe] = useState<'1d' | '1w' | '1m' | '3m' | 'all'>('all');
  const [sortBy, setSortBy] = useState<'score' | 'potential' | 'risk' | 'confidence'>('score');

  const filteredOpportunities = useMemo(() => {
    return opportunities
      .filter(opp => filterAssetClass === 'all' || opp.asset.assetClass === filterAssetClass)
      .filter(opp => filterTimeframe === 'all' || opp.timeframe === filterTimeframe)
      .sort((a, b) => {
        if (sortBy === 'score') return b.score - a.score;
        if (sortBy === 'potential') return b.potential - a.potential;
        if (sortBy === 'risk') return a.risk - b.risk;
        if (sortBy === 'confidence') return b.confidence - a.confidence;
        return 0;
      });
  }, [opportunities, filterAssetClass, filterTimeframe, sortBy]);

  const topOpportunity = filteredOpportunities[0];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-heading font-bold text-2xl tracking-tight mb-1">
            GLOBAL OPPORTUNITY SCANNER
          </h2>
          <p className="text-sm text-muted-foreground">
            Ranking global de oportunidades cross-asset
          </p>
        </div>
        <Badge variant="outline" className="border-primary/50 text-primary gap-2">
          <Target size={16} />
          {filteredOpportunities.length} Oportunidades Detectadas
        </Badge>
      </div>

      {topOpportunity && (
        <Card className="p-6 bg-gradient-to-br from-primary/10 via-accent/5 to-background border-primary/30">
          <div className="flex items-center gap-2 mb-4">
            <Sparkle size={24} className="text-primary" weight="fill" />
            <h3 className="font-heading font-bold text-xl">TOP OPPORTUNITY</h3>
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-3 mb-1">
                    <span className="font-mono font-bold text-2xl">{topOpportunity.asset.symbol}</span>
                    <Badge variant="outline" className={cn("text-xs", getAssetClassColor(topOpportunity.asset.assetClass))}>
                      {getAssetClassLabel(topOpportunity.asset.assetClass)}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">{topOpportunity.asset.name}</p>
                </div>
                <div className="text-right">
                  <p className="font-mono font-bold text-2xl">{formatCurrency(topOpportunity.asset.price)}</p>
                  <p className={cn(
                    "font-mono font-semibold text-sm",
                    topOpportunity.asset.change24h >= 0 ? "text-accent" : "text-destructive"
                  )}>
                    {topOpportunity.asset.change24h >= 0 ? '+' : ''}{topOpportunity.asset.change24h.toFixed(2)}%
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-4 gap-4">
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Score</p>
                  <div className="flex items-center gap-2">
                    <Progress value={topOpportunity.score} className="h-2 flex-1" />
                    <span className="font-mono font-bold text-lg">{topOpportunity.score.toFixed(0)}</span>
                  </div>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Risk</p>
                  <Badge variant="outline" className={cn("text-xs", getRiskLevel(topOpportunity.risk).color)}>
                    {getRiskLevel(topOpportunity.risk).label}
                  </Badge>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Potential</p>
                  <p className="font-mono font-semibold text-accent">+{topOpportunity.potential.toFixed(1)}%</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Confidence</p>
                  <p className="font-mono font-semibold">{topOpportunity.confidence.toFixed(0)}%</p>
                </div>
              </div>

              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wide mb-2">Signals</p>
                <div className="flex flex-wrap gap-2">
                  {topOpportunity.signals.map((signal, index) => (
                    <Badge key={index} variant="secondary" className="text-xs">
                      {signal}
                    </Badge>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex flex-col justify-between">
              <div className="h-32 mb-4">
                <Sparkline data={topOpportunity.asset.trend} positive={topOpportunity.asset.change24h >= 0} />
              </div>
              <Button className="w-full" size="lg">
                <TrendUp size={20} className="mr-2" />
                Analizar Oportunidad
              </Button>
            </div>
          </div>
        </Card>
      )}

      <Card className="p-6 bg-card/50 backdrop-blur-sm">
        <div className="flex flex-wrap gap-4 mb-6">
          <Select value={filterAssetClass} onValueChange={(v) => setFilterAssetClass(v as any)}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Clase de Activo" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos los Activos</SelectItem>
              <SelectItem value="crypto">Crypto</SelectItem>
              <SelectItem value="stock">Stocks</SelectItem>
              <SelectItem value="etf">ETFs</SelectItem>
              <SelectItem value="forex">Forex</SelectItem>
              <SelectItem value="commodity">Commodities</SelectItem>
              <SelectItem value="index">Índices</SelectItem>
              <SelectItem value="realestate">Real Estate</SelectItem>
            </SelectContent>
          </Select>

          <Select value={filterTimeframe} onValueChange={(v) => setFilterTimeframe(v as any)}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Timeframe" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos los Plazos</SelectItem>
              <SelectItem value="1d">1 Día</SelectItem>
              <SelectItem value="1w">1 Semana</SelectItem>
              <SelectItem value="1m">1 Mes</SelectItem>
              <SelectItem value="3m">3 Meses</SelectItem>
            </SelectContent>
          </Select>

          <Select value={sortBy} onValueChange={(v) => setSortBy(v as any)}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Ordenar por" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="score">Mejor Score</SelectItem>
              <SelectItem value="potential">Mayor Potencial</SelectItem>
              <SelectItem value="risk">Menor Riesgo</SelectItem>
              <SelectItem value="confidence">Mayor Confianza</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="border border-border rounded-lg overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12">#</TableHead>
                <TableHead>Activo</TableHead>
                <TableHead>Clase</TableHead>
                <TableHead className="text-right">Precio</TableHead>
                <TableHead className="text-center">Score</TableHead>
                <TableHead className="text-center">Riesgo</TableHead>
                <TableHead className="text-right">Potencial</TableHead>
                <TableHead className="text-right">Confianza</TableHead>
                <TableHead className="text-center">Timeframe</TableHead>
                <TableHead className="text-right">Tendencia</TableHead>
                <TableHead className="text-right">Acción</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredOpportunities.slice(0, 20).map((opp, index) => {
                const scoreGrade = getScoreGrade(opp.score);
                const riskLevel = getRiskLevel(opp.risk);
                
                return (
                  <TableRow key={`${opp.asset.symbol}-${index}`} className="hover:bg-muted/50">
                    <TableCell className="text-muted-foreground font-mono text-sm">{index + 1}</TableCell>
                    <TableCell>
                      <div>
                        <div className="font-mono font-semibold">{opp.asset.symbol}</div>
                        <div className="text-xs text-muted-foreground">{opp.asset.name}</div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className={cn("text-xs", getAssetClassColor(opp.asset.assetClass))}>
                        {getAssetClassLabel(opp.asset.assetClass)}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right font-mono">{formatCurrency(opp.asset.price)}</TableCell>
                    <TableCell>
                      <div className="flex items-center justify-center gap-2">
                        <Badge variant="outline" className={cn("text-xs", scoreGrade.color)}>
                          {scoreGrade.label}
                        </Badge>
                        <span className="font-mono text-sm">{opp.score.toFixed(0)}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge variant="outline" className={cn("text-xs", riskLevel.color)}>
                        {riskLevel.label}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right font-mono font-semibold text-accent">
                      +{opp.potential.toFixed(1)}%
                    </TableCell>
                    <TableCell className="text-right font-mono text-sm">{opp.confidence.toFixed(0)}%</TableCell>
                    <TableCell className="text-center">
                      <Badge variant="secondary" className="text-xs">{opp.timeframe}</Badge>
                    </TableCell>
                    <TableCell>
                      <div className="h-8 w-20 ml-auto">
                        <Sparkline data={opp.asset.trend} positive={opp.asset.change24h >= 0} />
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button size="sm" variant="ghost">Analizar</Button>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      </Card>
    </div>
  );
};
