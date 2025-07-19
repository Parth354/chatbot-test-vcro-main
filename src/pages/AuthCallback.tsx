import { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';

const AuthCallback = () => {
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const handleSession = async () => {
      const params = new URLSearchParams(location.search);
      const isChatbotLogin = params.get('chatbot') === 'true';

      const { data: { session } } = await supabase.auth.getSession();

      if (isChatbotLogin) {
        if (window.opener) {
          window.close();
        } else {
          console.log("Chatbot login successful, but not in a popup. No main app navigation.");
        }
      } else {
        navigate('/');
      }
    };

    handleSession();
  }, [navigate, location]);

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
      <p className="text-lg text-gray-700">Processing authentication...</p>
    </div>
  );
};

export default AuthCallback;