"use client";

import { create } from "zustand";
import type { Task, TaskStatus } from "@/types";

interface TasksState {
  tasks: Task[];
  currentTaskIndex: number;
  isGenerating: boolean;
  isSubmitting: boolean;
  lastGeneratedAt: string | null;

  // Getters
  currentTask: () => Task | null;
  completedTasks: () => Task[];
  pendingTasks: () => Task[];
  progressPercent: () => number;

  // Actions
  setTasks: (tasks: Task[]) => void;
  updateTaskStatus: (taskId: string, status: TaskStatus, xpEarned?: number) => void;
  setCurrentTaskIndex: (index: number) => void;
  advanceToNextTask: () => void;
  setGenerating: (generating: boolean) => void;
  setSubmitting: (submitting: boolean) => void;
  resetTasks: () => void;
}

export const useTasksStore = create<TasksState>((set, get) => ({
  tasks: [],
  currentTaskIndex: 0,
  isGenerating: false,
  isSubmitting: false,
  lastGeneratedAt: null,

  currentTask: () => {
    const { tasks, currentTaskIndex } = get();
    return tasks[currentTaskIndex] ?? null;
  },

  completedTasks: () =>
    get().tasks.filter((t) => t.progress?.status === "concluida"),

  pendingTasks: () =>
    get().tasks.filter((t) =>
      !t.progress || t.progress.status === "pendente"
    ),

  progressPercent: () => {
    const { tasks } = get();
    if (tasks.length === 0) return 0;
    const done = tasks.filter((t) => t.progress?.status === "concluida").length;
    return Math.round((done / tasks.length) * 100);
  },

  setTasks: (tasks) =>
    set({
      tasks,
      currentTaskIndex: 0,
      lastGeneratedAt: new Date().toISOString(),
    }),

  updateTaskStatus: (taskId, status, xpEarned) =>
    set((state) => ({
      tasks: state.tasks.map((t) =>
        t.id === taskId
          ? {
              ...t,
              progress: {
                ...(t.progress ?? {
                  id: "",
                  user_id: "",
                  task_id: taskId,
                  attempts: 0,
                  xp_earned: 0,
                  created_at: new Date().toISOString(),
                }),
                status,
                xp_earned: xpEarned ?? t.progress?.xp_earned ?? 0,
                completed_at: status === "concluida" ? new Date().toISOString() : undefined,
              },
            }
          : t
      ),
    })),

  setCurrentTaskIndex: (currentTaskIndex) => set({ currentTaskIndex }),

  advanceToNextTask: () => {
    const { tasks, currentTaskIndex } = get();
    const nextIndex = currentTaskIndex + 1;
    if (nextIndex < tasks.length) {
      set({ currentTaskIndex: nextIndex });
    }
  },

  setGenerating: (isGenerating) => set({ isGenerating }),
  setSubmitting: (isSubmitting) => set({ isSubmitting }),

  resetTasks: () =>
    set({
      tasks: [],
      currentTaskIndex: 0,
      isGenerating: false,
      isSubmitting: false,
    }),
}));
