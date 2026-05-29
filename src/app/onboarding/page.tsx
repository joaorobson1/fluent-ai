"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import { ArrowRight, Check, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";
import type { UserLevel } from "@/types";
import toast from "react-hot-toast";
import { cn } from "@/lib/utils";

type Step = "welcome" | "level" | "topics" | "goal" | "complete";

const LEVELS: { value: UserLevel; emoji: string; title: string; description: string }[] = [
  { value: "zero", emoji: "👶", title: "Do zero", description: "Nunca estudei inglês antes" },
  { value: "iniciante", emoji: "🌱", title: "Iniciante", description: "Sei cumprimentar e frases básicas" },
  { value: "intermediario", emoji: "📈", title: "Intermediário", description: "Consigo me comunicar no básico" },
  { value: "avancado", emoji: "🚀", title: "Avançado", description: "Falo bem, quero polir o inglês" },
];

const TOPICS = [
  { id: "grammar", emoji: "📖", label: "Gramática" },
  { id: "vocabulary", emoji: "🔤", label: "Vocabulário" },
  { id: "conversation", emoji: "💬", label: "Conversação" },
  { id: "pronunciation", emoji: "🎤", label: "Pronúncia" },
  { id: "business", emoji: "💼", label: "Negócios" },
  { id: "travel", emoji: "✈️", label: "Viagens" },
];

const GOALS = [
  { value: 3, label: "Leve", subtitle: "3 tarefas/dia", emoji: "🌙" },
  { value: 5, label: "Moderado", subtitle: "5 tarefas/dia", emoji: "⚡", recommended: true },
  { value: 7, label: "Intensivo", subtitle: "7 tarefas/dia", emoji: "🔥" },
  { value: 10, label: "Máximo", subtitle: "10 tarefas/dia", emoji: "👑" },
];

