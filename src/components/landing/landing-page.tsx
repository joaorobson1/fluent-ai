"use client";

import { useState } from "react";
import Link from "next/link";
import { motion, useScroll, useTransform } from "framer-motion";
import {
  Zap, ChevronRight, Star, Check, ArrowRight,
  Smartphone, Brain, Trophy, Flame, BookOpen,
  MessageSquare, Target, Users, ChevronDown
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

const FEATURES = [
  {
    icon: Brain,
    title: "IA Personalizada",
    description: "Tarefas geradas pela IA com base no seu nível e pontos fracos. Cada dia é único.",
    color: "from-purple-500 to-purple-600",
    bg: "bg-purple-500/10 border-purple-500/20",
  },
  {
    icon: Trophy,
    title: "Gamificação Total",
    description: "XP, níveis, streaks, conquistas e badges. Aprender nunca foi tão viciante.",
    color: "from-yellow-500 to-orange-500",
    bg: "bg-yellow-500/10 border-yellow-500/20",
  },
  {
    icon: Target,
    title: "Microlearning",
    description: "7-10 tarefas de 30 segundos a 2 minutos. Aprenda no intervalo do almoço.",
    color: "from-brand-500 to-brand-600",
    bg: "bg-brand-500/10 border-brand-500/20",
  },
  {
    icon: MessageSquare,
    title: "Conversa com IA",
    description: "Pratique conversação em tempo real com uma IA paciente e adaptativa.",
    color: "from-green-500 to-emerald-600",
    bg: "bg-green-500/10 border-green-500/20",
  },
  {
    icon: BookOpen,
    title: "9 Tipos de Exercícios",
    description: "Tradução, listening, múltipla escolha, montar frases, vocabulário e muito mais.",
    color: "from-blue-500 to-cyan-600",
    bg: "bg-blue-500/10 border-blue-500/20",
  },
  {
    icon: Smartphone,
    title: "App Nativo (PWA)",
    description: "Instale no celular como um app. Funciona offline. Notificações push.",
    color: "from-pink-500 to-rose-600",
    bg: "bg-pink-500/10 border-pink-500/20",
  },
];

const PLANS = [
  {
    name: "Gratuito",
    price: "R$ 0",
    period: "para sempre",
    description: "Comece sua jornada hoje",
    features: [
      "5 tarefas por dia",
      "Vocabulário básico",
      "Streak e XP",
      "3 conquistas",
    ],
    cta: "Começar grátis",
    href: "/cadastro",
    highlight: false,
  },
  {
    name: "Pro",
    price: "R$ 19,90",
    period: "/mês",
    description: "Para quem quer resultados rápidos",
    features: [
      "Tarefas ilimitadas",
      "Conversa com IA ilimitada",
      "Todos os tipos de exercícios",
      "Conquistas exclusivas",
      "Análise de progresso avançada",
      "Sem anúncios",
    ],
    cta: "Começar Pro",
    href: "/cadastro?plan=pro",
    highlight: true,
  },
  {
    name: "Anual",
    price: "R$ 149,90",
    period: "/ano",
    description: "Economize 37% no plano Pro",
    features: [
      "Tudo do Pro",
      "Suporte prioritário",
      "Acesso antecipado a features",
      "Certificado de conclusão",
    ],
    cta: "Melhor custo-benefício",
    href: "/cadastro?plan=annual",
    highlight: false,
  },
];

const FAQS = [
  {
    q: "Quanto tempo por dia preciso dedicar?",
    a: "Apenas 5-10 minutos! Nosso sistema de microlearning foi projetado para caber na sua rotina. Consistência importa mais que duração.",
  },
  {
    q: "Funciona para quem não sabe nada de inglês?",
    a: "Sim! Temos tarefas do nível zero ao avançado. A IA adapta o conteúdo ao seu nível atual.",
  },
  {
    q: "Preciso baixar algum app?",
    a: "Não! É um PWA — você pode instalar direto do navegador no Android e iOS, ou usar no desktop.",
  },
  {
    q: "Como a IA personaliza as tarefas?",
    a: "Ela analisa seus erros, palavras que você erra mais, e adapta dificuldade automaticamente. É como ter um tutor particular.",
  },
  {
    q: "Posso cancelar quando quiser?",
    a: "Sim, sem burocracia. Cancele a qualquer momento pelo painel de configurações.",
  },
];

export function LandingPage() {
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-50">
      {/* Navbar */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-slate-950/90 backdrop-blur-xl border-b border-slate-800/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Link href="/" className="flex items-center gap-2.5">
              <div className="w-8 h-8 bg-gradient-to-br from-brand-500 to-accent-500 rounded-lg flex items-center justify-center">
                <Zap size={16} className="text-white" />
              </div>
              <span className="font-display font-bold text-lg text-white">Fluent AI</span>
            </Link>

            <div className="hidden md:flex items-center gap-6 text-sm text-slate-400">
              <a href="#funcionalidades" className="hover:text-white transition-colors">Funcionalidades</a>
              <a href="#planos" className="hover:text-white transition-colors">Planos</a>
              <a href="#faq" className="hover:text-white transition-colors">FAQ</a>
            </div>

            <div className="flex items-center gap-3">
              <Link href="/login" className="text-sm text-slate-400 hover:text-white transition-colors hidden sm:block">
                Entrar
              </Link>
              <Link href="/cadastro">
                <Button size="sm" className="gap-1.5">
                  Começar grátis <ChevronRight size={14} />
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative pt-32 pb-20 px-4 overflow-hidden">
        <div className="absolute inset-0 -z-10">
          <div className="absolute top-20 left-1/4 w-96 h-96 bg-brand-500/10 rounded-full blur-3xl" />
          <div className="absolute top-40 right-1/4 w-80 h-80 bg-accent-500/10 rounded-full blur-3xl" />
          <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[800px] h-40 bg-brand-500/5 blur-3xl" />
        </div>

        <div className="max-w-4xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-4"
          >
            <Badge variant="default" className="text-sm px-4 py-1.5 gap-2">
              <Flame size={14} className="text-orange-400" />
              +10.000 brasileiros aprendendo inglês agora
            </Badge>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="font-display font-black text-fluid-hero text-white mb-6 text-balance leading-[1.1]"
          >
            Aprenda inglês de verdade com{" "}
            <span className="text-gradient">Inteligência Artificial</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-fluid-xl text-slate-400 mb-10 max-w-2xl mx-auto text-balance"
          >
            Microlearning + Gamificação + IA Personalizada. Apenas 5 minutinhos por dia
            para transformar seu inglês em resultados reais.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-4"
          >
            <Link href="/cadastro">
              <Button size="xl" className="gap-2 text-base w-full sm:w-auto shadow-2xl shadow-brand-500/30">
                Começar grátis agora <ArrowRight size={18} />
              </Button>
            </Link>
            <Link href="/login">
              <Button variant="secondary" size="xl" className="gap-2 w-full sm:w-auto">
                Já tenho conta
              </Button>
            </Link>
          </motion.div>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="text-sm text-slate-600 mt-4"
          >
            Sem cartão de crédito. Sem compromisso. Grátis para sempre.
          </motion.p>
        </div>

        {/* App preview cards */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="mt-16 max-w-4xl mx-auto"
        >
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Streak card preview */}
            <div className="card-glass p-5 text-left">
              <div className="flex items-center gap-2 mb-3">
                <Flame size={20} className="text-orange-400" />
                <span className="font-bold text-white">Sequência</span>
              </div>
              <div className="text-4xl font-black text-white">14 🔥</div>
              <p className="text-sm text-slate-400 mt-1">dias seguidos</p>
              <div className="flex gap-1 mt-3">
                {[true, true, true, true, true, true, false].map((done, i) => (
                  <div key={i} className={cn("flex-1 h-1.5 rounded-full", done ? "bg-orange-400" : "bg-slate-700")} />
                ))}
              </div>
            </div>

            {/* XP card preview */}
            <div className="card-glass p-5 text-left">
              <div className="flex items-center gap-2 mb-3">
                <Zap size={20} className="text-yellow-400" />
                <span className="font-bold text-white">Experiência</span>
              </div>
              <div className="text-4xl font-black text-white">2.840</div>
              <p className="text-sm text-slate-400 mt-1">XP acumulados</p>
              <div className="mt-3 h-1.5 bg-slate-700 rounded-full overflow-hidden">
                <div className="w-3/4 h-full bg-gradient-to-r from-yellow-500 to-orange-400 rounded-full" />
              </div>
              <p className="text-xs text-slate-600 mt-1">Nível 8 — Habilidoso</p>
            </div>

            {/* Task card preview */}
            <div className="card-glass p-5 text-left">
              <div className="flex items-center gap-2 mb-3">
                <Target size={20} className="text-brand-400" />
                <span className="font-bold text-white">Meta do dia</span>
              </div>
              <div className="text-4xl font-black text-white">5/7</div>
              <p className="text-sm text-slate-400 mt-1">tarefas feitas</p>
              <div className="mt-3 h-1.5 bg-slate-700 rounded-full overflow-hidden">
                <div className="w-[71%] h-full bg-gradient-to-r from-brand-500 to-brand-400 rounded-full" />
              </div>
              <p className="text-xs text-brand-400 mt-1">+35 XP hoje</p>
            </div>
          </div>
        </motion.div>
      </section>

      {/* Stats */}
      <section className="py-16 px-4 border-y border-slate-800">
        <div className="max-w-4xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
          {[
            { value: "10K+", label: "Usuários ativos" },
            { value: "500K+", label: "Tarefas completadas" },
            { value: "95%", label: "Taxa de satisfação" },
            { value: "4.9★", label: "Avaliação média" },
          ].map(({ value, label }) => (
            <motion.div
              key={label}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
            >
              <div className="font-display font-black text-3xl text-white mb-1">{value}</div>
              <div className="text-sm text-slate-500">{label}</div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section id="funcionalidades" className="py-20 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <Badge variant="default" className="mb-4">Funcionalidades</Badge>
            <h2 className="font-display font-black text-fluid-4xl text-white mb-4">
              Tudo que você precisa para<br />
              <span className="text-gradient">aprender de verdade</span>
            </h2>
            <p className="text-slate-400 text-fluid-lg max-w-2xl mx-auto">
              Combinamos as melhores técnicas de aprendizado com tecnologia de ponta.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {FEATURES.map((feature, i) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.08 }}
                className={cn("p-6 rounded-2xl border", feature.bg)}
              >
                <div className={cn(
                  "w-11 h-11 rounded-xl flex items-center justify-center mb-4 bg-gradient-to-br",
                  feature.color
                )}>
                  <feature.icon size={22} className="text-white" />
                </div>
                <h3 className="font-display font-bold text-lg text-white mb-2">{feature.title}</h3>
                <p className="text-slate-400 text-sm leading-relaxed">{feature.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="py-20 px-4 bg-slate-900/50">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <Badge variant="default" className="mb-4">Como funciona</Badge>
            <h2 className="font-display font-black text-fluid-4xl text-white mb-4">
              Simples como deve ser
            </h2>
          </div>

          <div className="space-y-6">
            {[
              {
                step: "01",
                title: "Crie sua conta e faça o onboarding",
                description: "Em 1 minuto você define seu nível, objetivos e metas diárias. A IA calibra tudo para você.",
                emoji: "🎯",
              },
              {
                step: "02",
                title: "A IA gera suas tarefas do dia",
                description: "Toda manhã você recebe 7-10 tarefas personalizadas que se adaptam ao seu progresso.",
                emoji: "🤖",
              },
              {
                step: "03",
                title: "Complete as tarefas e ganhe XP",
                description: "Cada tarefa concluída te dá XP, avança no nível e mantém sua sequência de dias.",
                emoji: "⚡",
              },
              {
                step: "04",
                title: "A IA aprende com seus erros",
                description: "Quanto mais você usa, mais inteligente fica. Ela reforça exatamente o que você precisa.",
                emoji: "🧠",
              },
            ].map((item, i) => (
              <motion.div
                key={item.step}
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="flex gap-5 items-start"
              >
                <div className="w-12 h-12 bg-gradient-to-br from-brand-500 to-brand-700 rounded-xl flex items-center justify-center text-sm font-black text-white flex-shrink-0 shadow-lg shadow-brand-500/20">
                  {item.step}
                </div>
                <div className="pt-1">
                  <h3 className="font-semibold text-white mb-1 flex items-center gap-2">
                    {item.emoji} {item.title}
                  </h3>
                  <p className="text-slate-400 text-sm leading-relaxed">{item.description}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Planos */}
      <section id="planos" className="py-20 px-4">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <Badge variant="default" className="mb-4">Planos</Badge>
            <h2 className="font-display font-black text-fluid-4xl text-white mb-4">
              Escolha seu plano
            </h2>
            <p className="text-slate-400">Comece grátis. Faça upgrade quando quiser.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {PLANS.map((plan, i) => (
              <motion.div
                key={plan.name}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className={cn(
                  "rounded-2xl p-6 border relative",
                  plan.highlight
                    ? "bg-gradient-to-b from-brand-500/20 to-brand-600/10 border-brand-500/50 shadow-2xl shadow-brand-500/20"
                    : "card-solid"
                )}
              >
                {plan.highlight && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <Badge variant="default" className="bg-brand-500 text-white text-xs px-3">
                      Mais Popular
                    </Badge>
                  </div>
                )}

                <div className="mb-5">
                  <h3 className="font-display font-bold text-lg text-white mb-1">{plan.name}</h3>
                  <p className="text-slate-400 text-sm">{plan.description}</p>
                </div>

                <div className="mb-6">
                  <span className="font-display font-black text-4xl text-white">{plan.price}</span>
                  <span className="text-slate-400 text-sm ml-1">{plan.period}</span>
                </div>

                <ul className="space-y-2.5 mb-8">
                  {plan.features.map((feature) => (
                    <li key={feature} className="flex items-start gap-2.5 text-sm text-slate-300">
                      <Check size={16} className="text-green-400 flex-shrink-0 mt-0.5" />
                      {feature}
                    </li>
                  ))}
                </ul>

                <Link href={plan.href}>
                  <Button
                    variant={plan.highlight ? "default" : "outline"}
                    className="w-full"
                    size="lg"
                  >
                    {plan.cta}
                  </Button>
                </Link>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-20 px-4 bg-slate-900/30">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <Badge variant="default" className="mb-4">Depoimentos</Badge>
            <h2 className="font-display font-black text-fluid-4xl text-white">
              Quem usa, aprova
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {[
              {
                name: "Ana Beatriz",
                role: "Desenvolvedora de Software",
                text: "Em 2 meses subi de básico para intermediário. A IA realmente se adapta! Uso todo dia no metrô.",
                stars: 5,
                emoji: "👩‍💻",
              },
              {
                name: "Carlos Eduardo",
                role: "Estudante universitário",
                text: "Finalmente um app que não parece trabalho. A gamificação vicia demais! 47 dias de sequência.",
                stars: 5,
                emoji: "🎓",
              },
              {
                name: "Fernanda Lima",
                role: "Gerente de Marketing",
                text: "Preciso de inglês no trabalho. Em 3 meses já consigo participar de reuniões internacionais.",
                stars: 5,
                emoji: "📊",
              },
            ].map((t, i) => (
              <motion.div
                key={t.name}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="card-solid p-5"
              >
                <div className="flex gap-1 mb-3">
                  {[...Array(t.stars)].map((_, j) => (
                    <Star key={j} size={14} className="fill-yellow-400 text-yellow-400" />
                  ))}
                </div>
                <p className="text-slate-300 text-sm leading-relaxed mb-4">"{t.text}"</p>
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 bg-slate-700 rounded-full flex items-center justify-center text-lg">
                    {t.emoji}
                  </div>
                  <div>
                    <p className="font-semibold text-white text-sm">{t.name}</p>
                    <p className="text-xs text-slate-500">{t.role}</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="py-20 px-4">
        <div className="max-w-2xl mx-auto">
          <div className="text-center mb-12">
            <Badge variant="default" className="mb-4">FAQ</Badge>
            <h2 className="font-display font-black text-fluid-4xl text-white">
              Perguntas frequentes
            </h2>
          </div>

          <div className="space-y-3">
            {FAQS.map((faq, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.05 }}
                className="card-solid overflow-hidden"
              >
                <button
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
                  className="w-full flex items-center justify-between px-5 py-4 text-left"
                >
                  <span className="font-medium text-white">{faq.q}</span>
                  <ChevronDown
                    size={18}
                    className={cn(
                      "text-slate-400 transition-transform flex-shrink-0 ml-3",
                      openFaq === i && "rotate-180"
                    )}
                  />
                </button>
                {openFaq === i && (
                  <motion.div
                    initial={{ height: 0 }}
                    animate={{ height: "auto" }}
                    exit={{ height: 0 }}
                    className="px-5 pb-4"
                  >
                    <p className="text-slate-400 text-sm leading-relaxed">{faq.a}</p>
                  </motion.div>
                )}
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Final */}
      <section className="py-20 px-4">
        <div className="max-w-2xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className="bg-gradient-to-br from-brand-500/20 to-accent-500/20 border border-brand-500/30 rounded-3xl p-10"
          >
            <div className="text-6xl mb-4 animate-float">🚀</div>
            <h2 className="font-display font-black text-fluid-4xl text-white mb-4">
              Comece hoje mesmo.<br />
              <span className="text-gradient">É grátis para sempre.</span>
            </h2>
            <p className="text-slate-400 mb-8 max-w-md mx-auto">
              Junte-se a milhares de brasileiros que já estão aprendendo inglês com IA.
              Sem compromisso, sem cartão.
            </p>
            <Link href="/cadastro">
              <Button size="xl" className="gap-2 shadow-2xl shadow-brand-500/30 animate-pulse-glow">
                Criar conta grátis <ArrowRight size={18} />
              </Button>
            </Link>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-800 py-8 px-4">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 bg-gradient-to-br from-brand-500 to-accent-500 rounded-md flex items-center justify-center">
              <Zap size={12} className="text-white" />
            </div>
            <span className="font-display font-bold text-slate-400">Fluent AI</span>
          </div>
          <p className="text-sm text-slate-600">
            © {new Date().getFullYear()} Fluent AI. Feito com ❤️ para brasileiros.
          </p>
          <div className="flex items-center gap-4 text-sm text-slate-600">
            <a href="#" className="hover:text-slate-400 transition-colors">Privacidade</a>
            <a href="#" className="hover:text-slate-400 transition-colors">Termos</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
