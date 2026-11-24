'use client';

import { useAppStore } from '../lib/store/app-context';
import { normalize } from '../lib/detect/normalize';
import { stemWord, isFuzzyMatch } from '../lib/search/stemmer';
import type { Passage } from '../lib/detect/types';
import type { SearchSuggestion } from '../lib/search/types';

function formatRef(p: Pick<Passage, 'bookName' | 'chapter' | 'verseStart' | 'verseEnd'>): string {
  const loc =
    p.verseStart !== undefined
      ? p.verseEnd !== undefined && p.verseEnd !== p.verseStart
        ? `${p.chapter}:${p.verseStart}–${p.verseEnd}`
        : `${p.chapter}:${p.verseStart}`
      : `${p.chapter}`;
  return `${p.bookName} ${loc}`;
}

type Props = {
  onPromote: (passage: Passage, snippet?: string) => void;
};

/**
 * Renderiza o snippet destacando em negrito as palavras que casaram com a busca
 */
function HighlightedSnippet({ snippet, matchedTokens }: { snippet: string; matchedTokens?: string[] }) {
  if (!matchedTokens || matchedTokens.length === 0) {
    return <>&ldquo;{snippet}&rdquo;</>;
  }

  // Prepara tokens normais e radicais dos termos buscados
  const targetStems = new Set(matchedTokens.map((t) => stemWord(t)));
  const targetTokens = new Set(matchedTokens);

  const words = snippet.split(/\s+/);

  return (
    <span>
      &ldquo;
      {words.map((w, idx) => {
        // Limpa pontuação para teste
        const clean = normalize(w).replace(/[^a-z0-9]/g, '');
        const isExact = targetTokens.has(clean);
        const isStem = !isExact && targetStems.has(stemWord(clean));
        const isFuzzy = !isExact && !isStem && matchedTokens.some((t) => isFuzzyMatch(clean, t));

        const isMatch = isExact || isStem || isFuzzy;

        return (
          <span key={idx}>
            {idx > 0 && ' '}
            {isMatch ? (
              <strong style={{ color: 'var(--color-text, #fff)', fontWeight: 700 }}>{w}</strong>
            ) : (
              w
            )}
          </span>
        );
      })}
      &rdquo;
    </span>
  );
}

/**
 * Exibe sugestões pelo texto falado (RF-08).
 * O operador toca para promover ao destaque. Nunca promove sozinho.
 */
export function SpokenTextSuggestions({ onPromote }: Props) {
  const { state } = useAppStore();

  // Pegar o segmento mais recente que possui sugestões de texto e nenhuma passagem confirmada
  const recentEntry = state.history.find(
    (e) => e.textSuggestions && e.textSuggestions.length > 0 && e.passages.length === 0
  );

  if (!recentEntry?.textSuggestions?.length) return null;

  const suggestions: SearchSuggestion[] = recentEntry.textSuggestions;

  return (
    <div
      role="region"
      aria-label="Sugestões pelo texto"
      style={{
        padding: '0.6rem 0.85rem',
        background: 'color-mix(in srgb, #10b981 12%, transparent)',
        border: '1px solid color-mix(in srgb, #10b981 35%, transparent)',
        borderRadius: '0.5rem',
        marginBottom: '0.5rem',
        fontSize: '0.8rem',
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem' }}>
        <span style={{ fontWeight: 600, color: '#10b981' }}>
          📖 Sugestões pelo texto (fala)
        </span>
        <span style={{ fontSize: '0.7rem', color: 'var(--color-text-dim, #888)' }}>
          toque para destacar
        </span>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
        {suggestions.map((s) => (
          <button
            key={`${s.passage.bookId}-${s.passage.chapter}-${s.passage.verseStart}`}
            type="button"
            onClick={() => onPromote({ ...s.passage, source: 'quote', confidence: s.confidence }, s.snippet)}
            aria-label={`Destacar ${formatRef(s.passage)}: ${s.snippet}`}
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'flex-start',
              textAlign: 'left',
              padding: '0.4rem 0.6rem',
              borderRadius: '0.4rem',
              border: '1px solid color-mix(in srgb, #10b981 40%, transparent)',
              background: 'color-mix(in srgb, #10b981 8%, transparent)',
              color: 'inherit',
              cursor: 'pointer',
              fontFamily: 'inherit',
              transition: 'background 0.15s ease',
            }}
          >
            <div style={{ display: 'flex', width: '100%', justifyContent: 'space-between', fontWeight: 600, color: '#10b981' }}>
              <span>{formatRef(s.passage)}</span>
              <span style={{ fontSize: '0.7rem', opacity: 0.8 }}>
                score {s.score} {s.hasCitationClue ? '• citação' : ''}
              </span>
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--color-text-dim, #aaa)', marginTop: '0.15rem' }}>
              <HighlightedSnippet snippet={s.snippet} matchedTokens={s.matchedTokens} />
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
