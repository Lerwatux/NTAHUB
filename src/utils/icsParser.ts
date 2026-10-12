import {
  PncDayDuty,
  PncFlightLeg,
  PncDayType,
  AppSettings,
  DEFAULT_SETTINGS,
} from '../types';
import {
  parseIcsDate,
  formatParisDate,
  formatParisTime,
  calculateBriefingTime,
  calculateHomeTime,
} from './timezone';

interface RawIcsEvent {
  summary: string;
  description: string;
  location: string;
  dtstart: string;
  dtend: string;
}

/**
 * Basic RFC 5545 ICS calendar parser
 */
export function parseIcsString(icsContent: string): RawIcsEvent[] {
  const events: RawIcsEvent[] = [];
  const lines = icsContent.split(/\r\n|\n|\r/);
  
  // Unfold multi-line entries (lines starting with space or tab)
  const unfoldedLines: string[] = [];
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (line.startsWith(' ') || line.startsWith('\t')) {
      if (unfoldedLines.length > 0) {
        unfoldedLines[unfoldedLines.length - 1] += line.substring(1);
      }
    } else {
      unfoldedLines.push(line);
    }
  }

  let inEvent = false;
  let currentEvent: Partial<RawIcsEvent> = {};

  for (const line of unfoldedLines) {
    if (line.startsWith('BEGIN:VEVENT')) {
      inEvent = true;
      currentEvent = {};
    } else if (line.startsWith('END:VEVENT')) {
      if (inEvent && currentEvent.dtstart) {
        events.push({
          summary: currentEvent.summary || '',
          description: currentEvent.description || '',
          location: currentEvent.location || '',
          dtstart: currentEvent.dtstart || '',
          dtend: currentEvent.dtend || '',
        });
      }
      inEvent = false;
    } else if (inEvent) {
      if (line.startsWith('SUMMARY')) {
        currentEvent.summary = line.substring(line.indexOf(':') + 1).trim();
      } else if (line.startsWith('DESCRIPTION')) {
        currentEvent.description = line.substring(line.indexOf(':') + 1).trim();
      } else if (line.startsWith('LOCATION')) {
        currentEvent.location = line.substring(line.indexOf(':') + 1).trim();
      } else if (line.startsWith('DTSTART')) {
        currentEvent.dtstart = line.substring(line.indexOf(':') + 1).trim();
      } else if (line.startsWith('DTEND')) {
        currentEvent.dtend = line.substring(line.indexOf(':') + 1).trim();
      }
    }
  }

  return events;
}

/**
 * Extract airport codes from text like "AF7620 ORY-NCE", "ORY -> FCO", "TO3401 ORY MAD"
 */
function extractAirports(text: string): { dep: string; arr: string; flightNo: string } {
  const upper = text.toUpperCase();

  // Try flight number match like AF1234, TO3456, VY8900
  const flightMatch = upper.match(/([A-Z0-9]{2}\s?\d{3,4})/);
  const flightNo = flightMatch ? flightMatch[1].replace(' ', '') : 'VOL';

  // Airport code pattern: 3 capital letters
  // Often written as ORY-NCE or ORY/NCE or ORY -> NCE
  const routeMatch = upper.match(/([A-Z]{3})\s*[-–>/to]+\s*([A-Z]{3})/i);
  if (routeMatch) {
    return {
      dep: routeMatch[1],
      arr: routeMatch[2],
      flightNo,
    };
  }

  // Look for ORY anywhere
  const threeLetterMatches = upper.match(/\b([A-Z]{3})\b/g) || [];
  const airports = threeLetterMatches.filter(
    (code) => !['VOL', 'AIR', 'PNC', 'CSS', 'SOL', 'OFF', 'UTC', 'PAR'].includes(code)
  );

  const dep = airports[0] || 'ORY';
  const arr = airports[1] || (airports[0] === 'ORY' ? 'ESC' : 'ORY');

  return { dep, arr, flightNo };
}

/**
 * Process raw events into structured PNC duties with French airline rules
 */
