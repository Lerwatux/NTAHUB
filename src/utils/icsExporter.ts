import { FamilyEvent } from '../types';

/**
 * Format a date string (YYYY-MM-DD) and time string (HH:mm) into ICS format (YYYYMMDDTHHmm00)
 */
export function formatIcsDateTime(dateStr: string, timeStr: string): string {
  const cleanDate = dateStr.replace(/-/g, '');
  const cleanTime = timeStr.replace(/:/g, '');
  return `${cleanDate}T${cleanTime}00`;
}

/**
 * Format timestamp in UTC (YYYYMMDDTHHmmssZ)
 */
export function formatIcsUtc(date: Date = new Date()): string {
  return date.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
}

/**
 * Clean and escape string for ICS format (escape commas, semicolons, backslashes, newlines)
 */
export function escapeIcsText(text: string): string {
  return text
    .replace(/\\/g, '\\\\')
    .replace(/;/g, '\\;')
    .replace(/,/g, '\\,')
    .replace(/\r\n|\n|\r/g, '\\n');
}

/**
 * Generate RFC 5545 iCalendar (.ics) string for family events
 */
export function generateFamilyEventsIcs(
  events: FamilyEvent[],
  calendarName: string = 'NTAHUB - Événements Familiaux'
): string {
  const dtStamp = formatIcsUtc();
  const lines: string[] = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//NTAHUB//Family Calendar App//FR',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    `X-WR-CALNAME:${escapeIcsText(calendarName)}`,
    'X-WR-TIMEZONE:Europe/Paris',
    'X-WR-CALDESC:Événements familiaux créés dans NTAHUB pour Clément et Irène',
    'BEGIN:VTIMEZONE',
    'TZID:Europe/Paris',
    'X-LIC-LOCATION:Europe/Paris',
    'BEGIN:DAYLIGHT',
    'TZOFFSETFROM:+0100',
    'TZOFFSETTO:+0200',
    'TZNAME:CEST',
    'DTSTART:19700329T020000',
    'RRULE:FREQ=YEARLY;BYMONTH=3;BYDAY=-1SU',
    'END:DAYLIGHT',
    'BEGIN:STANDARD',
    'TZOFFSETFROM:+0200',
    'TZOFFSETTO:+0100',
    'TZNAME:CET',
    'DTSTART:19701025T030000',
    'RRULE:FREQ=YEARLY;BYMONTH=10;BYDAY=-1SU',
    'END:STANDARD',
    'END:VTIMEZONE',
  ];

  for (const event of events) {
    const startStr = formatIcsDateTime(event.date, event.startTime);
    const endStr = formatIcsDateTime(event.date, event.endTime);
    
    // Category label formatting
    const catLabel = event.category.charAt(0).toUpperCase() + event.category.slice(1);
    const summary = event.customTitle
      ? `${catLabel} : ${event.customTitle}`
      : `${catLabel} (${event.target})`;

    // Rich description with family context
    const descParts: string[] = [
      `Type : ${catLabel}`,
      `Concerne : ${event.target}`,
    ];
    if (event.assignedTo) {
      descParts.push(`Responsable / Assigné à : ${event.assignedTo}`);
    }
    descParts.push(`Créé par : ${event.createdBy}`);
    if (event.notes) {
      descParts.push(`Notes : ${event.notes}`);
    }
    descParts.push('Application NTAHUB - Synchronisation Famille');

    const uid = `${event.id}@ntahub.family`;

    lines.push('BEGIN:VEVENT');
    lines.push(`UID:${uid}`);
    lines.push(`DTSTAMP:${dtStamp}`);
    lines.push(`DTSTART;TZID=Europe/Paris:${startStr}`);
    lines.push(`DTEND;TZID=Europe/Paris:${endStr}`);
    lines.push(`SUMMARY:${escapeIcsText(summary)}`);
    lines.push(`DESCRIPTION:${escapeIcsText(descParts.join('\n'))}`);
    lines.push(`CATEGORIES:${escapeIcsText(`Famille,${catLabel}`)}`);
    lines.push('STATUS:CONFIRMED');

    // Add VALARM if reminder is configured
    if (event.reminderMinutes && event.reminderMinutes > 0) {
      lines.push('BEGIN:VALARM');
      lines.push('ACTION:DISPLAY');
      lines.push(`DESCRIPTION:${escapeIcsText(`Rappel : ${summary}`)}`);
      lines.push(`TRIGGER:-PT${event.reminderMinutes}M`);
      lines.push('END:VALARM');
    }

    lines.push('END:VEVENT');
  }

  lines.push('END:VCALENDAR');
  return lines.join('\r\n') + '\r\n';
}

/**
 * Triggers browser download of the ICS string
 */
export function downloadIcsFile(
  icsContent: string,
  filename: string = 'ntahub-evenements-famille.ics'
): void {
  const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
