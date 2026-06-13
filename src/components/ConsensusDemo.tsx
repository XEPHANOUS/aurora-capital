import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ConsensusBreakdown } from '@/components/ConsensusBreakdown';
import { 
  calculateConsensus, 
  generateMockVotes,
  type ConsensusResult,
  type AgentVoteInput,
  type VoteDecision 
} from '@/lib/services/consensusEngine';
import type { Agent, SystemConfig, OperationType } from '@/lib/types';
import { Play, ArrowsClockwise } from '@phosphor-icons/react';

interface ConsensusDemoProps {
  agents: Agent[];
  config: SystemConfig;
  currentCapital: number;
}

export function ConsensusDemo({ agents, config, currentCapital }: ConsensusDemoProps) {
  const [proposalAsset, setProposalAsset] = useState('BTC');
  const [proposalAction, setProposalAction] = useState<OperationType>('BUY');
  const [proposalAmount, setProposalAmount] = useState(5000);
  const [consensusResult, setConsensusResult] = useState<ConsensusResult | null>(null);
  const [isCalculating, setIsCalculating] = useState(false);
  
  const handleRunConsensus = () => {
    setIsCalculating(true);
    
    setTimeout(() => {
      const votes = generateMockVotes(
        agents,
        proposalAction,
        proposalAmount,
        currentCapital,
        config
      );
      
      const result = calculateConsensus(
        votes,
        agents,
        config,
        currentCapital,
        proposalAmount,
        proposalAction
      );
      
      setConsensusResult(result);
      setIsCalculating(false);
    }, 500);
  };
  
  useEffect(() => {
    handleRunConsensus();
  }, []);

  return (
    <div className="space-y-6">
      <Card className="p-6 bg-card/50 backdrop-blur-sm">
        <h3 className="font-heading font-semibold text-xl mb-6">
          CONSENSUS ENGINE SIMULATOR
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          <div className="space-y-2">
            <Label htmlFor="asset">Asset</Label>
            <Input
              id="asset"
              value={proposalAsset}
              onChange={(e) => setProposalAsset(e.target.value)}
              placeholder="BTC, ETH, etc."
              className="font-mono"
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="action">Action</Label>
            <Select
              value={proposalAction}
              onValueChange={(value) => setProposalAction(value as OperationType)}
            >
              <SelectTrigger id="action">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="BUY">BUY</SelectItem>
                <SelectItem value="SELL">SELL</SelectItem>
                <SelectItem value="HOLD">HOLD</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="amount">Amount ($)</Label>
            <Input
              id="amount"
              type="number"
              value={proposalAmount}
              onChange={(e) => setProposalAmount(Number(e.target.value))}
              placeholder="Amount"
              className="font-mono"
            />
          </div>
        </div>
        
        <Separator className="my-6" />
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="p-3 bg-background/50 rounded-lg">
            <p className="text-xs text-muted-foreground mb-1">Current Capital</p>
            <p className="font-mono font-semibold text-lg">
              ${currentCapital.toLocaleString()}
            </p>
          </div>
          
          <div className="p-3 bg-background/50 rounded-lg">
            <p className="text-xs text-muted-foreground mb-1">Survival Reserve</p>
            <p className="font-mono font-semibold text-lg">
              ${((config.totalCapital * config.survivalReservePercent) / 100).toLocaleString()}
            </p>
          </div>
          
          <div className="p-3 bg-background/50 rounded-lg">
            <p className="text-xs text-muted-foreground mb-1">Participating Agents</p>
            <p className="font-mono font-semibold text-lg">
              {agents.length}
            </p>
          </div>
        </div>
        
        <div className="flex gap-3">
          <Button 
            onClick={handleRunConsensus}
            disabled={isCalculating}
            className="flex-1"
          >
            <Play size={16} className="mr-2" weight="fill" />
            {isCalculating ? 'Calculating...' : 'Run Consensus Engine'}
          </Button>
          
          <Button 
            onClick={handleRunConsensus}
            variant="outline"
            disabled={isCalculating}
          >
            <ArrowsClockwise size={16} />
          </Button>
        </div>
      </Card>
      
      {consensusResult && (
        <ConsensusBreakdown result={consensusResult} />
      )}
    </div>
  );
}
