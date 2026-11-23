'use client';

import { useEffect } from 'react';

export function ServiceWorkerRegister() {
  useEffect(() => {
    if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
      // Registra o service worker na raiz
      navigator.serviceWorker
        .register('/sw.js')
        .then((registration) => {
          registration.onupdatefound = () => {
            const installingWorker = registration.installing;
            if (installingWorker) {
              installingWorker.onstatechange = () => {
                if (installingWorker.state === 'installed' && navigator.serviceWorker.controller) {
                  console.info('Nova versão do Passagens Citadas disponível.');
                }
              };
            }
          };
        })
        .catch((err) => {
          console.warn('Falha ao registrar Service Worker:', err);
        });
    }
  }, []);

  return null;
}
