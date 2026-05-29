"use client";

import { Bell, Flame, Zap } from "lucide-react";
import { useGamificationStore } from "@/store/gamification-store";
import { useUserStore } from "@/store/user-store";
import { formatXP } from "@/lib/utils";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import Link from "next/link";

interface TopBarProps {
  title?: string;
}

export function TopBar({ title }: TopBarProps) {
  const { xpTotal, currentStreak } = useGamificationStore();
  const { profile } = useUserStore();

  const initials = profile?.full_name
    ?.split(" ")
    .slice(0, 2)
    .map((n) => n[0])
    .join("") ?? "?";

  return (
    <header className="sticky top-0 z-30 bg-slate-950/90 backdrop-blur-xl border-b border-slate-800/50 md:ml-64">
      <div className="flex items-center justify-between px-4 py-3 max-w-screen-xl mx-auto">
        {/* Title */}
        <h1 className="font-display font-bold text-lg text-slate-100 md:text-xl">
          {title ?? ""}
        </h1>

        {/* Stats + Actions */}
        <div className="flex items-center gap-3">
          {/* Streak */}
          {currentStreak > 0 && (
            <div className="hidden sm:flex items-center gap-1.5 bg-orange-500/10 border border-orange-500/20 rounded-full px-3 py-1.5">
              <Flame size={14} className="text-orange-400 animate-streak-fire" />
              <span className="text-xs font-bold text-orange-400">{currentStreak}</span>
            </div>
          )}

          {/* XP */}
          <div className="hidden sm:flex items-center gap-1.5 bg-yellow-500/10 border border-yellow-500/20 rounded-full px-3 py-1.5">
            <Zap size={14} className="text-yellow-400" />
            <span className="text-xs font-bold text-yellow-400">{formatXP(xpTotal)}</span>
          </div>

          {/* Notifications */}
          <button className="relative p-2 rounded-xl hover:bg-slate-800 transition-colors text-slate-400 hover:text-slate-200">
            <Bell size={18} />
            <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 bg-brand-500 rounded-full" />
          </button>

          {/* Avatar (mobile) */}
          <Link href="/perfil" className="md:hidden">
            <Avatar className="h-8 w-8 ring-2 ring-brand-500/30">
              <AvatarImage src={profile?.avatar_url ?? ""} />
              <AvatarFallback className="text-xs">{initials}</AvatarFallback>
            </Avatar>
          </Link>
        </div>
      </div>
    </header>
  );
}
