import { useMemo, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Label } from '@/components/ui/label';
import { Brain, GitBranch, Sparkle } from '@phosphor-icons/react';
import { cn } from '@/lib/utils';
import type { Agent, AgentType, AIAgentType, LLMModel, LLMProvider, AgentExecutionRole } from '@/lib/types';
import { getDirectReports } from '@/lib/organizationProfiles';
import { AGENT_ICONS, AGENT_TYPE_COLORS, LLM_MODELS } from '@/components/settings/agents/constants';

interface AgentAssignmentPageProps {
  agents: Agent[];
  onUpdateAgent: (agentId: string, updates: Partial<Agent>) => void;
  localModelFiles?: Array<{
    name: string;
    sizeBytes: number;
    mimeType?: string;
    loadedAt: string;
  }>;
}

const EXECUTION_ROLES: AgentExecutionRole[] = ['observer', 'analyst', 'executor', 'guardian', 'director'];

export function AgentAssignmentPage({ agents, onUpdateAgent, localModelFiles }: AgentAssignmentPageProps) {
  const [selectedAgent, setSelectedAgent] = useState<AgentType>('director');

  const agent = useMemo(() => agents.find((a) => a.id === selectedAgent), [agents, selectedAgent]);
  if (!agent) return null;

  const hierarchy = useMemo(
    () =>
      agents.reduce((acc, a) => {
        acc[a.id] = a.reportsTo || null;
        return acc;
      }, {} as Record<AgentType, AgentType | null>),
    [agents]
  );

  const directReports = getDirectReports(agent.id, hierarchy);

  const handleModelProviderChange = (provider: LLMProvider) => {
    onUpdateAgent(agent.id, {
      modelConfig: {
        ...agent.modelConfig,
        provider,
        model: LLM_MODELS[provider][0],
        temperature: agent.modelConfig?.temperature ?? 0.7,
        contextSize: agent.modelConfig?.contextSize ?? 4096,
      },
    });
  };

  const handleModelChange = (model: LLMModel) => {
    if (!agent.modelConfig) return;
    onUpdateAgent(agent.id, { modelConfig: { ...agent.modelConfig, model } });
  };

  const handleAgentTypeChange = (agentType: AIAgentType) => onUpdateAgent(agent.id, { agentType });

  const handleExecutionRoleChange = (role: AgentExecutionRole) => {
    onUpdateAgent(agent.id, { executionRole: role });
  };

  const parseBlockedAssets = (raw: string): string[] => {
    return raw
      .split(',')
      .map((item) => item.trim().toUpperCase())
      .filter(Boolean)
      .slice(0, 20);
  };

  const Icon = AGENT_ICONS[agent.id];

  return (
    <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 flex-1 min-h-0">
      <Card className="p-4 bg-card/50 backdrop-blur-sm flex flex-col min-h-0">
        <h3 className="font-heading font-semibold text-sm mb-4 uppercase tracking-wide flex-shrink-0">Select Agent</h3>
        <div className="space-y-2 overflow-y-auto scrollbar-custom flex-1 min-h-0">
          {agents.map((a) => {
            const AgentIcon = AGENT_ICONS[a.id];
            return (
              <button
                key={a.id}
                onClick={() => setSelectedAgent(a.id)}
                className={cn(
                  'w-full flex items-center gap-3 p-3 rounded-lg border transition-all',
                  selectedAgent === a.id ? 'bg-primary/10 border-primary' : 'bg-background/50 border-border hover:border-primary/50'
                )}
              >
                <AgentIcon size={20} weight={selectedAgent === a.id ? 'fill' : 'regular'} className="flex-shrink-0" />
                <div className="flex-1 text-left min-w-0">
                  <p className="text-sm font-medium truncate">{a.name}</p>
                  <p className="text-xs text-muted-foreground truncate">{a.description}</p>
                </div>
                <Badge variant="outline" className={cn(AGENT_TYPE_COLORS[a.agentType], 'flex-shrink-0 text-xs')}>
                  {a.agentType}
                </Badge>
              </button>
            );
          })}
        </div>
      </Card>

      <Card className="xl:col-span-2 p-6 bg-card/50 backdrop-blur-sm flex flex-col min-h-0">
        <div className="flex items-center gap-4 mb-6 flex-shrink-0">
          <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center flex-shrink-0">
            <Icon size={24} className="text-primary" />
          </div>
          <div className="min-w-0 flex-1">
            <h2 className="font-heading font-bold text-xl truncate">{agent.name}</h2>
            <p className="text-sm text-muted-foreground truncate">{agent.description}</p>
          </div>
        </div>

        <Separator className="mb-6 flex-shrink-0" />

        <div className="flex-1 min-h-0 overflow-y-auto scrollbar-custom space-y-6">
          <div>
            <Label className="text-xs uppercase tracking-wide text-muted-foreground mb-2">Agent Type</Label>
            <div className="flex gap-2">
              {(['llm', 'rule-based', 'hybrid'] as AIAgentType[]).map((type) => (
                <Button
                  key={type}
                  variant={agent.agentType === type ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => handleAgentTypeChange(type)}
                  className="flex-1"
                >
                  {type === 'llm' && <Brain size={16} className="mr-2" />}
                  {type === 'rule-based' && <GitBranch size={16} className="mr-2" />}
                  {type === 'hybrid' && <Sparkle size={16} className="mr-2" />}
                  {type.toUpperCase()}
                </Button>
              ))}
            </div>
          </div>

          {agent.agentType !== 'rule-based' && (
            <>
              <Separator />

              <div>
                <Label className="text-xs uppercase tracking-wide text-muted-foreground mb-2">LLM Provider</Label>
                <Select value={agent.modelConfig?.provider ?? 'openai'} onValueChange={(value) => handleModelProviderChange(value as LLMProvider)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="openai">OpenAI</SelectItem>
                    <SelectItem value="anthropic">Anthropic</SelectItem>
                    <SelectItem value="ollama">Ollama</SelectItem>
                    <SelectItem value="lmstudio">LM Studio</SelectItem>
                    <SelectItem value="local">Local Models</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label className="text-xs uppercase tracking-wide text-muted-foreground mb-2">Model Selection</Label>
                <Select value={agent.modelConfig?.model ?? 'gpt-4o'} onValueChange={(value) => handleModelChange(value as LLMModel)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {LLM_MODELS[agent.modelConfig?.provider ?? 'openai'].map((model) => (
                      <SelectItem key={model} value={model}>
                        {model}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {agent.modelConfig?.provider === 'local' && (
                <div>
                  <Label className="text-xs uppercase tracking-wide text-muted-foreground mb-2">Local Model File</Label>
                  <Select
                    value={agent.modelConfig?.localModelPath ?? 'none'}
                    onValueChange={(value) =>
                      onUpdateAgent(agent.id, {
                        modelConfig: {
                          ...agent.modelConfig,
                          localModelPath: value === 'none' ? undefined : value,
                        },
                      })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecciona archivo local" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Sin asignar</SelectItem>
                      {(localModelFiles ?? []).map((file) => (
                        <SelectItem key={file.name} value={file.name}>
                          {file.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              <div>
                <div className="flex justify-between items-center mb-2">
                  <Label className="text-xs uppercase tracking-wide text-muted-foreground">Temperature</Label>
                  <span className="text-sm font-mono">{agent.modelConfig?.temperature?.toFixed(2) ?? '0.70'}</span>
                </div>
                <Slider
                  value={[agent.modelConfig?.temperature ?? 0.7]}
                  onValueChange={(value) => onUpdateAgent(agent.id, { modelConfig: { ...agent.modelConfig, temperature: value[0] } })}
                  min={0}
                  max={2}
                  step={0.1}
                  className="w-full"
                />
              </div>

              <div>
                <div className="flex justify-between items-center mb-2">
                  <Label className="text-xs uppercase tracking-wide text-muted-foreground">Context Size</Label>
                  <span className="text-sm font-mono">{agent.modelConfig?.contextSize ?? 4096}</span>
                </div>
                <Slider
                  value={[agent.modelConfig?.contextSize ?? 4096]}
                  onValueChange={(value) => onUpdateAgent(agent.id, { modelConfig: { ...agent.modelConfig, contextSize: value[0] } })}
                  min={1024}
                  max={128000}
                  step={1024}
                  className="w-full"
                />
              </div>
            </>
          )}

          <Separator />

          <div>
            <Label className="text-xs uppercase tracking-wide text-muted-foreground mb-2">Execution Role</Label>
            <Select
              value={agent.executionRole ?? 'analyst'}
              onValueChange={(value) => handleExecutionRoleChange(value as AgentExecutionRole)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {EXECUTION_ROLES.map((role) => (
                  <SelectItem key={role} value={role}>{role}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <Label className="text-xs uppercase tracking-wide text-muted-foreground mb-2">Max Risk % (agent)</Label>
              <input
                type="number"
                min={0}
                max={100}
                step={0.1}
                className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm"
                value={agent.guardrails?.maxRiskPercent ?? ''}
                onChange={(event) => {
                  const value = event.target.value;
                  onUpdateAgent(agent.id, {
                    guardrails: {
                      ...agent.guardrails,
                      maxRiskPercent: value === '' ? undefined : Number.parseFloat(value),
                    },
                  });
                }}
              />
            </div>
            <div>
              <Label className="text-xs uppercase tracking-wide text-muted-foreground mb-2">Max Position Size</Label>
              <input
                type="number"
                min={0}
                step={1}
                className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm"
                value={agent.guardrails?.maxPositionSize ?? ''}
                onChange={(event) => {
                  const value = event.target.value;
                  onUpdateAgent(agent.id, {
                    guardrails: {
                      ...agent.guardrails,
                      maxPositionSize: value === '' ? undefined : Number.parseFloat(value),
                    },
                  });
                }}
              />
            </div>
            <div className="md:col-span-2">
              <Label className="text-xs uppercase tracking-wide text-muted-foreground mb-2">Blocked Assets (CSV)</Label>
              <input
                type="text"
                className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm"
                placeholder="BTC/USDT, ETH/USDT"
                value={(agent.guardrails?.blockedAssets ?? []).join(', ')}
                onChange={(event) => {
                  onUpdateAgent(agent.id, {
                    guardrails: {
                      ...agent.guardrails,
                      blockedAssets: parseBlockedAssets(event.target.value),
                    },
                  });
                }}
              />
            </div>
          </div>

          <div>
            <div className="flex justify-between items-center mb-2">
              <Label className="text-xs uppercase tracking-wide text-muted-foreground">Priority</Label>
              <span className="text-sm font-mono">{agent.priority}</span>
            </div>
            <Slider value={[agent.priority]} onValueChange={(value) => onUpdateAgent(agent.id, { priority: value[0] })} min={1} max={100} step={1} className="w-full" />
          </div>

          <div>
            <div className="flex justify-between items-center mb-2">
              <Label className="text-xs uppercase tracking-wide text-muted-foreground">Influence Score</Label>
              <span className="text-sm font-mono font-bold text-primary">{agent.influence}</span>
            </div>
            <Slider value={[agent.influence]} onValueChange={(value) => onUpdateAgent(agent.id, { influence: value[0] })} min={0} max={100} step={5} className="w-full" />
          </div>

          {directReports.length > 0 && (
            <div>
              <Label className="text-xs uppercase tracking-wide text-muted-foreground mb-2">Direct Reports</Label>
              <div className="flex flex-wrap gap-2">
                {directReports.map((reportId) => {
                  const report = agents.find((a) => a.id === reportId);
                  if (!report) return null;
                  return (
                    <Badge key={reportId} variant="outline" className="text-xs">
                      {report.name}
                    </Badge>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </Card>
    </div>
  );
}
