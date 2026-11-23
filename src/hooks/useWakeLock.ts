'use client';

import { useEffect, useRef } from 'react';

/**
 * Hook para gerenciar o Screen Wake Lock durante a escuta do microfone.
 * Garante que a tela continue ligada e reativa o lock se a aba voltar ao foco/visibilidade.
 */
export function useWakeLock(isActive: boolean) {
  const sentinelRef = useRef<WakeLockSentinel | null>(null);

  useEffect(() => {
    // Se Wake Lock não for suportado pelo navegador, sai silenciosamente
    if (typeof window === 'undefined' || !('wakeLock' in navigator)) {
      return;
    }

    let isMounted = true;

    async function requestLock() {
      if (!isActive) return;
      try {
        if (!sentinelRef.current || sentinelRef.current.released) {
          const sentinel = await navigator.wakeLock.request('screen');
          if (isMounted) {
            sentinelRef.current = sentinel;
            sentinel.addEventListener('release', () => {
              // Limpa referência quando liberado pelo sistema
              if (sentinelRef.current === sentinel) {
                sentinelRef.current = null;
              }
            });
          } else {
            sentinel.release().catch(() => {});
          }
        }
      } catch (err) {
        // Falhas comuns: bateria fraca, permissão negada, janela minimizada
        console.warn('Não foi possível ativar o Wake Lock:', err);
      }
    }

    function releaseLock() {
      if (sentinelRef.current) {
        sentinelRef.current.release().catch(() => {});
        sentinelRef.current = null;
      }
    }

    if (isActive) {
      requestLock();
    } else {
      releaseLock();
    }

    // Reativa o lock quando o usuário voltar para a aba se a escuta estiver ativa
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && isActive) {
        requestLock();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      isMounted = false;
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      releaseLock();
    };
  }, [isActive]);
}
