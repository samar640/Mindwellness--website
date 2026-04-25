import { useState } from "react";
import { useLocalStorage } from "@/hooks/use-local-storage";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Check, Plus, Trash2, ListTodo } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface Task {
  id: string;
  text: string;
  completed: boolean;
}

export function TodoList() {
  const [tasks, setTasks] = useLocalStorage<Task[]>("mw-tasks", []);
  const [newTask, setNewTask] = useState("");

  const addTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTask.trim()) return;
    setTasks([{ id: Date.now().toString(), text: newTask.trim(), completed: false }, ...tasks]);
    setNewTask("");
  };

  const toggleTask = (id: string) => {
    setTasks(tasks.map(t => t.id === id ? { ...t, completed: !t.completed } : t));
  };

  const deleteTask = (id: string) => {
    setTasks(tasks.filter(t => t.id !== id));
  };

  const completedCount = tasks.filter(t => t.completed).length;

  return (
    <section id="todo" className="py-24 bg-primary/5 relative">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-primary/10 mb-4">
            <ListTodo className="w-6 h-6 text-primary" />
          </div>
          <h2 className="text-4xl font-display font-medium mb-4">Clear Your Mind</h2>
          <p className="text-lg text-muted-foreground text-balance">
            Offload your thoughts. Writing down tasks reduces cognitive load and creates space for peace.
          </p>
        </div>

        <Card className="shadow-xl border-0 bg-white/80">
          <div className="p-8 border-b border-border/50">
            <form onSubmit={addTask} className="flex gap-3">
              <Input
                value={newTask}
                onChange={(e) => setNewTask(e.target.value)}
                placeholder="What's on your mind today?"
                className="h-14 text-lg rounded-2xl bg-secondary/30 border-transparent focus:bg-white focus:border-primary/30"
              />
              <Button type="submit" size="icon" className="h-14 w-14 rounded-2xl flex-shrink-0">
                <Plus className="w-6 h-6" />
              </Button>
            </form>
          </div>
          
          <div className="p-4 bg-secondary/10 flex justify-between items-center text-sm text-muted-foreground px-8">
            <span>{tasks.length} {tasks.length === 1 ? 'task' : 'tasks'} total</span>
            {tasks.length > 0 && <span>{completedCount} completed</span>}
          </div>

          <div className="p-4 md:p-8 max-h-[400px] overflow-y-auto">
            {tasks.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <p>Your mind is clear. Add a task when you're ready.</p>
              </div>
            ) : (
              <ul className="space-y-3">
                <AnimatePresence>
                  {tasks.map(task => (
                    <motion.li
                      key={task.id}
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, height: 0, marginBottom: 0 }}
                      className="flex items-center gap-4 p-4 rounded-2xl bg-white border border-border shadow-sm group hover:shadow-md transition-all"
                    >
                      <button
                        onClick={() => toggleTask(task.id)}
                        className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors flex-shrink-0 ${
                          task.completed 
                            ? "bg-primary border-primary text-primary-foreground" 
                            : "border-muted-foreground/30 hover:border-primary"
                        }`}
                      >
                        {task.completed && <Check className="w-3.5 h-3.5" />}
                      </button>
                      
                      <span className={`flex-1 text-lg transition-all ${task.completed ? "text-muted-foreground line-through" : "text-foreground"}`}>
                        {task.text}
                      </span>
                      
                      <button
                        onClick={() => deleteTask(task.id)}
                        className="opacity-0 group-hover:opacity-100 p-2 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-xl transition-all"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </motion.li>
                  ))}
                </AnimatePresence>
              </ul>
            )}
          </div>
        </Card>
      </div>
    </section>
  );
}
