import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface AdminAuth {
  token: string | null;
  email: string | null;
  isAuthenticated: boolean;
  login: (token: string, email: string) => void;
  logout: () => void;
}

const AdminAuthContext = createContext<AdminAuth>({
  token: null,
  email: null,
  isAuthenticated: false,
  login: () => {},
  logout: () => {},
});

export const useAdminAuth = () => useContext(AdminAuthContext);

export const AdminAuthProvider = ({ children }: { children: ReactNode }) => {
  const [token, setToken] = useState<string | null>(localStorage.getItem('admin_token'));
  const [email, setEmail] = useState<string | null>(localStorage.getItem('admin_email'));

  const isAuthenticated = !!token;

  const login = (t: string, e: string) => {
    setToken(t);
    setEmail(e);
    localStorage.setItem('admin_token', t);
    localStorage.setItem('admin_email', e);
  };

  const logout = () => {
    setToken(null);
    setEmail(null);
    localStorage.removeItem('admin_token');
    localStorage.removeItem('admin_email');
  };

  // Check token expiry
  useEffect(() => {
    if (token) {
      try {
        const payload = JSON.parse(atob(token));
        if (Date.now() - payload.ts > 86400000) logout();
      } catch {
        logout();
      }
    }
  }, [token]);

  return (
    <AdminAuthContext.Provider value={{ token, email, isAuthenticated, login, logout }}>
      {children}
    </AdminAuthContext.Provider>
  );
};
