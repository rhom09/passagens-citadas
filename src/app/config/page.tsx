'use client';

import { useAiIdentify } from '@/hooks/useAiIdentify';

export default function ConfigPage() {
  const { config, callsCount, updateConfig, resetCalls } = useAiIdentify();

  return (
    <main style={{ padding: '24px', maxWidth: '520px', margin: '0 auto', fontFamily: 'system-ui, sans-serif' }}>
      <h1 style={{ color: 'var(--text-primary)', marginBottom: '8px', fontSize: '1.4rem' }}>
        Configurações
      </h1>
      <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '24px' }}>
        Ajustes do aplicativo, transcrição e detecção de passagens.
      </p>

      {/* Seção Fase 5b: Camada de IA */}
      <section
        style={{
          border: '1px solid color-mix(in srgb, #6366f1 30%, transparent)',
          borderRadius: '8px',
          padding: '16px',
          background: 'color-mix(in srgb, #6366f1 5%, transparent)',
          marginBottom: '24px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
          <div>
            <h2 style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--text-primary)', margin: 0 }}>
              🤖 Camada de IA (Paráfrases)
            </h2>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
              Identifica citações parafraseadas quando a busca léxica não encontrar
            </span>
          </div>
          <label style={{ position: 'relative', display: 'inline-block', width: '44px', height: '24px' }}>
            <input
              type="checkbox"
              checked={config.enabled}
              onChange={(e) => updateConfig({ enabled: e.target.checked })}
              style={{ opacity: 0, width: 0, height: 0 }}
            />
            <span
              style={{
                position: 'absolute',
                cursor: 'pointer',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                backgroundColor: config.enabled ? '#6366f1' : '#4b5563',
                transition: '0.2s',
                borderRadius: '24px',
              }}
            >
              <span
                style={{
                  position: 'absolute',
                  content: '""',
                  height: '18px',
                  width: '18px',
                  left: config.enabled ? '23px' : '3px',
                  bottom: '3px',
                  backgroundColor: 'white',
                  transition: '0.2s',
                  borderRadius: '50%',
                }}
              />
            </span>
          </label>
        </div>

        {/* Aviso de privacidade obrigatório */}
        <div
          style={{
            fontSize: '0.75rem',
            lineHeight: 1.4,
            padding: '10px 12px',
            background: 'color-mix(in srgb, #eab308 12%, transparent)',
            border: '1px solid color-mix(in srgb, #eab308 30%, transparent)',
            borderRadius: '6px',
            color: '#fbbf24',
            marginBottom: '14px',
          }}
        >
          ⚠️ <strong>Aviso de Privacidade:</strong> O texto transcrito é enviado a um serviço externo; na camada gratuita do Google ele pode ser usado para melhorar os produtos deles.
        </div>

        {/* Configurações de chamada */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', fontSize: '0.85rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span>Teto máximo por culto:</span>
            <input
              type="number"
              min={5}
              max={200}
              value={config.maxCallsPerService}
              disabled={!config.enabled}
              onChange={(e) => updateConfig({ maxCallsPerService: parseInt(e.target.value, 10) || 40 })}
              style={{
                width: '70px',
                padding: '4px 8px',
                borderRadius: '4px',
                border: '1px solid #4b5563',
                background: 'rgba(0,0,0,0.2)',
                color: 'inherit',
                textAlign: 'center',
              }}
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span>Chamadas realizadas neste culto:</span>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontWeight: 'bold', color: callsCount >= config.maxCallsPerService ? '#ef4444' : '#10b981' }}>
                {callsCount} / {config.maxCallsPerService}
              </span>
              <button
                type="button"
                onClick={resetCalls}
                style={{
                  padding: '2px 8px',
                  fontSize: '0.7rem',
                  borderRadius: '4px',
                  border: '1px solid #6b7280',
                  background: 'transparent',
                  color: 'inherit',
                  cursor: 'pointer',
                }}
              >
                Zerar
              </button>
            </div>
          </div>

          <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)', margin: 0 }}>
            * Intervalo mínimo automático de 8 segundos entre requisições. Se a API atingir o limite (429), as chamadas são pausadas silenciosamente por 60 s.
          </p>
        </div>
      </section>

      <a
        href="/"
        style={{
          display: 'inline-block',
          color: 'var(--accent, #10b981)',
          fontSize: '0.9rem',
          textDecoration: 'none',
        }}
      >
        ← Voltar ao púlpito
      </a>
    </main>
  );
}
