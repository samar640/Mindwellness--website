import { CheckSquare } from "lucide-react";
import { PageShell } from "@/components/layout/PageShell";
import { TodoList } from "@/components/sections/TodoList";

export default function TodoPage() {
  return (
    <PageShell
      title="Daily To-Do"
      subtitle="Capture what matters today. Small wins, steady progress."
      number="04"
      color="bg-teal-500"
      icon={CheckSquare}
    >
      <TodoList />
    </PageShell>
  );
}
