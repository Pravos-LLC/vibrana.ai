// Server startup hook. Applies the eMudhra trust guard before any route handler or server action
// makes an outbound TLS call (see src/lib/security/emudhra-trust-guard.ts).
export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    const { applyEmudhraTrustGuard } = await import('@/src/lib/security/emudhra-trust-guard');
    applyEmudhraTrustGuard();
  }
}
