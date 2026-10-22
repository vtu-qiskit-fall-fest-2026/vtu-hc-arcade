'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { apiService } from '@/services/api';
import { UserAccount } from '@/types/api';

interface AuthContextType {
  user: UserAccount | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  isSuperadmin: boolean;
  isPending: boolean;
  login: (identifier: string, password: string) => Promise<UserAccount>;
  register: (payload: {
    email: string;
    password: string;
    full_name?: string;
    location?: string;
    phone?: string;
  }) => Promise<UserAccount>;
  logout: () => void;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const AUTH_STORAGE_KEY = 'q_irrigate_auth_user';
const TOKEN_STORAGE_KEY = 'q_irrigate_auth_token';

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<UserAccount | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Restore authenticated session on client mount
  useEffect(() => {
    try {
      const storedToken = localStorage.getItem(TOKEN_STORAGE_KEY);
      const storedUser = localStorage.getItem(AUTH_STORAGE_KEY);
      if (storedToken && storedUser) {
        const parsed = JSON.parse(storedUser) as UserAccount;
        setUser(parsed);
        setToken(storedToken);
      }
    } catch (err) {
      console.warn('Failed to parse cached auth session:', err);
      localStorage.removeItem(AUTH_STORAGE_KEY);
      localStorage.removeItem(TOKEN_STORAGE_KEY);
      localStorage.removeItem('q_irrigate_auth');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const login = useCallback(async (identifier: string, password: string) => {
    setIsLoading(true);
    try {
      const isEmail = identifier.includes('@');
      const res = await apiService.login({
        [isEmail ? 'email' : 'username']: identifier.trim(),
        password,
      });

      const userAccount = res.user;
      const userToken = res.token || `token_${userAccount.id}`;

      setUser(userAccount);
      setToken(userToken);

      try {
        localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(userAccount));
        localStorage.setItem(TOKEN_STORAGE_KEY, userToken);
        localStorage.setItem('q_irrigate_auth', 'true');
        localStorage.setItem('q_irrigate_auth_email', userAccount.email);
        localStorage.setItem(
          'q_irrigate_operator_profile',
          JSON.stringify({
            name: userAccount.full_name || userAccount.username,
            role: userAccount.role === 'SUPERADMIN'
              ? 'Station Superadmin'
              : userAccount.role === 'FIELD_ENGINEER'
              ? 'Field Engineer / Operator'
              : userAccount.role === 'AGRONOMIST'
              ? 'Agronomist & Solar Analyst'
              : userAccount.role === 'FARMER'
              ? 'Farm Owner / Viewer'
              : 'Pending Assignment',
            email: userAccount.email,
            phone: userAccount.phone || '+91 98765 43210',
            location: userAccount.location || 'Primary Farm Station',
            gatewayId: userAccount.gateway_id || 'GW-AGRI-01',
          })
        );
      } catch (storageErr) {
        console.warn('Could not write to localStorage:', storageErr);
      }

      return userAccount;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const register = useCallback(
    async (payload: {
      email: string;
      password: string;
      full_name?: string;
      location?: string;
      phone?: string;
    }) => {
      setIsLoading(true);
      try {
        const res = await apiService.register(payload);
        const userAccount = res.user;
        const userToken = `token_${userAccount.id}`;

        setUser(userAccount);
        setToken(userToken);

        try {
          localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(userAccount));
          localStorage.setItem(TOKEN_STORAGE_KEY, userToken);
          localStorage.setItem('q_irrigate_auth', 'true');
          localStorage.setItem('q_irrigate_auth_email', userAccount.email);
        } catch {}

        return userAccount;
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  const logout = useCallback(() => {
    setUser(null);
    setToken(null);
    try {
      localStorage.removeItem(AUTH_STORAGE_KEY);
      localStorage.removeItem(TOKEN_STORAGE_KEY);
      localStorage.removeItem('q_irrigate_auth');
      localStorage.removeItem('q_irrigate_auth_email');
      sessionStorage.clear();
    } catch {}
  }, []);

  const refreshUser = useCallback(async () => {
    if (!user) return;
    try {
      const usersRes = await apiService.getUsers();
      const current = usersRes.users.find((u) => u.id === user.id);
      if (current) {
        setUser(current);
        localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(current));
      }
    } catch (err) {
      console.warn('Failed to refresh user profile from backend:', err);
    }
  }, [user]);

  const isAuthenticated = Boolean(user && token);
  const isSuperadmin = Boolean(user?.is_superuser || user?.role === 'SUPERADMIN');
  const isPending = Boolean(user?.role === 'PENDING');

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated,
        isLoading,
        isSuperadmin,
        isPending,
        login,
        register,
        logout,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
