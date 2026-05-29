"use client";

import { useCallback } from "react";
import { useTasksStore } from "@/store/tasks-store";
import { useGamificationStore } from "@/store/gamification-store";
import { useUserStore } from "@/store/user-store";
import type { Task, TaskProgress, TaskStatus } from "@/types";
import toast from "react-hot-toast";

type TodayResponse = { tasks: Task[]; progress: TaskProgress[] };

export function useTasks() {
  const { tasks, setTasks, updateTaskStatus, advanceToNextTask, setGenerating, setSubmitting, currentTask } = useTasksStore();
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

  const submitAnswer = useCallback(async (answer: unknown) => {
    const task = currentTask();
    if (!task || !profile) return null;

    setSubmitting(true);
    try {
      const res = await fetch("/api/tasks/validate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          taskId: task.id,
          userId: profile.id,
          answer,
          taskType: task.type,
          taskContent: task.content,
        }),
      });

      const result = await res.json();

      if (result.correct) {
        addXP(result.xp_earned, `Tarefa concluída: ${task.title}`);
        incrementTasksCompleted();
        updateTaskStatus(task.id, "concluida", result.xp_earned);
      }

      return result;
    } catch {
      toast.error("Erro ao enviar resposta");
      return null;
    } finally {
      setSubmitting(false);
    }
  }, [currentTask, profile, setSubmitting, addXP, incrementTasksCompleted, updateTaskStatus]);

  const skipTask = useCallback(async () => {
    const task = currentTask();
    if (!task) return;

    updateTaskStatus(task.id, "pulada");
    advanceToNextTask();
  }, [currentTask, updateTaskStatus, advanceToNextTask]);

  return {
    tasks,
    currentTask: currentTask(),
    loadTodayTasks,
    generateTasks,
    submitAnswer,
    skipTask,
  };
}
