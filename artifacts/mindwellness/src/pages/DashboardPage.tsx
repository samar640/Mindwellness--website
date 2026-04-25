import { useState, useEffect, type ElementType } from "react";
import { useLocation } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import {
  Calendar, Sun, Coffee, Sandwich, Apple, Soup, Dumbbell,
  Droplets, Moon, Target, Sparkles, RotateCw, Check,
  Wind, Brain, FileText, ChevronRight
} from "lucide-react";
import { Navbar } from "@/components/layout/Navbar";
import { BottomDock } from "@/components/layout/BottomDock";
import { Chatbot } from "@/components/Chatbot";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

type MoodKey = "low" | "okay" | "good";
type DashboardState = {
  date: string;
  mood?: MoodKey;
  goal?: string;
  done: string[];          // ids of completed items
  waterGlasses: number;    // checked-off glasses
};

const MOODS = [
  { score: 1, key: "low" as MoodKey,  emoji: "😢", label: "Awful" },
  { score: 2, key: "low" as MoodKey,  emoji: "😕", label: "Low" },
  { score: 3, key: "okay" as MoodKey, emoji: "😐", label: "Okay" },
  { score: 4, key: "good" as MoodKey, emoji: "🙂", label: "Good" },
  { score: 5, key: "good" as MoodKey, emoji: "😄", label: "Great" },
];

const PLANS: Record<MoodKey, {
  empathy: string;
  affirmation: string;
  breakfast: string;
  lunch: string;
  snack: string;
  dinner: string;
  exercise: { title: string; desc: string };
  waterGoal: number;
  waterTip: string;
  sleep: { time: string; tip: string };
  goalSuggestions: string[];
}> = {
  low: {
    empathy: "I see you. Today is allowed to be a small day. You don't have to do all of this — pick one or two things and let the rest go gently.",
    affirmation: "Even on tired days, showing up at all is a kind of bravery. You're already doing it.",
    breakfast: "Warm porridge with banana, walnuts, and a drizzle of honey. Slow energy that won't crash by 11am.",
    lunch: "A bowl of vegetable soup with buttered sourdough. Low-effort, comforting, easy to digest.",
    snack: "A handful of walnuts and a square of dark chocolate. Mood-supporting fats and a tiny treat.",
    dinner: "Khichdi or simple dal with rice and a spoon of ghee. The original comfort food.",
    exercise: { title: "10-minute slow walk", desc: "No phone, no podcast — just your feet meeting the ground. Outside if you can. This counts as exercise on hard days." },
    waterGoal: 6,
    waterTip: "1.5 litres today (about 6 glasses). Keep a bottle within reach — that's half the battle.",
    sleep: { time: "10:00 PM", tip: "Phone in another room. Warm shower if you can. Your body is asking for extra rest tonight — please give it." },
    goalSuggestions: ["Drink one full glass of water now", "Step outside for 5 minutes", "Text one person I trust"],
  },
  okay: {
    empathy: "An okay day is a real day. Nothing to fix, nothing to perform — just steady choices that quietly compound.",
    affirmation: "You don't need a great day to make today count. Showing up is the practice.",
    breakfast: "Greek yogurt with berries, walnuts, and a spoonful of almond butter. Slow energy that lasts through the morning.",
    lunch: "A grilled chicken (or chickpea) wrap with hummus, salad, avocado and feta. Balanced, bright, satisfying.",
    snack: "Apple with peanut butter, or a handful of almonds and a cup of green tea.",
    dinner: "Stir-fried tofu (or chicken) with broccoli, garlic, and brown rice. Magnesium for a calm evening.",
    exercise: { title: "20-minute brisk walk", desc: "A pace where you can talk but not sing. Or a 15-minute mobility flow. Your evening self will thank you." },
    waterGoal: 8,
    waterTip: "2 litres today (about 8 glasses). Refill twice between meals — easy target.",
    sleep: { time: "10:30 PM", tip: "Aim for 7–8 hours. A warm cup of milk or chamomile tea, lights dim, phone away by 10:15." },
    goalSuggestions: ["Walk 5,000 steps", "Read for 20 minutes", "Tidy one corner of the room"],
  },
  good: {
    empathy: "Beautiful. Good days build the foundation hard days lean on — let's make this one count.",
    affirmation: "Energy is a gift. Spend it on something that matters to you, not just what's loudest.",
    breakfast: "Two eggs on sourdough with smashed avocado, chilli flakes, and a side of greens. Protein for steady focus.",
    lunch: "A quinoa grain bowl: roasted vegetables, chickpeas, tahini drizzle, pumpkin seeds. Energy and colour.",
    snack: "A protein smoothie: banana, oats, peanut butter, milk. Or fruit and yogurt.",
    dinner: "Salmon (or paneer) with roasted sweet potato and a big pile of greens. Omega-3s help your brain breathe easier.",
    exercise: { title: "30-min walk OR full bodyweight session", desc: "4 rounds of: 10 squats, 10 push-ups (knees fine), 10 lunges per leg, 30s plank. 30s rest between rounds." },
    waterGoal: 10,
    waterTip: "2.5 litres today (about 10 glasses). Sip steadily — don't chug.",
    sleep: { time: "11:00 PM", tip: "Stay consistent — phone away by 10:30. Consistency beats catch-up sleep every time." },
    goalSuggestions: ["Finish my hardest task before lunch", "30 minutes of focused movement", "Plan tomorrow's top 3 priorities"],
  },
};

