'use client';

/**
 * Client half of the form guard: fetches a signed render token and renders the
 * honeypot. See lib/form-guard/server.ts for what the server does with them.
 */
import { useCallback, useEffect, useMemo, useRef, useState, type RefObject } from 'react';
import { FORM_GUARD_MESSAGES } from '@/src/form-guard-content';
import { FORM_TOKEN_ENDPOINT, HONEYPOT_FIELD, TOKEN_FIELD, TURNSTILE_FIELD } from './constants';

type Options = {
  /** Don't fetch a token until this is true (e.g. a popup that isn't open yet). Default true. */
  enabled?: boolean;
  /** When set, wait until this element is near the viewport before fetching (footer forms). */
  lazyRef?: RefObject<Element | null>;
  /** Show a Cloudflare Turnstile challenge (invisible unless Cloudflare doubts the visitor). Needs NEXT_PUBLIC_TURNSTILE_SITE_KEY. */
  turnstile?: boolean;
};

export type FormGuard = {
  token: string;
  /** Callback ref for the honeypot <input>. */
  honeypotInput: (el: HTMLInputElement | null) => void;
  /** Spread into a JSON request body. */
  payload: () => Record<string, string>;
  /** Set by the Turnstile widget; a token is single use, so call refresh() after each submit. */
  turnstile: {
    enabled: boolean;
    onToken: (token: string) => void;
    refresh: () => void;
    registerReset: (fn: () => void) => void;
    /** Resolves once a token exists (or after maxMs): the invisible check usually finishes in about a second. */
    ready: (maxMs?: number) => Promise<void>;
  };
};

/** Delays between token fetch retries after a failure. */
const RETRY_DELAYS_MS = [1500, 4000, 10_000, 30_000, 60_000];

async function fetchFormToken(): Promise<string | null> {
  try {
    const res = await fetch(FORM_TOKEN_ENDPOINT, { cache: 'no-store' });
    const data = await res.json();
    return typeof data?.token === 'string' ? data.token : null;
  } catch {
    return null;
  }
}

export function useFormGuard({ enabled = true, lazyRef, turnstile = false }: Options = {}): FormGuard {
  const [token, setToken] = useState('');
  const turnstileTokenRef = useRef('');
  const turnstileResetRef = useRef<() => void>(() => {});
  const tokenRef = useRef('');
  const requestedRef = useRef(false);
  const ensureTokenRef = useRef<() => void>(() => {});
  const honeypotElRef = useRef<HTMLInputElement | null>(null);
  // Remembers the honeypot after its input unmounts (multi-step forms).
  const lastHoneypotRef = useRef('');

  useEffect(() => {
    if (!enabled) return;
    let cancelled = false;
    let timer: ReturnType<typeof setTimeout> | undefined;
    let observer: IntersectionObserver | undefined;

    // A missing token means the submission is silently dropped, so a failed fetch must not be final.
    // Retry with backoff, and again whenever the visitor comes back to the tab.
    const request = (attempt = 0) => {
      if (cancelled || tokenRef.current || requestedRef.current) return;
      requestedRef.current = true;
      fetchFormToken().then((value) => {
        requestedRef.current = false;
        // Keep a token that arrives after cleanup: the refs belong to the hook instance and survive
        // a StrictMode remount, which would otherwise discard the only in-flight fetch.
        if (value) {
          tokenRef.current = value;
          setToken(value);
        } else if (!cancelled && attempt < RETRY_DELAYS_MS.length) {
          timer = setTimeout(() => request(attempt + 1), RETRY_DELAYS_MS[attempt]);
        }
      });
    };
    ensureTokenRef.current = () => request(0);

    const onVisible = () => {
      if (document.visibilityState === 'visible') request(0);
    };
    document.addEventListener('visibilitychange', onVisible);

    const target = lazyRef?.current;
    if (!target || typeof IntersectionObserver === 'undefined') {
      request();
    } else {
      observer = new IntersectionObserver(
        (entries) => {
          if (entries.some((entry) => entry.isIntersecting)) {
            observer?.disconnect();
            request();
          }
        },
        { rootMargin: '400px' },
      );
      observer.observe(target);
    }

    return () => {
      cancelled = true;
      if (timer) clearTimeout(timer);
      observer?.disconnect();
      document.removeEventListener('visibilitychange', onVisible);
      ensureTokenRef.current = () => {};
    };
  }, [enabled, lazyRef]);

  const honeypotInput = useCallback((el: HTMLInputElement | null) => {
    if (!el && honeypotElRef.current) lastHoneypotRef.current = honeypotElRef.current.value;
    honeypotElRef.current = el;
  }, []);

  const payload = useCallback(() => {
    if (honeypotElRef.current) lastHoneypotRef.current = honeypotElRef.current.value;
    // No token yet (the first fetch failed): start another so the next submit has one.
    if (!tokenRef.current) ensureTokenRef.current();
    return {
      [HONEYPOT_FIELD]: lastHoneypotRef.current,
      [TOKEN_FIELD]: tokenRef.current,
      ...(turnstileTokenRef.current ? { [TURNSTILE_FIELD]: turnstileTokenRef.current } : {}),
    };
  }, []);

  const turnstileApi = useMemo(
    () => ({
      enabled: turnstile && Boolean(process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY),
      onToken: (value: string) => {
        turnstileTokenRef.current = value;
      },
      refresh: () => {
        turnstileTokenRef.current = '';
        turnstileResetRef.current();
      },
      registerReset: (fn: () => void) => {
        turnstileResetRef.current = fn;
      },
      ready: async (maxMs = 8000) => {
        if (!turnstile || !process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY) return;
        const start = Date.now();
        while (!turnstileTokenRef.current && Date.now() - start < maxMs) await new Promise((r) => setTimeout(r, 150));
      },
    }),
    [turnstile],
  );

  return useMemo(() => ({ token, honeypotInput, payload, turnstile: turnstileApi }), [token, honeypotInput, payload, turnstileApi]);
}

