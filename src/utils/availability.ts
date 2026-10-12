import {
  PncDayDuty,
  IreneDayOverride,
  IreneWorkStatus,
  ChildActivity,
  FamilyEvent,
  FreeTimeBlock,
  AppSettings,
} from '../types';
import {
  timeToMinutes,
  minutesToTime,
  getDayOfWeekIndex,
} from './timezone';

export interface Interval {
  start: number; // minutes from midnight 0..1440
  end: number;
}

/**
 * Determine if two intervals overlap
 */
export function intervalsOverlap(a: Interval, b: Interval): boolean {
  return a.start < b.end && a.end > b.start;
}

/**
 * Get intervals during which Clément is BUSY on a given date
 */
export function getClementBusyIntervals(
  date: string,
  pncDuties: Map<string, PncDayDuty>,
  events: FamilyEvent[]
): Interval[] {
  const intervals: Interval[] = [];
  const duty = pncDuties.get(date);

  if (duty) {
    if (duty.type === 'decoucher') {
      // Busy all day and night (away on layover)
      intervals.push({ start: 0, end: 1440 });
    } else if (duty.type === 'vol') {
      // Busy from briefing time until home time
      const bMin = duty.briefingTime ? timeToMinutes(duty.briefingTime) : 6 * 60;
      const hMin = duty.freeTimeAtHome ? timeToMinutes(duty.freeTimeAtHome) : 20 * 60;
      
      if (hMin >= bMin) {
        intervals.push({ start: bMin, end: hMin });
      } else {
        // Wrapped past midnight
        intervals.push({ start: bMin, end: 1440 });
      }
    } else if (duty.type === 'cours_au_sol') {
      const bMin = duty.briefingTime ? timeToMinutes(duty.briefingTime) : 9 * 60;
      const hMin = duty.freeTimeAtHome ? timeToMinutes(duty.freeTimeAtHome) : 18 * 60;
      intervals.push({ start: bMin, end: hMin });
    }
    // 'off' and 'blanc' mean no scheduled duty flight blocking him
  }

  // Personal events dedicated to Clément
  const clementEvents = events.filter(
    (e) => e.date === date && (e.target === 'Clément' || e.target === 'toute la famille')
  );
  for (const e of clementEvents) {
    intervals.push({
      start: timeToMinutes(e.startTime),
      end: timeToMinutes(e.endTime),
    });
  }

  return intervals;
}

/**
 * Get effective status for Irène on a specific date
 */
export function getIreneStatusOnDate(
  date: string,
  overrides: Map<string, IreneDayOverride>
): IreneWorkStatus | 'weekend' {
  const override = overrides.get(date);
  if (override) {
    return override.status;
  }
  const dayOfWeek = getDayOfWeekIndex(date);
  if (dayOfWeek === 0 || dayOfWeek === 6) {
    return 'weekend';
  }
  return 'bureau'; // Standard Monday-Friday
}

/**
 * Get intervals during which Irène is BUSY on a given date
 */
export function getIreneBusyIntervals(
  date: string,
  overrides: Map<string, IreneDayOverride>,
  events: FamilyEvent[],
  settings?: AppSettings
): Interval[] {
  const intervals: Interval[] = [];
  const status = getIreneStatusOnDate(date, overrides);

  if (status === 'bureau') {
    const startWork = settings ? timeToMinutes(settings.ireneWorkStart) : 9 * 60;
    const endWork = settings ? timeToMinutes(settings.ireneWorkEnd) : 17 * 60;
    const commuteGo = settings ? settings.ireneCommuteGoMinutes : 90;
    const commuteReturn = settings ? settings.ireneCommuteReturnMinutes : 90;

    intervals.push({
      start: Math.max(0, startWork - commuteGo),
      end: Math.min(1440, endWork + commuteReturn),
    });
  } else if (status === 'tt') {
    const startTt = settings ? timeToMinutes(settings.ireneTtWorkStart) : 9 * 60;
    const endTt = settings ? timeToMinutes(settings.ireneTtWorkEnd) : 17 * 60;
    intervals.push({ start: startTt, end: endTt });
  }
  // 'cp', 'rtt', 'weekend' have no work busy intervals!

  // Personal events dedicated to Irène
  const ireneEvents = events.filter(
    (e) => e.date === date && (e.target === 'Irène' || e.target === 'toute la famille')
  );
  for (const e of ireneEvents) {
    intervals.push({
      start: timeToMinutes(e.startTime),
      end: timeToMinutes(e.endTime),
    });
  }

  return intervals;
}

/**
 * Check if Clément is available during a specific time range
 */
export function isClementAvailable(
  date: string,
  startTime: string,
  endTime: string,
  pncDuties: Map<string, PncDayDuty>,
  events: FamilyEvent[]
): boolean {
  const activityInterval: Interval = {
    start: timeToMinutes(startTime),
    end: timeToMinutes(endTime),
  };
  const busy = getClementBusyIntervals(date, pncDuties, events);
  return !busy.some((b) => intervalsOverlap(b, activityInterval));
}

/**
 * Check if Irène is available during a specific time range
 */
export function isIreneAvailable(
  date: string,
  startTime: string,
  endTime: string,
  overrides: Map<string, IreneDayOverride>,
  events: FamilyEvent[],
  settings?: AppSettings
): boolean {
  const activityInterval: Interval = {
    start: timeToMinutes(startTime),
    end: timeToMinutes(endTime),
  };
  const busy = getIreneBusyIntervals(date, overrides, events, settings);
  return !busy.some((b) => intervalsOverlap(b, activityInterval));
}

/**
 * Check if a child activity has conflict on a given date:
 * Returns TRUE if NEITHER Clément NOR Irène is available!
 */
