"use client";

import { Sidebar } from "./sidebar";
import { BottomNav } from "./bottom-nav";
import { TopBar } from "./top-bar";
import { cn } from "@/lib/utils";

interface AppShellProps {
  children: React.ReactNode;
  title?: string;
  className?: string;
  noPadding?: boolean;
}

export function AppShell({ children, title, className, noPadding }: AppShellProps) {
  return (
    <div className="min-h-screen bg-slate-950">
      <Sidebar />
      <TopBar title={title} />

      <main
        className={cn(
          "md:ml-64 min-h-[calc(100vh-57px)] pb-20 md:pb-8",
          !noPadding && "px-4 py-6 md:px-8 md:py-8",
          className
        )}
      >
        <div className={cn("max-w-screen-xl mx-auto", !noPadding && "page-enter")}>
          {children}
        </div>
      </main>

      <BottomNav />
    </div>
  );
}
