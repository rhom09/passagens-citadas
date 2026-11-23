'use client';

import { useEffect, useState, useCallback } from 'react';
import { AppProvider } from '../../lib/store/app-context';
import { StatusBar } from '../../components/StatusBar';
import { ReferenceCard } from '../../components/ReferenceCard';
import { HistoryList } from '../../components/HistoryList';
import { TranscriptBar } from '../../components/TranscriptBar';
import { SearchBar } from '../../components/SearchBar';
import { TranscriptStabilizer } from '../../components/TranscriptStabilizer';
import { DebugInspector } from '../../components/DebugInspector';
import { AmbiguousSuggestions } from '../../components/AmbiguousSuggestions';
import { useAppStore } from '../../lib/store/app-context';
import { useWakeLock } from '../../hooks/useWakeLock';
import { loadBible, getPassageText } from '../../lib/bible/loader';
import type { Passage } from '../../lib/detect/types';
import type { Bible } from '../../lib/bible/types';
import styles from './page.module.css';

function OperatorContent() {
  const { state, dispatch } = useAppStore();
  const { highlighted, micStatus } = state;
  const [bible, setBible] = useState<Bible | null>(null);

  // Mantém a tela acesa enquanto o microfone estiver escutando
  useWakeLock(micStatus === 'listening');

  useEffect(() => {
    loadBible()
      .then(setBible)
      .catch((err) => console.error('Erro ao carregar dados da Bíblia:', err));
  }, []);

  // The passage to show in ReferenceCard
  const passage = highlighted?.passage ?? null;
  const verseText = bible && passage ? getPassageText(bible, passage) : undefined;

  const debugSegments = state.history.map(e => ({
    id: e.segmentId,
    text: e.transcript,
    completedByContext: e.completedByContext,
    passages: e.passages
  }));

  // Promover sugestão ambígua: gera um segmento manual com a passagem escolhida
  const handlePromote = useCallback((p: Passage) => {
    dispatch({ type: 'MANUAL_RESULT', passage: p });
  }, [dispatch]);

  return (
    <div className={styles.layout}>
      <TranscriptStabilizer />
      <DebugInspector segments={debugSegments} />
      <StatusBar />
      <main className={styles.main}>
        {/* Primary column: highlighted passage */}
        <div className={styles.primary}>
          <AmbiguousSuggestions onPromote={handlePromote} />
          <ReferenceCard passage={passage} verseText={verseText} />
          <TranscriptBar />
        </div>

        {/* Secondary column: history */}
        <aside className={styles.aside}>
          <HistoryList />
        </aside>
      </main>

      {/* Search bar: sticky footer */}
      <footer className={styles.footer}>
        <SearchBar />
      </footer>
    </div>
  );
}

export default function OperatorPage() {
  return (
    <AppProvider>
      <OperatorContent />
    </AppProvider>
  );
}
