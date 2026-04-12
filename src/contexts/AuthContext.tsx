import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { onAuthStateChanged, signInWithEmailAndPassword, signOut } from 'firebase/auth';
import { auth, firestore } from '../lib/firebase';
import { doc, getDoc } from 'firebase/firestore';

interface AuthUser {
  id: string;
  email?: string;
  name?: string;
  phone?: string;
  photoUrl?: string;
  rating?: number;
}

interface AuthContextType {
  user: AuthUser | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
};

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        // Try to enrich with Firestore driver profile
        try {
          const driverSnap = await getDoc(doc(firestore, 'drivers', firebaseUser.uid));
          const data = driverSnap.exists() ? driverSnap.data() : {};
          setUser({
            id: firebaseUser.uid,
            email: firebaseUser.email || data.email,
            name: data.name || firebaseUser.displayName || '',
            phone: data.phone || firebaseUser.phoneNumber || '',
            photoUrl: data.photoUrl || firebaseUser.photoURL || '',
            rating: data.rating,
          });
        } catch {
          setUser({ id: firebaseUser.uid, email: firebaseUser.email || '' });
        }
      } else {
        setUser(null);
      }
      setLoading(false);
    });
    return unsub;
  }, []);

  const login = async (email: string, password: string) => {
    await signInWithEmailAndPassword(auth, email, password);
  };

  const logout = async () => {
    await signOut(auth);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}
