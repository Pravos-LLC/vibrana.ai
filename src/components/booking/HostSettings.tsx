'use client';

import { useCallback, useEffect, useState } from 'react';
import { HOST_SETTINGS as C, BOOKING } from '@/src/booking-content';
import { defaultSchedule, type Schedule } from '@/lib/booking/model';
import type { Host } from '@/lib/booking/model';
import { call, formatTime, Shell, type BookingView } from './BookingPage';

type Account = { id: string; account: string; selected: string[]; connected: boolean; available: { id: string; summary: string; accessRole: string }[] };
type Invitation = { id: string; from_date: string; to_date: string; expires_at: string; revoked: boolean };
type Settings = { host: Host; accounts: Account[]; invites: Invitation[]; bookings: BookingView[]; integrations: { crm: boolean; briefing: boolean }; jobs: { id: string; kind: 'crm' | 'briefing'; state: 'pending' | 'delivered' | 'attention'; error_code: string | null; result: { briefing?: string; generated?: boolean } | null; payload: { name: string; event: 'booked' | 'rescheduled' | 'cancelled' }; created_at: string }[] };
export default function HostSettings() {
  const [data, setData] = useState<Settings>();
  const [schedule, setSchedule] = useState<Schedule>(defaultSchedule('john'));
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [destination, setDestination] = useState('');
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [unauthorized, setUnauthorized] = useState(false);
  const [configured, setConfigured] = useState(true);
  const [working, setWorking] = useState(false);
  const [link, setLink] = useState('');
  const [exceptionDate, setExceptionDate] = useState('');
  const load = useCallback(async () => {
    setError('');
    try {
      const response = await fetch('/api/booking/host', { cache: 'no-store' });
      if (response.status === 401) { setUnauthorized(true); return; }
      const result = await response.json();
      if (!response.ok) throw new Error(result.error);
      if (result.authenticated === false) { setUnauthorized(true); setConfigured(result.configured); return; }
      setData(result); setSchedule(result.host.schedule); setAccounts(result.accounts);
      setDestination(result.host.destination_connection ? JSON.stringify([result.host.destination_connection, result.host.destination_calendar]) : '');
    } catch (e) { setError(e instanceof Error ? e.message : BOOKING.error); }
  }, []);
  useEffect(() => { void load(); }, [load]);
  async function action(body: unknown) {
    setWorking(true); setError(''); setMessage('');
    try { const value = await call<{ url?: string }>(body, '/api/booking/host'); await load(); return value; }
    catch (e) { setError(e instanceof Error ? e.message : BOOKING.error); return null; }
    finally { setWorking(false); }
  }
  async function save(event: React.FormEvent) {
    event.preventDefault();
    if (!destination) { setError(C.destination); return; }
    const [destinationConnection, destinationCalendar] = JSON.parse(destination);
    if (await action({ action: 'settings', schedule, destinationConnection, destinationCalendar, selections: accounts.map(a => ({ id: a.id, calendars: a.selected })) })) setMessage(C.saved);
  }
  async function invite(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault(); const form = new FormData(event.currentTarget);
    const result = await action({ action: 'invite', from: form.get('from'), to: form.get('to'), recipient: form.get('recipient') });
    if (result?.url) setLink(result.url);
  }
  const hours = (key: 'public' | 'morning') => <fieldset><legend>{C[key]}</legend><div className="booking-row"><label>{C.start}<input type="time" required value={schedule[key].start} onChange={e => setSchedule({ ...schedule, [key]: { ...schedule[key], start: e.target.value } })} /></label><label>{C.end}<input type="time" required value={schedule[key].end} onChange={e => setSchedule({ ...schedule, [key]: { ...schedule[key], end: e.target.value } })} /></label></div></fieldset>;
  return <Shell><main className="booking-settings"><div className="booking-intro"><h1>{C.title}</h1><p>{C.description}</p></div>{error && <p role="alert" className="booking-error">{error}</p>}{message && <p role="status">{message}</p>}{unauthorized ? <section><p>{C.signInHelp}</p>{configured ? <a className="booking-primary" href="/api/booking/connect">{C.signIn}</a> : <p>{C.setup}</p>}</section> : !data ? <p role="status">{C.loading}</p> : <>
    <div className="booking-actions"><a href="/api/booking/connect">{C.addAccount}</a><button disabled={working} onClick={async () => { await call({ action: 'logout' }, '/api/booking/host'); location.reload(); }}>{C.logout}</button></div>
    <form onSubmit={save}><fieldset disabled={working}><section><h2>{C.calendars}</h2><p>{C.conflictHelp}</p>{accounts.map(account => <div className="booking-account" key={account.id}><h3>{account.account}</h3><button type="button" onClick={() => setAccounts(accounts.map(a => a.id === account.id ? { ...a, selected: [] } : a))}>{C.stopChecking}</button>{!account.connected ? <a href="/api/booking/connect">{C.reconnect}</a> : account.available.map(calendar => <label className="booking-checkbox" key={calendar.id}><input type="checkbox" checked={account.selected.includes(calendar.id)} onChange={e => setAccounts(accounts.map(a => a.id === account.id ? { ...a, selected: e.target.checked ? [...a.selected, calendar.id] : a.selected.filter(id => id !== calendar.id) } : a))} />{calendar.summary}</label>)}</div>)}<label>{C.destination}<select value={destination} onChange={e => setDestination(e.target.value)} required><option value="">{C.destination}</option>{accounts.flatMap(account => account.available.filter(c => ['owner', 'writer'].includes(c.accessRole)).map(c => <option key={`${account.id}:${c.id}`} value={JSON.stringify([account.id, c.id])}>{account.account}: {c.summary}</option>))}</select></label></section>
    <section><h2>{C.hours}</h2><label className="booking-checkbox"><input type="checkbox" checked={schedule.enabled} onChange={e => setSchedule({ ...schedule, enabled: e.target.checked })} />{C.enabled}</label><label>{C.timezone}<input required value={schedule.timezone} onChange={e => setSchedule({ ...schedule, timezone: e.target.value })} /></label><div className="booking-weekdays">{C.weekdays.map((name, day) => <label key={name} className="booking-checkbox"><input type="checkbox" checked={schedule.weekdays.includes(day)} onChange={e => setSchedule({ ...schedule, weekdays: e.target.checked ? [...schedule.weekdays, day] : schedule.weekdays.filter(d => d !== day) })} />{name}</label>)}</div><div className="booking-row">{hours('public')}{hours('morning')}</div><p className="booking-help">{C.defaults}</p></section>
    <section><h2>{C.exceptions}</h2><p>{C.exceptionHelp}</p><div className="booking-row"><label>{C.date}<input type="date" value={exceptionDate} onChange={e => setExceptionDate(e.target.value)} /></label><button type="button" disabled={!exceptionDate} onClick={() => setSchedule({ ...schedule, exceptions: { ...schedule.exceptions, [exceptionDate]: null } })}>{C.addException}</button></div>{Object.entries(schedule.exceptions).sort(([a], [b]) => a.localeCompare(b)).map(([date, window]) => <div className="booking-exception" key={date}><strong>{date}</strong><label className="booking-checkbox"><input type="checkbox" checked={window === null} onChange={e => setSchedule({ ...schedule, exceptions: { ...schedule.exceptions, [date]: e.target.checked ? null : { ...schedule.public } } })} />{C.off}</label>{window && <div className="booking-row"><label>{C.start}<input type="time" required value={window.start} onChange={e => setSchedule({ ...schedule, exceptions: { ...schedule.exceptions, [date]: { ...window, start: e.target.value } } })} /></label><label>{C.end}<input type="time" required value={window.end} onChange={e => setSchedule({ ...schedule, exceptions: { ...schedule.exceptions, [date]: { ...window, end: e.target.value } } })} /></label></div>}<button type="button" onClick={() => { const next = { ...schedule.exceptions }; delete next[date]; setSchedule({ ...schedule, exceptions: next }); }}>{C.remove}</button></div>)}</section><button className="booking-primary" disabled={working}>{working ? C.busy : C.save}</button></fieldset></form>
    <section><h2>{C.invitations}</h2><p>{C.inviteHelp}</p><form onSubmit={invite}><fieldset disabled={working}><div className="booking-row"><label>{C.from}<input name="from" type="date" required /></label><label>{C.to}<input name="to" type="date" required /></label></div><label>{C.recipient}<input name="recipient" type="email" maxLength={254} /></label><p className="booking-help">{C.recipientHelp}</p><button className="booking-primary">{C.create}</button></fieldset></form>{link && <div className="booking-link"><label>{C.link}<input readOnly value={link} onFocus={e => e.target.select()} /></label><button onClick={async () => { try { await navigator.clipboard.writeText(link); setMessage(C.copied); } catch { setError(BOOKING.error); } }}>{C.copy}</button></div>}<div className="booking-list">{data.invites.map(invite => <div key={invite.id}><span>{invite.from_date} → {invite.to_date}</span>{invite.revoked ? <span>{C.revoked}</span> : <button disabled={working} onClick={() => action({ action: 'revoke', id: invite.id })}>{C.revoke}</button>}</div>)}</div></section>
    <section><h2>{C.bookings}</h2><button onClick={load} disabled={working}>{C.refresh}</button><div className="booking-list">{!data.bookings.length && <p>{C.empty}</p>}{data.bookings.map(booking => <div key={booking.id}><span>{booking.name}<br />{formatTime(booking.start, schedule.timezone)}<small>{C.statuses[booking.status as keyof typeof C.statuses] ?? booking.status}</small></span>{!['confirmed', 'cancelled'].includes(booking.status) && <button disabled={working} onClick={() => action({ action: 'recover', id: booking.id })}>{C.recover}</button>}</div>)}</div></section>
    <section><h2>{C.integrations}</h2><p>{C.integrationHelp}</p><div className="booking-row"><span>{C.crm}: {data.integrations.crm ? C.configured : C.notConfigured}</span><span>{C.briefing}: {data.integrations.briefing ? C.configured : C.notConfigured}</span></div><div className="booking-jobs">{data.jobs.map(job => <article key={job.id}><h3>{job.payload.name}: {C.jobKinds[job.kind]}</h3><p>{C.jobEvents[job.payload.event]} · {C.jobStates[job.state]}</p>{job.result?.briefing && <><small>{job.result.generated ? C.aiDraft : C.visitorNotes}</small><p className="booking-brief">{job.result.briefing}</p></>}{job.state === 'attention' && job.kind === 'crm' && <button disabled={working} onClick={() => action({ action: 'retryJob', id: job.id })}>{C.retryJob}</button>}</article>)}</div></section>
    </>}</main></Shell>;
}
