"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { RotateCcw, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { MontarFraseContent } from "@/types";
import { cn } from "@/lib/utils";

interface Props {
  content: MontarFraseContent;
  onSubmit: (order: number[]) => Promise<{ correct: boolean; feedback: string } | null>;
  isSubmitting: boolean;
}

export function TaskSentenceBuilder({ content, onSubmit, isSubmitting }: Props) {
  const [placed, setPlaced] = useState<number[]>([]);
  const [result, setResult] = useState<{ correct: boolean; feedback: string } | null>(null);

  const available = content.words
    .map((w, i) => ({ word: w, index: i }))
    .filter((w) => !placed.includes(w.index));

  function addWord(index: number) {
    if (result) return;
    setPlaced([...placed, index]);
  }

  function removeWord(pos: number) {
    if (result) return;
    setPlaced(placed.filter((_, i) => i !== pos));
  }

  function reset() {
    setPlaced([]);
    setResult(null);
  }

  async function handleSubmit() {
    if (placed.length !== content.words.length) return;
    const res = await onSubmit(placed);
    setResult(res);
  }

  return (
    <div className="space-y-6">
      <div className="text-center">
        <p className="text-sm font-medium text-slate-500 uppercase tracking-wide mb-2">
          Monte a frase em inglês
        </p>
        <p className="text-slate-400 text-sm">"{content.translation}"</p>
      </div>

      {/* Drop zone */}
      <div className="min-h-[60px] bg-slate-800/40 border-2 border-dashed border-slate-700 rounded-2xl p-4 flex flex-wrap gap-2 items-center">
        {placed.length === 0 && (
          <p className="text-slate-600 text-sm w-full text-center">
            Toque nas palavras abaixo para montar a frase
          </p>
        )}
        <AnimatePresence>
          {placed.map((wordIndex, pos) => (
            <motion.button
              key={`placed-${wordIndex}`}
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0, opacity: 0 }}
              onClick={() => removeWord(pos)}
              className={cn(
                "px-3 py-1.5 rounded-lg text-sm font-medium transition-all",
                result?.correct ? "bg-green-500 text-white" :
                result ? "bg-red-500/30 text-red-300" :
                "bg-brand-500 text-white hover:bg-brand-600 active:scale-95"
              )}
            >
              {content.words[wordIndex]}
            </motion.button>
          ))}
        </AnimatePresence>
      </div>

      {/* Available words */}
      <div className="flex flex-wrap gap-2 justify-center">
        <AnimatePresence>
          {available.map(({ word, index }) => (
            <motion.button
              key={`avail-${index}`}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => addWord(index)}
              disabled={!!result}
              className="px-3 py-1.5 bg-slate-700 hover:bg-slate-600 text-slate-200 rounded-lg text-sm font-medium transition-all border border-slate-600"
            >
              {word}
            </motion.button>
          ))}
        </AnimatePresence>
      </div>

      {result && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className={cn(
            "rounded-xl p-4 text-sm",
            result.correct
              ? "bg-green-500/15 border border-green-500/30 text-green-300"
              : "bg-red-500/15 border border-red-500/30 text-red-300"
          )}
        >
          <p className="font-semibold mb-1">{result.correct ? "✅ Correto!" : "❌ Incorreto"}</p>
          <p>{result.feedback}</p>
        </motion.div>
      )}

      <div className="flex gap-3">
        {!result && (
          <Button variant="outline" onClick={reset} className="gap-2">
            <RotateCcw size={15} /> Recomeçar
          </Button>
        )}
        {!result && (
          <Button
            onClick={handleSubmit}
            loading={isSubmitting}
            disabled={placed.length !== content.words.length}
            className="flex-1 gap-2"
            size="lg"
          >
            Verificar <ArrowRight size={16} />
          </Button>
        )}
      </div>
    </div>
  );
}
