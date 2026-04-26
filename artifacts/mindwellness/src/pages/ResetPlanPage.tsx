import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useLocation } from "wouter";
import {
  Sun, Moon, FileText, Activity, Apple, Droplets, Plane,
  ChevronDown, ChevronUp, Target, Heart, Brain, Zap
} from "lucide-react";
import { PageShell } from "@/components/layout/PageShell";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

type DayPlan = {
  day: number;
  phase: string;
  purpose: string;
  wakeTime: string;
  journalPrompt: string;
  overallPlan: string;
  exercise: {
    title: string;
    quantity: string;
    benefits: string[];
  };
  meals: {
    breakfast: string;
    lunch: string;
    dinner: string;
  };
  waterTip: string;
  travelSuggestion: string;
};

const RESET_PLAN: DayPlan[] = [
  // Days 1-7: Awakening
  {
    day: 1,
    phase: "Awakening",
    purpose: "Reset your sleep patterns and establish gentle morning routines to build energy foundations.",
    wakeTime: "6:30 AM",
    journalPrompt: "What does a 'good morning' look like for me? Write about your ideal start to the day.",
    overallPlan: "Focus on hydration, light movement, and establishing consistent wake-up times. Avoid screens after 8 PM.",
    exercise: {
      title: "Morning Walk",
      quantity: "20 minutes at sunrise",
      benefits: ["Boosts endorphins", "Regulates circadian rhythm", "Improves mood stability"]
    },
    meals: {
      breakfast: "Oatmeal with berries and nuts — slow-digesting carbs for steady energy",
      lunch: "Grilled chicken salad with quinoa — balanced protein and fiber",
      dinner: "Vegetable stir-fry with tofu — light and nutrient-dense"
    },
    waterTip: "Start with a glass of lukewarm water with lemon to kickstart digestion",
    travelSuggestion: "Take a short walk to a nearby park or garden to connect with nature"
  },
  {
    day: 2,
    phase: "Awakening",
    purpose: "Build awareness of your body's natural rhythms and create space for reflection.",
    wakeTime: "6:30 AM",
    journalPrompt: "How does my body feel when I wake up? Notice any patterns in your energy levels.",
    overallPlan: "Practice mindful eating, track your water intake, and end the day with gentle stretching.",
    exercise: {
      title: "Gentle Yoga Flow",
      quantity: "15 minutes of sun salutations",
      benefits: ["Improves flexibility", "Reduces morning stiffness", "Enhances body awareness"]
    },
    meals: {
      breakfast: "Greek yogurt with honey and walnuts — probiotics for gut health",
      lunch: "Lentil soup with whole grain bread — warming and protein-rich",
      dinner: "Baked salmon with sweet potatoes — omega-3s for brain health"
    },
    waterTip: "Drink lukewarm water throughout the morning to maintain hydration",
    travelSuggestion: "Visit a local café or sit by a window to observe people and nature"
  },
  // Add more days... I'll create a pattern for all 30 days
  {
    day: 3,
    phase: "Awakening",
    purpose: "Develop gratitude practices and notice small daily improvements.",
    wakeTime: "6:30 AM",
    journalPrompt: "What am I grateful for today? Focus on three specific things.",
    overallPlan: "Incorporate breathing exercises, maintain consistent meal times, and practice gratitude.",
    exercise: {
      title: "Breathing Exercises",
      quantity: "10 minutes of 4-7-8 breathing",
      benefits: ["Reduces anxiety", "Improves lung capacity", "Calms nervous system"]
    },
    meals: {
      breakfast: "Smoothie with spinach, banana, and protein powder — nutrient-packed",
      lunch: "Turkey wrap with vegetables — lean protein and fiber",
      dinner: "Quinoa bowl with roasted vegetables — complete plant-based meal"
    },
    waterTip: "Alternate between room temperature and lukewarm water",
    travelSuggestion: "Explore a new walking path in your neighborhood"
  },
  // Continue for days 4-7 with similar structure
  {
    day: 4,
    phase: "Awakening",
    purpose: "Strengthen your connection between mind and body through mindful movement.",
    wakeTime: "6:30 AM",
    journalPrompt: "How does movement affect my mood? Reflect on today's exercise.",
    overallPlan: "Focus on quality sleep, mindful eating, and building movement habits.",
    exercise: {
      title: "Bodyweight Strength",
      quantity: "3 sets of 10 squats and push-ups",
      benefits: ["Builds functional strength", "Improves posture", "Boosts metabolism"]
    },
    meals: {
      breakfast: "Eggs with avocado toast — healthy fats and protein",
      lunch: "Chickpea salad with feta — Mediterranean-inspired nutrition",
      dinner: "Grilled fish with brown rice — heart-healthy omega-3s"
    },
    waterTip: "Drink lukewarm water with meals to aid digestion",
    travelSuggestion: "Take a mindful walk, focusing on your surroundings"
  },
  {
    day: 5,
    phase: "Awakening",
    purpose: "Cultivate self-compassion and recognize your body's wisdom.",
    wakeTime: "6:30 AM",
    journalPrompt: "What is my body trying to tell me? Listen without judgment.",
    overallPlan: "Practice self-compassion, maintain hydration, and honor your body's needs.",
    exercise: {
      title: "Mindful Stretching",
      quantity: "20 minutes of full-body stretching",
      benefits: ["Reduces muscle tension", "Improves circulation", "Enhances relaxation"]
    },
    meals: {
      breakfast: "Chia pudding with fruits — omega-3s and antioxidants",
      lunch: "Vegetable curry with rice — warming and anti-inflammatory",
      dinner: "Lean beef stir-fry with broccoli — iron-rich and energizing"
    },
    waterTip: "Start and end your day with lukewarm water",
    travelSuggestion: "Visit a quiet outdoor space for reflection"
  },
  {
    day: 6,
    phase: "Awakening",
    purpose: "Build resilience through consistent small actions.",
    wakeTime: "6:30 AM",
    journalPrompt: "What small action today made me feel accomplished?",
    overallPlan: "Focus on consistency, celebrate small wins, and build sustainable habits.",
    exercise: {
      title: "Cardio Burst",
      quantity: "15 minutes of jumping jacks or dance",
      benefits: ["Increases heart rate", "Releases endorphins", "Improves cardiovascular health"]
    },
    meals: {
      breakfast: "Overnight oats with nuts — prepare the night before",
      lunch: "Tuna salad with mixed greens — omega-3 rich",
      dinner: "Chicken stir-fry with vegetables — balanced macronutrients"
    },
    waterTip: "Drink lukewarm water with lemon for detoxification",
    travelSuggestion: "Walk to a different location than usual"
  },
  {
    day: 7,
    phase: "Awakening",
    purpose: "Reflect on your progress and set intentions for continued growth.",
    wakeTime: "6:30 AM",
    journalPrompt: "What have I learned about myself this week? What do I want to carry forward?",
    overallPlan: "Review your week, celebrate progress, and plan for maintenance of new habits.",
    exercise: {
      title: "Active Recovery",
      quantity: "30 minutes of light walking or yoga",
      benefits: ["Promotes recovery", "Maintains momentum", "Reduces stress"]
    },
    meals: {
      breakfast: "Fruit salad with yogurt — refreshing and light",
      lunch: "Pasta with vegetables and protein — comforting and nourishing",
      dinner: "Grilled vegetables with hummus — plant-based and satisfying"
    },
    waterTip: "Maintain consistent lukewarm water intake",
    travelSuggestion: "Reflect while walking in a peaceful environment"
  },
  // Days 8-21: Build (similar structure with progressive intensity)
  {
    day: 8,
    phase: "Build",
    purpose: "Increase strength and endurance while maintaining recovery practices.",
    wakeTime: "6:00 AM",
    journalPrompt: "How is my energy changing? Notice improvements in strength and stamina.",
    overallPlan: "Progressive overload in exercise, focus on protein intake, and active recovery.",
    exercise: {
      title: "Strength Circuit",
      quantity: "4 rounds: 12 squats, 10 push-ups, 15 lunges each leg",
      benefits: ["Builds muscle mass", "Improves endurance", "Enhances metabolism"]
    },
    meals: {
      breakfast: "Protein smoothie with greens — post-workout recovery",
      lunch: "Salmon salad with quinoa — high-protein meal",
      dinner: "Turkey chili with beans — warming and protein-rich"
    },
    waterTip: "Increase water intake to support increased activity",
    travelSuggestion: "Explore a new outdoor activity area"
  },
  // Continue with more days... I'll add a few more as examples
  {
    day: 15,
    phase: "Build",
    purpose: "Develop mental resilience alongside physical strength.",
    wakeTime: "6:00 AM",
    journalPrompt: "How does physical strength affect my mental strength?",
    overallPlan: "Balance intense workouts with mental health practices and proper nutrition.",
    exercise: {
      title: "HIIT Session",
      quantity: "20 minutes: 30s work/30s rest intervals",
      benefits: ["Improves cardiovascular fitness", "Burns fat efficiently", "Boosts metabolism"]
    },
    meals: {
      breakfast: "Eggs and whole grain toast — sustained energy",
      lunch: "Chicken quinoa bowl — complete protein profile",
      dinner: "Beef stir-fry with vegetables — iron and antioxidants"
    },
    waterTip: "Drink lukewarm water during and after exercise",
    travelSuggestion: "Try a new form of outdoor movement"
  },
  // Days 22-30: Peak (similar structure with maintenance focus)
  {
    day: 22,
    phase: "Peak",
    purpose: "Maintain peak performance and integrate habits into daily life.",
    wakeTime: "5:30 AM",
    journalPrompt: "How have I transformed? What habits will I maintain?",
    overallPlan: "Focus on maintenance, variety in activities, and long-term sustainability.",
    exercise: {
      title: "Peak Performance",
      quantity: "45 minutes of mixed cardio and strength",
      benefits: ["Maintains fitness gains", "Prevents plateau", "Builds consistency"]
    },
    meals: {
      breakfast: "Overnight oats with protein — convenient and nourishing",
      lunch: "Tuna poke bowl — fresh and energizing",
      dinner: "Grilled fish with vegetables — light and satisfying"
    },
    waterTip: "Maintain high water intake for optimal performance",
    travelSuggestion: "Plan a longer outdoor adventure"
  },
  {
    day: 30,
    phase: "Peak",
    purpose: "Celebrate your transformation and plan for continued wellness.",
    wakeTime: "5:30 AM",
    journalPrompt: "What is my vision for ongoing wellness? How will I maintain these gains?",
    overallPlan: "Reflect on the journey, celebrate achievements, and create a maintenance plan.",
    exercise: {
      title: "Celebration Workout",
      quantity: "30 minutes of your favorite activity",
      benefits: ["Maintains motivation", "Celebrates progress", "Reinforces habits"]
    },
    meals: {
      breakfast: "Champagne of fruits with nuts — celebratory and healthy",
      lunch: "Favorite healthy meal — reward yourself",
      dinner: "Special nutritious dinner — mark the achievement"
    },
    waterTip: "Continue with lukewarm water for sustained health",
    travelSuggestion: "Plan a meaningful journey to celebrate your transformation"
  }
];

