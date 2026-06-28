import { AuroraRuntime } from '@/runtime/auroraRuntime';
import { getRuntimeStateProvider } from '@/runtime/stateProvider';
import { getRuntimeTelegramService } from '@/runtime/services/telegramRuntimeService';

let runtimeSingleton: AuroraRuntime | null = null;

export function getAuroraRuntime(): AuroraRuntime {
  if (!runtimeSingleton) {
    runtimeSingleton = new AuroraRuntime(getRuntimeStateProvider());
    runtimeSingleton.registerService('telegram', getRuntimeTelegramService());
  }
  return runtimeSingleton;
}

export async function bootstrapAuroraRuntime(): Promise<AuroraRuntime> {
  const runtime = getAuroraRuntime();
  await runtime.start();
  return runtime;
}
