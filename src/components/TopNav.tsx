import React from 'react';
import {
  Calendar as CalendarIcon,
  CalendarDays,
  Users,
  Clock,
  Plane,
  Bell,
  Plus,
  ArrowRightLeft,
  Settings as SettingsIcon,
  Moon,
  Sun,
  StickyNote,
} from 'lucide-react';
import { UserProfile, AppNotification } from '../types';
import { FamilyLogo } from './FamilyLogo';
import { NtahubWordmark } from './NtahubWordmark';

interface TopNavProps {
  currentView: 'calendar' | 'week' | 'activities' | 'freemoments' | 'pnc';
  onViewChange: (view: 'calendar' | 'week' | 'activities' | 'freemoments' | 'pnc') => void;
  currentUser: UserProfile;
  onSwitchUser: () => void;
  onOpenAddEvent: () => void;
  onOpenNotifications: () => void;
  onOpenQuickNotes: () => void;
  quickNotesCount: number;
  onOpenSettings: () => void;
  darkMode: boolean;
  onToggleDarkMode: () => void;
  notifications: AppNotification[];
}

export const TopNav: React.FC<TopNavProps> = ({
  currentView,
  onViewChange,
  currentUser,
  onSwitchUser,
  onOpenAddEvent,
  onOpenNotifications,
  onOpenQuickNotes,
  quickNotesCount,
  onOpenSettings,
  darkMode,
  onToggleDarkMode,
  notifications,
}) => {
  const unreadCount = notifications.filter(
    (n) => n.recipient === currentUser && !n.isRead
  ).length;

  const navItems = [
    { view: 'calendar' as const, label: 'Calendrier', shortLabel: 'Mois', Icon: CalendarIcon },
    { view: 'week' as const, label: 'Semaine', shortLabel: 'Semaine', Icon: CalendarDays },
    { view: 'activities' as const, label: 'Activités Enfants', shortLabel: 'Enfants', Icon: Users },
    { view: 'freemoments' as const, label: 'Moments Libres', shortLabel: 'Dispos', Icon: Clock },
    { view: 'pnc' as const, label: 'Planning PNC (ICS)', shortLabel: 'PNC', Icon: Plane },
  ];

  const iconButton =
    'relative p-2 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors';

  return (
    <>
      <header className="sticky top-0 z-40 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 transition-colors pt-[env(safe-area-inset-top)]">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between gap-2 xl:gap-6 h-14 sm:h-16">
            {/* Zone 1: Logos */}
            <div className="flex items-center gap-3 shrink-0 min-w-0">
              <button
                onClick={() => onViewChange('calendar')}
                className="text-left group flex items-center gap-1.5 sm:gap-2.5 px-2 py-1.5 -mx-2 -my-1.5 rounded-xl focus:outline-none cursor-pointer transform transition-all duration-300 ease-out origin-left hover:scale-[1.05] hover:bg-slate-100/70 dark:hover:bg-slate-800/50 active:scale-[0.98] select-none"
                title="Retour au calendrier NTAHUB"
              >
                <FamilyLogo className="h-8 sm:h-10 w-auto transform transition-all duration-300 ease-out group-hover:scale-105 shrink-0" />
                <div className="flex flex-col">
                  <span className="tracking-tight flex items-center">
                    <NtahubWordmark height={0} className="h-[22px] sm:h-[33px] w-auto transform transition-transform duration-300 ease-out group-hover:scale-[1.03]" />
                  </span>
                  <span className="text-[10px] tracking-wide text-slate-500 dark:text-slate-400 font-medium -mt-1 hidden sm:inline transition-colors duration-300 group-hover:text-indigo-600 dark:group-hover:text-indigo-400">
                    L'Appli Famille
                  </span>
                </div>
              </button>
            </div>

            {/* Zone 2: Navigation (grand écran uniquement) */}
            <nav className="hidden xl:flex items-center gap-5 2xl:gap-6 text-sm font-medium text-slate-600 dark:text-slate-300">
              {navItems.map(({ view, label, shortLabel, Icon }) => (
                <button
                  key={view}
                  onClick={() => onViewChange(view)}
                  className={`flex items-center gap-2 py-1 transition-colors whitespace-nowrap shrink-0 border-b-2 ${
                    currentView === view
                      ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400 font-semibold'
                      : 'border-transparent hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span className="2xl:hidden">{shortLabel}</span>
                  <span className="hidden 2xl:inline">{label}</span>
                </button>
              ))}
            </nav>

            {/* Zone 3: Profil + Notifications + Réglages + Thème + Ajouter */}
            <div className="flex items-center gap-1 sm:gap-2.5 shrink-0">
              {/* User Profile Switcher */}
              <button
                onClick={onSwitchUser}
                title={`Changer de profil (Actuel : ${currentUser})`}
                className="flex items-center gap-1.5 sm:gap-2 px-2 sm:px-3 py-1.5 text-xs font-medium rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700/80 transition-colors text-slate-700 dark:text-slate-200 whitespace-nowrap"
              >
                <span className="w-2 h-2 rounded-full bg-emerald-500" />
                <span className="font-semibold">{currentUser}</span>
                <span className="hidden sm:inline text-slate-400 dark:text-slate-400 text-[11px]">
                  {currentUser === 'Clément' ? '(PNC)' : '(Travail)'}
                </span>
                <ArrowRightLeft className="hidden sm:inline w-3.5 h-3.5 text-slate-400 ml-1" />
              </button>

              {/* Notification Bell */}
              <button
                onClick={onOpenNotifications}
                className={iconButton}
                title="Centre de notifications et alertes conjoint"
                aria-label="Notifications"
              >
                <Bell className="w-4 h-4" />
                {unreadCount > 0 && (
                  <span className="absolute top-1 right-1 flex h-4 w-4 items-center justify-center rounded-full bg-rose-600 text-[10px] font-bold text-white shadow">
                    {unreadCount}
                  </span>
                )}
              </button>

              {/* Notes Rapides (Post-it) — sur mobile, accessibles via le bouton flottant */}
              <button
                onClick={onOpenQuickNotes}
                className="relative hidden sm:inline-flex p-2 text-slate-600 dark:text-slate-300 hover:text-amber-600 dark:hover:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-950/40 rounded-lg transition-colors group"
                title="Notes Rapides & Pense-bêtes (Post-it Clément & Irène)"
                aria-label="Notes Rapides"
              >
                <StickyNote className="w-4 h-4 group-hover:scale-110 transition-transform" />
                {quickNotesCount > 0 && (
                  <span className="absolute top-1 right-1 flex h-4 w-4 items-center justify-center rounded-full bg-amber-500 text-[10px] font-bold text-white shadow">
                    {quickNotesCount}
                  </span>
                )}
              </button>

              {/* Mode Nuit / Dark Mode Toggle Button (juste le symbole) */}
              <button
                onClick={onToggleDarkMode}
                className={iconButton}
                title={darkMode ? 'Passer en mode jour' : 'Passer en mode nuit'}
                aria-label="Mode nuit"
              >
                {darkMode ? (
                  <Sun className="w-4 h-4 text-amber-400" />
                ) : (
                  <Moon className="w-4 h-4 text-slate-600" />
                )}
              </button>

              {/* Bouton Réglages (juste le symbole) */}
              <button
                onClick={onOpenSettings}
                className={iconButton}
                title="Réglages (temps de trajet, briefing, fin de travail)"
                aria-label="Réglages"
              >
                <SettingsIcon className="w-4 h-4" />
              </button>

              {/* Add Event Primary Button */}
              <button
                onClick={onOpenAddEvent}
                className="flex items-center gap-1.5 p-2 sm:px-3.5 sm:py-2 text-xs font-semibold text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 transition-colors shadow-sm whitespace-nowrap"
                aria-label="Ajouter un événement"
              >
                <Plus className="w-4 h-4 sm:w-3.5 sm:h-3.5" />
                <span className="hidden sm:inline">Ajouter événement</span>
              </button>
            </div>
          </div>

          {/* Tablette : barre d'onglets sous l'en-tête */}
          <nav className="hidden md:flex xl:hidden items-center justify-around py-2 border-t border-slate-100 dark:border-slate-800 text-sm font-medium text-slate-600 dark:text-slate-300">
            {navItems.map(({ view, shortLabel, Icon }) => (
              <button
                key={view}
                onClick={() => onViewChange(view)}
                className={`flex items-center gap-1.5 px-2 py-1 rounded-lg transition-colors ${
                  currentView === view
                    ? 'text-indigo-600 dark:text-indigo-400 font-semibold bg-indigo-50 dark:bg-indigo-950/40'
                    : 'hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{shortLabel}</span>
              </button>
            ))}
          </nav>
        </div>
      </header>

      {/* Téléphone : barre d'onglets fixée en bas de l'écran */}
      <nav
        className="md:hidden fixed bottom-0 inset-x-0 z-40 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-t border-slate-200 dark:border-slate-800 pb-[env(safe-area-inset-bottom)]"
        aria-label="Navigation principale"
      >
        <div className="grid grid-cols-5">
          {navItems.map(({ view, shortLabel, Icon }) => (
            <button
              key={view}
              onClick={() => onViewChange(view)}
              className={`flex flex-col items-center justify-center gap-0.5 h-14 text-[11px] font-medium transition-colors ${
                currentView === view
                  ? 'text-indigo-600 dark:text-indigo-400 font-semibold'
                  : 'text-slate-500 dark:text-slate-400'
              }`}
              aria-current={currentView === view ? 'page' : undefined}
            >
              <Icon className="w-5 h-5" />
              <span>{shortLabel}</span>
            </button>
          ))}
        </div>
      </nav>
    </>
  );
};
