import { searchSpokenPassageWithCandidates, searchManualPassage } from './bm25';
import type { SearchIndexData } from './types';

let cachedIndex: SearchIndexData | null = null;
let isLoading = false;

async function loadIndex(): Promise<SearchIndexData> {
  if (cachedIndex) return cachedIndex;
  const res = await fetch('/data/search-index.v1.json');
  if (!res.ok) {
    throw new Error(`Falha ao carregar /data/search-index.v1.json (${res.status})`);
  }
  cachedIndex = await res.json();
  return cachedIndex!;
}

interface WorkerMessageData {
  id: string;
  text: string;
  type?: 'spoken' | 'manual';
  limit?: number;
}

self.onmessage = async (e: MessageEvent<WorkerMessageData>) => {
  const { id, text, type = 'spoken', limit } = e.data;
  try {
    if (!cachedIndex && !isLoading) {
      isLoading = true;
      await loadIndex();
      isLoading = false;
    } else if (isLoading) {
      // Aguardar carregar
      while (isLoading) {
        await new Promise((r) => setTimeout(r, 50));
      }
    }

    if (!cachedIndex) {
      self.postMessage({ id, suggestions: [], candidates: [] });
      return;
    }

    if (type === 'manual') {
      const suggestions = searchManualPassage(text, cachedIndex, limit);
      self.postMessage({ id, suggestions, candidates: [] });
    } else {
      const result = searchSpokenPassageWithCandidates(text, cachedIndex);
      self.postMessage({ id, suggestions: result.suggestions, candidates: result.candidates });
    }
  } catch (err) {
    console.error('Erro no SearchWorker:', err);
    self.postMessage({ id, suggestions: [], candidates: [] });
  }
};

