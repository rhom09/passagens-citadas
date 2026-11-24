import type { IdentifyProvider, IdentifyRequest, IdentifyResult } from './types';

/**
 * Provedor Anthropic Claude (estrutura preparada para extensão futura).
 */
export class AnthropicIdentifyProvider implements IdentifyProvider {
  name = 'anthropic';

  private apiKey: string;
  private model: string;

  constructor(apiKey?: string, model?: string) {
    this.apiKey = apiKey || process.env.ANTHROPIC_API_KEY || '';
    this.model = model || process.env.ANTHROPIC_MODEL || 'claude-haiku-4-5';
  }

  async identify(_req: IdentifyRequest): Promise<IdentifyResult> {
    if (!this.apiKey) {
      throw new Error('ANTHROPIC_API_KEY não configurada no servidor');
    }
    // Stub pronto para plugar quando requisitado
    throw new Error('Provedor Anthropic ainda não habilitado nesta versão');
  }
}
