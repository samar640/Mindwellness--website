import { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, BookOpen, Brain, ChevronRight, ChevronLeft, RotateCw, Trash2, CheckCircle2, FileText, Heart } from "lucide-react";
import { useLocation } from "wouter";
import { PageShell } from "@/components/layout/PageShell";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";

const CBT_KEY = "mw_thought_records";
const JOURNAL_KEY = "mw_journal_entries";

// ---- CBT thought record ----
type Record = {
  id: number;
  date: string;
  situation: string;
  emotion: string;
  intensityBefore: number;
  thought: string;
  evidenceFor: string;
  evidenceAgainst: string;
  balanced: string;
  intensityAfter: number;
};

const STEPS = [
  { key: "situation",       title: "What happened?",        hint: "Describe the situation simply, like you're telling a friend. Stick to facts, not feelings yet.", placeholder: "e.g. My boss didn't reply to my email all day…" },
  { key: "emotion",         title: "What did you feel?",   hint: "Name the emotion and rate how strong it was, from 1 (mild) to 10 (overwhelming).", placeholder: "e.g. Anxious, rejected" },
  { key: "thought",         title: "The automatic thought", hint: "What did your mind tell you in that moment? The first sentence that popped up — uncensored.", placeholder: "e.g. He must be angry with me. I'm going to lose my job." },
  { key: "evidenceFor",     title: "Evidence FOR the thought", hint: "What real, concrete evidence supports this thought? Be specific.", placeholder: "e.g. He usually replies within an hour. He seemed cold this morning." },
  { key: "evidenceAgainst", title: "Evidence AGAINST it",   hint: "What evidence contradicts the thought? Other reasonable explanations?", placeholder: "e.g. He's in back-to-back meetings today. Last week he praised my work. Silence ≠ anger." },
  { key: "balanced",        title: "A more balanced thought", hint: "If a wise friend looked at all the evidence, what would they say to you? Aim for true, not just positive.", placeholder: "e.g. He's probably busy. One slow reply doesn't mean I'm in trouble. I'll wait until tomorrow before assuming the worst." },
] as const;

// ---- Journaling prompts ----
const PROMPTS = [
  "Name three small things that went well today, no matter how tiny.",
  "What's one worry on your mind right now? Write it out fully — sometimes naming it shrinks it.",
  "Describe a moment this week when you felt most like yourself.",
  "If your inner critic could speak, what would it say? Now: how would you reply if a friend said that to themselves?",
  "What does your body need right now? Listen for 30 seconds before answering.",
  "Write a letter to the version of you from a year ago. What do they need to hear?",
  "What's something you're carrying that isn't yours to carry?",
  "List five things you're grateful for — and one reason why each one matters.",
  "What would 'a good day' look like tomorrow? Describe the first hour in detail.",
  "Recall a time you got through something hard. What helped you then? Could it help now?",
  "What feeling have you been avoiding? Sit with it for a moment — what is it trying to tell you?",
  "Who in your life makes you feel safe and seen? When did you last reach out to them?",
  "Finish this sentence ten times: 'I am proud of myself for…'",
  "What's a small kindness you can give yourself today? Schedule it.",
  "If your mind was a room, what would you tidy first?",
  "Write about a place — real or imagined — where you feel completely at peace.",
  "What's one boundary you'd like to honour better this week?",
  "Describe today's weather inside you — sunny, cloudy, stormy? What's the forecast for tomorrow?",
  "What's been louder lately — your fear, or your hope? Why?",
  "What's a story you keep telling yourself that might not be entirely true?",
];

type JournalEntry = { id: number; date: string; prompt: string; body: string };

const todayKey = () => new Date().toISOString().slice(0, 10);

