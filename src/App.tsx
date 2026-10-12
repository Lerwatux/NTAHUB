/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import {
  PncDayDuty,
  IreneDayOverride,
  IreneWorkStatus,
  ChildActivity,
  FamilyEvent,
  AppNotification,
  UserProfile,
  AppSettings,
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
} from './utils/storage';
import { recalculatePncDuties } from './utils/icsParser';
import { TopNav } from './components/TopNav';
import { CalendarView } from './components/CalendarView';
import { DayDetailsModal } from './components/DayDetailsModal';
import { AddEventModal } from './components/AddEventModal';
import { ChildActivitiesManager } from './components/ChildActivitiesManager';
import { FreeMomentsView } from './components/FreeMomentsView';
import { PncManagerView } from './components/PncManagerView';
import { NotificationDrawer } from './components/NotificationDrawer';
import { SettingsModal } from './components/SettingsModal';
import { getIreneStatusOnDate } from './utils/availability';
import { getDayOfWeekIndex } from './utils/timezone';

export default function App() {
  // State initialization
  const [currentUser, setCurrentUser] = useState<UserProfile>(getInitialActiveUser);
  const [currentView, setCurrentView] = useState<'calendar' | 'activities' | 'freemoments' | 'pnc'>('calendar');

  const [settings, setSettings] = useState<AppSettings>(getInitialSettings);
  const [pncDuties, setPncDuties] = useState<Map<string, PncDayDuty>>(getInitialPncDuties);
  const [ireneOverrides, setIreneOverrides] = useState<Map<string, IreneDayOverride>>(getInitialIreneOverrides);
  const [childActivities, setChildActivities] = useState<ChildActivity[]>(getInitialChildActivities);
  const [events, setEvents] = useState<FamilyEvent[]>(getInitialFamilyEvents);
  const [notifications, setNotifications] = useState<AppNotification[]>(getInitialNotifications);

  // Modals state
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [isAddEventOpen, setIsAddEventOpen] = useState(false);
  const [addEventInitialDate, setAddEventInitialDate] = useState<string | undefined>(undefined);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

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
      const newNotif: AppNotification = {
        id: `notif-${Date.now()}`,
        sender: currentUser,
        recipient,
        title: `Nouvel événement : ${newEvent.category} (${newEvent.target})`,
        message: `${currentUser} a programmé un événement (${newEvent.customTitle || newEvent.category}) le ${newEvent.date} de ${newEvent.startTime} à ${newEvent.endTime}.`,
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

      {/* Settings Modal (Règles horaires & Mode Nuit) */}
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        settings={settings}
        onSaveSettings={handleSaveSettings}
      />
    </div>
  );
}
