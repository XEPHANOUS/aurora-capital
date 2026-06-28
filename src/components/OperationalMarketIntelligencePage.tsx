import { useMemo, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AssetChartPanel } from '@/components/charts/AssetChartPanel';
import { buildOperationalMarketIntelligence } from '@/lib/market/operationalMarketPipeline';
import { SUPPORTED_MARKET_SYMBOLS, SUPPORTED_MARKET_TIMEFRAMES } from '@/lib/market/marketDataProvider';
import type { MarketSymbol, MarketTimeframe, TechnicalSignal } from '@/lib/market/types';

function signalTone(signal: TechnicalSignal): string {
  if (signal === 'Bullish') return 'border-accent text-accent';
  if (signal === 'Bearish') return 'border-destructive text-destructive';
  return 'border-muted-foreground text-muted-foreground';
}

export function OperationalMarketIntelligencePage() {
  const [selectedSymbol, setSelectedSymbol] = useState<MarketSymbol>(SUPPORTED_MARKET_SYMBOLS[0]);
  const [selectedTimeframe, setSelectedTimeframe] = useState<MarketTimeframe>(SUPPORTED_MARKET_TIMEFRAMES[3]);

  const operational = useMemo(
    () => buildOperationalMarketIntelligence(selectedSymbol, selectedTimeframe),
    [selectedSymbol, selectedTimeframe],
  );

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="font-heading font-bold text-3xl tracking-tight text-glow">MARKET INTELLIGENCE</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Pipeline operativo real: Activo → Técnico → Analista → Director → Resultado
          </p>
        </div>
        <Badge variant="outline" className="text-xs border-primary text-primary">
          Experimental
        </Badge>
      </div>

      <AssetChartPanel
        snapshot={operational.snapshot}
        selectedSymbol={selectedSymbol}
        selectedTimeframe={selectedTimeframe}
        onSymbolChange={setSelectedSymbol}
        onTimeframeChange={setSelectedTimeframe}
      />

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <Card className="p-5 bg-card/50 backdrop-blur-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-heading font-semibold text-base">Técnico</h3>
            <Badge variant="outline" className={signalTone(operational.technical.finalSignal)}>
              {operational.technical.finalSignal}
            </Badge>
          </div>
          <p className="text-sm text-foreground/90 mb-4">{operational.technical.summary}</p>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between"><span className="text-muted-foreground">Fuerza</span><span className="font-mono">{operational.technical.strength}%</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">RSI</span><span className="font-mono">{operational.technical.indicators.rsi}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">EMA 20</span><span className="font-mono">{operational.technical.indicators.ema}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">SMA 20</span><span className="font-mono">{operational.technical.indicators.sma}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">MACD Hist</span><span className="font-mono">{operational.technical.indicators.macd.histogram}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">ATR</span><span className="font-mono">{operational.technical.indicators.atr}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Volumen</span><span className="font-mono">x{operational.technical.indicators.volume.ratio}</span></div>
          </div>
        </Card>

        <Card className="p-5 bg-card/50 backdrop-blur-sm border-primary/20">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-heading font-semibold text-base">Analista</h3>
            <Badge variant="outline" className="border-primary text-primary">
              {operational.analyst.confidence}%
            </Badge>
          </div>
          <div className="space-y-3 text-sm">
            <div className="flex justify-between"><span className="text-muted-foreground">Noticias</span><span>{operational.analyst.newsAlignment}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Técnico</span><span>{operational.analyst.technicalAlignment}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Inversor</span><span>{operational.analyst.investorAlignment}</span></div>
          </div>
          <div className="mt-4 rounded-lg bg-background/40 p-3">
            <p className="text-sm text-foreground/90">{operational.analyst.summary}</p>
            <p className="text-sm text-primary mt-2">Recomendación: {operational.analyst.recommendation}</p>
          </div>
        </Card>

        <Card className="p-5 bg-card/50 backdrop-blur-sm border-warning/20">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-heading font-semibold text-base">Director</h3>
            <Badge variant="outline" className="border-warning text-warning">
              {operational.director.confidence}%
            </Badge>
          </div>
          <p className="font-heading font-bold text-xl mb-3">{operational.director.decision}</p>
          <p className="text-sm text-foreground/90 mb-4">{operational.director.summary}</p>
          <div className="space-y-2 text-sm text-muted-foreground">
            <p>Activo: {operational.snapshot.asset.symbol}</p>
            <p>Timeframe: {operational.snapshot.timeframe}</p>
            <p>Último precio: {operational.snapshot.asset.price.toFixed(2)} USD</p>
          </div>
        </Card>
      </div>
    </div>
  );
}
