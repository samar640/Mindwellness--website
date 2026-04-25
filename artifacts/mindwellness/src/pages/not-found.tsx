import { Button } from "@/components/ui/button";
import { Link } from "wouter";

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="text-center">
        <h1 className="text-6xl font-display font-medium text-primary mb-4">404</h1>
        <h2 className="text-2xl font-medium text-foreground mb-4">Page not found</h2>
        <p className="text-muted-foreground mb-8">
          The path you are looking for seems to have wandered off.
        </p>
        <Link href="/" className="inline-flex items-center justify-center whitespace-nowrap rounded-full text-sm font-medium transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 active:scale-[0.98] bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-6 py-2 shadow-sm">
          Return Home
        </Link>
      </div>
    </div>
  );
}
