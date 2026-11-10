'use client';

/**
 * Renders the Cloudflare Turnstile challenge for a form that opted in with `useFormGuard({ turnstile: true })`.
 * Managed mode: invisible for most visitors, a short checkbox only when Cloudflare doubts them. The
 * token lands in the guard (single use); `guard.turnstile.refresh()` after each submit resets the widget.
 * Renders nothing when NEXT_PUBLIC_TURNSTILE_SITE_KEY is not set.
 */
import { useEffect, useRef } from 'react';
import type { FormGuard } from './client';

type TurnstileApi = {
  render: (el: HTMLElement, options: Record<string, unknown>) => string;
  reset: (id?: string) => void;
  remove: (id?: string) => void;
};

declare global {
  interface Window {
    turnstile?: TurnstileApi;
  }
}

const SCRIPT_SRC = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit';
let scriptPromise: Promise<void> | null = null;

function loadScript(): Promise<void> {
  if (window.turnstile) return Promise.resolve();
  if (!scriptPromise) {
    scriptPromise = new Promise<void>((resolve, reject) => {
      const el = document.createElement('script');
      el.src = SCRIPT_SRC;
      el.async = true;
      el.defer = true;
      el.onload = () => resolve();
      el.onerror = () => {
        scriptPromise = null;
        reject(new Error('Turnstile failed to load'));
      };
      document.head.appendChild(el);
    });
  }
  return scriptPromise;
}

export function TurnstileWidget({ guard, className }: { guard: FormGuard; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const siteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;
  const { onToken, registerReset, enabled } = guard.turnstile;

  useEffect(() => {
    if (!enabled || !siteKey || !ref.current) return;
    let widgetId: string | undefined;
    let cancelled = false;
    loadScript()
      .then(() => {
        if (cancelled || !ref.current || !window.turnstile) return;
        widgetId = window.turnstile.render(ref.current, {
          sitekey: siteKey,
          appearance: 'interaction-only',
          callback: (token: string) => onToken(token),
          'expired-callback': () => onToken(''),
          'error-callback': () => onToken(''),
        });
        registerReset(() => {
          if (widgetId && window.turnstile) window.turnstile.reset(widgetId);
        });
      })
      .catch(() => {});
    return () => {
      cancelled = true;
      if (widgetId && window.turnstile) window.turnstile.remove(widgetId);
    };
  }, [enabled, siteKey, onToken, registerReset]);

  if (!enabled) return null;
  return <div ref={ref} className={className} />;
}
