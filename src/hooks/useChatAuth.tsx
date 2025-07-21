import { createContext, useContext, useEffect, useState } from 'react'
import { User, Session } from '@supabase/supabase-js'
import { supabase } from '@/integrations/supabase/client'
import { Profile } from '@/types/profile'

interface ChatAuthContextType {
  user: User | null;
  profile: Profile | null;
  session: Session | null;
  loading: boolean;
  signOut: () => Promise<void>;
  signInWithGoogle: () => Promise<void>;
}

const ChatAuthContext = createContext<ChatAuthContextType>({
  user: null,
  profile: null,
  session: null,
  loading: true,
  signOut: async () => {},
  signInWithGoogle: async () => {},
});

export const useChatAuth = () => {
  const context = useContext(ChatAuthContext);
  if (!context) {
    throw new Error('useChatAuth must be used within a ChatAuthProvider');
  }
  return context;
};

export const ChatAuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    const fetchUserProfile = async (session: Session) => {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', session.user.id)
        .maybeSingle();

      if (error && error.code !== 'PGRST116') { // PGRST116 means no rows found
        console.error('Error fetching user profile:', error);
        return null;
      }

      let profile: Profile | null = null;

      if (data) {
        profile = data as Profile;
      } else if (error && error.code === 'PGRST116') { // Only create if no profile found (PGRST116)
        const { data: newProfile, error: createError } = await supabase
          .from('profiles')
          .insert({
            user_id: session.user.id,
            email: session.user.email, // Assuming email is always available
            full_name: session.user.user_metadata?.full_name || session.user.user_metadata?.name,
            avatar_url: session.user.user_metadata?.avatar_url,
            role: 'user', // Default role for chatbot users
          })
          .select('*')
          .single();

        if (createError) {
          console.error('Error creating profile:', createError);
          return null;
        }
        profile = newProfile as Profile;
      }
      return profile;
    };

    const handleSession = async (session: Session | null) => {
      if (isMounted) {
        setSession(session);
        setUser(session?.user ?? null);
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
        redirectTo: window.location.origin + '/auth/callback?chatbot=true',
      },
    });
    if (error) {
      throw error;
    }
  };

  const value = {
    user,
    profile,
    session,
    loading,
    signOut,
    signInWithGoogle,
  };

  return <ChatAuthContext.Provider value={value}>{children}</ChatAuthContext.Provider>;
}
