import type { ReactNode } from 'react';
import { Card } from '@/components/ui/card';
import { SettingsSidebar } from '@/components/settings/SettingsSidebar';
import type { SettingsCategory } from '@/components/settings/types';

interface SettingsLayoutProps {
  selectedCategory: SettingsCategory;
  onCategoryChange: (category: SettingsCategory) => void;
  children: ReactNode;
}

export function SettingsLayout({ selectedCategory, onCategoryChange, children }: SettingsLayoutProps) {
  return (
    <Card className="p-0 gap-0 overflow-hidden w-full min-h-[calc(100vh-180px)] bg-card/30 backdrop-blur-sm border-border/60">
      <div className="flex flex-col lg:flex-row h-full min-h-[calc(100vh-180px)]">
        <SettingsSidebar selectedCategory={selectedCategory} onCategoryChange={onCategoryChange} />

        <main className="flex-1 flex flex-col min-h-0 bg-background/30">
          <div className="flex-1 min-h-0 overflow-y-auto scrollbar-custom">
            <div className="p-4 sm:p-6 lg:p-8 h-full">{children}</div>
          </div>
        </main>
      </div>
    </Card>
  );
}
