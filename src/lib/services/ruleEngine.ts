import type { RuleEvaluationInput, RuleEvaluationResult, TradingRule } from '@/lib/types';

function includesAction(rule: TradingRule, input: RuleEvaluationInput): boolean {
  const actions = rule.conditions.allowedActions;
  if (!actions || actions.length === 0) return true;
  return actions.includes(input.action);
}

function includesEnvironment(rule: TradingRule, input: RuleEvaluationInput): boolean {
  const environments = rule.conditions.allowedEnvironments;
  if (!environments || environments.length === 0) return true;
  return environments.includes(input.environment);
}

function includesAsset(rule: TradingRule, input: RuleEvaluationInput): boolean {
  const blocked = rule.conditions.blockedAssets;
  if (!blocked || blocked.length === 0) return true;
  return !blocked.some((symbol) => symbol.toUpperCase() === input.asset.toUpperCase());
}

function includesRisk(rule: TradingRule, input: RuleEvaluationInput): boolean {
  if (!Number.isFinite(input.estimatedRiskPercent ?? Number.NaN)) return true;
  const max = rule.conditions.maxRiskPercent;
  if (max === undefined) return true;
  return (input.estimatedRiskPercent ?? 0) <= max;
}

function includesPositionSize(rule: TradingRule, input: RuleEvaluationInput): boolean {
  const max = rule.conditions.maxPositionSize;
  if (max === undefined) return true;
  return input.amount <= max;
}

function isRuleInScope(rule: TradingRule, input: RuleEvaluationInput): boolean {
  if (!rule.enabled) return false;
  if (rule.scope === 'agent' && rule.agentId && rule.agentId !== input.agentId) return false;
  if (rule.scope === 'strategy' && rule.strategyId && rule.strategyId !== input.strategyId) return false;
  return true;
}

function matches(rule: TradingRule, input: RuleEvaluationInput): boolean {
  return (
    isRuleInScope(rule, input) &&
    includesAction(rule, input) &&
    includesEnvironment(rule, input) &&
    includesAsset(rule, input) &&
    includesRisk(rule, input) &&
    includesPositionSize(rule, input)
  );
}

export function evaluateTradingRules(rules: TradingRule[], input: RuleEvaluationInput): RuleEvaluationResult {
  const matchedRules = rules
    .filter((rule) => matches(rule, input))
    .sort((a, b) => a.priority - b.priority);

  const blocker = matchedRules.find((rule) => rule.action === 'reject');
  if (blocker) {
    return {
      allowed: false,
      blockingRule: blocker,
      matchedRules,
      reason: blocker.reason,
    };
  }

  return {
    allowed: true,
    matchedRules,
    reason: matchedRules.length > 0 ? 'Operacion permitida por reglas activas' : 'Sin reglas aplicables',
  };
}

export function buildDefaultTradingRules(): TradingRule[] {
  return [
    {
      id: 'rule-no-real-env',
      name: 'Bloquear entorno real',
      enabled: true,
      scope: 'global',
      priority: 1,
      conditions: {
        allowedEnvironments: ['sandbox', 'demo', 'paper'],
      },
      action: 'allow',
      reason: 'Solo se permiten Simulation, Demo y Paper Live',
    },
    {
      id: 'rule-risk-limit',
      name: 'Riesgo maximo por operacion',
      enabled: true,
      scope: 'global',
      priority: 2,
      conditions: {
        maxRiskPercent: 5,
      },
      action: 'reject',
      reason: 'Operacion bloqueada por riesgo maximo',
    },
  ];
}