const todayKey = () => new Date().toISOString().slice(0, 10);
const STORAGE_KEY = "mw_dashboard_log";
const MOOD_KEY = "mw_mood_logs";

const loadAll = (): DashboardState[] => {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]"); } catch { return []; }
};
const saveAll = (s: DashboardState[]) => { try { localStorage.setItem(STORAGE_KEY, JSON.stringify(s)); } catch {} };

export default function DashboardPage() {
  const [, navigate] = useLocation();
  const [all, setAll] = useState<DashboardState[]>([]);
  const [today, setToday] = useState<DashboardState>({ date: todayKey(), done: [], waterGlasses: 0 });
  const [goalDraft, setGoalDraft] = useState("");

  useEffect(() => {
    const log = loadAll();
    setAll(log);
    const t = log.find((d) => d.date === todayKey()) || { date: todayKey(), done: [], waterGlasses: 0 };
    setToday(t);
    setGoalDraft(t.goal || "");
  }, []);

  const persist = (next: DashboardState) => {
    setToday(next);
    const others = all.filter((d) => d.date !== next.date);
    const updated = [...others, next].sort((a, b) => a.date.localeCompare(b.date));
    setAll(updated);
    saveAll(updated);
  };

  const setMood = (m: typeof MOODS[0]) => {
    persist({ ...today, mood: m.key });
    // also write to mood log so it's shared
    try {
      const raw = JSON.parse(localStorage.getItem(MOOD_KEY) || "[]");
      const filtered = raw.filter((l: any) => l.date !== todayKey());
      filtered.push({ date: todayKey(), ts: Date.now(), score: m.score, tags: [], note: "" });
      localStorage.setItem(MOOD_KEY, JSON.stringify(filtered.sort((a: any, b: any) => a.date.localeCompare(b.date))));
    } catch {}
  };

  const toggleDone = (id: string) => {
    const has = today.done.includes(id);
    persist({ ...today, done: has ? today.done.filter((d) => d !== id) : [...today.done, id] });
  };

  const setGlasses = (n: number) => persist({ ...today, waterGlasses: n });
  const saveGoal = (g: string) => persist({ ...today, goal: g });
  const resetDay = () => {
    persist({ date: todayKey(), done: [], waterGlasses: 0 });
    setGoalDraft("");
  };

  const plan = today.mood ? PLANS[today.mood] : null;
  const moodLabel = today.mood ? MOODS.find(m => m.key === today.mood)?.label : null;
  const dateLong = new Date().toLocaleDateString([], {
    weekday: "long", month: "long", day: "numeric", year: "numeric",
  });
  const totalSteps = 6;
  const completedCount = today.done.length;

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 via-white to-slate-50">
      <Navbar />

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 md:py-14 pb-52 space-y-6">

        {/* DATE / HERO HEADER — pure white */}
        <Card className="border border-slate-200 shadow-lg shadow-slate-200/40 bg-white p-7 md:p-9 rounded-2xl">
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div>
              <div className="flex items-center gap-2 text-xs font-semibold text-blue-700 uppercase tracking-widest mb-2">
                <Calendar className="w-3.5 h-3.5" />
                {dateLong}
              </div>
              <h1 className="text-3xl md:text-4xl font-display font-medium text-slate-900 leading-tight">
                Today's Plan
              </h1>
              <div className="mt-4 flex items-center gap-3">
                <FlyingEagle className="w-10 h-10 text-slate-400/80" />
                <FlyingEagle className="w-8 h-8 text-slate-400/90" />
                <FlyingEagle className="w-12 h-12 text-slate-400/70" />
              </div>
              <p className="text-slate-600 mt-4 text-sm md:text-base max-w-xl">
                A simple, realistic plan for the next 24 hours — meals, movement, hydration and rest, shaped around how you're actually feeling today.
              </p>
            </div>
            <div className="flex flex-col items-end gap-1">
              <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Today</span>
              <div className="flex items-baseline gap-1">
                <span className="text-5xl font-display font-semibold text-slate-900">{new Date().getDate()}</span>
                <span className="text-sm text-slate-500 font-medium uppercase">{new Date().toLocaleDateString([], { month: "short" })}</span>
              </div>
            </div>
          </div>

          {plan && (
            <div className="mt-5 flex items-center justify-between gap-3 pt-5 border-t border-slate-100">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-blue-50 border border-blue-100 flex items-center justify-center">
                  <Target className="w-4 h-4 text-blue-700" />
                </div>
                <div>
                  <p className="text-xs text-slate-500">Today you're</p>
                  <p className="text-sm font-semibold text-slate-900">Feeling {moodLabel} · {completedCount}/{totalSteps} done</p>
                </div>
              </div>
              <Button onClick={resetDay} variant="ghost" size="sm" className="gap-1.5 text-slate-500 hover:text-slate-900">
                <RotateCw className="w-3.5 h-3.5" /> Reset day
              </Button>
            </div>
          )}
        </Card>

        {/* STEP 1 — Mood question (only if not yet answered) */}
        <AnimatePresence mode="wait">
          {!plan && (
            <motion.div
              key="mood-q"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
            >
              <Card className="border border-slate-200 shadow-md bg-white p-6 md:p-8 rounded-2xl">
                <p className="text-xs font-bold uppercase tracking-widest text-blue-700 mb-2">First, one simple question</p>
                <h2 className="text-xl md:text-2xl font-display font-medium text-slate-900 mb-1">How are you feeling today?</h2>
                <p className="text-sm text-slate-500 mb-5">No wrong answer. The rest of the plan adjusts to you.</p>
                <div className="grid grid-cols-5 gap-2">
                  {MOODS.map((m) => (
                    <button
                      key={m.score}
                      onClick={() => setMood(m)}
                      className="flex flex-col items-center gap-1.5 p-3 rounded-xl border-2 border-slate-200 bg-white hover:border-blue-400 hover:bg-blue-50/40 hover:shadow-sm transition-all"
                    >
                      <span className="text-3xl">{m.emoji}</span>
                      <span className="text-[11px] font-semibold text-slate-700">{m.label}</span>
                    </button>
                  ))}
                </div>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>

        {/* PLAN — once mood is set */}
        {plan && (
          <>
            {/* EMPATHETIC MESSAGE — white card with soft blue accent */}
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
              <Card className="border border-slate-200 shadow-md bg-white p-6 md:p-7 rounded-2xl">
                <div className="flex items-start gap-4">
                  <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-blue-100 to-indigo-100 flex items-center justify-center flex-shrink-0">
                    <Sparkles className="w-5 h-5 text-blue-700" />
                  </div>
                  <div>
                    <p className="text-xs font-bold uppercase tracking-widest text-blue-700 mb-2">A note for you</p>
                    <p className="text-base md:text-lg text-slate-800 leading-relaxed font-display italic">"{plan.empathy}"</p>
                    <p className="text-sm text-slate-500 mt-3">— {plan.affirmation}</p>
                  </div>
                </div>
              </Card>
            </motion.div>

            {/* TODAY'S GOAL */}
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}>
              <Card className="border border-slate-200 shadow-md bg-white p-6 md:p-7 rounded-2xl">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center">
                    <Target className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-widest text-blue-700">Today's Goal</p>
                    <h3 className="text-lg font-display font-medium text-slate-900">One thing that would make today feel done</h3>
                  </div>
                </div>
                <div className="flex flex-col sm:flex-row gap-2 mb-3">
                  <Input
                    value={goalDraft}
                    onChange={(e) => setGoalDraft(e.target.value)}
                    placeholder="e.g. Finish my report, or take a 20-minute walk"
                    className="flex-1 bg-white border-slate-200"
                  />
                  <Button onClick={() => saveGoal(goalDraft.trim())} disabled={!goalDraft.trim()} className="gap-1.5">
                    <Check className="w-4 h-4" /> Save goal
                  </Button>
                </div>
                {today.goal && (
                  <div className="mt-3 flex items-start gap-2 p-3 rounded-xl bg-blue-50 border border-blue-100">
                    <Check className="w-4 h-4 text-blue-700 mt-0.5 flex-shrink-0" />
                    <p className="text-sm text-slate-800"><strong>Saved:</strong> {today.goal}</p>
                  </div>
                )}
                <div className="mt-4">
                  <p className="text-[11px] font-semibold uppercase tracking-widest text-slate-400 mb-2">Or pick one</p>
                  <div className="flex flex-wrap gap-2">
                    {plan.goalSuggestions.map((g, i) => (
                      <button
                        key={i}
                        onClick={() => { setGoalDraft(g); saveGoal(g); }}
                        className="text-xs px-3 py-1.5 rounded-full bg-slate-100 hover:bg-blue-100 text-slate-700 hover:text-blue-800 border border-slate-200 hover:border-blue-200 transition-all"
                      >
                        {g}
                      </button>
                    ))}
                  </div>
                </div>
              </Card>
            </motion.div>

            {/* MEAL PLAN — morning to evening */}
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
              <Card className="border border-slate-200 shadow-md bg-white p-6 md:p-7 rounded-2xl">
                <div className="flex items-center gap-3 mb-5">
                  <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-rose-400 to-orange-500 flex items-center justify-center">
                    <Apple className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-widest text-rose-600">Meals · Morning to evening</p>
                    <h3 className="text-lg font-display font-medium text-slate-900">Today's nourishing menu</h3>
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <MealRow id="breakfast" icon={Coffee} when="Breakfast · 7–9 AM"  text={plan.breakfast} done={today.done.includes("breakfast")} onToggle={toggleDone} />
                  <MealRow id="lunch"     icon={Sandwich} when="Lunch · 12–2 PM"   text={plan.lunch}     done={today.done.includes("lunch")}     onToggle={toggleDone} />
                  <MealRow id="snack"     icon={Apple}    when="Snack · 4–5 PM"    text={plan.snack}     done={today.done.includes("snack")}     onToggle={toggleDone} />
                  <MealRow id="dinner"    icon={Soup}     when="Dinner · 7–8 PM"   text={plan.dinner}    done={today.done.includes("dinner")}    onToggle={toggleDone} />
                </div>
              </Card>
            </motion.div>

            {/* EXERCISE + WATER + SLEEP — 3 pillar cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Exercise */}
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
                <Card className={`border border-slate-200 bg-white p-5 rounded-2xl h-full transition-all ${today.done.includes("exercise") ? "ring-1 ring-blue-200" : ""}`}>
                  <div className="flex items-center justify-between mb-3">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-teal-400 to-blue-500 flex items-center justify-center">
                      <Dumbbell className="w-5 h-5 text-white" />
                    </div>
                    <button
                      onClick={() => toggleDone("exercise")}
                      className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${today.done.includes("exercise") ? "bg-blue-600 border-blue-600" : "border-slate-300 hover:border-blue-400"}`}
                    >
                      {today.done.includes("exercise") && <Check className="w-3.5 h-3.5 text-white" strokeWidth={3} />}
                    </button>
                  </div>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-teal-700 mb-1">Move a little</p>
                  <h4 className="font-display text-base font-medium text-slate-900 mb-1.5">{plan.exercise.title}</h4>
                  <p className="text-xs text-slate-600 leading-relaxed">{plan.exercise.desc}</p>
                </Card>
              </motion.div>

              {/* Water */}
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
                <Card className={`border border-slate-200 bg-white p-5 rounded-2xl h-full transition-all ${today.waterGlasses >= plan.waterGoal ? "ring-1 ring-blue-200" : ""}`}>
                  <div className="flex items-center justify-between mb-3">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-sky-400 to-cyan-500 flex items-center justify-center">
                      <Droplets className="w-5 h-5 text-white" />
                    </div>
                    <span className="text-xs font-semibold text-slate-500">{today.waterGlasses}/{plan.waterGoal}</span>
                  </div>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-sky-700 mb-1">Hydrate</p>
                  <h4 className="font-display text-base font-medium text-slate-900 mb-1.5">Today's water goal</h4>
                  <p className="text-xs text-slate-600 leading-relaxed mb-3">{plan.waterTip}</p>
                  <div className="grid grid-cols-5 gap-1">
                    {Array.from({ length: plan.waterGoal }).map((_, i) => {
                      const filled = i < today.waterGlasses;
                      return (
                        <button
                          key={i}
                          onClick={() => setGlasses(filled ? i : i + 1)}
                          className={`h-7 rounded-md border-2 transition-all ${filled ? "bg-gradient-to-b from-sky-300 to-blue-500 border-blue-500" : "bg-white border-slate-200 hover:border-sky-300"}`}
                          aria-label={`Glass ${i + 1}`}
                        />
                      );
                    })}
                  </div>
                </Card>
              </motion.div>

              {/* Sleep */}
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}>
                <Card className={`border border-slate-200 bg-white p-5 rounded-2xl h-full transition-all ${today.done.includes("sleep") ? "ring-1 ring-blue-200" : ""}`}>
                  <div className="flex items-center justify-between mb-3">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-400 to-violet-600 flex items-center justify-center">
                      <Moon className="w-5 h-5 text-white" />
                    </div>
                    <button
                      onClick={() => toggleDone("sleep")}
                      className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${today.done.includes("sleep") ? "bg-blue-600 border-blue-600" : "border-slate-300 hover:border-blue-400"}`}
                    >
                      {today.done.includes("sleep") && <Check className="w-3.5 h-3.5 text-white" strokeWidth={3} />}
                    </button>
                  </div>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-indigo-700 mb-1">Tonight's rest</p>
                  <h4 className="font-display text-base font-medium text-slate-900 mb-1.5">Bed by {plan.sleep.time}</h4>
                  <p className="text-xs text-slate-600 leading-relaxed">{plan.sleep.tip}</p>
                </Card>
              </motion.div>
            </div>

            {/* CROSS-FEATURE ACTIONS */}
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
              <Card className="border border-slate-200 bg-white p-6 rounded-2xl">
                <p className="text-[11px] font-bold uppercase tracking-widest text-slate-400 mb-3 text-center">Carry it forward</p>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5">
                  <ActionTile icon={Sun}      label="Today's Journey" sub="5-step ritual" tint="from-blue-500 to-indigo-600" onClick={() => navigate("/journey")} />
                  <ActionTile icon={Wind}     label="Breathe"         sub="60 seconds"   tint="from-sky-400 to-cyan-600"    onClick={() => navigate("/breathe")} />
                  <ActionTile icon={Brain}    label="Healing tools"   sub="CBT · Journal" tint="from-violet-400 to-blue-600" onClick={() => navigate("/healing")} />
                  <ActionTile icon={FileText} label="To-Do List"      sub="Plan tasks"   tint="from-teal-400 to-blue-600"   onClick={() => navigate("/todo")} />
                </div>
              </Card>
            </motion.div>
          </>
        )}
      </main>

      <BottomDock />
      <Chatbot />
    </div>
  );
}

