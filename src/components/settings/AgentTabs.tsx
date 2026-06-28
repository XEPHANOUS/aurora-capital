import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import type { AgentSubRoute } from '@/components/settings/agents/constants';

interface AgentTabsProps {
  activeSubRoute: AgentSubRoute;
  onChange: (subRoute: AgentSubRoute) => void;
}

const SECTIONS: { id: AgentSubRoute; label: string }[] = [
  { id: 'assignment', label: 'Assignment' },
  { id: 'profiles', label: 'Profiles' },
  { id: 'hierarchy', label: 'Hierarchy' },
  { id: 'influence', label: 'Influence' },
];

export function AgentTabs({ activeSubRoute, onChange }: AgentTabsProps) {
  return (
    <div className="flex flex-wrap gap-2 border-b border-border/50 pb-4">
      {SECTIONS.map((section) => (
        <Button
          key={section.id}
          variant="ghost"
          onClick={() => onChange(section.id)}
          className={cn(
            'font-heading font-semibold text-sm tracking-wide transition-colors',
            activeSubRoute === section.id
              ? 'text-primary bg-primary/10'
              : 'text-muted-foreground hover:text-foreground hover:bg-accent/50'
          )}
        >
          {section.label}
        </Button>
      ))}
    </div>
  );
}
