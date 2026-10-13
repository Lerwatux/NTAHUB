import React, { useState, useEffect } from 'react';
import {
  X,
  Download,
  Calendar,
  CheckCircle2,
  Clock,
  ShieldCheck,
  FileText,
  HelpCircle,
  ExternalLink,
} from 'lucide-react';
import { FamilyEvent } from '../types';
import { generateFamilyEventsIcs, downloadIcsFile } from '../utils/icsExporter';

interface ExportIcsModalProps {
  isOpen: boolean;
  onClose: () => void;
  events: FamilyEvent[];
  currentMonthName?: string;
  currentMonthDates?: string[]; // Date strings in current view
}

export const ExportIcsModal: React.FC<ExportIcsModalProps> = ({
  isOpen,
  onClose,
  events,
  currentMonthName,
  currentMonthDates,
}) => {
  const [filterType, setFilterType] = useState<'all' | 'current_month' | 'clement' | 'irene'>('all');
  const [downloadSuccess, setDownloadSuccess] = useState(false);

  // Close on Escape key
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

  // Lock body scroll
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

  // Filter events based on user selection
  const filteredEvents = events.filter((e) => {
    if (filterType === 'current_month' && currentMonthDates && currentMonthDates.length > 0) {
      return currentMonthDates.includes(e.date);
    }
    if (filterType === 'clement') {
      return e.assignedTo === 'Clément' || e.target === 'Clément' || e.assignedTo === 'Les deux';
    }
    if (filterType === 'irene') {
      return e.assignedTo === 'Irène' || e.target === 'Irène' || e.assignedTo === 'Les deux';
    }
    return true;
  });

  const handleDownload = () => {
    const calendarTitle =
      filterType === 'clement'
        ? 'NTAHUB - Événements Clément'
        : filterType === 'irene'
        ? 'NTAHUB - Événements Irène'
        : 'NTAHUB - Événements Familiaux';

    const filename =
      filterType === 'clement'
        ? 'ntahub-evenements-clement.ics'
        : filterType === 'irene'
        ? 'ntahub-evenements-irene.ics'
        : 'ntahub-evenements-famille.ics';

    const icsContent = generateFamilyEventsIcs(filteredEvents, calendarTitle);
    downloadIcsFile(icsContent, filename);

    setDownloadSuccess(true);
    setTimeout(() => {
      setDownloadSuccess(false);
    }, 4000);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto animate-in fade-in duration-150"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
    >
      <div
        className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 w-full max-w-lg max-h-[90vh] sm:max-h-[85vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-150 my-auto"
        role="dialog"
        aria-modal="true"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-950/60 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-indigo-600 text-white flex items-center justify-center shadow-xs">
              <Download className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white">
                Exporter vers Google Agenda & Outlook
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Génération d'un fichier standard <strong>.ics</strong> (iCalendar RFC 5545)
              </p>
            </div>
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

        {/* Content (Scrollable) */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4 overscroll-contain">
          {/* Success Banner */}
          {downloadSuccess && (
            <div className="p-3 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 rounded-xl flex items-center gap-2.5 text-emerald-900 dark:text-emerald-200 text-xs animate-in fade-in">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0" />
              <div>
                <strong className="font-bold">Téléchargement lancé avec succès !</strong>
                <p className="text-[11px] text-emerald-800/90 dark:text-emerald-300/90">
                  Votre fichier .ics a été enregistré dans vos Téléchargements.
                </p>
              </div>
            </div>
          )}

          {/* Scope selection */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2">
              Périmètre des événements à exporter
            </label>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <button
                type="button"
                onClick={() => setFilterType('all')}
                className={`p-2.5 rounded-lg border text-left transition-all ${
                  filterType === 'all'
                    ? 'bg-indigo-50 dark:bg-indigo-950/60 border-indigo-600 text-indigo-950 dark:text-indigo-200 font-bold ring-1 ring-indigo-600'
                    : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span>Tous les événements</span>
                  <span className="text-[11px] px-1.5 py-0.5 rounded-full bg-indigo-200/60 dark:bg-indigo-900 text-indigo-800 dark:text-indigo-200 font-bold">
                    {events.length}
                  </span>
                </div>
                <span className="text-[10px] text-slate-500 dark:text-slate-400 block mt-0.5 font-normal">
                  Planning complet NTAHUB
                </span>
              </button>

              {currentMonthName && (
                <button
                  type="button"
                  onClick={() => setFilterType('current_month')}
                  className={`p-2.5 rounded-lg border text-left transition-all ${
                    filterType === 'current_month'
                      ? 'bg-indigo-50 dark:bg-indigo-950/60 border-indigo-600 text-indigo-950 dark:text-indigo-200 font-bold ring-1 ring-indigo-600'
                      : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="capitalize">{currentMonthName}</span>
                    <span className="text-[11px] px-1.5 py-0.5 rounded-full bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-slate-200 font-bold">
                      {
                        events.filter(
                          (e) => currentMonthDates && currentMonthDates.includes(e.date)
                        ).length
                      }
                    </span>
                  </div>
                  <span className="text-[10px] text-slate-500 dark:text-slate-400 block mt-0.5 font-normal">
                    Mois actif affiché
                  </span>
                </button>
              )}

              <button
                type="button"
                onClick={() => setFilterType('clement')}
                className={`p-2.5 rounded-lg border text-left transition-all ${
                  filterType === 'clement'
                    ? 'bg-blue-50 dark:bg-blue-950/60 border-blue-600 text-blue-950 dark:text-blue-200 font-bold ring-1 ring-blue-600'
                    : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span>Clément</span>
                  <span className="text-[11px] px-1.5 py-0.5 rounded-full bg-blue-200/60 dark:bg-blue-900 text-blue-800 dark:text-blue-200 font-bold">
                    {
                      events.filter(
                        (e) =>
                          e.assignedTo === 'Clément' ||
                          e.target === 'Clément' ||
                          e.assignedTo === 'Les deux'
                      ).length
                    }
                  </span>
                </div>
                <span className="text-[10px] text-slate-500 dark:text-slate-400 block mt-0.5 font-normal">
                  Événements de Clément
                </span>
              </button>

              <button
                type="button"
                onClick={() => setFilterType('irene')}
                className={`p-2.5 rounded-lg border text-left transition-all ${
                  filterType === 'irene'
                    ? 'bg-pink-50 dark:bg-pink-950/60 border-pink-600 text-pink-950 dark:text-pink-200 font-bold ring-1 ring-pink-600'
                    : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span>Irène</span>
                  <span className="text-[11px] px-1.5 py-0.5 rounded-full bg-pink-200/60 dark:bg-pink-900 text-pink-800 dark:text-pink-200 font-bold">
                    {
                      events.filter(
                        (e) =>
                          e.assignedTo === 'Irène' ||
                          e.target === 'Irène' ||
                          e.assignedTo === 'Les deux'
                      ).length
                    }
                  </span>
                </div>
                <span className="text-[10px] text-slate-500 dark:text-slate-400 block mt-0.5 font-normal">
                  Événements d'Irène
                </span>
              </button>
            </div>
          </div>

          {/* Features list */}
          <div className="bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800 rounded-xl p-3.5 space-y-2 text-xs text-slate-600 dark:text-slate-300">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-indigo-600 dark:text-indigo-400 shrink-0" />
              <span>
                <strong>Fuseau horaire garanti :</strong> Heure locale Paris (Europe/Paris) avec respect des heures d'été/hiver.
              </span>
            </div>
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
              <span>
                <strong>Rappels & Alertes :</strong> Les rappels 15, 30 ou 60 minutes configurés sont inclus via balises <code>VALARM</code>.
              </span>
            </div>
            <div className="flex items-center gap-2">
              <FileText className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0" />
              <span>
                <strong>Détails & Assignations :</strong> Inclut le responsable désigné, pour qui, les notes et l'auteur.
              </span>
            </div>
          </div>

          {/* Quick Import Instructions Guide */}
          <div className="border border-slate-200 dark:border-slate-800 rounded-xl p-3 bg-white dark:bg-slate-900">
            <h4 className="text-xs font-bold text-slate-900 dark:text-white mb-2 flex items-center gap-1.5">
              <HelpCircle className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
              <span>Comment importer dans votre calendrier ?</span>
            </h4>
            <div className="space-y-1.5 text-[11px] text-slate-600 dark:text-slate-400">
              <div className="flex items-start gap-1.5">
                <span className="font-bold text-indigo-600 dark:text-indigo-400 shrink-0">1.</span>
                <span>
                  <strong>Google Agenda :</strong> Ouvrez calendar.google.com &gt; Cliquez sur l'engrenage ⚙️ <em>Paramètres</em> &gt; <em>Importer et exporter</em> &gt; Sélectionnez le fichier téléchargé.
                </span>
              </div>
              <div className="flex items-start gap-1.5">
                <span className="font-bold text-indigo-600 dark:text-indigo-400 shrink-0">2.</span>
                <span>
                  <strong>Outlook / Office 365 :</strong> <em>Fichier</em> &gt; <em>Ouvrir et exporter</em> &gt; <em>Importer/Exporter</em> &gt; <em>Importer un fichier iCalendar (.ics)</em>.
                </span>
              </div>
              <div className="flex items-start gap-1.5">
                <span className="font-bold text-indigo-600 dark:text-indigo-400 shrink-0">3.</span>
                <span>
                  <strong>Apple Calendar (Mac/iPhone) :</strong> Double-cliquez directement sur le fichier pour l'ajouter en 1 clic.
                </span>
              </div>
            </div>
          </div>

        </div>

        {/* Action Buttons (Footer fixe) */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-950/60 shrink-0">
          <span className="text-xs text-slate-500 dark:text-slate-400">
            {filteredEvents.length} événement{filteredEvents.length > 1 ? 's' : ''} sélectionné{filteredEvents.length > 1 ? 's' : ''}
          </span>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-2 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 rounded-lg transition-colors"
            >
              Fermer
            </button>

            <button
              type="button"
              onClick={handleDownload}
              disabled={filteredEvents.length === 0}
              className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg transition-colors shadow-sm"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Télécharger le fichier .ics</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
