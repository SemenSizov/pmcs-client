import { createContext, useContext, useEffect, useState, type ReactNode, type FC } from 'react';
import { jwtDecode } from 'jwt-decode';
import type { UserPayload } from '../types/User';
import React from 'react';
import { addAuthTokenToApi, removeAuthTokenFromApi } from '../api/api';
import { clearToken } from './auth';
import { setLogout } from '../api/authService';

export interface AuthContextType {
  token: string | null;
  user: UserPayload | null;
  login: (token: string) => void;
  logout: () => void;
  isAuthenticated: boolean;
  isLoading: boolean;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: FC<AuthProviderProps> = ({ children }) => {
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<UserPayload | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const storedToken = sessionStorage.getItem('token');
    if (storedToken) {
      try {
        const decoded = jwtDecode<UserPayload>(storedToken);
        setToken(storedToken);
        setUser(decoded);
        addAuthTokenToApi(storedToken)
      } catch (error) {
        console.error('Token decoding error:', error);
        clearToken();
        setToken(null);
        removeAuthTokenFromApi()
        setUser(null);
        setIsLoading(false);
      }
    }
    setIsLoading(false);
  }, []);

  const login = (token: string) => {
    sessionStorage.setItem('token', token);
    const decoded = jwtDecode<UserPayload>(token);
    setToken(token);
    setUser(decoded);
    addAuthTokenToApi(token)
  };

  const logout = () => {
    clearToken();
    setToken(null);
    setUser(null);
    window.location.href = '/';
  };

  useEffect(() => {
    setLogout(logout);
  })

  return React.createElement(
    AuthContext.Provider,
    { value: { token, user, login, logout, isAuthenticated: !!token, isLoading } },
    children
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
};