export function processPncEvents(
  rawEvents: RawIcsEvent[],
  settings?: Partial<AppSettings>
): Map<string, PncDayDuty> {
  const briefingMins = settings?.clementBriefingMinutes ?? 75;
  const homeMins = settings?.clementHomeAfterLandingMinutes ?? 90;
  const groundTravelMins = settings?.clementGroundCourseTravelMinutes ?? 90;

  const dutyMap = new Map<string, PncDayDuty>();

  // Sort events chronologically
  const sorted = [...rawEvents].sort((a, b) => {
    return parseIcsDate(a.dtstart).getTime() - parseIcsDate(b.dtstart).getTime();
  });

  // Group events by Paris local date
  const eventsByDate = new Map<string, RawIcsEvent[]>();
  for (const ev of sorted) {
    if (!ev.dtstart) continue;
    const startDate = parseIcsDate(ev.dtstart);
    const dateKey = formatParisDate(startDate);
    if (!eventsByDate.has(dateKey)) {
      eventsByDate.set(dateKey, []);
    }
    eventsByDate.get(dateKey)!.push(ev);
  }

  // First pass: identify ground courses and standalone off days
  for (const [dateKey, dayEvents] of eventsByDate.entries()) {
    const isGroundCourse = dayEvents.some(
      (e) =>
        e.summary.toLowerCase().includes('cs_css') ||
        e.description.toLowerCase().includes('cs_css') ||
        e.summary.toLowerCase().includes('cours au sol') ||
        e.summary.toLowerCase().includes('sol') ||
        e.summary.toLowerCase().includes('instruction')
    );

    if (isGroundCourse) {
      const firstEvent = dayEvents[0];
      const startD = parseIcsDate(firstEvent.dtstart);
      const endD = firstEvent.dtend ? parseIcsDate(firstEvent.dtend) : new Date(startD.getTime() + 7 * 3600 * 1000);
      const startTime = formatParisTime(startD);
      const endTime = formatParisTime(endD);

      dutyMap.set(dateKey, {
        date: dateKey,
        type: 'cours_au_sol',
        title: 'Cours au sol (CS_CSS)',
        legs: [],
        briefingTime: startTime, // Rule: briefing rule does NOT apply, starts at indicated time
        freeTimeAtHome: calculateHomeTime(endD, groundTravelMins),
        isLayover: false,
        rawSummary: firstEvent.summary,
        notes: `Activité sol certifiée / stage sécurité. Début : ${startTime}. Fin de séance : ${endTime}.`,
      });
      continue;
    }

    const isOff = dayEvents.some(
      (e) =>
        e.summary.toUpperCase().includes('OFF') ||
        e.summary.toUpperCase().includes('REPOS') ||
        e.summary.toUpperCase().includes('CONGE') ||
        e.summary.toUpperCase().includes('DISPO')
    );

    if (isOff) {
      dutyMap.set(dateKey, {
        date: dateKey,
        type: 'off',
        title: 'Jour OFF (Repos)',
        legs: [],
        isLayover: false,
        rawSummary: 'OFF',
        notes: 'Clément est disponible toute la journée.',
      });
    }
  }

  // Second pass: flight legs & rotation tracking (detecting découchers and ORY returns)
  // We collect all flight legs sorted chronologically
  const flightLegs: {
    leg: PncFlightLeg;
    startDate: Date;
    endDate: Date;
    startParisDate: string;
    endParisDate: string;
    raw: RawIcsEvent;
  }[] = [];

  for (const ev of sorted) {
    const text = `${ev.summary} ${ev.description}`.toLowerCase();
    if (text.includes('cs_css') || text.includes('cours au sol') || text.includes('off') || text.includes('repos')) {
      continue;
    }

    // It's a flight event
    const startD = parseIcsDate(ev.dtstart);
    const endD = ev.dtend ? parseIcsDate(ev.dtend) : new Date(startD.getTime() + 2 * 3600 * 1000);
    const { dep, arr, flightNo } = extractAirports(`${ev.summary} ${ev.location} ${ev.description}`);

    const isReturnToOry = arr.toUpperCase() === 'ORY';

    const leg: PncFlightLeg = {
      id: `${flightNo}-${startD.getTime()}`,
      flightNumber: flightNo,
      departureAirport: dep,
      arrivalAirport: arr,
      departureUtc: startD.toISOString(),
      arrivalUtc: endD.toISOString(),
      departureLocal: formatParisTime(startD),
      arrivalLocal: formatParisTime(endD),
      isReturnToOry,
    };

    flightLegs.push({
      leg,
      startDate: startD,
      endDate: endD,
      startParisDate: formatParisDate(startD),
      endParisDate: formatParisDate(endD),
      raw: ev,
    });
  }

  // Now group flight legs into Rotations
  // A rotation starts at base (or first leg) and terminates when arriving at ORY
  // If a day starts a rotation and doesn't finish at ORY that same day, it's a découcher (layover).
  let currentRotationLegs: typeof flightLegs = [];
  const rotations: (typeof flightLegs)[] = [];

  for (let i = 0; i < flightLegs.length; i++) {
    const item = flightLegs[i];
    currentRotationLegs.push(item);

    // If this leg lands at ORY:
    // Check if there is another leg departing very soon on the same day without going home
    // (e.g. transit ORY -> immediately departs to another city for layover)
    const nextLeg = flightLegs[i + 1];
    const isTransitingImmediately =
      nextLeg &&
      nextLeg.startParisDate === item.endParisDate &&
      (nextLeg.startDate.getTime() - item.endDate.getTime()) < 3 * 3600 * 1000 &&
      nextLeg.leg.departureAirport === 'ORY' &&
      !nextLeg.leg.isReturnToOry;

    if (item.leg.isReturnToOry && !isTransitingImmediately) {
      // Rotation ends here!
      rotations.push([...currentRotationLegs]);
      currentRotationLegs = [];
    }
  }

  // If there's an ongoing unclosed rotation at the end of the file
  if (currentRotationLegs.length > 0) {
    rotations.push(currentRotationLegs);
  }

  // Now map rotations to PncDayDuty on each day
  for (const rot of rotations) {
    if (rot.length === 0) continue;
    const firstLeg = rot[0];
    const lastLeg = rot[rot.length - 1];

    const firstDate = firstLeg.startParisDate;
    const lastDate = lastLeg.endParisDate;
    const isMultiDay = firstDate !== lastDate;
    const rotationFinalLandingAtOry = lastLeg.leg.isReturnToOry;

    // Check all dates covered by this rotation
    // Populate each day
    const datesInRotation = new Set<string>();
    rot.forEach((item) => {
      datesInRotation.add(item.startParisDate);
      datesInRotation.add(item.endParisDate);
    });

    for (const d of datesInRotation) {
      const legsOnDay = rot.filter(
        (r) => r.startParisDate === d || r.endParisDate === d
      );

      const isFirstDayOfRotation = d === firstDate;
      const isFinalDayOfRotation = d === lastDate && rotationFinalLandingAtOry;
      const isLayoverDay = isMultiDay && (!isFinalDayOfRotation || !rotationFinalLandingAtOry);

      // Briefing time is calculated with custom minutes before departure
      let briefingTime: string | undefined;
      if (isFirstDayOfRotation) {
        briefingTime = calculateBriefingTime(firstLeg.startDate, briefingMins);
      } else if (legsOnDay.length > 0) {
        // First flight of that day
        briefingTime = calculateBriefingTime(legsOnDay[0].startDate, briefingMins);
      }

      // Free time at home: only on the final day that lands at ORY, custom minutes after touchdown!
      let freeTimeAtHome: string | undefined;
      if (isFinalDayOfRotation) {
        freeTimeAtHome = calculateHomeTime(lastLeg.endDate, homeMins);
      }

      // Layover city destination
      const layoverCity =
        legsOnDay.find((l) => !l.leg.isReturnToOry)?.leg.arrivalAirport ||
        rot.find((l) => !l.leg.isReturnToOry)?.leg.arrivalAirport ||
        'Escale';

      const dayTitle = isLayoverDay
        ? `Découcher à ${layoverCity}`
        : legsOnDay.map((l) => `${l.leg.flightNumber} (${l.leg.departureAirport}→${l.leg.arrivalAirport})`).join(', ');

      dutyMap.set(d, {
        date: d,
        type: isLayoverDay ? 'decoucher' : 'vol',
        title: dayTitle,
        legs: legsOnDay.map((l) => l.leg),
        briefingTime,
        freeTimeAtHome,
        isLayover: isLayoverDay,
        layoverCity,
        rotationId: `ROT-${firstLeg.leg.flightNumber}-${firstDate}`,
        rawSummary: legsOnDay.map((l) => l.leg.flightNumber).join(' / '),
        notes: isLayoverDay
          ? `Rotation avec découcher. Clément n'est pas à la maison cette nuit (${layoverCity}). Fin de rotation prévue le ${lastDate} à ORY.`
          : `Rotation terminée à ORY. Retour maison estimé à ${freeTimeAtHome || '1h30 après posé'}.`,
      });
    }
  }

  return dutyMap;
}

