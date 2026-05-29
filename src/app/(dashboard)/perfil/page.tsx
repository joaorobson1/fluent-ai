"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Camera, Zap, Flame, Trophy, BookOpen, Edit2, Save } from "lucide-react";
import { AppShell } from "@/components/layout/app-shell";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { useProfile } from "@/hooks/use-profile";
import { useGamificationStore } from "@/store/gamification-store";
import { useUserStore } from "@/store/user-store";
import { createClient } from "@/lib/supabase/client";
import { formatXP, levelTitle, LEVEL_LABELS, xpProgressPercent } from "@/lib/utils";
import toast from "react-hot-toast";

export default function PerfilPage() {
  const { profile } = useProfile();
  const { updateProfile } = useUserStore();
  const { xpTotal, xpLevel, currentStreak, longestStreak, tasksCompleted, vocabularyLearned } = useGamificationStore();
  const [editing, setEditing] = useState(false);
  const [fullName, setFullName] = useState(profile?.full_name ?? "");
  const [saving, setSaving] = useState(false);

  const initials = profile?.full_name
    ?.split(" ")
    .slice(0, 2)
    .map((n) => n[0])
    .join("") ?? "?";

  async function saveProfile() {
    if (!profile || !fullName.trim()) return;
    setSaving(true);

    const supabase = createClient();
    const { error } = await supabase
      .from("profiles")
      .update({ full_name: fullName.trim(), updated_at: new Date().toISOString() })
      .eq("id", profile.id);

    if (error) {
      toast.error("Erro ao salvar perfil");
    } else {
      updateProfile({ full_name: fullName.trim() });
      toast.success("Perfil atualizado!");
      setEditing(false);
    }
    setSaving(false);
  }

  const xpProgress = profile ? xpProgressPercent(xpTotal, xpLevel) : 0;

  const stats = [
    { icon: Zap, label: "XP Total", value: formatXP(xpTotal), color: "text-yellow-400", bg: "bg-yellow-500/10" },
    { icon: Flame, label: "Maior Streak", value: `${longestStreak}d`, color: "text-orange-400", bg: "bg-orange-500/10" },
    { icon: Trophy, label: "Tarefas", value: tasksCompleted.toString(), color: "text-brand-400", bg: "bg-brand-500/10" },
    { icon: BookOpen, label: "Vocabulário", value: vocabularyLearned.toString(), color: "text-green-400", bg: "bg-green-500/10" },
  ];

  return (
    <AppShell title="Meu Perfil">
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Profile card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="card-solid p-6"
        >
          <div className="flex items-start gap-4">
            <div className="relative">
              <Avatar className="h-20 w-20 ring-4 ring-brand-500/30">
                <AvatarImage src={profile?.avatar_url ?? ""} />
                <AvatarFallback className="text-2xl">{initials}</AvatarFallback>
              </Avatar>
              <button className="absolute bottom-0 right-0 w-7 h-7 bg-brand-500 rounded-full flex items-center justify-center shadow-lg">
                <Camera size={13} className="text-white" />
              </button>
            </div>

            <div className="flex-1 min-w-0">
              {editing ? (
                <div className="flex gap-2">
                  <Input
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="h-9 text-sm"
                    placeholder="Seu nome"
                  />
                  <Button size="sm" onClick={saveProfile} loading={saving} className="gap-1 shrink-0">
                    <Save size={14} />
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => setEditing(false)}>
                    ✕
                  </Button>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <h2 className="font-display font-bold text-xl text-white truncate">
                    {profile?.full_name ?? "Usuário"}
                  </h2>
                  <button onClick={() => { setEditing(true); setFullName(profile?.full_name ?? ""); }}>
                    <Edit2 size={14} className="text-slate-500 hover:text-slate-300 transition-colors" />
                  </button>
                </div>
              )}

              <div className="flex flex-wrap items-center gap-2 mt-1">
                <Badge variant="secondary">{LEVEL_LABELS[profile?.level ?? "iniciante"]}</Badge>
                <span className="text-sm text-slate-400">
                  {levelTitle(xpLevel)} • Nível {xpLevel}
                </span>
              </div>

              <p className="text-xs text-slate-500 mt-1">{profile?.email}</p>
            </div>
          </div>

          {/* XP progress */}
          <div className="mt-5 space-y-1.5">
            <div className="flex justify-between text-xs text-slate-400">
              <span className="flex items-center gap-1">
                <Zap size={12} className="text-yellow-400" /> {formatXP(xpTotal)} XP
              </span>
              <span>{xpProgress}% do nível {xpLevel + 1}</span>
            </div>
            <Progress value={xpProgress} className="h-2" />
          </div>
        </motion.div>

        {/* Stats grid */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="grid grid-cols-2 sm:grid-cols-4 gap-3"
        >
          {stats.map(({ icon: Icon, label, value, color, bg }) => (
            <div key={label} className="card-solid p-4 text-center">
              <div className={`w-10 h-10 ${bg} rounded-xl flex items-center justify-center mx-auto mb-2`}>
                <Icon size={20} className={color} />
              </div>
              <div className="font-display font-bold text-xl text-white">{value}</div>
              <div className="text-xs text-slate-500 mt-0.5">{label}</div>
            </div>
          ))}
        </motion.div>

        {/* Streak atual */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="card-solid p-5"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-slate-400 mb-1">Sequência atual</p>
              <div className="flex items-center gap-2">
                <span className="font-display font-black text-3xl text-white">{currentStreak}</span>
                <span className="text-2xl">{currentStreak > 0 ? "🔥" : "💤"}</span>
              </div>
              <p className="text-xs text-slate-500">
                {currentStreak === 0
                  ? "Complete uma tarefa hoje para começar!"
                  : `${currentStreak} ${currentStreak === 1 ? "dia seguido" : "dias seguidos"}!`}
              </p>
            </div>
            <div className="text-right">
              <p className="text-xs text-slate-600">Recorde pessoal</p>
              <p className="font-bold text-slate-300 text-lg">{longestStreak} dias</p>
            </div>
          </div>
        </motion.div>

        {/* Account info */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="card-solid p-5"
        >
          <h3 className="font-semibold text-slate-200 mb-4">Informações da conta</h3>
          <div className="space-y-3 text-sm">
            {[
              { label: "Email", value: profile?.email ?? "" },
              { label: "Membro desde", value: profile?.created_at ? new Date(profile.created_at).toLocaleDateString("pt-BR", { month: "long", year: "numeric" }) : "" },
              { label: "Nível de inglês", value: LEVEL_LABELS[profile?.level ?? "iniciante"] },
              { label: "Meta diária", value: `${profile?.daily_goal ?? 5} tarefas/dia` },
            ].map(({ label, value }) => (
              <div key={label} className="flex justify-between items-center py-2 border-b border-slate-800 last:border-0">
                <span className="text-slate-500">{label}</span>
                <span className="text-slate-200 font-medium">{value}</span>
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </AppShell>
  );
}
