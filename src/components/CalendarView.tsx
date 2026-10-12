import React, { useState } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  Plane,
  Home,
  Sun,
  AlertCircle,
  Clock,
  Sparkles,
} from 'lucide-react';
import {
  PncDayDuty,
  IreneDayOverride,
  IreneWorkStatus,
  ChildActivity,
  FamilyEvent,
  UserProfile,
  AppSettings,
} from '../types';
import {
  formatParisDate,
  getDayOfWeekIndex,
} from '../utils/timezone';
import {
  getIreneStatusOnDate,
  checkChildActivityConflict,
} from '../utils/availability';
import { getZoneCHoliday } from '../utils/holidaysZoneC';

interface CalendarViewProps {
  pncDuties: Map<string, PncDayDuty>;
  ireneOverrides: Map<string, IreneDayOverride>;
  childActivities: ChildActivity[];
  events: FamilyEvent[];
  currentUser: UserProfile;
  settings?: AppSettings;
  onSelectDay: (date: string) => void;
  onOpenAddEvent: (date?: string) => void;
  onOpenIcsImport: () => void;
}

type FilterMode = 'all' | 'clement' | 'irene' | 'children' | 'common_free';

const DAYS_HEADER = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'];

export const CalendarView: React.FC<CalendarViewProps> = ({
  pncDuties,
  ireneOverrides,
  childActivities,
  events,
  currentUser,
  settings,
  onSelectDay,
  onOpenAddEvent,
  onOpenIcsImport,
}) => {
  // Current view date (default October 2026 as per user context)
  const [currentDate, setCurrentDate] = useState(() => new Date(2026, 9, 1)); // Oct 2026
  const [filterMode, setFilterMode] = useState<FilterMode>('all');
  const [viewType, setViewType] = useState<'month' | 'week'>('month');
  const [showZoneCHolidays, setShowZoneCHolidays] = useState(true);

  // Month navigation
  const prevPeriod = () => {
    if (viewType === 'month') {
      setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
    } else {
      const nextD = new Date(currentDate);
      nextD.setDate(nextD.getDate() - 7);
      setCurrentDate(nextD);
    }
  };

  const nextPeriod = () => {
    if (viewType === 'month') {
      setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
    } else {
      const nextD = new Date(currentDate);
      nextD.setDate(nextD.getDate() + 7);
      setCurrentDate(nextD);
    }
  };

  const goToToday = () => {
    setCurrentDate(new Date(2026, 9, 12)); // Oct 12, 2026
  };

  // Build grid days
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  // Month title in French
  const monthTitle = new Intl.DateTimeFormat('fr-FR', {
    month: 'long',
    year: 'numeric',
  }).format(currentDate);

  // Compute days to display
  let displayDates: string[] = [];

  if (viewType === 'month') {
    const firstDayOfMonth = new Date(year, month, 1);
    const lastDayOfMonth = new Date(year, month + 1, 0);

    // Day of week index for 1st day (0 = Sunday, 1 = Monday ...)
    // In Europe, Monday is 0
    let startDayOfWeek = firstDayOfMonth.getDay() - 1;
    if (startDayOfWeek === -1) startDayOfWeek = 6;

    // Previous month padding
    for (let i = startDayOfWeek; i > 0; i--) {
      const d = new Date(year, month, 1 - i);
      displayDates.push(formatParisDate(d));
    }

    // Days in current month
    for (let i = 1; i <= lastDayOfMonth.getDate(); i++) {
      const d = new Date(year, month, i);
      displayDates.push(formatParisDate(d));
    }

    // Next month padding to fill complete weeks (multiples of 7)
    const remaining = 7 - (displayDates.length % 7);
    if (remaining < 7) {
      for (let i = 1; i <= remaining; i++) {
        const d = new Date(year, month + 1, i);
        displayDates.push(formatParisDate(d));
      }
    }
  } else {
    // Week view: 7 days around currentDate
    let dayOfWeek = currentDate.getDay() - 1;
    if (dayOfWeek === -1) dayOfWeek = 6;

    const monday = new Date(currentDate);
    monday.setDate(monday.getDate() - dayOfWeek);

    for (let i = 0; i < 7; i++) {
      const d = new Date(monday);
      d.setDate(monday.getDate() + i);
      displayDates.push(formatParisDate(d));
    }
  }

  // Active child activities map for efficient lookup by dayOfWeek
  const getActivitiesForDate = (dateStr: string): ChildActivity[] => {
    const dow = getDayOfWeekIndex(dateStr);
    return childActivities.filter((act) => act.dayOfWeek === dow);
  };

  return (
    <div className="space-y-4">
      {/* Top Controls Bar */}
      <div className="bg-white dark:bg-slate-900 rounded-xl p-4 border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col lg:flex-row lg:items-center justify-between gap-4 transition-colors">
        {/* Navigation & Month Picker */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1">
            <button
              onClick={prevPeriod}
              className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
              title="Période précédente"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={nextPeriod}
              className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
              title="Période suivante"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          <h1 className="text-lg font-bold text-slate-900 dark:text-white capitalize min-w-[180px]">
            {monthTitle}
          </h1>

          <button
            onClick={goToToday}
            className="px-2.5 py-1 text-xs font-semibold text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
          >
            Aujourd'hui
          </button>

          {/* View mode toggle (Mois / Semaine) */}
          <div className="flex items-center bg-slate-100 dark:bg-slate-800 p-0.5 rounded-lg text-xs font-medium">
            <button
              onClick={() => setViewType('month')}
              className={`px-3 py-1 rounded-md transition-all ${
                viewType === 'month'
                  ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs font-bold'
                  : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              Mois
            </button>
            <button
              onClick={() => setViewType('week')}
              className={`px-3 py-1 rounded-md transition-all ${
                viewType === 'week'
                  ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs font-bold'
                  : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              Semaine
            </button>
          </div>
        </div>

        {/* Filter Tabs (Functional segmented buttons) */}
        <div className="flex flex-wrap items-center gap-1.5 p-1 bg-slate-100 dark:bg-slate-800 rounded-lg text-xs font-medium">
          <button
            onClick={() => setFilterMode('all')}
            className={`px-3 py-1.5 rounded-md transition-all whitespace-nowrap shrink-0 ${
              filterMode === 'all'
                ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs font-bold'
                : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            Tous les plannings
          </button>

          <button
            onClick={() => setFilterMode('clement')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md transition-all whitespace-nowrap shrink-0 ${
              filterMode === 'clement'
                ? 'bg-blue-600 text-white shadow-xs font-bold'
                : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-blue-400" />
            <span>Clément (PNC)</span>
          </button>

          <button
            onClick={() => setFilterMode('irene')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md transition-all whitespace-nowrap shrink-0 ${
              filterMode === 'irene'
                ? 'bg-pink-600 text-white shadow-xs font-bold'
                : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-pink-400" />
            <span>Irène</span>
          </button>

          <button
            onClick={() => setFilterMode('children')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md transition-all whitespace-nowrap shrink-0 ${
              filterMode === 'children'
                ? 'bg-amber-500 text-white shadow-xs font-bold'
                : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-amber-400" />
            <span>Enfants</span>
          </button>

          <button
            onClick={() => setFilterMode('common_free')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md transition-all whitespace-nowrap shrink-0 ${
              filterMode === 'common_free'
                ? 'bg-emerald-600 text-white shadow-xs font-bold'
                : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Moments en commun</span>
          </button>

          <button
            onClick={() => setShowZoneCHolidays(!showZoneCHolidays)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md transition-all whitespace-nowrap shrink-0 border ${
              showZoneCHolidays
                ? 'bg-amber-100 dark:bg-amber-900/40 text-amber-950 dark:text-amber-200 border-amber-300 dark:border-amber-700 font-bold shadow-2xs'
                : 'bg-transparent text-slate-500 dark:text-slate-400 border-dashed border-slate-300 dark:border-slate-700 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
            title="Afficher ou masquer les vacances scolaires de la Zone C (Paris, Créteil, Versailles)"
          >
            <span>🎒</span>
            <span>Vacances Zone C</span>
          </button>
        </div>
      </div>

      {/* Quick Legend Bar */}
      <div className="flex flex-wrap items-center justify-between text-[11px] text-slate-500 px-2 py-1 gap-y-2">
        <div className="flex flex-wrap items-center gap-4">
          <span className="font-semibold text-slate-700">Légende PNC :</span>
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-sm bg-blue-500 inline-block" />
            <span>Vol (Briefing + Maison)</span>
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-sm bg-emerald-500 inline-block" />
            <span>OFF (Vert)</span>
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-sm bg-slate-100 border border-slate-300 inline-block" />
            <span>Blanc (Astreinte)</span>
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-sm bg-purple-500 inline-block" />
            <span>Cours au sol (CS_CSS)</span>
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <span className="font-semibold text-slate-700">Famille & Vacances :</span>
          <span className="flex items-center gap-1">
            <Home className="w-3.5 h-3.5 text-blue-600" />
            <span>Télétravail</span>
          </span>
          <span className="flex items-center gap-1">
            <Sun className="w-3.5 h-3.5 text-emerald-600" />
            <span>CP / RTT</span>
          </span>
          <span className="flex items-center gap-1 font-bold text-rose-600">
            <span>❓</span>
            <span>Relais requis</span>
          </span>
          <span className="flex items-center gap-1 font-semibold text-amber-900 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
            <span>🎒</span>
            <span>Vacances Zone C</span>
          </span>
        </div>
      </div>

      {/* Calendar Grid */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden transition-colors">
        {/* Days of week header */}
        <div className="grid grid-cols-7 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-center text-xs font-bold text-slate-600 dark:text-slate-400 py-2.5">
          {DAYS_HEADER.map((d, idx) => (
            <div key={d} className={idx >= 5 ? 'text-indigo-600 dark:text-indigo-400 font-extrabold' : ''}>
              {d}
            </div>
          ))}
        </div>

        {/* Calendar Cells */}
        <div className="grid grid-cols-7 divide-x divide-y divide-slate-100 dark:divide-slate-800">
          {displayDates.map((dateStr) => {
            const dateObj = new Date(dateStr);
            const isCurrentMonth = dateObj.getMonth() === month;
            const dayNum = dateObj.getDate();
            const pncDuty = pncDuties.get(dateStr);
            const ireneStatus = getIreneStatusOnDate(dateStr, ireneOverrides);
            const dayActivities = getActivitiesForDate(dateStr);
            const dayEvents = events.filter((e) => e.date === dateStr);
            const holidayZoneC = showZoneCHolidays ? getZoneCHoliday(dateStr) : null;

            // Check if any child activity has conflict
            const hasConflict = dayActivities.some((act) => {
              const res = checkChildActivityConflict(
                act,
                dateStr,
                pncDuties,
                ireneOverrides,
                events,
                settings
              );
              return res.hasConflict;
            });

            // Common free test
            const isClementOff = pncDuty?.type === 'off' || !pncDuty;
            const isIreneFree =
              ireneStatus === 'cp' || ireneStatus === 'rtt' || ireneStatus === 'weekend';
            const isCommonFullFree = isClementOff && isIreneFree;

            // Highlight border if filtered to common free
            const isCommonFreeFiltered = filterMode === 'common_free' && isCommonFullFree;

            return (
              <div
                key={dateStr}
                onClick={() => onSelectDay(dateStr)}
                className={`min-h-[125px] p-2 flex flex-col justify-between transition-colors cursor-pointer group relative ${
                  !isCurrentMonth
                    ? 'bg-slate-50/50 dark:bg-slate-950/40 text-slate-400 dark:text-slate-600'
                    : holidayZoneC
                    ? 'bg-amber-50/25 dark:bg-amber-950/20 hover:bg-amber-50/60 dark:hover:bg-amber-950/40'
                    : 'bg-white dark:bg-slate-900 hover:bg-slate-50/80 dark:hover:bg-slate-800/60'
                } ${isCommonFreeFiltered ? 'ring-2 ring-emerald-500 bg-emerald-50/20 dark:bg-emerald-950/30' : ''}`}
              >
                {/* Zone C School Holiday Top Ribbon */}
                {holidayZoneC && (
                  <div
                    className={`-mx-2 -mt-2 mb-1 px-1.5 py-0.5 text-[9px] font-bold flex items-center justify-between border-b ${
                      holidayZoneC.isFirstDay
                        ? 'bg-amber-200 dark:bg-amber-900/60 text-amber-950 dark:text-amber-200 border-amber-300 dark:border-amber-700'
                        : 'bg-amber-100/80 dark:bg-amber-950/60 text-amber-900 dark:text-amber-300 border-amber-200/60 dark:border-amber-900/50'
                    }`}
                    title={`Vacances scolaires Zone C (Paris, Créteil, Versailles) : ${holidayZoneC.period.name}`}
                  >
                    <span className="truncate flex items-center gap-1">
                      <span>🎒</span>
                      <span className="truncate">{holidayZoneC.isFirstDay ? `Début ${holidayZoneC.period.name}` : holidayZoneC.period.name}</span>
                    </span>
                  </div>
                )}

                {/* Day Header: Day number + Badges */}
                <div className="flex items-center justify-between mb-1.5">
                  <span
                    className={`text-xs font-bold tabular-nums w-6 h-6 rounded-full flex items-center justify-center ${
                      dateStr === '2026-10-12'
                        ? 'bg-indigo-600 text-white font-extrabold'
                        : isCurrentMonth
                        ? 'text-slate-800 dark:text-slate-200'
                        : 'text-slate-400 dark:text-slate-600'
                    }`}
                  >
                    {dayNum}
                  </span>

                  <div className="flex items-center gap-1">
                    {/* If both parents fully free */}
                    {isCommonFullFree && (
                      <span
                        className="text-[10px] text-emerald-700 dark:text-emerald-300 bg-emerald-100 dark:bg-emerald-900/50 font-bold px-1.5 py-0.5 rounded"
                        title="Journée entière libre en commun !"
                      >
                        Ensemble
                      </span>
                    )}

                    {/* Children activity colored stripes indicator */}
                    {dayActivities.length > 0 && (
                      <div className="flex items-center gap-0.5" title="Activités enfants prévues">
                        {dayActivities.map((act) => (
                          <span
                            key={act.id}
                            className="w-1.5 h-3 rounded-full inline-block"
                            style={{ backgroundColor: act.color }}
                          />
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* Main Content Area */}
                <div className="space-y-1.5 flex-1">
                  {/* 1. CLÉMENT PNC DUTY BADGE */}
                  {(filterMode === 'all' || filterMode === 'clement') && (
                    <div>
                      {pncDuty?.type === 'vol' ? (
                        <div className="p-1.5 bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800/70 rounded-md text-blue-900 dark:text-blue-200 text-[11px] leading-tight">
                          <div className="flex items-center justify-between font-bold text-blue-800 dark:text-blue-300 mb-0.5">
                            <span className="flex items-center gap-1 truncate">
                              <Plane className="w-3 h-3 shrink-0" />
                              <span className="truncate">{pncDuty.rawSummary || 'Vol'}</span>
                            </span>
                          </div>
                          {/* Briefing and Home hours strictly as requested */}
                          <div className="text-[10px] text-blue-700 dark:text-blue-400 font-mono tabular-nums">
                            <span>Brf: {pncDuty.briefingTime || '--:--'}</span>
                            <span className="mx-1">·</span>
                            <span>
                              Msn: {pncDuty.freeTimeAtHome || (pncDuty.isLayover ? 'Découcher' : '--:--')}
                            </span>
                          </div>
                        </div>
                      ) : pncDuty?.type === 'decoucher' ? (
                        <div className="p-1.5 bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800/70 rounded-md text-indigo-900 dark:text-indigo-200 text-[11px] leading-tight">
                          <div className="flex items-center gap-1 font-bold text-indigo-800 dark:text-indigo-300">
                            <Plane className="w-3 h-3" />
                            <span>Découcher {pncDuty.layoverCity}</span>
                          </div>
                          <span className="text-[10px] text-indigo-600 dark:text-indigo-400 block mt-0.5">
                            Pas à la maison
                          </span>
                        </div>
                      ) : pncDuty?.type === 'cours_au_sol' ? (
                        <div className="p-1.5 bg-purple-50 dark:bg-purple-950/40 border border-purple-200 dark:border-purple-800/70 rounded-md text-purple-900 dark:text-purple-200 text-[11px] leading-tight">
                          <span className="font-bold block text-purple-800 dark:text-purple-300">Cours au sol (CS_CSS)</span>
                          <span className="text-[10px] font-mono text-purple-700 dark:text-purple-400">
                            Début {pncDuty.briefingTime || '09:00'} (sans 1h15 brf)
                          </span>
                        </div>
                      ) : pncDuty?.type === 'off' ? (
                        <div className="p-1 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/70 rounded-md text-emerald-800 dark:text-emerald-300 text-[11px] font-semibold text-center">
                          OFF (Libre)
                        </div>
                      ) : (
                        // Blanc = astreinte
                        <div className="p-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-md text-slate-600 dark:text-slate-300 text-[10px] text-center">
                          Astreinte (Blanc)
                        </div>
                      )}
                    </div>
                  )}

                  {/* 2. IRÈNE WORK STATUS BADGE */}
                  {(filterMode === 'all' || filterMode === 'irene') && (
                    <div>
                      {ireneStatus === 'tt' ? (
                        <div className="flex items-center gap-1 p-1 bg-blue-50 border border-blue-200 rounded-md text-blue-800 text-[11px] font-medium">
                          <Home className="w-3 h-3 text-blue-600 shrink-0" />
                          <span className="truncate font-semibold">Télétravail</span>
                        </div>
                      ) : ireneStatus === 'cp' ? (
                        <div className="flex items-center gap-1 p-1 bg-emerald-50 border border-emerald-200 rounded-md text-emerald-800 text-[11px] font-semibold">
                          <Sun className="w-3 h-3 text-emerald-600 shrink-0" />
                          <span>CP (Libre)</span>
                        </div>
                      ) : ireneStatus === 'rtt' ? (
                        <div className="flex items-center gap-1 p-1 bg-emerald-50 border border-emerald-200 rounded-md text-emerald-800 text-[11px] font-semibold">
                          <Sun className="w-3 h-3 text-emerald-600 shrink-0" />
                          <span>RTT (Libre)</span>
                        </div>
                      ) : ireneStatus === 'bureau' ? (
                        <div className="p-1 text-slate-500 text-[10px] truncate">
                          Bureau (7h30 - 18h30)
                        </div>
                      ) : null}
                    </div>
                  )}

                  {/* 3. CHILDREN ACTIVITIES WITH CONFLICT ❓ */}
                  {(filterMode === 'all' || filterMode === 'children') && dayActivities.length > 0 && (
                    <div className="space-y-1 pt-0.5">
                      {dayActivities.map((act) => {
                        const conflict = checkChildActivityConflict(
                          act,
                          dateStr,
                          pncDuties,
                          ireneOverrides,
                          events
                        );

                        return (
                          <div
                            key={act.id}
                            className={`flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium border truncate ${
                              conflict.hasConflict
                                ? 'bg-rose-50 text-rose-800 border-rose-300 font-bold'
                                : 'bg-slate-50 text-slate-700 border-slate-200'
                            }`}
                            title={`${act.childName} - ${act.activityName} (${act.startTime}-${act.endTime}). ${conflict.reason}`}
                          >
                            {/* Distinct color marker */}
                            <span
                              className="w-1.5 h-1.5 rounded-full shrink-0"
                              style={{ backgroundColor: act.color }}
                            />

                            {/* Prominent Question Mark Emoji if both parents are unavailable! */}
                            {conflict.hasConflict && (
                              <span className="text-xs select-none" title="Conflit : ni Clément ni Irène disponible !">
                                ❓
                              </span>
                            )}

                            <span className="truncate">
                              {act.childName[0]}.: {act.activityName}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {/* 4. FAMILY EVENTS */}
                  {dayEvents.length > 0 && (
                    <div className="flex flex-wrap gap-1 pt-0.5">
                      {dayEvents.map((e) => (
                        <span
                          key={e.id}
                          className="px-1.5 py-0.5 bg-indigo-50 border border-indigo-200 text-indigo-800 rounded text-[10px] font-medium truncate max-w-full"
                          title={`${e.category} - ${e.target} (${e.startTime}-${e.endTime})`}
                        >
                          📌 {e.category}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                {/* Hover affordance */}
                <div className="opacity-0 group-hover:opacity-100 text-[10px] text-indigo-600 font-semibold pt-1 text-right transition-opacity">
                  Voir détails →
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
