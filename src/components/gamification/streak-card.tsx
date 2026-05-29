"use client";

import { motion } from "framer-motion";
import { Flame } from "lucide-react";
import { cn } from "@/lib/utils";

interface StreakCardProps {
  streak: number;
  longestStreak: number;
  weekDays: boolean[];
  className?: string;
}

const DAY_NAMES = ["D", "S", "T", "Q", "Q", "S", "S"];

export function StreakCard({ streak, longestStreak, weekDays, className }: StreakCardProps) {
  return (
    <div className={cn("card-solid p-5", className)}>
      <div className="flex items-start justify-between mb-4">
        <div>
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">
            Sequência Atual
          </p>
          <div className="flex items-center gap-2">
            <motion.span
              key={streak}
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="font-display font-black text-4xl text-white"
            >
              {streak}
            </motion.span>
            <div>
              <Flame
                size={28}
                className={cn(
                  "transition-all",
                  streak > 0 ? "text-orange-400 drop-shadow-[0_0_8px_rgba(251,146,60,0.8)] animate-streak-fire" : "text-slate-700"
                )}
              />
            </div>
          </div>
          <p className="text-sm text-slate-400">
            {streak === 1 ? "dia seguido" : "dias seguidos"}
          </p>
        </div>

        <div className="text-right">
          <p className="text-xs text-slate-600 mb-1">Recorde</p>
          <p className="font-bold text-slate-300">{longestStreak} dias</p>
        </div>
      </div>

      {/* Dias da semana */}
      <div className="flex gap-1.5 justify-between">
        {weekDays.map((done, i) => (
          <motion.div
            key={i}
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: i * 0.05 }}
            className="flex flex-col items-center gap-1 flex-1"
          >
            <div
              className={cn(
                "w-full aspect-square max-w-[32px] rounded-lg flex items-center justify-center transition-all",
                done
                  ? "bg-orange-500 shadow-[0_0_10px_rgba(251,146,60,0.5)]"
                  : "bg-slate-800 border border-slate-700"
              )}
            >
              {done && <Flame size={12} className="text-white" />}
            </div>
            <span className="text-[10px] text-slate-600">{DAY_NAMES[i]}</span>
          </motion.div>
        ))}
      </div>

      {streak >= 3 && (
        <div className="mt-3 pt-3 border-t border-slate-800 text-center">
          <p className="text-xs text-orange-400 font-medium">
            🔥 Você está em chamas! Não quebre a sequência!
          </p>
        </div>
      )}
    </div>
  );
}
