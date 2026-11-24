import { GeminiIdentifyProvider } from './gemini';
import { AnthropicIdentifyProvider } from './anthropic';
import type { IdentifyProvider } from './types';

export * from './types';
export * from './gemini';
export * from './anthropic';

export function getIdentifyProvider(): IdentifyProvider {
  const providerName = (process.env.AI_IDENTIFY_PROVIDER || 'gemini').toLowerCase();
  if (providerName === 'anthropic') {
    return new AnthropicIdentifyProvider();
  }
  return new GeminiIdentifyProvider();
}
