import React, { createContext, useContext, useState, useEffect } from 'react';
import { UserDTO, UserRole } from '@yatrashare/shared';
import { api, ApiError } from '../lib/api';
import { getSocket, disconnectSocket } from '../lib/socket';

interface AuthContextType {
  user: UserDTO | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (data: any) => Promise<void>;
  logout: () => Promise<void>;
  updateUser: (updated: Partial<UserDTO>) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserDTO | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    async function loadUser() {
      const token = localStorage.getItem('yatrashare_access_token');
      if (!token) {
        setIsLoading(false);
        return;
      }

      try {
        const userData = await api.get<UserDTO>('/api/auth/me');
        setUser(userData);
        getSocket(); // Initialize WebSocket connection
      } catch (err) {
        localStorage.removeItem('yatrashare_access_token');
        localStorage.removeItem('yatrashare_refresh_token');
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    }

    loadUser();

    const handleLogoutEvent = () => {
      setUser(null);
      disconnectSocket();
    };

    window.addEventListener('auth_logout', handleLogoutEvent);
    return () => window.removeEventListener('auth_logout', handleLogoutEvent);
  }, []);

  const login = async (email: string, password: string) => {
    const res = await api.post<any>('/api/auth/login', { email, password });
    localStorage.setItem('yatrashare_access_token', res.accessToken);
    localStorage.setItem('yatrashare_refresh_token', res.refreshToken);
    setUser(res.user);
    getSocket();
  };

  const register = async (data: any) => {
    const res = await api.post<any>('/api/auth/register', data);
    localStorage.setItem('yatrashare_access_token', res.accessToken);
    localStorage.setItem('yatrashare_refresh_token', res.refreshToken);
    setUser(res.user);
    getSocket();
  };

  const logout = async () => {
    const refreshToken = localStorage.getItem('yatrashare_refresh_token');
    try {
      await api.post('/api/auth/logout', { refreshToken });
    } catch (err) {
      // Ignore logout errors
    } finally {
      localStorage.removeItem('yatrashare_access_token');
      localStorage.removeItem('yatrashare_refresh_token');
      setUser(null);
      disconnectSocket();
    }
  };

  const updateUser = (updated: Partial<UserDTO>) => {
    setUser((prev) => (prev ? { ...prev, ...updated } : null));
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isLoading,
        login,
        register,
        logout,
        updateUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
