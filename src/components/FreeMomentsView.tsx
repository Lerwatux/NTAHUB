import React, { useState } from 'react';
import {
  Sparkles,
  User,
  Heart,
  Calendar as CalendarIcon,
  Clock,
  Plus,
  CheckCircle,
  Filter,
  X,
} from 'lucide-react';
import {
  PncDayDuty,
  IreneDayOverride,
  FamilyEvent,
  FreeTimeBlock,
  AppSettings,
} from '../types';
import { computeFreeMoments } from '../utils/availability';
import { formatFrenchDateLong } from '../utils/timezone';
import { WeeklyFreeTimeChart } from './WeeklyFreeTimeChart';

interface FreeMomentsViewProps {
  pncDuties: Map<string, PncDayDuty>;
  ireneOverrides: Map<string, IreneDayOverride>;
  events: FamilyEvent[];
  settings?: AppSettings;
  onOpenAddEventForDate: (date: string) => void;
}

export const FreeMomentsView: React.FC<FreeMomentsViewProps> = ({
  pncDuties,
  ireneOverrides,
  events,
  settings,
  onOpenAddEventForDate,
}) => {
  const [activeTab, setActiveTab] = useState<'common' | 'clement' | 'irene'>('common');
  const [selectedWeekKey, setSelectedWeekKey] = useState<string | null>(null);

  // Generate 28 days (4 full weeks) from 2026-10-12
  const dates: string[] = [];
  const baseDate = new Date(2026, 9, 12);
  for (let i = 0; i < 28; i++) {
    const d = new Date(baseDate);
    d.setDate(baseDate.getDate() + i);
    const yr = d.getFullYear();
    const mo = String(d.getMonth() + 1).padStart(2, '0');
    const da = String(d.getDate()).padStart(2, '0');
    dates.push(`${yr}-${mo}-${da}`);
  }

  const { clementFree, ireneFree, commonFree } = computeFreeMoments(
    dates,
    pncDuties,
    ireneOverrides,
    events,
    settings
  );

  const rawDisplayedBlocks: FreeTimeBlock[] =
    activeTab === 'common'
      ? commonFree
      : activeTab === 'clement'
      ? clementFree
      : ireneFree;

  // Filter by selected week if active
  const displayedBlocks: FreeTimeBlock[] = selectedWeekKey
    ? rawDisplayedBlocks.filter((block) => {
        const weekIdx = parseInt(selectedWeekKey.replace('S', ''), 10) - 42;
        if (weekIdx >= 0 && weekIdx < 4) {
          const startIdx = weekIdx * 7;
          const endIdx = startIdx + 7;
          const weekDates = dates.slice(startIdx, endIdx);
          return weekDates.includes(block.date);
        }
        return true;
      })
    : rawDisplayedBlocks;

  // Group by date
  const groupedByDate = new Map<string, FreeTimeBlock[]>();
  for (const block of displayedBlocks) {
    if (!groupedByDate.has(block.date)) {
      groupedByDate.set(block.date, []);
    }
    groupedByDate.get(block.date)!.push(block);
  }

  return (
    <div className="space-y-6">
      {/* Header with high level insight */}
      <div className="bg-white dark:bg-slate-900 rounded-xl p-4 sm:p-6 border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xl">✨</span>
            <h1 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
              Analyse des Moments Libres & Disponibilités
            </h1>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 max-w-2xl leading-relaxed">
            NTAHUB croise les heures de briefing et retours de vol de Clément, les journées de bureau/télétravail d'Irène, ainsi que les activités des enfants pour identifier les créneaux libres individuels et en couple.
          </p>
        </div>

        {/* Tab buttons */}
        <div className="grid grid-cols-3 sm:flex items-center gap-1 sm:gap-1.5 p-1 bg-slate-100 dark:bg-slate-800 rounded-lg text-xs font-semibold shrink-0">
          <button
            onClick={() => setActiveTab('common')}
            className={`flex items-center justify-center gap-1.5 px-2 sm:px-3.5 py-2 rounded-md transition-all whitespace-nowrap ${
              activeTab === 'common'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Heart className="hidden sm:block w-3.5 h-3.5" />
            <span><span className="sm:hidden">Ensemble</span><span className="hidden sm:inline">Moments en commun</span> ({commonFree.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('clement')}
            className={`flex items-center justify-center gap-1.5 px-2 sm:px-3.5 py-2 rounded-md transition-all whitespace-nowrap ${
              activeTab === 'clement'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <User className="w-3.5 h-3.5" />
            <span>Clément<span className="hidden sm:inline"> libre</span></span>
          </button>

          <button
            onClick={() => setActiveTab('irene')}
            className={`flex items-center justify-center gap-1.5 px-2 sm:px-3.5 py-2 rounded-md transition-all whitespace-nowrap ${
              activeTab === 'irene'
                ? 'bg-pink-600 text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <User className="w-3.5 h-3.5" />
            <span>Irène<span className="hidden sm:inline"> libre</span></span>
          </button>
        </div>
      </div>

      {/* Recharts Visualization: Weekly Free Time & Rest Periods Identification */}
      <WeeklyFreeTimeChart
        pncDuties={pncDuties}
        ireneOverrides={ireneOverrides}
        events={events}
        settings={settings}
        selectedWeekKey={selectedWeekKey}
        onSelectWeek={(wk) => setSelectedWeekKey(wk)}
      />

      {/* Highlights summary */}
      {activeTab === 'common' && !selectedWeekKey && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-emerald-50/70 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 rounded-xl p-4 text-emerald-900 dark:text-emerald-200">
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-400 block mb-1">
              Soirées à deux
            </span>
            <div className="text-2xl font-bold font-mono">
              {commonFree.filter((b) => b.start >= '19:00').length}
            </div>
            <p className="text-xs text-emerald-700/90 dark:text-emerald-300/80 mt-1">
              Soirées où Clément est rentré d'Orly et Irène a fini sa journée de travail.
            </p>
          </div>

          <div className="bg-indigo-50/70 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800 rounded-xl p-4 text-indigo-900 dark:text-indigo-200">
            <span className="text-xs font-bold uppercase tracking-wider text-indigo-700 dark:text-indigo-400 block mb-1">
              Journées entières communes
            </span>
            <div className="text-2xl font-bold font-mono">
              {
                Array.from(groupedByDate.entries()).filter(
                  ([, blocks]) => blocks.some((b) => b.description.includes('Journée entière'))
                ).length
              }
            </div>
            <p className="text-xs text-indigo-700/90 dark:text-indigo-300/80 mt-1">
              Week-ends sans vol ou RTT/CP d'Irène coïncidant avec un jour OFF de Clément.
            </p>
          </div>

          <div className="bg-amber-50/70 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 rounded-xl p-4 text-amber-900 dark:text-amber-200">
            <span className="text-xs font-bold uppercase tracking-wider text-amber-700 dark:text-amber-400 block mb-1">
              Idée Organisation
            </span>
            <p className="text-xs text-amber-800 dark:text-amber-300 leading-relaxed mt-1">
              Profitez des jours où Irène est en <strong>Télétravail</strong> et Clément en <strong>Jour OFF</strong> pour déjeuner ensemble à la maison !
            </p>
          </div>
        </div>
      )}

      {/* Active Week Filter Indicator */}
      {selectedWeekKey && (
        <div className="flex items-center justify-between p-3 px-4 bg-indigo-50 dark:bg-indigo-950/50 border border-indigo-200 dark:border-indigo-800 rounded-xl text-xs">
          <div className="flex items-center gap-2 text-indigo-900 dark:text-indigo-200">
            <Filter className="w-4 h-4 text-indigo-600 dark:text-indigo-400 shrink-0" />
            <span>
              Filtrage actif sur <strong>{selectedWeekKey.replace('S', 'Semaine ')}</strong> ({groupedByDate.size} jours avec créneaux libres)
            </span>
          </div>
          <button
            onClick={() => setSelectedWeekKey(null)}
            className="flex items-center gap-1 font-semibold text-indigo-700 dark:text-indigo-300 hover:text-indigo-900 dark:hover:text-white px-2 py-1 rounded bg-white dark:bg-indigo-900/60 border border-indigo-200 dark:border-indigo-700"
          >
            <X className="w-3.5 h-3.5" />
            <span>Réinitialiser le filtre</span>
          </button>
        </div>
      )}

      {/* Detailed list grouped by date */}
      <div className="space-y-4">
        {groupedByDate.size === 0 ? (
          <div className="bg-white dark:bg-slate-900 rounded-xl p-12 text-center border border-slate-200 dark:border-slate-800">
            <p className="text-slate-500 dark:text-slate-400 text-sm">
              Aucun créneau libre trouvé sur cette période avec les filtres actuels.
            </p>
            {selectedWeekKey && (
              <button
                onClick={() => setSelectedWeekKey(null)}
                className="mt-3 inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-indigo-600 bg-indigo-50 dark:bg-indigo-950/50 rounded-lg hover:bg-indigo-100"
              >
                <span>Afficher toutes les semaines</span>
              </button>
            )}
          </div>
        ) : (
          Array.from(groupedByDate.entries()).map(([dateStr, blocks]) => {
            const dateTitle = formatFrenchDateLong(dateStr);
            const pncDuty = pncDuties.get(dateStr);

            return (
              <div
                key={dateStr}
                className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs p-5 hover:border-slate-300 dark:hover:border-slate-700 transition-all"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 dark:border-slate-800 pb-3 mb-3">
                  <div>
                    <h3 className="text-sm font-bold text-slate-900 dark:text-white capitalize">
                      {dateTitle}
                    </h3>
                    {pncDuty && (
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        Clément : {pncDuty.title}
                        {pncDuty.briefingTime ? ` (Brf: ${pncDuty.briefingTime})` : ''}
                      </p>
                    )}
                  </div>

                  <button
                    onClick={() => onOpenAddEventForDate(dateStr)}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/50 hover:bg-indigo-100 rounded-lg transition-colors self-start sm:self-auto border border-indigo-200 dark:border-indigo-800"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Planifier un moment</span>
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                  {blocks.map((block, idx) => (
                    <div
                      key={idx}
                      className={`p-3 rounded-lg border flex items-center justify-between ${
                        activeTab === 'common'
                          ? 'bg-emerald-50/60 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-800 text-emerald-900 dark:text-emerald-200'
                          : activeTab === 'clement'
                          ? 'bg-blue-50/60 dark:bg-blue-950/30 border-blue-200 dark:border-blue-800 text-blue-900 dark:text-blue-200'
                          : 'bg-pink-50/60 dark:bg-pink-950/30 border-pink-200 dark:border-pink-800 text-pink-900 dark:text-pink-200'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
                        <div>
                          <span className="font-bold text-xs block">
                            {block.description}
                          </span>
                          <span className="text-[11px] font-mono tabular-nums opacity-80">
                            {block.start} - {block.end}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
