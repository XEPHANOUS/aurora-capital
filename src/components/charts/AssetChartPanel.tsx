import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { LineChart } from '@/components/charts/LineChart';
import { CandlestickChart } from '@/components/charts/CandlestickChart';
import type { MarketSnapshot, MarketSymbol, MarketTimeframe } from '@/lib/market/types';

interface AssetChartPanelProps {
  snapshot: MarketSnapshot;
  selectedSymbol: MarketSymbol;
  selectedTimeframe: MarketTimeframe;
  onSymbolChange: (symbol: MarketSymbol) => void;
  onTimeframeChange: (timeframe: MarketTimeframe) => void;
}

export function AssetChartPanel({
  snapshot,
  selectedSymbol,
  selectedTimeframe,
  onSymbolChange,
  onTimeframeChange,
}: AssetChartPanelProps) {
  const [mode, setMode] = useState<'line' | 'candles'>('line');

  return (
    <Card className="p-6 bg-card/50 backdrop-blur-sm">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between mb-5">
        <div>
          <h3 className="font-heading font-semibold text-lg">Gráfico Principal</h3>
          <p className="text-sm text-muted-foreground mt-1">
            {snapshot.asset.name} · {snapshot.asset.price.toFixed(2)} USD · {snapshot.asset.changePercent >= 0 ? '+' : ''}{snapshot.asset.changePercent.toFixed(2)}%
          </p>
        </div>

        <div className="flex flex-wrap gap-3">
          <div className="space-y-1 min-w-28">
            <Label>Activo</Label>
            <Select value={selectedSymbol} onValueChange={(value) => onSymbolChange(value as MarketSymbol)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="BTC">BTC</SelectItem>
                <SelectItem value="ETH">ETH</SelectItem>
                <SelectItem value="NVDA">NVDA</SelectItem>
                <SelectItem value="SPY">SPY</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1 min-w-28">
            <Label>Timeframe</Label>
            <Select value={selectedTimeframe} onValueChange={(value) => onTimeframeChange(value as MarketTimeframe)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1m">1m</SelectItem>
                <SelectItem value="5m">5m</SelectItem>
                <SelectItem value="15m">15m</SelectItem>
                <SelectItem value="1h">1h</SelectItem>
                <SelectItem value="4h">4h</SelectItem>
                <SelectItem value="1d">1d</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1">
            <Label>Vista</Label>
            <div className="flex gap-2">
              <Button size="sm" variant={mode === 'line' ? 'default' : 'outline'} onClick={() => setMode('line')}>
                Lineal
              </Button>
              <Button size="sm" variant={mode === 'candles' ? 'default' : 'outline'} onClick={() => setMode('candles')}>
                Velas
              </Button>
            </div>
          </div>
        </div>
      </div>

      {mode === 'line' ? <LineChart candles={snapshot.candles} /> : <CandlestickChart candles={snapshot.candles} />}
    </Card>
  );
}
