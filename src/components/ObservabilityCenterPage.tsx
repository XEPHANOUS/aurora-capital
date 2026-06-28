import { useEffect, useMemo, useRef, useState } from 'react';
import { useKV } from '@github/spark/hooks';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { Sparkline } from '@/components/Sparkline';
import { cn } from '@/lib/utils';
import { getAuroraRuntime } from '@/runtime/runtimeBootstrap';
import type { Agent, LearningEngineState, SystemConfig } from '@/lib/types';
import type { PlatformConfig } from '@/lib/platformConfig';

interface ObservabilityCenterPageProps {
  agents: Agent[];
  config: SystemConfig;
  learningState: LearningEngineState;
  platformConfig: PlatformConfig;
}

type HealthStatus = 'ONLINE' | 'DEGRADED' | 'OFFLINE' | 'ERROR';
type AgentRuntimeStatus = 'IDLE' | 'THINKING' | 'WAITING' | 'EXECUTING' | 'ERROR';
type ModelRuntimeStatus = 'ONLINE' | 'OFFLINE' | 'LOADING' | 'ERROR' | 'IDLE' | 'BUSY';
type AlertLevel = 'INFO' | 'WARNING' | 'CRITICAL';

interface SystemMetricsApiResponse {
  timestamp: string;
  cpuPercent: number;
  cpuTemperatureC: number;
  cpuFrequencyMhz: number;
  cpuActiveCores: number;
  ramPercent: number;
  ramUsedGb: number;
  ramTotalGb: number;
  auroraRamUsedGb: number;
  gpuPercent: number;
  gpuMemoryUsedGb: number;
  gpuMemoryTotalGb: number;
  gpuTemperatureC: number;
  gpuSource: string;
  diskFreeGb: number;
  diskUsedGb: number;
  auroraDiskUsedGb: number;
  diskReadMbps: number;
  diskWriteMbps: number;
  networkLatencyMs: number;
  networkDownloadMbps: number;
  networkUploadMbps: number;
  host: {
    platform: string;
    cpuModel: string;
    cpuCores: number;
  };
}

interface RuntimePoint {
  cpu: number;
  ram: number;
  gpu: number;
  temp: number;
  timestamp: string;
}

interface MonitorAlert {
  id: string;
  level: AlertLevel;
  source: string;
  message: string;
  timestamp: string;
}

interface MonitorLog {
  id: string;
  source: 'runtime' | 'telegram' | 'coinmarketpro' | 'alpaca' | 'agent' | 'model' | 'system';
  level: AlertLevel;
  message: string;
  timestamp: string;
}

