import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import supabase from '../lib/supabase';
import type { User } from '../types';
import type { Session, User as SupabaseUser } from '@supabase/supabase-js';

interface AuthContextType {
  user: SupabaseUser | null;
  profile: User | null;
  session: Session | null;
  loading: boolean;
  profileLoading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, fullName: string) => Promise<void>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<SupabaseUser | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<User | null>(null);
  const [profileLoading, setProfileLoading] = useState(false);

  const fetchProfile = useCallback(async () => {
    if (!session?.access_token) return;

    setProfileLoading(true);
    try {
      const { data: { session: currentSession } } = await supabase.auth.getSession();
      if (!currentSession) return;

      const response = await fetch('/api/profile', {
        headers: {
          'Authorization': `Bearer ${currentSession.access_token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        setProfile(data);
      }
    } catch (err) {
      console.error('Failed to fetch profile:', err);
    } finally {
      setProfileLoading(false);
    }
  }, [session?.access_token]);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (session) {
      fetchProfile();
    } else {
      setProfile(null);
    }
  }, [session, fetchProfile]);

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
  };

  const signUp = async (email: string, password: string, fullName: string) => {
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
        },
      },
    });
    if (error) throw error;
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setProfile(null);
  };

  const refreshProfile = () => fetchProfile();

  return (
    <AuthContext.Provider value={{
      user,
      profile,
      session,
      loading,
      profileLoading,
      signIn,
      signUp,
      signOut,
      refreshProfile,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
