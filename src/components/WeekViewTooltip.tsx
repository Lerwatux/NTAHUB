import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import {
  Plane,
  Clock,
  MapPin,
  AlertCircle,
  CheckCircle2,
  Calendar,
  Briefcase,
  Users,
  Sun,
  ShieldCheck,
  AlertTriangle,
  UserCheck,
  Building2,
  Home,
  Laptop,
} from 'lucide-react';
import {
  PncDayDuty,
  PncFlightLeg,
  ChildActivity,
  FamilyEvent,
} from '../types';
import { timeToMinutes, minutesToTime } from '../utils/timezone';

export const AIRPORT_NAMES: Record<string, string> = {
  ORY: 'Paris-Orly',
  CDG: 'Paris-CDG',
  NCE: 'Nice Côte d’Azur',
  MRS: 'Marseille Provence',
  TLS: 'Toulouse-Blagnac',
  BOD: 'Bordeaux-Mérignac',
  LYS: 'Lyon-Saint Exupéry',
  NTE: 'Nantes Atlantique',
  SXB: 'Strasbourg',
  MPL: 'Montpellier Méditerranée',
  RNS: 'Rennes Bretagne',
  BES: 'Brest Bretagne',
  PGF: 'Perpignan',
  BIQ: 'Biarritz',
  AJA: 'Ajaccio Napoléon Bonaparte',
  BIA: 'Bastia Poretta',
  FSC: 'Figari Sud Corse',
  CLY: 'Calvi Sainte-Catherine',
  FCO: 'Rome Fiumicino',
  MAD: 'Madrid Barajas',
  BCN: 'Barcelone El Prat',
  LHR: 'Londres Heathrow',
  AMS: 'Amsterdam Schiphol',
  GVA: 'Genève',
  MXP: 'Milan Malpensa',
  LIS: 'Lisbonne',
  ATH: 'Athènes',
  DUB: 'Dublin',
  TUN: 'Tunis-Carthage',
  RAK: 'Marrakech-Ménara',
};

export function getAirportLabel(code: string): string {
  const upper = (code || '').toUpperCase().trim();
  const name = AIRPORT_NAMES[upper];
  return name ? `${upper} (${name})` : upper;
}

export type WeekTooltipData =
  | {
      type: 'flight';
      duty: PncDayDuty;
      leg?: PncFlightLeg;
      dateStr: string;
      dayLabel?: string;
    }
  | {
      type: 'duty_other';
      duty: PncDayDuty;
      dateStr: string;
      dayLabel?: string;
    }
  | {
      type: 'activity';
      activity: ChildActivity;
      dateStr: string;
      dayLabel?: string;
      conflictInfo: {
        hasConflict: boolean;
        clementAvailable: boolean;
        ireneAvailable: boolean;
        reason: string;
      };
      clementDuty?: PncDayDuty;
      ireneStatus?: string;
    }
  | {
      type: 'event';
      event: FamilyEvent;
      dateStr: string;
      dayLabel?: string;
    }
  | {
      type: 'irene';
      status: string;
      dateStr: string;
      dayLabel?: string;
    };

export interface WeekTooltipState {
  data: WeekTooltipData;
  targetRect: DOMRect;
}

interface WeekViewTooltipProps {
  tooltipState: WeekTooltipState | null;
}