/**
 * Recalculate existing duties when Clément's settings (briefing or home arrival times) change
 */
export function recalculatePncDuties(
  duties: Map<string, PncDayDuty>,
  settings: AppSettings
): Map<string, PncDayDuty> {
  const updated = new Map<string, PncDayDuty>();

  duties.forEach((duty, dateKey) => {
    const clone = { ...duty, legs: [...duty.legs] };

    if (clone.type === 'vol' || clone.type === 'decoucher') {
      if (clone.legs && clone.legs.length > 0) {
        const firstLeg = clone.legs[0];
        const departureDate = new Date(firstLeg.departureUtc);
        clone.briefingTime = calculateBriefingTime(
          departureDate,
          settings.clementBriefingMinutes
        );

        const lastLeg = clone.legs[clone.legs.length - 1];
        if (lastLeg.isReturnToOry && !clone.isLayover) {
          const arrivalDate = new Date(lastLeg.arrivalUtc);
          clone.freeTimeAtHome = calculateHomeTime(
            arrivalDate,
            settings.clementHomeAfterLandingMinutes
          );
        }
      }
    }

    updated.set(dateKey, clone);
  });

  return updated;
}

/**
 * Generate a realistic sample PNC .ics roster covering current month (e.g. October/November 2026)
 * Demonstrates:
 * - 1-day rotations (ORY - NCE - ORY)
 * - 3-day rotations with découchers (ORY - PTP / FDF - ORY)
 * - Ground course (cs_css)
 * - Off days
 * - Blank days (astreinte)
 */
