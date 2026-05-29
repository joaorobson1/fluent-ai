"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import { Home, BookOpen, Star, Trophy, User } from "lucide-react";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  { href: "/dashboard", icon: Home, label: "Início" },
  { href: "/tarefas", icon: BookOpen, label: "Tarefas" },
  { href: "/vocabulario", icon: Star, label: "Vocab" },
  { href: "/conquistas", icon: Trophy, label: "Conquistas" },
  { href: "/perfil", icon: User, label: "Perfil" },
];

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 md:hidden safe-bottom">
      <div className="bg-slate-950/95 backdrop-blur-xl border-t border-slate-800/80 px-2 pb-2 pt-1">
        <div className="flex items-center justify-around">
          {NAV_ITEMS.map(({ href, icon: Icon, label }) => {
            const isActive = pathname === href || pathname.startsWith(href + "/");

            return (
              <Link
                key={href}
                href={href}
                className={cn(
                  "flex flex-col items-center gap-0.5 px-3 py-2 rounded-xl transition-all duration-200 min-w-[56px]",
                  isActive
                    ? "text-brand-400"
                    : "text-slate-500 hover:text-slate-300"
                )}
              >
                <div className="relative">
                  {isActive && (
                    <motion.div
                      layoutId="bottom-nav-indicator"
                      className="absolute inset-0 -m-1.5 bg-brand-500/15 rounded-lg"
                      transition={{ type: "spring", bounce: 0.3, duration: 0.4 }}
                    />
                  )}
                  <Icon
                    size={22}
                    className={cn("relative z-10 transition-transform", isActive && "scale-110")}
                    strokeWidth={isActive ? 2.5 : 2}
                  />
                </div>
                <span className={cn("text-[10px] font-medium", isActive ? "text-brand-400" : "text-slate-600")}>
                  {label}
                </span>
              </Link>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