function MealRow({ id, icon: Icon, when, text, done, onToggle }: {
  id: string; icon: ElementType; when: string; text: string; done: boolean; onToggle: (id: string) => void;
}) {
  return (
    <div className={`flex items-start gap-3 p-4 rounded-xl border transition-all ${done ? "bg-blue-50/60 border-blue-200" : "bg-slate-50/60 border-slate-200 hover:border-blue-200"}`}>
      <div className="w-9 h-9 rounded-lg bg-white border border-slate-200 flex items-center justify-center flex-shrink-0">
        <Icon className="w-4 h-4 text-rose-500" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-1">{when}</p>
        <p className={`text-sm leading-relaxed ${done ? "text-slate-500 line-through" : "text-slate-800"}`}>{text}</p>
      </div>
      <button
        onClick={() => onToggle(id)}
        className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all flex-shrink-0 mt-0.5 ${done ? "bg-blue-600 border-blue-600" : "border-slate-300 hover:border-blue-400"}`}
        aria-label="Mark done"
      >
        {done && <Check className="w-3.5 h-3.5 text-white" strokeWidth={3} />}
      </button>
    </div>
  );
}

function FlyingEagle({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 64 64" className={className} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M6 32c12-10 18-16 28-16s16 6 28 16" />
      <path d="M18 36c6-5 10-10 16-10s10 5 16 10" />
      <path d="M18 36c4 4 6 9 6 14s-3 9-6 9" />
    </svg>
  );
}

function ActionTile({ icon: Icon, label, sub, tint, onClick }: {
  icon: ElementType; label: string; sub: string; tint: string; onClick: () => void;
}) {
  return (
    <motion.button
      onClick={onClick}
      whileHover={{ y: -2 }}
      whileTap={{ scale: 0.97 }}
      className="group flex items-center gap-3 p-3 rounded-xl bg-white border border-slate-200 hover:border-blue-300 hover:shadow-md transition-all text-left"
    >
      <div className={`w-9 h-9 rounded-lg bg-gradient-to-br ${tint} flex items-center justify-center flex-shrink-0 shadow-sm`}>
        <Icon className="w-4 h-4 text-white" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold text-slate-900 leading-tight truncate">{label}</p>
        <p className="text-[10px] text-slate-500">{sub}</p>
      </div>
      <ChevronRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-blue-600 group-hover:translate-x-0.5 transition-all flex-shrink-0" />
    </motion.button>
  );
}
