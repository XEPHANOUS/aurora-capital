import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { SETTINGS_CATEGORIES } from '@/components/settings/settings-categories';
import type { SettingsCategory } from '@/components/settings/types';

interface SettingsSidebarProps {
  selectedCategory: SettingsCategory;
  onCategoryChange: (category: SettingsCategory) => void;
}

export function SettingsSidebar({ selectedCategory, onCategoryChange }: SettingsSidebarProps) {
  return (
    <aside
      className={cn(
        'flex-shrink-0 border-b lg:border-b-0 lg:border-r border-border bg-card/40 backdrop-blur-sm flex flex-col',
        'w-full lg:w-auto lg:min-w-[280px] lg:max-w-[25%]'
      )}
    >
      <div className="p-4 sm:p-6 border-b border-border/50 flex-shrink-0">
        <h2 className="font-heading font-bold text-lg sm:text-xl tracking-tight">CONFIGURACION</h2>
        <p className="text-xs text-muted-foreground/80 mt-1">Sistema Aurora Capital</p>
      </div>

      <nav className="flex-1 min-h-0 overflow-y-auto scrollbar-custom p-3 sm:p-4 space-y-1.5">
        {SETTINGS_CATEGORIES.map((category) => {
          const Icon = category.icon;
          const isSelected = selectedCategory === category.id;

          return (
            <button
              key={category.id}
              onClick={() => !category.comingSoon && onCategoryChange(category.id)}
              disabled={category.comingSoon}
              className={cn(
                'w-full flex items-start gap-3 p-3 sm:p-3.5 rounded-lg transition-all text-left group',
                isSelected
                  ? 'bg-primary/15 border border-primary shadow-sm'
                  : category.comingSoon
                    ? 'opacity-40 cursor-not-allowed'
                    : 'hover:bg-background/60 hover:border hover:border-border/50'
              )}
            >
              <Icon
                size={20}
                weight={isSelected ? 'fill' : 'regular'}
                className={cn(
                  'mt-0.5 transition-colors flex-shrink-0',
                  isSelected ? 'text-primary' : 'text-muted-foreground group-hover:text-foreground'
                )}
              />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <p
                    className={cn(
                      'text-sm font-semibold',
                      isSelected ? 'text-primary' : 'text-foreground'
                    )}
                  >
                    {category.label}
                  </p>
                  {category.comingSoon && (
                    <Badge
                      variant="outline"
                      className="text-[10px] px-1.5 py-0 h-4 text-muted-foreground/70 border-muted-foreground/30"
                    >
                      Proximamente
                    </Badge>
                  )}
                </div>
                <p className="text-xs text-muted-foreground/70 line-clamp-2 leading-relaxed">
                  {category.description}
                </p>
              </div>
            </button>
          );
        })}
      </nav>
    </aside>
  );
}
