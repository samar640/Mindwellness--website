import { BookOpen } from "lucide-react";
import { PageShell } from "@/components/layout/PageShell";
import { Books } from "@/components/sections/Books";

export default function BooksPage() {
  return (
    <PageShell
      title="Books that Heal"
      subtitle="Fifteen handpicked reads to nourish your mind, calm your nerves, and grow your spirit."
      number="05"
      color="bg-amber-500"
      icon={BookOpen}
    >
      <Books />
    </PageShell>
  );
}
