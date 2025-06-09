import React, { createContext, useContext, useState, useEffect } from 'react';
import NetInfo from '@react-native-community/netinfo';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '@/lib/supabase';

interface OfflineContextType {
  isOnline: boolean;
  lastSync: Date | null;
  issyncing: boolean;
  syncData: () => Promise<void>;
  queueLocalAction: (action: LocalAction) => void;
}

interface LocalAction {
  id: string;
  type: 'create' | 'update' | 'delete';
  table: string;
  data: any;
  timestamp: number;
}

const OfflineContext = createContext<OfflineContextType | undefined>(undefined);

export function OfflineProvider({ children }: { children: React.ReactNode }) {
  const [isOnline, setIsOnline] = useState(true);
  const [lastSync, setLastSync] = useState<Date | null>(null);
  const [isSync] = useState(false);
  
  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener(state => {
      const online = state.isConnected && state.isInternetReachable;
      setIsOnline(!!online);
      
      // Auto sync when coming back online
      if (online && !isOnline) {
        syncData();
      }
    });

    loadLastSync();

    return () => unsubscribe();
  }, []);

  const loadLastSync = async () => {
    try {
      const saved = await AsyncStorage.getItem('lastSync');
      if (saved) {
        setLastSync(new Date(saved));
      }
    } catch (error) {
      console.error('Error loading last sync:', error);
    }
  };

  const syncData = async () => {
    if (!isOnline) return;

    try {
      // Get pending local actions
      const pendingActions = await AsyncStorage.getItem('pendingActions');
      const actions: LocalAction[] = pendingActions ? JSON.parse(pendingActions) : [];

      // Process each pending action
      for (const action of actions) {
        try {
          switch (action.type) {
            case 'create':
              await supabase.from(action.table).insert(action.data);
              break;
            case 'update':
              await supabase.from(action.table).update(action.data).eq('id', action.data.id);
              break;
            case 'delete':
              await supabase.from(action.table).delete().eq('id', action.data.id);
              break;
          }
        } catch (error) {
          console.error(`Error syncing ${action.type} action:`, error);
        }
      }

      // Clear processed actions
      await AsyncStorage.removeItem('pendingActions');

      // Update last sync time
      const now = new Date();
      setLastSync(now);
      await AsyncStorage.setItem('lastSync', now.toISOString());

    } catch (error) {
      console.error('Error syncing data:', error);
    }
  };

  const queueLocalAction = async (action: LocalAction) => {
    try {
      const pendingActions = await AsyncStorage.getItem('pendingActions');
      const actions: LocalAction[] = pendingActions ? JSON.parse(pendingActions) : [];
      
      actions.push(action);
      await AsyncStorage.setItem('pendingActions', JSON.stringify(actions));
    } catch (error) {
      console.error('Error queuing local action:', error);
    }
  };

  return (
    <OfflineContext.Provider value={{
      isOnline,
      lastSync,
      isSync,
      syncData,
      queueLocalAction,
    }}>
      {children}
    </OfflineContext.Provider>
  );
}

export function useOffline() {
  const context = useContext(OfflineContext);
  if (context === undefined) {
    throw new Error('useOffline must be used within an OfflineProvider');
  }
  return context;
}