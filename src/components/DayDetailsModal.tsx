import React, { useEffect } from 'react';
import {
  X,
  Plane,
  Home,
  Briefcase,
  Sun,
  AlertCircle,
  Plus,
  Trash2,
  MapPin,
  Clock,
  ShieldCheck,
  Calendar as CalendarIcon,
} from 'lucide-react';
import {
  PncDayDuty,
  IreneWorkStatus,
  ChildActivity,
  FamilyEvent,
  UserProfile,
  AppSettings,
} from '../types';
import { formatFrenchDateLong } from '../utils/timezone';
import { checkChildActivityConflict } from '../utils/availability';
import { getZoneCHoliday } from '../utils/holidaysZoneC';

interface DayDetailsModalProps {
  isOpen: boolean;
  date: string;
  onClose: () => void;
  pncDuty?: PncDayDuty;
  ireneStatus: IreneWorkStatus | 'weekend';
  onUpdateIreneStatus: (status: IreneWorkStatus) => void;
  childActivities: ChildActivity[];
  events: FamilyEvent[];
  onDeleteEvent: (id: string) => void;
  onOpenAddEventForDate: (date: string) => void;
  currentUser: UserProfile;
  allPncDuties: Map<string, PncDayDuty>;
  allIreneOverrides: Map<string, any>;
  allEvents: FamilyEvent[];
  settings?: AppSettings;
}

