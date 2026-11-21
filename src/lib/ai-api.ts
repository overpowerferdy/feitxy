/**
 * Shared server-side helpers for the Feit AI API routes.
 * Never import this module from client code: it uses server-only env vars.
 */
import { createClient } from '@supabase/supabase-js';
import type { Database } from '@/integrations/supabase/types';

const MODEL = 'openai/gpt-6-astra';

function json(message: string, status: number) {
  return Response.json({ message }, { status });
}

/** Verify the bearer token sent by the Capacitor app (and the web app). */
export async function authenticateRequest(request: Request): Promise<Response | null> {
  const header = request.headers.get('authorization');
  if (!header?.startsWith('Bearer ')) return json('Unauthorized: No token provided', 401);

  const token = header.slice('Bearer '.length).trim();
  if (!token || token.split('.').length !== 3) return json('Unauthorized: Invalid token', 401);

  const url = process.env['SUPABASE_URL'];
  const key = process.env['SUPABASE_PUBLISHABLE_KEY'];
  if (!url || !key) {
    console.error('[AI API] Missing Supabase environment variables');
    return json('Server is not configured', 500);
  }

  const isNewKey = key.startsWith('sb_publishable_') || key.startsWith('sb_secret_');
  const supabase = createClient<Database>(url, key, {
    global: {
      headers: { Authorization: `Bearer ${token}` },
      fetch: (input, init) => {
        const headers = new Headers(
          typeof Request !== 'undefined' && input instanceof Request ? input.headers : undefined
        );
        if (init?.headers) new Headers(init.headers).forEach((v, k) => headers.set(k, v));
        if (isNewKey && headers.get('Authorization') === `Bearer ${key}`) {
          headers.delete('Authorization');
        }
        headers.set('apikey', key);
        return fetch(input, { ...init, headers });
      },
    },
    auth: { storage: undefined, persistSession: false, autoRefreshToken: false },
  });

  const { data, error } = await supabase.auth.getClaims(token);
  if (error || !data?.claims?.sub) return json('Unauthorized: Invalid token', 401);
  return null;
}

export async function readJson(request: Request): Promise<Record<string, unknown> | Response> {
  try {
    const body = await request.json();
    if (!body || typeof body !== 'object') return json('Invalid request body', 400);
    return body as Record<string, unknown>;
  } catch {
    return json('Invalid request body', 400);
  }
}

/** Call the Lovable AI gateway and parse its strict JSON output. */
export async function askJson<T>(
  instructions: string,
  input: unknown,
  schema: Record<string, unknown>,
  name: string,
  maxOutputTokens = 6000
): Promise<T> {
  const { generateResponse } = await import('@lovable.dev/ai-gateway');
  const res = await generateResponse({
    model: MODEL,
    instructions,
    input,
    max_output_tokens: maxOutputTokens,
    reasoning: { effort: 'low' },
    text: { format: { type: 'json_schema', name, strict: true, schema } },
  });

  let text = '';
  for (const item of res.output) {
    if (item.type === 'message') {
      for (const part of item.content) {
        if (part.type === 'output_text') text += part.text;
      }
    }
  }
  return JSON.parse(text) as T;
}

export function aiErrorResponse(error: unknown): Response {
  const status = (error as { status?: number })?.status;
  if (status === 402) return json('AI credits have run out. Add credits in your workspace, then try again.', 402);
  if (status === 429) return json('Too many requests right now. Wait a minute and try again.', 429);
  const message = error instanceof Error ? error.message : 'The AI could not finish. Please try again.';
  console.error('[AI API]', error);
  return json(message, 500);
}
