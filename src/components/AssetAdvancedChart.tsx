import { useEffect, useMemo, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  ColorType,
  CrosshairMode,
  createChart,
  type CandlestickData,
  type HistogramData,
  type LineData,
  type UTCTimestamp,
} from 'lightweight-charts';
import type { AssetAdvancedChartData } from '@/lib/assetAnalysis';

interface AssetAdvancedChartProps {
  data: AssetAdvancedChartData;
  symbol: string;
  name: string;
}

export function AssetAdvancedChart({ data, symbol, name }: AssetAdvancedChartProps) {
  return (
    <AdvancedChartShell data={data} symbol={symbol} name={name} />
  );
}

function formatCompactPrice(value: number): string {
  if (value >= 1000) return `$${(value / 1000).toFixed(2)}K`;
  if (value >= 1) return `$${value.toFixed(2)}`;
  return `$${value.toFixed(4)}`;
}

function toChartTime(timestamp: string): UTCTimestamp {
  return Math.floor(new Date(timestamp).getTime() / 1000) as UTCTimestamp;
}

function buildEma(candles: AssetAdvancedChartData['ohlc'], period: number): LineData[] {
  if (candles.length === 0) return [];

  const alpha = 2 / (period + 1);
  let ema = candles[0].close;

  return candles.map((candle, index) => {
    ema = index === 0 ? candle.close : candle.close * alpha + ema * (1 - alpha);
    return {
      time: toChartTime(candle.timestamp),
      value: Number(ema.toFixed(6)),
    };
  });
}

function TradingViewChart({
  candles,
  view,
  showVolume,
  showEma20,
  showEma50,
  barSpacing,
  fitSeed,
  lightTheme,
}: {
  candles: AssetAdvancedChartData['ohlc'];
  view: 'candles' | 'line';
  showVolume: boolean;
  showEma20: boolean;
  showEma50: boolean;
  barSpacing: number;
  fitSeed: number;
  lightTheme: boolean;
}) {
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    const palette = lightTheme
      ? {
          background: '#ffffff',
          text: '#3c434f',
          grid: '#edf1f5',
          border: '#d9e2ec',
          up: '#089981',
          down: '#f23645',
          line: '#2962ff',
          ema20: '#f59e0b',
          ema50: '#7c3aed',
          volumeUp: 'rgba(8,153,129,0.35)',
          volumeDown: 'rgba(242,54,69,0.35)',
        }
      : {
          background: '#040a10',
          text: '#8ca3ad',
          grid: '#17313d',
          border: '#17313d',
          up: '#35f2a2',
          down: '#ff5d6c',
          line: '#27d6ff',
          ema20: '#f59e0b',
          ema50: '#a78bfa',
          volumeUp: 'rgba(53,242,162,0.45)',
          volumeDown: 'rgba(255,93,108,0.45)',
        };

    const chart = createChart(containerRef.current, {
      width: containerRef.current.clientWidth,
      height: 360,
      layout: {
        background: { type: ColorType.Solid, color: palette.background },
        textColor: palette.text,
      },
      grid: {
        vertLines: { color: palette.grid },
        horzLines: { color: palette.grid },
      },
      rightPriceScale: {
        borderColor: palette.border,
      },
      timeScale: {
        borderColor: palette.border,
        timeVisible: true,
        secondsVisible: false,
        barSpacing,
      },
      crosshair: {
        mode: CrosshairMode.Normal,
      },
    });

    const volumeData: HistogramData[] = candles.map((candle) => ({
      time: toChartTime(candle.timestamp),
      value: candle.volume || 0,
      color: candle.close >= candle.open ? palette.volumeUp : palette.volumeDown,
    }));

    if (view === 'candles') {
      const series = chart.addCandlestickSeries({
        upColor: palette.up,
        downColor: palette.down,
        borderVisible: false,
        wickUpColor: palette.up,
        wickDownColor: palette.down,
      });

      const seriesData: CandlestickData[] = candles.map((candle) => ({
        time: toChartTime(candle.timestamp),
        open: candle.open,
        high: candle.high,
        low: candle.low,
        close: candle.close,
      }));
      series.setData(seriesData);
    } else {
      const series = chart.addLineSeries({
        color: palette.line,
        lineWidth: 2,
      });

      const seriesData: LineData[] = candles.map((candle) => ({
        time: toChartTime(candle.timestamp),
        value: candle.close,
      }));
      series.setData(seriesData);
    }

    if (showEma20) {
      const ema20Series = chart.addLineSeries({
        color: palette.ema20,
        lineWidth: 1.6,
      });
      ema20Series.setData(buildEma(candles, 20));
    }

    if (showEma50) {
      const ema50Series = chart.addLineSeries({
        color: palette.ema50,
        lineWidth: 1.6,
      });
      ema50Series.setData(buildEma(candles, 50));
    }

    if (showVolume) {
      const volumeSeries = chart.addHistogramSeries({
        priceFormat: { type: 'volume' },
        priceScaleId: 'volume',
        priceLineVisible: false,
        lastValueVisible: false,
        scaleMargins: {
          top: 0.78,
          bottom: 0,
        },
      });
      volumeSeries.setData(volumeData);
      chart.priceScale('volume').applyOptions({
        scaleMargins: {
          top: 0.78,
          bottom: 0,
        },
        borderVisible: false,
      });
    }

    chart.timeScale().fitContent();

    const handleResize = () => {
      if (!containerRef.current) return;
      chart.applyOptions({ width: containerRef.current.clientWidth });
    };

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      chart.remove();
    };
  }, [candles, view, showVolume, showEma20, showEma50, barSpacing, fitSeed, lightTheme]);

  return <div ref={containerRef} className="h-[360px] w-full rounded-lg border border-border/60" />;
}