const loadCbt = (): Record[] => {
  try { return JSON.parse(localStorage.getItem(CBT_KEY) || "[]"); } catch { return []; }
};
const saveCbt = (r: Record[]) => { try { localStorage.setItem(CBT_KEY, JSON.stringify(r)); } catch {} };
const loadJournal = (): JournalEntry[] => {
  try { return JSON.parse(localStorage.getItem(JOURNAL_KEY) || "[]"); } catch { return []; }
};
const saveJournal = (j: JournalEntry[]) => { try { localStorage.setItem(JOURNAL_KEY, JSON.stringify(j)); } catch {} };

type PsychInsight = {
  psychologist: string;
  thought: string;
  guidance: string;
  tags: string[];
};

const PSYCHOLOGIST_INSIGHTS: PsychInsight[] = [
  {
    psychologist: "Aaron Beck",
    thought: "Thoughts are powerful, but they are not always facts.",
    guidance: "When your mind predicts the worst, pause and ask: what objective evidence supports this?",
    tags: ["anxious", "worry", "catastrophe", "panic", "overthinking", "future"],
  },
  {
    psychologist: "Albert Ellis",
    thought: "Events hurt less than the meanings we attach to them.",
    guidance: "Replace rigid beliefs ('must', 'should', 'always') with flexible and compassionate language.",
    tags: ["should", "must", "always", "failure", "perfect", "judgment"],
  },
  {
    psychologist: "David Burns",
    thought: "Name the distortion, and it loses some of its grip.",
    guidance: "Watch for all-or-nothing thinking, mind-reading, and emotional reasoning in your record.",
    tags: ["all or nothing", "never", "always", "mind reading", "distortion", "worthless"],
  },
  {
    psychologist: "Marsha Linehan",
    thought: "Two things can be true: this is painful, and you can still move forward.",
    guidance: "Practice radical acceptance first, then choose one effective next step for today.",
    tags: ["overwhelmed", "intense", "angry", "hurt", "rejected", "alone"],
  },
  {
    psychologist: "Carl Rogers",
    thought: "Healing begins when you meet yourself with honesty and kindness.",
    guidance: "Speak to yourself as you would speak to someone you deeply care about.",
    tags: ["shame", "guilt", "not enough", "self", "critic", "unlovable"],
  },
  {
    psychologist: "Viktor Frankl",
    thought: "Even in difficulty, you still get to choose your response.",
    guidance: "Find one meaningful action today that reflects your values, not your fear.",
    tags: ["meaning", "stuck", "purpose", "hopeless", "empty", "direction"],
  },
  {
    psychologist: "Carol Dweck",
    thought: "You are not defined by this moment; growth comes through repetition.",
    guidance: "Treat this reflection as a training rep, not a final verdict about who you are.",
    tags: ["growth", "learning", "improve", "setback", "mistake", "progress"],
  },
  {
    psychologist: "Martin Seligman",
    thought: "Small, repeatable habits build emotional resilience.",
    guidance: "Anchor your balanced thought to one daily action you can repeat this week.",
    tags: ["routine", "habit", "energy", "motivation", "resilience", "consistency"],
  },
];

function getResonatingInsight(draft: {
  situation: string;
  emotion: string;
  thought: string;
  evidenceFor: string;
  evidenceAgainst: string;
  balanced: string;
  intensityBefore: number;
}) {
  const fullText = `${draft.situation} ${draft.emotion} ${draft.thought} ${draft.evidenceFor} ${draft.evidenceAgainst} ${draft.balanced}`.toLowerCase();
  const words = fullText.split(/\W+/).filter(Boolean);
  const uniqueWords = new Set(words);

  let best = PSYCHOLOGIST_INSIGHTS[0];
  let bestScore = -1;

  for (const insight of PSYCHOLOGIST_INSIGHTS) {
    let score = 0;
    for (const tag of insight.tags) {
      if (fullText.includes(tag) || uniqueWords.has(tag)) {
        score += 2;
      }
    }
    if (insight.psychologist === "Marsha Linehan" && draft.intensityBefore >= 8) score += 1;
    if (insight.psychologist === "Aaron Beck" && /anxious|worry|panic/.test(draft.emotion.toLowerCase())) score += 1;
    if (insight.psychologist === "Carl Rogers" && /guilt|shame|not enough/.test(draft.emotion.toLowerCase())) score += 1;
    if (score > bestScore) {
      best = insight;
      bestScore = score;
    }
  }

  return best;
}

