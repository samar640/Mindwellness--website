import { Router, type Request, type Response } from "express";
import { z } from "zod";
import { loadChatContext, saveChatContext } from "../db/chatMemory.js";

const router = Router();

type Role = "user" | "assistant";
type CommunicationStyle = "direct" | "gentle" | "detailed" | "concise";
type Provider = "local" | "gpt" | "gemini";
type Domain =
  | "sadness"
  | "loneliness"
  | "heartbreak"
  | "anxiety"
  | "overthinking"
  | "self_doubt"
  | "financial_stress"
  | "career_confusion"
  | "new_job_stress"
  | "business_confusion"
  | "sleep_issues"
  | "discipline_issues"
  | "burnout"
  | "general_support";

interface MessageRecord {
  id: string;
  role: Role;
  content: string;
  timestamp: Date;
  emotionalStates?: string[];
  rootProblems?: string[];
}

interface ConversationContext {
  userId?: string;
  sessionId: string;
  messages: MessageRecord[];
  emotionalPatterns: {
    dominantEmotions: string[];
    recurringStruggles: string[];
    repeatedPatterns: string[];
    emotionalLoops: string[];
    lastEmotionalState: string;
  };
  behaviorMemory: {
    triggerKeywords: Record<string, number>;
    adviceTried: Record<string, number>;
    adviceFailed: string[];
    recentAdviceIds: string[];
    repeatedConcernCount: Record<string, number>;
    domainConfidence: Record<Domain, number>;
    providerQuality: Record<Provider, number>;
  };
  userProfile: {
    preferences: {
      communicationStyle: CommunicationStyle;
      focusAreas: string[];
    };
    goals: {
      shortTerm: string[];
      longTerm: string[];
    };
  };
  conversationStats: {
    totalMessages: number;
    commonTopics: Record<string, number>;
    lastInteraction: Date;
  };
}

interface LayeredPlan {
  domains: Domain[];
  primaryDomain: Domain;
  rootCauses: string[];
  decisionInsight: string | null;
  patternFlags: string[];
  style: CommunicationStyle;
}

const cache = new Map<string, ConversationContext>();

const ChatRequestSchema = z.object({
  message: z.string().min(1).max(3000),
  context: z
    .object({
      emotionalState: z.string().optional(),
      currentPage: z.string().optional(),
      userGoals: z.array(z.string()).optional(),
      communicationStyle: z.enum(["direct", "gentle", "detailed", "concise"]).optional(),
      recentMessages: z.array(z.string()).optional(),
    })
    .optional(),
});

const ChatResponseSchema = z.object({
  message: z.string(),
  suggestions: z
    .array(
      z.object({
        label: z.string(),
        href: z.string(),
        icon: z.string().optional(),
      }),
    )
    .optional(),
  quickReplies: z.array(z.string()).optional(),
  emotionalInsight: z.string().optional(),
  emotionalStates: z.array(z.string()).optional(),
  rootProblems: z.array(z.string()).optional(),
  followUpQuestions: z.array(z.string()).optional(),
});

const GREETING_PATTERN =
  /^(hi|hello|hey|who are you|how are you|what do you do|what can you do|introduce yourself)\b/i;

const DOMAIN_PATTERNS: Record<Domain, string[]> = {
  sadness: ["sad", "empty", "depressed", "low", "grief"],
  loneliness: ["lonely", "alone", "isolated", "nobody"],
  heartbreak: ["heartbreak", "breakup", "left me", "betrayed"],
  anxiety: ["anxious", "panic", "fear", "worried", "uneasy"],
  overthinking: ["overthinking", "can't stop thinking", "loop", "racing thoughts"],
  self_doubt: ["not enough", "not confident", "imposter", "doubt myself"],
  financial_stress: ["money", "debt", "rent", "broke", "budget", "expenses"],
  career_confusion: ["career", "job direction", "confused about work", "what should i do"],
  new_job_stress: ["new job", "manager", "first week", "probation"],
  business_confusion: ["business", "startup", "service", "clients", "entrepreneur"],
  sleep_issues: ["can't sleep", "insomnia", "sleep", "waking up tired"],
  discipline_issues: ["procrastinate", "inconsistent", "discipline", "motivation"],
  burnout: ["burnout", "drained", "exhausted", "tired of trying"],
  general_support: [],
};

