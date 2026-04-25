import { useState } from "react";
import { useLocation } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { RefreshCw, Sparkles, Quote as QuoteIcon, Apple, Wind, LayoutDashboard, Brain, Sun, ArrowRight } from "lucide-react";

// Pools tailored to score band — gentle for high-stress, energising for healthy
const EXERCISE_POOLS = {
  high: [
    { title: "Legs-up-the-wall, 5 minutes", desc: "Lie down, scoot your hips close to a wall, rest your legs straight up. Eyes closed. Slow exhales. The most underrated nervous-system reset there is." },
    { title: "10-minute slow walk", desc: "No phone, no podcast. Just notice your feet meeting the ground. Outside if you can. This counts as exercise on hard days." },
    { title: "Gentle stretch sequence", desc: "5 cat-cows, 5 child's poses, 30 seconds of neck rolls. Two minutes total — a kind start." },
  ],
  moderate: [
    { title: "5-minute desk reset", desc: "Roll your shoulders back 10 times. Stretch each side of your neck for 20 seconds. Stand and reach overhead with a slow inhale-exhale." },
    { title: "20-minute brisk walk", desc: "Aim for a pace where you can talk but not sing. Your mood at 7pm will thank you." },
    { title: "Mobility 7", desc: "Neck rolls, shoulder circles, spinal twists, hip openers, ankle rolls — 1 minute each." },
  ],
  healthy: [
    { title: "Bodyweight 4×4", desc: "10 squats, 10 push-ups (knees fine), 10 lunges per leg, 30 seconds plank. Repeat 4 rounds with 30s rest. Builds strength, lifts mood." },
    { title: "30-minute brisk walk or jog", desc: "Aim for that conversational-but-not-singing pace. Your evening self will be calmer for it." },
    { title: "Yoga + strength combo", desc: "10 minutes of yoga flow + 3 sets of 10 squats and 8 push-ups. Energising and grounding at once." },
  ],
};

const QUOTE_POOLS = {
  high: [
    { text: "Almost everything will work again if you unplug it for a few minutes — including you.", who: "Anne Lamott" },
    { text: "Rest is not idleness. Rest is the soil where your next chapter grows.", who: "Unknown" },
    { text: "You are doing the best you can with what you have right now. That is enough.", who: "Unknown" },
  ],
  moderate: [
    { text: "You don't have to be perfect to begin. You just have to begin.", who: "Unknown" },
    { text: "Be patient with yourself. You're growing in a world that often forgets to.", who: "Unknown" },
    { text: "What you seek is seeking you.", who: "Rumi" },
  ],
  healthy: [
    { text: "The cure for anything is salt water — sweat, tears, or the sea.", who: "Isak Dinesen" },
    { text: "Out of suffering have emerged the strongest souls.", who: "Khalil Gibran" },
    { text: "Storms make trees take deeper roots.", who: "Dolly Parton" },
  ],
};

const MEAL_POOLS = {
  high: [
    "Warm dal with rice and a spoon of ghee — humble, deeply nourishing, kind to a tired body.",
    "A simple vegetable soup with a slice of buttered sourdough — comfort in a bowl.",
    "Banana with peanut butter on toast + a glass of milk — easy, balanced, no decision-making required.",
  ],
  moderate: [
    "Greek yogurt with berries, walnuts and a drizzle of honey — slow energy that won't crash by 11am.",
    "Stir-fry tofu or chicken with broccoli and brown rice — magnesium for stress, protein for steady mood.",
    "Lentil soup with a wholegrain roll — protein-rich, gentle, satisfying.",
  ],
  healthy: [
    "Salmon (or chickpeas) with roasted sweet potato and greens — omega-3s help your brain breathe easier.",
    "A grain bowl: quinoa + roasted vegetables + tahini drizzle + seeds. Balanced macros, plenty of colour.",
    "Eggs on sourdough with smashed avocado, chilli flakes, and a side of greens — fuel for an active day.",
  ],
};

const pickByDay = <T,>(pool: T[]): T => {
  const d = new Date();
  return pool[(d.getDate() + d.getMonth()) % pool.length];
};

