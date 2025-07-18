'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { getAuthInstance } from '@/lib/firebase';
import { signOut as firebaseSignOut } from 'firebase/auth';
import { useRouter, useSearchParams } from 'next/navigation';
import { FcGoogle } from 'react-icons/fc';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { signInWithGoogle, login } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();

  const handleGoogleSignIn = async () => {
    try {
      setIsLoading(true);
      setError('');
      console.log('Initiating Google Sign-In...');
      
      // Clear any previous auth state
      const authInstance = getAuthInstance();
      if (authInstance.currentUser) {
        console.log('Found existing user, signing out first...');
        await firebaseSignOut(authInstance);
      }
      
      console.log('Starting Google Sign-In flow...');
      await signInWithGoogle();
      console.log('Google Sign-In successful, redirecting...');
      
      // Add a small delay to ensure the auth state is updated
      setTimeout(() => {
        router.push('/admin/dashboard');
      }, 500);
      
    } catch (err: any) {
      console.error('Google Sign-In Error:', {
        code: err.code,
        message: err.message,
        stack: err.stack
      });
      
      let errorMessage = 'Failed to sign in with Google';
      
      if (err.code) {
        switch (err.code) {
          case 'auth/popup-closed-by-user':
            errorMessage = 'Sign in was cancelled';
            break;
          case 'auth/network-request-failed':
            errorMessage = 'Network error. Please check your connection.';
            break;
          case 'auth/popup-blocked':
            errorMessage = 'Popup was blocked. Please allow popups for this site.';
            break;
          default:
            errorMessage = err.message || errorMessage;
        }
      } else {
        errorMessage = err.message || errorMessage;
      }
      
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsLoading(true);
      setError('');
      await login(email, password);
      router.push('/admin/dashboard');
    } catch (err: any) {
      setError('Failed to log in. Please check your credentials.');
      console.error('Login error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  // Check for error in URL parameters and auth state
  useEffect(() => {
    if (!searchParams) return;
    
    console.log('Login page mounted with search params:', Object.fromEntries(searchParams.entries()));
    
    const urlError = searchParams.get('error');
    if (urlError) {
      let errorMessage = 'An error occurred during authentication.';
      
      switch (urlError) {
        case 'unauthorized':
          errorMessage = 'Only authorized email addresses are allowed.';
          break;
        case 'auth/network-request-failed':
          errorMessage = 'Network error. Please check your internet connection.';
          break;
        case 'auth/popup-closed-by-user':
          errorMessage = 'Sign in was cancelled';
          break;
      }
      
      if (errorMessage && !error) {
        console.error('Auth error from URL:', urlError);
        setError(errorMessage);
      }
    }
    
    // Check if user is already signed in
    const checkAuthState = async () => {
      try {
        const authInstance = getAuthInstance();
        if (authInstance.currentUser) {
          console.log('User already signed in, checking email domain...');
          const user = authInstance.currentUser;
          
          // Check if user has an allowed email domain
          if (user.email?.endsWith('@globcred.org')) {
            console.log('Valid email domain, redirecting to dashboard...');
            router.push('/admin/dashboard');
          } else {
            console.log('Invalid email domain, signing out...');
            await firebaseSignOut(authInstance);
            setError('Only globcred.org email addresses are allowed');
          }
        }
      } catch (error) {
        console.error('Error checking auth state:', error);
      }
    };
    
    checkAuthState();
  }, [searchParams, error, router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Admin Sign In
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Please sign in with your globcred.org account
          </p>
        </div>
        
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative" role="alert">
            <span className="block sm:inline">{error}</span>
          </div>
        )}
        
        <div className="mt-8 space-y-6">
          <div>
            <button
              onClick={handleGoogleSignIn}
              disabled={isLoading}
              className="group relative w-full flex justify-center py-2 px-4 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              <span className="absolute left-0 inset-y-0 flex items-center pl-3">
                <FcGoogle className="h-5 w-5" />
              </span>
              {isLoading ? 'Signing in...' : 'Sign in with Google'}
            </button>
          </div>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-300" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-gray-50 text-gray-500">Or continue with</span>
            </div>
          </div>

          <form className="mt-8 space-y-6" onSubmit={handleEmailLogin}>
            <div className="rounded-md shadow-sm -space-y-px">
              <div>
                <label htmlFor="email-address" className="sr-only">
                  Email address
                </label>
                <input
                  id="email-address"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-t-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
                  placeholder="Email address"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
              <div>
                <label htmlFor="password" className="sr-only">
                  Password
                </label>
                <input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="current-password"
                  required
                  className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-b-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
                  placeholder="Password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
            </div>

            <div>
              <button
                type="submit"
                disabled={isLoading}
                className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
              >
                {isLoading ? 'Signing in...' : 'Sign in with Email'}
              </button>
            </div>
          </form>
        </div>
        
        <div className="text-center text-sm text-gray-600">
          <p>Don't have an account? Contact support@globcred.org</p>
        </div>
      </div>
    </div>
  );
}
