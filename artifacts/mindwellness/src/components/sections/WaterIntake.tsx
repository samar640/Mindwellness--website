import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Droplets, RefreshCw } from "lucide-react";

const ACTIVITY_LEVELS = [
  { id: "sedentary", label: "Sedentary", emoji: "🛋️", desc: "Little or no exercise", multiplier: 0 },
  { id: "light", label: "Light", emoji: "🚶", desc: "1–2 days/week", multiplier: 0.35 },
  { id: "moderate", label: "Moderate", emoji: "🏃", desc: "3–5 days/week", multiplier: 0.6 },
  { id: "active", label: "Very Active", emoji: "💪", desc: "6–7 days/week", multiplier: 1.0 },
];

const CLIMATE_LEVELS = [
  { id: "cool", label: "Cool", emoji: "❄️", desc: "Cold / AC environment", bonus: 0 },
  { id: "normal", label: "Normal", emoji: "🌤", desc: "Temperate climate", bonus: 0.2 },
  { id: "hot", label: "Hot", emoji: "☀️", desc: "Hot / humid weather", bonus: 0.5 },
];

const TIPS = [
  { emoji: "🌅", tip: "Drink 1–2 glasses of water right after waking up to rehydrate." },
  { emoji: "🍋", tip: "Add lemon or cucumber to water for a refreshing flavour boost." },
  { emoji: "⏰", tip: "Set hourly reminders on your phone to sip water throughout the day." },
  { emoji: "🥤", tip: "Carry a marked water bottle so you can track your daily progress." },
  { emoji: "🥗", tip: "Eat water-rich foods like cucumber, watermelon, oranges, and celery." },
  { emoji: "☕", tip: "Every cup of coffee or tea dehydrates slightly — add an extra glass of water." },
];

