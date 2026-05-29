import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import type { UserLevel } from "@/types";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// XP necessário para próximo nível
export function xpForLevel(level: number): number {
  return Math.floor(100 * Math.pow(level, 1.5));
}

// XP acumulado até o início do nível
export function xpAtLevelStart(level: number): number {
  let total = 0;
  for (let i = 1; i < level; i++) total += xpForLevel(i);
  return total;
}

// Progresso de XP no nível atual (0-100)
export function xpProgressPercent(xpTotal: number, level: number): number {
  const levelStart = xpAtLevelStart(level);
  const levelXp = xpForLevel(level);
  const progress = ((xpTotal - levelStart) / levelXp) * 100;
  return Math.min(Math.max(Math.round(progress), 0), 100);
}

// Título do nível
export function levelTitle(level: number): string {
  const titles = [
    "Calouro", "Estudante", "Aprendiz", "Curioso", "Dedicado",
    "Comprometido", "Habilidoso", "Proficiente", "Avançado", "Expert",
    "Mestre", "Grand Master", "Lenda",
  ];
  return titles[Math.min(level - 1, titles.length - 1)] ?? "Lenda";
}

// Label do nível de inglês
export const LEVEL_LABELS: Record<UserLevel, string> = {
  zero: "Do zero",
  iniciante: "Iniciante",
  intermediario: "Intermediário",
  avancado: "Avançado",
};

// Cor da dificuldade (1-5)
export function difficultyColor(difficulty: number): string {
  const colors = ["", "text-green-400", "text-lime-400", "text-yellow-400", "text-orange-400", "text-red-400"];
  return colors[difficulty] ?? "text-gray-400";
}

// Saudação baseada no horário
export function greeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return "Bom dia";
  if (hour < 18) return "Boa tarde";
  return "Boa noite";
}

// Formatar XP
export function formatXP(xp: number): string {
  if (xp >= 1000) return `${(xp / 1000).toFixed(1)}k`;
  return xp.toString();
}

// Label do tipo de tarefa
export const TASK_TYPE_LABELS: Record<string, string> = {
  traducao: "Tradução",
  listening: "Listening",
  complete_frase: "Complete a Frase",
  multipla_escolha: "Múltipla Escolha",
  montar_frase: "Montar Frase",
  pronuncia: "Pronúncia",
  conversa_ia: "Conversa com IA",
  missao_dia: "Missão do Dia",
  vocabulario: "Vocabulário",
};

// Ícone do tipo de tarefa
export const TASK_TYPE_ICONS: Record<string, string> = {
  traducao: "🔄",
  listening: "🎧",
  complete_frase: "✏️",
  multipla_escolha: "🎯",
  montar_frase: "🧩",
  pronuncia: "🎤",
  conversa_ia: "💬",
  missao_dia: "⚡",
  vocabulario: "📚",
};

