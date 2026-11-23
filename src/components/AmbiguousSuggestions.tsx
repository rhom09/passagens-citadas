'use client';

import { useAppStore } from '../lib/store/app-context';
import type { Passage } from '../lib/detect/types';

function formatRef(p: Passage): string {
  const loc =
    p.verseStart !== undefined
      ? p.verseEnd !== undefined && p.verseEnd !== p.verseStart
        ? `${p.chapter}:${p.verseStart}–${p.verseEnd}`
        : `${p.chapter}:${p.verseStart}`
      : `${p.chapter}`;
  return `${p.bookName} ${loc}`;
}

type Props = {
  onPromote: (passage: Passage) => void;
};

/**
 * Exibe sugestões quando um livro numerado foi citado sem ordinal
 * (ex: "Tessalonicenses 1:1"). O operador toca para promover ao destaque.
 * Nunca vai ao destaque sozinho.
 */
export function AmbiguousSuggestions({ onPromote }: Props) {
  const { state } = useAppStore();

  // Pegar o segmento mais recente com sugestões e sem passagem confirmada própria
  const recentAmbiguous = state.history.find(
    (e) => e.ambiguous && e.ambiguous.length > 0
  );

  if (!recentAmbiguous?.ambiguous?.length) return null;

  const groups = recentAmbiguous.ambiguous;

  return (
    <div
      role="region"
      aria-label="Sugestões — livro ambíguo"
      style={{
        padding: '0.5rem 0.75rem',
        background: 'color-mix(in srgb, var(--color-accent, #6b8cff) 12%, transparent)',
        borderRadius: '0.5rem',
        marginBottom: '0.5rem',
        fontSize: '0.8rem',
        color: 'var(--color-text-dim, #aaa)',
      }}
    >
      <p style={{ margin: '0 0 0.4rem', fontWeight: 600, color: 'var(--color-accent, #6b8cff)' }}>
        Qual livro? (toque para destacar)
      </p>
      {groups.map((group) => (
        <div key={group.baseBookName} style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
          {group.validCandidates.map((p) => (
            <button
              key={`${p.bookId}-${p.chapter}-${p.verseStart}`}
              type="button"
              onClick={() => onPromote(p)}
              aria-label={`Destacar ${formatRef(p)}`}
              style={{
                padding: '0.25rem 0.6rem',
                borderRadius: '0.4rem',
                border: '1px solid var(--color-accent, #6b8cff)',
                background: 'transparent',
                color: 'var(--color-accent, #6b8cff)',
                cursor: 'pointer',
                fontFamily: 'inherit',
                fontSize: '0.8rem',
              }}
            >
              {formatRef(p)}
            </button>
          ))}
        </div>
      ))}
    </div>
  );
}
