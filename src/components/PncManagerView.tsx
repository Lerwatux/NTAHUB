import React, { useState } from 'react';
import {
  Upload,
  FileText,
  Plane,
  CheckCircle,
  AlertTriangle,
  Info,
  RotateCcw,
  Clock,
  Sparkles,
} from 'lucide-react';
import { PncDayDuty } from '../types';
import {
  parseIcsString,
  processPncEvents,
  generateSamplePncIcs,
} from '../utils/icsParser';

interface PncManagerViewProps {
  pncDuties: Map<string, PncDayDuty>;
  onImportDuties: (duties: Map<string, PncDayDuty>, rawCount: number) => void;
  onResetSample: () => void;
}

export const PncManagerView: React.FC<PncManagerViewProps> = ({
  pncDuties,
  onImportDuties,
  onResetSample,
}) => {
  const [dragActive, setDragActive] = useState(false);
  const [pasteMode, setPasteMode] = useState(false);
  const [pastedIcs, setPastedIcs] = useState('');
  const [importMessage, setImportMessage] = useState<string | null>(null);

  const handleFileUpload = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result as string;
      if (content) {
        processAndApply(content, file.name);
      }
    };
    reader.readAsText(file);
  };

  const processAndApply = (icsText: string, sourceName: string) => {
    try {
      const rawEvents = parseIcsString(icsText);
      if (rawEvents.length === 0) {
        setImportMessage("⚠️ Aucun événement VEVENT détecté dans ce fichier. Vérifiez le format .ics.");
        return;
      }
      const processed = processPncEvents(rawEvents);
      onImportDuties(processed, rawEvents.length);
      setImportMessage(
        `✅ Import réussi (${sourceName}) : ${rawEvents.length} événements bruts analysés, ${processed.size} journées de rotation programmées.`
      );
    } catch (err) {
      console.error(err);
      setImportMessage("❌ Erreur lors de l'analyse du fichier ICS. Vérifiez la syntaxe.");
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileUpload(e.dataTransfer.files[0]);
    }
  };

  // Convert map to sorted array
  const dutiesList = Array.from(pncDuties.values()).sort((a, b) =>
    a.date.localeCompare(b.date)
  );

  return (
    <div className="space-y-6">
      {/* Rules banner */}
      <div className="bg-blue-50/80 dark:bg-blue-950/40 rounded-xl p-4 sm:p-6 border border-blue-200 dark:border-blue-900 shadow-xs">
        <div className="flex items-start gap-3">
          <div className="w-8 h-8 rounded-lg bg-blue-600 text-white flex items-center justify-center shrink-0 mt-0.5">
            <Plane className="w-4 h-4" />
          </div>
          <div>
            <h1 className="text-base font-bold text-blue-900 dark:text-blue-100">
              Module Roster PNC — Clément (Base Paris Orly / ORY)
            </h1>
            <p className="text-xs text-blue-800/90 dark:text-blue-300/90 mt-1 leading-relaxed">
              Ce module interprète automatiquement les fichiers ICS de compagnie aérienne selon les règles spécifiques de votre métier :
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-3 text-xs text-blue-900 dark:text-blue-200">
              <div className="bg-white/80 dark:bg-slate-900/80 p-3 rounded-lg border border-blue-100 dark:border-blue-900/60 space-y-1">
                <span className="font-bold flex items-center gap-1.5 text-blue-950 dark:text-blue-100">
                  <Clock className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                  Conversion UTC → Heure de Paris & Briefing
                </span>
                <p className="text-slate-600 dark:text-slate-300 text-[11px]">
                  Tous les horaires UTC sont convertis en heure locale de Paris. L'heure de briefing affichée est calculée selon votre réglage (défaut 1h15 avant le décollage).
                </p>
              </div>

              <div className="bg-white/80 dark:bg-slate-900/80 p-3 rounded-lg border border-blue-100 dark:border-blue-900/60 space-y-1">
                <span className="font-bold flex items-center gap-1.5 text-blue-950 dark:text-blue-100">
                  <Plane className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                  Atterrissage à ORY & Découchers
                </span>
                <p className="text-slate-600 dark:text-slate-300 text-[11px]">
                  Vous êtes considéré libre et à la maison selon votre réglage (défaut 1h30 après le touché final à ORY). En cas de rotation avec escale ou transit sans retour maison, le découcher est pris en compte.
                </p>
              </div>

              <div className="bg-white/80 dark:bg-slate-900/80 p-3 rounded-lg border border-blue-100 dark:border-blue-900/60 space-y-1">
                <span className="font-bold flex items-center gap-1.5 text-blue-950 dark:text-blue-100">
                  <Sparkles className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" />
                  Cours au sol (CS_CSS)
                </span>
                <p className="text-slate-600 dark:text-slate-300 text-[11px]">
                  Les activités codées <code className="bg-purple-100 dark:bg-purple-900/60 text-purple-800 dark:text-purple-300 px-1 rounded">cs_css</code> sont étiquetées <strong>« Cours au sol »</strong> : début à l'heure indiquée (pas de règle briefing).
                </p>
              </div>

              <div className="bg-white/80 dark:bg-slate-900/80 p-3 rounded-lg border border-blue-100 dark:border-blue-900/60 space-y-1">
                <span className="font-bold flex items-center gap-1.5 text-blue-950 dark:text-blue-100">
                  <Info className="w-3.5 h-3.5 text-slate-600 dark:text-slate-400" />
                  Codes Couleurs & Jours Blancs
                </span>
                <p className="text-slate-600 dark:text-slate-300 text-[11px]">
                  <strong>Bleu</strong> = En vol (Briefing & Maison affichés), <strong>Vert</strong> = Jour OFF, <strong>Blanc</strong> = Jour blanc / Astreinte.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Upload Zone */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-4 sm:p-6 space-y-4">
        <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
          <Upload className="w-4 h-4 text-indigo-600" />
          <span>Importer un fichier ICS (.ics) de planning</span>
        </h2>

        {importMessage && (
          <div className="p-3 bg-indigo-50 border border-indigo-200 text-indigo-900 rounded-lg text-xs flex items-center justify-between">
            <span>{importMessage}</span>
            <button
              onClick={() => setImportMessage(null)}
              className="text-indigo-600 hover:text-indigo-900 font-bold ml-2"
            >
              ✕
            </button>
          </div>
        )}

        <div
          onDragOver={(e) => {
            e.preventDefault();
            setDragActive(true);
          }}
          onDragLeave={() => setDragActive(false)}
          onDrop={handleDrop}
          className={`border-2 border-dashed rounded-xl p-8 text-center transition-colors ${
            dragActive
              ? 'border-indigo-600 bg-indigo-50/50'
              : 'border-slate-300 hover:border-slate-400 bg-slate-50/50'
          }`}
        >
          <div className="max-w-md mx-auto space-y-3">
            <div className="w-12 h-12 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center mx-auto">
              <Upload className="w-6 h-6" />
            </div>

            <div>
              <p className="text-xs font-semibold text-slate-900">
                Glissez-déposez votre fichier ICS de rotations ici
              </p>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Compatible Air France, Transavia, Corsair, export iCal
              </p>
            </div>

            <div className="flex items-center justify-center gap-3 pt-2">
              <label className="cursor-pointer px-4 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors shadow-xs">
                <span>Parcourir mes fichiers...</span>
                <input
                  type="file"
                  accept=".ics,text/calendar"
                  className="hidden"
                  onChange={(e) => {
                    if (e.target.files && e.target.files[0]) {
                      handleFileUpload(e.target.files[0]);
                    }
                  }}
                />
              </label>

              <button
                type="button"
                onClick={() => setPasteMode(!pasteMode)}
                className="px-3.5 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 rounded-lg transition-colors"
              >
                Coller le texte brut
              </button>
            </div>
          </div>
        </div>

        {/* Quick sample loader button */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-slate-100 text-xs">
          <span className="text-slate-500">
            Besoin d'un test immédiat avec rotations représentatives ?
          </span>
          <button
            onClick={() => {
              const sample = generateSamplePncIcs();
              processAndApply(sample, 'Modèle PNC Orly');
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 rounded-lg border border-indigo-200 transition-colors"
          >
            <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
            <span>Charger le planning type PNC (Orly / FDF / CS_CSS / Repos)</span>
          </button>
        </div>

        {/* Paste Area */}
        {pasteMode && (
          <div className="pt-3 space-y-3">
            <textarea
              rows={6}
              value={pastedIcs}
              onChange={(e) => setPastedIcs(e.target.value)}
              placeholder="Collez le contenu BEGIN:VCALENDAR ... END:VCALENDAR ici"
              className="w-full p-3 font-mono text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
            />
            <button
              onClick={() => {
                if (pastedIcs.trim()) {
                  processAndApply(pastedIcs, 'Texte collé');
                  setPasteMode(false);
                  setPastedIcs('');
                }
              }}
              className="px-4 py-2 text-xs font-semibold text-white bg-slate-900 rounded-lg hover:bg-slate-800 transition-colors"
            >
              Analyser le texte ICS collé
            </button>
          </div>
        )}
      </div>

      {/* Roster Table of currently loaded duties */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden">
        <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <div>
            <h2 className="text-sm font-bold text-slate-900 dark:text-white">
              Journées de service programmées ({dutiesList.length})
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Horaires calculés en heure de Paris
            </p>
          </div>

          <button
            onClick={onResetSample}
            className="flex items-center gap-1 text-xs text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 transition-colors"
            title="Réinitialiser au planning par défaut"
          >
            <RotateCcw className="w-3 h-3" />
            <span>Réinitialiser</span>
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 dark:bg-slate-950/70 border-b border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 font-semibold">
              <tr>
                <th className="py-2.5 px-4">Date</th>
                <th className="py-2.5 px-4">Type</th>
                <th className="py-2.5 px-4">Vol / Rotation</th>
                <th className="py-2.5 px-4">Briefing (Paris)</th>
                <th className="py-2.5 px-4">Retour Maison (Paris)</th>
                <th className="py-2.5 px-4">Statut Découcher</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {dutiesList.map((duty) => (
                <tr key={duty.date} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/50 transition-colors">
                  <td className="py-3 px-4 font-mono font-bold text-slate-900 dark:text-white">
                    {duty.date}
                  </td>
                  <td className="py-3 px-4">
                    {duty.type === 'vol' && (
                      <span className="px-2 py-0.5 bg-blue-100 dark:bg-blue-950 text-blue-800 dark:text-blue-300 font-semibold rounded text-[11px]">
                        Vol
                      </span>
                    )}
                    {duty.type === 'decoucher' && (
                      <span className="px-2 py-0.5 bg-indigo-100 dark:bg-indigo-950 text-indigo-800 dark:text-indigo-300 font-semibold rounded text-[11px]">
                        Découcher
                      </span>
                    )}
                    {duty.type === 'cours_au_sol' && (
                      <span className="px-2 py-0.5 bg-purple-100 dark:bg-purple-950 text-purple-800 dark:text-purple-300 font-semibold rounded text-[11px]">
                        Cours au sol (CS_CSS)
                      </span>
                    )}
                    {duty.type === 'off' && (
                      <span className="px-2 py-0.5 bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 font-semibold rounded text-[11px]">
                        OFF (Vert)
                      </span>
                    )}
                    {duty.type === 'blanc' && (
                      <span className="px-2 py-0.5 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-semibold rounded text-[11px]">
                        Blanc
                      </span>
                    )}
                  </td>
                  <td className="py-3 px-4 font-medium text-slate-800 dark:text-slate-200">
                    {duty.title}
                  </td>
                  <td className="py-3 px-4 font-mono text-slate-700 dark:text-slate-300">
                    {duty.briefingTime ? `${duty.briefingTime}` : '—'}
                  </td>
                  <td className="py-3 px-4 font-mono text-slate-700 dark:text-slate-300">
                    {duty.freeTimeAtHome ? `${duty.freeTimeAtHome}` : '—'}
                  </td>
                  <td className="py-3 px-4 text-slate-600 dark:text-slate-400">
                    {duty.isLayover ? (
                      <span className="text-indigo-700 dark:text-indigo-400 font-semibold">
                        Découcher à {duty.layoverCity || 'Escale'}
                      </span>
                    ) : duty.type === 'vol' ? (
                      <span className="text-emerald-700 dark:text-emerald-400">
                        Retour Orly dans la journée
                      </span>
                    ) : (
                      '—'
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