export function generateSamplePncIcs(): string {
  return `BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//NTAHUB//PNC Roster Generator//FR
CALSCALE:GREGORIAN
METHOD:PUBLISH
X-WR-CALNAME:Planning PNC Clément (Orly)
X-WR-TIMEZONE:Europe/Paris

BEGIN:VEVENT
UID:pnc-20261012-01@ntahub.fr
DTSTART:20261012T051500Z
DTEND:20261012T064500Z
SUMMARY:AF7620 ORY-NCE
DESCRIPTION:Vol Orly - Nice Côte d'Azur. Décollage 07:15 heure locale.
LOCATION:ORY
END:VEVENT

BEGIN:VEVENT
UID:pnc-20261012-02@ntahub.fr
DTSTART:20261012T080000Z
DTEND:20261012T093000Z
SUMMARY:AF7627 NCE-ORY
DESCRIPTION:Vol retour Nice - Paris Orly. Posé à 11:30 heure locale.
LOCATION:NCE
END:VEVENT

BEGIN:VEVENT
UID:pnc-20261014-01@ntahub.fr
DTSTART:20261014T110000Z
DTEND:20261014T194500Z
SUMMARY:AF842 ORY-FDF
DESCRIPTION:Rotation Caraïbes - Vol aller vers Fort-de-France. Décollage 13:00 heure locale. Découcher équipage.
LOCATION:ORY
END:VEVENT

BEGIN:VEVENT
UID:pnc-20261016-01@ntahub.fr
DTSTART:20261016T220000Z
DTEND:20261017T063000Z
SUMMARY:AF841 FDF-ORY
DESCRIPTION:Vol retour Fort-de-France - Paris Orly. Posé le 17 à 08:30 heure locale.
LOCATION:FDF
END:VEVENT

BEGIN:VEVENT
UID:pnc-20261018-01@ntahub.fr
DTSTART:20261018T000000Z
DTEND:20261018T235959Z
SUMMARY:OFF Repos Récupération
DESCRIPTION:Jour OFF réglementaire post-découcher.
LOCATION:MAISON
END:VEVENT

BEGIN:VEVENT
UID:pnc-20261019-01@ntahub.fr
DTSTART:20261019T000000Z
DTEND:20261019T235959Z
SUMMARY:OFF Repos
DESCRIPTION:Jour de repos.
LOCATION:MAISON
END:VEVENT

BEGIN:VEVENT
UID:pnc-20261021-01@ntahub.fr
DTSTART:20261021T070000Z
DTEND:20261021T150000Z
SUMMARY:CS_CSS Maintien des compétences sécurité
DESCRIPTION:Cours au sol CS_CSS réglementaire. Pas de briefing vol. Début effectif 09:00 heure locale à l'Académie.
LOCATION:Académie de formation Orly
END:VEVENT

BEGIN:VEVENT
UID:pnc-20261023-01@ntahub.fr
DTSTART:20261023T083000Z
DTEND:20261023T104500Z
SUMMARY:AF6110 ORY-FCO
DESCRIPTION:Vol Orly - Rome Fiumicino. Décollage 10:30 heure locale.
LOCATION:ORY
END:VEVENT

BEGIN:VEVENT
UID:pnc-20261023-02@ntahub.fr
DTSTART:20261023T120000Z
DTEND:20261023T141500Z
SUMMARY:AF6111 FCO-ORY
DESCRIPTION:Vol retour Rome - Paris Orly. Posé 16:15 heure locale.
LOCATION:FCO
END:VEVENT

BEGIN:VEVENT
UID:pnc-20261025-01@ntahub.fr
DTSTART:20261025T000000Z
DTEND:20261025T235959Z
SUMMARY:OFF Repos
DESCRIPTION:Jour de repos dominical.
LOCATION:MAISON
END:VEVENT

END:VCALENDAR`;
}
