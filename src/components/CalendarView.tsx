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
  BookOpen,
  Laptop,
  ChevronDown,
} from 'lucide-react';
import {
  PncDayDuty,
  PncDayType,
  DEFAULT_SETTINGS,
  IreneDayOverride,
  IreneWorkStatus,
  ChildActivity,
  FamilyEvent,
  UserProfile,
  AppSettings,
} from '../types';
import {
  formatParisDate,
  getTodayParisStr,
  getDayOfWeekIndex,
} from '../utils/timezone';
import {
  getIreneStatusOnDate,
  checkChildActivityConflict,
} from '../utils/availability';
import { getZoneCHoliday } from '../utils/holidaysZoneC';
import { useHorizontalSwipe } from '../utils/useHorizontalSwipe';

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
  onNavigateToWeekView?: () => void;
}

type FilterMode = 'all' | 'clement' | 'irene' | 'children' | 'common_free';

const DAYS_HEADER = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'];

/** Couleur de la bande verticale de Clément (téléphone) */
function clementBandClass(type: PncDayType | undefined): string {
  switch (type) {
    case 'vol':
      return 'bg-sky-300 dark:bg-sky-700';
    case 'decoucher':
      return 'bg-sky-400 dark:bg-sky-800 bg-hatch';
    case 'cours_au_sol':
      return 'bg-[#dcb68c] dark:bg-[#7a5a3a]';
    case 'off':
      return 'bg-emerald-300 dark:bg-emerald-700';
    default:
      return ''; // Blanc (astreinte) ou rien de planifié
  }
}

