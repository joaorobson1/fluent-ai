"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import {
  ArrowRight, Zap, Target, BookOpen, Trophy,
  TrendingUp, Calendar, Clock
} from "lucide-react";
import { AppShell } from "@/components/layout/app-shell";
import { StreakCard } from "@/components/gamification/streak-card";
import { XPPopup } from "@/components/gamification/xp-popup";
import { LevelUpModal } from "@/components/gamification/level-up-modal";
import { AchievementToast } from "@/components/gamification/achievement-toast";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useProfile } from "@/hooks/use-profile";
import { useTasks } from "@/hooks/use-tasks";
import { useGamificationStore } from "@/store/gamification-store";
import { useUserStore } from "@/store/user-store";
import {
  greeting, formatXP, levelTitle, xpForLevel,
  xpAtLevelStart, TASK_TYPE_ICONS, TASK_TYPE_LABELS
} from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";
import type { StreakEntry } from "@/types";
import { cn } from "@/lib/utils";

const MOTIVATIONAL_MESSAGES = [
  "Cada tarefa te aproxima mais do inglês fluente! 🚀",
  "Consistência é a chave. Você está no caminho certo! ⚡",
  "O inglês está cada vez mais natural para você! 🌟",
  "Pequenos passos todos os dias = grandes resultados! 💪",
  "Sua dedicação está fazendo diferença! 🔥",
];

