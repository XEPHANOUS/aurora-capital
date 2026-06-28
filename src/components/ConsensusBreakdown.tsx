import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  CheckCircle, 
  XCircle, 
  Warning, 
  Calculator,
  TrendUp,
  TrendDown,
  Equals,
  X as XIcon
} from '@phosphor-icons/react';
import { cn } from '@/lib/utils';
import type { ConsensusResult } from '@/lib/services/consensusEngine';

interface ConsensusBreakdownProps {
  result: ConsensusResult;
  className?: string;
}

export function ConsensusBreakdown({ result, className }: ConsensusBreakdownProps) {
  const approvers = result.breakdown.filter(b => b.rawVote === 'APPROVE');
  const rejecters = result.breakdown.filter(b => b.rawVote === 'REJECT');
  const abstainers = result.breakdown.filter(b => b.rawVote === 'ABSTAIN');

  return (
    <Card className={cn("p-6 bg-card/50 backdrop-blur-sm", className)}>
      <div className="flex items-center justify-between mb-6">
        <h3 className="font-heading font-semibold text-xl">CONSENSUS ENGINE RESULT</h3>
        <Badge 
          variant="outline"
          className={cn(
            "text-sm px-3 py-1",
            result.finalDecision === 'APPROVED' ? "border-accent text-accent" :
            result.finalDecision === 'VETOED' ? "border-warning text-warning" :
            "border-destructive text-destructive"
          )}
        >
          {result.finalDecision}
        </Badge>
      </div>

      {result.vetoTriggered && (
        <div className="mb-6 p-4 bg-warning/10 border-2 border-warning/50 rounded-lg">
          <div className="flex items-start gap-3">
            <Warning size={24} className="text-warning flex-shrink-0 mt-0.5" weight="fill" />
            <div>
              <p className="font-semibold text-warning mb-1">VETO ACTIVATED</p>
              <p className="text-sm text-muted-foreground">
                Agent: <span className="font-mono text-foreground">{result.vetoedBy}</span>
              </p>
              <p className="text-sm text-muted-foreground mt-2">{result.vetoReason}</p>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
        <div className="p-4 bg-background/50 rounded-lg">
          <p className="text-xs text-muted-foreground uppercase tracking-wide mb-2">Consensus Score</p>
          <div className="flex items-baseline gap-2">
            <p className="font-mono font-bold text-3xl text-primary">
              {(result.consensusScore * 100).toFixed(2)}%
            </p>
          </div>
          <div className="mt-3 h-2 bg-background rounded-full overflow-hidden">
            <div 
              className="h-full bg-primary rounded-full transition-all duration-500"
              style={{ width: `${result.consensusScore * 100}%` }}
            />
          </div>
        </div>

        <div className="p-4 bg-background/50 rounded-lg">
          <p className="text-xs text-muted-foreground uppercase tracking-wide mb-2">Approval Weight</p>
          <p className="font-mono font-bold text-2xl text-accent">
            {result.approvalScore.toFixed(4)}
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            {approvers.length} agent(s) approved
          </p>
        </div>

        <div className="p-4 bg-background/50 rounded-lg">
          <p className="text-xs text-muted-foreground uppercase tracking-wide mb-2">Rejection Weight</p>
          <p className="font-mono font-bold text-2xl text-destructive">
            {result.rejectionScore.toFixed(4)}
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            {rejecters.length} agent(s) rejected
          </p>
        </div>
      </div>

      <Separator className="my-6" />

      <div className="mb-6">
        <h4 className="font-heading font-semibold text-lg mb-4 flex items-center gap-2">
          <Calculator size={20} />
          AGENT VOTE BREAKDOWN
        </h4>
        
        <ScrollArea className="h-[400px] pr-4">
          <div className="space-y-4">
            {result.breakdown.map((vote, index) => (
              <div 
                key={vote.agentId}
                className={cn(
                  "p-4 rounded-lg border-l-4",
                  vote.rawVote === 'APPROVE' ? "bg-accent/5 border-accent" :
                  vote.rawVote === 'REJECT' ? "bg-destructive/5 border-destructive" :
                  "bg-muted/5 border-muted"
                )}
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    {vote.rawVote === 'APPROVE' ? (
                      <CheckCircle size={24} className="text-accent" weight="fill" />
                    ) : vote.rawVote === 'REJECT' ? (
                      <XCircle size={24} className="text-destructive" weight="fill" />
                    ) : (
                      <Warning size={24} className="text-muted-foreground" />
                    )}
                    <div>
                      <p className="font-semibold">{vote.agentName}</p>
                      <p className="text-xs text-muted-foreground font-mono">
                        {vote.agentId}
                      </p>
                    </div>
                  </div>
                  <Badge variant="outline" className="text-xs">
                    {vote.rawVote}
                  </Badge>
                </div>

                <div className="space-y-2 mb-3">
                  <div className="grid grid-cols-3 gap-3 text-sm">
                    <div>
                      <p className="text-xs text-muted-foreground">Confidence</p>
                      <p className="font-mono font-semibold">
                        {vote.rawConfidence}%
                      </p>
                      <p className="text-xs text-muted-foreground">
                        → {vote.normalizedConfidence.toFixed(4)}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Influence</p>
                      <p className="font-mono font-semibold">
                        {vote.influence}/10
                      </p>
                      <p className="text-xs text-muted-foreground">
                        → {vote.normalizedInfluence.toFixed(4)}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Reputation</p>
                      <p className="font-mono font-semibold">
                        {vote.reputation}/100
                      </p>
                      <p className="text-xs text-muted-foreground">
                        → {vote.normalizedReputation.toFixed(4)}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="space-y-2 mb-3">
                  <div className="flex items-center gap-2 text-sm font-mono">
                    <span className="text-muted-foreground">Weighted Score:</span>
                    <span>{vote.normalizedConfidence.toFixed(4)}</span>
                    <XIcon size={12} className="text-muted-foreground" />
                    <span>{vote.normalizedInfluence.toFixed(4)}</span>
                    <XIcon size={12} className="text-muted-foreground" />
                    <span>{vote.normalizedReputation.toFixed(4)}</span>
                    <Equals size={12} className="text-muted-foreground" />
                    <span className="font-bold text-primary">{vote.weightedScore.toFixed(6)}</span>
                  </div>

                  <div className="flex items-center gap-2 text-sm font-mono">
                    <span className="text-muted-foreground">Final Contribution:</span>
                    <span>{vote.weightedScore.toFixed(6)}</span>
                    <XIcon size={12} className="text-muted-foreground" />
                    <span className={cn(
                      "font-semibold",
                      vote.rawVote === 'APPROVE' ? "text-accent" :
                      vote.rawVote === 'REJECT' ? "text-destructive" :
                      "text-muted-foreground"
                    )}>
                      {vote.rawVote === 'APPROVE' ? '+1' : vote.rawVote === 'REJECT' ? '-1' : '0'}
                    </span>
                    <Equals size={12} className="text-muted-foreground" />
                    <span className="font-bold text-lg">
                      {vote.finalContribution >= 0 ? '+' : ''}{vote.finalContribution.toFixed(6)}
                    </span>
                  </div>
                </div>

                <div className="p-3 bg-background/80 rounded text-sm">
                  <p className="text-xs text-muted-foreground mb-1">REASONING:</p>
                  <p className="text-foreground">{vote.reasoning}</p>
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>
      </div>

      <Separator className="my-6" />

      <div className="mb-6">
        <h4 className="font-heading font-semibold text-lg mb-4">VETO RULES STATUS</h4>
        <div className="space-y-2">
          {result.vetoRules.map((rule) => (
            <div 
              key={rule.agentId}
              className={cn(
                "p-3 rounded-lg border",
                rule.triggered ? "bg-warning/10 border-warning" :
                rule.canVeto ? "bg-muted/5 border-border" :
                "bg-background/50 border-border opacity-60"
              )}
            >
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center gap-2">
                  <p className="font-semibold font-mono text-sm">{rule.agentId}</p>
                  {rule.canVeto && (
                    <Badge variant="outline" className="text-xs border-warning text-warning">
                      VETO POWER
                    </Badge>
                  )}
                </div>
                <Badge 
                  variant={rule.triggered ? "destructive" : "outline"}
                  className="text-xs"
                >
                  {rule.triggered ? 'TRIGGERED' : 'PASSED'}
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground mb-1">
                Condition: {rule.vetoCondition}
              </p>
              {rule.reason && (
                <p className="text-xs text-warning mt-2 font-semibold">
                  {rule.reason}
                </p>
              )}
            </div>
          ))}
        </div>
      </div>

      <Separator className="my-6" />

      <div className="mb-6">
        <h4 className="font-heading font-semibold text-lg mb-3">DECISION EXPLANATION</h4>
        <div className="p-4 bg-background/50 rounded-lg">
          <p className="text-sm leading-relaxed whitespace-pre-line">
            {result.explanation}
          </p>
        </div>
      </div>

      <Separator className="my-6" />

      <div>
        <h4 className="font-heading font-semibold text-lg mb-3 flex items-center gap-2">
          <Calculator size={20} />
          MATHEMATICAL SUMMARY
        </h4>
        <div className="p-4 bg-background/50 rounded-lg">
          <ScrollArea className="h-[400px]">
            <pre className="font-mono text-xs leading-relaxed text-foreground whitespace-pre-wrap">
              {result.mathematicalSummary}
            </pre>
          </ScrollArea>
        </div>
      </div>
    </Card>
  );
}
