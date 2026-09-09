import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { Alert } from 'react-native';
import { api } from '../services/api';
import { tokenStorage } from '../storage/tokenStorage';
import { User } from '../types/auth';

type AuthContextValue = { user: User | null; restoring: boolean; login: (email: string, password: string) => Promise<void>; logout: () => Promise<void> };
const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [restoring, setRestoring] = useState(true);
  useEffect(() => {
    tokenStorage.get().then(async (token) => {
      if (token) {
        try { setUser((await api.get('/auth/me')).data.data); } catch { await tokenStorage.clear(); }
      }
      setRestoring(false);
    });
  }, []);
  const value = useMemo<AuthContextValue>(() => ({
    user,
    restoring,
    login: async (email, password) => {
      try {
        const response = await api.post('/auth/login', { email, password });
        await tokenStorage.set(response.data.data.token);
        setUser(response.data.data.user);
      } catch (error: any) {
        const message = error.response?.data?.error || (error.request ? 'Backend unavailable or network error.' : 'Unable to sign in.');
        Alert.alert('Login failed', message);
        throw error;
      }
    },
    logout: async () => {
      try { await api.post('/auth/logout'); } finally { await tokenStorage.clear(); setUser(null); }
    },
  }), [restoring, user]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used inside AuthProvider');
  return context;
}
