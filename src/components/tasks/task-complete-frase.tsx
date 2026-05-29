"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { CheckCircle2, XCircle, Loader2 } from "lucide-react";
import type { CompleteFraseContent } from "@/types";
import { cn } from "@/lib/utils";

interface ApiResult {
  correct: boolean;
  feedback: string;
  explanation?: string;
  correct_index?: number;
}

interface Props {
  content: CompleteFraseContent;
  onSubmit: (answer: number) => Promise<ApiResult | null>;
}

// Destaca o BLANK na frase e substitui pela resposta selecionada
function renderSentence(sentence: string, selected: string | null): React.ReactNode {
  const parts = sentence.split(/BLANK/i);
  if (parts.length < 2) return sentence;

  return (
    <>
      {parts[0]}
      <span className={cn(
        "inline-block min-w-[48px] border-b-2 px-1 mx-0.5 text-center font-bold transition-all",
        selected
          ? "border-brand-400 text-brand-300"
          : "border-slate-500 text-slate-500"
      )}>
        {selected ?? "___"}
      </span>
      {parts[1]}
    </>
  );
}

export function TaskCompleteFrase({ content, onSubmit }: Props) {
  const [selected, setSelected] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ApiResult | null>(null);

  async function handleSelect(index: number) {
    if (result || loading) return;
    setSelected(index);
    setLoading(true);
    try {
      const res = await onSubmit(index);
      setResult(res);
    } finally {
      setLoading(false);
    }
  }

  const authorativeCorrectIndex = result?.correct_index ?? content.options.findIndex(
    (o) => o.toLowerCase().trim() === (content.correct_answer ?? "").toLowerCase().trim()
  );

  return (
    <div className="space-y-6">
      {/* Frase com lacuna */}
      <div className="text-center">
        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">
          Complete a frase
        </p>
        <div className="bg-slate-800 rounded-2xl px-6 py-5 border border-slate-700">
          <p className="font-display font-semibold text-xl text-white leading-relaxed">
            {renderSentence(
              content.sentence_with_blank,
              selected !== null ? content.options[selected] : null
            )}
          </p>
        </div>
      </div>

      {/* Opções */}
      <div className="space-y-3">
        {content.options.map((option, i) => {
          const isSelected = selected === i;
          let state: "default" | "correct" | "wrong" | "correct-reveal" = "default";

          if (result) {
            if (result.correct && isSelected) state = "correct";
            else if (!result.correct && isSelected) state = "wrong";
            else if (!result.correct && i === authorativeCorrectIndex) state = "correct-reveal";
          }

          const showAsCorrect = state === "correct" || state === "correct-reveal";
          const isInteractive = !result && !loading;

          return (
            <motion.button
              key={i}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.06 }}
              whileHover={isInteractive ? { scale: 1.01 } : undefined}
              whileTap={isInteractive ? { scale: 0.99 } : undefined}
              onClick={() => handleSelect(i)}
              disabled={!isInteractive}
              className={cn(
                "w-full flex items-center gap-4 p-4 rounded-2xl border-2 transition-all duration-200 text-left",
                showAsCorrect    && "border-green-500 bg-green-500/10",
                state === "wrong" && "border-red-500 bg-red-500/10",
                state === "default" && isInteractive  && "border-slate-700 bg-slate-800/40 hover:border-slate-500 hover:bg-slate-800",
                state === "default" && !isInteractive && "border-slate-800 bg-slate-800/20 opacity-40"
              )}
            >
              <div className={cn(
                "w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0",
                showAsCorrect    ? "bg-green-500 text-white" :
                state === "wrong" ? "bg-red-500 text-white" :
                "bg-slate-700 text-slate-300"
              )}>
                {loading && isSelected
                  ? <Loader2 size={14} className="animate-spin" />
                  : showAsCorrect ? <CheckCircle2 size={16} />
                  : state === "wrong" ? <XCircle size={16} />
                  : String.fromCharCode(65 + i)
                }
              </div>
              <span className={cn(
                "font-medium flex-1",
                showAsCorrect    ? "text-green-300" :
                state === "wrong" ? "text-red-300" :
                "text-slate-200"
              )}>
                {option}
              </span>
            </motion.button>
          );
        })}
      </div>

      {/* Feedback */}
      {result && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className={cn(
            "rounded-xl p-4 text-sm space-y-1",
            result.correct
              ? "bg-green-500/15 border border-green-500/30 text-green-300"
              : "bg-red-500/15 border border-red-500/30 text-red-300"
          )}
        >
          <p className="font-semibold">{result.correct ? "✅ Correto!" : "❌ Incorreto"}</p>
          <p>{result.feedback}</p>
          {(result.explanation || content.explanation) && (
            <p className="text-slate-400 text-xs mt-1">
              {result.explanation || content.explanation}
            </p>
          )}
          {result.correct && content.full_sentence && (
            <p className="text-slate-400 text-xs mt-1 italic">
              "{content.full_sentence}"
            </p>
          )}
        </motion.div>
      )}
    </div>
  );
}
