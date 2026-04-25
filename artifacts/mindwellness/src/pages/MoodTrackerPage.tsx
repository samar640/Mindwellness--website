import { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, BarChart, Bar } from "recharts";
import { LineChart as LineIcon, CheckCircle2, Trash2, Sparkles, Flame, TrendingUp, Calendar } from "lucide-react";
import { PageShell } from "@/components/layout/PageShell";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

const STORAGE_KEY = "mw_mood_logs";

type MoodLog = {
  date: string;       // YYYY-MM-DD
  ts: number;         // logged-at timestamp
  score: 1 | 2 | 3 | 4 | 5;
  tags: string[];
  note: string;
};

const MOODS: { score: 1 | 2 | 3 | 4 | 5; emoji: string; label: string; color: string; bg: string }[] = [
  { score: 1, emoji: "😢", label: "Awful", color: "text-rose-700", bg: "bg-rose-50 hover:bg-rose-100 border-rose-200" },
  { score: 2, emoji: "😕", label: "Low",   color: "text-amber-700", bg: "bg-amber-50 hover:bg-amber-100 border-amber-200" },
  { score: 3, emoji: "😐", label: "Okay",  color: "text-slate-700", bg: "bg-slate-50 hover:bg-slate-100 border-slate-200" },
  { score: 4, emoji: "🙂", label: "Good",  color: "text-sky-700",   bg: "bg-sky-50 hover:bg-sky-100 border-sky-200" },
  { score: 5, emoji: "😄", label: "Great", color: "text-blue-700",  bg: "bg-blue-50 hover:bg-blue-100 border-blue-200" },
];

const TAG_OPTIONS = ["Work", "Sleep", "Family", "Friends", "Health", "Money", "Self", "Exercise", "Food", "Weather"];

const todayKey = () => new Date().toISOString().slice(0, 10);

const loadLogs = (): MoodLog[] => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
};

const saveLogs = (logs: MoodLog[]) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(logs));
  } catch {}
};

