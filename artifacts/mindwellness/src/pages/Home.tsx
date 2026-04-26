import { motion } from "framer-motion";
import { useLocation } from "wouter";
import { Heart, ArrowRight, Leaf, Brain, Sun, Sparkles, Wind, Quote as QuoteIcon, Apple, FileText, LayoutDashboard, Activity, Target, Zap } from "lucide-react";
import { Navbar } from "@/components/layout/Navbar";
import { BottomDock } from "@/components/layout/BottomDock";
import { Chatbot } from "@/components/Chatbot";
import { Button } from "@/components/ui/button";

const FEATURES = [
  {
    label: "Today's Plan",
    desc: "A simple daily plan — meals, exercise, water and sleep, shaped around how you feel.",
    icon: LayoutDashboard,
    href: "/dashboard",
    accent: "from-blue-500 to-blue-700",
    soft: "from-blue-50 to-sky-50",
    text: "text-blue-700",
    border: "border-blue-200",
  },
  {
    label: "Mood Check-In",
    desc: "Five gentle questions for a quick personalised plan.",
    icon: Heart,
    href: "/wellness",
    accent: "from-sky-400 to-blue-600",
    soft: "from-sky-50 to-blue-50",
    text: "text-sky-700",
    border: "border-sky-200",
  },
  {
    label: "Guided Healing",
    desc: "CBT thought records and journaling prompts.",
    icon: Brain,
    href: "/healing",
    accent: "from-violet-400 to-blue-600",
    soft: "from-violet-50 to-blue-50",
    text: "text-violet-700",
    border: "border-violet-200",
  },
];

const JOURNEY_STEPS = [
  { icon: Heart, label: "Mood" },
  { icon: Wind, label: "Breathe" },
  { icon: QuoteIcon, label: "Inspire" },
  { icon: Apple, label: "Nourish" },
  { icon: FileText, label: "Reflect" },
];

const TRANSFORMATION_PHASES = [
  {
    title: "The Awakening",
    phase: "Days 1-7",
    content: "Light walking and mobility.",
    goal: "Resetting your sleep and energy.",
    icon: Activity,
    tint: "from-teal-400 to-cyan-600",
    bg: "from-teal-50 to-cyan-50",
    border: "border-teal-200",
  },
  {
    title: "The Build",
    phase: "Days 8-21",
    content: "Bodyweight squats and core stability.",
    goal: "Improving posture and strength.",
    icon: Target,
    tint: "from-teal-400 to-cyan-600",
    bg: "from-teal-50 to-cyan-50",
    border: "border-teal-200",
  },
  {
    title: "The Peak",
    phase: "Days 22-30",
    content: "Consistent 30-minute activity.",
    goal: "Visible metabolic and mood transformation.",
    icon: Zap,
    tint: "from-cyan-400 to-blue-600",
    bg: "from-cyan-50 to-blue-50",
    border: "border-cyan-200",
  },
];

