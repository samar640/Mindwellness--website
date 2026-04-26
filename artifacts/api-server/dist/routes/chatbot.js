import { Router } from "express";
import { z } from "zod";
const router = Router();
// In-memory conversation storage (in production, use Redis or database)
const conversationStore = new Map();
// Track recently used responses to avoid repetition
const responseHistory = new Map([]);
// Helper function to get random item from array
const pickRandom = (arr) => arr[Math.floor(Math.random() * arr.length)];
// Helper function to pick from array, avoiding recent repeats
const pickVaried = (arr, sessionId, type) => {
    if (arr.length <= 1)
        return arr[0];
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
    if (recent.length > 3)
        recent.shift();
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
// Advanced response generation system
class LumiResponseGenerator {
    context;
    sessionId;
    constructor(context, sessionId) {
        this.context = context;
        this.sessionId = sessionId;
    }
    // Step 1: Understand emotional state
    analyzeEmotionalState(message) {
        const lowerMessage = message.toLowerCase();
        for (const [emotion, pattern] of Object.entries(EMOTIONAL_PATTERNS)) {
            if (pattern.indicators.some(indicator => lowerMessage.includes(indicator))) {
                return emotion;
            }
        }
        // Detect complex emotions
        if (lowerMessage.includes("stuck") && lowerMessage.includes("change")) {
            return "confusion_transition";
        }
        if (lowerMessage.includes("tired") && lowerMessage.includes("everything")) {
            return "existential_fatigue";
        }
        return "neutral";
    }
    // Step 2: Identify root problem
    identifyRootProblem(message, emotionalState) {
        const problems = [];
        const lowerMessage = message.toLowerCase();
        if (emotionalState === "sadness" || emotionalState === "loneliness") {
            if (lowerMessage.includes("alone") || lowerMessage.includes("lonely") || lowerMessage.includes("isolated")) {
                problems.push("social_connection");
            }
            if (lowerMessage.includes("purpose") || lowerMessage.includes("meaning") || lowerMessage.includes("direction")) {
                problems.push("life_purpose");
            }
            if (lowerMessage.includes("fail") || lowerMessage.includes("worthless") || lowerMessage.includes("not good enough")) {
                problems.push("self_worth");
            }
        }
        if (emotionalState === "anxiety" || emotionalState === "fear") {
            if (lowerMessage.includes("future") || lowerMessage.includes("what if") || lowerMessage.includes("uncertain")) {
                problems.push("future_uncertainty");
            }
            if (lowerMessage.includes("work") || lowerMessage.includes("job") || lowerMessage.includes("career")) {
                problems.push("career_pressure");
            }
            if (lowerMessage.includes("health") || lowerMessage.includes("sick") || lowerMessage.includes("illness")) {
                problems.push("health_concerns");
            }
        }
        if (emotionalState === "anger") {
            if (lowerMessage.includes("unfair") || lowerMessage.includes("injustice") || lowerMessage.includes("wronged")) {
                problems.push("perceived_injustice");
            }
            if (lowerMessage.includes("relationship") || lowerMessage.includes("partner") || lowerMessage.includes("friend")) {
                problems.push("relationship_issues");
            }
        }
        return problems.length > 0 ? problems : ["general_support"];
    }
    // Step 3: Validate feelings with variety
    validateFeelings(emotionalState) {
        const pattern = EMOTIONAL_PATTERNS[emotionalState];
        if (pattern && pattern.validations) {
            return pickVaried(pattern.validations, this.sessionId, "validations");
        }
        return "Your feelings are valid and worthy of attention.";
    }
    // Step 4: Provide practical action steps (with variety)
    generatePracticalSteps(rootProblems, emotionalState) {
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
            general_support: [
                "Take three slow breaths, noticing the sensation of air entering and leaving your body",
                "Write down one thing you're grateful for, no matter how small",
                "Do one small act of self-care that feels manageable right now",
            ],
        };
        const steps = [];
        for (const problem of rootProblems) {
            const pool = actionPool[problem] || actionPool.general_support;
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
    suggestLongTermStrategy(rootProblems, emotionalState) {
        const strategies = {
            social_connection: "Building meaningful connections takes time. Consider joining a club or group based on your interests, or reaching out to old friends. Start with low-pressure interactions and build from there.",
            life_purpose: "Finding purpose often comes from exploring what truly matters to you. Try the 'Ikigai' framework: what you love, what you're good at, what the world needs, and what you can be paid for.",
            self_worth: "Self-worth grows through small, consistent acts of self-compassion and achievement. Consider keeping a 'wins journal' and practicing daily gratitude for your own efforts.",
            future_uncertainty: "Building resilience to uncertainty involves both practical planning and emotional acceptance. Create contingency plans for your biggest fears while practicing mindfulness.",
            career_pressure: "Career satisfaction often comes from aligning your work with your values. Consider what aspects of your job energize you and what drains you, then explore ways to increase the energizing parts.",
            health_concerns: "Taking charge of your health involves both prevention and early intervention. Build healthy habits gradually and stay informed about your health needs.",
            perceived_injustice: "Addressing injustice requires both inner work and outer action. Focus on what you can influence while protecting your peace of mind.",
            relationship_issues: "Healthy relationships require clear communication and boundaries. Consider what you need and how to express it effectively.",
        };
        const primaryProblem = rootProblems[0];
        return strategies[primaryProblem] ||
            "Long-term growth comes from consistent small actions. Consider establishing one or two daily practices that support your well-being.";
    }
    // Step 6: End with calm clarity (varied)
    generateClosing(emotionalState) {
        const pattern = EMOTIONAL_PATTERNS[emotionalState];
        if (pattern && pattern.closings) {
            return pickVaried(pattern.closings, this.sessionId, "closings");
        }
        return "Remember: growth happens in the space between struggle and surrender. You've got this.";
    }
    // Generate wisdom quote based on context
    selectWisdomQuote(emotionalState) {
        const quotes = WISDOM_LIBRARY[emotionalState];
        if (quotes && quotes.length > 0) {
            return quotes[Math.floor(Math.random() * quotes.length)];
        }
        return null;
    }
    // Main response generation method
    generateResponse(message) {
        // Analyze the message
        const emotionalState = this.analyzeEmotionalState(message);
        const rootProblems = this.identifyRootProblem(message, emotionalState);
        // Update context with new analysis
        this.context.emotionalPatterns.lastEmotionalState = emotionalState;
        if (!this.context.emotionalPatterns.dominantEmotions.includes(emotionalState)) {
            this.context.emotionalPatterns.dominantEmotions.push(emotionalState);
        }
        // Build response using structured approach
        let responseText = "";
        // Start with validation
        responseText += `**${this.validateFeelings(emotionalState)}**\n\n`;
        // Add practical steps
        const practicalSteps = this.generatePracticalSteps(rootProblems, emotionalState);
        if (practicalSteps.length > 0) {
            responseText += "**Here's what you can do right now:**\n";
            practicalSteps.forEach((step, index) => {
                responseText += `• ${step}\n`;
            });
            responseText += "\n";
        }
        // Add targeted wisdom quote with explanation
        const wisdom = this.selectWisdomQuote(emotionalState);
        if (wisdom) {
            responseText += `💭 **"${wisdom.quote}"**\n— *${wisdom.author}*\n\n`;
            responseText += `**What this means:** ${wisdom.explanation}\n\n`;
        }
        // Add long-term strategy
        responseText += `**For the longer term:** ${this.suggestLongTermStrategy(rootProblems, emotionalState)}\n\n`;
        // End with closing
        responseText += `**${this.generateClosing(emotionalState)}**`;
        // Generate suggestions and follow-ups
        const suggestions = this.generateSuggestions(rootProblems, emotionalState);
        const followUpQuestions = this.generateFollowUpQuestions(rootProblems, emotionalState);
        return {
            message: responseText,
            suggestions,
            quickReplies: followUpQuestions,
            emotionalInsight: `I sense you're experiencing **${emotionalState}** related to ${rootProblems.join(" and ")}. This is a normal part of being human.`,
        };
    }
    generateSuggestions(rootProblems, emotionalState) {
        const suggestions = [];
        if (rootProblems.includes("social_connection")) {
            suggestions.push({ label: "Explore connection practices", href: "#healing", icon: "Heart" });
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
    generateFollowUpQuestions(rootProblems, emotionalState) {
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
        const emotionQuestions = questionPool[emotionalState] || questionPool.general;
        questions.push(pickRandom(emotionQuestions));
        // Get problem-specific questions
        for (const problem of rootProblems) {
            const pool = questionPool[problem];
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
router.post("/chat", async (req, res) => {
    try {
        // Validate request
        const validatedData = ChatRequestSchema.parse(req.body);
        const { message, context } = validatedData;
        // Get or create conversation context
        const sessionId = req.session.id || "anonymous";
        let conversationContext = conversationStore.get(sessionId);
        if (!conversationContext) {
            conversationContext = {
                sessionId,
                messages: [],
                emotionalPatterns: {
                    dominantEmotions: [],
                    recurringStruggles: [],
                    progressAreas: [],
                    lastEmotionalState: "",
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
        });
        // Update conversation stats
        conversationContext.conversationStats.totalMessages++;
        conversationContext.conversationStats.lastInteraction = new Date();
        // Validate response
        const validatedResponse = ChatResponseSchema.parse(response);
        res.json(validatedResponse);
    }
    catch (error) {
        console.error("Chatbot error:", error);
        if (error instanceof z.ZodError) {
            res.status(400).json({
                error: "Invalid request data",
                details: error.errors,
            });
        }
        else {
            res.status(500).json({
                error: "Internal server error",
                message: "Something went wrong while processing your message.",
            });
        }
    }
});
export default router;
