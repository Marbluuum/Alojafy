import { createContext, useContext, useState, useEffect } from 'react';
import type { ReactNode } from 'react';
import { authApi } from './api';
import type { AuthUser, AuthOrg, OrgWithRole } from './api';

interface AuthContextValue {
  user: AuthUser | null;
  organization: AuthOrg | null;
  token: string | null;
  availableOrgs: OrgWithRole[];
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (token: string, user: AuthUser, org: AuthOrg, orgs?: OrgWithRole[]) => void;
  logout: () => void;
  switchOrg: (orgId: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

const TOKEN_KEY = 'alojafy_token';
const ORGS_KEY = 'alojafy_orgs';

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [organization, setOrganization] = useState<AuthOrg | null>(null);
  const [token, setToken] = useState<string | null>(() => localStorage.getItem(TOKEN_KEY));
  const [availableOrgs, setAvailableOrgs] = useState<OrgWithRole[]>(() => {
    try {
      const stored = localStorage.getItem(ORGS_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const storedToken = localStorage.getItem(TOKEN_KEY);
    if (!storedToken) {
      setIsLoading(false);
      return;
    }
    authApi.me()
      .then(({ user, organization }) => {
        setUser(user);
        setOrganization(organization);
        setToken(storedToken);
        // Refresh available orgs
        authApi.organizations()
          .then(({ organizations }) => {
            setAvailableOrgs(organizations);
            localStorage.setItem(ORGS_KEY, JSON.stringify(organizations));
          })
          .catch(() => {/* non-critical */});
      })
      .catch(() => {
        localStorage.removeItem(TOKEN_KEY);
        localStorage.removeItem(ORGS_KEY);
        setToken(null);
        setAvailableOrgs([]);
      })
      .finally(() => setIsLoading(false));
  }, []);

  function login(newToken: string, newUser: AuthUser, newOrg: AuthOrg, orgs?: OrgWithRole[]) {
    localStorage.setItem(TOKEN_KEY, newToken);
    setToken(newToken);
    setUser(newUser);
    setOrganization(newOrg);
    if (orgs) {
      setAvailableOrgs(orgs);
      localStorage.setItem(ORGS_KEY, JSON.stringify(orgs));
    }
  }

  function logout() {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(ORGS_KEY);
    setToken(null);
    setUser(null);
    setOrganization(null);
    setAvailableOrgs([]);
  }

  async function switchOrg(orgId: string) {
    const response = await authApi.switchOrg(orgId);
    login(response.token, response.user, response.organization, response.organizations);
    // Reload the page to refresh all queries for the new org
    window.location.href = '/';
  }

  return (
    <AuthContext.Provider value={{
      user, organization, token, availableOrgs, isLoading,
      isAuthenticated: !!user,
      login, logout, switchOrg,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
}