export default function DashboardPage() {
  const { profile } = useProfile();
  const { isLoading: authLoading } = useUserStore();
  const { tasks, generateTasks, loadTodayTasks } = useTasks();
  const { xpTotal, xpLevel, currentStreak, longestStreak, tasksCompleted, xpProgressPercent } = useGamificationStore();
  const [weekData, setWeekData] = useState<boolean[]>([false, false, false, false, false, false, false]);
  const [weeklyXP, setWeeklyXP] = useState<number[]>([0, 0, 0, 0, 0, 0, 0]);
  const [isInitializing, setIsInitializing] = useState(true);

  // Válvula de segurança: garante que o loading nunca fica infinito.
  // Cobre qualquer caminho onde authLoading nunca vira false
  // (ex: onAuthStateChange não dispara, Supabase demora demais).
  useEffect(() => {
    const timer = setTimeout(() => setIsInitializing(false), 8000);
    return () => clearTimeout(timer);
  }, []);

  const motivationalMsg = MOTIVATIONAL_MESSAGES[new Date().getDay() % MOTIVATIONAL_MESSAGES.length];
  const xpNextLevel = xpForLevel(xpLevel);
  const xpCurrentLevelStart = xpAtLevelStart(xpLevel);
  const xpInCurrentLevel = xpTotal - xpCurrentLevelStart;

  useEffect(() => {
    // authLoading = true enquanto getUser() ainda não respondeu.
    // Quando vira false, a sessão está resolvida (com ou sem profile).
    if (authLoading) return;

    if (!profile) {
      setIsInitializing(false);
      return;
    }

    async function init() {
      try {
        await loadTodayTasks();

        const supabase = createClient();
        const weekStart = new Date();
        weekStart.setDate(weekStart.getDate() - 6);
        weekStart.setHours(0, 0, 0, 0);

        const { data: streaks } = await supabase
          .from("streaks")
          .select("*")
          .eq("user_id", profile.id)
          .gte("date", weekStart.toISOString().split("T")[0])
          .order("date", { ascending: true });

        if (streaks) {
          const today = new Date();
          const week = Array.from({ length: 7 }, (_, i) => {
            const d = new Date(today);
            d.setDate(d.getDate() - (6 - i));
            const dateStr = d.toISOString().split("T")[0];
            return streaks.find((s: StreakEntry) => s.date === dateStr);
          });

          setWeekData(week.map((s) => !!s?.goal_met));
          setWeeklyXP(week.map((s) => s?.xp_earned ?? 0));
        }
      } finally {
        // Garante que o loading sempre termina, mesmo que loadTodayTasks
        // ou a query de streaks falhem silenciosamente.
        setIsInitializing(false);
      }
    }

    init();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profile?.id, authLoading]);

  const completedToday = tasks.filter((t) => t.progress?.status === "concluida").length;
  const dailyGoal = profile?.daily_goal ?? 5;
  const dailyProgressPercent = Math.min((completedToday / dailyGoal) * 100, 100);
  const pendingTasks = tasks.filter((t) => !t.progress || t.progress.status === "pendente");
  const nextTask = pendingTasks[0];
  const maxWeeklyXP = Math.max(...weeklyXP, 1);

  return (
    <AppShell title={`${greeting()}, ${profile?.full_name?.split(" ")[0] ?? ""}! 👋`}>
      <XPPopup />
      <LevelUpModal />
      <AchievementToast />

      <div className="space-y-6">
        {/* Motivational message */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-slate-400 text-sm"
        >
          {motivationalMsg}
        </motion.div>

        {/* Stats Grid */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="grid grid-cols-2 md:grid-cols-4 gap-3"
        >
          {/* XP Card */}
          <div className="card-solid p-4 col-span-2 md:col-span-1">
            <div className="flex items-start justify-between mb-3">
              <div>
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Total XP</p>
                <p className="font-display font-black text-2xl text-white mt-0.5">{formatXP(xpTotal)}</p>
              </div>
              <div className="w-9 h-9 bg-yellow-500/20 rounded-xl flex items-center justify-center">
                <Zap size={18} className="text-yellow-400" />
              </div>
            </div>
            <div className="space-y-1">
              <div className="flex justify-between text-xs text-slate-500">
                <span>Nível {xpLevel} — {levelTitle(xpLevel)}</span>
                <span>{xpProgressPercent()}%</span>
              </div>
              <Progress value={xpProgressPercent()} className="h-1.5" />
              <p className="text-xs text-slate-600">{formatXP(xpInCurrentLevel)}/{formatXP(xpNextLevel)} XP</p>
            </div>
          </div>

          {/* Meta diária */}
          <div className="card-solid p-4">
            <div className="flex items-start justify-between mb-3">
              <div>
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Meta Hoje</p>
                <p className="font-display font-black text-2xl text-white mt-0.5">
                  {completedToday}/{dailyGoal}
                </p>
              </div>
              <div className="w-9 h-9 bg-brand-500/20 rounded-xl flex items-center justify-center">
                <Target size={18} className="text-brand-400" />
              </div>
            </div>
            <Progress value={dailyProgressPercent} className="h-1.5" />
            {completedToday >= dailyGoal && (
              <p className="text-xs text-green-400 font-medium mt-1">Meta atingida! 🎉</p>
            )}
          </div>

          {/* Tarefas totais */}
          <div className="card-solid p-4">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Tarefas</p>
                <p className="font-display font-black text-2xl text-white mt-0.5">{tasksCompleted}</p>
                <p className="text-xs text-slate-500 mt-1">concluídas</p>
              </div>
              <div className="w-9 h-9 bg-green-500/20 rounded-xl flex items-center justify-center">
                <BookOpen size={18} className="text-green-400" />
              </div>
            </div>
          </div>

          {/* Conquistas */}
          <div className="card-solid p-4">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Conquistas</p>
                <p className="font-display font-black text-2xl text-white mt-0.5">
                  <Link href="/conquistas" className="hover:text-brand-400 transition-colors">Ver</Link>
                </p>
                <p className="text-xs text-slate-500 mt-1">desbloqueadas</p>
              </div>
              <div className="w-9 h-9 bg-yellow-500/20 rounded-xl flex items-center justify-center">
                <Trophy size={18} className="text-yellow-400" />
              </div>
            </div>
          </div>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Streak Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <StreakCard
              streak={currentStreak}
              longestStreak={longestStreak}
              weekDays={weekData}
            />
          </motion.div>

          {/* Próxima Missão */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25 }}
            className="md:col-span-2"
          >
            <div className="card-solid p-5 h-full">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-slate-200">Próxima Missão</h3>
                <Badge variant="default">
                  {pendingTasks.length} restante{pendingTasks.length !== 1 ? "s" : ""}
                </Badge>
              </div>

              {nextTask ? (
                <div className="space-y-4">
                  <div className="flex items-start gap-3 p-4 bg-slate-800/60 rounded-xl border border-slate-700">
                    <span className="text-2xl">{TASK_TYPE_ICONS[nextTask.type]}</span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <Badge variant="secondary" className="text-xs">
                          {TASK_TYPE_LABELS[nextTask.type]}
                        </Badge>
                        <div className="xp-badge">
                          <Zap size={10} />
                          +{nextTask.xp_reward} XP
                        </div>
                      </div>
                      <p className="font-semibold text-white">{nextTask.title}</p>
                      {nextTask.description && (
                        <p className="text-sm text-slate-400 mt-0.5">{nextTask.description}</p>
                      )}
                    </div>
                  </div>

                  <Link href="/tarefas">
                    <Button className="w-full gap-2">
                      Iniciar tarefa <ArrowRight size={16} />
                    </Button>
                  </Link>
                </div>
              ) : tasks.length === 0 ? (
                <div className="text-center py-6">
                  <p className="text-slate-500 text-sm mb-4">
                    {isInitializing ? "Carregando tarefas..." : "Nenhuma tarefa para hoje ainda."}
                  </p>
                  {!isInitializing && (
                    <Button onClick={generateTasks} variant="outline" size="sm">
                      Gerar tarefas de hoje ⚡
                    </Button>
                  )}
                </div>
              ) : (
                <div className="text-center py-6">
                  <p className="text-4xl mb-3">🎉</p>
                  <p className="font-semibold text-white mb-1">Meta do dia concluída!</p>
                  <p className="text-sm text-slate-400">Você é incrível. Volte amanhã!</p>
                </div>
              )}
            </div>
          </motion.div>
        </div>

        {/* Gráfico de XP semanal */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="card-solid p-5"
        >
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp size={18} className="text-brand-400" />
            <h3 className="font-semibold text-slate-200">XP dos Últimos 7 Dias</h3>
          </div>

          <div className="flex items-end gap-2 h-20">
            {weeklyXP.map((xp, i) => {
              const days = ["D", "S", "T", "Q", "Q", "S", "S"];
              const today = new Date().getDay();
              const dayIndex = (today - (6 - i) + 7) % 7;
              const isToday = i === 6;

              return (
                <div key={i} className="flex flex-col items-center gap-1 flex-1">
                  <div
                    className={cn(
                      "w-full rounded-t-lg transition-all duration-500",
                      isToday ? "bg-brand-500" : xp > 0 ? "bg-slate-600" : "bg-slate-800"
                    )}
                    style={{ height: `${Math.max((xp / maxWeeklyXP) * 60, xp > 0 ? 8 : 4)}px` }}
                  />
                  <span className={cn("text-[10px]", isToday ? "text-brand-400 font-bold" : "text-slate-600")}>
                    {days[dayIndex]}
                  </span>
                </div>
              );
            })}
          </div>
        </motion.div>

        {/* Tarefas de hoje - visão rápida */}
        {tasks.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.35 }}
            className="card-solid p-5"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Calendar size={18} className="text-brand-400" />
                <h3 className="font-semibold text-slate-200">Tarefas de Hoje</h3>
              </div>
              <Link href="/tarefas" className="text-sm text-brand-400 hover:text-brand-300 transition-colors">
                Ver todas
              </Link>
            </div>

            <div className="space-y-2">
              {tasks.slice(0, 5).map((task, i) => {
                const isDone = task.progress?.status === "concluida";
                const isLocked = !task.unlocked_at && i > 0;

                return (
                  <div
                    key={task.id}
                    className={cn(
                      "flex items-center gap-3 p-3 rounded-xl transition-all",
                      isDone ? "bg-green-500/10" : isLocked ? "opacity-50" : "bg-slate-800/40"
                    )}
                  >
                    <div className={cn(
                      "w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 text-xs",
                      isDone ? "bg-green-500 text-white" : "bg-slate-700 text-slate-400"
                    )}>
                      {isDone ? "✓" : i + 1}
                    </div>
                    <span className="text-sm">{TASK_TYPE_ICONS[task.type]}</span>
                    <span className={cn("text-sm flex-1 truncate", isDone ? "text-slate-400 line-through" : "text-slate-200")}>
                      {task.title}
                    </span>
                    <div className="flex items-center gap-1 text-xs text-slate-500">
                      <Clock size={11} />
                      <span>~1min</span>
                    </div>
                    {isDone && (
                      <div className="xp-badge">
                        <Zap size={10} />
                        {task.progress?.xp_earned}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {tasks.length > 5 && (
              <Link href="/tarefas">
                <Button variant="ghost" className="w-full mt-3 text-sm">
                  +{tasks.length - 5} tarefas restantes
                </Button>
              </Link>
            )}
          </motion.div>
        )}
      </div>
    </AppShell>
  );
}
