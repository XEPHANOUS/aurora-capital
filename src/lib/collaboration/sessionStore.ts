import type { ArchivistArchiveEntry, CollaborationCycle } from '@/lib/collaboration/types';

type StoreListener = () => void;

interface CollaborationSessionState {
  cycles: CollaborationCycle[];
  archive: ArchivistArchiveEntry[];
}

const state: CollaborationSessionState = {
  cycles: [],
  archive: [],
};

const listeners = new Set<StoreListener>();

function emit(): void {
  listeners.forEach((listener) => listener());
}

export function recordCollaborationCycle(cycle: CollaborationCycle): void {
  state.cycles = [cycle, ...state.cycles].slice(0, 25);
  state.archive = [cycle.archiveEntry, ...state.archive].slice(0, 100);
  emit();
}

export function getCollaborationCycles(): CollaborationCycle[] {
  return state.cycles;
}

export function getLatestCollaborationCycle(): CollaborationCycle | null {
  return state.cycles[0] ?? null;
}

export function searchCollaborationArchive(query: string): ArchivistArchiveEntry[] {
  const normalized = query.trim().toLowerCase();
  if (!normalized) return state.archive;

  return state.archive.filter((entry) => {
    const haystack = [
      entry.title,
      entry.summary,
      ...entry.reports.map((report) => `${report.title} ${report.summary} ${report.recommendations.join(' ')}`),
      ...entry.tasks.map((task) => `${task.title} ${task.description}`),
      ...entry.conversations.flatMap((conversation) => conversation.messages.map((message) => message.content)),
      ...entry.decisions.map((decision) => `${decision.finalDecision} ${decision.why} ${decision.risksDetected.join(' ')}`),
    ].join(' ').toLowerCase();

    return haystack.includes(normalized);
  });
}

export function subscribeToCollaborationStore(listener: StoreListener): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}
