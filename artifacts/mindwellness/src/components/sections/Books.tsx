import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Star, BookOpen, ChevronDown, ChevronUp, ExternalLink } from "lucide-react";

const BOOKS = [
  {
    title: "Thinking, Fast and Slow",
    author: "Daniel Kahneman",
    genre: "Psychology",
    genreColor: "from-violet-500 to-purple-600",
    genreBg: "bg-violet-50 text-violet-700 border-violet-200",
    coverColor: "from-violet-400 to-purple-600",
    rating: 4.7,
    pages: 499,
    published: "2011",
    specs: "Nobel Prize winner Daniel Kahneman reveals the two systems that drive how we think — System 1 (fast, intuitive) and System 2 (slow, deliberate). A landmark work in behavioral economics that explains why we make irrational decisions.",
    highlights: ["Cognitive biases", "Decision-making", "Behavioral economics", "Dual-process theory"],
    ratingCount: "148K ratings",
  },
  {
    title: "The Psychology of Money",
    author: "Morgan Housel",
    genre: "Money",
    genreColor: "from-blue-500 to-teal-600",
    genreBg: "bg-blue-50 text-blue-700 border-blue-200",
    coverColor: "from-blue-400 to-teal-600",
    rating: 4.8,
    pages: 256,
    published: "2020",
    specs: "19 short stories exploring the strange ways people think about money. Housel argues that financial success is less about intelligence and more about behavior, patience, and understanding your own relationship with wealth.",
    highlights: ["Wealth mindset", "Financial behavior", "Long-term thinking", "Risk & reward"],
    ratingCount: "210K ratings",
  },
  {
    title: "Man's Search for Meaning",
    author: "Viktor E. Frankl",
    genre: "Psychology",
    genreColor: "from-violet-500 to-purple-600",
    genreBg: "bg-violet-50 text-violet-700 border-violet-200",
    coverColor: "from-slate-500 to-zinc-700",
    rating: 4.9,
    pages: 165,
    published: "1946",
    specs: "Holocaust survivor Viktor Frankl's profound exploration of how meaning-making sustains us through suffering. Introduces logotherapy — finding purpose as the primary motivational force in humans. One of the most influential books ever written.",
    highlights: ["Logotherapy", "Finding purpose", "Resilience", "Human suffering & hope"],
    ratingCount: "360K ratings",
  },
  {
    title: "Rich Dad Poor Dad",
    author: "Robert T. Kiyosaki",
    genre: "Money",
    genreColor: "from-blue-500 to-teal-600",
    genreBg: "bg-blue-50 text-blue-700 border-blue-200",
    coverColor: "from-yellow-400 to-orange-500",
    rating: 4.6,
    pages: 336,
    published: "1997",
    specs: "The #1 personal finance book of all time. Contrasts two father figures with opposite money philosophies — one works for money, the other makes money work for him. Teaches asset-building, financial literacy, and escaping the rat race.",
    highlights: ["Assets vs liabilities", "Financial independence", "Passive income", "Entrepreneurship"],
    ratingCount: "420K ratings",
  },
  {
    title: "The Intelligent Investor",
    author: "Benjamin Graham",
    genre: "Money",
    genreColor: "from-blue-500 to-teal-600",
    genreBg: "bg-blue-50 text-blue-700 border-blue-200",
    coverColor: "from-blue-500 to-indigo-700",
    rating: 4.7,
    pages: 640,
    published: "1949",
    specs: "The definitive book on value investing. Warren Buffett calls it 'the best book about investing ever written.' Graham's timeless principles on margin of safety, market temperament, and long-term thinking remain essential for every investor.",
    highlights: ["Value investing", "Market psychology", "Margin of safety", "Long-term strategy"],
    ratingCount: "98K ratings",
  },
  {
    title: "Dare: The New Way to End Anxiety",
    author: "Barry McDonagh",
    genre: "Anxiety",
    genreColor: "from-sky-500 to-cyan-600",
    genreBg: "bg-sky-50 text-sky-700 border-sky-200",
    coverColor: "from-sky-400 to-cyan-600",
    rating: 4.6,
    pages: 198,
    published: "2015",
    specs: "A revolutionary approach to eliminating anxiety and panic attacks. Instead of fighting anxiety, McDonagh teaches the DARE technique — Defuse, Allow, Run toward, Engage — to end the cycle of anxious thinking and reclaim your life.",
    highlights: ["DARE technique", "Panic attacks", "Anxious thinking", "Mindset shift"],
    ratingCount: "62K ratings",
  },
  {
    title: "The Anxiety and Phobia Workbook",
    author: "Edmund J. Bourne",
    genre: "Anxiety",
    genreColor: "from-sky-500 to-cyan-600",
    genreBg: "bg-sky-50 text-sky-700 border-sky-200",
    coverColor: "from-teal-400 to-blue-500",
    rating: 4.5,
    pages: 512,
    published: "1990",
    specs: "The gold standard self-help workbook for anxiety disorders. Covers CBT techniques, relaxation strategies, desensitization, nutrition, exercise, and lifestyle changes. Used by therapists worldwide. Practical exercises for immediate relief.",
    highlights: ["CBT exercises", "Phobia treatment", "Relaxation methods", "Panic management"],
    ratingCount: "28K ratings",
  },
  {
    title: "The Dance of Anger",
    author: "Harriet Lerner",
    genre: "Anger",
    genreColor: "from-rose-500 to-red-600",
    genreBg: "bg-rose-50 text-rose-700 border-rose-200",
    coverColor: "from-rose-400 to-red-600",
    rating: 4.5,
    pages: 256,
    published: "1985",
    specs: "A landmark guide for women (and men) on using anger as a powerful signal for change. Lerner shows how anger, used wisely, can transform destructive relationship patterns and lead to authentic self-expression and healthier connections.",
    highlights: ["Anger as signal", "Relationship patterns", "Self-expression", "Emotional cycles"],
    ratingCount: "38K ratings",
  },
  {
    title: "Anger: Wisdom for Cooling the Flames",
    author: "Thích Nhất Hạnh",
    genre: "Anger",
    genreColor: "from-rose-500 to-red-600",
    genreBg: "bg-rose-50 text-rose-700 border-rose-200",
    coverColor: "from-orange-400 to-amber-500",
    rating: 4.7,
    pages: 224,
    published: "2001",
    specs: "Zen master Thích Nhất Hạnh offers Buddhist wisdom and mindfulness practices to transform anger into compassion. Learn to listen deeply, water the seeds of happiness, and use anger as a mirror for inner healing.",
    highlights: ["Mindfulness", "Compassion", "Buddhist wisdom", "Inner transformation"],
    ratingCount: "52K ratings",
  },
  {
    title: "Why We Sleep",
    author: "Matthew Walker",
    genre: "Health",
    genreColor: "from-indigo-500 to-blue-600",
    genreBg: "bg-indigo-50 text-indigo-700 border-indigo-200",
    coverColor: "from-indigo-400 to-blue-600",
    rating: 4.7,
    pages: 368,
    published: "2017",
    specs: "Neuroscientist Matthew Walker reveals the life-changing science of sleep. Explores how sleep affects every aspect of your physical and mental health — from cancer prevention to emotional regulation, memory, and athletic performance.",
    highlights: ["Sleep science", "Brain health", "Dream cycles", "Performance & immunity"],
    ratingCount: "175K ratings",
  },
  {
    title: "The Body: A Guide for Occupants",
    author: "Bill Bryson",
    genre: "Health",
    genreColor: "from-indigo-500 to-blue-600",
    genreBg: "bg-indigo-50 text-indigo-700 border-indigo-200",
    coverColor: "from-sky-400 to-teal-500",
    rating: 4.7,
    pages: 448,
    published: "2019",
    specs: "Bryson's witty, awe-inspiring tour of the human body — from skin to brain, immune system to gut. Packed with extraordinary facts that will change how you view yourself and inspire you to take better care of your incredible body.",
    highlights: ["Human anatomy", "Medical history", "Biology", "Health awareness"],
    ratingCount: "112K ratings",
  },
  {
    title: "Atomic Habits",
    author: "James Clear",
    genre: "Health",
    genreColor: "from-indigo-500 to-blue-600",
    genreBg: "bg-indigo-50 text-indigo-700 border-indigo-200",
    coverColor: "from-amber-400 to-yellow-500",
    rating: 4.9,
    pages: 320,
    published: "2018",
    specs: "The definitive guide to building good habits and breaking bad ones. Clear's proven 4-step framework — Cue, Craving, Response, Reward — shows how tiny 1% improvements compound into extraordinary long-term results.",
    highlights: ["Habit loops", "Identity change", "1% improvements", "Systems over goals"],
    ratingCount: "560K ratings",
  },
  {
    title: "The Story of My Experiments with Truth",
    author: "Mahatma Gandhi",
    genre: "Autobiography",
    genreColor: "from-amber-500 to-orange-600",
    genreBg: "bg-amber-50 text-amber-700 border-amber-200",
    coverColor: "from-amber-400 to-orange-500",
    rating: 4.8,
    pages: 480,
    published: "1927",
    specs: "Gandhi's autobiography traces his lifelong journey of moral and spiritual experimentation — from a shy lawyer in South Africa to the Father of the Nation. A profound meditation on truth, nonviolence, simplicity, and self-discipline.",
    highlights: ["Nonviolence", "Satyagraha", "Moral courage", "Self-discipline"],
    ratingCount: "82K ratings",
  },
  {
    title: "Long Walk to Freedom",
    author: "Nelson Mandela",
    genre: "Autobiography",
    genreColor: "from-amber-500 to-orange-600",
    genreBg: "bg-amber-50 text-amber-700 border-amber-200",
    coverColor: "from-sky-500 to-blue-700",
    rating: 4.9,
    pages: 656,
    published: "1994",
    specs: "Mandela's extraordinary memoir from childhood in rural Transkei to 27 years in Robben Island prison to South Africa's first Black president. A testament to indomitable human spirit, forgiveness, and the power of perseverance.",
    highlights: ["Resilience", "Leadership", "Forgiveness", "Anti-apartheid struggle"],
    ratingCount: "195K ratings",
  },
  {
    title: "Educated",
    author: "Tara Westover",
    genre: "Autobiography",
    genreColor: "from-amber-500 to-orange-600",
    genreBg: "bg-amber-50 text-amber-700 border-amber-200",
    coverColor: "from-rose-400 to-pink-600",
    rating: 4.8,
    pages: 352,
    published: "2018",
    specs: "A breathtaking memoir about a woman who grew up in a survivalist family in Idaho, never attended school, yet earned a PhD from Cambridge University. An exploration of self-invention, the power of education, and the courage to define your own truth.",
    highlights: ["Self-education", "Family trauma", "Identity", "Academic journey"],
    ratingCount: "290K ratings",
  },
];

