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
      <DropdownMenu onOpenChange={(open) => !open && setActiveMenu(null)}>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            onClick={() => handleMenuClick('inteligencia')}
            className={cn(
              'font-heading font-semibold text-sm tracking-wide transition-colors gap-1',
              isMenuActive(['intelligence', 'market-intelligence', 'opportunities', 'capitalflow', 'macro'])
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
            onClick={() => onTabChange('market-intelligence')}
            className={cn(
              'font-body cursor-pointer',
              isTabActive('market-intelligence') && 'bg-primary/10 text-primary'
            )}
          >
            Market Intelligence Ops
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
              isMenuActive(['markets', 'portfolio', 'decisions', 'asset-analysis', 'environments'])
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
            onClick={() => onTabChange('markets')}
            className={cn(
              'font-body cursor-pointer',
              isTabActive('markets') && 'bg-primary/10 text-primary'
            )}
          >
            Mercados
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={() => onTabChange('portfolio')}
            className={cn(
              'font-body cursor-pointer',
              isTabActive('portfolio') && 'bg-primary/10 text-primary'
            )}
          >
            Portfolio
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
            onClick={() => onTabChange('asset-analysis')}
            className={cn(
              'font-body cursor-pointer',
              isTabActive('asset-analysis') && 'bg-primary/10 text-primary'
            )}
          >
            Analisis de Activo
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
              isMenuActive(['agents', 'consensus', 'learning', 'production', 'strategic-chat', 'agent-collaboration', 'system-monitor', 'observability', 'models', 'providers', 'training'])
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
          <DropdownMenuItem
            onClick={() => onTabChange('strategic-chat')}
            className={cn(
              'font-body cursor-pointer',
              isTabActive('strategic-chat') && 'bg-primary/10 text-primary'
            )}
          >
            Chat Estratégico
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={() => onTabChange('agent-collaboration')}
            className={cn(
              'font-body cursor-pointer',
              isTabActive('agent-collaboration') && 'bg-primary/10 text-primary'
            )}
          >
            Agent Collaboration
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={() => onTabChange('system-monitor')}
            className={cn(
              'font-body cursor-pointer',
              isTabActive('system-monitor') && 'bg-primary/10 text-primary'
            )}
          >
            Monitor Sistema
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={() => onTabChange('observability')}
            className={cn(
              'font-body cursor-pointer',
              isTabActive('observability') && 'bg-primary/10 text-primary'
            )}
          >
            Observabilidad
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            onClick={() => onTabChange('models')}
            className={cn(
              'font-body cursor-pointer',
              isTabActive('models') && 'bg-primary/10 text-primary'
            )}
          >
            Modelos
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={() => onTabChange('providers')}
            className={cn(
              'font-body cursor-pointer',
              isTabActive('providers') && 'bg-primary/10 text-primary'
            )}
          >
            Proveedores LLM
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={() => onTabChange('training')}
            className={cn(
              'font-body cursor-pointer',
              isTabActive('training') && 'bg-primary/10 text-primary'
            )}
          >
            Entrenamiento
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

      <Button
        variant="ghost"
        onClick={() => onTabChange('settings')}
        className={cn(
          'font-heading font-semibold text-sm tracking-wide transition-colors',
          isTabActive('settings')
            ? 'text-primary bg-primary/10'
            : 'text-muted-foreground hover:text-foreground hover:bg-accent/50'
        )}
      >
        Configuracion
      </Button>
    </nav>
  );
}
