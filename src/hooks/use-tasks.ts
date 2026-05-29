"use client";

import { useCallback } from "react";
import { useTasksStore } from "@/store/tasks-store";
import { useGamificationStore } from "@/store/gamification-store";
import { useUserStore } from "@/store/user-store";
import type { Task, TaskProgress, TaskStatus } from "@/types";
import toast from "react-hot-toast";

type TodayResponse = { tasks: Task[]; progress: TaskProgress[] };

export function useTasks() {
  const { tasks, setTasks, updateTaskStatus, advanceToNextTask, setGenerating, setSubmitting } = useTasksStore();
  const { addXP, incrementTasksCompleted } = useGamificationStore();
  const { profile } = useUserStore();

  const loadTodayTasks = useCallback(async () => {
    if (!profile) return;

    // Rejeita imediatamente IDs que não são UUIDs válidos.
    // Impede que dados rehidratados do localStorage cheguem à API.
    const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!UUID_RE.test(profile.id)) {
      if (process.env.NODE_ENV === "development") {
        console.warn("[loadTodayTasks] profile.id inválido, ignorando:", profile.id);
      }
      return;
    }

    try {
      const res = await fetch(`/api/tasks/today?userId=${profile.id}`);

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error ?? `HTTP ${res.status}`);
      }

      const { tasks: tasksData, progress: progressData }: TodayResponse = await res.json();

      const progressMap = new Map<string, TaskProgress>();
      for (const p of progressData) {
        progressMap.set(p.task_id, p);
      }

      const mapped = tasksData.map((t) => ({
        ...t,
        progress: progressMap.get(t.id),
      }));

      setTasks(mapped);
      return mapped;
    } catch (err) {
      console.error("[loadTodayTasks]:", err);
      toast.error("Erro ao carregar tarefas");
    }
  }, [profile, setTasks]);

  const generateTasks = useCallback(async () => {
    if (!profile) return;

    setGenerating(true);
    try {
      const res = await fetch("/api/tasks/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: profile.id,
          level: profile.level,
          weakAreas: profile.weak_areas,
          completedTaskTypes: [],
          preferredTopics: profile.preferred_topics,
          count: profile.daily_goal,
        }),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error ?? `HTTP ${res.status}`);
      }

      await loadTodayTasks();
      toast.success("Novas tarefas geradas! 🎯");
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Erro ao gerar tarefas";
      console.error("[generateTasks]:", msg);
      toast.error(msg.startsWith("HTTP") || msg.includes("IA") ? msg : "Erro ao gerar tarefas. Tente novamente.");
    } finally {
      setGenerating(false);
    }
  }, [profile, setGenerating, loadTodayTasks]);

  // Recebe a tarefa explicitamente da UI para evitar o mismatch de índice entre
  // tasks[] (store, não filtrado) e activeTasks[] (UI, filtrado por status).
  // Bug: currentTask() do store usava tasks[currentTaskIndex] que aponta para a
  // tarefa anterior quando alguma já foi concluída e o array foi filtrado na UI.
  const submitAnswer = useCallback(async (answer: unknown, taskFromUI: Task) => {
    if (!taskFromUI || !profile) return null;

    setSubmitting(true);
    try {
      const res = await fetch("/api/tasks/validate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          taskId: taskFromUI.id,
          userId: profile.id,
          answer,
          taskType: taskFromUI.type,
        }),
      });

      const result = await res.json();

      if (result.correct) {
        addXP(result.xp_earned, `Tarefa concluída: ${taskFromUI.title}`);
        incrementTasksCompleted();
        updateTaskStatus(taskFromUI.id, "concluida", result.xp_earned);
      }

      return result;
    } catch {
      toast.error("Erro ao enviar resposta");
      return null;
    } finally {
      setSubmitting(false);
    }
  }, [profile, setSubmitting, addXP, incrementTasksCompleted, updateTaskStatus]);

  const skipTask = useCallback(async (taskFromUI: Task) => {
    if (!taskFromUI) return;
    updateTaskStatus(taskFromUI.id, "pulada");
    advanceToNextTask();
  }, [updateTaskStatus, advanceToNextTask]);

  return {
    tasks,
    loadTodayTasks,
    generateTasks,
    submitAnswer,
    skipTask,
  };
}
