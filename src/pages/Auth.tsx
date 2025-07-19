import { useState } from "react"
import { Link } from "react-router-dom"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { FieldError } from "@/components/ui/field-error"
import { Loader2, ArrowLeft } from "lucide-react"
import { supabase } from "@/integrations/supabase/client"
import { useToast } from "@/hooks/use-toast"
import { useAuth } from "@/hooks/useAuth"

const Auth = () => {
  const { toast } = useToast()
  const { signInWithGoogleForAdmin } = useAuth();
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<{
    email?: string;
    password?: string;
    confirmPassword?: string;
    fullName?: string;
    general?: string;
  }>({});
  
  const [signInData, setSignInData] = useState({
    email: "",
    password: ""
  })
  
  const [signUpData, setSignUpData] = useState({
    email: "",
    password: "",
    confirmPassword: "",
    fullName: ""
  })

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true);
    setError({});

    if (!signInData.email) {
      setError(prev => ({ ...prev, email: "Email is required" }));
      setLoading(false);
      return;
    }
    if (!signInData.password) {
      setError(prev => ({ ...prev, password: "Password is required" }));
      setLoading(false);
      return;
    }

    try {
      const { data, error: authError } = await supabase.auth.signInWithPassword({
        email: signInData.email,
        password: signInData.password
      });

      if (authError) {
        if (authError.message.includes("Invalid login credentials")) {
          setError(prev => ({ ...prev, general: "Invalid email or password" }));
        } else if (authError.message.includes("Email not confirmed")) {
          setError(prev => ({ ...prev, general: "Please check your email and click the confirmation link before signing in" }));
        } else {
          setError(prev => ({ ...prev, general: authError.message }));
        }
        return;
      }

      if (data.user) {
        toast({
          title: "Success",
          description: "Welcome back!"
        });
      }
    } catch (err) {
      setError(prev => ({ ...prev, general: "An unexpected error occurred" }));
    } finally {
      setLoading(false);
    }
  }

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError({});

    let hasError = false;

    if (!signUpData.fullName) {
      setError(prev => ({ ...prev, fullName: "Full Name is required" }));
      hasError = true;
    }
    if (!signUpData.email) {
      setError(prev => ({ ...prev, email: "Email is required" }));
      hasError = true;
    }
    if (!signUpData.password) {
      setError(prev => ({ ...prev, password: "Password is required" }));
      hasError = true;
    }
    if (!signUpData.confirmPassword) {
      setError(prev => ({ ...prev, confirmPassword: "Confirm Password is required" }));
      hasError = true;
    }

    if (hasError) {
      setLoading(false);
      return;
    }

    if (signUpData.password !== signUpData.confirmPassword) {
      setError(prev => ({ ...prev, confirmPassword: "Passwords don't match" }));
      setLoading(false);
      return;
    }

    if (signUpData.password.length < 6) {
      setError(prev => ({ ...prev, password: "Password must be at least 6 characters" }));
      setLoading(false);
      return;
    }

    try {
      const redirectUrl = `${window.location.origin}/`;
      
      const { data, error: authError } = await supabase.auth.signUp({
        email: signUpData.email,
        password: signUpData.password,
        options: {
          emailRedirectTo: redirectUrl,
          data: {
            full_name: signUpData.fullName
          }
        }
      });

      if (authError) {
        if (authError.message.includes("User already registered")) {
          setError(prev => ({ ...prev, general: "An account with this email already exists. Please sign in instead." }));
        } else {
          setError(prev => ({ ...prev, general: authError.message }));
        }
        return;
      }

      if (data.user) {
        toast({
          title: "Account created!",
          description: "Please check your email to confirm your account before signing in."
        });
        // Reset form
        setSignUpData({
          email: "",
          password: "",
          confirmPassword: "",
          fullName: ""
        });
      }
    } catch (err) {
      setError(prev => ({ ...prev, general: "An unexpected error occurred" }));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center space-y-2">
          <Link to="/" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
            <ArrowLeft className="h-4 w-4" />
            Back to home
          </Link>
          <h1 className="text-3xl font-bold">Welcome</h1>
          <p className="text-muted-foreground">Sign in to your admin panel</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Authentication</CardTitle>
            <CardDescription>
              Access your chatbot management dashboard
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="signin" className="space-y-4">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="signin">Sign In</TabsTrigger>
                <TabsTrigger value="signup">Sign Up</TabsTrigger>
              </TabsList>

              {error.general && (
                <Alert variant="destructive">
                  <AlertDescription>{error.general}</AlertDescription>
                </Alert>
              )}

              <TabsContent value="signin">
                <form onSubmit={handleSignIn} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="signin-email">Email</Label>
                    <Input
                      id="signin-email"
                      type="email"
                      value={signInData.email}
                      onChange={(e) => setSignInData(prev => ({ ...prev, email: e.target.value }))}
                      placeholder="Enter your email"
                      disabled={loading}
                      className={error.email ? "border-destructive" : ""}
                    />
                    <FieldError message={error.email} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="signin-password">Password</Label>
                    <Input
                      id="signin-password"
                      type="password"
                      value={signInData.password}
                      onChange={(e) => setSignInData(prev => ({ ...prev, password: e.target.value }))}
                      placeholder="Enter your password"
                      disabled={loading}
                      className={error.password ? "border-destructive" : ""}
                    />
                    <FieldError message={error.password} />
                  </div>
                  <Button type="submit" className="w-full" disabled={loading}>
                    {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Sign In
                  </Button>
                  <div className="relative">
                    <div className="absolute inset-0 flex items-center">
                      <span className="w-full border-t" />
                    </div>
                    <div className="relative flex justify-center text-xs uppercase">
                      <span className="bg-background px-2 text-muted-foreground">Or continue with</span>
                    </div>
                  </div>
                  <Button variant="outline" className="w-full" onClick={signInWithGoogleForAdmin} disabled={loading}>
                    {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24"><path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/><path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/><path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/></svg>}
                    Google
                  </Button>
                </form>
              </TabsContent>

              <TabsContent value="signup">
                <form onSubmit={handleSignUp} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="signup-name">Full Name</Label>
                    <Input
                      id="signup-name"
                      type="text"
                      value={signUpData.fullName}
                      onChange={(e) => setSignUpData(prev => ({ ...prev, fullName: e.target.value }))}
                      placeholder="Enter your full name"
                      disabled={loading}
                      className={error.fullName ? "border-destructive" : ""}
                    />
                    <FieldError message={error.fullName} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="signup-email">Email</Label>
                    <Input
                      id="signup-email"
                      type="email"
                      value={signUpData.email}
                      onChange={(e) => setSignUpData(prev => ({ ...prev, email: e.target.value }))}
                      placeholder="Enter your email"
                      disabled={loading}
                      className={error.email ? "border-destructive" : ""}
                    />
                    <FieldError message={error.email} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="signup-password">Password</Label>
                    <Input
                      id="signup-password"
                      type="password"
                      value={signUpData.password}
                      onChange={(e) => setSignUpData(prev => ({ ...prev, password: e.target.value }))}
                      placeholder="Enter your password"
                      disabled={loading}
                      className={error.password ? "border-destructive" : ""}
                    />
                    <FieldError message={error.password} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="signup-confirm">Confirm Password</Label>
                    <Input
                      id="signup-confirm"
                      type="password"
                      value={signUpData.confirmPassword}
                      onChange={(e) => setSignUpData(prev => ({ ...prev, confirmPassword: e.target.value }))}
                      placeholder="Confirm your password"
                      disabled={loading}
                      className={error.confirmPassword ? "border-destructive" : ""}
                    />
                    <FieldError message={error.confirmPassword} />
                  </div>
                  <Button type="submit" className="w-full" disabled={loading}>
                    {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Create Account
                  </Button>
                </form>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

export default Auth
