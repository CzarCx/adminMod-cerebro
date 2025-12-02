
'use client';

import { useEffect } from 'react';
import { useNotificationStore } from '@/lib/use-notification-store';
import { CheckCircle, X } from 'lucide-react';

export default function Notification() {
  const { notifications, removeNotification } = useNotificationStore();

  useEffect(() => {
    const interval = setInterval(() => {
      notifications.forEach(notification => {
        if (Date.now() - (notification.createdAt || 0) > 5000) {
          removeNotification(notification.id);
        }
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [notifications, removeNotification]);

  return (
    <div className="fixed bottom-5 left-5 z-50 space-y-3">
      {notifications.map(notification => (
        <div
          key={notification.id}
          className="flex items-center gap-4 w-full max-w-sm p-4 bg-card text-foreground border border-border rounded-lg shadow-lg animate-in fade-in slide-in-from-bottom-5"
        >
          <CheckCircle className="w-6 h-6 text-green-500 flex-shrink-0" />
          <div className="flex-grow">
            <p className="font-semibold">¡Encargado Disponible!</p>
            <p className="text-sm text-muted-foreground">{notification.message}</p>
          </div>
          <button
            onClick={() => removeNotification(notification.id)}
            className="p-1 rounded-full text-muted-foreground hover:bg-muted"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      ))}
    </div>
  );
}
