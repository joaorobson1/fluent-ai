import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// Rota de conveniência para login rápido em desenvolvimento.
// Usa auth real do Supabase — cria sessão válida com UUID real.
// Não disponível em produção (NODE_ENV === "production" bloqueia).
export async function POST(request: NextRequest) {
  if (process.env.NODE_ENV === "production") {
    return NextResponse.json({ error: "Not available" }, { status: 404 });
  }

  const { email, password } = await request.json();

  if (!email || !password) {
    return NextResponse.json(
      { error: "Email e senha são obrigatórios" },
      { status: 400 }
    );
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    if (process.env.NODE_ENV === "development") {
      console.error("[dev-login] erro Supabase:", error.message);
    }
    return NextResponse.json({ error: "Email ou senha incorretos" }, { status: 401 });
  }

  return NextResponse.json({ success: true });
}