export function checkChildActivityConflict(
  activity: ChildActivity,
  date: string,
  pncDuties: Map<string, PncDayDuty>,
  ireneOverrides: Map<string, IreneDayOverride>,
  events: FamilyEvent[],
  settings?: AppSettings
): {
  hasConflict: boolean;
  clementAvailable: boolean;
  ireneAvailable: boolean;
  reason: string;
} {
  const clementAvail = isClementAvailable(
    date,
    activity.startTime,
    activity.endTime,
    pncDuties,
    events
  );
  const ireneAvail = isIreneAvailable(
    date,
    activity.startTime,
    activity.endTime,
    ireneOverrides,
    events,
    settings
  );

  const hasConflict = !clementAvail && !ireneAvail;

  let reason = '';
  if (hasConflict) {
    reason = "Ni Clément ni Irène n'est disponible. Prévoir un accompagnateur ou relais familial !";
  } else if (!clementAvail && ireneAvail) {
    reason = 'Clément en vol/service. Irène est disponible pour accompagner.';
  } else if (clementAvail && !ireneAvail) {
    reason = 'Irène au travail/trajet. Clément est disponible pour accompagner.';
  } else {
    reason = 'Les deux parents sont disponibles.';
  }

  return {
    hasConflict,
    clementAvailable: clementAvail,
    ireneAvailable: ireneAvail,
    reason,
  };
}

/**
 * Merge sorted intervals
 */
function mergeIntervals(intervals: Interval[]): Interval[] {
  if (intervals.length === 0) return [];
  const sorted = [...intervals].sort((a, b) => a.start - b.start);
  const merged: Interval[] = [sorted[0]];

  for (let i = 1; i < sorted.length; i++) {
    const cur = sorted[i];
    const prev = merged[merged.length - 1];

    if (cur.start <= prev.end) {
      prev.end = Math.max(prev.end, cur.end);
    } else {
      merged.push(cur);
    }
  }

  return merged;
}

/**
 * Invert busy intervals within day bounds (e.g. 08:00 to 22:30 wakeful hours) to find free slots
 */
export function computeFreeSlotsForDay(
  busyIntervals: Interval[],
  dayStart = 8 * 60,
  dayEnd = 22 * 60 + 30
): Interval[] {
  const mergedBusy = mergeIntervals(busyIntervals);
  const free: Interval[] = [];
  let pointer = dayStart;

  for (const b of mergedBusy) {
    const overlapStart = Math.max(b.start, dayStart);
    const overlapEnd = Math.min(b.end, dayEnd);

    if (overlapStart > pointer) {
      free.push({ start: pointer, end: overlapStart });
    }
    if (overlapEnd > pointer) {
      pointer = overlapEnd;
    }
  }

  if (pointer < dayEnd) {
    free.push({ start: pointer, end: dayEnd });
  }

  // Filter slots shorter than 45 minutes
  return free.filter((s) => s.end - s.start >= 45);
}

/**
 * Compute common free intervals between two sets of free intervals
 */
export function intersectIntervals(a: Interval[], b: Interval[]): Interval[] {
  const common: Interval[] = [];
  for (const itemA of a) {
    for (const itemB of b) {
      const start = Math.max(itemA.start, itemB.start);
      const end = Math.min(itemA.end, itemB.end);
      if (end - start >= 45) {
        common.push({ start, end });
      }
    }
  }
  return common;
}

/**
 * Compute free moments for a date range (e.g. 14 days around today)
 */
export function computeFreeMoments(
  dates: string[],
  pncDuties: Map<string, PncDayDuty>,
  ireneOverrides: Map<string, IreneDayOverride>,
  events: FamilyEvent[],
  settings?: AppSettings
): {
  clementFree: FreeTimeBlock[];
  ireneFree: FreeTimeBlock[];
  commonFree: FreeTimeBlock[];
} {
  const clementFree: FreeTimeBlock[] = [];
  const ireneFree: FreeTimeBlock[] = [];
  const commonFree: FreeTimeBlock[] = [];

  for (const date of dates) {
    const clementBusy = getClementBusyIntervals(date, pncDuties, events);
    const ireneBusy = getIreneBusyIntervals(date, ireneOverrides, events, settings);

    const cFreeSlots = computeFreeSlotsForDay(clementBusy);
    const iFreeSlots = computeFreeSlotsForDay(ireneBusy);
    const commSlots = intersectIntervals(cFreeSlots, iFreeSlots);

    cFreeSlots.forEach((slot) => {
      clementFree.push({
        date,
        start: minutesToTime(slot.start),
        end: minutesToTime(slot.end),
        type: 'clement',
        description: `Clément libre de ${minutesToTime(slot.start)} à ${minutesToTime(slot.end)}`,
      });
    });

    iFreeSlots.forEach((slot) => {
      ireneFree.push({
        date,
        start: minutesToTime(slot.start),
        end: minutesToTime(slot.end),
        type: 'irene',
        description: `Irène libre de ${minutesToTime(slot.start)} à ${minutesToTime(slot.end)}`,
      });
    });

    commSlots.forEach((slot) => {
      const isEvening = slot.start >= 19 * 60;
      const isFullDay = slot.end - slot.start >= 8 * 60;
      let desc = `Moment à deux / Famille (${minutesToTime(slot.start)} - ${minutesToTime(slot.end)})`;
      if (isFullDay) desc = 'Journée entière en commun !';
      else if (isEvening) desc = 'Soirée libre ensemble';

      commonFree.push({
        date,
        start: minutesToTime(slot.start),
        end: minutesToTime(slot.end),
        type: 'commun',
        description: desc,
      });
    });
  }

  return { clementFree, ireneFree, commonFree };
}