function timeframeLabel(label: string): string {
  if (label === '1D') return '24h';
  if (label === '1W') return '7d';
  if (label === '1M') return '30d';
  return 'all';
}

function sliceByTimeframe(candles: AssetAdvancedChartData['ohlc'], timeframe: '1D' | '1W' | '1M' | 'ALL') {
  if (candles.length === 0) return candles;
  if (timeframe === '1D') return candles.slice(-24);
  if (timeframe === '1W') return candles.slice(-48);
  if (timeframe === '1M') return candles.slice(-72);
  return candles.slice(-120);
}

function AdvancedChartShell({ data, symbol, name }: AssetAdvancedChartProps) {
  const [view, setView] = useState<'candles' | 'line'>('candles');
  const [timeframe, setTimeframe] = useState<'1D' | '1W' | '1M' | 'ALL'>('1W');
  const [barSpacing, setBarSpacing] = useState(10);
  const [fitSeed, setFitSeed] = useState(0);
  const [showVolume, setShowVolume] = useState(true);
  const [showEma20, setShowEma20] = useState(false);
  const [showEma50, setShowEma50] = useState(false);
  const [lightTheme, setLightTheme] = useState(true);

  const visibleCandles = useMemo(() => sliceByTimeframe(data.ohlc, timeframe), [data.ohlc, timeframe]);
  const last = visibleCandles[visibleCandles.length - 1];
  const first = visibleCandles[0];
  const previous = visibleCandles.length > 1 ? visibleCandles[visibleCandles.length - 2] : last;

  const pctChange = useMemo(() => {
    if (!last || !first || first.close === 0) return 0;
    return ((last.close - first.close) / first.close) * 100;
  }, [first, last]);

  const watchlistRows = useMemo(() => {
    if (visibleCandles.length < 2) return [];

    const rows = [
      { label: '24H', from: Math.max(0, visibleCandles.length - 24) },
      { label: '12H', from: Math.max(0, visibleCandles.length - 12) },
      { label: '6H', from: Math.max(0, visibleCandles.length - 6) },
      { label: '3H', from: Math.max(0, visibleCandles.length - 3) },
      { label: '1H', from: Math.max(0, visibleCandles.length - 2) },
    ];

    return rows.map((row) => {
      const start = visibleCandles[row.from]?.close ?? visibleCandles[0]?.close ?? 0;
      const end = visibleCandles[visibleCandles.length - 1]?.close ?? 0;
      const change = start === 0 ? 0 : ((end - start) / start) * 100;
      return {
        period: row.label,
        price: end,
        change,
        timeframe: row.label === '24H' ? '1D' : row.label === '12H' ? '1W' : row.label === '6H' ? '1W' : row.label === '3H' ? '1M' : 'ALL',
      };
    });
  }, [visibleCandles]);

  const high = useMemo(
    () => (visibleCandles.length > 0 ? Math.max(...visibleCandles.map((candle) => candle.high)) : 0),
    [visibleCandles],
  );
  const low = useMemo(
    () => (visibleCandles.length > 0 ? Math.min(...visibleCandles.map((candle) => candle.low)) : 0),
    [visibleCandles],
  );
  const totalVolume = useMemo(
    () => visibleCandles.reduce((acc, candle) => acc + (candle.volume || 0), 0),
    [visibleCandles],
  );

  const intraChange = last && previous && previous.close !== 0 ? ((last.close - previous.close) / previous.close) * 100 : 0;

  return (
    <div className={`overflow-hidden rounded-xl border border-border/60 ${lightTheme ? 'bg-white' : 'bg-[#0b1118]'} shadow-[0_0_0_1px_rgba(22,33,46,0.4)]`}>
      <div className={`flex items-center justify-between border-b border-border/40 px-4 py-2 ${lightTheme ? 'bg-[#f7f9fc]' : 'bg-[#0f1721]'}`}>
        <div className="flex items-center gap-3">
          <p className="font-heading text-sm font-semibold tracking-wide">{symbol} · 1D</p>
          <p className="text-xs text-muted-foreground">{name}</p>
          <p className={`font-mono text-xs ${intraChange >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
            O {last ? formatCompactPrice(last.open) : '$0.00'} H {last ? formatCompactPrice(last.high) : '$0.00'} L {last ? formatCompactPrice(last.low) : '$0.00'} C {last ? formatCompactPrice(last.close) : '$0.00'}
            {' '}({intraChange >= 0 ? '+' : ''}{intraChange.toFixed(2)}%)
          </p>
        </div>
        <div className="flex items-center gap-2 text-[11px]">
          <Button size="sm" variant="ghost" className="h-7 px-2" onClick={() => setShowEma20((state) => !state)}>
            EMA20 {showEma20 ? 'ON' : 'OFF'}
          </Button>
          <Button size="sm" variant="ghost" className="h-7 px-2" onClick={() => setShowEma50((state) => !state)}>
            EMA50 {showEma50 ? 'ON' : 'OFF'}
          </Button>
          <Button size="sm" variant="ghost" className="h-7 px-2" onClick={() => setShowVolume((state) => !state)}>
            Vol {showVolume ? 'ON' : 'OFF'}
          </Button>
          <Button size="sm" variant="ghost" className="h-7 px-2" onClick={() => setLightTheme((state) => !state)}>
            {lightTheme ? 'Tema Oscuro' : 'Tema Claro'}
          </Button>
          {(['1D', '1W', '1M', 'ALL'] as const).map((item) => (
            <Button
              key={item}
              size="sm"
              variant={timeframe === item ? 'default' : 'ghost'}
              className="h-7 px-2 text-[11px]"
              onClick={() => setTimeframe(item)}
            >
              {item}
            </Button>
          ))}
        </div>
      </div>

      <div className="flex min-h-[470px]">
        <aside className={`hidden w-12 flex-col items-center gap-2 border-r border-border/40 py-3 md:flex ${lightTheme ? 'bg-[#f6f8fb]' : 'bg-[#0c131d]'}`}>
          {[
            { label: '+', onClick: () => setBarSpacing((value) => Math.min(28, value + 1)) },
            { label: '-', onClick: () => setBarSpacing((value) => Math.max(5, value - 1)) },
            { label: 'R', onClick: () => setFitSeed((value) => value + 1) },
            { label: 'V', onClick: () => setShowVolume((state) => !state) },
            { label: '20', onClick: () => setShowEma20((state) => !state) },
            { label: '50', onClick: () => setShowEma50((state) => !state) },
          ].map((tool) => (
            <button
              key={tool}
              type="button"
              className="h-7 w-7 rounded-md border border-border/50 bg-[#101b28] text-xs text-muted-foreground transition hover:border-cyan-400/70 hover:text-cyan-300"
              onClick={tool.onClick}
            >
              {tool.label}
            </button>
          ))}
        </aside>

        <section className="flex min-w-0 flex-1 flex-col">
          <div className="flex items-center justify-between border-b border-border/40 px-3 py-2">
            <div className="flex items-center gap-2">
              <Button size="sm" variant={view === 'candles' ? 'default' : 'ghost'} className="h-7 px-2 text-[11px]" onClick={() => setView('candles')}>
                Velas
              </Button>
              <Button size="sm" variant={view === 'line' ? 'default' : 'ghost'} className="h-7 px-2 text-[11px]" onClick={() => setView('line')}>
                Línea
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">Marco temporal: {timeframeLabel(timeframe)}</p>
          </div>

          <div className="p-3">
            <TradingViewChart
              candles={visibleCandles}
              view={view}
              showVolume={showVolume}
              showEma20={showEma20}
              showEma50={showEma50}
              barSpacing={barSpacing}
              fitSeed={fitSeed}
              lightTheme={lightTheme}
            />
          </div>
        </section>

        <aside className={`hidden w-56 flex-col border-l border-border/40 lg:flex ${lightTheme ? 'bg-[#fbfcff]' : 'bg-[#0e1622]'}`}>
          <div className="border-b border-border/40 px-3 py-2">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Seguimiento</p>
          </div>

          <div className="flex-1 overflow-auto px-2 py-2">
            {watchlistRows.map((row) => (
              <button
                key={row.period}
                type="button"
                onClick={() => setTimeframe(row.timeframe as '1D' | '1W' | '1M' | 'ALL')}
                className="mb-1 flex w-full items-center justify-between rounded-md px-2 py-1 text-left hover:bg-[#132233]"
              >
                <div>
                  <p className="text-xs font-medium text-foreground">{symbol} {row.period}</p>
                  <p className="text-[11px] text-muted-foreground">{formatCompactPrice(row.price)}</p>
                </div>
                <p className={`text-xs font-semibold ${row.change >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                  {row.change >= 0 ? '+' : ''}{row.change.toFixed(2)}%
                </p>
              </button>
            ))}
          </div>

          <div className="border-t border-border/40 px-3 py-2">
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Estadisticas</p>
            <div className="space-y-1 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Max</span>
                <span className="font-mono">{formatCompactPrice(high)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Min</span>
                <span className="font-mono">{formatCompactPrice(low)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Volumen</span>
                <span className="font-mono">{Math.round(totalVolume).toLocaleString('es-ES')}</span>
              </div>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
