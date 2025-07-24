import { createContext, useContext, useEffect, useState, useMemo } from 'react'
import { User, Session, SignInWithPasswordCredentials, SignUpWithPasswordCredentials } from '@supabase/supabase-js'
import { supabase } from '@/integrations/supabase/client'
import { Profile } from '@/types/profile'

interface AuthContextType {
  user: User | null;
  profile: Profile | null;
  session: Session | null;
  loading: boolean;
  signOut: () => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  signInWithGoogleForAdmin: () => Promise<void>;
  signInWithPasswordForAdmin: (credentials: SignInWithPasswordCredentials) => Promise<void>;
  signUp: (credentials: SignUpWithPasswordCredentials) => Promise<any>;
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
  signUp: async () => {},
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

    const adminLoginIntent = sessionStorage.getItem('adminLoginIntent') === 'true';

    let { data: profileData, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('user_id', session.user.id)
      .maybeSingle();

    if (error && error.code !== 'PGRST116') {
      return null;
    }

    if (adminLoginIntent && profileData?.role === 'user') {
      const { data: updatedProfile, error: updateError } = await supabase
        .from('profiles')
        .update({ role: 'admin' })
        .eq('user_id', session.user.id)
        .select()
        .single();
      
      if (updateError) {
        console.error("[Auth] fetchUserProfile: Error upgrading user role to admin:", updateError);
      } else {
        profileData = updatedProfile;
      }
    }
    
    if (adminLoginIntent) {
      sessionStorage.removeItem('adminLoginIntent');
    }

    if (!profileData && error?.code === 'PGRST116') {
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
        // Error creating profile
        return null;
      }
      profileData = newProfile;
    }

    if (!profileData) {
      return null;
    }

    const typedRole: 'user' | 'admin' | 'superadmin' | undefined =
      ['user', 'admin', 'superadmin'].includes(profileData.role)
        ? profileData.role as 'user' | 'admin' | 'superadmin'
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
    return finalProfile;
  };

  useEffect(() => {
    const handleSession = async (newSession: Session | null) => {
      if (newSession) {
        const userProfile = await fetchUserProfile(newSession);
        setSession(newSession);
        setUser(newSession.user);
        setProfile(userProfile || null);
      } else {
        setSession(null);
        setUser(null);
        setProfile(null);
      }

      setLoading(false);
    };

    supabase.auth.getSession()
      .then(({ data: { session } }) => {
        handleSession(session)
      })
      .catch((err) => {
        console.error('[Auth] useEffect[]: Error in getSession:', err);
        setLoading(false)
      });

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        handleSession(session);
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (session?.user && (session.user.id !== user?.id || session.access_token !== session?.access_token)) {
      fetchUserProfile(session).then(setProfile);
    }
  }, [session?.user?.id, session?.access_token]);

  useEffect(() => {
    if (!loading && profile) {
      const currentPath = window.location.pathname;
      const isAdmin = profile.role === 'admin' || profile.role === 'superadmin';
     

      if (isAdmin && (currentPath === '/auth' || currentPath.includes('/auth/callback'))) {
        navigate('/admin');
      } else if (currentPath.startsWith('/admin') && !isAdmin) {
     
        navigate('/');
      } else if (!isAdmin && currentPath.includes('/auth/callback')) {
        const redirectTo = sessionStorage.getItem('redirectTo');
        sessionStorage.removeItem('redirectTo');
        navigate(redirectTo || '/');
      }
    } else if (!loading && !profile) {
    }
  }, [profile, loading, navigate]);

  const signOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setProfile(null);
    setSession(null);
    navigate('/auth'); // Redirect to login page after sign out
  };

  const signInWithGoogle = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: window.location.href,
      },
    });
    if (error) {
      // Error during signInWithGoogle
      throw error;
    }
  };

  const signInWithGoogleForAdmin = async () => {
    sessionStorage.setItem('adminLoginIntent', 'true');
    const appUrl = import.meta.env.VITE_APP_URL || window.location.origin;
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${appUrl}/admin`,
      },
    });
    if (error) {
      // Error during signInWithGoogleForAdmin
      sessionStorage.removeItem('adminLoginIntent');
      throw error;
    }
  };

  const signInWithPasswordForAdmin = async (credentials: SignInWithPasswordCredentials) => {
    sessionStorage.setItem('adminLoginIntent', 'true');
    const { error } = await supabase.auth.signInWithPassword(credentials);
    if (error) {
      // Error during signInWithPasswordForAdmin
      sessionStorage.removeItem('adminLoginIntent');
      throw error;
    }
  };

  const signUp = async (credentials: SignUpWithPasswordCredentials) => {
    const { data, error } = await supabase.auth.signUp(credentials);
    if (error) {
      // Error during signUp
      throw error;
    }
    return { data, error };
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
    signUp,
  }), [user, profile, session, loading]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}


