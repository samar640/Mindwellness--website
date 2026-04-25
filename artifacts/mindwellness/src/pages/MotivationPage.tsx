import { Quote } from "lucide-react";
import { PageShell } from "@/components/layout/PageShell";
import { Motivation } from "@/components/sections/Motivation";

export default function MotivationPage() {
  return (
    <PageShell
      title="Daily Motivation"
      subtitle="Words from great minds to remind you of your strength."
      number="06"
      color="bg-violet-500"
      icon={Quote}
    >
      <Motivation />
    </PageShell>
  );
}
