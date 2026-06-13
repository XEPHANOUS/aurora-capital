import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { TrendUp, TrendDown, Circle } from '@phosphor-icons/react';
import { Sparkline } from '@/components/Sparkline';
import { cn } from '@/lib/utils';
import { formatCurrency, formatPercent, generateTrendData } from '@/lib/mockData';
import type { EnvironmentType } from '@/lib/types';
import type { LearningEngineState } from '@/lib/types';
import { ENVIRONMENT_CONFIGS } from '@/lib/services/environmentManager';

interface EnvironmentAccount {
  agents: any[];
  operations: any[];
  currentCapital: number;
  learningState: LearningEngineState;
  config: any;
}

interface PortfolioCenterProps {
  allAccounts: Record<EnvironmentType, EnvironmentAccount>;
  currentEnvironment: EnvironmentType;
  onSelectEnvironment: (env: EnvironmentType) => void;
}

export function PortfolioCenter({ allAccounts, currentEnvironment, onSelectEnvironment }: PortfolioCenterProps) {
  const calculatePortfolioMetrics = (account: EnvironmentAccount) => {
    const initialCapital = account.config?.totalCapital || 10000;
    const current = account.currentCapital;
    const pnl = current - initialCapital;
    const pnlPercent = ((current - initialCapital) / initialCapital) * 100;
    
    const openPositions = account.operations?.filter(op => !op.result) || [];
    const closedPositions = account.operations?.filter(op => op.result !== undefined) || [];
    
    const winningTrades = closedPositions.filter(op => (op.result || 0) > 0).length;
    const totalTrades = closedPositions.length;
    const winRate = totalTrades > 0 ? (winningTrades / totalTrades) * 100 : 0;
    
    const maxDrawdown = account.learningState?.globalStats?.maxDrawdownPercent || 0;
    const exposurePercent = (openPositions.reduce((sum, op) => sum + op.amount, 0) / current) * 100;
    
    return {
      capital: current,
      pnl,
      pnlPercent,
      openPositions: openPositions.length,
      closedPositions: closedPositions.length,
      roi: pnlPercent,
      winRate,
      maxDrawdown,
      exposurePercent,
      trades: totalTrades,
    };
  };

  const environments: EnvironmentType[] = ['sandbox', 'demo', 'paper', 'real'];
  const portfolios = environments.map(env => ({
    env,
    ...calculatePortfolioMetrics(allAccounts[env]),
  }));

  const globalMetrics = {
    totalCapital: portfolios.reduce((sum, p) => sum + p.capital, 0),
    totalPnL: portfolios.reduce((sum, p) => sum + p.pnl, 0),
    totalTrades: portfolios.reduce((sum, p) => sum + p.trades, 0),
    avgWinRate: portfolios.reduce((sum, p) => sum + p.winRate, 0) / portfolios.length,
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-heading font-bold text-3xl tracking-tight text-glow">
            PORTFOLIO
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            Gestión de capital multi-entorno
          </p>
        </div>
      </div>

      <Card className="p-6 bg-card/50 backdrop-blur-sm">
        <h3 className="font-heading font-semibold text-lg mb-4">VISTA CONSOLIDADA</h3>
        <div className="grid grid-cols-4 gap-6">
          <div>
            <p className="text-xs text-muted-foreground uppercase tracking-wide mb-2">Capital Total</p>
            <p className="font-mono font-bold text-2xl">{formatCurrency(globalMetrics.totalCapital)}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground uppercase tracking-wide mb-2">PnL Global</p>
            <p className={cn(
              "font-mono font-bold text-2xl",
              globalMetrics.totalPnL >= 0 ? "text-accent" : "text-destructive"
            )}>
              {globalMetrics.totalPnL >= 0 ? '+' : ''}{formatCurrency(globalMetrics.totalPnL)}
            </p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground uppercase tracking-wide mb-2">Operaciones Totales</p>
            <p className="font-mono font-bold text-2xl">{globalMetrics.totalTrades}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground uppercase tracking-wide mb-2">Win Rate Promedio</p>
            <p className="font-mono font-bold text-2xl text-primary">{globalMetrics.avgWinRate.toFixed(1)}%</p>
          </div>
        </div>
      </Card>

      <Tabs value={currentEnvironment} onValueChange={(v) => onSelectEnvironment(v as EnvironmentType)}>
        <TabsList className="grid w-full grid-cols-4 mb-6">
          {environments.map((env) => {
            const config = ENVIRONMENT_CONFIGS[env];
            const portfolio = portfolios.find(p => p.env === env);
            return (
              <TabsTrigger key={env} value={env} className="flex flex-col items-center py-3 gap-1">
                <div className="flex items-center gap-2">
                  <span>{config.icon}</span>
                  <span className="font-heading font-semibold text-sm">{config.name}</span>
                </div>
                {portfolio && (
                  <span className={cn(
                    "text-xs font-mono",
                    portfolio.pnlPercent >= 0 ? "text-accent" : "text-destructive"
                  )}>
                    {portfolio.pnlPercent >= 0 ? '+' : ''}{portfolio.pnlPercent.toFixed(2)}%
                  </span>
                )}
              </TabsTrigger>
            );
          })}
        </TabsList>

        {environments.map((env) => {
          const portfolio = portfolios.find(p => p.env === env)!;
          const config = ENVIRONMENT_CONFIGS[env];
          const account = allAccounts[env];

          return (
            <TabsContent key={env} value={env} className="space-y-6">
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <Card className="p-4 bg-card/50 backdrop-blur-sm">
                  <p className="text-xs text-muted-foreground uppercase tracking-wide mb-2">Capital</p>
                  <p className="font-mono font-bold text-xl">{formatCurrency(portfolio.capital)}</p>
                </Card>

                <Card className="p-4 bg-card/50 backdrop-blur-sm">
                  <p className="text-xs text-muted-foreground uppercase tracking-wide mb-2">PnL</p>
                  <div>
                    <p className={cn(
                      "font-mono font-bold text-xl",
                      portfolio.pnl >= 0 ? "text-accent" : "text-destructive"
                    )}>
                      {portfolio.pnl >= 0 ? '+' : ''}{formatCurrency(portfolio.pnl)}
                    </p>
                    <p className={cn(
                      "text-sm font-mono",
                      portfolio.pnlPercent >= 0 ? "text-accent" : "text-destructive"
                    )}>
                      {portfolio.pnlPercent >= 0 ? '+' : ''}{formatPercent(portfolio.pnlPercent)}
                    </p>
                  </div>
                </Card>

                <Card className="p-4 bg-card/50 backdrop-blur-sm">
                  <p className="text-xs text-muted-foreground uppercase tracking-wide mb-2">Drawdown</p>
                  <p className="font-mono font-bold text-xl text-destructive">
                    {formatPercent(Math.abs(portfolio.maxDrawdown))}
                  </p>
                </Card>

                <Card className="p-4 bg-card/50 backdrop-blur-sm">
                  <p className="text-xs text-muted-foreground uppercase tracking-wide mb-2">ROI</p>
                  <p className={cn(
                    "font-mono font-bold text-xl",
                    portfolio.roi >= 0 ? "text-accent" : "text-destructive"
                  )}>
                    {portfolio.roi >= 0 ? '+' : ''}{formatPercent(portfolio.roi)}
                  </p>
                </Card>

                <Card className="p-4 bg-card/50 backdrop-blur-sm">
                  <p className="text-xs text-muted-foreground uppercase tracking-wide mb-2">Operaciones Abiertas</p>
                  <p className="font-mono font-bold text-xl">{portfolio.openPositions}</p>
                </Card>

                <Card className="p-4 bg-card/50 backdrop-blur-sm">
                  <p className="text-xs text-muted-foreground uppercase tracking-wide mb-2">Operaciones Cerradas</p>
                  <p className="font-mono font-bold text-xl">{portfolio.closedPositions}</p>
                </Card>

                <Card className="p-4 bg-card/50 backdrop-blur-sm">
                  <p className="text-xs text-muted-foreground uppercase tracking-wide mb-2">Win Rate</p>
                  <p className="font-mono font-bold text-xl text-primary">{portfolio.winRate.toFixed(1)}%</p>
                </Card>

                <Card className="p-4 bg-card/50 backdrop-blur-sm">
                  <p className="text-xs text-muted-foreground uppercase tracking-wide mb-2">Exposición</p>
                  <p className="font-mono font-bold text-xl">{formatPercent(portfolio.exposurePercent)}</p>
                </Card>
              </div>

              <Card className="p-6 bg-card/50 backdrop-blur-sm">
                <h3 className="font-heading font-semibold text-lg mb-4">OPERACIONES RECIENTES</h3>
                <div className="rounded-lg border border-border/50">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Fecha</TableHead>
                        <TableHead>Activo</TableHead>
                        <TableHead>Acción</TableHead>
                        <TableHead>Importe</TableHead>
                        <TableHead>Resultado</TableHead>
                        <TableHead>Estado</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {account.operations && account.operations.length > 0 ? (
                        account.operations.slice(0, 10).map((op: any) => (
                          <TableRow key={op.id}>
                            <TableCell className="text-sm text-muted-foreground">
                              {new Date(op.date).toLocaleDateString('es-ES', { 
                                day: '2-digit', 
                                month: '2-digit',
                                hour: '2-digit',
                                minute: '2-digit'
                              })}
                            </TableCell>
                            <TableCell className="font-mono font-medium">{op.asset}</TableCell>
                            <TableCell>
                              <Badge variant={op.action === 'BUY' ? 'default' : 'destructive'} className="text-xs">
                                {op.action}
                              </Badge>
                            </TableCell>
                            <TableCell className="font-mono">{formatCurrency(op.amount)}</TableCell>
                            <TableCell>
                              {op.result !== undefined ? (
                                <div className="flex items-center gap-1">
                                  {op.result >= 0 ? (
                                    <TrendUp size={16} className="text-accent" />
                                  ) : (
                                    <TrendDown size={16} className="text-destructive" />
                                  )}
                                  <span className={cn(
                                    "font-mono font-semibold",
                                    op.result >= 0 ? "text-accent" : "text-destructive"
                                  )}>
                                    {op.result >= 0 ? '+' : ''}{formatPercent((op.result / op.amount) * 100)}
                                  </span>
                                </div>
                              ) : (
                                <Badge variant="outline" className="text-xs">
                                  <Circle size={8} weight="fill" className="mr-1 animate-pulse" />
                                  Abierta
                                </Badge>
                              )}
                            </TableCell>
                            <TableCell>
                              <Badge 
                                variant={op.status === 'executed' ? 'default' : 'destructive'}
                                className="text-xs"
                              >
                                {op.status === 'executed' ? 'Ejecutado' : op.status === 'vetoed' ? 'Vetado' : op.status}
                              </Badge>
                            </TableCell>
                          </TableRow>
                        ))
                      ) : (
                        <TableRow>
                          <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                            No hay operaciones en este entorno
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>
              </Card>

              <Card className="p-6 bg-card/50 backdrop-blur-sm">
                <h3 className="font-heading font-semibold text-lg mb-4">RENDIMIENTO</h3>
                <div className="h-32">
                  <Sparkline data={generateTrendData()} positive={portfolio.pnlPercent >= 0} className="h-full" />
                </div>
              </Card>
            </TabsContent>
          );
        })}
      </Tabs>
    </div>
  );
}