const ROOT_CAUSE_PATTERNS: Record<string, string[]> = {
  fear_of_failure: ["fear of failure", "what if i fail", "afraid to fail"],
  lack_of_clarity: ["unclear", "confused", "don't know", "stuck", "future feels unclear", "no direction"],
  low_self_trust: ["doubt myself", "not confident", "can't trust myself"],
  resource_pressure: ["no money", "budget", "rent", "debt", "expenses"],
  social_disconnection: ["alone", "lonely", "isolated", "nobody"],
  family_pressure: ["parents", "family pressure", "expectations"],
  perfectionism: ["perfect", "not ready", "not good enough yet"],
  workload_overload: ["too much work", "overloaded", "too many tasks"],
  sleep_deprivation: ["can't sleep", "insomnia", "waking up tired"],
};

const DOMAIN_QUOTES: Record<Domain, { quote: string; author: string }[]> = {
  sadness: [{ quote: "The wound is the place where light enters you.", author: "Rumi" }],
  loneliness: [{ quote: "The opposite of love is not hate, it's indifference.", author: "Elie Wiesel" }],
  heartbreak: [{ quote: "Out of suffering have emerged the strongest souls.", author: "Khalil Gibran" }],
  anxiety: [{ quote: "We suffer more in imagination than in reality.", author: "Seneca" }],
  overthinking: [{ quote: "A man who suffers before it is necessary suffers more than needed.", author: "Seneca" }],
  self_doubt: [{ quote: "The privilege of a lifetime is to become who you truly are.", author: "Carl Jung" }],
  financial_stress: [{ quote: "Luck is what happens when preparation meets opportunity.", author: "Seneca" }],
  career_confusion: [{ quote: "Do not confuse motion and progress.", author: "Alfred A. Montapert" }],
  new_job_stress: [{ quote: "Courage is grace under pressure.", author: "Ernest Hemingway" }],
  business_confusion: [{ quote: "Done is better than perfect.", author: "Sheryl Sandberg" }],
  sleep_issues: [{ quote: "Rest and self-care are not luxuries.", author: "Audre Lorde" }],
  discipline_issues: [{ quote: "Excellence is a habit.", author: "Aristotle" }],
  burnout: [{ quote: "You can’t pour from an empty cup.", author: "Norm Kelly" }],
  general_support: [{ quote: "A journey of a thousand miles begins with a single step.", author: "Lao Tzu" }],
};

const DOMAIN_OPENERS: Record<Domain, string[]> = {
  sadness: ["This sounds like emotional heaviness, not laziness.", "You are carrying real sadness right now."],
  loneliness: ["This feels like disconnection more than just being alone.", "You sound unseen, and that hurts."],
  heartbreak: ["This is heartbreak pain, not just a bad mood.", "Your system is grieving a bond, not failing."],
  anxiety: ["Your nervous system sounds overloaded right now.", "This reads like anxiety pressure, not weakness."],
  overthinking: ["Your mind is looping because this matters deeply.", "You are trapped in analysis mode right now."],
  self_doubt: ["Your confidence is under attack, not your actual ability.", "This sounds like self-doubt talking louder than evidence."],
  financial_stress: ["This is financial pressure, and it is practical, not imaginary.", "Money stress is distorting your sense of safety."],
  career_confusion: ["This is direction fog, not failure.", "You need clarity through action, not more guessing."],
  new_job_stress: ["This is early-stage job stress, very common and manageable.", "You are adapting under pressure, not falling behind."],
  business_confusion: ["This is business uncertainty, not incompetence.", "You need market feedback, not more internal pressure."],
  sleep_issues: ["This sounds like a sleep-regulation issue, not just discipline.", "Your rest system is dysregulated right now."],
  discipline_issues: ["This is a consistency design problem, not a character flaw.", "Your system needs smaller wins, not harsher self-talk."],
  burnout: ["This is burnout signal, and your body is asking for recovery.", "You are depleted, and that must be respected."],
  general_support: ["Let's slow this down and make it workable.", "I hear you, and we can make this practical."],
};

