import type { IdentifyProvider, IdentifyRequest, IdentifyResult } from './types';

/**
 * Provedor Google Gemini via REST API direta (sem bibliotecas externas pesadas).
 * Utiliza GEMINI_API_KEY e modelo definido em GEMINI_MODEL (fallback: gemini-2.5-flash).
 */
export class GeminiIdentifyProvider implements IdentifyProvider {
  name = 'gemini';

  private apiKey: string;
  private model: string;

  constructor(apiKey?: string, model?: string) {
    this.apiKey = apiKey || process.env.GEMINI_API_KEY || '';
    this.model = model || process.env.GEMINI_MODEL || 'gemini-2.5-flash';
  }

  async identify(req: IdentifyRequest): Promise<IdentifyResult> {
    if (!this.apiKey) {
      throw new Error('GEMINI_API_KEY não configurada no servidor');
    }

    const candidateList = req.candidates
      .slice(0, 15)
      .map((c, i) => `[${i + 1}] ${c.bookName} ${c.chapter}:${c.verse} - "${c.text}"`)
      .join('\n');

    const prompt = `Você é um assistente teológico especialista na Bíblia Sagrada (tradução Almeida Revista e Corrigida - ARC).
O pastor está pregando e falou o seguinte trecho (pode ser uma citação direta, uma paráfrase ou com comentários no meio):
"${req.text}"

Candidatos pré-selecionados da busca léxica:
${candidateList.length > 0 ? candidateList : '(nenhum candidato próximo)'}

Tarefa:
Identifique se o pregador está citando ou parafraseando um versículo bíblico específico da ARC.
Se houver alta certeza, indique o livro, capítulo e versículo (priorize os candidatos se um deles corresponder).
Se não houver certeza ou for apenas discurso comum de pregação, marque identified como false.

Responda ESTRITAMENTE em formato JSON com o seguinte esquema:
{
  "identified": boolean,
  "reference": {
    "bookName": string,
    "chapter": number,
    "verseStart": number,
    "verseEnd": number (opcional)
  },
  "reasoning": string
}`;

    const url = `https://generativelanguage.googleapis.com/v1beta/models/${this.model}:generateContent?key=${this.apiKey}`;

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3000); // Timeout estrito de 3 segundos

    try {
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        signal: controller.signal,
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: {
            temperature: 0.1,
            responseMimeType: 'application/json',
          },
        }),
      });

      if (!res.ok) {
        if (res.status === 429) {
          const err = new Error('Rate limit exceeded (429)');
          (err as any).status = 429;
          throw err;
        }
        throw new Error(`Gemini API error: ${res.status} ${res.statusText}`);
      }

      const data = await res.json();
      const rawText = data?.candidates?.[0]?.content?.parts?.[0]?.text;
      if (!rawText) {
        return { identified: false, provider: this.name };
      }

      const parsed = JSON.parse(rawText) as IdentifyResult;
      return {
        identified: Boolean(parsed.identified && parsed.reference),
        reference: parsed.reference,
        reasoning: parsed.reasoning,
        provider: this.name,
      };
    } finally {
      clearTimeout(timeoutId);
    }
  }
}
