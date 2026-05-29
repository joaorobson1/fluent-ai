"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { CheckCircle2, XCircle } from "lucide-react";
import type { MultiplaEscolhaContent } from "@/types";
import { cn } from "@/lib/utils";

interface ApiResult {
  correct: boolean;
  feedback: string;
  correct_index?: number; // índice verificado pela IA — fonte de verdade para highlight
}

interface Props {
  content: MultiplaEscolhaContent;
  onSubmit: (answer: number) => Promise<ApiResult | null>;
}

export function TaskMultipleChoice({ content, onSubmit }: Props) {
  const [selected, setSelected] = useState<number | null>(null);
  const [result, setResult] = useState<ApiResult | null>(null);

  async function handleSelect(index: number) {
    if (result) return;
    setSelected(index);
    const res = await onSubmit(index);
    setResult(res);
  }

  return (
    <div className="space-y-6">
      <div className="text-center">
        <p className="text-sm font-medium text-slate-500 uppercase tracking-wide mb-3">
          Escolha a resposta correta
        </p>
        <div className="bg-slate-800 rounded-2xl px-6 py-5 border border-slate-700">
          <p className="font-display font-semibold text-xl text-white leading-relaxed">
            {content.question}
          </p>
        </div>
      </div>

      <div className="space-y-3">
        {content.options.map((option, i) => {
          const isSelected = selected === i;
          // Usar o correct_index verificado pela IA (retornado da API).
          // Fallback para content.correct_index caso a API não retorne.
          const verifiedCorrectIndex = result?.correct_index ?? content.correct_index;
          const isVerifiedCorrect = i === verifiedCorrectIndex;
          let state: "default" | "correct" | "wrong" = "default";

          if (result) {
            if (result.correct && isSelected) {
              state = "correct";
            } else if (!result.correct && isSelected) {
              state = "wrong";
            } else if (!result.correct && isVerifiedCorrect) {
              state = "correct";
            }
          }

          return (
            <motion.button
              key={i}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.07 }}
              whileHover={!result ? { scale: 1.01 } : undefined}
              whileTap={!result ? { scale: 0.99 } : undefined}
              onClick={() => handleSelect(i)}
              disabled={!!result}
              className={cn(
                "w-full flex items-center gap-4 p-4 rounded-2xl border-2 transition-all duration-200 text-left",
                state === "correct" && "border-green-500 bg-green-500/10",
                state === "wrong" && "border-red-500 bg-red-500/10",
                state === "default" && !result && "border-slate-700 bg-slate-800/40 hover:border-slate-500 hover:bg-slate-800",
                state === "default" && result && "border-slate-800 bg-slate-800/20 opacity-50"
              )}
            >
              <div className={cn(
                "w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0 transition-colors",
                state === "correct" ? "bg-green-500 text-white" :
                state === "wrong" ? "bg-red-500 text-white" :
                "bg-slate-700 text-slate-300"
              )}>
                {state === "correct" ? <CheckCircle2 size={16} /> :
                 state === "wrong" ? <XCircle size={16} /> :
                 String.fromCharCode(65 + i)}
              </div>
              <span className={cn(
                "font-medium flex-1",
                state === "correct" ? "text-green-300" :
                state === "wrong" ? "text-red-300" :
                "text-slate-200"
              )}>
                {option}
              </span>
            </motion.button>
          );
        })}
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
          {content.explanation && (
            <p className="mt-2 text-slate-400">{content.explanation}</p>
          )}
        </motion.div>
      )}
    </div>
  );
}
