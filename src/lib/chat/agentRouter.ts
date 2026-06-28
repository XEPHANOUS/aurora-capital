import { findAgentByMention } from '@/lib/chat/agentProfiles';
import type { ChatRouteResult } from '@/lib/chat/types';

const DIRECT_MENTION_REGEX = /@([a-zA-Z0-9_-]+)/g;

function cleanPrompt(prompt: string): string {
  return prompt.replace(DIRECT_MENTION_REGEX, '').replace(/\s+/g, ' ').trim();
}

export function resolveChatRoute(prompt: string): ChatRouteResult {
  const trimmed = prompt.trim();
  const mentionMatch = DIRECT_MENTION_REGEX.exec(trimmed);

  DIRECT_MENTION_REGEX.lastIndex = 0;

  if (!mentionMatch) {
    return {
      mode: 'consensus',
      cleanedPrompt: trimmed,
    };
  }

  const mentioned = mentionMatch[1].toLowerCase();

  if (mentioned === 'debate') {
    return {
      mode: 'debate',
      cleanedPrompt: cleanPrompt(trimmed),
    };
  }

  const profile = findAgentByMention(mentioned);

  if (!profile || !profile.routing.directEnabled) {
    return {
      mode: 'consensus',
      cleanedPrompt: cleanPrompt(trimmed),
    };
  }

  return {
    mode: 'direct',
    cleanedPrompt: cleanPrompt(trimmed),
    targetAgentId: profile.identity.id,
  };
}
