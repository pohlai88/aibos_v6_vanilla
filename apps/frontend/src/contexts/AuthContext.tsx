import React, { createContext, useContext, useEffect, useState } from "react";
import { User, Session } from "@supabase/supabase-js";
import { useSupabase } from "@/lib/supabase";
import { profileService, UserProfile } from "@/lib/profileService";

// TODO: Replace console statements with proper logging service in production

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  userProfile: UserProfile | null;
  profileLoading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  updateUserProfile: (profileData: Partial<UserProfile>) => Promise<void>;
  refreshUserProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [profileLoading, setProfileLoading] = useState(false);
  const supabase = useSupabase();

  // console.log('AuthProvider: Initializing')

  // Load user profile when user changes
  const loadUserProfile = async (currentUser: User | null) => {
    if (!currentUser) {
      setUserProfile(null);
      return;
    }

    setProfileLoading(true);
    try {
      const profile = await profileService.getCurrentUserProfile();
      setUserProfile(profile);
    } catch (error) {
      console.error("Error loading user profile:", error);
      setUserProfile(null);
    } finally {
      setProfileLoading(false);
    }
  };

  // Update user profile (SSOT for profile updates)
  const updateUserProfile = async (profileData: Partial<UserProfile>) => {
    if (!user) return;

    setProfileLoading(true);
    try {
      const updatedProfile = await profileService.upsertUserProfile(
        profileData
      );
      setUserProfile(updatedProfile);
    } catch (error) {
      console.error("Error updating user profile:", error);
      throw error;
    } finally {
      setProfileLoading(false);
    }
  };

  // Refresh user profile from database
  const refreshUserProfile = async () => {
    await loadUserProfile(user);
  };

  useEffect(() => {
    // console.log('AuthProvider: Setting up auth listeners')

    // Get initial session
    supabase.auth
      .getSession()
      .then(({ data: { session }, error }) => {
        if (error) {
          // console.error('AuthProvider: Error getting session:', error)
        } else {
          // console.log('AuthProvider: Initial session loaded:', session ? 'yes' : 'no')
        }
        setSession(session);
        setUser(session?.user ?? null);
        setLoading(false);
      })
      .catch((error) => {
        // console.error('AuthProvider: Failed to get session:', error)
        setLoading(false);
      });

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      // console.log('AuthProvider: Auth state changed:', _event)
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, [supabase.auth]);

  // Load profile when user changes
  useEffect(() => {
    loadUserProfile(user);
  }, [user]);

  const signIn = async (email: string, password: string) => {
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (error) throw error;
    } catch (error) {
      // console.error('AuthProvider: Sign in error:', error)
      throw error;
    }
  };

  const signUp = async (email: string, password: string) => {
    try {
      const { error } = await supabase.auth.signUp({
        email,
        password,
      });
      if (error) throw error;
    } catch (error) {
      // console.error('AuthProvider: Sign up error:', error)
      throw error;
    }
  };

  const signOut = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
    } catch (error) {
      // console.error('AuthProvider: Sign out error:', error)
      throw error;
    }
  };

  const value: AuthContextType = {
    user,
    session,
    loading,
    userProfile,
    profileLoading,
    signIn,
    signUp,
    signOut,
    updateUserProfile,
    refreshUserProfile,
  };

  // console.log('AuthProvider: Rendering with user:', user ? 'yes' : 'no', 'loading:', loading)

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
