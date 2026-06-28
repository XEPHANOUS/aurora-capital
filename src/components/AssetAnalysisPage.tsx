import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AssetQuickChart } from '@/components/AssetQuickChart';
import { AssetAdvancedChart } from '@/components/AssetAdvancedChart';
import type { AssetAnalysis } from '@/lib/assetAnalysis';

interface AssetAnalysisPageProps {
  analysis: AssetAnalysis;
}

function stateLabel(state: 'bullish' | 'neutral' | 'bearish'): string {
  if (state === 'bullish') return 'Bullish';
  if (state === 'bearish') return 'Bearish';
  return 'Neutral';
}

function AnalysisBlock({
  title,
  state,
  confidence,
  summary,
}: {
  title: string;
  state: 'bullish' | 'neutral' | 'bearish';
  confidence: number;
  summary: string;
}) {
  return (
    <Card className="p-4 bg-card/50 backdrop-blur-sm border-border/50">
      <div className="flex items-center justify-between mb-2">
        <p className="font-heading font-semibold text-sm">{title}</p>
        <Badge variant="outline" className="text-xs">{stateLabel(state)}</Badge>
      </div>
      <p className="text-xs text-muted-foreground mb-2">Confianza: {confidence}%</p>
      <p className="text-sm text-foreground/90">{summary}</p>
    </Card>
  );
}

export function AssetAnalysisPage({ analysis }: AssetAnalysisPageProps) {
  return (
    <div className="space-y-6">
      <Card className="p-6 bg-card/50 backdrop-blur-sm">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="font-heading font-bold text-2xl tracking-tight">{analysis.symbol}</h3>
            <p className="text-sm text-muted-foreground">{analysis.name}</p>
          </div>
          <div className="text-right">
            <p className="font-mono font-bold text-2xl">{analysis.price.toLocaleString('es-ES', { maximumFractionDigits: 4 })}</p>
            <p className={`text-sm ${analysis.change24h >= 0 ? 'text-accent' : 'text-destructive'}`}>
              {analysis.change24h >= 0 ? '+' : ''}{analysis.change24h.toFixed(2)}%
            </p>
          </div>
        </div>

        <AssetQuickChart points={analysis.quickChart} change24h={analysis.change24h} className="h-28" />
      </Card>

      <Card className="overflow-hidden bg-card/50 p-0 backdrop-blur-sm">
        <AssetAdvancedChart data={analysis.advancedChart} symbol={analysis.symbol} name={analysis.name} />
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <AnalysisBlock title="Noticias" {...analysis.newsSummary} />
        <AnalysisBlock title="Tecnico" {...analysis.technicalSummary} />
        <AnalysisBlock title="Analista" {...analysis.analystSummary} />
        <AnalysisBlock title="Riesgo" {...analysis.riskSummary} />
        <AnalysisBlock title="Director" {...analysis.directorDecision} />
      </div>

      <Card className="p-5 bg-card/50 backdrop-blur-sm border-primary/30">
        <p className="text-xs text-muted-foreground uppercase tracking-wide">Confianza Global</p>
        <p className="font-mono font-bold text-2xl mt-1">{analysis.confidence}%</p>
      </Card>
    </div>
  );
}