export const WeekViewTooltip: React.FC<WeekViewTooltipProps> = ({ tooltipState }) => {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted || !tooltipState) return null;

  const { data, targetRect } = tooltipState;

  // Compute smart viewport positioning
  const tooltipWidth = Math.min(340, typeof window !== 'undefined' ? window.innerWidth - 24 : 340);
  const padding = 12;

  let left = targetRect.right + padding;
  // If overflowing right viewport
  if (typeof window !== 'undefined' && left + tooltipWidth > window.innerWidth - padding) {
    // Try left of target
    left = targetRect.left - tooltipWidth - padding;
    // If still offscreen to the left, center horizontally or clamp
    if (left < padding) {
      left = Math.max(
        padding,
        Math.min(window.innerWidth - tooltipWidth - padding, targetRect.left + (targetRect.width - tooltipWidth) / 2)
      );
    }
  }

  // Vertical positioning: align with top of target
  let top = targetRect.top;
  const estimatedHeight = 280;
  if (typeof window !== 'undefined') {
    if (top + estimatedHeight > window.innerHeight - padding) {
      top = Math.max(padding, window.innerHeight - estimatedHeight - padding);
    }
    if (top < padding) {
      top = padding;
    }
  }

  // Format date helper
  const formatDateFrench = (dateStr: string) => {
    try {
      const [year, month, day] = dateStr.split('-').map(Number);
      const d = new Date(year, month - 1, day);
      return new Intl.DateTimeFormat('fr-FR', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
      }).format(d);
    } catch {
      return dateStr;
    }
  };

  // Duration calculator
  const getDurationString = (start: string, end: string) => {
    const sMin = timeToMinutes(start);
    const eMin = timeToMinutes(end);
    let diff = eMin - sMin;
    if (diff < 0) diff += 1440; // overnight
    const h = Math.floor(diff / 60);
    const m = diff % 60;
    if (h === 0) return `${m} min`;
    if (m === 0) return `${h}h`;
    return `${h}h${m < 10 ? '0' : ''}${m}`;
  };

  const content = (
    <div
      style={{
        position: 'fixed',
        left: `${left}px`,
        top: `${top}px`,
        width: `${tooltipWidth}px`,
        zIndex: 9999,
      }}
      className="pointer-events-none transition-all duration-150 animate-in fade-in zoom-in-95 ease-out select-none"
    >
      <div className="bg-white/95 dark:bg-slate-900/95 backdrop-blur-md rounded-xl p-3.5 shadow-2xl border border-slate-200/90 dark:border-slate-700/80 text-slate-800 dark:text-slate-100 text-xs space-y-3 ring-1 ring-black/5 dark:ring-white/10">
        {/* ================= 1. FLIGHT / ROTATION PNC TOOLTIP ================= */}
        {data.type === 'flight' && (
          <>
            {/* Header */}
            <div className="flex items-start justify-between gap-2 border-b border-slate-100 dark:border-slate-800 pb-2">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-blue-100 dark:bg-blue-900/60 text-blue-700 dark:text-blue-300 flex items-center justify-center shrink-0">
                  <Plane className="w-4 h-4" />
                </div>
                <div>
                  <div className="font-extrabold text-blue-900 dark:text-blue-200 text-sm leading-tight">
                    {data.leg ? `Vol ${data.leg.flightNumber}` : data.duty.title || 'Service Vol PNC'}
                  </div>
                  <div className="text-[10px] text-slate-500 dark:text-slate-400 capitalize">
                    {formatDateFrench(data.dateStr)}
                  </div>
                </div>
              </div>

              <span className="px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider bg-blue-50 dark:bg-blue-950 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800 shrink-0">
                PNC Air France
              </span>
            </div>

            {/* Flight Legs Section */}
            {data.duty.legs && data.duty.legs.length > 0 ? (
              <div className="space-y-1.5 bg-slate-50 dark:bg-slate-950/60 p-2.5 rounded-lg border border-slate-100 dark:border-slate-800">
                <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-1">
                  Étapes de la rotation ({data.duty.legs.length} vol{data.duty.legs.length > 1 ? 's' : ''})
                </div>

                {data.duty.legs.map((leg, idx) => {
                  const isCurrentTarget = data.leg?.id === leg.id;
                  const durStr = getDurationString(leg.departureLocal, leg.arrivalLocal);
                  return (
                    <div
                      key={leg.id || idx}
                      className={`p-1.5 rounded transition-colors text-[11px] ${
                        isCurrentTarget
                          ? 'bg-blue-100/70 dark:bg-blue-900/40 text-blue-950 dark:text-blue-100 font-semibold'
                          : 'bg-white dark:bg-slate-900/60 text-slate-700 dark:text-slate-300'
                      }`}
                    >
                      <div className="flex items-center justify-between font-mono">
                        <span className="font-bold text-blue-700 dark:text-blue-300">
                          {leg.flightNumber}
                        </span>
                        <span className="font-bold">
                          {leg.departureAirport} ✈ {leg.arrivalAirport}
                        </span>
                        <span className="text-[10px] text-slate-500 dark:text-slate-400">
                          {leg.departureLocal} - {leg.arrivalLocal}
                        </span>
                      </div>

                      <div className="flex items-center justify-between text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">
                        <span className="truncate">
                          {AIRPORT_NAMES[leg.departureAirport] || leg.departureAirport} ➔{' '}
                          {AIRPORT_NAMES[leg.arrivalAirport] || leg.arrivalAirport}
                        </span>
                        <span className="shrink-0 font-medium">({durStr})</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-slate-600 dark:text-slate-300">
                {data.duty.title || 'Vol programmé'}
              </div>
            )}

            {/* Operational Times (Aviation rules) */}
            <div className="grid grid-cols-2 gap-2 text-[11px]">
              <div className="bg-slate-50 dark:bg-slate-950/60 p-2 rounded-lg border border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-1 text-[10px] text-slate-400 dark:text-slate-500 font-medium">
                  <Clock className="w-3 h-3 text-blue-500" />
                  <span>Convocation base</span>
                </div>
                <div className="font-mono font-bold text-slate-800 dark:text-slate-100 text-xs mt-0.5">
                  {data.duty.briefingTime || '06:00'} (Orly)
                </div>
                <div className="text-[9px] text-slate-400 mt-0.5">75 min avant le vol</div>
              </div>

              <div className="bg-slate-50 dark:bg-slate-950/60 p-2 rounded-lg border border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-1 text-[10px] text-slate-400 dark:text-slate-500 font-medium">
                  <Home className="w-3 h-3 text-emerald-500" />
                  <span>Retour maison</span>
                </div>
                <div className="font-mono font-bold text-slate-800 dark:text-slate-100 text-xs mt-0.5">
                  {data.duty.freeTimeAtHome || '19:30'}
                </div>
                <div className="text-[9px] text-slate-400 mt-0.5">Formalités & trajet</div>
              </div>
            </div>

            {/* Layover / Découcher status */}
            {data.duty.isLayover ? (
              <div className="p-2 rounded-lg bg-purple-50 dark:bg-purple-950/50 border border-purple-200 dark:border-purple-800/80 text-[11px] text-purple-900 dark:text-purple-200 flex items-center gap-2">
                <span className="text-base">🏨</span>
                <div>
                  <span className="font-bold">Découcher en escale ({data.duty.layoverCity || 'Province'})</span>
                  <div className="text-[10px] text-purple-700 dark:text-purple-300">
                    Nuitée d'équipage à l'hôtel · Retour base programmé le lendemain.
                  </div>
                </div>
              </div>
            ) : (
              <div className="p-2 rounded-lg bg-emerald-50/70 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 text-[11px] text-emerald-900 dark:text-emerald-200 flex items-center gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                <span>Rotation avec retour à la maison le jour même</span>
              </div>
            )}

            {/* Impact / Family Availability */}
            <div className="text-[10px] text-slate-500 dark:text-slate-400 pt-1 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <span>👤 Clément indisponible pour les trajets enfants</span>
              <span className="font-semibold text-blue-600 dark:text-blue-400">Clic : ouvrir jour →</span>
            </div>
          </>
        )}

        {/* ================= 2. OTHER PNC DUTY (OFF, DÉCOUCHER, BLANC, STAGE) ================= */}
        {data.type === 'duty_other' && (
          <>
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-2">
              <div className="flex items-center gap-2">
                <div
                  className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${
                    data.duty.type === 'off'
                      ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/60 dark:text-emerald-300'
                      : data.duty.type === 'decoucher'
                      ? 'bg-purple-100 text-purple-700 dark:bg-purple-900/60 dark:text-purple-300'
                      : 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300'
                  }`}
                >
                  {data.duty.type === 'off' ? <Sun className="w-4 h-4" /> : <Briefcase className="w-4 h-4" />}
                </div>
                <div>
                  <div className="font-bold text-slate-900 dark:text-white text-sm">
                    {data.duty.type === 'off'
                      ? 'Repos PNC (OFF)'
                      : data.duty.type === 'decoucher'
                      ? `Découcher à ${data.duty.layoverCity || 'Escale'}`
                      : data.duty.type === 'cours_au_sol'
                      ? 'Stage / Cours au sol AF'
                      : data.duty.type === 'blanc'
                      ? 'Jour Blanc (Disponibilité)'
                      : data.duty.title}
                  </div>
                  <div className="text-[10px] text-slate-500 dark:text-slate-400 capitalize">
                    {formatDateFrench(data.dateStr)}
                  </div>
                </div>
              </div>
            </div>

            <div className="text-[11px] leading-relaxed text-slate-600 dark:text-slate-300">
              {data.duty.type === 'off' && (
                <div className="space-y-2">
                  <p>
                    Journée de repos officiel non volante. Clément est à la maison et entièrement
                    disponible pour la vie de famille.
                  </p>
                  <div className="p-2 rounded-lg bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800/80 text-emerald-800 dark:text-emerald-300 font-semibold flex items-center gap-1.5">
                    <UserCheck className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Clément 100% disponible pour les trajets & enfants</span>
                  </div>
                </div>
              )}

              {data.duty.type === 'decoucher' && (
                <div className="space-y-2">
                  <p>
                    Clément est actuellement en escale à l'extérieur de Paris. Nuit passée à l'hôtel
                    avant la reprise du service.
                  </p>
                  <div className="p-2 rounded-lg bg-purple-50 dark:bg-purple-950/50 border border-purple-200 dark:border-purple-800/80 text-purple-800 dark:text-purple-300 font-semibold flex items-center gap-1.5">
                    <AlertCircle className="w-3.5 h-3.5 text-purple-600" />
                    <span>Clément indisponible (hors domicile)</span>
                  </div>
                </div>
              )}

              {data.duty.type === 'cours_au_sol' && (
                <div className="space-y-2">
                  <p>
                    Formation réglementaire ou simulateur au centre de formation Air France. Horaires
                    typiques : 09:00 - 18:00 (+ trajets).
                  </p>
                  <div className="p-2 rounded-lg bg-amber-50 dark:bg-amber-950/50 border border-amber-200 dark:border-amber-800/80 text-amber-800 dark:text-amber-300 font-semibold">
                    Disponible le matin avant 07h30 et en soirée après 19h30.
                  </div>
                </div>
              )}

              {data.duty.type === 'blanc' && (
                <div className="space-y-2">
                  <p>
                    Jour blanc sans vol programmé : Clément est disponible mais en veille réserve.
                  </p>
                </div>
              )}
            </div>

            <div className="text-[10px] text-slate-400 dark:text-slate-500 pt-1 border-t border-slate-100 dark:border-slate-800 text-right">
              Clic pour voir la journée →
            </div>
          </>
        )}

        {/* ================= 3. CHILD ACTIVITY TOOLTIP ================= */}
        {data.type === 'activity' && (
          <>
            {/* Header */}
            <div className="flex items-start justify-between gap-2 border-b border-slate-100 dark:border-slate-800 pb-2">
              <div className="flex items-center gap-2">
                <div
                  className="w-7 h-7 rounded-lg text-white flex items-center justify-center font-bold text-xs shrink-0 shadow-xs"
                  style={{ backgroundColor: data.activity.color }}
                >
                  {data.activity.childName.charAt(0)}
                </div>
                <div>
                  <div className="font-extrabold text-slate-900 dark:text-white text-sm">
                    {data.activity.activityName}
                  </div>
                  <div className="text-[10px] text-slate-500 dark:text-slate-400 capitalize">
                    {formatDateFrench(data.dateStr)}
                  </div>
                </div>
              </div>

              <span
                className="px-2 py-0.5 rounded-full text-[10px] font-bold text-white shrink-0"
                style={{ backgroundColor: data.activity.color }}
              >
                {data.activity.childName}
              </span>
            </div>

            {/* Time & Duration & Location */}
            <div className="space-y-1.5 bg-slate-50 dark:bg-slate-950/60 p-2.5 rounded-lg border border-slate-100 dark:border-slate-800">
              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-1.5 font-mono font-bold text-slate-800 dark:text-slate-200">
                  <Clock className="w-3.5 h-3.5 text-indigo-500" />
                  <span>
                    {data.activity.startTime} - {data.activity.endTime}
                  </span>
                </div>
                <span className="text-[10px] font-semibold text-slate-500 dark:text-slate-400">
                  Durée : {getDurationString(data.activity.startTime, data.activity.endTime)}
                </span>
              </div>

              {data.activity.location && (
                <div className="flex items-center gap-1.5 text-[11px] text-slate-600 dark:text-slate-300 pt-1 border-t border-slate-200/50 dark:border-slate-800/80">
                  <MapPin className="w-3.5 h-3.5 text-red-500 shrink-0" />
                  <span className="truncate">{data.activity.location}</span>
                </div>
              )}

              {data.activity.notes && (
                <div className="text-[10px] text-slate-500 dark:text-slate-400 italic pt-1 border-t border-slate-200/50 dark:border-slate-800/80">
                  « {data.activity.notes} »
                </div>
              )}
            </div>

            {/* Logistics & Parent Availability (Key Feature) */}
            <div className="space-y-1.5">
              <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                Logistique & Accompagnement
              </div>

              {data.conflictInfo.hasConflict ? (
                <div className="p-2.5 rounded-lg bg-red-50 dark:bg-red-950/60 border border-red-200 dark:border-red-800/80 text-red-900 dark:text-red-200 space-y-1">
                  <div className="flex items-center gap-1.5 font-bold text-xs text-red-700 dark:text-red-300">
                    <AlertTriangle className="w-4 h-4 text-red-600 dark:text-red-400 shrink-0 animate-pulse" />
                    <span>⚠️ Alerte : Conflit d'accompagnement !</span>
                  </div>
                  <p className="text-[11px] leading-tight text-red-800 dark:text-red-200">
                    Ni Clément ni Irène n'est disponible sur ce créneau ({data.activity.startTime} -{' '}
                    {data.activity.endTime}).
                  </p>
                  <div className="text-[10px] text-red-700/90 dark:text-red-300/90 pt-1 border-t border-red-200/60 dark:border-red-900/60 space-y-0.5">
                    <div>• Clément : en service vol / découcher</div>
                    <div>• Irène : au bureau à Paris (09h-17h + trajets)</div>
                  </div>
                </div>
              ) : data.conflictInfo.clementAvailable && !data.conflictInfo.ireneAvailable ? (
                <div className="p-2 rounded-lg bg-blue-50 dark:bg-blue-950/50 border border-blue-200 dark:border-blue-800/80 text-blue-900 dark:text-blue-200 flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0" />
                  <div>
                    <div className="font-bold text-xs">Clément disponible pour le trajet</div>
                    <div className="text-[10px] text-blue-700 dark:text-blue-300">
                      Irène est au bureau à Paris sur cette tranche.
                    </div>
                  </div>
                </div>
              ) : !data.conflictInfo.clementAvailable && data.conflictInfo.ireneAvailable ? (
                <div className="p-2 rounded-lg bg-pink-50 dark:bg-pink-950/50 border border-pink-200 dark:border-pink-800/80 text-pink-900 dark:text-pink-200 flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-pink-600 dark:text-pink-400 shrink-0" />
                  <div>
                    <div className="font-bold text-xs">Irène disponible pour le trajet</div>
                    <div className="text-[10px] text-pink-700 dark:text-pink-300">
                      Clément est en vol ou en déplacement PNC.
                    </div>
                  </div>
                </div>
              ) : (
                <div className="p-2 rounded-lg bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800/80 text-emerald-900 dark:text-emerald-200 flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                  <div>
                    <div className="font-bold text-xs">Les deux parents sont disponibles</div>
                    <div className="text-[10px] text-emerald-700 dark:text-emerald-300">
                      Aucune contrainte professionnelle sur ce créneau.
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="text-[10px] text-slate-400 dark:text-slate-500 pt-1 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <span>Édition dans l'onglet Activités</span>
              <span className="font-semibold text-indigo-600 dark:text-indigo-400">Clic : voir jour →</span>
            </div>
          </>
        )}

        {/* ================= 4. FAMILY EVENT TOOLTIP ================= */}
        {data.type === 'event' && (
          <>
            <div className="flex items-start justify-between gap-2 border-b border-slate-100 dark:border-slate-800 pb-2">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-indigo-100 dark:bg-indigo-900/60 text-indigo-700 dark:text-indigo-300 flex items-center justify-center shrink-0">
                  <Calendar className="w-4 h-4" />
                </div>
                <div>
                  <div className="font-extrabold text-indigo-950 dark:text-indigo-200 text-sm">
                    {data.event.customTitle || data.event.category}
                  </div>
                  <div className="text-[10px] text-slate-500 dark:text-slate-400 capitalize">
                    {formatDateFrench(data.dateStr)}
                  </div>
                </div>
              </div>

              <span className="px-2 py-0.5 rounded-full text-[9px] font-bold uppercase bg-indigo-50 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 shrink-0">
                {data.event.category}
              </span>
            </div>

            <div className="bg-slate-50 dark:bg-slate-950/60 p-2.5 rounded-lg border border-slate-100 dark:border-slate-800 space-y-1.5">
              <div className="flex items-center justify-between text-xs font-mono font-bold text-slate-800 dark:text-slate-200">
                <div className="flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-indigo-500" />
                  <span>
                    {data.event.startTime} - {data.event.endTime}
                  </span>
                </div>
                <span className="text-[10px] font-sans font-medium text-slate-500">
                  {getDurationString(data.event.startTime, data.event.endTime)}
                </span>
              </div>

              <div className="flex flex-wrap items-center gap-1.5 pt-1 border-t border-slate-200/50 dark:border-slate-800">
                {data.event.target && (
                  <span className="px-1.5 py-0.5 rounded bg-slate-200 dark:bg-slate-800 text-[10px] font-medium text-slate-700 dark:text-slate-300">
                    Pour : {data.event.target}
                  </span>
                )}
                {data.event.assignedTo && (
                  <span className="px-1.5 py-0.5 rounded bg-indigo-100 dark:bg-indigo-900/60 text-[10px] font-bold text-indigo-800 dark:text-indigo-200">
                    Assigné : {data.event.assignedTo}
                  </span>
                )}
              </div>

              {data.event.notes && (
                <div className="text-[10px] text-slate-500 dark:text-slate-400 italic pt-1">
                  « {data.event.notes} »
                </div>
              )}
            </div>

            <div className="text-[10px] text-slate-400 dark:text-slate-500 pt-1 border-t border-slate-100 dark:border-slate-800 text-right">
              Clic : voir ou modifier →
            </div>
          </>
        )}

        {/* ================= 5. IRÈNE WORK STATUS TOOLTIP ================= */}
        {data.type === 'irene' && (
          <>
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-2">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-pink-100 dark:bg-pink-900/60 text-pink-700 dark:text-pink-300 flex items-center justify-center shrink-0">
                  <Briefcase className="w-4 h-4" />
                </div>
                <div>
                  <div className="font-extrabold text-pink-950 dark:text-pink-200 text-sm">
                    Travail Irène ·{' '}
                    {data.status === 'bureau'
                      ? 'Bureau Paris'
                      : data.status === 'tt'
                      ? 'Télétravail'
                      : data.status === 'cp'
                      ? 'Congés Payés'
                      : data.status === 'rtt'
                      ? 'RTT'
                      : 'Repos'}
                  </div>
                  <div className="text-[10px] text-slate-500 dark:text-slate-400 capitalize">
                    {formatDateFrench(data.dateStr)}
                  </div>
                </div>
              </div>
            </div>

            <div className="text-[11px] space-y-2 text-slate-600 dark:text-slate-300">
              {data.status === 'bureau' && (
                <>
                  <p>
                    Journée de travail au siège à Paris. Horaires de bureau : 09:00 - 17:00.
                  </p>
                  <div className="p-2 rounded-lg bg-amber-50 dark:bg-amber-950/50 border border-amber-200 dark:border-amber-800/80 text-[10px] text-amber-900 dark:text-amber-200 space-y-0.5">
                    <div className="font-bold flex items-center gap-1">
                      <Building2 className="w-3.5 h-3.5" />
                      <span>Trajets RER Paris : 1h30 aller / 1h30 retour</span>
                    </div>
                    <div>Départ maison : 07h30 · Retour maison : 18h30</div>
                  </div>
                </>
              )}

              {data.status === 'tt' && (
                <>
                  <p>
                    Télétravail à domicile (09:00 - 17:00). Aucun temps de trajet de transport en commun.
                  </p>
                  <div className="p-2 rounded-lg bg-blue-50 dark:bg-blue-950/50 border border-blue-200 dark:border-blue-800/80 text-[10px] text-blue-900 dark:text-blue-200 flex items-center gap-1.5 font-medium">
                    <Laptop className="w-3.5 h-3.5" />
                    <span>Présente à la maison · Flexible pour récupérer les enfants</span>
                  </div>
                </>
              )}

              {data.status === 'cp' && (
                <p>Journée de Congés Payés (CP) posée. Irène est en vacances et disponible pour la famille.</p>
              )}

              {data.status === 'rtt' && (
                <p>Journée RTT posée. Irène est en repos à la maison.</p>
              )}
            </div>

            <div className="text-[10px] text-slate-400 dark:text-slate-500 pt-1 border-t border-slate-100 dark:border-slate-800 text-right">
              Clic : ajuster le statut →
            </div>
          </>
        )}
      </div>
    </div>
  );

  return createPortal(content, document.body);
};
