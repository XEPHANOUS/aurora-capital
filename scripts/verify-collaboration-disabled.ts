import { processChatTurn } from '../src/lib/chat/consensusEngine';
import { runAgentCollaborationCycle } from '../src/lib/collaboration/agentCollaborationEngine';

const turn = processChatTurn('Analiza BTC sin activar colaboracion');
const cycle = runAgentCollaborationCycle('Analiza BTC sin activar colaboracion', turn, { enabled: false });

console.log(
  JSON.stringify(
    {
      mode: turn.mode,
      agentCount: turn.agentMessages.length,
      collaborationCycleCreated: cycle !== null,
      finalAgent: turn.agentMessages[turn.agentMessages.length - 1]?.agentId ?? null,
    },
    null,
    2,
  ),
);