export default function OnboardingPage() {
  const router = useRouter();
  const [step, setStep] = useState<Step>("welcome");
  const [level, setLevel] = useState<UserLevel>("iniciante");
  const [topics, setTopics] = useState<string[]>(["vocabulary", "grammar"]);
  const [dailyGoal, setDailyGoal] = useState(5);
  const [loading, setLoading] = useState(false);

  function toggleTopic(id: string) {
    setTopics((prev) =>
      prev.includes(id) ? prev.filter((t) => t !== id) : [...prev, id]
    );
  }

  async function finish() {
    setLoading(true);
    const supabase = createClient();

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Não autenticado");

      // upsert garante que a linha é criada se não existir
      // (usuários criados antes do trigger handle_new_user)
      const { error } = await supabase
        .from("profiles")
        .upsert({
          id: user.id,
          email: user.email ?? "",
          full_name: user.user_metadata?.full_name ?? user.user_metadata?.name ?? user.email?.split("@")[0] ?? "Usuário",
          avatar_url: user.user_metadata?.avatar_url ?? null,
          level,
          preferred_topics: topics,
          daily_goal: dailyGoal,
          onboarding_completed: true,
          updated_at: new Date().toISOString(),
        }, { onConflict: "id" });

      if (error) throw error;

      setStep("complete");
    } catch {
      toast.error("Erro ao salvar preferências");
    } finally {
      setLoading(false);
    }
  }

  const slideVariants = {
    enter: { x: 60, opacity: 0 },
    center: { x: 0, opacity: 1 },
    exit: { x: -60, opacity: 0 },
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center px-4 py-12">
      <div className="fixed inset-0 -z-10">
        <div className="absolute top-1/4 left-1/4 w-80 h-80 bg-brand-500/10 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-accent-500/10 rounded-full blur-3xl" />
      </div>

      {/* Progress indicator */}
      {step !== "welcome" && step !== "complete" && (
        <div className="fixed top-6 left-0 right-0 flex justify-center gap-2">
          {["level", "topics", "goal"].map((s, i) => (
            <div
              key={s}
              className={cn(
                "h-1 rounded-full transition-all duration-300",
                ["level", "topics", "goal"].indexOf(step) >= i
                  ? "bg-brand-500 w-12"
                  : "bg-slate-700 w-8"
              )}
            />
          ))}
        </div>
      )}

      <div className="w-full max-w-md">
        <AnimatePresence mode="wait">

          {/* Step: Welcome */}
          {step === "welcome" && (
            <motion.div
              key="welcome"
              variants={slideVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ type: "spring", bounce: 0.3 }}
              className="text-center"
            >
              <motion.div
                animate={{ y: [0, -10, 0] }}
                transition={{ repeat: Infinity, duration: 3 }}
                className="text-8xl mb-6"
              >
                🎯
              </motion.div>
              <h1 className="font-display font-black text-4xl text-white mb-4">
                Bem-vindo ao<br />
                <span className="text-gradient">Fluent AI!</span>
              </h1>
              <p className="text-slate-400 text-lg mb-8 leading-relaxed">
                Vamos personalizar sua experiência de aprendizado em menos de 1 minuto.
              </p>
              <div className="space-y-3 mb-8">
                {["Tarefas diárias personalizadas com IA", "Gamificação e recompensas", "Aprenda em 5-10 minutos por dia"].map((item) => (
                  <div key={item} className="flex items-center gap-3 text-left bg-slate-800/50 rounded-xl px-4 py-3">
                    <div className="w-5 h-5 bg-green-500 rounded-full flex items-center justify-center flex-shrink-0">
                      <Check size={12} className="text-white" />
                    </div>
                    <span className="text-slate-300 text-sm">{item}</span>
                  </div>
                ))}
              </div>
              <Button onClick={() => setStep("level")} className="w-full" size="xl">
                Começar configuração <ArrowRight size={18} />
              </Button>
            </motion.div>
          )}

          {/* Step: Level */}
          {step === "level" && (
            <motion.div key="level" variants={slideVariants} initial="enter" animate="center" exit="exit" transition={{ type: "spring", bounce: 0.3 }}>
              <div className="text-center mb-8">
                <h2 className="font-display font-bold text-2xl text-white mb-2">
                  Qual é o seu nível de inglês?
                </h2>
                <p className="text-slate-400">Seja honesto — a IA vai se adaptar para você</p>
              </div>

              <div className="space-y-3 mb-8">
                {LEVELS.map(({ value, emoji, title, description }) => (
                  <motion.button
                    key={value}
                    whileHover={{ scale: 1.01 }}
                    whileTap={{ scale: 0.99 }}
                    onClick={() => setLevel(value)}
                    className={cn(
                      "w-full flex items-center gap-4 p-4 rounded-2xl border-2 transition-all duration-200 text-left",
                      level === value
                        ? "border-brand-500 bg-brand-500/10"
                        : "border-slate-700 bg-slate-800/30 hover:border-slate-600"
                    )}
                  >
                    <span className="text-3xl">{emoji}</span>
                    <div>
                      <p className="font-semibold text-white">{title}</p>
                      <p className="text-sm text-slate-400">{description}</p>
                    </div>
                    {level === value && (
                      <div className="ml-auto w-6 h-6 bg-brand-500 rounded-full flex items-center justify-center">
                        <Check size={14} className="text-white" />
                      </div>
                    )}
                  </motion.button>
                ))}
              </div>

              <Button onClick={() => setStep("topics")} className="w-full" size="lg">
                Próximo <ArrowRight size={16} />
              </Button>
            </motion.div>
          )}

          {/* Step: Topics */}
          {step === "topics" && (
            <motion.div key="topics" variants={slideVariants} initial="enter" animate="center" exit="exit" transition={{ type: "spring", bounce: 0.3 }}>
              <div className="text-center mb-8">
                <h2 className="font-display font-bold text-2xl text-white mb-2">
                  O que você quer praticar?
                </h2>
                <p className="text-slate-400">Escolha suas áreas favoritas (pode mudar depois)</p>
              </div>

              <div className="grid grid-cols-2 gap-3 mb-8">
                {TOPICS.map(({ id, emoji, label }) => {
                  const selected = topics.includes(id);
                  return (
                    <motion.button
                      key={id}
                      whileHover={{ scale: 1.03 }}
                      whileTap={{ scale: 0.97 }}
                      onClick={() => toggleTopic(id)}
                      className={cn(
                        "flex flex-col items-center gap-2 p-4 rounded-2xl border-2 transition-all duration-200",
                        selected
                          ? "border-brand-500 bg-brand-500/10"
                          : "border-slate-700 bg-slate-800/30 hover:border-slate-600"
                      )}
                    >
                      <span className="text-2xl">{emoji}</span>
                      <span className={cn("text-sm font-medium", selected ? "text-brand-300" : "text-slate-300")}>
                        {label}
                      </span>
                    </motion.button>
                  );
                })}
              </div>

              <Button onClick={() => setStep("goal")} className="w-full" size="lg" disabled={topics.length === 0}>
                Próximo <ArrowRight size={16} />
              </Button>
            </motion.div>
          )}

          {/* Step: Daily Goal */}
          {step === "goal" && (
            <motion.div key="goal" variants={slideVariants} initial="enter" animate="center" exit="exit" transition={{ type: "spring", bounce: 0.3 }}>
              <div className="text-center mb-8">
                <h2 className="font-display font-bold text-2xl text-white mb-2">
                  Meta diária de tarefas
                </h2>
                <p className="text-slate-400">Quantas tarefas você quer fazer por dia?</p>
              </div>

              <div className="grid grid-cols-2 gap-3 mb-8">
                {GOALS.map(({ value, label, subtitle, emoji, recommended }) => (
                  <motion.button
                    key={value}
                    whileHover={{ scale: 1.03 }}
                    whileTap={{ scale: 0.97 }}
                    onClick={() => setDailyGoal(value)}
                    className={cn(
                      "flex flex-col items-center gap-1.5 p-4 rounded-2xl border-2 transition-all duration-200 relative",
                      dailyGoal === value
                        ? "border-brand-500 bg-brand-500/10"
                        : "border-slate-700 bg-slate-800/30 hover:border-slate-600"
                    )}
                  >
                    {recommended && (
                      <span className="absolute -top-2.5 left-1/2 -translate-x-1/2 bg-brand-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full whitespace-nowrap">
                        Recomendado
                      </span>
                    )}
                    <span className="text-2xl">{emoji}</span>
                    <span className="font-bold text-white">{label}</span>
                    <span className="text-xs text-slate-400">{subtitle}</span>
                  </motion.button>
                ))}
              </div>

              <Button onClick={finish} loading={loading} className="w-full" size="lg">
                Finalizar configuração 🎉
              </Button>
            </motion.div>
          )}

          {/* Step: Complete */}
          {step === "complete" && (
            <motion.div
              key="complete"
              variants={slideVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ type: "spring", bounce: 0.3 }}
              className="text-center"
            >
              <motion.div
                animate={{ rotate: [0, -10, 10, -10, 10, 0], scale: [1, 1.2, 1] }}
                transition={{ duration: 0.8 }}
                className="text-8xl mb-6"
              >
                🎉
              </motion.div>
              <h2 className="font-display font-black text-3xl text-white mb-3">
                Tudo pronto!
              </h2>
              <p className="text-slate-400 text-lg mb-2">
                Sua conta foi personalizada com sucesso.
              </p>
              <p className="text-slate-500 text-sm mb-8">
                A IA já está preparando suas primeiras tarefas...
              </p>

              <div className="bg-gradient-to-r from-brand-500/20 to-accent-500/20 border border-brand-500/30 rounded-2xl p-5 mb-8 text-left">
                <div className="flex items-center gap-3 mb-3">
                  <Zap className="text-yellow-400" size={20} />
                  <span className="font-semibold text-white">Dica de Ouro</span>
                </div>
                <p className="text-slate-300 text-sm leading-relaxed">
                  Consistência é a chave! Mesmo que seja por 5 minutinhos, estude todos os dias para manter sua sequência e aprender mais rápido.
                </p>
              </div>

              <Button onClick={() => router.push("/dashboard")} className="w-full" size="xl">
                Ir para o Dashboard 🚀
              </Button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
