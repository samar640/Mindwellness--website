import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Quote } from "lucide-react";
import { Button } from "@/components/ui/button";

const QUOTES = [
  {
    name: "Muhammad Ali",
    role: "Athlete & Activist",
    quote: "Float like a butterfly, sting like a bee. Impossible is just a big word thrown around by small men.",
    color: "bg-gradient-to-br from-red-600 to-orange-500"
  },
  {
    name: "Mike Tyson",
    role: "Boxing Champion",
    quote: "Everyone has a plan until they get punched in the mouth. Discipline is doing what you hate to do but doing it like you love it.",
    color: "bg-gradient-to-br from-blue-900 to-blue-500"
  },
  {
    name: "Michael Jackson",
    role: "Artist & Visionary",
    quote: "In a world filled with hate, we must still dare to hope. The greatest education in the world is watching the masters at work.",
    color: "bg-gradient-to-br from-purple-800 to-violet-500"
  },
  {
    name: "Elvis Presley",
    role: "Cultural Icon",
    quote: "Truth is like the sun. You can shut it out for a time, but it ain't going away.",
    color: "bg-gradient-to-br from-amber-500 to-yellow-400"
  },
  {
    name: "Nelson Mandela",
    role: "Statesman & Activist",
    quote: "It always seems impossible until it's done.",
    color: "bg-gradient-to-br from-sky-700 to-blue-500"
  },
  {
    name: "Albert Einstein",
    role: "Theoretical Physicist",
    quote: "Imagination is more important than knowledge.",
    color: "bg-gradient-to-br from-teal-800 to-cyan-500"
  },
  {
    name: "Oprah Winfrey",
    role: "Media Icon & Philanthropist",
    quote: "The biggest adventure you can take is to live the life of your dreams.",
    color: "bg-gradient-to-br from-rose-500 to-fuchsia-600"
  },
  {
    name: "Maya Angelou",
    role: "Poet & Civil Rights Activist",
    quote: "I've learned that people will forget what you said, but people will never forget how you made them feel.",
    color: "bg-gradient-to-br from-orange-400 to-red-400"
  },
  {
    name: "Steve Jobs",
    role: "Visionary Entrepreneur",
    quote: "Your time is limited, so don't waste it living someone else's life.",
    color: "bg-gradient-to-br from-slate-700 to-gray-500"
  },
  {
    name: "Mahatma Gandhi",
    role: "Father of the Nation",
    quote: "Be the change you wish to see in the world.",
    color: "bg-gradient-to-br from-orange-500 to-red-500"
  },
  {
    name: "Serena Williams",
    role: "Tennis Legend",
    quote: "I really think a champion is defined not by their wins, but by how they can recover when they fall.",
    color: "bg-gradient-to-br from-indigo-700 to-purple-500"
  },
  {
    name: "Malala Yousafzai",
    role: "Nobel Peace Laureate",
    quote: "One child, one teacher, one book, one pen can change the world.",
    color: "bg-gradient-to-br from-sky-400 to-blue-600"
  }
];

export function Motivation() {
  const [showAll, setShowAll] = useState(false);
  
  const displayedQuotes = showAll ? QUOTES : QUOTES.slice(0, 6);

  return (
    <section id="motivation" className="py-24 relative bg-slate-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-display font-medium mb-4">Words That Move Us</h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Draw inspiration from vibrant minds who faced immense pressure and changed the world.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
          {displayedQuotes.map((q, i) => (
            <Card key={i} className={`overflow-hidden group hover:-translate-y-2 hover:brightness-110 transition-all duration-300 border-0 shadow-lg ${q.color}`}>
              <CardContent className="p-8 sm:p-10 relative h-full flex flex-col">
                <Quote className="absolute top-8 right-8 w-16 h-16 text-white opacity-20 group-hover:opacity-30 transition-opacity" />
                
                <p className="text-xl sm:text-2xl font-display leading-relaxed mb-8 relative z-10 text-white italic flex-grow">
                  "{q.quote}"
                </p>
                
                <div className="flex items-center gap-4 mt-auto">
                  <div className="w-12 h-12 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center text-white font-medium text-lg border border-white/30">
                    {q.name.split(' ').slice(0, 2).map(n => n[0]).join('')}
                  </div>
                  <div>
                    <h4 className="font-semibold text-white tracking-wide">{q.name}</h4>
                    <p className="text-sm text-white/80 font-medium">{q.role}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
        
        {!showAll && (
          <div className="mt-16 text-center">
            <Button 
              onClick={() => setShowAll(true)}
              size="lg"
              className="rounded-full px-8 bg-foreground text-background hover:bg-foreground/90 transition-all"
            >
              Show More Inspiration
            </Button>
          </div>
        )}
      </div>
    </section>
  );
}
