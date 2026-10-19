import React, { useState, useEffect } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  Plane,
  Briefcase,
  AlertCircle,
  CheckCircle2,
  Plus,
  Sparkles,
  Users,
  MapPin,
  Clock,
  Calendar,
  LayoutGrid,
  Columns3,
  Sun,
  ShieldCheck,
  CalendarDays,
  Info,
} from 'lucide-react';
import {
  PncDayDuty,
  IreneDayOverride,
  ChildActivity,
  FamilyEvent,
  UserProfile,
  AppSettings,
} from '../types';
import {
  formatParisDate,
  getTodayParisStr,
  getDayOfWeekIndex,
  timeToMinutes,
  minutesToTime,
} from '../utils/timezone';
import {
  getIreneStatusOnDate,
  checkChildActivityConflict,
  isClementAvailable,
  isIreneAvailable,
} from '../utils/availability';
import { getZoneCHoliday } from '../utils/holidaysZoneC';
import {
  WeekViewTooltip,
  WeekTooltipState,
  WeekTooltipData,
} from './WeekViewTooltip';

interface WeekViewProps {
  pncDuties: Map<string, PncDayDuty>;
  ireneOverrides: Map<string, IreneDayOverride>;
  childActivities: ChildActivity[];
  events: FamilyEvent[];
  currentUser: UserProfile;
  settings?: AppSettings;
  onSelectDay: (date: string) => void;
  onOpenAddEvent: (date?: string) => void;
}

type WeekFilter = 'all' | 'clement' | 'irene' | 'children';
type WeekDisplayMode = 'columns' | 'timeline';

const DAY_LABELS = [
  { short: 'Lun', long: 'Lundi' },
  { short: 'Mar', long: 'Mardi' },
  { short: 'Mer', long: 'Mercredi' },
  { short: 'Jeu', long: 'Jeudi' },
  { short: 'Ven', long: 'Vendredi' },
  { short: 'Sam', long: 'Samedi' },
  { short: 'Dim', long: 'Dimanche' },
];

