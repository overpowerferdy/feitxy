import { App } from '@capacitor/app';
import { Browser } from '@capacitor/browser';
import { Capacitor } from '@capacitor/core';
import { createLovableAuth } from '@lovable.dev/cloud-auth-js';
import { supabase } from '@/integrations/supabase/client';

const API_BASE = import.meta.env.VITE_API_BASE || 'https://feitxy.lovable.app';

// Google refuses to authorize inside a WebView ("disallowed_useragent"), and
// Lovable's broker rejects the WebView origin (https://localhost) as a redirect
// URI. In the native app we therefore use the system browser + a deep link back
// into the app instead of the embedded broker flow.
const REDIRECT_URL = 'com.feit.app://auth/callback';

const webAuth = createLovableAuth({ oauthBrokerUrl: '/~oauth/initiate' });

let callbackSetup = false;

/** Register once at app startup so the callback also works after a cold start. */
export function setupNativeAuthCallback() {
  if (callbackSetup || !Capacitor.isNativePlatform()) return;
  callbackSetup = true;

  App.addListener('appUrlOpen', async ({ url }) => {
    if (!url.startsWith(REDIRECT_URL)) return;

    try {
      const parsed = new URL(url);
      const hashParams = new URLSearchParams(parsed.hash.replace(/^#/, ''));
      const code = parsed.searchParams.get('code') || hashParams.get('code');
      const accessToken = hashParams.get('access_token') || parsed.searchParams.get('access_token');
      const refreshToken = hashParams.get('refresh_token') || parsed.searchParams.get('refresh_token');
      const error = parsed.searchParams.get('error') || hashParams.get('error');

      if (error) {
        console.error('[auth] OAuth error:', error);
      } else if (code) {
        const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);
        if (exchangeError) console.error('[auth] Code exchange failed:', exchangeError.message);
      } else if (accessToken && refreshToken) {
        const { error: sessionError } = await supabase.auth.setSession({
          access_token: accessToken,
          refresh_token: refreshToken,
        });
        if (sessionError) console.error('[auth] Session save failed:', sessionError.message);
      }

      await Browser.close().catch(() => undefined);
      // A full reload makes sure every component sees the new session.
      window.location.assign('/workouts');
    } catch (err) {
      console.error('[auth] Could not finish sign-in:', err);
    }
  });
}

async function signInNative() {
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: REDIRECT_URL,
      skipBrowserRedirect: true,
      // Request an authorization code so the deep link stays short and safe.
      queryParams: { prompt: 'select_account' },
    },
  });
  if (error) return { error };
  if (!data?.url) return { error: new Error('Google sign-in did not return a URL.') };

  await Browser.open({ url: data.url, toolbarColor: '#113b22' });
  return { redirected: true as const };
}

async function signInWeb() {
  const result = await webAuth.signInWithOAuth('google', {
    redirect_uri: window.location.origin,
  });

  if ('error' in result && result.error) return { error: result.error as Error };
  if ('redirected' in result && result.redirected) return { redirected: true as const };

  if ('tokens' in result && result.tokens) {
    const { error } = await supabase.auth.setSession(result.tokens);
    if (error) return { error };
    return { success: true as const };
  }

  return { error: new Error('Google sign-in returned no session.') };
}

export async function signInWithGoogle() {
  return Capacitor.isNativePlatform() ? signInNative() : signInWeb();
}

// Kept for any existing web-only callers that still reference API_BASE.
export const feitApiBase = API_BASE;
