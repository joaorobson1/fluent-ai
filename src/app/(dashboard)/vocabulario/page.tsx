"use client";

import { useEffect, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, Filter, Volume2, BookOpen, Star, StarOff, RefreshCw } from "lucide-react";
import { AppShell } from "@/components/layout/app-shell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { createClient } from "@/lib/supabase/client";
import { useUserStore } from "@/store/user-store";
import type { VocabularyItem } from "@/types";
import { cn } from "@/lib/utils";

const CATEGORIES = ["Todas", "Substantivos", "Verbos", "Adjetivos", "Advérbios", "Expressões", "Phrasal Verbs"];
const MASTERY_LABELS = ["Novo", "Aprendendo", "Familiar", "Bom", "Ótimo", "Dominado"];
const MASTERY_COLORS = [
  "bg-slate-600",
  "bg-red-500",
  "bg-orange-500",
  "bg-yellow-500",
  "bg-lime-500",
  "bg-green-500",
];

type ViewMode = "grid" | "flashcard";

export default function VocabularioPage() {
  const { profile } = useUserStore();
  const [words, setWords] = useState<VocabularyItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("Todas");
  const [viewMode, setViewMode] = useState<ViewMode>("grid");
  const [flashcardIndex, setFlashcardIndex] = useState(0);
  const [flashcardFlipped, setFlashcardFlipped] = useState(false);

  const loadVocabulary = useCallback(async () => {
    if (!profile) return;
    setLoading(true);

    const supabase = createClient();
    const query = supabase
      .from("vocabulary")
      .select("*")
      .eq("user_id", profile.id)
      .order("created_at", { ascending: false });

    const { data } = await query;
    setWords(data as VocabularyItem[] ?? []);
    setLoading(false);
  }, [profile]);

  useEffect(() => {
    loadVocabulary();
  }, [loadVocabulary]);

  const filtered = words.filter((w) => {
    const matchSearch =
      !search ||
      w.word.toLowerCase().includes(search.toLowerCase()) ||
      w.translation.toLowerCase().includes(search.toLowerCase());
    const matchCategory = category === "Todas" || w.category === category;
    return matchSearch && matchCategory;
  });

  function speak(text: string) {
    if ("speechSynthesis" in window) {
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = "en-US";
      utterance.rate = 0.9;
      window.speechSynthesis.speak(utterance);
    }
  }

  const masteredCount = words.filter((w) => w.is_mastered).length;
  const totalWords = words.length;
  const masteryPercent = totalWords > 0 ? Math.round((masteredCount / totalWords) * 100) : 0;

  // Flashcard mode
  const flashcardWord = filtered[flashcardIndex];

  return (
    <AppShell title="Vocabulário">
      <div className="space-y-6">
        {/* Stats bar */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="card-solid p-4"
        >
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <BookOpen size={18} className="text-brand-400" />
              <span className="font-semibold text-white">
                {totalWords} palavras aprendidas
              </span>
            </div>
            <span className="text-sm text-slate-400">{masteredCount} dominadas</span>
          </div>
          <Progress value={masteryPercent} className="h-2" />
          <p className="text-xs text-slate-500 mt-1.5">{masteryPercent}% do vocabulário dominado</p>
        </motion.div>

        {/* Search + Filters */}
        <div className="space-y-3">
          <div className="relative">
            <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar palavras..."
              className="input-field pl-10"
            />
          </div>

          <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1">
            <Filter size={14} className="text-slate-500 flex-shrink-0" />
            {CATEGORIES.map((cat) => (
              <button
                key={cat}
                onClick={() => setCategory(cat)}
                className={cn(
                  "text-xs font-medium px-3 py-1.5 rounded-full whitespace-nowrap transition-all",
                  category === cat
                    ? "bg-brand-500 text-white"
                    : "bg-slate-800 text-slate-400 hover:bg-slate-700"
                )}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* View mode toggle */}
          <div className="flex gap-2">
            <button
              onClick={() => setViewMode("grid")}
              className={cn(
                "flex-1 py-2 rounded-xl text-sm font-medium transition-all",
                viewMode === "grid" ? "bg-brand-500 text-white" : "bg-slate-800 text-slate-400"
              )}
            >
              Grade
            </button>
            <button
              onClick={() => { setViewMode("flashcard"); setFlashcardIndex(0); setFlashcardFlipped(false); }}
              className={cn(
                "flex-1 py-2 rounded-xl text-sm font-medium transition-all",
                viewMode === "flashcard" ? "bg-brand-500 text-white" : "bg-slate-800 text-slate-400"
              )}
            >
              Flashcards
            </button>
          </div>
        </div>

        {/* Flashcard Mode */}
        {viewMode === "flashcard" && filtered.length > 0 && (
          <div className="flex flex-col items-center gap-4">
            <p className="text-xs text-slate-500">{flashcardIndex + 1} de {filtered.length}</p>

            <motion.div
              className="w-full max-w-sm h-56 cursor-pointer perspective-1000"
              onClick={() => setFlashcardFlipped(!flashcardFlipped)}
            >
              <AnimatePresence mode="wait">
                {!flashcardFlipped ? (
                  <motion.div
                    key="front"
                    initial={{ rotateY: -90 }}
                    animate={{ rotateY: 0 }}
                    exit={{ rotateY: 90 }}
                    className="absolute inset-0 card-solid p-6 flex flex-col items-center justify-center gap-3"
                  >
                    <p className="font-display font-bold text-3xl text-white">
                      {flashcardWord?.word}
                    </p>
                    {flashcardWord?.phonetic && (
                      <p className="text-slate-400 text-sm">{flashcardWord.phonetic}</p>
                    )}
                    <button
                      onClick={(e) => { e.stopPropagation(); speak(flashcardWord?.word ?? ""); }}
                      className="flex items-center gap-1.5 text-brand-400 hover:text-brand-300 text-sm"
                    >
                      <Volume2 size={16} /> Ouvir pronúncia
                    </button>
                    <p className="text-xs text-slate-600 mt-2">Toque para ver a tradução</p>
                  </motion.div>
                ) : (
                  <motion.div
                    key="back"
                    initial={{ rotateY: 90 }}
                    animate={{ rotateY: 0 }}
                    exit={{ rotateY: -90 }}
                    className="absolute inset-0 card-solid p-6 flex flex-col items-center justify-center gap-3 bg-brand-500/10 border-brand-500/30"
                  >
                    <p className="font-bold text-xl text-brand-300">
                      {flashcardWord?.translation}
                    </p>
                    {flashcardWord?.example_sentence && (
                      <p className="text-sm text-slate-400 text-center italic">
                        "{flashcardWord.example_sentence}"
                      </p>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>

            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={() => { setFlashcardIndex(Math.max(0, flashcardIndex - 1)); setFlashcardFlipped(false); }}
                disabled={flashcardIndex === 0}
              >
                Anterior
              </Button>
              <Button
                onClick={() => { setFlashcardIndex(Math.min(filtered.length - 1, flashcardIndex + 1)); setFlashcardFlipped(false); }}
                disabled={flashcardIndex === filtered.length - 1}
              >
                Próxima
              </Button>
            </div>
          </div>
        )}

        {/* Grid Mode */}
        {viewMode === "grid" && (
          <>
            {loading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {[...Array(6)].map((_, i) => (
                  <div key={i} className="skeleton h-32 rounded-2xl" />
                ))}
              </div>
            ) : filtered.length === 0 ? (
              <div className="text-center py-16">
                <p className="text-4xl mb-3">📚</p>
                <p className="font-semibold text-white mb-2">
                  {search ? "Nenhuma palavra encontrada" : "Seu vocabulário está vazio"}
                </p>
                <p className="text-sm text-slate-400">
                  {search ? "Tente outra busca" : "Complete tarefas de vocabulário para adicionar palavras"}
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <AnimatePresence>
                  {filtered.map((word, i) => (
                    <motion.div
                      key={word.id}
                      initial={{ opacity: 0, y: 15 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.04 }}
                      className="card-solid p-4 hover:border-slate-600 transition-all"
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className="font-bold text-white text-lg">{word.word}</h3>
                            <button
                              onClick={() => speak(word.word)}
                              className="text-slate-500 hover:text-brand-400 transition-colors"
                            >
                              <Volume2 size={14} />
                            </button>
                          </div>
                          {word.phonetic && (
                            <p className="text-xs text-slate-500">{word.phonetic}</p>
                          )}
                        </div>
                        <div className="flex items-center gap-1.5">
                          <div className={cn("w-2 h-2 rounded-full", MASTERY_COLORS[word.mastery_level])} />
                          <span className="text-xs text-slate-500">{MASTERY_LABELS[word.mastery_level]}</span>
                        </div>
                      </div>

                      <p className="font-medium text-brand-300 mb-2">{word.translation}</p>

                      {word.example_sentence && (
                        <p className="text-xs text-slate-500 italic">
                          "{word.example_sentence}"
                        </p>
                      )}

                      <div className="flex items-center justify-between mt-3">
                        <div className="flex flex-wrap gap-1">
                          {word.tags.slice(0, 2).map((tag) => (
                            <Badge key={tag} variant="secondary" className="text-[10px] px-1.5 py-0">
                              {tag}
                            </Badge>
                          ))}
                        </div>
                        <div className="flex items-center gap-1 text-xs text-slate-600">
                          <span>{word.times_correct}/{word.times_seen}</span>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            )}
          </>
        )}
      </div>
    </AppShell>
  );
}
