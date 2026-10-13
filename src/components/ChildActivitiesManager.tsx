import React, { useState, useEffect } from 'react';
import {
  Plus,
  Trash2,
  Edit2,
  AlertCircle,
  CheckCircle2,
  MapPin,
  Clock,
  Sparkles,
} from 'lucide-react';
import {
  ChildActivity,
  PncDayDuty,
  IreneDayOverride,
  FamilyEvent,
  AppSettings,
} from '../types';
import { checkChildActivityConflict } from '../utils/availability';

interface ChildActivitiesManagerProps {
  activities: ChildActivity[];
  onSaveActivity: (activity: ChildActivity) => void;
  onDeleteActivity: (id: string) => void;
  pncDuties: Map<string, PncDayDuty>;
  ireneOverrides: Map<string, IreneDayOverride>;
  events: FamilyEvent[];
  settings?: AppSettings;
}

const DAYS_NAMES = [
  'Dimanche',
  'Lundi',
  'Mardi',
  'Mercredi',
  'Jeudi',
  'Vendredi',
  'Samedi',
];

const PRESET_COLORS = [
  { label: 'Rose / Rouge (Imanzi)', hex: '#E11D48' },
  { label: 'Violet / Lavande (Ishema)', hex: '#7C3AED' },
  { label: 'Bleu Océan', hex: '#2563EB' },
  { label: 'Émeraude', hex: '#059669' },
  { label: 'Ambre / Soleil', hex: '#D97706' },
  { label: 'Indigo Royal', hex: '#4F46E5' },
];

