"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useGamificationStore } from "@/store/gamification-store";
import { levelTitle } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import Confetti from "react-confetti";
import { useWindowSize } from "@/hooks/use-window-size";

export function LevelUpModal() {
  const { leveledUp, xpLevel, dismissLevelUp } = useGamificationStore();
  const { width, height } = useWindowSize();

  return (
    <AnimatePresence>
      {leveledUp && (
        <>
          <Confetti
            width={width}
            height={height}
            numberOfPieces={200}
            recycle={false}
            colors={["#0ea5e9", "#d946ef", "#f59e0b", "#22c55e"]}
          />
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[200] bg-slate-950/90 backdrop-blur-sm flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              transition={{ type: "spring", bounce: 0.5 }}
              className="bg-slate-900 border border-brand-500/30 rounded-3xl p-8 max-w-sm w-full text-center shadow-2xl"
            >
              <motion.div
                animate={{ rotate: [0, -10, 10, -10, 10, 0], scale: [1, 1.2, 1] }}
                transition={{ duration: 0.6, delay: 0.3 }}
                className="text-7xl mb-4"
              >
                🎉
              </motion.div>

              <h2 className="font-display font-black text-3xl text-white mb-1">
                Level Up!
              </h2>
              <p className="text-slate-400 mb-4">Você subiu para o nível</p>

              <div className="bg-gradient-to-r from-brand-500 to-accent-500 rounded-2xl p-4 mb-6">
                <div className="text-5xl font-black text-white">{xpLevel}</div>
                <div className="text-brand-100 font-semibold mt-1">{levelTitle(xpLevel)}</div>
              </div>

              <p className="text-slate-400 text-sm mb-6">
                Continue assim! Novos desafios e recompensas foram desbloqueados.
              </p>

              <Button onClick={dismissLevelUp} className="w-full" size="lg">
                Continuar aprendendo! 🚀
              </Button>
            </motion.div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
