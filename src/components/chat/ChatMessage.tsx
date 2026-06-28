import { Badge } from '@/components/ui/badge';
import { AgentAvatar } from '@/components/chat/AgentAvatar';
import { cn } from '@/lib/utils';
import type { ChatMessage as ChatMessageModel } from '@/lib/chat/types';

interface ChatMessageProps {
  message: ChatMessageModel;
}

export function ChatMessage({ message }: ChatMessageProps) {
  if (message.role === 'system') {
    return (
      <div className="flex justify-center">
        <Badge variant="outline" className="text-xs text-muted-foreground border-border/70 bg-background/30">
          {message.content}
        </Badge>
      </div>
    );
  }

  const isUser = message.role === 'user';

  return (
    <div className={cn('flex gap-3', isUser ? 'justify-end' : 'justify-start')}>
      {!isUser && <AgentAvatar name={message.agentName ?? 'Agente'} agentId={message.agentId} />}

      <div className={cn('max-w-[85%] rounded-lg border px-3 py-2', isUser ? 'bg-primary/20 border-primary/40' : 'bg-card/50 border-border/60')}>
        {!isUser && (
          <p className="text-xs text-muted-foreground mb-1 uppercase tracking-wide">{message.agentName ?? message.agentId ?? 'Agente'}</p>
        )}
        <p className="text-sm leading-relaxed whitespace-pre-wrap">{message.content}</p>
      </div>
    </div>
  );
}
