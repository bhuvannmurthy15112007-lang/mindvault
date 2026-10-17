'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { 
  User as FirebaseUser,
  signOut,
  onAuthStateChanged
} from 'firebase/auth';
import { auth } from '@/lib/firebase/client';
import { AuthenticatedUser } from '@/types';

interface AuthContextType {
  firebaseUser: FirebaseUser | null;
  dbUser: AuthenticatedUser | null;
  token: string | null;
  loading: boolean;
  login: (email: string, pass: string) => Promise<void>;
  register: (email: string, pass: string, displayName: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  firebaseUser: null,
  dbUser: null,
  token: null,
  loading: true,
  login: async () => {},
  register: async () => {},
  logout: async () => {},
  refreshUser: async () => {}
});

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [dbUser, setDbUser] = useState<AuthenticatedUser | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  // Sync token with server to retrieve full profile & roles
  const syncWithMySQL = async (authToken: string, displayName?: string) => {
    try {
      const res = await fetch('/api/auth/sync', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer ' + authToken
        },
        body: JSON.stringify({ displayName })
      });
      if (res.ok) {
        const data = await res.json();
        setDbUser(data.user);
        if (typeof window !== 'undefined') {
          localStorage.setItem('mindvault_user', JSON.stringify(data.user));
        }
      }
    } catch (err) {
      console.error('Error syncing user with MySQL:', err);
    }
  };

  const refreshUser = async () => {
    const activeToken = token || (typeof window !== 'undefined' ? localStorage.getItem('mindvault_token') : null);
    if (activeToken) {
      try {
        const res = await fetch('/api/auth/me', {
          headers: {
            'Authorization': 'Bearer ' + activeToken
          }
        });
        if (res.ok) {
          const data = await res.json();
          setDbUser(data.user);
          if (typeof window !== 'undefined') {
            localStorage.setItem('mindvault_user', JSON.stringify(data.user));
          }
          return;
        }
      } catch (e) {
        console.error('Error refreshing player profile:', e);
      }
    }

    if (firebaseUser) {
      try {
        const idToken = await firebaseUser.getIdToken(true);
        setToken(idToken);
        await syncWithMySQL(idToken);
      } catch (e) {}
    }
  };

  // Restore session from localStorage on mount and register Firebase listener as optional fallback
  useEffect(() => {
    let restored = false;
    if (typeof window !== 'undefined') {
      const storedToken = localStorage.getItem('mindvault_token');
      const storedUserStr = localStorage.getItem('mindvault_user');
      if (storedToken && storedUserStr) {
        try {
          const parsedUser = JSON.parse(storedUserStr);
          setToken(storedToken);
          setDbUser(parsedUser);
          restored = true;
          // Validate stored token in background
          fetch('/api/auth/me', {
            headers: { 'Authorization': 'Bearer ' + storedToken }
          }).then(res => {
            if (res.ok) {
              return res.json().then(data => {
                setDbUser(data.user);
                localStorage.setItem('mindvault_user', JSON.stringify(data.user));
              });
            } else if (res.status === 401) {
              // Token expired, clear invalid session
              localStorage.removeItem('mindvault_token');
              localStorage.removeItem('mindvault_user');
              setToken(null);
              setDbUser(null);
            }
          }).catch(() => {});
        } catch (e) {}
      }
    }

    let unsubscribe = () => {};
    try {
      unsubscribe = onAuthStateChanged(auth, async (user) => {
        setFirebaseUser(user);
        if (user && !restored) {
          try {
            const idToken = await user.getIdToken();
            setToken(idToken);
            if (typeof window !== 'undefined') {
              localStorage.setItem('mindvault_token', idToken);
            }
            await syncWithMySQL(idToken, user.displayName || undefined);
          } catch (err) {
            console.error('Error retrieving ID token:', err);
          }
        }
        setLoading(false);
      });
    } catch (e) {
      // Firebase auth not initialized or offline; normal player session handles state
      setLoading(false);
    }

    if (restored) {
      setLoading(false);
    }

    return () => unsubscribe();
  }, []);

  // Dedicated MySQL Player Login
  const login = async (email: string, pass: string) => {
    setLoading(true);
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password: pass })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Authentication failed');
      }

      setToken(data.token);
      setDbUser(data.user);
      if (typeof window !== 'undefined') {
        localStorage.setItem('mindvault_token', data.token);
        localStorage.setItem('mindvault_user', JSON.stringify(data.user));
      }
    } finally {
      setLoading(false);
    }
  };

  // Dedicated MySQL Player Registration (Zero Firebase Auth requirement)
  const register = async (email: string, pass: string, displayName: string) => {
    setLoading(true);
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password: pass, displayName })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Registration failed');
      }

      setToken(data.token);
      setDbUser(data.user);
      if (typeof window !== 'undefined') {
        localStorage.setItem('mindvault_token', data.token);
        localStorage.setItem('mindvault_user', JSON.stringify(data.user));
      }
    } finally {
      setLoading(false);
    }
  };

  // Sign out from application session and Firebase
  const logout = async () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('mindvault_token');
      localStorage.removeItem('mindvault_user');
    }
    setFirebaseUser(null);
    setDbUser(null);
    setToken(null);
    try {
      await signOut(auth);
    } catch (e) {}
  };

  return (
    <AuthContext.Provider value={{
      firebaseUser,
      dbUser,
      token,
      loading,
      login,
      register,
      logout,
      refreshUser
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
