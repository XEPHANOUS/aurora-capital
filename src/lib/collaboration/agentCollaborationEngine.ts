import type { ChatMessage, ChatTurnResult } from '@/lib/chat/types';
import { getSystemContext } from '@/lib/chat/systemContext';
import type { AgentType } from '@/lib/types';
import type {
  AgentConversation,
  AgentReport,
  AgentTask,
  ArchivistArchiveEntry,
  CollaborationArtifact,
  CollaborationCycle,
  CollaborationRunOptions,
  DecisionTraceability,
} from '@/lib/collaboration/types';

function makeId(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function normalizeAgentId(message: ChatMessage): AgentType | null {
  return message.agentId ? (message.agentId as AgentType) : null;
}

function reportTitleFor(agentId: AgentType): string {
  const titles: Record<AgentType, string> = {
    director: 'Final Decision Report',
    supervisor: 'Coordination Summary',
    auditor: 'Audit Validation Report',
    survival: 'Survival Safeguard Validation',
    risk: 'Risk Assessment',
    news: 'Market Sentiment Report',
    technical: 'Technical Analysis Report',
    analyst: 'Correlation Report',
    investor: 'Investment Proposal Report',
    archivist: 'Decision Archive Entry',
  };

  return titles[agentId];
}

function extractRecommendations(content: string): string[] {
  return content
    .split(/[.!?\n]+/)
    .map((entry) => entry.trim())
    .filter(Boolean)
    .slice(0, 3);
}

function summarize(content: string): string {
  return content
    .split('\n')[0]
    ?.replace(/Confianza.*$/i, '')
    .trim() || content.trim();
}

function buildReports(turn: ChatTurnResult): AgentReport[] {
  return turn.agentMessages
    .map((message) => {
      const agentId = normalizeAgentId(message);
      if (!agentId) return null;

      return {
        id: makeId(`report-${agentId}`),
        timestamp: message.createdAt,
        agentId,
        title: reportTitleFor(agentId),
        summary: summarize(message.content),
        confidence: message.confidenceScore ?? 0,
        recommendations: extractRecommendations(message.content),
        metadata: {
          mode: turn.mode,
          agentName: message.agentName ?? agentId,
        },
      };
    })
    .filter((report): report is AgentReport => Boolean(report));
}

function buildTasks(timestamp: string): AgentTask[] {
  return [
    {
      id: makeId('task'),
      assignedBy: 'director',
      assignedTo: 'analyst',
      title: 'Primary Asset Evaluation',
      description: 'Coordinar validación cruzada para la oportunidad activa.',
      status: 'completed',
      createdAt: timestamp,
      completedAt: timestamp,
    },
    {
      id: makeId('task'),
      assignedBy: 'analyst',
      assignedTo: 'technical',
      title: 'Technical Confirmation',
      description: 'Validar estructura, momentum y confirmación de ruptura.',
      status: 'completed',
      createdAt: timestamp,
      completedAt: timestamp,
    },
    {
      id: makeId('task'),
      assignedBy: 'analyst',
      assignedTo: 'news',
      title: 'Narrative Validation',
      description: 'Confirmar si el sentimiento y catalizadores apoyan el movimiento.',
      status: 'completed',
      createdAt: timestamp,
      completedAt: timestamp,
    },
    {
      id: makeId('task'),
      assignedBy: 'supervisor',
      assignedTo: 'auditor',
      title: 'Process Validation',
      description: 'Verificar consistencia metodológica y trazabilidad de la decisión.',
      status: 'completed',
      createdAt: timestamp,
      completedAt: timestamp,
    },
  ];
}

function buildConversation(prompt: string, reports: AgentReport[], timestamp: string): AgentConversation {
  const technical = reports.find((report) => report.agentId === 'technical');
  const news = reports.find((report) => report.agentId === 'news');
  const analyst = reports.find((report) => report.agentId === 'analyst');
  const director = reports.find((report) => report.agentId === 'director');

  return {
    id: makeId('conversation'),
    topic: prompt,
    messages: [
      {
        sender: 'director',
        receiver: 'analyst',
        content: `Analista, coordina la evaluación para: ${prompt}`,
        timestamp,
      },
      {
        sender: 'analyst',
        receiver: 'technical',
        content: 'Necesito confirmación técnica sobre estructura y momentum.',
        timestamp,
      },
      {
        sender: 'technical',
        receiver: 'analyst',
        content: technical?.summary ?? 'Validación técnica pendiente.',
        timestamp,
      },
      {
        sender: 'analyst',
        receiver: 'news',
        content: 'Confirma si la narrativa y el sentimiento respaldan la decisión.',
        timestamp,
      },
      {
        sender: 'news',
        receiver: 'analyst',
        content: news?.summary ?? 'Validación narrativa pendiente.',
        timestamp,
      },
      {
        sender: 'analyst',
        receiver: 'director',
        content: analyst?.summary ?? 'Correlación no disponible.',
        timestamp,
      },
      {
        sender: 'director',
        receiver: 'supervisor',
        content: director?.summary ?? 'Esperando síntesis final.',
        timestamp,
      },
    ],
  };
}

function detectRisks(reports: AgentReport[]): string[] {
  return reports
    .filter((report) => report.agentId === 'risk' || report.agentId === 'survival')
    .flatMap((report) => report.recommendations)
    .filter((text) => /(riesgo|volatilidad|reduc|veto|alerta|cautela)/i.test(text));
}

function buildTraceability(reports: AgentReport[], prompt: string, timestamp: string): DecisionTraceability {
  const consultedAgents = Array.from(new Set(reports.map((report) => report.agentId)));
  const alignmentSources = reports.filter((report) => ['news', 'technical', 'analyst', 'investor'].includes(report.agentId));
  const alignmentScore = alignmentSources.length > 0
    ? Math.round(alignmentSources.reduce((sum, report) => sum + report.confidence, 0) / alignmentSources.length)
    : 0;
  const director = reports.find((report) => report.agentId === 'director');
  const auditorValidations = reports
    .filter((report) => report.agentId === 'auditor')
    .flatMap((report) => report.recommendations);
  const survivalValidations = reports
    .filter((report) => report.agentId === 'survival')
    .flatMap((report) => report.recommendations);

  return {
    decisionId: makeId('decision'),
    timestamp,
    finalDecision: director?.summary ?? 'Decision pending',
    finalDecisionAgent: 'director',
    reportsUsed: reports.map((report) => report.id),
    agentsConsulted: consultedAgents,
    alignmentScore,
    risksDetected: detectRisks(reports),
    auditorValidations,
    survivalValidations,
    why: `Decision generated for "${prompt}" using ${reports.length} reports and alignment score ${alignmentScore}.`,
  };
}

function buildArtifacts(traceability: DecisionTraceability, timestamp: string): CollaborationArtifact[] {
  return [
    {
      id: makeId('artifact'),
      type: 'alignment-score',
      title: 'Alignment Scorecard',
      summary: `Alignment Score ${traceability.alignmentScore}`,
      createdBy: 'analyst',
      createdAt: timestamp,
      metadata: {
        alignmentScore: traceability.alignmentScore,
        consultedAgents: traceability.agentsConsulted.length,
      },
    },
    {
      id: makeId('artifact'),
      type: 'decision-trace',
      title: 'Decision Trace',
      summary: traceability.why,
      createdBy: 'director',
      createdAt: timestamp,
      metadata: {
        reportsUsed: traceability.reportsUsed.length,
        risksDetected: traceability.risksDetected.length,
      },
    },
    {
      id: makeId('artifact'),
      type: 'archive-packet',
      title: 'Archivist Packet',
      summary: 'Paquete preparado para persistencia futura por Archivista.',
      createdBy: 'archivist',
      createdAt: timestamp,
      metadata: {
        persistenceReady: true,
      },
    },
  ];
}

function buildArchiveEntry(
  cycleId: string,
  reports: AgentReport[],
  tasks: AgentTask[],
  conversation: AgentConversation,
  artifacts: CollaborationArtifact[],
  traceability: DecisionTraceability,
  timestamp: string,
): ArchivistArchiveEntry {
  return {
    id: makeId('archive'),
    cycleId,
    timestamp,
    title: 'Decision Archive Entry',
    summary: traceability.finalDecision,
    reports,
    tasks,
    conversations: [conversation],
    decisions: [traceability],
    artifacts,
  };
}

export function runAgentCollaborationCycle(
  prompt: string,
  turn: ChatTurnResult,
  options: CollaborationRunOptions,
): CollaborationCycle | null {
  if (!options.enabled) {
    return null;
  }

  const timestamp = new Date().toISOString();
  const cycleId = makeId('cycle');
  const reports = buildReports(turn);
  const tasks = buildTasks(timestamp);
  const conversation = buildConversation(prompt, reports, timestamp);
  const traceability = buildTraceability(reports, prompt, timestamp);
  const artifacts = buildArtifacts(traceability, timestamp);
  const archiveEntry = buildArchiveEntry(cycleId, reports, tasks, conversation, artifacts, traceability, timestamp);

  const ctx = getSystemContext();
  traceability.why = `${traceability.why} Environment ${ctx.environmentLabel}; profile ${ctx.organizationProfileLabel}.`;

  return {
    id: cycleId,
    prompt,
    timestamp,
    collaborationEnabled: true,
    consensusTurn: turn,
    reports,
    tasks,
    conversations: [conversation],
    artifacts,
    traceability,
    archiveEntry,
  };
}
