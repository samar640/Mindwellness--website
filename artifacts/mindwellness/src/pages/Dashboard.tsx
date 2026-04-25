import { useEffect } from "react";
import { useLocation, Link } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { LogOut, Leaf, Heart, Wind, ListTodo, BookOpen, Droplets, Brain } from "lucide-react";

export default function Dashboard() {
  const { user, isLoading, logout } = useAuth();
  const [, setLocation] = useLocation();

  useEffect(() => {
    if (!isLoading && !user) setLocation("/login");
  }, [user, isLoading, setLocation]);

  const handleLogout = async () => {
    await logout();
    setLocation("/login");
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <Leaf className="w-8 h-8 text-emerald-500 animate-pulse" />
          <p className="text-slate-500 text-sm">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) return null;

  const navLinks = [
    { href: "/wellness", label: "Wellness", icon: Heart },
    { href: "/breathe", label: "Breathe", icon: Wind },
    { href: "/todo", label: "To-Do", icon: ListTodo },
    { href: "/journey", label: "Journey", icon: BookOpen },
    { href: "/diet", label: "Diet", icon: Droplets },
    { href: "/healing", label: "Healing", icon: Brain },
  ];

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-white border-b border-slate-200 sticky top-0 z-50 shadow-sm">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Leaf className="w-6 h-6 text-emerald-500" />
            <span className="font-semibold text-slate-800 text-lg">
              MindWellness <sup className="text-xs text-emerald-500">(MW)</sup>
            </span>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm text-slate-500 hidden sm:block">{user.email}</span>
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 text-sm text-slate-600 hover:text-red-500 border border-slate-200 hover:border-red-200 rounded-lg px-3 py-2 transition-all"
            >
              <LogOut className="w-4 h-4" />
              Logout
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-10">
        <div className="mb-10">
          <h1 className="text-3xl font-bold text-slate-800 mb-1">
            Welcome back, {user.email?.split("@")[0]} 👋
          </h1>
          <p className="text-slate-500">Where would you like to go today?</p>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 mb-10">
          {navLinks.map(({ href, label, icon: Icon }) => (
            <Link key={href} href={href}>
              <div className="bg-white border border-slate-200 rounded-2xl p-5 flex flex-col items-center gap-3 hover:border-emerald-300 hover:shadow-md transition-all cursor-pointer group">
                <div className="w-12 h-12 bg-emerald-50 rounded-xl flex items-center justify-center group-hover:bg-emerald-100 transition-colors">
                  <Icon className="w-6 h-6 text-emerald-600" />
                </div>
                <span className="text-sm font-medium text-slate-700 text-center">{label}</span>
              </div>
            </Link>
          ))}
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-6">
          <h2 className="text-lg font-semibold text-slate-800 mb-2">About MindWellness</h2>
          <p className="text-slate-500 text-sm leading-relaxed">
            MindWellness is your personal mental health companion. Track your mood, follow daily wellness plans,
            practice breathing exercises, and work through guided CBT therapy — all in one place.
            Built to help you cultivate a tranquil mind, one day at a time.
          </p>
        </div>
      </main>
    </div>
  );
}