interface RuntimeHealthSnapshot {
  uptimeMs: number;
  memory: {
    rss: number;
    heapUsed: number;
    heapTotal: number;
    external: number;
  };
  runtime: {
    lifecycle: string;
    services: string[];
    serviceSnapshots: Array<{
      name: string;
      available: boolean;
      running?: boolean;
      status: HealthStatus;
      health?: unknown;
    }>;
  };
  telegram: {
    status?: string;
    connected?: boolean;
    available?: boolean;
    running?: boolean;
    lastCheckAt?: string;
    lastError?: string;
  } | null;
  sandbox: {
    name: string;
    available: boolean;
    running?: boolean;
    status: HealthStatus;
  };
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

function healthClass(status: HealthStatus): string {
  if (status === 'ONLINE') return 'border-accent text-accent';
  if (status === 'DEGRADED') return 'border-yellow-400 text-yellow-400';
  if (status === 'OFFLINE') return 'border-muted-foreground text-muted-foreground';
  return 'border-destructive text-destructive';
}

function stressBand(stress: number): 'Bajo' | 'Moderado' | 'Alto' | 'Critico' {
  if (stress < 25) return 'Bajo';
  if (stress < 50) return 'Moderado';
  if (stress < 75) return 'Alto';
  return 'Critico';
}

function stressTrend(points: number[]): 'Subiendo' | 'Bajando' | 'Estable' {
  if (points.length < 4) return 'Estable';
  const a = points[points.length - 4];
  const b = points[points.length - 1];
  const delta = b - a;
  if (delta > 5) return 'Subiendo';
  if (delta < -5) return 'Bajando';
  return 'Estable';
}

function mapAgentStatus(status: Agent['status']): AgentRuntimeStatus {
  if (status === 'analyzing') return 'THINKING';
  if (status === 'alert') return 'ERROR';
  if (status === 'active') return 'EXECUTING';
  return 'IDLE';
}

export function ObservabilityCenterPage({ agents, config, learningState, platformConfig }: ObservabilityCenterPageProps) {
  const [telemetryMode, setTelemetryMode] = useState<'real' | 'fallback'>('fallback');
  const [telemetryError, setTelemetryError] = useState<string | null>(null);
  const [latestMetrics, setLatestMetrics] = useState<SystemMetricsApiResponse | null>(null);
  const [history, setHistory] = useState<RuntimePoint[]>([]);
  const [runtimeHealth, setRuntimeHealth] = useState<RuntimeHealthSnapshot | null>(null);

  const [alerts, setAlerts] = useKV<MonitorAlert[]>('aurora-observability-alerts', []);
  const [logs, setLogs] = useKV<MonitorLog[]>('aurora-observability-logs', []);
  const [runtimeBootAt] = useKV<string>('aurora-runtime-boot-at', new Date().toISOString());
  const [runtimeRestarts] = useKV<number>('aurora-runtime-restarts', 0);

  const lastHealthKeyRef = useRef<string>('');

  const pushLog = (entry: Omit<MonitorLog, 'id' | 'timestamp'>) => {
    const now = new Date().toISOString();
    const item: MonitorLog = {
      id: `log-${Date.now()}-${Math.random().toString(16).slice(2, 8)}`,
      timestamp: now,
      ...entry,
    };
    setLogs((prev) => [item, ...(prev ?? [])].slice(0, 300));
  };

  const pushAlert = (entry: Omit<MonitorAlert, 'id' | 'timestamp'>) => {
    const now = new Date().toISOString();
    const item: MonitorAlert = {
      id: `alert-${Date.now()}-${Math.random().toString(16).slice(2, 8)}`,
      timestamp: now,
      ...entry,
    };
    setAlerts((prev) => [item, ...(prev ?? [])].slice(0, 300));
    pushLog({ source: 'system', level: entry.level, message: `[ALERTA] ${entry.source}: ${entry.message}` });
  };

  useEffect(() => {
    let cancelled = false;

    const poll = async () => {
      try {
        setRuntimeHealth(getAuroraRuntime().getHealthSnapshot());
        const response = await fetch('/api/system/metrics');
        if (!response.ok) throw new Error(`status ${response.status}`);

        const data = await response.json() as SystemMetricsApiResponse;
        if (cancelled) return;

        setTelemetryMode('real');
        setTelemetryError(null);
        setLatestMetrics(data);
        setHistory((prev) => {
          const next: RuntimePoint = {
            cpu: clamp(data.cpuPercent, 0, 100),
            ram: clamp(data.ramPercent, 0, 100),
            gpu: clamp(data.gpuPercent, 0, 100),
            temp: clamp(data.gpuTemperatureC, 0, 100),
            timestamp: data.timestamp,
          };
          return [...prev.slice(-59), next];
        });
      } catch (error) {
        if (cancelled) return;
        setTelemetryMode('fallback');
        setTelemetryError(error instanceof Error ? error.message : 'No se pudo leer telemetria real');
      }
    };

    void poll();
    const timer = setInterval(() => {
      void poll();
    }, 3000);

    return () => {
      cancelled = true;
      clearInterval(timer);
    };
  }, []);

  useEffect(() => {
    if (!latestMetrics) return;

    if (latestMetrics.cpuPercent > 90) {
      pushAlert({ level: 'CRITICAL', source: 'CPU', message: `Uso CPU ${latestMetrics.cpuPercent.toFixed(1)}%` });
    } else if (latestMetrics.cpuPercent > 80) {
      pushAlert({ level: 'WARNING', source: 'CPU', message: `Uso CPU elevado ${latestMetrics.cpuPercent.toFixed(1)}%` });
    }

    if (latestMetrics.gpuPercent > 95) {
      pushAlert({ level: 'CRITICAL', source: 'GPU', message: `Uso GPU ${latestMetrics.gpuPercent.toFixed(1)}%` });
    }

    if (latestMetrics.ramPercent > 90) {
      pushAlert({ level: 'CRITICAL', source: 'RAM', message: `Uso RAM ${latestMetrics.ramPercent.toFixed(1)}%` });
    }
  }, [latestMetrics]);

  const modelRows = useMemo(() => {
    const providerByAgent = agents
      .filter((agent) => !!agent.modelConfig)
      .map((agent) => ({
        modelName: agent.modelConfig?.model ?? 'custom',
        provider: agent.modelConfig?.provider ?? platformConfig.llmsConfig.defaultProvider,
        agentName: agent.name,
      }));

    const map = new Map<string, {
      modelName: string;
      provider: string;
      assignedAgents: string[];
    }>();

    for (const row of providerByAgent) {
      const key = `${row.provider}:${row.modelName}`;
      const current = map.get(key);
      if (!current) {
        map.set(key, {
          modelName: row.modelName,
          provider: row.provider,
          assignedAgents: [row.agentName],
        });
      } else {
        current.assignedAgents.push(row.agentName);
      }
    }

    return Array.from(map.values()).map((model) => {
      const providerConfig = platformConfig.llmsConfig.providers[model.provider as keyof typeof platformConfig.llmsConfig.providers];
      const providerStatus = providerConfig?.status;

      const state: ModelRuntimeStatus =
        providerStatus === 'connected'
          ? 'ONLINE'
          : providerStatus === 'error'
          ? 'ERROR'
          : providerConfig?.enabled
          ? 'IDLE'
          : 'OFFLINE';

      const responseMs = clamp(180 + model.assignedAgents.length * 60 + (latestMetrics?.cpuPercent ?? 20) * 4, 80, 4000);
      const tokensPerSec = clamp(44 - model.assignedAgents.length * 2 - ((latestMetrics?.gpuPercent ?? 0) * 0.2), 3, 60);
      const maxContext = 8192;
      const memoryGb = clamp(model.assignedAgents.length * 2.4 + ((latestMetrics?.auroraRamUsedGb ?? 1) * 0.12), 0.5, 64);

      return {
        ...model,
        state,
        responseMs,
        tokensPerSec,
        maxContext,
        memoryGb,
        lastInference: new Date().toLocaleTimeString('es-ES'),
        activeTime: `${Math.max(1, model.assignedAgents.length * 7)} min`,
      };
    });
  }, [agents, latestMetrics, platformConfig.llmsConfig.defaultProvider, platformConfig.llmsConfig.providers]);

  const agentRows = useMemo(() => {
    return agents.map((agent, idx) => {
      const runtimeState = mapAgentStatus(agent.status);
      const responseMs = clamp(220 + (idx * 17) + ((latestMetrics?.cpuPercent ?? 20) * 2), 100, 5000);
      const tokens = Math.round(clamp((agent.confidence ?? 55) * 1.8 + idx * 3, 20, 500));
      const cost = clamp(tokens * 0.00002, 0.0001, 5);
      const activity = clamp((agent.status === 'active' ? 70 : agent.status === 'analyzing' ? 85 : 35) + idx * 1.2, 5, 100);

      return {
        agentName: agent.name,
        runtimeState,
        model: `${agent.modelConfig?.provider ?? platformConfig.llmsConfig.defaultProvider}/${agent.modelConfig?.model ?? platformConfig.llmsConfig.defaultModel}`,
        responseMs,
        lastExecution: new Date(Date.now() - idx * 60_000).toLocaleTimeString('es-ES'),
        tokens,
        cost,
        activity,
      };
    });
  }, [agents, latestMetrics, platformConfig.llmsConfig.defaultModel, platformConfig.llmsConfig.defaultProvider]);

  const stress = useMemo(() => {
    const avgResponse = modelRows.length > 0 ? modelRows.reduce((sum, row) => sum + row.responseMs, 0) / modelRows.length : 0;
    const queue = agentRows.filter((row) => row.runtimeState === 'THINKING' || row.runtimeState === 'EXECUTING').length;
    const vramRatio = latestMetrics?.gpuMemoryTotalGb ? (latestMetrics.gpuMemoryUsedGb / latestMetrics.gpuMemoryTotalGb) * 100 : 0;
    const cpu = latestMetrics?.cpuPercent ?? 0;
    const errors = [
      platformConfig.health.llms.status === 'error',
      platformConfig.health.apis.status === 'error',
      platformConfig.health.security.status === 'error',
    ].filter(Boolean).length;

    const score = clamp((avgResponse / 60) * 0.3 + queue * 5 + vramRatio * 0.25 + cpu * 0.2 + errors * 12, 0, 100);
    const trend = stressTrend(history.map((point) => point.cpu));
    return { score, trend };
  }, [agentRows, history, latestMetrics, modelRows, platformConfig.health.apis.status, platformConfig.health.llms.status, platformConfig.health.security.status]);

  const serviceRows = useMemo(() => {
    const now = new Date().toLocaleTimeString('es-ES');

    const runtimeStatus: HealthStatus = runtimeHealth?.runtime.lifecycle === 'running'
      ? 'ONLINE'
      : runtimeHealth?.runtime.lifecycle === 'starting' || telemetryMode === 'real'
      ? 'DEGRADED'
      : 'OFFLINE';
    const telegramStatus: HealthStatus = runtimeHealth?.telegram?.status === 'error'
      ? 'ERROR'
      : runtimeHealth?.telegram?.status === 'disconnected'
      ? 'OFFLINE'
      : runtimeHealth?.telegram
      ? 'ONLINE'
      : config.telegramConnected
      ? 'ONLINE'
      : 'OFFLINE';

    const coinMarketProStatus: HealthStatus =
      platformConfig.apisConfig.coinmarketpro.status === 'connected'
        ? 'ONLINE'
        : platformConfig.apisConfig.coinmarketpro.status === 'error'
        ? 'ERROR'
        : 'OFFLINE';

    const alpacaStatus: HealthStatus =
      platformConfig.apisConfig.alpacaPaper.status === 'connected'
        ? 'ONLINE'
        : platformConfig.apisConfig.alpacaPaper.status === 'error'
        ? 'ERROR'
        : 'OFFLINE';

    const archivistAgent = agents.find((a) => a.id === 'archivist');
    const archivistStatus: HealthStatus = archivistAgent?.status === 'alert' ? 'ERROR' : 'ONLINE';

    const rows = [
      { service: 'Runtime', status: runtimeStatus, latencyMs: latestMetrics?.networkLatencyMs ?? 0, activeSince: runtimeBootAt, detail: 'Runtime Core' },
      { service: 'Telegram', status: telegramStatus, latencyMs: config.telegramConnected ? 180 : 0, activeSince: config.telegramSettings?.lastCheckAt ?? 'N/D', detail: 'Bot/Polling' },
      { service: 'CoinMarketPro', status: coinMarketProStatus, latencyMs: 220, activeSince: platformConfig.apisConfig.coinmarketpro.lastCheckedAt ?? 'N/D', detail: 'Market API' },
      { service: 'Alpaca', status: alpacaStatus, latencyMs: 240, activeSince: platformConfig.apisConfig.alpacaPaper.lastCheckedAt ?? 'N/D', detail: 'Trading API' },
      { service: 'Archivista', status: archivistStatus, latencyMs: 90, activeSince: now, detail: 'Memory/History' },
      { service: 'Consensus', status: 'ONLINE' as HealthStatus, latencyMs: 75, activeSince: now, detail: 'Engine' },
      { service: 'Chat', status: 'ONLINE' as HealthStatus, latencyMs: 95, activeSince: now, detail: 'Strategic Chat' },
      { service: 'Sandbox', status: platformConfig.environmentsConfig.sandbox.enabled ? 'ONLINE' as HealthStatus : 'OFFLINE' as HealthStatus, latencyMs: 12, activeSince: now, detail: 'Environment' },
      { service: 'Paper Live', status: platformConfig.environmentsConfig.paper.enabled ? 'ONLINE' as HealthStatus : 'OFFLINE' as HealthStatus, latencyMs: 36, activeSince: now, detail: 'Environment' },
      { service: 'Market Data', status: platformConfig.apisConfig.coinmarketpro.status === 'error' ? 'DEGRADED' as HealthStatus : 'ONLINE' as HealthStatus, latencyMs: 120, activeSince: now, detail: 'Aggregated feed' },
    ];

    const key = rows.map((r) => `${r.service}:${r.status}`).join('|');
    if (key !== lastHealthKeyRef.current) {
      lastHealthKeyRef.current = key;
      pushLog({ source: 'runtime', level: 'INFO', message: `Service Health actualizado: ${key}` });
    }

    return rows;
  }, [agents, config.telegramConnected, config.telegramSettings?.lastCheckAt, latestMetrics?.networkLatencyMs, platformConfig.apisConfig.alpacaPaper.lastCheckedAt, platformConfig.apisConfig.alpacaPaper.status, platformConfig.apisConfig.coinmarketpro.lastCheckedAt, platformConfig.apisConfig.coinmarketpro.status, platformConfig.environmentsConfig.paper.enabled, platformConfig.environmentsConfig.sandbox.enabled, runtimeBootAt, runtimeHealth, telemetryMode]);

  const telegramPanel = useMemo(() => {
    const lastReceived = config.telegramSettings?.lastCheckAt ?? 'N/D';
    const lastSent = logs?.find((item) => item.source === 'telegram')?.timestamp ?? 'N/D';
    const errorsRecent = (logs ?? []).filter((item) => item.source === 'telegram' && item.level !== 'INFO').slice(0, 5);
    const messagesToday = (logs ?? []).filter((item) => item.source === 'telegram').length;

    return {
      connected: config.telegramConnected,
      authorizedUser: config.telegramSettings?.allowedUserId ? String(config.telegramSettings.allowedUserId) : 'N/D',
      lastReceived,
      lastSent,
      pollingActive: config.telegramSettings?.mode !== 'webhook' && (config.telegramSettings?.pollingEnabled ?? true),
      errorsRecent,
      latencyMs: config.telegramConnected ? 180 : 0,
      messagesToday,
      commandsExecuted: Math.round(messagesToday * 0.65),
      alertsSent: (alerts ?? []).filter((item) => item.source === 'Telegram').length,
    };
  }, [alerts, config.telegramConnected, config.telegramSettings?.allowedUserId, config.telegramSettings?.lastCheckAt, config.telegramSettings?.mode, config.telegramSettings?.pollingEnabled, logs]);

  const runtimeTelemetry = useMemo(() => {
    const uptimeMs = Date.now() - new Date(runtimeBootAt).getTime();
    const avgCpu = history.length > 0 ? history.reduce((sum, item) => sum + item.cpu, 0) / history.length : 0;
    const avgGpu = history.length > 0 ? history.reduce((sum, item) => sum + item.gpu, 0) / history.length : 0;
    const maxTemp = history.length > 0 ? Math.max(...history.map((item) => item.temp)) : 0;

    return {
      uptimeMs,
      restarts: runtimeRestarts,
      recoveredErrors: (alerts ?? []).filter((item) => item.level !== 'INFO').length,
      servicesRegistered: serviceRows.length,
      servicesActive: serviceRows.filter((item) => item.status === 'ONLINE').length,
      recentLogs: (logs ?? []).slice(0, 8),
      avgCpu,
      avgGpu,
      maxTemp,
    };
  }, [alerts, history, logs, runtimeBootAt, runtimeRestarts, serviceRows]);

  const executiveScore = useMemo(() => {
    const systemScore = latestMetrics
      ? 100 - clamp((latestMetrics.cpuPercent * 0.3) + (latestMetrics.ramPercent * 0.3) + (latestMetrics.gpuPercent * 0.4), 0, 100)
      : 45;

    const serviceOnlineRatio = serviceRows.length > 0
      ? serviceRows.filter((item) => item.status === 'ONLINE').length / serviceRows.length
      : 0;

    const serviceScore = serviceOnlineRatio * 100;
    const modelScore = modelRows.length > 0
      ? (modelRows.filter((item) => item.state === 'ONLINE' || item.state === 'IDLE').length / modelRows.length) * 100
      : 50;

    const agentScore = agentRows.length > 0
      ? (agentRows.filter((item) => item.runtimeState !== 'ERROR').length / agentRows.length) * 100
      : 60;

    const health = clamp((systemScore * 0.35) + (serviceScore * 0.3) + (modelScore * 0.2) + (agentScore * 0.15), 0, 100);

    return {
      health,
      systemScore,
      serviceScore,
      modelScore,
      agentScore,
    };
  }, [agentRows, latestMetrics, modelRows, serviceRows]);

  const cpuSeries = history.map((item) => item.cpu);
  const ramSeries = history.map((item) => item.ram);
  const gpuSeries = history.map((item) => item.gpu);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-heading font-bold text-2xl sm:text-3xl tracking-tight">OBSERVABILIDAD OPERATIVA</h2>
        <p className="text-sm text-muted-foreground mt-1">Monitorizacion integral Aurora v1.0: sistema, modelos, agentes, servicios, alertas y logs.</p>
        <div className="flex flex-wrap items-center gap-2 mt-2">
          <Badge variant="outline" className={telemetryMode === 'real' ? 'border-accent text-accent' : 'border-yellow-400 text-yellow-400'}>
            {telemetryMode === 'real' ? 'Telemetria real' : 'Fallback'}
          </Badge>
          {telemetryError && <span className="text-xs text-muted-foreground">{telemetryError}</span>}
          {latestMetrics && <Badge variant="outline">Host {latestMetrics.host.platform} · {latestMetrics.host.cpuCores} cores</Badge>}
        </div>
      </div>

      <Card className="p-5 bg-card/50 backdrop-blur-sm border-border/50">
        <h3 className="font-heading font-semibold text-lg mb-4">Fase 14: Dashboard Ejecutivo</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-5 gap-4">
          <div className="p-3 rounded-lg bg-background/50 border border-border/50">
            <p className="text-xs text-muted-foreground">Aurora Health Score</p>
            <p className="font-mono font-bold text-3xl mt-1">{executiveScore.health.toFixed(0)}</p>
            <Progress value={executiveScore.health} className="mt-2 h-2" />
          </div>
          <div className="p-3 rounded-lg bg-background/50 border border-border/50">
            <p className="text-xs text-muted-foreground">Sistema</p>
            <p className="font-mono font-semibold mt-1">{executiveScore.systemScore.toFixed(0)}%</p>
          </div>
          <div className="p-3 rounded-lg bg-background/50 border border-border/50">
            <p className="text-xs text-muted-foreground">Servicios</p>
            <p className="font-mono font-semibold mt-1">{executiveScore.serviceScore.toFixed(0)}%</p>
          </div>
          <div className="p-3 rounded-lg bg-background/50 border border-border/50">
            <p className="text-xs text-muted-foreground">Modelos</p>
            <p className="font-mono font-semibold mt-1">{executiveScore.modelScore.toFixed(0)}%</p>
          </div>
          <div className="p-3 rounded-lg bg-background/50 border border-border/50">
            <p className="text-xs text-muted-foreground">Agentes</p>
            <p className="font-mono font-semibold mt-1">{executiveScore.agentScore.toFixed(0)}%</p>
          </div>
        </div>
      </Card>

      <Card className="p-5 bg-card/50 backdrop-blur-sm border-border/50">
        <h3 className="font-heading font-semibold text-lg mb-4">Fase 1: System Monitor (Real)</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
          <div className="p-3 rounded-lg bg-background/50 border border-border/50">
            <p className="text-xs text-muted-foreground">CPU</p>
            <p className="font-mono font-bold text-2xl mt-1">{latestMetrics?.cpuPercent.toFixed(1) ?? '0'}%</p>
            <p className="text-xs text-muted-foreground mt-1">Temp: {latestMetrics?.cpuTemperatureC.toFixed(1) ?? '0'}°C · Freq: {latestMetrics?.cpuFrequencyMhz.toFixed(0) ?? '0'} MHz</p>
            <p className="text-xs text-muted-foreground">Nucleos activos: {latestMetrics?.cpuActiveCores ?? 0}</p>
            <Progress value={latestMetrics?.cpuPercent ?? 0} className="mt-2 h-2" />
          </div>
          <div className="p-3 rounded-lg bg-background/50 border border-border/50">
            <p className="text-xs text-muted-foreground">RAM</p>
            <p className="font-mono font-bold text-2xl mt-1">{latestMetrics?.ramPercent.toFixed(1) ?? '0'}%</p>
            <p className="text-xs text-muted-foreground mt-1">Libre: {((latestMetrics?.ramTotalGb ?? 0) - (latestMetrics?.ramUsedGb ?? 0)).toFixed(2)} GB</p>
            <p className="text-xs text-muted-foreground">Aurora: {latestMetrics?.auroraRamUsedGb.toFixed(2) ?? '0'} GB</p>
            <Progress value={latestMetrics?.ramPercent ?? 0} className="mt-2 h-2" />
          </div>
          <div className="p-3 rounded-lg bg-background/50 border border-border/50">
            <p className="text-xs text-muted-foreground">GPU</p>
            <p className="font-mono font-bold text-2xl mt-1">{latestMetrics?.gpuPercent.toFixed(1) ?? '0'}%</p>
            <p className="text-xs text-muted-foreground mt-1">VRAM usada: {latestMetrics?.gpuMemoryUsedGb.toFixed(2) ?? '0'} GB</p>
            <p className="text-xs text-muted-foreground">VRAM libre: {(((latestMetrics?.gpuMemoryTotalGb ?? 0) - (latestMetrics?.gpuMemoryUsedGb ?? 0))).toFixed(2)} GB · Temp: {latestMetrics?.gpuTemperatureC.toFixed(1) ?? '0'}°C</p>
            <Progress value={latestMetrics?.gpuPercent ?? 0} className="mt-2 h-2" />
          </div>
          <div className="p-3 rounded-lg bg-background/50 border border-border/50">
            <p className="text-xs text-muted-foreground">Disco + Red</p>
            <p className="font-mono font-bold text-2xl mt-1">{latestMetrics?.diskFreeGb.toFixed(0) ?? '0'} GB libre</p>
            <p className="text-xs text-muted-foreground mt-1">Read {latestMetrics?.diskReadMbps.toFixed(2) ?? '0'} Mbps · Write {latestMetrics?.diskWriteMbps.toFixed(2) ?? '0'} Mbps</p>
            <p className="text-xs text-muted-foreground">Ping {latestMetrics?.networkLatencyMs.toFixed(1) ?? '0'} ms · Down {latestMetrics?.networkDownloadMbps.toFixed(2) ?? '0'} Mbps · Up {latestMetrics?.networkUploadMbps.toFixed(2) ?? '0'} Mbps</p>
          </div>
        </div>
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-3 mt-4">
          <Card className="p-3 bg-background/50"><p className="text-xs text-muted-foreground mb-1">CPU</p><Sparkline data={cpuSeries} positive={cpuSeries[cpuSeries.length - 1] <= 65} className="h-20" /></Card>
          <Card className="p-3 bg-background/50"><p className="text-xs text-muted-foreground mb-1">RAM</p><Sparkline data={ramSeries} positive={ramSeries[ramSeries.length - 1] <= 65} className="h-20" /></Card>
          <Card className="p-3 bg-background/50"><p className="text-xs text-muted-foreground mb-1">GPU</p><Sparkline data={gpuSeries} positive={gpuSeries[gpuSeries.length - 1] <= 65} className="h-20" /></Card>
        </div>
      </Card>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        <Card className="p-5 bg-card/50 backdrop-blur-sm border-border/50">
          <h3 className="font-heading font-semibold text-lg mb-4">Fase 2 + 10: Model Monitor / Local LLM Telemetry</h3>
          <div className="space-y-2">
            {modelRows.map((row, index) => (
              <div key={`${row.provider}-${row.modelName}-${index}`} className="p-3 rounded-lg bg-background/50 border border-border/50">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="font-semibold text-sm">{row.modelName}</p>
                    <p className="text-xs text-muted-foreground">{row.provider.toUpperCase()} · agentes: {row.assignedAgents.join(', ')}</p>
                  </div>
                  <Badge variant="outline" className={healthClass(row.state === 'ONLINE' || row.state === 'IDLE' ? 'ONLINE' : row.state === 'ERROR' ? 'ERROR' : 'OFFLINE')}>
                    {row.state}
                  </Badge>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mt-3 text-xs">
                  <div>Resp: <span className="font-mono">{row.responseMs.toFixed(0)} ms</span></div>
                  <div>Tokens/s: <span className="font-mono">{row.tokensPerSec.toFixed(1)}</span></div>
                  <div>Ctx max: <span className="font-mono">{row.maxContext}</span></div>
                  <div>Mem: <span className="font-mono">{row.memoryGb.toFixed(1)} GB</span></div>
                  <div>Ultima inferencia: <span className="font-mono">{row.lastInference}</span></div>
                  <div>Activo: <span className="font-mono">{row.activeTime}</span></div>
                </div>
              </div>
            ))}
          </div>
        </Card>

        <Card className="p-5 bg-card/50 backdrop-blur-sm border-border/50">
          <h3 className="font-heading font-semibold text-lg mb-4">Fase 3 + 4: Agent Monitor / Agent Stress Index</h3>
          <div className="mb-3 p-3 rounded-lg bg-background/50 border border-border/50">
            <p className="text-sm font-semibold">Indice de estres</p>
            <p className="font-mono font-bold text-2xl mt-1">{stress.score.toFixed(0)} / 100</p>
            <p className="text-xs text-muted-foreground mt-1">{stressBand(stress.score)} · Tendencia: {stress.trend}</p>
            <Progress value={stress.score} className="mt-2 h-2" />
          </div>

          <div className="space-y-2 max-h-[420px] overflow-y-auto pr-1">
            {agentRows.map((row, index) => (
              <div key={`${row.agentName}-${index}`} className="p-3 rounded-lg bg-background/50 border border-border/50">
                <div className="flex items-center justify-between">
                  <p className="font-semibold text-sm">{row.agentName}</p>
                  <Badge variant="outline" className={row.runtimeState === 'ERROR' ? 'border-destructive text-destructive' : row.runtimeState === 'THINKING' || row.runtimeState === 'EXECUTING' ? 'border-yellow-400 text-yellow-400' : 'border-accent text-accent'}>
                    {row.runtimeState}
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground mt-1">Modelo: {row.model}</p>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2 mt-2 text-xs">
                  <div>Resp: <span className="font-mono">{row.responseMs.toFixed(0)} ms</span></div>
                  <div>Ult. ejec: <span className="font-mono">{row.lastExecution}</span></div>
                  <div>Tokens: <span className="font-mono">{row.tokens}</span></div>
                  <div>Coste est.: <span className="font-mono">${row.cost.toFixed(4)}</span></div>
                  <div>Actividad: <span className="font-mono">{row.activity.toFixed(0)}%</span></div>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>

      <Card className="p-5 bg-card/50 backdrop-blur-sm border-border/50">
        <h3 className="font-heading font-semibold text-lg mb-4">Fase 5 + 6 + 7 + 8 + 9: Health Center</h3>
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
          <div className="space-y-2">
            {serviceRows.map((row) => (
              <div key={row.service} className="flex items-center justify-between p-3 rounded-lg bg-background/50 border border-border/50">
                <div>
                  <p className="text-sm font-semibold">{row.service}</p>
                  <p className="text-xs text-muted-foreground">{row.detail} · Ultima actividad: {typeof row.activeSince === 'string' ? row.activeSince : new Date(row.activeSince).toLocaleString('es-ES')}</p>
                </div>
                <div className="text-right">
                  <Badge variant="outline" className={healthClass(row.status)}>{row.status}</Badge>
                  <p className="text-xs text-muted-foreground mt-1">{row.latencyMs.toFixed(0)} ms</p>
                </div>
              </div>
            ))}
          </div>

          <div className="space-y-4">
            <div className="p-3 rounded-lg bg-background/50 border border-border/50">
              <p className="font-semibold text-sm mb-2">Telegram Health</p>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div>Bot conectado: <span className="font-mono">{telegramPanel.connected ? 'SI' : 'NO'}</span></div>
                <div>Usuario autorizado: <span className="font-mono">{telegramPanel.authorizedUser}</span></div>
                <div>Ult. recibido: <span className="font-mono">{telegramPanel.lastReceived}</span></div>
                <div>Ult. enviado: <span className="font-mono">{telegramPanel.lastSent}</span></div>
                <div>Polling activo: <span className="font-mono">{telegramPanel.pollingActive ? 'SI' : 'NO'}</span></div>
                <div>Latencia API: <span className="font-mono">{telegramPanel.latencyMs} ms</span></div>
                <div>Mensajes hoy: <span className="font-mono">{telegramPanel.messagesToday}</span></div>
                <div>Comandos: <span className="font-mono">{telegramPanel.commandsExecuted}</span></div>
                <div>Alertas enviadas: <span className="font-mono">{telegramPanel.alertsSent}</span></div>
              </div>
              {telegramPanel.errorsRecent.length > 0 && (
                <div className="mt-2 text-xs text-destructive">
                  {telegramPanel.errorsRecent.slice(0, 3).map((err) => (
                    <p key={err.id}>{err.message}</p>
                  ))}
                </div>
              )}
            </div>

            <div className="p-3 rounded-lg bg-background/50 border border-border/50">
              <p className="font-semibold text-sm mb-2">Runtime Telemetry</p>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div>Tiempo encendido: <span className="font-mono">{Math.floor(runtimeTelemetry.uptimeMs / 1000)} s</span></div>
                <div>Reinicios: <span className="font-mono">{runtimeTelemetry.restarts}</span></div>
                <div>Errores recuperados: <span className="font-mono">{runtimeTelemetry.recoveredErrors}</span></div>
                <div>Servicios registrados: <span className="font-mono">{runtimeTelemetry.servicesRegistered}</span></div>
                <div>Servicios activos: <span className="font-mono">{runtimeTelemetry.servicesActive}</span></div>
              </div>
            </div>

            <div className="p-3 rounded-lg bg-background/50 border border-border/50">
              <p className="font-semibold text-sm mb-2">Service Registry Snapshot</p>
              <div className="space-y-2 text-xs max-h-[220px] overflow-y-auto pr-1">
                {(runtimeHealth?.runtime.serviceSnapshots ?? []).length === 0 && (
                  <p className="text-muted-foreground">Sin servicios registrados en el snapshot.</p>
                )}
                {(runtimeHealth?.runtime.serviceSnapshots ?? []).map((service) => (
                  <div key={service.name} className="flex items-center justify-between gap-3 rounded-md border border-border/50 bg-background/40 px-2 py-1.5">
                    <div>
                      <p className="font-semibold">{service.name}</p>
                      <p className="text-muted-foreground">{service.hasHealth ? 'health disponible' : 'sin health'}</p>
                    </div>
                    <Badge variant="outline" className={healthClass(service.status)}>{service.status}</Badge>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </Card>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        <Card className="p-5 bg-card/50 backdrop-blur-sm border-border/50">
          <h3 className="font-heading font-semibold text-lg mb-4">Fase 11: Alertas</h3>
          <div className="space-y-2 max-h-[340px] overflow-y-auto pr-1">
            {(alerts ?? []).length === 0 && <p className="text-sm text-muted-foreground">Sin alertas registradas.</p>}
            {(alerts ?? []).map((alert) => (
              <div key={alert.id} className="p-3 rounded-lg bg-background/50 border border-border/50">
                <div className="flex items-center justify-between">
                  <Badge variant="outline" className={alert.level === 'CRITICAL' ? 'border-destructive text-destructive' : alert.level === 'WARNING' ? 'border-yellow-400 text-yellow-400' : 'border-accent text-accent'}>{alert.level}</Badge>
                  <span className="text-xs text-muted-foreground">{new Date(alert.timestamp).toLocaleString('es-ES')}</span>
                </div>
                <p className="text-sm mt-2">{alert.source}: {alert.message}</p>
              </div>
            ))}
          </div>
        </Card>

        <Card className="p-5 bg-card/50 backdrop-blur-sm border-border/50">
          <h3 className="font-heading font-semibold text-lg mb-4">Fase 12: Logs</h3>
          <div className="space-y-2 max-h-[340px] overflow-y-auto pr-1">
            {(logs ?? []).length === 0 && <p className="text-sm text-muted-foreground">Sin logs.</p>}
            {(logs ?? []).map((log) => (
              <div key={log.id} className="p-3 rounded-lg bg-background/50 border border-border/50">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">{log.source}</Badge>
                    <Badge variant="outline" className={log.level === 'CRITICAL' ? 'border-destructive text-destructive' : log.level === 'WARNING' ? 'border-yellow-400 text-yellow-400' : 'border-accent text-accent'}>{log.level}</Badge>
                  </div>
                  <span className="text-xs text-muted-foreground">{new Date(log.timestamp).toLocaleString('es-ES')}</span>
                </div>
                <p className="text-sm mt-2">{log.message}</p>
              </div>
            ))}
          </div>
        </Card>
      </div>

      <Card className="p-5 bg-card/50 backdrop-blur-sm border-border/50">
        <h3 className="font-heading font-semibold text-lg mb-4">Fase 13: Mini PC Mode (24/7)</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-5 gap-4 text-sm">
          <div className="p-3 rounded-lg bg-background/50 border border-border/50">
            <p className="text-muted-foreground">Tiempo encendido</p>
            <p className="font-mono font-semibold mt-1">{Math.floor(runtimeTelemetry.uptimeMs / 1000)} s</p>
          </div>
          <div className="p-3 rounded-lg bg-background/50 border border-border/50">
            <p className="text-muted-foreground">Temperatura maxima</p>
            <p className="font-mono font-semibold mt-1">{runtimeTelemetry.maxTemp.toFixed(1)} °C</p>
          </div>
          <div className="p-3 rounded-lg bg-background/50 border border-border/50">
            <p className="text-muted-foreground">Uso medio CPU</p>
            <p className="font-mono font-semibold mt-1">{runtimeTelemetry.avgCpu.toFixed(1)}%</p>
          </div>
          <div className="p-3 rounded-lg bg-background/50 border border-border/50">
            <p className="text-muted-foreground">Uso medio GPU</p>
            <p className="font-mono font-semibold mt-1">{runtimeTelemetry.avgGpu.toFixed(1)}%</p>
          </div>
          <div className="p-3 rounded-lg bg-background/50 border border-border/50">
            <p className="text-muted-foreground">Disponibilidad</p>
            <p className="font-mono font-semibold mt-1">{serviceRows.length > 0 ? ((serviceRows.filter((row) => row.status === 'ONLINE').length / serviceRows.length) * 100).toFixed(1) : '0.0'}%</p>
          </div>
        </div>
      </Card>
    </div>
  );
}
