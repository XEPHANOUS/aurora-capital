import type { AssetQuickChartPoint } from '@/lib/assetAnalysis';

interface AssetQuickChartProps {
  points: AssetQuickChartPoint[];
  change24h: number;
  className?: string;
}

export function AssetQuickChart({ points, change24h, className }: AssetQuickChartProps) {
  const data = points.map((point) => point.price);
  if (data.length === 0) return null;

  const max = Math.max(...data);
  const min = Math.min(...data);
  const range = max - min || 1;
  const coordinates = data
    .map((value, index) => {
      const x = (index / Math.max(data.length - 1, 1)) * 100;
      const y = 100 - ((value - min) / range) * 100;
      return { x, y };
    });

  const linePath = coordinates
    .map((point, index) => `${index === 0 ? 'M' : 'L'} ${point.x} ${point.y}`)
    .join(' ');

  const first = coordinates[0];
  const last = coordinates[coordinates.length - 1];
  const areaPath = `${linePath} L ${last.x} 100 L ${first.x} 100 Z`;
  const stroke = change24h >= 0 ? '#35f2a2' : '#ff5d6c';

  return (
    <div className={className ?? 'h-28'}>
      <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="h-full w-full">
        <defs>
          <linearGradient id="quick-chart-fill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={stroke} stopOpacity="0.28" />
            <stop offset="100%" stopColor={stroke} stopOpacity="0.02" />
          </linearGradient>
        </defs>
        <path d={areaPath} fill="url(#quick-chart-fill)" />
        <path d={linePath} fill="none" stroke={stroke} strokeWidth="2" vectorEffect="non-scaling-stroke" />
      </svg>
    </div>
  );
}
