'use client';

import { useAppStore } from '../lib/store/app-context';
import type { Passage } from '../lib/detect/types';
import styles from './HistoryList.module.css';

function formatRefShort(p: Passage): string {
  const loc = p.verseStart !== undefined
    ? p.verseEnd !== undefined && p.verseEnd !== p.verseStart
      ? `${p.chapter}:${p.verseStart}–${p.verseEnd}`
      : `${p.chapter}:${p.verseStart}`
    : `${p.chapter}`;
  return `${p.bookName} ${loc}`;
}

export function HistoryList() {
  const { state, highlightPassage } = useAppStore();
  const { history, highlighted } = state;

  // Apenas entradas com passagens detectadas
  const entries = history.filter((e) => e.passages.length > 0);

  if (entries.length === 0) {
    return (
      <section className={styles.section} aria-label="Histórico">
        <p className={styles.empty}>Nenhuma passagem detectada ainda</p>
      </section>
    );
  }

  return (
    <section className={styles.section} aria-label="Histórico de passagens">
      <h2 className={styles.heading}>Histórico</h2>
      <ol className={styles.list} reversed>
        {entries.map((entry) => {
          const isActive = highlighted?.segmentId === entry.segmentId;
          return (
            <li key={entry.segmentId} className={styles.item}>
              <button
                className={`${styles.btn} ${isActive ? styles.btnActive : ''}`}
                onClick={() => highlightPassage(entry.segmentId, entry.passages[0]!)}
                aria-current={isActive ? 'true' : undefined}
                aria-label={`Destacar ${entry.passages.map((p) => formatRefShort(p)).join(', ')}`}
                type="button"
              >
                <span className={styles.refs}>
                  {entry.passages.map((p) => (
                    <span key={`${p.bookId}-${p.chapter}-${p.verseStart}`} className={styles.ref}>
                      {formatRefShort(p)}
                    </span>
                  ))}
                </span>
                {entry.transcript && (
                  <span className={styles.transcript} aria-hidden="true">
                    {entry.transcript.slice(0, 60)}{entry.transcript.length > 60 ? '…' : ''}
                  </span>
                )}
              </button>
            </li>
          );
        })}
      </ol>
    </section>
  );
}
