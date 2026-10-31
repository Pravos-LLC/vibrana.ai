import { describe, expect, it } from 'vitest';
import tls from 'node:tls';
import { X509Certificate } from 'node:crypto';
import { withoutEmsignRoots } from '@/src/lib/security/emudhra-trust-guard';

const subject = (pem: string) => new X509Certificate(pem).subject;
const t = tls as typeof tls & { getCACertificates?: (type?: string) => string[] };

describe('eMudhra trust guard', () => {
  it('drops every emSign root and nothing else', { skip: !t.getCACertificates }, () => {
    const roots = t.getCACertificates!('bundled');
    const emsign = roots.filter((pem) => subject(pem).includes('CN=emSign'));
    const kept = withoutEmsignRoots(roots);
    expect(kept.every((pem) => !subject(pem).includes('emSign'))).toBe(true);
    expect(kept.length === roots.length - emsign.length).toBe(true);
    expect(kept.some((pem) => subject(pem).includes('ISRG Root X1'))).toBe(true);
  });
});
