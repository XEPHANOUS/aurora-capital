import type { ArchivistRecord } from '@/lib/types';

interface ArchivistState {
  records: ArchivistRecord[];
}

const state: ArchivistState = {
  records: [],
};

function cosineSimilarity(a: number[], b: number[]): number {
  if (!a.length || !b.length || a.length !== b.length) return 0;

  let dot = 0;
  let normA = 0;
  let normB = 0;

  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }

  if (normA === 0 || normB === 0) return 0;
  return dot / (Math.sqrt(normA) * Math.sqrt(normB));
}

function buildLightweightEmbedding(input: string): number[] {
  // Placeholder deterministic embedding while SQLite/vector layer is integrated.
  const vector = new Array<number>(16).fill(0);
  const normalized = input.toLowerCase();

  for (let i = 0; i < normalized.length; i++) {
    const code = normalized.charCodeAt(i);
    vector[i % vector.length] += code / 255;
  }

  return vector;
}

export function saveArchivistRecord(record: Omit<ArchivistRecord, 'id' | 'createdAt' | 'embedding'>): ArchivistRecord {
  const next: ArchivistRecord = {
    ...record,
    id: `arch-${Date.now()}-${Math.round(Math.random() * 1000)}`,
    embedding: buildLightweightEmbedding(`${record.title}\n${record.content}`),
    createdAt: new Date().toISOString(),
  };

  state.records.unshift(next);
  if (state.records.length > 5000) {
    state.records.length = 5000;
  }

  return next;
}

export function listArchivistRecords(limit = 100): ArchivistRecord[] {
  return state.records.slice(0, Math.max(1, limit));
}

export function searchArchivistRecords(query: string, limit = 20): ArchivistRecord[] {
  const queryEmbedding = buildLightweightEmbedding(query);

  return [...state.records]
    .map((record) => ({
      record,
      score: cosineSimilarity(queryEmbedding, record.embedding ?? []),
    }))
    .sort((a, b) => b.score - a.score)
    .slice(0, Math.max(1, limit))
    .map((row) => row.record);
}
