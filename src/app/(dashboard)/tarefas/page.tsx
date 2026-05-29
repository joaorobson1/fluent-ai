"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle, Zap, Trophy, RefreshCw } from "lucide-react";
import { AppShell } from "@/components/layout/app-shell";
import { TaskCardWrapper } from "@/components/tasks/task-card-wrapper";
import { XPPopup } from "@/components/gamification/xp-popup";
import { LevelUpModal } from "@/components/gamification/level-up-modal";
import { Button } from "@/components/ui/button";
import { useTasks } from "@/hooks/use-tasks";
import { useProfile } from "@/hooks/use-profile";
import { useUserStore } from "@/store/user-store";
import { useTasksStore } from "@/store/tasks-store";

export default function TarefasPage() {
  const { profile } = useProfile();
  const { isLoading: authLoading } = useUserStore();
  const { tasks, loadTodayTasks, generateTasks, submitAnswer, skipTask } = useTasks();
  const { currentTaskIndex, setCurrentTaskIndex, isGenerating, isSubmitting } = useTasksStore();
  const [allDone, setAllDone] = useState(false);

  useEffect(() => {
    if (authLoading || !profile) return;
    loadTodayTasks();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profile?.id, authLoading]);

  const activeTasks = tasks.filter((t) => !t.progress || t.progress.status === "pendente");
  const completedTasks = tasks.filter((t) => t.progress?.status === "concluida");
  const currentTask = activeTasks[currentTaskIndex] ?? null;

  useEffect(() => {
    if (tasks.length > 0 && activeTasks.length === 0) {
      setAllDone(true);
    }
  }, [tasks, activeTasks]);

  // Passa a tarefa explicitamente para evitar mismatch de índice:
  // submitAnswer derivava a tarefa de tasks[currentTaskIndex] (store, array completo),
  // mas a UI usa activeTasks[currentTaskIndex] (apenas pendentes).
  // Após uma tarefa ser concluída, os arrays divergem e a validação usava a tarefa errada.
  async function handleSubmit(answer: unknown) {
    if (!currentTask) return null;
    return await submitAnswer(answer, currentTask);
  }

  async function handleSkip() {
    if (!currentTask) return;
    await skipTask(currentTask);
  }

  function handleNext() {
    if (currentTaskIndex < activeTasks.length - 1) {
      setCurrentTaskIndex(currentTaskIndex + 1);
    } else {
      setAllDone(true);
    }
  }

  if (isGenerating) {
    return (
      <AppShell title="Tarefas">
        <div className="flex flex-col items-center justify-center min-h-[50vh] gap-6">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ repeat: Infinity, duration: 1.5, ease: "linear" }}
          >
            <RefreshCw size={40} className="text-brand-400" />
          </motion.div>
          <div className="text-center">
            <p className="font-display font-bold text-xl text-white mb-2">
              A IA está preparando suas tarefas...
            </p>
            <p className="text-slate-400">Personalizando com base no seu perfil</p>
          </div>
        </div>
      </AppShell>
    );
  }

  if (tasks.length === 0) {
    return (
      <AppShell title="Tarefas">
        <div className="flex flex-col items-center justify-center min-h-[50vh] gap-6 text-center">
          <div className="text-6xl animate-float">🎯</div>
          <div>
            <h2 className="font-display font-bold text-2xl text-white mb-2">
              Nenhuma tarefa hoje ainda
            </h2>
            <p className="text-slate-400 mb-6">
              Gere suas tarefas do dia com IA personalizada para o seu nível!
            </p>
          </div>
          <Button onClick={generateTasks} size="lg" className="gap-2">
            <Zap size={18} /> Gerar tarefas de hoje
          </Button>
        </div>
      </AppShell>
    );
  }

  if (allDone) {
    const totalXP = completedTasks.reduce((sum, t) => sum + (t.progress?.xp_earned ?? 0), 0);

    return (
      <AppShell title="Tarefas">
        <XPPopup />
        <div className="flex flex-col items-center justify-center min-h-[50vh] text-center max-w-md mx-auto">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", bounce: 0.5 }}
            className="text-7xl mb-6"
          >
            🏆
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <h2 className="font-display font-black text-3xl text-white mb-2">
              Meta do dia concluída!
            </h2>
            <p className="text-slate-400 mb-6">
              Você completou todas as tarefas de hoje. Incrível!
            </p>

            <div className="grid grid-cols-2 gap-4 mb-8">
              <div className="card-solid p-4 text-center">
                <Trophy className="text-yellow-400 mx-auto mb-1" size={24} />
                <p className="font-bold text-2xl text-white">{completedTasks.length}</p>
                <p className="text-xs text-slate-400">Tarefas feitas</p>
              </div>
              <div className="card-solid p-4 text-center">
                <Zap className="text-brand-400 mx-auto mb-1" size={24} />
                <p className="font-bold text-2xl text-white">+{totalXP}</p>
                <p className="text-xs text-slate-400">XP ganhos</p>
              </div>
            </div>

            <Button onClick={() => setAllDone(false)} variant="outline" className="gap-2 mb-3">
              Ver minhas respostas
            </Button>
            <p className="text-xs text-slate-500">Volte amanhã para novas tarefas! 🌙</p>
          </motion.div>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell title="Tarefas" noPadding>
      <XPPopup />
      <LevelUpModal />

      <div className="px-4 py-6 md:px-8 md:py-8">
        <AnimatePresence mode="wait">
          {currentTask ? (
            <TaskCardWrapper
              key={currentTask.id}
              task={currentTask}
              taskNumber={currentTaskIndex + 1}
              totalTasks={activeTasks.length}
              onSubmit={handleSubmit}
              onSkip={handleSkip}
              onNext={handleNext}
              isSubmitting={isSubmitting}
            />
          ) : (
            <div className="text-center py-12">
              <CheckCircle className="text-green-400 mx-auto mb-3" size={40} />
              <p className="font-semibold text-white">Todas as tarefas concluídas!</p>
            </div>
          )}
        </AnimatePresence>
      </div>
    </AppShell>
  );
}