export default function MoodTrackerPage() {
  const [logs, setLogs] = useState<MoodLog[]>([]);
  const [score, setScore] = useState<1 | 2 | 3 | 4 | 5 | null>(null);
  const [tags, setTags] = useState<string[]>([]);
  const [note, setNote] = useState("");
  const [justSaved, setJustSaved] = useState(false);

  useEffect(() => { setLogs(loadLogs()); }, []);

  const todaysLog = useMemo(
    () => logs.find((l) => l.date === todayKey()),
    [logs]
  );

  const toggleTag = (t: string) =>
    setTags((cur) => (cur.includes(t) ? cur.filter((x) => x !== t) : [...cur, t]));

  const handleSave = () => {
    if (!score) return;
    const entry: MoodLog = {
      date: todayKey(),
      ts: Date.now(),
      score,
      tags,
      note: note.trim(),
    };
    const next = [...logs.filter((l) => l.date !== entry.date), entry].sort((a, b) => a.date.localeCompare(b.date));
    setLogs(next);
    saveLogs(next);
    setJustSaved(true);
    setTimeout(() => setJustSaved(false), 2200);
  };

  const handleDelete = (date: string) => {
    const next = logs.filter((l) => l.date !== date);
    setLogs(next);
    saveLogs(next);
  };

  // Stats
  const stats = useMemo(() => {
    if (logs.length === 0) {
      return { avg7: 0, avg30: 0, streak: 0, total: logs.length, topTag: null as string | null, topMood: null as typeof MOODS[number] | null };
    }
    const last7 = logs.slice(-7);
    const last30 = logs.slice(-30);
    const avg = (arr: MoodLog[]) => arr.length ? arr.reduce((a, b) => a + b.score, 0) / arr.length : 0;

    // streak: consecutive days up to today
    let streak = 0;
    const dates = new Set(logs.map((l) => l.date));
    const cur = new Date();
    while (dates.has(cur.toISOString().slice(0, 10))) {
      streak += 1;
      cur.setDate(cur.getDate() - 1);
    }

    const tagCount: Record<string, number> = {};
    logs.forEach((l) => l.tags.forEach((t) => { tagCount[t] = (tagCount[t] || 0) + 1; }));
    const topTag = Object.entries(tagCount).sort((a, b) => b[1] - a[1])[0]?.[0] || null;

    const moodCount: Record<number, number> = {};
    logs.forEach((l) => { moodCount[l.score] = (moodCount[l.score] || 0) + 1; });
    const topScore = Number(Object.entries(moodCount).sort((a, b) => b[1] - a[1])[0]?.[0]);
    const topMood = MOODS.find((m) => m.score === topScore) || null;

    return { avg7: avg(last7), avg30: avg(last30), streak, total: logs.length, topTag, topMood };
  }, [logs]);

  // chart data — last 14 days, fill missing
  const chartData = useMemo(() => {
    const out: { day: string; label: string; score: number | null }[] = [];
    const map = new Map(logs.map((l) => [l.date, l.score]));
    for (let i = 13; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const key = d.toISOString().slice(0, 10);
      out.push({
        day: key,
        label: d.toLocaleDateString([], { weekday: "short", day: "numeric" }),
        score: map.has(key) ? (map.get(key) as number) : null,
      });
    }
    return out;
  }, [logs]);

  // tag distribution chart
  const tagChart = useMemo(() => {
    const counts: Record<string, number> = {};
    logs.forEach((l) => l.tags.forEach((t) => { counts[t] = (counts[t] || 0) + 1; }));
    return Object.entries(counts)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 6);
  }, [logs]);

  return (
    <PageShell
      title="Mood Tracker"
      subtitle="Check in with yourself daily — small reflections become powerful patterns over time."
      number="06"
      color="bg-gradient-to-br from-indigo-500 to-blue-600"
      icon={LineIcon}
    >
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">

        {/* Today's check-in */}
        <Card className="border-0 shadow-xl bg-white p-6 md:p-8">
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-primary mb-3">
            <Calendar className="w-3.5 h-3.5" />
            {new Date().toLocaleDateString([], { weekday: "long", month: "long", day: "numeric" })}
          </div>
          <h3 className="text-2xl md:text-3xl font-display font-medium text-foreground mb-1">
            {todaysLog ? "Update today's check-in" : "How are you feeling today?"}
          </h3>
          <p className="text-sm text-muted-foreground mb-6">
            Be honest with yourself — there's no wrong answer. Your future self will thank you for this small act.
          </p>

          {/* Mood picker */}
          <div className="grid grid-cols-5 gap-2 sm:gap-3 mb-6">
            {MOODS.map((m) => (
              <motion.button
                key={m.score}
                whileHover={{ y: -3 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setScore(m.score)}
                className={`flex flex-col items-center gap-1.5 p-3 sm:p-4 rounded-2xl border-2 transition-all ${
                  score === m.score
                    ? `${m.bg.replace("hover:", "")} border-current ${m.color} shadow-md scale-[1.03]`
                    : `${m.bg}`
                }`}
              >
                <span className="text-3xl sm:text-4xl">{m.emoji}</span>
                <span className={`text-xs sm:text-sm font-semibold ${score === m.score ? m.color : "text-foreground"}`}>
                  {m.label}
                </span>
              </motion.button>
            ))}
          </div>

          {/* Tags */}
          <div className="mb-5">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">
              What's influencing you? (optional)
            </p>
            <div className="flex flex-wrap gap-2">
              {TAG_OPTIONS.map((t) => {
                const on = tags.includes(t);
                return (
                  <button
                    key={t}
                    onClick={() => toggleTag(t)}
                    className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${
                      on
                        ? "bg-primary text-primary-foreground border-primary shadow-sm"
                        : "bg-white text-foreground border-border hover:border-primary/40"
                    }`}
                  >
                    {t}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Note */}
          <div className="mb-6">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">
              A quick note (optional)
            </p>
            <Textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="What's on your mind today? Even one sentence helps — 'Hard meeting, took a walk after.'"
              className="min-h-[90px] resize-none text-sm"
            />
          </div>

          <div className="flex items-center gap-3">
            <Button onClick={handleSave} disabled={!score} size="lg" className="gap-2">
              <CheckCircle2 className="w-4 h-4" />
              {todaysLog ? "Update entry" : "Save today's mood"}
            </Button>
            <AnimatePresence>
              {justSaved && (
                <motion.span
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0 }}
                  className="text-sm text-blue-700 font-medium flex items-center gap-1.5"
                >
                  <Sparkles className="w-4 h-4" /> Saved — proud of you for showing up.
                </motion.span>
              )}
            </AnimatePresence>
          </div>
        </Card>

        {/* Insights row */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
          <StatCard
            label="Day streak"
            value={stats.streak.toString()}
            sub={stats.streak > 0 ? "Keep going 🔥" : "Log today to start"}
            icon={Flame}
            tint="from-orange-400 to-rose-500"
          />
          <StatCard
            label="7-day average"
            value={stats.avg7 ? stats.avg7.toFixed(1) : "—"}
            sub="out of 5"
            icon={TrendingUp}
            tint="from-blue-400 to-indigo-600"
          />
          <StatCard
            label="Most common"
            value={stats.topMood ? stats.topMood.emoji : "—"}
            sub={stats.topMood ? stats.topMood.label : "Not enough data"}
            icon={Sparkles}
            tint="from-violet-400 to-purple-600"
          />
          <StatCard
            label="Top influence"
            value={stats.topTag || "—"}
            sub={stats.topTag ? "showing up most" : "Add tags above"}
            icon={LineIcon}
            tint="from-teal-400 to-sky-600"
          />
        </div>

        {/* Trend chart */}
        <Card className="border-0 shadow-xl bg-white p-6 md:p-8">
          <h3 className="text-xl font-display font-medium mb-1">Last 14 days</h3>
          <p className="text-sm text-muted-foreground mb-5">
            Your mood trend over time. Gaps mean a missed day — that's okay, just come back when you can.
          </p>
          <div className="w-full h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                <XAxis dataKey="label" tick={{ fontSize: 11, fill: "#64748b" }} tickLine={false} axisLine={false} />
                <YAxis domain={[0, 5]} ticks={[1, 2, 3, 4, 5]} tick={{ fontSize: 11, fill: "#64748b" }} tickLine={false} axisLine={false} />
                <Tooltip
                  contentStyle={{ borderRadius: 12, border: "1px solid #e2e8f0", fontSize: 12 }}
                  formatter={(value) => {
                    const scoreValue = typeof value === "number" ? value : Number(value);
                    if (!Number.isFinite(scoreValue) || scoreValue <= 0) {
                      return "no entry";
                    }
                    return `${scoreValue}/5 — ${MOODS.find((m) => m.score === scoreValue)?.label ?? ""}`;
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="score"
                  stroke="hsl(213 65% 46%)"
                  strokeWidth={3}
                  dot={{ r: 5, fill: "hsl(213 65% 46%)", strokeWidth: 2, stroke: "#fff" }}
                  activeDot={{ r: 7 }}
                  connectNulls={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* Tag distribution */}
        {tagChart.length > 0 && (
          <Card className="border-0 shadow-xl bg-white p-6 md:p-8">
            <h3 className="text-xl font-display font-medium mb-1">What's been on your mind</h3>
            <p className="text-sm text-muted-foreground mb-5">
              The areas of life showing up most in your check-ins.
            </p>
            <div className="w-full h-56">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={tagChart} margin={{ top: 8, right: 8, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                  <XAxis dataKey="name" tick={{ fontSize: 11, fill: "#64748b" }} tickLine={false} axisLine={false} />
                  <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: "#64748b" }} tickLine={false} axisLine={false} />
                  <Tooltip contentStyle={{ borderRadius: 12, border: "1px solid #e2e8f0", fontSize: 12 }} />
                  <Bar dataKey="count" fill="hsl(213 65% 46%)" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Card>
        )}

        {/* Recent entries */}
        {logs.length > 0 && (
          <Card className="border-0 shadow-xl bg-white p-6 md:p-8">
            <h3 className="text-xl font-display font-medium mb-1">Recent entries</h3>
            <p className="text-sm text-muted-foreground mb-5">
              {logs.length} {logs.length === 1 ? "entry" : "entries"} so far. Every one matters.
            </p>
            <div className="space-y-3 max-h-[420px] overflow-y-auto pr-1">
              {[...logs].reverse().slice(0, 20).map((l) => {
                const mood = MOODS.find((m) => m.score === l.score)!;
                return (
                  <div key={l.date} className="flex items-start gap-3 p-3.5 rounded-xl bg-secondary/40 border border-secondary">
                    <span className="text-2xl flex-shrink-0">{mood.emoji}</span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2 flex-wrap">
                        <p className="text-sm font-semibold text-foreground">
                          {new Date(l.date).toLocaleDateString([], { weekday: "long", month: "short", day: "numeric" })}
                          <span className={`ml-2 text-xs font-medium ${mood.color}`}>{mood.label}</span>
                        </p>
                        <button
                          onClick={() => handleDelete(l.date)}
                          className="text-muted-foreground hover:text-destructive transition-colors"
                          aria-label="Delete entry"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                      {l.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 mt-1.5">
                          {l.tags.map((t) => (
                            <span key={t} className="text-[10px] px-2 py-0.5 rounded-full bg-white border border-border text-muted-foreground">
                              {t}
                            </span>
                          ))}
                        </div>
                      )}
                      {l.note && (
                        <p className="text-sm text-muted-foreground mt-1.5 leading-relaxed italic">
                          "{l.note}"
                        </p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </Card>
        )}
      </div>
    </PageShell>
  );
}

function StatCard({ label, value, sub, icon: Icon, tint }: {
  label: string; value: string; sub: string; icon: React.ElementType; tint: string;
}) {
  return (
    <Card className="border-0 shadow-md bg-white p-4 md:p-5 relative overflow-hidden">
      <div className={`absolute -top-6 -right-6 w-20 h-20 rounded-full bg-gradient-to-br ${tint} opacity-10 blur-2xl`} />
      <div className="relative">
        <div className={`inline-flex w-9 h-9 rounded-xl bg-gradient-to-br ${tint} items-center justify-center mb-3 shadow-sm`}>
          <Icon className="w-4 h-4 text-white" />
        </div>
        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{label}</p>
        <p className="text-2xl md:text-3xl font-display font-semibold text-foreground mt-0.5 truncate">{value}</p>
        <p className="text-xs text-muted-foreground mt-0.5">{sub}</p>
      </div>
    </Card>
  );
}
