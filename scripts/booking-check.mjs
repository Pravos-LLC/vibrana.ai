// Read-only setup validation. Values are never printed or sent to a provider.
const requiredNames = ['BOOKING_ORIGIN','BOOKING_GOOGLE_CLIENT_ID','BOOKING_GOOGLE_CLIENT_SECRET','BOOKING_ENCRYPTION_KEY','SUPABASE_URL','SUPABASE_SERVICE_KEY','CRON_SECRET'];
const issues = [];
for (const name of requiredNames) if (!process.env[name] || process.env[name].startsWith('encrypted:')) issues.push(`${name}: missing`);
if (!process.env.BOOKING_JOHN_EMAIL && !process.env.BOOKING_ABE_EMAIL) issues.push('BOOKING_JOHN_EMAIL or BOOKING_ABE_EMAIL: one host is required');
for (const name of ['BOOKING_JOHN_EMAIL','BOOKING_ABE_EMAIL']) if (process.env[name] && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(process.env[name])) issues.push(`${name}: invalid email format`);
if (process.env.BOOKING_ENCRYPTION_KEY && Buffer.from(process.env.BOOKING_ENCRYPTION_KEY,'base64').length !== 32) issues.push('BOOKING_ENCRYPTION_KEY: must decode to 32 bytes');
function checkUrl(name, allowLocal = false) {
  if (!process.env[name]) return;
  try {
    const url = new URL(process.env[name]);
    const local = allowLocal && process.env.NODE_ENV !== 'production' && url.hostname === 'localhost' && url.protocol === 'http:';
    if ((!local && url.protocol !== 'https:') || url.username || url.password || url.search || url.hash || (name === 'BOOKING_ORIGIN' && url.pathname !== '/')) throw new Error();
  } catch { issues.push(`${name}: invalid URL format`); }
}
checkUrl('BOOKING_ORIGIN', true); checkUrl('SUPABASE_URL', true);
if (process.env.BOOKING_CRM_ENABLED === '1') { for (const name of ['BOOKING_CRM_URL','BOOKING_CRM_API_KEY']) if (!process.env[name]) issues.push(`${name}: required when CRM is enabled`); checkUrl('BOOKING_CRM_URL'); }
if (process.env.BOOKING_BRIEFING_ENABLED === '1') for (const name of ['OPENROUTER_API_KEY','BOOKING_BRIEFING_MODEL']) if (!process.env[name]) issues.push(`${name}: required when briefing is enabled`);
if (issues.length) { console.error(issues.join('\n')); process.exitCode = 1; }
else console.log('Booking configuration names and formats are valid. Provider authorization and live acceptance still need verification.');
