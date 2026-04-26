import { Router, type Request, type Response } from "express";
import { z } from "zod";

const router = Router();

// Types for conversation memory
interface ConversationContext {
  userId?: string;
  sessionId: string;
  messages: Array<{
    id: string;
    role: "user" | "assistant";
    content: string;
    timestamp: Date;
    emotionalState?: string;
    emotionalStates?: string[];
    rootProblems?: string[];
    topics?: string[];
  }>;
  emotionalPatterns: {
    dominantEmotions: string[];
    recurringStruggles: string[];
    progressAreas: string[];
    lastEmotionalState: string;
    repeatedPatterns: string[];
  };
  userProfile: {
    name?: string;
    preferences: {
      communicationStyle: "direct" | "gentle" | "detailed" | "concise";
      focusAreas: string[];
      avoidedTopics: string[];
    };
    goals: {
      shortTerm: string[];
      longTerm: string[];
    };
  };
  conversationStats: {
    totalMessages: number;
    averageResponseTime: number;
    commonTopics: Record<string, number>;
    lastInteraction: Date;
  };
}

// In-memory conversation storage (in production, use Redis or database)
const conversationStore = new Map<string, ConversationContext>();

// Track recently used responses to avoid repetition
const responseHistory = new Map<string, {
  validations: string[];
  closings: string[];
  actions: string[];
}>([]);

// Helper function to get random item from array
const pickRandom = <T>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)];

// Helper function to pick from array, avoiding recent repeats
const pickVaried = <T>(arr: T[], sessionId: string, type: "validations" | "closings" | "actions"): T => {
  if (arr.length <= 1) return arr[0];
  
  let history = responseHistory.get(sessionId);
  if (!history) {
    history = { validations: [], closings: [], actions: [] };
    responseHistory.set(sessionId, history);
  }
  
  const recent = history[type];
  const available = arr.filter(item => !recent.includes(String(item)));
  
  if (available.length === 0) {
    history[type] = [];
    return pickRandom(arr);
  }
  
  const selected = pickRandom(available);
  recent.push(String(selected));
  
  // Keep only last 3 to allow some repetition after time
  if (recent.length > 3) recent.shift();
  
  return selected;
};

// Zod schemas for validation
const ChatRequestSchema = z.object({
  message: z.string().min(1).max(2000),
  context: z.object({
    emotionalState: z.string().optional(),
    currentPage: z.string().optional(),
    userGoals: z.array(z.string()).optional(),
  }).optional(),
});

const ChatResponseSchema = z.object({
  message: z.string(),
  suggestions: z.array(z.object({
    label: z.string(),
    href: z.string(),
    icon: z.string().optional(),
  })).optional(),
  quickReplies: z.array(z.string()).optional(),
  emotionalInsight: z.string().optional(),
  emotionalStates: z.array(z.string()).optional(),
  rootProblems: z.array(z.string()).optional(),
  followUpQuestions: z.array(z.string()).optional(),
});

// Wisdom and knowledge base
const WISDOM_LIBRARY = {
  sadness: [
    { quote: "The greatest glory in living lies not in never falling, but in rising every time we fall.", author: "Nelson Mandela", explanation: "This reminds us that setbacks are part of life, but what matters is getting back up." },
    { quote: "You are not your feelings. You just experience them.", author: "John Green", explanation: "Your emotions don't define who you are—they're just temporary visitors." },
  ],
  anxiety: [
    { quote: "Anxiety is like a rocking chair. It gives you something to do, but it doesn't get you very far.", author: "Jodi Picoult", explanation: "Worry can feel productive, but it often keeps us stuck instead of moving forward." },
    { quote: "The way you relate to others is the way you relate to yourself.", author: "Sharon Salzberg", explanation: "How we treat ourselves often mirrors our relationships with others." },
  ],
  anger: [
    { quote: "Holding onto anger is like drinking poison and expecting the other person to die.", author: "Buddha", explanation: "Anger harms us more than anyone else when we hold onto it." },
    { quote: "Speak when you are angry and you will make the best speech you will ever regret.", author: "Ambrose Bierce", explanation: "Acting on anger often leads to regret; pause and reflect first." },
  ],
  loneliness: [
    { quote: "The most terrible poverty is loneliness, and the feeling of being unloved.", author: "Mother Teresa", explanation: "Loneliness can feel like the deepest kind of poverty, but connection is possible." },
    { quote: "Loneliness is not lack of company, loneliness is lack of purpose.", author: "Guillermo Maldonado", explanation: "Sometimes loneliness stems from feeling disconnected from meaning or direction." },
  ],
  fear: [
    { quote: "The only thing we have to fear is fear itself.", author: "Franklin D. Roosevelt", explanation: "Fear can be paralyzing, but facing it directly often reduces its power." },
    { quote: "Courage is not the absence of fear, but rather the assessment that something else is more important than fear.", author: "Franklin D. Roosevelt", explanation: "Being brave doesn't mean not feeling afraid—it means acting despite the fear." },
  ],
  motivation: [
    { quote: "The journey of a thousand miles begins with a single step.", author: "Lao Tzu", explanation: "Big changes start with small, manageable actions." },
    { quote: "You miss 100% of the shots you don't take.", author: "Wayne Gretzky", explanation: "Taking action, even imperfectly, is better than doing nothing." },
  ],
};

