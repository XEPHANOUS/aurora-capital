import { useEffect, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import type { PlatformConfig, PlatformConnectionStatus } from '@/lib/platformConfig';

interface ApiSettingsSectionProps {
  platformConfig: PlatformConfig;
  onPlatformConfigChange: (updater: (current: PlatformConfig) => PlatformConfig) => void;
}

const AUTO_HEALTH_CHECK_INTERVAL_MS = 600_000;
type ApiProviderId = 'coinmarketpro' | 'alpacaPaper';

const PROVIDER_OPTIONS: Array<{ id: ApiProviderId; label: string }> = [
  { id: 'coinmarketpro', label: 'CoinMarketPro' },
  { id: 'alpacaPaper', label: 'Alpaca Paper' },
];

function buildAlpacaAccountEndpoint(baseUrl: string): string {
  const normalized = baseUrl.trim().replace(/\/+$/, '');
  if (/\/v2$/i.test(normalized)) {
    return `${normalized}/account`;
  }
  return `${normalized}/v2/account`;
}

function statusClassName(status: PlatformConnectionStatus): string {
  if (status === 'connected') return 'border-accent text-accent';
  if (status === 'error') return 'border-destructive text-destructive';
  return 'border-muted-foreground text-muted-foreground';
}

function statusLabel(status: PlatformConnectionStatus): string {
  if (status === 'connected') return 'Connected';
  if (status === 'error') return 'Error';
  return 'Disconnected';
}

function resolveApisModuleStatus(config: PlatformConfig, providers: ApiProviderId[]): PlatformConnectionStatus {
  if (providers.length === 0) return 'disconnected';

  const statuses = providers.map((provider) =>
    provider === 'coinmarketpro' ? config.apisConfig.coinmarketpro.status : config.apisConfig.alpacaPaper.status,
  );

  if (statuses.some((status) => status === 'connected')) {
    return 'connected';
  }
  if (statuses.some((status) => status === 'error')) {
    return 'error';
  }
  return 'disconnected';
}

function patchApisModuleHealth(config: PlatformConfig, providers: ApiProviderId[]): PlatformConfig {
  return {
    ...config,
    updatedAt: new Date().toISOString(),
    health: {
      ...config.health,
      apis: {
        status: resolveApisModuleStatus(config, providers),
        detail: 'Estado consolidado de APIs',
        lastCheckAt: new Date().toISOString(),
      },
    },
  };
}

export function ApiSettingsSection({ platformConfig, onPlatformConfigChange }: ApiSettingsSectionProps) {
  const [testingCoinMarketPro, setTestingCoinMarketPro] = useState(false);
  const [testingAlpaca, setTestingAlpaca] = useState(false);
  const [selectedProviderToAdd, setSelectedProviderToAdd] = useState<ApiProviderId>('coinmarketpro');
  const [visibleProviders, setVisibleProviders] = useState<ApiProviderId[]>([]);

  useEffect(() => {
    const configuredProviders: ApiProviderId[] = [];

    if (
      platformConfig.apisConfig.coinmarketpro.apiKey.trim() ||
      platformConfig.apisConfig.coinmarketpro.status !== 'disconnected'
    ) {
      configuredProviders.push('coinmarketpro');
    }

    if (
      platformConfig.apisConfig.alpacaPaper.apiKey.trim() ||
      platformConfig.apisConfig.alpacaPaper.secretKey.trim() ||
      platformConfig.apisConfig.alpacaPaper.status !== 'disconnected'
    ) {
      configuredProviders.push('alpacaPaper');
    }

    setVisibleProviders((prev) => {
      const merged = Array.from(new Set([...prev, ...configuredProviders]));
      return merged;
    });
  }, [
    platformConfig.apisConfig.alpacaPaper.apiKey,
    platformConfig.apisConfig.alpacaPaper.secretKey,
    platformConfig.apisConfig.alpacaPaper.status,
    platformConfig.apisConfig.coinmarketpro.apiKey,
    platformConfig.apisConfig.coinmarketpro.status,
  ]);

  const updateCoinMarketProField = (field: 'apiKey' | 'baseUrl', value: string) => {
    onPlatformConfigChange((current) => ({
      ...current,
      updatedAt: new Date().toISOString(),
      apisConfig: {
        ...current.apisConfig,
        coinmarketpro: {
          ...current.apisConfig.coinmarketpro,
          [field]: value,
        },
      },
    }));
  };

  const updateAlpacaField = (field: 'apiKey' | 'secretKey' | 'baseUrl', value: string) => {
    onPlatformConfigChange((current) => ({
      ...current,
      updatedAt: new Date().toISOString(),
      apisConfig: {
        ...current.apisConfig,
        alpacaPaper: {
          ...current.apisConfig.alpacaPaper,
          [field]: value,
        },
      },
    }));
  };

  const testCoinMarketProConnection = async () => {
    if (testingCoinMarketPro) return;
    setTestingCoinMarketPro(true);

    try {
      const apiKey = platformConfig.apisConfig.coinmarketpro.apiKey.trim();
      const baseUrl = platformConfig.apisConfig.coinmarketpro.baseUrl.trim();

      if (!apiKey || !baseUrl) {
        throw new Error('Completa API Key y Base URL para testear CoinMarketPro');
      }

      const endpoint = `/api/coinmarketpro/quotes?symbols=BTC,ETH&convert=USD&baseUrl=${encodeURIComponent(baseUrl)}&apiKey=${encodeURIComponent(apiKey)}`;
      const response = await fetch(endpoint, { method: 'GET', headers: { Accept: 'application/json' } });

      if (!response.ok) {
        throw new Error(`CoinMarketPro respondio con status ${response.status}`);
      }

      const payload = await response.json() as { data?: Record<string, unknown>; status?: { credit_count?: number } };
      if (!payload?.data || typeof payload.data !== 'object') {
        throw new Error('Respuesta invalida de CoinMarketPro');
      }

      const credits = payload.status?.credit_count;

      onPlatformConfigChange((current) => {
        const nextConfig: PlatformConfig = {
          ...current,
          updatedAt: new Date().toISOString(),
          apisConfig: {
            ...current.apisConfig,
            coinmarketpro: {
              ...current.apisConfig.coinmarketpro,
              status: 'connected',
              lastCheckedAt: new Date().toISOString(),
              lastError: undefined,
              creditsAvailable:
                typeof credits === 'number' && Number.isFinite(credits)
                  ? Math.max(0, Math.floor(credits))
                  : current.apisConfig.coinmarketpro.creditsAvailable,
            },
          },
        };
        return patchApisModuleHealth(nextConfig, visibleProviders);
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Fallo desconocido en CoinMarketPro';
      onPlatformConfigChange((current) => {
        const nextConfig: PlatformConfig = {
          ...current,
          updatedAt: new Date().toISOString(),
          apisConfig: {
            ...current.apisConfig,
            coinmarketpro: {
              ...current.apisConfig.coinmarketpro,
              status: 'error',
              lastCheckedAt: new Date().toISOString(),
              lastError: message,
            },
          },
        };
        return patchApisModuleHealth(nextConfig, visibleProviders);
      });
    } finally {
      setTestingCoinMarketPro(false);
    }
  };

  const testAlpacaConnection = async () => {
    if (testingAlpaca) return;
    setTestingAlpaca(true);

    try {
      const apiKey = platformConfig.apisConfig.alpacaPaper.apiKey.trim();
      const secretKey = platformConfig.apisConfig.alpacaPaper.secretKey.trim();
      const baseUrl = platformConfig.apisConfig.alpacaPaper.baseUrl.trim();

      if (!apiKey || !secretKey || !baseUrl) {
        throw new Error('Completa API Key, Secret Key y Base URL para testear Alpaca Paper');
      }

      const endpoint = buildAlpacaAccountEndpoint(baseUrl);
      const response = await fetch(endpoint, {
        method: 'GET',
        headers: {
          Accept: 'application/json',
          'APCA-API-KEY-ID': apiKey,
          'APCA-API-SECRET-KEY': secretKey,
        },
      });

      if (!response.ok) {
        throw new Error(`Alpaca respondio con status ${response.status}`);
      }

      const payload = await response.json() as { account_number?: string };
      if (!payload || typeof payload !== 'object') {
        throw new Error('Respuesta invalida al consultar cuenta Alpaca');
      }

      onPlatformConfigChange((current) => {
        const nextConfig: PlatformConfig = {
          ...current,
          updatedAt: new Date().toISOString(),
          apisConfig: {
            ...current.apisConfig,
            alpacaPaper: {
              ...current.apisConfig.alpacaPaper,
              status: 'connected',
              lastCheckedAt: new Date().toISOString(),
              lastError: undefined,
            },
          },
        };
        return patchApisModuleHealth(nextConfig, visibleProviders);
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Fallo desconocido en Alpaca Paper';
      onPlatformConfigChange((current) => {
        const nextConfig: PlatformConfig = {
          ...current,
          updatedAt: new Date().toISOString(),
          apisConfig: {
            ...current.apisConfig,
            alpacaPaper: {
              ...current.apisConfig.alpacaPaper,
              status: 'error',
              lastCheckedAt: new Date().toISOString(),
              lastError: message,
            },
          },
        };
        return patchApisModuleHealth(nextConfig, visibleProviders);
      });
    } finally {
      setTestingAlpaca(false);
    }
  };

  useEffect(() => {
    const timer = setInterval(() => {
      if (
        visibleProviders.includes('coinmarketpro') &&
        platformConfig.apisConfig.coinmarketpro.apiKey.trim() &&
        platformConfig.apisConfig.coinmarketpro.baseUrl.trim()
      ) {
        void testCoinMarketProConnection();
      }

      const hasAlpacaCredentials =
        platformConfig.apisConfig.alpacaPaper.apiKey.trim() && platformConfig.apisConfig.alpacaPaper.secretKey.trim();
      if (visibleProviders.includes('alpacaPaper') && hasAlpacaCredentials) {
        void testAlpacaConnection();
      }
    }, AUTO_HEALTH_CHECK_INTERVAL_MS);

    return () => clearInterval(timer);
  }, [
    platformConfig.apisConfig.alpacaPaper.apiKey,
    platformConfig.apisConfig.alpacaPaper.baseUrl,
    platformConfig.apisConfig.alpacaPaper.secretKey,
    platformConfig.apisConfig.coinmarketpro.apiKey,
    platformConfig.apisConfig.coinmarketpro.baseUrl,
    visibleProviders,
  ]);

  const availableProviders = PROVIDER_OPTIONS.filter((option) => !visibleProviders.includes(option.id));

  const addProviderCard = () => {
    if (visibleProviders.includes(selectedProviderToAdd)) return;
    setVisibleProviders((prev) => [...prev, selectedProviderToAdd]);
  };

  const removeProviderCard = (provider: ApiProviderId) => {
    setVisibleProviders((prev) => prev.filter((item) => item !== provider));
  };

  return (
    <div className="space-y-6">
      <div className="pb-2">
        <h3 className="font-heading font-bold text-2xl sm:text-3xl mb-2 tracking-tight">APIs</h3>
        <p className="text-sm text-muted-foreground/80">
          Configuracion de proveedores de datos y ejecucion virtual para Sandbox, Demo y Paper Live.
        </p>
      </div>

      <Card className="p-5 bg-card/50 backdrop-blur-sm border-border/50">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h4 className="font-heading font-semibold text-base">Estado Global APIs</h4>
            <p className="text-xs text-muted-foreground mt-1">Gestiona proveedores desde Agregar API y valida conexion real.</p>
          </div>
          <Badge variant="outline" className={statusClassName(resolveApisModuleStatus(platformConfig, visibleProviders))}>
            {statusLabel(resolveApisModuleStatus(platformConfig, visibleProviders))}
          </Badge>
        </div>

        <Separator className="my-4" />

        <div className="flex flex-col sm:flex-row gap-3">
          <div className="flex-1">
            <Select value={selectedProviderToAdd} onValueChange={(value) => setSelectedProviderToAdd(value as ApiProviderId)}>
              <SelectTrigger>
                <SelectValue placeholder="Selecciona proveedor API" />
              </SelectTrigger>
              <SelectContent>
                {availableProviders.length === 0 ? (
                  <SelectItem value="none" disabled>Todos los proveedores disponibles ya fueron agregados</SelectItem>
                ) : (
                  availableProviders.map((provider) => (
                    <SelectItem key={provider.id} value={provider.id}>{provider.label}</SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
          </div>
          <Button onClick={addProviderCard} disabled={availableProviders.length === 0}>
            Agregar API
          </Button>
        </div>
      </Card>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 sm:gap-6">
        {visibleProviders.includes('coinmarketpro') && (
        <Card className="p-4 sm:p-6 bg-card/50 backdrop-blur-sm border-border/50">
          <div className="flex items-start justify-between gap-3 mb-5">
            <div>
              <h4 className="font-heading font-semibold text-sm sm:text-base tracking-wide text-foreground/90">COINMARKETPRO</h4>
              <p className="text-xs text-muted-foreground mt-1">Fuente de market cap, dominancia y cotizaciones agregadas.</p>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className={statusClassName(platformConfig.apisConfig.coinmarketpro.status)}>
                {statusLabel(platformConfig.apisConfig.coinmarketpro.status)}
              </Badge>
              <Button variant="outline" size="sm" onClick={() => removeProviderCard('coinmarketpro')}>
                Quitar
              </Button>
            </div>
          </div>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="cmp-key">API Key</Label>
              <Input
                id="cmp-key"
                type="password"
                value={platformConfig.apisConfig.coinmarketpro.apiKey}
                onChange={(event) => updateCoinMarketProField('apiKey', event.target.value)}
                placeholder="X-CMC_PRO_API_KEY"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="cmp-url">Base URL</Label>
              <Input
                id="cmp-url"
                value={platformConfig.apisConfig.coinmarketpro.baseUrl}
                onChange={(event) => updateCoinMarketProField('baseUrl', event.target.value)}
                placeholder="https://pro-api.coinmarketcap.com"
              />
            </div>

            <Button className="w-full" onClick={() => void testCoinMarketProConnection()} disabled={testingCoinMarketPro}>
              {testingCoinMarketPro ? 'Testeando conexion...' : 'Test conexion CoinMarketPro'}
            </Button>

            <Separator />

            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 bg-background/50 rounded-lg">
                <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">Creditos ult. check</p>
                <p className="font-mono font-semibold">
                  {platformConfig.apisConfig.coinmarketpro.creditsAvailable ?? 'N/D'}
                </p>
              </div>
              <div className="p-3 bg-background/50 rounded-lg">
                <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">Ultimo check</p>
                <p className="text-xs">
                  {platformConfig.apisConfig.coinmarketpro.lastCheckedAt
                    ? new Date(platformConfig.apisConfig.coinmarketpro.lastCheckedAt).toLocaleString('es-ES')
                    : 'Sin checks'}
                </p>
              </div>
            </div>

            {platformConfig.apisConfig.coinmarketpro.lastError && (
              <p className="text-xs text-destructive">Error: {platformConfig.apisConfig.coinmarketpro.lastError}</p>
            )}
          </div>
        </Card>
        )}

        {visibleProviders.includes('alpacaPaper') && (
        <Card className="p-4 sm:p-6 bg-card/50 backdrop-blur-sm border-border/50">
          <div className="flex items-start justify-between gap-3 mb-5">
            <div>
              <h4 className="font-heading font-semibold text-sm sm:text-base tracking-wide text-foreground/90">ALPACA PAPER</h4>
              <p className="text-xs text-muted-foreground mt-1">Ejecucion virtual para Paper Live sin dinero real.</p>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className={statusClassName(platformConfig.apisConfig.alpacaPaper.status)}>
                {statusLabel(platformConfig.apisConfig.alpacaPaper.status)}
              </Badge>
              <Button variant="outline" size="sm" onClick={() => removeProviderCard('alpacaPaper')}>
                Quitar
              </Button>
            </div>
          </div>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="alpaca-key">API Key</Label>
              <Input
                id="alpaca-key"
                type="password"
                value={platformConfig.apisConfig.alpacaPaper.apiKey}
                onChange={(event) => updateAlpacaField('apiKey', event.target.value)}
                placeholder="APCA-API-KEY-ID"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="alpaca-secret">Secret Key</Label>
              <Input
                id="alpaca-secret"
                type="password"
                value={platformConfig.apisConfig.alpacaPaper.secretKey}
                onChange={(event) => updateAlpacaField('secretKey', event.target.value)}
                placeholder="APCA-API-SECRET-KEY"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="alpaca-url">Base URL</Label>
              <Input
                id="alpaca-url"
                value={platformConfig.apisConfig.alpacaPaper.baseUrl}
                onChange={(event) => updateAlpacaField('baseUrl', event.target.value)}
                placeholder="https://paper-api.alpaca.markets"
              />
            </div>

            <Button className="w-full" onClick={() => void testAlpacaConnection()} disabled={testingAlpaca}>
              {testingAlpaca ? 'Testeando conexion...' : 'Test conexion Alpaca Paper'}
            </Button>

            <div className="p-3 bg-background/50 rounded-lg">
              <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">Ultimo check</p>
              <p className="text-xs">
                {platformConfig.apisConfig.alpacaPaper.lastCheckedAt
                  ? new Date(platformConfig.apisConfig.alpacaPaper.lastCheckedAt).toLocaleString('es-ES')
                  : 'Sin checks'}
              </p>
            </div>

            {platformConfig.apisConfig.alpacaPaper.lastError && (
              <p className="text-xs text-destructive">Error: {platformConfig.apisConfig.alpacaPaper.lastError}</p>
            )}
          </div>
        </Card>
        )}

        {visibleProviders.length === 0 && (
          <Card className="p-6 bg-card/50 backdrop-blur-sm border-border/50">
            <p className="text-sm text-muted-foreground">
              No hay proveedores agregados. Usa el boton Agregar API para crear una tarjeta de configuracion.
            </p>
          </Card>
        )}
      </div>
    </div>
  );
}