/** Couleur de la bande verticale d'Irène (téléphone) */
function ireneBandClass(status: IreneWorkStatus | 'weekend'): string {
  switch (status) {
    case 'bureau':
      return 'bg-yellow-300 dark:bg-yellow-500';
    case 'tt':
      return 'bg-yellow-300 dark:bg-yellow-500 bg-hatch';
    default:
      return 'bg-emerald-300 dark:bg-emerald-700'; // CP, RTT, week-end
  }
}

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
  onNavigateToWeekView,
}) => {
  // Mois affiché (par défaut : le mois en cours)
  const [currentDate, setCurrentDate] = useState(() => new Date());
  const [filterMode, setFilterMode] = useState<FilterMode>('all');
  const [viewType, setViewType] = useState<'month' | 'week'>('month');
  const [showZoneCHolidays, setShowZoneCHolidays] = useState(true);
  // Légende repliable (téléphone), fermée par défaut, mémorisée sur l'appareil
  const [isLegendOpen, setIsLegendOpen] = useState(() => {
    try {
      return localStorage.getItem('ntahub_legend_open') === '1';
    } catch {
      return false;
    }
  });
  const toggleLegend = () => {
    setIsLegendOpen((open) => {
      try {
        localStorage.setItem('ntahub_legend_open', open ? '0' : '1');
      } catch {
        // stockage indisponible : on garde simplement l'état en mémoire
      }
      return !open;
    });
  };

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

  const swipe = useHorizontalSwipe(prevPeriod, nextPeriod);

  const todayStr = getTodayParisStr();

  // Revient à la période en cours et ouvre le programme du jour
  const goToToday = () => {
    setCurrentDate(new Date());
    onSelectDay(todayStr);
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
      <div className="bg-white dark:bg-slate-900 rounded-xl p-3 sm:p-4 border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col lg:flex-row lg:items-center justify-between gap-3 sm:gap-4 transition-colors">
        {/* Navigation & Month Picker */}
        <div className="flex items-center gap-1.5 sm:gap-3">
          <div className="flex items-center gap-1 shrink-0">
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

          <h1 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white capitalize min-w-0 flex-1 truncate sm:flex-none sm:min-w-[180px]">
            {monthTitle}
          </h1>

          <button
            onClick={goToToday}
            className="px-2 sm:px-2.5 py-1 text-[11px] sm:text-xs shrink-0 font-semibold text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
          >
            Aujourd'hui
          </button>

          {/* View mode toggle (Mois / Semaine) — sur téléphone, via la barre du bas */}
          <div className="hidden sm:flex items-center bg-slate-100 dark:bg-slate-800 p-0.5 rounded-lg text-xs font-medium">
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
              onClick={() => {
                if (onNavigateToWeekView) {
                  onNavigateToWeekView();
                } else {
                  setViewType('week');
                }
              }}
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
        <div className="flex flex-nowrap sm:flex-wrap items-center gap-1.5 p-1 bg-slate-100 dark:bg-slate-800 rounded-lg text-xs font-medium overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          <button
            onClick={() => setFilterMode('all')}
            className={`px-3 py-1.5 rounded-md transition-all whitespace-nowrap shrink-0 ${
              filterMode === 'all'
                ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs font-bold'
                : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <span className="sm:hidden">Tous</span>
            <span className="hidden sm:inline">Tous les plannings</span>
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
            <span>Clément<span className="hidden sm:inline"> (PNC)</span></span>
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
            <span><span className="hidden sm:inline">Moments </span>en commun</span>
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
            <span><span className="hidden sm:inline">Vacances </span>Zone C</span>
          </button>
        </div>
      </div>

      {/* Légende compacte (téléphone), repliable */}
      <div className="sm:hidden px-1 text-[11px] text-slate-600 dark:text-slate-300">
        <button
          type="button"
          onClick={toggleLegend}
          aria-expanded={isLegendOpen}
          className="w-full flex items-center justify-between py-1 font-semibold text-slate-700 dark:text-slate-200"
        >
          <span className="flex items-center gap-2">
            <span className="flex h-3.5 w-6 rounded overflow-hidden border border-slate-200 dark:border-slate-700 shrink-0">
              <span className="flex-1 bg-sky-300 dark:bg-sky-700" />
              <span className="w-px bg-white" />
              <span className="flex-1 bg-yellow-300 dark:bg-yellow-500" />
            </span>
            Légende
          </span>
          <ChevronDown className={`w-4 h-4 transition-transform ${isLegendOpen ? 'rotate-180' : ''}`} />
        </button>
        {isLegendOpen && (
        <div className="space-y-1.5 pt-1 pb-1">
        <div className="flex items-center gap-2">
          <span className="flex h-4 w-7 rounded overflow-hidden border border-slate-200 dark:border-slate-700 shrink-0">
            <span className="flex-1 bg-sky-300 dark:bg-sky-700" />
            <span className="w-px bg-white" />
            <span className="flex-1 bg-yellow-300 dark:bg-yellow-500" />
          </span>
          <span>
            Moitié gauche : <strong>Clément</strong> · moitié droite : <strong>Irène</strong>
          </span>
        </div>
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
          <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-sm bg-sky-300 dark:bg-sky-700" />Vol</span>
          <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-sm bg-sky-400 dark:bg-sky-800 bg-hatch" />Découcher</span>
          <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-sm bg-[#dcb68c] dark:bg-[#7a5a3a]" />Sol</span>
          <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-sm bg-yellow-300 dark:bg-yellow-500" />Travail</span>
          <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-sm bg-yellow-300 dark:bg-yellow-500 bg-hatch" />Télétravail</span>
          <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-sm bg-emerald-300 dark:bg-emerald-700" />Libre</span>
        </div>
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-slate-500 dark:text-slate-400">
          <span>Case toute verte = libres ensemble</span>
          <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-rose-500" />Activité enfant</span>
          <span className="flex items-center gap-1"><span className="min-w-[14px] h-3.5 px-1 rounded-full bg-slate-900 dark:bg-white text-white dark:text-slate-900 text-[9px] font-bold flex items-center justify-center">2</span>Événements</span>
          <span>❓ Relais requis</span>
        </div>
        <div className="text-slate-400">Glissez pour changer de mois · touchez un jour pour le détail.</div>
        </div>
        )}
      </div>

      {/* Quick Legend Bar */}
      <div className="hidden sm:flex flex-wrap items-center justify-between text-[11px] text-slate-500 px-2 py-1 gap-y-2">
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
          <span className="font-semibold text-slate-700 dark:text-slate-300">Famille & Vacances :</span>
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
          <span className="flex items-center gap-1 font-semibold text-amber-900 bg-amber-50 dark:bg-amber-950/40 px-2 py-0.5 rounded border border-amber-200 dark:border-amber-800">
            <span>🎒</span>
            <span>Vacances Zone C</span>
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 pt-1 lg:pt-0">
          <span className="font-semibold text-slate-700 dark:text-slate-300">Assigné à :</span>
          <span className="inline-flex items-center gap-1 font-semibold text-blue-700 dark:text-blue-300">
            <span className="w-3.5 h-3.5 rounded-full bg-blue-600 text-white text-[8px] font-extrabold flex items-center justify-center shadow-2xs">C</span>
            <span>Clément</span>
          </span>
          <span className="inline-flex items-center gap-1 font-semibold text-pink-700 dark:text-pink-300">
            <span className="w-3.5 h-3.5 rounded-full bg-pink-600 text-white text-[8px] font-extrabold flex items-center justify-center shadow-2xs">I</span>
            <span>Irène</span>
          </span>
          <span className="inline-flex items-center gap-1 font-semibold text-purple-700 dark:text-purple-300">
            <span className="flex -space-x-1 shrink-0">
              <span className="w-3 h-3 rounded-full bg-blue-600 text-white text-[7px] font-bold flex items-center justify-center">C</span>
              <span className="w-3 h-3 rounded-full bg-pink-600 text-white text-[7px] font-bold flex items-center justify-center">I</span>
            </span>
            <span>Les deux</span>
          </span>
        </div>
      </div>

      {/* Calendar Grid (balayage gauche / droite pour changer de période) */}
      <div
        {...swipe.handlers}
        style={swipe.style}
        className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden transition-colors touch-pan-y select-none sm:select-auto"
      >
        {/* Days of week header */}
        <div className="grid grid-cols-7 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-center text-[11px] sm:text-xs font-bold text-slate-600 dark:text-slate-400 py-2 sm:py-2.5">
          {DAYS_HEADER.map((d, idx) => (
            <div key={d} className={idx >= 5 ? 'text-indigo-600 dark:text-indigo-400 font-extrabold' : ''}>
              {d}
            </div>
          ))}
        </div>

        {/* Calendar Cells */}
        <div key={`${monthTitle}-${swipe.swipeCount}`} className={`${swipe.enterClass} grid grid-cols-7 divide-x divide-y divide-slate-100 dark:divide-slate-800`}>
          {displayDates.map((dateStr) => {
            const dateObj = new Date(dateStr);
            const isCurrentMonth = dateObj.getMonth() === month;
            const dayNum = dateObj.getDate();
            const pncDuty = pncDuties.get(dateStr);
            const ireneStatus = getIreneStatusOnDate(dateStr, ireneOverrides);
            const dayActivities = getActivitiesForDate(dateStr);
            const dayEvents = events.filter((e) => {
              if (e.date !== dateStr) return false;
              if (filterMode === 'clement') {
                return (
                  e.assignedTo === 'Clément' ||
                  e.assignedTo === 'Les deux' ||
                  (!e.assignedTo && (e.target === 'Clément' || e.target === 'toute la famille'))
                );
              }
              if (filterMode === 'irene') {
                return (
                  e.assignedTo === 'Irène' ||
                  e.assignedTo === 'Les deux' ||
                  (!e.assignedTo && (e.target === 'Irène' || e.target === 'toute la famille'))
                );
              }
              return true;
            });
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
                className={`min-h-[68px] sm:min-h-[125px] p-1 sm:p-2 flex flex-col justify-start sm:justify-between min-w-0 overflow-hidden transition-colors cursor-pointer group relative ${
                  !isCurrentMonth
                    ? 'bg-slate-50/50 dark:bg-slate-950/40 text-slate-400 dark:text-slate-600'
                    : holidayZoneC
                    ? 'bg-amber-50/25 dark:bg-amber-950/20 hover:bg-amber-50/60 dark:hover:bg-amber-950/40'
                    : 'bg-white dark:bg-slate-900 hover:bg-slate-50/80 dark:hover:bg-slate-800/60'
                } ${isCommonFreeFiltered ? 'ring-2 ring-emerald-500 bg-emerald-50/20 dark:bg-emerald-950/30' : ''}`}
              >
                {/* Bandes verticales (téléphone) : Clément à gauche, Irène à droite, tout vert si libres ensemble */}
                {filterMode !== 'children' && (
                  <div
                    className={`sm:hidden absolute inset-0 flex pointer-events-none ${isCurrentMonth ? '' : 'opacity-35'}`}
                    aria-hidden="true"
                  >
                    {isCommonFullFree && filterMode !== 'clement' && filterMode !== 'irene' ? (
                      <div className="flex-1 bg-emerald-300 dark:bg-emerald-700" />
                    ) : filterMode === 'common_free' ? null : (
                      <>
                        {filterMode !== 'irene' && <div className={`flex-1 ${clementBandClass(pncDuty?.type)}`} />}
                        {filterMode === 'all' && <div className="w-px bg-white/80 dark:bg-slate-900/80" />}
                        {filterMode !== 'clement' && <div className={`flex-1 ${ireneBandClass(ireneStatus)}`} />}
                      </>
                    )}
                  </div>
                )}

                {/* Zone C School Holiday Top Ribbon */}
                {holidayZoneC && (
                  <div
                    className={`relative -mx-1 -mt-1 sm:-mx-2 sm:-mt-2 mb-1 h-1 sm:h-auto px-0 sm:px-1.5 py-0 sm:py-0.5 text-[9px] font-bold overflow-hidden flex items-center justify-between border-b ${
                      holidayZoneC.isFirstDay
                        ? 'bg-amber-200 dark:bg-amber-900/60 text-amber-950 dark:text-amber-200 border-amber-300 dark:border-amber-700'
                        : 'bg-amber-100/80 dark:bg-amber-950/60 text-amber-900 dark:text-amber-300 border-amber-200/60 dark:border-amber-900/50'
                    }`}
                    title={`Vacances scolaires Zone C (Paris, Créteil, Versailles) : ${holidayZoneC.period.name}`}
                  >
                    <span className="hidden sm:flex truncate items-center gap-1">
                      <span>🎒</span>
                      <span className="truncate">{holidayZoneC.isFirstDay ? `Début ${holidayZoneC.period.name}` : holidayZoneC.period.name}</span>
                    </span>
                  </div>
                )}

                {/* Day Header: Day number + Badges */}
                <div className="relative flex items-center justify-center sm:justify-between mb-1 sm:mb-1.5">
                  <span
                    className={`text-xs font-bold tabular-nums w-6 h-6 shrink-0 rounded-full flex items-center justify-center ${
                      dateStr === todayStr
                        ? 'bg-indigo-600 text-white font-extrabold ring-2 ring-white dark:ring-slate-900'
                        : isCurrentMonth
                        ? 'text-slate-900 dark:text-white'
                        : 'text-slate-500 dark:text-slate-500'
                    }`}
                  >
                    {dayNum}
                  </span>

                  <div className="hidden sm:flex items-center gap-1">
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

                {/* Symboles et horaires (téléphone) */}
                {(() => {
                  const clementIcon =
                    pncDuty?.type === 'vol' || pncDuty?.type === 'decoucher' ? (
                      <Plane className="w-3 h-3" />
                    ) : pncDuty?.type === 'cours_au_sol' ? (
                      <BookOpen className="w-3 h-3" />
                    ) : null;
                  const ireneWorking = ireneStatus === 'bureau' || ireneStatus === 'tt';
                  const ireneIcon = ireneWorking ? <Laptop className="w-3 h-3" /> : null;
                  const iconTone = isCurrentMonth
                    ? 'text-slate-800 dark:text-white'
                    : 'text-slate-500 dark:text-slate-500';

                  if (filterMode === 'all') {
                    if (isCommonFullFree || (!clementIcon && !ireneIcon)) return null;
                    return (
                      <div className={`sm:hidden relative flex ${iconTone}`} aria-hidden="true">
                        <span className="flex-1 flex justify-center">
                          {clementIcon && <span className="rounded-full p-0.5 bg-white/85 dark:bg-slate-900/75">{clementIcon}</span>}
                        </span>
                        <span className="flex-1 flex justify-center">
                          {ireneIcon && <span className="rounded-full p-0.5 bg-white/85 dark:bg-slate-900/75">{ireneIcon}</span>}
                        </span>
                      </div>
                    );
                  }

                  if (filterMode === 'clement' && clementIcon && pncDuty) {
                    return (
                      <div className={`sm:hidden relative flex flex-col items-center gap-0.5 font-mono tabular-nums text-[9px] leading-tight ${iconTone}`}>
                        {clementIcon}
                        {pncDuty.type === 'cours_au_sol' ? (
                          <span>Déb {pncDuty.briefingTime || '09:00'}</span>
                        ) : (
                          <>
                            <span>Brf {pncDuty.briefingTime || '--:--'}</span>
                            <span>
                              {pncDuty.type === 'decoucher' || pncDuty.isLayover || !pncDuty.freeTimeAtHome
                                ? 'Découch.'
                                : `Msn ${pncDuty.freeTimeAtHome}`}
                            </span>
                          </>
                        )}
                      </div>
                    );
                  }

                  if (filterMode === 'irene' && ireneWorking) {
                    const s = settings ?? DEFAULT_SETTINGS;
                    const start = ireneStatus === 'tt' ? s.ireneTtWorkStart : s.ireneWorkStart;
                    const end = ireneStatus === 'tt' ? s.ireneTtWorkEnd : s.ireneWorkEnd;
                    return (
                      <div className={`sm:hidden relative flex flex-col items-center gap-0.5 font-mono tabular-nums text-[9px] leading-tight ${iconTone}`}>
                        {ireneIcon}
                        <span>{start}</span>
                        <span>{end}</span>
                      </div>
                    );
                  }

                  return null;
                })()}

                {/* Résumé compact (téléphone) : activités enfants et événements */}
                <div className="sm:hidden relative flex flex-wrap items-center justify-center gap-0.5 mt-auto mb-0.5">
                  {(filterMode === 'all' || filterMode === 'children') &&
                    dayActivities.map((act) => (
                      <span
                        key={act.id}
                        className="w-2.5 h-2.5 rounded-full ring-[1.5px] ring-white dark:ring-slate-900"
                        style={{ backgroundColor: act.color }}
                      />
                    ))}
                  {dayEvents.length > 0 && (
                    <span className="min-w-[16px] h-4 px-1 rounded-full bg-slate-900 dark:bg-white text-white dark:text-slate-900 text-[10px] font-bold leading-none flex items-center justify-center ring-[1.5px] ring-white dark:ring-slate-900">
                      {dayEvents.length}
                    </span>
                  )}
                  {hasConflict && (
                    <span className="w-4 h-4 rounded-full bg-white dark:bg-slate-900 text-[10px] leading-none flex items-center justify-center">
                      ❓
                    </span>
                  )}
                </div>

                {/* Main Content Area */}
                <div className="hidden sm:block space-y-1.5 flex-1">
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
                      {dayEvents.map((e) => {
                        const isClementAssigned = e.assignedTo === 'Clément';
                        const isIreneAssigned = e.assignedTo === 'Irène';
                        const isBothAssigned = e.assignedTo === 'Les deux';

                        return (
                          <span
                            key={e.id}
                            className={`px-1.5 py-0.5 rounded text-[10px] font-medium truncate max-w-full flex items-center gap-1 border transition-colors ${
                              isClementAssigned
                                ? 'bg-blue-50 dark:bg-blue-950/70 border-blue-300 dark:border-blue-800 text-blue-900 dark:text-blue-200'
                                : isIreneAssigned
                                ? 'bg-pink-50 dark:bg-pink-950/70 border-pink-300 dark:border-pink-800 text-pink-900 dark:text-pink-200'
                                : isBothAssigned
                                ? 'bg-purple-50 dark:bg-purple-950/70 border-purple-300 dark:border-purple-800 text-purple-900 dark:text-purple-200'
                                : 'bg-indigo-50 dark:bg-indigo-950/70 border-indigo-200 dark:border-indigo-800 text-indigo-800 dark:text-indigo-300'
                            }`}
                            title={`${e.category} - ${e.target}${e.assignedTo ? ` (Assigné à : ${e.assignedTo})` : ''} (${e.startTime}-${e.endTime})${e.reminderMinutes ? ` · Rappel ${e.reminderMinutes} min avant` : ''}`}
                          >
                            {/* Indicateur visuel d'assignation */}
                            {isClementAssigned && (
                              <span
                                className="w-3.5 h-3.5 rounded-full bg-blue-600 text-white text-[8px] font-extrabold flex items-center justify-center shrink-0 shadow-2xs"
                                title="Tâche assignée à Clément"
                              >
                                C
                              </span>
                            )}
                            {isIreneAssigned && (
                              <span
                                className="w-3.5 h-3.5 rounded-full bg-pink-600 text-white text-[8px] font-extrabold flex items-center justify-center shrink-0 shadow-2xs"
                                title="Tâche assignée à Irène"
                              >
                                I
                              </span>
                            )}
                            {isBothAssigned && (
                              <span className="flex -space-x-1 shrink-0" title="Tâche commune (Clément & Irène)">
                                <span className="w-3 h-3 rounded-full bg-blue-600 text-white text-[7px] font-bold flex items-center justify-center">
                                  C
                                </span>
                                <span className="w-3 h-3 rounded-full bg-pink-600 text-white text-[7px] font-bold flex items-center justify-center">
                                  I
                                </span>
                              </span>
                            )}

                            <span className="truncate">📌 {e.customTitle || e.category}</span>

                            {e.reminderMinutes !== undefined && e.reminderMinutes > 0 && (
                              <span
                                className="text-[9px] text-amber-600 dark:text-amber-400 font-bold shrink-0"
                                title={`Rappel actif ${e.reminderMinutes} min avant`}
                              >
                                ⏰
                              </span>
                            )}
                          </span>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* Hover affordance */}
                <div className="hidden sm:block opacity-0 group-hover:opacity-100 text-[10px] text-indigo-600 font-semibold pt-1 text-right transition-opacity">
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
