'use client';

import { createContext, useContext, useEffect, useState, useCallback, useMemo } from 'react';
import { 
  User, 
  GoogleAuthProvider,
  signInWithPopup,
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
  onAuthStateChanged as firebaseOnAuthStateChanged,
  AuthError,
  Auth,
  User as FirebaseUser
} from 'firebase/auth';
import { useRouter } from 'next/navigation';
import { getAuthInstance } from '../lib/firebase';

type AuthContextType = {
  user: User | null;
  loading: boolean;
  error: string | null;
  login: (email: string, password: string) => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
  isAdmin: boolean;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const isClient = typeof window !== 'undefined';

  // Handle auth state changes
  useEffect(() => {
    if (!isClient) {
      setLoading(false);
      return;
    }

    try {
      const currentAuth = getAuthInstance();
      
      const unsubscribe = firebaseOnAuthStateChanged(currentAuth, (user) => {
        if (user) {
          // Check for globcred.org email
          if (!user.email?.endsWith('@globcred.org')) {
            console.warn('Unauthorized email domain, signing out...');
            firebaseSignOut(currentAuth);
            setUser(null);
            router.push('/login?error=unauthorized');
            return;
          }
          setUser(user);
        } else {
          setUser(null);
        }
        setLoading(false);
      });

      return () => unsubscribe();
    } catch (err) {
      const errorMsg = 'Error initializing auth';
      console.error(errorMsg, err);
      setError(errorMsg);
      setLoading(false);
    }
  }, [isClient, router]);

  const signInWithGoogle = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      if (!isClient) {
        throw new Error('Google Sign-In is not available on the server');
      }

      const currentAuth = getAuthInstance();
      
      console.log('Proceeding with Google Sign-In');
      
      // Clear any existing auth state
      if (currentAuth.currentUser) {
        console.log('Found existing user, signing out first...');
        await firebaseSignOut(currentAuth);
      }
      
      // Initialize Google Auth Provider
      const provider = new GoogleAuthProvider();
      
      // Add any additional scopes here if needed
      // provider.addScope('https://www.googleapis.com/auth/userinfo.email');
      // provider.addScope('https://www.googleapis.com/auth/userinfo.profile');
      
      console.log('Starting Google Sign-In flow...');
      if (!currentAuth) {
        throw new Error('Firebase Auth is not available');
      }
      
      const result = await signInWithPopup(currentAuth, provider);
      const user = result.user;
      
      console.log('Google Sign-In successful:', {
        uid: user.uid,
        email: user.email,
        emailVerified: user.emailVerified
      });
      
      // Email domain check is now handled in the auth state change listener
      
      // The auth state change listener will handle the redirect to the dashboard
      
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Failed to sign in with Google';
      const errorCode = (error as any)?.code || 'unknown';
      
      console.error('Google Sign-In error:', {
        message: errorMsg,
        code: errorCode,
        error
      });
      
      // Handle specific error cases
      let userFacingError = 'Failed to sign in with Google';
      
      if (errorCode === 'auth/popup-closed-by-user') {
        userFacingError = 'Sign in was cancelled';
      } else if (errorCode === 'auth/network-request-failed') {
        userFacingError = 'Network error. Please check your internet connection.';
      } else if (errorCode === 'auth/popup-blocked') {
        userFacingError = 'Popup was blocked. Please allow popups for this site.';
      } else if (errorCode === 'auth/cancelled-popup-request') {
        // This can happen if multiple sign-in attempts are made in quick succession
        userFacingError = 'Another sign-in attempt is already in progress';
      }
      
      setError(userFacingError);
      throw new Error(userFacingError);
      
    } finally {
      setLoading(false);
    }
  }, [router]);

  const login = useCallback(async (email: string, password: string) => {
    setLoading(true);
    setError(null);
    
    try {
      if (!isClient) {
        throw new Error('Email/password login is not available on the server');
      }

      const currentAuth = getAuthInstance();
      // Clear any existing auth state
      if (currentAuth.currentUser) {
        console.log('Found existing user, signing out first...');
        await firebaseSignOut(currentAuth);
      }
      
      await signInWithEmailAndPassword(currentAuth, email, password);
      router.push('/admin/dashboard');
    } catch (error) {
      console.error('Email/Password Sign-In Error:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  }, [router]);

  const signOut = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      const currentAuth = getAuthInstance();
      
      console.log('Signing out user...');
      await firebaseSignOut(currentAuth);
      console.log('User signed out successfully');
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to sign out';
      console.error('Sign out error:', errorMessage, error);
      setError(errorMessage);
      throw error;
    } finally {
      setLoading(false);
    }
  }, []);

  const isAdmin = useMemo(() => {
    return user?.email?.endsWith('@globcred.org') || false;
  }, [user]);

  const value = useMemo(() => ({
    user,
    loading,
    error,
    login,
    signInWithGoogle,
    signOut,
    isAdmin
  }), [user, loading, error, login, signInWithGoogle, signOut, isAdmin]);

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
