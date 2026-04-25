import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Play, Square, Wind, Lightbulb, CheckCircle2 } from "lucide-react";

type EmotionType = "anxiety" | "anger" | "irritation" | "sadness";

const EMOTIONS: Record<
  EmotionType,
  {
    emoji: string;
    label: string;
    desc: string;
    pattern: { t: string; d: number }[];
    suggestions: string[];
  }
> = {
  anxiety: {
    emoji: "😰",
    label: "Anxiety",
    desc: "Box Breathing (4-4-4-4)",
    pattern: [
      { t: "Inhale", d: 4 },
      { t: "Hold", d: 4 },
      { t: "Exhale", d: 4 },
      { t: "Hold", d: 4 },
    ],
    suggestions: [
      "Place one hand on your chest and one on your belly — feel the rise and fall.",
      "Name 5 things you can see, 4 you can touch, 3 you can hear, 2 you can smell, 1 you can taste.",
      "Drink a glass of cool water slowly — small sips, full attention.",
      "Step outside for 2 minutes of fresh air, even if it's just by a window.",
      "Write down the worry on paper. Naming it shrinks it.",
      "Remind yourself: this feeling is temporary and will pass.",
    ],
  },
  anger: {
    emoji: "😠",
    label: "Anger",
    desc: "Extended Exhale (4-7-8)",
    pattern: [
      { t: "Inhale", d: 4 },
      { t: "Hold", d: 7 },
      { t: "Exhale", d: 8 },
    ],
    suggestions: [
      "Pause before responding — count slowly to 10 in your head.",
      "Unclench your jaw and drop your shoulders away from your ears.",
      "Splash cool water on your face or hold an ice cube for 30 seconds.",
      "Walk it off — even 5 minutes of brisk movement releases tension.",
      "Write what made you angry, then close the page. Don't send anything yet.",
      "Reframe: ask yourself, \"Will this matter in a week? In a year?\"",
    ],
  },
  irritation: {
    emoji: "😤",
    label: "Irritation",
    desc: "Equal Breathing (5-5)",
    pattern: [
      { t: "Inhale", d: 5 },
      { t: "Exhale", d: 5 },
    ],
    suggestions: [
      "Step away from the source for 5 minutes — change your physical location.",
      "Stretch your neck side-to-side and roll your shoulders backward.",
      "Have a small healthy snack — irritation often spikes when blood sugar dips.",
      "Put on noise-cancelling headphones or earplugs for a quiet reset.",
      "Tidy one small area near you — order outside helps order inside.",
      "Smile gently for 30 seconds. The body cues the mind to soften.",
    ],
  },
  sadness: {
    emoji: "😢",
    label: "Sadness",
    desc: "Deep Sighing (6-2-8)",
    pattern: [
      { t: "Inhale", d: 6 },
      { t: "Pause", d: 2 },
      { t: "Exhale", d: 8 },
    ],
    suggestions: [
      "Wrap yourself in something warm — a blanket, sweater, or warm drink.",
      "Reach out to one person you trust, even just a short message.",
      "Open a window and let in natural light for at least 10 minutes.",
      "Watch or read something gentle and familiar — comfort is healing.",
      "Move your body softly — a slow walk or stretching, no pressure.",
      "Be kind to yourself today. Sadness is data, not weakness.",
    ],
  },
};