const QUESTIONS = [
  {
    id: 1,
    text: "How was your sleep quality last night?",
    emoji: "🌙",
    options: [
      { label: "Poor", score: 0, emoji: "😴", desc: "Barely slept / restless", color: "from-rose-500 to-red-400", lightBg: "bg-rose-50 hover:bg-rose-100 border-rose-200 hover:border-rose-400" },
      { label: "Fair", score: 25, emoji: "😐", desc: "Some interruptions", color: "from-amber-500 to-orange-400", lightBg: "bg-amber-50 hover:bg-amber-100 border-amber-200 hover:border-amber-400" },
      { label: "Good", score: 50, emoji: "😊", desc: "Mostly restful", color: "from-teal-500 to-cyan-400", lightBg: "bg-teal-50 hover:bg-teal-100 border-teal-200 hover:border-teal-400" },
      { label: "Excellent", score: 100, emoji: "🌟", desc: "Deep, refreshing sleep", color: "from-blue-500 to-sky-400", lightBg: "bg-blue-50 hover:bg-blue-100 border-blue-200 hover:border-blue-400" },
    ],
  },
  {
    id: 2,
    text: "How much screen time do you have outside of work?",
    emoji: "📱",
    options: [
      { label: "More than 6h", score: 10, emoji: "📱", desc: "Heavy screen exposure", color: "from-rose-500 to-red-400", lightBg: "bg-rose-50 hover:bg-rose-100 border-rose-200 hover:border-rose-400" },
      { label: "4–6 hours", score: 40, emoji: "📺", desc: "Quite a bit of screens", color: "from-amber-500 to-orange-400", lightBg: "bg-amber-50 hover:bg-amber-100 border-amber-200 hover:border-amber-400" },
      { label: "2–4 hours", score: 75, emoji: "💻", desc: "Moderate usage", color: "from-teal-500 to-cyan-400", lightBg: "bg-teal-50 hover:bg-teal-100 border-teal-200 hover:border-teal-400" },
      { label: "Less than 2h", score: 100, emoji: "🌿", desc: "Minimal screen time", color: "from-blue-500 to-sky-400", lightBg: "bg-blue-50 hover:bg-blue-100 border-blue-200 hover:border-blue-400" },
    ],
  },
  {
    id: 3,
    text: "How often did you exercise this week?",
    emoji: "🏃",
    options: [
      { label: "None", score: 0, emoji: "🛋️", desc: "No physical activity", color: "from-rose-500 to-red-400", lightBg: "bg-rose-50 hover:bg-rose-100 border-rose-200 hover:border-rose-400" },
      { label: "1–2 days", score: 30, emoji: "🚶", desc: "Light movement", color: "from-amber-500 to-orange-400", lightBg: "bg-amber-50 hover:bg-amber-100 border-amber-200 hover:border-amber-400" },
      { label: "3–4 days", score: 70, emoji: "🏃", desc: "Regular exercise", color: "from-teal-500 to-cyan-400", lightBg: "bg-teal-50 hover:bg-teal-100 border-teal-200 hover:border-teal-400" },
      { label: "Daily", score: 100, emoji: "💪", desc: "Active every day", color: "from-blue-500 to-sky-400", lightBg: "bg-blue-50 hover:bg-blue-100 border-blue-200 hover:border-blue-400" },
    ],
  },
  {
    id: 4,
    text: "How would you rate your stress level today?",
    emoji: "⚡",
    options: [
      { label: "Very High", score: 0, emoji: "🔥", desc: "Overwhelmed / burned out", color: "from-rose-500 to-red-400", lightBg: "bg-rose-50 hover:bg-rose-100 border-rose-200 hover:border-rose-400" },
      { label: "High", score: 25, emoji: "⚡", desc: "Under significant pressure", color: "from-amber-500 to-orange-400", lightBg: "bg-amber-50 hover:bg-amber-100 border-amber-200 hover:border-amber-400" },
      { label: "Moderate", score: 60, emoji: "🌤", desc: "Some tension, manageable", color: "from-teal-500 to-cyan-400", lightBg: "bg-teal-50 hover:bg-teal-100 border-teal-200 hover:border-teal-400" },
      { label: "Low", score: 100, emoji: "🌈", desc: "Calm and at ease", color: "from-blue-500 to-sky-400", lightBg: "bg-blue-50 hover:bg-blue-100 border-blue-200 hover:border-blue-400" },
    ],
  },
  {
    id: 5,
    text: "How much meaningful social interaction have you had today?",
    emoji: "🤝",
    options: [
      { label: "None", score: 0, emoji: "🔒", desc: "Completely isolated", color: "from-rose-500 to-red-400", lightBg: "bg-rose-50 hover:bg-rose-100 border-rose-200 hover:border-rose-400" },
      { label: "Brief", score: 25, emoji: "💬", desc: "Just a quick exchange", color: "from-amber-500 to-orange-400", lightBg: "bg-amber-50 hover:bg-amber-100 border-amber-200 hover:border-amber-400" },
      { label: "Moderate", score: 65, emoji: "👥", desc: "Some quality connection", color: "from-teal-500 to-cyan-400", lightBg: "bg-teal-50 hover:bg-teal-100 border-teal-200 hover:border-teal-400" },
      { label: "Active", score: 100, emoji: "🤝", desc: "Rich social engagement", color: "from-blue-500 to-sky-400", lightBg: "bg-blue-50 hover:bg-blue-100 border-blue-200 hover:border-blue-400" },
    ],
  },
];

