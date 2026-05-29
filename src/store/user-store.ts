"use client";

import { create } from "zustand";
import type { Profile } from "@/types";

interface UserState {
  profile: Profile | null;
  // true enquanto aguarda a primeira resposta de autenticação.
  // Vira false quando setProfile é chamado (com ou sem profile).
  isLoading: boolean;
  isAuthenticated: boolean;

  setProfile: (profile: Profile | null) => void;
  updateProfile: (updates: Partial<Profile>) => void;
  setLoading: (loading: boolean) => void;
  clearUser: () => void;
}

export const useUserStore = create<UserState>()((set) => ({
  profile: null,
  isLoading: true,
  isAuthenticated: false,

  setProfile: (profile) =>
    set({ profile, isAuthenticated: !!profile, isLoading: false }),

  updateProfile: (updates) =>
    set((state) => ({
      profile: state.profile ? { ...state.profile, ...updates } : null,
    })),

  setLoading: (isLoading) => set({ isLoading }),

  clearUser: () =>
    set({ profile: null, isAuthenticated: false, isLoading: false }),
}));
