import React, { createContext, useContext, useState, useEffect } from 'react';
import { authApi, AuthUser, AuthOrg, getToken, setToken, removeToken } from './api';

interface AuthContextValue {
  user: AuthUser | null;
  organization: AuthOrg | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (token: string, user: AuthUser, org: AuthOrg) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [organization, setOrganization] = useState<AuthOrg | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    getToken().then(async (token) => {
      if (!token) { setIsLoading(false); return; }
      try {
        const { user, organization } = await authApi.me();
        setUser(user);
        setOrganization(organization);
      } catch {
        await removeToken();
      } finally {
        setIsLoading(false);
      }
    });
  }, []);

  async function login(token: string, u: AuthUser, org: AuthOrg) {
    await setToken(token);
    setUser(u);
    setOrganization(org);
  }

  async function logout() {
    await removeToken();
    setUser(null);
    setOrganization(null);
  }

  return (
    <AuthContext.Provider value={{ user, organization, isLoading, isAuthenticated: !!user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
}
