import { GeneralSettingsSection } from '@/components/settings/sections/GeneralSettingsSection';
import type { SystemConfig } from '@/lib/types';

interface GeneralPageProps {
  config: SystemConfig;
  onSimulationToggle: (enabled: boolean) => void;
  onTelegramConfigSave: (payload: {
    botToken?: string;
    allowedUserId?: number;
    mode: 'polling' | 'webhook';
    webhookUrl?: string;
    pollingEnabled: boolean;
    lastCheckAt?: string;
    lastError?: string;
    botId?: number;
    botName?: string;
    botUsername?: string;
    status: 'connected' | 'disconnected' | 'not-configured' | 'error';
  }) => void;
}

export function GeneralPage({ config, onSimulationToggle, onTelegramConfigSave }: GeneralPageProps) {
  return (
    <GeneralSettingsSection
      config={config}
      onSimulationToggle={onSimulationToggle}
      onTelegramConfigSave={onTelegramConfigSave}
    />
  );
}
