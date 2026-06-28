import { useMemo, useRef, useState, useEffect } from 'react';
import { useKV } from '@github/spark/hooks';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ChatLayout } from '@/components/chat/ChatLayout';
import { ConversationTimeline } from '@/components/chat/ConversationTimeline';
import { ChatInput } from '@/components/chat/ChatInput';
import { processChatTurn } from '@/lib/chat/consensusEngine';
import { createNoopAgentMemory } from '@/lib/chat/agentMemory';
import { getAgentProfiles } from '@/lib/chat/agentProfiles';
import { buildSystemContext, setSystemContext } from '@/lib/chat/systemContext';
import { DEFAULT_CONFIG } from '@/lib/mockData';
import { DEFAULT_ORGANIZATION_CONFIG } from '@/lib/organizationProfiles';
import { getRuntimeStateProvider } from '@/runtime/stateProvider';
import type { ChatMessage } from '@/lib/chat/types';
import type { EnvironmentType, Agent, SystemConfig } from '@/lib/types';

function initialSystemMessage(): ChatMessage {
  return {
    id: 'system-welcome',
    role: 'system',
    mode: 'consensus',
    content: 'Chat Estrategico activo. Puedes usar menciones como @director o preguntar sin mencion para consenso multiagente.',
    createdAt: new Date().toISOString(),
  };
}

export function StrategicChatPage() {
  const [messages, setMessages] = useState<ChatMessage[]>([initialSystemMessage()]);
  const [isProcessing, setIsProcessing] = useState(false);

  const memory = useMemo(() => createNoopAgentMemory(), []);
  const sessionIdRef = useRef(`strategic-chat-${Date.now()}`);

  // ── Real system state ──────────────────────────────────────────────────────
  const [currentEnvironment] = useKV<EnvironmentType>(
    'aurora-current-environment',
    'sandbox',
  );
  const [allAccounts] = useKV<Record<string, {
    agents: Agent[];
    currentCapital: number;
    config: SystemConfig;
  }>>('aurora-all-accounts', {});

  // Sync SystemContext module-level store whenever real state changes
  useEffect(() => {
    const env = currentEnvironment ?? 'sandbox';
    const account = allAccounts?.[env];
    const accountConfig = account?.config ?? DEFAULT_CONFIG;
    const accountAgents = account?.agents ?? [];

    const ctx = buildSystemContext({
      currentCapital: account?.currentCapital ?? DEFAULT_CONFIG.totalCapital,
      config: accountConfig,
      activeEnvironment: env,
      organizationProfile: accountConfig?.organization?.profile ?? DEFAULT_ORGANIZATION_CONFIG.profile,
      agents: accountAgents,
    });

    const runtimeState = getRuntimeStateProvider();
    runtimeState.setAgents(accountAgents);
    runtimeState.updateState({
      operationalConfig: {
        simulationMode: accountConfig.simulationMode,
        notifications: accountConfig.notifications,
        telegramConnected: accountConfig.telegramConnected,
        telegram: {
          mode: accountConfig.telegramSettings?.mode ?? 'polling',
          pollingEnabled: accountConfig.telegramSettings?.pollingEnabled ?? true,
          status: accountConfig.telegramSettings?.botToken
            ? (accountConfig.telegramConnected ? 'connected' : 'disconnected')
            : 'not-configured',
          botToken: accountConfig.telegramSettings?.botToken,
          allowedUserId: accountConfig.telegramSettings?.allowedUserId,
          webhookUrl: accountConfig.telegramSettings?.webhookUrl,
          lastCheckAt: accountConfig.telegramSettings?.lastCheckAt,
          lastError: accountConfig.telegramSettings?.lastError,
          botId: accountConfig.telegramSettings?.botId,
          botName: accountConfig.telegramSettings?.botName,
          botUsername: accountConfig.telegramSettings?.botUsername,
        },
      },
    });

    setSystemContext(ctx);
  }, [currentEnvironment, allAccounts]);
  // ──────────────────────────────────────────────────────────────────────────

  const mentionProfiles = useMemo(
    () => getAgentProfiles().filter((profile) => profile.routing.directEnabled),
    []
  );

  const handleSubmit = async (prompt: string) => {
    if (isProcessing) return;

    const turn = processChatTurn(prompt);
    setMessages((prev) => [...prev, turn.userMessage]);
    setIsProcessing(true);

    await memory.recordConversation({
      sessionId: sessionIdRef.current,
      mode: turn.mode,
      userMessage: turn.userMessage,
      agentMessages: turn.agentMessages,
      createdAt: new Date().toISOString(),
    });

    await new Promise((resolve) => setTimeout(resolve, 420));

    setMessages((prev) => [...prev, ...turn.agentMessages]);

    const finalDecision = turn.agentMessages[turn.agentMessages.length - 1];
    if (finalDecision) {
      await memory.recordDecision({
        sessionId: sessionIdRef.current,
        prompt,
        summary: finalDecision.content,
        decidedBy: finalDecision.agentId,
        mode: turn.mode,
        createdAt: new Date().toISOString(),
        tags: [turn.mode],
      });
    }

    setIsProcessing(false);
  };

  return (
    <ChatLayout
      title="CHAT ESTRATEGICO"
      description="Conversa con agentes individuales o activa consenso multiagente para decisiones de trading."
      sidebar={
        <>
          <div>
            <p className="text-xs uppercase tracking-wide text-muted-foreground mb-2">Modo directo</p>
            <div className="flex flex-wrap gap-2">
              {mentionProfiles.map((profile) => (
                <Badge key={profile.identity.id} variant="outline" className="text-xs border-border/60">
                  @{profile.identity.mention}
                </Badge>
              ))}
            </div>
          </div>

          <Separator />

          <div className="space-y-2">
            <p className="text-xs uppercase tracking-wide text-muted-foreground">Modo consenso</p>
            <p className="text-sm text-muted-foreground">
              Sin mención, el sistema consulta agentes habilitados y finaliza con síntesis del Director.
            </p>
          </div>

          <Separator />

          <div className="space-y-2">
            <p className="text-xs uppercase tracking-wide text-muted-foreground">Ejemplos</p>
            <p className="text-sm text-muted-foreground">@director analiza BTC</p>
            <p className="text-sm text-muted-foreground">@riesgo evalua esta operacion</p>
            <p className="text-sm text-muted-foreground">Debemos comprar NVDA?</p>
          </div>
        </>
      }
    >
      <ConversationTimeline messages={messages} isProcessing={isProcessing} />
      <ChatInput onSubmit={handleSubmit} disabled={isProcessing} />
    </ChatLayout>
  );
}
