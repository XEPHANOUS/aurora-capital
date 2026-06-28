import type { Agent, OrganizationConfig, SystemConfig } from '@/lib/types';
import type { PlatformConfig } from '@/lib/platformConfig';
import type { EnvironmentType } from '@/lib/types';
import type { AuroraBackupSnapshot } from '@/lib/backup';

export type SettingsCategory =
  | 'general'
  | 'agents'
  | 'consensus'
  | 'apis'
  | 'llms'
  | 'trading'
  | 'environments'
  | 'security'
  | 'backups';

export interface SettingsPageProps {
  config: SystemConfig;
  platformConfig: PlatformConfig;
  agents: Agent[];
  activeEnvironment?: EnvironmentType;
  environmentOverview: Record<EnvironmentType, EnvironmentOverview>;
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
  onUpdateAgent: (agentId: string, updates: Partial<Agent>) => void;
  onProfileChange: (profileId: string) => void;
  onSelectEnvironment: (environment: EnvironmentType) => void;
  onEmergencyClosePositions: () => { closed: number };
  onExportBackup: () => AuroraBackupSnapshot;
  onRestoreBackup: (snapshot: AuroraBackupSnapshot) => { ok: boolean; message: string };
  onOrganizationConfigChange: (updater: (current: OrganizationConfig | undefined) => OrganizationConfig) => void;
  onPlatformConfigChange: (updater: (current: PlatformConfig) => PlatformConfig) => void;
}

export interface EnvironmentOverview {
  initialCapital: number;
  currentCapital: number;
  positions: number;
  pnl: number;
  status: 'running' | 'paused' | 'stopped';
}

export interface CategoryItem {
  id: SettingsCategory;
  label: string;
  icon: React.ElementType;
  description: string;
  comingSoon?: boolean;
}
