import { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useLocation } from "wouter";
import {
  Sparkles, Heart, Wind, Quote as QuoteIcon, Apple, FileText,
  Check, Flame, ChevronRight, RotateCw, Sun, Calendar
} from "lucide-react";
import { PageShell } from "@/components/layout/PageShell";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

// ---- Daily content libraries (deterministic by day) ----
const QUOTES = [
  { text: "You don't have to be perfect to begin. You just have to begin.", who: "Unknown" },
  { text: "The cure for anything is salt water — sweat, tears, or the sea.", who: "Isak Dinesen" },
  { text: "What you seek is seeking you.", who: "Rumi" },
  { text: "Almost everything will work again if you unplug it for a few minutes — including you.", who: "Anne Lamott" },
  { text: "You are allowed to be both a masterpiece and a work in progress simultaneously.", who: "Sophia Bush" },
  { text: "Rest is not idleness. Rest is the soil where your next chapter grows.", who: "Unknown" },
  { text: "Feelings, when written about, lose their grip on you.", who: "James Pennebaker" },
  { text: "You don't have to see the whole staircase. Just take the first step.", who: "Martin Luther King Jr." },
  { text: "Be patient with yourself. You're growing in a world that often forgets to.", who: "Unknown" },
  { text: "Out of suffering have emerged the strongest souls.", who: "Khalil Gibran" },
  { text: "Self-care is not selfish. You cannot pour from an empty cup.", who: "Eleanor Brown" },
  { text: "Storms make trees take deeper roots.", who: "Dolly Parton" },
];

const MEALS = [
  "Warm oatmeal with banana, walnuts, and a drizzle of honey — slow energy that won't crash by 11am.",
  "Lentil soup with whole-grain bread — comforting, protein-rich, kind to your gut.",
  "Greek yogurt with berries, chia seeds, and a spoon of almond butter — full of mood-supporting B vitamins.",
  "A wholegrain wrap with hummus, cucumber, tomato and feta — fast, satisfying, easy to make tired.",
  "Stir-fry tofu or chicken with broccoli, garlic, and brown rice — magnesium for stress, protein for steady mood.",
  "Two boiled eggs on sourdough toast with smashed avocado — protein and good fats to keep you focused.",
  "A simple dal with rice and a spoon of ghee — humble, warm, deeply nourishing.",
  "Salmon (or chickpeas) with roasted sweet potato and greens — omega-3s help your brain breathe easier.",
  "A grain bowl: quinoa + roasted vegetables + tahini drizzle — easy meal-prep, balanced macros.",
  "Soup-and-toast night: a warming vegetable soup with a slice of buttered sourdough.",
];

const EXERCISES = [
  { title: "5-minute desk reset", desc: "Roll your shoulders back 10 times. Stretch each side of your neck for 20 seconds. Stand and reach overhead for a slow inhale-exhale." },
  { title: "10-minute walk outside", desc: "No phone, no podcast — just walk. Notice three things you can see, hear, or smell. Sunlight does half the work for you." },
  { title: "Gentle yoga flow", desc: "5 cat-cows, 5 child's poses, 1 minute legs-up-the-wall. Brilliant for an over-tired nervous system." },
  { title: "Bodyweight 4×4", desc: "10 squats, 10 push-ups (knees fine), 10 lunges per leg, 30 seconds of stillness. Repeat 4 rounds with 30s rest." },
  { title: "Stair-and-stretch combo", desc: "Walk up and down the nearest stairs for 3 minutes, then stretch your hamstrings and hip flexors for 2." },
  { title: "Slow strength", desc: "3 sets of 8 wall push-ups, 8 chair squats, and 30-second plank. Slow and controlled — quality over speed." },
  { title: "Dance for 1 song", desc: "Pick a song you loved at 14. Move however your body wants. This counts. Studies confirm it." },
  { title: "20-minute brisk walk", desc: "Aim for a pace where you can talk but not sing. 8,000 steps a day is the sweet spot for mood." },
  { title: "Mobility 7", desc: "Neck rolls, shoulder circles, spinal twists, hip openers, ankle rolls — 1 minute each. A reset for stiff days." },
  { title: "Forest-walk 30", desc: "Find any green patch — park, garden, tree-lined street — and walk for 30 minutes at an easy pace." },
];

