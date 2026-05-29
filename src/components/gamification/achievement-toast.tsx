"use client";

import { useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useGamificationStore } from "@/store/gamification-store";
import { Zap } from "lucide-react";

export function AchievementToast() {
  const { newAchievements, dismissAchievements } = useGamificationStore();
  const achievement = newAchievements[0];

  useEffect(() => {
    if (achievement) {
      const timer = setTimeout(dismissAchievements, 4000);
      return () => clearTimeout(timer);
    }
  }, [achievement, dismissAchievements]);

  return (
    <AnimatePresence>
      {achievement && (
        <motion.div
          initial={{ x: 300, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          exit={{ x: 300, opacity: 0 }}
          transition={{ type: "spring", bounce: 0.3 }}
          className="fixed top-4 right-4 z-[150] max-w-sm"
          onClick={dismissAchievements}
        >
          <div className="bg-slate-900 border border-yellow-500/30 rounded-2xl p-4 shadow-2xl shadow-yellow-500/10 cursor-pointer">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-yellow-500/20 rounded-xl flex items-center justify-center text-2xl flex-shrink-0">
                {achievement.icon}
              </div>
              <div>
                <div className="flex items-center gap-1.5 mb-0.5">
                  <span className="text-xs font-bold text-yellow-400 uppercase tracking-wide">
                    Conquista Desbloqueada!
                  </span>
                </div>
                <p className="font-bold text-white text-sm">{achievement.title}</p>
                <p className="text-slate-400 text-xs">{achievement.description}</p>
                <div className="flex items-center gap-1 mt-1">
                  <Zap size={11} className="text-yellow-400" />
                  <span className="text-xs font-bold text-yellow-400">+{achievement.xp_reward} XP</span>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
