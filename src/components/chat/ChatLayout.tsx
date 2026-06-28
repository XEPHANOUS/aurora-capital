import type { ReactNode } from 'react';
import { Card } from '@/components/ui/card';

interface ChatLayoutProps {
  title: string;
  description: string;
  children: ReactNode;
  sidebar: ReactNode;
}

export function ChatLayout({ title, description, children, sidebar }: ChatLayoutProps) {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-heading font-bold text-3xl tracking-tight text-glow">{title}</h2>
        <p className="text-sm text-muted-foreground mt-1">{description}</p>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-[1fr_320px] gap-6">
        <Card className="bg-card/50 backdrop-blur-sm border-border/60 h-[calc(100vh-270px)] min-h-[520px] flex flex-col min-w-0">
          {children}
        </Card>

        <Card className="bg-card/50 backdrop-blur-sm border-border/60 p-5 space-y-5 h-fit">
          {sidebar}
        </Card>
      </div>
    </div>
  );
}
