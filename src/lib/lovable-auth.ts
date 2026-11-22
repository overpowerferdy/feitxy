import { App } from '@capacitor/app';
import { Browser } from '@capacitor/browser';
import { Capacitor } from '@capacitor/core';
import { createLovableAuth } from '@lovable.dev/cloud-auth-js';
import { supabase } from '@/integrations/supabase/client';

const API_BASE = import.meta.env.VITE_API_BASE || 'https://feitxy.lovable.app';

// This project uses Lovable's managed Google OAuth broker. Supabase's own
// /auth/v1/authorize endpoint has no Google secret configured here.
// Google also blocks OAuth inside a WebView, so the native app opens the broker
// in the system browser and receives the result through a deep link.
const REDIRECT_URL = `${API_BASE}/mobile-auth-callback`;
const DEEP_LINK = 'com.feit.app://auth/callback';
const STATE_KEY = 'feit-oauth-state';

const webAuth = createLovableAuth({ oauthBrokerUrl: '/~oauth/initiate' });

let callbackSetup = false;

function randomState() {
  const bytes = new Uint8Array(16);
  if (typeof crypto !== 'undefined' && crypto.getRandomValues) crypto.getRandomValues(bytes);
  else for (let i = 0; i < bytes.length; i += 1) bytes[i] = Math.floor(Math.random() * 256);
  return Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('');
}

/** Register once at app startup so the callback also works after a cold start. */
export function setupNativeAuthCallback() {
  if (callbackSetup || !Capacitor.isNativePlatform()) return;
  callbackSetup = true;

  App.addListener('appUrlOpen', async ({ url }) => {
    if (!url.startsWith(DEEP_LINK)) return;

    try {
      const parsed = new URL(url);
      const hashParams = new URLSearchParams(parsed.hash.replace(/^#/, ''));
      const query = parsed.searchParams;
      const code = query.get('code') || hashParams.get('code');
      const accessToken = hashParams.get('access_token') || query.get('access_token');
      const refreshToken = hashParams.get('refresh_token') || query.get('refresh_token');
      const state = hashParams.get('state') || query.get('state');
      const error = query.get('error') || hashParams.get('error');
      const expectedState = localStorage.getItem(STATE_KEY);

      if (expectedState && state && state !== expectedState) {
        console.error('[auth] OAuth state mismatch');
      } else if (error) {
        console.error('[auth] OAuth error:', error);
      } else {
        if (expectedState) localStorage.removeItem(STATE_KEY);
        if (code) {
          const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);
          if (exchangeError) console.error('[auth] Code exchange failed:', exchangeError.message);
        } else if (accessToken && refreshToken) {
          const { error: sessionError } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken,
          });
          if (sessionError) console.error('[auth] Session save failed:', sessionError.message);
        }
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
  const state = randomState();
  localStorage.setItem(STATE_KEY, state);
  const params = new URLSearchParams({
    provider: 'google',
    redirect_uri: REDIRECT_URL,
    state,
  });
  await Browser.open({
    url: `${API_BASE}/~oauth/initiate?${params.toString()}`,
    toolbarColor: '#113b22',
  });
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