export const WeekView: React.FC<WeekViewProps> = ({
  pncDuties,
  ireneOverrides,
  childActivities,
  events,
  currentUser,
  settings,
  onSelectDay,
  onOpenAddEvent,
}) => {
  // Semaine affichée (par défaut : la semaine en cours)
  const [currentWeekDate, setCurrentWeekDate] = useState(() => new Date());
  const [filter, setFilter] = useState<WeekFilter>('all');
  const [displayMode, setDisplayMode] = useState<WeekDisplayMode>('columns');

  // Tooltip state for flights, activities, and events
  const [tooltip, setTooltip] = useState<WeekTooltipState | null>(null);

  // Automatically dismiss tooltip on window scroll or resize
  useEffect(() => {
    const handleDismiss = () => setTooltip(null);
    window.addEventListener('scroll', handleDismiss, true);
    window.addEventListener('resize', handleDismiss);
    return () => {
      window.removeEventListener('scroll', handleDismiss, true);
      window.removeEventListener('resize', handleDismiss);
    };
  }, []);

  const handleShowTooltip = (e: React.MouseEvent, data: WeekTooltipData) => {
    const rect = e.currentTarget.getBoundingClientRect();
    setTooltip({
      data,
      targetRect: rect,
    });
  };

  const handleHideTooltip = () => {
    setTooltip(null);
  };

  // Compute Monday of the current week
  const getMonday = (d: Date): Date => {
    const copy = new Date(d);
    let day = copy.getDay() - 1; // 0 = Mon, 6 = Sun
    if (day === -1) day = 6;
    copy.setDate(copy.getDate() - day);
    copy.setHours(0, 0, 0, 0);
    return copy;
  };

  const monday = getMonday(currentWeekDate);

  // Generate 7 days of the week [Mon..Sun]
  const weekDays = Array.from({ length: 7 }).map((_, i) => {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    return d;
  });

  const weekDateStrings = weekDays.map((d) => formatParisDate(d));
  const startDateStr = weekDateStrings[0];
  const endDateStr = weekDateStrings[6];

  // Navigation handlers
  const handlePrevWeek = () => {
    const nextD = new Date(monday);
    nextD.setDate(nextD.getDate() - 7);
    setCurrentWeekDate(nextD);
  };

  const handleNextWeek = () => {
    const nextD = new Date(monday);
    nextD.setDate(nextD.getDate() + 7);
    setCurrentWeekDate(nextD);
  };

  const handleGoToToday = () => {
    setCurrentWeekDate(new Date());
  };

  // Helper for child activities of a day
  const getActivitiesForDate = (dateStr: string): ChildActivity[] => {
    const dow = getDayOfWeekIndex(dateStr);
    return childActivities.filter((act) => act.dayOfWeek === dow);
  };

  // Compute week stats for header summary
  let weekFlightCount = 0;
  let weekLayoverCount = 0;
  let weekActivitiesCount = 0;
  let weekEventsCount = 0;
  let weekConflictsCount = 0;

  weekDateStrings.forEach((dStr) => {
    const duty = pncDuties.get(dStr);
    if (duty?.type === 'vol') {
      weekFlightCount += duty.legs.length || 1;
      if (duty.isLayover) weekLayoverCount += 1;
    }
    const dayActs = getActivitiesForDate(dStr);
    weekActivitiesCount += dayActs.length;
    dayActs.forEach((act) => {
      const res = checkChildActivityConflict(
        act,
        dStr,
        pncDuties,
        ireneOverrides,
        events,
        settings
      );
      if (res.hasConflict) weekConflictsCount += 1;
    });

    const dayEvts = events.filter((e) => e.date === dStr);
    weekEventsCount += dayEvts.length;
  });

  // Today string for comparison
  const todayDateStr = getTodayParisStr();

  // Hours array for timeline view (07:00 to 22:00)
  const timelineHours = Array.from({ length: 16 }).map((_, i) => i + 7);

  return (
    <div className="space-y-4">
      {/* 1. Header Toolbar with Navigation and Display Options */}
      <div className="bg-white dark:bg-slate-900 rounded-xl p-4 border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col lg:flex-row lg:items-center justify-between gap-4 transition-colors">
        {/* Week navigation */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-1">
            <button
              onClick={handlePrevWeek}
              className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
              title="Semaine précédente"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={handleNextWeek}
              className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
              title="Semaine suivante"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          <div>
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded-md bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 text-xs font-bold border border-indigo-200/60 dark:border-indigo-800/60">
                Semaine
              </span>
              <h1 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white capitalize">
                {new Intl.DateTimeFormat('fr-FR', {
                  day: 'numeric',
                  month: 'short',
                }).format(weekDays[0])}{' '}
                au{' '}
                {new Intl.DateTimeFormat('fr-FR', {
                  day: 'numeric',
                  month: 'short',
                  year: 'numeric',
                }).format(weekDays[6])}
              </h1>
            </div>
          </div>

          <button
            onClick={handleGoToToday}
            className="px-2.5 py-1 text-xs font-semibold text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
          >
            Aujourd'hui
          </button>

          {/* Mode switch: Colonnes vs Timeline */}
          <div className="flex items-center bg-slate-100 dark:bg-slate-800 p-0.5 rounded-lg text-xs font-medium">
            <button
              onClick={() => setDisplayMode('columns')}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-md transition-all ${
                displayMode === 'columns'
                  ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs font-bold'
                  : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Columns3 className="w-3.5 h-3.5" />
              <span>Cartes détaillées</span>
            </button>
            <button
              onClick={() => setDisplayMode('timeline')}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-md transition-all ${
                displayMode === 'timeline'
                  ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs font-bold'
                  : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <LayoutGrid className="w-3.5 h-3.5" />
              <span>Grille horaire</span>
            </button>
          </div>

          {/* Infobulle helper chip */}
          <div className="hidden xl:flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-indigo-50/70 dark:bg-indigo-950/40 text-[11px] text-indigo-700 dark:text-indigo-300 font-medium border border-indigo-100 dark:border-indigo-900/60">
            <Sparkles className="w-3 h-3 text-indigo-500 shrink-0" />
            <span>Survolez un vol ou une activité pour afficher ses détails</span>
          </div>
        </div>

        {/* Filter Tabs */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex flex-wrap items-center gap-1 p-1 bg-slate-100 dark:bg-slate-800 rounded-lg text-xs font-medium">
            <button
              onClick={() => setFilter('all')}
              className={`px-2.5 py-1 rounded-md transition-all ${
                filter === 'all'
                  ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs font-bold'
                  : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              Tous
            </button>
            <button
              onClick={() => setFilter('clement')}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-md transition-all ${
                filter === 'clement'
                  ? 'bg-blue-600 text-white shadow-xs font-bold'
                  : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-blue-300" />
              <span>Clément (PNC)</span>
            </button>
            <button
              onClick={() => setFilter('irene')}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-md transition-all ${
                filter === 'irene'
                  ? 'bg-pink-600 text-white shadow-xs font-bold'
                  : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-pink-300" />
              <span>Irène</span>
            </button>
            <button
              onClick={() => setFilter('children')}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-md transition-all ${
                filter === 'children'
                  ? 'bg-amber-500 text-white shadow-xs font-bold'
                  : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-amber-200" />
              <span>Activités Enfants</span>
            </button>
          </div>

          <button
            onClick={() => onOpenAddEvent(startDateStr)}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors shadow-xs"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Ajouter</span>
          </button>
        </div>
      </div>

      {/* 2. Weekly Summary Banner */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-white dark:bg-slate-900 rounded-xl p-3 border border-slate-200 dark:border-slate-800 shadow-2xs flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-blue-100 dark:bg-blue-950/80 text-blue-700 dark:text-blue-300 flex items-center justify-center shrink-0">
            <Plane className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <div className="text-[11px] font-medium text-slate-500 dark:text-slate-400">
              Vols & Découchers
            </div>
            <div className="text-sm font-bold text-slate-900 dark:text-white leading-snug sm:truncate">
              {weekFlightCount} vol{weekFlightCount > 1 ? 's' : ''}
              {weekLayoverCount > 0 && ` (${weekLayoverCount} découcher)`}
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 rounded-xl p-3 border border-slate-200 dark:border-slate-800 shadow-2xs flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-pink-100 dark:bg-pink-950/80 text-pink-700 dark:text-pink-300 flex items-center justify-center shrink-0">
            <Briefcase className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <div className="text-[11px] font-medium text-slate-500 dark:text-slate-400">
              Travail Irène
            </div>
            <div className="text-sm font-bold text-slate-900 dark:text-white leading-snug sm:truncate">
              Rythme Bureau & TT
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 rounded-xl p-3 border border-slate-200 dark:border-slate-800 shadow-2xs flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-amber-100 dark:bg-amber-950/80 text-amber-700 dark:text-amber-300 flex items-center justify-center shrink-0">
            <Users className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <div className="text-[11px] font-medium text-slate-500 dark:text-slate-400">
              Activités Enfants
            </div>
            <div className="text-sm font-bold text-slate-900 dark:text-white leading-snug sm:truncate">
              {weekActivitiesCount} séance{weekActivitiesCount > 1 ? 's' : ''}
              {weekConflictsCount > 0 ? (
                <span className="text-red-600 dark:text-red-400 text-xs ml-1 font-extrabold">
                  ({weekConflictsCount} conflit !)
                </span>
              ) : (
                <span className="text-emerald-600 dark:text-emerald-400 text-xs ml-1">
                  (couvertes)
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 rounded-xl p-3 border border-slate-200 dark:border-slate-800 shadow-2xs flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-indigo-100 dark:bg-indigo-950/80 text-indigo-700 dark:text-indigo-300 flex items-center justify-center shrink-0">
            <Calendar className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <div className="text-[11px] font-medium text-slate-500 dark:text-slate-400">
              Événements Familiaux
            </div>
            <div className="text-sm font-bold text-slate-900 dark:text-white leading-snug sm:truncate">
              {weekEventsCount} événement{weekEventsCount > 1 ? 's' : ''}
            </div>
          </div>
        </div>
      </div>

      {/* 3. Main Weekly Grid Display */}
      {displayMode === 'columns' ? (
        /* ================= VUE 1 : GRILLE 7 COLONNES DÉTAILLÉES ================= */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-7 gap-3">
          {weekDays.map((dateObj, idx) => {
            const dateStr = formatParisDate(dateObj);
            const isToday = dateStr === todayDateStr;
            const pncDuty = pncDuties.get(dateStr);
            const ireneStatus = getIreneStatusOnDate(dateStr, ireneOverrides);
            const dayActivities = getActivitiesForDate(dateStr);
            const dayEvents = events.filter((e) => {
              if (e.date !== dateStr) return false;
              if (filter === 'clement') {
                return (
                  e.assignedTo === 'Clément' ||
                  e.assignedTo === 'Les deux' ||
                  (!e.assignedTo && (e.target === 'Clément' || e.target === 'toute la famille'))
                );
              }
              if (filter === 'irene') {
                return (
                  e.assignedTo === 'Irène' ||
                  e.assignedTo === 'Les deux' ||
                  (!e.assignedTo && (e.target === 'Irène' || e.target === 'toute la famille'))
                );
              }
              if (filter === 'children') {
                return e.target === 'Imanzi' || e.target === 'Ishema' || e.target === 'les enfants';
              }
              return true;
            });

            const holidayZoneC = getZoneCHoliday(dateStr);

            // Filter visibility checks
            const showClement = filter === 'all' || filter === 'clement';
            const showIrene = filter === 'all' || filter === 'irene';
            const showChildren = filter === 'all' || filter === 'children';

            return (
              <div
                key={dateStr}
                className={`bg-white dark:bg-slate-900 rounded-xl border transition-all flex flex-col lg:min-h-[500px] shadow-xs ${
                  isToday
                    ? 'border-indigo-500 dark:border-indigo-500 ring-2 ring-indigo-500/20'
                    : 'border-slate-200 dark:border-slate-800'
                }`}
              >
                {/* Column Header */}
                <div
                  className={`p-3 border-b transition-colors cursor-pointer rounded-t-xl ${
                    isToday
                      ? 'bg-indigo-50/70 dark:bg-indigo-950/40 border-indigo-200 dark:border-indigo-800/80'
                      : idx >= 5
                      ? 'bg-slate-50/80 dark:bg-slate-950/70 border-slate-100 dark:border-slate-800'
                      : 'bg-slate-50/40 dark:bg-slate-950/30 border-slate-100 dark:border-slate-800'
                  }`}
                  onClick={() => onSelectDay(dateStr)}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">
                        {DAY_LABELS[idx].long}
                      </span>
                      <span className="text-base font-extrabold text-slate-900 dark:text-white">
                        {dateObj.getDate()}{' '}
                        <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
                          {new Intl.DateTimeFormat('fr-FR', { month: 'short' }).format(dateObj)}
                        </span>
                      </span>
                    </div>

                    <div className="flex items-center gap-1">
                      {isToday && (
                        <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-indigo-600 text-white">
                          Auj.
                        </span>
                      )}
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onOpenAddEvent(dateStr);
                        }}
                        title={`Ajouter un événement pour le ${DAY_LABELS[idx].long} ${dateObj.getDate()}`}
                        className="p-1 rounded-md text-slate-400 hover:text-indigo-600 hover:bg-white dark:hover:bg-slate-800 transition-colors"
                      >
                        <Plus className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* School holiday badge */}
                  {holidayZoneC && (
                    <div className="mt-1.5 px-2 py-0.5 rounded bg-amber-100 dark:bg-amber-950/50 border border-amber-200 dark:border-amber-800/60 text-[10px] font-semibold text-amber-800 dark:text-amber-300 flex items-center gap-1">
                      <span>🎒</span>
                      <span className="truncate">{holidayZoneC.period.name}</span>
                    </div>
                  )}
                </div>

                {/* Day content sections */}
                <div className="p-2.5 flex-1 flex flex-col gap-2.5 overflow-y-auto">
                  {/* --- 1. CLÉMENT - ROSTER & VOLS --- */}
                  {showClement && (
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between text-[11px] font-bold text-blue-700 dark:text-blue-300 px-1">
                        <span className="flex items-center gap-1">
                          <Plane className="w-3 h-3 text-blue-600 dark:text-blue-400" />
                          <span>Clément</span>
                        </span>
                        {pncDuty && (
                          <span className="text-[10px] font-medium text-slate-500 dark:text-slate-400">
                            {pncDuty.type === 'vol' ? 'En Vol' : pncDuty.type}
                          </span>
                        )}
                      </div>

                      {pncDuty ? (
                        <div
                          onClick={() => onSelectDay(dateStr)}
                          onMouseEnter={(e) => {
                            handleShowTooltip(e, {
                              type: pncDuty.type === 'vol' ? 'flight' : 'duty_other',
                              duty: pncDuty,
                              dateStr,
                              dayLabel: DAY_LABELS[idx].long,
                            });
                          }}
                          onMouseLeave={handleHideTooltip}
                          className={`p-2 rounded-lg border text-xs cursor-pointer transition-all hover:shadow-xs ${
                            pncDuty.type === 'vol'
                              ? 'bg-blue-50/70 dark:bg-blue-950/40 border-blue-200 dark:border-blue-800 text-blue-950 dark:text-blue-200 hover:border-blue-400'
                              : pncDuty.type === 'off'
                              ? 'bg-emerald-50/60 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-800 text-emerald-900 dark:text-emerald-200'
                              : pncDuty.type === 'decoucher'
                              ? 'bg-purple-50/60 dark:bg-purple-950/30 border-purple-200 dark:border-purple-800 text-purple-900 dark:text-purple-200'
                              : 'bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200'
                          }`}
                        >
                          {pncDuty.type === 'vol' && (
                            <div className="space-y-1">
                              {pncDuty.legs && pncDuty.legs.length > 0 ? (
                                pncDuty.legs.map((leg, lIdx) => (
                                  <div
                                    key={leg.id || lIdx}
                                    onMouseEnter={(e) => {
                                      e.stopPropagation();
                                      handleShowTooltip(e, {
                                        type: 'flight',
                                        duty: pncDuty,
                                        leg,
                                        dateStr,
                                        dayLabel: DAY_LABELS[idx].long,
                                      });
                                    }}
                                    onMouseLeave={handleHideTooltip}
                                    className="flex items-center justify-between font-mono text-[11px] py-0.5 rounded px-1 -mx-1 hover:bg-blue-100/70 dark:hover:bg-blue-900/40 transition-colors"
                                  >
                                    <span className="font-bold text-blue-800 dark:text-blue-200">
                                      {leg.flightNumber}
                                    </span>
                                    <span className="text-[10px] text-slate-600 dark:text-slate-300">
                                      {leg.departureAirport} ✈ {leg.arrivalAirport}
                                    </span>
                                    <span className="text-[10px] font-semibold text-blue-700 dark:text-blue-300">
                                      {leg.departureLocal}
                                    </span>
                                  </div>
                                ))
                              ) : (
                                <div className="font-semibold">{pncDuty.title}</div>
                              )}

                              <div className="pt-1 border-t border-blue-200/60 dark:border-blue-800/60 flex items-center justify-between text-[10px] text-blue-700 dark:text-blue-300">
                                <span>Briefing: {pncDuty.briefingTime || '06:00'}</span>
                                <span>Maison: {pncDuty.freeTimeAtHome || '19:30'}</span>
                              </div>

                              {pncDuty.isLayover && (
                                <div className="mt-1 px-1.5 py-0.5 rounded bg-purple-100 dark:bg-purple-900/60 text-purple-800 dark:text-purple-200 text-[10px] font-bold flex items-center gap-1">
                                  <span>🏨 Découcher {pncDuty.layoverCity || ''}</span>
                                </div>
                              )}
                            </div>
                          )}

                          {pncDuty.type === 'off' && (
                            <div className="flex items-center gap-1.5 font-medium text-emerald-800 dark:text-emerald-300">
                              <Sun className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                              <span>Repos PNC (OFF)</span>
                            </div>
                          )}

                          {pncDuty.type === 'decoucher' && (
                            <div className="font-medium text-purple-800 dark:text-purple-300">
                              🏨 Découcher {pncDuty.layoverCity || 'Escale'}
                            </div>
                          )}

                          {pncDuty.type === 'cours_au_sol' && (
                            <div className="font-medium text-slate-700 dark:text-slate-300">
                              📚 Cours au sol (09:00 - 18:00)
                            </div>
                          )}

                          {pncDuty.type === 'blanc' && (
                            <div className="font-medium text-slate-500 dark:text-slate-400">
                              ⚪ Jour Blanc (Disponibilité)
                            </div>
                          )}
                        </div>
                      ) : (
                        <div className="p-2 rounded-lg border border-dashed border-slate-200 dark:border-slate-800 text-[11px] text-slate-400 dark:text-slate-500 italic">
                          Repos / Non planifié
                        </div>
                      )}
                    </div>
                  )}

                  {/* --- 2. IRÈNE - RYTHME DE TRAVAIL --- */}
                  {showIrene && (
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between text-[11px] font-bold text-pink-700 dark:text-pink-300 px-1">
                        <span className="flex items-center gap-1">
                          <Briefcase className="w-3 h-3 text-pink-600 dark:text-pink-400" />
                          <span>Irène</span>
                        </span>
                        <span className="text-[10px] font-medium text-slate-500 dark:text-slate-400 capitalize">
                          {ireneStatus}
                        </span>
                      </div>

                      <div
                        onClick={() => onSelectDay(dateStr)}
                        onMouseEnter={(e) => {
                          handleShowTooltip(e, {
                            type: 'irene',
                            status: ireneStatus,
                            dateStr,
                            dayLabel: DAY_LABELS[idx].long,
                          });
                        }}
                        onMouseLeave={handleHideTooltip}
                        className={`p-2 rounded-lg border text-xs cursor-pointer transition-all hover:shadow-xs ${
                          ireneStatus === 'bureau'
                            ? 'bg-amber-50/60 dark:bg-amber-950/30 border-amber-200 dark:border-amber-800/80 text-amber-950 dark:text-amber-200'
                            : ireneStatus === 'tt'
                            ? 'bg-blue-50/60 dark:bg-blue-950/30 border-blue-200 dark:border-blue-800/80 text-blue-950 dark:text-blue-200'
                            : ireneStatus === 'cp'
                            ? 'bg-emerald-50/60 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-800/80 text-emerald-950 dark:text-emerald-200'
                            : ireneStatus === 'rtt'
                            ? 'bg-purple-50/60 dark:bg-purple-950/30 border-purple-200 dark:border-purple-800/80 text-purple-950 dark:text-purple-200'
                            : 'bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300'
                        }`}
                      >
                        {ireneStatus === 'bureau' && (
                          <div>
                            <div className="font-semibold flex items-center justify-between">
                              <span>🏢 Bureau Paris</span>
                              <span className="text-[10px] font-mono text-amber-800 dark:text-amber-300">
                                09:00 - 17:00
                              </span>
                            </div>
                            <div className="text-[10px] text-amber-800/80 dark:text-amber-400/80 mt-0.5">
                              Trajet RER (1h30 aller / retour)
                            </div>
                          </div>
                        )}

                        {ireneStatus === 'tt' && (
                          <div className="font-semibold flex items-center justify-between">
                            <span>💻 Télétravail</span>
                            <span className="text-[10px] text-blue-800 dark:text-blue-300">
                              À domicile
                            </span>
                          </div>
                        )}

                        {ireneStatus === 'cp' && (
                          <div className="font-semibold text-emerald-800 dark:text-emerald-300">
                            🌴 Congés Payés (CP)
                          </div>
                        )}

                        {ireneStatus === 'rtt' && (
                          <div className="font-semibold text-purple-800 dark:text-purple-300">
                            🏖️ Journée RTT
                          </div>
                        )}

                        {ireneStatus === 'weekend' && (
                          <div className="font-semibold text-slate-600 dark:text-slate-400">
                            🌿 Repos Week-end
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* --- 3. ACTIVITÉS DES ENFANTS --- */}
                  {showChildren && (
                    <div className="space-y-1.5 pt-1 border-t border-slate-100 dark:border-slate-800">
                      <div className="flex items-center justify-between text-[11px] font-bold text-amber-700 dark:text-amber-300 px-1">
                        <span className="flex items-center gap-1">
                          <Users className="w-3 h-3 text-amber-600 dark:text-amber-400" />
                          <span>Enfants</span>
                        </span>
                        <span className="text-[10px] font-medium text-slate-500 dark:text-slate-400">
                          {dayActivities.length} activité{dayActivities.length > 1 ? 's' : ''}
                        </span>
                      </div>

                      {dayActivities.length > 0 ? (
                        <div className="space-y-1.5">
                          {dayActivities.map((act) => {
                            const conflictInfo = checkChildActivityConflict(
                              act,
                              dateStr,
                              pncDuties,
                              ireneOverrides,
                              events,
                              settings
                            );

                            return (
                              <div
                                key={act.id}
                                onClick={() => onSelectDay(dateStr)}
                                onMouseEnter={(e) => {
                                  handleShowTooltip(e, {
                                    type: 'activity',
                                    activity: act,
                                    dateStr,
                                    dayLabel: DAY_LABELS[idx].long,
                                    conflictInfo,
                                    clementDuty: pncDuty,
                                    ireneStatus,
                                  });
                                }}
                                onMouseLeave={handleHideTooltip}
                                className="p-2 rounded-lg border text-xs cursor-pointer transition-all hover:shadow-xs hover:scale-[1.01] bg-white dark:bg-slate-800/80"
                                style={{
                                  borderLeftWidth: '4px',
                                  borderLeftColor: act.color,
                                }}
                              >
                                <div className="flex items-center justify-between">
                                  <span className="font-bold text-slate-900 dark:text-white truncate">
                                    {act.activityName}
                                  </span>
                                  <span
                                    className="px-1.5 py-0.2 rounded text-[9px] font-bold text-white shrink-0"
                                    style={{ backgroundColor: act.color }}
                                  >
                                    {act.childName}
                                  </span>
                                </div>

                                <div className="flex items-center gap-1 text-[10px] text-slate-500 dark:text-slate-400 mt-1 font-mono">
                                  <Clock className="w-3 h-3 text-slate-400" />
                                  <span>
                                    {act.startTime} - {act.endTime}
                                  </span>
                                </div>

                                {act.location && (
                                  <div className="flex items-center gap-1 text-[10px] text-slate-500 dark:text-slate-400 mt-0.5 truncate">
                                    <MapPin className="w-2.5 h-2.5 text-slate-400 shrink-0" />
                                    <span className="truncate">{act.location}</span>
                                  </div>
                                )}

                                {/* Conflict indicator */}
                                <div className="mt-1.5 pt-1 border-t border-slate-100 dark:border-slate-700/60">
                                  {conflictInfo.hasConflict ? (
                                    <div className="flex items-center gap-1 text-[10px] font-bold text-red-600 dark:text-red-400">
                                      <AlertCircle className="w-3 h-3 text-red-600 dark:text-red-400 shrink-0" />
                                      <span>⚠️ Conflit : ni Clément ni Irène dispo !</span>
                                    </div>
                                  ) : conflictInfo.clementAvailable && !conflictInfo.ireneAvailable ? (
                                    <div className="flex items-center gap-1 text-[10px] font-semibold text-blue-600 dark:text-blue-400">
                                      <CheckCircle2 className="w-3 h-3 text-blue-600 dark:text-blue-400 shrink-0" />
                                      <span>Clément dispo pour trajet</span>
                                    </div>
                                  ) : !conflictInfo.clementAvailable && conflictInfo.ireneAvailable ? (
                                    <div className="flex items-center gap-1 text-[10px] font-semibold text-pink-600 dark:text-pink-400">
                                      <CheckCircle2 className="w-3 h-3 text-pink-600 dark:text-pink-400 shrink-0" />
                                      <span>Irène dispo pour trajet</span>
                                    </div>
                                  ) : (
                                    <div className="flex items-center gap-1 text-[10px] font-semibold text-emerald-600 dark:text-emerald-400">
                                      <CheckCircle2 className="w-3 h-3 text-emerald-600 dark:text-emerald-400 shrink-0" />
                                      <span>Les deux parents dispos</span>
                                    </div>
                                  )}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      ) : (
                        <div className="text-[11px] text-slate-400 dark:text-slate-500 italic px-1">
                          Pas d'activité extra-scolaire
                        </div>
                      )}
                    </div>
                  )}

                  {/* --- 4. ÉVÉNEMENTS FAMILIAUX --- */}
                  <div className="space-y-1.5 pt-1 border-t border-slate-100 dark:border-slate-800">
                    <div className="flex items-center justify-between text-[11px] font-bold text-indigo-700 dark:text-indigo-300 px-1">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3 h-3 text-indigo-600 dark:text-indigo-400" />
                        <span>Événements</span>
                      </span>
                      <span className="text-[10px] font-medium text-slate-500 dark:text-slate-400">
                        {dayEvents.length}
                      </span>
                    </div>

                    {dayEvents.length > 0 ? (
                      <div className="space-y-1.5">
                        {dayEvents.map((e) => {
                          const isClementAssigned = e.assignedTo === 'Clément';
                          const isIreneAssigned = e.assignedTo === 'Irène';
                          const isBothAssigned = e.assignedTo === 'Les deux';

                          return (
                            <div
                              key={e.id}
                              onClick={() => onSelectDay(dateStr)}
                              onMouseEnter={(ev) => {
                                handleShowTooltip(ev, {
                                  type: 'event',
                                  event: e,
                                  dateStr,
                                  dayLabel: DAY_LABELS[idx].long,
                                });
                              }}
                              onMouseLeave={handleHideTooltip}
                              className="p-2 rounded-lg border border-indigo-100 dark:border-indigo-900/60 bg-indigo-50/50 dark:bg-indigo-950/30 text-xs cursor-pointer hover:border-indigo-300 dark:hover:border-indigo-700 transition-colors"
                            >
                              <div className="flex items-center justify-between gap-1">
                                <span className="font-bold text-indigo-950 dark:text-indigo-200 capitalize truncate">
                                  {e.customTitle || e.category}
                                </span>
                                <span className="text-[10px] font-mono text-indigo-700 dark:text-indigo-300 shrink-0">
                                  {e.startTime}
                                </span>
                              </div>

                              <div className="flex flex-wrap items-center gap-1 mt-1">
                                {e.target && (
                                  <span className="px-1.5 py-0.2 rounded bg-indigo-100 dark:bg-indigo-900/60 text-indigo-800 dark:text-indigo-300 text-[9px] font-medium">
                                    {e.target}
                                  </span>
                                )}

                                {/* Assignee indicator badge */}
                                {isClementAssigned && (
                                  <span className="px-1.5 py-0.2 rounded bg-blue-100 dark:bg-blue-900/70 text-blue-800 dark:text-blue-200 text-[9px] font-bold flex items-center gap-0.5">
                                    <span className="w-1.5 h-1.5 rounded-full bg-blue-600" />
                                    <span>Clément</span>
                                  </span>
                                )}

                                {isIreneAssigned && (
                                  <span className="px-1.5 py-0.2 rounded bg-pink-100 dark:bg-pink-900/70 text-pink-800 dark:text-pink-200 text-[9px] font-bold flex items-center gap-0.5">
                                    <span className="w-1.5 h-1.5 rounded-full bg-pink-600" />
                                    <span>Irène</span>
                                  </span>
                                )}

                                {isBothAssigned && (
                                  <span className="px-1.5 py-0.2 rounded bg-purple-100 dark:bg-purple-900/70 text-purple-800 dark:text-purple-200 text-[9px] font-bold flex items-center gap-0.5">
                                    <span>👥 Les deux</span>
                                  </span>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <div className="text-[11px] text-slate-400 dark:text-slate-500 italic px-1">
                        Aucun événement
                      </div>
                    )}
                  </div>
                </div>

                {/* Day card footer button */}
                <div className="p-2 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/30 text-center rounded-b-xl">
                  <button
                    onClick={() => onSelectDay(dateStr)}
                    className="text-[11px] font-semibold text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 transition-colors"
                  >
                    Voir la journée complète →
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* ================= VUE 2 : GRILLE HORAIRE (TIMELINE 07H - 22H) ================= */
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden transition-colors">
          <div className="p-3 bg-slate-50/70 dark:bg-slate-950/50 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
            <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
              Planning Chronologique · Progression horaire de 07h00 à 22h00
            </span>
            <div className="flex items-center gap-3 text-xs text-slate-500 dark:text-slate-400">
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded bg-blue-500" /> Vols Clément
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded bg-amber-500" /> Bureau / TT Irène
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded bg-purple-500" /> Activités Enfants
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded bg-indigo-500" /> Événements
              </span>
            </div>
          </div>

          <div className="overflow-x-auto">
            <div className="min-w-[900px]">
              {/* Day Header row */}
              <div className="grid grid-cols-8 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/80 text-xs font-bold text-slate-700 dark:text-slate-300">
                <div className="p-2.5 text-center text-slate-400 border-r border-slate-200 dark:border-slate-800">
                  Heure
                </div>
                {weekDays.map((d, i) => {
                  const dStr = formatParisDate(d);
                  const isToday = dStr === todayDateStr;
                  return (
                    <div
                      key={dStr}
                      onClick={() => onSelectDay(dStr)}
                      className={`p-2.5 text-center cursor-pointer border-r border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors ${
                        isToday ? 'bg-indigo-50/80 dark:bg-indigo-950/50 text-indigo-700 dark:text-indigo-300' : ''
                      }`}
                    >
                      <div className="text-[11px] uppercase font-bold text-slate-500 dark:text-slate-400">
                        {DAY_LABELS[i].short}
                      </div>
                      <div className="text-sm font-extrabold">{d.getDate()}</div>
                    </div>
                  );
                })}
              </div>

              {/* Hourly rows */}
              <div className="divide-y divide-slate-100 dark:divide-slate-800">
                {timelineHours.map((hour) => {
                  const hourLabel = `${hour < 10 ? '0' : ''}${hour}:00`;
                  const hourStartMinutes = hour * 60;
                  const hourEndMinutes = (hour + 1) * 60;

                  return (
                    <div key={hour} className="grid grid-cols-8 min-h-[58px]">
                      {/* Time label */}
                      <div className="p-2 text-center text-xs font-mono font-semibold text-slate-400 dark:text-slate-500 border-r border-slate-200 dark:border-slate-800 bg-slate-50/30 dark:bg-slate-950/20 flex items-start justify-center">
                        {hourLabel}
                      </div>

                      {/* Day cells */}
                      {weekDateStrings.map((dStr) => {
                        const pncDuty = pncDuties.get(dStr);
                        const ireneStatus = getIreneStatusOnDate(dStr, ireneOverrides);
                        const dayActivities = getActivitiesForDate(dStr);
                        const dayEvents = events.filter((e) => e.date === dStr);

                        // Check items active in this hour
                        const matchingLegs =
                          pncDuty?.type === 'vol'
                            ? pncDuty.legs?.filter((leg) => {
                                const dep = timeToMinutes(leg.departureLocal);
                                const arr = timeToMinutes(leg.arrivalLocal);
                                return dep < hourEndMinutes && arr > hourStartMinutes;
                              })
                            : [];

                        const isBriefingHour =
                          pncDuty?.type === 'vol' &&
                          pncDuty.briefingTime &&
                          timeToMinutes(pncDuty.briefingTime) >= hourStartMinutes &&
                          timeToMinutes(pncDuty.briefingTime) < hourEndMinutes;

                        const isReturnHomeHour =
                          pncDuty?.type === 'vol' &&
                          pncDuty.freeTimeAtHome &&
                          timeToMinutes(pncDuty.freeTimeAtHome) >= hourStartMinutes &&
                          timeToMinutes(pncDuty.freeTimeAtHome) < hourEndMinutes;

                        // Irene work active
                        const isIreneWorkHour =
                          (ireneStatus === 'bureau' || ireneStatus === 'tt') &&
                          hour >= 9 &&
                          hour < 17;

                        // Child activities active in this hour
                        const matchingActs = dayActivities.filter((act) => {
                          const s = timeToMinutes(act.startTime);
                          const e = timeToMinutes(act.endTime);
                          return s < hourEndMinutes && e > hourStartMinutes;
                        });

                        // Events active in this hour
                        const matchingEvts = dayEvents.filter((evt) => {
                          const s = timeToMinutes(evt.startTime);
                          const e = timeToMinutes(evt.endTime);
                          return s < hourEndMinutes && e > hourStartMinutes;
                        });

                        const hasItems =
                          matchingLegs.length > 0 ||
                          isBriefingHour ||
                          isReturnHomeHour ||
                          isIreneWorkHour ||
                          matchingActs.length > 0 ||
                          matchingEvts.length > 0;

                        return (
                          <div
                            key={dStr}
                            onClick={() => onSelectDay(dStr)}
                            className="p-1 border-r border-slate-100 dark:border-slate-800 text-[10px] space-y-1 hover:bg-slate-50/80 dark:hover:bg-slate-800/40 cursor-pointer transition-colors relative"
                          >
                            {/* Flight Leg */}
                            {matchingLegs.map((leg) => (
                              <div
                                key={leg.id}
                                onMouseEnter={(e) => {
                                  e.stopPropagation();
                                  handleShowTooltip(e, {
                                    type: 'flight',
                                    duty: pncDuty!,
                                    leg,
                                    dateStr: dStr,
                                  });
                                }}
                                onMouseLeave={handleHideTooltip}
                                className="px-1.5 py-0.5 rounded bg-blue-600 text-white font-mono text-[9px] font-bold flex items-center justify-between shadow-2xs hover:bg-blue-700 cursor-pointer transition-colors"
                              >
                                <span>{leg.flightNumber}</span>
                                <span>
                                  {leg.departureAirport}✈{leg.arrivalAirport}
                                </span>
                              </div>
                            ))}

                            {/* Briefing */}
                            {isBriefingHour && (
                              <div
                                onMouseEnter={(e) => {
                                  e.stopPropagation();
                                  handleShowTooltip(e, {
                                    type: 'flight',
                                    duty: pncDuty!,
                                    dateStr: dStr,
                                  });
                                }}
                                onMouseLeave={handleHideTooltip}
                                className="px-1.5 py-0.5 rounded bg-blue-100 dark:bg-blue-950 text-blue-800 dark:text-blue-300 font-medium text-[9px] hover:bg-blue-200 dark:hover:bg-blue-900 cursor-pointer transition-colors"
                              >
                                ✈ Briefing ORY ({pncDuty?.briefingTime})
                              </div>
                            )}

                            {/* Return Home */}
                            {isReturnHomeHour && (
                              <div
                                onMouseEnter={(e) => {
                                  e.stopPropagation();
                                  handleShowTooltip(e, {
                                    type: 'flight',
                                    duty: pncDuty!,
                                    dateStr: dStr,
                                  });
                                }}
                                onMouseLeave={handleHideTooltip}
                                className="px-1.5 py-0.5 rounded bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 font-medium text-[9px] hover:bg-emerald-200 dark:hover:bg-emerald-900 cursor-pointer transition-colors"
                              >
                                🏡 Arrivée Maison ({pncDuty?.freeTimeAtHome})
                              </div>
                            )}

                            {/* Irène Work */}
                            {isIreneWorkHour && (
                              <div
                                onMouseEnter={(e) => {
                                  e.stopPropagation();
                                  handleShowTooltip(e, {
                                    type: 'irene',
                                    status: ireneStatus,
                                    dateStr: dStr,
                                  });
                                }}
                                onMouseLeave={handleHideTooltip}
                                className={`px-1.5 py-0.5 rounded text-[9px] font-medium transition-colors cursor-pointer ${
                                  ireneStatus === 'bureau'
                                    ? 'bg-amber-100 dark:bg-amber-950/70 text-amber-900 dark:text-amber-200 hover:bg-amber-200'
                                    : 'bg-cyan-100 dark:bg-cyan-950/70 text-cyan-900 dark:text-cyan-200 hover:bg-cyan-200'
                                }`}
                              >
                                {ireneStatus === 'bureau' ? '🏢 Bureau Irène' : '💻 TT Irène'}
                              </div>
                            )}

                            {/* Child Activities */}
                            {matchingActs.map((act) => {
                              const conflictInfo = checkChildActivityConflict(
                                act,
                                dStr,
                                pncDuties,
                                ireneOverrides,
                                events,
                                settings
                              );
                              return (
                                <div
                                  key={act.id}
                                  onMouseEnter={(e) => {
                                    e.stopPropagation();
                                    handleShowTooltip(e, {
                                      type: 'activity',
                                      activity: act,
                                      dateStr: dStr,
                                      conflictInfo,
                                      clementDuty: pncDuty,
                                      ireneStatus,
                                    });
                                  }}
                                  onMouseLeave={handleHideTooltip}
                                  className="px-1.5 py-0.5 rounded text-white font-semibold text-[9px] flex items-center justify-between shadow-2xs hover:brightness-110 cursor-pointer transition-all"
                                  style={{ backgroundColor: act.color }}
                                >
                                  <span>{act.activityName}</span>
                                  <span>{act.childName}</span>
                                </div>
                              );
                            })}

                            {/* Family Events */}
                            {matchingEvts.map((evt) => (
                              <div
                                key={evt.id}
                                onMouseEnter={(e) => {
                                  e.stopPropagation();
                                  handleShowTooltip(e, {
                                    type: 'event',
                                    event: evt,
                                    dateStr: dStr,
                                  });
                                }}
                                onMouseLeave={handleHideTooltip}
                                className="px-1.5 py-0.5 rounded bg-indigo-600 text-white font-medium text-[9px] truncate shadow-2xs hover:bg-indigo-700 cursor-pointer transition-colors"
                              >
                                {evt.customTitle || evt.category}
                              </div>
                            ))}
                          </div>
                        );
                      })}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 4. Infobulle / Tooltip interactive au survol des vols, activités et événements */}
      <WeekViewTooltip tooltipState={tooltip} />
    </div>
  );
};
