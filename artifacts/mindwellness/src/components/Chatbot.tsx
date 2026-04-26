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

type ChatResponse = {
  message: string;
  suggestions?: { label: string; href: string; icon?: string }[];
  quickReplies?: string[];
  emotionalInsight?: string;
  emotionalStates?: string[];
  rootProblems?: string[];
  followUpQuestions?: string[];
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

const API_BASE = import.meta.env.VITE_API_URL
  ? `${import.meta.env.VITE_API_URL.replace(/\/$/, "")}/api`
  : "/api";

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

// API call to backend
const sendMessageToAPI = async (message: string, context?: any): Promise<ChatResponse> => {
  try {
    const apiEndpoint = `${API_BASE}/chat`;
    const response = await fetch(apiEndpoint, {
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

const resolveRoute = (href: string): string => {
  if (href.startsWith("/")) return href;
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
  return HASH_TO_ROUTE[href] || "/";
};

// Icon mapping for suggestions
const getIconComponent = (iconName?: string): React.ElementType | undefined => {
  const iconMap: Record<string, React.ElementType> = {
    Heart,
    Wind,
    Activity,
    BookOpen,
    FileText,
    Sun,
    CheckSquare,
    Brain,
    Droplets,
    LineIcon,
  };
  return iconName ? iconMap[iconName] : undefined;
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

  const send = async (text: string) => {
    if (!text.trim()) return;
    const userMsg: Message = { id: Date.now(), from: "user", text: text.trim(), time: formatTime() };
    setMessages(prev => [...prev, userMsg]);
    setInput("");
    setTyping(true);

    try {
      const reply = await generateReply(text);
      const botMsg: Message = {
        id: Date.now() + 1,
        from: "bot",
        time: formatTime(),
        ...reply,
      };
      setMessages(prev => [...prev, botMsg]);
    } catch (error) {
      console.error("Error generating reply:", error);
      const fallbackReply = generateFallbackReply(text);
      const botMsg: Message = {
        id: Date.now() + 1,
        from: "bot",
        time: formatTime(),
        ...fallbackReply,
      };
      setMessages(prev => [...prev, botMsg]);
    } finally {
      setTyping(false);
    }
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

                    {/* Emotional insight */}
                    {msg.emotionalInsight && (
                      <div className="px-3 py-2 rounded-lg bg-blue-50 border border-blue-200 text-blue-800 text-xs">
                        💭 {msg.emotionalInsight}
                      </div>
                    )}

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
                  disabled={!input.trim() || typing}
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