const DOMAIN_CLOSINGS: Record<Domain, string[]> = {
  sadness: ["Be gentle tonight; your job is stability, not perfection.", "Today, reducing pain by 10% is enough."],
  loneliness: ["One meaningful reach-out is better than silent waiting.", "Connection grows through small repeated contact."],
  heartbreak: ["Protect your healing like a boundary, not a mood.", "Closure grows from distance plus structure."],
  anxiety: ["Calm first, decisions second.", "Ground your body before solving your life."],
  overthinking: ["Action will clear more fog than thinking.", "Choose movement over mental replay."],
  self_doubt: ["Build proof, don’t wait for confidence.", "Confidence follows evidence, not the other way around."],
  financial_stress: ["Stability first, ambition second.", "Predictable cash flow reduces emotional chaos."],
  career_confusion: ["Direction comes from experiments, not overplanning.", "Pick one path for 2 weeks and test it."],
  new_job_stress: ["Visibility and consistency beat perfection.", "Ask, align, execute, repeat."],
  business_confusion: ["Sell one simple thing before scaling complexity.", "Real customer feedback is your compass."],
  sleep_issues: ["Protect tonight’s wind-down like a meeting.", "Sleep rhythm is built by repetition."],
  discipline_issues: ["Make it smaller until it becomes automatic.", "Consistency beats intensity every time."],
  burnout: ["Recovery is the work right now.", "Protect energy before adding effort."],
  general_support: ["One small honest step is enough for now.", "Start simple and stay consistent."],
};

const ADVICE_BANK: Record<Domain, string[]> = {
  sadness: [
    "Name the feeling and the unmet need in one line each.",
    "Pick one soft stabilizer: sunlight, warm shower, or 10-minute walk.",
    "Tell one trusted person you are having a low-energy day.",
  ],
  loneliness: [
    "Send one low-pressure message to someone safe.",
    "Join one recurring group where contact is predictable.",
    "Replace one hour of passive scrolling with an active social action.",
  ],
  heartbreak: [
    "Use a strict 7-day no-contact rule to protect healing.",
    "Write what the relationship gave you and what it cost you.",
    "Return to body regulation before meaning-making: sleep, food, movement.",
  ],
  anxiety: [
    "Write facts vs fears in two columns and act only on facts.",
    "Do one 4-6 breathing cycle for 3 minutes before decisions.",
    "Shrink the horizon: solve only the next 24 hours.",
  ],
  overthinking: [
    "Set a 10-minute decision timer and choose the smallest reversible step.",
    "Create two options max, then choose one.",
    "Move your body for 8 minutes before revisiting the thought loop.",
  ],
  self_doubt: [
    "Create an evidence log: 3 wins + 1 next courageous action.",
    "Replace 'Can I?' with 'What proof can I create this week?'",
    "Ask one mentor-quality question to a credible person.",
  ],
  financial_stress: [
    "Create a 14-day cash survival plan: essentials, one cut, one income action.",
    "Audit recurring expenses and remove one low-value payment today.",
    "Choose one low-risk income task and ship it within 48 hours.",
  ],
  career_confusion: [
    "Pick one role target, one skill gap, one weekly evidence action.",
    "Run 3 informational interviews with people in your target path.",
    "Choose direction by experiments, not by waiting for certainty.",
  ],
  new_job_stress: [
    "Clarify expectations with your manager in writing.",
    "Send concise progress updates every 2 days.",
    "Ask for one feedback point early and apply it quickly.",
  ],
  business_confusion: [
    "Start with one service offer deliverable in 7 days.",
    "Validate demand with 3 real customer conversations this week.",
    "Avoid product complexity until you confirm willingness to pay.",
  ],
  sleep_issues: [
    "Fix wake time first; bedtime follows naturally.",
    "No caffeine after lunch for 7 days.",
    "Use a 45-minute low-light, no-screen wind-down routine.",
  ],
  discipline_issues: [
    "Define one non-negotiable 20-minute focus block daily.",
    "Track completion, not motivation.",
    "Lower task size until consistency becomes automatic.",
  ],
  burnout: [
    "Cut one nonessential commitment this week.",
    "Protect one recovery block daily with no negotiation.",
    "Work in short cycles and schedule decompression deliberately.",
  ],
  general_support: [
    "Choose one hard thing and one kind thing to do today.",
    "Start with one clear, low-friction next step.",
    "Check sleep, food, movement before major conclusions.",
  ],
};