export function WaterIntake() {
  const [weight, setWeight] = useState("");
  const [activity, setActivity] = useState("moderate");
  const [climate, setClimate] = useState("normal");
  const [result, setResult] = useState<{ litres: number; glasses: number } | null>(null);

  const calculate = () => {
    const kg = parseFloat(weight);
    if (!kg || kg <= 0 || kg > 300) return;
    const actLevel = ACTIVITY_LEVELS.find(a => a.id === activity)!;
    const clmLevel = CLIMATE_LEVELS.find(c => c.id === climate)!;
    const base = kg * 0.033;
    const total = base + actLevel.multiplier * 0.3 + clmLevel.bonus;
    const litres = Math.round(total * 10) / 10;
    const glasses = Math.round(litres / 0.25);
    setResult({ litres, glasses });
  };

  const reset = () => {
    setWeight("");
    setActivity("moderate");
    setClimate("normal");
    setResult(null);
  };

  const glassPercent = result ? Math.min(result.glasses / 12, 1) : 0;

  return (
    <section id="water" className="py-24 relative bg-gradient-to-br from-blue-50/60 via-cyan-50/40 to-sky-50/60">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* Header */}
        <div className="text-center mb-14">
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-blue-100 text-blue-700 text-sm font-semibold mb-5">
              <Droplets className="w-4 h-4" /> Hydration Tracker
            </span>
            <h2 className="text-4xl md:text-5xl font-display font-medium mb-4 text-foreground">
              Daily Water Intake
            </h2>
            <p className="text-muted-foreground text-lg max-w-xl mx-auto">
              Find out exactly how much water your body needs each day based on your weight, activity level, and climate.
            </p>
          </motion.div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">

          {/* Calculator card */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="lg:col-span-3 bg-white rounded-3xl shadow-xl border border-blue-100 overflow-hidden"
          >
            <div className="bg-gradient-to-r from-blue-500 to-cyan-500 px-6 py-4 flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center">
                <Droplets className="w-5 h-5 text-white" />
              </div>
              <div>
                <h3 className="text-white font-semibold text-base">Hydration Calculator</h3>
                <p className="text-white/70 text-xs">Personalised for your body</p>
              </div>
            </div>

            <div className="p-6 space-y-6">
              {/* Weight input */}
              <div>
                <label className="block text-sm font-semibold text-foreground mb-2">
                  Your body weight
                </label>
                <div className="relative">
                  <input
                    type="number"
                    value={weight}
                    onChange={e => setWeight(e.target.value)}
                    placeholder="e.g. 65"
                    min="1"
                    max="300"
                    className="w-full px-4 py-3 pr-14 rounded-xl border-2 border-blue-100 focus:border-blue-400 outline-none text-sm font-medium bg-blue-50/30 transition-colors placeholder:text-muted-foreground"
                  />
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm font-semibold text-blue-500">kg</span>
                </div>
              </div>

              {/* Activity level */}
              <div>
                <label className="block text-sm font-semibold text-foreground mb-3">Activity level</label>
                <div className="grid grid-cols-2 gap-2">
                  {ACTIVITY_LEVELS.map(lvl => (
                    <button
                      key={lvl.id}
                      onClick={() => setActivity(lvl.id)}
                      className={`p-3 rounded-xl text-left border-2 transition-all duration-200 ${
                        activity === lvl.id
                          ? "border-blue-400 bg-blue-50 shadow-sm"
                          : "border-transparent bg-secondary/40 hover:bg-secondary/70"
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <span className="text-lg">{lvl.emoji}</span>
                        <div>
                          <p className={`text-xs font-bold ${activity === lvl.id ? "text-blue-700" : "text-foreground"}`}>{lvl.label}</p>
                          <p className="text-xs text-muted-foreground">{lvl.desc}</p>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Climate */}
              <div>
                <label className="block text-sm font-semibold text-foreground mb-3">Climate / environment</label>
                <div className="grid grid-cols-3 gap-2">
                  {CLIMATE_LEVELS.map(c => (
                    <button
                      key={c.id}
                      onClick={() => setClimate(c.id)}
                      className={`p-3 rounded-xl border-2 transition-all duration-200 text-center ${
                        climate === c.id
                          ? "border-blue-400 bg-blue-50 shadow-sm"
                          : "border-transparent bg-secondary/40 hover:bg-secondary/70"
                      }`}
                    >
                      <div className="text-xl mb-1">{c.emoji}</div>
                      <p className={`text-xs font-bold ${climate === c.id ? "text-blue-700" : "text-foreground"}`}>{c.label}</p>
                      <p className="text-[10px] text-muted-foreground leading-tight mt-0.5">{c.desc}</p>
                    </button>
                  ))}
                </div>
              </div>

              {/* CTA */}
              <div className="flex gap-3">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={calculate}
                  disabled={!weight || parseFloat(weight) <= 0}
                  className="flex-1 py-3 rounded-xl bg-gradient-to-r from-blue-500 to-cyan-500 text-white font-semibold text-sm shadow-md hover:shadow-lg transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  Calculate My Intake
                </motion.button>
                {result && (
                  <button
                    onClick={reset}
                    className="px-4 py-3 rounded-xl border-2 border-blue-100 text-muted-foreground hover:text-foreground hover:border-blue-300 transition-colors"
                  >
                    <RefreshCw className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          </motion.div>

          {/* Result + tips */}
          <div className="lg:col-span-2 flex flex-col gap-5">

            {/* Result card */}
            <AnimatePresence mode="wait">
              {result ? (
                <motion.div
                  key="result"
                  initial={{ opacity: 0, scale: 0.95, y: 10 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ duration: 0.4, ease: [0.23, 1, 0.32, 1] }}
                  className="bg-gradient-to-br from-blue-500 to-cyan-600 rounded-3xl p-6 text-white shadow-xl"
                >
                  <p className="text-blue-100 text-sm font-medium mb-1">Your daily recommendation</p>
                  <div className="flex items-baseline gap-2 mb-1">
                    <span className="text-5xl font-display font-bold">{result.litres}</span>
                    <span className="text-2xl font-display text-blue-200">Litres</span>
                  </div>
                  <p className="text-blue-100 text-sm mb-5">≈ {result.glasses} glasses of 250ml</p>

                  {/* Progress bar */}
                  <div className="bg-white/20 rounded-full h-3 overflow-hidden mb-2">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${glassPercent * 100}%` }}
                      transition={{ duration: 0.8, delay: 0.2 }}
                      className="h-full rounded-full bg-white"
                    />
                  </div>
                  <p className="text-xs text-blue-200 mb-5">vs. average 2L daily goal</p>

                  {/* Glass emojis */}
                  <div className="flex flex-wrap gap-1">
                    {Array.from({ length: Math.min(result.glasses, 16) }).map((_, i) => (
                      <motion.span
                        key={i}
                        initial={{ opacity: 0, scale: 0 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: 0.3 + i * 0.04 }}
                        className="text-lg"
                      >
                        💧
                      </motion.span>
                    ))}
                    {result.glasses > 16 && (
                      <span className="text-xs text-blue-200 self-center ml-1">+{result.glasses - 16} more</span>
                    )}
                  </div>
                </motion.div>
              ) : (
                <motion.div
                  key="placeholder"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="bg-white rounded-3xl p-6 border-2 border-dashed border-blue-200 text-center shadow-sm"
                >
                  <div className="text-5xl mb-3">💧</div>
                  <p className="text-sm font-medium text-foreground mb-1">Enter your details</p>
                  <p className="text-xs text-muted-foreground">Your personalised water intake will appear here after calculating.</p>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Tips card */}
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.15 }}
              className="bg-white rounded-3xl p-5 shadow-md border border-blue-100 flex-1"
            >
              <h4 className="text-sm font-bold text-foreground mb-4 flex items-center gap-2">
                <Droplets className="w-4 h-4 text-blue-500" /> Hydration Tips
              </h4>
              <ul className="space-y-2.5">
                {TIPS.map((t, i) => (
                  <motion.li
                    key={i}
                    initial={{ opacity: 0, x: -8 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: i * 0.07 }}
                    className="flex items-start gap-2.5"
                  >
                    <span className="text-base flex-shrink-0 mt-0.5">{t.emoji}</span>
                    <p className="text-xs text-muted-foreground leading-relaxed">{t.tip}</p>
                  </motion.li>
                ))}
              </ul>
            </motion.div>
          </div>
        </div>
      </div>
    </section>
  );
}
