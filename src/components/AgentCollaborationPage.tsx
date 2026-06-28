import { useEffect, useMemo, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { processChatTurn } from '@/lib/chat/consensusEngine';
import { runAgentCollaborationCycle } from '@/lib/collaboration/agentCollaborationEngine';
import {
  getCollaborationCycles,
  getLatestCollaborationCycle,
  recordCollaborationCycle,
  searchCollaborationArchive,
  subscribeToCollaborationStore,
} from '@/lib/collaboration/sessionStore';
import type { CollaborationCycle } from '@/lib/collaboration/types';

export function AgentCollaborationPage() {
  const [prompt, setPrompt] = useState('Analiza BTC y explica la decision final.');
  const [search, setSearch] = useState('');
  const [collaborationEnabled, setCollaborationEnabled] = useState(true);
  const [isRunning, setIsRunning] = useState(false);
  const [selectedCycleId, setSelectedCycleId] = useState<string | null>(getLatestCollaborationCycle()?.id ?? null);
  const [cycles, setCycles] = useState<CollaborationCycle[]>(getCollaborationCycles());
  const [lastConsensusAgents, setLastConsensusAgents] = useState<string[]>([]);

  useEffect(() => {
    return subscribeToCollaborationStore(() => {
      const nextCycles = getCollaborationCycles();
      setCycles(nextCycles);
      if (!selectedCycleId && nextCycles[0]) {
        setSelectedCycleId(nextCycles[0].id);
      }
    });
  }, [selectedCycleId]);

  const selectedCycle = useMemo(
    () => cycles.find((cycle) => cycle.id === selectedCycleId) ?? cycles[0] ?? null,
    [cycles, selectedCycleId],
  );

  const archiveMatches = useMemo(() => searchCollaborationArchive(search), [search, cycles]);

  const handleRun = async () => {
    setIsRunning(true);

    const turn = processChatTurn(prompt);
    setLastConsensusAgents(turn.agentMessages.map((message) => message.agentName ?? message.agentId ?? 'unknown'));

    if (collaborationEnabled) {
      const cycle = runAgentCollaborationCycle(prompt, turn, { enabled: true });
      if (cycle) {
        recordCollaborationCycle(cycle);
        setSelectedCycleId(cycle.id);
      }
    }

    setIsRunning(false);
  };

  return (
    <div className="space-y-6">
      <Card className="p-6 bg-card/50 backdrop-blur-sm border-primary/20">
        <div className="flex items-center justify-between gap-4 mb-4">
          <div>
            <h2 className="font-heading font-bold text-2xl">AGENT COLLABORATION</h2>
            <p className="text-sm text-muted-foreground mt-1">
              Capa experimental de colaboración, tareas, conversaciones, artefactos y trazabilidad.
            </p>
          </div>
          <Badge variant="outline" className="text-xs border-primary text-primary">
            Experimental
          </Badge>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[1.4fr_0.6fr] gap-4">
          <div className="space-y-3">
            <Label htmlFor="collaboration-prompt">Prompt organizativo</Label>
            <Textarea
              id="collaboration-prompt"
              value={prompt}
              onChange={(event) => setPrompt(event.target.value)}
              className="min-h-24"
            />
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between rounded-lg border border-border/60 bg-background/40 p-3">
              <div>
                <p className="text-sm font-medium">Collaboration Layer</p>
                <p className="text-xs text-muted-foreground">Desactívala y el sistema sigue operando solo con consenso.</p>
              </div>
              <Switch checked={collaborationEnabled} onCheckedChange={setCollaborationEnabled} />
            </div>

            <Button onClick={handleRun} disabled={isRunning || !prompt.trim()} className="w-full">
              {isRunning ? 'Ejecutando...' : 'Run Collaboration Cycle'}
            </Button>

            <div className="rounded-lg border border-border/60 bg-background/40 p-3">
              <p className="text-xs uppercase tracking-wide text-muted-foreground mb-2">Agentes ejecutados por consenso</p>
              <div className="flex flex-wrap gap-2">
                {lastConsensusAgents.length > 0 ? lastConsensusAgents.map((agent) => (
                  <Badge key={agent} variant="outline" className="text-xs">{agent}</Badge>
                )) : <p className="text-sm text-muted-foreground">Aún no se ha ejecutado ningún ciclo.</p>}
              </div>
            </div>
          </div>
        </div>
      </Card>

      <div className="grid grid-cols-1 xl:grid-cols-[0.85fr_1.15fr] gap-6">
        <Card className="p-4 bg-card/50 backdrop-blur-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-heading font-semibold text-base">Ciclos</h3>
            <Badge variant="outline" className="text-xs">{cycles.length}</Badge>
          </div>
          <ScrollArea className="h-[620px] pr-3">
            <div className="space-y-3">
              {cycles.map((cycle) => (
                <button
                  key={cycle.id}
                  onClick={() => setSelectedCycleId(cycle.id)}
                  className={`w-full rounded-lg border p-3 text-left transition-colors ${selectedCycle?.id === cycle.id ? 'border-primary bg-primary/10' : 'border-border/60 bg-background/40 hover:border-primary/40'}`}
                >
                  <div className="flex items-center justify-between gap-3 mb-2">
                    <p className="text-sm font-medium truncate">{cycle.prompt}</p>
                    <Badge variant="outline" className="text-[10px]">
                      {cycle.traceability.alignmentScore}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground">{new Date(cycle.timestamp).toLocaleString('es-ES')}</p>
                  <p className="text-xs text-muted-foreground mt-1 truncate">{cycle.traceability.finalDecision}</p>
                </button>
              ))}
            </div>
          </ScrollArea>
        </Card>

        <div className="space-y-6">
          {selectedCycle ? (
            <>
              <Card className="p-5 bg-card/50 backdrop-blur-sm border-primary/20">
                <div className="flex items-center justify-between gap-3 mb-3">
                  <div>
                    <h3 className="font-heading font-semibold text-lg">Trazabilidad del Director</h3>
                    <p className="text-xs text-muted-foreground">Explicabilidad completa sin alterar el consenso existente.</p>
                  </div>
                  <Badge variant="outline" className="text-xs border-primary text-primary">
                    Alignment {selectedCycle.traceability.alignmentScore}
                  </Badge>
                </div>
                <p className="text-sm text-foreground/90">{selectedCycle.traceability.why}</p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                  <div className="rounded-lg bg-background/40 p-3">
                    <p className="text-xs uppercase tracking-wide text-muted-foreground mb-2">Agentes consultados</p>
                    <div className="flex flex-wrap gap-2">
                      {selectedCycle.traceability.agentsConsulted.map((agent) => (
                        <Badge key={agent} variant="outline" className="text-xs">{agent}</Badge>
                      ))}
                    </div>
                  </div>
                  <div className="rounded-lg bg-background/40 p-3">
                    <p className="text-xs uppercase tracking-wide text-muted-foreground mb-2">Validaciones críticas</p>
                    <p className="text-sm text-muted-foreground">Auditor: {selectedCycle.traceability.auditorValidations.length}</p>
                    <p className="text-sm text-muted-foreground">Supervivencia: {selectedCycle.traceability.survivalValidations.length}</p>
                  </div>
                </div>
              </Card>

              <Card className="p-5 bg-card/50 backdrop-blur-sm">
                <h3 className="font-heading font-semibold text-base mb-4">Timeline organizativo</h3>
                <div className="space-y-4">
                  <div>
                    <p className="text-xs uppercase tracking-wide text-muted-foreground mb-2">Tareas</p>
                    <div className="space-y-2">
                      {selectedCycle.tasks.map((task) => (
                        <div key={task.id} className="rounded-lg border border-border/50 bg-background/40 p-3">
                          <div className="flex items-center justify-between gap-3">
                            <p className="text-sm font-medium">{task.title}</p>
                            <Badge variant="outline" className="text-xs">{task.status}</Badge>
                          </div>
                          <p className="text-xs text-muted-foreground mt-1">{task.assignedBy} → {task.assignedTo}</p>
                          <p className="text-sm text-foreground/90 mt-2">{task.description}</p>
                        </div>
                      ))}
                    </div>
                  </div>

                  <Separator />

                  <div>
                    <p className="text-xs uppercase tracking-wide text-muted-foreground mb-2">Conversaciones</p>
                    <div className="space-y-2">
                      {selectedCycle.conversations.flatMap((conversation) => conversation.messages).map((message, index) => (
                        <div key={`${message.sender}-${index}`} className="rounded-lg border border-border/50 bg-background/40 p-3">
                          <p className="text-xs text-muted-foreground">{message.sender} → {message.receiver}</p>
                          <p className="text-sm mt-1">{message.content}</p>
                        </div>
                      ))}
                    </div>
                  </div>

                  <Separator />

                  <div>
                    <p className="text-xs uppercase tracking-wide text-muted-foreground mb-2">Informes y artefactos</p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {selectedCycle.reports.map((report) => (
                        <div key={report.id} className="rounded-lg border border-border/50 bg-background/40 p-3">
                          <div className="flex items-center justify-between gap-3 mb-2">
                            <p className="text-sm font-medium">{report.title}</p>
                            <Badge variant="outline" className="text-xs">{report.confidence}%</Badge>
                          </div>
                          <p className="text-xs text-muted-foreground mb-2">{report.agentId}</p>
                          <p className="text-sm">{report.summary}</p>
                        </div>
                      ))}
                      {selectedCycle.artifacts.map((artifact) => (
                        <div key={artifact.id} className="rounded-lg border border-primary/20 bg-primary/5 p-3">
                          <p className="text-sm font-medium">{artifact.title}</p>
                          <p className="text-xs text-muted-foreground mt-1">{artifact.type}</p>
                          <p className="text-sm mt-2">{artifact.summary}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </Card>
            </>
          ) : (
            <Card className="p-6 bg-card/50 backdrop-blur-sm">
              <p className="text-sm text-muted-foreground">Ejecuta un ciclo para visualizar tareas, conversaciones, informes y decisiones.</p>
            </Card>
          )}

          <Card className="p-5 bg-card/50 backdrop-blur-sm">
            <div className="flex items-center justify-between gap-3 mb-4">
              <h3 className="font-heading font-semibold text-base">Archivista avanzado</h3>
              <Badge variant="outline" className="text-xs">Persistencia futura preparada</Badge>
            </div>
            <Input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Buscar reportes, tareas o decisiones..."
              className="mb-4"
            />
            <ScrollArea className="h-56 pr-3">
              <div className="space-y-3">
                {archiveMatches.map((entry) => (
                  <div key={entry.id} className="rounded-lg border border-border/50 bg-background/40 p-3">
                    <p className="text-sm font-medium">{entry.title}</p>
                    <p className="text-xs text-muted-foreground mt-1">{entry.summary}</p>
                    <p className="text-xs text-muted-foreground mt-2">
                      Reportes {entry.reports.length} · Tareas {entry.tasks.length} · Conversaciones {entry.conversations.length}
                    </p>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </Card>
        </div>
      </div>
    </div>
  );
}
