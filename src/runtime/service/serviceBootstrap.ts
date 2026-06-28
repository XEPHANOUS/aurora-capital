export { AuroraService } from '@/runtime/service/auroraService';

import { AuroraService } from '@/runtime/service/auroraService';

export async function bootstrapAuroraService(): Promise<AuroraService> {
  const service = new AuroraService();
  await service.start();
  return service;
}
