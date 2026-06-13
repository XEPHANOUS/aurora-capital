import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import { CaretDown } from '@phosphor-icons/react';
import { cn } from '@/lib/utils';

interface NavigationMenuProps {
  currentTab: string;
  onTabChange: (tab: string) => void;
}

export function NavigationMenu({ currentTab, onTabChange }: NavigationMenuProps) {
  const [activeMenu, setActiveMenu] = useState<string | null>(null);

  const isTabActive = (tab: string) => currentTab === tab;
  const isMenuActive = (tabs: string[]) => tabs.includes(currentTab);

  const handleMenuClick = (menu: string) => {
    setActiveMenu(activeMenu === menu ? null : menu);
  };

  return (
    <nav className="flex items-center gap-1">
      <Button
        variant="ghost"
        onClick={() => onTabChange('dashboard')}
        className={cn(
          'font-heading font-semibold text-sm tracking-wide transition-colors',
          isTabActive('dashboard')
            ? 'text-primary bg-primary/10'
            : 'text-muted-foreground hover:text-foreground hover:bg-accent/50'
        )}
      >
        Dashboard
      </Button>

      <DropdownMenu onOpenChange={(open) => !open && setActiveMenu(null)}>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            onClick={() => handleMenuClick('inteligencia')}
            className={cn(
              'font-heading font-semibold text-sm tracking-wide transition-colors gap-1',
              isMenuActive(['intelligence', 'opportunities', 'capitalflow', 'macro'])
                ? 'text-primary bg-primary/10'
                : 'text-muted-foreground hover:text-foreground hover:bg-accent/50'
            )}
          >
            Inteligencia
            <CaretDown size={14} weight="bold" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="min-w-[220px]">
          <DropdownMenuItem
            onClick={() => onTabChange('intelligence')}
            className={cn(
              'font-body cursor-pointer',
              isTabActive('intelligence') && 'bg-primary/10 text-primary'
            )}
          >
            Market Intelligence
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={() => onTabChange('opportunities')}
            className={cn(
              'font-body cursor-pointer',
              isTabActive('opportunities') && 'bg-primary/10 text-primary'
            )}
          >
            Global Opportunities
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={() => onTabChange('capitalflow')}
            className={cn(
              'font-body cursor-pointer',
              isTabActive('capitalflow') && 'bg-primary/10 text-primary'
            )}
          >
            Capital Flow
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={() => onTabChange('macro')}
            className={cn(
              'font-body cursor-pointer',
              isTabActive('macro') && 'bg-primary/10 text-primary'
            )}
          >
            Macro Economy
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <DropdownMenu onOpenChange={(open) => !open && setActiveMenu(null)}>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            onClick={() => handleMenuClick('trading')}
            className={cn(
              'font-heading font-semibold text-sm tracking-wide transition-colors gap-1',
              isMenuActive(['market', 'decisions', 'environments'])
                ? 'text-primary bg-primary/10'
                : 'text-muted-foreground hover:text-foreground hover:bg-accent/50'
            )}
          >
            Trading
            <CaretDown size={14} weight="bold" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="min-w-[220px]">
          <DropdownMenuItem
            onClick={() => onTabChange('market')}
            className={cn(
              'font-body cursor-pointer',
              isTabActive('market') && 'bg-primary/10 text-primary'
            )}
          >
            Mercado
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={() => onTabChange('decisions')}
            className={cn(
              'font-body cursor-pointer',
              isTabActive('decisions') && 'bg-primary/10 text-primary'
            )}
          >
            Decisiones
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={() => onTabChange('environments')}
            className={cn(
              'font-body cursor-pointer',
              isTabActive('environments') && 'bg-primary/10 text-primary'
            )}
          >
            Entornos
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <DropdownMenu onOpenChange={(open) => !open && setActiveMenu(null)}>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            onClick={() => handleMenuClick('ia')}
            className={cn(
              'font-heading font-semibold text-sm tracking-wide transition-colors gap-1',
              isMenuActive(['agents', 'consensus', 'learning', 'production'])
                ? 'text-primary bg-primary/10'
                : 'text-muted-foreground hover:text-foreground hover:bg-accent/50'
            )}
          >
            IA
            <CaretDown size={14} weight="bold" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="min-w-[220px]">
          <DropdownMenuItem
            onClick={() => onTabChange('agents')}
            className={cn(
              'font-body cursor-pointer',
              isTabActive('agents') && 'bg-primary/10 text-primary'
            )}
          >
            Agentes
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={() => onTabChange('consensus')}
            className={cn(
              'font-body cursor-pointer',
              isTabActive('consensus') && 'bg-primary/10 text-primary'
            )}
          >
            Consenso
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={() => onTabChange('learning')}
            className={cn(
              'font-body cursor-pointer',
              isTabActive('learning') && 'bg-primary/10 text-primary'
            )}
          >
            Learning
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={() => onTabChange('production')}
            className={cn(
              'font-body cursor-pointer',
              isTabActive('production') && 'bg-primary/10 text-primary'
            )}
          >
            Producción
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <Button
        variant="ghost"
        onClick={() => onTabChange('history')}
        className={cn(
          'font-heading font-semibold text-sm tracking-wide transition-colors',
          isTabActive('history')
            ? 'text-primary bg-primary/10'
            : 'text-muted-foreground hover:text-foreground hover:bg-accent/50'
        )}
      >
        Historial
      </Button>
    </nav>
  );
}
