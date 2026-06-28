import { AuroraRuntime } from '@/runtime/auroraRuntime';
import { getRuntimeStateProvider } from '@/runtime/stateProvider';
import type { RuntimeService } from '@/runtime/runtimeTypes';
import { LocalRuntimePersistence, createRuntimeSnapshot } from '@/runtime/persistence/runtimePersistence';
import { ServiceHealthMonitor } from '@/runtime/serviceHealth';
import { RuntimeTelegramService } from '@/runtime/services/telegramRuntimeService';

interface AuroraServiceRuntimeService extends RuntimeService {
  name: string;
}

class NoopRuntimeService implements AuroraServiceRuntimeService {
  constructor(public readonly name: string) {}

  async start(): Promise<void> {
    return;
  }

  async stop(): Promise<void> {
    return;
  }
}

export class AuroraService {
  private readonly runtime: AuroraRuntime;
  private readonly persistence: LocalRuntimePersistence;
  private readonly healthMonitor: ServiceHealthMonitor;
  private readonly telegramService: RuntimeTelegramService;
  private readonly stateProvider = getRuntimeStateProvider();
  private readonly shutdownHandlers: Array<() => void> = [];
  private readonly unsubscribeStateSync: () => void;
  private started = false;
  private saveTimer: ReturnType<typeof setTimeout> | null = null;

  constructor() {
    this.runtime = new AuroraRuntime(this.stateProvider);
    this.persistence = new LocalRuntimePersistence();
    this.healthMonitor = new ServiceHealthMonitor(this.runtime);
    this.telegramService = new RuntimeTelegramService();
    this.unsubscribeStateSync = this.stateProvider.subscribe(() => {
      this.schedulePersist();
    });
  }

  async start(): Promise<void> {
    if (this.started) return;

    const snapshot = await this.persistence.load();
    if (snapshot) {
      this.stateProvider.setState(snapshot.state);
    }

    this.runtime.registerService('telegram', this.telegramService);
    this.runtime.registerService('sandbox', new NoopRuntimeService('sandbox'));
    this.runtime.registerService('demo', new NoopRuntimeService('demo'));
    this.runtime.registerService('consensus', new NoopRuntimeService('consensus'));
    this.runtime.registerService('chat', new NoopRuntimeService('chat'));
    this.runtime.registerService('marketData', new NoopRuntimeService('marketData'));

    await this.runtime.start();
    this.started = true;
    this.attachShutdownHandlers();
  }

  async stop(): Promise<void> {
    if (!this.started) return;
    await this.flushPersist();
    await this.runtime.stop();
    this.removeShutdownHandlers();
    this.unsubscribeStateSync();
    this.started = false;
  }

  async restart(): Promise<void> {
    await this.stop();
    await this.start();
  }

  getHealth() {
    const telegram = this.runtime.getService<RuntimeTelegramService>('telegram');
    return this.healthMonitor.getHealth(telegram?.getHealth() ?? this.telegramService.getHealth(), this.runtime.getService('sandbox') !== undefined);
  }

  getRuntime(): AuroraRuntime {
    return this.runtime;
  }

  getService<T extends RuntimeService>(name: string): T | undefined {
    return this.runtime.getService<T>(name);
  }

  private schedulePersist(): void {
    if (this.saveTimer) {
      clearTimeout(this.saveTimer);
    }

    this.saveTimer = setTimeout(() => {
      void this.flushPersist();
    }, 250);
  }

  private async flushPersist(): Promise<void> {
    if (this.saveTimer) {
      clearTimeout(this.saveTimer);
      this.saveTimer = null;
    }

    await this.persistence.save(createRuntimeSnapshot(this.stateProvider.getState()));
  }

  private attachShutdownHandlers(): void {
    const processRef = globalThis as unknown as {
      process?: {
        on: (event: 'SIGINT' | 'SIGTERM', handler: () => void) => void;
        off: (event: 'SIGINT' | 'SIGTERM', handler: () => void) => void;
      };
    };

    const handleShutdown = async (): Promise<void> => {
      await this.stop();
    };

    if (!processRef.process) return;

    const onSigint = () => { void handleShutdown(); };
    const onSigterm = () => { void handleShutdown(); };

    processRef.process.on('SIGINT', onSigint);
    processRef.process.on('SIGTERM', onSigterm);

    this.shutdownHandlers.push(() => processRef.process?.off('SIGINT', onSigint));
    this.shutdownHandlers.push(() => processRef.process?.off('SIGTERM', onSigterm));
  }

  private removeShutdownHandlers(): void {
    for (const remove of this.shutdownHandlers.splice(0)) {
      remove();
    }
  }
}
