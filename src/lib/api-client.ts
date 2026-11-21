/**
 * Client-side API client for calling TanStack Start server functions
 * These functions call the deployed server at feitxy.lovable.app
 */

// Use environment variable or fallback to deployed server
export const API_BASE = import.meta.env.VITE_API_BASE || 'https://feitxy.lovable.app';

// Get auth token from Supabase session
async function getAuthToken(): Promise<string | null> {
  try {
    const { supabase } = await import('@/integrations/supabase/client');
    const { data: { session } } = await supabase.auth.getSession();
    return session?.access_token ?? null;
  } catch {
    return null;
  }
}

// Generic API call helper
export async function apiCall<T>(
  endpoint: string,
  data: Record<string, unknown>
): Promise<T> {
  const token = await getAuthToken();
  
  const response = await fetch(`${API_BASE}${endpoint}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify(data),
    credentials: 'include',
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'Request failed' }));
    throw new Error(error.message || `HTTP ${response.status}`);
  }

  return response.json();
}
