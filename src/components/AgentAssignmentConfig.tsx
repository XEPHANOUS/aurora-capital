import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Brain, 
  GitBranch, 
  Sparkle,
  Flask,
  ShieldCheck,
  TrendUp,
  Newspaper,
  ChartLine,
  ShieldWarning,
  Archive,
  Target,
  UserCircle,
  Eye
} from '@phosphor-icons/react';
import { cn } from '@/lib/utils';
import type { Agent, AgentType, AIAgentType, LLMProvider, LLMModel, OrganizationalProfile } from '@/lib/types';
import { PROFILE_PRESETS, PROFILE_DESCRIPTIONS, getDirectReports } from '@/lib/organizationProfiles';

const AGENT_ICONS: Record<AgentType, React.ElementType> = {
  director: UserCircle,
  auditor: Eye,
  supervisor: ShieldCheck,
  survival: ShieldWarning,
  risk: ChartLine,
  archivist: Archive,
  news: Newspaper,
  technical: TrendUp,
  investor: Target,
};

const AGENT_TYPE_COLORS: Record<AIAgentType, string> = {
  'llm': 'border-primary text-primary',
  'rule-based': 'border-accent text-accent',
  'hybrid': 'border-warning text-warning',
};

const LLM_MODELS: Record<LLMProvider, LLMModel[]> = {
  'openai': ['gpt-4o', 'gpt-4o-mini', 'gpt-4-turbo'],
  'anthropic': ['claude-3-opus', 'claude-3-sonnet', 'claude-3-haiku'],
  'ollama': ['llama-3-70b', 'llama-3-8b', 'mixtral-8x7b', 'custom'],
  'lmstudio': ['custom'],
  'local': ['custom'],
};

interface AgentAssignmentConfigProps {
  agents: Agent[];
  onUpdateAgent: (agentId: AgentType, updates: Partial<Agent>) => void;
  onProfileChange: (profile: OrganizationalProfile) => void;
  currentProfile: OrganizationalProfile;
}

