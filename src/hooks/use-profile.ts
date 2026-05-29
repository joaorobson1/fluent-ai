"use client";

import { useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { useUserStore } from "@/store/user-store";
import { useGamificationStore } from "@/store/gamification-store";
import type { Profile } from "@/types";

export function useProfile() {
  const { profile, setProfile, isLoading } = useUserStore();
  const { syncFromProfile } = useGamificationStore();

  useEffect(() => {
    const supabase = createClient();
    let cancelled = false;

    async function resolveProfile(
      userId: string,
      meta?: { email?: string; full_name?: string; avatar_url?: string }
    ) {
      if (cancelled) return;

      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", userId)
        .single();

      if (cancelled) return;

      if (data && !error) {
        setProfile(data as Profile);
        syncFromProfile(data as Profile);
        return;
      }

      if (error?.code === "PGRST116") {
        // Linha não existe — tenta criar (requer policy INSERT da migration 002)
        const { data: created } = await supabase
          .from("profiles")
          .insert({
            id: userId,
            email: meta?.email ?? "",
            full_name:
              meta?.full_name ??
              meta?.email?.split("@")[0] ??
              "Usuário",
            avatar_url: meta?.avatar_url ?? null,
          })
          .select()
          .single();

        if (!cancelled && created) {
          setProfile(created as Profile);
          syncFromProfile(created as Profile);
          return;
        }
      }

      // Qualquer falha: marca auth como resolvida sem profile
      // para evitar loading infinito
      if (!cancelled) setProfile(null);
    }

    // ── Carregamento imediato ────────────────────────────────
    // getUser() é a fonte primária — não depende de evento assíncrono.
    // Isso resolve o problema do StrictMode em dev que faz cleanup
    // antes do INITIAL_SESSION do onAuthStateChange ser processado.
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (cancelled) return;

      if (process.env.NODE_ENV === "development") {
        console.debug("[useProfile] getUser:", user?.id ?? "sem sessão");
      }

      if (!user) {
        setProfile(null);
        return;
      }

      resolveProfile(user.id, {
        email: user.email,
        full_name:
          user.user_metadata?.full_name ?? user.user_metadata?.name,
        avatar_url: user.user_metadata?.avatar_url,
      });
    });

    // ── Mudanças futuras de sessão ───────────────────────────
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        if (cancelled) return;

        if (process.env.NODE_ENV === "development") {
          console.debug("[useProfile] evento:", event, "uid:", session?.user?.id ?? "none");
        }

        if (event === "SIGNED_OUT") {
          setProfile(null);
          return;
        }

        if (event === "SIGNED_IN" || event === "TOKEN_REFRESHED") {
          if (!session?.user) { setProfile(null); return; }
          resolveProfile(session.user.id, {
            email: session.user.email,
            full_name:
              session.user.user_metadata?.full_name ??
              session.user.user_metadata?.name,
            avatar_url: session.user.user_metadata?.avatar_url,
          });
        }
      }
    );

    return () => {
      cancelled = true;
      subscription.unsubscribe();
    };
  }, [setProfile, syncFromProfile]);

  return { profile, isLoading };
}
