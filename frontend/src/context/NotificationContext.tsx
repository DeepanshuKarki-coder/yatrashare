import React, { createContext, useContext, useState, useEffect } from 'react';
import { NotificationDTO } from '@yatrashare/shared';
import { api } from '../lib/api';
import { getSocket } from '../lib/socket';
import { useAuth } from './AuthContext';

interface ToastAlert {
  id: string;
  title: string;
  body: string;
  type: string;
}

interface NotificationContextType {
  notifications: NotificationDTO[];
  unreadCount: number;
  toasts: ToastAlert[];
  dismissToast: (id: string) => void;
  markAsRead: (id: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  refreshNotifications: () => Promise<void>;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const NotificationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated } = useAuth();
  const [notifications, setNotifications] = useState<NotificationDTO[]>([]);
  const [unreadCount, setUnreadCount] = useState<number>(0);
  const [toasts, setToasts] = useState<ToastAlert[]>([]);

  const fetchNotifications = async () => {
    if (!isAuthenticated) return;
    try {
      const list = await api.get<NotificationDTO[]>('/api/notifications');
      const countRes = await api.get<{ unreadCount: number }>('/api/notifications/unread-count');
      setNotifications(list);
      setUnreadCount(countRes.unreadCount);
    } catch (err) {
      // Ignore notification fetch failures
    }
  };

  useEffect(() => {
    if (!isAuthenticated) {
      setNotifications([]);
      setUnreadCount(0);
      return;
    }

    fetchNotifications();

    const socket = getSocket();
    if (socket) {
      const handleNotification = (notif: any) => {
        setNotifications((prev) => [notif, ...prev]);
        setUnreadCount((prev) => prev + 1);

        // Add toast popup
        const toastId = Math.random().toString(36).substring(2, 9);
        setToasts((prev) => [...prev, { id: toastId, title: notif.title, body: notif.body, type: notif.type }]);

        setTimeout(() => {
          dismissToast(toastId);
        }, 5000);
      };

      socket.on('notification', handleNotification);
      return () => {
        socket.off('notification', handleNotification);
      };
    }
  }, [isAuthenticated]);

  const dismissToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  const markAsRead = async (id: string) => {
    await api.patch(`/api/notifications/${id}/read`);
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, isRead: true } : n)));
    setUnreadCount((prev) => Math.max(0, prev - 1));
  };

  const markAllAsRead = async () => {
    await api.post('/api/notifications/mark-all-read');
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    setUnreadCount(0);
  };

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        unreadCount,
        toasts,
        dismissToast,
        markAsRead,
        markAllAsRead,
        refreshNotifications: fetchNotifications,
      }}
    >
      {children}

      {/* Global Real-time Toast Notifications Display */}
      <div className="fixed bottom-5 right-5 z-50 flex flex-col space-y-3 max-w-sm pointer-events-none">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className="pointer-events-auto bg-white border border-teal-500/30 shadow-xl rounded-xl p-4 flex items-start space-x-3 animate-slide-up transform transition-all duration-300"
          >
            <div className="w-2.5 h-2.5 rounded-full bg-teal-600 mt-1.5 shrink-0 animate-ping"></div>
            <div className="flex-1">
              <h4 className="text-sm font-semibold text-slate-900">{toast.title}</h4>
              <p className="text-xs text-slate-600 mt-0.5">{toast.body}</p>
            </div>
            <button
              onClick={() => dismissToast(toast.id)}
              className="text-slate-400 hover:text-slate-600 text-xs font-bold"
            >
              ✕
            </button>
          </div>
        ))}
      </div>
    </NotificationContext.Provider>
  );
};

export function useNotifications() {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
}