// ---- Journey storage ----
type DayState = {
  date: string;
  mood?: number;             // 1-5
  breathe?: boolean;
  inspire?: boolean;
  nourish?: boolean;
  reflect?: string;          // saved text or "done"
};

const todayKey = () => new Date().toISOString().slice(0, 10);
const STORAGE_KEY = "mw_journey_log";
const MOOD_KEY = "mw_mood_logs";
const JOURNAL_KEY = "mw_journal_entries";

const seedForDay = () => {
  const d = new Date();
  return d.getFullYear() * 1000 + d.getMonth() * 31 + d.getDate();
};

const loadAll = (): DayState[] => {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]"); } catch { return []; }
};
const saveAll = (s: DayState[]) => { try { localStorage.setItem(STORAGE_KEY, JSON.stringify(s)); } catch {} };

const MOODS = [
  { score: 1 as const, emoji: "😢", label: "Awful" },
  { score: 2 as const, emoji: "😕", label: "Low" },
  { score: 3 as const, emoji: "😐", label: "Okay" },
  { score: 4 as const, emoji: "🙂", label: "Good" },
  { score: 5 as const, emoji: "😄", label: "Great" },
];

export default function JourneyPage() {
  const [, navigate] = useLocation();
  const [all, setAll] = useState<DayState[]>([]);
  const [today, setToday] = useState<DayState>({ date: todayKey() });
  const [reflectText, setReflectText] = useState("");
  const [breatheRunning, setBreatheRunning] = useState(false);
  const [breatheLeft, setBreatheLeft] = useState(60);
  const [phase, setPhase] = useState<"In" | "Hold" | "Out">("In");

  useEffect(() => {
    const log = loadAll();
    setAll(log);
    const t = log.find((d) => d.date === todayKey()) || { date: todayKey() };
    setToday(t);
  }, []);

  const persist = (next: DayState) => {
    setToday(next);
    const others = all.filter((d) => d.date !== next.date);
    const updated = [...others, next].sort((a, b) => a.date.localeCompare(b.date));
    setAll(updated);
    saveAll(updated);
  };

  // 60-second box breathing timer (4-4-4-4)
  useEffect(() => {
    if (!breatheRunning) return;
    if (breatheLeft <= 0) {
      setBreatheRunning(false);
      persist({ ...today, breathe: true });
      return;
    }
    const id = setInterval(() => setBreatheLeft((s) => s - 1), 1000);
    return () => clearInterval(id);
  }, [breatheRunning, breatheLeft]);

  useEffect(() => {
    if (!breatheRunning) return;
    const phases: ("In" | "Hold" | "Out")[] = ["In", "Hold", "Out", "Hold"];
    const idx = Math.floor(((60 - breatheLeft) % 16) / 4);
    setPhase(phases[idx]);
  }, [breatheLeft, breatheRunning]);

  const seed = seedForDay();
  const quote = useMemo(() => QUOTES[seed % QUOTES.length], [seed]);
  const meal = useMemo(() => MEALS[seed % MEALS.length], [seed]);
  const exercise = useMemo(() => EXERCISES[seed % EXERCISES.length], [seed]);

  const setMood = (score: 1 | 2 | 3 | 4 | 5) => {
    persist({ ...today, mood: score });
    // also write to mood tracker so the two systems share data
    try {
      const raw = JSON.parse(localStorage.getItem(MOOD_KEY) || "[]");
      const filtered = raw.filter((l: any) => l.date !== todayKey());
      filtered.push({ date: todayKey(), ts: Date.now(), score, tags: [], note: "" });
      localStorage.setItem(MOOD_KEY, JSON.stringify(filtered.sort((a: any, b: any) => a.date.localeCompare(b.date))));
    } catch {}
  };

  const completeInspire = () => persist({ ...today, inspire: true });
  const completeNourish = () => persist({ ...today, nourish: true });
  const completeReflect = () => {
    if (!reflectText.trim()) return;
    persist({ ...today, reflect: "done" });
    // also add to journal
    try {
      const raw = JSON.parse(localStorage.getItem(JOURNAL_KEY) || "[]");
      raw.push({ id: Date.now(), date: todayKey(), prompt: "One thing I'm carrying today", body: reflectText.trim() });
      localStorage.setItem(JOURNAL_KEY, JSON.stringify(raw));
    } catch {}
    setReflectText("");
  };

  // streak: consecutive days with at least 3 completed steps
  const streak = useMemo(() => {
    const map = new Map(all.map((d) => [d.date, d]));
    let s = 0;
    const cur = new Date();
    while (true) {
      const k = cur.toISOString().slice(0, 10);
      const day = map.get(k);
      if (!day) break;
      const count = [day.mood, day.breathe, day.inspire, day.nourish, day.reflect].filter(Boolean).length;
      if (count < 3) break;
      s++;
      cur.setDate(cur.getDate() - 1);
    }
    return s;
  }, [all]);

  const stepsDone = [today.mood, today.breathe, today.inspire, today.nourish, today.reflect].filter(Boolean).length;
  const allDone = stepsDone === 5;

  return (
    <PageShell
      title="Today's Journey"
      subtitle="Five tiny check-ins that add up to a kinder day. No pressure — pick what you need, skip what you don't."
      number="00"
      color="bg-gradient-to-br from-blue-500 to-indigo-600"
      icon={Sun}
    >
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">

        {/* Progress strip */}
        <Card className="border-0 shadow-xl bg-gradient-to-br from-blue-600 to-indigo-700 text-white p-5 md:p-7 relative overflow-hidden">
          <div className="absolute -top-10 -right-10 w-40 h-40 rounded-full bg-white/10 blur-2xl" />
          <div className="relative flex items-center justify-between gap-4 flex-wrap">
            <div>
              <div className="flex items-center gap-2 text-xs text-white/80 uppercase tracking-widest mb-1">
                <Calendar className="w-3.5 h-3.5" />
                {new Date().toLocaleDateString([], { weekday: "long", month: "long", day: "numeric" })}
              </div>
              <p className="text-2xl font-display font-medium">
                {allDone ? "You did all five today 💛" : `${stepsDone} of 5 done — every one counts.`}
              </p>
            </div>
            <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-white/15 backdrop-blur-sm">
              <Flame className="w-5 h-5 text-amber-300" />
              <span className="font-semibold">{streak}-day streak</span>
            </div>
          </div>
          <div className="relative mt-4 grid grid-cols-5 gap-1.5">
            {[today.mood, today.breathe, today.inspire, today.nourish, today.reflect].map((on, i) => (
              <div key={i} className={`h-1.5 rounded-full transition-all ${on ? "bg-blue-200" : "bg-white/20"}`} />
            ))}
          </div>
        </Card>

        {/* Step 1 — Mood */}
        <StepCard n={1} title="Check in with how you feel" done={!!today.mood} icon={Heart} tint="from-blue-400 to-sky-600">
          {today.mood ? (
            <div className="flex items-center gap-3">
              <span className="text-3xl">{MOODS.find(m => m.score === today.mood)?.emoji}</span>
              <p className="text-sm text-foreground">
                You logged feeling <strong>{MOODS.find(m => m.score === today.mood)?.label}</strong> today. Saved to your tracker too.
              </p>
            </div>
          ) : (
            <>
              <p className="text-sm text-muted-foreground mb-3">A 5-second snapshot of where you are right now.</p>
              <div className="grid grid-cols-5 gap-1.5 sm:gap-2">
                {MOODS.map((m) => (
                  <button
                    key={m.score}
                    onClick={() => setMood(m.score)}
                    className="flex flex-col items-center gap-1 p-2.5 rounded-xl border-2 border-border hover:border-primary/40 hover:bg-blue-50/40 transition-all"
                  >
                    <span className="text-2xl">{m.emoji}</span>
                    <span className="text-[10px] font-semibold text-foreground/70">{m.label}</span>
                  </button>
                ))}
              </div>
            </>
          )}
        </StepCard>

        {/* Step 2 — Breathe */}
        <StepCard n={2} title="One quiet minute of breathing" done={!!today.breathe} icon={Wind} tint="from-sky-400 to-cyan-600">
          {today.breathe ? (
            <p className="text-sm text-foreground">
              Done — your nervous system thanks you 🌬️ Want a deeper session? <button onClick={() => navigate("/breathe")} className="text-primary font-medium underline-offset-2 hover:underline">Open the full breathing tool</button>.
            </p>
          ) : breatheRunning ? (
            <div className="text-center py-6">
              <motion.div
                key={phase}
                initial={{ scale: 0.85, opacity: 0.8 }}
                animate={{ scale: phase === "In" ? 1.15 : phase === "Out" ? 0.85 : 1 }}
                transition={{ duration: 4, ease: "easeInOut" }}
                className="w-32 h-32 mx-auto rounded-full bg-gradient-to-br from-sky-300 to-blue-500 flex items-center justify-center text-white shadow-lg"
              >
                <div className="text-center">
                  <p className="text-xs uppercase tracking-widest opacity-80">Breathe</p>
                  <p className="text-3xl font-display font-medium">{phase}</p>
                </div>
              </motion.div>
              <p className="text-sm text-muted-foreground mt-4">{breatheLeft}s left</p>
            </div>
          ) : (
            <>
              <p className="text-sm text-muted-foreground mb-3">A 60-second box breath: in 4, hold 4, out 4, hold 4. That's it.</p>
              <Button onClick={() => { setBreatheLeft(60); setBreatheRunning(true); }} className="gap-2">
                <Wind className="w-4 h-4" /> Start 60s breathing
              </Button>
            </>
          )}
        </StepCard>

        {/* Step 3 — Inspire */}
        <StepCard n={3} title="A line worth holding onto" done={!!today.inspire} icon={QuoteIcon} tint="from-purple-400 to-violet-600">
          <div className="p-4 rounded-2xl bg-gradient-to-br from-purple-50 to-violet-50 border border-purple-100 mb-4">
            <p className="text-base md:text-lg font-display italic text-foreground leading-snug">"{quote.text}"</p>
            <p className="text-xs text-muted-foreground mt-2">— {quote.who}</p>
          </div>
          {today.inspire ? (
            <p className="text-xs text-blue-700 font-medium flex items-center gap-1.5">
              <Check className="w-4 h-4" /> Saved to today.
            </p>
          ) : (
            <div className="flex items-center gap-3 flex-wrap">
              <Button onClick={completeInspire} variant="outline" className="gap-2">
                <Check className="w-4 h-4" /> I'll carry this today
              </Button>
              <button onClick={() => navigate("/dashboard")} className="text-xs text-muted-foreground hover:text-primary">
                Open Today's Plan →
              </button>
            </div>
          )}
        </StepCard>

        {/* Step 4 — Nourish */}
        <StepCard n={4} title="One nourishing meal idea" done={!!today.nourish} icon={Apple} tint="from-rose-400 to-red-600">
          <div className="flex gap-3 items-start mb-4">
            <span className="text-2xl">🍽️</span>
            <p className="text-sm text-foreground leading-relaxed">{meal}</p>
          </div>
          <div className="flex gap-3 items-start mb-4 p-3 rounded-xl bg-blue-50/60 border border-blue-100">
            <span className="text-xl">💧</span>
            <p className="text-sm text-foreground">
              <strong>Hydration check:</strong> aim for 2 litres today. Top up your glass right now — future you will be grateful.
            </p>
          </div>
          {today.nourish ? (
            <p className="text-xs text-blue-700 font-medium flex items-center gap-1.5">
              <Check className="w-4 h-4" /> Noted.
            </p>
          ) : (
            <div className="flex items-center gap-3 flex-wrap">
              <Button onClick={completeNourish} variant="outline" className="gap-2">
                <Check className="w-4 h-4" /> Got it
              </Button>
              <button onClick={() => navigate("/diet")} className="text-xs text-muted-foreground hover:text-primary">
                Open BMI &amp; water calculator →
              </button>
            </div>
          )}
        </StepCard>

        {/* Bonus — Today's exercise */}
        <Card className="border-0 shadow-md bg-gradient-to-br from-teal-50 to-blue-50 border-teal-100 p-5 md:p-6">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-teal-400 to-blue-500 flex items-center justify-center flex-shrink-0">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <div className="flex-1">
              <p className="text-xs font-semibold uppercase tracking-widest text-teal-700 mb-1">Today's gentle move</p>
              <h4 className="font-display text-lg font-medium text-foreground mb-1">{exercise.title}</h4>
              <p className="text-sm text-muted-foreground leading-relaxed">{exercise.desc}</p>
            </div>
          </div>
        </Card>

        {/* Step 5 — Reflect */}
        <StepCard n={5} title="A small reflection" done={!!today.reflect} icon={FileText} tint="from-violet-400 to-blue-600">
          {today.reflect ? (
            <p className="text-sm text-foreground">
              Saved to your journal 💛 Want to go deeper? <button onClick={() => navigate("/healing")} className="text-primary font-medium underline-offset-2 hover:underline">Open Guided Healing</button>.
            </p>
          ) : (
            <>
              <p className="text-sm font-medium text-foreground mb-2">One thing you're carrying today:</p>
              <p className="text-xs text-muted-foreground mb-3">It can be heavy or light. A worry, a person, a hope. Just a sentence.</p>
              <Textarea
                value={reflectText}
                onChange={(e) => setReflectText(e.target.value)}
                placeholder="e.g. I'm carrying a hard conversation I've been avoiding."
                className="min-h-[90px] text-sm mb-3"
              />
              <div className="flex items-center gap-3 flex-wrap">
                <Button onClick={completeReflect} disabled={!reflectText.trim()} className="gap-2">
                  <Check className="w-4 h-4" /> Save reflection
                </Button>
                <button onClick={() => navigate("/healing")} className="text-xs text-muted-foreground hover:text-primary">
                  Try a full thought record →
                </button>
              </div>
            </>
          )}
        </StepCard>

        {/* Completion celebration */}
        <AnimatePresence>
          {allDone && (
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
            >
              <Card className="border-0 shadow-xl bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-100 p-7 text-center">
                <div className="w-14 h-14 mx-auto mb-3 rounded-full bg-blue-100 flex items-center justify-center">
                  <Sparkles className="w-7 h-7 text-blue-600" />
                </div>
                <h3 className="text-2xl font-display font-medium mb-2">All five, today 💛</h3>
                <p className="text-sm text-muted-foreground max-w-md mx-auto mb-5">
                  This is what showing up for yourself looks like. Tomorrow's journey will be here when you are.
                </p>
                <div className="flex justify-center gap-3 flex-wrap">
                  <Button onClick={() => navigate("/dashboard")} variant="outline" className="gap-2">
                    <Heart className="w-4 h-4" /> Open Today's Plan
                  </Button>
                  <Button onClick={() => navigate("/healing")} className="gap-2">
                    <FileText className="w-4 h-4" /> Go deeper in healing <ChevronRight className="w-4 h-4" />
                  </Button>
                </div>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </PageShell>
  );
}

function StepCard({ n, title, done, icon: Icon, tint, children }: {
  n: number; title: string; done: boolean; icon: React.ElementType; tint: string; children: React.ReactNode;
}) {
  return (
    <Card className={`border-0 shadow-lg bg-white p-5 md:p-6 transition-all ${done ? "ring-1 ring-blue-200" : ""}`}>
      <div className="flex items-start gap-4">
        <div className="flex-shrink-0">
          <div className={`relative w-11 h-11 rounded-2xl bg-gradient-to-br ${tint} flex items-center justify-center shadow-sm`}>
            <Icon className="w-5 h-5 text-white" />
            {done && (
              <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-blue-500 border-2 border-white flex items-center justify-center">
                <Check className="w-2.5 h-2.5 text-white" strokeWidth={3} />
              </span>
            )}
          </div>
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[10px] font-bold uppercase tracking-widest text-primary">Step {n}</span>
            {done && <span className="text-[10px] font-semibold text-blue-700">· Done</span>}
          </div>
          <h3 className="font-display text-lg md:text-xl font-medium text-foreground mb-3 leading-snug">{title}</h3>
          {children}
        </div>
      </div>
    </Card>
  );
}
