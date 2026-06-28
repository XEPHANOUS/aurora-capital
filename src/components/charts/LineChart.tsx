import { useMemo, useState } from 'react';
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from '@/components/ui/chart';
import { Button } from '@/components/ui/button';
import { CartesianGrid, Line, LineChart as RechartsLineChart, XAxis, YAxis } from 'recharts';
import type { OHLCV } from '@/lib/market/types';

interface LineChartProps {
  candles: OHLCV[];
}

const chartConfig = {
  close: {
    label: 'Close',
    color: 'hsl(var(--primary))',
  },
};

type ZoomWindow = 24 | 48 | 96 | 'all';

export function LineChart({ candles }: LineChartProps) {
  const [zoomWindow, setZoomWindow] = useState<ZoomWindow>(48);

  const visibleData = useMemo(() => {
    const source = zoomWindow === 'all' ? candles : candles.slice(-zoomWindow);
    return source.map((candle) => ({
      time: new Date(candle.timestamp).toLocaleString('es-ES', { month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' }),
      close: candle.close,
    }));
  }, [candles, zoomWindow]);

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2">
        {[24, 48, 96, 'all'].map((window) => (
          <Button
            key={String(window)}
            size="sm"
            variant={zoomWindow === window ? 'default' : 'outline'}
            onClick={() => setZoomWindow(window as ZoomWindow)}
          >
            {window === 'all' ? 'Todo' : `${window}`}
          </Button>
        ))}
      </div>

      <ChartContainer config={chartConfig} className="h-72 w-full">
        <RechartsLineChart data={visibleData} margin={{ left: 12, right: 12, top: 12, bottom: 12 }}>
          <CartesianGrid vertical={false} />
          <XAxis dataKey="time" tickLine={false} axisLine={false} minTickGap={24} />
          <YAxis tickLine={false} axisLine={false} width={64} domain={['auto', 'auto']} />
          <ChartTooltip content={<ChartTooltipContent />} cursor={false} />
          <Line type="monotone" dataKey="close" stroke="var(--color-close)" strokeWidth={2.2} dot={false} />
        </RechartsLineChart>
      </ChartContainer>
    </div>
  );
}
