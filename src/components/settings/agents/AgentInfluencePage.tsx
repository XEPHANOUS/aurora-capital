import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Slider } from '@/components/ui/slider';
import type { Agent, AgentType, OrganizationConfig, ProfileWeights } from '@/lib/types';
import { getActiveProfile, updateCustomProfile } from '@/lib/organizationProfiles';
import { AGENT_ICONS } from '@/components/settings/agents/constants';
import {
  computeProfileMetrics,
  generateBehaviourLines,
  classifyProfile,
  detectRiskWarnings,
  runSimulation,
  METRIC_LABELS,
  CLASSIFIER_COLORS,
  ALL_SCENARIOS,
  describeMetric,
} from '@/lib/profileAnalytics';
import type { SimulationScenario, SimulationResult } from '@/lib/profileAnalytics';

interface AgentInfluencePageProps {
  agents: Agent[];
  organizationConfig?: OrganizationConfig;
  onOrganizationConfigChange?: (updater: (current: OrganizationConfig | undefined) => OrganizationConfig) => void;
}

export function AgentInfluencePage({ agents, organizationConfig, onOrganizationConfigChange }: AgentInfluencePageProps) {
  const activeProfile = getActiveProfile(organizationConfig);
  const isEditable = !activeProfile.isSystemProfile && Boolean(onOrganizationConfigChange);

  // Draft state for live slider editing (only custom profiles)
  const [draft, setDraft] = useState<ProfileWeights>(() => ({ ...activeProfile.weights }));
  const [isDirty, setIsDirty] = useState(false);

  // Reset draft when active profile changes
  useEffect(() => {
    setDraft({ ...activeProfile.weights });
    setIsDirty(false);
  }, [activeProfile.id]);

  const handleSliderChange = (agentId: AgentType, value: number) => {
    setDraft((prev) => ({ ...prev, [agentId]: value }));
    setIsDirty(true);
  };

  const handleSave = () => {
    if (!onOrganizationConfigChange) return;
    onOrganizationConfigChange((current) =>
      updateCustomProfile(current, { ...activeProfile, weights: draft }),
    );
    setIsDirty(false);
  };

  const handleReset = () => {
    setDraft({ ...activeProfile.weights });
    setIsDirty(false);
  };

  const weights = isEditable ? draft : activeProfile.weights;
  const totalInfluence = Object.values(weights).reduce((sum, value) => sum + value, 0);
  const avgInfluence = totalInfluence / Object.keys(weights).length;
  const sortedAgents = [...agents].sort((a, b) => (weights[b.id] || 0) - (weights[a.id] || 0));

  // Analytics (always derived from live weights / draft)
  const metrics = computeProfileMetrics(weights);
  const classification = classifyProfile(weights);
  const behaviourLines = generateBehaviourLines(weights);
  const riskWarnings = detectRiskWarnings(weights);

  // Phase 5: simulator state
  const [simResult, setSimResult] = useState<SimulationResult | null>(null);

  return (
    <div className="space-y-6">
      <Card className="p-6 bg-card/50 backdrop-blur-sm">
        <div className="flex items-start justify-between gap-4 mb-4">
          <div>
            <h3 className="font-heading font-semibold text-lg">Influence Matrix</h3>
            <p className="text-sm text-muted-foreground mt-1">
              Perfil activo: <span className="font-semibold">{activeProfile.name}</span>.
              {' '}Agent influence multiplies with reputation and confidence to calculate weighted votes.
            </p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            {activeProfile.isSystemProfile ? (
              <Badge variant="outline" className="text-xs border-muted-foreground text-muted-foreground">
                SYSTEM PROFILE
              </Badge>
            ) : (
              <Badge variant="outline" className="text-xs border-primary text-primary">
                CUSTOM PROFILE
              </Badge>
            )}
            {isEditable && isDirty && (
              <>
                <Button size="sm" variant="outline" onClick={handleReset}>Resetear</Button>
                <Button size="sm" onClick={handleSave}>Guardar</Button>
              </>
            )}
          </div>
        </div>

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
            const Icon = AGENT_ICONS[agent.id as AgentType];
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
                {/* Visual bar */}
                <div className="relative h-3 bg-background rounded-full overflow-hidden">
                  <div
                    className={isAboveAverage ? 'h-full rounded-full transition-all duration-500 bg-accent' : 'h-full rounded-full transition-all duration-500 bg-primary'}
                    style={{ width: `${percentage}%` }}
                  />
                  <div className="absolute top-0 left-0 h-full w-0.5 bg-warning/50" style={{ left: `${(avgInfluence / totalInfluence) * 100}%` }} />
                </div>
                {/* Slider row */}
                <Slider
                  min={0}
                  max={100}
                  step={1}
                  value={[weight]}
                  disabled={!isEditable}
                  onValueChange={([v]) => handleSliderChange(agent.id as AgentType, v)}
                  className={isEditable ? undefined : 'opacity-40 cursor-not-allowed'}
                />
              </div>
            );
          })}
        </div>

        <div className="mt-6 p-4 bg-muted/30 rounded-lg">
          <p className="text-xs text-muted-foreground">
            <span className="text-warning font-semibold">Yellow line</span> indicates average influence. Agents above this threshold have outsized impact on consensus decisions.
          </p>
        </div>
      </Card>

      {/* ─── Phase 1: Perfil Resultante ──────────────────────────────────────── */}
      <Card className="p-6 bg-card/50 backdrop-blur-sm">
        <div className="flex items-center justify-between mb-5">
          <h3 className="font-heading font-semibold text-lg">Perfil Resultante</h3>
          <Badge variant="outline" className={`text-xs ${CLASSIFIER_COLORS[classification.label]}`}>
            {classification.label.toUpperCase()}
          </Badge>
        </div>

        <div className="space-y-5">
          {(Object.keys(METRIC_LABELS) as (keyof typeof METRIC_LABELS)[]).map((key) => {
            const value = metrics[key];
            return (
              <div key={key} className="space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium uppercase tracking-wide">{METRIC_LABELS[key]}</span>
                  <span className="font-mono font-bold text-sm">{value}%</span>
                </div>
                <div className="h-2 bg-background rounded-full overflow-hidden">
                  <div
                    className="h-full bg-primary rounded-full transition-all duration-500"
                    style={{ width: `${value}%` }}
                  />
                </div>
                <p className="text-xs text-muted-foreground">{describeMetric(key, value)}</p>
              </div>
            );
          })}
        </div>
      </Card>

      {/* ─── Phase 2: Comportamiento Esperado ────────────────────────────────── */}
      <Card className="p-6 bg-card/50 backdrop-blur-sm">
        <h3 className="font-heading font-semibold text-lg mb-4">Comportamiento Esperado</h3>
        <ul className="space-y-2">
          {behaviourLines.map((line, i) => (
            <li key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
              <span className="text-primary font-bold shrink-0 mt-0.5">•</span>
              <span>{line}</span>
            </li>
          ))}
        </ul>
      </Card>

      {/* ─── Phase 3: Tipo detectado — inline in Perfil Resultante header ────
           Already shown via the badge above; adding a standalone card for detail */}
      <Card className="p-6 bg-card/50 backdrop-blur-sm">
        <h3 className="font-heading font-semibold text-lg mb-4">Tipo Detectado</h3>
        <div className="flex items-center gap-4">
          <Badge
            variant="outline"
            className={`text-lg font-bold px-4 py-2 ${CLASSIFIER_COLORS[classification.label]}`}
          >
            {classification.label.toUpperCase()}
          </Badge>
          <div>
            <p className="text-xs text-muted-foreground">Score de agresividad calculado</p>
            <p className="font-mono font-bold text-xl">{classification.score}</p>
          </div>
        </div>
      </Card>

      {/* ─── Phase 4: Validación de Riesgo ───────────────────────────────────── */}
      {riskWarnings.length > 0 && (
        <Card className="p-6 bg-card/50 backdrop-blur-sm border border-warning/30">
          <h3 className="font-heading font-semibold text-lg mb-4 text-warning">Validación de Riesgo</h3>
          <div className="space-y-3">
            {riskWarnings.map((warn) => (
              <div
                key={warn.code}
                className={`p-4 rounded-lg ${warn.severity === 'error' ? 'bg-destructive/10 border border-destructive/30' : 'bg-warning/10 border border-warning/30'}`}
              >
                <p className={`text-sm font-semibold ${warn.severity === 'error' ? 'text-destructive' : 'text-warning'}`}>
                  {warn.severity === 'error' ? '⛔' : '⚠'} {warn.message}
                </p>
                <p className="text-xs text-muted-foreground mt-1">{warn.detail}</p>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* ─── Phase 5: Simulador de Decisiones ────────────────────────────────── */}
      <Card className="p-6 bg-card/50 backdrop-blur-sm">
        <h3 className="font-heading font-semibold text-lg mb-2">Simulación Rápida</h3>
        <p className="text-xs text-muted-foreground mb-5">
          Simulaciones heurísticas basadas en los pesos del perfil actual. Sin IA.
        </p>

        <div className="flex flex-wrap gap-2 mb-6">
          {ALL_SCENARIOS.map((scenario) => (
            <Button
              key={scenario}
              size="sm"
              variant={simResult?.scenario === scenario ? 'default' : 'outline'}
              onClick={() => setSimResult(runSimulation(scenario, weights))}
            >
              {scenario === 'buy_btc' ? 'Comprar BTC' :
               scenario === 'buy_nvda' ? 'Comprar NVDA' :
               scenario === 'bear_market' ? 'Mercado Bajista' :
               scenario === 'bull_market' ? 'Mercado Alcista' :
               'Alta Volatilidad'}
            </Button>
          ))}
        </div>

        {simResult && (
          <div className="p-5 bg-background/60 rounded-lg space-y-3 border border-border">
            <div className="flex items-center justify-between gap-3">
              <span className="text-sm font-semibold text-muted-foreground">{simResult.label}</span>
              <Badge
                variant="outline"
                className={
                  simResult.decision === 'APROBADO'
                    ? 'border-emerald-500 text-emerald-400'
                    : simResult.decision === 'APROBADO CON CAUTELA'
                    ? 'border-yellow-500 text-yellow-400'
                    : simResult.decision === 'RECHAZADO'
                    ? 'border-destructive text-destructive'
                    : 'border-orange-500 text-orange-400'
                }
              >
                {simResult.decision}
              </Badge>
            </div>

            <div className="space-y-1">
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>Confianza</span>
                <span className="font-mono font-bold">{simResult.confidence}%</span>
              </div>
              <div className="h-2 bg-muted rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-500 bg-primary"
                  style={{ width: `${simResult.confidence}%` }}
                />
              </div>
            </div>

            <p className="text-xs text-muted-foreground">{simResult.rationale}</p>
          </div>
        )}
      </Card>

      {/* ─── Formula ─────────────────────────────────────────────────────────── */}
      <Card className="p-6 bg-card/50 backdrop-blur-sm">
        <h3 className="font-heading font-semibold text-base mb-3">Formula</h3>
        <div className="p-4 bg-background/50 rounded-lg font-mono text-sm space-y-2">
          <p>
            Weighted Vote = <span className="text-primary">Influence</span> x <span className="text-accent">Reputation</span> x <span className="text-warning">Confidence</span>
          </p>
          <Separator className="my-3" />
          <p className="text-xs text-muted-foreground">Example:</p>
          <p className="text-xs">Agent with Influence=90, Reputation=85%, Confidence=95%</p>
          <p className="text-xs">
            = 90 x 0.85 x 0.95 = <span className="text-primary font-semibold">72.68</span>
          </p>
        </div>
      </Card>
    </div>
  );
}
