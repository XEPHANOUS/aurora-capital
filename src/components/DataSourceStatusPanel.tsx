import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import type { DataSourceStatus } from '@/lib/types';
import { Circle, WifiHigh, WifiSlash } from '@phosphor-icons/react';
import { cn } from '@/lib/utils';

interface DataSourceStatusPanelProps {
  dataSource: DataSourceStatus;
  className?: string;
}

export function DataSourceStatusPanel({ dataSource, className }: DataSourceStatusPanelProps) {
  const { provider, marketStatus, lastSuccessfulUpdate, errorCount } = dataSource;
  
  const statusColors = {
    connected: 'text-accent border-accent',
    disconnected: 'text-destructive border-destructive',
    connecting: 'text-warning border-warning',
    error: 'text-destructive border-destructive',
  };

  const marketStatusColors = {
    open: 'text-accent',
    closed: 'text-muted-foreground',
    'pre-market': 'text-warning',
    'after-hours': 'text-warning',
    unknown: 'text-muted-foreground',
  };

  return (
    <Card className={cn('p-4 bg-card/50 backdrop-blur-sm', className)}>
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-heading font-semibold text-sm">ESTADO DE DATOS</h3>
        {provider.status === 'connected' ? (
          <WifiHigh size={20} className="text-accent" />
        ) : (
          <WifiSlash size={20} className="text-destructive" />
        )}
      </div>
      
      <div className="space-y-3">
        <div>
          <p className="text-xs text-muted-foreground mb-1">Proveedor</p>
          <p className="font-mono text-sm font-medium">{provider.name}</p>
        </div>
        
        <div className="flex items-center justify-between">
          <span className="text-xs text-muted-foreground">Estado</span>
          <Badge 
            variant="outline" 
            className={cn('text-xs', statusColors[provider.status])}
          >
            <Circle size={8} weight="fill" className="mr-1" />
            {provider.status === 'connected' ? 'Conectado' :
             provider.status === 'connecting' ? 'Conectando' :
             provider.status === 'error' ? 'Error' : 'Desconectado'}
          </Badge>
        </div>
        
        {lastSuccessfulUpdate && (
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground">Última Actualización</span>
            <span className="font-mono text-xs">
              {new Date(lastSuccessfulUpdate).toLocaleTimeString('es-ES')}
            </span>
          </div>
        )}
        
        <div className="flex items-center justify-between">
          <span className="text-xs text-muted-foreground">Tipo de Fuente</span>
          <Badge variant="outline" className="text-xs">
            {provider.type === 'mock' ? 'Simulación' : 'En Vivo'}
          </Badge>
        </div>
        
        {provider.latency !== undefined && (
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground">Latencia</span>
            <span className="font-mono text-xs">{provider.latency}ms</span>
          </div>
        )}
        
        <div className="flex items-center justify-between">
          <span className="text-xs text-muted-foreground">Mercado</span>
          <span className={cn('text-xs font-medium uppercase', marketStatusColors[marketStatus])}>
            {marketStatus === 'open' ? 'Abierto' :
             marketStatus === 'closed' ? 'Cerrado' :
             marketStatus === 'pre-market' ? 'Pre-Mercado' :
             marketStatus === 'after-hours' ? 'Post-Mercado' : 'Desconocido'}
          </span>
        </div>
        
        {errorCount > 0 && (
          <div className="p-2 bg-destructive/10 border border-destructive/30 rounded">
            <p className="text-xs text-destructive">
              {errorCount} error{errorCount > 1 ? 'es' : ''} reciente{errorCount > 1 ? 's' : ''}
            </p>
          </div>
        )}
      </div>
    </Card>
  );
}
