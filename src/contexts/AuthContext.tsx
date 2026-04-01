import React, { createContext, useContext, useState } from 'react';
import { API_BASE_URL } from '../config';

export interface User {
  id: string;
  name: string;
  phoneNumber: string;
  email: string;
  role: string;
  permissions?: string[];
}

interface LoginResult {
  success: boolean;
  role?: string;
}

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<LoginResult>;
  logout: () => void;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(() => {
    const savedUser = localStorage.getItem('authUser');
    return savedUser ? JSON.parse(savedUser) : null;
  });
  const [isLoading, setIsLoading] = useState(false);

  const login = async (email: string, password: string): Promise<LoginResult> => {
    setIsLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim(), password }),
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok || !data.success || !data.token) {
        setIsLoading(false);
        return { success: false };
      }

      const authUser: User = {
        id: data.user.id,
        name: data.user.name,
        phoneNumber: data.user.phoneNumber || '',
        email: data.user.email,
        role: data.user.role,
        permissions: data.user.permissions || [],
      };

      localStorage.setItem('authToken', data.token);
      localStorage.setItem('authUser', JSON.stringify(authUser));
      setUser(authUser);
      setIsLoading(false);
      return { success: true, role: authUser.role };
    } catch (err) {
      console.error('Login error:', err);
      setIsLoading(false);
      return { success: false };
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('authUser');
    localStorage.removeItem('authToken');
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
};
