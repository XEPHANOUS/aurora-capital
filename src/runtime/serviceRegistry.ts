import type { RuntimeService, RuntimeServiceSnapshot } from '@/runtime/runtimeTypes';

export class ServiceRegistry {
  private readonly services = new Map<string, RuntimeService>();

  register<T extends RuntimeService>(name: string, service: T): T {
    this.services.set(name, service);
    return service;
  }

  resolve<T extends RuntimeService>(name: string): T | undefined {
    return this.services.get(name) as T | undefined;
  }

  has(name: string): boolean {
    return this.services.has(name);
  }

  list(): string[] {
    return Array.from(this.services.keys());
  }

  snapshot(): RuntimeServiceSnapshot[] {
    return Array.from(this.services.values()).map((service) => ({
      name: service.name,
      hasStart: typeof service.start === 'function',
      hasStop: typeof service.stop === 'function',
      hasHealth: typeof service.getHealth === 'function',
      health: typeof service.getHealth === 'function' ? service.getHealth() : undefined,
    }));
  }
}