export default function HealingPage() {
  const [tab, setTab] = useState<"cbt" | "journal">("cbt");

  return (
    <PageShell
      title="Guided Healing"
      subtitle="Two gentle, evidence-based tools to help you understand your thoughts and feelings — at your own pace."
      number="07"
      color="bg-gradient-to-br from-violet-500 to-blue-600"
      icon={Brain}
    >
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* Tabs */}
        <div className="flex justify-center mb-8">
          <div className="inline-flex bg-secondary/60 p-1 rounded-full border border-border">
            <TabButton active={tab === "cbt"} onClick={() => setTab("cbt")} icon={Brain} label="Thought Record" />
            <TabButton active={tab === "journal"} onClick={() => setTab("journal")} icon={BookOpen} label="Journaling Prompts" />
          </div>
        </div>

        <AnimatePresence mode="wait">
          {tab === "cbt" ? (
            <motion.div key="cbt" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
              <CbtFlow />
            </motion.div>
          ) : (
            <motion.div key="journal" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
              <JournalFlow />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </PageShell>
  );
}

function TabButton({ active, onClick, icon: Icon, label }: { active: boolean; onClick: () => void; icon: React.ElementType; label: string }) {
  return (
    <button
      onClick={onClick}
      className={`px-4 sm:px-5 py-2.5 rounded-full text-sm font-semibold flex items-center gap-2 transition-all ${
        active ? "bg-white shadow-md text-primary" : "text-muted-foreground hover:text-foreground"
      }`}
    >
      <Icon className="w-4 h-4" /> {label}
    </button>
  );
}

// ----------- CBT FLOW -----------
function CbtFlow() {
  const [, navigate] = useLocation();
  const [records, setRecords] = useState<Record[]>([]);
  const [step, setStep] = useState(0);
  const [draft, setDraft] = useState({
    situation: "",
    emotion: "",
    intensityBefore: 5,
    thought: "",
    evidenceFor: "",
    evidenceAgainst: "",
    balanced: "",
    intensityAfter: 5,
  });
  const [done, setDone] = useState(false);

  useEffect(() => { setRecords(loadCbt()); }, []);

  const set = <K extends keyof typeof draft>(k: K, v: typeof draft[K]) => setDraft((d) => ({ ...d, [k]: v }));

  const reset = () => {
    setStep(0);
    setDraft({ situation: "", emotion: "", intensityBefore: 5, thought: "", evidenceFor: "", evidenceAgainst: "", balanced: "", intensityAfter: 5 });
    setDone(false);
  };

  const handleSave = () => {
    const r: Record = { id: Date.now(), date: todayKey(), ...draft };
    const next = [...records, r];
    setRecords(next);
    saveCbt(next);
    setDone(true);
  };

  const handleDelete = (id: number) => {
    const next = records.filter((r) => r.id !== id);
    setRecords(next);
    saveCbt(next);
  };

  const progress = ((step + 1) / (STEPS.length + 1)) * 100;
  const cur = STEPS[step];
  const value = cur ? (draft as any)[cur.key] as string : "";
  const canNext = cur && cur.key !== "emotion" ? value.trim().length > 0 : true;
  const resonatingInsight = useMemo(() => getResonatingInsight(draft), [draft]);

  if (done) {
    return (
      <Card className="border-0 shadow-xl bg-white p-8 md:p-10 text-center">
        <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-blue-100 flex items-center justify-center">
          <CheckCircle2 className="w-8 h-8 text-blue-600" />
        </div>
        <h3 className="text-2xl font-display font-medium mb-2">That took courage 💛</h3>
        <p className="text-muted-foreground max-w-md mx-auto mb-6">
          You just looked at a hard thought clearly and gave yourself a gentler one. That's the work — and you did it.
        </p>
        <div className="text-left max-w-xl mx-auto mb-6 rounded-2xl border border-blue-100 bg-blue-50 p-4 md:p-5">
          <p className="text-xs uppercase tracking-widest text-blue-700 font-semibold mb-1">Most resonating thought</p>
          <p className="text-sm text-foreground mb-2">
            <span className="font-semibold">{resonatingInsight.psychologist}:</span> {resonatingInsight.thought}
          </p>
          <p className="text-sm text-muted-foreground">{resonatingInsight.guidance}</p>
        </div>
        {draft.intensityBefore !== draft.intensityAfter && (
          <div className="inline-flex items-center gap-3 px-5 py-3 rounded-2xl bg-blue-50 border border-blue-100 mb-6">
            <span className="text-sm text-foreground">Intensity shifted</span>
            <span className="font-semibold text-blue-700">
              {draft.intensityBefore} → {draft.intensityAfter}
            </span>
          </div>
        )}
        <div className="flex items-center justify-center gap-3">
          <Button onClick={reset} size="lg" className="gap-2">
            <RotateCw className="w-4 h-4" /> Start another
          </Button>
        </div>
        <div className="mt-6 text-left max-w-xl mx-auto">
          <p className="text-xs uppercase tracking-widest text-muted-foreground font-semibold mb-2">Try these next</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <button onClick={() => navigate("/breathe")} className="text-sm px-3 py-2 rounded-xl bg-secondary/60 hover:bg-secondary border border-border text-foreground text-left">
              60-second breathing reset
            </button>
            <button onClick={() => navigate("/journey")} className="text-sm px-3 py-2 rounded-xl bg-secondary/60 hover:bg-secondary border border-border text-foreground text-left">
              Continue with Today's Journey
            </button>
            <button onClick={() => navigate("/dashboard")} className="text-sm px-3 py-2 rounded-xl bg-secondary/60 hover:bg-secondary border border-border text-foreground text-left">
              Open Today's Plan
            </button>
            <button onClick={() => navigate("/wellness")} className="text-sm px-3 py-2 rounded-xl bg-secondary/60 hover:bg-secondary border border-border text-foreground text-left">
              Do a quick wellness check
            </button>
          </div>
        </div>
        {records.length > 0 && <PreviousRecords records={records} onDelete={handleDelete} />}
      </Card>
    );
  }

  return (
    <>
      <Card className="border-0 shadow-xl bg-white p-6 md:p-8">
        {/* Progress */}
        <div className="mb-6">
          <div className="flex justify-between items-center mb-2 text-xs">
            <span className="font-semibold text-primary uppercase tracking-widest">Step {step + 1} of {STEPS.length}</span>
            <span className="text-muted-foreground">{Math.round(progress)}%</span>
          </div>
          <div className="h-1.5 bg-secondary rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-primary"
              initial={false}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.4 }}
            />
          </div>
        </div>

        <AnimatePresence mode="wait">
          {step < STEPS.length && cur && (
            <motion.div
              key={step}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
            >
              <h3 className="text-2xl font-display font-medium mb-2 text-foreground">{cur.title}</h3>
              <p className="text-sm text-muted-foreground mb-5 leading-relaxed">{cur.hint}</p>

              {cur.key === "emotion" ? (
                <div className="space-y-5">
                  <Input
                    value={draft.emotion}
                    onChange={(e) => set("emotion", e.target.value)}
                    placeholder={cur.placeholder}
                    className="h-12 text-base"
                  />
                  <div>
                    <div className="flex items-center justify-between text-sm mb-2">
                      <span className="font-medium text-foreground">Intensity</span>
                      <span className="font-semibold text-primary">{draft.intensityBefore} / 10</span>
                    </div>
                    <input
                      type="range"
                      min={1}
                      max={10}
                      value={draft.intensityBefore}
                      onChange={(e) => set("intensityBefore", Number(e.target.value))}
                      className="w-full accent-primary"
                    />
                    <div className="flex justify-between text-[10px] text-muted-foreground mt-1">
                      <span>Mild</span><span>Overwhelming</span>
                    </div>
                  </div>
                </div>
              ) : (
                <Textarea
                  value={value}
                  onChange={(e) => set(cur.key as any, e.target.value)}
                  placeholder={cur.placeholder}
                  className="min-h-[140px] text-base leading-relaxed"
                />
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Navigation */}
        {step < STEPS.length && (
          <div className="flex items-center justify-between mt-7">
            <Button
              variant="ghost"
              onClick={() => setStep(Math.max(0, step - 1))}
              disabled={step === 0}
              className="gap-1"
            >
              <ChevronLeft className="w-4 h-4" /> Back
            </Button>
            {step < STEPS.length - 1 ? (
              <Button onClick={() => setStep(step + 1)} disabled={!canNext} className="gap-1">
                Next <ChevronRight className="w-4 h-4" />
              </Button>
            ) : (
              <Button onClick={() => setStep(STEPS.length)} disabled={!canNext} className="gap-1">
                Almost done <ChevronRight className="w-4 h-4" />
              </Button>
            )}
          </div>
        )}

        {/* Final intensity step */}
        {step === STEPS.length && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="mt-6 pt-6 border-t border-border"
          >
            <h4 className="text-lg font-display font-medium mb-2">How strong is the feeling now?</h4>
            <p className="text-sm text-muted-foreground mb-4">
              After looking at the evidence and finding a balanced thought — has anything shifted, even a little?
            </p>
            <div className="flex items-center justify-between text-sm mb-2">
              <span className="font-medium">Intensity now</span>
              <span className="font-semibold text-primary">{draft.intensityAfter} / 10</span>
            </div>
            <input
              type="range"
              min={1}
              max={10}
              value={draft.intensityAfter}
              onChange={(e) => set("intensityAfter", Number(e.target.value))}
              className="w-full accent-primary"
            />
            <Button onClick={handleSave} size="lg" className="w-full mt-6 gap-2">
              <CheckCircle2 className="w-4 h-4" /> Save this reflection
            </Button>
          </motion.div>
        )}
      </Card>

      {records.length > 0 && <PreviousRecords records={records} onDelete={handleDelete} />}
    </>
  );
}

function PreviousRecords({ records, onDelete }: { records: Record[]; onDelete: (id: number) => void }) {
  return (
    <Card className="border-0 shadow-md bg-white p-6 md:p-7 mt-6 text-left">
      <h4 className="font-display font-medium text-lg mb-4">Your past reflections ({records.length})</h4>
      <div className="space-y-3 max-h-[420px] overflow-y-auto pr-1">
        {[...records].reverse().map((r) => (
          <div key={r.id} className="p-4 rounded-xl bg-secondary/40 border border-secondary">
            <div className="flex justify-between items-start mb-2">
              <div>
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                  {new Date(r.date).toLocaleDateString([], { month: "short", day: "numeric" })} · {r.emotion || "Untitled"}
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Intensity: <span className="text-blue-700 font-semibold">{r.intensityBefore} → {r.intensityAfter}</span>
                </p>
              </div>
              <button onClick={() => onDelete(r.id)} className="text-muted-foreground hover:text-destructive">
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
            {r.situation && <p className="text-sm text-foreground mb-1.5"><span className="font-medium">Situation:</span> {r.situation}</p>}
            {r.thought && <p className="text-sm text-muted-foreground mb-1.5"><span className="font-medium">Thought:</span> {r.thought}</p>}
            {r.balanced && <p className="text-sm text-blue-700 italic"><span className="font-medium not-italic text-foreground">Balanced:</span> {r.balanced}</p>}
          </div>
        ))}
      </div>
    </Card>
  );
}

// ----------- JOURNAL FLOW -----------
function JournalFlow() {
  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [promptIdx, setPromptIdx] = useState(0);
  const [body, setBody] = useState("");
  const [justSaved, setJustSaved] = useState(false);

  useEffect(() => {
    setEntries(loadJournal());
    // pick prompt deterministically by day so it feels like "today's prompt"
    const seed = new Date().getDate() + new Date().getMonth();
    setPromptIdx(seed % PROMPTS.length);
  }, []);

  const dailyPrompt = useMemo(() => PROMPTS[promptIdx], [promptIdx]);

  const newPrompt = () => {
    let next = promptIdx;
    while (next === promptIdx) next = Math.floor(Math.random() * PROMPTS.length);
    setPromptIdx(next);
  };

  const handleSave = () => {
    if (!body.trim()) return;
    const entry: JournalEntry = { id: Date.now(), date: todayKey(), prompt: dailyPrompt, body: body.trim() };
    const next = [...entries, entry];
    setEntries(next);
    saveJournal(next);
    setBody("");
    setJustSaved(true);
    setTimeout(() => setJustSaved(false), 2200);
  };

  const handleDelete = (id: number) => {
    const next = entries.filter((e) => e.id !== id);
    setEntries(next);
    saveJournal(next);
  };

  return (
    <>
      <Card className="border-0 shadow-xl bg-white p-6 md:p-8">
        <div className="flex items-start gap-3 mb-5">
          <div className="w-10 h-10 rounded-2xl bg-blue-100 flex items-center justify-center flex-shrink-0">
            <FileText className="w-5 h-5 text-blue-600" />
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-primary mb-1">Today's prompt</p>
            <h3 className="text-xl md:text-2xl font-display font-medium text-foreground leading-snug">{dailyPrompt}</h3>
          </div>
        </div>

        <Textarea
          value={body}
          onChange={(e) => setBody(e.target.value)}
          placeholder="Write freely — no one will read this but you. There's no right length, no perfect words. Just begin."
          className="min-h-[220px] text-base leading-relaxed"
        />

        <div className="flex items-center justify-between mt-5 flex-wrap gap-3">
          <Button variant="ghost" onClick={newPrompt} className="gap-2 text-muted-foreground hover:text-foreground">
            <RotateCw className="w-4 h-4" /> Try another prompt
          </Button>
          <div className="flex items-center gap-3">
            <AnimatePresence>
              {justSaved && (
                <motion.span
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0 }}
                  className="text-sm text-blue-700 font-medium flex items-center gap-1.5"
                >
                  <Sparkles className="w-4 h-4" /> Saved.
                </motion.span>
              )}
            </AnimatePresence>
            <Button onClick={handleSave} disabled={!body.trim()} className="gap-2">
              <Heart className="w-4 h-4" /> Save entry
            </Button>
          </div>
        </div>
      </Card>

      {entries.length > 0 && (
        <Card className="border-0 shadow-md bg-white p-6 md:p-7 mt-6">
          <h4 className="font-display font-medium text-lg mb-4">Your journal ({entries.length})</h4>
          <div className="space-y-3 max-h-[480px] overflow-y-auto pr-1">
            {[...entries].reverse().map((e) => (
              <div key={e.id} className="p-4 rounded-xl bg-secondary/40 border border-secondary">
                <div className="flex justify-between items-start mb-2 gap-2">
                  <div>
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                      {new Date(e.date).toLocaleDateString([], { weekday: "short", month: "short", day: "numeric" })}
                    </p>
                    <p className="text-sm font-medium text-blue-700 mt-1 italic">"{e.prompt}"</p>
                  </div>
                  <button onClick={() => handleDelete(e.id)} className="text-muted-foreground hover:text-destructive flex-shrink-0">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
                <p className="text-sm text-foreground whitespace-pre-wrap leading-relaxed">{e.body}</p>
              </div>
            ))}
          </div>
        </Card>
      )}
    </>
  );
}
