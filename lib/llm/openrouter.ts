/**
 * One chat-completion call to an open-weight model through OpenRouter.
 *
 * Rule (John, 2026-10-12): models inside Vibrana tools are open-weight models on
 * OpenRouter, chosen by trial. Never an Anthropic model through the API.
 *
 * Every request is routed only to providers that keep no data and do not train on it
 * (`zdr`, `data_collection: deny`), and that honor every parameter we send
 * (`require_parameters`), so a JSON-schema request never lands on a provider that ignores
 * the schema. Reasoning is switched off: these are plain completions.
 */

export const OPENROUTER_CHAT_URL = 'https://openrouter.ai/api/v1/chat/completions';

/** OpenRouter provider slugs for the model vendors' first-party APIs. */
export const IGNORED_PROVIDERS = ['deepseek', 'alibaba', 'z-ai', 'moonshotai'] as const;

export type ChatMessage = { role: 'system' | 'user' | 'assistant'; content: string };

export interface ChatRequest {
  model: string;
  messages: ChatMessage[];
  maxTokens: number;
  temperature?: number;
  /** Structured output. The reply is still validated by the caller. */
  jsonSchema?: { name: string; schema: Record<string, unknown> };
  timeoutMs: number;
  /** Shown in the OpenRouter dashboard, e.g. "Vibrana AI Readiness analysis". */
  title: string;
}

export interface ChatResult {
  text: string | null;
  /** OpenRouter's reported cost for this call, in USD. */
  costUsd: number | null;
  latencyMs: number;
  promptTokens: number | null;
  completionTokens: number | null;
  error?: string;
}

export function openRouterConfigured(): boolean {
  return !!process.env.OPENROUTER_API_KEY;
}

export function chatRequestBody(req: ChatRequest) {
  return {
    model: req.model,
    messages: req.messages,
    temperature: req.temperature ?? 0.3,
    max_tokens: req.maxTokens,
    reasoning: { enabled: false },
    ...(req.jsonSchema
      ? { response_format: { type: 'json_schema', json_schema: { name: req.jsonSchema.name, strict: true, schema: req.jsonSchema.schema } } }
      : {}),
    // Fastest qualifying provider first: the buyer is waiting on the results page.
    // The model vendors' own APIs are never used, whatever OpenRouter's zero-retention list says
    // on a given day (the privacy policy promises third-party hosts).
    provider: { require_parameters: true, data_collection: 'deny', zdr: true, sort: 'latency', ignore: [...IGNORED_PROVIDERS] },
    usage: { include: true },
  };
}

/** Strips a ```json fence some models add around structured output. */
export function stripJsonFence(text: string): string {
  return text.replace(/^\s*```(?:json)?\s*/i, '').replace(/\s*```\s*$/, '').trim();
}

export async function chat(req: ChatRequest): Promise<ChatResult> {
  const key = process.env.OPENROUTER_API_KEY;
  const started = Date.now();
  const empty = { costUsd: null, promptTokens: null, completionTokens: null };
  if (!key) return { text: null, latencyMs: 0, error: 'no-key', ...empty };
  try {
    const res = await fetch(OPENROUTER_CHAT_URL, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${key}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'https://www.vibrana.ai',
        'X-Title': req.title,
      },
      body: JSON.stringify(chatRequestBody(req)),
      signal: AbortSignal.timeout(req.timeoutMs),
    });
    const latencyMs = Date.now() - started;
    if (!res.ok) return { text: null, latencyMs, error: `http-${res.status}`, ...empty };
    const data = await res.json();
    const usage = data?.usage ?? {};
    const content = data?.choices?.[0]?.message?.content;
    const text = typeof content === 'string' && content.trim() ? content.trim() : null;
    return {
      text,
      latencyMs,
      costUsd: typeof usage.cost === 'number' ? usage.cost : null,
      promptTokens: typeof usage.prompt_tokens === 'number' ? usage.prompt_tokens : null,
      completionTokens: typeof usage.completion_tokens === 'number' ? usage.completion_tokens : null,
      error: text ? undefined : 'empty',
    };
  } catch (err) {
    const name = err instanceof Error ? err.name : 'error';
    return { text: null, latencyMs: Date.now() - started, error: name === 'TimeoutError' || name === 'AbortError' ? 'timeout' : name, ...empty };
  }
}
