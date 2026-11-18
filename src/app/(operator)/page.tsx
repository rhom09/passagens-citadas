'use client';

import { AppProvider } from '../../lib/store/app-context';
import { StatusBar } from '../../components/StatusBar';
import { ReferenceCard } from '../../components/ReferenceCard';
import { HistoryList } from '../../components/HistoryList';
import { TranscriptBar } from '../../components/TranscriptBar';
import { SearchBar } from '../../components/SearchBar';
import { useAppStore } from '../../lib/store/app-context';
import styles from './page.module.css';

function OperatorContent() {
  const { state } = useAppStore();
  const { highlighted } = state;

  // The passage to show in ReferenceCard
  const passage = highlighted?.passage ?? null;

  return (
    <div className={styles.layout}>
      <StatusBar />

      <main className={styles.main}>
        {/* Primary column: highlighted passage */}
        <div className={styles.primary}>
          <ReferenceCard passage={passage} />
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
