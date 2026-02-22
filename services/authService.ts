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
      console.log(`[Auth] Mapping session for ${sessionUser.email}...`);

      // Fetch core profile data first (essential for access)
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('id, email, name, phone, role, created_at')
        .eq('id', sessionUser.id)
        .single();

      if (profileError) {
        if (profileError.code === 'PGRST116') {
          console.warn('[Auth] Profile not found, creating temporary fallback');
          return {
            id: sessionUser.id,
            email: sessionUser.email!,
            name: sessionUser.user_metadata?.name || sessionUser.email!.split('@')[0],
            role: UserRole.CLIENT,
            createdAt: sessionUser.created_at,
          };
        }
        // If it's another error (like connection), return null but log it
        console.error("[Auth] Core profile fetch failed:", profileError);
        return null;
      }

      // Extended fields - wrap in another try/catch so missing columns don't break login
      let extProfile: any = null;
      try {
        const { data } = await supabase
          .from('profiles')
          .select('address, company, nationality, vat_number')
          .eq('id', sessionUser.id)
          .single();
        extProfile = data;
      } catch (e) {
        console.warn("[Auth] Extended profile fields failed (expected if db not migrated):", e);
      }

      return {
        id: profile.id,
        email: profile.email,
        name: profile.name,
        phone: profile.phone,
        address: extProfile?.address || '',
        company: extProfile?.company || '',
        nationality: extProfile?.nationality || '',
        vatNumber: extProfile?.vat_number || '',
        role: profile.role as UserRole,
        createdAt: profile.created_at,
      };
    } catch (err) {
      console.error("[Auth] Critical error in mapping profile:", err);
      // Fallback to basic info from session if everything else fails
      return {
        id: sessionUser.id,
        email: sessionUser.email!,
        name: sessionUser.user_metadata?.name || sessionUser.email!.split('@')[0],
        role: UserRole.CLIENT,
        createdAt: sessionUser.created_at,
      };
    }
  };

  const refreshUser = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        const appUser = await mapSessionToUser(session.user);
        setUser(appUser);
      }
    } catch (err) {
      console.error("[Auth] Refresh failed:", err);
    }
  };

  useEffect(() => {
    let mounted = true;

    // 1. Set up Auth Listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (!mounted) return;

      console.log(`[Auth Listener] Event: ${event}`);

      try {
        if (event === 'SIGNED_IN' || event === 'INITIAL_SESSION' || event === 'USER_UPDATED') {
          if (session?.user) {
            const appUser = await mapSessionToUser(session.user);
            if (mounted) {
              if (appUser) {
                setUser(appUser);
              } else {
                console.warn("[Auth] No profile for active session. Signing out.");
                await supabase.auth.signOut();
                setUser(null);
              }
            }
          } else {
            if (mounted) setUser(null);
          }
        } else if (event === 'SIGNED_OUT') {
          if (mounted) setUser(null);
        }
      } catch (err) {
        console.error("[Auth Listener] Error:", err);
      } finally {
        if (mounted) setIsLoading(false);
      }
    });

    // 2. Manual Initial Check
    const initAuth = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user) {
          const appUser = await mapSessionToUser(session.user);
          if (mounted) setUser(appUser);
        }
      } catch (err) {
        console.error("[Auth Init] Failed:", err);
      } finally {
        if (mounted) setIsLoading(false);
      }
    };

    initAuth();

    // 3. Safety Timeout
    const safetyTimeout = setTimeout(() => {
      if (mounted && isLoading) {
        console.warn("[Auth Timeout] Forcing ready state.");
        setIsLoading(false);
      }
    }, 6000);

    return () => {
      mounted = false;
      subscription.unsubscribe();
      clearTimeout(safetyTimeout);
    };
  }, []);

  const login = async (email: string, password: string): Promise<User> => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
      if (!data.user) throw new Error("Login failed");

      const appUser = await mapSessionToUser(data.user);
      if (appUser) {
        setUser(appUser);
        return appUser;
      }

      await supabase.auth.signOut();
      throw new Error("Unable to load user profile. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const signup = async (email: string, password: string, name: string): Promise<void> => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: { data: { name } }
      });
      if (error) throw error;
      if (data.session) {
        const appUser = await mapSessionToUser(data.session.user);
        if (appUser) setUser(appUser);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const resetPassword = async (email: string): Promise<void> => {
    setIsLoading(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: window.location.origin
      });
      if (error) throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const updatePassword = async (password: string): Promise<void> => {
    setIsLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({ password });
      if (error) throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    setIsLoading(true);
    try {
      await supabase.auth.signOut();
      setUser(null);
      window.location.href = '/';
    } finally {
      setIsLoading(false);
    }
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