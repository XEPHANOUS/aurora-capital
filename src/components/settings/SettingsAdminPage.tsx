import { lazy, Suspense, useMemo } from 'react';
import { SettingsLayout } from '@/components/settings/SettingsLayout';
import type { SettingsCategory, SettingsPageProps } from '@/components/settings/types';

const GeneralPage = lazy(() => import('@/pages/settings/GeneralPage').then((module) => ({ default: module.GeneralPage })));
const AgentsSettingsPage = lazy(() => import('@/components/settings/agents/AgentsSettingsPage').then((module) => ({ default: module.AgentsSettingsPage })));
const ConsensusSettingsSection = lazy(() => import('@/components/settings/sections/ConsensusSettingsSection').then((module) => ({ default: module.ConsensusSettingsSection })));
const TradingSettingsSection = lazy(() => import('@/components/settings/sections/TradingSettingsSection').then((module) => ({ default: module.TradingSettingsSection })));
const InfrastructureModuleSection = lazy(() =>
  import('@/components/settings/sections/InfrastructureModuleSection').then((module) => ({ default: module.InfrastructureModuleSection }))
);
const ApiSettingsSection = lazy(() =>
  import('@/components/settings/sections/ApiSettingsSection').then((module) => ({ default: module.ApiSettingsSection }))
);
const LlmSettingsSection = lazy(() =>
  import('@/components/settings/sections/LlmSettingsSection').then((module) => ({ default: module.LlmSettingsSection }))
);
const EnvironmentSettingsSection = lazy(() =>
  import('@/components/settings/sections/EnvironmentSettingsSection').then((module) => ({ default: module.EnvironmentSettingsSection }))
);
const SecuritySettingsSection = lazy(() =>
  import('@/components/settings/sections/SecuritySettingsSection').then((module) => ({ default: module.SecuritySettingsSection }))
);
const BackupSettingsSection = lazy(() =>
  import('@/components/settings/sections/BackupSettingsSection').then((module) => ({ default: module.BackupSettingsSection }))
);

interface SettingsAdminPageRoutingProps extends SettingsPageProps {
  path: string;
  navigate: (path: string) => void;
}

const CATEGORY_BASE_PATH: Record<SettingsCategory, string> = {
  general: '/settings/general',
  agents: '/settings/agents',
  consensus: '/settings/consensus',
  trading: '/settings/trading',
  security: '/settings/security',
  backups: '/settings/backups',
  apis: '/settings/apis',
  llms: '/settings/llms',
  environments: '/settings/environments',
};

function inferCategoryFromPath(path: string): SettingsCategory {
  if (path.startsWith('/settings/agents')) return 'agents';
  if (path.startsWith('/settings/consensus')) return 'consensus';
  if (path.startsWith('/settings/trading')) return 'trading';
  if (path.startsWith('/settings/security')) return 'security';
  if (path.startsWith('/settings/backups')) return 'backups';
  if (path.startsWith('/settings/apis')) return 'apis';
  if (path.startsWith('/settings/llms')) return 'llms';
  if (path.startsWith('/settings/environments')) return 'environments';
  return 'general';
}

export function SettingsAdminPage({
  path,
  navigate,
  config,
  platformConfig,
  agents,
  activeEnvironment,
  environmentOverview,
  onSimulationToggle,
  onTelegramConfigSave,
  onUpdateAgent,
  onProfileChange,
  onSelectEnvironment,
  onEmergencyClosePositions,
  onExportBackup,
  onRestoreBackup,
  onOrganizationConfigChange,
  onPlatformConfigChange,
}: SettingsAdminPageRoutingProps) {
  const selectedCategory = inferCategoryFromPath(path);

  const handleCategoryChange = (category: SettingsCategory) => {
    navigate(CATEGORY_BASE_PATH[category]);
  };

  const fallback = <div className="h-full" />;

  const content = useMemo(() => {
    if (selectedCategory === 'general') {
      return (
        <GeneralPage
          config={config}
          onSimulationToggle={onSimulationToggle}
          onTelegramConfigSave={onTelegramConfigSave}
        />
      );
    }

    if (selectedCategory === 'agents') {
      return (
        <AgentsSettingsPage
          path={path}
          navigate={navigate}
          agents={agents}
          config={config}
          activeEnvironment={activeEnvironment}
          localModelFiles={platformConfig.llmsConfig.providers.local.localModelFiles}
          onUpdateAgent={onUpdateAgent}
          onProfileChange={onProfileChange}
          onOrganizationConfigChange={onOrganizationConfigChange}
        />
      );
    }

    if (selectedCategory === 'consensus') {
      return <ConsensusSettingsSection />;
    }

    if (selectedCategory === 'trading') {
      return <TradingSettingsSection config={config} />;
    }

    if (selectedCategory === 'apis') {
      return (
        <ApiSettingsSection
          platformConfig={platformConfig}
          onPlatformConfigChange={onPlatformConfigChange}
        />
      );
    }

    if (selectedCategory === 'llms') {
      return (
        <LlmSettingsSection
          agents={agents}
          platformConfig={platformConfig}
          onUpdateAgent={onUpdateAgent}
          onPlatformConfigChange={onPlatformConfigChange}
        />
      );
    }

    if (selectedCategory === 'environments') {
      return (
        <EnvironmentSettingsSection
          activeEnvironment={activeEnvironment}
          environmentOverview={environmentOverview}
          platformConfig={platformConfig}
          onPlatformConfigChange={onPlatformConfigChange}
          onSelectEnvironment={onSelectEnvironment}
        />
      );
    }

    if (selectedCategory === 'security') {
      return (
        <SecuritySettingsSection
          platformConfig={platformConfig}
          onPlatformConfigChange={onPlatformConfigChange}
          onEmergencyClosePositions={onEmergencyClosePositions}
        />
      );
    }

    return <BackupSettingsSection onExportBackup={onExportBackup} onRestoreBackup={onRestoreBackup} />;
  }, [
    selectedCategory,
    path,
    navigate,
    config,
    platformConfig,
    agents,
    onSimulationToggle,
    onTelegramConfigSave,
    onUpdateAgent,
    onProfileChange,
    onSelectEnvironment,
    onEmergencyClosePositions,
    onExportBackup,
    onRestoreBackup,
    onOrganizationConfigChange,
    onPlatformConfigChange,
  ]);

  return (
    <SettingsLayout selectedCategory={selectedCategory} onCategoryChange={handleCategoryChange}>
      <Suspense fallback={fallback}>{content}</Suspense>
    </SettingsLayout>
  );
}