const QUICK_REPLIES_BY_DOMAIN: Record<Domain, string[]> = {
  sadness: ["Help me process this sadness", "Give me a 24-hour reset", "Ask me one deep question"],
  loneliness: ["How do I reconnect?", "Give me one social action", "Help for evening loneliness"],
  heartbreak: ["Help me heal after breakup", "I want closure", "How to stop checking old messages?"],
  anxiety: ["Help me calm anxiety now", "Give me a grounding routine", "Help with tomorrow's fear"],
  overthinking: ["Break my thought loop", "Help me decide quickly", "Give me a stop-overthinking method"],
  self_doubt: ["Build confidence practically", "Challenge my inner critic", "Evidence-based self-trust steps"],
  financial_stress: ["Make a 14-day money plan", "Reduce expenses", "Suggest low-risk income action"],
  career_confusion: ["Pick a career direction", "Plan next 30 days", "Choose skill to learn"],
  new_job_stress: ["Help with new job anxiety", "How to handle my manager?", "Plan first two weeks"],
  business_confusion: ["Suggest low-risk business model", "Get first client", "Validate idea quickly"],
  sleep_issues: ["Give sleep reset plan", "Night routine for overthinking", "Fix wake-up fatigue"],
  discipline_issues: ["Build strict routine", "Beat procrastination", "Consistency system"],
  burnout: ["Recover from burnout", "Create recovery week plan", "Set boundaries without guilt"],
  general_support: ["Ask what matters most", "Give a clear next step", "Help me reflect deeply"],
};

const SUGGESTIONS = [
  { label: "Start reflection journaling", href: "#healing", icon: "FileText" },
  { label: "Run a breathing reset", href: "#breathe", icon: "Wind" },
  { label: "Open growth journey", href: "#journey", icon: "Brain" },
];

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function unique<T>(arr: T[]): T[] {
  return [...new Set(arr)];
}

function matchesKeyword(text: string, keyword: string): boolean {
  if (keyword.includes(" ")) {
    return text.includes(keyword);
  }
  const escaped = keyword.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const regex = new RegExp(`\\b${escaped}\\b`, "i");
  return regex.test(text);
}

function createDefaultContext(sessionId: string): ConversationContext {
  return {
    sessionId,
    messages: [],
    emotionalPatterns: {
      dominantEmotions: [],
      recurringStruggles: [],
      repeatedPatterns: [],
      emotionalLoops: [],
      lastEmotionalState: "general_support",
    },
    behaviorMemory: {
      triggerKeywords: {},
      adviceTried: {},
      adviceFailed: [],
      recentAdviceIds: [],
      repeatedConcernCount: {},
      domainConfidence: {
        sadness: 0,
        loneliness: 0,
        heartbreak: 0,
        anxiety: 0,
        overthinking: 0,
        self_doubt: 0,
        financial_stress: 0,
        career_confusion: 0,
        new_job_stress: 0,
        business_confusion: 0,
        sleep_issues: 0,
        discipline_issues: 0,
        burnout: 0,
        general_support: 0,
      },
      providerQuality: {
        local: 1,
        gpt: 1,
        gemini: 1,
      },
    },
    userProfile: {
      preferences: { communicationStyle: "gentle", focusAreas: [] },
      goals: { shortTerm: [], longTerm: [] },
    },
    conversationStats: {
      totalMessages: 0,
      commonTopics: {},
      lastInteraction: new Date(),
    },
  };
}

