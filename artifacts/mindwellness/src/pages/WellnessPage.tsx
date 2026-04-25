import { Heart } from "lucide-react";
import { PageShell } from "@/components/layout/PageShell";
import { WellnessCheck } from "@/components/sections/WellnessCheck";

export default function WellnessPage() {
  return (
    <PageShell
      title="Mood Check-In"
      subtitle="Five gentle questions to understand how you're feeling today."
      number="01"
      color="bg-blue-500"
      icon={Heart}
    >
      <WellnessCheck />
    </PageShell>
  );
}
