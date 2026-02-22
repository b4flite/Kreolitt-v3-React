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
      
      console.log(`Auth state change: ${event}`);

      if (event === 'PASSWORD_RECOVERY') {
         // Fix: Handle password recovery event specifically
         // Redirect to update-password page using hash (since we use HashRouter)
         // This avoids double-hash issues with redirectTo deep links
         window.location.hash = '/update-password';
      }

      if (event === 'TOKEN_REFRESH_BROKEN') {
         await supabase.auth.signOut();
         setUser(null);
         setIsLoading(false);
         return;
      }

      if (event === 'SIGNED_OUT') {
         setUser(null);
         setIsLoading(false);
         return;
      }

      if (session?.user) {
         const appUser = await mapSessionToUser(session.user);
         if (mounted) setUser(appUser);
      } else if (!session) {
         if (mounted) setUser(null);
      }

      if (mounted) setIsLoading(false);
    });

    // 2. Initial manual check
    const checkSession = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        if (error) throw error;
        
        if (mounted) {
           if (session?.user) {
              const appUser = await mapSessionToUser(session.user);
              setUser(appUser);
           } else {
              setUser(null);
           }
        }
      } catch (error) {
        console.error("Initial session check failed:", error);
        if (mounted) setUser(null);
      } finally {
        if (mounted) setIsLoading(false);
      }
    };

    checkSession();

    return () => {
      mounted = false;
      subscription.unsubscribe();
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
      throw new Error("Unable to load user profile. Please try again.");
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
       if(appUser) setUser(appUser);
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