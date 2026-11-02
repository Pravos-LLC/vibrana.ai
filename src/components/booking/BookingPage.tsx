'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { BOOKING as C } from '@/src/booking-content';
import type { Busy, HostId } from '@/lib/booking/model';
import './booking.css';

export type BookingView = { id: string; host: HostId; start: string; end: string; status: string; meetUrl: string | null; private: boolean; name?: string; resource?: keyof typeof C.resources };
type Credential = { id: string; token: string };
class ClientError extends Error { constructor(message: string, public status: number) { super(message); } }
export async function call<T>(body: unknown, endpoint = '/api/booking', signal?: AbortSignal): Promise<T> {
  const response = await fetch(endpoint, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body), signal });
  const data = await response.json();
  if (!response.ok) throw new ClientError(data.error ?? C.error, response.status);
  return data as T;
}
function newCredential(): Credential {
  const bytes = crypto.getRandomValues(new Uint8Array(32));
  return { id: crypto.randomUUID(), token: btoa(String.fromCharCode(...bytes)).replaceAll('+', '-').replaceAll('/', '_').replaceAll('=', '') };
}
export function Shell({ children }: { children: React.ReactNode }) {
  return <div className="booking-page"><header className="booking-header"><Link className="booking-brand" href="https://www.vibrana.ai">{C.brand}<span aria-hidden="true">✳</span></Link><Link href="https://www.vibrana.ai">{C.website}<span aria-hidden="true"> ↗</span></Link></header>{children}<footer className="booking-footer"><Link href="https://www.vibrana.ai/case-studies">{C.caseStudies}</Link><Link href="https://www.vibrana.ai/ai-transformation/assessment">{C.assessment}</Link><Link href="https://www.vibrana.ai/privacy">{C.privacyLink}</Link><Link href="/book/settings">{C.settings}</Link></footer></div>;
}
export function formatTime(start: string, timezone: string) {
  return new Intl.DateTimeFormat(undefined, { timeZone: timezone, weekday: 'short', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit', timeZoneName: 'short' }).format(new Date(start));
}
export default function BookingPage({ host: initialHost = 'john', existing, credential, onChanged, proof = [] }: { host?: HostId; existing?: BookingView; credential?: Credential; onChanged?: (value: BookingView) => void; proof?: { label: string; title: string; href: string }[] }) {
  const [host, setHost] = useState(initialHost);
  const [date, setDate] = useState('');
  const [timezone, setTimezone] = useState('Asia/Makassar');
  const [hostTimezone, setHostTimezone] = useState('Asia/Makassar');
  const [invite, setInvite] = useState<string>();
  const [range, setRange] = useState<{ from: string; to: string }>();
  const [ready, setReady] = useState(false);
  const [configured, setConfigured] = useState<boolean | null>(null);
  const [slots, setSlots] = useState<Busy[]>([]);
  const [selected, setSelected] = useState<string>();
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [draft, setDraft] = useState<Credential>();
  useEffect(() => {
    const pending = sessionStorage.getItem('vibrana-booking-pending');
    if (pending && !existing) {
      try { const prior = JSON.parse(pending); if (prior.id && prior.token) { location.assign(`/book/manage#id=${prior.id}&token=${prior.token}`); return; } } catch { sessionStorage.removeItem('vibrana-booking-pending'); }
    }
    const controller = new AbortController();
    async function initialize() {
      try {
        const response = await fetch('/api/booking/configuration', { signal: controller.signal });
        const configuration = await response.json();
        if (!response.ok) throw new Error(C.error);
        if (configuration.configured && configuration.origin && configuration.origin !== location.origin) {
          location.replace(`${configuration.origin}${location.pathname}${location.hash}`); return;
        }
        setConfigured(configuration.configured);
        if (!configuration.configured) return;
        setTimezone(Intl.DateTimeFormat().resolvedOptions().timeZone);
        const initial = new Date(Date.now() + 86400_000).toLocaleDateString('en-CA', { timeZone: 'Asia/Makassar' });
        const invitation = new URLSearchParams(location.hash.slice(1)).get('invite') ?? undefined;
        setInvite(invitation);
        if (invitation && !existing) {
          const bounds = await call<{ from: string; to: string }>({ action: 'invitation', host: initialHost, invite: invitation }, undefined, controller.signal);
          setRange(bounds); setDate(initial >= bounds.from && initial <= bounds.to ? initial : bounds.from);
        } else setDate(initial);
        setReady(true);
      } catch (e) { if (!controller.signal.aborted) setError(e instanceof Error ? e.message : C.error); }
    }
    void initialize();
    return () => controller.abort();
  }, [existing, initialHost]);
  useEffect(() => {
    if (!ready || !date) return;
    const controller = new AbortController();
    setSelected(undefined); setError(''); setLoading(true); setSlots([]);
    call<{ slots: Busy[]; timezone?: string }>({ action: 'availability', host, date, invite, ...(existing ? { booking: credential } : {}) }, undefined, controller.signal)
      .then(data => { setSlots(data.slots); if (data.timezone) setHostTimezone(data.timezone); })
      .catch(e => { if (!controller.signal.aborted) setError(e.message); })
      .finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => controller.abort();
  }, [host, date, invite, ready, existing, credential]);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault(); if (!selected) return;
    setSubmitting(true); setError('');
    const form = new FormData(event.currentTarget);
    const access = credential ?? draft ?? newCredential();
    setDraft(access);
    if (!existing) sessionStorage.setItem('vibrana-booking-pending', JSON.stringify({ ...access, at: Date.now() }));
    try {
      const value = await call<BookingView>(existing ? { action: 'reschedule', ...access, start: selected } : { action: 'book', ...access, host, start: selected, invite, name: form.get('name'), email: form.get('email'), context: form.get('context'), aiConsent: form.get('aiConsent') === 'on' });
      if (existing) onChanged?.(value);
      else location.assign(`/book/manage#id=${value.id}&token=${access.token}`);
    } catch (e) {
      if (!existing && (!(e instanceof ClientError) || e.status >= 500)) { location.assign(`/book/manage#id=${access.id}&token=${access.token}`); return; }
      if (!existing) { sessionStorage.removeItem('vibrana-booking-pending'); setDraft(undefined); }
      setError(e instanceof Error ? e.message : C.error); setSubmitting(false);
    }
  }
  const timezones = Array.from(new Set([timezone, 'Asia/Makassar', 'America/New_York', 'America/Chicago', 'America/Denver', 'America/Los_Angeles', 'Europe/London', 'Europe/Paris', 'Asia/Singapore', 'Australia/Sydney', ...Intl.supportedValuesOf('timeZone')]));
  const content = <main className="booking-main"><section className="booking-intro"><p className="booking-kicker">{invite || existing?.private ? C.private : C.duration}</p><h1>{existing ? C.reschedule : C.title}</h1><p>{invite ? C.privateHelp : C.description}</p></section><div className="booking-workspace">
    <aside className="booking-host-panel"><fieldset disabled={!!existing || submitting}><legend>{C.chooseHost}</legend><div className="booking-hosts">{(['john', 'abe'] as const).map(id => <button key={id} type="button" disabled={!!invite && id !== initialHost} aria-pressed={id === host} onClick={() => { setHost(id); setDraft(undefined); }}><span className="booking-avatar" aria-hidden="true">{C.hosts[id].initials}</span><span>{C.hosts[id].name}</span><span className="booking-radio" aria-hidden="true" /></button>)}</div></fieldset><div className="booking-facts"><span>{C.duration}</span><span>{C.video}</span></div><p className="booking-help">{C.hostDates}</p></aside>
    <section className="booking-picker" aria-busy={loading || submitting}>{configured === false ? <div className="booking-empty"><p>{C.setup}</p><Link href="https://www.vibrana.ai/contact">{C.contact}</Link></div> : configured === null ? <p role="status">{C.loading}</p> : !selected ? <><div className="booking-picker-controls"><label>{C.date} · {hostTimezone}<input type="date" value={date} min={range?.from} max={range?.to} required onChange={e => { setDate(e.target.value); setDraft(undefined); }} /></label><label>{C.timezone}<select value={timezone} onChange={e => setTimezone(e.target.value)}>{timezones.map(zone => <option key={zone}>{zone}</option>)}</select></label></div><h2>{C.times}</h2>{loading ? <p role="status">{C.loading}</p> : slots.length ? <div className="booking-times">{slots.map(slot => <button type="button" key={slot.start} onClick={() => setSelected(slot.start)}>{formatTime(slot.start, timezone)}</button>)}</div> : !error ? <p className="booking-empty">{C.noSlots}</p> : null}</> : <form onSubmit={submit}><button className="booking-text-button" type="button" disabled={submitting} onClick={() => setSelected(undefined)}>← {C.back}</button><h2>{C.selected}</h2><p className="booking-chosen">{formatTime(selected, timezone)}</p>{!existing && <div className="booking-fields"><label>{C.name}<input name="name" autoComplete="name" required maxLength={100} disabled={submitting} /></label><label>{C.email}<input name="email" type="email" autoComplete="email" required maxLength={254} disabled={submitting} /></label><label>{C.context} <span>({C.optional})</span><textarea name="context" rows={3} maxLength={2000} disabled={submitting} /></label><label className="booking-checkbox"><input type="checkbox" name="aiConsent" disabled={submitting} />{C.aiConsent}</label></div>}<button className="booking-primary" disabled={submitting}>{submitting ? C.booking : existing ? C.rescheduleConfirm : C.book}</button><p className="booking-help">{C.privacy}</p></form>}{error && <p role="alert" className="booking-error">{error}</p>}</section>
  </div>{proof.length > 0 && <section className="booking-proof"><h2>{C.caseStudies}</h2><div>{proof.map(item => <a href={item.href} key={item.href}><span>{item.label}</span><h3>{item.title}</h3><span aria-hidden="true">↗</span></a>)}</div></section>}</main>;
  return existing ? content : <Shell>{content}</Shell>;
}

export function ManageBooking() {
  const [credential, setCredential] = useState<Credential>();
  const [booking, setBooking] = useState<BookingView>();
  const [error, setError] = useState('');
  const [changing, setChanging] = useState(false);
  const [confirmCancel, setConfirmCancel] = useState(false);
  const [working, setWorking] = useState(false);
  const [missing, setMissing] = useState(false);
  const [timezone, setTimezone] = useState('Asia/Makassar');
  useEffect(() => {
    const params = new URLSearchParams(location.hash.slice(1)), id = params.get('id'), token = params.get('token');
    if (!id || !token) { setError(C.invalid); setMissing(true); return; }
    setCredential({ id, token }); setTimezone(Intl.DateTimeFormat().resolvedOptions().timeZone);
  }, []);
  useEffect(() => {
    if (!credential) return;
    let active = true, count = 0, timer: ReturnType<typeof setTimeout>;
    const check = async () => {
      try {
        const value = await call<BookingView>({ action: 'status', ...credential });
        if (!active) return;
        setBooking(value);
        if (['confirmed', 'cancelled'].includes(value.status)) sessionStorage.removeItem('vibrana-booking-pending');
        if (!['confirmed', 'cancelled'].includes(value.status)) {
          if (++count < 12) timer = setTimeout(check, 5000); else setError(C.recovery);
        }
      } catch (e) {
        if (!active) return;
        if (e instanceof ClientError && e.status === 404) {
          // A lost POST response can race the original server request. Wait for
          // its maximum execution window before allowing another booking.
          const pending = sessionStorage.getItem('vibrana-booking-pending');
          let started = 0;
          try { started = JSON.parse(pending ?? '{}').at ?? 0; } catch { /* no pending request */ }
          if (Date.now() - started < 180_000) { timer = setTimeout(check, 5000); return; }
          setMissing(true);
        }
        setError(e instanceof Error ? e.message : C.error);
      }
    };
    void check(); return () => { active = false; clearTimeout(timer); };
  }, [credential]);
  async function cancelMeeting() {
    setWorking(true); setError('');
    try { const value = await call<BookingView>({ action: 'cancel', ...credential }); setBooking(value); setConfirmCancel(false); setCredential(c => c ? { ...c } : c); }
    catch (e) { setError(e instanceof Error ? e.message : C.error); }
    finally { setWorking(false); }
  }
  if (changing && booking && credential) return <Shell><BookingPage host={booking.host} existing={booking} credential={credential} onChanged={value => { setBooking(value); setChanging(false); setCredential({ ...credential }); }} /></Shell>;
  return <Shell><main className="booking-status"><p className="booking-kicker">{C.management}</p><h1>{missing ? C.invalid : !booking ? C.checking : booking.status === 'confirmed' ? C.confirmed : booking.status === 'cancelled' ? C.cancelled : C.pending}</h1><p>{booking?.status === 'confirmed' ? C.confirmedHelp : booking?.status === 'cancelled' ? C.cancelledHelp : missing ? '' : C.pendingHelp}</p>{booking && <div className="booking-summary"><h2>{C.hosts[booking.host].name}</h2><p>{formatTime(booking.start, timezone)}</p><p>{C.duration} · {C.video}</p>{booking.meetUrl && booking.status === 'confirmed' && <a className="booking-primary" href={booking.meetUrl} rel="noreferrer">{C.meet}</a>}</div>}{booking?.status === 'confirmed' && <section className="booking-preparation"><h2>{C.preparation}</h2><a href={C.resources[booking.resource ?? 'assessment'].href}>{C.resources[booking.resource ?? 'assessment'].label} ↗</a></section>}{booking && ['confirmed', 'pending'].includes(booking.status) && <div className="booking-actions">{booking.status === 'confirmed' && <button onClick={() => setChanging(true)} disabled={working}>{C.reschedule}</button>}{confirmCancel ? <><button onClick={cancelMeeting} disabled={working}>{C.cancelConfirm}</button><button onClick={() => setConfirmCancel(false)} disabled={working}>{C.keep}</button></> : <button onClick={() => setConfirmCancel(true)} disabled={working}>{C.cancel}</button>}</div>}{error && <p className="booking-error" role="alert">{error}</p>}{missing ? <Link href="/book" onClick={() => sessionStorage.removeItem('vibrana-booking-pending')}>{C.newBooking}</Link> : credential && error && <button onClick={() => { setError(''); setCredential({ ...credential }); }}>{C.checkAgain}</button>}</main></Shell>;
}
