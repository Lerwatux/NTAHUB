import React, { useState, useMemo } from 'react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ReferenceLine,
} from 'recharts';
import {
  Sparkles,
  Award,
  Clock,
  Heart,
  User,
  Coffee,
  CheckCircle2,
  Calendar,
  Percent,
  BarChart3,
  TrendingUp,
} from 'lucide-react';
import {
  PncDayDuty,
  IreneDayOverride,
  FamilyEvent,
  AppSettings,
} from '../types';
import {
  getClementBusyIntervals,
  getIreneBusyIntervals,
  computeFreeSlotsForDay,
  intersectIntervals,
} from '../utils/availability';

export interface WeekFreeStats {
  weekKey: string; // e.g. "S42"
  weekNumber: number;
  label: string; // e.g. "Semaine 42"
  dateRangeLabel: string; // e.g. "12 - 18 oct. 2026"
  startDate: string;
  endDate: string;
  dates: string[];
  clementFreeMinutes: number;
  clementHours: number;
  clementPercent: number;
  ireneFreeMinutes: number;
  ireneHours: number;
  irenePercent: number;
  commonFreeMinutes: number;
  commonHours: number;
  commonPercent: number;
  combinedPercent: number; // average of clement & irene
  syncRatio: number; // percentage of overlap
  isBestCommonRest: boolean;
  isBestClementRest: boolean;
  isBestIreneRest: boolean;
  restDiagnosis: string;
  dutyHighlights: string;
}

interface WeeklyFreeTimeChartProps {
  pncDuties: Map<string, PncDayDuty>;
  ireneOverrides: Map<string, IreneDayOverride>;
  events: FamilyEvent[];
  settings?: AppSettings;
  selectedWeekKey: string | null;
  onSelectWeek: (weekKey: string | null) => void;
}

// 7 days * 14.5 waking hours (08:00 to 22:30 = 870 min/day) = 6090 minutes / week (~101.5h)
const TOTAL_WAKING_MINUTES_PER_DAY = (22.5 - 8) * 60; // 870 minutes
const TOTAL_WAKING_MINUTES_PER_WEEK = 7 * TOTAL_WAKING_MINUTES_PER_DAY; // 6090 minutes (~101.5h)

