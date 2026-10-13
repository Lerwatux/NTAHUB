import React, { useState } from 'react';
import {
  X,
  StickyNote,
  Pin,
  Trash2,
  Plus,
  Send,
  Sparkles,
  Filter,
  CheckCircle2,
} from 'lucide-react';
import { QuickNote, PostItColor, UserProfile } from '../types';

interface QuickNotesDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  notes: QuickNote[];
  currentUser: UserProfile;
  onAddNote: (note: Omit<QuickNote, 'id' | 'createdAt'>) => void;
  onDeleteNote: (id: string) => void;
  onTogglePin: (id: string) => void;
  onClearAllNotes?: () => void;
}

const COLOR_CONFIG: Record<
  PostItColor,
  {
    name: string;
    bg: string;
    darkBg: string;
    border: string;
    darkBorder: string;
    text: string;
    darkText: string;
    chip: string;
    pinColor: string;
  }
> = {
  yellow: {
    name: 'Citron',
    bg: 'bg-amber-100/95',
    darkBg: 'dark:bg-amber-950/40',
    border: 'border-amber-300',
    darkBorder: 'dark:border-amber-700/60',
    text: 'text-amber-950',
    darkText: 'dark:text-amber-100',
    chip: 'bg-amber-300',
    pinColor: 'text-amber-600 dark:text-amber-400',
  },
  pink: {
    name: 'Rose',
    bg: 'bg-pink-100/95',
    darkBg: 'dark:bg-pink-950/40',
    border: 'border-pink-300',
    darkBorder: 'dark:border-pink-700/60',
    text: 'text-pink-950',
    darkText: 'dark:text-pink-100',
    chip: 'bg-pink-300',
    pinColor: 'text-pink-600 dark:text-pink-400',
  },
  blue: {
    name: 'Azur',
    bg: 'bg-sky-100/95',
    darkBg: 'dark:bg-sky-950/40',
    border: 'border-sky-300',
    darkBorder: 'dark:border-sky-700/60',
    text: 'text-sky-950',
    darkText: 'dark:text-sky-100',
    chip: 'bg-sky-300',
    pinColor: 'text-sky-600 dark:text-sky-400',
  },
  green: {
    name: 'Menthe',
    bg: 'bg-emerald-100/95',
    darkBg: 'dark:bg-emerald-950/40',
    border: 'border-emerald-300',
    darkBorder: 'dark:border-emerald-700/60',
    text: 'text-emerald-950',
    darkText: 'dark:text-emerald-100',
    chip: 'bg-emerald-300',
    pinColor: 'text-emerald-600 dark:text-emerald-400',
  },
  purple: {
    name: 'Lilas',
    bg: 'bg-purple-100/95',
    darkBg: 'dark:bg-purple-950/40',
    border: 'border-purple-300',
    darkBorder: 'dark:border-purple-700/60',
    text: 'text-purple-950',
    darkText: 'dark:text-purple-100',
    chip: 'bg-purple-300',
    pinColor: 'text-purple-600 dark:text-purple-400',
  },
  amber: {
    name: 'Pêche',
    bg: 'bg-orange-100/95',
    darkBg: 'dark:bg-orange-950/40',
    border: 'border-orange-300',
    darkBorder: 'dark:border-orange-700/60',
    text: 'text-orange-950',
    darkText: 'dark:text-orange-100',
    chip: 'bg-orange-300',
    pinColor: 'text-orange-600 dark:text-orange-400',
  },
};

function formatRelativeTime(dateString: string): string {
  try {
    const d = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - d.getTime();
    const diffMins = Math.floor(diffMs / 60000);

    if (diffMins < 2) return 'À l’instant';
    if (diffMins < 60) return `Il y a ${diffMins} min`;

    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) {
      const timeStr = d.toLocaleTimeString('fr-FR', {
        hour: '2-digit',
        minute: '2-digit',
      });
      return `Aujourd’hui à ${timeStr}`;
    }

    const diffDays = Math.floor(diffHours / 24);
    if (diffDays === 1) {
      const timeStr = d.toLocaleTimeString('fr-FR', {
        hour: '2-digit',
        minute: '2-digit',
      });
      return `Hier à ${timeStr}`;
    }

    return d.toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return 'Récemment';
  }
}

