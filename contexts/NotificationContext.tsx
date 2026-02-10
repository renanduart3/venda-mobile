import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface Notification {
  id: string;
  type: 'low_stock' | 'overdue_expense' | 'no_sales' | 'general';
  title: string;
  message: string;
  timestamp: number;
  resolved: boolean;
  actionData?: any;
}

interface NotificationContextType {
  notifications: Notification[];
  unreadCount: number;
  addNotification: (notification: Omit<Notification, 'id' | 'timestamp' | 'resolved'>) => void;
  markAsResolved: (id: string) => void;
  clearAll: () => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export function NotificationProvider({ children }: { children: React.ReactNode }) {
  const [notifications, setNotifications] = useState<Notification[]>([]);

  // Memoize unread count to avoid recalculating on every render (performance optimization)
  const unreadCount = React.useMemo(
    () => notifications.filter(n => !n.resolved).length,
    [notifications]
  );

  useEffect(() => {
    loadNotifications();
  }, []);

  const loadNotifications = async () => {
    try {
      const saved = await AsyncStorage.getItem('notifications');
      if (saved) {
        setNotifications(JSON.parse(saved));
      }
    } catch (error) {
      console.error('Error loading notifications:', error);
    }
  };

  const saveNotifications = async (newNotifications: Notification[]) => {
    try {
      await AsyncStorage.setItem('notifications', JSON.stringify(newNotifications));
    } catch (error) {
      console.error('Error saving notifications:', error);
    }
  };

  const addNotification = React.useCallback((notification: Omit<Notification, 'id' | 'timestamp' | 'resolved'>) => {
    const now = Date.now();
    setNotifications(prev => {
      // dedupe: don't add if same type+title+message unresolved in the last 12h
      const twelveHours = 12 * 60 * 60 * 1000;
      const exists = prev.some(n =>
        !n.resolved &&
        n.type === notification.type &&
        n.title === notification.title &&
        n.message === notification.message &&
        (now - n.timestamp) < twelveHours
      );
      if (exists) return prev;
      const newNotification: Notification = {
        ...notification,
        id: now.toString(),
        timestamp: now,
        resolved: false,
      };
      const updated = [newNotification, ...prev].slice(0, 100); // cap list to 100
      saveNotifications(updated);
      return updated;
    });
  }, []);

  const markAsResolved = React.useCallback((id: string) => {
    setNotifications(prev => {
      const updated = prev.map(n => 
        n.id === id ? { ...n, resolved: true } : n
      );
      saveNotifications(updated);
      return updated;
    });
  }, []);

  const clearAll = React.useCallback(() => {
    setNotifications([]);
    saveNotifications([]);
  }, []);

  // Memoize context value to prevent unnecessary re-renders (performance optimization)
  const contextValue = React.useMemo(() => ({
    notifications,
    unreadCount,
    addNotification,
    markAsResolved,
    clearAll,
  }), [notifications, unreadCount, addNotification, markAsResolved, clearAll]);

  return (
    <NotificationContext.Provider value={contextValue}>
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotifications() {
  const context = useContext(NotificationContext);
  if (context === undefined) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
}
