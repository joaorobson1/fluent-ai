"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import {
  Home, BookOpen, Star, Trophy, User, Settings,
  Zap, LogOut, ChevronRight
} from "lucide-react";
import { cn, formatXP, levelTitle } from "@/lib/utils";
import { useUserStore } from "@/store/user-store";
import { useGamificationStore } from "@/store/gamification-store";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

const NAV_ITEMS = [
  { href: "/dashboard", icon: Home, label: "Dashboard" },
  { href: "/tarefas", icon: BookOpen, label: "Tarefas" },
  { href: "/vocabulario", icon: Star, label: "Vocabulário" },
  { href: "/conquistas", icon: Trophy, label: "Conquistas" },
  { href: "/perfil", icon: User, label: "Perfil" },
  { href: "/configuracoes", icon: Settings, label: "Configurações" },
];

export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { profile, clearUser } = useUserStore();
  const { xpTotal, xpLevel, currentStreak, xpProgressPercent } = useGamificationStore();

  const initials = profile?.full_name
    ?.split(" ")
    .slice(0, 2)
    .map((n) => n[0])
    .join("") ?? "?";

  async function handleLogout() {
    try {
      const supabase = createClient();
      await supabase.auth.signOut();
    } finally {
      clearUser();
      router.push("/");
    }
  }

  return (
    <aside className="hidden md:flex flex-col w-64 h-screen fixed left-0 top-0 z-40 bg-slate-950 border-r border-slate-800">
      {/* Logo */}
      <div className="px-6 py-5 border-b border-slate-800">
        <Link href="/dashboard" className="flex items-center gap-2.5">
          <div className="w-8 h-8 bg-gradient-to-br from-brand-500 to-accent-500 rounded-lg flex items-center justify-center">
            <Zap size={16} className="text-white" />
          </div>
          <span className="font-display font-bold text-lg text-white">Fluent AI</span>
        </Link>
      </div>

      {/* User card */}
      <div className="px-4 py-4 border-b border-slate-800">
        <div className="flex items-center gap-3 mb-3">
          <Avatar className="h-9 w-9 ring-2 ring-brand-500/30">
            <AvatarImage src={profile?.avatar_url ?? ""} />
            <AvatarFallback className="text-xs">{initials}</AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-slate-100 truncate">
              {profile?.full_name ?? "Usuário"}
            </p>
            <p className="text-xs text-slate-500">
              {levelTitle(xpLevel)} · Nível {xpLevel}
            </p>
          </div>
        </div>

        <div className="space-y-1.5">
          <div className="flex justify-between text-xs text-slate-500">
            <span className="flex items-center gap-1">
              <Zap size={11} className="text-yellow-400" />
              {formatXP(xpTotal)} XP
            </span>
            <span>{xpProgressPercent()}%</span>
          </div>
          <Progress value={xpProgressPercent()} className="h-1.5" />
        </div>

        {currentStreak > 0 && (
          <div className="mt-2.5 flex items-center gap-1.5 text-xs text-orange-400 font-semibold">
            <span className="animate-streak-fire">🔥</span>
            {currentStreak} dia{currentStreak !== 1 ? "s" : ""} de sequência
          </div>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
        {NAV_ITEMS.map(({ href, icon: Icon, label }) => {
          const isActive = pathname === href || pathname.startsWith(href + "/");

          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 group",
                isActive
                  ? "bg-brand-500/15 text-brand-400 border border-brand-500/20"
                  : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/60"
              )}
            >
              {isActive && (
                <motion.div
                  layoutId="sidebar-indicator"
                  className="absolute left-0 w-0.5 h-6 bg-brand-500 rounded-r-full"
                  transition={{ type: "spring", bounce: 0.2 }}
                />
              )}
              <Icon size={18} strokeWidth={isActive ? 2.5 : 2} />
              <span className="flex-1">{label}</span>
              {isActive && <ChevronRight size={14} className="opacity-50" />}
            </Link>
          );
        })}
      </nav>

      {/* Logout */}
      <div className="px-3 py-4 border-t border-slate-800">
        <button
          onClick={handleLogout}
          className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-slate-500 hover:text-red-400 hover:bg-red-500/10 w-full transition-all duration-150"
        >
          <LogOut size={18} />
          <span>Sair</span>
        </button>
      </div>
    </aside>
  );
}