export default function Home() {
  const [, navigate] = useLocation();

  return (
    <main className="min-h-screen bg-background flex flex-col pb-52">
      <Navbar />

      {/* Hero */}
      <section className="relative pt-32 pb-10 overflow-hidden">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-[10%] -right-[10%] w-[50%] h-[50%] rounded-full bg-primary/5 blur-[120px]" />
          <div className="absolute top-[20%] -left-[10%] w-[40%] h-[40%] rounded-full bg-accent/10 blur-[100px]" />
          <div className="absolute -bottom-[20%] left-[20%] w-[60%] h-[60%] rounded-full bg-secondary/30 blur-[120px]" />
        </div>

        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease: [0.23, 1, 0.32, 1] }}
          >
            <span className="inline-flex items-center gap-1.5 py-1.5 px-4 rounded-full bg-white border border-border text-xs font-medium text-primary mb-5 shadow-sm">
              <Leaf className="w-3.5 h-3.5" /> Your sanctuary for daily peace
            </span>
            <h1 className="text-4xl md:text-6xl font-display font-medium text-balance mb-4 leading-[1.1] text-foreground">
              Cultivate a tranquil mind<br className="hidden md:block" /> in a noisy world.
            </h1>
            <p className="text-base md:text-lg text-muted-foreground mb-7 max-w-2xl mx-auto text-balance leading-relaxed">
              Track your mood, breathe through the storm, journal what's heavy, and find gentle words when the day feels too loud — built for the days you don't have it all together.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
              <Button
                size="lg"
                onClick={() => navigate("/journey")}
                className="w-full sm:w-auto text-base h-12 px-7 shadow-lg shadow-primary/20 gap-2"
              >
                <span className="flex items-center gap-2">
                  <img
                    src="https://images.unsplash.com/photo-1549480017-d76466a4b7e8?auto=format&fit=crop&w=96&h=96&q=60"
                    alt="Wild tiger"
                    className="w-6 h-6 rounded-full object-cover ring-2 ring-white/70"
                    loading="lazy"
                    referrerPolicy="no-referrer"
                  />
                  <Sun className="w-4 h-4" /> Begin Today's Journey
                </span>
              </Button>
              <Button
                size="lg"
                variant="outline"
                onClick={() => navigate("/wellness")}
                className="w-full sm:w-auto text-base h-12 px-7 bg-white/60 backdrop-blur-sm"
              >
                Quick Mood Check
              </Button>
            </div>
          </motion.div>
        </div>
      </section>

      {/* DAILY JOURNEY featured banner */}
      <section className="pt-4 pb-2 relative z-10">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.button
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, ease: [0.23, 1, 0.32, 1] }}
            whileHover={{ y: -4 }}
            whileTap={{ scale: 0.99 }}
            onClick={() => navigate("/journey")}
            className="group relative w-full text-left rounded-3xl overflow-hidden shadow-2xl shadow-blue-500/15 bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-700 text-white p-7 md:p-10"
          >
            <div className="absolute -top-12 -right-12 w-64 h-64 rounded-full bg-white/10 blur-3xl" />
            <div className="absolute -bottom-16 -left-12 w-72 h-72 rounded-full bg-indigo-400/20 blur-3xl" />

            <div className="relative grid md:grid-cols-[1fr_auto] gap-6 items-center">
              <div>
                <span className="inline-flex items-center gap-1.5 py-1 px-3 rounded-full bg-white/15 text-xs font-semibold text-blue-100 mb-3 backdrop-blur-sm">
                  <Sparkles className="w-3 h-3" /> The heart of MindWellness
                </span>
                <h3 className="text-2xl md:text-4xl font-display font-medium leading-tight mb-3">
                  Today's Journey
                </h3>
                <p className="text-blue-100/90 text-sm md:text-base leading-relaxed mb-5 max-w-xl">
                  One gentle ritual that ties everything together — a mood check, a quiet breath, a line worth holding, a nourishing idea, and a small reflection. Five minutes, all in one place.
                </p>
                <div className="flex flex-wrap items-center gap-2.5 mb-5">
                  {JOURNEY_STEPS.map((s, i) => {
                    const Icon = s.icon;
                    return (
                      <span key={i} className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/15 backdrop-blur-sm text-xs font-medium text-white">
                        <Icon className="w-3 h-3" /> {s.label}
                      </span>
                    );
                  })}
                </div>
                <span className="inline-flex items-center gap-1.5 text-sm font-semibold text-white group-hover:gap-3 transition-all">
                  Begin today
                  <ArrowRight className="w-4 h-4" />
                </span>
              </div>
              <div className="hidden md:flex flex-shrink-0 w-32 h-32 rounded-3xl bg-white/15 backdrop-blur-sm items-center justify-center border border-white/20">
                <Sun className="w-16 h-16 text-white" strokeWidth={1.6} />
              </div>
            </div>
          </motion.button>
        </div>
      </section>

      {/* Supporting feature cards */}
      <section className="py-8 md:py-12 relative z-10">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-8"
          >
            <p className="text-xs font-bold uppercase tracking-[0.25em] text-primary mb-2">Or dive into one tool</p>
            <h2 className="text-2xl md:text-3xl font-display font-medium text-foreground">
              Pick what you need today
            </h2>
            <p className="text-sm text-muted-foreground mt-2">
              Breathing, diet, to-do and Lumi are always in the dock below.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 md:gap-6">
            {FEATURES.map((feature, i) => {
              const Icon = feature.icon;
              return (
                <motion.button
                  key={feature.label}
                  initial={{ opacity: 0, y: 24 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.08, duration: 0.45, ease: [0.23, 1, 0.32, 1] }}
                  whileHover={{ y: -6 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => navigate(feature.href)}
                  className={`group relative text-left bg-gradient-to-br ${feature.soft} ${feature.border} border rounded-3xl p-6 md:p-7 overflow-hidden transition-shadow hover:shadow-xl`}
                >
                  {/* Decorative glow */}
                  <div className={`absolute -top-10 -right-10 w-40 h-40 rounded-full bg-gradient-to-br ${feature.accent} opacity-10 blur-3xl group-hover:opacity-20 transition-opacity`} />

                  <div className="relative">
                    {/* Icon tile */}
                    <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${feature.accent} flex items-center justify-center shadow-lg mb-4 group-hover:scale-110 group-hover:rotate-3 transition-transform duration-300`}>
                      <Icon className="w-7 h-7 text-white" strokeWidth={2.2} />
                    </div>

                    <h3 className="text-xl md:text-2xl font-display font-semibold text-foreground mb-2">
                      {feature.label}
                    </h3>
                    <p className="text-sm md:text-base text-muted-foreground leading-relaxed mb-5">
                      {feature.desc}
                    </p>

                    <div className={`inline-flex items-center gap-1.5 text-sm font-semibold ${feature.text} group-hover:gap-2.5 transition-all`}>
                      Open
                      <ArrowRight className="w-4 h-4" />
                    </div>
                  </div>
                </motion.button>
              );
            })}
          </div>

          {/* Subtle hint about dock */}
          <motion.p
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ delay: 0.4 }}
            className="text-center text-xs text-muted-foreground mt-10"
          >
            Tap any icon in the dock below to explore Breathe, To-Do, and chat with Lumi.
          </motion.p>
        </div>
      </section>

      {/* Exercise and transformation section */}
      <section className="pb-8 md:pb-12 relative z-10">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-8"
          >
            <p className="text-xs font-bold uppercase tracking-[0.25em] text-primary mb-2">Exercise & Transformation</p>
            <h2 className="text-2xl md:text-3xl font-display font-medium text-foreground">
              Your 30-day movement journey
            </h2>
            <p className="text-sm text-muted-foreground mt-2 max-w-2xl mx-auto">
              A structured three-phase plan designed to improve mobility, posture, and daily energy with consistent progression.
            </p>
          </motion.div>

          <div className="relative">
            <div className="hidden md:block absolute left-0 right-0 top-7 h-[2px] bg-gradient-to-r from-sky-200 via-teal-200 to-cyan-200" />
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {TRANSFORMATION_PHASES.map((phase, i) => {
                const Icon = phase.icon;
                return (
                  <motion.button
                    key={phase.title}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: i * 0.08, duration: 0.45 }}
                    whileHover={{ y: -5 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => navigate("/reset-plan")}
                    className={`group relative rounded-3xl border ${phase.border} bg-gradient-to-br ${phase.bg} p-6 shadow-lg transition-all duration-300 hover:shadow-xl hover:border-teal-300 cursor-pointer text-left`}
                  >
                    <div className="flex items-center gap-3 mb-4">
                      <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${phase.tint} flex items-center justify-center shadow-md transition-transform duration-300 group-hover:scale-105`}>
                        <Icon className="w-5 h-5 text-white" />
                      </div>
                      <div className="w-2 h-2 rounded-full bg-primary/60 md:hidden" />
                    </div>
                    <p className="text-[11px] font-semibold uppercase tracking-wide text-primary mb-1">{phase.phase}</p>
                    <h3 className="text-lg font-display font-semibold text-foreground mb-3">{phase.title}</h3>
                    <p className="text-sm text-muted-foreground leading-relaxed mb-2">
                      <span className="font-semibold text-foreground">Content:</span> {phase.content}
                    </p>
                    <p className="text-sm text-muted-foreground leading-relaxed mb-4">
                      <span className="font-semibold text-foreground">Goal:</span> {phase.goal}
                    </p>
                    <div className="inline-flex items-center gap-1.5 text-sm font-semibold text-primary group-hover:gap-2.5 transition-all">
                      View Full Plan
                      <ArrowRight className="w-4 h-4" />
                    </div>
                  </motion.button>
                );
              })}
            </div>

            <motion.div
              initial={{ opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.15, duration: 0.4 }}
              className="mt-8 rounded-2xl border border-sky-100 bg-white/80 p-4 shadow-md"
            >
              <div className="flex items-center justify-between text-xs font-medium text-slate-600 mb-2">
                <span>Day 1</span>
                <span className="text-primary font-semibold">30-Day Progress Path</span>
                <span>Day 30</span>
              </div>
              <div className="h-2.5 rounded-full bg-slate-100 overflow-hidden">
                <div className="h-full w-full bg-gradient-to-r from-sky-400 via-teal-400 to-cyan-500" />
              </div>
              <div className="grid grid-cols-3 text-[11px] text-slate-500 mt-2">
                <span className="text-left">Awakening</span>
                <span className="text-center">Build</span>
                <span className="text-right">Transformation</span>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      <BottomDock />
      <Chatbot />
    </main>
  );
}
