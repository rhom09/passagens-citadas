'use client';

import { useAppStore } from '../lib/store/app-context';
import { useSpeechControl } from '../hooks/useSpeechControl';
import styles from './StatusBar.module.css';

export function StatusBar() {
  const { state } = useAppStore();
  const { toggle } = useSpeechControl();
  const { micStatus, micError } = state;

  const isListening = micStatus === 'listening';
  const isError = micStatus === 'error';

  return (
    <header className={styles.bar} role="banner">
      <div className={styles.statusGroup} aria-live="polite" aria-atomic="true">
        <span
          className={`${styles.dot} ${isListening ? styles.dotOn : ''} ${isError ? styles.dotErr : ''}`}
          aria-hidden="true"
        />
        <span className={styles.label}>
          {isError
            ? micError ?? 'Erro'
            : isListening
              ? 'Escutando'
              : 'Em pausa'}
        </span>
      </div>

      <div className={styles.actions}>
        <button
          className={`${styles.micBtn} ${isListening ? styles.micBtnOn : ''}`}
          onClick={toggle}
          aria-pressed={isListening}
          aria-label={isListening ? 'Parar escuta' : 'Iniciar escuta'}
          type="button"
        >
          <MicIcon active={isListening} />
        </button>

        <a href="/config" className={styles.configBtn} aria-label="Configurações">
          <SettingsIcon />
        </a>
      </div>
    </header>
  );
}

function MicIcon({ active }: { active: boolean }) {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <rect x="9" y="2" width="6" height="12" rx="3" fill={active ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="1.8" />
      <path d="M5 10a7 7 0 0 0 14 0" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      <line x1="12" y1="17" x2="12" y2="22" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      <line x1="8" y1="22" x2="16" y2="22" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

function SettingsIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="1.8" />
      <path
        d="M12 2v2M12 20v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M2 12h2M20 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  );
}
