"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { ArrowRight, Lightbulb } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { TranslationContent } from "@/types";
import { cn } from "@/lib/utils";

interface Props {
  content: TranslationContent;
  onSubmit: (answer: string) => Promise<{ correct: boolean; feedback: string } | null>;
  isSubmitting: boolean;
}

export function TaskTranslation({ content, onSubmit, isSubmitting }: Props) {
  const [answer, setAnswer] = useState("");
  const [showHint, setShowHint] = useState(false);
  const [result, setResult] = useState<{ correct: boolean; feedback: string } | null>(null);

  async function handleSubmit() {
    if (!answer.trim()) return;
    const res = await onSubmit(answer.trim());
    setResult(res);
  }

  const label = content.direction === "pt_to_en"
    ? "Traduza para o inglês:"
    : "Traduza para o português:";

  return (
    <div className="space-y-6">
      <div className="text-center">
        <p className="text-sm font-medium text-slate-500 uppercase tracking-wide mb-3">{label}</p>
        <div className="bg-slate-800 rounded-2xl px-6 py-5 border border-slate-700">
          <p className="font-display font-semibold text-2xl text-white leading-relaxed">
            "{content.text}"
          </p>
        </div>
      </div>

      {content.hint && (
        <button
          onClick={() => setShowHint(!showHint)}
          className="flex items-center gap-2 text-sm text-yellow-400 hover:text-yellow-300 transition-colors mx-auto"
        >
          <Lightbulb size={15} />
          {showHint ? "Ocultar dica" : "Ver dica"}
        </button>
      )}

      {showHint && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          className="bg-yellow-500/10 border border-yellow-500/20 rounded-xl px-4 py-3 text-sm text-yellow-300"
        >
          💡 {content.hint}
        </motion.div>
      )}

      <textarea
        value={answer}
        onChange={(e) => setAnswer(e.target.value)}
        placeholder="Digite sua tradução aqui..."
        disabled={!!result}
        className={cn(
          "w-full bg-slate-800/50 border rounded-xl px-4 py-3 text-white placeholder:text-slate-500",
          "resize-none outline-none transition-all duration-200 text-base",
          result?.correct ? "border-green-500 focus:border-green-500" :
          result ? "border-red-500" : "border-slate-700 focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20",
          "min-h-[100px]"
        )}
        onKeyDown={(e) => {
          if (e.key === "Enter" && e.ctrlKey) handleSubmit();
        }}
      />

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
          {!result.correct && (
            <p className="mt-2 text-slate-400">
              Respostas aceitas: <span className="text-white">{content.accepted_answers.join(" / ")}</span>
            </p>
          )}
          {content.explanation && (
            <p className="mt-2 text-slate-400">{content.explanation}</p>
          )}
        </motion.div>
      )}

      {!result && (
        <Button
          onClick={handleSubmit}
          loading={isSubmitting}
          disabled={!answer.trim()}
          className="w-full gap-2"
          size="lg"
        >
          Enviar resposta <ArrowRight size={16} />
        </Button>
      )}
      <p className="text-center text-xs text-slate-600">Dica: Ctrl+Enter para enviar</p>
    </div>
  );
}
