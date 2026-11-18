import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Configurações — Passagens Citadas',
};

export default function ConfigPage() {
  return (
    <main style={{ padding: '24px', maxWidth: '480px', margin: '0 auto' }}>
      <h1 style={{ fontFamily: 'system-ui', color: 'var(--text-primary)', marginBottom: '16px' }}>
        Configurações
      </h1>
      <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
        Em construção — provedor de voz, tamanho da fonte e tema virão na Fase 3.
      </p>
      <a
        href="/"
        style={{
          display: 'inline-block',
          marginTop: '24px',
          color: 'var(--accent)',
          fontFamily: 'system-ui',
          fontSize: '0.9rem',
          textDecoration: 'none',
        }}
      >
        ← Voltar
      </a>
    </main>
  );
}
