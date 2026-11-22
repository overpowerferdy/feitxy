import { createFileRoute } from '@tanstack/react-router';
import { useEffect, useMemo, useState } from 'react';

/**
 * The Lovable OAuth broker only accepts HTTPS redirect URLs on this origin.
 * This page receives the tokens here and hands them to the native app through
 * its com.feit.app custom scheme.
 */
export const Route = createFileRoute('/mobile-auth-callback')({
  head: () => ({
    meta: [
      { title: 'Signing in — Feit' },
      { name: 'robots', content: 'noindex' },
    ],
  }),
  component: MobileAuthCallback,
});

function MobileAuthCallback() {
  const [deepLink, setDeepLink] = useState('');

  const message = useMemo(() => {
    if (!deepLink) return 'Finishing sign-in…';
    return 'Opening Feit…';
  }, [deepLink]);

  useEffect(() => {
    const fragment = window.location.hash.replace(/^#/, '');
    const raw = new URLSearchParams(fragment || window.location.search.slice(1));
    const forwarded = new URLSearchParams();

    for (const key of ['access_token', 'refresh_token', 'code', 'state', 'error', 'error_description']) {
      const value = raw.get(key);
      if (value) forwarded.set(key, value);
    }

    const target = `com.feit.app://auth/callback#${forwarded.toString()}`;
    setDeepLink(target);
    window.location.replace(target);
  }, []);

  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-6 text-center">
      <div>
        <h1 className="text-xl font-semibold text-foreground">{message}</h1>
        {deepLink && (
          <a
            href={deepLink}
            className="mt-4 inline-block rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground"
          >
            Tap here if you are not redirected
          </a>
        )}
      </div>
    </main>
  );
}