class LumiEngine {
  constructor(private readonly ctx: ConversationContext) {}

  private normalize(text: string): string {
    return text.toLowerCase().trim();
  }

  private isGreeting(message: string): boolean {
    return GREETING_PATTERN.test(this.normalize(message));
  }

  private detectDomains(message: string): Domain[] {
    const text = this.normalize(message);
    const scores = Object.fromEntries(
      (Object.keys(DOMAIN_PATTERNS) as Domain[]).map((d) => [d, 0]),
    ) as Record<Domain, number>;
    const directMatches = new Set<Domain>();

    for (const [domain, words] of Object.entries(DOMAIN_PATTERNS) as [Domain, string[]][]) {
      for (const keyword of words) {
        if (matchesKeyword(text, keyword)) {
          scores[domain] += 1;
          directMatches.add(domain);
        }
      }
    }

    if (scores.discipline_issues > 0 && text.includes("tired")) scores.burnout += 1;
    if (scores.anxiety > 0 && text.includes("alone")) scores.loneliness += 1;
    if (scores.business_confusion > 0 && text.includes("fear")) scores.self_doubt += 1;

    // Only nudge domains already present in the message; avoid memory drift across emotions.
    for (const d of directMatches) {
      scores[d] += (this.ctx.behaviorMemory.domainConfidence[d] || 0) * 0.05;
    }

    const sorted = (Object.entries(scores) as [Domain, number][])
      .filter(([_, score]) => score > 0)
      .sort((a, b) => b[1] - a[1])
      .map(([domain]) => domain);

    return sorted.length ? sorted.slice(0, 3) : ["general_support"];
  }

  private detectRootCauses(message: string, domains: Domain[]): string[] {
    const text = this.normalize(message);
    const causes = new Set<string>();

    for (const [cause, keys] of Object.entries(ROOT_CAUSE_PATTERNS)) {
      if (keys.some((k) => matchesKeyword(text, k))) causes.add(cause);
    }

    if (domains.includes("financial_stress")) causes.add("resource_pressure");
    if (domains.includes("business_confusion")) {
      causes.add("lack_of_clarity");
      causes.add("fear_of_failure");
    }
    if (domains.includes("overthinking")) causes.add("perfectionism");
    if (domains.includes("burnout")) causes.add("workload_overload");
    if (domains.includes("sleep_issues")) causes.add("sleep_deprivation");
    if (domains.includes("self_doubt")) causes.add("low_self_trust");
    if (domains.includes("loneliness")) causes.add("social_disconnection");

    if (causes.size === 0) causes.add("general_support");
    return [...causes];
  }

  private updateLearning(message: string, domains: Domain[], causes: string[]) {
    const tokens = this.normalize(message).split(/\s+/).filter((w) => w.length > 3);
    for (const token of tokens) {
      this.ctx.behaviorMemory.triggerKeywords[token] =
        (this.ctx.behaviorMemory.triggerKeywords[token] || 0) + 1;
    }

    for (const d of domains) {
      this.ctx.behaviorMemory.domainConfidence[d] =
        (this.ctx.behaviorMemory.domainConfidence[d] || 0) + 1;
      if (!this.ctx.emotionalPatterns.dominantEmotions.includes(d)) {
        this.ctx.emotionalPatterns.dominantEmotions.push(d);
      } else if (!this.ctx.emotionalPatterns.repeatedPatterns.includes(d)) {
        this.ctx.emotionalPatterns.repeatedPatterns.push(d);
      }
    }

    for (const c of causes) {
      this.ctx.behaviorMemory.repeatedConcernCount[c] =
        (this.ctx.behaviorMemory.repeatedConcernCount[c] || 0) + 1;
      if (!this.ctx.emotionalPatterns.recurringStruggles.includes(c)) {
        this.ctx.emotionalPatterns.recurringStruggles.push(c);
      } else if (!this.ctx.emotionalPatterns.emotionalLoops.includes(c)) {
        this.ctx.emotionalPatterns.emotionalLoops.push(c);
      }
    }

    this.ctx.emotionalPatterns.lastEmotionalState = domains[0];
  }

