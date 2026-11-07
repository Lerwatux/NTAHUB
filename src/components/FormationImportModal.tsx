import React, { useState } from 'react';
import { X, FileUp, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { FormationPlanning, readFormationPdf } from '../utils/formationPdf';

interface FormationImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImport: (planning: FormationPlanning) => void;
}

export const FormationImportModal: React.FC<FormationImportModalProps> = ({ isOpen, onClose, onImport }) => {
  const [planning, setPlanning] = useState<FormationPlanning | null>(null);
  const [isReading, setIsReading] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const close = () => {
    setPlanning(null);
    setError('');
    onClose();
  };

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;

    setPlanning(null);
    setError('');
    setIsReading(true);
    try {
      setPlanning(await readFormationPdf(file));
    } catch (err) {
      console.error('Lecture du PDF impossible', err);
      setError("Ce fichier n'a pas pu être lu. Vérifiez qu'il s'agit bien du calendrier de formation en PDF.");
    } finally {
      setIsReading(false);
    }
  };

  const courseDays = planning?.days.filter((d) => d.hours > 0).length ?? 0;
  const otherDays = (planning?.days.length ?? 0) - courseDays;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-xl w-full max-w-md max-h-[90vh] overflow-y-auto border border-slate-200 dark:border-slate-800">
        <div className="flex items-center justify-between p-4 border-b border-slate-100 dark:border-slate-800">
          <h2 className="text-base font-bold text-slate-900 dark:text-white">Calendrier de formation d'Irène</h2>
          <button type="button" onClick={close} className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-white rounded-lg" aria-label="Fermer">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-4 space-y-4 text-sm text-slate-700 dark:text-slate-300">
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Le PDF est lu sur cet appareil. Vérifiez le résultat avant de l'ajouter au planning.
          </p>

          <label className="flex items-center justify-center gap-2 px-3 py-3 font-semibold text-indigo-700 dark:text-indigo-300 bg-indigo-50 dark:bg-indigo-950/60 border border-dashed border-indigo-300 dark:border-indigo-800 rounded-xl cursor-pointer">
            <FileUp className="w-4 h-4" />
            <span>{isReading ? 'Lecture en cours…' : 'Choisir le PDF'}</span>
            <input type="file" accept="application/pdf,.pdf" onChange={handleFile} disabled={isReading} className="sr-only" />
          </label>

          {error && <p className="text-xs font-medium text-rose-700 dark:text-rose-300">{error}</p>}

          {planning && (
            <div className="space-y-3">
              {planning.problems.length > 0 ? (
                <div className="p-3 rounded-lg bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-xs text-rose-800 dark:text-rose-200 space-y-1">
                  <p className="font-semibold flex items-center gap-1.5">
                    <AlertTriangle className="w-4 h-4" />
                    Le contrôle a trouvé un écart
                  </p>
                  {planning.problems.map((problem) => (
                    <p key={problem}>{problem}</p>
                  ))}
                </div>
              ) : (
                <p className="flex items-center gap-1.5 text-xs font-semibold text-emerald-700 dark:text-emerald-300">
                  <CheckCircle2 className="w-4 h-4" />
                  Tout correspond aux totaux du PDF
                </p>
              )}

              <p>
                <strong>{courseDays} jours de cours</strong>
                {otherDays > 0 && ` et ${otherDays} jours de stage`}, soit {planning.totalHours} heures.
              </p>

              <ul className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs">
                {planning.months.map((month) => (
                  <li key={`${month.label}-${month.year}`} className="flex justify-between">
                    <span>{month.label} {month.year}</span>
                    <span className="font-mono">{month.hoursRead} h</span>
                  </li>
                ))}
              </ul>

              <p className="text-xs text-slate-500 dark:text-slate-400">
                Horaires appliqués : 09:30 - 17:30 pour une journée complète, avec 1 h de trajet aller et retour.
                Ils se changent ensuite jour par jour.
              </p>

              <button
                type="button"
                disabled={planning.days.length === 0}
                onClick={() => {
                  onImport(planning);
                  close();
                }}
                className="w-full px-3 py-2.5 text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 rounded-lg"
              >
                Ajouter au planning d'Irène
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