export function WellnessCheck() {
  const [, navigate] = useLocation();
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<number[]>([]);
  const [selected, setSelected] = useState<number | null>(null);

  const handleAnswer = (score: number, idx: number) => {
    setSelected(idx);
    const newAnswers = [...answers, score];
    setAnswers(newAnswers);
    setTimeout(() => {
      setSelected(null);
      setStep(step + 1);
    }, 420);
  };

  const reset = () => {
    setStep(0);
    setAnswers([]);
    setSelected(null);
  };

  const calculateAverage = () => {
    if (answers.length === 0) return 0;
    return Math.round(answers.reduce((a, b) => a + b, 0) / answers.length);
  };

  const getResultContent = (score: number) => {
    if (score >= 70) {
      return {
        badge: "🌟 Healthy Wellness",
        color: "text-blue-700",
        bg: "from-blue-50 to-teal-50",
        border: "border-blue-200",
        barColor: "bg-blue-500",
        message: "You're thriving! Keep nurturing these positive habits.",
        plan: [
          { time: "Morning (6:30–9:00 AM)", icon: "🌅", text: "Wake up at 6:30 AM. Start with 5 minutes of gratitude journaling. Have a light breakfast — oatmeal with berries and green tea. Do 15 minutes of light stretching." },
          { time: "Midday (12:00–2:00 PM)", icon: "☀️", text: "Lunch: opt for a balanced meal — grilled chicken or tofu with salad and whole grains. Avoid fried or processed foods. Take a 10-minute walk after lunch." },
          { time: "Afternoon (3:00–5:00 PM)", icon: "🍃", text: "Take a 5-minute mindful breathing break. Hydrate well — aim for 8 glasses of water today. Limit screen time to focused tasks only." },
          { time: "Evening (6:00–8:00 PM)", icon: "🌇", text: "Go for a 30-minute evening walk or light jog. Try meditation for 10 minutes before dinner. Have a light dinner — avoid heavy carbs after 7 PM." },
          { time: "Night (9:00–10:30 PM)", icon: "🌙", text: "Wind down with reading or soft music. Avoid screens 1 hour before sleep. Aim for 7–8 hours of sleep." },
        ]
      };
    }
    if (score >= 40) {
      return {
        badge: "⚡ Moderate Stress",
        color: "text-amber-700",
        bg: "from-amber-50 to-orange-50",
        border: "border-amber-200",
        barColor: "bg-amber-500",
        message: "You're carrying some tension. Let's introduce some grounding routines.",
        plan: [
          { time: "Morning (6:30–9:00 AM)", icon: "🌅", text: "Wake up at 6:30 AM. Drink a glass of warm lemon water. Have a nourishing breakfast — eggs, avocado toast, or yogurt. Avoid skipping breakfast." },
          { time: "Midday (12:00–2:00 PM)", icon: "☀️", text: "Lunch: Avoid processed, oily, or sugary foods. Choose soups, salads, or steamed vegetables with lean protein. Step outside for 10–15 minutes of fresh air." },
          { time: "Afternoon (3:00–5:00 PM)", icon: "🍃", text: "Take regular breaks every 45 minutes. Do a 2-minute breathing exercise to reset your stress. Limit caffeine after 2 PM." },
          { time: "Evening (6:00–8:00 PM)", icon: "🌇", text: "30-minute walk or yoga session. Try journaling — write 3 things that went well today. Eat a light, warm dinner — avoid spicy or heavy meals." },
          { time: "Night (9:00–10:30 PM)", icon: "🌙", text: "Limit phone/social media use. Practice 5-minute body scan meditation. Sleep by 10:30 PM for recovery." },
        ]
      };
    }
    return {
      badge: "🌧 High Stress",
      color: "text-rose-700",
      bg: "from-rose-50 to-pink-50",
      border: "border-rose-200",
      barColor: "bg-rose-500",
      message: "It seems like a tough time. Prioritize deep rest and gentle self-care today.",
      plan: [
        { time: "Morning (7:00–9:00 AM)", icon: "🌅", text: "Allow yourself to wake up gently — no alarm pressure if possible. Start with 3 deep breaths before getting out of bed. Have a comforting breakfast — warm oatmeal or herbal tea with toast. Avoid rushing." },
        { time: "Midday (12:00–2:00 PM)", icon: "☀️", text: "Avoid skipping meals — eat something nourishing even if appetite is low. Step away from your desk completely during lunch. Avoid caffeine and alcohol." },
        { time: "Afternoon (3:00–5:00 PM)", icon: "🍃", text: "This is your priority breathing time — do a 5-minute guided breathing session. Reduce workload if possible. Reach out to someone you trust for a brief chat." },
        { time: "Evening (6:00–8:00 PM)", icon: "🌇", text: "Take a slow 20-minute walk — no earphones, just notice nature. Eat a warm, simple dinner — dal, soup, or rice with vegetables. Limit decision-making." },
        { time: "Night (8:30–10:00 PM)", icon: "🌙", text: "Unplug all devices by 8:30 PM. Take a warm bath or do gentle stretching. Write down one worry and one positive thought. Sleep by 10 PM — your body needs recovery." },
      ]
    };
  };

  const q = QUESTIONS[step];

  return (
    <section id="wellness" className="py-24 relative">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-14">
          <h2 className="text-4xl font-display font-medium mb-4">Daily Wellness Check</h2>
          <p className="text-muted-foreground text-lg max-w-xl mx-auto">
            Take a moment to reflect. We'll craft a personalised daily plan just for you.
          </p>
        </div>

        <AnimatePresence mode="wait">
          {step < 5 ? (
            <motion.div
              key={`q-${step}`}
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -30 }}
              transition={{ duration: 0.35 }}
            >
              <Card className="border-0 shadow-xl shadow-black/5 bg-white overflow-hidden">
                <CardContent className="p-8 md:p-10">

                  {/* Question header */}
                  <div className="mb-8">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-10 h-10 rounded-2xl bg-primary/10 flex items-center justify-center text-xl">
                        {q.emoji}
                      </div>
                      <span className="text-xs font-semibold text-primary uppercase tracking-widest">
                        Question {step + 1} of 5
                      </span>
                    </div>
                    <h3 className="text-2xl md:text-3xl font-display font-medium text-foreground leading-snug">
                      {q.text}
                    </h3>
                  </div>

                  {/* Options grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {q.options.map((opt, i) => (
                      <motion.button
                        key={i}
                        onClick={() => handleAnswer(opt.score, i)}
                        disabled={selected !== null}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        className={`relative p-5 text-left rounded-2xl border-2 transition-all duration-250 overflow-hidden group
                          ${selected === i
                            ? `bg-gradient-to-br ${opt.color} border-transparent shadow-lg`
                            : `${opt.lightBg} border-2 shadow-sm`
                          }`}
                      >
                        {/* Shimmer on selected */}
                        {selected === i && (
                          <motion.div
                            initial={{ x: "-100%", opacity: 0.5 }}
                            animate={{ x: "200%", opacity: 0 }}
                            transition={{ duration: 0.6 }}
                            className="absolute inset-0 bg-white/30 skew-x-12 pointer-events-none"
                          />
                        )}

                        <div className="flex items-start gap-3">
                          <span className={`text-2xl flex-shrink-0 transition-transform duration-200 ${selected === i ? "" : "group-hover:scale-110"}`}>
                            {opt.emoji}
                          </span>
                          <div>
                            <p className={`font-semibold text-base leading-tight mb-1 transition-colors ${selected === i ? "text-white" : "text-foreground"}`}>
                              {opt.label}
                            </p>
                            <p className={`text-xs leading-relaxed transition-colors ${selected === i ? "text-white/80" : "text-muted-foreground"}`}>
                              {opt.desc}
                            </p>
                          </div>
                        </div>

                        {/* Score pill */}
                        <div className={`absolute top-3 right-3 text-xs px-2 py-0.5 rounded-full font-medium transition-all ${
                          selected === i
                            ? "bg-white/20 text-white"
                            : "bg-white/60 text-muted-foreground"
                        }`}>
                          {opt.score}%
                        </div>
                      </motion.button>
                    ))}
                  </div>

                  {/* Progress */}
                  <div className="mt-8">
                    <div className="flex gap-1.5">
                      {[0, 1, 2, 3, 4].map((i) => (
                        <div
                          key={i}
                          className={`h-1.5 flex-1 rounded-full transition-all duration-500 ${
                            i < step ? "bg-primary" : i === step ? "bg-primary/50" : "bg-secondary"
                          }`}
                        />
                      ))}
                    </div>
                    <p className="text-xs text-muted-foreground mt-2 text-right">{step} of 5 answered</p>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ) : (
            <motion.div
              key="results"
              initial={{ opacity: 0, scale: 0.97 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.45 }}
            >
              {(() => {
                const score = calculateAverage();
                const result = getResultContent(score);
                return (
                  <Card className="border-0 shadow-xl shadow-black/5 overflow-hidden bg-white">

                    {/* Score header */}
                    <div className={`p-8 md:p-10 text-center bg-gradient-to-br ${result.bg} border-b ${result.border}`}>
                      <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/70 backdrop-blur-sm border ${result.border} mb-6 shadow-sm`}>
                        <span className={`font-semibold text-sm tracking-wide ${result.color}`}>{result.badge}</span>
                      </div>
                      <div className="mb-2">
                        <span className="text-6xl font-display font-semibold text-foreground">{score}</span>
                        <span className="text-2xl text-muted-foreground font-display">/100</span>
                      </div>
                      {/* Score bar */}
                      <div className="w-48 mx-auto h-2 bg-white/60 rounded-full overflow-hidden mt-3 mb-4">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${score}%` }}
                          transition={{ duration: 0.8, delay: 0.2 }}
                          className={`h-full rounded-full ${result.barColor}`}
                        />
                      </div>
                      <p className={`text-base font-medium ${result.color} max-w-lg mx-auto`}>{result.message}</p>
                    </div>

                    <CardContent className="p-8 md:p-10">
                      <h4 className="text-2xl font-display font-medium mb-8 text-center text-foreground">
                        Your Personalised Daily Plan
                      </h4>

                      <div className="space-y-5">
                        {result.plan.map((item, i) => (
                          <motion.div
                            key={i}
                            initial={{ opacity: 0, x: -16 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.1 * i, duration: 0.4 }}
                            className="flex gap-4 p-5 rounded-2xl bg-secondary/30 border border-secondary hover:bg-secondary/50 transition-colors"
                          >
                            <div className="text-2xl flex-shrink-0">{item.icon}</div>
                            <div>
                              <h5 className="font-semibold text-foreground text-sm mb-1.5">{item.time}</h5>
                              <p className="text-muted-foreground text-sm leading-relaxed">{item.text}</p>
                            </div>
                          </motion.div>
                        ))}
                      </div>

                      {/* MOMENTUM SECTION — exercise, quote, meal */}
                      {(() => {
                        const band = score >= 70 ? "healthy" : score >= 40 ? "moderate" : "high";
                        const exercise = pickByDay(EXERCISE_POOLS[band]);
                        const quote = pickByDay(QUOTE_POOLS[band]);
                        const meal = pickByDay(MEAL_POOLS[band]);
                        return (
                          <div className="mt-10 pt-10 border-t border-secondary">
                            <div className="text-center mb-6">
                              <p className="text-xs font-bold uppercase tracking-[0.25em] text-primary mb-1.5">Now keep the momentum</p>
                              <h4 className="text-2xl font-display font-medium text-foreground">A small ritual for today</h4>
                              <p className="text-sm text-muted-foreground mt-1.5 max-w-md mx-auto">
                                One movement, one line, one meal — chosen for where you are right now.
                              </p>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                              {/* Exercise */}
                              <div className="p-5 rounded-2xl bg-gradient-to-br from-teal-50 to-blue-50 border border-teal-100">
                                <div className="flex items-center gap-2 mb-2">
                                  <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-teal-400 to-blue-500 flex items-center justify-center">
                                    <Sparkles className="w-4 h-4 text-white" />
                                  </div>
                                  <p className="text-[10px] font-bold uppercase tracking-widest text-teal-700">Move a little</p>
                                </div>
                                <h5 className="font-display text-base font-medium text-foreground mb-1.5">{exercise.title}</h5>
                                <p className="text-xs text-muted-foreground leading-relaxed">{exercise.desc}</p>
                              </div>
                              {/* Quote */}
                              <div className="p-5 rounded-2xl bg-gradient-to-br from-purple-50 to-violet-50 border border-purple-100">
                                <div className="flex items-center gap-2 mb-2">
                                  <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-purple-400 to-violet-500 flex items-center justify-center">
                                    <QuoteIcon className="w-4 h-4 text-white" />
                                  </div>
                                  <p className="text-[10px] font-bold uppercase tracking-widest text-purple-700">A line for today</p>
                                </div>
                                <p className="text-sm font-display italic text-foreground leading-snug mb-2">"{quote.text}"</p>
                                <p className="text-[11px] text-muted-foreground">— {quote.who}</p>
                              </div>
                              {/* Meal */}
                              <div className="p-5 rounded-2xl bg-gradient-to-br from-rose-50 to-orange-50 border border-rose-100">
                                <div className="flex items-center gap-2 mb-2">
                                  <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-rose-400 to-red-500 flex items-center justify-center">
                                    <Apple className="w-4 h-4 text-white" />
                                  </div>
                                  <p className="text-[10px] font-bold uppercase tracking-widest text-rose-700">Nourish</p>
                                </div>
                                <h5 className="font-display text-base font-medium text-foreground mb-1.5">Today's meal idea</h5>
                                <p className="text-xs text-muted-foreground leading-relaxed">{meal}</p>
                              </div>
                            </div>

                            {/* Cross-feature actions */}
                            <div className="mt-8">
                              <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-3 text-center">Carry it forward</p>
                              <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5">
                                <FeatureChip icon={Sun}     label="Today's Journey"   sub="Full ritual" tint="from-blue-500 to-indigo-600"  onClick={() => navigate("/journey")} />
                                <FeatureChip icon={Wind}    label="Breathe"           sub="60 seconds"  tint="from-sky-400 to-cyan-600"     onClick={() => navigate("/breathe")} />
                                <FeatureChip icon={LayoutDashboard} label="Today's Plan"  sub="Meals · sleep · goal" tint="from-blue-500 to-blue-700" onClick={() => navigate("/dashboard")} />
                                <FeatureChip icon={Brain}   label="Healing tools"    sub="CBT · Journal" tint="from-violet-400 to-blue-600" onClick={() => navigate("/healing")} />
                              </div>
                            </div>

                            <div className="mt-8 text-center">
                              <Button onClick={reset} variant="ghost" size="sm" className="gap-2 text-muted-foreground">
                                <RefreshCw className="w-3.5 h-3.5" /> Retake assessment
                              </Button>
                            </div>
                          </div>
                        );
                      })()}
                    </CardContent>
                  </Card>
                );
              })()}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </section>
  );
}

function FeatureChip({ icon: Icon, label, sub, tint, onClick }: {
  icon: React.ElementType; label: string; sub: string; tint: string; onClick: () => void;
}) {
  return (
    <motion.button
      onClick={onClick}
      whileHover={{ y: -2 }}
      whileTap={{ scale: 0.97 }}
      className="group flex items-center gap-3 p-3 rounded-xl bg-white border border-border hover:border-primary/40 hover:shadow-md transition-all text-left"
    >
      <div className={`w-9 h-9 rounded-lg bg-gradient-to-br ${tint} flex items-center justify-center flex-shrink-0 shadow-sm`}>
        <Icon className="w-4 h-4 text-white" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold text-foreground leading-tight truncate">{label}</p>
        <p className="text-[10px] text-muted-foreground">{sub}</p>
      </div>
      <ArrowRight className="w-3.5 h-3.5 text-muted-foreground group-hover:text-primary group-hover:translate-x-0.5 transition-all flex-shrink-0" />
    </motion.button>
  );
}
