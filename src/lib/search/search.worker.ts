import { searchSpokenPassage } from './bm25';
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

self.onmessage = async (e: MessageEvent<{ id: string; text: string }>) => {
  const { id, text } = e.data;
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
      self.postMessage({ id, suggestions: [] });
      return;
    }

    const suggestions = searchSpokenPassage(text, cachedIndex);
    self.postMessage({ id, suggestions });
  } catch (err) {
    console.error('Erro no SearchWorker:', err);
    self.postMessage({ id, suggestions: [] });
  }
};
