import { Wind } from "lucide-react";
import { PageShell } from "@/components/layout/PageShell";
import { Breathe } from "@/components/sections/Breathe";

export default function BreathePage() {
  return (
    <PageShell
      title="Breathing"
      subtitle="A guided session to slow your mind and ease tension."
      number="02"
      color="bg-sky-500"
      icon={Wind}
    >
      <Breathe />
    </PageShell>
  );
}
