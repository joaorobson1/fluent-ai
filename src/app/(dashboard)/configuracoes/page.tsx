"use client";

import { motion } from "framer-motion";
import { Bell, Target, Globe, LogOut, Trash2, ChevronRight } from "lucide-react";
import { AppShell } from "@/components/layout/app-shell";
import { useProfile } from "@/hooks/use-profile";
import { useUserStore } from "@/store/user-store";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { LEVEL_LABELS } from "@/lib/utils";
import type { UserLevel } from "@/types";
import toast from "react-hot-toast";
import { cn } from "@/lib/utils";

const GOALS = [3, 5, 7, 10];

export default function ConfiguracoesPage() {
  const router = useRouter();
  const { profile } = useProfile();
  const { updateProfile, clearUser } = useUserStore();

  async function updateSetting(updates: Record<string, unknown>) {
    if (!profile) return;
    const supabase = createClient();

    const { error } = await supabase
      .from("profiles")
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq("id", profile.id);

    if (error) {
      toast.error("Erro ao salvar configuração");
    } else {
      updateProfile(updates as Parameters<typeof updateProfile>[0]);
      toast.success("Configuração salva!");
    }
  }

  async function handleLogout() {
    const supabase = createClient();
    await supabase.auth.signOut();
    clearUser();
    router.push("/");
  }

  return (
    <AppShell title="Configurações">
      <div className="max-w-2xl mx-auto space-y-5">

        {/* Preferências de aprendizado */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="card-solid p-5"
        >
          <div className="flex items-center gap-2 mb-4">
            <Globe size={18} className="text-brand-400" />
            <h3 className="font-semibold text-slate-200">Aprendizado</h3>
          </div>

          {/* Nível de inglês */}
          <div className="mb-4">
            <p className="text-sm text-slate-400 mb-2">Nível de inglês</p>
            <div className="grid grid-cols-2 gap-2">
              {(Object.entries(LEVEL_LABELS) as [UserLevel, string][]).map(([value, label]) => (
                <button
                  key={value}
                  onClick={() => updateSetting({ level: value })}
                  className={cn(
                    "py-2.5 px-3 rounded-xl text-sm font-medium transition-all text-left border",
                    profile?.level === value
                      ? "bg-brand-500/20 border-brand-500/50 text-brand-300"
                      : "bg-slate-800/40 border-slate-700 text-slate-400 hover:border-slate-600"
                  )}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* Meta diária */}
          <div>
            <p className="text-sm text-slate-400 mb-2 flex items-center gap-2">
              <Target size={14} /> Meta diária de tarefas
            </p>
            <div className="flex gap-2">
              {GOALS.map((goal) => (
                <button
                  key={goal}
                  onClick={() => updateSetting({ daily_goal: goal })}
                  className={cn(
                    "flex-1 py-2.5 rounded-xl text-sm font-bold transition-all border",
                    profile?.daily_goal === goal
                      ? "bg-brand-500 border-brand-500 text-white"
                      : "bg-slate-800/40 border-slate-700 text-slate-400 hover:border-slate-600"
                  )}
                >
                  {goal}
                </button>
              ))}
            </div>
          </div>
        </motion.div>

        {/* Notificações */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="card-solid p-5"
        >
          <div className="flex items-center gap-2 mb-4">
            <Bell size={18} className="text-brand-400" />
            <h3 className="font-semibold text-slate-200">Notificações</h3>
          </div>

          <div className="flex items-center justify-between py-2">
            <div>
              <p className="text-sm text-slate-200 font-medium">Push notifications</p>
              <p className="text-xs text-slate-500">Lembretes de tarefas e streak</p>
            </div>
            <button
              onClick={() => updateSetting({ notifications_enabled: !profile?.notifications_enabled })}
              className={cn(
                "w-12 h-6 rounded-full transition-all relative",
                profile?.notifications_enabled ? "bg-brand-500" : "bg-slate-700"
              )}
            >
              <div className={cn(
                "absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-all duration-200",
                profile?.notifications_enabled ? "left-6" : "left-0.5"
              )} />
            </button>
          </div>
        </motion.div>

        {/* Conta */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="card-solid overflow-hidden"
        >
          <div className="p-5 pb-3">
            <h3 className="font-semibold text-slate-200">Conta</h3>
          </div>

          <div className="divide-y divide-slate-800">
            <button
              onClick={handleLogout}
              className="w-full flex items-center justify-between px-5 py-3.5 text-sm text-slate-300 hover:bg-slate-800/50 transition-colors"
            >
              <div className="flex items-center gap-3">
                <LogOut size={16} className="text-slate-500" />
                <span>Sair da conta</span>
              </div>
              <ChevronRight size={16} className="text-slate-600" />
            </button>

            <button
              className="w-full flex items-center justify-between px-5 py-3.5 text-sm text-red-400 hover:bg-red-500/10 transition-colors"
              onClick={() => toast("Em desenvolvimento", { icon: "🚧" })}
            >
              <div className="flex items-center gap-3">
                <Trash2 size={16} />
                <span>Excluir conta</span>
              </div>
              <ChevronRight size={16} className="text-red-600" />
            </button>
          </div>
        </motion.div>

        {/* Version */}
        <div className="text-center text-xs text-slate-700 pb-4">
          Fluent AI v1.0.0 — Feito com ❤️ para brasileiros
        </div>
      </div>
    </AppShell>
  );
}
