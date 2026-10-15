/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import {
  PncDayDuty,
  IreneDayOverride,
  IreneWorkStatus,
  ChildActivity,
  FamilyEvent,
  AppNotification,
  UserProfile,
  AppSettings,
  QuickNote,
  ReminderOption,
} from './types';
import {
  getInitialActiveUser,
  saveActiveUser,
  getInitialPncDuties,
  savePncDuties,
  getInitialIreneOverrides,
  saveIreneOverrides,
  getInitialChildActivities,
  saveChildActivities,
  getInitialFamilyEvents,
  saveFamilyEvents,
  getInitialNotifications,
  saveNotifications,
  getInitialSettings,
  saveSettings,
  getInitialQuickNotes,
  saveQuickNotes,
} from './utils/storage';
import { subscribeToSharedData } from './utils/cloudSync';
import type { CloudAccount } from './components/AuthGate';
import { recalculatePncDuties } from './utils/icsParser';
import { TopNav } from './components/TopNav';
import { CalendarView } from './components/CalendarView';
import { WeekView } from './components/WeekView';
import { DayDetailsModal } from './components/DayDetailsModal';
import { AddEventModal } from './components/AddEventModal';
import { ChildActivitiesManager } from './components/ChildActivitiesManager';
import { FreeMomentsView } from './components/FreeMomentsView';
import { PncManagerView } from './components/PncManagerView';
import { NotificationDrawer } from './components/NotificationDrawer';
import { SettingsModal } from './components/SettingsModal';
import { QuickNotesDrawer } from './components/QuickNotesDrawer';
import { StickyNote } from 'lucide-react';
import { getIreneStatusOnDate } from './utils/availability';
import {
  getDayOfWeekIndex,
  formatParisDate,
  formatParisTime,
  timeToMinutes,
} from './utils/timezone';

interface AppProps {
  // Compte connecté quand la synchronisation Firebase est active (null = mode local).
  account?: CloudAccount | null;
}

