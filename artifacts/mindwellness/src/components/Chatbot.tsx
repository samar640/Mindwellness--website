import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useLocation } from "wouter";
import {
  MessageCircle, X, Send, Sparkles, Heart, Wind,
  Activity, BookOpen, Quote, Droplets, CheckSquare,
  ChevronRight, Bot, LineChart as LineIcon, Brain, FileText, Sun
} from "lucide-react";

type Message = {
  id: number;
  from: "bot" | "user";
  text: string;
  suggestions?: { label: string; href: string; icon?: React.ElementType }[];
  quickReplies?: string[];
  time: string;
};

const QUICK_TOPICS = [
  { label: "I'm having a hard day", icon: "💛" },
  { label: "Start today's journey", icon: "☀️" },
  { label: "I feel anxious", icon: "🌬️" },
  { label: "Help me journal", icon: "📔" },
  { label: "Track my mood", icon: "📈" },
  { label: "I just need to vent", icon: "💬" },
];

const formatTime = () => {
  const d = new Date();
  return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
};

const fullTimeGreeting = () => {
  const d = new Date();
  const time = d.toLocaleTimeString([], { hour: "numeric", minute: "2-digit", hour12: true });
  const date = d.toLocaleDateString([], { weekday: "long", month: "long", day: "numeric" });
  const hour = d.getHours();
  let part = "evening";
  if (hour < 5) part = "late night";
  else if (hour < 12) part = "morning";
  else if (hour < 17) part = "afternoon";
  return { time, date, part, hour };
};

const HASH_TO_ROUTE: Record<string, string> = {
  "#wellness": "/wellness",
  "#breathe": "/breathe",
  "#bmi": "/diet",
  "#water": "/diet",
  "#todo": "/todo",
  "#healing": "/healing",
  "#journey": "/journey",
  "#dashboard": "/dashboard",
  "#home": "/",
};

// Wisdom library — quotes from books and great minds, woven into replies
const WISDOM = {
  beck:        { who: "Aaron T. Beck (father of CBT)",     line: "Your thoughts are not facts. The way you interpret an event matters more than the event itself." },
  ellis:       { who: "Albert Ellis (REBT)",                line: "It's not what happens to you, but how you react to it that matters." },
  burns:       { who: "David Burns (Feeling Good)",         line: "You feel the way you think. Change the thought, and the feeling will follow." },
  dweck:       { who: "Carol S. Dweck (Mindset)",           line: "Becoming is better than being. The view you adopt for yourself profoundly affects how you live." },
  ikigai:      { who: "Ikigai (Garcia & Miralles)",         line: "Only staying active will make you want to live a hundred years. Find a reason to get out of bed in the morning." },
  vivekananda: { who: "Swami Vivekananda",                  line: "Arise, awake, and stop not till the goal is reached." },
  vivekananda2:{ who: "Swami Vivekananda",                  line: "The greatest religion is to be true to your own nature. Have faith in yourselves." },
  mandela:     { who: "Nelson Mandela",                     line: "It always seems impossible until it's done." },
  mandela2:    { who: "Nelson Mandela",                     line: "The greatest glory in living lies not in never falling, but in rising every time we fall." },
  hill:        { who: "Napoleon Hill (Think and Grow Rich)", line: "Whatever the mind can conceive and believe, it can achieve." },
  hill2:       { who: "Napoleon Hill (Think and Grow Rich)", line: "Strength and growth come only through continuous effort and struggle." },
};

const wisdomLine = (key: keyof typeof WISDOM) => `\n\n💭 *"${WISDOM[key].line}"*\n— ${WISDOM[key].who}`;

const RANDOM_WISDOM_KEYS: (keyof typeof WISDOM)[] = [
  "vivekananda", "mandela", "hill", "dweck", "ikigai", "beck", "burns", "ellis", "vivekananda2", "mandela2", "hill2"
];
const dailyWisdom = () => {
  const d = new Date();
  return WISDOM[RANDOM_WISDOM_KEYS[(d.getDate() + d.getMonth() * 7) % RANDOM_WISDOM_KEYS.length]];
};

const resolveRoute = (href: string): string => {
  if (href.startsWith("/")) return href;
  return HASH_TO_ROUTE[href] || "/";
};