  private decisionInsight(message: string, domains: Domain[]): string | null {
    const text = this.normalize(message);
    if (domains.includes("business_confusion")) {
      const lowBudget = /\b(no money|broke|low budget|can't afford|small budget)\b/i.test(text);
      const student = /\b(student|college|school)\b/i.test(text);
      const smallCity = /\b(small city|small town|remote area)\b/i.test(text);
      if (lowBudget || student || smallCity) {
        return "Given your constraints, start with a service-based model. It is lower risk, faster to validate, and more practical.";
      }
      return "Start lean: one paid offer, one segment, one measurable result before expansion.";
    }
    if (domains.includes("financial_stress")) {
      return "Prioritize cash stability first, then growth bets.";
    }
    return null;
  }

  private makeLayeredPlan(message: string): LayeredPlan {
    const domains = this.detectDomains(message);
    const rootCauses = this.detectRootCauses(message, domains);
    this.updateLearning(message, domains, rootCauses);
    return {
      domains,
      primaryDomain: domains[0],
      rootCauses,
      decisionInsight: this.decisionInsight(message, domains),
      patternFlags: this.ctx.emotionalPatterns.emotionalLoops.slice(-2),
      style: this.ctx.userProfile.preferences.communicationStyle,
    };
  }

  private selectAdvice(domain: Domain): string[] {
    const pool = ADVICE_BANK[domain] || ADVICE_BANK.general_support;
    const indices = pool.map((_, idx) => idx);
    const shuffled = indices.sort(() => Math.random() - 0.5);
    const selected = shuffled.slice(0, 3).map((idx) => pool[idx]);
    return selected;
  }

  private antiStaticRewrite(candidate: string): string {
    const assistantHistory = this.ctx.messages
      .filter((m) => m.role === "assistant")
      .slice(-4)
      .map((m) => m.content.toLowerCase());

    const normalized = candidate.toLowerCase();
    const tooSimilar = assistantHistory.some((prev) => this.similarityScore(prev, normalized) > 0.8);
    if (!tooSimilar) return candidate;

    return candidate
      .replace("Reply 1 — Emotional Reflection", "Reply 1 — Emotional Mirror")
      .replace("Reply 2 — Practical Strategy", "Reply 2 — Action Blueprint")
      .replace("Reply 3 — Philosophical Clarity", "Reply 3 — Perspective Anchor")
      .replace("Three anchors:", "Three perspective anchors:");
  }

  private similarityScore(a: string, b: string): number {
    const setA = new Set(a.split(/\W+/).filter(Boolean));
    const setB = new Set(b.split(/\W+/).filter(Boolean));
    if (!setA.size || !setB.size) return 0;
    let common = 0;
    for (const token of setA) {
      if (setB.has(token)) common += 1;
    }
    return common / Math.max(setA.size, setB.size);
  }

  private buildLocalResponse(plan: LayeredPlan): string {
    const domain = plan.primaryDomain;
    const opener = pick(DOMAIN_OPENERS[domain] || DOMAIN_OPENERS.general_support);
    const advice = this.selectAdvice(domain);
    const quote = pick(DOMAIN_QUOTES[domain] || DOMAIN_QUOTES.general_support);
    const closing = pick(DOMAIN_CLOSINGS[domain] || DOMAIN_CLOSINGS.general_support);
    const styleLead =
      plan.style === "direct"
        ? "Straight support"
        : plan.style === "detailed"
          ? "Support plan"
          : plan.style === "concise"
            ? "Clear support"
            : "Gentle support";

    const patternLine = plan.patternFlags.length
      ? `I notice this repeating pattern: ${plan.patternFlags.join(" and ")}. We should interrupt it this time.`
      : `Likely drivers: ${plan.rootCauses.slice(0, 2).join(", ")}.`;

    const lines = [
      `${styleLead}:`,
      opener,
      patternLine,
      "",
      "Try this now:",
      `1) ${advice[0]}`,
      `2) ${advice[1]}`,
      `3) ${advice[2]}`,
      plan.decisionInsight ? `Decision note: ${plan.decisionInsight}` : "",
      "",
      `Thought: "${quote.quote}" — ${quote.author}`,
      closing,
    ].filter(Boolean);

    return lines.join("\n");
  }

  private async providerSynthesis(plan: LayeredPlan, userMessage: string): Promise<{ provider: Provider; text: string }> {
    const gptKey = process.env.OPENAI_API_KEY;
    const geminiKey = process.env.GEMINI_API_KEY;
    const systemPrompt =
      "You are Lumi, an emotionally intelligent companion. Return exactly three sections: Emotional Reflection, Practical Strategy, Philosophical Clarity. Be specific, non-generic, and non-repetitive.";
    const payloadBrief = [
      `User message: ${userMessage}`,
      `Primary domain: ${plan.primaryDomain}`,
      `Root causes: ${plan.rootCauses.join(", ")}`,
      `Decision insight: ${plan.decisionInsight || "none"}`,
      `Repeated patterns: ${plan.patternFlags.join(", ") || "none"}`,
      `Communication style: ${plan.style}`,
    ].join("\n");

    const candidates: Array<{ provider: Provider; text: string }> = [];
    const local = this.buildLocalResponse(plan);
    candidates.push({ provider: "local", text: local });

    if (gptKey) {
      const gptText = await this.callOpenAI(systemPrompt, payloadBrief, gptKey);
      if (gptText) candidates.push({ provider: "gpt", text: gptText });
    }
    if (geminiKey) {
      const geminiText = await this.callGemini(systemPrompt, payloadBrief, geminiKey);
      if (geminiText) candidates.push({ provider: "gemini", text: geminiText });
    }

    let best = candidates[0];
    let bestScore = -Infinity;
    for (const candidate of candidates) {
      const score = this.scoreCandidate(candidate.text, candidate.provider);
      if (score > bestScore) {
        bestScore = score;
        best = candidate;
      }
    }
    this.ctx.behaviorMemory.providerQuality[best.provider] =
      (this.ctx.behaviorMemory.providerQuality[best.provider] || 1) + 0.2;
    return best;
  }

  private scoreCandidate(text: string, provider: Provider): number {
    const lenScore = Math.min(text.length / 1200, 1.2);
    const structureScore =
      Number(text.includes("Reply 1")) + Number(text.includes("Reply 2")) + Number(text.includes("Reply 3"));
    const repetitionPenalty = this.similarityScore(
      text.toLowerCase(),
      this.ctx.messages.filter((m) => m.role === "assistant").slice(-1)[0]?.content?.toLowerCase() || "",
    );
    const providerBias = this.ctx.behaviorMemory.providerQuality[provider] || 1;
    return lenScore + structureScore + providerBias - repetitionPenalty;
  }

  private async callOpenAI(systemPrompt: string, userPrompt: string, apiKey: string): Promise<string | null> {
    try {
      const ctrl = new AbortController();
      const timer = setTimeout(() => ctrl.abort(), 4500);
      const res = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: process.env.OPENAI_MODEL || "gpt-4o-mini",
          temperature: 0.7,
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: userPrompt },
          ],
        }),
        signal: ctrl.signal,
      });
      clearTimeout(timer);
      if (!res.ok) return null;
      const data = (await res.json()) as { choices?: Array<{ message?: { content?: string } }> };
      return data.choices?.[0]?.message?.content?.trim() || null;
    } catch {
      return null;
    }
  }

  private async callGemini(systemPrompt: string, userPrompt: string, apiKey: string): Promise<string | null> {
    try {
      const model = process.env.GEMINI_MODEL || "gemini-1.5-flash";
      const ctrl = new AbortController();
      const timer = setTimeout(() => ctrl.abort(), 4500);
      const res = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [{ parts: [{ text: `${systemPrompt}\n\n${userPrompt}` }] }],
            generationConfig: { temperature: 0.7 },
          }),
          signal: ctrl.signal,
        },
      );
      clearTimeout(timer);
      if (!res.ok) return null;
      const data = (await res.json()) as {
        candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>;
      };
      return data.candidates?.[0]?.content?.parts?.map((p) => p.text || "").join("").trim() || null;
    } catch {
      return null;
    }
  }

  private greetingMessage(): string {
    return [
      "I am Lumi — your emotionally intelligent mentor-companion for difficult emotions and practical life decisions.",
      "I reason through your message in layers: emotion, root causes, repeated patterns, and practical decision strategy.",
      "I can dynamically synthesize replies with local intelligence and optional GPT/Gemini modules when configured.",
      "Share what feels heavy right now, and I will respond with depth and clear action.",
    ].join("\n\n");
  }

  async generate(message: string): Promise<z.infer<typeof ChatResponseSchema>> {
    if (this.isGreeting(message)) {
      return {
        message: this.greetingMessage(),
        suggestions: [{ label: "Start reflection journey", href: "#journey", icon: "Sun" }],
        quickReplies: ["I'm feeling anxious and stuck", "I'm confused about career", "I feel lonely lately"],
        followUpQuestions: ["What has been weighing on you most this week?"],
        emotionalInsight: "Lumi is active with adaptive memory, multi-layer reasoning, and dynamic response synthesis.",
        emotionalStates: ["general_support"],
        rootProblems: ["trust_building"],
      };
    }

    const plan = this.makeLayeredPlan(message);
    const synthesized = await this.providerSynthesis(plan, message);
    const finalText = this.antiStaticRewrite(synthesized.text);

    return {
      message: finalText,
      suggestions: SUGGESTIONS,
      quickReplies: QUICK_REPLIES_BY_DOMAIN[plan.primaryDomain],
      followUpQuestions: [
        "Which is hardest right now: feeling, decision, or consistency?",
        "What have you already tried that failed?",
        "What real constraint must this plan respect?",
      ],
      emotionalInsight: `Signals: ${plan.domains.map((d) => d.replaceAll("_", " ")).join(" + ")}. Drivers: ${plan.rootCauses.join(", ")}. Engine: ${synthesized.provider}.`,
      emotionalStates: plan.domains,
      rootProblems: plan.rootCauses,
    };
  }
}

