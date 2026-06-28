import type { RuntimePersistenceAdapter, RuntimePersistenceSnapshot } from '@/runtime/persistence/persistenceTypes';
import type { RuntimeState } from '@/runtime/runtimeTypes';

function getPersistencePath(): string {
  const env = (globalThis as { process?: { env?: Record<string, string | undefined> } }).process?.env ?? {};
  return env.AURORA_RUNTIME_STATE_PATH ?? env.AURORA_PERSISTENCE_PATH ?? '.aurora/runtime-state.json';
}

function buildSnapshot(state: RuntimeState): RuntimePersistenceSnapshot {
  return {
    version: 1,
    savedAt: new Date().toISOString(),
    state,
  };
}

export class LocalRuntimePersistence implements RuntimePersistenceAdapter {
  constructor(private readonly filePath: string = getPersistencePath()) {}

  async load(): Promise<RuntimePersistenceSnapshot | null> {
    try {
      const fs = await import('node:fs/promises');
      const raw = await fs.readFile(this.filePath, 'utf8');
      const parsed = JSON.parse(raw) as RuntimePersistenceSnapshot;
      if (!parsed?.state) return null;
      return parsed;
    } catch {
      return null;
    }
  }

  async save(snapshot: RuntimePersistenceSnapshot): Promise<void> {
    const fs = await import('node:fs/promises');
    const path = await import('node:path');

    await fs.mkdir(path.dirname(this.filePath), { recursive: true });
    await fs.writeFile(this.filePath, JSON.stringify(snapshot, null, 2), 'utf8');
  }

  async clear(): Promise<void> {
    try {
      const fs = await import('node:fs/promises');
      await fs.rm(this.filePath, { force: true });
    } catch {
      // Intentionally ignored: persistence is best-effort.
    }
  }
}

export function createRuntimeSnapshot(state: RuntimeState): RuntimePersistenceSnapshot {
  return buildSnapshot(state);
}