export function Breathe() {
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [emotion, setEmotion] = useState<EmotionType | null>(null);

  const [timeLeft, setTimeLeft] = useState(120);
  const [isActive, setIsActive] = useState(false);
  const [instruction, setInstruction] = useState("Ready");
  const [scale, setScale] = useState(1);
  const [tipIndex, setTipIndex] = useState(0);

  // Breathing loop
  useEffect(() => {
    if (!isActive || !emotion) return;

    const pattern = EMOTIONS[emotion].pattern;
    let isRunning = true;
    let currentStepIndex = 0;

    const runCycle = () => {
      if (!isRunning) return;
      const s = pattern[currentStepIndex];
      setInstruction(s.t);
      if (s.t.includes("Inhale")) setScale(1.5);
      else if (s.t.includes("Exhale")) setScale(1);

      setTimeout(() => {
        if (!isRunning) return;
        currentStepIndex = (currentStepIndex + 1) % pattern.length;
        runCycle();
      }, s.d * 1000);
    };
    runCycle();

    return () => {
      isRunning = false;
    };
  }, [isActive, emotion]);

  // Rotate suggestion tip every 18 seconds during the session
  useEffect(() => {
    if (!isActive || !emotion) return;
    const list = EMOTIONS[emotion].suggestions;
    const interval = setInterval(() => {
      setTipIndex((i) => (i + 1) % list.length);
    }, 18000);
    return () => clearInterval(interval);
  }, [isActive, emotion]);

  // Countdown
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isActive && timeLeft > 0) {
      interval = setInterval(() => setTimeLeft((p) => p - 1), 1000);
    } else if (timeLeft === 0 && isActive) {
      endSession(true);
    }
    return () => clearInterval(interval);
  }, [isActive, timeLeft]);

  const startSession = () => {
    setStep(2);
    setTimeLeft(120);
    setTipIndex(0);
    setIsActive(true);
  };

  const endSession = (completed = false) => {
    setIsActive(false);
    setScale(1);
    if (completed) {
      setStep(3);
    } else {
      setStep(1);
      setEmotion(null);
    }
  };

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, "0")}`;
  };

  return (
    <section id="breathe" className="py-24 bg-secondary/30 relative">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-primary/10 mb-4">
            <Wind className="w-6 h-6 text-primary" />
          </div>
          <h2 className="text-4xl font-display font-medium mb-4">Mindful Breathing</h2>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            Take two minutes to recalibrate your nervous system with targeted breathing patterns and gentle on-screen suggestions.
          </p>
        </div>

        <Card className="min-h-[500px] flex flex-col justify-center border-0 shadow-xl bg-white relative overflow-hidden">
          <AnimatePresence mode="wait">

            {/* STEP 1: choose emotion */}
            {step === 1 && (
              <motion.div
                key="step1"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="p-8 md:p-12 w-full"
              >
                <h3 className="text-2xl font-display font-medium text-center mb-2">
                  What are you feeling right now?
                </h3>
                <p className="text-center text-muted-foreground mb-8">
                  Pick one — we'll match the breathing rhythm and suggestions to your state.
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-2xl mx-auto">
                  {(Object.keys(EMOTIONS) as EmotionType[]).map((key) => (
                    <button
                      key={key}
                      onClick={() => {
                        setEmotion(key);
                        setTimeout(() => startSession(), 250);
                      }}
                      className="flex flex-col items-center justify-center p-6 rounded-2xl border-2 border-border/50 hover:border-primary hover:bg-primary/5 transition-all group"
                    >
                      <span className="text-4xl mb-3 group-hover:scale-110 transition-transform">
                        {EMOTIONS[key].emoji}
                      </span>
                      <span className="font-semibold text-lg">{EMOTIONS[key].label}</span>
                      <span className="text-sm text-muted-foreground mt-1 text-center">
                        {EMOTIONS[key].desc}
                      </span>
                    </button>
                  ))}
                </div>
              </motion.div>
            )}

            {/* STEP 2: active session with rotating suggestion */}
            {step === 2 && emotion && (
              <motion.div
                key="step2"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="p-8 md:p-12 w-full flex flex-col items-center justify-center min-h-[500px]"
              >
                <div className="absolute top-6 right-6 flex items-center gap-3">
                  <div className="text-base font-medium font-mono text-muted-foreground bg-secondary/60 px-3.5 py-1.5 rounded-full">
                    {formatTime(timeLeft)}
                  </div>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => endSession(false)}
                    className="rounded-full w-10 h-10 border-destructive/20 text-destructive hover:bg-destructive/10"
                  >
                    <Square className="w-4 h-4 fill-current" />
                  </Button>
                </div>

                <div className="relative w-60 h-60 flex items-center justify-center mb-10">
                  <motion.div
                    className="absolute inset-0 rounded-full bg-primary/20 blur-md"
                    animate={{ scale }}
                    transition={{
                      duration:
                        EMOTIONS[emotion].pattern.find((p) => p.t.includes("Inhale") || p.t.includes("Exhale"))?.d || 4,
                      ease: "easeInOut",
                    }}
                  />
                  <motion.div
                    className="absolute inset-4 rounded-full bg-primary/40 blur-sm"
                    animate={{ scale }}
                    transition={{
                      duration:
                        EMOTIONS[emotion].pattern.find((p) => p.t.includes("Inhale") || p.t.includes("Exhale"))?.d || 4,
                      ease: "easeInOut",
                    }}
                  />
                  <motion.div
                    className="relative z-10 w-44 h-44 rounded-full bg-gradient-to-tr from-primary to-primary/80 shadow-2xl flex items-center justify-center"
                    animate={{ scale }}
                    transition={{
                      duration:
                        EMOTIONS[emotion].pattern.find((p) => p.t.includes("Inhale") || p.t.includes("Exhale"))?.d || 4,
                      ease: "easeInOut",
                    }}
                  >
                    <span className="text-2xl font-display font-medium text-white tracking-wider">
                      {instruction}
                    </span>
                  </motion.div>
                </div>

                {/* Rotating suggestion card */}
                <div className="w-full max-w-lg mb-6">
                  <AnimatePresence mode="wait">
                    <motion.div
                      key={tipIndex}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -8 }}
                      transition={{ duration: 0.4 }}
                      className="flex items-start gap-3 px-5 py-4 rounded-2xl bg-blue-50 border border-blue-100"
                    >
                      <Lightbulb className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                      <p className="text-sm text-foreground leading-relaxed">
                        {EMOTIONS[emotion].suggestions[tipIndex]}
                      </p>
                    </motion.div>
                  </AnimatePresence>
                </div>

                <div className="w-full max-w-md bg-secondary h-2 rounded-full overflow-hidden">
                  <motion.div
                    className="h-full bg-primary"
                    initial={{ width: "100%" }}
                    animate={{ width: `${(timeLeft / 120) * 100}%` }}
                    transition={{ duration: 1, ease: "linear" }}
                  />
                </div>
              </motion.div>
            )}

            {/* STEP 3: complete + full suggestion list */}
            {step === 3 && emotion && (
              <motion.div
                key="step3"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="p-8 md:p-12 w-full"
              >
                <div className="text-center mb-8">
                  <div className="w-20 h-20 mx-auto bg-blue-100 rounded-full flex items-center justify-center mb-5">
                    <CheckCircle2 className="w-10 h-10 text-blue-600" />
                  </div>
                  <h3 className="text-3xl font-display font-medium mb-2">Session Complete</h3>
                  <p className="text-base text-muted-foreground max-w-md mx-auto">
                    Notice how you feel now. Here are a few simple things you can try next to keep the calm going.
                  </p>
                </div>

                <div className="max-w-xl mx-auto space-y-2.5 mb-8">
                  {EMOTIONS[emotion].suggestions.map((tip, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.06 }}
                      className="flex items-start gap-3 p-3.5 rounded-xl bg-secondary/40 border border-secondary"
                    >
                      <span className="flex-shrink-0 w-6 h-6 rounded-full bg-primary/10 text-primary text-xs font-semibold flex items-center justify-center">
                        {i + 1}
                      </span>
                      <p className="text-sm text-foreground leading-relaxed">{tip}</p>
                    </motion.div>
                  ))}
                </div>

                <div className="text-center">
                  <Button
                    onClick={() => {
                      setStep(1);
                      setEmotion(null);
                    }}
                    size="lg"
                  >
                    <Play className="w-4 h-4 mr-2" /> Start Another Session
                  </Button>
                </div>
              </motion.div>
            )}

          </AnimatePresence>
        </Card>
      </div>
    </section>
  );
}
