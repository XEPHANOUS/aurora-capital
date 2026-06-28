import { getFinalSynthesizerProfile, getAgentProfile } from '@/lib/chat/agentProfiles';
import { resolveChatRoute } from '@/lib/chat/agentRouter';
import { buildMockAgentOutput } from '@/lib/chat/mockAgentResponses';
import type { AgentReply, ChatMessage, ChatMode, ChatTurnResult } from '@/lib/chat/types';
import { getSystemContext } from '@/lib/chat/systemContext';
import { resolveOrganizationWeights, weightedAverageByAgents } from '@/lib/chat/organizationWeights';

function makeId(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function createUserMessage(prompt: string, mode: ChatMode): ChatMessage {
  return {
    id: makeId('user'),
    role: 'user',
    mode,
    content: prompt,
    createdAt: new Date().toISOString(),
  };
}

function createAgentMessage(reply: AgentReply, mode: ChatMode): ChatMessage {
  const confidenceLabel =
    reply.agentId === 'supervisor'
      ? 'Confianza agregada'
      : reply.agentId === 'director'
      ? 'Consenso final'
      : 'Confianza';

  return {
    id: makeId(reply.agentId),
    role: 'agent',
    mode,
    content: `${reply.content}\n${confidenceLabel}: ${reply.confidenceScore}%.`,
    createdAt: new Date().toISOString(),
    agentId: reply.agentId,
    agentName: reply.agentName,
    confidenceScore: reply.confidenceScore,
  };
}

export function runDirectTurn(prompt: string, agentId: AgentReply['agentId']): AgentReply[] {
  const profile = getAgentProfile(agentId);
  const output = buildMockAgentOutput(profile, prompt, 'direct');

  return [
    {
      agentId: profile.identity.id,
      agentName: profile.identity.name,
      content: output.content,
      confidenceScore: output.confidenceScore,
      order: 1,
    },
  ];
}

export function runConsensusTurn(prompt: string): AgentReply[] {
  const ctx = getSystemContext();
  const resolvedWeights = resolveOrganizationWeights(ctx.organizationProfileLabel || ctx.organizationProfile);

  const order: AgentReply['agentId'][] = [
    'news',
    'technical',
    'investor',
    'analyst',
    'archivist',
    'risk',
    'supervisor',
    'survival',
    'auditor',
    'director',
  ];

  const repliesByAgent = new Map<AgentReply['agentId'], AgentReply>();
  const allReplies: AgentReply[] = [];

  const analystIds: AgentReply['agentId'][] = ['news', 'technical', 'investor', 'analyst'];
  const directorInputIds: AgentReply['agentId'][] = ['risk', 'supervisor', 'survival', 'auditor'];

  for (const agentId of order) {
    const profile = getAgentProfile(agentId);

    const analystReports = ['news', 'technical', 'investor', 'analyst']
      .map((id) => repliesByAgent.get(id as AgentReply['agentId']))
      .filter((r): r is AgentReply => Boolean(r));

    const supervisorSummary = repliesByAgent.get('supervisor');
    const survivalReport = repliesByAgent.get('survival');
    const riskReport = repliesByAgent.get('risk');
    const auditorValidation = repliesByAgent.get('auditor');

    const analystScoreMap: Partial<Record<AgentReply['agentId'], number>> = {};
    for (const report of analystReports) {
      analystScoreMap[report.agentId] = report.confidenceScore;
    }
    const weightedAnalystScore = weightedAverageByAgents(
      analystScoreMap,
      resolvedWeights.weights,
      analystIds,
    );

    const finalInputScoreMap: Partial<Record<AgentReply['agentId'], number>> = {
      risk: riskReport?.confidenceScore,
      supervisor: supervisorSummary?.confidenceScore,
      survival: survivalReport?.confidenceScore,
      auditor: auditorValidation?.confidenceScore,
    };
    const weightedFinalScore = weightedAverageByAgents(
      finalInputScoreMap,
      resolvedWeights.weights,
      directorInputIds,
    );

    const output = buildMockAgentOutput(profile, prompt, 'consensus', {
      analystReports,
      riskReport,
      supervisorSummary,
      survivalReport,
      auditorValidation,
      profileLabel: resolvedWeights.profileLabel,
      activeWeights: resolvedWeights.weights,
      weightedAnalystScore,
      weightedFinalScore,
    });

    const reply: AgentReply = {
      agentId: profile.identity.id,
      agentName: profile.identity.name,
      content: output.content,
      confidenceScore: output.confidenceScore,
      order: profile.consensus.order,
    };

    repliesByAgent.set(reply.agentId, reply);
    allReplies.push(reply);
  }

  return allReplies.sort((a, b) => a.order - b.order);
}

export function runDebatePlaceholderTurn(prompt: string): AgentReply[] {
  const finalSynthesizer = getFinalSynthesizerProfile();

  if (!finalSynthesizer) return [];

  return [
    {
      agentId: finalSynthesizer.identity.id,
      agentName: finalSynthesizer.identity.name,
      content: 'Modo debate aun no implementado. Arquitectura lista para habilitar intercambio multi-ronda.',
      confidenceScore: 60,
      order: finalSynthesizer.consensus.order,
    },
  ];
}

export function processChatTurn(rawPrompt: string): ChatTurnResult {
  const route = resolveChatRoute(rawPrompt);
  const cleanedPrompt = route.cleanedPrompt || rawPrompt.trim();

  const userMessage = createUserMessage(rawPrompt, route.mode);

  let replies: AgentReply[] = [];

  if (route.mode === 'direct') {
    replies = runDirectTurn(cleanedPrompt, route.targetAgentId);
  } else if (route.mode === 'consensus') {
    replies = runConsensusTurn(cleanedPrompt);
  } else {
    replies = runDebatePlaceholderTurn(cleanedPrompt);
  }

  return {
    mode: route.mode,
    userMessage,
    agentMessages: replies.map((reply) => createAgentMessage(reply, route.mode)),
  };
}
