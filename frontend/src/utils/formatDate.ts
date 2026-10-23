/**
 * UTC Date and Time formatting utilities for WindLedger.
 *
 * UK energy market settlement data from Elexon BMRS operates strictly on UTC/GMT.
 * Using native browser Date formatting without specifying UTC causes timestamps to shift
 * by the user's local timezone offset (e.g. +05:30 in India, -05:00 in US Eastern),
 * causing dates to falsely slip into February and hours to mismatch chart axis ticks.
 */

const MONTHS_SHORT = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const MONTHS_FULL = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

export function parseAsUtc(input: string | Date | null | undefined): Date | null {
  if (!input) return null;
  if (input instanceof Date) return isNaN(input.getTime()) ? null : input;

  if (typeof input === 'string') {
    // If it's a date-only string like "2026-01-14", append "T00:00:00Z"
    if (/^\d{4}-\d{2}-\d{2}$/.test(input)) {
      const d = new Date(`${input}T00:00:00Z`);
      return isNaN(d.getTime()) ? null : d;
    }
    // If it has timezone offset or Z
    const d = new Date(input);
    return isNaN(d.getTime()) ? null : d;
  }
  return null;
}

export function formatUtcTime(input: string | Date | null | undefined): string {
  const d = parseAsUtc(input);
  if (!d) return '—';
  const hh = String(d.getUTCHours()).padStart(2, '0');
  const mm = String(d.getUTCMinutes()).padStart(2, '0');
  return `${hh}:${mm}`;
}

export function formatUtcDate(input: string | Date | null | undefined): string {
  const d = parseAsUtc(input);
  if (!d) return '—';
  const dd = String(d.getUTCDate()).padStart(2, '0');
  const mon = MONTHS_SHORT[d.getUTCMonth()];
  const yyyy = d.getUTCFullYear();
  return `${dd} ${mon} ${yyyy}`;
}

export function formatUtcDateShort(input: string | Date | null | undefined): string {
  const d = parseAsUtc(input);
  if (!d) return '—';
  const dd = String(d.getUTCDate()).padStart(2, '0');
  const mon = MONTHS_SHORT[d.getUTCMonth()];
  return `${dd} ${mon}`;
}

export function formatUtcDayOnly(input: string | Date | null | undefined): string {
  const d = parseAsUtc(input);
  if (!d) return '—';
  return String(d.getUTCDate()).padStart(2, '0');
}

export function formatUtcDateTime(input: string | Date | null | undefined): string {
  const d = parseAsUtc(input);
  if (!d) return '—';
  const dd = String(d.getUTCDate()).padStart(2, '0');
  const mon = MONTHS_SHORT[d.getUTCMonth()];
  const yyyy = d.getUTCFullYear();
  const hh = String(d.getUTCHours()).padStart(2, '0');
  const mm = String(d.getUTCMinutes()).padStart(2, '0');
  return `${dd} ${mon} ${yyyy}, ${hh}:${mm}`;
}

export function formatUtcPublish(input: string | Date | null | undefined): string {
  const d = parseAsUtc(input);
  if (!d) return '—';
  const dd = String(d.getUTCDate()).padStart(2, '0');
  const mon = MONTHS_SHORT[d.getUTCMonth()];
  const hh = String(d.getUTCHours()).padStart(2, '0');
  const mm = String(d.getUTCMinutes()).padStart(2, '0');
  return `${dd} ${mon} ${hh}:${mm}`;
}
