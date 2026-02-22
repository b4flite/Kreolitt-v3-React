import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, UserRole } from '../types';
import { supabase } from '../lib/supabaseClient';
import { toast } from 'react-hot-toast';

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<User>;
  signup: (email: string, password: string, name: string) => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  updatePassword: (password: string) => Promise<void>;
  logout: () => void;
  refreshUser: () => Promise<void>;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Helper to map Supabase session/profile to our App's User type
  const mapSessionToUser = async (sessionUser: any): Promise<User | null> => {
    if (!sessionUser) return null;

    try {
      // Fetch the profile data (role, name) from the 'public.profiles' table
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', sessionUser.id)
        .single();

      if (error) {
        // Audit Fix: Only fallback if it's explicitly a "Not Found" error (new user).
        // If it's a network error or other issue, throw to prevent security degradation.
        if (error.code === 'PGRST116') {
          console.warn('Profile not found for authenticated user, creating temporary client profile');
          return {
            id: sessionUser.id,
            email: sessionUser.email!,
            name: sessionUser.user_metadata?.name || sessionUser.email!.split('@')[0],
            role: UserRole.CLIENT,
            createdAt: sessionUser.created_at,
          };
        }
        throw error;
      }

      return {
        id: profile.id,
        email: profile.email,
        name: profile.name,
        phone: profile.phone,
        address: profile.address,
        company: profile.company,
        nationality: profile.nationality,
        vatNumber: profile.vat_number,
        role: profile.role as UserRole,
        createdAt: profile.created_at,
      };
    } catch (err) {
      console.error("Error retrieving user profile:", err);
      // Return null to force a re-login or error state rather than a downgraded 'guest' session
      return null;
    }
  };

  const refreshUser = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (session?.user) {
      const appUser = await mapSessionToUser(session.user);
      setUser(appUser);
    }
  };

  useEffect(() => {
    let mounted = true;

    // 1. Set up Auth Listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (!mounted) return;

      console.log(`[Auth] Event: ${event}`);

      try {
        switch (event as any) {
          case 'SIGNED_IN':
          case 'INITIAL_SESSION':
          case 'USER_UPDATED':
            if (session?.user) {
              const appUser = await mapSessionToUser(session.user);
              if (mounted) {
                if (appUser) {
                  setUser(appUser);
                } else {
                  console.error("[Auth] Ghost session detected. Profile fetch failed while session is active. Clearing session...");
                  await supabase.auth.signOut();
                  setUser(null);
                }
              }
            } else {
              if (mounted) setUser(null);
            }
            break;

          case 'SIGNED_OUT':
            if (mounted) setUser(null);
            break;

          case 'TOKEN_REFRESH_BROKEN':
            console.warn("[Auth] Token refresh failed, signing out...");
            await supabase.auth.signOut();
            if (mounted) setUser(null);
            break;

          case 'PASSWORD_RECOVERY':
            window.location.hash = '/update-password';
            break;
        }
      } catch (err) {
        console.error("[Auth] Error in onAuthStateChange handler:", err);
      } finally {
        if (mounted) setIsLoading(false);
      }
    });

    // 2. Manual Initial Check (Audit Fix: Ensure isLoading is false even if listener hangs)
    const initAuth = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user) {
          const appUser = await mapSessionToUser(session.user);
          if (mounted) setUser(appUser);
        }
      } catch (err) {
        console.error("[Auth] Initial sync failed:", err);
      } finally {
        if (mounted) setIsLoading(false);
      }
    };

    initAuth();

    // 3. Safety Timeout (Final fallback to prevent white/loading screen of death)
    const safetyTimeout = setTimeout(() => {
      if (mounted && isLoading) {
        console.warn("[Auth] Initialization timed out after 5s. Forcing ready state.");
        setIsLoading(false);
      }
    }, 5000);

    return () => {
      mounted = false;
      subscription.unsubscribe();
      clearTimeout(safetyTimeout);
    };
  }, []);

  const login = async (email: string, password: string): Promise<User> => {
    setIsLoading(true);

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setIsLoading(false);
      throw error;
    }

    if (data.user) {
      const appUser = await mapSessionToUser(data.user);
      if (appUser) {
        setUser(appUser);
        return appUser;
      }

      // SAFETY VALVE: Login succeeded but profile failed.
      // Clear the session immediately to prevent a stuck state.
      await supabase.auth.signOut();
      setIsLoading(false);
      throw new Error("Unable to load user profile. Your session has been cleared. Please try logging in again.");
    }

    throw new Error("Login failed");
  };

  const signup = async (email: string, password: string, name: string): Promise<void> => {
    setIsLoading(true);
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          name,
        }
      }
    });

    if (error) {
      setIsLoading(false);
      throw error;
    }

    if (data.session) {
      const appUser = await mapSessionToUser(data.session.user);
      if (appUser) setUser(appUser);
    }

    setIsLoading(false);
  };

  const resetPassword = async (email: string): Promise<void> => {
    setIsLoading(true);
    // Fix: Use generic origin redirect. HashRouter creates double-hash URL issues 
    // (e.g. site.com/#/update-password#access_token=...) if deep link is specified.
    // We rely on onAuthStateChange('PASSWORD_RECOVERY') to handle routing.
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: window.location.origin
    });

    setIsLoading(false);
    if (error) throw error;
  };

  const updatePassword = async (password: string): Promise<void> => {
    setIsLoading(true);
    const { error } = await supabase.auth.updateUser({ password });
    setIsLoading(false);
    if (error) throw error;
  };

  const logout = async () => {
    setIsLoading(true);
    await supabase.auth.signOut();
    setUser(null);
    setIsLoading(false);
    window.location.href = '/';
  };

  return React.createElement(
    AuthContext.Provider,
    {
      value: {
        user,
        isLoading,
        login,
        signup,
        resetPassword,
        updatePassword,
        logout,
        refreshUser,
        isAuthenticated: !!user,
      },
    },
    children
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};