// Emotional intelligence patterns with response variations
const EMOTIONAL_PATTERNS = {
  sadness: {
    indicators: ["sad", "down", "depressed", "lonely", "empty", "hopeless", "blue", "heartbroken", "grief", "loss"],
    validations: [
      "I can feel the weight of what you're carrying. It's completely valid to feel this way.",
      "What you're experiencing is real and deserves to be acknowledged.",
      "Sadness is a natural response to loss or difficulty. Your feelings make sense.",
      "It takes courage to sit with these feelings. I'm here with you.",
    ],
    closings: [
      "You're not alone in this moment. Take it one gentle step at a time.",
      "Your sadness doesn't diminish your worth. You matter.",
      "Even in darkness, small moments of light can emerge. Be patient with yourself.",
      "This feeling will shift. For now, simply be kind to yourself.",
    ],
  },
  anxiety: {
    indicators: ["anxious", "worried", "nervous", "panic", "overwhelmed", "racing thoughts", "fear", "scared", "terrified", "phobia"],
    validations: [
      "Anxiety can make everything feel urgent and overwhelming. You're experiencing something very real.",
      "Your nervous system is trying to protect you, even though it might feel like too much.",
      "It's understandable to feel anxious when facing uncertainty.",
      "The intensity of your anxiety is valid, even if the threat isn't as big as it feels.",
    ],
    closings: [
      "You have the capacity to move through this. Trust your ability to handle what comes.",
      "Anxiety passes. This moment is temporary, even if it doesn't feel that way.",
      "Your strength lies in acknowledging what you fear. That's already a victory.",
      "Grounding yourself in the present moment can help ease the worry.",
    ],
  },
  anger: {
    indicators: ["angry", "frustrated", "mad", "furious", "upset", "annoyed", "rage", "irritated", "resentful"],
    validations: [
      "Anger is a powerful emotion that tells us something important needs our attention.",
      "Your frustration signals that something matters to you. That's worth honoring.",
      "Anger can be a healthy response to unfairness or disrespect.",
      "What you're feeling is a valid message, not a flaw.",
    ],
    closings: [
      "Your strength shows in your willingness to feel and process these emotions.",
      "Channel this intensity into understanding what you truly need.",
      "This anger can be a catalyst for meaningful change if you direct it wisely.",
      "Your feelings have validity. Now let's find constructive ways forward.",
    ],
  },
  loneliness: {
    indicators: ["lonely", "alone", "isolated", "disconnected", "abandoned", "friendless", "solitude"],
    validations: [
      "Feeling lonely is a deeply human experience that many people share.",
      "Loneliness doesn't mean there's something wrong with you.",
      "Your need for connection is valid and important.",
      "Even in isolation, you are worthy of care—starting with your own.",
    ],
    closings: [
      "Connection is possible, even when it feels distant. You're worthy of meaningful relationships.",
      "Reaching out, even in small ways, can be the first step toward connection.",
      "Your isolation is temporary. Opportunities for connection are waiting.",
      "You deserve to feel seen and heard. Start by seeing and hearing yourself.",
    ],
  },
  confusion: {
    indicators: ["confused", "unclear", "lost", "stuck", "don't know", "not sure", "overwhelmed by choices"],
    validations: [
      "Confusion often shows up when you're trying to navigate a complex or uncertain moment.",
      "It's okay to not have every answer right now.",
      "Feeling stuck is a common sign that you're ready for the next step, even if it's not obvious yet.",
      "You don't need clarity immediately—just one small move forward.",
    ],
    closings: [
      "Give yourself permission to take the next small step, even if the full path isn't clear yet.",
      "Clarity often comes after action, not before it.",
      "This moment of confusion can become a turning point if you stay curious.",
      "Trust that the direction will emerge as you keep exploring.",
    ],
  },
  overthinking: {
    indicators: ["overthinking", "racing thoughts", "mind won't rest", "can't stop thinking", "analysis paralysis", "looping thoughts"],
    validations: [
      "Overthinking can feel like your mind is stuck on repeat.",
      "Your brain is trying to protect you by rehearsing possibilities.",
      "It's normal to get trapped in thought loops when something matters deeply.",
      "Your effort to understand the situation is real, even if it becomes tiring.",
    ],
    closings: [
      "Sometimes the kindest thing is to step away from the loop and breathe.",
      "You don't have to solve everything in your head right now.",
      "A small action can be more helpful than another replay of the same thoughts.",
      "Your clarity will return when you give your mind some space.",
    ],
  },
  burnout: {
    indicators: ["burnout", "burned out", "tired of trying", "drained", "exhausted", "empty", "no energy"],
    validations: [
      "Burnout is a signal that your limits have been stretched too far.",
      "It's not weakness to feel exhausted—it's a sign that you need rest.",
      "You deserve a pause, not more pressure.",
      "Your efforts matter, and your energy deserves protection.",
    ],
    closings: [
      "Rest is part of the work. Protect your energy before pushing harder.",
      "This feeling is a sign to rebuild your foundation, not to ignore it.",
      "Start with one small boundary that gives you space to breathe.",
      "You can recover from burnout with steady, compassionate choices.",
    ],
  },
  self_doubt: {
    indicators: ["self doubt", "not confident", "can't do this", "imposter", "unworthy", "not enough", "doubt myself"],
    validations: [
      "Self-doubt is a normal part of growth and change.",
      "Your mind is asking for proof that you belong, even when you already do.",
      "Doubt doesn't erase your abilities or worth.",
      "It can help to notice the difference between how you feel and what you've already accomplished.",
    ],
    closings: [
      "Your doubts are understandable, but they don't define what's possible for you.",
      "Take one brave step, even if you don't feel completely sure yet.",
      "Your courage is shown in continuing to move forward despite doubt.",
      "Treat yourself with the same kindness you'd offer a friend feeling unsure.",
    ],
  },
  business_stress: {
    indicators: ["business", "startup", "entrepreneur", "launch", "company", "investors", "sales", "revenue"],
    validations: [
      "Running or starting a business can feel overwhelming and high-stakes.",
      "Your stress is understandable when so much depends on your decisions.",
      "It's normal to feel pressure when you're building something important.",
      "This is a big challenge, and you're right to take it seriously.",
    ],
    closings: [
      "Lean into small experiments first, rather than trying to solve everything at once.",
      "A simple business choice can still lead to meaningful progress.",
      "Your business goals are valid, even if the path is still taking shape.",
      "Stay close to what you can control and let the rest unfold step by step.",
    ],
  },
  financial_fear: {
    indicators: ["money", "debt", "budget", "broke", "can't afford", "expenses", "financial fear", "no money"],
    validations: [
      "Money worries are deeply stressful and very common.",
      "Your fear is a response to real uncertainty, not a personal failure.",
      "It's okay to feel anxious when resources feel tight.",
      "This is a valid concern, and it deserves a practical response.",
    ],
    closings: [
      "Take one practical step to ease the pressure and build some breathing room.",
      "Small financial moves can add up faster than you expect.",
      "Focus on stability first, then expand from there.",
      "Your financial fears are understandable, and you can begin to address them.",
    ],
  },
  fear: {
    indicators: ["fear", "afraid", "scared", "terrified", "frightened", "phobic", "dread", "panic"],
    validations: [
      "Fear is your body's natural response to perceived threats, and it's okay to feel it.",
      "What you're afraid of matters to you, which is why the fear feels so real.",
      "Fear is information, not a sign of weakness.",
      "Your protective instincts are working. That's actually a sign you care about yourself.",
    ],
    closings: [
      "Facing fears builds courage. You've already taken a brave step by reaching out.",
      "Fear often shrinks when we look at it directly. You can do this.",
      "Your capacity to acknowledge fear shows your strength, not your weakness.",
      "Moving through fear, not around it, is where real growth happens.",
    ],
  },
  motivation: {
    indicators: ["motivated", "excited", "energized", "inspired", "ready", "driven", "enthusiastic"],
    validations: [
      "That energy and motivation is something to honor and protect.",
      "Your enthusiasm is contagious and valuable. Protect this feeling.",
      "This is exactly the kind of energy that creates real change.",
      "Your drive matters. Let's channel it wisely.",
    ],
    closings: [
      "This energy is yours to steward. Use it wisely and kindly.",
      "Momentum is powerful. Ride this wave while honoring your limits.",
      "Your motivation can create lasting change. Trust this feeling.",
      "Keep this spark alive by taking action aligned with your values.",
    ],
  },
};

