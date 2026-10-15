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

  return (
    <header className="sticky top-0 z-40 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between gap-8 h-16">
          {/* Zone 1: Single text wordmark */}
          <div className="flex items-center gap-3 shrink-0">
            <button
              onClick={() => onViewChange('calendar')}
              className="text-left group flex items-center gap-2.5 px-2 py-1.5 -mx-2 -my-1.5 rounded-xl focus:outline-none cursor-pointer transform transition-all duration-300 ease-out origin-left hover:scale-[1.05] hover:bg-slate-100/70 dark:hover:bg-slate-800/50 active:scale-[0.98] select-none"
              title="Retour au calendrier NTAHUB"
            >
              <FamilyLogo className="h-10 w-auto text-slate-800 dark:text-slate-100 group-hover:text-indigo-600 transform transition-all duration-300 ease-out group-hover:scale-105 shrink-0" />
              <div className="flex flex-col">
                <span className="tracking-tight flex items-center">
                  <NtahubWordmark height={33} className="h-[33px] w-auto transform transition-transform duration-300 ease-out group-hover:scale-[1.03]" />
                </span>
                <span className="text-[10px] tracking-wide text-slate-500 dark:text-slate-400 font-medium -mt-1 hidden sm:inline transition-colors duration-300 group-hover:text-indigo-600 dark:group-hover:text-indigo-400">
                  L'Appli Famille
                </span>
              </div>
            </button>
          </div>

          {/* Zone 2: Navigation Links (single-line, clean typography) */}
          <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-slate-600 dark:text-slate-300">
            <button
              onClick={() => onViewChange('calendar')}
              className={`flex items-center gap-2 py-1 transition-colors whitespace-nowrap shrink-0 border-b-2 ${
                currentView === 'calendar'
                  ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400 font-semibold'
                  : 'border-transparent hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <CalendarIcon className="w-4 h-4" />
              <span>Calendrier</span>
            </button>

            <button
              onClick={() => onViewChange('week')}
              className={`flex items-center gap-2 py-1 transition-colors whitespace-nowrap shrink-0 border-b-2 ${
                currentView === 'week'
                  ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400 font-semibold'
                  : 'border-transparent hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <CalendarDays className="w-4 h-4" />
              <span>Semaine</span>
            </button>

            <button
              onClick={() => onViewChange('activities')}
              className={`flex items-center gap-2 py-1 transition-colors whitespace-nowrap shrink-0 border-b-2 ${
                currentView === 'activities'
                  ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400 font-semibold'
                  : 'border-transparent hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Users className="w-4 h-4" />
              <span>Activités Enfants</span>
            </button>

            <button
              onClick={() => onViewChange('freemoments')}
              className={`flex items-center gap-2 py-1 transition-colors whitespace-nowrap shrink-0 border-b-2 ${
                currentView === 'freemoments'
                  ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400 font-semibold'
                  : 'border-transparent hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Clock className="w-4 h-4" />
              <span>Moments Libres</span>
            </button>

            <button
              onClick={() => onViewChange('pnc')}
              className={`flex items-center gap-2 py-1 transition-colors whitespace-nowrap shrink-0 border-b-2 ${
                currentView === 'pnc'
                  ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400 font-semibold'
                  : 'border-transparent hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Plane className="w-4 h-4" />
              <span>Planning PNC (ICS)</span>
            </button>
          </nav>

          {/* Zone 3: Active User Switcher + Notifications + Settings + Theme + CTA */}
          <div className="flex items-center gap-2.5 shrink-0">
            {/* User Profile Switcher */}
            <button
              onClick={onSwitchUser}
              title={`Changer de profil (Actuel : ${currentUser})`}
              className="flex items-center gap-2 px-3 py-1.5 text-xs font-medium rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700/80 transition-colors text-slate-700 dark:text-slate-200 whitespace-nowrap"
            >
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
              <span className="font-semibold">{currentUser}</span>
              <span className="text-slate-400 dark:text-slate-400 text-[11px]">
                {currentUser === 'Clément' ? '(PNC)' : '(Travail)'}
              </span>
              <ArrowRightLeft className="w-3.5 h-3.5 text-slate-400 ml-1" />
            </button>

            {/* Notification Bell */}
            <button
              onClick={onOpenNotifications}
              className="relative p-2 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
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

            {/* Notes Rapides (Post-it) */}
            <button
              onClick={onOpenQuickNotes}
              className="relative p-2 text-slate-600 dark:text-slate-300 hover:text-amber-600 dark:hover:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-950/40 rounded-lg transition-colors group"
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
              className="p-2 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
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
              className="p-2 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
              title="Réglages (temps de trajet, briefing, fin de travail)"
              aria-label="Réglages"
            >
              <SettingsIcon className="w-4 h-4" />
            </button>

            {/* Add Event Primary Button */}
            <button
              onClick={onOpenAddEvent}
              className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 transition-colors shadow-sm whitespace-nowrap"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Ajouter événement</span>
            </button>
          </div>
        </div>

        {/* Mobile Navigation bar */}
        <div className="flex md:hidden items-center justify-around py-2 border-t border-slate-100 dark:border-slate-800 text-xs font-medium text-slate-600 dark:text-slate-300">
          <button
            onClick={() => onViewChange('calendar')}
            className={`py-1 ${currentView === 'calendar' ? 'text-indigo-600 dark:text-indigo-400 font-bold' : ''}`}
          >
            Mois
          </button>
          <button
            onClick={() => onViewChange('week')}
            className={`py-1 ${currentView === 'week' ? 'text-indigo-600 dark:text-indigo-400 font-bold' : ''}`}
          >
            Semaine
          </button>
          <button
            onClick={() => onViewChange('activities')}
            className={`py-1 ${currentView === 'activities' ? 'text-indigo-600 dark:text-indigo-400 font-bold' : ''}`}
          >
            Enfants
          </button>
          <button
            onClick={() => onViewChange('freemoments')}
            className={`py-1 ${currentView === 'freemoments' ? 'text-indigo-600 dark:text-indigo-400 font-bold' : ''}`}
          >
            Dispos
          </button>
          <button
            onClick={() => onViewChange('pnc')}
            className={`py-1 ${currentView === 'pnc' ? 'text-indigo-600 dark:text-indigo-400 font-bold' : ''}`}
          >
            PNC ICS
          </button>
          <button
            onClick={onOpenQuickNotes}
            className="py-1 flex items-center gap-1 text-amber-600 dark:text-amber-400 font-medium"
          >
            <span>Notes</span>
            {quickNotesCount > 0 && (
              <span className="w-4 h-4 rounded-full bg-amber-500 text-white flex items-center justify-center text-[10px] font-bold">
                {quickNotesCount}
              </span>
            )}
          </button>
        </div>
      </div>
    </header>
  );
};