/**
 * Renders the hidden honeypot input and the token input. Put it inside the <form>.
 * The honeypot is moved off-screen rather than display:none, because some bots
 * skip display:none inputs. It's hidden from assistive tech and the tab order.
 */
export function FormGuardFields({ guard }: { guard: FormGuard }) {
  const { token, honeypotInput } = guard;
  return (
    <>
      <div
        aria-hidden="true"
        style={{ position: 'absolute', left: '-10000px', top: 'auto', width: 1, height: 1, overflow: 'hidden' }}
      >
        <label>
          {FORM_GUARD_MESSAGES.honeypotLabel}
          <input ref={honeypotInput} type="text" name={HONEYPOT_FIELD} tabIndex={-1} autoComplete="off" defaultValue="" />
        </label>
      </div>
      <input type="hidden" name={TOKEN_FIELD} value={token} readOnly />
      {guard.turnstile.enabled && <TurnstileWidget turnstile={guard.turnstile} />}
    </>
  );
}

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

const TURNSTILE_SRC = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit';

function loadTurnstile(): Promise<TurnstileApi | null> {
  if (typeof window === 'undefined') return Promise.resolve(null);
  if (window.turnstile) return Promise.resolve(window.turnstile);
  return new Promise((resolve) => {
    const existing = document.querySelector<HTMLScriptElement>(`script[src="${TURNSTILE_SRC}"]`);
    const script = existing ?? Object.assign(document.createElement('script'), { src: TURNSTILE_SRC, async: true, defer: true });
    script.addEventListener('load', () => resolve(window.turnstile ?? null));
    script.addEventListener('error', () => resolve(null));
    if (!existing) document.head.appendChild(script);
  });
}

/** Cloudflare Turnstile in "interaction-only" mode: invisible unless Cloudflare wants a click. */
function TurnstileWidget({ turnstile }: { turnstile: FormGuard['turnstile'] }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const siteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;
    if (!siteKey || !ref.current) return;
    let widgetId: string | null = null;
    let cancelled = false;
    loadTurnstile().then((api) => {
      if (cancelled || !api || !ref.current) return;
      widgetId = api.render(ref.current, {
        sitekey: siteKey,
        appearance: 'interaction-only',
        callback: (value: string) => turnstile.onToken(value),
        'expired-callback': () => turnstile.onToken(''),
        'error-callback': () => turnstile.onToken(''),
      });
      turnstile.registerReset(() => {
        if (widgetId) api.reset(widgetId);
      });
    });
    return () => {
      cancelled = true;
      if (widgetId && window.turnstile) window.turnstile.remove(widgetId);
    };
  }, [turnstile]);
  return <div ref={ref} className="mt-3 empty:hidden" />;
}
