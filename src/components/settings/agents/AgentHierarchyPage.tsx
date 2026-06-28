import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import type { Agent, AgentType } from '@/lib/types';
import { getDirectReports } from '@/lib/organizationProfiles';
import { AGENT_ICONS, AGENT_TYPE_COLORS } from '@/components/settings/agents/constants';

interface AgentHierarchyPageProps {
  agents: Agent[];
}

export function AgentHierarchyPage({ agents }: AgentHierarchyPageProps) {
  const hierarchy = agents.reduce((acc, a) => {
    acc[a.id] = a.reportsTo || null;
    return acc;
  }, {} as Record<AgentType, AgentType | null>);

  const getLevel = (agentId: AgentType, visited = new Set<AgentType>()): number => {
    if (visited.has(agentId)) return 0;
    visited.add(agentId);
    const reportsTo = hierarchy[agentId];
    if (!reportsTo) return 0;
    return 1 + getLevel(reportsTo, visited);
  };

  const levels: Record<number, Agent[]> = {};
  agents.forEach((agent) => {
    const level = getLevel(agent.id);
    if (!levels[level]) levels[level] = [];
    levels[level].push(agent);
  });

  return (
    <div className="space-y-6">
      <Card className="p-6 bg-card/50 backdrop-blur-sm">
        <h3 className="font-heading font-semibold text-lg mb-6">Organizational Hierarchy</h3>
        <div className="space-y-8">
          {Object.entries(levels)
            .sort(([a], [b]) => Number(a) - Number(b))
            .map(([level, levelAgents]) => (
              <div key={level} className="space-y-4">
                <div className="flex items-center gap-3">
                  <Badge variant="outline" className="text-xs">
                    Level {level}
                  </Badge>
                  <Separator className="flex-1" />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {levelAgents.map((agent) => {
                    const Icon = AGENT_ICONS[agent.id];
                    const reportsTo = agents.find((a) => a.id === agent.reportsTo);
                    const reports = getDirectReports(agent.id, hierarchy);

                    return (
                      <Card key={agent.id} className="p-4 bg-background/50">
                        <div className="flex items-start gap-3">
                          <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center flex-shrink-0">
                            <Icon size={20} className="text-primary" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-sm">{agent.name}</p>
                            <p className="text-xs text-muted-foreground truncate">{agent.description}</p>
                            {reportsTo && (
                              <p className="text-xs text-muted-foreground mt-2">
                                Reports to: <span className="text-primary font-medium">{reportsTo.name}</span>
                              </p>
                            )}
                            {reports.length > 0 && (
                              <p className="text-xs text-muted-foreground">
                                Manages: <span className="text-accent font-medium">{reports.length} agent{reports.length > 1 ? 's' : ''}</span>
                              </p>
                            )}
                          </div>
                          <Badge variant="outline" className={AGENT_TYPE_COLORS[agent.agentType]}>
                            {agent.agentType.split('-')[0]}
                          </Badge>
                        </div>
                      </Card>
                    );
                  })}
                </div>
              </div>
            ))}
        </div>
      </Card>
    </div>
  );
}
