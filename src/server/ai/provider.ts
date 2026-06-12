import "server-only";

/**
 * Provider-agnostic AI text interface. Default: Anthropic.
 * Server-side only. Used purely to PHRASE prose around pre-computed facts —
 * never to produce numbers (docs/07_ai_principles.md).
 */
export interface AiProvider {
  readonly name: string;
  /** Short single-line phrasing (≤120 tokens). */
  generateLine(system: string, user: string): Promise<string>;
  /** Longer free-form text (e.g. an email draft or summary). */
  generateText(system: string, user: string, maxTokens?: number): Promise<string>;
}

class AnthropicProvider implements AiProvider {
  readonly name = "anthropic";
  constructor(
    private apiKey: string,
    private model = "claude-haiku-4-5-20251001"
  ) {}

  private async complete(system: string, user: string, maxTokens: number): Promise<string> {
    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-api-key": this.apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: this.model,
        max_tokens: maxTokens,
        system,
        messages: [{ role: "user", content: user }],
      }),
    });
    if (!res.ok) {
      throw new Error(`Anthropic error ${res.status}`);
    }
    const data = (await res.json()) as { content?: { text?: string }[] };
    return data.content?.[0]?.text?.trim() ?? "";
  }

  generateLine(system: string, user: string): Promise<string> {
    return this.complete(system, user, 120);
  }

  generateText(system: string, user: string, maxTokens = 600): Promise<string> {
    return this.complete(system, user, maxTokens);
  }
}

/** Returns a configured provider, or null when no key is set (graceful fallback). */
export function getAiProvider(): AiProvider | null {
  const key = process.env.ANTHROPIC_API_KEY;
  if (!key) return null;
  return new AnthropicProvider(key);
}
