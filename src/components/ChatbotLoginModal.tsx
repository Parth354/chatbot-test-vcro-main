import { useState, useEffect } from "react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Alert, AlertDescription } from "./ui/alert";
import { Loader2, Mail, X } from "lucide-react";
import { supabase } from "../integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

interface ChatbotLoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (user: any) => void;
}

export default function ChatbotLoginModal({ isOpen, onClose, onSuccess }: ChatbotLoginModalProps) {
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const { user, profile, loading: authLoading, signInWithGoogle } = useAuth();

  useEffect(() => {
    if (!authLoading && user) {
      onSuccess(user);
      onClose();
    }
  }, [user, profile, authLoading, onSuccess, onClose]);

  if (!isOpen) return null;

  const handleEmailSubmit = async () => {
    if (!email) {
      setError("Please enter your email");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const { error } = await supabase.auth.signInWithOtp({
        email,
      });

      if (error) {
        setError(error.message);
      } else {
        setOtpSent(true);
        setSuccess("Check your email for the login code!");
      }
    } catch (err) {
      setError("Failed to send login code");
    } finally {
      setLoading(false);
    }
  };

  const handleOtpSubmit = async () => {
    if (!email || !otp) {
      setError("Please enter both email and OTP");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const { data, error } = await supabase.auth.verifyOtp({
        email,
        token: otp,
        type: 'email',
      });

      if (error) {
        setError(error.message);
      } else if (data.user) {
        onSuccess(data.user);
        onClose();
      }
    } catch (err) {
      setError("Failed to verify OTP");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[9999]">
      <div className="bg-white rounded-xl p-6 w-full max-w-md mx-4">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold">Login to Save Chat History</h3>
          <button 
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X size={20} />
          </button>
        </div>

        {error && (
          <Alert variant="destructive" className="mb-4">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {success && (
          <Alert className="mb-4">
            <AlertDescription>{success}</AlertDescription>
          </Alert>
        )}

        {!otpSent ? (
          <div className="space-y-4">
            <div>
              <Label htmlFor="email">Email Address</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email"
                disabled={loading}
              />
            </div>

            <Button 
              onClick={handleEmailSubmit}
              disabled={loading || !email}
              className="w-full"
            >
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              <Mail className="mr-2 h-4 w-4" />
              Send Login Code
            </Button>

            <Button 
              onClick={signInWithGoogle}
              disabled={loading}
              className="w-full"
              variant="outline"
            >
              <Mail className="mr-2 h-4 w-4" />
              Sign In with Google
            </Button>

            
          </div>
        ) : (
          <div className="space-y-4">
            <div>
              <Label htmlFor="otp">Enter Login Code</Label>
              <Input
                id="otp"
                type="text"
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
                placeholder="Enter 6-digit code"
                disabled={loading}
                maxLength={6}
              />
            </div>

            <Button 
              onClick={handleOtpSubmit}
              disabled={loading || !otp}
              className="w-full"
            >
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Verify & Login
            </Button>

            <Button 
              onClick={() => {
                setOtpSent(false);
                setOtp("");
                setError("");
                setSuccess("");
              }}
              variant="ghost"
              className="w-full"
              disabled={loading}
            >
              Back to Email
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