export const DayDetailsModal: React.FC<DayDetailsModalProps> = ({
  isOpen,
  date,
  onClose,
  pncDuty,
  ireneStatus,
  onUpdateIreneStatus,
  childActivities,
  events,
  onDeleteEvent,
  onOpenAddEventForDate,
  allPncDuties,
  allIreneOverrides,
  allEvents,
  settings,
}) => {
  // Fermeture via la touche Échap
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Verrouillage du scroll arrière-plan
  useEffect(() => {
    if (isOpen) {
      const originalOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = originalOverflow;
      };
    }
  }, [isOpen]);

  if (!isOpen || !date) return null;

  const dateFormatted = formatFrenchDateLong(date);
  const holidayZoneC = getZoneCHoliday(date);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
    >
      <div
        className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150 my-auto"
        role="dialog"
        aria-modal="true"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 shrink-0">
          <div>
            <span className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider">
              Détails de la journée
            </span>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white capitalize">
              {dateFormatted}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Fermer la fenêtre"
            title="Fermer (Échap)"
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content body (scrollable) */}
        <div className="p-6 overflow-y-auto space-y-6">
          {/* BANNIÈRE VACANCES SCOLAIRES ZONE C */}
          {holidayZoneC && (
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-3.5 flex items-center justify-between gap-3 text-amber-900">
              <div className="flex items-center gap-2.5">
                <span className="text-xl">🎒</span>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-xs uppercase tracking-wider text-amber-800">
                      Vacances Scolaires · Zone C
                    </span>
                    <span className="px-1.5 py-0.2 bg-amber-200/80 text-amber-900 font-semibold rounded text-[10px]">
                      Paris · Créteil · Versailles
                    </span>
                  </div>
                  <p className="text-xs font-semibold text-amber-950 mt-0.5">
                    {holidayZoneC.period.name}
                  </p>
                  {holidayZoneC.period.description && (
                    <p className="text-[11px] text-amber-800/90">
                      {holidayZoneC.period.description}
                    </p>
                  )}
                </div>
              </div>
              <span className="text-xs font-medium text-amber-800 bg-amber-100 px-2 py-1 rounded-md shrink-0">
                Enfants sans école
              </span>
            </div>
          )}
          {/* 1. CLÉMENT - PLANNING PNC & VOLS */}
          <section className="bg-slate-50/80 dark:bg-slate-800/60 rounded-xl p-4 border border-slate-200 dark:border-slate-800">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-blue-600 text-white flex items-center justify-center">
                  <Plane className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                    Clément · Planning PNC (Heure locale Paris)
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Base Orly (ORY) · Roster personnel (Briefing {settings?.clementBriefingMinutes || 75} min avant · Retour maison +{settings?.clementHomeAfterLandingMinutes || 90} min)
                  </p>
                </div>
              </div>

              {/* Status Badge */}
              {pncDuty?.type === 'vol' && (
                <span className="text-xs font-semibold px-2.5 py-1 bg-blue-100 dark:bg-blue-950 text-blue-800 dark:text-blue-300 rounded-md">
                  En Vol
                </span>
              )}
              {pncDuty?.type === 'decoucher' && (
                <span className="text-xs font-semibold px-2.5 py-1 bg-indigo-100 dark:bg-indigo-950 text-indigo-800 dark:text-indigo-300 rounded-md">
                  En Découcher ({pncDuty.layoverCity})
                </span>
              )}
              {pncDuty?.type === 'cours_au_sol' && (
                <span className="text-xs font-semibold px-2.5 py-1 bg-purple-100 dark:bg-purple-950 text-purple-800 dark:text-purple-300 rounded-md">
                  Cours au sol (CS_CSS)
                </span>
              )}
              {pncDuty?.type === 'off' && (
                <span className="text-xs font-semibold px-2.5 py-1 bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 rounded-md">
                  Repos OFF (Libre)
                </span>
              )}
              {(!pncDuty || pncDuty.type === 'blanc') && (
                <span className="text-xs font-semibold px-2.5 py-1 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 rounded-md">
                  Jour Blanc (Astreinte)
                </span>
              )}
            </div>

            {/* Duty details */}
            {pncDuty?.type === 'vol' || pncDuty?.type === 'decoucher' ? (
              <div className="space-y-3">
                {/* Summary bar briefing / retour maison */}
                <div className="grid grid-cols-2 gap-3 p-3 bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-700/60 text-xs">
                  <div>
                    <span className="text-slate-500 dark:text-slate-400 block">Briefing obligatoire</span>
                    <span className="font-bold text-slate-900 dark:text-white font-mono text-sm">
                      {pncDuty.briefingTime ? `${pncDuty.briefingTime} (Paris)` : 'N/A'}
                    </span>
                    <span className="text-[11px] text-slate-500 dark:text-slate-400 block">
                      {settings?.clementBriefingMinutes || 75} min avant décollage
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-500 dark:text-slate-400 block">Retour maison estimé</span>
                    <span className="font-bold text-slate-900 dark:text-white font-mono text-sm">
                      {pncDuty.freeTimeAtHome
                        ? `${pncDuty.freeTimeAtHome} (Paris)`
                        : pncDuty.isLayover
                        ? 'Découcher (Pas à la maison)'
                        : `+${settings?.clementHomeAfterLandingMinutes || 90} min après posé ORY`}
                    </span>
                    <span className="text-[11px] text-slate-500 dark:text-slate-400 block">
                      {pncDuty.isLayover
                        ? `Nuitée escale : ${pncDuty.layoverCity}`
                        : `${settings?.clementHomeAfterLandingMinutes || 90} min après atterrissage ORY`}
                    </span>
                  </div>
                </div>

                {/* Flight legs */}
                {pncDuty.legs && pncDuty.legs.length > 0 && (
                  <div className="space-y-2">
                    <span className="text-xs font-semibold text-slate-700 dark:text-slate-300 block">
                      Étapes du jour :
                    </span>
                    {pncDuty.legs.map((leg) => (
                      <div
                        key={leg.id}
                        className="flex items-center justify-between p-2.5 bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-700/60 text-xs"
                      >
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-blue-700 dark:text-blue-400 font-mono">
                            {leg.flightNumber}
                          </span>
                          <span className="text-slate-700 dark:text-slate-300 font-medium">
                            {leg.departureAirport} → {leg.arrivalAirport}
                          </span>
                          {leg.isReturnToOry && (
                            <span className="px-1.5 py-0.5 bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 rounded text-[10px] font-semibold border border-emerald-200 dark:border-emerald-800">
                              Arrivée finale ORY
                            </span>
                          )}
                        </div>
                        <div className="text-slate-600 dark:text-slate-400 font-mono tabular-nums">
                          {leg.departureLocal} - {leg.arrivalLocal}
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {pncDuty.notes && (
                  <p className="text-xs text-slate-600 dark:text-slate-400 italic bg-blue-50/50 dark:bg-blue-950/40 p-2 rounded border border-blue-100 dark:border-blue-900">
                    {pncDuty.notes}
                  </p>
                )}
              </div>
            ) : pncDuty?.type === 'cours_au_sol' ? (
              <div className="p-3 bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-700/60 text-xs space-y-2">
                <div className="flex items-center gap-2 text-purple-700 dark:text-purple-400 font-semibold">
                  <ShieldCheck className="w-4 h-4" />
                  <span>Cours au sol / CS_CSS (Règle briefing non applicable)</span>
                </div>
                <p className="text-slate-600 dark:text-slate-300">
                  Clément commence directement à l'horaire indiqué ({pncDuty.briefingTime || '09:00'}).
                  Retour à la maison vers {pncDuty.freeTimeAtHome || '18:30'} (+{settings?.clementGroundCourseTravelMinutes || 90} min trajet).
                </p>
              </div>
            ) : pncDuty?.type === 'off' ? (
              <div className="p-3 bg-emerald-50/50 dark:bg-emerald-950/40 rounded-lg border border-emerald-200 dark:border-emerald-800 text-xs text-emerald-800 dark:text-emerald-300">
                <p className="font-semibold">Jour OFF officiel (Repos PNC)</p>
                <p className="text-emerald-700 dark:text-emerald-400 mt-0.5">
                  Clément est complètement disponible toute la journée pour la famille et les enfants.
                </p>
              </div>
            ) : (
              <div className="p-3 bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-700/60 text-xs text-slate-700 dark:text-slate-300">
                <p className="font-semibold">Jour blanc (Astreinte disponible)</p>
                <p className="text-slate-500 dark:text-slate-400 mt-0.5">
                  Aucun vol prévu au roster à cette date. Journée d’astreinte où Clément risque d'être déclenché par la régulation vol ou d'être libre.
                </p>
              </div>
            )}
          </section>

          {/* 2. IRÈNE - PLANNING & MODIFICATION RAPIDE */}
          <section className="bg-slate-50/80 dark:bg-slate-800/60 rounded-xl p-4 border border-slate-200 dark:border-slate-800">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-pink-600 text-white flex items-center justify-center">
                  <Briefcase className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                    Irène · Planning de Travail
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Horaires réglés : {settings?.ireneWorkStart || '09:00'} - {settings?.ireneWorkEnd || '17h00'} (+{settings?.ireneCommuteGoMinutes || 90} min trajet)
                  </p>
                </div>
              </div>

              {/* Status Indicator */}
              <div className="flex items-center gap-1.5">
                {ireneStatus === 'tt' && (
                  <span className="flex items-center gap-1 text-xs font-semibold px-2.5 py-1 bg-blue-100 dark:bg-blue-950 text-blue-800 dark:text-blue-300 rounded-md">
                    <Home className="w-3.5 h-3.5" />
                    Télétravail (TT)
                  </span>
                )}
                {ireneStatus === 'cp' && (
                  <span className="flex items-center gap-1 text-xs font-semibold px-2.5 py-1 bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 rounded-md">
                    <Sun className="w-3.5 h-3.5" />
                    CP (Congé)
                  </span>
                )}
                {ireneStatus === 'rtt' && (
                  <span className="flex items-center gap-1 text-xs font-semibold px-2.5 py-1 bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 rounded-md">
                    <Sun className="w-3.5 h-3.5" />
                    RTT (Libre)
                  </span>
                )}
                {ireneStatus === 'bureau' && (
                  <span className="text-xs font-semibold px-2.5 py-1 bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-slate-200 rounded-md">
                    Bureau (Présentiel)
                  </span>
                )}
                {ireneStatus === 'weekend' && (
                  <span className="text-xs font-semibold px-2.5 py-1 bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 rounded-md">
                    Week-end (Repos)
                  </span>
                )}
              </div>
            </div>

            {/* Menu déroulant pour modifier le statut d'Irène */}
            <div className="bg-white dark:bg-slate-900 p-3 rounded-lg border border-slate-200 dark:border-slate-800 space-y-2">
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                Modifier le planning d'Irène pour ce jour :
              </label>
              <div className="grid grid-cols-4 gap-2">
                <button
                  type="button"
                  onClick={() => onUpdateIreneStatus('bureau')}
                  className={`px-2.5 py-2 text-xs font-medium rounded-lg border text-center transition-all ${
                    ireneStatus === 'bureau'
                      ? 'bg-slate-800 dark:bg-slate-700 text-white border-slate-800 dark:border-slate-600 font-bold'
                      : 'bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700/60'
                  }`}
                >
                  🏢 Bureau
                </button>
                <button
                  type="button"
                  onClick={() => onUpdateIreneStatus('tt')}
                  className={`px-2.5 py-2 text-xs font-medium rounded-lg border text-center transition-all ${
                    ireneStatus === 'tt'
                      ? 'bg-blue-600 text-white border-blue-600 font-bold shadow-xs'
                      : 'bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-900 hover:bg-blue-100'
                  }`}
                >
                  🏠 TT (Maison)
                </button>
                <button
                  type="button"
                  onClick={() => onUpdateIreneStatus('cp')}
                  className={`px-2.5 py-2 text-xs font-medium rounded-lg border text-center transition-all ${
                    ireneStatus === 'cp'
                      ? 'bg-emerald-600 text-white border-emerald-600 font-bold shadow-xs'
                      : 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-900 hover:bg-emerald-100'
                  }`}
                >
                  🌴 CP (Congé)
                </button>
                <button
                  type="button"
                  onClick={() => onUpdateIreneStatus('rtt')}
                  className={`px-2.5 py-2 text-xs font-medium rounded-lg border text-center transition-all ${
                    ireneStatus === 'rtt'
                      ? 'bg-emerald-600 text-white border-emerald-600 font-bold shadow-xs'
                      : 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-900 hover:bg-emerald-100'
                  }`}
                >
                  ⚡ RTT
                </button>
              </div>

              <p className="text-[11px] text-slate-500 dark:text-slate-400 pt-1">
                {ireneStatus === 'tt'
                  ? `🏠 En télétravail : reste bleu avec icône maison (${settings?.ireneTtWorkStart || '09:00'} - ${settings?.ireneTtWorkEnd || '17:00'}, 0 trajet).`
                  : ireneStatus === 'cp' || ireneStatus === 'rtt'
                  ? '🌴 CP / RTT : passe en vert (libre toute la journée).'
                  : `🏢 Au bureau : départ estimé ${settings?.ireneWorkStart ? 'avant ' + settings.ireneWorkStart : 'à 07:30'}, travail ${settings?.ireneWorkStart || '09:00'}-${settings?.ireneWorkEnd || '17:00'}, retour maison vers ${settings?.ireneWorkEnd ? 'après ' + settings.ireneWorkEnd : '18:30'}.`}
              </p>
            </div>
          </section>

          {/* 3. ACTIVITÉS DES ENFANTS & DÉTECTION CONFLIT ❓ */}
          <section className="bg-slate-50/80 dark:bg-slate-800/60 rounded-xl p-4 border border-slate-200 dark:border-slate-800">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-amber-500 text-white flex items-center justify-center font-bold text-xs">
                  👶
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                    Activités des Enfants (Imanzi & Ishema)
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Présentes sur les plannings des deux parents
                  </p>
                </div>
              </div>
            </div>

            {childActivities.length === 0 ? (
              <p className="text-xs text-slate-500 dark:text-slate-400 italic p-3 bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800">
                Aucune activité enfant prévue ce jour de la semaine.
              </p>
            ) : (
              <div className="space-y-2.5">
                {childActivities.map((act) => {
                  const conflict = checkChildActivityConflict(
                    act,
                    date,
                    allPncDuties,
                    allIreneOverrides,
                    allEvents,
                    settings
                  );

                  return (
                    <div
                      key={act.id}
                      className={`p-3 rounded-lg border transition-colors ${
                        conflict.hasConflict
                          ? 'bg-rose-50/80 dark:bg-rose-950/40 border-rose-300 dark:border-rose-800'
                          : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          {/* Trait de couleur enfant */}
                          <div
                            className="w-1.5 h-6 rounded-full"
                            style={{ backgroundColor: act.color }}
                          />
                          <div>
                            <div className="flex items-center gap-1.5">
                              {conflict.hasConflict && (
                                <span
                                  className="text-base select-none"
                                  title="Conflit détecté : ni Clément ni Irène disponible !"
                                >
                                  ❓
                                </span>
                              )}
                              <span className="font-bold text-xs text-slate-900 dark:text-white">
                                {act.childName} — {act.activityName}
                              </span>
                            </div>
                            {act.location && (
                              <div className="flex items-center gap-1 text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                                <MapPin className="w-3 h-3 text-slate-400" />
                                <span>{act.location}</span>
                              </div>
                            )}
                          </div>
                        </div>

                        <div className="text-right">
                          <span className="font-mono text-xs font-semibold text-slate-700 dark:text-slate-300">
                            {act.startTime} - {act.endTime}
                          </span>
                        </div>
                      </div>

                      {/* Conflict explanation banner */}
                      {conflict.hasConflict ? (
                        <div className="mt-2.5 p-2 bg-rose-100/90 dark:bg-rose-900/60 rounded border border-rose-200 dark:border-rose-800 text-xs text-rose-900 dark:text-rose-200 flex items-start gap-1.5">
                          <AlertCircle className="w-3.5 h-3.5 text-rose-700 dark:text-rose-400 shrink-0 mt-0.5" />
                          <span>
                            <strong>Besoin d'un relais :</strong> Ni Clément ni Irène n'est disponible pendant ce créneau ! Prévoir nounou, grands-parents ou covoiturage.
                          </span>
                        </div>
                      ) : (
                        <div className="mt-2 text-[11px] text-slate-600 dark:text-slate-400">
                          {conflict.reason}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </section>

          {/* 4. ÉVÉNEMENTS FAMILIAUX */}
          <section className="bg-slate-50/80 dark:bg-slate-800/60 rounded-xl p-4 border border-slate-200 dark:border-slate-800">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-indigo-600 text-white flex items-center justify-center">
                  <CalendarIcon className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                    Événements du jour
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    RDV, courses, invités, sorties
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => onOpenAddEventForDate(date)}
                className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300 bg-indigo-50 dark:bg-indigo-950/50 hover:bg-indigo-100 rounded-lg transition-colors border border-indigo-200 dark:border-indigo-800"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Ajouter</span>
              </button>
            </div>

            {events.length === 0 ? (
              <p className="text-xs text-slate-500 dark:text-slate-400 italic p-3 bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800">
                Aucun événement particulier enregistré pour ce jour.
              </p>
            ) : (
              <div className="space-y-2">
                {events.map((evt) => (
                  <div
                    key={evt.id}
                    className="flex items-start justify-between p-3 bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800 text-xs"
                  >
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-bold text-slate-900 dark:text-white capitalize">
                          {evt.category}
                        </span>
                        <span className="text-[11px] text-slate-500 dark:text-slate-400">
                          Pour : <strong>{evt.target}</strong>
                        </span>

                        {/* Badge Assigné à / Responsable */}
                        {evt.assignedTo && (
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold flex items-center gap-1.5 border ${
                              evt.assignedTo === 'Clément'
                                ? 'bg-blue-50 dark:bg-blue-950/70 border-blue-200 dark:border-blue-800 text-blue-800 dark:text-blue-300'
                                : evt.assignedTo === 'Irène'
                                ? 'bg-pink-50 dark:bg-pink-950/70 border-pink-200 dark:border-pink-800 text-pink-800 dark:text-pink-300'
                                : 'bg-purple-50 dark:bg-purple-950/70 border-purple-200 dark:border-purple-800 text-purple-800 dark:text-purple-300'
                            }`}
                          >
                            <span
                              className={`w-3.5 h-3.5 rounded-full text-white text-[8px] font-extrabold flex items-center justify-center shrink-0 ${
                                evt.assignedTo === 'Clément'
                                  ? 'bg-blue-600'
                                  : evt.assignedTo === 'Irène'
                                  ? 'bg-pink-600'
                                  : 'bg-purple-600'
                              }`}
                            >
                              {evt.assignedTo === 'Clément' ? 'C' : evt.assignedTo === 'Irène' ? 'I' : '2'}
                            </span>
                            <span>Assigné à : <strong>{evt.assignedTo}</strong></span>
                          </span>
                        )}

                        {evt.reminderMinutes !== undefined && evt.reminderMinutes > 0 && (
                          <span className="px-1.5 py-0.5 bg-indigo-50 dark:bg-indigo-950/70 text-indigo-700 dark:text-indigo-300 text-[10px] rounded font-semibold border border-indigo-200 dark:border-indigo-800 flex items-center gap-0.5">
                            ⏰ {evt.reminderMinutes} min
                          </span>
                        )}
                        {evt.notifySpouse && (
                          <span className="px-1.5 py-0.5 bg-amber-50 dark:bg-amber-950 text-amber-700 dark:text-amber-300 text-[10px] rounded font-semibold border border-amber-200 dark:border-amber-800">
                            Alerte conjoint
                          </span>
                        )}
                      </div>
                      {evt.customTitle && (
                        <p className="text-slate-700 dark:text-slate-300 font-medium mt-0.5">
                          {evt.customTitle}
                        </p>
                      )}
                      <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400 mt-1">
                        <Clock className="w-3 h-3 text-slate-400" />
                        <span className="font-mono">{evt.startTime} - {evt.endTime}</span>
                        {evt.notes && <span>· {evt.notes}</span>}
                      </div>
                    </div>

                    <button
                      onClick={() => onDeleteEvent(evt.id)}
                      title="Supprimer cet événement"
                      className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 flex items-center justify-between">
          <span className="text-xs text-slate-500 dark:text-slate-400">
            NTAHUB · Synchronisation automatique Clément & Irène
          </span>
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-white bg-slate-900 dark:bg-slate-800 hover:bg-slate-800 dark:hover:bg-slate-700 rounded-lg transition-colors border border-transparent dark:border-slate-700"
          >
            Fermer
          </button>
        </div>
      </div>
    </div>
  );
};
