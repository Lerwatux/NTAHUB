import React, { useState } from 'react';
import {
  X,
  Bell,
  Check,
  Send,
  Calendar as CalendarIcon,
  Trash2,
  AlertCircle,
} from 'lucide-react';
import { AppNotification, UserProfile } from '../types';

interface NotificationDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  notifications: AppNotification[];
  currentUser: UserProfile;
  onMarkAsRead: (id: string) => void;
  onMarkAllAsRead: () => void;
  onDeleteNotification: (id: string) => void;
  onSendQuickNotice: (message: string) => void;
  onSelectDate: (date: string) => void;
}

export const NotificationDrawer: React.FC<NotificationDrawerProps> = ({
  isOpen,
  onClose,
  notifications,
  currentUser,
  onMarkAsRead,
  onMarkAllAsRead,
  onDeleteNotification,
  onSendQuickNotice,
  onSelectDate,
}) => {
  const [quickText, setQuickText] = useState('');

  if (!isOpen) return null;

  const userNotifications = notifications.filter(
    (n) => n.recipient === currentUser
  );
  const otherUser = currentUser === 'Clément' ? 'Irène' : 'Clément';

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickText.trim()) return;
    onSendQuickNotice(quickText.trim());
    setQuickText('');
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-slate-900/50 backdrop-blur-xs">
      <div className="absolute inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-md bg-white dark:bg-slate-900 shadow-2xl flex flex-col border-l border-slate-200 dark:border-slate-800 animate-in slide-in-from-right duration-200">
          {/* Header */}
          <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-950">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-indigo-600 text-white flex items-center justify-center">
                <Bell className="w-4 h-4" />
              </div>
              <div>
                <h2 className="text-sm font-bold text-slate-900 dark:text-white">
                  Alertes & Notifications
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Boîte de réception pour {currentUser}
                </p>
              </div>
            </div>

            <button
              onClick={onClose}
              className="p-1 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-800"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Quick Notice Sender */}
          <div className="p-4 border-b border-slate-200 dark:border-slate-800 bg-indigo-50/50 dark:bg-indigo-950/30">
            <form onSubmit={handleSend} className="space-y-2">
              <label className="block text-xs font-semibold text-indigo-900 dark:text-indigo-300">
                Prévenir {otherUser} immédiatement :
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={quickText}
                  onChange={(e) => setQuickText(e.target.value)}
                  placeholder={`Ex: Je rentre plus tôt, peux-tu récupérer Ishema ?`}
                  className="flex-1 px-3 py-1.5 text-xs bg-white dark:bg-slate-800 border border-indigo-200 dark:border-indigo-800 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 text-slate-900 dark:text-white placeholder:text-slate-400"
                />
                <button
                  type="submit"
                  className="px-3 py-1.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-xs flex items-center gap-1 transition-colors shrink-0"
                >
                  <Send className="w-3 h-3" />
                  <span>Envoyer</span>
                </button>
              </div>
            </form>
          </div>

          {/* Notifications List */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 mb-2">
              <span>{userNotifications.length} message(s)</span>
              {userNotifications.length > 0 && (
                <button
                  onClick={onMarkAllAsRead}
                  className="text-indigo-600 dark:text-indigo-400 hover:underline font-semibold"
                >
                  Tout marquer comme lu
                </button>
              )}
            </div>

            {userNotifications.length === 0 ? (
              <div className="text-center py-12 text-slate-400 text-xs">
                Aucune alerte en attente pour le moment.
              </div>
            ) : (
              userNotifications.map((notif) => (
                <div
                  key={notif.id}
                  className={`p-3.5 rounded-xl border text-xs transition-all ${
                    !notif.isRead
                      ? 'bg-indigo-50/70 dark:bg-indigo-950/40 border-indigo-200 dark:border-indigo-800 shadow-xs'
                      : 'bg-white dark:bg-slate-800/80 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-start gap-2">
                      {!notif.isRead && (
                        <span className="w-2 h-2 rounded-full bg-indigo-600 mt-1 shrink-0" />
                      )}
                      <div>
                        <h3 className="font-bold text-slate-900 dark:text-white">
                          {notif.title}
                        </h3>
                        <p className="text-slate-500 dark:text-slate-400 text-[11px] mt-0.5">
                          De <strong>{notif.sender}</strong> · {notif.timestamp}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-1 shrink-0">
                      {!notif.isRead && (
                        <button
                          onClick={() => onMarkAsRead(notif.id)}
                          className="p-1 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-100 dark:hover:bg-indigo-900/60 rounded"
                          title="Marquer comme lu"
                        >
                          <Check className="w-3.5 h-3.5" />
                        </button>
                      )}
                      <button
                        onClick={() => onDeleteNotification(notif.id)}
                        className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/50 rounded"
                        title="Supprimer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  <p className="text-slate-700 dark:text-slate-300 mt-2 leading-relaxed">
                    {notif.message}
                  </p>

                  {notif.relatedDate && (
                    <div className="mt-2.5 pt-2 border-t border-slate-200/60 dark:border-slate-700/60 flex items-center justify-between">
                      <button
                        onClick={() => {
                          onSelectDate(notif.relatedDate!);
                          onClose();
                        }}
                        className="flex items-center gap-1 text-[11px] font-semibold text-indigo-600 dark:text-indigo-400 hover:text-indigo-800"
                      >
                        <CalendarIcon className="w-3 h-3" />
                        <span>Voir le {notif.relatedDate} dans le planning →</span>
                      </button>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>

          {/* Footer */}
          <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-center text-xs text-slate-500 dark:text-slate-400">
            NTAHUB · Synchronisation du couple Clément & Irène
          </div>
        </div>
      </div>
    </div>
  );
};
