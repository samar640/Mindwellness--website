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
  emotionalInsight?: string;
  followUpQuestions?: string[];
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

function applyBehaviorLayer(reply: Omit<Message, "id" | "from" | "time">): Omit<Message, "id" | "from" | "time"> {
  const text = reply.text.trim();
  const calmSuffix = " 🌿🙏💛✨🕊️";
  const inviteExists = /(please ask|feel free|let me know|ask me|whenever you)/i.test(text);
  const ending = `\n\nIf you'd like, I can also help with meditation, recovering after setbacks, a practical reset plan, or a grounded way to think about your money and daily balance. Please ask me more when you’re ready.`;
  return {
    ...reply,
    text: `${text}${ending}${calmSuffix}`,
  };
}

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
  beck:        { who: "Aaron T. Beck (father of CBT)",     line: "Your thoughts are not facts. The way you interpret an event matters more than the event itself.", meaning: "This means your interpretation of events shapes your emotions more than the events themselves. By questioning your thoughts, you can change how you feel." },
  ellis:       { who: "Albert Ellis (REBT)",                line: "It's not what happens to you, but how you react to it that matters.", meaning: "This means you have more control over your feelings than you think. Your reaction is something you can influence and adjust." },
  burns:       { who: "David Burns (Feeling Good)",         line: "You feel the way you think. Change the thought, and the feeling will follow.", meaning: "This means emotions are not permanent. By shifting your thoughts, you can genuinely change your emotional state." },
  dweck:       { who: "Carol S. Dweck (Mindset)",           line: "Becoming is better than being. The view you adopt for yourself profoundly affects how you live.", meaning: "This means growth is about the journey, not the destination. Believing you can improve makes real improvement possible." },
  ikigai:      { who: "Ikigai (Garcia & Miralles)",         line: "Only staying active will make you want to live a hundred years. Find a reason to get out of bed in the morning.", meaning: "This means purpose and movement are interconnected. When you have reasons to move forward, life feels more meaningful." },
  vivekananda: { who: "Swami Vivekananda",                  line: "Arise, awake, and stop not till the goal is reached.", meaning: "This means action and persistence create real change. Small steps forward, taken consistently, lead to transformation." },
  vivekananda2:{ who: "Swami Vivekananda",                  line: "The greatest religion is to be true to your own nature. Have faith in yourselves.", meaning: "This means authenticity is strength. Trusting yourself and your instincts is one of the most powerful things you can do." },
  mandela:     { who: "Nelson Mandela",                     line: "It always seems impossible until it's done.", meaning: "This means what feels impossible now often just needs one brave step. Many difficult things become possible once you start." },
  mandela2:    { who: "Nelson Mandela",                     line: "The greatest glory in living lies not in never falling, but in rising every time we fall.", meaning: "This means resilience, not perfection, is the real achievement. Each time you recover, you become stronger." },
  hill:        { who: "Napoleon Hill (Think and Grow Rich)", line: "Whatever the mind can conceive and believe, it can achieve.", meaning: "This means belief is the first step to achievement. Your inner conviction directly influences what becomes possible." },
  hill2:       { who: "Napoleon Hill (Think and Grow Rich)", line: "Strength and growth come only through continuous effort and struggle.", meaning: "This means comfort doesn't build strength. The challenging moments are actually where real growth happens." },
  kahneman:    { who: "Daniel Kahneman (Thinking, Fast and Slow)", line: "Nothing in life is as important as you think it is while you are thinking about it.", meaning: "This means emotions can distort your perspective temporarily. Taking time before deciding helps you see the true importance of things." },
  seligman:    { who: "Martin Seligman (Learned Optimism)", line: "The defining characteristic of pessimists is that they tend to believe that bad events will last a long time, will undermine everything they do, and are their own fault.", meaning: "This means recognizing when you're thinking pessimistically is the first step to breaking that pattern. Your challenges are temporary and manageable." },
  csikszentmihalyi: { who: "Mihaly Csikszentmihalyi (Flow)", line: "The best moments in our lives are not the passive, receptive, relaxing times... The best moments usually occur if a person's body or mind is stretched to its limits in a voluntary effort to accomplish something difficult and worthwhile.", meaning: "This means fulfillment comes from engaging with challenges that matter to you. Pushing yourself toward meaningful goals creates real joy." },
  frankl:      { who: "Viktor Frankl (Man's Search for Meaning)", line: "What is to give light must endure burning.", meaning: "This means meaningful change requires effort and sometimes discomfort. But this 'burning' leads to something beautiful and lasting." },
  frankl2:     { who: "Viktor Frankl (Man's Search for Meaning)", line: "Being human always points, and is directed, to something or someone, other than oneself - be it a meaning to fulfill or another human being to encounter. The more one forgets himself - by giving himself to a cause to serve or another person to love - the more human he is.", meaning: "This means connection and purpose beyond yourself are what make life meaningful. Loneliness often comes from focusing too much inward." },
  linehan:     { who: "Marsha Linehan (DBT)", line: "The goal is to learn to observe your pain, without running from it or fighting it, and without becoming overwhelmed by it.", meaning: "This means pain doesn't need to control your actions. You can feel it, notice it, and still move forward with your values." },
  kabat_zinn:  { who: "Jon Kabat-Zinn (Mindfulness)", line: "You can't stop the waves, but you can learn to surf.", meaning: "This means difficult emotions will come and go. Learning to work with them, rather than resist them, helps you stay steady." },
  emmons:      { who: "Robert Emmons (Thanks!)", line: "Gratitude is a way of looking that turns whatever we have into enough.", meaning: "This means gratitude is a skill that genuinely shifts your perception. What you focus on grows, so noticing good things multiplies them." },
  fredrickson: { who: "Barbara Fredrickson (Positivity)", line: "Love is our supreme emotion, the emotion that opens our hearts and our minds to the world around us.", meaning: "This means love (in all forms—compassion, kindness, connection) opens you to possibilities. It's the opposite of fear and closes the door." },
  journal_anxiety: {
    who: "Journal of Anxiety Disorders",
    line: "Mindfulness-based interventions have shown consistent positive effects on anxiety reduction across multiple studies.",
    meaning: "This means that simple present-moment practices can help quiet anxiety when it feels overwhelming.",
  },
  journal_depression: {
    who: "American Journal of Psychiatry",
    line: "Cognitive behavioral therapy demonstrates robust efficacy in treating depression, with effect sizes comparable to antidepressant medication.",
    meaning: "This means changing the way you think about your feelings can actually improve your mood over time.",
  },
  journal_sleep: {
    who: "Sleep Medicine Reviews",
    line: "Regular physical activity is associated with improved sleep quality and reduced insomnia symptoms.",
    meaning: "This means moving your body during the day can help your mind rest better at night.",
  },
  journal_resilience: {
    who: "Journal of Positive Psychology",
    line: "Resilience is not a fixed trait; it is a set of skills we can strengthen over time.",
    meaning: "This means you can become stronger through practice, even after hard days.",
  },
  journal_connection: {
    who: "Journal of Social and Clinical Psychology",
    line: "Strong social ties are one of the most reliable predictors of well-being.",
    meaning: "This means feeling supported by people around you really helps your mental health.",
  },
  journal_selfcompassion: {
    who: "Self-Compassion Research",
    line: "People who treat themselves with kindness have lower anxiety and better emotional recovery.",
    meaning: "This means being gentle with yourself is not indulgence — it's healing.",
  },
};