router.post("/chat", async (req: Request, res: Response) => {
  try {
    const validated = ChatRequestSchema.parse(req.body);
    const sessionId = ((req.session as { id?: string } | undefined)?.id || "anonymous").toString();
    const { message, context } = validated;

    const loaded = cache.get(sessionId) || loadChatContext<ConversationContext>(sessionId) || createDefaultContext(sessionId);
    if (context?.communicationStyle) loaded.userProfile.preferences.communicationStyle = context.communicationStyle;
    if (context?.userGoals?.length) {
      loaded.userProfile.goals.shortTerm = unique([...loaded.userProfile.goals.shortTerm, ...context.userGoals]).slice(-12);
    }

    loaded.messages.push({
      id: `user_${Date.now()}`,
      role: "user",
      content: message,
      timestamp: new Date(),
    });

    const engine = new LumiEngine(loaded);
    const result = await engine.generate(message);

    loaded.messages.push({
      id: `assistant_${Date.now()}`,
      role: "assistant",
      content: result.message,
      timestamp: new Date(),
      emotionalStates: result.emotionalStates,
      rootProblems: result.rootProblems,
    });

    loaded.conversationStats.totalMessages += 1;
    loaded.conversationStats.lastInteraction = new Date();
    for (const d of result.emotionalStates || []) {
      loaded.conversationStats.commonTopics[d] = (loaded.conversationStats.commonTopics[d] || 0) + 1;
    }

    cache.set(sessionId, loaded);
    saveChatContext(sessionId, loaded);
    res.json(ChatResponseSchema.parse(result));
  } catch (error) {
    console.error("Lumi chat error:", error);
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: "Invalid request", details: error.errors });
      return;
    }
    res.status(500).json({
      error: "Internal server error",
      message: "Lumi could not process this message. Please try again.",
    });
  }
});

export default router;
