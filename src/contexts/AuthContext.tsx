import React, { createContext, useContext, useState } from 'react';
import bcrypt from 'bcryptjs';

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
}

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<boolean>;
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

  const login = async (email: string, password: string): Promise<boolean> => {
    setIsLoading(true);
    try {
      // Commented out API authentication
      // const response = await fetch('https://adminnirwana-back-1.onrender.com/admin/users');
      // const users = await response.json();
      // console.log('Fetched users:', users);
      // const matchedUser = users.find((u: any) => u.email === email);
      // if (!matchedUser) {
      //   setIsLoading(false);
      //   return false;
      // }

      // const isPasswordMatch = await bcrypt.compare(password, matchedUser.password);
      // if (!isPasswordMatch) {
      //   setIsLoading(false);
      //   return false;
      // }

      // Mock authentication - accept any credentials
      const authUser: User = {
        id: '1',
        name: 'Admin User',
        email: email,
        role: 'admin',
      };

      setUser(authUser);
      localStorage.setItem('authUser', JSON.stringify(authUser)); // persist login
      setIsLoading(false);
      return true;
    } catch (err) {
      console.error('Login error:', err);
      setIsLoading(false);
      return false;
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('authUser'); // clear stored login
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
};