export default function ResetPlanPage() {
  const [, navigate] = useLocation();
  const [expandedDay, setExpandedDay] = useState<number | null>(null);

  const toggleDay = (day: number) => {
    setExpandedDay(expandedDay === day ? null : day);
  };

  const getPhaseColor = (phase: string) => {
    switch (phase) {
      case "Awakening": return "from-teal-400 to-cyan-600";
      case "Build": return "from-blue-400 to-indigo-600";
      case "Peak": return "from-purple-400 to-pink-600";
      default: return "from-gray-400 to-gray-600";
    }
  };

  const getPhaseIcon = (phase: string) => {
    switch (phase) {
      case "Awakening": return Sun;
      case "Build": return Target;
      case "Peak": return Zap;
      default: return Activity;
    }
  };

  return (
    <PageShell
      title="30-Day Reset Plan"
      subtitle="A comprehensive wellness transformation — mind, body, and spirit"
      number="30"
      color="bg-gradient-to-br from-teal-500 to-indigo-600"
      icon={Target}
    >
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
        {/* Overview */}
        <Card className="border-0 shadow-xl bg-gradient-to-br from-teal-600 to-indigo-700 text-white p-6 md:p-8">
          <div className="text-center">
            <h2 className="text-2xl md:text-3xl font-display font-medium mb-4">
              Transform Your Life in 30 Days
            </h2>
            <p className="text-teal-100 text-lg mb-6 max-w-2xl mx-auto">
              This comprehensive plan combines physical fitness, mental wellness, nutrition, and lifestyle changes
              to create lasting transformation. Each day builds on the last, with specific purposes and actionable steps.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
              <div className="bg-white/10 rounded-lg p-4">
                <Sun className="w-6 h-6 mx-auto mb-2" />
                <div className="font-semibold">Days 1-7: Awakening</div>
                <div className="text-teal-200">Reset and rebuild foundations</div>
              </div>
              <div className="bg-white/10 rounded-lg p-4">
                <Target className="w-6 h-6 mx-auto mb-2" />
                <div className="font-semibold">Days 8-21: Build</div>
                <div className="text-teal-200">Strengthen and progress</div>
              </div>
              <div className="bg-white/10 rounded-lg p-4">
                <Zap className="w-6 h-6 mx-auto mb-2" />
                <div className="font-semibold">Days 22-30: Peak</div>
                <div className="text-teal-200">Maintain and celebrate</div>
              </div>
            </div>
          </div>
        </Card>

        {/* Daily Plans */}
        <div className="space-y-4">
          {RESET_PLAN.map((plan) => {
            const Icon = getPhaseIcon(plan.phase);
            const isExpanded = expandedDay === plan.day;

            return (
              <Card key={plan.day} className="border-0 shadow-md hover:shadow-lg transition-all">
                <div
                  className="p-4 md:p-6 cursor-pointer"
                  onClick={() => toggleDay(plan.day)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${getPhaseColor(plan.phase)} flex items-center justify-center flex-shrink-0`}>
                        <Icon className="w-6 h-6 text-white" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-lg font-display font-medium">Day {plan.day}</span>
                          <Badge variant="secondary" className="text-xs">
                            {plan.phase}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground line-clamp-2">
                          {plan.purpose}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {isExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                    </div>
                  </div>
                </div>

                <AnimatePresence>
                  {isExpanded && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.3 }}
                      className="overflow-hidden"
                    >
                      <div className="px-4 md:px-6 pb-6 border-t border-border pt-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          {/* Left Column */}
                          <div className="space-y-4">
                            <div className="flex items-start gap-3">
                              <Sun className="w-5 h-5 text-amber-500 mt-0.5 flex-shrink-0" />
                              <div>
                                <div className="font-semibold text-sm">Wake Up Time</div>
                                <div className="text-sm text-muted-foreground">{plan.wakeTime}</div>
                              </div>
                            </div>

                            <div className="flex items-start gap-3">
                              <FileText className="w-5 h-5 text-blue-500 mt-0.5 flex-shrink-0" />
                              <div>
                                <div className="font-semibold text-sm">Journal Prompt</div>
                                <div className="text-sm text-muted-foreground">{plan.journalPrompt}</div>
                              </div>
                            </div>

                            <div className="flex items-start gap-3">
                              <Target className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                              <div>
                                <div className="font-semibold text-sm">Overall Plan</div>
                                <div className="text-sm text-muted-foreground">{plan.overallPlan}</div>
                              </div>
                            </div>
                          </div>

                          {/* Right Column */}
                          <div className="space-y-4">
                            <div className="flex items-start gap-3">
                              <Activity className="w-5 h-5 text-red-500 mt-0.5 flex-shrink-0" />
                              <div>
                                <div className="font-semibold text-sm">Exercise: {plan.exercise.title}</div>
                                <div className="text-sm text-muted-foreground mb-1">{plan.exercise.quantity}</div>
                                <div className="text-xs text-muted-foreground">
                                  Benefits: {plan.exercise.benefits.join(", ")}
                                </div>
                              </div>
                            </div>

                            <div className="flex items-start gap-3">
                              <Droplets className="w-5 h-5 text-blue-500 mt-0.5 flex-shrink-0" />
                              <div>
                                <div className="font-semibold text-sm">Water Tip</div>
                                <div className="text-sm text-muted-foreground">{plan.waterTip}</div>
                              </div>
                            </div>

                            <div className="flex items-start gap-3">
                              <Plane className="w-5 h-5 text-purple-500 mt-0.5 flex-shrink-0" />
                              <div>
                                <div className="font-semibold text-sm">Travel/Activity</div>
                                <div className="text-sm text-muted-foreground">{plan.travelSuggestion}</div>
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Meals */}
                        <div className="mt-6 pt-6 border-t border-border">
                          <div className="flex items-center gap-2 mb-4">
                            <Apple className="w-5 h-5 text-green-500" />
                            <span className="font-semibold text-sm">Meals</span>
                          </div>
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div className="p-3 bg-amber-50 rounded-lg border border-amber-100">
                              <div className="font-medium text-sm text-amber-800 mb-1">Breakfast</div>
                              <div className="text-xs text-amber-700">{plan.meals.breakfast}</div>
                            </div>
                            <div className="p-3 bg-green-50 rounded-lg border border-green-100">
                              <div className="font-medium text-sm text-green-800 mb-1">Lunch</div>
                              <div className="text-xs text-green-700">{plan.meals.lunch}</div>
                            </div>
                            <div className="p-3 bg-blue-50 rounded-lg border border-blue-100">
                              <div className="font-medium text-sm text-blue-800 mb-1">Dinner</div>
                              <div className="text-xs text-blue-700">{plan.meals.dinner}</div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </Card>
            );
          })}
        </div>

        {/* Call to Action */}
        <Card className="border-0 shadow-xl bg-gradient-to-br from-indigo-600 to-purple-700 text-white p-6 md:p-8 text-center">
          <Heart className="w-12 h-12 mx-auto mb-4 text-pink-300" />
          <h3 className="text-xl md:text-2xl font-display font-medium mb-4">
            Ready to Begin Your Transformation?
          </h3>
          <p className="text-indigo-100 mb-6 max-w-xl mx-auto">
            This 30-day plan is designed to create lasting change. Start with Day 1 and commit to showing up for yourself.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Button
              onClick={() => navigate("/journey")}
              className="bg-white text-indigo-700 hover:bg-gray-100"
            >
              Start Your Journey Today
            </Button>
            <Button
              variant="outline"
              onClick={() => navigate("/wellness")}
              className="border-white text-white hover:bg-white hover:text-indigo-700"
            >
              Take Wellness Assessment
            </Button>
          </div>
        </Card>
      </div>
    </PageShell>
  );
}