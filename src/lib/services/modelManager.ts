import type { Agent, AgentModelConfig, AgentType, LLMModel, LLMProvider, ModelAssignmentMode } from '@/lib/types';

export interface GlobalModelSelection {
  provider: LLMProvider;
  model: LLMModel;
}

export interface ModelManagerState {
  assignmentMode: ModelAssignmentMode;
  globalModel: GlobalModelSelection;
  perAgentOverrides: Partial<Record<AgentType, AgentModelConfig>>;
}

function buildFallbackConfig(globalModel: GlobalModelSelection): AgentModelConfig {
  return {
    provider: globalModel.provider,
    model: globalModel.model,
    temperature: 0.6,
    contextSize: 8192,
  };
}

export function createModelManagerState(
  assignmentMode: ModelAssignmentMode,
  globalModel: GlobalModelSelection,
  agents: Agent[],
): ModelManagerState {
  const perAgentOverrides: Partial<Record<AgentType, AgentModelConfig>> = {};

  for (const agent of agents) {
    if (agent.modelConfig) {
      perAgentOverrides[agent.id] = { ...agent.modelConfig };
    }
  }

  return {
    assignmentMode,
    globalModel,
    perAgentOverrides,
  };
}

export function resolveAgentModelConfig(
  state: ModelManagerState,
  agent: Agent,
): AgentModelConfig {
  if (state.assignmentMode === 'global') {
    const base = buildFallbackConfig(state.globalModel);
    return {
      ...base,
      temperature: agent.modelConfig?.temperature ?? base.temperature,
      contextSize: agent.modelConfig?.contextSize ?? base.contextSize,
      maxTokens: agent.modelConfig?.maxTokens,
      localModelFormat: agent.modelConfig?.localModelFormat,
      localModelPath: agent.modelConfig?.localModelPath,
    };
  }

  return state.perAgentOverrides[agent.id] ?? agent.modelConfig ?? buildFallbackConfig(state.globalModel);
}

export function applyGlobalModelToAgents(
  agents: Agent[],
  globalModel: GlobalModelSelection,
): Agent[] {
  const fallback = buildFallbackConfig(globalModel);

  return agents.map((agent) => ({
    ...agent,
    modelConfig: {
      ...fallback,
      temperature: agent.modelConfig?.temperature ?? fallback.temperature,
      contextSize: agent.modelConfig?.contextSize ?? fallback.contextSize,
      maxTokens: agent.modelConfig?.maxTokens,
      localModelFormat: agent.modelConfig?.localModelFormat,
      localModelPath: agent.modelConfig?.localModelPath,
    },
  }));
}
