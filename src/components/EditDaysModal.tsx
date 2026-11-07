import React, { useEffect, useState } from 'react';
import { X } from 'lucide-react';
import { IreneDayOverride, PncDayDuty, UserProfile } from '../types';
import { formatFrenchDateLong } from '../utils/timezone';

export type ClementDayChange = 'off' | 'blanc' | 'conge' | 'elearning' | 'cours_au_sol';
export type IreneDayChange = 'activite' | 'libre';

interface EditDaysModalProps {
  dates: string[]; // vide : fenêtre fermée
  person: UserProfile;
  pncDuties: Map<string, PncDayDuty>;
  ireneOverrides: Map<string, IreneDayOverride>;
  defaultStart: string;
  defaultEnd: string;
  onClose: () => void;
  onApplyClement: (dates: string[], change: ClementDayChange, startTime: string, endTime: string) => void;
  onApplyIrene: (dates: string[], change: IreneDayChange, label: string, startTime: string, endTime: string) => void;
}

const CLEMENT_CHOICES: { value: ClementDayChange; label: string }[] = [
  { value: 'off', label: 'OFF' },
  { value: 'blanc', label: 'Blanc' },
  { value: 'conge', label: 'Congé annuel' },
  { value: 'elearning', label: 'E-learning' },
  { value: 'cours_au_sol', label: 'Cours au sol' },
];

const IRENE_CHOICES: { value: IreneDayChange; label: string }[] = [
  { value: 'activite', label: 'Stage ou activité' },
  { value: 'libre', label: 'Libre' },
];

const fieldClass =
  'w-full px-3 py-2 text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white';

export const EditDaysModal: React.FC<EditDaysModalProps> = ({
  dates,
  person,
  pncDuties,
  ireneOverrides,
  defaultStart,
  defaultEnd,
  onClose,
  onApplyClement,
  onApplyIrene,
}) => {
  const [activePerson, setActivePerson] = useState<UserProfile>(person);
  const [clementChange, setClementChange] = useState<ClementDayChange>('off');
  const [ireneChange, setIreneChange] = useState<IreneDayChange>('activite');
  const [label, setLabel] = useState('');
  const [startTime, setStartTime] = useState(defaultStart);
  const [endTime, setEndTime] = useState(defaultEnd);

  const isOpen = dates.length > 0;
  const firstDate = dates[0];

  // À l'ouverture, on repart de ce qui est déjà prévu ce jour-là
  useEffect(() => {
    if (!isOpen) return;
    const override = ireneOverrides.get(firstDate);
    const duty = pncDuties.get(firstDate);
    const isIreneActivity = person === 'Irène' && override?.status === 'formation';
    setActivePerson(person);
    setClementChange('off');
    setIreneChange('activite');
    setLabel(isIreneActivity ? override.module || '' : '');
    setStartTime((isIreneActivity && override.startTime) || (person === 'Clément' && duty?.type === 'cours_au_sol' && duty.briefingTime) || defaultStart);
    setEndTime((isIreneActivity && override.endTime) || defaultEnd);
  }, [isOpen, firstDate, person]);

  if (!isOpen) return null;

  const title =
    dates.length === 1
      ? formatFrenchDateLong(firstDate)
      : `${dates.length} jours, du ${formatFrenchDateLong(firstDate)} au ${formatFrenchDateLong(dates[dates.length - 1])}`;

  const needsHours =
    activePerson === 'Clément' ? clementChange === 'cours_au_sol' : ireneChange === 'activite';
  const needsLabel = activePerson === 'Irène' && ireneChange === 'activite';
  const isValid = (!needsHours || startTime < endTime) && (!needsLabel || label.trim().length > 0);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isValid) return;
    if (activePerson === 'Clément') {
      onApplyClement(dates, clementChange, startTime, endTime);
    } else {
      onApplyIrene(dates, ireneChange, label.trim(), startTime, endTime);
    }
    onClose();
  };

  const choiceClass = (selected: boolean) =>
    `px-2.5 py-2.5 text-xs font-semibold rounded-lg border transition-all ${
      selected
        ? 'bg-indigo-600 text-white border-indigo-600'
        : 'bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700'
    }`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
      <form
        onSubmit={handleSubmit}
        className="bg-white dark:bg-slate-900 rounded-2xl shadow-xl w-full max-w-md max-h-[90vh] overflow-y-auto border border-slate-200 dark:border-slate-800"
      >
        <div className="flex items-start justify-between gap-3 p-4 border-b border-slate-100 dark:border-slate-800">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
              Modifier le planning
            </p>
            <h2 className="text-base font-bold text-slate-900 dark:text-white first-letter:uppercase">{title}</h2>
          </div>
          <button type="button" onClick={onClose} className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-white rounded-lg" aria-label="Fermer">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-4 space-y-4">
          <div className="grid grid-cols-2 gap-1 p-1 bg-slate-100 dark:bg-slate-800 rounded-lg text-xs font-semibold">
            {(['Clément', 'Irène'] as UserProfile[]).map((name) => (
              <button
                key={name}
                type="button"
                onClick={() => setActivePerson(name)}
                className={`py-2 rounded-md ${
                  activePerson === name
                    ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-300'
                }`}
              >
                {name}
              </button>
            ))}
          </div>

          {activePerson === 'Clément' ? (
            <div className="grid grid-cols-2 gap-2">
              {CLEMENT_CHOICES.map((choice) => (
                <button key={choice.value} type="button" onClick={() => setClementChange(choice.value)} className={choiceClass(clementChange === choice.value)}>
                  {choice.label}
                </button>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-2">
              {IRENE_CHOICES.map((choice) => (
                <button key={choice.value} type="button" onClick={() => setIreneChange(choice.value)} className={choiceClass(ireneChange === choice.value)}>
                  {choice.label}
                </button>
              ))}
            </div>
          )}

          {needsLabel && (
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
              Nom de l'activité
              <input
                type="text"
                value={label}
                onChange={(e) => setLabel(e.target.value)}
                placeholder="Ex. : stage au spa"
                className={`${fieldClass} mt-1 font-normal`}
              />
            </label>
          )}

          {needsHours && (
            <div className="grid grid-cols-2 gap-3 text-xs font-semibold text-slate-700 dark:text-slate-300">
              <label>
                Début
                <input type="time" value={startTime} onChange={(e) => setStartTime(e.target.value)} className={`${fieldClass} mt-1`} />
              </label>
              <label>
                Fin
                <input type="time" value={endTime} onChange={(e) => setEndTime(e.target.value)} className={`${fieldClass} mt-1`} />
              </label>
            </div>
          )}

          {activePerson === 'Clément' && (
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              Remplace ce qui était prévu. Un prochain import ICS remettra les jours qu'il contient.
            </p>
          )}
        </div>

        <div className="flex justify-end gap-2 p-4 border-t border-slate-100 dark:border-slate-800">
          <button type="button" onClick={onClose} className="px-3 py-2 text-sm font-medium text-slate-600 dark:text-slate-300 rounded-lg">
            Annuler
          </button>
          <button type="submit" disabled={!isValid} className="px-4 py-2 text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 rounded-lg">
            Enregistrer
          </button>
        </div>
      </form>
    </div>
  );
};
