"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, Mail, Lock, User, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { createClient } from "@/lib/supabase/client";
import toast from "react-hot-toast";

export default function CadastroPage() {
  const router = useRouter();
  const [form, setForm] = useState({
    full_name: "",
    email: "",
    password: "",
    confirm_password: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  function validate() {
    const newErrors: Record<string, string> = {};
    if (!form.full_name.trim()) newErrors.full_name = "Nome é obrigatório";
    if (!form.email.trim()) newErrors.email = "Email é obrigatório";
    if (!/\S+@\S+\.\S+/.test(form.email)) newErrors.email = "Email inválido";
    if (form.password.length < 8) newErrors.password = "Senha deve ter pelo menos 8 caracteres";
    if (form.password !== form.confirm_password) newErrors.confirm_password = "Senhas não coincidem";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault();
    if (!validate()) return;

    setLoading(true);
    const supabase = createClient();

    try {
      const { error } = await supabase.auth.signUp({
        email: form.email,
        password: form.password,
        options: {
          data: { full_name: form.full_name },
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      });

      if (error) throw error;

      toast.success("Conta criada! Redirecionando para o onboarding...");
      router.push("/onboarding");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "";
      if (msg.includes("already registered")) {
        toast.error("Este email já está cadastrado");
      } else {
        toast.error("Erro ao criar conta. Tente novamente.");
      }
    } finally {
      setLoading(false);
    }
  }

  async function handleGoogleSignUp() {
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${window.location.origin}/auth/callback` },
    });
    if (error) toast.error("Erro ao conectar com Google");
  }

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center px-4 py-12">
      <div className="fixed inset-0 -z-10">
        <div className="absolute top-0 right-1/4 w-96 h-96 bg-accent-500/10 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-1/4 w-96 h-96 bg-brand-500/10 rounded-full blur-3xl" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md"
      >
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2.5 mb-6">
            <div className="w-10 h-10 bg-gradient-to-br from-brand-500 to-accent-500 rounded-xl flex items-center justify-center shadow-lg shadow-brand-500/30">
              <Zap size={20} className="text-white" />
            </div>
            <span className="font-display font-bold text-2xl text-white">Fluent AI</span>
          </Link>
          <h1 className="font-display font-bold text-2xl text-white mb-2">
            Comece sua jornada
          </h1>
          <p className="text-slate-400">
            Crie sua conta gratuita em segundos
          </p>
        </div>

        <div className="card-solid p-8">
          <Button
            variant="outline"
            className="w-full mb-6 gap-3 h-12"
            onClick={handleGoogleSignUp}
          >
            <svg width="18" height="18" viewBox="0 0 18 18">
              <path fill="#4285F4" d="M16.51 8H8.98v3h4.3c-.18 1-.74 1.48-1.6 2.04v2.01h2.6a7.8 7.8 0 0 0 2.38-5.88c0-.57-.05-.66-.15-1.18z" />
              <path fill="#34A853" d="M8.98 17c2.16 0 3.97-.72 5.3-1.94l-2.6-2a4.8 4.8 0 0 1-7.18-2.54H1.83v2.07A8 8 0 0 0 8.98 17z" />
              <path fill="#FBBC05" d="M4.5 10.52a4.8 4.8 0 0 1 0-3.04V5.41H1.83a8 8 0 0 0 0 7.18l2.67-2.07z" />
              <path fill="#EA4335" d="M8.98 4.18c1.17 0 2.23.4 3.06 1.2l2.3-2.3A8 8 0 0 0 1.83 5.4L4.5 7.49a4.77 4.77 0 0 1 4.48-3.3z" />
            </svg>
            Continuar com Google
          </Button>

          <div className="relative mb-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-slate-700" />
            </div>
            <div className="relative flex justify-center text-xs">
              <span className="bg-slate-900 px-3 text-slate-500">ou cadastre com email</span>
            </div>
          </div>

          <form onSubmit={handleRegister} className="space-y-4">
            <Input
              label="Nome completo"
              placeholder="Seu nome"
              value={form.full_name}
              onChange={(e) => setForm({ ...form, full_name: e.target.value })}
              leftIcon={<User size={16} />}
              error={errors.full_name}
            />
            <Input
              label="Email"
              type="email"
              placeholder="seu@email.com"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              leftIcon={<Mail size={16} />}
              error={errors.email}
            />
            <Input
              label="Senha"
              type={showPassword ? "text" : "password"}
              placeholder="Mínimo 8 caracteres"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              leftIcon={<Lock size={16} />}
              rightIcon={
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="hover:text-slate-300">
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              }
              error={errors.password}
            />
            <Input
              label="Confirmar senha"
              type="password"
              placeholder="Repita a senha"
              value={form.confirm_password}
              onChange={(e) => setForm({ ...form, confirm_password: e.target.value })}
              leftIcon={<Lock size={16} />}
              error={errors.confirm_password}
            />

            <p className="text-xs text-slate-500 text-center">
              Ao criar conta, você concorda com nossos{" "}
              <span className="text-brand-400 cursor-pointer">Termos de Uso</span>
            </p>

            <Button type="submit" className="w-full" size="lg" loading={loading}>
              Criar conta grátis 🚀
            </Button>
          </form>

          <p className="text-center text-sm text-slate-500 mt-6">
            Já tem conta?{" "}
            <Link href="/login" className="text-brand-400 hover:text-brand-300 font-medium transition-colors">
              Fazer login
            </Link>
          </p>
        </div>
      </motion.div>
    </div>
  );
}