const ROOT_PROBLEM_PATTERNS: Record<string, string[]> = {
  social_connection: ["alone", "lonely", "isolated", "left out", "nobody", "friendless"],
  life_purpose: ["purpose", "meaning", "direction", "lost", "why am i here", "what am i doing"],
  self_worth: ["worthless", "not good enough", "failure", "shame", "unworthy", "deserve"],
  overthinking: ["overthinking", "can't stop thinking", "racing thoughts", "mind won't rest", "analyze everything"],
  burnout: ["burnout", "exhausted", "tired of trying", "drained", "no energy", "empty"],
  business_stress: ["business", "startup", "entrepreneur", "company", "launch", "product", "service business"],
  financial_fear: ["money", "budget", "debt", "financial", "broke", "can't afford", "no money", "expenses"],
  fear_of_failure: ["afraid to fail", "fear of failure", "scared to fail", "don't want to fail", "failure"],
  family_pressure: ["family pressure", "parents", "must", "expectations", "family wants", "family says"],
  no_clarity: ["no clarity", "unclear", "don't know", "confused", "not sure", "lost"],
  no_skill_confidence: ["not skilled", "can't do it", "not confident", "don't know how", "no skill", "inexperienced"],
};

const BUSINESS_DECISION_RULES = [
  {
    conditions: (message: string) => /\bbusiness\b|\bstartup\b|\bentrepreneur\b|\bstart.*business\b/i.test(message),
    constraints: (message: string) => ({
      lowBudget: /\b(no money|low budget|small budget|broke|can't afford|limited funds)\b/i.test(message),
      student: /\bstudent\b|\bcollege\b|\bschool\b/i.test(message),
      smallCity: /\bsmall city\b|\bsmall town\b|\bcollege town\b|\bremote area\b/i.test(message),
      fearOfFailure: /\bfear.*failure\b|\bafraid.*fail\b|\bdon't want to fail\b/i.test(message),
    }),
    recommendation: "A service-oriented business or freelancing path is wiser right now than chasing a high-growth startup.",
  },
  {
    conditions: (message: string) => /\bfinance\b|\bmoney\b|\bdebt\b|\bbudget\b|\bincome\b/i.test(message),
    constraints: (message: string) => ({
      urgent: /\b(bill|rent|loan|payment|deadline)\b/i.test(message),
      lowConfidence: /\b(not sure|doubt|can't|don't know)\b/i.test(message),
    }),
    recommendation: "Focus on stabilizing your cash flow with small, reliable actions before taking on bigger risks.",
  },
];

// Advanced response generation system
class LumiResponseGenerator {
  private context: ConversationContext;
  private sessionId: string;

  constructor(context: ConversationContext, sessionId: string) {
    this.context = context;
    this.sessionId = sessionId;
  }

  // Step 1: Understand emotional state
  private analyzeEmotionalStates(message: string): string[] {
    const lowerMessage = message.toLowerCase();
    const detected = new Set<string>();

    for (const [emotion, pattern] of Object.entries(EMOTIONAL_PATTERNS)) {
      if (pattern.indicators.some(indicator => lowerMessage.includes(indicator))) {
        detected.add(emotion);
      }
    }

    if (lowerMessage.includes("tired of trying") || lowerMessage.includes("burnout") || lowerMessage.includes("burned out")) {
      detected.add("burnout");
    }
    if (/\bcan't stop thinking\b|\boverthinking\b|\bbrain won't stop\b|\bracing thoughts\b/.test(lowerMessage)) {
      detected.add("overthinking");
    }
    if (/\bself doubt\b|\bimposter\b|\bnot confident\b|\bdon't trust myself\b|\bnot enough\b/.test(lowerMessage)) {
      detected.add("self_doubt");
    }
    if (/\bbusiness\b|\bstartup\b|\bentrepreneur\b|\blaunch\b/.test(lowerMessage)) {
      detected.add("business_stress");
    }
    if (/\bmoney\b|\bdebt\b|\bbudget\b|\bbroke\b|\bcan't afford\b|\bfinancial\b/.test(lowerMessage)) {
      detected.add("financial_fear");
    }
    if (/\bstuck\b|\bconfused\b|\bnot sure\b|\bno clarity\b|\buncertain\b/.test(lowerMessage)) {
      detected.add("confusion");
    }

    if (detected.size === 0) {
      return ["neutral"];
    }

    return Array.from(detected);
  }

  // Step 2: Identify root problem
  private identifyRootProblems(message: string, emotionalStates: string[]): string[] {
    const problems = new Set<string>();
    const lowerMessage = message.toLowerCase();

    for (const [problem, indicators] of Object.entries(ROOT_PROBLEM_PATTERNS)) {
      if (indicators.some(indicator => lowerMessage.includes(indicator))) {
        problems.add(problem);
      }
    }

    if (emotionalStates.includes("burnout")) {
      problems.add("burnout");
    }
    if (emotionalStates.includes("overthinking")) {
      problems.add("overthinking");
    }
    if (emotionalStates.includes("self_doubt")) {
      problems.add("self_worth");
    }

    if (lowerMessage.includes("start a business") || lowerMessage.includes("want to start business") || lowerMessage.includes("want to start a business")) {
      problems.add("business_idea");
    }

    if (lowerMessage.includes("student") && lowerMessage.includes("business")) {
      problems.add("student_business");
    }

    if (problems.size === 0) {
      problems.add("general_support");
    }

    return Array.from(problems);
  }

  private determineDecisionStrategy(message: string, rootProblems: string[]): string | null {
    for (const rule of BUSINESS_DECISION_RULES) {
      if (rule.conditions(message)) {
        const advice = rule.recommendation;
        if (rootProblems.includes("business_idea") || rootProblems.includes("business_stress") || rootProblems.includes("student_business")) {
          return advice;
        }
      }
    }
    return null;
  }

  private registerPatternInContext(rootProblems: string[], emotionalStates: string[]): string | null {
    const repeated = [] as string[];

    for (const problem of rootProblems) {
      if (this.context.emotionalPatterns.recurringStruggles.includes(problem)) {
        repeated.push(problem);
      } else {
        this.context.emotionalPatterns.recurringStruggles.push(problem);
      }
    }

    for (const emotion of emotionalStates) {
      if (this.context.emotionalPatterns.dominantEmotions.includes(emotion)) {
        if (!this.context.emotionalPatterns.repeatedPatterns.includes(emotion)) {
          this.context.emotionalPatterns.repeatedPatterns.push(emotion);
        }
      }
    }

    if (repeated.length > 0) {
      return `I notice this has come up before: ${repeated.join(", ")}. Let's address it with a clearer focus this time.`;
    }

    return null;
  }

  // Step 3: Validate feelings with variety
  private validateFeelings(emotionalState: string): string {
    const pattern = EMOTIONAL_PATTERNS[emotionalState as keyof typeof EMOTIONAL_PATTERNS];
    
    if (pattern && pattern.validations) {
      return pickVaried(pattern.validations, this.sessionId, "validations");
    }

    return "Your feelings are valid and worthy of attention.";
  }

  // Step 4: Provide practical action steps (with variety)
  private generatePracticalSteps(rootProblems: string[], emotionalState: string): string[] {
    const actionPool = {
      social_connection: [
        "Send one message to someone you care about, even if it's just 'thinking of you'",
        "Join a low-pressure social activity this week, like a walk or coffee",
        "Comment or react to a post from someone you appreciate",
      ],
      life_purpose: [
        "Write down three things that make you lose track of time",
        "Identify one small way to contribute to something larger than yourself",
        "List activities that felt meaningful in the past—what did they have in common?",
      ],
      self_worth: [
        "List three things you've done this week that required courage",
        "Practice one act of self-compassion, like speaking kindly to yourself",
        "Ask yourself: what would I tell a friend in this situation?",
      ],
      future_uncertainty: [
        "Write down your top three worries and one action for each",
        "Focus on what you can control in the next 24 hours",
        "Break down one big fear into smaller, manageable steps",
      ],
      career_pressure: [
        "Break down your work into three manageable tasks for today",
        "Take a 5-minute break to breathe and reset",
        "Identify one task that aligns with your values—prioritize that",
      ],
      health_concerns: [
        "Schedule that doctor's appointment you've been putting off",
        "Research reliable health information from trusted sources",
        "Take one small step toward better health today",
      ],
      perceived_injustice: [
        "Write down what feels unfair and why it matters to you",
        "Consider one constructive action you could take",
        "Reflect on what boundary might help protect your peace",
      ],
      relationship_issues: [
        "Express your feelings using 'I' statements when you're calm",
        "Set a boundary that protects your well-being",
        "Consider what you need from this relationship moving forward",
      ],
      burnout: [
        "Take a 15-minute break and write down one thing you can say no to this week",
        "Identify one task that can wait and give yourself permission to let it go",
        "Notice one moment today where your energy feels lower and honor it with rest",
      ],
      overthinking: [
        "Set a 5-minute timer and write down the thought loop, then close the notebook",
        "Move your body for a short walk to shift your mind out of the loop",
        "Ask yourself: what would I do if I trusted myself more in this moment?",
      ],
      business_idea: [
        "Write one clear goal for your next week instead of trying to solve the whole business",
        "Identify a small, low-cost test you can run to learn what customers want",
        "List one strength you already have that could become a simple service offering",
      ],
      business_stress: [
        "Name one business pressure and one small action to reduce it today",
        "Focus on what you can control instead of everything that feels uncertain",
        "Talk through one idea with a trusted friend or mentor, even if it's not perfect",
      ],
      financial_fear: [
        "Write down your three most urgent expenses and one step to address each",
        "Look for one small way to save or earn a little extra this week",
        "Separate facts from fears by checking the actual numbers once",
      ],
      family_pressure: [
        "Write down what you want, then decide what you're willing to say no to",
        "Practice one calm sentence that explains your priority to your family",
        "Set one small boundary that protects your mental space",
      ],
      no_clarity: [
        "Choose one small next step, even if it's not the perfect one",
        "Write down what you know and what you still need to learn",
        "Ask yourself: what is one thing I can test right now?",
      ],
      no_skill_confidence: [
        "Identify one skill you could improve with a single short practice session",
        "Find one helpful resource or mentor for the area you feel unsure about",
        "Remember one time you learned something new and how you did it",
      ],
      general_support: [
        "Take three slow breaths, noticing the sensation of air entering and leaving your body",
        "Write down one thing you're grateful for, no matter how small",
        "Do one small act of self-care that feels manageable right now",
      ],
    };

    const steps = [];
    
    for (const problem of rootProblems) {
      const pool = actionPool[problem as keyof typeof actionPool] || actionPool.general_support;
      steps.push(pickRandom(pool));
    }

    // If no steps added, use general support actions
    if (steps.length === 0) {
      const generalPool = actionPool.general_support;
      return [generalPool[0], generalPool[1], generalPool[2]].slice(0, 3);
    }

    return steps.slice(0, 3); // Limit to 3 steps
  }

  // Step 5: Suggest long-term improvement strategy
  private suggestLongTermStrategy(rootProblems: string[], emotionalState: string): string {
    const strategies = {
      social_connection: "Building meaningful connections takes time. Consider joining a club or group based on your interests, or reaching out to old friends. Start with low-pressure interactions and build from there.",
      life_purpose: "Finding purpose often comes from exploring what truly matters to you. Try the 'Ikigai' framework: what you love, what you're good at, what the world needs, and what you can be paid for.",
      self_worth: "Self-worth grows through small, consistent acts of self-compassion and achievement. Consider keeping a 'wins journal' and practicing daily gratitude for your own efforts.",
      future_uncertainty: "Building resilience to uncertainty involves both practical planning and emotional acceptance. Create contingency plans for your biggest fears while practicing mindfulness.",
      career_pressure: "Career satisfaction often comes from aligning your work with your values. Consider what aspects of your job energize you and what drains you, then explore ways to increase the energizing parts.",
      health_concerns: "Taking charge of your health involves both prevention and early intervention. Build healthy habits gradually and stay informed about your health needs.",
      perceived_injustice: "Addressing injustice requires both inner work and outer action. Focus on what you can influence while protecting your peace of mind.",
      relationship_issues: "Healthy relationships require clear communication and boundaries. Consider what you need and how to express it effectively.",
      burnout: "Recovery from burnout is about rebuilding rest, boundaries, and a sustainable pace. Start by scheduling regular breaks and reducing one source of pressure.",
      overthinking: "Overthinking loosens when you shift from analysis to action. Try a short experiment or a simple daily routine to move your thoughts into motion.",
      business_idea: "For business ideas, begin with a small test rather than a perfect plan. Validate one offer with a simple customer conversation or pilot service.",
      business_stress: "When business stress is high, focus on one manageable part of your plan. Protect your energy and simplify your next step.",
      financial_fear: "Financial security builds from small, consistent improvements. Track your spending, prioritize urgent needs, and create a realistic short-term plan.",
      family_pressure: "Family pressure can feel heavy, so build your own boundaries gently. Clearly communicate your priorities and protect your mental space.",
      no_clarity: "Clarity often appears when you narrow your focus to one choice at a time. Choose a small experiment and learn from the result.",
      no_skill_confidence: "Skill confidence grows through repeated practice and feedback. Start with a small learning step and celebrate how far you've already come.",
    };

    const primaryProblem = rootProblems[0];
    return strategies[primaryProblem as keyof typeof strategies] ||
           "Long-term growth comes from consistent small actions. Consider establishing one or two daily practices that support your well-being.";
  }

  // Step 6: End with calm clarity (varied)
  private generateClosing(emotionalState: string): string {
    const pattern = EMOTIONAL_PATTERNS[emotionalState as keyof typeof EMOTIONAL_PATTERNS];
    
    if (pattern && pattern.closings) {
      return pickVaried(pattern.closings, this.sessionId, "closings");
    }

    return "Remember: growth happens in the space between struggle and surrender. You've got this.";
  }

  // Generate wisdom quote based on context
  private selectWisdomQuote(emotionalState: string): { quote: string; author: string; explanation: string } | null {
    const quotes = WISDOM_LIBRARY[emotionalState as keyof typeof WISDOM_LIBRARY];
    if (quotes && quotes.length > 0) {
      return quotes[Math.floor(Math.random() * quotes.length)];
    }
    return null;
  }

  // Main response generation method
  generateResponse(message: string): z.infer<typeof ChatResponseSchema> {
    // Analyze the message using layered reasoning
    const emotionalStates = this.analyzeEmotionalStates(message);
    const primaryEmotion = emotionalStates[0] || "neutral";
    const rootProblems = this.identifyRootProblems(message, emotionalStates);
    const decisionStrategy = this.determineDecisionStrategy(message, rootProblems);
    const repeatedPatternMessage = this.registerPatternInContext(rootProblems, emotionalStates);

    // Update context with new analysis
    this.context.emotionalPatterns.lastEmotionalState = primaryEmotion;
    for (const emotion of emotionalStates) {
      if (!this.context.emotionalPatterns.dominantEmotions.includes(emotion)) {
        this.context.emotionalPatterns.dominantEmotions.push(emotion);
      }
    }

    // Build response using structured approach
    let responseText = "";

    // Awareness of repeated patterns
    if (repeatedPatternMessage) {
      responseText += `**${repeatedPatternMessage}**\n\n`;
    }

    // Start with validation
    responseText += `**${this.validateFeelings(primaryEmotion)}**\n\n`;

    // Add practical steps
    const practicalSteps = this.generatePracticalSteps(rootProblems, primaryEmotion);
    if (practicalSteps.length > 0) {
      responseText += "**Here's what you can do right now:**\n";
      practicalSteps.forEach((step, index) => {
        responseText += `• ${step}\n`;
      });
      responseText += "\n";
    }

    // Add targeted wisdom quote with explanation
    const wisdom = this.selectWisdomQuote(primaryEmotion);
    if (wisdom) {
      responseText += `💭 **"${wisdom.quote}"**\n— *${wisdom.author}*\n\n`;
      responseText += `**What this means:** ${wisdom.explanation}\n\n`;
    }

    if (decisionStrategy) {
      responseText += `**Decision insight:** ${decisionStrategy}\n\n`;
    }

    // Add long-term strategy
    responseText += `**For the longer term:** ${this.suggestLongTermStrategy(rootProblems, primaryEmotion)}\n\n`;

    // End with closing
    responseText += `**${this.generateClosing(primaryEmotion)}**`;

    // Generate suggestions and follow-ups
    const suggestions = this.generateSuggestions(rootProblems, primaryEmotion);
    const followUpQuestions = this.generateFollowUpQuestions(rootProblems, primaryEmotion);

    return {
      message: responseText,
      suggestions,
      quickReplies: followUpQuestions,
      emotionalInsight: `I sense you're experiencing **${emotionalStates.join(" + ")}** related to ${rootProblems.join(" and ")}. This is a normal part of being human.`,
      emotionalStates,
      rootProblems,
    };
  }

  private generateSuggestions(rootProblems: string[], emotionalState: string): Array<{ label: string; href: string; icon?: string }> {
    const suggestions = [];

    if (rootProblems.includes("social_connection")) {
      suggestions.push({ label: "Explore connection practices", href: "#healing", icon: "Heart" });
    }

    if (rootProblems.includes("business_idea") || rootProblems.includes("business_stress") || rootProblems.includes("student_business")) {
      suggestions.push({ label: "Explore business mindset support", href: "#journey", icon: "Brain" });
    }

    if (rootProblems.includes("financial_fear")) {
      suggestions.push({ label: "Review financial wellness tools", href: "#wellness", icon: "Activity" });
    }

    if (emotionalState === "anxiety") {
      suggestions.push({ label: "Try breathing exercises", href: "#breathe", icon: "Wind" });
    }

    if (rootProblems.includes("life_purpose")) {
      suggestions.push({ label: "Reflect on your journey", href: "#journey", icon: "Sun" });
    }

    // Always include general wellness check
    suggestions.push({ label: "Check your wellness", href: "#wellness", icon: "Activity" });

    return suggestions.slice(0, 3); // Limit to 3 suggestions
  }

  private generateFollowUpQuestions(rootProblems: string[], emotionalState: string): string[] {
    const questionPool = {
      sadness: [
        "What's one small thing that usually brings you comfort?",
        "When did you first notice feeling this way?",
        "What would help you feel more connected right now?",
        "Is there someone you trust who you could talk to?",
      ],
      anxiety: [
        "What specifically feels most threatening right now?",
        "What's one thing you can control in this situation?",
        "What would make you feel safer in this moment?",
        "What's the worst that could happen, and how would you handle it?",
      ],
      anger: [
        "What do you think this anger is trying to protect?",
        "What's one need this situation isn't meeting for you?",
        "What would feel like a fair resolution?",
        "What boundary might help protect your peace?",
      ],
      loneliness: [
        "What's one relationship you'd like to nurture?",
        "What kind of connection would feel most healing right now?",
        "What small step could you take toward connection today?",
      ],
      confusion: [
        "What is one small choice that feels clearer than the rest?",
        "What information do you still need to feel more certain?",
        "What can you test quickly to reduce the uncertainty?",
      ],
      overthinking: [
        "What would happen if you let one thought go for a little while?",
        "What does your body need right now instead of your mind?",
        "Can you choose one action that doesn't require a perfect answer?",
      ],
      burnout: [
        "What is one thing you can stop doing this week?",
        "What would rest look like for you today?",
        "Where can you create a little more breathing room in your schedule?",
      ],
      self_doubt: [
        "What proof do you have that you can do this?",
        "What would you tell a friend who felt this unsure?",
        "What small step would feel courageous even if it isn't perfect?",
      ],
      business_stress: [
        "What is the most important business question you need clarity on?",
        "Which part of this plan feels most overwhelming?",
        "What practical step would make today feel less stressful?",
      ],
      financial_fear: [
        "What is the smallest money concern you can solve first?",
        "What resources do you already have that can help you feel more stable?",
        "Who could you ask for practical advice about this situation?",
      ],
      business_idea: [
        "What would a simple, low-risk version of this business look like?",
        "Who is the first person you'd want to learn from about this idea?",
        "What problem are you solving for someone else?",
      ],
      student_business: [
        "How can this idea fit around your studies?",
        "What low-cost way can you test this while still keeping your focus?",
        "What is one thing you can learn from this week?",
      ],
      family_pressure: [
        "What do you want to keep for yourself, regardless of others' expectations?",
        "What would make you feel more in control of this situation?",
        "How can you gently share your needs with the people around you?",
      ],
      no_clarity: [
        "What is one decision you can make today, even if it's small?",
        "What facts are clear enough to act on?",
        "What do you need to feel a bit more certain?",
      ],
      no_skill_confidence: [
        "What would you like to practice in a short, low-pressure way?",
        "What evidence do you have that you can grow this skill?",
        "Who could you ask for feedback or mentorship?",
      ],
      fear: [
        "What specifically are you afraid might happen?",
        "What's helped you face fear before?",
        "What support would help you feel braver?",
      ],
      motivation: [
        "What are you most excited about right now?",
        "What would momentum look like for you?",
        "How can you protect this energy?",
      ],
      social_connection: [
        "What's one relationship you'd like to nurture?",
        "Who makes you feel seen and understood?",
      ],
      life_purpose: [
        "What activities make you feel most alive?",
        "What impact do you want to have?",
      ],
      self_worth: [
        "What would you tell a friend who felt this way?",
        "What are you proud of about yourself?",
      ],
      general: [
        "What's the most important thing on your mind right now?",
        "What would make today feel a little easier?",
        "How can I best support you in this moment?",
      ],
    };

    const questions = [];
    
    // Get emotion-specific questions
    const emotionQuestions = questionPool[emotionalState as keyof typeof questionPool] || questionPool.general;
    questions.push(pickRandom(emotionQuestions));

    // Get problem-specific questions
    for (const problem of rootProblems) {
      const pool = questionPool[problem as keyof typeof questionPool];
      if (pool && pool.length > 0) {
        questions.push(pickRandom(pool));
      }
    }

    // Fallback to general questions
    if (questions.length === 0) {
      questions.push(...questionPool.general);
    }

    return questions.slice(0, 3);
  }
}

// Chatbot route handler
router.post("/chat", async (req: Request, res: Response) => {
  try {
    // Validate request
    const validatedData = ChatRequestSchema.parse(req.body);
    const { message, context } = validatedData;

    // Get or create conversation context
    const sessionId = (req.session as any).id || "anonymous";
    let conversationContext: ConversationContext | undefined = conversationStore.get(sessionId);

    if (!conversationContext) {
      conversationContext = {
        sessionId,
        messages: [],
        emotionalPatterns: {
          dominantEmotions: [],
          recurringStruggles: [],
          progressAreas: [],
          lastEmotionalState: "",
          repeatedPatterns: [],
        },
        userProfile: {
          preferences: {
            communicationStyle: "gentle",
            focusAreas: [],
            avoidedTopics: [],
          },
          goals: {
            shortTerm: [],
            longTerm: [],
          },
        },
        conversationStats: {
          totalMessages: 0,
          averageResponseTime: 0,
          commonTopics: {},
          lastInteraction: new Date(),
        },
      };
      conversationStore.set(sessionId, conversationContext);
    }

    // Add user message to context
    conversationContext.messages.push({
      id: `user_${Date.now()}`,
      role: "user",
      content: message,
      timestamp: new Date(),
    });

    // Generate response using Lumi
    const generator = new LumiResponseGenerator(conversationContext, sessionId);
    const response = generator.generateResponse(message);

    // Add assistant response to context
    conversationContext.messages.push({
      id: `assistant_${Date.now()}`,
      role: "assistant",
      content: response.message,
      timestamp: new Date(),
      emotionalStates: response.emotionalStates,
      rootProblems: response.rootProblems,
    });

    // Update conversation stats
    conversationContext.conversationStats.totalMessages++;
    conversationContext.conversationStats.lastInteraction = new Date();

    // Validate response
    const validatedResponse = ChatResponseSchema.parse(response);

    res.json(validatedResponse);
  } catch (error) {
    console.error("Chatbot error:", error);

    if (error instanceof z.ZodError) {
      res.status(400).json({
        error: "Invalid request data",
        details: error.errors,
      });
    } else {
      res.status(500).json({
        error: "Internal server error",
        message: "Something went wrong while processing your message.",
      });
    }
  }
});

export default router;