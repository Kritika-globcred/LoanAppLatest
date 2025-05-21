'use client';

import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { 
  User, 
  GoogleAuthProvider,
  signInWithPopup,
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
  onAuthStateChanged as firebaseOnAuthStateChanged,
  AuthError,
  Auth
} from 'firebase/auth';
import { useRouter } from 'next/navigation';
import { auth } from '../lib/firebase';

type AuthContextType = {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
  isAdmin: boolean;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  // Handle auth state changes
  useEffect(() => {
    const authInstance = auth();
    if (!authInstance) {
      console.error('Firebase auth not available in this environment');
      setLoading(false);
      return;
    }
    
    const unsubscribe = firebaseOnAuthStateChanged(authInstance, async (user) => {
      if (user) {
        // Check if user is from globcred.org
        if (!user.email?.endsWith('@globcred.org')) {
          try {
            await firebaseSignOut(authInstance);
          } catch (error) {
            console.error('Error signing out unauthorized user:', error);
          }
          setUser(null);
          router.push('/login?error=unauthorized');
        } else {
          setUser(user);
        }
      } else {
        setUser(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, [router]); // Removed auth from dependencies as it's now handled inside the effect

  const signInWithGoogle = useCallback(async () => {
    setLoading(true);
    const authInstance = auth();
    if (!authInstance) {
      console.error('Auth not available');
      setLoading(false);
      return;
    }
    
    const provider = new GoogleAuthProvider();
    try {
      const result = await signInWithPopup(authInstance, provider);
      const user = result.user;
      
      if (!user.email?.endsWith('@globcred.org')) {
        await firebaseSignOut(authInstance);
        throw new Error('Only globcred.org email addresses are allowed');
      }
      
      router.push('/admin/dashboard');
    } catch (error) {
      console.error('Google Sign-In Error:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  }, [router]);

  const login = useCallback(async (email: string, password: string) => {
    setLoading(true);
    const authInstance = auth();
    if (!authInstance) {
      console.error('Auth not available');
      setLoading(false);
      return;
    }
    
    try {
      await signInWithEmailAndPassword(authInstance, email, password);
      router.push('/admin/dashboard');
    } catch (error) {
      console.error('Email/Password Sign-In Error:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  }, [router]);

  const signOut = useCallback(async () => {
    const authInstance = auth();
    if (!authInstance) {
      console.error('Auth not available');
      return;
    }
    
    try {
      await firebaseSignOut(authInstance);
      router.push('/login');
    } catch (error) {
      console.error('Sign out error:', error);
      throw error;
    }
  }, [router]);

  const isAdmin = useCallback(() => {
    return user?.email?.endsWith('@globcred.org') || false;
  }, [user]);

  const value = {
    user,
    loading,
    login,
    signInWithGoogle,
    signOut,
    isAdmin: isAdmin()
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
