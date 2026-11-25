import { normalize } from '../lib/detect/normalize';
import { stemWord, isFuzzyMatch } from '../lib/search/stemmer';

interface HighlightedSnippetProps {
  snippet: string;
  matchedTokens?: string[];
  style?: React.CSSProperties;
}

/**
 * Renderiza um snippet bíblico destacando em negrito as palavras correspondentes à busca
 */
export function HighlightedSnippet({ snippet, matchedTokens, style }: HighlightedSnippetProps) {
  if (!matchedTokens || matchedTokens.length === 0) {
    return <span style={style}>&ldquo;{snippet}&rdquo;</span>;
  }

  const targetStems = new Set(matchedTokens.map((t) => stemWord(t)));
  const targetTokens = new Set(matchedTokens);

  const words = snippet.split(/\s+/);

  return (
    <span style={style}>
      &ldquo;
      {words.map((w, idx) => {
        const clean = normalize(w).replace(/[^a-z0-9]/g, '');
        const isExact = targetTokens.has(clean);
        const isStem = !isExact && targetStems.has(stemWord(clean));
        const isFuzzy = !isExact && !isStem && matchedTokens.some((t) => isFuzzyMatch(clean, t));

        const isMatch = isExact || isStem || isFuzzy;

        return (
          <span key={idx}>
            {idx > 0 && ' '}
            {isMatch ? (
              <strong style={{ color: 'var(--text-primary, #fff)', fontWeight: 700 }}>{w}</strong>
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
