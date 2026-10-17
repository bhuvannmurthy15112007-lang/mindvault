const fs = require('fs');
const path = require('path');

const authContextContent = `'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { 
  User as FirebaseUser,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
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

  const syncWithMySQL = async (idToken: string, displayName?: string) => {
    try {
      const res = await fetch('/api/auth/sync', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer ' + idToken
        },
        body: JSON.stringify({ displayName })
      });
      if (res.ok) {
        const data = await res.json();
        setDbUser(data.user);
      } else {
        console.error('Failed to sync user with MySQL:', await res.text());
      }
    } catch (err) {
      console.error('Error syncing user with MySQL:', err);
    }
  };

  const refreshUser = async () => {
    if (firebaseUser) {
      const idToken = await firebaseUser.getIdToken(true);
      setToken(idToken);
      await syncWithMySQL(idToken);
    }
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setFirebaseUser(user);
      if (user) {
        try {
          const idToken = await user.getIdToken();
          setToken(idToken);
          await syncWithMySQL(idToken, user.displayName || undefined);
        } catch (err) {
          console.error('Error retrieving ID token:', err);
        }
      } else {
        setDbUser(null);
        setToken(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const login = async (email: string, pass: string) => {
    setLoading(true);
    try {
      const cred = await signInWithEmailAndPassword(auth, email, pass);
      const idToken = await cred.user.getIdToken();
      setToken(idToken);
      await syncWithMySQL(idToken);
    } finally {
      setLoading(false);
    }
  };

  const register = async (email: string, pass: string, displayName: string) => {
    setLoading(true);
    try {
      const cred = await createUserWithEmailAndPassword(auth, email, pass);
      const idToken = await cred.user.getIdToken();
      setToken(idToken);
      await syncWithMySQL(idToken, displayName);
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    await signOut(auth);
    setFirebaseUser(null);
    setDbUser(null);
    setToken(null);
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
`;

fs.writeFileSync(path.join(__dirname, 'lib', 'auth', 'AuthContext.tsx'), authContextContent);
console.log('lib/auth/AuthContext.tsx created successfully.');
