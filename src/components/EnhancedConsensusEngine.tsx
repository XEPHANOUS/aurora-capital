import { useState } from 'react';
import { useKV } from '@github/spark/hooks';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { CheckCircle, XCircle, Warning, Shield, Scales, Lightbulb } from '@phosphor-icons/react';
import { cn } from '@/lib/utils';
import type { 
  Agent, 
  SystemConfig, 
  AgentType, 
  OperationType,
  LearningEngineState,
  ConsensusCalculation,
  VetoCheckResult,
  TradeQuality,
  DecisionExplanation 
} from '@/lib/types';
import { calculateAdaptiveConsensus, generateDecisionExplanation, getAgentVoteColor, getAgentVoteIcon } from '@/lib/services/consensusEngine';
import { evaluateVetos, calculateTradeQuality, getTradeQualityColor, getVetoTypeLabel } from '@/lib/services/vetoEngine';

interface EnhancedConsensusEngineProps {
  agents: Agent[];
  config: SystemConfig;
  currentCapital: number;
  learningState: LearningEngineState;
}

export function EnhancedConsensusEngine({ agents, config, currentCapital, learningState }: EnhancedConsensusEngineProps) {
  const [proposal] = useState<{
    asset: string;
    action: OperationType;
    amount: number;
  }>({
    asset: 'BTC',
    action: 'BUY',
    amount: 50000,
  });

  const mockVotes = agents.map(agent => ({
    agentId: agent.id,
    vote: (Math.random() > 0.3 ? 'APPROVE' : Math.random() > 0.5 ? 'REJECT' : 'VETO') as 'APPROVE' | 'REJECT' | 'VETO',
    confidence: Math.floor(60 + Math.random() * 40),
  }));

  const consensus: ConsensusCalculation = calculateAdaptiveConsensus(
    agents,
    learningState.agentPerformance,
    mockVotes
  );

  const vetoCheck: VetoCheckResult = evaluateVetos(
    proposal,
    config,
    currentCapital,
    consensus,
    mockVotes.map(v => ({
      agentId: v.agentId,
      recommendation: v.vote === 'APPROVE' ? 'approve' : v.vote === 'REJECT' ? 'reject' : 'veto',
    }))
  );

  const tradeQuality: TradeQuality = calculateTradeQuality(
    consensus.weightedConsensus,
    25,
    30,
    consensus.votes.reduce((sum, v) => sum + v.confidence, 0) / consensus.votes.length,
    2.5,
    (consensus.votes.filter(v => v.vote === 'APPROVE').length / consensus.votes.length) * 100
  );

  const explanation: DecisionExplanation = generateDecisionExplanation(
    consensus,
    tradeQuality,
    vetoCheck,
    agents
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 bg-gradient-to-br from-primary to-accent rounded-lg flex items-center justify-center">
          <Scales size={24} weight="bold" className="text-primary-foreground" />
        </div>
        <div>
          <h2 className="font-heading font-bold text-2xl">ENHANCED CONSENSUS ENGINE</h2>
          <p className="text-sm text-muted-foreground">
            Sistema de consenso adaptativo con aprendizaje y vetos jerárquicos
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="p-6 bg-card/50 backdrop-blur-sm">
          <h3 className="font-heading font-semibold text-lg mb-4">PROPUESTA</h3>
          
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">Activo</span>
              <span className="font-mono font-bold">{proposal.asset}</span>
            </div>

            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">Acción</span>
              <Badge variant={proposal.action === 'BUY' ? 'default' : 'destructive'}>
                {proposal.action}
              </Badge>
            </div>

            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">Monto</span>
              <span className="font-mono font-semibold">${proposal.amount.toLocaleString()}</span>
            </div>
          </div>
        </Card>

        <Card className={cn(
          "p-6 backdrop-blur-sm",
          consensus.weightedConsensus >= 70 ? "bg-accent/10 border-accent" :
          consensus.weightedConsensus >= 50 ? "bg-yellow-500/10 border-yellow-500" :
          "bg-destructive/10 border-destructive"
        )}>
          <h3 className="font-heading font-semibold text-lg mb-4">CONSENSUS RESULT</h3>
          
          <div className="text-center">
            <p className="font-mono font-bold text-5xl mb-2">
              {consensus.weightedConsensus.toFixed(1)}%
            </p>
            <p className="text-xs text-muted-foreground mb-4">Weighted Consensus</p>
            
            <Progress 
              value={consensus.weightedConsensus} 
              className="h-2"
            />

            <div className="mt-4 text-sm text-muted-foreground">
              <p>Raw Consensus: {consensus.rawConsensus.toFixed(1)}%</p>
              <p>Total Influence: {consensus.totalInfluence}</p>
            </div>
          </div>
        </Card>

        <Card className={cn(
          "p-6 backdrop-blur-sm",
          getTradeQualityColor(tradeQuality.grade)
        )}>
          <h3 className="font-heading font-semibold text-lg mb-4">TRADE QUALITY</h3>
          
          <div className="text-center">
            <p className="font-mono font-bold text-5xl mb-2">
              {tradeQuality.score}
            </p>
            <Badge variant="outline" className="text-lg px-4 py-1 mb-4">
              {tradeQuality.grade}
            </Badge>
            
            <Progress 
              value={tradeQuality.score} 
              className="h-2"
            />

            <p className="text-xs text-muted-foreground mt-4">
              Esta métrica NO decide operaciones. Solo mide calidad.
            </p>
          </div>
        </Card>
      </div>

      <Card className="p-6 bg-card/50 backdrop-blur-sm">
        <h3 className="font-heading font-semibold text-lg mb-4">VETO CHECK</h3>
        
        {vetoCheck.hasVeto ? (
          <div className="space-y-4">
            <div className="flex items-center gap-3 p-4 bg-warning/10 border-2 border-warning rounded-lg">
              <Warning size={32} weight="fill" className="text-warning" />
              <div className="flex-1">
                <p className="font-semibold text-warning">VETO TRIGGERED</p>
                <p className="text-sm text-muted-foreground mt-1">
                  {vetoCheck.blockingVeto?.type && getVetoTypeLabel(vetoCheck.blockingVeto.type)}
                </p>
              </div>
              <Badge variant="destructive" className="text-sm">
                BLOCKED
              </Badge>
            </div>

            {vetoCheck.vetos.map((veto, index) => (
              <div key={index} className="pl-4 border-l-2 border-warning">
                <p className="text-sm font-medium text-warning">
                  {veto.type && getVetoTypeLabel(veto.type)}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  {veto.reason}
                </p>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex items-center gap-3 p-4 bg-accent/10 border-2 border-accent rounded-lg">
            <CheckCircle size={32} weight="fill" className="text-accent" />
            <div className="flex-1">
              <p className="font-semibold text-accent">NO VETOS ACTIVE</p>
              <p className="text-sm text-muted-foreground mt-1">
                All safety checks passed
              </p>
            </div>
          </div>
        )}
      </Card>

      <Card className={cn(
        "p-6 backdrop-blur-sm border-2",
        vetoCheck.finalDecision === 'APPROVED' ? "bg-accent/5 border-accent" : "bg-destructive/5 border-destructive"
      )}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-heading font-semibold text-lg">FINAL DECISION</h3>
          {vetoCheck.finalDecision === 'APPROVED' ? (
            <CheckCircle size={32} weight="fill" className="text-accent" />
          ) : (
            <XCircle size={32} weight="fill" className="text-destructive" />
          )}
        </div>
        
        <div className="text-center py-6">
          <Badge 
            variant={vetoCheck.finalDecision === 'APPROVED' ? 'default' : 'destructive'}
            className="text-2xl px-8 py-3 mb-4"
          >
            {vetoCheck.finalDecision}
          </Badge>
          
          <p className="text-sm text-muted-foreground max-w-2xl mx-auto">
            {explanation.decisionReason}
          </p>
        </div>

        {vetoCheck.finalDecision === 'APPROVED' && (
          <div className="flex gap-3 justify-center mt-6">
            <Button size="lg" className="px-8">
              Execute Operation
            </Button>
            <Button size="lg" variant="outline">
              Cancel
            </Button>
          </div>
        )}
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="p-6 bg-card/50 backdrop-blur-sm">
          <h3 className="font-heading font-semibold text-lg mb-4">AGENT VOTES & INFLUENCE</h3>
          
          <div className="space-y-3">
            {consensus.votes
              .sort((a, b) => b.effectiveInfluence - a.effectiveInfluence)
              .map((vote) => {
                const agent = agents.find(a => a.id === vote.agentId);
                return (
                  <div key={vote.agentId} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className={cn("text-xl", getAgentVoteColor(vote.vote))}>
                          {getAgentVoteIcon(vote.vote)}
                        </span>
                        <span className="font-medium">{agent?.name}</span>
                      </div>
                      <Badge variant="outline" className="text-xs">
                        Influence: {vote.effectiveInfluence}
                      </Badge>
                    </div>

                    <div className="ml-7 text-xs text-muted-foreground space-y-1">
                      <div className="flex justify-between">
                        <span>Base Influence:</span>
                        <span className="font-mono">{vote.influence}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Reputation:</span>
                        <span className="font-mono">{vote.reputation}%</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Confidence:</span>
                        <span className="font-mono">{vote.confidence}%</span>
                      </div>
                      <div className="flex justify-between font-semibold text-primary">
                        <span>Weighted Score:</span>
                        <span className="font-mono">{vote.weightedScore.toFixed(2)}</span>
                      </div>
                    </div>

                    <Separator />
                  </div>
                );
              })}
          </div>
        </Card>

        <Card className="p-6 bg-card/50 backdrop-blur-sm">
          <div className="flex items-center gap-2 mb-4">
            <Lightbulb size={20} weight="fill" className="text-yellow-500" />
            <h3 className="font-heading font-semibold text-lg">WHY THIS DECISION?</h3>
          </div>
          
          <div className="space-y-4">
            <div>
              <p className="text-sm leading-relaxed text-muted-foreground">
                {explanation.summary}
              </p>
            </div>

            <Separator />

            <div>
              <h4 className="text-sm font-semibold mb-2 flex items-center gap-2">
                <CheckCircle size={16} className="text-accent" />
                Supporting Agents
              </h4>
              <div className="space-y-1">
                {explanation.supportingAgents.slice(0, 3).map((agent) => (
                  <div key={agent.agentId} className="text-xs text-muted-foreground flex justify-between">
                    <span>{agent.name}</span>
                    <span className="font-mono">{agent.confidence}% confidence</span>
                  </div>
                ))}
              </div>
            </div>

            {explanation.opposingAgents.length > 0 && (
              <>
                <Separator />
                <div>
                  <h4 className="text-sm font-semibold mb-2 flex items-center gap-2">
                    <XCircle size={16} className="text-destructive" />
                    Opposing Agents
                  </h4>
                  <div className="space-y-1">
                    {explanation.opposingAgents.slice(0, 3).map((agent) => (
                      <div key={agent.agentId} className="text-xs text-muted-foreground flex justify-between">
                        <span>{agent.name}</span>
                        <span className="font-mono">{agent.confidence}% confidence</span>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            )}

            {explanation.riskFactors.length > 0 && (
              <>
                <Separator />
                <div>
                  <h4 className="text-sm font-semibold mb-2 flex items-center gap-2">
                    <Warning size={16} className="text-warning" />
                    Risk Factors
                  </h4>
                  <ul className="space-y-1">
                    {explanation.riskFactors.map((factor, index) => (
                      <li key={index} className="text-xs text-muted-foreground">
                        • {factor}
                      </li>
                    ))}
                  </ul>
                </div>
              </>
            )}

            <Separator />

            <div>
              <h4 className="text-sm font-semibold mb-2">Trade Quality Breakdown</h4>
              <div className="space-y-2 text-xs">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Consensus</span>
                  <span className="font-mono">{tradeQuality.factors.consensus.toFixed(1)}%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Risk Level</span>
                  <span className="font-mono">{tradeQuality.factors.risk.toFixed(1)}%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Agent Alignment</span>
                  <span className="font-mono">{tradeQuality.factors.agentAlignment.toFixed(1)}%</span>
                </div>
              </div>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
