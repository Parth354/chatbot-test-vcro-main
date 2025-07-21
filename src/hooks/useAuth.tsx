import { createContext, useContext, useEffect, useState, useMemo } from 'react'
import { User, Session } from '@supabase/supabase-js'
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
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  profile: null,
  session: null,
  loading: true,
  signOut: async () => {},
  signInWithGoogle: async () => {},
  signInWithGoogleForAdmin: async () => {},
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

  useEffect(() => {
    if (!loading && user && profile) {
      const currentPath = window.location.pathname;
      if (currentPath === '/auth' || currentPath === '/auth/callback') {
        if (profile.role === 'admin' || profile.role === 'superadmin') {
          navigate('/admin');
        } else {
          navigate('/');
        }
      }
    }
  }, [user, profile, loading, navigate]);

  useEffect(() => {
    let isMounted = true;

    const fetchUserProfile = async (session: Session) => {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', session.user.id)
        .maybeSingle();

      if (error && error.code !== 'PGRST116') { 
        return null;
      }

      let profile: Profile | null = null;

      if (data) {
        const isAdminLogin = session.user.app_metadata?.provider === 'google' && session.user.app_metadata?.redirectTo?.includes('admin=true');
        let role = data.role;

        // If it's an admin login and the user is currently just a 'user', upgrade them.
        if (isAdminLogin && role === 'user') {
          const { data: updatedProfile, error: updateError } = await supabase
            .from('profiles')
            .update({ role: 'admin' })
            .eq('user_id', session.user.id)
            .select()
            .single();

          if (updateError) {
            console.error("Error upgrading user role to admin:", updateError);
            // Proceed with the old role if update fails
          } else {
            role = updatedProfile.role; // Update role with the newly assigned one
          }
        }
        
        const typedRole: 'user' | 'admin' | 'superadmin' | undefined =
          (role === 'user' || role === 'admin' || role === 'superadmin')
            ? (role as 'user' | 'admin' | 'superadmin')
            : undefined;

        profile = {
          id: data.id,
          user_id: data.user_id,
          email: data.email || '',
          full_name: data.full_name || undefined,
          avatar_url: data.avatar_url || undefined,
          role: typedRole,
          created_at: data.created_at,
          updated_at: data.updated_at,
        };
      } else if (error && error.code === 'PGRST116') { // Only create if no profile found (PGRST116)
        const { data: newProfile, error: createError } = await supabase
          .from('profiles')
          .insert({
            user_id: session.user.id,
            email: session.user.email,
            full_name: session.user.user_metadata?.full_name || session.user.user_metadata?.name,
            avatar_url: session.user.user_metadata?.avatar_url,
            role: session.user.app_metadata?.provider === 'google' && session.user.app_metadata?.redirectTo?.includes('admin=true') ? 'admin' : 'user',
          })
          .select('*')
          .single();

        if (createError) {
          return null;
        }

        profile = {
          id: newProfile.id,
          user_id: newProfile.user_id,
          email: newProfile.email || '',
          full_name: newProfile.full_name || undefined,
          avatar_url: newProfile.avatar_url || undefined,
          role: (session.user.app_metadata?.provider === 'google' && session.user.app_metadata?.redirectTo?.includes('admin=true')) ? 'admin' : 'user',
          created_at: newProfile.created_at,
          updated_at: newProfile.updated_at,
        };
      }
      return profile;
    };

    const handleSession = async (session: Session | null) => {
      if (isMounted) {
        setSession(session);
        // Only update user if the user ID has actually changed
        if (session?.user?.id !== user?.id) {
          setUser(session?.user ?? null);
        }
        if (session?.user) {
          const userProfile = await fetchUserProfile(session);
          setProfile(userProfile);
        } else {
          setProfile(null);
        }
        setLoading(false);
      }
    };

    supabase.auth.getSession()
      .then(({ data: { session } }) => {
        handleSession(session);
      })
      .catch(error => {
        if (isMounted) {
          setLoading(false);
        }
      });

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        if (event === 'SIGNED_IN' || event === 'SIGNED_OUT' || event === 'USER_UPDATED') {
          handleSession(session);
        }
      }
    );

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const signOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setProfile(null);
    setSession(null);
  };

  const signInWithGoogle = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: window.location.origin + '/auth/callback',
      },
    });
    if (error) {
      throw error;
    }
  };

  const signInWithGoogleForAdmin = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: window.location.origin + '/auth/callback?admin=true',
      },
    });
    if (error) {
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
  }), [user, profile, session, loading, signOut, signInWithGoogle, signInWithGoogleForAdmin]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
