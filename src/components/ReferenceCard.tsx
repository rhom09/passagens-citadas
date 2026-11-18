'use client';

import type { Passage } from '../lib/detect/types';
import styles from './ReferenceCard.module.css';

type Props = {
  passage: Passage | null;
  verseText?: string;
};

function formatRef(p: Passage): string {
  const loc = p.verseStart !== undefined
    ? p.verseEnd !== undefined && p.verseEnd !== p.verseStart
      ? `${p.chapter}:${p.verseStart}–${p.verseEnd}`
      : `${p.chapter}:${p.verseStart}`
    : `${p.chapter}`;
  return `${p.bookName} ${loc}`;
}

export function ReferenceCard({ passage, verseText }: Props) {
  if (!passage) {
    return (
      <div className={`${styles.card} ${styles.empty}`} aria-label="Aguardando detecção">
        <p className={styles.emptyMsg}>Aguardando detecção…</p>
        <p className={styles.emptyHint}>Fale uma passagem ou use a busca</p>
      </div>
    );
  }

  const ref = formatRef(passage);

  const handleCopy = () => {
    navigator.clipboard.writeText(ref).catch(() => {});
  };

  return (
    <div className={styles.card} aria-label={`Passagem detectada: ${ref}`}>
      <div className={styles.inner}>
        <p className={styles.ref} aria-label={ref}>{ref}</p>

        {verseText && (
          <p className={styles.verse}>{verseText}</p>
        )}

        {!verseText && passage.source === 'spoken-ref' && (
          <p className={styles.verseHint}>
            (texto não carregado — dados da ARC necessários)
          </p>
        )}

        <div className={styles.actions}>
          <button
            className={styles.copyBtn}
            onClick={handleCopy}
            aria-label={`Copiar referência ${ref}`}
            type="button"
          >
            <CopyIcon />
            Copiar
          </button>
        </div>
      </div>
    </div>
  );
}

function CopyIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <rect x="9" y="9" width="13" height="13" rx="2" stroke="currentColor" strokeWidth="1.8" />
      <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" stroke="currentColor" strokeWidth="1.8" />
    </svg>
  );
}
