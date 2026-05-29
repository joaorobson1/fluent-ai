"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Zap } from "lucide-react";
import { useGamificationStore } from "@/store/gamification-store";

export function XPPopup() {
  const { recentXPGains, clearRecentXP } = useGamificationStore();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (recentXPGains.length > 0) {
      setVisible(true);
      const timer = setTimeout(() => {
        setVisible(false);
        setTimeout(clearRecentXP, 500);
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [recentXPGains, clearRecentXP]);

  const latest = recentXPGains[recentXPGains.length - 1];

  return (
    <AnimatePresence>
      {visible && latest && (
        <motion.div
          initial={{ opacity: 0, y: 20, scale: 0.8 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -30, scale: 0.9 }}
          transition={{ type: "spring", bounce: 0.4 }}
          className="fixed bottom-24 left-1/2 -translate-x-1/2 z-[100] pointer-events-none"
        >
          <div className="bg-yellow-500 text-slate-900 font-black text-lg px-5 py-2.5 rounded-2xl shadow-2xl shadow-yellow-500/40 flex items-center gap-2">
            <Zap size={20} className="fill-slate-900" />
            +{latest.amount} XP
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