export const ChildActivitiesManager: React.FC<ChildActivitiesManagerProps> = ({
  activities,
  onSaveActivity,
  onDeleteActivity,
  pncDuties,
  ireneOverrides,
  events,
  settings,
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  // Fermeture via la touche Échap
  useEffect(() => {
    if (!isModalOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsModalOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isModalOpen]);

  // Verrouillage du scroll arrière-plan
  useEffect(() => {
    if (isModalOpen) {
      const originalOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = originalOverflow;
      };
    }
  }, [isModalOpen]);

  const [childName, setChildName] = useState<'Imanzi' | 'Ishema' | string>('Imanzi');
  const [activityName, setActivityName] = useState('');
  const [dayOfWeek, setDayOfWeek] = useState<number>(3); // Mercredi
  const [startTime, setStartTime] = useState('14:00');
  const [endTime, setEndTime] = useState('15:30');
  const [color, setColor] = useState('#E11D48');
  const [location, setLocation] = useState('');
  const [notes, setNotes] = useState('');

  const openNew = () => {
    setEditingId(null);
    setChildName('Imanzi');
    setActivityName('');
    setDayOfWeek(3);
    setStartTime('14:00');
    setEndTime('15:30');
    setColor('#E11D48');
    setLocation('');
    setNotes('');
    setIsModalOpen(true);
  };

  const openEdit = (act: ChildActivity) => {
    setEditingId(act.id);
    setChildName(act.childName);
    setActivityName(act.activityName);
    setDayOfWeek(act.dayOfWeek);
    setStartTime(act.startTime);
    setEndTime(act.endTime);
    setColor(act.color);
    setLocation(act.location || '');
    setNotes(act.notes || '');
    setIsModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activityName.trim()) return;

    onSaveActivity({
      id: editingId || `act-${Date.now()}`,
      childName,
      activityName: activityName.trim(),
      dayOfWeek,
      startTime,
      endTime,
      color,
      location: location.trim() || undefined,
      notes: notes.trim() || undefined,
    });

    setIsModalOpen(false);
  };

  // Group by child
  const imanziActivities = activities.filter((a) => a.childName === 'Imanzi');
  const ishemaActivities = activities.filter((a) => a.childName === 'Ishema');
  const otherActivities = activities.filter(
    (a) => a.childName !== 'Imanzi' && a.childName !== 'Ishema'
  );

  return (
    <div className="space-y-6">
      {/* Top Banner explanation */}
      <div className="bg-gradient-to-r from-amber-500/10 via-rose-500/10 to-indigo-500/10 dark:from-amber-500/5 dark:via-rose-500/5 dark:to-indigo-500/5 rounded-xl p-5 border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xl">👶</span>
            <h1 className="text-base font-bold text-slate-900 dark:text-white">
              Activités régulières des Enfants (Imanzi & Ishema)
            </h1>
          </div>
          <p className="text-xs text-slate-600 dark:text-slate-300 max-w-2xl leading-relaxed">
            Chaque enfant possède son trait de couleur sur le calendrier. Lorsque ni Clément (en vol / découcher / cours) ni Irène (au bureau avec temps de trajet) n'est disponible pour emmener ou récupérer un enfant, l'émoji <strong className="text-rose-600 dark:text-rose-400">❓</strong> apparaît automatiquement pour signaler qu'un relais est nécessaire !
          </p>
        </div>

        <button
          onClick={openNew}
          className="flex items-center gap-2 px-4 py-2.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-sm transition-colors whitespace-nowrap self-start md:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Nouvelle activité</span>
        </button>
      </div>

      {/* Grid of children activities */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* IMANZI */}
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs p-5 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
            <div className="flex items-center gap-2.5">
              <span
                className="w-3.5 h-3.5 rounded-full inline-block"
                style={{ backgroundColor: '#E11D48' }}
              />
              <h2 className="text-sm font-bold text-slate-900 dark:text-white">
                Imanzi
              </h2>
            </div>
            <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">
              {imanziActivities.length} activité{imanziActivities.length > 1 ? 's' : ''}
            </span>
          </div>

          {imanziActivities.length === 0 ? (
            <p className="text-xs text-slate-400 dark:text-slate-500 italic py-6 text-center">
              Aucune activité configurée pour Imanzi.
            </p>
          ) : (
            <div className="space-y-3">
              {imanziActivities.map((act) => (
                <div
                  key={act.id}
                  className="p-3.5 bg-slate-50/70 dark:bg-slate-800/60 rounded-lg border border-slate-200 dark:border-slate-700/60 hover:border-slate-300 dark:hover:border-slate-600 transition-colors"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <span
                          className="w-2 h-4 rounded-full"
                          style={{ backgroundColor: act.color }}
                        />
                        <span className="text-xs font-bold text-slate-900 dark:text-white">
                          {act.activityName}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-300 mt-1.5 ml-4">
                        <Clock className="w-3.5 h-3.5 text-slate-400" />
                        <span className="font-semibold text-slate-800 dark:text-slate-200">
                          {DAYS_NAMES[act.dayOfWeek]}
                        </span>
                        <span className="font-mono tabular-nums">
                          {act.startTime} - {act.endTime}
                        </span>
                      </div>
                      {act.location && (
                        <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400 mt-1 ml-4">
                          <MapPin className="w-3.5 h-3.5 text-slate-400" />
                          <span>{act.location}</span>
                        </div>
                      )}
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => openEdit(act)}
                        className="p-1.5 text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-white dark:hover:bg-slate-700 rounded-md transition-colors"
                        title="Modifier"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => onDeleteActivity(act.id)}
                        className="p-1.5 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-white dark:hover:bg-slate-700 rounded-md transition-colors"
                        title="Supprimer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* ISHEMA */}
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs p-5 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
            <div className="flex items-center gap-2.5">
              <span
                className="w-3.5 h-3.5 rounded-full inline-block"
                style={{ backgroundColor: '#7C3AED' }}
              />
              <h2 className="text-sm font-bold text-slate-900 dark:text-white">
                Ishema
              </h2>
            </div>
            <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">
              {ishemaActivities.length} activité{ishemaActivities.length > 1 ? 's' : ''}
            </span>
          </div>

          {ishemaActivities.length === 0 ? (
            <p className="text-xs text-slate-400 dark:text-slate-500 italic py-6 text-center">
              Aucune activité configurée pour Ishema.
            </p>
          ) : (
            <div className="space-y-3">
              {ishemaActivities.map((act) => (
                <div
                  key={act.id}
                  className="p-3.5 bg-slate-50/70 dark:bg-slate-800/60 rounded-lg border border-slate-200 dark:border-slate-700/60 hover:border-slate-300 dark:hover:border-slate-600 transition-colors"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <span
                          className="w-2 h-4 rounded-full"
                          style={{ backgroundColor: act.color }}
                        />
                        <span className="text-xs font-bold text-slate-900 dark:text-white">
                          {act.activityName}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-300 mt-1.5 ml-4">
                        <Clock className="w-3.5 h-3.5 text-slate-400" />
                        <span className="font-semibold text-slate-800 dark:text-slate-200">
                          {DAYS_NAMES[act.dayOfWeek]}
                        </span>
                        <span className="font-mono tabular-nums">
                          {act.startTime} - {act.endTime}
                        </span>
                      </div>
                      {act.location && (
                        <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400 mt-1 ml-4">
                          <MapPin className="w-3.5 h-3.5 text-slate-400" />
                          <span>{act.location}</span>
                        </div>
                      )}
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => openEdit(act)}
                        className="p-1.5 text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-white dark:hover:bg-slate-700 rounded-md transition-colors"
                        title="Modifier"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => onDeleteActivity(act.id)}
                        className="p-1.5 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-white dark:hover:bg-slate-700 rounded-md transition-colors"
                        title="Supprimer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Modal Add / Edit */}
      {isModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setIsModalOpen(false);
            }
          }}
        >
          <div
            className="bg-white dark:bg-slate-900 rounded-xl shadow-xl border border-slate-200 dark:border-slate-800 w-full max-w-md max-h-[90vh] flex flex-col overflow-hidden my-auto"
            role="dialog"
            aria-modal="true"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-950/50 shrink-0">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                {editingId ? "Modifier l'activité" : "Ajouter une activité enfant"}
              </h3>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                aria-label="Fermer la fenêtre"
                title="Fermer (Échap)"
                className="p-1 rounded-md text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmit} className="flex-1 flex flex-col min-h-0 overflow-hidden">
              <div className="flex-1 overflow-y-auto p-6 space-y-4 overscroll-contain">
              {/* Enfant */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Enfant
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setChildName('Imanzi');
                      setColor('#E11D48');
                    }}
                    className={`py-2 text-xs font-semibold rounded-lg border text-center transition-all ${
                      childName === 'Imanzi'
                        ? 'bg-rose-50 dark:bg-rose-950/40 border-rose-500 text-rose-700 dark:text-rose-300 shadow-xs'
                        : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    🌸 Imanzi
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setChildName('Ishema');
                      setColor('#7C3AED');
                    }}
                    className={`py-2 text-xs font-semibold rounded-lg border text-center transition-all ${
                      childName === 'Ishema'
                        ? 'bg-purple-50 dark:bg-purple-950/40 border-purple-500 text-purple-700 dark:text-purple-300 shadow-xs'
                        : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    💜 Ishema
                  </button>
                </div>
              </div>

              {/* Nom de l'activité */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Nom de l'activité
                </label>
                <input
                  type="text"
                  required
                  value={activityName}
                  onChange={(e) => setActivityName(e.target.value)}
                  placeholder="Ex: Judo, Danse, Natation, Musique..."
                  className="w-full px-3 py-2 text-sm border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600"
                />
              </div>

              {/* Jour de la semaine */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Jour de la semaine
                </label>
                <select
                  value={dayOfWeek}
                  onChange={(e) => setDayOfWeek(parseInt(e.target.value, 10))}
                  className="w-full px-3 py-2 text-sm border border-slate-300 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                >
                  <option value={1}>Lundi</option>
                  <option value={2}>Mardi</option>
                  <option value={3}>Mercredi</option>
                  <option value={4}>Jeudi</option>
                  <option value={5}>Vendredi</option>
                  <option value={6}>Samedi</option>
                  <option value={0}>Dimanche</option>
                </select>
              </div>

              {/* Horaires */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Heure début
                  </label>
                  <input
                    type="time"
                    required
                    value={startTime}
                    onChange={(e) => setStartTime(e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-slate-300 dark:border-slate-700 rounded-lg font-mono bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Heure fin
                  </label>
                  <input
                    type="time"
                    required
                    value={endTime}
                    onChange={(e) => setEndTime(e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-slate-300 dark:border-slate-700 rounded-lg font-mono bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              {/* Couleur */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Couleur du trait / indicateur
                </label>
                <div className="flex items-center gap-2">
                  {PRESET_COLORS.map((c) => (
                    <button
                      key={c.hex}
                      type="button"
                      onClick={() => setColor(c.hex)}
                      className={`w-7 h-7 rounded-full border-2 transition-transform ${
                        color === c.hex ? 'border-slate-900 dark:border-white scale-110' : 'border-transparent'
                      }`}
                      style={{ backgroundColor: c.hex }}
                      title={c.label}
                    />
                  ))}
                  <input
                    type="color"
                    value={color}
                    onChange={(e) => setColor(e.target.value)}
                    className="w-7 h-7 rounded cursor-pointer border border-slate-300 dark:border-slate-700 p-0"
                    title="Choisir une couleur sur mesure"
                  />
                </div>
              </div>

              {/* Lieu */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Lieu (facultatif)
                </label>
                <input
                  type="text"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder="Ex: Dojo municipal, Conservatoire..."
                  className="w-full px-3 py-2 text-sm border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600"
                />
              </div>

              </div>

              {/* Action buttons (Footer fixe) */}
              <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/50 shrink-0">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 rounded-lg transition-colors"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 rounded-lg shadow-sm transition-colors"
                >
                  Enregistrer
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
