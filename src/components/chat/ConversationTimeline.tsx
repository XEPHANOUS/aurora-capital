import { useEffect, useRef } from 'react';
import { ChatMessage } from '@/components/chat/ChatMessage';
import { Badge } from '@/components/ui/badge';
import type { ChatMessage as ChatMessageModel } from '@/lib/chat/types';

interface ConversationTimelineProps {
  messages: ChatMessageModel[];
  isProcessing: boolean;
}

export function ConversationTimeline({ messages, isProcessing }: ConversationTimelineProps) {
  const bottomRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
  }, [messages, isProcessing]);

  return (
    <div className="flex-1 min-h-0 overflow-y-auto scrollbar-custom p-4 sm:p-5 space-y-3">
      {messages.map((message) => (
        <ChatMessage key={message.id} message={message} />
      ))}

      {isProcessing && (
        <div className="flex justify-start">
          <Badge variant="outline" className="text-xs border-border/70 bg-background/30 text-muted-foreground">
            Agentes analizando contexto...
          </Badge>
        </div>
      )}

      <div ref={bottomRef} />
    </div>
  );
}
