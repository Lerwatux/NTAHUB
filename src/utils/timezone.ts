/**
 * Timezone and Date Utilities for NTAHUB (Europe/Paris)
 */

export const PARIS_TIMEZONE = 'Europe/Paris';

/**
 * Parse an ICS datetime string (e.g. 20261012T063000Z or 20261012T083000)
 * into a Date object.
 */
export function parseIcsDate(icsStr: string): Date {
  const clean = icsStr.trim();
  // Format: YYYYMMDDTHHmmssZ or YYYYMMDDTHHmmss or YYYYMMDD
  if (clean.length === 8 && !clean.includes('T')) {
    const year = parseInt(clean.substring(0, 4), 10);
    const month = parseInt(clean.substring(4, 6), 10) - 1;
    const day = parseInt(clean.substring(6, 8), 10);
    return new Date(Date.UTC(year, month, day, 0, 0, 0));
  }

  const match = clean.match(/^(\d{4})(\d{2})(\d{2})T(\d{2})(\d{2})(\d{2})(Z)?/);
  if (match) {
    const [, y, m, d, hh, mm, ss, isUtc] = match;
    const year = parseInt(y, 10);
    const month = parseInt(m, 10) - 1;
    const day = parseInt(d, 10);
    const hour = parseInt(hh, 10);
    const min = parseInt(mm, 10);
    const sec = parseInt(ss, 10);

    if (isUtc) {
      return new Date(Date.UTC(year, month, day, hour, min, sec));
    } else {
      // Local or floating, parse as UTC if coming from standard airline feed without tz
      return new Date(Date.UTC(year, month, day, hour, min, sec));
    }
  }

  // Fallback to standard Date parsing
  return new Date(icsStr);
}

/**
 * Format a Date into Paris Local time: "HH:mm"
 */
export function formatParisTime(date: Date): string {
  return new Intl.DateTimeFormat('fr-FR', {
    timeZone: PARIS_TIMEZONE,
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).format(date);
}

/**
 * Format a Date into Paris Local date string: "YYYY-MM-DD"
 */
export function formatParisDate(date: Date): string {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: PARIS_TIMEZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(date);

  const year = parts.find((p) => p.type === 'year')?.value ?? '2026';
  const month = parts.find((p) => p.type === 'month')?.value ?? '01';
  const day = parts.find((p) => p.type === 'day')?.value ?? '01';
  return `${year}-${month}-${day}`;
}

/**
 * Date du jour à Paris : "YYYY-MM-DD"
 */
export function getTodayParisStr(): string {
  return formatParisDate(new Date());
}

/**
 * Lundi de la semaine en cours (à minuit, heure locale)
 */
export function getCurrentMonday(): Date {
  const monday = new Date();
  monday.setHours(0, 0, 0, 0);
  const day = (monday.getDay() + 6) % 7; // 0 = lundi
  monday.setDate(monday.getDate() - day);
  return monday;
}

/**
 * Numéro de semaine ISO 8601 (la semaine 1 contient le premier jeudi de l'année)
 */
export function getIsoWeekNumber(date: Date): number {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const day = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - day);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  return Math.ceil(((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
}

/**
 * Calculate briefing time: e.g. 75 minutes BEFORE departure (in local Paris time)
 */
export function calculateBriefingTime(departureDate: Date, briefingMinutes = 75): string {
  const briefingDate = new Date(departureDate.getTime() - briefingMinutes * 60 * 1000);
  return formatParisTime(briefingDate);
}

/**
 * Calculate arrival home time: e.g. 90 minutes AFTER touchdown at ORY
 */
export function calculateHomeTime(landingDate: Date, homeMinutes = 90): string {
  const homeDate = new Date(landingDate.getTime() + homeMinutes * 60 * 1000);
  return formatParisTime(homeDate);
}

/**
 * Convert HH:mm to minutes from midnight
 */
export function timeToMinutes(timeStr: string): number {
  if (!timeStr) return 0;
  const [h, m] = timeStr.split(':').map((x) => parseInt(x, 10));
  return (h || 0) * 60 + (m || 0);
}

/**
 * Convert minutes from midnight to HH:mm
 */
export function minutesToTime(minutes: number): string {
  const normalized = Math.max(0, Math.min(24 * 60 - 1, minutes));
  const h = Math.floor(normalized / 60);
  const m = normalized % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

/**
 * French day name and date formatters
 */
export function formatFrenchDateLong(dateStr: string): string {
  const [year, month, day] = dateStr.split('-').map(Number);
  const d = new Date(year, month - 1, day);
  return new Intl.DateTimeFormat('fr-FR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(d);
}

export function getDayOfWeekIndex(dateStr: string): number {
  const [year, month, day] = dateStr.split('-').map(Number);
  const d = new Date(year, month - 1, day);
  return d.getDay(); // 0 = Dimanche, 1 = Lundi, etc.
}
