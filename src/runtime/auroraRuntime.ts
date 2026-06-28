import { ServiceRegistry } from '@/runtime/serviceRegistry';
import { getRuntimeStateProvider, RuntimeStateProvider } from '@/runtime/stateProvider';
import type { RuntimeService, RuntimeStatus, RuntimeServiceSnapshot } from '@/runtime/runtimeTypes';
import { ServiceHealthMonitor } from '@/runtime/serviceHealth';

export class AuroraRuntime {
  private readonly serviceRegistry = new ServiceRegistry();
  private readonly stateProvider: RuntimeStateProvider;
  private readonly healthMonitor = new ServiceHealthMonitor(this);
  private status: RuntimeStatus = {
    lifecycle: 'stopped',
    services: [],
  };

  constructor(stateProvider: RuntimeStateProvider = getRuntimeStateProvider()) {
    this.stateProvider = stateProvider;
  }

  async start(): Promise<void> {
    if (this.status.lifecycle === 'running' || this.status.lifecycle === 'starting') return;
    this.status = {
      ...this.status,
      lifecycle: 'starting',
      services: this.serviceRegistry.list(),
    };

    for (const serviceName of this.serviceRegistry.list()) {
      const service = this.serviceRegistry.resolve(serviceName);
      await service?.start?.();
    }

    this.status = {
      lifecycle: 'running',
      startedAt: this.status.startedAt ?? new Date().toISOString(),
      stoppedAt: undefined,
      services: this.serviceRegistry.list(),
    };
  }

  async stop(): Promise<void> {
    if (this.status.lifecycle === 'stopped' || this.status.lifecycle === 'stopping') return;
    this.status = {
      ...this.status,
      lifecycle: 'stopping',
    };

    for (const serviceName of this.serviceRegistry.list().reverse()) {
      const service = this.serviceRegistry.resolve(serviceName);
      await service?.stop?.();
    }

    this.status = {
      ...this.status,
      lifecycle: 'stopped',
      stoppedAt: new Date().toISOString(),
      services: this.serviceRegistry.list(),
    };
  }

  getStatus(): RuntimeStatus {
    return {
      ...this.status,
      services: this.serviceRegistry.list(),
    };
  }

  getServiceSnapshots(): RuntimeServiceSnapshot[] {
    return this.serviceRegistry.snapshot();
  }

  getHealthSnapshot(telegramHealth: unknown = null, sandboxRunning = false) {
    return this.healthMonitor.getHealth(telegramHealth as never, sandboxRunning);
  }

  getStateProvider(): RuntimeStateProvider {
    return this.stateProvider;
  }

  registerService<T extends RuntimeService>(name: string, service: T): T {
    const registered = this.serviceRegistry.register(name, service);
    this.status = {
      ...this.status,
      services: this.serviceRegistry.list(),
    };
    return registered;
  }

  getService<T extends RuntimeService>(name: string): T | undefined {
    return this.serviceRegistry.resolve<T>(name);
  }
}
