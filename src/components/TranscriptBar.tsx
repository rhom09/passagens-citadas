'use client';

import { useState, useRef } from 'react';
import { useAppStore } from '../lib/store/app-context';
import styles from './TranscriptBar.module.css';

export function TranscriptBar() {
  const { state } = useAppStore();
  const [collapsed, setCollapsed] = useState(false);
  const { currentTranscript } = state;

  if (!currentTranscript && state.micStatus !== 'listening') return null;

  return (
    <div className={styles.bar}>
      <button
        className={styles.toggle}
        onClick={() => setCollapsed((c) => !c)}
        aria-expanded={!collapsed}
        aria-controls="transcript-content"
        aria-label={collapsed ? 'Expandir transcrição' : 'Recolher transcrição'}
        type="button"
      >
        <span className={styles.label}>Transcrição</span>
        <ChevronIcon collapsed={collapsed} />
      </button>

      {!collapsed && (
        <div id="transcript-content" className={styles.content} aria-live="polite" aria-atomic="false">
          {currentTranscript ? (
            <p className={styles.text}>
              {currentTranscript}
              <span className={styles.cursor} aria-hidden="true">▌</span>
            </p>
          ) : (
            <p className={styles.idle}>—</p>
          )}
        </div>
      )}
    </div>
  );
}

function ChevronIcon({ collapsed }: { collapsed: boolean }) {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
      style={{ transform: collapsed ? 'rotate(-90deg)' : 'none', transition: 'transform 0.15s' }}
    >
      <path d="M6 9l6 6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
