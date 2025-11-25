import React, { createContext, useContext, useState, useCallback } from 'react';
import { User, UserRole } from '@/types';

interface AuthContextType {
  user: User | null;
  login: (username: string, password: string) => Promise<boolean>;
  logout: () => void;
  isAdmin: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Mock users for MVP
const MOCK_USERS: Record<string, { password: string; user: User }> = {
  admin: {
    password: 'admin123',
    user: {
      id: '1',
      username: 'admin',
      role: 'admin',
      name: 'Store Owner',
    },
  },
  staff: {
    password: 'staff123',
    user: {
      id: '2',
      username: 'staff',
      role: 'staff',
      name: 'Billing Staff',
    },
  },
};

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(() => {
    const saved = localStorage.getItem('smartbill_user');
    return saved ? JSON.parse(saved) : null;
  });

  const login = useCallback(async (username: string, password: string) => {
    const mockUser = MOCK_USERS[username.toLowerCase()];
    if (mockUser && mockUser.password === password) {
      setUser(mockUser.user);
      localStorage.setItem('smartbill_user', JSON.stringify(mockUser.user));
      return true;
    }
    return false;
  }, []);

  const logout = useCallback(() => {
    setUser(null);
    localStorage.removeItem('smartbill_user');
  }, []);

  const isAdmin = user?.role === 'admin';

  return (
    <AuthContext.Provider value={{ user, login, logout, isAdmin }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
