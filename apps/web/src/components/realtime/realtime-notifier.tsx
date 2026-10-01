'use client';

import { useEffect, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { Bell, X, TrendingUp, FileUp, CheckCircle } from 'lucide-react';

interface Notification {
  id: string;
  type: 'commission' | 'document' | 'order';
  title: string;
  message: string;
  timestamp: Date;
  read: boolean;
}

export function RealtimeNotifier() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const queryClient = useQueryClient();

  // Polling per aggiornamenti real-time
  useEffect(() => {
    const interval = setInterval(() => {
      queryClient.invalidateQueries({ queryKey: ['commissions'] });
      queryClient.invalidateQueries({ queryKey: ['commissions-summary'] });
    }, 30000);

    return () => clearInterval(interval);
  }, [queryClient]);

  const unreadCount = notifications.filter((n) => !n.read).length;

  const markAllRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  const removeNotification = (id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  };

  const getIcon = (type: string) => {
    switch (type) {
      case 'commission':
        return <TrendingUp className="h-4 w-4 text-emerald-500" />;
      case 'document':
        return <FileUp className="h-4 w-4 text-blue-500" />;
      case 'order':
        return <CheckCircle className="h-4 w-4 text-violet-500" />;
      default:
        return <Bell className="h-4 w-4 text-slate-500" />;
    }
  };

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative rounded-lg p-2 text-slate-600 hover:bg-slate-100"
      >
        <Bell className="h-5 w-5" />
        {unreadCount > 0 && (
          <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-xs font-bold text-white">
            {unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 top-full z-50 mt-2 w-80 rounded-xl border border-slate-200 bg-white shadow-lg">
          <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
            <h3 className="font-semibold text-slate-900">Notifiche</h3>
            {unreadCount > 0 && (
              <button
                onClick={markAllRead}
                className="text-xs text-emerald-600 hover:text-emerald-700"
              >
                Segna tutte come lette
              </button>
            )}
          </div>
          <div className="max-h-80 overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="px-4 py-6 text-center text-sm text-slate-500">
                Nessuna notifica
              </div>
            ) : (
              notifications.map((notification) => (
                <div
                  key={notification.id}
                  className={`flex items-start gap-3 border-b border-slate-50 px-4 py-3 transition-colors hover:bg-slate-50 ${
                    !notification.read ? 'bg-emerald-50/30' : ''
                  }`}
                >
                  <div className="mt-0.5">{getIcon(notification.type)}</div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-slate-900">
                      {notification.title}
                    </p>
                    <p className="text-xs text-slate-500">{notification.message}</p>
                    <p className="mt-1 text-xs text-slate-400">
                      {notification.timestamp.toLocaleTimeString('it-IT')}
                    </p>
                  </div>
                  <button
                    onClick={() => removeNotification(notification.id)}
                    className="text-slate-400 hover:text-slate-600"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
