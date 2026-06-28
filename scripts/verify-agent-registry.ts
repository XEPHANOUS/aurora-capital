import { initializeAgents } from '../src/lib/mockData';

const agents = initializeAgents();

console.log(
  JSON.stringify(
    {
      total: agents.length,
      ids: agents.map((agent) => agent.id),
      analystFound: agents.some((agent) => agent.id === 'analyst'),
    },
    null,
    2,
  ),
);