const wisdomLine = (key: keyof typeof WISDOM) => `\n\n💭 *"${WISDOM[key].line}"*\n— ${WISDOM[key].who}`;
const wisdomNote = (key: keyof typeof WISDOM) => WISDOM[key].meaning ? `\n\n*Meaning:* ${WISDOM[key].meaning}` : "";

const RANDOM_WISDOM_KEYS: (keyof typeof WISDOM)[] = [
  "vivekananda", "mandela", "hill", "dweck", "ikigai", "beck", "burns", "ellis", "vivekananda2", "mandela2", "hill2",
  "kahneman", "seligman", "csikszentmihalyi", "frankl", "frankl2", "linehan", "kabat_zinn", "emmons", "fredrickson",
  "journal_anxiety", "journal_depression", "journal_sleep"
];
const dailyWisdom = () => {
  const d = new Date();
  return WISDOM[RANDOM_WISDOM_KEYS[(d.getDate() + d.getMonth() * 7) % RANDOM_WISDOM_KEYS.length]];
};

const resolveRoute = (href: string): string => {
  if (href.startsWith("/")) return href;
  return HASH_TO_ROUTE[href] || "/";
};

// API call to backend
const sendMessageToAPI = async (message: string, context?: any): Promise<ChatResponse> => {
  try {
    const response = await fetch("http://localhost:3001/api/chat", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include", // For session cookies
      body: JSON.stringify({
        message,
        context: context || {},
      }),
    });

    if (!response.ok) {
      throw new Error(`API request failed: ${response.status}`);
    }

    return response.json();
  } catch (error) {
    console.error("API call failed:", error);
    throw error;
  }
};

