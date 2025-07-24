import { createContext, useContext, useEffect, useState, type ReactNode, type FC } from 'react';
import { jwtDecode } from 'jwt-decode';
import type { UserPayload } from '../types/User';
import { logout as performLogout } from './auth';
import React from 'react';
import { addAuthTokenToApi, removeAuthTokenFromApi } from '../api/api';

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
    const storedToken = localStorage.getItem('token');
    if (storedToken) {
      try {
        const decoded = jwtDecode<UserPayload>(storedToken);
        console.log('Decoded token:', decoded);
        setToken(storedToken);
        setUser(decoded);
        addAuthTokenToApi(storedToken)
        setIsLoading(false);
      } catch (error) {
        console.error('Token decoding error:', error);
        performLogout();
        setToken(null);
        removeAuthTokenFromApi()
        setUser(null);
        setIsLoading(false);
      }
    } else {
      console.warn('No token in localStorage');
      setIsLoading(false);
    }
  }, []);

  const login = (token: string) => {
    localStorage.setItem('token', token);
    const decoded = jwtDecode<UserPayload>(token);
    setToken(token);
    setUser(decoded);
  };

  const logout = () => {
    performLogout();
    setToken(null);
    setUser(null);
    window.location.href = '/';
  };

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
