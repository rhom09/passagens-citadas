'use client';

import { useState, useRef, useCallback } from 'react';
import { useAppStore } from '../lib/store/app-context';
import styles from './SearchBar.module.css';

async function detectText(text: string) {
  const { detect } = await import('../lib/detect/index');
  return detect(text);
}

export function SearchBar() {
  const { dispatch } = useAppStore();
  const [query, setQuery] = useState('');
  const [status, setStatus] = useState<'idle' | 'not-found'>('idle');
  const inputRef = useRef<HTMLInputElement>(null);

  const search = useCallback(async (q: string) => {
    const trimmed = q.trim();
    if (!trimmed) return;

    const passages = await detectText(trimmed);

    if (passages.length === 0) {
      setStatus('not-found');
      return;
    }

    setStatus('idle');
    dispatch({ type: 'MANUAL_RESULT', passage: passages[0]! });
    setQuery('');
  }, [dispatch]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      search(query);
    } else if (e.key === 'Escape') {
      setQuery('');
      setStatus('idle');
      inputRef.current?.blur();
    } else {
      setStatus('idle');
    }
  };

  return (
    <div className={styles.wrap} role="search" aria-label="Busca manual de passagem">
      <label htmlFor="search-input" className={styles.srOnly}>
        Buscar passagem bíblica
      </label>
      <div className={styles.inputWrap}>
        <SearchIcon />
        <input
          ref={inputRef}
          id="search-input"
          className={`${styles.input} ${status === 'not-found' ? styles.inputErr : ''}`}
          type="search"
          inputMode="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="jo 3 16 · rm 8 · 1co 13:4-7"
          aria-invalid={status === 'not-found'}
          aria-describedby={status === 'not-found' ? 'search-err' : undefined}
          autoComplete="off"
          spellCheck={false}
        />
        {query && (
          <button
            className={styles.clearBtn}
            onClick={() => { setQuery(''); setStatus('idle'); inputRef.current?.focus(); }}
            aria-label="Limpar busca"
            type="button"
            tabIndex={-1}
          >
            ×
          </button>
        )}
      </div>

      <button
        className={styles.searchBtn}
        onClick={() => search(query)}
        disabled={!query.trim()}
        aria-label="Buscar"
        type="button"
      >
        Buscar
      </button>

      {status === 'not-found' && (
        <p id="search-err" className={styles.errMsg} role="alert">
          Passagem não encontrada
        </p>
      )}
    </div>
  );
}

function SearchIcon() {
  return (
    <svg
      className={styles.searchIcon}
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
    >
      <circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="1.8" />
      <line x1="16.5" y1="16.5" x2="22" y2="22" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}