export const QuickNotesDrawer: React.FC<QuickNotesDrawerProps> = ({
  isOpen,
  onClose,
  notes,
  currentUser,
  onAddNote,
  onDeleteNote,
  onTogglePin,
  onClearAllNotes,
}) => {
  const [content, setContent] = useState('');
  const [selectedAuthor, setSelectedAuthor] = useState<UserProfile>(currentUser);
  const [selectedColor, setSelectedColor] = useState<PostItColor>('yellow');
  const [isPinned, setIsPinned] = useState(false);
  const [filter, setFilter] = useState<'all' | 'mine' | 'pinned'>('all');
  const [isFormExpanded, setIsFormExpanded] = useState(true);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim()) return;

    onAddNote({
      author: selectedAuthor,
      content: content.trim(),
      color: selectedColor,
      pinned: isPinned,
    });

    setContent('');
    setIsPinned(false);
  };

  // Filter notes
  const filteredNotes = notes
    .filter((note) => {
      if (filter === 'mine') return note.author === currentUser;
      if (filter === 'pinned') return note.pinned;
      return true;
    })
    .sort((a, b) => {
      // Pinned first
      if (a.pinned && !b.pinned) return -1;
      if (!a.pinned && b.pinned) return 1;
      // Newest first
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });

  const pinnedCount = notes.filter((n) => n.pinned).length;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-slate-900/50 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="absolute inset-y-0 right-0 max-w-full flex pl-6 sm:pl-10">
        <div className="w-screen max-w-md sm:max-w-lg bg-white dark:bg-slate-900 shadow-2xl flex flex-col border-l border-slate-200 dark:border-slate-800 animate-in slide-in-from-right duration-250">
          {/* Header */}
          <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-amber-50/70 dark:bg-slate-950">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-amber-500 text-white flex items-center justify-center shadow-xs">
                <StickyNote className="w-4 h-4" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-base font-bold text-slate-900 dark:text-white">
                    Notes Rapides
                  </h2>
                  <span className="px-2 py-0.5 text-[11px] font-semibold rounded-full bg-amber-200 dark:bg-amber-900/50 text-amber-800 dark:text-amber-300">
                    {notes.length} post-it{notes.length > 1 ? 's' : ''}
                  </span>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Messages & pense-bêtes partagés pour Clément & Irène
                </p>
              </div>
            </div>

            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-200/60 dark:hover:bg-slate-800 transition-colors"
              aria-label="Fermer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Form to write a new note */}
          <div className="p-4 bg-slate-50/90 dark:bg-slate-900/80 border-b border-slate-200 dark:border-slate-800">
            <form onSubmit={handleSubmit} className="space-y-3">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold text-slate-600 dark:text-slate-300">
                    Auteur :
                  </span>
                  <div className="inline-flex rounded-lg p-0.5 bg-slate-200 dark:bg-slate-800 text-xs font-medium">
                    <button
                      type="button"
                      onClick={() => setSelectedAuthor('Clément')}
                      className={`px-2.5 py-1 rounded-md transition-all ${
                        selectedAuthor === 'Clément'
                          ? 'bg-blue-600 text-white font-semibold shadow-xs'
                          : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                      }`}
                    >
                      Clément ✈️
                    </button>
                    <button
                      type="button"
                      onClick={() => setSelectedAuthor('Irène')}
                      className={`px-2.5 py-1 rounded-md transition-all ${
                        selectedAuthor === 'Irène'
                          ? 'bg-rose-600 text-white font-semibold shadow-xs'
                          : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                      }`}
                    >
                      Irène 💼
                    </button>
                  </div>
                </div>

                {/* Color picker */}
                <div className="flex items-center gap-1.5">
                  {(Object.keys(COLOR_CONFIG) as PostItColor[]).map((c) => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setSelectedColor(c)}
                      title={`Couleur ${COLOR_CONFIG[c].name}`}
                      className={`w-5 h-5 rounded-full ${COLOR_CONFIG[c].chip} transition-transform ${
                        selectedColor === c
                          ? 'ring-2 ring-indigo-600 dark:ring-indigo-400 scale-110 shadow-xs'
                          : 'opacity-70 hover:opacity-100 hover:scale-105'
                      }`}
                    />
                  ))}
                </div>
              </div>

              {/* Textarea */}
              <div className="relative">
                <textarea
                  rows={2}
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder={`Laisser un mot rapide pour ${
                    selectedAuthor === 'Clément' ? 'Irène' : 'Clément'
                  } (rappel vol, course, judo, mot doux...)...`}
                  className="w-full text-sm rounded-xl p-3 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-amber-500 text-slate-800 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 resize-none shadow-xs"
                />
              </div>

              {/* Action bar */}
              <div className="flex items-center justify-between gap-2 pt-0.5">
                <button
                  type="button"
                  onClick={() => setIsPinned(!isPinned)}
                  className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium border transition-colors ${
                    isPinned
                      ? 'bg-amber-100 dark:bg-amber-950/60 border-amber-300 dark:border-amber-700 text-amber-800 dark:text-amber-200'
                      : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700'
                  }`}
                >
                  <Pin
                    className={`w-3.5 h-3.5 ${
                      isPinned ? 'fill-amber-600 dark:fill-amber-400 text-amber-600' : ''
                    }`}
                  />
                  <span>Épingler en haut</span>
                </button>

                <button
                  type="submit"
                  disabled={!content.trim()}
                  className="flex items-center gap-1.5 px-4 py-1.5 text-xs font-semibold text-white bg-amber-500 hover:bg-amber-600 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg shadow-xs transition-colors"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Coller le Post-it</span>
                </button>
              </div>
            </form>
          </div>

          {/* Filter Bar */}
          <div className="px-4 py-2 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs bg-white dark:bg-slate-900">
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => setFilter('all')}
                className={`px-2.5 py-1 rounded-md font-medium transition-colors ${
                  filter === 'all'
                    ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-semibold'
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                Tous ({notes.length})
              </button>
              <button
                onClick={() => setFilter('mine')}
                className={`px-2.5 py-1 rounded-md font-medium transition-colors ${
                  filter === 'mine'
                    ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-semibold'
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                Par moi
              </button>
              <button
                onClick={() => setFilter('pinned')}
                className={`flex items-center gap-1 px-2.5 py-1 rounded-md font-medium transition-colors ${
                  filter === 'pinned'
                    ? 'bg-amber-500 text-white font-semibold'
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                <Pin className="w-3 h-3" />
                <span>Épinglés ({pinnedCount})</span>
              </button>
            </div>

            {notes.length > 0 && onClearAllNotes && (
              <button
                onClick={() => {
                  if (confirm('Supprimer toutes les notes rapides ?')) {
                    onClearAllNotes();
                  }
                }}
                className="text-[11px] text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 transition-colors"
              >
                Tout effacer
              </button>
            )}
          </div>

          {/* Post-it Board / List */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3.5 bg-slate-100/60 dark:bg-slate-950/60">
            {filteredNotes.length === 0 ? (
              <div className="h-64 flex flex-col items-center justify-center text-center p-6 border-2 border-dashed border-slate-300 dark:border-slate-800 rounded-2xl bg-white/50 dark:bg-slate-900/40">
                <div className="w-12 h-12 rounded-full bg-amber-100 dark:bg-amber-950/50 flex items-center justify-center text-amber-500 mb-3">
                  <StickyNote className="w-6 h-6" />
                </div>
                <p className="text-sm font-semibold text-slate-800 dark:text-white">
                  Aucune note rapide ici
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400 max-w-xs mt-1">
                  Écrivez ci-dessus un rappel rapide pour Clément ou Irène. Il apparaîtra instantanément comme un Post-it !
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-3.5">
                {filteredNotes.map((note, index) => {
                  const cfg = COLOR_CONFIG[note.color] || COLOR_CONFIG.yellow;
                  const isAuthorCurrent = note.author === currentUser;

                  return (
                    <div
                      key={note.id}
                      className={`relative group rounded-xl p-4 border shadow-sm transition-all duration-200 hover:shadow-md hover:-translate-y-0.5 ${cfg.bg} ${cfg.darkBg} ${cfg.border} ${cfg.darkBorder} ${cfg.text} ${cfg.darkText}`}
                    >
                      {/* Faux ruban adhésif / scotch Post-It en haut */}
                      <div className="absolute -top-1.5 left-1/2 -translate-x-1/2 w-12 h-3 bg-white/50 dark:bg-white/10 rounded-xs shadow-2xs backdrop-blur-2xs transform -rotate-1 pointer-events-none" />

                      {/* Header du Post-it */}
                      <div className="flex items-center justify-between gap-2 mb-2">
                        <div className="flex items-center gap-1.5">
                          {/* Pin button */}
                          <button
                            type="button"
                            onClick={() => onTogglePin(note.id)}
                            title={note.pinned ? 'Détacher le post-it' : 'Épingler en haut'}
                            className={`p-1 rounded-md transition-colors ${
                              note.pinned
                                ? 'bg-amber-200/80 dark:bg-amber-800/60 text-amber-800 dark:text-amber-200'
                                : 'opacity-40 hover:opacity-100 hover:bg-black/5 dark:hover:bg-white/10'
                            }`}
                          >
                            <Pin
                              className={`w-3.5 h-3.5 ${
                                note.pinned ? 'fill-current' : ''
                              }`}
                            />
                          </button>

                          {/* Badge Auteur */}
                          <span
                            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold ${
                              note.author === 'Clément'
                                ? 'bg-blue-200/80 dark:bg-blue-900/60 text-blue-900 dark:text-blue-100'
                                : 'bg-rose-200/80 dark:bg-rose-900/60 text-rose-900 dark:text-rose-100'
                            }`}
                          >
                            <span>{note.author}</span>
                            <span className="text-[10px]">
                              {note.author === 'Clément' ? '✈️' : '💼'}
                            </span>
                          </span>
                        </div>

                        {/* Timestamp & Trash action */}
                        <div className="flex items-center gap-1">
                          <span className="text-[11px] opacity-60 font-medium">
                            {formatRelativeTime(note.createdAt)}
                          </span>

                          <button
                            type="button"
                            onClick={() => onDeleteNote(note.id)}
                            title="Froisser & jeter ce post-it"
                            className="p-1 rounded-md opacity-40 hover:opacity-100 hover:text-rose-600 hover:bg-black/5 dark:hover:bg-white/10 transition-all ml-1"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                      {/* Contenu du Post-It */}
                      <p className="text-sm font-medium leading-relaxed whitespace-pre-wrap select-text">
                        {note.content}
                      </p>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Footer information */}
          <div className="p-3 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-center text-xs text-slate-500 dark:text-slate-400">
            <span>💡 Post-its éphémères synchronisés entre Clément & Irène</span>
          </div>
        </div>
      </div>
    </div>
  );
};
