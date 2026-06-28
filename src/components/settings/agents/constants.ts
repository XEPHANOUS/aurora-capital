import { Newspaper, TrendUp, ChartLine, ShieldWarning, Archive, Target, UserCircle, Eye, ShieldCheck, Circuitry } from '@phosphor-icons/react';
import type { AIAgentType, AgentType, LLMModel, LLMProvider } from '@/lib/types';

export const AGENT_ICONS: Record<AgentType, React.ElementType> = {
  director: UserCircle,
  auditor: Eye,
  supervisor: ShieldCheck,
  survival: ShieldWarning,
  risk: ChartLine,
  archivist: Archive,
  news: Newspaper,
  technical: TrendUp,
  analyst: Circuitry,
  investor: Target,
};

export const AGENT_TYPE_COLORS: Record<AIAgentType, string> = {
  llm: 'border-primary text-primary',
  'rule-based': 'border-accent text-accent',
  hybrid: 'border-warning text-warning',
};

export const LLM_MODELS: Record<LLMProvider, LLMModel[]> = {
  openai: ['gpt-4o', 'gpt-4o-mini', 'gpt-4-turbo'],
  anthropic: ['claude-3-opus', 'claude-3-sonnet', 'claude-3-haiku'],
  ollama: ['llama-3-70b', 'llama-3-8b', 'mixtral-8x7b', 'qwen3-14b-gguf', 'custom'],
  lmstudio: ['qwen3-14b-safetensors', 'custom'],
  local: ['qwen3-14b-gguf', 'qwen3-14b-safetensors', 'custom'],
};

export type AgentSubRoute = 'assignment' | 'profiles' | 'hierarchy' | 'influence';
