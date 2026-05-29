"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Trophy, Lock, Zap } from "lucide-react";
import { AppShell } from "@/components/layout/app-shell";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { createClient } from "@/lib/supabase/client";
import { useUserStore } from "@/store/user-store";
import { useGamificationStore } from "@/store/gamification-store";
import type { Achievement } from "@/types";
import { cn } from "@/lib/utils";

export default function ConquistasPage() {
  const { profile } = useUserStore();
  const { xpTotal, currentStreak, tasksCompleted, vocabularyLearned } = useGamificationStore();
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [unlocked, setUnlocked] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      if (!profile) return;
      const supabase = createClient();

      const [{ data: allAchievements }, { data: userAchievements }] = await Promise.all([
        supabase.from("achievements").select("*").order("category"),
        supabase
          .from("user_achievements")
          .select("achievement_id")
          .eq("user_id", profile.id),
      ]);

      setAchievements(allAchievements as Achievement[] ?? []);
      setUnlocked(new Set((userAchievements ?? []).map((ua: { achievement_id: string }) => ua.achievement_id)));
      setLoading(false);
    }
    load();
  }, [profile]);

  const categories = [
    { key: "streak", label: "Sequência", icon: "🔥", color: "text-orange-400" },
    { key: "xp", label: "Experiência", icon: "⭐", color: "text-yellow-400" },
    { key: "tasks", label: "Tarefas", icon: "✅", color: "text-green-400" },
    { key: "vocabulary", label: "Vocabulário", icon: "📚", color: "text-brand-400" },
    { key: "special", label: "Especiais", icon: "💎", color: "text-accent-400" },
  ];

  // Progress for each achievement requirement
  function getProgress(req: Record<string, unknown>): number {
    if (req.streak) return Math.min((currentStreak / Number(req.streak)) * 100, 100);
    if (req.xp) return Math.min((xpTotal / Number(req.xp)) * 100, 100);
    if (req.tasks_completed) return Math.min((tasksCompleted / Number(req.tasks_completed)) * 100, 100);
    if (req.vocabulary) return Math.min((vocabularyLearned / Number(req.vocabulary)) * 100, 100);
    return 0;
  }

  function getProgressLabel(req: Record<string, unknown>): string {
    if (req.streak) return `${currentStreak}/${req.streak} dias`;
    if (req.xp) return `${xpTotal}/${req.xp} XP`;
    if (req.tasks_completed) return `${tasksCompleted}/${req.tasks_completed} tarefas`;
    if (req.vocabulary) return `${vocabularyLearned}/${req.vocabulary} palavras`;
    return "";
  }

  const unlockedCount = unlocked.size;
  const totalCount = achievements.filter((a) => !a.is_hidden).length;

  return (
    <AppShell title="Conquistas">
      <div className="space-y-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="card-solid p-5"
        >
          <div className="flex items-center gap-3 mb-3">
            <div className="w-12 h-12 bg-yellow-500/20 rounded-xl flex items-center justify-center">
              <Trophy size={24} className="text-yellow-400" />
            </div>
            <div>
              <h2 className="font-display font-bold text-xl text-white">
                {unlockedCount} conquistas desbloqueadas
              </h2>
              <p className="text-sm text-slate-400">de {totalCount} disponíveis</p>
            </div>
          </div>
          <Progress
            value={totalCount > 0 ? (unlockedCount / totalCount) * 100 : 0}
            className="h-2"
            indicatorClassName="bg-gradient-to-r from-yellow-500 to-orange-400"
          />
        </motion.div>

        {/* Achievements by category */}
        {categories.map((cat, catIndex) => {
          const catAchievements = achievements.filter(
            (a) => a.category === cat.key && !a.is_hidden
          );

          if (catAchievements.length === 0) return null;

          return (
            <motion.div
              key={cat.key}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: catIndex * 0.1 }}
            >
              <div className="flex items-center gap-2 mb-3">
                <span className="text-lg">{cat.icon}</span>
                <h3 className={cn("font-semibold text-base", cat.color)}>{cat.label}</h3>
                <Badge variant="secondary" className="ml-auto">
                  {catAchievements.filter((a) => unlocked.has(a.id)).length}/{catAchievements.length}
                </Badge>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {catAchievements.map((achievement, i) => {
                  const isUnlocked = unlocked.has(achievement.id);
                  const progress = getProgress(achievement.requirement);
                  const progressLabel = getProgressLabel(achievement.requirement);

                  return (
                    <motion.div
                      key={achievement.id}
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: catIndex * 0.1 + i * 0.05 }}
                      className={cn(
                        "card-solid p-4 transition-all duration-200",
                        isUnlocked
                          ? "border-yellow-500/30 bg-yellow-500/5"
                          : "opacity-70"
                      )}
                    >
                      <div className="flex items-start gap-3">
                        <div className={cn(
                          "w-12 h-12 rounded-xl flex items-center justify-center text-2xl flex-shrink-0",
                          isUnlocked
                            ? "bg-yellow-500/20"
                            : "bg-slate-800 grayscale"
                        )}>
                          {isUnlocked ? achievement.icon : <Lock size={18} className="text-slate-600" />}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-0.5">
                            <h4 className={cn(
                              "font-semibold text-sm",
                              isUnlocked ? "text-white" : "text-slate-500"
                            )}>
                              {achievement.title}
                            </h4>
                            {isUnlocked && (
                              <div className="xp-badge ml-auto">
                                <Zap size={10} /> +{achievement.xp_reward}
                              </div>
                            )}
                          </div>
                          <p className={cn(
                            "text-xs leading-snug",
                            isUnlocked ? "text-slate-400" : "text-slate-600"
                          )}>
                            {achievement.description}
                          </p>

                          {!isUnlocked && progress > 0 && (
                            <div className="mt-2 space-y-1">
                              <Progress value={progress} className="h-1" />
                              <p className="text-xs text-slate-600">{progressLabel}</p>
                            </div>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </motion.div>
          );
        })}
      </div>
    </AppShell>
  );
}
