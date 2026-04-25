import { useState } from "react";
import { Link, useLocation } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Leaf, Eye, EyeOff, Mail, Lock, AlertCircle, Loader2, CheckCircle2, KeyRound } from "lucide-react";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [token, setToken] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");
  const [success, setSuccess] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [, setLocation] = useLocation();
  const { forgotPassword, resetPassword } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setInfo("");

    const trimmed = email.trim();
    if (!trimmed || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) {
      setError("Please enter a valid email address.");
      return;
    }

    setIsSubmitting(true);
    try {
      // Step 1: Request token
      if (!token.trim()) {
        const data: any = await forgotPassword(trimmed);
        setInfo(
          `Reset token generated (valid for 15 minutes). Paste this token below to set a new password: ${data?.token ?? ""}`.trim(),
        );
        setToken(String(data?.token ?? ""));
        setIsSubmitting(false);
        return;
      }

      // Step 2: Reset with token
      if (newPassword.length < 6) {
        setError("New password must be at least 6 characters.");
        setIsSubmitting(false);
        return;
      }
      if (newPassword !== confirmPassword) {
        setError("Passwords don't match.");
        setIsSubmitting(false);
        return;
      }

      await resetPassword(token.trim(), newPassword);
      setSuccess(true);
      setTimeout(() => setLocation("/login"), 1800);
    } catch (err: any) {
      setError(err?.message || "Could not reset your password. Please try again.");
      setIsSubmitting(false);
    }
  };

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
        <div className="flex justify-center mb-4">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center shadow-lg shadow-amber-500/30">
            <KeyRound className="w-6 h-6 text-white" strokeWidth={2.3} />
          </div>
        </div>

        <div className="text-center mb-6">
          <h1 className="text-2xl font-display font-medium text-foreground mb-1.5">Reset Password</h1>
          <p className="text-muted-foreground text-sm">Enter your email and choose a new password.</p>
        </div>

        <AnimatePresence mode="wait">
          {success ? (
            <motion.div
              key="success"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-center py-6"
            >
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-blue-100 flex items-center justify-center">
                <CheckCircle2 className="w-8 h-8 text-blue-600" />
              </div>
              <p className="font-semibold text-foreground mb-1">Password updated!</p>
              <p className="text-sm text-muted-foreground">Redirecting you to sign in…</p>
            </motion.div>
          ) : (
            <motion.form
              key="form"
              onSubmit={handleSubmit}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="space-y-4"
            >
              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -6 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-rose-50 text-rose-700 text-sm p-3.5 rounded-xl flex items-start gap-2 border border-rose-200"
                >
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <p className="leading-relaxed">{error}</p>
                </motion.div>
              )}

              {info && (
                <motion.div
                  initial={{ opacity: 0, y: -6 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-blue-50 text-blue-700 text-sm p-3.5 rounded-xl flex items-start gap-2 border border-blue-200"
                >
                  <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
                  <p className="leading-relaxed break-words">{info}</p>
                </motion.div>
              )}

              <div className="space-y-1.5">
                <Label htmlFor="email" className="text-foreground text-sm font-medium">Account email</Label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-muted-foreground absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    required
                    className="bg-background/60 rounded-xl pl-10 pr-4 h-12 text-base"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="token" className="text-foreground text-sm font-medium">Reset token</Label>
                <Input
                  id="token"
                  value={token}
                  onChange={(e) => setToken(e.target.value)}
                  placeholder="Paste token here after requesting it"
                  className="bg-background/60 rounded-xl h-12 text-base"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="newPassword" className="text-foreground text-sm font-medium">New password</Label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-muted-foreground absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <Input
                    id="newPassword"
                    type={showPassword ? "text" : "password"}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="At least 6 characters"
                    required
                    className="bg-background/60 rounded-xl pl-10 pr-11 h-12 text-base"
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
                <Label htmlFor="confirmPassword" className="text-foreground text-sm font-medium">Confirm new password</Label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-muted-foreground absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <Input
                    id="confirmPassword"
                    type={showPassword ? "text" : "password"}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Re-enter new password"
                    required
                    className="bg-background/60 rounded-xl pl-10 pr-4 h-12 text-base"
                  />
                </div>
              </div>

              <Button
                type="submit"
                className="w-full h-12 text-base font-semibold rounded-xl shadow-md hover:shadow-lg transition-all mt-2"
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <span className="flex items-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin" /> {token.trim() ? "Updating…" : "Generating token…"}
                  </span>
                ) : (token.trim() ? "Update Password" : "Generate reset token")}
              </Button>
            </motion.form>
          )}
        </AnimatePresence>

        <p className="mt-6 text-center text-sm text-muted-foreground">
          Remembered it?{" "}
          <Link href="/login" className="text-primary font-semibold hover:underline">
            Back to sign in
          </Link>
        </p>
      </motion.div>
    </div>
  );
}
