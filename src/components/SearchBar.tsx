'use client';

import { useState, useRef, useCallback, useEffect, useId } from 'react';
import { useAppStore } from '../lib/store/app-context';
import { parseManualReference } from '../lib/detect/manual';
import { useManualSearch } from '../hooks/useManualSearch';
import { loadBible, getPassageText } from '../lib/bible/loader';
import { HighlightedSnippet } from './HighlightedSnippet';
import type { Passage } from '../lib/detect/types';
import type { SearchSuggestion } from '../lib/search/types';
import styles from './SearchBar.module.css';

interface SearchOption {
  id: string;
  passage: Passage;
  title: string;
  snippet?: string;
  matchedTokens?: string[];
  type: 'reference' | 'text';
  score?: number;
}

function formatPassageTitle(p: Passage): string {
  if (p.verseStart !== undefined) {
    if (p.verseEnd !== undefined && p.verseEnd !== p.verseStart) {
      return `${p.bookName} ${p.chapter}:${p.verseStart}–${p.verseEnd}`;
    }
    return `${p.bookName} ${p.chapter}:${p.verseStart}`;
  }
  return `${p.bookName} ${p.chapter}`;
}

export function SearchBar() {
  const { dispatch } = useAppStore();
  const [query, setQuery] = useState('');
  const [options, setOptions] = useState<SearchOption[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const [status, setStatus] = useState<'idle' | 'not-found'>('idle');

  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const listboxId = useId();

  const { searchManual } = useManualSearch();

  // Executa busca combinada com debounce
  useEffect(() => {
    const trimmed = query.trim();
    if (trimmed.length < 3) {
      setOptions([]);
      setIsOpen(false);
      setActiveIndex(-1);
      setStatus('idle');
      return;
    }

    const timer = setTimeout(async () => {
      const results: SearchOption[] = [];

      // 1. Tentar detectar referência (abreviação ou sintaxe falada)
      const { passages, isReferenceQuery } = parseManualReference(trimmed);

      if (passages.length > 0) {
        // Tentar obter snippet dos versículos para enriquecer
        let bibleLoaded = null;
        try {
          bibleLoaded = await loadBible();
        } catch {}

        for (const p of passages) {
          let textSnippet: string | undefined;
          if (bibleLoaded) {
            textSnippet = getPassageText(bibleLoaded, p);
            if (textSnippet && textSnippet.length > 120) {
              textSnippet = textSnippet.slice(0, 120) + '...';
            }
          }
          results.push({
            id: `ref-${p.bookId}-${p.chapter}-${p.verseStart ?? 'all'}`,
            passage: p,
            title: formatPassageTitle(p),
            snippet: textSnippet,
            type: 'reference',
          });
        }
      }

      // 2. Tentar busca léxica (BM25)
      // Se não for puramente uma consulta de referência ("jo 3:16"), ou como complemento
      try {
        const textSuggestions: SearchSuggestion[] = await searchManual(
          `manual-${Date.now()}`,
          trimmed,
          8
        );

        for (const s of textSuggestions) {
          // Não duplicar se já foi adicionado como referência
          const isDup = results.some(
            (r) =>
              r.passage.bookId === s.passage.bookId &&
              r.passage.chapter === s.passage.chapter &&
              r.passage.verseStart === s.passage.verseStart
          );
          if (!isDup) {
            const passage = { ...s.passage, source: 'manual' as const, confidence: s.confidence };
            results.push({
              id: `text-${s.passage.bookId}-${s.passage.chapter}-${s.passage.verseStart}`,
              passage,
              title: formatPassageTitle(passage),
              snippet: s.snippet,
              matchedTokens: s.matchedTokens,
              type: 'text',
              score: s.score,
            });
          }
        }
      } catch (err) {
        console.error('Erro na busca BM25:', err);
      }

      setOptions(results);
      setIsOpen(results.length > 0);
      setActiveIndex(results.length > 0 ? 0 : -1);
      setStatus(results.length === 0 && isReferenceQuery ? 'not-found' : 'idle');
    }, 200);

    return () => clearTimeout(timer);
  }, [query, searchManual]);

  const selectOption = useCallback(
    (opt: SearchOption) => {
      dispatch({
        type: 'MANUAL_RESULT',
        passage: opt.passage,
        snippet: opt.snippet,
      });
      setQuery('');
      setIsOpen(false);
      setOptions([]);
      setActiveIndex(-1);
      setStatus('idle');
      inputRef.current?.blur();
    },
    [dispatch]
  );

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (!isOpen && options.length > 0) {
        setIsOpen(true);
        setActiveIndex(0);
        return;
      }
      if (options.length > 0) {
        setActiveIndex((prev) => (prev + 1) % options.length);
      }
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (options.length > 0) {
        setActiveIndex((prev) => (prev - 1 + options.length) % options.length);
      }
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (isOpen && activeIndex >= 0 && activeIndex < options.length) {
        selectOption(options[activeIndex]!);
      } else if (options.length > 0) {
        selectOption(options[0]!);
      } else {
        // Fallback: se o operador der Enter sem sugestões
        const { passages } = parseManualReference(query.trim());
        if (passages.length > 0) {
          dispatch({ type: 'MANUAL_RESULT', passage: passages[0]! });
          setQuery('');
          setIsOpen(false);
        } else {
          setStatus('not-found');
        }
      }
    } else if (e.key === 'Escape') {
      e.preventDefault();
      setIsOpen(false);
      setQuery('');
      setStatus('idle');
      inputRef.current?.blur();
    }
  };

  // Fechar dropdown ao clicar fora
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node) &&
        inputRef.current &&
        !inputRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className={styles.container} role="search" aria-label="Busca manual de passagem">
      <div className={styles.wrap}>
        <label htmlFor="search-input" className={styles.srOnly}>
          Buscar passagem bíblica por referência ou texto
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
            onFocus={() => {
              if (options.length > 0) setIsOpen(true);
            }}
            onKeyDown={handleKeyDown}
            placeholder="jo 3 16 · rm 8 · ou texto livre..."
            aria-invalid={status === 'not-found'}
            aria-describedby={status === 'not-found' ? 'search-err' : undefined}
            aria-autocomplete="list"
            aria-controls={isOpen ? listboxId : undefined}
            aria-activedescendant={
              isOpen && activeIndex >= 0 ? `${listboxId}-opt-${activeIndex}` : undefined
            }
            autoComplete="off"
            spellCheck={false}
          />
          {query && (
            <button
              className={styles.clearBtn}
              onClick={() => {
                setQuery('');
                setOptions([]);
                setIsOpen(false);
                setStatus('idle');
                inputRef.current?.focus();
              }}
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
          onClick={() => {
            if (options.length > 0) {
              selectOption(options[activeIndex >= 0 ? activeIndex : 0]!);
            } else {
              const { passages } = parseManualReference(query.trim());
              if (passages.length > 0) {
                dispatch({ type: 'MANUAL_RESULT', passage: passages[0]! });
                setQuery('');
              } else {
                setStatus('not-found');
              }
            }
          }}
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

      {isOpen && options.length > 0 && (
        <div
          ref={dropdownRef}
          id={listboxId}
          className={styles.dropdown}
          role="listbox"
          aria-label="Resultados da busca bíblica"
        >
          <div className={styles.dropdownHeader}>
            {options.some((o) => o.type === 'reference') ? 'Passagens encontradas' : 'Versículos sugeridos'}
          </div>

          {options.map((opt, idx) => {
            const isSelected = idx === activeIndex;
            return (
              <button
                key={opt.id}
                id={`${listboxId}-opt-${idx}`}
                role="option"
                aria-selected={isSelected}
                tabIndex={-1}
                type="button"
                className={`${styles.resultItem} ${isSelected ? styles.resultItemActive : ''}`}
                onClick={() => selectOption(opt)}
                onMouseEnter={() => setActiveIndex(idx)}
              >
                <div className={styles.resultTopRow}>
                  <span className={styles.refTitle}>{opt.title}</span>
                  <span className={opt.type === 'reference' ? styles.badgeRef : styles.badgeText}>
                    {opt.type === 'reference' ? 'Referência' : opt.score ? `Texto · score ${opt.score}` : 'Texto'}
                  </span>
                </div>
                {opt.snippet && (
                  <div className={styles.snippetRow}>
                    <HighlightedSnippet snippet={opt.snippet} matchedTokens={opt.matchedTokens} />
                  </div>
                )}
              </button>
            );
          })}

          <div className={styles.footerTips}>
            <span>↑↓ para navegar · Enter para selecionar</span>
            <span>Esc para fechar</span>
          </div>
        </div>
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
