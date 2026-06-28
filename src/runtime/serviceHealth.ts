import type { AuroraRuntime } from '@/runtime/auroraRuntime';
import type { RuntimeServiceSnapshot } from '@/runtime/runtimeTypes';
import type { TelegramRuntimeHealth } from '@/runtime/services/telegramRuntimeService';

export type ServiceHealthStatus = 'ONLINE' | 'DEGRADED' | 'OFFLINE' | 'ERROR';

export interface RuntimeServiceHealth {
  name: string;
  available: boolean;
  running?: boolean;
  status: ServiceHealthStatus;
  health?: unknown;
}

export interface AuroraServiceHealthSnapshot {
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
    serviceSnapshots: RuntimeServiceHealth[];
  };
  telegram: TelegramRuntimeHealth | null;
  sandbox: RuntimeServiceHealth;
}

export class ServiceHealthMonitor {
  private readonly startedAt = Date.now();

  constructor(private readonly runtime: AuroraRuntime) {}

  getHealth(telegramHealth: TelegramRuntimeHealth | null = null, sandboxRunning = false): AuroraServiceHealthSnapshot {
    const memory = process.memoryUsage();
    const serviceSnapshots = this.runtime.getServiceSnapshots().map((service: RuntimeServiceSnapshot) => {
      const rawHealth = service.health as { status?: string; available?: boolean; running?: boolean } | undefined;
      const status = rawHealth?.status === 'error'
        ? 'ERROR'
        : rawHealth?.status === 'degraded'
        ? 'DEGRADED'
        : rawHealth?.status === 'offline'
        ? 'OFFLINE'
        : rawHealth?.available === false
        ? 'OFFLINE'
        : 'ONLINE';

      return {
        name: service.name,
        available: true,
        running: rawHealth?.running ?? service.hasStart,
        status,
        health: service.health,
      } satisfies RuntimeServiceHealth;
    });

    const telegramStatus = telegramHealth
      ? (telegramHealth as { status?: string }).status === 'error'
        ? 'ERROR'
        : (telegramHealth as { status?: string }).status === 'disconnected'
        ? 'OFFLINE'
        : 'ONLINE'
      : 'OFFLINE';

    return {
      uptimeMs: Date.now() - this.startedAt,
      memory: {
        rss: memory.rss,
        heapUsed: memory.heapUsed,
        heapTotal: memory.heapTotal,
        external: memory.external,
      },
      runtime: {
        lifecycle: this.runtime.getStatus().lifecycle,
        services: this.runtime.getStatus().services,
        serviceSnapshots,
      },
      telegram: telegramHealth,
      sandbox: {
        name: 'sandbox',
        available: true,
        running: sandboxRunning,
        status: sandboxRunning ? 'ONLINE' : 'OFFLINE',
      },
    };
  }
}
