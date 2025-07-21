import { createContext, useContext, useEffect, useState, useMemo } from 'react'
import { User, Session, SignInWithPasswordCredentials } from '@supabase/supabase-js'
import { supabase } from '@/integrations/supabase/client'
import { Profile } from '@/types/agent'

interface AuthContextType {
  user: User | null;
  profile: Profile | null;
  session: Session | null;
  loading: boolean;
  signOut: () => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  signInWithGoogleForAdmin: () => Promise<void>;
  signInWithPasswordForAdmin: (credentials: SignInWithPasswordCredentials) => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  profile: null,
  session: null,
  loading: true,
  signOut: async () => {},
  signInWithGoogle: async () => {},
  signInWithGoogleForAdmin: async () => {},
  signInWithPasswordForAdmin: async () => {},
});

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children, navigate }: { children: React.ReactNode, navigate: (path: string) => void }) => {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchUserProfile = async (session: Session) => {
    console.log('[Auth] fetchUserProfile: Starting profile fetch for user', session.user.id);

    const adminLoginIntent = sessionStorage.getItem('adminLoginIntent') === 'true';
    console.log(`[Auth] fetchUserProfile: Admin login intent: ${adminLoginIntent}`);

    let { data: profileData, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('user_id', session.user.id)
      .maybeSingle();

    if (error && error.code !== 'PGRST116') {
      console.error("[Auth] fetchUserProfile: Error fetching profile:", error);
      return null;
    }
    console.log('[Auth] fetchUserProfile: Fetched profile data:', profileData);

    if (adminLoginIntent && profileData?.role === 'user') {
      console.log(`[Auth] fetchUserProfile: Upgrading user ${session.user.id} to admin.`);
      const { data: updatedProfile, error: updateError } = await supabase
        .from('profiles')
        .update({ role: 'admin' })
        .eq('user_id', session.user.id)
        .select()
        .single();
      
      if (updateError) {
        console.error("[Auth] fetchUserProfile: Error upgrading user role to admin:", updateError);
      } else {
        console.log('[Auth] fetchUserProfile: User role upgraded successfully.');
        profileData = updatedProfile;
      }
    }
    
    if (adminLoginIntent) {
      console.log('[Auth] fetchUserProfile: Cleaning up adminLoginIntent session storage flag.');
      sessionStorage.removeItem('adminLoginIntent');
    }

    if (!profileData && error?.code === 'PGRST116') {
      console.log(`[Auth] fetchUserProfile: No profile found for user ${session.user.id}. Creating a new one.`);
      const { data: newProfile, error: createError } = await supabase
        .from('profiles')
        .insert({
          user_id: session.user.id,
          email: session.user.email,
          full_name: session.user.user_metadata?.full_name || session.user.user_metadata?.name,
          avatar_url: session.user.user_metadata?.avatar_url,
          role: adminLoginIntent ? 'admin' : 'user',
        })
        .select('*')
        .single();

      if (createError) {
        console.error("[Auth] fetchUserProfile: Error creating profile:", createError);
        return null;
      }
      console.log('[Auth] fetchUserProfile: New profile created:', newProfile);
      profileData = newProfile;
    }

    if (!profileData) {
      console.log('[Auth] fetchUserProfile: No profile data found or created. Returning null.');
      return null;
    }

    const typedRole: 'user' | 'admin' | 'superadmin' | undefined =
      ['user', 'admin', 'superadmin'].includes(profileData.role)
        ? profileData.role
        : undefined;

    const finalProfile = {
      id: profileData.id,
      user_id: profileData.user_id,
      email: profileData.email || '',
      full_name: profileData.full_name || undefined,
      avatar_url: profileData.avatar_url || undefined,
      role: typedRole,
      created_at: profileData.created_at,
      updated_at: profileData.updated_at,
    };
    console.log('[Auth] fetchUserProfile: Returning final profile:', finalProfile);
    return finalProfile;
  };

  useEffect(() => {
    const handleSession = async (newSession: Session | null) => {
      console.log('[Auth] handleSession: Auth state changed. Session:', newSession);
      if (newSession) {
        // Only update if session or user has genuinely changed
        if (newSession.user.id !== user?.id || newSession.access_token !== session?.access_token) {
          const userProfile = await fetchUserProfile(newSession);
          console.log('[Auth] handleSession: Setting session, user, and profile.');
          setSession(newSession);
          setUser(newSession.user);
          setProfile(userProfile);
        }
      } else {
        // Only clear if there was a session before
        if (session) {
          console.log('[Auth] handleSession: No session. Clearing user and profile.');
          setSession(null);
          setUser(null);
          setProfile(null);
        }
      }
      console.log('[Auth] handleSession: Setting loading to false.');
      setLoading(false);
    };

    console.log('[Auth] useEffect[]: Subscribing to onAuthStateChange.');
    supabase.auth.getSession()
      .then(({ data: { session } }) => {
        console.log('[Auth] useEffect[]: Initial getSession call.');
        handleSession(session)
      })
      .catch((err) => {
        console.error('[Auth] useEffect[]: Error in getSession:', err);
        setLoading(false)
      });

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        console.log(`[Auth] onAuthStateChange: Event received - ${_event}`);
        handleSession(session);
      }
    );

    return () => {
      console.log('[Auth] useEffect[]: Unsubscribing from onAuthStateChange.');
      subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    console.log(`[Auth] useEffect[profile, loading, navigate]: Checking redirect logic. Loading: ${loading}`);
    if (!loading && profile) {
      const currentPath = window.location.pathname;
      const isAdmin = profile.role === 'admin' || profile.role === 'superadmin';
      console.log(`[Auth] useEffect[profile, loading, navigate]: Path: ${currentPath}, isAdmin: ${isAdmin}`);

      if (isAdmin && (currentPath === '/auth' || currentPath.includes('/auth/callback'))) {
        console.log('[Auth] useEffect[profile, loading, navigate]: Admin on auth page, redirecting to /admin.');
        navigate('/admin');
      } else if (currentPath.startsWith('/admin') && !isAdmin) {
        console.log('[Auth] useEffect[profile, loading, navigate]: Non-admin on admin page, redirecting to /.');
        navigate('/');
      } else if (!isAdmin && currentPath.includes('/auth/callback')) {
        const redirectTo = sessionStorage.getItem('redirectTo');
        console.log(`[Auth] useEffect[profile, loading, navigate]: Non-admin on callback, redirecting to ${redirectTo || '/'}.`);
        sessionStorage.removeItem('redirectTo');
        navigate(redirectTo || '/');
      }
    } else if (!loading && !profile) {
      console.log('[Auth] useEffect[profile, loading, navigate]: No profile loaded.');
    }
  }, [profile, loading, navigate]);

  const signOut = async () => {
    console.log('[Auth] signOut: Signing out user.');
    await supabase.auth.signOut();
  };

  const signInWithGoogle = async () => {
    console.log('[Auth] signInWithGoogle: Initiating Google sign-in.');
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: window.location.href,
      },
    });
    if (error) {
      console.error('[Auth] signInWithGoogle: Error:', error);
      throw error;
    }
  };

  const signInWithGoogleForAdmin = async () => {
    console.log('[Auth] signInWithGoogleForAdmin: Initiating Google admin sign-in.');
    sessionStorage.setItem('adminLoginIntent', 'true');
    const appUrl = import.meta.env.VITE_APP_URL || window.location.origin;
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${appUrl}/admin`,
      },
    });
    if (error) {
      console.error('[Auth] signInWithGoogleForAdmin: Error:', error);
      sessionStorage.removeItem('adminLoginIntent');
      throw error;
    }
  };

  const signInWithPasswordForAdmin = async (credentials: SignInWithPasswordCredentials) => {
    console.log('[Auth] signInWithPasswordForAdmin: Initiating password admin sign-in.');
    sessionStorage.setItem('adminLoginIntent', 'true');
    const { error } = await supabase.auth.signInWithPassword(credentials);
    if (error) {
      console.error('[Auth] signInWithPasswordForAdmin: Error:', error);
      sessionStorage.removeItem('adminLoginIntent');
      throw error;
    }
  };

  const value = useMemo(() => ({
    user,
    profile,
    session,
    loading,
    signOut,
    signInWithGoogle,
    signInWithGoogleForAdmin,
    signInWithPasswordForAdmin,
  }), [user, profile, session, loading]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}