// Generate intelligent rule-based responses
function generateReply(input: string): Omit<Message, "id" | "from" | "time"> {
  const text = input.toLowerCase().trim();

  // Greeting
  if (/^(hi|hello|hey|hola|namaste|yo|sup|good (morning|afternoon|evening))/i.test(text)) {
    const { part } = fullTimeGreeting();
    return {
      text: `Hey, good ${part} 💛 I'm Lumi.\n\nI actually want to know — what's the real answer to "how are you" today? Even "I don't know" is a fine place to start.\n\nIf you'd rather just *do* something kind for yourself, today's journey is waiting whenever you are.`,
      suggestions: [
        { label: "Start today's journey", href: "#journey", icon: Sun },
      ],
      quickReplies: ["I'm having a hard day", "I'm okay, just tired", "Honestly, I'm struggling", "I just want to talk"],
    };
  }

  // Today's Journey
  if (/(journey|today.s ritual|daily ritual|daily check.?in|do.*today|where.*start|all in one|guide me)/i.test(text)) {
    return {
      text: `Today's Journey is the simplest place to start ☀️\n\nFive tiny things — a mood check, one minute of breathing, a line worth holding, a meal idea, and a small reflection. The whole thing takes five minutes, and it ties everything else here together.\n\nIt also keeps a streak going, if that helps you show up.`,
      suggestions: [
        { label: "Open Today's Journey", href: "#journey", icon: Sun },
      ],
      quickReplies: ["What's in it?", "I want something deeper"],
    };
  }

  // Just want to vent / talk
  if (/(vent|just (want to )?talk|listen|hear me|let.*out|need to talk)/i.test(text)) {
    return {
      text: `I'm here. Take your time — type as much as you need.\n\nNo advice unless you ask for it. No fixing. Just space to put it down somewhere outside your head.\n\nWhat's been sitting heaviest today?`,
      quickReplies: ["Work is too much", "Family stuff", "I feel alone", "I don't even know"],
    };
  }

  // Today's Plan / Dashboard
  if (/(dashboard|today.?s plan|my plan|plan.*today|meal plan|what should i eat|what to eat|diet for today|sleep tonight|water goal|track|log|patterns|how.*been (feel|do))/i.test(text)) {
    return {
      text: `Today's Plan is one page that holds the whole day for you 📋\n\nAnswer one quick mood question and you'll get a realistic plan — meals from breakfast to dinner, an exercise that fits your energy, today's water goal, when to sleep, and a "Today's Goal" you can write yourself.${wisdomLine("ikigai")}\n\nIt's the kindest place to start.`,
      suggestions: [
        { label: "Open Today's Plan", href: "#dashboard", icon: Heart },
        { label: "Or do the 5-step Journey", href: "#journey", icon: Sun },
      ],
      quickReplies: ["I'll open it now", "What's in it?"],
    };
  }

  // Journaling
  if (/(journal|write.*feelings|prompt|write.*about|diary|put.*in.*words)/i.test(text)) {
    return {
      text: `Journaling is honestly one of the kindest things you can do for your future self 📔\n\nThe research is clear — even 5 minutes of writing about what you're feeling lowers stress and helps you understand yourself better. You don't need to be a "writer." You just need a starting point.\n\nWe have a fresh prompt waiting for you, and a quiet page that no one else will ever read.`,
      suggestions: [
        { label: "Today's Journal Prompt", href: "#healing", icon: FileText },
      ],
      quickReplies: ["I don't know what to write", "Give me a prompt"],
    };
  }

  // CBT / thought record / unhelpful thinking
  if (/(cbt|thought record|negative thought|catastroph|overthink|spiral|stuck in my head|reframe|cognitive)/i.test(text)) {
    return {
      text: `Spiraling thoughts feel SO real in the moment, don't they? Like your mind has built a whole case against you 🌀\n\nThis is exactly what cognitive therapy was built for. You take the loudest thought, hold it up to the light, and ask: "Is this *actually* true, or is my anxiety just very confident?"${wisdomLine("beck")}\n\nDavid Burns put it even more plainly:${wisdomLine("burns")}\n\nThe thought record on the Healing page walks you through it gently, one question at a time. About 5 minutes.`,
      suggestions: [
        { label: "Start a Thought Record", href: "#healing", icon: Brain },
      ],
      quickReplies: ["Walk me through it", "Why does this work?"],
    };
  }


  // Time
  if (/(what.*time|current time|tell.*time|time is it|clock|what.*date|today.?s.*date)/i.test(text)) {
    const { time, date } = fullTimeGreeting();
    return {
      text: `It's currently **${time}** on ${date} 🕰️\n\nA gentle reminder — wherever you are in your day, you deserve a moment to pause and breathe.`,
      quickReplies: ["Plan my day", "Take a breath", "I need motivation"],
    };
  }

  // Depression / sadness
  if (/(depress|sad|down|empty|hopeless|low|crying|alone|lonely|worthless|numb|miserable|hard day|struggling|not okay)/i.test(text)) {
    return {
      text: `I'm really glad you said something — that takes more than people realise 💛\n\nWhat you're feeling is real. Sadness has weight, and you've been carrying it. You're not broken — you're tired. There's a difference.${wisdomLine("vivekananda")}\n\nFor today, can I suggest something small? Open Today's Plan and answer one mood question — it'll hand you a gentle day. That's the win.\n\n*If you're ever in crisis, please reach out to a local helpline. A real person will pick up.*`,
      suggestions: [
        { label: "Open Today's Plan", href: "#dashboard", icon: Heart },
        { label: "Write one sentence", href: "#healing", icon: FileText },
        { label: "Today's gentle journey", href: "#journey", icon: Sun },
      ],
      quickReplies: ["I feel so alone", "Why do I feel this way?", "Just sit with me"],
    };
  }

  // Anxiety
  if (/(anxious|anxiety|worried|nervous|panic|overwhelm|racing thoughts|can.?t breathe|scared|on edge|chest tight)/i.test(text)) {
    return {
      text: `That racing-heart, can't-think-straight feeling — I know it 🌬️ You're safe in this moment, even if your body is sounding the alarm.\n\nLet's ground you. Name **5 things you can see**, **4 you can touch**, **3 you can hear**, **2 you can smell**, **1 you can taste**. It pulls your brain out of "what if" and back into "what is."${wisdomLine("burns")}\n\nWhen the wave eases, a thought record can untangle whatever your mind is yelling.`,
      suggestions: [
        { label: "60-second breathing", href: "#breathe", icon: Wind },
        { label: "Untangle the thought (CBT)", href: "#healing", icon: Brain },
        { label: "Today's Plan", href: "#dashboard", icon: Heart },
      ],
      quickReplies: ["My chest feels tight", "I keep overthinking", "What if it gets worse?"],
    };
  }

  // Anger
  if (/(angry|anger|mad|frustrated|furious|rage|pissed|upset|annoyed|fed up)/i.test(text)) {
    return {
      text: `Yeah. Anger usually means a boundary got crossed, or someone wasn't heard 🔥 You don't have to "calm down" — you're allowed to be furious. Let's just keep you out of regret-territory.\n\nTry **STOP**: **S**top, **T**ake 3 slow breaths (longer out than in), **O**bserve where it sits in your body, **P**roceed when *you* choose to.${wisdomLine("ellis")}\n\nCold water on your face genuinely slows your heart rate. Or write what you wish you could say — without sending it.`,
      suggestions: [
        { label: "Cool-down breathing", href: "#breathe", icon: Wind },
        { label: "Vent it on the page", href: "#healing", icon: FileText },
      ],
      quickReplies: ["I just want to vent", "Help me calm down", "What if I'm in the wrong?"],
    };
  }

  // Stress
  if (/(stress|overwhelmed|burnt? out|exhausted|too much|can.?t cope|pressure|swamped|drowning)/i.test(text)) {
    return {
      text: `When everything feels like too much, the answer isn't "do more" — it's "do less, but actually do it" 🌿\n\nPick **one** thing for the next hour. Even if it's "drink water and sit down." Let the rest wait. Most things will.${wisdomLine("dweck")}\n\nFollow it with two minutes of slow breathing (longer exhales than inhales) and a 10-minute walk without your phone. That's it — that's the reset.`,
      suggestions: [
        { label: "Today's Plan", href: "#dashboard", icon: Heart },
        { label: "Breathing reset", href: "#breathe", icon: Wind },
        { label: "Today's gentle journey", href: "#journey", icon: Sun },
      ],
      quickReplies: ["What should I drop?", "I need permission to rest", "I can't slow down"],
    };
  }

  // Sleep
  if (/(sleep|insomnia|tired|can.?t sleep|exhaust|fatigue|nap)/i.test(text)) {
    return {
      text: `Sleep is the foundation everything rests on 🌙\n\nFor better rest tonight:\n• Stop screens 1 hour before bed (yes, really)\n• Dim lights after sunset — it cues melatonin\n• Keep your bedroom cool (~18°C / 65°F)\n• No caffeine after 2 PM\n• Try 4-7-8 breathing in bed: inhale 4, hold 7, exhale 8${wisdomLine("ikigai")}\n\nIf your mind is racing, write down 3 things on a notepad — "park" them outside your head. Today's Plan also has a personalised bedtime for tonight.`,
      suggestions: [
        { label: "Tonight's bedtime plan", href: "#dashboard", icon: Heart },
        { label: "Bedtime Breathing", href: "#breathe", icon: Wind },
      ],
      quickReplies: ["Help me wind down", "Plan a restful evening"],
    };
  }

  // Daily plan
  if (/(plan.*day|daily.*plan|schedule|routine|what.*do today|day plan|my day)/i.test(text)) {
    const { hour } = fullTimeGreeting();
    let plan = "";
    if (hour < 12) {
      plan = `Here's a balanced morning-to-night plan ✨\n\n☀️ **Now (Morning)**\n• Drink a big glass of water\n• 5 mins gratitude journaling — write 3 things you're thankful for\n• Light breakfast: oats + fruit, or eggs + toast\n• 10 minutes of light movement or stretching\n\n🍽️ **Midday (12–2 PM)**\n• Balanced lunch (protein + veggies + whole grains)\n• 10 min walk after eating\n• Refill your water bottle\n\n🍃 **Afternoon (3–5 PM)**\n• Tackle your hardest task — your focus is sharpest\n• 2-min breathing break every hour\n• Snack: nuts or fruit\n\n🌇 **Evening (6–9 PM)**\n• 30-min walk or gentle workout\n• Light dinner before 8 PM\n• Read for 20 mins (no screens)\n\n🌙 **Night (10–11 PM)**\n• Phone away by 10 PM\n• 5-min body scan or breathing\n• Sleep by 11 PM`;
    } else if (hour < 17) {
      plan = `Here's a refreshed plan for the rest of your day 🌤️\n\n🍽️ **Right now**\n• Drink a glass of water — your brain needs hydration\n• If you haven't eaten, have a balanced meal/snack\n\n🍃 **Next 2–3 hours**\n• Pick your most important task — finish it first\n• Take a 5-min breathing break every 45 mins\n• Step outside for 10 mins of fresh air\n\n🌇 **Evening (6–9 PM)**\n• Light exercise or walk\n• Light, warm dinner\n• Disconnect from work\n• 20 mins reading or hobby time\n\n🌙 **Night**\n• Phone in another room by 10 PM\n• Wind down with breathing or stretching\n• Aim for 7–8 hours of sleep`;
    } else {
      plan = `Here's a gentle wind-down plan for tonight 🌙\n\n🌇 **Right now**\n• Light dinner if you haven't eaten — avoid heavy/spicy food\n• Drink water (not caffeine)\n• Take a 15-min walk outside if possible\n\n🍃 **Next hour**\n• Dim the lights — it cues your body for sleep\n• Stop work-related apps\n• Tidy one small thing for clarity\n\n🌙 **Bedtime routine**\n• Warm shower or wash your face\n• 5 mins of journaling — release today\n• Read fiction or do a body scan\n• Phone in airplane mode\n• Try 4-7-8 breathing in bed`;
    }
    return {
      text: plan,
      suggestions: [
        { label: "Start Wellness Check", href: "#wellness", icon: Heart },
        { label: "Add to To-Do List", href: "#todo", icon: CheckSquare },
        { label: "Breathing Exercise", href: "#breathe", icon: Wind },
      ],
      quickReplies: ["Plan a workout", "What should I eat?", "I need motivation"],
    };
  }

  // Wisdom / motivation / inspiration / give up
  if (/(motivat|inspir|quote|encourage|need.*push|give up|tired of trying|wisdom|words.*wisdom)/i.test(text)) {
    const w = dailyWisdom();
    return {
      text: `Here's a line worth holding today 🌟\n\n💭 *"${w.line}"*\n— ${w.who}${wisdomLine("mandela")}${wisdomLine("hill")}\n\nProgress isn't loud. It's choosing one good thing today, even when nothing feels possible. You're already doing it by being here.`,
      suggestions: [
        { label: "Today's Plan — make it real", href: "#dashboard", icon: Heart },
        { label: "5-step Journey", href: "#journey", icon: Sun },
      ],
      quickReplies: ["Another quote", "I need a plan", "I feel stuck"],
    };
  }

  // Water / hydration
  if (/(water|hydrat|drink|thirsty|dehydrat)/i.test(text)) {
    return {
      text: `Hydration is one of the simplest mood boosters 💧\n\nMost adults need around **2–3 litres** of water daily — more if you're active or in hot weather. Try our calculator to get your exact number based on weight, activity, and climate.`,
      suggestions: [
        { label: "Open Water Calculator", href: "#water", icon: Droplets },
      ],
      quickReplies: ["Why is water important?", "Plan my day"],
    };
  }

  // Wisdom from books
  if (/(book|read|reading|library|ikigai|mindset|dweck|vivekananda|mandela|napoleon hill|think.*grow.*rich)/i.test(text)) {
    return {
      text: `Some lines worth carrying with you today 📚${wisdomLine("ikigai")}${wisdomLine("dweck")}${wisdomLine("vivekananda")}${wisdomLine("hill")}${wisdomLine("mandela")}\n\nIf you'd like, I can fold one of these into a real day for you — Today's Plan turns the wisdom into meals, movement, and rest.`,
      suggestions: [
        { label: "Open Today's Plan", href: "#dashboard", icon: Heart },
        { label: "5-step Journey", href: "#journey", icon: Sun },
      ],
      quickReplies: ["Another quote", "Help me apply this"],
    };
  }

  // BMI / weight
  if (/(bmi|weight|body mass|fat|skinny|overweight)/i.test(text)) {
    return {
      text: `BMI is a useful starting point but it's not the whole picture — muscle, age, and body type all matter too 📏\n\nA healthy BMI is generally 18.5–24.9. Use our calculator for your number, then think of it as one data point among many. Sleep, energy, mood, and consistency matter more than any number.`,
      suggestions: [
        { label: "BMI Calculator", href: "#bmi", icon: Activity },
      ],
      quickReplies: ["Plan my meals", "Health book recommendations"],
    };
  }

  // Breathing
  if (/(breath|breathe|calm.*down|relax|meditat)/i.test(text)) {
    return {
      text: `Breathing is the fastest way to shift your state 🌬️\n\nWe have a guided 2-minute timer with simple on-screen prompts. You pick your emotion (anxious, angry, irritated, sad) and the rhythm adapts to you — no audio needed, just gentle text guidance.`,
      suggestions: [
        { label: "Open Breathing Timer", href: "#breathe", icon: Wind },
      ],
      quickReplies: ["Why does breathing help?", "Plan a calm day"],
    };
  }

  // To-do / tasks
  if (/(todo|to.do|task|productiv|organize|list)/i.test(text)) {
    return {
      text: `A clear list quiets a noisy mind ✅\n\nWrite down everything bouncing around your head — even small things. Then pick the **one** that would make today feel successful, and start with that.`,
      suggestions: [
        { label: "Open To-Do List", href: "#todo", icon: CheckSquare },
      ],
      quickReplies: ["What should I prioritize?", "Plan my day"],
    };
  }

  // Wellness check
  if (/(wellness|check.?up|assess|how.*am.*i|score)/i.test(text)) {
    return {
      text: `Take 90 seconds for a quick wellness check ❤️\n\nFive simple questions about sleep, screen time, exercise, stress, and connection — and you'll get a personalised daily plan based on your answers.`,
      suggestions: [
        { label: "Start Wellness Check", href: "#wellness", icon: Heart },
      ],
    };
  }

  // Help / capabilities
  if (/(help|what.*you.*do|what.*can.*you|features|how.*work)/i.test(text)) {
    return {
      text: `I'm Lumi — your gentle wellness companion 🌱\n\nHere's how I can help:\n• 💛 Listen when you're feeling down, anxious, or angry\n• 📋 Hand you Today's Plan — meals, exercise, water, sleep, all in one\n• ☀️ Walk you through Today's 5-step Journey\n• 🧠 Untangle a spiral with a CBT thought record\n• 🌬️ Guide you to a 60-second breathing reset\n• 💭 Share wisdom from Beck, Burns, Dweck, Ikigai, Vivekananda, Mandela, and Hill\n\nWhat would you like to talk about?`,
      quickReplies: QUICK_TOPICS.slice(0, 4).map(t => t.label),
    };
  }

  // Thank you
  if (/(thank|thanks|appreciate|grateful|love it)/i.test(text)) {
    return {
      text: `You're so welcome 💛 Taking care of your mind is one of the bravest things you can do. I'm always right here whenever you need me.`,
      quickReplies: ["Plan my day", "I need motivation", "Tell me a quote"],
    };
  }

  // Goodbye
  if (/(bye|goodbye|see you|good night|talk later|gtg|cya)/i.test(text)) {
    const { hour } = fullTimeGreeting();
    const farewell = hour > 21 ? "Sleep well tonight 🌙 Sweet dreams." : "Take care of yourself today 🌿 You've got this.";
    return {
      text: farewell,
    };
  }

  // I'm okay / good
  if (/(i.?m (ok|okay|fine|good|great|alright)|feeling (good|great|fine|okay))/i.test(text)) {
    return {
      text: `That's lovely to hear 🌞 Even on good days, small intentional acts compound. Want me to plan something nourishing for the rest of your day?`,
      quickReplies: ["Plan my day", "Recommend a book", "Take wellness check"],
    };
  }

  // Fallback — still offer wisdom + tools
  const w = dailyWisdom();
  return {
    text: `I hear you 🌱 I'm still learning, but I'm best at helping with feelings, daily planning, and finding the right tool here for you.\n\n💭 *"${w.line}"*\n— ${w.who}\n\nTry one of these:`,
    suggestions: [
      { label: "Today's Plan", href: "#dashboard", icon: Heart },
      { label: "Today's Journey", href: "#journey", icon: Sun },
    ],
    quickReplies: ["I'm feeling down", "Plan my day", "Share more wisdom"],
  };
}

