'use client';

import { useEffect, useState } from 'react';
import { AppProvider } from '../../lib/store/app-context';
import { StatusBar } from '../../components/StatusBar';
import { ReferenceCard } from '../../components/ReferenceCard';
import { HistoryList } from '../../components/HistoryList';
import { TranscriptBar } from '../../components/TranscriptBar';
import { SearchBar } from '../../components/SearchBar';
import { useAppStore } from '../../lib/store/app-context';
import { loadBible, getPassageText } from '../../lib/bible/loader';
import type { Bible } from '../../lib/bible/types';
import styles from './page.module.css';

function OperatorContent() {
  const { state } = useAppStore();
  const { highlighted } = state;
  const [bible, setBible] = useState<Bible | null>(null);

  useEffect(() => {
    loadBible()
      .then(setBible)
      .catch((err) => console.error('Erro ao carregar dados da Bíblia:', err));
  }, []);

  // The passage to show in ReferenceCard
  const passage = highlighted?.passage ?? null;
  const verseText = bible && passage ? getPassageText(bible, passage) : undefined;

  return (
    <div className={styles.layout}>
      <StatusBar />

      <main className={styles.main}>
        {/* Primary column: highlighted passage */}
        <div className={styles.primary}>
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
