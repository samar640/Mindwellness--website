import { useEffect, useState } from "react";
import { useLocation, Link } from "wouter";
import { motion } from "framer-motion";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Leaf, Eye, EyeOff, Mail, Lock, AlertCircle, Loader2, Check } from "lucide-react";

export default function Signup() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [, setLocation] = useLocation();
  const { register, user, isLoading } = useAuth();

  // If already logged in, redirect to dashboard
  useEffect(() => {
    if (!isLoading && user) setLocation("/dashboard");
  }, [isLoading, user, setLocation]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    const trimmedEmail = email.trim();
    if (!trimmedEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) {
      setError("Please enter a valid email address.");
      return;
    }
    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }
    if (password !== confirmPassword) {
      setError("Passwords don't match. Please try again.");
      return;
    }

    setIsSubmitting(true);
    try {
      await register(trimmedEmail, password);
      setSuccess("Account created successfully. Redirecting you to your dashboard…");
      setTimeout(() => setLocation("/dashboard"), 700);
    } catch (err: any) {
      setError(err?.message || "Could not create your account. Please try again.");
      setIsSubmitting(false);
    }
  };

  // Live password strength hint
  const lengthOk = password.length >= 6;
  const matchOk = password.length > 0 && password === confirmPassword;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-background to-sky-50 flex flex-col items-center justify-center p-4">
      <Link href="/" className="flex items-center gap-2 mb-6 group hover:opacity-80 transition-opacity">
        <div className="bg-primary/10 p-2 rounded-full">
          <Leaf className="w-5 h-5 text-primary" />
        </div>
        <span className="font-display font-medium text-2xl tracking-wide">
          MindWellness <sup className="text-sm text-primary font-sans ml-1">(MW)</sup>
        </span>
      </Link>

      <motion.div
        initial={{ opacity: 0, y: 16, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.4, ease: [0.23, 1, 0.32, 1] }}
        className="w-full max-w-md bg-white p-8 rounded-3xl shadow-xl border border-black/5"
      >
        <div className="text-center mb-6">
          <h1 className="text-3xl font-display font-medium text-foreground mb-1.5">Create Account</h1>
          <p className="text-muted-foreground text-sm">Start your wellness journey today</p>
        </div>

        {error && (
          <motion.div
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-rose-50 text-rose-700 text-sm p-3.5 rounded-xl mb-5 flex items-start gap-2 border border-rose-200"
          >
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <p className="leading-relaxed">{error}</p>
          </motion.div>
        )}

        {success && (
          <motion.div
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-blue-50 text-blue-700 text-sm p-3.5 rounded-xl mb-5 flex items-start gap-2 border border-blue-200"
          >
            <Check className="w-4 h-4 shrink-0 mt-0.5" />
            <p className="leading-relaxed">{success}</p>
          </motion.div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="email" className="text-foreground text-sm font-medium">Email</Label>
            <div className="relative">
              <Mail className="w-4 h-4 text-muted-foreground absolute left-3.5 top-1/2 -translate-y-1/2" />
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                autoComplete="email"
                required
                className="bg-background/60 border-border focus-visible:ring-primary rounded-xl pl-10 pr-4 h-12 text-base"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="password" className="text-foreground text-sm font-medium">Password</Label>
            <div className="relative">
              <Lock className="w-4 h-4 text-muted-foreground absolute left-3.5 top-1/2 -translate-y-1/2" />
              <Input
                id="password"
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="At least 6 characters"
                autoComplete="new-password"
                required
                className="bg-background/60 border-border focus-visible:ring-primary rounded-xl pl-10 pr-11 h-12 text-base"
              />
              <button
                type="button"
                onClick={() => setShowPassword((s) => !s)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors p-1"
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="confirmPassword" className="text-foreground text-sm font-medium">Confirm Password</Label>
            <div className="relative">
              <Lock className="w-4 h-4 text-muted-foreground absolute left-3.5 top-1/2 -translate-y-1/2" />
              <Input
                id="confirmPassword"
                type={showPassword ? "text" : "password"}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Re-enter password"
                autoComplete="new-password"
                required
                className="bg-background/60 border-border focus-visible:ring-primary rounded-xl pl-10 pr-4 h-12 text-base"
              />
            </div>
          </div>

          {/* Live hints */}
          {(password.length > 0 || confirmPassword.length > 0) && (
            <div className="flex items-center gap-4 text-xs px-1">
              <span className={`flex items-center gap-1 ${lengthOk ? "text-blue-600" : "text-muted-foreground"}`}>
                <Check className={`w-3.5 h-3.5 ${lengthOk ? "opacity-100" : "opacity-30"}`} /> 6+ chars
              </span>
              <span className={`flex items-center gap-1 ${matchOk ? "text-blue-600" : "text-muted-foreground"}`}>
                <Check className={`w-3.5 h-3.5 ${matchOk ? "opacity-100" : "opacity-30"}`} /> matches
              </span>
            </div>
          )}

          <Button
            type="submit"
            className="w-full h-12 text-base font-semibold rounded-xl shadow-md hover:shadow-lg transition-all mt-2"
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <span className="flex items-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin" /> Creating account…
              </span>
            ) : "Create Account"}
          </Button>
        </form>

        <p className="mt-6 text-center text-sm text-muted-foreground">
          Already have an account?{" "}
          <Link href="/login" className="text-primary font-semibold hover:underline">
            Sign in
          </Link>
        </p>
      </motion.div>
    </div>
  );
}
