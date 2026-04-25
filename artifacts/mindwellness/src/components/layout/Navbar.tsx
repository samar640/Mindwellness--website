import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Leaf, Menu, X, Search, LogIn, UserPlus, LayoutDashboard,
  LogOut, User, Droplets, BookOpen, Wind, Activity, CheckSquare,
  Quote, Heart, ArrowRight, ChevronRight, Sparkles
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";

const navLinks = [
  { name: "Home", href: "/" },
  { name: "Today's Plan", href: "/dashboard" },
  { name: "Journey", href: "/journey" },
  { name: "Mood", href: "/wellness" },
  { name: "Healing", href: "/healing" },
];

type SearchItem = {
  label: string;
  desc: string;
  icon: React.ElementType;
  color: string;
  bg: string;
  href?: string;
  isRoute?: boolean;
  isSpecial?: "water" | "books" | "chat";
};

const SEARCH_ITEMS: SearchItem[] = [
  { label: "Today's Plan", desc: "Mood-tailored meals, exercise, water & sleep for today", icon: Heart, color: "text-blue-700", bg: "bg-blue-50 border-blue-100", href: "/dashboard", isRoute: true },
  { label: "Today's Journey", desc: "Five tiny daily check-ins, one ritual", icon: Heart, color: "text-blue-700", bg: "bg-blue-50 border-blue-100", href: "/journey", isRoute: true },
  { label: "Mood Check-In", desc: "5-question daily wellness quiz", icon: Heart, color: "text-blue-600", bg: "bg-blue-50 border-blue-100", href: "/wellness", isRoute: true },
  { label: "Guided Healing", desc: "CBT thought records and journaling prompts", icon: Heart, color: "text-violet-600", bg: "bg-violet-50 border-violet-100", href: "/healing", isRoute: true },
  { label: "Breathe", desc: "Guided breathing for anxiety & anger", icon: Wind, color: "text-sky-600", bg: "bg-sky-50 border-sky-100", href: "/breathe", isRoute: true },
  { label: "Diet & Hydration", desc: "BMI calculator and daily water intake", icon: Activity, color: "text-rose-600", bg: "bg-rose-50 border-rose-100", href: "/diet", isRoute: true },
  { label: "Daily Water Intake", desc: "Personalised hydration recommendations", icon: Droplets, color: "text-blue-600", bg: "bg-blue-50 border-blue-100", href: "/diet", isRoute: true },
  { label: "To-Do List", desc: "Manage and track your daily tasks", icon: CheckSquare, color: "text-teal-600", bg: "bg-teal-50 border-teal-100", href: "/todo", isRoute: true },
  { label: "Chat with Lumi", desc: "Talk to your wellness companion bot", icon: Sparkles, color: "text-purple-600", bg: "bg-purple-50 border-purple-100", isSpecial: "chat" as const },
  { label: "Sign Up", desc: "Create a MindWellness account", icon: UserPlus, color: "text-primary", bg: "bg-primary/5 border-primary/10", href: "/signup", isRoute: true },
  { label: "Log In", desc: "Sign in to your account", icon: LogIn, color: "text-muted-foreground", bg: "bg-secondary/50 border-border", href: "/login", isRoute: true },
];

