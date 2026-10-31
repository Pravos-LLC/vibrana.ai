/**
 * Pure, dependency-free input validation for public forms.
 * No imports on purpose: `node --test` runs this file directly.
 */

export const LIMITS = {
  email: 254,
  emailLocal: 64,
  name: 100,
  phone: 40,
  message: 5000,
  companyName: 200,
  url: 500,
  source: 64,
} as const;

// Pragmatic RFC 5322 subset: dot-atom local part, at least one dot in the domain,
// labels that don't start or end with a hyphen, and an alphabetic TLD of 2+ chars.
const EMAIL_RE =
  /^[a-z0-9!#$%&'*+/=?^_`{|}~-]+(?:\.[a-z0-9!#$%&'*+/=?^_`{|}~-]+)*@(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,63}$/;

/** Trim and lowercase. Returns '' for non-strings. */
export function normalizeEmail(input: unknown): string {
  if (typeof input !== 'string') return '';
  return input.trim().toLowerCase();
}

/** Validates an already-normalized email. */
export function isValidEmail(email: string): boolean {
  if (!email || email.length > LIMITS.email) return false;
  const at = email.lastIndexOf('@');
  if (at < 1 || at > LIMITS.emailLocal) return false;
  return EMAIL_RE.test(email);
}

/**
 * Collapses a '+tag' in the local part so name+1@x.com and name+2@x.com bucket as
 * one inbox. Used for the rate-limit email bucket (guardSubmission) and for the
 * assessment notification claim (one report + nurture sequence per inbox per 24h) --
 * anywhere "same inbox" matters more than "same literal address". Never use this for
 * the address actually stored or mailed; +tag variants are still distinct, deliverable
 * addresses.
 */
export function collapsePlusTag(email: string): string {
  return email.replace(/\+[^@]*@/, '@');
}

/** Trims a string field. Returns null when missing, non-string, or over `max`. */
export function cleanText(input: unknown, max: number): string | null {
  if (input === undefined || input === null) return '';
  if (typeof input !== 'string') return null;
  const value = input.trim();
  if (value.length > max) return null;
  return value;
}

/** Source tags are internal labels (e.g. "footer", "exit-intent-popup"). */
export function cleanSource(input: unknown, fallback: string): string {
  if (typeof input !== 'string') return fallback;
  const value = input.trim().toLowerCase();
  return /^[a-z0-9][a-z0-9_-]{0,63}$/.test(value) ? value : fallback;
}

/**
 * A single letters-only token of 10+ chars with 3+ capitals after the first letter,
 * e.g. "lGMsBDsjkWZFWATJvjybI". Real names top out at one or two interior capitals
 * (McDonald, DeShawn, MacKenzie, VanDerBerg).
 */
export function isRandomCaseToken(token: string): boolean {
  if (token.length < 10 || !/^[A-Za-z]+$/.test(token)) return false;
  const interiorCaps = (token.slice(1).match(/[A-Z]/g) || []).length;
  return interiorCaps >= 3;
}

/** True when a person's name looks machine-generated. */
export function looksLikeGibberishName(name: string): boolean {
  const tokens = name.trim().split(/\s+/).filter(Boolean);
  if (tokens.length === 0) return false;
  if (tokens.some(isRandomCaseToken)) return true;
  // One long run of letters with no vowels ("xkcdqwrtzp") is not a name either.
  if (tokens.length === 1 && tokens[0].length >= 12 && !/[aeiouy]/i.test(tokens[0])) return true;
  return false;
}

/** True when a free-text message looks machine-generated. */
export function looksLikeGibberishMessage(message: string): boolean {
  const value = message.trim();
  if (!value) return true;
  // A real message has at least one space. "CznelGIzvRhtMHdqBrDSbf" does not.
  if (!/\s/.test(value)) return true;
  const tokens = value.split(/\s+/).filter(Boolean);
  // Mostly random-case tokens ("aBcDeFgHiJk LmNoPqRsTu") is still junk.
  const randomTokens = tokens.filter(isRandomCaseToken).length;
  return randomTokens > 0 && randomTokens >= tokens.length / 2;
}