export default function App({ account = null }: AppProps) {
  // State initialization
  const [currentUser, setCurrentUser] = useState<UserProfile>(getInitialActiveUser);
  const [currentView, setCurrentView] = useState<'calendar' | 'week' | 'activities' | 'freemoments' | 'pnc'>('calendar');

  const [settings, setSettings] = useState<AppSettings>(getInitialSettings);
  const [pncDuties, setPncDuties] = useState<Map<string, PncDayDuty>>(getInitialPncDuties);
  const [ireneOverrides, setIreneOverrides] = useState<Map<string, IreneDayOverride>>(getInitialIreneOverrides);
  const [childActivities, setChildActivities] = useState<ChildActivity[]>(getInitialChildActivities);
  const [events, setEvents] = useState<FamilyEvent[]>(getInitialFamilyEvents);
  const [notifications, setNotifications] = useState<AppNotification[]>(getInitialNotifications);
  const [quickNotes, setQuickNotes] = useState<QuickNote[]>(getInitialQuickNotes);

  // Modals state
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [isAddEventOpen, setIsAddEventOpen] = useState(false);
  const [addEventInitialDate, setAddEventInitialDate] = useState<string | undefined>(undefined);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [isQuickNotesOpen, setIsQuickNotesOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  // Reçoit en temps réel les modifications faites sur l'autre téléphone
  useEffect(() => {
    if (!account) return;
    return subscribeToSharedData({
      onSettings: setSettings,
      onPncDuties: setPncDuties,
      onIreneOverrides: setIreneOverrides,
      onChildActivities: setChildActivities,
      onFamilyEvents: setEvents,
      onNotifications: setNotifications,
      onQuickNotes: setQuickNotes,
    });
  }, [account?.email]);

  // Synchronize Dark Mode on HTML document root
  useEffect(() => {
    if (settings.darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [settings.darkMode]);

  // Toggle Dark Mode quickly
  const handleToggleDarkMode = () => {
    const updated: AppSettings = { ...settings, darkMode: !settings.darkMode };
    setSettings(updated);
    saveSettings(updated);
  };

  // Save Settings from modal
  const handleSaveSettings = (newSettings: AppSettings) => {
    setSettings(newSettings);
    saveSettings(newSettings);

    // Automatically recalculate briefing and home return times for existing duties
    const updatedDuties = recalculatePncDuties(pncDuties, newSettings);
    setPncDuties(updatedDuties);
    savePncDuties(updatedDuties);
  };

  // Test trigger for reminders from settings modal
  const handleTriggerTestReminder = (minutes: ReminderOption) => {
    const minVal = minutes || 30;
    const newNotif: AppNotification = {
      id: `notif-reminder-test-${Date.now()}`,
      sender: currentUser,
      recipient: currentUser,
      title: `⏰ Rappel d'activité test (${minVal} min avant)`,
      message: `Ceci est un rappel interne de test : votre activité ou vol débute dans ${minVal} minutes. Vos rappels fonctionnent parfaitement !`,
      timestamp: new Intl.DateTimeFormat('fr-FR', {
        dateStyle: 'short',
        timeStyle: 'short',
      }).format(new Date()),
      isRead: false,
    };
    const updated = [newNotif, ...notifications];
    setNotifications(updated);
    saveNotifications(updated);
  };

  // Automated background reminder system (evaluates events, flight duties, and child activities)
  const remindedKeysRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    const checkReminders = () => {
      const now = new Date();
      const todayDateStr = formatParisDate(now);
      const currentMinutes = timeToMinutes(formatParisTime(now));

      let updatedEvents = [...events];
      let hasEventsChanged = false;
      const newAlerts: AppNotification[] = [];

      // 1. Rappels Événements Familiaux
      updatedEvents = updatedEvents.map((evt) => {
        if (
          evt.date === todayDateStr &&
          evt.reminderMinutes &&
          evt.reminderMinutes > 0 &&
          !evt.reminderSent
        ) {
          const eventMinutes = timeToMinutes(evt.startTime);
          const diff = eventMinutes - currentMinutes;
          // Si on est dans la fenêtre de rappel (jusqu'à 10 min après l'heure)
          if (diff <= evt.reminderMinutes && diff >= -10) {
            hasEventsChanged = true;
            const notif: AppNotification = {
              id: `notif-rem-evt-${evt.id}-${Date.now()}`,
              sender: evt.createdBy,
              recipient: evt.createdBy,
              title: `⏰ Rappel dans ${evt.reminderMinutes} min : ${evt.customTitle || evt.category}`,
              message: `L'événement familial (${evt.customTitle || evt.category}) pour ${evt.target} débute à ${evt.startTime}.`,
              timestamp: new Intl.DateTimeFormat('fr-FR', {
                dateStyle: 'short',
                timeStyle: 'short',
              }).format(new Date()),
              isRead: false,
              relatedDate: evt.date,
            };
            newAlerts.push(notif);

            if (evt.notifySpouse) {
              const spouse: UserProfile = evt.createdBy === 'Clément' ? 'Irène' : 'Clément';
              newAlerts.push({
                ...notif,
                id: `notif-rem-evt-${evt.id}-spouse-${Date.now()}`,
                recipient: spouse,
              });
            }
            return { ...evt, reminderSent: true };
          }
        }
        return evt;
      });

      // 2. Rappels Vols PNC Clément
      if (settings.flightReminderMinutes && settings.flightReminderMinutes > 0) {
        const duty = pncDuties.get(todayDateStr);
        if (duty && duty.briefingTime) {
          const briefingMins = timeToMinutes(duty.briefingTime);
          const diff = briefingMins - currentMinutes;
          const key = `duty-${duty.date}-${duty.briefingTime}-${settings.flightReminderMinutes}`;
          if (
            diff <= settings.flightReminderMinutes &&
            diff >= -10 &&
            !remindedKeysRef.current.has(key)
          ) {
            remindedKeysRef.current.add(key);
            newAlerts.push({
              id: `notif-duty-rem-${Date.now()}`,
              sender: 'Clément',
              recipient: 'Clément',
              title: `⏰ Rappel Vol PNC dans ${settings.flightReminderMinutes} min`,
              message: `Début du briefing à Orly à ${duty.briefingTime} (${duty.legs[0]?.flightNumber || 'Vol Air France'}). Préparatifs en cours !`,
              timestamp: new Intl.DateTimeFormat('fr-FR', {
                dateStyle: 'short',
                timeStyle: 'short',
              }).format(new Date()),
              isRead: false,
              relatedDate: duty.date,
            });
          }
        }
      }

      // 3. Rappels Activités Enfants (Imanzi & Ishema)
      if (settings.activityReminderMinutes && settings.activityReminderMinutes > 0) {
        const dayIdx = getDayOfWeekIndex(todayDateStr);
        const todayActs = childActivities.filter((a) => a.dayOfWeek === dayIdx);
        for (const act of todayActs) {
          const actMins = timeToMinutes(act.startTime);
          const diff = actMins - currentMinutes;
          const key = `act-${act.id}-${todayDateStr}-${settings.activityReminderMinutes}`;
          if (
            diff <= settings.activityReminderMinutes &&
            diff >= -10 &&
            !remindedKeysRef.current.has(key)
          ) {
            remindedKeysRef.current.add(key);
            newAlerts.push({
              id: `notif-act-rem-${act.id}-${Date.now()}`,
              sender: 'Clément',
              recipient: currentUser,
              title: `⏰ Rappel Activité (${act.childName}) dans ${settings.activityReminderMinutes} min`,
              message: `${act.activityName} débute à ${act.startTime}${act.location ? ` au ${act.location}` : ''}.`,
              timestamp: new Intl.DateTimeFormat('fr-FR', {
                dateStyle: 'short',
                timeStyle: 'short',
              }).format(new Date()),
              isRead: false,
              relatedDate: todayDateStr,
            });
          }
        }
      }

      if (hasEventsChanged) {
        setEvents(updatedEvents);
        saveFamilyEvents(updatedEvents);
      }

      if (newAlerts.length > 0) {
        setNotifications((prev) => {
          const merged = [...newAlerts, ...prev];
          saveNotifications(merged);
          return merged;
        });
      }
    };

    checkReminders();
    const interval = setInterval(checkReminders, 25000);
    return () => clearInterval(interval);
  }, [events, pncDuties, childActivities, settings, currentUser]);

  // Sync active user to storage
  const handleSwitchUser = () => {
    const nextUser: UserProfile = currentUser === 'Clément' ? 'Irène' : 'Clément';
    setCurrentUser(nextUser);
    saveActiveUser(nextUser);
  };

  // Add event handler
  const handleSaveEvent = (eventData: Omit<FamilyEvent, 'id' | 'createdAt'>) => {
    const newEvent: FamilyEvent = {
      ...eventData,
      id: `evt-${Date.now()}`,
      createdAt: new Date().toISOString(),
    };

    const updatedEvents = [...events, newEvent];
    setEvents(updatedEvents);
    saveFamilyEvents(updatedEvents);

    // If notifySpouse is toggled, generate in-app alert
    if (newEvent.notifySpouse) {
      const recipient: UserProfile = currentUser === 'Clément' ? 'Irène' : 'Clément';
      const assigneeText = newEvent.assignedTo ? ` · Responsable : ${newEvent.assignedTo}` : '';
      const newNotif: AppNotification = {
        id: `notif-${Date.now()}`,
        sender: currentUser,
        recipient,
        title: `Nouvel événement : ${newEvent.category} (${newEvent.target})${newEvent.assignedTo ? ` [Assigné : ${newEvent.assignedTo}]` : ''}`,
        message: `${currentUser} a programmé un événement (${newEvent.customTitle || newEvent.category})${assigneeText} le ${newEvent.date} de ${newEvent.startTime} à ${newEvent.endTime}.`,
        timestamp: new Intl.DateTimeFormat('fr-FR', {
          dateStyle: 'short',
          timeStyle: 'short',
        }).format(new Date()),
        isRead: false,
        relatedDate: newEvent.date,
      };

      const updatedNotifs = [newNotif, ...notifications];
      setNotifications(updatedNotifs);
      saveNotifications(updatedNotifs);
    }
  };

  // Delete event
  const handleDeleteEvent = (id: string) => {
    const updated = events.filter((e) => e.id !== id);
    setEvents(updated);
    saveFamilyEvents(updated);
  };

  // Update Irene's status for a date
  const handleUpdateIreneStatus = (date: string, status: IreneWorkStatus) => {
    const updated = new Map(ireneOverrides);
    updated.set(date, { date, status });
    setIreneOverrides(updated);
    saveIreneOverrides(updated);

    if (currentUser === 'Irène') {
      const newNotif: AppNotification = {
        id: `notif-${Date.now()}`,
        sender: 'Irène',
        recipient: 'Clément',
        title: `Planning Irène mis à jour (${date})`,
        message: `Irène a changé son statut pour le ${date} : ${status.toUpperCase()} (${
          status === 'tt' ? 'Télétravail à la maison' : status === 'cp' ? 'Congé payé' : 'RTT'
        }).`,
        timestamp: new Intl.DateTimeFormat('fr-FR', {
          dateStyle: 'short',
          timeStyle: 'short',
        }).format(new Date()),
        isRead: false,
        relatedDate: date,
      };
      const updatedNotifs = [newNotif, ...notifications];
      setNotifications(updatedNotifs);
      saveNotifications(updatedNotifs);
    }
  };

  // Save / Update Child Activity
  const handleSaveChildActivity = (act: ChildActivity) => {
    const existingIndex = childActivities.findIndex((a) => a.id === act.id);
    let updated: ChildActivity[];
    if (existingIndex >= 0) {
      updated = [...childActivities];
      updated[existingIndex] = act;
    } else {
      updated = [...childActivities, act];
    }
    setChildActivities(updated);
    saveChildActivities(updated);
  };

  // Delete Child Activity
  const handleDeleteChildActivity = (id: string) => {
    const updated = childActivities.filter((a) => a.id !== id);
    setChildActivities(updated);
    saveChildActivities(updated);
  };

  // Import PNC duties from ICS
  const handleImportDuties = (newDuties: Map<string, PncDayDuty>, rawCount: number) => {
    const merged = new Map(pncDuties);
    newDuties.forEach((duty, dateKey) => {
      merged.set(dateKey, duty);
    });
    // Ensure duties conform to current settings
    const calibrated = recalculatePncDuties(merged, settings);
    setPncDuties(calibrated);
    savePncDuties(calibrated);

    // Notify Irène that Clément has updated his flights
    const newNotif: AppNotification = {
      id: `notif-${Date.now()}`,
      sender: 'Clément',
      recipient: 'Irène',
      title: 'Synchronisation planning PNC effectuée',
      message: `Clément vient d'importer son fichier ICS de vols (${rawCount} étapes analysées). Les horaires de briefing et retours à Orly sont à jour.`,
      timestamp: new Intl.DateTimeFormat('fr-FR', {
        dateStyle: 'short',
        timeStyle: 'short',
      }).format(new Date()),
      isRead: false,
    };
    const updatedNotifs = [newNotif, ...notifications];
    setNotifications(updatedNotifs);
    saveNotifications(updatedNotifs);
  };

  // Reset to default sample
  const handleResetSample = () => {
    localStorage.clear();
    window.location.reload();
  };

  // Notification management
  const handleMarkAsRead = (id: string) => {
    const updated = notifications.map((n) => (n.id === id ? { ...n, isRead: true } : n));
    setNotifications(updated);
    saveNotifications(updated);
  };

  const handleMarkAllAsRead = () => {
    const updated = notifications.map((n) =>
      n.recipient === currentUser ? { ...n, isRead: true } : n
    );
    setNotifications(updated);
    saveNotifications(updated);
  };

  const handleDeleteNotification = (id: string) => {
    const updated = notifications.filter((n) => n.id !== id);
    setNotifications(updated);
    saveNotifications(updated);
  };

  const handleSendQuickNotice = (message: string) => {
    const recipient: UserProfile = currentUser === 'Clément' ? 'Irène' : 'Clément';
    const newNotif: AppNotification = {
      id: `notif-${Date.now()}`,
      sender: currentUser,
      recipient,
      title: `Message de ${currentUser}`,
      message,
      timestamp: new Intl.DateTimeFormat('fr-FR', {
        dateStyle: 'short',
        timeStyle: 'short',
      }).format(new Date()),
      isRead: false,
    };
    const updated = [newNotif, ...notifications];
    setNotifications(updated);
    saveNotifications(updated);
  };

  // Quick Notes management (Post-it)
  const handleAddQuickNote = (noteData: Omit<QuickNote, 'id' | 'createdAt'>) => {
    const newNote: QuickNote = {
      ...noteData,
      id: `note-${Date.now()}`,
      createdAt: new Date().toISOString(),
    };
    const updated = [newNote, ...quickNotes];
    setQuickNotes(updated);
    saveQuickNotes(updated);
  };

  const handleDeleteQuickNote = (id: string) => {
    const updated = quickNotes.filter((n) => n.id !== id);
    setQuickNotes(updated);
    saveQuickNotes(updated);
  };

  const handleTogglePinQuickNote = (id: string) => {
    const updated = quickNotes.map((n) =>
      n.id === id ? { ...n, pinned: !n.pinned } : n
    );
    setQuickNotes(updated);
    saveQuickNotes(updated);
  };

  const handleToggleLikeQuickNote = (id: string, userToToggle?: UserProfile) => {
    const likingUser = userToToggle || currentUser;
    let targetAuthor: UserProfile | null = null;
    let noteContent = '';
    let isLikedNow = false;

    const updated = quickNotes.map((n) => {
      if (n.id === id) {
        const currentLikes = n.likes || [];
        const alreadyLiked = currentLikes.includes(likingUser);
        isLikedNow = !alreadyLiked;
        const newLikes = alreadyLiked
          ? currentLikes.filter((u) => u !== likingUser)
          : [...currentLikes, likingUser];
        targetAuthor = n.author;
        noteContent = n.content;
        return { ...n, likes: newLikes };
      }
      return n;
    });

    setQuickNotes(updated);
    saveQuickNotes(updated);

    // If a user liked (not unliked) a post-it written by the other person, send an in-app alert
    if (isLikedNow && targetAuthor && targetAuthor !== likingUser) {
      const snippet = noteContent.length > 50 ? noteContent.slice(0, 50) + '…' : noteContent;
      const newNotif: AppNotification = {
        id: `notif-like-${Date.now()}`,
        sender: likingUser,
        recipient: targetAuthor,
        title: `❤️ ${likingUser} a aimé votre post-it`,
        message: `${likingUser} a réagi avec un cœur à votre mot : « ${snippet} »`,
        timestamp: new Intl.DateTimeFormat('fr-FR', {
          dateStyle: 'short',
          timeStyle: 'short',
        }).format(new Date()),
        isRead: false,
      };
      const updatedNotifs = [newNotif, ...notifications];
      setNotifications(updatedNotifs);
      saveNotifications(updatedNotifs);
    }
  };

  const handleClearAllQuickNotes = () => {
    setQuickNotes([]);
    saveQuickNotes([]);
  };

  // Helper for day modal
  const selectedDayDuty = selectedDate ? pncDuties.get(selectedDate) : undefined;
  const selectedIreneStatus = selectedDate
    ? getIreneStatusOnDate(selectedDate, ireneOverrides)
    : 'bureau';
  const selectedDayActivities = selectedDate
    ? childActivities.filter((act) => act.dayOfWeek === getDayOfWeekIndex(selectedDate))
    : [];
  const selectedDayEvents = selectedDate
    ? events.filter((e) => e.date === selectedDate)
    : [];

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col font-sans transition-colors duration-200">
      {/* Top Header */}
      <TopNav
        currentView={currentView}
        onViewChange={setCurrentView}
        currentUser={currentUser}
        onSwitchUser={handleSwitchUser}
        onOpenAddEvent={() => {
          setAddEventInitialDate(undefined);
          setIsAddEventOpen(true);
        }}
        onOpenNotifications={() => setIsNotificationsOpen(true)}
        onOpenQuickNotes={() => setIsQuickNotesOpen(true)}
        quickNotesCount={quickNotes.length}
        onOpenSettings={() => setIsSettingsOpen(true)}
        darkMode={settings.darkMode}
        onToggleDarkMode={handleToggleDarkMode}
        notifications={notifications}
      />

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {currentView === 'calendar' && (
          <CalendarView
            pncDuties={pncDuties}
            ireneOverrides={ireneOverrides}
            childActivities={childActivities}
            events={events}
            currentUser={currentUser}
            settings={settings}
            onSelectDay={(d) => setSelectedDate(d)}
            onOpenAddEvent={(d) => {
              setAddEventInitialDate(d);
              setIsAddEventOpen(true);
            }}
            onOpenIcsImport={() => setCurrentView('pnc')}
            onNavigateToWeekView={() => setCurrentView('week')}
          />
        )}

        {currentView === 'week' && (
          <WeekView
            pncDuties={pncDuties}
            ireneOverrides={ireneOverrides}
            childActivities={childActivities}
            events={events}
            currentUser={currentUser}
            settings={settings}
            onSelectDay={(d) => setSelectedDate(d)}
            onOpenAddEvent={(d) => {
              setAddEventInitialDate(d);
              setIsAddEventOpen(true);
            }}
          />
        )}

        {currentView === 'activities' && (
          <ChildActivitiesManager
            activities={childActivities}
            onSaveActivity={handleSaveChildActivity}
            onDeleteActivity={handleDeleteChildActivity}
            pncDuties={pncDuties}
            ireneOverrides={ireneOverrides}
            events={events}
            settings={settings}
          />
        )}

        {currentView === 'freemoments' && (
          <FreeMomentsView
            pncDuties={pncDuties}
            ireneOverrides={ireneOverrides}
            events={events}
            settings={settings}
            onOpenAddEventForDate={(d) => {
              setAddEventInitialDate(d);
              setIsAddEventOpen(true);
            }}
          />
        )}

        {currentView === 'pnc' && (
          <PncManagerView
            pncDuties={pncDuties}
            onImportDuties={handleImportDuties}
            onResetSample={handleResetSample}
          />
        )}
      </main>

      {/* Day Details Modal */}
      {selectedDate && (
        <DayDetailsModal
          isOpen={Boolean(selectedDate)}
          date={selectedDate}
          onClose={() => setSelectedDate(null)}
          pncDuty={selectedDayDuty}
          ireneStatus={selectedIreneStatus}
          onUpdateIreneStatus={(st) => handleUpdateIreneStatus(selectedDate, st)}
          childActivities={selectedDayActivities}
          events={selectedDayEvents}
          onDeleteEvent={handleDeleteEvent}
          onOpenAddEventForDate={(d) => {
            setAddEventInitialDate(d);
            setIsAddEventOpen(true);
          }}
          currentUser={currentUser}
          allPncDuties={pncDuties}
          allIreneOverrides={ireneOverrides}
          allEvents={events}
          settings={settings}
        />
      )}

      {/* Add Event Modal */}
      <AddEventModal
        isOpen={isAddEventOpen}
        onClose={() => setIsAddEventOpen(false)}
        onSave={handleSaveEvent}
        currentUser={currentUser}
        initialDate={addEventInitialDate}
        defaultReminderMinutes={settings.eventDefaultReminderMinutes}
      />

      {/* Notifications Drawer */}
      <NotificationDrawer
        isOpen={isNotificationsOpen}
        onClose={() => setIsNotificationsOpen(false)}
        notifications={notifications}
        currentUser={currentUser}
        onMarkAsRead={handleMarkAsRead}
        onMarkAllAsRead={handleMarkAllAsRead}
        onDeleteNotification={handleDeleteNotification}
        onSendQuickNotice={handleSendQuickNotice}
        onSelectDate={(d) => setSelectedDate(d)}
      />

      {/* Settings Modal (Règles horaires, Rappels & Mode Nuit) */}
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        settings={settings}
        onSaveSettings={handleSaveSettings}
        onTriggerTestReminder={handleTriggerTestReminder}
      />

      {account && (
        <footer className="max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 pb-20 text-[11px] text-slate-400 dark:text-slate-500">
          Synchronisé avec {account.email} ·{' '}
          <button onClick={account.signOut} className="underline hover:text-slate-600 dark:hover:text-slate-300">
            Se déconnecter
          </button>
        </footer>
      )}

      {/* Floating Quick Notes shortcut button */}
      <button
        onClick={() => setIsQuickNotesOpen(true)}
        className="fixed bottom-5 right-5 z-30 flex items-center gap-2 px-3.5 py-2.5 bg-amber-500 hover:bg-amber-600 text-white rounded-full shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-105 active:scale-95 group focus:outline-none"
        title="Notes Rapides & Pense-bêtes (Post-it)"
        aria-label="Ouvrir les notes rapides"
      >
        <StickyNote className="w-4 h-4 group-hover:rotate-6 transition-transform" />
        <span className="text-xs font-semibold hidden sm:inline">Post-it</span>
        {quickNotes.length > 0 && (
          <span className="w-5 h-5 rounded-full bg-white text-amber-700 font-bold text-[11px] flex items-center justify-center shadow-xs">
            {quickNotes.length}
          </span>
        )}
      </button>

      {/* Quick Notes Drawer */}
      <QuickNotesDrawer
        isOpen={isQuickNotesOpen}
        onClose={() => setIsQuickNotesOpen(false)}
        notes={quickNotes}
        currentUser={currentUser}
        onAddNote={handleAddQuickNote}
        onDeleteNote={handleDeleteQuickNote}
        onTogglePin={handleTogglePinQuickNote}
        onToggleLike={handleToggleLikeQuickNote}
        onClearAllNotes={handleClearAllQuickNotes}
      />
    </div>
  );
}
