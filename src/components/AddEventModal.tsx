import React, { useState, useEffect } from 'react';
import { X, Bell, Calendar as CalendarIcon, Clock } from 'lucide-react';
import { EventCategory, EventTarget, FamilyEvent, UserProfile, ReminderOption, EventAssignee } from '../types';

interface AddEventModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (event: Omit<FamilyEvent, 'id' | 'createdAt'>) => void;
  currentUser: UserProfile;
  initialDate?: string;
  defaultReminderMinutes?: ReminderOption;
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
  defaultReminderMinutes = 30,
}) => {
  const [category, setCategory] = useState<EventCategory>('rdv médical');
  const [target, setTarget] = useState<EventTarget>('toute la famille');
  const [assignedTo, setAssignedTo] = useState<EventAssignee | undefined>(undefined);
  const [customTitle, setCustomTitle] = useState('');
  const [date, setDate] = useState(initialDate || new Date().toISOString().substring(0, 10));
  const [startTime, setStartTime] = useState('18:00');
  const [endTime, setEndTime] = useState('19:00');
  const [reminderMinutes, setReminderMinutes] = useState<ReminderOption>(defaultReminderMinutes);
  const [notifySpouse, setNotifySpouse] = useState(true);
  const [notes, setNotes] = useState('');

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

  // Verrouillage du scroll arrière-plan pendant que le modal est ouvert
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
    onSave({
      category,
      target,
      assignedTo,
      customTitle: customTitle.trim() || undefined,
      date,
      startTime,
      endTime,
      reminderMinutes,
      notifySpouse,
      createdBy: currentUser,
      notes: notes.trim() || undefined,
    });
    onClose();
  };

  const otherUser = currentUser === 'Clément' ? 'Irène' : 'Clément';

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
        className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 w-full max-w-lg max-h-[90vh] sm:max-h-[85vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150 my-auto"
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-add-event-title"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header (fixe) */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-950/60 shrink-0">
          <div>
            <h2 id="modal-add-event-title" className="text-base font-bold text-slate-900 dark:text-white">
              Ajouter un événement familial
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Créé par {currentUser}
            </p>
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

        <form onSubmit={handleSubmit} className="flex-1 flex flex-col min-h-0 overflow-hidden">
          {/* Corps du formulaire défilant avec barre de défilement visible */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 overscroll-contain">
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

          {/* Menu déroulant Pour qui ? et Champ Assigné à */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
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

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5 flex items-center justify-between">
                <span>👤 Assigné à</span>
                <span className="text-[10px] normal-case font-normal text-slate-400">responsable</span>
              </label>
              <select
                value={assignedTo || ''}
                onChange={(e) => setAssignedTo((e.target.value as EventAssignee) || undefined)}
                className="w-full px-3.5 py-2.5 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 transition-all"
              >
                <option value="">Non assigné (commun)</option>
                <option value="Clément">Clément (PNC / Papa)</option>
                <option value="Irène">Irène (Maman)</option>
                <option value="Les deux">Les deux (Clément & Irène)</option>
              </select>
            </div>
          </div>

          {/* Boutons d'assignation rapide */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[11px] font-medium text-slate-600 dark:text-slate-400">
                Choix rapide du responsable :
              </span>
              {assignedTo && (
                <span className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400">
                  {assignedTo === 'Clément'
                    ? '🔵 Clément prend en charge'
                    : assignedTo === 'Irène'
                    ? '🟣 Irène prend en charge'
                    : '🤝 Pris en charge ensemble'}
                </span>
              )}
            </div>
            <div className="grid grid-cols-4 gap-2">
              <button
                type="button"
                onClick={() => setAssignedTo(undefined)}
                className={`px-2 py-1.5 rounded-lg border text-xs transition-all flex items-center justify-center gap-1.5 ${
                  !assignedTo
                    ? 'bg-slate-800 text-white dark:bg-slate-100 dark:text-slate-900 border-slate-800 dark:border-slate-100 font-bold shadow-2xs'
                    : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-750'
                }`}
              >
                <span>Tous / Libre</span>
              </button>

              <button
                type="button"
                onClick={() => setAssignedTo('Clément')}
                className={`px-2 py-1.5 rounded-lg border text-xs transition-all flex items-center justify-center gap-1.5 ${
                  assignedTo === 'Clément'
                    ? 'bg-blue-600 text-white border-blue-600 font-bold shadow-xs'
                    : 'bg-white dark:bg-slate-800 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800 hover:bg-blue-50/70 dark:hover:bg-blue-950/40'
                }`}
              >
                <span className="w-4 h-4 rounded-full bg-blue-600 text-white border border-white/40 text-[9px] font-extrabold flex items-center justify-center shrink-0">
                  C
                </span>
                <span>Clément</span>
              </button>

              <button
                type="button"
                onClick={() => setAssignedTo('Irène')}
                className={`px-2 py-1.5 rounded-lg border text-xs transition-all flex items-center justify-center gap-1.5 ${
                  assignedTo === 'Irène'
                    ? 'bg-pink-600 text-white border-pink-600 font-bold shadow-xs'
                    : 'bg-white dark:bg-slate-800 text-pink-700 dark:text-pink-300 border-pink-200 dark:border-pink-800 hover:bg-pink-50/70 dark:hover:bg-pink-950/40'
                }`}
              >
                <span className="w-4 h-4 rounded-full bg-pink-600 text-white border border-white/40 text-[9px] font-extrabold flex items-center justify-center shrink-0">
                  I
                </span>
                <span>Irène</span>
              </button>

              <button
                type="button"
                onClick={() => setAssignedTo('Les deux')}
                className={`px-2 py-1.5 rounded-lg border text-xs transition-all flex items-center justify-center gap-1.5 ${
                  assignedTo === 'Les deux'
                    ? 'bg-purple-600 text-white border-purple-600 font-bold shadow-xs'
                    : 'bg-white dark:bg-slate-800 text-purple-700 dark:text-purple-300 border-purple-200 dark:border-purple-800 hover:bg-purple-50/70 dark:hover:bg-purple-950/40'
                }`}
              >
                <span className="flex -space-x-1 shrink-0">
                  <span className="w-3.5 h-3.5 rounded-full bg-blue-600 text-white text-[8px] font-bold flex items-center justify-center">
                    C
                  </span>
                  <span className="w-3.5 h-3.5 rounded-full bg-pink-600 text-white text-[8px] font-bold flex items-center justify-center">
                    I
                  </span>
                </span>
                <span>Les deux</span>
              </button>
            </div>
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

          {/* Rappel avant l'événement */}
          <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
            <div className="flex items-center justify-between mb-2">
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                ⏰ Rappel avant l'événement
              </label>
              <span className="text-[11px] text-slate-500 dark:text-slate-400">
                {reminderMinutes === 0
                  ? 'Aucun rappel'
                  : `Notification ${reminderMinutes} min avant`}
              </span>
            </div>
            <div className="grid grid-cols-4 gap-2">
              {[
                { val: 0 as ReminderOption, label: 'Désactivé', sub: 'Pas de rappel' },
                { val: 15 as ReminderOption, label: '15 min', sub: 'Avant' },
                { val: 30 as ReminderOption, label: '30 min', sub: 'Idéal' },
                { val: 60 as ReminderOption, label: '60 min', sub: '1 heure avant' },
              ].map((opt) => (
                <button
                  key={opt.val}
                  type="button"
                  onClick={() => setReminderMinutes(opt.val)}
                  className={`p-2 rounded-lg border text-center transition-all ${
                    reminderMinutes === opt.val
                      ? 'bg-indigo-600 text-white border-indigo-600 font-semibold shadow-xs'
                      : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-750'
                  }`}
                >
                  <div className="text-xs font-bold leading-tight">{opt.label}</div>
                  <div className={`text-[10px] ${reminderMinutes === opt.val ? 'text-indigo-100' : 'text-slate-400'}`}>
                    {opt.sub}
                  </div>
                </button>
              ))}
            </div>
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

          </div>

          {/* Action buttons (Pied de page fixe, toujours accessible) */}
          <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-950/60 shrink-0">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 rounded-lg transition-colors"
            >
              Annuler
            </button>
            <button
              type="submit"
              className="px-5 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 rounded-lg transition-colors shadow-sm"
            >
              Enregistrer l'événement
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
