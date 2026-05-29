"use client";

import { useState, useRef } from "react";
import { motion } from "framer-motion";
import { ArrowRight, Lightbulb, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { TranslationContent } from "@/types";
import { cn } from "@/lib/utils";

interface ApiResult {
  correct: boolean;
  feedback: string;
  explanation?: string;
  score?: number;
}

interface Props {
  content: TranslationContent;
  onSubmit: (answer: string) => Promise<ApiResult | null>;
  isSubmitting: boolean;
}

export function TaskTranslation({ content, onSubmit, isSubmitting }: Props) {
  const [answer, setAnswer] = useState("");
  const [showHint, setShowHint] = useState(false);
  const [result, setResult] = useState<ApiResult | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const label = content.direction === "pt_to_en"
    ? "Traduza para o inglês:"
    : "Traduza para o português:";

  async function handleSubmit() {
    const trimmed = answer.trim();
    if (!trimmed || isSubmitting || result) return;
    const res = await onSubmit(trimmed);
    setResult(res);
  }

  const hasAnswer = answer.trim().length > 0;
  const isPartiallyCorrect = result && !result.correct && (result.score ?? 0) >= 70;

  return (
    <div className="space-y-5">
      {/* Frase a traduzir */}
      <div className="text-center">
        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">{label}</p>
        <div className="bg-slate-800 rounded-2xl px-6 py-5 border border-slate-700">
          <p className="font-display font-semibold text-2xl text-white leading-relaxed">
            "{content.text}"
          </p>
        </div>
      </div>

      {/* Dica */}
      {content.hint && (
        <button
          onClick={() => setShowHint((v) => !v)}
          className="flex items-center gap-2 text-xs text-yellow-400 hover:text-yellow-300 transition-colors mx-auto"
        >
          <Lightbulb size={13} />
          {showHint ? "Ocultar dica" : "Ver dica"}
        </button>
      )}

      {showHint && content.hint && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          className="bg-yellow-500/10 border border-yellow-500/20 rounded-xl px-4 py-3 text-sm text-yellow-300"
        >
          💡 {content.hint}
        </motion.div>
      )}

      {/* Input */}
      <textarea
        ref={textareaRef}
        value={answer}
        onChange={(e) => setAnswer(e.target.value)}
        placeholder="Digite sua tradução aqui..."
        disabled={!!result || isSubmitting}
        rows={3}
        className={cn(
          "w-full bg-slate-800/50 border rounded-xl px-4 py-3 text-white placeholder:text-slate-500",
          "resize-none outline-none transition-all duration-200 text-base",
          result
            ? result.correct || isPartiallyCorrect
              ? "border-green-500"
              : "border-red-500"
            : "border-slate-700 focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20"
        )}
        onKeyDown={(e) => {
          if (e.key === "Enter" && e.ctrlKey) handleSubmit();
        }}
      />

      {/* Resultado */}
      {result && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className={cn(
            "rounded-xl p-4 text-sm space-y-1.5",
            result.correct || isPartiallyCorrect
              ? "bg-green-500/15 border border-green-500/30 text-green-300"
              : "bg-red-500/15 border border-red-500/30 text-red-300"
          )}
        >
          <p className="font-semibold">
            {result.correct
              ? "✅ Correto!"
              : isPartiallyCorrect
                ? "✅ Quase perfeito!"
                : "❌ Incorreto"}
          </p>
          <p>{result.feedback}</p>
          {!result.correct && !isPartiallyCorrect && content.accepted_answers?.length > 0 && (
            <p className="text-slate-400 text-xs">
              Respostas aceitas:{" "}
              <span className="text-slate-200">
                {content.accepted_answers.join("  /  ")}
              </span>
            </p>
          )}
          {(result.explanation || content.explanation) && (
            <p className="text-slate-400 text-xs">
              {result.explanation || content.explanation}
            </p>
          )}
        </motion.div>
      )}

      {/* Botão */}
      {!result && (
        <Button
          onClick={handleSubmit}
          disabled={!hasAnswer}
          loading={isSubmitting}
          className="w-full gap-2"
          size="lg"
        >
          {isSubmitting
            ? <><Loader2 size={16} className="animate-spin" /> Verificando...</>
            : <>Enviar resposta <ArrowRight size={16} /></>
          }
        </Button>
      )}

      {!result && (
        <p className="text-center text-[11px] text-slate-700">Ctrl+Enter para enviar</p>
      )}
    </div>
  );
}
