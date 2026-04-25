import { motion } from "framer-motion";
import { Navbar } from "@/components/layout/Navbar";
import { BottomDock } from "@/components/layout/BottomDock";
import { Chatbot } from "@/components/Chatbot";
import { Link } from "wouter";

type Props = {
  title: string;
  subtitle?: string;
  number?: string;
  color?: string;
  icon?: React.ElementType;
  children: React.ReactNode;
};

export function PageShell({ title, subtitle, number, color = "bg-primary", icon: Icon, children }: Props) {
  return (
    <main className="min-h-screen bg-background flex flex-col">
      <Navbar />

      <div className="pt-28 pb-52 flex-1">
        {/* Page header */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, ease: [0.23, 1, 0.32, 1] }}
          className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center mb-10"
        >
          <Link href="/" className="inline-flex items-center gap-1.5 text-xs uppercase tracking-[0.2em] text-muted-foreground hover:text-primary mb-4 transition-colors">
            <span>← Home</span>
          </Link>

          <div className="flex items-center justify-center gap-3 mb-3">
            {number && (
              <span className="text-xs font-bold tracking-[0.25em] text-primary">{number}</span>
            )}
            {Icon && (
              <span className={`w-10 h-10 rounded-2xl ${color} flex items-center justify-center shadow-md`}>
                <Icon className="w-5 h-5 text-white" strokeWidth={2.3} />
              </span>
            )}
          </div>

          <h1 className="text-3xl md:text-5xl font-display font-medium text-foreground leading-tight">
            {title}
          </h1>
          {subtitle && (
            <p className="text-base md:text-lg text-muted-foreground mt-3 max-w-2xl mx-auto leading-relaxed">
              {subtitle}
            </p>
          )}
        </motion.div>

        {/* Section content */}
        <div>
          {children}
        </div>
      </div>

      <BottomDock />
      <Chatbot />
    </main>
  );
}
