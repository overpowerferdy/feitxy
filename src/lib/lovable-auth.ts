import { Capacitor } from '@capacitor/core';
import { createLovableAuth } from '@lovable.dev/cloud-auth-js';
import { supabase } from '@/integrations/supabase/client';

const API_BASE = import.meta.env.VITE_API_BASE || 'https://feitxy.lovable.app';

// The Lovable OAuth broker endpoint (/~oauth/initiate) only exists on the deployed
// server. Inside the Capacitor WebView a relative URL resolves to the local app
// assets, which have no such route and produce the app's "404 Page not found".
// Point the broker at the deployed server for native builds, then let Supabase's
// detectSessionInUrl consume the tokens when the broker redirects back to the app.
const auth = createLovableAuth({
  oauthBrokerUrl: Capacitor.isNativePlatform()
    ? `${API_BASE}/~oauth/initiate`
    : '/~oauth/initiate',
});

export async function signInWithGoogle() {
  const result = await auth.signInWithOAuth('google', {
    redirect_uri: window.location.origin,
  });

  if ('error' in result && result.error) {
    return { error: result.error as Error };
  }

  if ('redirected' in result && result.redirected) {
    // Full-page navigation to the broker: tokens return in the URL fragment and
    // the Supabase client picks them up automatically on the next page load.
    return { redirected: true as const };
  }

  if ('tokens' in result && result.tokens) {
    const { error } = await supabase.auth.setSession(result.tokens);
    if (error) return { error };
    return { success: true as const };
  }

  return { error: new Error('Google sign-in returned no session.') };
}
