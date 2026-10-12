import React, { useState } from 'react';
import { X, Bell, Calendar as CalendarIcon, Clock } from 'lucide-react';
import { EventCategory, EventTarget, FamilyEvent, UserProfile } from '../types';

interface AddEventModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (event: Omit<FamilyEvent, 'id' | 'createdAt'>) => void;
  currentUser: UserProfile;
  initialDate?: string;
}

const CATEGORIES: { value: EventCategory; label: string; icon: string }[] = [
  { value: 'rdv médical', label: 'RDV Médical', icon: '🩺' },
  { value: 'invités', label: 'Invités', icon: '🍽️' },
  { value: 'courses', label: 'Courses', icon: '🛒' },
  { value: 'sortie', label: 'Sortie', icon: '🎭' },
  { value: 'anniversaire', label: 'Anniversaire', icon: '🎂' },
  { value: 'autre', label: 'Autre', icon: '📌' },
];

const TARGETS: { value: EventTarget; label: string }[] = [
  { value: 'toute la famille', label: 'Toute la famille' },
  { value: 'Irène', label: 'Irène' },
  { value: 'Clément', label: 'Clément' },
  { value: 'Imanzi', label: 'Imanzi' },
  { value: 'Ishema', label: 'Ishema' },
  { value: 'les enfants', label: 'Les enfants' },
];

export const AddEventModal: React.FC<AddEventModalProps> = ({
  isOpen,
  onClose,
  onSave,
  currentUser,
  initialDate,
}) => {
  const [category, setCategory] = useState<EventCategory>('rdv médical');
  const [target, setTarget] = useState<EventTarget>('toute la famille');
  const [customTitle, setCustomTitle] = useState('');
  const [date, setDate] = useState(initialDate || new Date().toISOString().substring(0, 10));
  const [startTime, setStartTime] = useState('18:00');
  const [endTime, setEndTime] = useState('19:00');
  const [notifySpouse, setNotifySpouse] = useState(true);
  const [notes, setNotes] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      category,
      target,
      customTitle: customTitle.trim() || undefined,
      date,
      startTime,
      endTime,
      notifySpouse,
      createdBy: currentUser,
      notes: notes.trim() || undefined,
    });
    onClose();
  };

  const otherUser = currentUser === 'Clément' ? 'Irène' : 'Clément';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-950/50">
          <div>
            <h2 className="text-base font-bold text-slate-900 dark:text-white">
              Ajouter un événement familial
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Créé par {currentUser}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Menu déroulant catégorie (remplace le titre libre) */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
              Type d'événement
            </label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value as EventCategory)}
              className="w-full px-3.5 py-2.5 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 transition-all"
            >
              {CATEGORIES.map((cat) => (
                <option key={cat.value} value={cat.value}>
                  {cat.icon} {cat.label}
                </option>
              ))}
            </select>
          </div>

          {/* Menu déroulant Pour qui ? */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
              Pour qui ?
            </label>
            <select
              value={target}
              onChange={(e) => setTarget(e.target.value as EventTarget)}
              className="w-full px-3.5 py-2.5 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 transition-all"
            >
              {TARGETS.map((t) => (
                <option key={t.value} value={t.value}>
                  {t.label}
                </option>
              ))}
            </select>
          </div>

          {/* Précision facultative */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
              Précision / Détail (facultatif)
            </label>
            <input
              type="text"
              value={customTitle}
              onChange={(e) => setCustomTitle(e.target.value)}
              placeholder="Ex: Dr. Martin pédiatre, Dîner chez Thomas & Sarah..."
              className="w-full px-3.5 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 transition-all"
            />
          </div>

          {/* Date */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
              Date
            </label>
            <div className="relative">
              <input
                type="date"
                required
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full pl-10 pr-3.5 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 transition-all"
              />
              <CalendarIcon className="w-4 h-4 text-slate-400 absolute left-3 top-3 pointer-events-none" />
            </div>
          </div>

          {/* Horaires début / fin */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                Heure début
              </label>
              <div className="relative">
                <input
                  type="time"
                  required
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                  className="w-full pl-9 pr-2 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 font-mono tabular-nums"
                />
                <Clock className="w-4 h-4 text-slate-400 absolute left-2.5 top-3 pointer-events-none" />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                Heure fin
              </label>
              <div className="relative">
                <input
                  type="time"
                  required
                  value={endTime}
                  onChange={(e) => setEndTime(e.target.value)}
                  className="w-full pl-9 pr-2 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 font-mono tabular-nums"
                />
                <Clock className="w-4 h-4 text-slate-400 absolute left-2.5 top-3 pointer-events-none" />
              </div>
            </div>
          </div>

          {/* Notes / Lieu */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
              Notes complémentaires
            </label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Adresse, consignes, choses à ne pas oublier..."
              className="w-full px-3.5 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 transition-all resize-none"
            />
          </div>

          {/* Toggle Prévenir l'autre utilisateur */}
          <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
            <label className="flex items-start gap-3 p-3 bg-indigo-50/60 dark:bg-indigo-950/30 rounded-lg border border-indigo-100 dark:border-indigo-900/50 cursor-pointer hover:bg-indigo-50 dark:hover:bg-indigo-950/50 transition-colors">
              <input
                type="checkbox"
                checked={notifySpouse}
                onChange={(e) => setNotifySpouse(e.target.checked)}
                className="mt-0.5 h-4 w-4 rounded border-slate-300 dark:border-slate-700 text-indigo-600 focus:ring-indigo-500"
              />
              <div className="text-xs">
                <div className="flex items-center gap-1.5 font-semibold text-indigo-900 dark:text-indigo-300">
                  <Bell className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                  <span>Prévenir l'autre utilisateur ({otherUser})</span>
                </div>
                <p className="text-indigo-700/80 dark:text-indigo-400/80 mt-0.5">
                  Génère une alerte prioritaire immédiate dans la boîte de notifications de {otherUser}.
                </p>
              </div>
            </label>
          </div>

          {/* Action buttons */}
          <div className="flex items-center justify-end gap-3 pt-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:text-slate-900 bg-slate-100 dark:bg-slate-800 rounded-lg transition-colors"
            >
              Annuler
            </button>
            <button
              type="submit"
              className="px-5 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors shadow-sm"
            >
              Enregistrer l'événement
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
