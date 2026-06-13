# Consensus Engine Documentation

## Overview

The Aurora Capital Consensus Engine is a sophisticated mathematical voting system that combines multiple weighted factors to reach collective decisions on investment proposals. It provides full transparency into the decision-making process with detailed breakdowns of every calculation.

## Core Formula

Each agent's contribution to the consensus is calculated as:

```
Weighted Score = Confidence × Influence × Reputation
```

Where:
- **Confidence** (0-100): Agent's certainty in their recommendation
- **Influence** (0-10): Agent's structural weight in the organization
- **Reputation** (0-100): Historical performance score

All values are normalized to [0, 1] before multiplication.

## Normalization

Values are normalized using:

```
normalized_value = (value - min) / (max - min)
```

This ensures all factors contribute proportionally to the final score.

## Vote Application

Each agent's weighted score is then multiplied by their vote direction:
- **APPROVE**: +1 (adds to approval weight)
- **REJECT**: -1 (adds to rejection weight)
- **ABSTAIN**: 0 (no contribution)

```
Final Contribution = Weighted Score × Vote Multiplier
```

## Consensus Calculation

The raw consensus score is calculated as:

```
Raw Consensus = (Total Approval Weight - Total Rejection Weight) / Total Weight
```

This produces a value in the range [-1, 1].

The normalized consensus score (0-1) is:

```
Normalized Consensus = (Raw Consensus + 1) / 2
```

## Decision Threshold

A proposal is **APPROVED** if:

```
Normalized Consensus ≥ Approval Threshold (default: 0.60 or 60%)
```

Otherwise, it is **REJECTED**.

## Veto System

Certain agents have veto authority that can override the consensus:

### Survival Agent Veto
- **Condition**: Trade would cause capital to fall below survival reserve
- **Calculation**: 
  ```
  Capital After Trade < (Total Capital × Survival Reserve %)
  ```
- **Effect**: Immediate VETO, decision cannot proceed

### Director Agent Veto
- **Condition**: Strategic concerns or confidence below threshold
- **Calculation**: Confidence < 40% AND Vote = REJECT
- **Effect**: Immediate VETO, decision cannot proceed

### Risk Agent Warning
- **Condition**: Position size exceeds risk threshold
- **Calculation**: 
  ```
  (Proposal Amount / Current Capital) > Max Risk Per Operation
  ```
- **Effect**: Warning displayed, but no veto (unless Risk agent has veto power)

## Example Calculation

Given a proposal with 3 agents:

### Agent 1: Technical Agent
- Raw Vote: APPROVE
- Confidence: 75% → Normalized: 0.75
- Influence: 7/10 → Normalized: 0.70
- Reputation: 85/100 → Normalized: 0.85
- **Weighted Score**: 0.75 × 0.70 × 0.85 = 0.446250
- **Final Contribution**: 0.446250 × (+1) = +0.446250

### Agent 2: Risk Agent
- Raw Vote: REJECT
- Confidence: 60% → Normalized: 0.60
- Influence: 9/10 → Normalized: 0.90
- Reputation: 90/100 → Normalized: 0.90
- **Weighted Score**: 0.60 × 0.90 × 0.90 = 0.486000
- **Final Contribution**: 0.486000 × (-1) = -0.486000

### Agent 3: Survival Agent
- Raw Vote: APPROVE
- Confidence: 95% → Normalized: 0.95
- Influence: 10/10 → Normalized: 1.00
- Reputation: 100/100 → Normalized: 1.00
- **Weighted Score**: 0.95 × 1.00 × 1.00 = 0.950000
- **Final Contribution**: 0.950000 × (+1) = +0.950000

### Aggregate Calculation
- **Total Approval Weight**: 0.446250 + 0.950000 = 1.396250
- **Total Rejection Weight**: 0.486000
- **Total Weight**: 1.396250 + 0.486000 = 1.882250
- **Raw Consensus**: (1.396250 - 0.486000) / 1.882250 = 0.483640
- **Normalized Consensus**: (0.483640 + 1) / 2 = 0.741820 = **74.18%**

### Decision
- Threshold: 60%
- Score: 74.18%
- **Result**: ✓ APPROVED (exceeds threshold by 14.18%)

## Configuration Options

The consensus engine can be configured with:

```typescript
interface ConsensusConfig {
  approvalThreshold: number;          // Default: 0.60 (60%)
  requireUnanimousForHighRisk: boolean; // Default: true
  highRiskThreshold: number;          // Default: 0.30 (30% of capital)
  vetoEnabled: boolean;               // Default: true
  vetoAgents: AgentType[];           // Default: ['survival', 'director']
}
```

## Transparency Features

The engine provides complete visibility into:

1. **Individual Agent Calculations**: Shows raw values, normalized values, and weighted scores for each agent
2. **Vote Breakdown**: Displays reasoning and contribution for every participating agent
3. **Veto Rule Status**: Lists all veto rules and whether they were triggered
4. **Decision Explanation**: Human-readable summary of why the decision was reached
5. **Mathematical Summary**: Complete step-by-step calculation with all formulas and values

## Benefits

- **Fairness**: All agents have proportional influence based on expertise and performance
- **Transparency**: Every calculation is visible and auditable
- **Safety**: Multiple veto mechanisms prevent dangerous decisions
- **Adaptability**: Agent reputations evolve based on historical performance
- **Trust**: Mathematical rigor ensures consistent, unbiased decision-making