const GENRES = ["All", "Psychology", "Money", "Anxiety", "Anger", "Health", "Autobiography"];

function StarRating({ rating }: { rating: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => (
        <Star
          key={star}
          className={`w-3.5 h-3.5 ${star <= Math.round(rating) ? "fill-amber-400 text-amber-400" : "text-gray-200 fill-gray-200"}`}
        />
      ))}
    </div>
  );
}

function BookCard({ book, index }: { book: typeof BOOKS[0]; index: number }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.45, delay: index * 0.06 }}
      className="bg-white rounded-3xl border border-black/5 shadow-md hover:shadow-xl transition-all duration-300 overflow-hidden group"
    >
      {/* Book cover strip */}
      <div className={`h-2 w-full bg-gradient-to-r ${book.coverColor}`} />

      <div className="p-6">
        <div className="flex gap-4">
          {/* Book spine/cover visual */}
          <div className={`flex-shrink-0 w-14 h-20 rounded-xl bg-gradient-to-br ${book.coverColor} flex items-center justify-center shadow-md`}>
            <BookOpen className="w-6 h-6 text-white/80" />
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0">
            <div className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold border mb-2 ${book.genreBg}`}>
              {book.genre}
            </div>
            <h3 className="font-display font-semibold text-foreground text-base leading-snug mb-0.5 line-clamp-2">
              {book.title}
            </h3>
            <p className="text-xs text-muted-foreground font-medium">by {book.author}</p>
          </div>
        </div>

        {/* Rating + metadata */}
        <div className="mt-4 flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <StarRating rating={book.rating} />
            <span className="text-sm font-bold text-amber-500">{book.rating}</span>
            <span className="text-xs text-muted-foreground">({book.ratingCount})</span>
          </div>
          <div className="flex gap-3 text-xs text-muted-foreground">
            <span>{book.pages} pages</span>
            <span>•</span>
            <span>{book.published}</span>
          </div>
        </div>

        {/* Description */}
        <p className="mt-3 text-sm text-muted-foreground leading-relaxed line-clamp-3">
          {book.specs}
        </p>

        {/* Expand toggle */}
        <button
          onClick={() => setExpanded(!expanded)}
          className="mt-3 flex items-center gap-1 text-xs font-semibold text-primary hover:text-primary/70 transition-colors"
        >
          {expanded ? (
            <><ChevronUp className="w-3.5 h-3.5" /> Show less</>
          ) : (
            <><ChevronDown className="w-3.5 h-3.5" /> Key highlights</>
          )}
        </button>

        <AnimatePresence>
          {expanded && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.3 }}
              className="overflow-hidden"
            >
              <div className="mt-3 flex flex-wrap gap-1.5">
                {book.highlights.map((h, i) => (
                  <span
                    key={i}
                    className={`px-2.5 py-1 rounded-full text-xs font-medium border ${book.genreBg}`}
                  >
                    {h}
                  </span>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}

export function Books() {
  const [activeGenre, setActiveGenre] = useState("All");
  const [showAll, setShowAll] = useState(false);

  const filtered = activeGenre === "All" ? BOOKS : BOOKS.filter(b => b.genre === activeGenre);
  const displayed = showAll ? filtered : filtered.slice(0, 6);

  return (
    <section id="books" className="py-24 relative bg-secondary/20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-14">
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 text-primary text-sm font-semibold mb-5">
              <BookOpen className="w-4 h-4" /> Curated Reading List
            </span>
            <h2 className="text-4xl md:text-5xl font-display font-medium mb-4 text-foreground">
              Books That Transform
            </h2>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              15 handpicked books across psychology, money, anxiety, anger, health, and biography — your personal library for a better life.
            </p>
          </motion.div>
        </div>

        {/* Genre filter */}
        <div className="flex flex-wrap gap-2 justify-center mb-10">
          {GENRES.map((g) => (
            <motion.button
              key={g}
              onClick={() => { setActiveGenre(g); setShowAll(false); }}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 ${
                activeGenre === g
                  ? "bg-primary text-primary-foreground shadow-md"
                  : "bg-white border border-black/10 text-muted-foreground hover:border-primary/30 hover:text-foreground"
              }`}
            >
              {g}
            </motion.button>
          ))}
        </div>

        {/* Books grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {displayed.map((book, i) => (
            <BookCard key={book.title} book={book} index={i} />
          ))}
        </div>

        {/* Show more/less */}
        {filtered.length > 6 && (
          <div className="mt-10 text-center">
            <motion.button
              whileHover={{ scale: 1.04 }}
              whileTap={{ scale: 0.96 }}
              onClick={() => setShowAll(!showAll)}
              className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-white border border-black/10 text-sm font-semibold text-foreground hover:bg-primary hover:text-primary-foreground hover:border-transparent transition-all duration-250 shadow-sm"
            >
              {showAll ? (
                <><ChevronUp className="w-4 h-4" /> Show fewer books</>
              ) : (
                <><BookOpen className="w-4 h-4" /> Show all {filtered.length} books</>
              )}
            </motion.button>
          </div>
        )}
      </div>
    </section>
  );
}
