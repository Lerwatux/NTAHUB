import React, { useState, useEffect } from 'react';
import {
  X,
  Settings as SettingsIcon,
  Moon,
  Sun,
  Plane,
  Briefcase,
  RotateCcw,
  Check,
  Clock,
  Car,
  Bell,
  AlarmClock,
  Sparkles,
  Download,
} from 'lucide-react';
import { AppSettings, DEFAULT_SETTINGS, ReminderOption } from '../types';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: AppSettings;
  onSaveSettings: (newSettings: AppSettings) => void;
  onTriggerTestReminder?: (minutes: ReminderOption) => void;
  onOpenExportIcs?: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  settings,
  onSaveSettings,
  onTriggerTestReminder,
  onOpenExportIcs,
}) => {
  const [localSettings, setLocalSettings] = useState<AppSettings>({ ...settings });
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [testSent, setTestSent] = useState(false);

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

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSaveSettings(localSettings);
    setSavedSuccess(true);
    setTimeout(() => {
      setSavedSuccess(false);
      onClose();
    }, 600);
  };

  const handleReset = () => {
    setLocalSettings({ ...DEFAULT_SETTINGS, darkMode: localSettings.darkMode });
  };

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
        className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 w-full max-w-xl max-h-[92vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150 my-auto"
        role="dialog"
        aria-modal="true"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-950/50 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-indigo-600 text-white flex items-center justify-center shadow-xs">
              <SettingsIcon className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white">
                Réglages & Paramètres
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Personnalisation des règles horaires de Clément & Irène
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Fermer les paramètres"
            title="Fermer (Échap)"
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-200/60 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
          {/* 1. APPARENCE / MODE NUIT */}
          <section className="bg-slate-50 dark:bg-slate-800/50 rounded-xl p-4 border border-slate-200 dark:border-slate-700/60">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-lg bg-indigo-100 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-400 flex items-center justify-center">
                  {localSettings.darkMode ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
                </div>
                <div>
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-white">
                    Mode Nuit (Thème Sombre)
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Affiche une interface sombre reposante pour les yeux
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() =>
                  setLocalSettings({ ...localSettings, darkMode: !localSettings.darkMode })
                }
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${
                  localSettings.darkMode ? 'bg-indigo-600' : 'bg-slate-300 dark:bg-slate-700'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    localSettings.darkMode ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>
          </section>

          {/* 2. RÈGLES DE CLÉMENT (PNC) */}
          <section className="bg-slate-50 dark:bg-slate-800/50 rounded-xl p-4 border border-slate-200 dark:border-slate-700/60 space-y-4">
            <div className="flex items-center gap-2 text-blue-600 dark:text-blue-400">
              <Plane className="w-4 h-4" />
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-white">
                Règles de Vol & Disponibilité · Clément (PNC)
              </h3>
            </div>

            {/* Briefing avant décollage */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-200">
                  Délai de présentation au Briefing (avant décollage) :
                </label>
                <span className="font-mono font-bold text-xs text-blue-600 dark:text-blue-400">
                  {localSettings.clementBriefingMinutes} min (
                  {Math.floor(localSettings.clementBriefingMinutes / 60)}h
                  {String(localSettings.clementBriefingMinutes % 60).padStart(2, '0')})
                </span>
              </div>
              <div className="flex items-center gap-2 mb-2">
                <div className="relative flex-1">
                  <input
                    type="number"
                    min={30}
                    max={180}
                    step={5}
                    value={localSettings.clementBriefingMinutes}
                    onChange={(e) =>
                      setLocalSettings({
                        ...localSettings,
                        clementBriefingMinutes: Math.max(15, parseInt(e.target.value, 10) || 75),
                      })
                    }
                    className="w-full px-3 py-1.5 text-xs font-mono font-bold border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                  />
                  <span className="absolute right-3 top-1.5 text-xs text-slate-400">min</span>
                </div>
              </div>
              <div className="grid grid-cols-4 gap-1.5">
                {[60, 75, 90, 105].map((mins) => (
                  <button
                    key={mins}
                    type="button"
                    onClick={() =>
                      setLocalSettings({ ...localSettings, clementBriefingMinutes: mins })
                    }
                    className={`py-1 text-xs font-medium rounded-lg border text-center transition-all ${
                      localSettings.clementBriefingMinutes === mins
                        ? 'bg-blue-600 text-white border-blue-600 font-bold shadow-xs'
                        : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700'
                    }`}
                  >
                    {mins} min {mins === 75 ? '(défaut)' : ''}
                  </button>
                ))}
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1.5">
                L'heure de briefing affichée sur le calendrier sera déduite de l'horaire de décollage (ex: vol à 08h00 → briefing à 06h45).
              </p>
            </div>

            {/* Fin de journée / Retour maison après posé ORY */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-200">
                  Fin du travail & retour maison après atterrissage ORY :
                </label>
                <span className="font-mono font-bold text-xs text-blue-600 dark:text-blue-400">
                  {localSettings.clementHomeAfterLandingMinutes} min (
                  {Math.floor(localSettings.clementHomeAfterLandingMinutes / 60)}h
                  {String(localSettings.clementHomeAfterLandingMinutes % 60).padStart(2, '0')})
                </span>
              </div>
              <div className="flex items-center gap-2 mb-2">
                <div className="relative flex-1">
                  <input
                    type="number"
                    min={30}
                    max={240}
                    step={5}
                    value={localSettings.clementHomeAfterLandingMinutes}
                    onChange={(e) =>
                      setLocalSettings({
                        ...localSettings,
                        clementHomeAfterLandingMinutes: Math.max(15, parseInt(e.target.value, 10) || 90),
                      })
                    }
                    className="w-full px-3 py-1.5 text-xs font-mono font-bold border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                  />
                  <span className="absolute right-3 top-1.5 text-xs text-slate-400">min</span>
                </div>
              </div>
              <div className="grid grid-cols-4 gap-1.5">
                {[60, 75, 90, 120].map((mins) => (
                  <button
                    key={mins}
                    type="button"
                    onClick={() =>
                      setLocalSettings({
                        ...localSettings,
                        clementHomeAfterLandingMinutes: mins,
                      })
                    }
                    className={`py-1 text-xs font-medium rounded-lg border text-center transition-all ${
                      localSettings.clementHomeAfterLandingMinutes === mins
                        ? 'bg-blue-600 text-white border-blue-600 font-bold shadow-xs'
                        : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700'
                    }`}
                  >
                    {mins} min {mins === 90 ? '(défaut)' : ''}
                  </button>
                ))}
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1.5">
                Compte le temps de débarquement, formalités et trajet retour pour vous déclarer libre à la maison.
              </p>
            </div>

            {/* Trajet retour cours au sol */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-200">
                  Temps de trajet retour après cours au sol (CS_CSS) :
                </label>
                <span className="font-mono font-bold text-xs text-purple-600 dark:text-purple-400">
                  {localSettings.clementGroundCourseTravelMinutes} min
                </span>
              </div>
              <div className="flex items-center gap-2 mb-2">
                <div className="relative flex-1">
                  <input
                    type="number"
                    min={15}
                    max={240}
                    step={5}
                    value={localSettings.clementGroundCourseTravelMinutes}
                    onChange={(e) =>
                      setLocalSettings({
                        ...localSettings,
                        clementGroundCourseTravelMinutes: Math.max(15, parseInt(e.target.value, 10) || 90),
                      })
                    }
                    className="w-full px-3 py-1.5 text-xs font-mono font-bold border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                  />
                  <span className="absolute right-3 top-1.5 text-xs text-slate-400">min</span>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-1.5">
                {[60, 90, 120].map((mins) => (
                  <button
                    key={mins}
                    type="button"
                    onClick={() =>
                      setLocalSettings({
                        ...localSettings,
                        clementGroundCourseTravelMinutes: mins,
                      })
                    }
                    className={`py-1 text-xs font-medium rounded-lg border text-center transition-all ${
                      localSettings.clementGroundCourseTravelMinutes === mins
                        ? 'bg-purple-600 text-white border-purple-600 font-bold shadow-xs'
                        : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700'
                    }`}
                  >
                    {mins} min
                  </button>
                ))}
              </div>
            </div>
          </section>

          {/* 3. RÈGLES D'IRÈNE (TRAVAIL & TRAJET) */}
          <section className="bg-slate-50 dark:bg-slate-800/50 rounded-xl p-4 border border-slate-200 dark:border-slate-700/60 space-y-4">
            <div className="flex items-center gap-2 text-pink-600 dark:text-pink-400">
              <Briefcase className="w-4 h-4" />
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-white">
                Règles de Travail & Trajets · Irène
              </h3>
            </div>

            {/* Horaires de bureau et fin de travail */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-200 mb-1">
                  Début au Bureau :
                </label>
                <input
                  type="time"
                  value={localSettings.ireneWorkStart}
                  onChange={(e) =>
                    setLocalSettings({ ...localSettings, ireneWorkStart: e.target.value })
                  }
                  className="w-full px-3 py-1.5 text-xs font-mono border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-bold"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-200 mb-1">
                  Fin du Travail au Bureau :
                </label>
                <input
                  type="time"
                  value={localSettings.ireneWorkEnd}
                  onChange={(e) =>
                    setLocalSettings({ ...localSettings, ireneWorkEnd: e.target.value })
                  }
                  className="w-full px-3 py-1.5 text-xs font-mono border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-bold"
                />
              </div>
            </div>

            {/* Temps de trajets aller et retour */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-200">
                    Trajet Aller (Maison → Bureau) :
                  </label>
                  <span className="font-mono font-bold text-xs text-pink-600 dark:text-pink-400">
                    {localSettings.ireneCommuteGoMinutes} min
                  </span>
                </div>
                <div className="flex items-center gap-1.5 mb-2">
                  <input
                    type="number"
                    min={15}
                    max={240}
                    step={5}
                    value={localSettings.ireneCommuteGoMinutes}
                    onChange={(e) =>
                      setLocalSettings({
                        ...localSettings,
                        ireneCommuteGoMinutes: Math.max(10, parseInt(e.target.value, 10) || 90),
                      })
                    }
                    className="w-full px-3 py-1.5 text-xs font-mono font-bold border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                  />
                  <span className="text-xs text-slate-500 shrink-0">min</span>
                </div>
                <div className="grid grid-cols-3 gap-1">
                  {[60, 90, 120].map((mins) => (
                    <button
                      key={mins}
                      type="button"
                      onClick={() =>
                        setLocalSettings({ ...localSettings, ireneCommuteGoMinutes: mins })
                      }
                      className={`py-1 text-[11px] rounded border transition-colors ${
                        localSettings.ireneCommuteGoMinutes === mins
                          ? 'bg-pink-600 text-white border-pink-600 font-bold'
                          : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700'
                      }`}
                    >
                      {mins} min
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-200">
                    Trajet Retour (Bureau → Maison) :
                  </label>
                  <span className="font-mono font-bold text-xs text-pink-600 dark:text-pink-400">
                    {localSettings.ireneCommuteReturnMinutes} min
                  </span>
                </div>
                <div className="flex items-center gap-1.5 mb-2">
                  <input
                    type="number"
                    min={15}
                    max={240}
                    step={5}
                    value={localSettings.ireneCommuteReturnMinutes}
                    onChange={(e) =>
                      setLocalSettings({
                        ...localSettings,
                        ireneCommuteReturnMinutes: Math.max(10, parseInt(e.target.value, 10) || 90),
                      })
                    }
                    className="w-full px-3 py-1.5 text-xs font-mono font-bold border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                  />
                  <span className="text-xs text-slate-500 shrink-0">min</span>
                </div>
                <div className="grid grid-cols-3 gap-1">
                  {[60, 90, 120].map((mins) => (
                    <button
                      key={mins}
                      type="button"
                      onClick={() =>
                        setLocalSettings({ ...localSettings, ireneCommuteReturnMinutes: mins })
                      }
                      className={`py-1 text-[11px] rounded border transition-colors ${
                        localSettings.ireneCommuteReturnMinutes === mins
                          ? 'bg-pink-600 text-white border-pink-600 font-bold'
                          : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700'
                      }`}
                    >
                      {mins} min
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Horaires Télétravail (TT) */}
            <div className="pt-2 border-t border-slate-200/70 dark:border-slate-700/50">
              <span className="block text-xs font-semibold text-slate-700 dark:text-slate-200 mb-2">
                Horaires en Télétravail (TT - Maison, 0 trajet) :
              </span>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] text-slate-500 dark:text-slate-400 mb-1">
                    Début TT :
                  </label>
                  <input
                    type="time"
                    value={localSettings.ireneTtWorkStart}
                    onChange={(e) =>
                      setLocalSettings({ ...localSettings, ireneTtWorkStart: e.target.value })
                    }
                    className="w-full px-3 py-1.5 text-xs font-mono border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-[11px] text-slate-500 dark:text-slate-400 mb-1">
                    Fin TT :
                  </label>
                  <input
                    type="time"
                    value={localSettings.ireneTtWorkEnd}
                    onChange={(e) =>
                      setLocalSettings({ ...localSettings, ireneTtWorkEnd: e.target.value })
                    }
                    className="w-full px-3 py-1.5 text-xs font-mono border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                  />
                </div>
              </div>
            </div>
          </section>

          {/* 4. SYSTÈME DE RAPPELS CONFIGURABLES (15, 30, 60 MIN) */}
          <section className="bg-slate-50 dark:bg-slate-800/50 rounded-xl p-4 border border-slate-200 dark:border-slate-700/60 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-amber-600 dark:text-amber-400">
                <AlarmClock className="w-4 h-4" />
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-white">
                  Système de Rappels Configurables
                </h3>
              </div>
              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300">
                15 · 30 · 60 min
              </span>
            </div>

            <p className="text-xs text-slate-500 dark:text-slate-400">
              Déclenche des notifications internes automatisées pour vous prévenir avant le départ d'une activité, d'un événement ou d'un vol.
            </p>

            {/* Rappel Vols PNC */}
            <div className="p-3 bg-white dark:bg-slate-800/80 rounded-lg border border-slate-200 dark:border-slate-700 space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Plane className="w-3.5 h-3.5 text-indigo-500" />
                  <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                    Rappel avant vol PNC (Briefing Orly) :
                  </span>
                </div>
                <span className="text-xs font-mono font-bold text-indigo-600 dark:text-indigo-400">
                  {localSettings.flightReminderMinutes === 0
                    ? 'Désactivé'
                    : `${localSettings.flightReminderMinutes} min avant`}
                </span>
              </div>
              <div className="grid grid-cols-4 gap-1.5">
                {([0, 15, 30, 60] as ReminderOption[]).map((mins) => (
                  <button
                    key={`flight-${mins}`}
                    type="button"
                    onClick={() =>
                      setLocalSettings({ ...localSettings, flightReminderMinutes: mins })
                    }
                    className={`py-1 text-xs rounded-lg border transition-all ${
                      localSettings.flightReminderMinutes === mins
                        ? 'bg-indigo-600 text-white border-indigo-600 font-bold shadow-xs'
                        : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    {mins === 0 ? 'Off' : `${mins} min`}
                  </button>
                ))}
              </div>
            </div>

            {/* Rappel Activités Enfants */}
            <div className="p-3 bg-white dark:bg-slate-800/80 rounded-lg border border-slate-200 dark:border-slate-700 space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Clock className="w-3.5 h-3.5 text-pink-500" />
                  <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                    Rappel activités enfants (Imanzi & Ishema) :
                  </span>
                </div>
                <span className="text-xs font-mono font-bold text-pink-600 dark:text-pink-400">
                  {localSettings.activityReminderMinutes === 0
                    ? 'Désactivé'
                    : `${localSettings.activityReminderMinutes} min avant`}
                </span>
              </div>
              <div className="grid grid-cols-4 gap-1.5">
                {([0, 15, 30, 60] as ReminderOption[]).map((mins) => (
                  <button
                    key={`act-${mins}`}
                    type="button"
                    onClick={() =>
                      setLocalSettings({ ...localSettings, activityReminderMinutes: mins })
                    }
                    className={`py-1 text-xs rounded-lg border transition-all ${
                      localSettings.activityReminderMinutes === mins
                        ? 'bg-pink-600 text-white border-pink-600 font-bold shadow-xs'
                        : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    {mins === 0 ? 'Off' : `${mins} min`}
                  </button>
                ))}
              </div>
            </div>

            {/* Rappel par défaut Événements Familiaux */}
            <div className="p-3 bg-white dark:bg-slate-800/80 rounded-lg border border-slate-200 dark:border-slate-700 space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Bell className="w-3.5 h-3.5 text-amber-500" />
                  <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                    Délai de rappel par défaut pour nouveaux événements :
                  </span>
                </div>
                <span className="text-xs font-mono font-bold text-amber-600 dark:text-amber-400">
                  {localSettings.eventDefaultReminderMinutes === 0
                    ? 'Désactivé'
                    : `${localSettings.eventDefaultReminderMinutes} min avant`}
                </span>
              </div>
              <div className="grid grid-cols-4 gap-1.5">
                {([0, 15, 30, 60] as ReminderOption[]).map((mins) => (
                  <button
                    key={`evt-${mins}`}
                    type="button"
                    onClick={() =>
                      setLocalSettings({ ...localSettings, eventDefaultReminderMinutes: mins })
                    }
                    className={`py-1 text-xs rounded-lg border transition-all ${
                      localSettings.eventDefaultReminderMinutes === mins
                        ? 'bg-amber-600 text-white border-amber-600 font-bold shadow-xs'
                        : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    {mins === 0 ? 'Off' : `${mins} min`}
                  </button>
                ))}
              </div>
            </div>

            {/* Bouton Test de Rappel Immédiat */}
            {onTriggerTestReminder && (
              <div className="pt-2 flex items-center justify-between bg-amber-50/70 dark:bg-amber-950/30 p-2.5 rounded-lg border border-amber-200/70 dark:border-amber-900/50">
                <div>
                  <span className="text-xs font-semibold text-amber-900 dark:text-amber-200 block">
                    Tester une notification de rappel
                  </span>
                  <span className="text-[11px] text-amber-700/80 dark:text-amber-400/80">
                    Envoie immédiatement une alerte interne d'exemple dans votre cloche
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    onTriggerTestReminder(localSettings.eventDefaultReminderMinutes || 30);
                    setTestSent(true);
                    setTimeout(() => setTestSent(false), 2500);
                  }}
                  className="px-3 py-1.5 text-xs font-semibold bg-amber-600 hover:bg-amber-700 text-white rounded-lg shadow-xs transition-colors shrink-0 flex items-center gap-1.5"
                >
                  {testSent ? (
                    <>
                      <Check className="w-3.5 h-3.5" />
                      <span>Envoyé !</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>Tester (30 min)</span>
                    </>
                  )}
                </button>
              </div>
            )}
          </section>

          {/* 5. EXPORT VERS UN AGENDA EXTERNE (.ics) */}
          {onOpenExportIcs && (
            <section className="bg-slate-50 dark:bg-slate-800/50 rounded-xl p-4 border border-slate-200 dark:border-slate-700/60 space-y-3">
              <div className="flex items-center gap-2 text-indigo-600 dark:text-indigo-400">
                <Download className="w-4 h-4" />
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-white">
                  Exporter vers un agenda
                </h3>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Télécharge les événements familiaux au format .ics pour les ajouter à Google Agenda, Outlook ou Apple Calendar.
              </p>
              <button
                type="button"
                onClick={onOpenExportIcs}
                className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-indigo-700 dark:text-indigo-300 bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-800 rounded-lg hover:bg-indigo-100 dark:hover:bg-indigo-900/60 transition-colors"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Exporter .ics</span>
              </button>
            </section>
          )}
        </form>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 flex items-center justify-between">
          <button
            type="button"
            onClick={handleReset}
            className="flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Réinitialiser les règles par défaut</span>
          </button>

          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:text-slate-900 bg-slate-100 dark:bg-slate-800 rounded-lg transition-colors"
            >
              Annuler
            </button>
            <button
              onClick={handleSubmit}
              className="flex items-center gap-1.5 px-5 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-sm transition-all"
            >
              {savedSuccess ? (
                <>
                  <Check className="w-3.5 h-3.5 text-white" />
                  <span>Enregistré !</span>
                </>
              ) : (
                <span>Enregistrer les réglages</span>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