// Fallback responses for when API is unavailable
const generateFallbackReply = (input: string): Omit<Message, "id" | "from" | "time"> => {
  const text = input.toLowerCase().trim();

  if (/(hi|hello|hey)/i.test(text)) {
    return {
      text: "Hello! I'm Lumi, your wellness companion. I'm currently connecting to my enhanced intelligence system. How are you feeling right now?",
      quickReplies: ["I'm feeling anxious", "I need motivation", "Help me plan my day"],
    };
  }

  return {
    text: "I'm here to support you. While I'm working on connecting to my full intelligence system, I can help you get started with some gentle wellness practices. What would you like to explore?",
    suggestions: [
      { label: "Start today's journey", href: "#journey", icon: Sun },
      { label: "Try breathing exercises", href: "#breathe", icon: Wind },
      { label: "Journal your thoughts", href: "#healing", icon: FileText },
    ],
    quickReplies: ["I'm feeling low", "I need motivation", "Help me plan my day"],
  };
};

// Generate intelligent responses using API
async function generateReply(input: string): Promise<Omit<Message, "id" | "from" | "time">> {
  try {
    const apiResponse = await sendMessageToAPI(input);

    // Convert API response to Message format
    return {
      text: apiResponse.message,
      suggestions: apiResponse.suggestions?.map(s => ({
        label: s.label,
        href: s.href,
        icon: getIconComponent(s.icon),
      })),
      quickReplies: apiResponse.quickReplies || apiResponse.followUpQuestions,
      emotionalInsight: apiResponse.emotionalInsight,
    };
  } catch (error) {
    console.error("Failed to get API response, using fallback:", error);
    return generateFallbackReply(input);
  }
}

  if (/(i am feeling good|i feel good|feeling good|feel good)/i.test(text)) {
    return {
      text: `That is so lovely to hear! 🌟 Keep that warmth with you — you're doing well, and it truly matters. Remember, life is not over until you decide it is over. One day this will pass too, and that is okay.\n\nWould you like to capture this moment in a journal, build a gentle plan around it, or simply enjoy this calm energy for now?`,
      suggestions: [
        { label: "Today's Plan", href: "#dashboard", icon: Heart },
        { label: "Journal this moment", href: "#healing", icon: FileText },
        { label: "Keep this energy", href: "#journey", icon: Sun },
      ],
      quickReplies: ["Plan my day", "Write it down", "I feel grateful"],
    };
  }

  if (/(hi.*how.*you|hello.*how.*you|who.*you|how.*you.*doing|what.*your name|what.*are you)/i.test(text)) {
    return {
      text: `Hey friend! 👋 I’m doing great and I’m perfectly fine, thank you for asking. I’m Lumi — your calm, caring companion here to listen, help you breathe, or make a gentle plan with you.\n\nWhat can I do for you today?`,
      quickReplies: ["I'm feeling low", "I feel good", "Help me plan my day"],
    };
  }

  // Greeting variations
  if (/^(hi|hello|hey|hola|namaste|yo|sup|good (morning|afternoon|evening)|morning|afternoon|evening)/i.test(text)) {
    const { part } = fullTimeGreeting();
    return {
      text: `Hello there 💛 I'm Lumi, your gentle companion for wellness and self-care.\n\nI can sense there's more beneath the surface than just a greeting. How are you truly feeling today? I'm here to listen without judgment.\n\nIf you'd like, we can explore today's journey together — it's a simple way to nurture your well-being.`,
      suggestions: [
        { label: "Start today's journey", href: "#journey", icon: Sun },
      ],
      quickReplies: ["I'm feeling anxious", "I'm okay, just tired", "I need some motivation", "I want to talk about something"],
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

  // Expressing feeling down or struggling
  if (/(depress|sad|down|empty|hopeless|low|crying|alone|lonely|worthless|numb|miserable|hard day|struggling|not okay|feeling (down|low|blue|depressed))/i.test(text)) {
    return {
      text: `I hear the weight in your words, and I'm truly sorry you're carrying this 💙 It's incredibly brave of you to reach out and acknowledge how you're feeling.\n\nYou're not alone in this moment. Depression can make everything feel heavy, hopeless, and overwhelming, but these feelings — though intense — are temporary.\n\n**What the research says:**${wisdomLine("journal_depression")}${wisdomNote("journal_depression")}\n\n**Why this matters for you right now:** This isn't just about \"thinking positive.\" It's about taking small, practical steps that gently shift your brain chemistry and perspective.\n\n**Start with one of these:**\n• Have a simple meal and drink a glass of water\n• Step outside for just 5 minutes — fresh air helps\n• Write down three small things that happened today (even tiny things count)\n• Lie down and breathe slowly for 2 minutes\n\nYou don't need to fix everything today. You just need to do one small thing.`,
      suggestions: [
        { label: "Today's Plan (adjusted for low mood)", href: "#dashboard", icon: Heart },
        { label: "Journal your feelings", href: "#healing", icon: FileText },
        { label: "Gentle breathing", href: "#breathe", icon: Wind },
      ],
      quickReplies: ["I feel so alone", "Why do I feel this way?", "Help me find one small step", "Just listen to me"],
    };
  }

  // Anxiety and panic
  if (/(anxious|anxiety|worried|nervous|panic|overwhelm|racing thoughts|can.?t breathe|scared|on edge|chest tight|heart racing|butterflies|freaking out)/i.test(text)) {
    return {
      text: `I can feel the anxiety in your message — that tightness in your chest, the racing thoughts 🌬️ You're experiencing something very real, and it's okay to feel this way.\n\n**What's happening:** Anxiety is your nervous system in overdrive. The physical symptoms are real, but they're not dangerous.\n\n**Here's what research shows:**${wisdomLine("kabat_zinn")}${wisdomNote("kabat_zinn")}\n\nLet's ground ourselves together right now. Try this simple exercise:\n1. Name 5 things you can see around you\n2. Name 4 things you can touch\n3. Name 3 things you can hear\n4. Name 2 things you can smell\n5. Name 1 thing you can taste\n\nThis brings your awareness back to the present moment, and the anxiety often settles.`,
      suggestions: [
        { label: "Guided breathing exercise", href: "#breathe", icon: Wind },
        { label: "Grounding plan for today", href: "#dashboard", icon: Heart },
        { label: "Calm your mind with CBT", href: "#healing", icon: Brain },
      ],
      quickReplies: ["My chest feels tight", "I can't stop worrying", "Help me calm down right now", "I'm scared"],
    };
  }

  // Anger and frustration
  if (/(angry|anger|mad|frustrated|furious|rage|pissed|upset|annoyed|fed up|irritated|want to scream)/i.test(text)) {
    return {
      text: `Anger has a way of demanding our attention, doesn't it? 🔥 It's a powerful emotion that tells us something important needs our notice.\n\n**What anger is telling you:** Anger signals that a boundary has been crossed, something is unfair, or your needs aren't being met. It's valid, but acting on it when it's hot usually makes things worse.\n\n**Here's what helps:**${wisdomLine("linehan")}${wisdomNote("linehan")}\n\n**Your immediate reset:**\n1. Take a slow breath: inhale for 4, hold for 4, exhale for 6 — repeat 3 times\n2. Step away from the situation if you can — physical space helps\n3. Name what you're angry about in one sentence\n4. Ask: "What do I actually need right now?"\n5. Express it safely — write, move, or talk to someone you trust\n\nAnger is valid. Your response to it is what you can control.`,
      suggestions: [
        { label: "Reset breathing", href: "#breathe", icon: Wind },
        { label: "Journal your anger", href: "#healing", icon: FileText },
        { label: "Grounding movement", href: "#wellness", icon: Activity },
      ],
      quickReplies: ["I just want to vent", "I need to calm down", "This isn't fair", "Help me process this"],
    };
  }

  // Stress and overwhelm
  if (/(stress|overwhelmed|burnt? out|exhausted|too much|can.?t cope|pressure|swamped|drowning|overloaded)/i.test(text)) {
    return {
      text: `I can sense how heavy this feels — like the world is moving too fast and you're carrying too much 🌿 You're doing your best in challenging circumstances.\n\n**What's really happening:** Overwhelm happens when you're trying to hold too many things at once. Your brain literally can't process everything.\n\n**Here's what experts know:**${wisdomLine("csikszentmihalyi")}${wisdomNote("csikszentmihalyi")}\n\n**Your next step — pick just ONE:**\n1. Write down everything bouncing in your head (5 minutes)\n2. Pick the ONE thing that, if done, would make today feel manageable\n3. Do just that one thing\n4. Then rest — you've done enough\n\nProgress over perfection. Completion of one thing beats partial attempts at many things.`,
      suggestions: [
        { label: "Simplify today's plan", href: "#dashboard", icon: Heart },
        { label: "Priority reset", href: "#todo", icon: CheckSquare },
        { label: "Quick breathing break", href: "#breathe", icon: Wind },
      ],
      quickReplies: ["What should I focus on?", "I need permission to rest", "Help me pick one thing", "I can't slow down"],
    };
  }

  // Sleep issues
  if (/(sleep|insomnia|tired|can.?t sleep|exhaust|fatigue|nap|restless|wake up|bedtime)/i.test(text)) {
    return {
      text: `Sleep is the foundation of our mental and physical health, and when it's disrupted, everything feels harder 🌙 I hear how exhausting this must be.\n\n**Why sleep matters:** During sleep, your brain processes emotions, repairs itself, and consolidates memories. Without it, everything becomes harder.\n\n**What research shows:**${wisdomLine("journal_sleep")}${wisdomNote("journal_sleep")}\n\n**Your wind-down routine for tonight:**\n1. Stop screens 60 minutes before bed (blue light keeps you awake)\n2. Dim all lights — this signals your body to make melatonin\n3. Try warm milk, herbal tea, or just warm water\n4. Write down one thing you can let go of today\n5. Do 5 minutes of slow breathing: inhale for 4, exhale for 6\n6. Lie in bed without pressure to sleep — rest is enough\n\nConsistency matters more than forcing it. Your body will adjust.`,
      suggestions: [
        { label: "Bedtime routine plan", href: "#dashboard", icon: Heart },
        { label: "Sleep-focused breathing", href: "#breathe", icon: Wind },
        { label: "Evening journal", href: "#healing", icon: FileText },
      ],
      quickReplies: ["My mind won't quiet", "I wake up tired", "Help me wind down now", "Create a sleep schedule"],
    };
  }

  // Reasons for feelings
  if (/(reasons|why do i feel|why am i feeling|key reasons|what is causing|cause of|what makes me feel)/i.test(text)) {
    return {
      text: `Here are some clear key reasons your feelings may feel stronger today:

1. Stress and overwhelm can activate your body's danger response, making emotions feel louder and more urgent.
2. Poor sleep weakens emotional regulation, so even small moments can feel heavy.${wisdomLine("journal_sleep")}${wisdomNote("journal_sleep")}
3. Feeling disconnected or unsupported can make sadness and anxiety stay longer.${wisdomLine("journal_connection")}${wisdomNote("journal_connection")}

These are not signs of weakness. They are understandable reactions to what your mind and body are carrying.`,
      suggestions: [
        { label: "Today's Plan", href: "#dashboard", icon: Heart },
        { label: "Write your feelings", href: "#healing", icon: FileText },
      ],
      quickReplies: ["Why do I feel this way?", "Give me key reasons", "Help me feel calmer"],
    };
  }

  // Point-by-point answers
  if (/(point by point|step by step|pointwise|break it down|bullet points|list out|list the steps|list the reasons)/i.test(text)) {
    if (/(sleep|insomnia|tired|bedtime|restless|wake up)/i.test(text)) {
      return {
        text: `Absolutely — here is a calm, step-by-step sleep guide:

1. Turn off screens 60 minutes before bed.
2. Dim the lights and keep the room cool.
3. Write down one thing you are ready to release.
4. Breathe slowly: 4 counts in, 6 counts out.
5. Lie down and let your body soften.

This is meant to be gentle, kind, and easy to follow.`,
        suggestions: [
          { label: "Bedtime routine plan", href: "#dashboard", icon: Heart },
          { label: "Breathing reset", href: "#breathe", icon: Wind },
        ],
        quickReplies: ["Help me wind down", "I need a calm routine"],
      };
    }

    return {
      text: `Sure — I can answer this in a humble, point-by-point way:

1. Notice what you are feeling right now.
2. Choose the most important thing to address first.
3. Take one very small step toward that thing.
4. Be gentle with yourself if it feels slow.
5. Return to these steps whenever you need a calm reset.

If you want, I can make these steps specific to sleep, stress, or your daily plan.`,
      suggestions: [
        { label: "Today's Plan", href: "#dashboard", icon: Heart },
        { label: "Take a breath", href: "#breathe", icon: Wind },
      ],
      quickReplies: ["Give me the steps", "What should I do first?", "Make it gentle"],
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

  // Motivation and inspiration
  if (/(motivat|inspir|quote|encourage|need.*push|give up|tired of trying|wisdom|words.*wisdom|inspire me)/i.test(text)) {
    return {
      text: `Seeking motivation is a strong step. Here's something that might resonate:\n\nHere is a useful idea from Carol Dweck:${wisdomLine("dweck")}${wisdomNote("dweck")}\n\nA helpful action is to choose one small thing you can do in the next 10 minutes. That is real progress.`,
      suggestions: [
        { label: "Today's meaningful plan", href: "#dashboard", icon: Heart },
        { label: "5-step journey", href: "#journey", icon: Sun },
      ],
      quickReplies: ["Another quote please", "Help me find motivation", "I feel stuck", "What's my next step?"],
    };
  }

  // Mood swings
  if (/(mood swings?|moods swing|mood changing|mood up and down|emotional rollercoaster|emotion.*swing)/i.test(text)) {
    return {
      text: `Mood swings can feel confusing and unsettling, but they often mean your mind is responding to stress, sleep changes, or something important you haven't named yet. Notice what changed before the shift — that is the most useful clue.`,
      quickReplies: ["Why does this happen?", "Help me steady my mood"],
    };
  }

  // Fear
  if (/(fear|afraid|scared|terrified|panic|fearful|phobia|worry.*a lot)/i.test(text)) {
    return {
      text: `Fear is a natural response when something feels unknown or unsafe. It is not a flaw — it is a message from your body. Naming the fear gently can help it feel less overwhelming.`,
      quickReplies: ["How do I face this?", "How can I feel safer"],
    };
  }

  // Failure
  if (/(failure|failed|fail(ed)?|not good enough|lost hope|gave up|failure.*feels)/i.test(text)) {
    return {
      text: `Feeling like a failure is painful, but it is not the whole story. Most people who grow stronger have failed many times first. What matters more is whether you keep learning and keep moving forward, even gently.`,
      quickReplies: ["How do I recover?", "What if I fail again"],
    };
  }

  // Hard work and effort
  if (/(hard work|work hard|hardworking|effort|struggle|persist|keep going|push through)/i.test(text)) {
    return {
      text: `Hard work matters, but so does rest. Progress usually comes from steady effort plus small breaks, not from pushing yourself until you burn out.`,
      quickReplies: ["How do I keep going?", "Is this worth it"],
    };
  }

  // Confidence
  if (/(confidence|confident|self esteem|self-worth|self worth|self belief|believe in myself)/i.test(text)) {
    return {
      text: `Confidence grows from small wins and kind self-talk. It is not fixed — it is something you build one small step at a time.`,
      quickReplies: ["How do I feel more confident?", "What should I try first"],
    };
  }

  // Practice and consistency
  if (/(practice|practicing|keep practicing|habit|routine|repeat|consistency|consistent)/i.test(text)) {
    return {
      text: `Practice creates change over time. Focus on one small, repeatable action today instead of trying to do everything at once. Consistency is more powerful than perfection.`,
      quickReplies: ["What practice should I start?", "How do I stay consistent"],
    };
  }

  // Loneliness and isolation
  if (/(alone|lonely|isolated|no one|nobody|disconnect|missing someone|feel isolated)/i.test(text)) {
    return {
      text: `Feeling lonely touches something deep in all of us 💙 Even in a crowded world, we can feel profoundly alone. You're not invisible — I see you reaching out right now.\n\n**What loneliness really is:** Loneliness is the gap between the connection you want and the connection you have. It's not about being physically alone; it's about feeling disconnected.\n\n**Here's what matters:**${wisdomLine("frankl2")}${wisdomNote("frankl2")}\n\n**What you can do now:**\n• Text one person — even just saying "thinking of you" counts\n• Spend 5 minutes in a space with other people (coffee shop, park, library)\n• Write down three people who have been kind to you — feel that kindness\n• Do something meaningful for someone else — connection flows both ways\n\nConnection starts with one small gesture. You don't need to fix everything — just reach out.`,
      suggestions: [
        { label: "Journal about connection", href: "#healing", icon: FileText },
        { label: "Today's plan (with movement)", href: "#dashboard", icon: Heart },
        { label: "Soothing breathing", href: "#breathe", icon: Wind },
      ],
      quickReplies: ["I miss having someone to talk to", "How can I feel less alone?", "Tell me I'm not alone", "How do I connect"],
    };
  }

  // Self-doubt and low confidence
  if (/(not good enough|worthless|failure|stupid|dumb|can.?t do it|imposter|doubt myself|not capable)/i.test(text)) {
    return {
      text: `Those critical voices in our heads can be so loud and convincing, can't they? 💭 But they're not telling the truth about who you are.\n\n**What's happening:** These are automatic negative thoughts — your brain's protective mechanism, but it's being overprotective.\n\n**Here's what research shows:**${wisdomLine("dweck")}${wisdomNote("dweck")}\n\nEvery person who has achieved something meaningful has faced self-doubt. It's not a sign of weakness — it's actually a sign you're challenging yourself and growing.\n\n**Right now:**\n1. Notice the critical thought: "I can't do this" or "I'm not good enough"\n2. Ask: Is this actually true, or is it my anxiety talking?\n3. Find one piece of evidence that contradicts this thought\n4. Remember one time you did something hard — you have proof you can do difficult things\n\nGrowth happens at the edge of your comfort zone. You're supposed to feel uncertain when you're learning.`,
      suggestions: [
        { label: "Challenge this thought (CBT)", href: "#healing", icon: Brain },
        { label: "Find your strengths", href: "#wellness", icon: Heart },
        { label: "Start one small thing", href: "#dashboard", icon: CheckSquare },
      ],
      quickReplies: ["I'm not capable", "I always fail anyway", "I'm not worthy", "Help me find one strength"],
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
      text: `Here is one idea that is meant to feel calm and useful.${wisdomLine("ikigai")}${wisdomNote("ikigai")}\n\nIf you'd like, I can share one more idea that fits how you are feeling right now.`,
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

  // Confusion or not understanding
  if (/(confus|don.?t understand|lost|not sure|unclear|what.*mean|explain|help.*understand)/i.test(text)) {
    return {
      text: `I completely understand — sometimes things can feel overwhelming or unclear, and that's perfectly okay 🌟 You're not expected to have all the answers right now.\n\nLet's take this one step at a time. What specifically feels confusing? I'm here to explain things in simpler terms and help you find your way forward. No judgment, just gentle guidance.`,
      suggestions: [
        { label: "Today's Plan", href: "#dashboard", icon: Heart },
        { label: "Start Simple", href: "#journey", icon: Sun },
      ],
      quickReplies: ["Explain the basics", "I need motivation", "Let's start small"],
    };
  }

  // Finance / money management
  if (/(money|budget|bills|financ|spend|save|debt|paycheck|income|rent|expense)/i.test(text)) {
    return {
      text: `A reset plan should include financial calm too. Start with one practical move: write down your essential spending, protect your basic needs, and choose one small habit that helps you feel more in control. It's not about perfect finances, it's about clear, steady progress.`,
      suggestions: [
        { label: "Reset my focus", href: "#dashboard", icon: LineIcon },
      ],
      quickReplies: ["How can I budget calmly?", "What should I save for first?"],
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
    text: `I hear the essence of what you're sharing, and I want to support you in the best way I can 💙 I keep my guidance grounded and practical. If I’m uncertain about the exact next step, I’ll say so honestly, and then we can choose the clearest action together.\n\nHere's a thought that might resonate: 💭 *"${w.line}"*\n— ${w.who}\n\nWhat aspect of your well-being would you like to focus on today?`,
    suggestions: [
      { label: "Today's Plan", href: "#dashboard", icon: Heart },
      { label: "Today's Journey", href: "#journey", icon: Sun },
      { label: "Express your feelings", href: "#healing", icon: FileText },
    ],
    quickReplies: ["I'm feeling anxious", "I need motivation", "Help me plan my day", "I want to talk"],
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
        text: `Good ${part} 💛 I'm **Lumi**, your gentle companion for wellness and self-care.\n\nI'm here to listen with compassion and understanding, not as a replacement for professional help. Whether you need to talk about what's weighing on your heart, explore some calming practices, or create a nurturing plan for your day — I'm here for you.\n\nHow are you feeling right now? There's no pressure to share everything at once.`,
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
      const reply = applyBehaviorLayer(generateReply(text));
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