export function AgentAssignmentConfig({
  agents,
  onUpdateAgent,
  onProfileChange,
  currentProfile
}: AgentAssignmentConfigProps) {
  const [selectedAgent, setSelectedAgent] = useState<AgentType>('director');
  
  const agent = agents.find(a => a.id === selectedAgent);
  if (!agent) return null;
  
  const currentWeights = PROFILE_PRESETS[currentProfile];
  const directReports = getDirectReports(agent.id, agents.reduce((acc, a) => {
    acc[a.id] = a.reportsTo || null;
    return acc;
  }, {} as Record<AgentType, AgentType | null>));
  
  const handleModelProviderChange = (provider: LLMProvider) => {
    onUpdateAgent(agent.id, {
      modelConfig: {
        ...agent.modelConfig,
        provider,
        model: LLM_MODELS[provider][0],
        temperature: agent.modelConfig?.temperature ?? 0.7,
        contextSize: agent.modelConfig?.contextSize ?? 4096,
      }
    });
  };
  
  const handleModelChange = (model: LLMModel) => {
    if (!agent.modelConfig) return;
    onUpdateAgent(agent.id, {
      modelConfig: { ...agent.modelConfig, model }
    });
  };
  
  const handleTemperatureChange = (value: number[]) => {
    if (!agent.modelConfig) return;
    onUpdateAgent(agent.id, {
      modelConfig: { ...agent.modelConfig, temperature: value[0] }
    });
  };
  
  const handleContextSizeChange = (value: number[]) => {
    if (!agent.modelConfig) return;
    onUpdateAgent(agent.id, {
      modelConfig: { ...agent.modelConfig, contextSize: value[0] }
    });
  };
  
  const handlePriorityChange = (value: number[]) => {
    onUpdateAgent(agent.id, { priority: value[0] });
  };
  
  const handleInfluenceChange = (value: number[]) => {
    onUpdateAgent(agent.id, { influence: value[0] });
  };
  
  const handleAgentTypeChange = (agentType: AIAgentType) => {
    onUpdateAgent(agent.id, { agentType });
  };
  
  const Icon = AGENT_ICONS[agent.id];
  
  return (
    <div className="space-y-6">
      <Tabs defaultValue="assignment" className="space-y-6">
        <TabsList className="bg-card/50 backdrop-blur-sm border border-border w-full justify-start overflow-x-auto flex-nowrap">
          <TabsTrigger value="assignment" className="whitespace-nowrap">Individual Assignment</TabsTrigger>
          <TabsTrigger value="organization" className="whitespace-nowrap">Organization Profiles</TabsTrigger>
          <TabsTrigger value="hierarchy" className="whitespace-nowrap">Hierarchy View</TabsTrigger>
          <TabsTrigger value="influence" className="whitespace-nowrap">Influence System</TabsTrigger>
        </TabsList>
        
        <TabsContent value="assignment" className="space-y-6">
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
            <Card className="p-4 bg-card/50 backdrop-blur-sm">
              <h3 className="font-heading font-semibold text-sm mb-4 uppercase tracking-wide">Select Agent</h3>
              <div className="space-y-2 max-h-96 overflow-y-auto pr-2">
                {agents.map((a) => {
                  const AgIcon = AGENT_ICONS[a.id];
                  return (
                    <button
                      key={a.id}
                      onClick={() => setSelectedAgent(a.id)}
                      className={cn(
                        "w-full flex items-center gap-3 p-3 rounded-lg border transition-all",
                        selectedAgent === a.id 
                          ? "bg-primary/10 border-primary" 
                          : "bg-background/50 border-border hover:border-primary/50"
                      )}
                    >
                      <AgIcon size={20} weight={selectedAgent === a.id ? "fill" : "regular"} className="flex-shrink-0" />
                      <div className="flex-1 text-left min-w-0">
                        <p className="text-sm font-medium truncate">{a.name}</p>
                        <p className="text-xs text-muted-foreground truncate">{a.description}</p>
                      </div>
                      <Badge variant="outline" className={cn(AGENT_TYPE_COLORS[a.agentType], "flex-shrink-0 text-xs")}>
                        {a.agentType}
                      </Badge>
                    </button>
                  );
                })}
              </div>
            </Card>
            
            <Card className="xl:col-span-2 p-6 bg-card/50 backdrop-blur-sm space-y-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                  <Icon size={24} className="text-primary" />
                </div>
                <div>
                  <h2 className="font-heading font-bold text-xl">{agent.name}</h2>
                  <p className="text-sm text-muted-foreground">{agent.description}</p>
                </div>
              </div>
              
              <Separator />
              
              <div className="space-y-4">
                <div>
                  <Label className="text-xs uppercase tracking-wide text-muted-foreground mb-2">Agent Type</Label>
                  <div className="flex gap-2">
                    {(['llm', 'rule-based', 'hybrid'] as AIAgentType[]).map((type) => (
                      <Button
                        key={type}
                        variant={agent.agentType === type ? "default" : "outline"}
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
                      <Select 
                        value={agent.modelConfig?.provider ?? 'openai'}
                        onValueChange={(value) => handleModelProviderChange(value as LLMProvider)}
                      >
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
                      <p className="text-xs text-muted-foreground mt-1">Future compatibility - not connected yet</p>
                    </div>
                    
                    <div>
                      <Label className="text-xs uppercase tracking-wide text-muted-foreground mb-2">Model Selection</Label>
                      <Select 
                        value={agent.modelConfig?.model ?? 'gpt-4o'}
                        onValueChange={(value) => handleModelChange(value as LLMModel)}
                      >
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
                    
                    <div>
                      <div className="flex justify-between items-center mb-2">
                        <Label className="text-xs uppercase tracking-wide text-muted-foreground">Temperature</Label>
                        <span className="text-sm font-mono">{agent.modelConfig?.temperature?.toFixed(2) ?? '0.70'}</span>
                      </div>
                      <Slider
                        value={[agent.modelConfig?.temperature ?? 0.7]}
                        onValueChange={handleTemperatureChange}
                        min={0}
                        max={2}
                        step={0.1}
                        className="w-full"
                      />
                      <p className="text-xs text-muted-foreground mt-1">Lower = more focused, Higher = more creative</p>
                    </div>
                    
                    <div>
                      <div className="flex justify-between items-center mb-2">
                        <Label className="text-xs uppercase tracking-wide text-muted-foreground">Context Size</Label>
                        <span className="text-sm font-mono">{agent.modelConfig?.contextSize ?? 4096}</span>
                      </div>
                      <Slider
                        value={[agent.modelConfig?.contextSize ?? 4096]}
                        onValueChange={handleContextSizeChange}
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
                  <div className="flex justify-between items-center mb-2">
                    <Label className="text-xs uppercase tracking-wide text-muted-foreground">Priority</Label>
                    <span className="text-sm font-mono">{agent.priority}</span>
                  </div>
                  <Slider
                    value={[agent.priority]}
                    onValueChange={handlePriorityChange}
                    min={1}
                    max={100}
                    step={1}
                    className="w-full"
                  />
                  <p className="text-xs text-muted-foreground mt-1">Execution order in decision pipeline</p>
                </div>
                
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <Label className="text-xs uppercase tracking-wide text-muted-foreground">Influence Score</Label>
                    <span className="text-sm font-mono font-bold text-primary">{agent.influence}</span>
                  </div>
                  <Slider
                    value={[agent.influence]}
                    onValueChange={handleInfluenceChange}
                    min={0}
                    max={100}
                    step={5}
                    className="w-full"
                  />
                  <p className="text-xs text-muted-foreground mt-1">Weight in consensus calculations</p>
                </div>
                
                <Separator />
                
                <div>
                  <Label className="text-xs uppercase tracking-wide text-muted-foreground mb-2">Status</Label>
                  <Badge 
                    variant="outline" 
                    className={cn(
                      agent.status === 'active' ? 'border-accent text-accent' : 
                      agent.status === 'alert' ? 'border-warning text-warning' : 
                      'border-muted-foreground text-muted-foreground'
                    )}
                  >
                    {agent.status}
                  </Badge>
                </div>
                
                {directReports.length > 0 && (
                  <div>
                    <Label className="text-xs uppercase tracking-wide text-muted-foreground mb-2">Direct Reports</Label>
                    <div className="flex flex-wrap gap-2">
                      {directReports.map((reportId) => {
                        const report = agents.find(a => a.id === reportId);
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
        </TabsContent>
        
        <TabsContent value="organization" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {(['conservative', 'balanced', 'aggressive', 'survival-first'] as OrganizationalProfile[]).map((profile) => (
              <Card
                key={profile}
                className={cn(
                  "p-4 cursor-pointer transition-all border-2",
                  currentProfile === profile 
                    ? "bg-primary/10 border-primary" 
                    : "bg-card/50 backdrop-blur-sm border-border hover:border-primary/50"
                )}
                onClick={() => onProfileChange(profile)}
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="font-heading font-semibold text-sm uppercase tracking-wide">
                      {profile.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')}
                    </h3>
                    {currentProfile === profile && (
                      <Badge variant="default" className="text-xs">Active</Badge>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground">{PROFILE_DESCRIPTIONS[profile]}</p>
                  
                  <Separator />
                  
                  <div className="space-y-1">
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">Top Influences</p>
                    {Object.entries(PROFILE_PRESETS[profile])
                      .sort(([,a], [,b]) => b - a)
                      .slice(0, 3)
                      .map(([agentId, weight]) => (
                        <div key={agentId} className="flex items-center justify-between text-xs">
                          <span className="capitalize">{agentId}</span>
                          <span className="font-mono font-semibold">{weight}</span>
                        </div>
                      ))}
                  </div>
                </div>
              </Card>
            ))}
          </div>
          
          <Card className="p-6 bg-card/50 backdrop-blur-sm">
            <h3 className="font-heading font-semibold text-lg mb-4">Current Weight Distribution</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {Object.entries(currentWeights).map(([agentId, weight]) => {
                const AgIcon = AGENT_ICONS[agentId as AgentType];
                const agentData = agents.find(a => a.id === agentId);
                return (
                  <div key={agentId} className="space-y-2">
                    <div className="flex items-center gap-2">
                      <AgIcon size={16} className="text-primary" />
                      <span className="text-sm font-medium capitalize">{agentData?.name ?? agentId}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="flex-1 h-2 bg-background rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-primary rounded-full transition-all duration-500"
                          style={{ width: `${weight}%` }}
                        />
                      </div>
                      <span className="text-xs font-mono font-semibold w-8">{weight}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </Card>
        </TabsContent>
        
        <TabsContent value="hierarchy" className="space-y-6">
          <OrganizationHierarchy agents={agents} />
        </TabsContent>
        
        <TabsContent value="influence" className="space-y-6">
          <InfluenceVisualization agents={agents} weights={currentWeights} />
        </TabsContent>
      </Tabs>
    </div>
  );
}

function OrganizationHierarchy({ agents }: { agents: Agent[] }) {
  const director = agents.find(a => a.id === 'director');
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
  agents.forEach(agent => {
    const level = getLevel(agent.id);
    if (!levels[level]) levels[level] = [];
    levels[level].push(agent);
  });
  
  return (
    <Card className="p-6 bg-card/50 backdrop-blur-sm">
      <h3 className="font-heading font-semibold text-lg mb-6">Organizational Hierarchy</h3>
      <div className="space-y-8">
        {Object.entries(levels).sort(([a], [b]) => Number(a) - Number(b)).map(([level, levelAgents]) => (
          <div key={level} className="space-y-4">
            <div className="flex items-center gap-3">
              <Badge variant="outline" className="text-xs">Level {level}</Badge>
              <Separator className="flex-1" />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {levelAgents.map((agent) => {
                const Icon = AGENT_ICONS[agent.id];
                const reportsTo = agents.find(a => a.id === agent.reportsTo);
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
  );
}

function InfluenceVisualization({ agents, weights }: { agents: Agent[], weights: Partial<Record<AgentType, number>> }) {
  const totalInfluence = Object.values(weights).reduce((sum, w) => sum + w, 0);
  const avgInfluence = totalInfluence / Object.keys(weights).length;
  
  const sortedAgents = [...agents].sort((a, b) => 
    (weights[b.id] || 0) - (weights[a.id] || 0)
  );
  
  return (
    <div className="space-y-6">
      <Card className="p-6 bg-card/50 backdrop-blur-sm">
        <h3 className="font-heading font-semibold text-lg mb-4">Influence Impact on Consensus</h3>
        <p className="text-sm text-muted-foreground mb-6">
          Agent influence multiplies with reputation and confidence to calculate weighted votes in the decision process.
        </p>
        
        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="p-4 bg-background/50 rounded-lg">
            <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">Total Influence</p>
            <p className="font-mono font-bold text-2xl">{totalInfluence}</p>
          </div>
          <div className="p-4 bg-background/50 rounded-lg">
            <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">Average Influence</p>
            <p className="font-mono font-bold text-2xl">{avgInfluence.toFixed(0)}</p>
          </div>
          <div className="p-4 bg-background/50 rounded-lg">
            <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">Agents</p>
            <p className="font-mono font-bold text-2xl">{agents.length}</p>
          </div>
        </div>
        
        <Separator className="my-6" />
        
        <div className="space-y-4">
          {sortedAgents.map((agent) => {
            const Icon = AGENT_ICONS[agent.id];
            const weight = weights[agent.id] || 0;
            const percentage = (weight / totalInfluence) * 100;
            const isAboveAverage = weight > avgInfluence;
            
            return (
              <div key={agent.id} className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Icon size={16} className="text-primary" />
                    <span className="text-sm font-medium">{agent.name}</span>
                    {isAboveAverage && (
                      <Badge variant="outline" className="text-xs border-accent text-accent">
                        High Impact
                      </Badge>
                    )}
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-xs text-muted-foreground">{percentage.toFixed(1)}%</span>
                    <span className="font-mono font-semibold text-sm w-12 text-right">{weight}</span>
                  </div>
                </div>
                <div className="relative h-3 bg-background rounded-full overflow-hidden">
                  <div 
                    className={cn(
                      "h-full rounded-full transition-all duration-500",
                      isAboveAverage ? "bg-accent" : "bg-primary"
                    )}
                    style={{ width: `${percentage}%` }}
                  />
                  <div 
                    className="absolute top-0 left-0 h-full w-0.5 bg-warning/50"
                    style={{ left: `${(avgInfluence / totalInfluence) * 100}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
        
        <div className="mt-6 p-4 bg-muted/30 rounded-lg">
          <p className="text-xs text-muted-foreground">
            <span className="text-warning font-semibold">Yellow line</span> indicates average influence. 
            Agents above this threshold have outsized impact on consensus decisions.
          </p>
        </div>
      </Card>
      
      <Card className="p-6 bg-card/50 backdrop-blur-sm">
        <h3 className="font-heading font-semibold text-base mb-3">Formula</h3>
        <div className="p-4 bg-background/50 rounded-lg font-mono text-sm space-y-2">
          <p>Weighted Vote = <span className="text-primary">Influence</span> × <span className="text-accent">Reputation</span> × <span className="text-warning">Confidence</span></p>
          <Separator className="my-3" />
          <p className="text-xs text-muted-foreground">Example:</p>
          <p className="text-xs">Agent with Influence=90, Reputation=85%, Confidence=95%</p>
          <p className="text-xs">= 90 × 0.85 × 0.95 = <span className="text-primary font-semibold">72.68</span></p>
        </div>
      </Card>
    </div>
  );
}
