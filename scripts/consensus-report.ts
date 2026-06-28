import { processChatTurn } from '../src/lib/chat/consensusEngine';

const prompt = process.argv.slice(2).join(' ').trim() || 'Analiza BTC en contexto actual';
const turn = processChatTurn(prompt);

const executedAgents = turn.agentMessages.map((message, index) => ({
  order: index + 1,
  agentId: message.agentId,
  agentName: message.agentName,
  confidence: message.confidenceScore,
}));

console.log(
  JSON.stringify(
    {
      prompt,
      mode: turn.mode,
      totalAgentsExecuted: executedAgents.length,
      executedAgents,
    },
    null,
    2,
  ),
);
