import { motion } from "framer-motion";
import { useLocation } from "wouter";
import { Heart, Apple, Home as HomeIcon, Brain, Sun, LayoutDashboard } from "lucide-react";

type DockItem = {
  label: string;
  icon: React.ElementType;
  href: string;
  gradient: string;
};

const DOCK_ITEMS: DockItem[] = [
  { label: "Home",     icon: HomeIcon,        href: "/",          gradient: "from-slate-500 to-slate-700" },
  { label: "Today",    icon: LayoutDashboard, href: "/dashboard", gradient: "from-blue-500 to-blue-700" },
  { label: "Journey",  icon: Sun,             href: "/journey",   gradient: "from-blue-500 to-indigo-600" },
  { label: "Mood",     icon: Heart,           href: "/wellness",  gradient: "from-sky-400 to-blue-600" },
  { label: "Healing",  icon: Brain,           href: "/healing",   gradient: "from-violet-400 to-blue-600" },
  { label: "Diet",     icon: Apple,           href: "/diet",      gradient: "from-rose-400 to-red-600" },
];

export function BottomDock() {
  const [location, navigate] = useLocation();

  const handleClick = (item: DockItem) => {
    navigate(item.href);
  };

  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 pointer-events-none">
      {/* Soft gradient fade behind dock */}
      <div className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-background via-background/80 to-transparent pointer-events-none" />

      <motion.div
        initial={{ y: 80, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.3, duration: 0.5, ease: [0.23, 1, 0.32, 1] }}
        className="relative max-w-4xl mx-auto px-3 pb-3 sm:pb-4 pointer-events-auto"
      >
        <div
          className="bg-white/70 rounded-[24px] border border-white/65 border-t border-t-black/10 shadow-lg px-2.5 sm:px-3 py-2.5 sm:py-3 grid grid-cols-4 sm:grid-cols-6 gap-2 sm:gap-2.5"
          style={{
            backdropFilter: "blur(8px)",
            boxShadow: "0 -1px 0 rgba(15,23,42,0.08) inset, 0 14px 32px rgba(2,6,23,0.18)",
          }}
        >
          {DOCK_ITEMS.map((item, i) => {
            const Icon = item.icon;
            const isActive = item.href === location;

            return (
              <motion.button
                key={item.label}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.35 + i * 0.04, duration: 0.3 }}
                whileHover={{ y: -3, scale: 1.03 }}
                whileTap={{ scale: 0.92 }}
                onClick={() => handleClick(item)}
                className="group relative flex flex-col items-center justify-center gap-1.5 w-full py-2 px-1 rounded-2xl transition-colors"
              >
                {/* Icon tile */}
                <div className="relative">
                  <div
                    className={`w-10 h-10 sm:w-12 sm:h-12 rounded-2xl bg-gradient-to-br ${item.gradient}
                      flex items-center justify-center shadow-md
                      ${isActive ? "ring-2 ring-offset-2 ring-offset-white/80 ring-primary/70 shadow-lg" : ""}
                      transition-all duration-300`}
                  >
                    <Icon className={`w-[18px] h-[18px] sm:w-[22px] sm:h-[22px] text-white ${isActive ? "scale-110" : ""}`} strokeWidth={2.3} />
                  </div>
                </div>

                {/* Label */}
                <span className={`text-[10px] sm:text-[11px] font-semibold leading-none transition-colors ${
                  isActive ? "text-primary" : "text-foreground/70 group-hover:text-foreground"
                }`}>
                  {item.label}
                </span>

                {/* Active indicator dot under icon */}
                {isActive && (
                  <motion.div
                    layoutId="dock-active-dot"
                    className="w-1.5 h-1.5 rounded-full bg-primary"
                    transition={{ type: "spring", stiffness: 380, damping: 30 }}
                  />
                )}
              </motion.button>
            );
          })}
        </div>
      </motion.div>
    </div>
  );
}
