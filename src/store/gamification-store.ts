"use client";

import { create } from "zustand";
import type { Achievement } from "@/types";
import { xpProgressPercent } from "@/lib/utils";

interface XPGain {
  amount: number;
  reason: string;
  timestamp: number;
}

interface GamificationState {
  // Estado atual
  xpTotal: number;
  xpLevel: number;
  currentStreak: number;
  longestStreak: number;
  tasksCompleted: number;
  vocabularyLearned: number;

  // Animações/feedback
  recentXPGains: XPGain[];
  leveledUp: boolean;
  newAchievements: Achievement[];
  showStreakCelebration: boolean;

  // Getters
  xpProgressPercent: () => number;

  // Actions
  addXP: (amount: number, reason: string) => void;
  setLevel: (level: number) => void;
  setStreak: (streak: number) => void;
  incrementTasksCompleted: () => void;
  incrementVocabularyLearned: (count?: number) => void;
  triggerLevelUp: () => void;
  dismissLevelUp: () => void;
  addNewAchievement: (achievement: Achievement) => void;
  dismissAchievements: () => void;
  triggerStreakCelebration: () => void;
  dismissStreakCelebration: () => void;
  clearRecentXP: () => void;
  syncFromProfile: (data: {
    xp_total: number;
    xp_level: number;
    current_streak: number;
    longest_streak: number;
    tasks_completed: number;
    vocabulary_learned: number;
  }) => void;
}

export const useGamificationStore = create<GamificationState>((set, get) => ({
  xpTotal: 0,
  xpLevel: 1,
  currentStreak: 0,
  longestStreak: 0,
  tasksCompleted: 0,
  vocabularyLearned: 0,
  recentXPGains: [],
  leveledUp: false,
  newAchievements: [],
  showStreakCelebration: false,

  xpProgressPercent: () => xpProgressPercent(get().xpTotal, get().xpLevel),

  addXP: (amount, reason) =>
    set((state) => ({
      xpTotal: state.xpTotal + amount,
      recentXPGains: [
        ...state.recentXPGains.slice(-4),
        { amount, reason, timestamp: Date.now() },
      ],
    })),

  setLevel: (level) => set({ xpLevel: level }),

  setStreak: (streak) =>
    set((state) => ({
      currentStreak: streak,
      longestStreak: Math.max(streak, state.longestStreak),
    })),

  incrementTasksCompleted: () =>
    set((state) => ({ tasksCompleted: state.tasksCompleted + 1 })),

  incrementVocabularyLearned: (count = 1) =>
    set((state) => ({ vocabularyLearned: state.vocabularyLearned + count })),

  triggerLevelUp: () => set({ leveledUp: true }),
  dismissLevelUp: () => set({ leveledUp: false }),

  addNewAchievement: (achievement) =>
    set((state) => ({
      newAchievements: [...state.newAchievements, achievement],
    })),

  dismissAchievements: () => set({ newAchievements: [] }),

  triggerStreakCelebration: () => set({ showStreakCelebration: true }),
  dismissStreakCelebration: () => set({ showStreakCelebration: false }),

  clearRecentXP: () => set({ recentXPGains: [] }),

  syncFromProfile: (data) =>
    set({
      xpTotal: data.xp_total,
      xpLevel: data.xp_level,
      currentStreak: data.current_streak,
      longestStreak: data.longest_streak,
      tasksCompleted: data.tasks_completed,
      vocabularyLearned: data.vocabulary_learned,
    }),
}));