export function Chatbot() {
  const [open, setOpen] = useState(false);
  const [unread, setUnread] = useState(true);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [typing, setTyping] = useState(false);
  const [, navigate] = useLocation();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Initial welcome
  useEffect(() => {
    if (messages.length === 0) {
      const { part } = fullTimeGreeting();
      setMessages([{
        id: 1,
        from: "bot",
        text: `Hey, good ${part} 💛 I'm **Lumi**.\n\nI'm not pretending to be a therapist — but I'll listen properly. We can sit with whatever's on your mind, or I can point you somewhere gentle: today's journey, a breathing pause, or a quiet journal page.\n\nNo rush. What's the real answer to "how are you" today?`,
        suggestions: [
          { label: "Start today's journey", href: "#journey", icon: Sun },
        ],
        quickReplies: QUICK_TOPICS.map(t => t.label),
        time: formatTime(),
      }]);
    }
  }, []);

  useEffect(() => {
    if (open) setUnread(false);
  }, [open]);

  useEffect(() => {
    const onOpen = () => setOpen(true);
    window.addEventListener("open-chatbot", onOpen);
    return () => window.removeEventListener("open-chatbot", onOpen);
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, typing]);

  const send = (text: string) => {
    if (!text.trim()) return;
    const userMsg: Message = { id: Date.now(), from: "user", text: text.trim(), time: formatTime() };
    setMessages(prev => [...prev, userMsg]);
    setInput("");
    setTyping(true);

    setTimeout(() => {
      const reply = generateReply(text);
      const botMsg: Message = {
        id: Date.now() + 1,
        from: "bot",
        time: formatTime(),
        ...reply,
      };
      setMessages(prev => [...prev, botMsg]);
      setTyping(false);
    }, 700 + Math.random() * 500);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    send(input);
  };

  const handleSuggestion = (href: string) => {
    navigate(resolveRoute(href));
    setOpen(false);
  };

  // Format message text with **bold** and line breaks
  const renderText = (text: string) => {
    return text.split("\n").map((line, i) => (
      <span key={i} className="block">
        {line.split(/(\*\*[^*]+\*\*|\*[^*]+\*)/g).map((part, j) => {
          if (part.startsWith("**") && part.endsWith("**")) {
            return <strong key={j} className="font-bold">{part.slice(2, -2)}</strong>;
          }
          if (part.startsWith("*") && part.endsWith("*")) {
            return <em key={j} className="italic opacity-90">{part.slice(1, -1)}</em>;
          }
          return part;
        })}
      </span>
    ));
  };

  return (
    <>
      {/* Floating Action Button */}
      <motion.button
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: "spring", stiffness: 210, damping: 18 }}
        whileHover={{ scale: 1.06 }}
        whileTap={{ scale: 0.94 }}
        onClick={() => setOpen((prev) => !prev)}
        aria-label={open ? "Close chat" : "Open chat"}
        className="fixed right-5 sm:right-6 bottom-[104px] sm:bottom-24 z-[70] w-14 h-14 rounded-full bg-gradient-to-br from-primary to-blue-600 text-white shadow-xl flex items-center justify-center group"
        style={{ boxShadow: "0 10px 28px rgba(30,64,175,0.32)" }}
      >
        {!open && (
          <>
            <motion.span
              className="absolute inset-0 rounded-full bg-primary/35"
              animate={{ scale: [1, 1.08, 1], opacity: [0.35, 0.2, 0.35] }}
              transition={{ duration: 2.8, repeat: Infinity, ease: "easeInOut" }}
            />
            <motion.span
              className="absolute inset-0 rounded-full bg-primary/25"
              animate={{ scale: [1, 1.16, 1], opacity: [0.22, 0.1, 0.22] }}
              transition={{ duration: 2.8, repeat: Infinity, ease: "easeInOut", delay: 0.45 }}
            />
          </>
        )}

        <AnimatePresence mode="wait" initial={false}>
          {open ? (
            <motion.span
              key="close"
              initial={{ rotate: -90, scale: 0.6, opacity: 0 }}
              animate={{ rotate: 0, scale: 1, opacity: 1 }}
              exit={{ rotate: 90, scale: 0.6, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="relative z-10"
            >
              <X className="w-6 h-6" />
            </motion.span>
          ) : (
            <motion.span
              key="chat"
              initial={{ rotate: 90, scale: 0.6, opacity: 0 }}
              animate={{ rotate: 0, scale: 1, opacity: 1 }}
              exit={{ rotate: -90, scale: 0.6, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="relative z-10"
            >
              <MessageCircle className="w-6 h-6" />
            </motion.span>
          )}
        </AnimatePresence>

        {!open && unread && (
          <span className="absolute -top-1 -right-1 w-4.5 h-4.5 rounded-full bg-rose-500 text-white text-[10px] font-bold flex items-center justify-center border border-white">
            1
          </span>
        )}
        {!open && (
          <span className="absolute right-full mr-3 px-3 py-1.5 rounded-full bg-foreground text-background text-xs font-medium whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
            Talk to Lumi
          </span>
        )}
      </motion.button>

      {/* Chat panel */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 30, scale: 0.92 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 30, scale: 0.92 }}
            transition={{ type: "spring", stiffness: 240, damping: 24 }}
            className="fixed right-5 sm:right-6 bottom-[170px] sm:bottom-[160px] z-[65] w-[calc(100vw-2.5rem)] sm:w-[420px] h-[calc(100vh-13rem)] sm:h-[600px] max-h-[640px] bg-white rounded-3xl shadow-2xl border border-black/5 flex flex-col overflow-hidden"
            style={{ boxShadow: "0 20px 60px rgba(0,0,0,0.18)" }}
          >
            {/* Header */}
            <div className="bg-gradient-to-br from-primary via-blue-600 to-teal-700 p-4 flex items-center gap-3 relative overflow-hidden">
              {/* Decorative shapes */}
              <div className="absolute -top-6 -right-6 w-24 h-24 rounded-full bg-white/10" />
              <div className="absolute -bottom-4 right-12 w-16 h-16 rounded-full bg-white/5" />

              <div className="relative w-11 h-11 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center border-2 border-white/30">
                <Bot className="w-5 h-5 text-white" />
                <span className="absolute bottom-0 right-0 w-3 h-3 rounded-full bg-blue-400 border-2 border-white" />
              </div>
              <div className="flex-1 relative">
                <p className="text-white font-semibold text-sm flex items-center gap-1.5">
                  Lumi <Sparkles className="w-3 h-3 text-yellow-200" />
                </p>
                <p className="text-white/80 text-xs">Your wellness companion • Online</p>
              </div>
              <button
                onClick={() => setOpen(false)}
                className="relative w-8 h-8 rounded-full bg-white/15 hover:bg-white/25 flex items-center justify-center text-white transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4 bg-gradient-to-b from-secondary/20 to-white">
              {messages.map((msg) => (
                <motion.div
                  key={msg.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3 }}
                  className={`flex ${msg.from === "user" ? "justify-end" : "justify-start"}`}
                >
                  <div className={`max-w-[88%] ${msg.from === "user" ? "items-end" : "items-start"} flex flex-col gap-2`}>
                    {msg.from === "bot" && (
                      <div className="flex items-center gap-1.5 ml-1">
                        <Bot className="w-3 h-3 text-primary" />
                        <span className="text-[10px] font-semibold text-muted-foreground">Lumi</span>
                      </div>
                    )}
                    <div
                      className={`px-4 py-2.5 rounded-2xl text-sm leading-relaxed ${
                        msg.from === "user"
                          ? "bg-primary text-primary-foreground rounded-br-md"
                          : "bg-white border border-black/5 text-foreground rounded-bl-md shadow-sm"
                      }`}
                    >
                      {renderText(msg.text)}
                    </div>

                    {/* Suggestions */}
                    {msg.suggestions && msg.suggestions.length > 0 && (
                      <div className="flex flex-col gap-1.5 w-full">
                        {msg.suggestions.map((s, i) => {
                          const Icon = s.icon;
                          return (
                            <motion.button
                              key={i}
                              whileHover={{ x: 3 }}
                              onClick={() => handleSuggestion(s.href)}
                              className="flex items-center justify-between gap-2 w-full px-3 py-2 rounded-xl bg-primary/8 border border-primary/15 hover:bg-primary/15 text-primary text-xs font-semibold transition-colors text-left"
                            >
                              <span className="flex items-center gap-2">
                                {Icon && <Icon className="w-3.5 h-3.5" />}
                                {s.label}
                              </span>
                              <ChevronRight className="w-3.5 h-3.5" />
                            </motion.button>
                          );
                        })}
                      </div>
                    )}

                    {/* Quick replies */}
                    {msg.quickReplies && msg.quickReplies.length > 0 && msg === messages[messages.length - 1] && !typing && (
                      <div className="flex flex-wrap gap-1.5 w-full mt-1">
                        {msg.quickReplies.map((qr, i) => (
                          <motion.button
                            key={i}
                            initial={{ opacity: 0, y: 4 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.1 + i * 0.05 }}
                            whileHover={{ scale: 1.04 }}
                            whileTap={{ scale: 0.96 }}
                            onClick={() => send(qr)}
                            className="px-3 py-1.5 rounded-full bg-white border border-primary/20 text-primary text-xs font-medium hover:bg-primary hover:text-primary-foreground transition-all"
                          >
                            {qr}
                          </motion.button>
                        ))}
                      </div>
                    )}

                    <span className="text-[10px] text-muted-foreground px-1">{msg.time}</span>
                  </div>
                </motion.div>
              ))}

              {/* Typing indicator */}
              <AnimatePresence>
                {typing && (
                  <motion.div
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    className="flex justify-start"
                  >
                    <div className="flex items-center gap-1 bg-white border border-black/5 rounded-2xl rounded-bl-md px-4 py-3 shadow-sm">
                      {[0, 1, 2].map(i => (
                        <motion.span
                          key={i}
                          className="w-1.5 h-1.5 rounded-full bg-primary"
                          animate={{ y: [0, -4, 0], opacity: [0.4, 1, 0.4] }}
                          transition={{ duration: 0.9, repeat: Infinity, delay: i * 0.15 }}
                        />
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <form onSubmit={handleSubmit} className="p-3 border-t border-black/5 bg-white">
              <div className="flex items-center gap-2 bg-secondary/50 rounded-2xl px-3 py-1.5 border border-transparent focus-within:border-primary/30 focus-within:bg-secondary/80 transition-all">
                <input
                  ref={inputRef}
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Type your message…"
                  className="flex-1 bg-transparent text-sm outline-none py-2 placeholder:text-muted-foreground"
                />
                <motion.button
                  type="submit"
                  disabled={!input.trim()}
                  whileHover={{ scale: 1.08 }}
                  whileTap={{ scale: 0.92 }}
                  className="w-9 h-9 rounded-xl bg-primary text-primary-foreground flex items-center justify-center disabled:opacity-30 disabled:cursor-not-allowed transition-opacity"
                >
                  <Send className="w-4 h-4" />
                </motion.button>
              </div>
              <p className="text-[10px] text-muted-foreground text-center mt-2">
                💛 Lumi offers gentle guidance — for serious concerns please reach out to a professional.
              </p>
            </form>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
