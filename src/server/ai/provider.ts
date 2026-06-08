import "server-only";

/**
 * Provider-agnostic AI text interface. Default: Anthropic.
 * Server-side only. Used purely to PHRASE prose around pre-computed facts —
 * never to produce numbers (docs/07_ai_principles.md).
 */
export interface AiProvider {
  readonly name: string;
  generateLine(system: string, user: string): Promise<string>;
}

class AnthropicProvider implements AiProvider {
  readonly name = "anthropic";
  constructor(
    private apiKey: string,
    private model = "claude-haiku-4-5-20251001"
  ) {}

  async generateLine(system: string, user: string): Promise<string> {
    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-api-key": this.apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: this.model,
        max_tokens: 120,
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
}

/** Returns a configured provider, or null when no key is set (graceful fallback). */
export function getAiProvider(): AiProvider | null {
  const key = process.env.ANTHROPIC_API_KEY;
  if (!key) return null;
  return new AnthropicProvider(key);
}
