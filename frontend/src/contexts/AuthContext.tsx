import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react';
import api from '../services/api';

export interface User {
  id: number;
  email: string;
  name: string | null;
  picture: string | null;
  created_at: string;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  isGuest: boolean;
  login: () => void;
  loginAsGuest: () => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const TOKEN_KEY = 'investiq_token';
const GUEST_KEY = 'investiq_guest';

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(() => {
    return localStorage.getItem(TOKEN_KEY);
  });
  const [isGuest, setIsGuest] = useState<boolean>(() => {
    return localStorage.getItem(GUEST_KEY) === 'true';
  });
  const [isLoading, setIsLoading] = useState(true);

  // Set up axios interceptor to include token in requests
  useEffect(() => {
    const interceptor = api.interceptors.request.use(
      (config) => {
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => Promise.reject(error)
    );

    return () => {
      api.interceptors.request.eject(interceptor);
    };
  }, [token]);

  // Fetch user info when token exists
  useEffect(() => {
    async function fetchUser() {
      // If guest mode is active, skip token check
      if (isGuest) {
        setIsLoading(false);
        return;
      }

      if (!token) {
        setIsLoading(false);
        return;
      }

      try {
        const response = await api.get<User>('/auth/me');
        setUser(response.data);
      } catch {
        // Token is invalid, clear it
        localStorage.removeItem(TOKEN_KEY);
        setToken(null);
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    }

    fetchUser();
  }, [token, isGuest]);

  // Handle OAuth callback - check for token in URL
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const urlToken = params.get('token');
    const authError = params.get('auth_error');

    if (urlToken) {
      // Save token and clean URL
      localStorage.setItem(TOKEN_KEY, urlToken);
      setToken(urlToken);
      window.history.replaceState({}, document.title, window.location.pathname);
    } else if (authError) {
      console.error('Auth error:', authError);
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, []);

  const login = useCallback(async () => {
    try {
      const response = await api.get<{ auth_url: string }>('/auth/google/login');
      window.location.href = response.data.auth_url;
    } catch (error) {
      console.error('Failed to initiate login:', error);
    }
  }, []);

  const loginAsGuest = useCallback(() => {
    localStorage.setItem(GUEST_KEY, 'true');
    setIsGuest(true);
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(GUEST_KEY);
    setToken(null);
    setUser(null);
    setIsGuest(false);
  }, []);

  const value: AuthContextType = {
    user,
    token,
    isLoading,
    isAuthenticated: !!user || isGuest,
    isGuest,
    login,
    loginAsGuest,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
