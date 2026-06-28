import { useEffect, useMemo, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Sparkline } from '@/components/Sparkline';
import { Cpu, HardDrive, GraphicsCard, Gauge } from '@phosphor-icons/react';
import { cn } from '@/lib/utils';
import type { Agent } from '@/lib/types';
import type { PlatformConfig } from '@/lib/platformConfig';

interface SystemMonitorPageProps {
  agents: Agent[];
  platformConfig: PlatformConfig;
}

interface RuntimeSnapshot {
  cpu: number;
  ram: number;
  gpu: number;
  temperature: number;
}

interface SystemMetricsApiResponse {
  timestamp: string;
  cpuPercent: number;
  ramPercent: number;
  ramUsedGb: number;
  ramTotalGb: number;
  gpuPercent: number;
  gpuMemoryUsedGb: number;
  gpuMemoryTotalGb: number;
  gpuTemperatureC: number;
  gpuSource: string;
  host: {
    platform: string;
    cpuModel: string;
    cpuCores: number;
  };
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

function toneByLoad(load: number): 'ok' | 'warn' | 'critical' {
  if (load >= 85) return 'critical';
  if (load >= 65) return 'warn';
  return 'ok';
}

export function SystemMonitorPage({ agents, platformConfig }: SystemMonitorPageProps) {
  const localProvider = platformConfig.llmsConfig.providers.local;
  const [telemetryMode, setTelemetryMode] = useState<'real' | 'fallback'>('fallback');
  const [telemetryError, setTelemetryError] = useState<string | null>(null);
  const [hostInfo, setHostInfo] = useState<SystemMetricsApiResponse['host'] | null>(null);
  const [gpuInfo, setGpuInfo] = useState<Pick<SystemMetricsApiResponse, 'gpuMemoryUsedGb' | 'gpuMemoryTotalGb' | 'gpuSource'>>({
    gpuMemoryUsedGb: 0,
    gpuMemoryTotalGb: 0,
    gpuSource: 'unavailable',
  });

  const localModelStats = useMemo(() => {
    const files = localProvider.localModelFiles ?? [];
    const totalBytes = files.reduce((sum, file) => sum + file.sizeBytes, 0);
    const totalGb = totalBytes / (1024 ** 3);
    const localAgents = agents.filter((agent) => agent.modelConfig?.provider === 'local').length;

    const inferredVramNeed = clamp(totalGb * 0.45, 0, 96);
    const modelStress = clamp((localAgents * 8) + (totalGb * 1.8), 0, 100);

    return {
      filesCount: files.length,
      totalGb,
      localAgents,
      inferredVramNeed,
      modelStress,
      format: localProvider.localModelFormat ?? 'unknown',
    };
  }, [agents, localProvider.localModelFiles, localProvider.localModelFormat]);

  const [history, setHistory] = useState<RuntimeSnapshot[]>(() => {
    const base = clamp(22 + localModelStats.modelStress * 0.45, 15, 90);
    const ramBase = clamp(28 + localModelStats.modelStress * 0.5, 20, 96);
    const gpuBase = clamp(15 + localModelStats.modelStress * 0.6, 10, 99);
    const temperatureBase = clamp(38 + localModelStats.modelStress * 0.35, 32, 92);

    return Array.from({ length: 24 }, (_, index) => {
      const wiggle = Math.sin(index / 3) * 4;
      return {
        cpu: clamp(base + wiggle, 0, 100),
        ram: clamp(ramBase + wiggle * 0.65, 0, 100),
        gpu: clamp(gpuBase + wiggle * 0.9, 0, 100),
        temperature: clamp(temperatureBase + wiggle * 0.7, 20, 100),
      };
    });
  });

  useEffect(() => {
    if (telemetryMode !== 'fallback') {
      return;
    }

    const timer = setInterval(() => {
      setHistory((prev) => {
        const last = prev[prev.length - 1];
        const drift = (Math.random() - 0.5) * 6;

        const next: RuntimeSnapshot = {
          cpu: clamp(last.cpu + drift + (localModelStats.modelStress - 50) * 0.02, 5, 100),
          ram: clamp(last.ram + drift * 0.4 + (localModelStats.modelStress - 50) * 0.015, 10, 100),
          gpu: clamp(last.gpu + drift * 0.8 + (localModelStats.modelStress - 50) * 0.03, 3, 100),
          temperature: clamp(last.temperature + drift * 0.35 + (localModelStats.modelStress - 50) * 0.02, 22, 100),
        };

        return [...prev.slice(-23), next];
      });
    }, 2500);

    return () => clearInterval(timer);
  }, [localModelStats.modelStress, telemetryMode]);

  useEffect(() => {
    let cancelled = false;

    const pullMetrics = async () => {
      try {
        const response = await fetch('/api/system/metrics');
        if (!response.ok) {
          throw new Error(`status ${response.status}`);
        }

        const payload = await response.json() as SystemMetricsApiResponse;
        if (cancelled) return;

        setTelemetryMode('real');
        setTelemetryError(null);
        setHostInfo(payload.host);
        setGpuInfo({
          gpuMemoryUsedGb: payload.gpuMemoryUsedGb,
          gpuMemoryTotalGb: payload.gpuMemoryTotalGb,
          gpuSource: payload.gpuSource,
        });

        setHistory((prev) => {
          const next: RuntimeSnapshot = {
            cpu: clamp(payload.cpuPercent, 0, 100),
            ram: clamp(payload.ramPercent, 0, 100),
            gpu: clamp(payload.gpuPercent, 0, 100),
            temperature: clamp(payload.gpuTemperatureC, 0, 100),
          };
          return [...prev.slice(-23), next];
        });
      } catch (error) {
        if (cancelled) return;
        setTelemetryMode('fallback');
        setTelemetryError(error instanceof Error ? error.message : 'No se pudo leer telemetria real');
      }
    };

    void pullMetrics();
    const intervalId = setInterval(() => {
      void pullMetrics();
    }, 2500);

    return () => {
      cancelled = true;
      clearInterval(intervalId);
    };
  }, []);

  const latest = history[history.length - 1];
  const cpuTone = toneByLoad(latest.cpu);
  const ramTone = toneByLoad(latest.ram);
  const gpuTone = toneByLoad(latest.gpu);
  const stressTone = toneByLoad(localModelStats.modelStress);

  const cpuSeries = history.map((item) => item.cpu);
  const ramSeries = history.map((item) => item.ram);
  const gpuSeries = history.map((item) => item.gpu);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-heading font-bold text-2xl sm:text-3xl tracking-tight">MONITOR DEL SISTEMA</h2>
        <p className="text-sm text-muted-foreground mt-1">
          Telemetria operativa de CPU, RAM, GPU y estres inducido por inferencia local.
        </p>
        <div className="mt-2 flex flex-wrap items-center gap-2">
          <Badge variant="outline" className={telemetryMode === 'real' ? 'border-accent text-accent' : 'border-yellow-400 text-yellow-400'}>
            {telemetryMode === 'real' ? 'Lectura real activa' : 'Modo fallback'}
          </Badge>
          {hostInfo && (
            <Badge variant="outline">
              {hostInfo.platform} · {hostInfo.cpuCores} cores
            </Badge>
          )}
          {telemetryError && (
            <span className="text-xs text-muted-foreground">{telemetryError}</span>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        <Card className="p-4 bg-card/50 backdrop-blur-sm border-border/50">
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs text-muted-foreground uppercase tracking-wide">CPU</p>
            <Cpu size={18} className="text-primary" />
          </div>
          <p className="font-mono font-bold text-3xl">{latest.cpu.toFixed(0)}%</p>
          <Progress value={latest.cpu} className="mt-3 h-2" />
          <Badge
            variant="outline"
            className={cn(
              'mt-3',
              cpuTone === 'ok' && 'border-accent text-accent',
              cpuTone === 'warn' && 'border-yellow-400 text-yellow-400',
              cpuTone === 'critical' && 'border-destructive text-destructive'
            )}
          >
            {cpuTone === 'ok' ? 'Saludable' : cpuTone === 'warn' ? 'Carga alta' : 'Critico'}
          </Badge>
        </Card>

        <Card className="p-4 bg-card/50 backdrop-blur-sm border-border/50">
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs text-muted-foreground uppercase tracking-wide">RAM</p>
            <HardDrive size={18} className="text-primary" />
          </div>
          <p className="font-mono font-bold text-3xl">{latest.ram.toFixed(0)}%</p>
          <Progress value={latest.ram} className="mt-3 h-2" />
          <Badge
            variant="outline"
            className={cn(
              'mt-3',
              ramTone === 'ok' && 'border-accent text-accent',
              ramTone === 'warn' && 'border-yellow-400 text-yellow-400',
              ramTone === 'critical' && 'border-destructive text-destructive'
            )}
          >
            {ramTone === 'ok' ? 'Estable' : ramTone === 'warn' ? 'Presion de memoria' : 'Saturada'}
          </Badge>
        </Card>

        <Card className="p-4 bg-card/50 backdrop-blur-sm border-border/50">
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs text-muted-foreground uppercase tracking-wide">GPU</p>
            <GraphicsCard size={18} className="text-primary" />
          </div>
          <p className="font-mono font-bold text-3xl">{latest.gpu.toFixed(0)}%</p>
          <Progress value={latest.gpu} className="mt-3 h-2" />
          <Badge
            variant="outline"
            className={cn(
              'mt-3',
              gpuTone === 'ok' && 'border-accent text-accent',
              gpuTone === 'warn' && 'border-yellow-400 text-yellow-400',
              gpuTone === 'critical' && 'border-destructive text-destructive'
            )}
          >
            {gpuTone === 'ok' ? 'Capacidad libre' : gpuTone === 'warn' ? 'Uso intenso' : 'Bottleneck'}
          </Badge>
        </Card>

        <Card className="p-4 bg-card/50 backdrop-blur-sm border-border/50">
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs text-muted-foreground uppercase tracking-wide">Estres de Modelos</p>
            <Gauge size={18} className="text-primary" />
          </div>
          <p className="font-mono font-bold text-3xl">{localModelStats.modelStress.toFixed(0)}%</p>
          <Progress value={localModelStats.modelStress} className="mt-3 h-2" />
          <Badge
            variant="outline"
            className={cn(
              'mt-3',
              stressTone === 'ok' && 'border-accent text-accent',
              stressTone === 'warn' && 'border-yellow-400 text-yellow-400',
              stressTone === 'critical' && 'border-destructive text-destructive'
            )}
          >
            {stressTone === 'ok' ? 'Bajo' : stressTone === 'warn' ? 'Medio' : 'Alto'}
          </Badge>
        </Card>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        <Card className="p-4 bg-card/50 backdrop-blur-sm border-border/50">
          <p className="text-xs text-muted-foreground uppercase tracking-wide mb-2">CPU Timeline</p>
          <Sparkline data={cpuSeries} positive={cpuSeries[cpuSeries.length - 1] <= 65} className="h-20" />
        </Card>
        <Card className="p-4 bg-card/50 backdrop-blur-sm border-border/50">
          <p className="text-xs text-muted-foreground uppercase tracking-wide mb-2">RAM Timeline</p>
          <Sparkline data={ramSeries} positive={ramSeries[ramSeries.length - 1] <= 65} className="h-20" />
        </Card>
        <Card className="p-4 bg-card/50 backdrop-blur-sm border-border/50">
          <p className="text-xs text-muted-foreground uppercase tracking-wide mb-2">GPU Timeline</p>
          <Sparkline data={gpuSeries} positive={gpuSeries[gpuSeries.length - 1] <= 65} className="h-20" />
        </Card>
      </div>

      <Card className="p-5 bg-card/50 backdrop-blur-sm border-border/50">
        <h3 className="font-heading font-semibold text-lg mb-4">Diagnostico de Inferencia Local</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 text-sm">
          <div className="p-3 rounded-lg bg-background/50 border border-border/50">
            <p className="text-muted-foreground">Formato detectado</p>
            <p className="font-mono font-semibold mt-1 uppercase">{localModelStats.format}</p>
          </div>
          <div className="p-3 rounded-lg bg-background/50 border border-border/50">
            <p className="text-muted-foreground">Archivos de modelo</p>
            <p className="font-mono font-semibold mt-1">{localModelStats.filesCount}</p>
          </div>
          <div className="p-3 rounded-lg bg-background/50 border border-border/50">
            <p className="text-muted-foreground">Peso total de modelos</p>
            <p className="font-mono font-semibold mt-1">{localModelStats.totalGb.toFixed(2)} GB</p>
          </div>
          <div className="p-3 rounded-lg bg-background/50 border border-border/50">
            <p className="text-muted-foreground">VRAM estimada requerida</p>
            <p className="font-mono font-semibold mt-1">{localModelStats.inferredVramNeed.toFixed(1)} GB</p>
          </div>
        </div>

        <div className="mt-4 p-3 rounded-lg border border-border/50 bg-background/50 text-sm">
          <p className="text-muted-foreground">Agentes usando proveedor local</p>
          <p className="font-mono font-semibold mt-1">{localModelStats.localAgents} agente(s)</p>
          <p className="text-xs text-muted-foreground mt-2">
            GPU source: {gpuInfo.gpuSource} · VRAM usada: {gpuInfo.gpuMemoryUsedGb.toFixed(2)} / {gpuInfo.gpuMemoryTotalGb.toFixed(2)} GB
          </p>
          <p className="text-xs text-muted-foreground mt-2">
            El indice de estres combina numero de agentes en local + peso total de modelos cargados. Es una metrica operacional de referencia para prevenir saturacion antes de ejecutar en real.
          </p>
        </div>
      </Card>
    </div>
  );
}
