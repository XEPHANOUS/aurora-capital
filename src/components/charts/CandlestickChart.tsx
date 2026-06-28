import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from '@/components/ui/chart';
import { CartesianGrid, Bar, ComposedChart, XAxis, YAxis } from 'recharts';
import type { OHLCV } from '@/lib/market/types';

interface CandlestickChartProps {
  candles: OHLCV[];
}

const chartConfig = {
  body: {
    label: 'Candle',
    color: 'hsl(var(--primary))',
  },
};

function CandleShape(props: any) {
  const { x, y, width, height, payload } = props;
  const bullish = payload.close >= payload.open;
  const chartHeight = 240;
  const max = payload.maxValue;
  const min = payload.minValue;
  const scale = max === min ? 1 : chartHeight / (max - min);
  const wickTop = (max - payload.high) * scale + 16;
  const wickBottom = (max - payload.low) * scale + 16;
  const bodyY = y;
  const bodyHeight = Math.max(height, 2);
  const centerX = x + width / 2;

  return (
    <g>
      <line x1={centerX} x2={centerX} y1={wickTop} y2={wickBottom} stroke={bullish ? 'hsl(var(--accent))' : 'hsl(var(--destructive))'} strokeWidth={1.4} />
      <rect
        x={x + width * 0.18}
        y={bodyY}
        width={width * 0.64}
        height={bodyHeight}
        rx={1}
        fill={bullish ? 'hsl(var(--accent))' : 'hsl(var(--destructive))'}
        opacity={0.88}
      />
    </g>
  );
}

export function CandlestickChart({ candles }: CandlestickChartProps) {
  const subset = candles.slice(-64);
  const maxValue = Math.max(...subset.map((candle) => candle.high));
  const minValue = Math.min(...subset.map((candle) => candle.low));

  const data = subset.map((candle) => ({
    ...candle,
    time: new Date(candle.timestamp).toLocaleString('es-ES', { month: '2-digit', day: '2-digit', hour: '2-digit' }),
    bodyBase: Math.min(candle.open, candle.close),
    bodyHeight: Math.abs(candle.close - candle.open),
    maxValue,
    minValue,
  }));

  return (
    <ChartContainer config={chartConfig} className="h-72 w-full">
      <ComposedChart data={data} margin={{ left: 12, right: 12, top: 12, bottom: 12 }}>
        <CartesianGrid vertical={false} />
        <XAxis dataKey="time" tickLine={false} axisLine={false} minTickGap={20} />
        <YAxis tickLine={false} axisLine={false} width={64} domain={[minValue * 0.995, maxValue * 1.005]} />
        <ChartTooltip content={<ChartTooltipContent />} cursor={false} />
        <Bar dataKey="bodyHeight" fill="var(--color-body)" shape={<CandleShape />} />
      </ComposedChart>
    </ChartContainer>
  );
}
