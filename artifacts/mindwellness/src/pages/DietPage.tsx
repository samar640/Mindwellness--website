import { Apple } from "lucide-react";
import { PageShell } from "@/components/layout/PageShell";
import { BmiCalculator } from "@/components/sections/BmiCalculator";
import { WaterIntake } from "@/components/sections/WaterIntake";

export default function DietPage() {
  return (
    <PageShell
      title="Diet & Hydration"
      subtitle="Know your body — calculate your BMI and your daily water needs in one place."
      number="03"
      color="bg-rose-500"
      icon={Apple}
    >
      <BmiCalculator />
      <div className="my-12 max-w-4xl mx-auto px-4">
        <div className="h-px bg-gradient-to-r from-transparent via-black/10 to-transparent" />
      </div>
      <WaterIntake />
    </PageShell>
  );
}
