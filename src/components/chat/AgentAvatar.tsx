import { cn } from '@/lib/utils';

interface AgentAvatarProps {
  name: string;
  agentId?: string;
  size?: 'sm' | 'md';
}

function getHue(agentId: string): number {
  let hash = 0;
  for (let i = 0; i < agentId.length; i += 1) {
    hash = (hash * 31 + agentId.charCodeAt(i)) >>> 0;
  }
  return hash % 360;
}

export function AgentAvatar({ name, agentId = 'system', size = 'md' }: AgentAvatarProps) {
  const initials = name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((chunk) => chunk[0]?.toUpperCase() ?? '')
    .join('');

  const hue = getHue(agentId);

  return (
    <div
      className={cn(
        'rounded-full flex items-center justify-center border border-border/70 text-foreground/90 font-semibold',
        size === 'sm' ? 'w-7 h-7 text-[10px]' : 'w-9 h-9 text-xs'
      )}
      style={{ background: `linear-gradient(135deg, hsla(${hue}, 70%, 28%, 0.8), hsla(${(hue + 35) % 360}, 70%, 24%, 0.8))` }}
      title={name}
    >
      {initials || 'AI'}
    </div>
  );
}