export const WeeklyFreeTimeChart: React.FC<WeeklyFreeTimeChartProps> = ({
  pncDuties,
  ireneOverrides,
  events,
  settings,
  selectedWeekKey,
  onSelectWeek,
}) => {
  const [chartType, setChartType] = useState<'bar' | 'area'>('bar');
  const [metricMode, setMetricMode] = useState<'percent' | 'hours'>('percent');

  // Compute stats for 4 weeks starting from Monday 2026-10-12
  const weeklyStats: WeekFreeStats[] = useMemo(() => {
    const weeks: WeekFreeStats[] = [];
    const baseDate = new Date(2026, 9, 12); // Oct 12, 2026 is Monday

    for (let w = 0; w < 4; w++) {
      const weekDates: string[] = [];
      const startDate = new Date(baseDate);
      startDate.setDate(baseDate.getDate() + w * 7);

      for (let d = 0; d < 7; d++) {
        const cur = new Date(startDate);
        cur.setDate(startDate.getDate() + d);
        const yr = cur.getFullYear();
        const mo = String(cur.getMonth() + 1).padStart(2, '0');
        const da = String(cur.getDate()).padStart(2, '0');
        weekDates.push(`${yr}-${mo}-${da}`);
      }

      let clementMin = 0;
      let ireneMin = 0;
      let commonMin = 0;
      const dutyList: string[] = [];

      for (const dateStr of weekDates) {
        const cBusy = getClementBusyIntervals(dateStr, pncDuties, events);
        const iBusy = getIreneBusyIntervals(dateStr, ireneOverrides, events, settings);

        const cSlots = computeFreeSlotsForDay(cBusy);
        const iSlots = computeFreeSlotsForDay(iBusy);
        const comSlots = intersectIntervals(cSlots, iSlots);

        const dayCMin = cSlots.reduce((acc, s) => acc + (s.end - s.start), 0);
        const dayIMin = iSlots.reduce((acc, s) => acc + (s.end - s.start), 0);
        const dayComMin = comSlots.reduce((acc, s) => acc + (s.end - s.start), 0);

        clementMin += dayCMin;
        ireneMin += dayIMin;
        commonMin += dayComMin;

        const duty = pncDuties.get(dateStr);
        if (duty && duty.type === 'vol' && !dutyList.includes('Vol')) {
          dutyList.push('Vols ' + (duty.legs[0]?.flightNumber || ''));
        } else if (duty && duty.type === 'decoucher' && !dutyList.includes('Découcher')) {
          dutyList.push('Découcher Caraïbes');
        } else if (duty && duty.type === 'cours_au_sol' && !dutyList.includes('Cours au sol')) {
          dutyList.push('Cours sol');
        }
      }

      const clementPercent = Math.min(
        100,
        Math.round((clementMin / TOTAL_WAKING_MINUTES_PER_WEEK) * 100)
      );
      const irenePercent = Math.min(
        100,
        Math.round((ireneMin / TOTAL_WAKING_MINUTES_PER_WEEK) * 100)
      );
      const commonPercent = Math.min(
        100,
        Math.round((commonMin / TOTAL_WAKING_MINUTES_PER_WEEK) * 100)
      );
      const combinedPercent = Math.round((clementPercent + irenePercent) / 2);

      const minIndividual = Math.min(clementMin, ireneMin);
      const syncRatio =
        minIndividual > 0 ? Math.round((commonMin / minIndividual) * 100) : 0;

      const weekNum = 42 + w;
      const startDay = startDate.getDate();
      const endDate = new Date(startDate);
      endDate.setDate(startDate.getDate() + 6);
      const endDay = endDate.getDate();
      const monthNames = [
        'janv.',
        'févr.',
        'mars',
        'avr.',
        'mai',
        'juin',
        'juil.',
        'août',
        'sept.',
        'oct.',
        'nov.',
        'déc.',
      ];
      const startMo = monthNames[startDate.getMonth()];
      const endMo = monthNames[endDate.getMonth()];
      const dateRangeLabel =
        startMo === endMo
          ? `${startDay} - ${endDay} ${startMo}`
          : `${startDay} ${startMo} - ${endDay} ${endMo}`;

      weeks.push({
        weekKey: `S${weekNum}`,
        weekNumber: weekNum,
        label: `Semaine ${weekNum}`,
        dateRangeLabel,
        startDate: weekDates[0],
        endDate: weekDates[6],
        dates: weekDates,
        clementFreeMinutes: clementMin,
        clementHours: Math.round((clementMin / 60) * 10) / 10,
        clementPercent,
        ireneFreeMinutes: ireneMin,
        ireneHours: Math.round((ireneMin / 60) * 10) / 10,
        irenePercent,
        commonFreeMinutes: commonMin,
        commonHours: Math.round((commonMin / 60) * 10) / 10,
        commonPercent,
        combinedPercent,
        syncRatio: Math.min(100, syncRatio),
        isBestCommonRest: false,
        isBestClementRest: false,
        isBestIreneRest: false,
        restDiagnosis: '',
        dutyHighlights: dutyList.join(', ') || 'Semaine standard',
      });
    }

    // Determine best rest weeks
    let maxCommon = -1;
    let bestCommonIdx = 0;
    let maxClement = -1;
    let bestClementIdx = 0;
    let maxIrene = -1;
    let bestIreneIdx = 0;

    weeks.forEach((wk, idx) => {
      if (wk.commonPercent > maxCommon) {
        maxCommon = wk.commonPercent;
        bestCommonIdx = idx;
      }
      if (wk.clementPercent > maxClement) {
        maxClement = wk.clementPercent;
        bestClementIdx = idx;
      }
      if (wk.irenePercent > maxIrene) {
        maxIrene = wk.irenePercent;
        bestIreneIdx = idx;
      }
    });

    weeks[bestCommonIdx].isBestCommonRest = true;
    weeks[bestClementIdx].isBestClementRest = true;
    weeks[bestIreneIdx].isBestIreneRest = true;

    // Add rest diagnosis
    weeks.forEach((wk, idx) => {
      if (idx === bestCommonIdx) {
        wk.restDiagnosis =
          '🏆 Semaine d’or : Idéale pour des activités en couple, sorties ou un week-end ressourçant.';
      } else if (wk.clementPercent >= 65 && wk.irenePercent < 55) {
        wk.restDiagnosis =
          '✈️ Récupération Clément : Jours OFF post-rotation parfaits pour le repos à domicile et la logistique enfants.';
      } else if (wk.commonPercent >= 40) {
        wk.restDiagnosis =
          '🌿 Bon équilibre : Belles plages de soirées libres et synchronisation de fin de semaine.';
      } else {
        wk.restDiagnosis =
          '⚡ Semaine chargée : Rotation dense et déplacements, cibler les micro-créneaux de décompression.';
      }
    });

    return weeks;
  }, [pncDuties, ireneOverrides, events, settings]);

  const bestWeek = weeklyStats.find((w) => w.isBestCommonRest) || weeklyStats[0];

  // Chart data formatting
  const chartData = useMemo(() => {
    return weeklyStats.map((w) => ({
      name: w.label,
      weekKey: w.weekKey,
      range: w.dateRangeLabel,
      clement: metricMode === 'percent' ? w.clementPercent : w.clementHours,
      irene: metricMode === 'percent' ? w.irenePercent : w.ireneHours,
      common: metricMode === 'percent' ? w.commonPercent : w.commonHours,
      clementHours: w.clementHours,
      ireneHours: w.ireneHours,
      commonHours: w.commonHours,
      clementPercent: w.clementPercent,
      irenePercent: w.irenePercent,
      commonPercent: w.commonPercent,
      isBest: w.isBestCommonRest,
      diagnosis: w.restDiagnosis,
    }));
  }, [weeklyStats, metricMode]);

  // Average free percentage
  const avgCommonPercent = Math.round(
    weeklyStats.reduce((acc, w) => acc + w.commonPercent, 0) / weeklyStats.length
  );
  const avgClementPercent = Math.round(
    weeklyStats.reduce((acc, w) => acc + w.clementPercent, 0) / weeklyStats.length
  );
  const avgIrenePercent = Math.round(
    weeklyStats.reduce((acc, w) => acc + w.irenePercent, 0) / weeklyStats.length
  );

  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm p-5 md:p-6 space-y-6">
      {/* Top Banner & Context */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-100 dark:border-slate-800 pb-5">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="p-2 bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 rounded-lg">
              <TrendingUp className="w-5 h-5" />
            </span>
            <div>
              <h2 className="text-base md:text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                Temps Libre Cumulé par Semaine
                <span className="text-xs font-semibold px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800">
                  Recharts Visualisation
                </span>
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Comparatif hebdomadaire pour Clément et Irène afin d'identifier les meilleures périodes de repos et moments partagés.
              </p>
            </div>
          </div>
        </div>

        {/* Controls: Chart Type & Metric Toggle */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Mode % vs Hours */}
          <div className="flex items-center p-1 bg-slate-100 dark:bg-slate-800 rounded-lg text-xs font-medium">
            <button
              onClick={() => setMetricMode('percent')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md transition-all ${
                metricMode === 'percent'
                  ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs font-semibold'
                  : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Percent className="w-3.5 h-3.5" />
              <span>Pourcentage (%)</span>
            </button>
            <button
              onClick={() => setMetricMode('hours')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md transition-all ${
                metricMode === 'hours'
                  ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs font-semibold'
                  : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Clock className="w-3.5 h-3.5" />
              <span>Heures réelles (h)</span>
            </button>
          </div>

          {/* Chart Type Toggle */}
          <div className="flex items-center p-1 bg-slate-100 dark:bg-slate-800 rounded-lg text-xs font-medium">
            <button
              onClick={() => setChartType('bar')}
              title="Vue en barres groupées"
              className={`p-1.5 rounded-md transition-all ${
                chartType === 'bar'
                  ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <BarChart3 className="w-4 h-4" />
            </button>
            <button
              onClick={() => setChartType('area')}
              title="Vue en aires superposées"
              className={`p-1.5 rounded-md transition-all ${
                chartType === 'area'
                  ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <TrendingUp className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Insight Highlight: Best Rest Period Spotlight */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Spotlight Card */}
        <div className="md:col-span-2 bg-gradient-to-r from-emerald-500/10 via-teal-500/10 to-indigo-500/10 dark:from-emerald-950/40 dark:via-teal-950/30 dark:to-indigo-950/40 border border-emerald-200 dark:border-emerald-800/80 rounded-xl p-4 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-1.5 text-emerald-800 dark:text-emerald-300 font-bold text-xs uppercase tracking-wider">
                <Award className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                <span>Période clé de repos identifiée</span>
              </div>
              <span className="text-xs font-mono font-semibold text-emerald-700 dark:text-emerald-300 bg-emerald-100 dark:bg-emerald-900/60 px-2 py-0.5 rounded">
                {bestWeek.label} ({bestWeek.dateRangeLabel})
              </span>
            </div>
            <p className="text-sm font-semibold text-slate-900 dark:text-white mb-1">
              {bestWeek.commonPercent}% de temps libre en couple ({bestWeek.commonHours}h disponibles)
            </p>
            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
              {bestWeek.restDiagnosis}
            </p>
          </div>

          <div className="mt-3 pt-3 border-t border-emerald-200/60 dark:border-emerald-800/60 flex flex-wrap items-center justify-between gap-2 text-xs">
            <span className="text-slate-600 dark:text-slate-400">
              Clément : <strong className="text-slate-900 dark:text-white">{bestWeek.clementPercent}%</strong> ({bestWeek.clementHours}h) · Irène : <strong className="text-slate-900 dark:text-white">{bestWeek.irenePercent}%</strong> ({bestWeek.ireneHours}h)
            </span>
            <button
              onClick={() => onSelectWeek(selectedWeekKey === bestWeek.weekKey ? null : bestWeek.weekKey)}
              className="text-emerald-700 dark:text-emerald-400 hover:underline font-semibold flex items-center gap-1"
            >
              <span>{selectedWeekKey === bestWeek.weekKey ? 'Voir toutes les semaines' : 'Filtrer sur cette semaine'}</span>
              <Calendar className="w-3 h-3" />
            </button>
          </div>
        </div>

        {/* Global Average Rest Card */}
        <div className="bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800 rounded-xl p-4 flex flex-col justify-between">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 block mb-2">
              Moyennes sur 4 Semaines
            </span>
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="flex items-center gap-1.5 text-blue-600 dark:text-blue-400 font-medium">
                  <User className="w-3.5 h-3.5" />
                  <span>Clément</span>
                </span>
                <span className="font-mono font-bold text-slate-900 dark:text-white">{avgClementPercent}%</span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="flex items-center gap-1.5 text-pink-600 dark:text-pink-400 font-medium">
                  <User className="w-3.5 h-3.5" />
                  <span>Irène</span>
                </span>
                <span className="font-mono font-bold text-slate-900 dark:text-white">{avgIrenePercent}%</span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 font-medium">
                  <Heart className="w-3.5 h-3.5" />
                  <span>En commun</span>
                </span>
                <span className="font-mono font-bold text-emerald-700 dark:text-emerald-300">{avgCommonPercent}%</span>
              </div>
            </div>
          </div>

          <div className="mt-3 pt-3 border-t border-slate-200 dark:border-slate-700 text-[11px] text-slate-500 dark:text-slate-400 flex items-center justify-between">
            <span>Base veille : 08h00 - 22h30 (101.5h/sem.)</span>
          </div>
        </div>
      </div>

      {/* Main Recharts Container */}
      <div className="w-full bg-slate-50/50 dark:bg-slate-950/40 rounded-xl border border-slate-200 dark:border-slate-800 p-3 sm:p-4">
        <div className="h-72 sm:h-80 w-full min-w-0">
          <ResponsiveContainer width="100%" height="100%">
            {chartType === 'bar' ? (
              <BarChart
                data={chartData}
                margin={{ top: 15, right: 15, left: -10, bottom: 5 }}
                onClick={(e: any) => {
                  if (e && e.activePayload && e.activePayload.length > 0) {
                    const wk = e.activePayload[0].payload.weekKey;
                    onSelectWeek(selectedWeekKey === wk ? null : wk);
                  }
                }}
              >
                <CartesianGrid strokeDasharray="3 3" opacity={0.25} vertical={false} />
                <XAxis
                  dataKey="name"
                  tick={{ fontSize: 12, fill: '#64748B' }}
                  tickLine={false}
                  axisLine={{ stroke: '#94A3B8', opacity: 0.3 }}
                />
                <YAxis
                  tick={{ fontSize: 11, fill: '#64748B' }}
                  tickLine={false}
                  axisLine={{ stroke: '#94A3B8', opacity: 0.3 }}
                  domain={[0, metricMode === 'percent' ? 100 : 'auto']}
                  unit={metricMode === 'percent' ? '%' : 'h'}
                />
                <Tooltip content={<CustomTooltip metricMode={metricMode} />} />
                <Legend
                  wrapperStyle={{ paddingTop: 10, fontSize: 12 }}
                  formatter={(value) => {
                    if (value === 'clement') return 'Clément libre';
                    if (value === 'irene') return 'Irène libre';
                    if (value === 'common') return 'Moments en commun';
                    return value;
                  }}
                />
                {metricMode === 'percent' && (
                  <ReferenceLine
                    y={50}
                    stroke="#94A3B8"
                    strokeDasharray="4 4"
                    label={{
                      value: 'Seuil 50%',
                      fill: '#94A3B8',
                      fontSize: 10,
                      position: 'insideTopRight',
                    }}
                  />
                )}
                <Bar
                  dataKey="clement"
                  name="clement"
                  fill="#3B82F6"
                  radius={[4, 4, 0, 0]}
                  maxBarSize={38}
                />
                <Bar
                  dataKey="irene"
                  name="irene"
                  fill="#EC4899"
                  radius={[4, 4, 0, 0]}
                  maxBarSize={38}
                />
                <Bar
                  dataKey="common"
                  name="common"
                  fill="#10B981"
                  radius={[4, 4, 0, 0]}
                  maxBarSize={38}
                />
              </BarChart>
            ) : (
              <AreaChart
                data={chartData}
                margin={{ top: 15, right: 15, left: -10, bottom: 5 }}
                onClick={(e: any) => {
                  if (e && e.activePayload && e.activePayload.length > 0) {
                    const wk = e.activePayload[0].payload.weekKey;
                    onSelectWeek(selectedWeekKey === wk ? null : wk);
                  }
                }}
              >
                <defs>
                  <linearGradient id="colorClement" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#3B82F6" stopOpacity={0.0} />
                  </linearGradient>
                  <linearGradient id="colorIrene" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#EC4899" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#EC4899" stopOpacity={0.0} />
                  </linearGradient>
                  <linearGradient id="colorCommon" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10B981" stopOpacity={0.5} />
                    <stop offset="95%" stopColor="#10B981" stopOpacity={0.05} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" opacity={0.25} vertical={false} />
                <XAxis
                  dataKey="name"
                  tick={{ fontSize: 12, fill: '#64748B' }}
                  tickLine={false}
                  axisLine={{ stroke: '#94A3B8', opacity: 0.3 }}
                />
                <YAxis
                  tick={{ fontSize: 11, fill: '#64748B' }}
                  tickLine={false}
                  axisLine={{ stroke: '#94A3B8', opacity: 0.3 }}
                  domain={[0, metricMode === 'percent' ? 100 : 'auto']}
                  unit={metricMode === 'percent' ? '%' : 'h'}
                />
                <Tooltip content={<CustomTooltip metricMode={metricMode} />} />
                <Legend
                  wrapperStyle={{ paddingTop: 10, fontSize: 12 }}
                  formatter={(value) => {
                    if (value === 'clement') return 'Clément libre';
                    if (value === 'irene') return 'Irène libre';
                    if (value === 'common') return 'Moments en commun';
                    return value;
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="clement"
                  name="clement"
                  stroke="#3B82F6"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#colorClement)"
                />
                <Area
                  type="monotone"
                  dataKey="irene"
                  name="irene"
                  stroke="#EC4899"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#colorIrene)"
                />
                <Area
                  type="monotone"
                  dataKey="common"
                  name="common"
                  stroke="#10B981"
                  strokeWidth={3}
                  fillOpacity={1}
                  fill="url(#colorCommon)"
                />
              </AreaChart>
            )}
          </ResponsiveContainer>
        </div>
      </div>

      {/* Week Selector Pills / Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {weeklyStats.map((week) => {
          const isSelected = selectedWeekKey === week.weekKey;
          return (
            <button
              key={week.weekKey}
              onClick={() => onSelectWeek(isSelected ? null : week.weekKey)}
              className={`p-3.5 rounded-xl border text-left transition-all relative ${
                isSelected
                  ? 'bg-indigo-50/80 dark:bg-indigo-950/60 border-indigo-400 dark:border-indigo-600 ring-2 ring-indigo-500/20 shadow-sm'
                  : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
              }`}
            >
              {week.isBestCommonRest && (
                <span className="absolute -top-2.5 right-2 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-400 text-amber-950 shadow-xs flex items-center gap-1">
                  <Award className="w-2.5 h-2.5" />
                  Top repos
                </span>
              )}

              <div className="flex items-center justify-between mb-1">
                <span className="font-bold text-xs text-slate-900 dark:text-white">
                  {week.label}
                </span>
                <span className="text-[11px] font-mono text-slate-500 dark:text-slate-400">
                  {week.dateRangeLabel}
                </span>
              </div>

              {/* Progress bars preview */}
              <div className="space-y-1.5 mt-2.5">
                <div>
                  <div className="flex justify-between text-[11px] mb-0.5">
                    <span className="text-slate-500 dark:text-slate-400 flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                      Clément
                    </span>
                    <span className="font-mono font-medium text-slate-700 dark:text-slate-300">
                      {week.clementPercent}% ({week.clementHours}h)
                    </span>
                  </div>
                  <div className="w-full bg-slate-100 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden">
                    <div
                      className="bg-blue-500 h-full rounded-full transition-all duration-500"
                      style={{ width: `${week.clementPercent}%` }}
                    />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-[11px] mb-0.5">
                    <span className="text-slate-500 dark:text-slate-400 flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-pink-500" />
                      Irène
                    </span>
                    <span className="font-mono font-medium text-slate-700 dark:text-slate-300">
                      {week.irenePercent}% ({week.ireneHours}h)
                    </span>
                  </div>
                  <div className="w-full bg-slate-100 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden">
                    <div
                      className="bg-pink-500 h-full rounded-full transition-all duration-500"
                      style={{ width: `${week.irenePercent}%` }}
                    />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-[11px] mb-0.5">
                    <span className="text-slate-700 dark:text-slate-300 font-semibold flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                      Commun
                    </span>
                    <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400">
                      {week.commonPercent}% ({week.commonHours}h)
                    </span>
                  </div>
                  <div className="w-full bg-slate-100 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden">
                    <div
                      className="bg-emerald-500 h-full rounded-full transition-all duration-500"
                      style={{ width: `${week.commonPercent}%` }}
                    />
                  </div>
                </div>
              </div>

              <div className="mt-2.5 pt-2 border-t border-slate-100 dark:border-slate-800 text-[10px] text-slate-500 dark:text-slate-400 flex items-center justify-between">
                <span>{isSelected ? '✓ Semaine sélectionnée' : 'Cliquer pour filtrer'}</span>
                <span className="font-medium text-slate-600 dark:text-slate-300 truncate max-w-[100px]">
                  {week.dutyHighlights}
                </span>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};

// Custom Tooltip component for Recharts
interface CustomTooltipProps {
  active?: boolean;
  payload?: any[];
  label?: string;
  metricMode: 'percent' | 'hours';
}

const CustomTooltip: React.FC<CustomTooltipProps> = ({
  active,
  payload,
  label,
  metricMode,
}) => {
  if (active && payload && payload.length > 0) {
    const data = payload[0].payload;
    return (
      <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-lg p-3.5 text-xs max-w-xs space-y-2 z-50">
        <div className="border-b border-slate-100 dark:border-slate-700 pb-1.5">
          <p className="font-bold text-slate-900 dark:text-white">{label}</p>
          <p className="text-[11px] text-slate-500 dark:text-slate-400">{data.range}</p>
        </div>

        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-blue-600 dark:text-blue-400">
            <span className="flex items-center gap-1.5 font-medium">
              <span className="w-2 h-2 rounded-full bg-blue-500" />
              Clément :
            </span>
            <span className="font-mono font-bold text-slate-900 dark:text-white">
              {data.clementPercent}% ({data.clementHours}h)
            </span>
          </div>

          <div className="flex items-center justify-between text-pink-600 dark:text-pink-400">
            <span className="flex items-center gap-1.5 font-medium">
              <span className="w-2 h-2 rounded-full bg-pink-500" />
              Irène :
            </span>
            <span className="font-mono font-bold text-slate-900 dark:text-white">
              {data.irenePercent}% ({data.ireneHours}h)
            </span>
          </div>

          <div className="flex items-center justify-between text-emerald-600 dark:text-emerald-400 pt-1 border-t border-slate-100 dark:border-slate-700/60 font-semibold">
            <span className="flex items-center gap-1.5">
              <Heart className="w-3 h-3 text-emerald-500" />
              En commun :
            </span>
            <span className="font-mono text-emerald-600 dark:text-emerald-400">
              {data.commonPercent}% ({data.commonHours}h)
            </span>
          </div>
        </div>

        {data.diagnosis && (
          <div className="bg-slate-50 dark:bg-slate-900/60 p-2 rounded-lg text-[11px] text-slate-600 dark:text-slate-300 border border-slate-100 dark:border-slate-700/40">
            {data.diagnosis}
          </div>
        )}
      </div>
    );
  }
  return null;
};