// Water intake recommendation logic
function WaterPanel({ onClose }: { onClose: () => void }) {
  const [weight, setWeight] = useState("");
  const [activity, setActivity] = useState<"low" | "moderate" | "high">("moderate");
  const [result, setResult] = useState<number | null>(null);

  const calculate = () => {
    const kg = parseFloat(weight);
    if (!kg || kg <= 0) return;
    let base = kg * 0.033;
    if (activity === "moderate") base += 0.5;
    if (activity === "high") base += 1.0;
    setResult(Math.round(base * 10) / 10);
  };

  const glasses = result ? Math.round(result / 0.25) : null;

  return (
    <motion.div
      initial={{ opacity: 0, x: 10 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 10 }}
      className="p-4 bg-gradient-to-br from-blue-50 to-cyan-50 border-t border-blue-100"
    >
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Droplets className="w-4 h-4 text-blue-500" />
          <span className="text-sm font-semibold text-blue-800">Daily Water Intake</span>
        </div>
        <button onClick={onClose} className="text-blue-400 hover:text-blue-600">
          <X className="w-3.5 h-3.5" />
        </button>
      </div>

      <div className="space-y-3">
        <div>
          <label className="text-xs text-blue-700 font-medium mb-1 block">Your weight (kg)</label>
          <input
            type="number"
            value={weight}
            onChange={e => setWeight(e.target.value)}
            placeholder="e.g. 65"
            className="w-full px-3 py-2 rounded-xl text-sm border border-blue-200 bg-white/80 outline-none focus:border-blue-400 transition-colors"
          />
        </div>

        <div>
          <label className="text-xs text-blue-700 font-medium mb-1.5 block">Activity level</label>
          <div className="grid grid-cols-3 gap-1.5">
            {(["low", "moderate", "high"] as const).map(lvl => (
              <button
                key={lvl}
                onClick={() => setActivity(lvl)}
                className={`py-1.5 rounded-lg text-xs font-semibold capitalize transition-all ${
                  activity === lvl
                    ? "bg-blue-500 text-white shadow-sm"
                    : "bg-white/70 text-blue-700 border border-blue-200 hover:bg-blue-100"
                }`}
              >
                {lvl}
              </button>
            ))}
          </div>
        </div>

        <button
          onClick={calculate}
          className="w-full py-2 rounded-xl bg-blue-500 hover:bg-blue-600 text-white text-sm font-semibold transition-colors"
        >
          Calculate
        </button>

        <AnimatePresence>
          {result !== null && (
            <motion.div
              initial={{ opacity: 0, y: -6 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white rounded-xl p-3 border border-blue-200 text-center"
            >
              <p className="text-2xl font-bold text-blue-600">{result}L</p>
              <p className="text-xs text-blue-500 font-medium">≈ {glasses} glasses (250ml each)</p>
              <p className="text-xs text-muted-foreground mt-1">Recommended daily intake</p>
              <div className="flex justify-center gap-1 mt-2 flex-wrap">
                {Array.from({ length: Math.min(glasses || 0, 12) }).map((_, i) => (
                  <span key={i} className="text-base">💧</span>
                ))}
                {(glasses || 0) > 12 && <span className="text-xs text-blue-400 self-end">+{(glasses || 0) - 12}</span>}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}

const itemVariants = {
  hidden: { opacity: 0, x: -12, scale: 0.97 },
  visible: (i: number) => ({
    opacity: 1,
    x: 0,
    scale: 1,
    transition: { delay: i * 0.045, duration: 0.28, ease: [0.23, 1, 0.32, 1] }
  }),
  exit: { opacity: 0, x: 8, transition: { duration: 0.15 } },
};

export function Navbar() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [waterOpen, setWaterOpen] = useState(false);
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);
  const [, navigate] = useLocation();
  const { user, logout } = useAuth();
  const searchRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const onScroll = () => setIsScrolled(window.scrollY > 20);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    const onClickOutside = (e: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setSearchOpen(false);
        setSearchQuery("");
        setWaterOpen(false);
      }
    };
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, []);

  useEffect(() => {
    if (searchOpen) setTimeout(() => inputRef.current?.focus(), 80);
    else { setWaterOpen(false); setSearchQuery(""); }
  }, [searchOpen]);

  const scrollTo = (href: string) => {
    const el = document.querySelector(href);
    if (el) {
      const top = el.getBoundingClientRect().top + window.pageYOffset - 80;
      window.scrollTo({ top, behavior: "smooth" });
    }
  };

  const handleNavLink = (e: React.MouseEvent, href: string) => {
    e.preventDefault();
    setIsMobileMenuOpen(false);
    if (href.startsWith("#")) scrollTo(href);
    else navigate(href);
  };

  const filtered = searchQuery
    ? SEARCH_ITEMS.filter(s =>
        s.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.desc.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : SEARCH_ITEMS;

  const handleSelect = (item: SearchItem) => {
    setSearchOpen(false);
    setSearchQuery("");
    setWaterOpen(false);
    if (item.isSpecial === "chat") {
      window.dispatchEvent(new CustomEvent("open-chatbot"));
      return;
    }
    if (item.isRoute && item.href) navigate(item.href);
    else if (item.href) scrollTo(item.href);
  };

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  return (
    <header className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${isScrolled ? "py-3" : "py-5"}`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className={`glass-panel rounded-full px-5 py-2.5 flex items-center justify-between transition-shadow duration-300 ${isScrolled ? "shadow-lg" : ""}`}>

          {/* Logo */}
          <a href="/" onClick={(e) => handleNavLink(e, "/")} className="flex items-center gap-2 group flex-shrink-0">
            <motion.div whileHover={{ rotate: 15 }} className="bg-primary/10 p-2 rounded-full group-hover:bg-primary/20 transition-colors">
              <Leaf className="w-4 h-4 text-primary" />
            </motion.div>
            <span className="font-display font-medium text-lg tracking-wide flex items-baseline">
              MindWellness <sup className="text-xs text-primary font-sans ml-1">(MW)</sup>
            </span>
          </a>

          {/* Desktop Nav */}
          <nav className="hidden lg:flex items-center gap-0.5">
            {navLinks.map((link) => (
              <a
                key={link.name}
                href={link.href}
                onClick={(e) => handleNavLink(e, link.href)}
                className="px-3 py-2 text-sm font-medium text-muted-foreground hover:text-foreground rounded-full hover:bg-secondary/50 transition-all"
              >
                {link.name}
              </a>
            ))}
          </nav>

          {/* Right: Search + Auth */}
          <div className="hidden md:flex items-center gap-2">
            {/* Search */}
            <div ref={searchRef} className="relative">
              <motion.button
                whileHover={{ scale: 1.08 }}
                whileTap={{ scale: 0.93 }}
                onClick={() => setSearchOpen(!searchOpen)}
                className={`p-2 rounded-full transition-all ${searchOpen ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground hover:bg-secondary/50"}`}
                title="Search"
              >
                <Search className="w-4 h-4" />
              </motion.button>

              <AnimatePresence>
                {searchOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: -10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -10, scale: 0.95 }}
                    transition={{ duration: 0.22, ease: [0.23, 1, 0.32, 1] }}
                    className="absolute right-0 top-12 w-96 bg-white/95 backdrop-blur-xl rounded-3xl shadow-2xl border border-black/8 overflow-hidden z-50"
                    style={{ boxShadow: "0 20px 60px rgba(0,0,0,0.12), 0 0 0 1px rgba(0,0,0,0.05)" }}
                  >
                    {/* Search header */}
                    <div className="p-4 border-b border-black/5">
                      <div className="flex items-center gap-3 bg-secondary/60 rounded-2xl px-4 py-2.5 border border-black/5">
                        <motion.div animate={{ rotate: searchQuery ? 0 : [0, 10, -10, 0] }} transition={{ duration: 1.5, repeat: Infinity, repeatDelay: 3 }}>
                          <Search className="w-4 h-4 text-primary flex-shrink-0" />
                        </motion.div>
                        <input
                          ref={inputRef}
                          type="text"
                          value={searchQuery}
                          onChange={(e) => { setSearchQuery(e.target.value); setWaterOpen(false); }}
                          placeholder="Search sections, books, tools…"
                          className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground text-foreground font-medium"
                        />
                        <AnimatePresence>
                          {searchQuery && (
                            <motion.button
                              initial={{ opacity: 0, scale: 0.7 }}
                              animate={{ opacity: 1, scale: 1 }}
                              exit={{ opacity: 0, scale: 0.7 }}
                              onClick={() => setSearchQuery("")}
                              className="text-muted-foreground hover:text-foreground"
                            >
                              <X className="w-3.5 h-3.5" />
                            </motion.button>
                          )}
                        </AnimatePresence>
                      </div>
                      {!searchQuery && (
                        <div className="flex items-center gap-1.5 mt-2.5 px-1">
                          <Sparkles className="w-3 h-3 text-primary/60" />
                          <span className="text-xs text-muted-foreground">Quick access to all sections</span>
                        </div>
                      )}
                    </div>

                    {/* Results */}
                    <div className="max-h-80 overflow-y-auto py-2 px-2">
                      {filtered.length === 0 ? (
                        <motion.p
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          className="px-4 py-6 text-sm text-muted-foreground text-center"
                        >
                          No results for "{searchQuery}"
                        </motion.p>
                      ) : (
                        <AnimatePresence mode="sync">
                          {filtered.map((item, i) => {
                            const Icon = item.icon;
                            const isHovered = hoveredIdx === i;
                            const isWaterActive = item.isSpecial === "water" && waterOpen;
                            return (
                              <motion.button
                                key={item.label}
                                custom={i}
                                variants={itemVariants}
                                initial="hidden"
                                animate="visible"
                                exit="exit"
                                onClick={() => handleSelect(item)}
                                onHoverStart={() => setHoveredIdx(i)}
                                onHoverEnd={() => setHoveredIdx(null)}
                                className={`w-full text-left px-3 py-3 rounded-2xl transition-all duration-200 flex items-center gap-3 mb-1 relative overflow-hidden ${
                                  isWaterActive ? "bg-blue-50 border border-blue-200" : "hover:bg-secondary/50"
                                }`}
                              >
                                {/* Animated background sweep */}
                                <AnimatePresence>
                                  {isHovered && !isWaterActive && (
                                    <motion.div
                                      className="absolute inset-0 bg-gradient-to-r from-primary/5 to-transparent rounded-2xl"
                                      initial={{ opacity: 0, x: -20 }}
                                      animate={{ opacity: 1, x: 0 }}
                                      exit={{ opacity: 0 }}
                                      transition={{ duration: 0.18 }}
                                    />
                                  )}
                                </AnimatePresence>

                                {/* Icon */}
                                <motion.div
                                  whileHover={{ scale: 1.15, rotate: 5 }}
                                  className={`w-9 h-9 rounded-xl flex items-center justify-center border flex-shrink-0 ${item.bg} relative z-10`}
                                >
                                  <Icon className={`w-4 h-4 ${item.color}`} />
                                </motion.div>

                                {/* Text */}
                                <div className="flex-1 min-w-0 relative z-10">
                                  <p className={`text-sm font-semibold transition-colors ${isHovered ? "text-foreground" : "text-foreground/90"}`}>
                                    {item.label}
                                  </p>
                                  <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed truncate">{item.desc}</p>
                                </div>

                                {/* Arrow */}
                                <motion.div
                                  initial={{ opacity: 0, x: -4 }}
                                  animate={{ opacity: isHovered || isWaterActive ? 1 : 0, x: isHovered || isWaterActive ? 0 : -4 }}
                                  className="relative z-10"
                                >
                                  {item.isSpecial === "water" ? (
                                    <ChevronRight className={`w-4 h-4 ${item.color}`} />
                                  ) : (
                                    <ArrowRight className={`w-4 h-4 ${item.color}`} />
                                  )}
                                </motion.div>
                              </motion.button>
                            );
                          })}
                        </AnimatePresence>
                      )}
                    </div>

                    {/* Water intake panel */}
                    <AnimatePresence>
                      {waterOpen && (
                        <WaterPanel onClose={() => setWaterOpen(false)} />
                      )}
                    </AnimatePresence>

                    {/* Footer */}
                    {!waterOpen && (
                      <div className="px-4 py-2.5 border-t border-black/5 flex items-center justify-between">
                        <span className="text-xs text-muted-foreground">MindWellness <sup className="text-[9px]">(MW)</sup></span>
                        <span className="text-xs text-muted-foreground">{SEARCH_ITEMS.length} features</span>
                      </div>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Auth */}
            {user ? (
              <div className="flex items-center gap-2">
                <button onClick={() => navigate("/account")} className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-secondary/50 rounded-full transition-all">
                  <User className="w-3.5 h-3.5" />
                  <span className="max-w-[100px] truncate">{user.email.split("@")[0]}</span>
                </button>
                <Button onClick={() => navigate("/account")} size="sm" className="font-medium gap-1.5 text-xs h-8">
                  <LayoutDashboard className="w-3.5 h-3.5" /> Dashboard
                </Button>
                <motion.button whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }} onClick={handleLogout} title="Log out" className="p-2 text-muted-foreground hover:text-rose-500 hover:bg-rose-50 rounded-full transition-all">
                  <LogOut className="w-4 h-4" />
                </motion.button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <button onClick={() => navigate("/login")} className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-secondary/50 rounded-full transition-all">
                  <LogIn className="w-3.5 h-3.5" /> Log In
                </button>
                <Button onClick={() => navigate("/signup")} size="sm" className="font-medium gap-1.5 text-xs h-8">
                  <UserPlus className="w-3.5 h-3.5" /> Sign Up
                </Button>
              </div>
            )}
          </div>

          {/* Mobile icons */}
          <div className="md:hidden flex items-center gap-2">
            <button onClick={() => setSearchOpen(!searchOpen)} className="p-2 text-muted-foreground hover:text-foreground rounded-full transition-all">
              <Search className="w-5 h-5" />
            </button>
            <button className="p-2 text-foreground" onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}>
              {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile search dropdown */}
        <AnimatePresence>
          {searchOpen && (
            <motion.div
              ref={searchRef}
              initial={{ opacity: 0, y: -10, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10, scale: 0.97 }}
              transition={{ duration: 0.22 }}
              className="mt-2 bg-white rounded-3xl shadow-2xl border border-black/5 overflow-hidden md:hidden"
            >
              <div className="p-3 border-b border-black/5">
                <div className="flex items-center gap-2 bg-secondary/50 rounded-xl px-3 py-2.5">
                  <Search className="w-4 h-4 text-primary" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search sections, tools…"
                    className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
                  />
                </div>
              </div>
              <div className="max-h-64 overflow-y-auto py-2 px-2">
                {filtered.map((item, i) => {
                  const Icon = item.icon;
                  return (
                    <motion.button
                      key={item.label}
                      custom={i}
                      variants={itemVariants}
                      initial="hidden"
                      animate="visible"
                      onClick={() => { handleSelect(item); if (!item.isSpecial) setSearchOpen(false); }}
                      className="w-full text-left px-3 py-2.5 rounded-xl hover:bg-secondary/50 flex items-center gap-3 mb-0.5 transition-colors"
                    >
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center border ${item.bg}`}>
                        <Icon className={`w-3.5 h-3.5 ${item.color}`} />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-foreground">{item.label}</p>
                        <p className="text-xs text-muted-foreground">{item.desc}</p>
                      </div>
                    </motion.button>
                  );
                })}
              </div>
              <AnimatePresence>
                {waterOpen && <WaterPanel onClose={() => setWaterOpen(false)} />}
              </AnimatePresence>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Mobile nav menu */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            className="absolute top-full left-4 right-4 mt-2 p-4 glass-panel rounded-3xl flex flex-col gap-1 md:hidden shadow-xl"
          >
            {navLinks.map((link) => (
              <a key={link.name} href={link.href} onClick={(e) => { handleNavLink(e, link.href); setIsMobileMenuOpen(false); }}
                className="px-4 py-3 text-base font-medium text-foreground hover:bg-secondary/50 rounded-xl transition-colors">
                {link.name}
              </a>
            ))}
            <div className="border-t border-black/5 mt-2 pt-3 flex flex-col gap-2">
              {user ? (
                <>
                  <Button onClick={() => { navigate("/account"); setIsMobileMenuOpen(false); }} className="w-full gap-2">
                    <LayoutDashboard className="w-4 h-4" /> Dashboard
                  </Button>
                  <button onClick={handleLogout} className="w-full text-sm text-rose-500 font-medium py-2 flex items-center justify-center gap-2 hover:bg-rose-50 rounded-xl transition-colors">
                    <LogOut className="w-4 h-4" /> Log Out
                  </button>
                </>
              ) : (
                <>
                  <Button onClick={() => { navigate("/signup"); setIsMobileMenuOpen(false); }} className="w-full gap-2">
                    <UserPlus className="w-4 h-4" /> Sign Up
                  </Button>
                  <button onClick={() => { navigate("/login"); setIsMobileMenuOpen(false); }} className="w-full text-sm font-medium text-muted-foreground py-2 flex items-center justify-center gap-2 hover:bg-secondary/40 rounded-xl transition-colors">
                    <LogIn className="w-4 h-4" /> Log In
                  </button>
                </>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
