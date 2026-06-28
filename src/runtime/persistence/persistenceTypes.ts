import type { RuntimeState } from '@/runtime/runtimeTypes';

export interface RuntimePersistenceSnapshot {
  version: number;
  savedAt: string;
  state: RuntimeState;
}

export interface RuntimePersistenceAdapter {
  load(): Promise<RuntimePersistenceSnapshot | null>;
  save(snapshot: RuntimePersistenceSnapshot): Promise<void>;
  clear(): Promise<void>;
}
