import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";
import { generateDailyTasks, verifyMultipleChoiceTasks } from "@/lib/gemini/task-generator";
import type { GenerateTasksRequest } from "@/types";

export async function POST(req: NextRequest) {
  try {
    if (!process.env.GEMINI_API_KEY) {
      console.error("[generate] GEMINI_API_KEY não configurada no .env.local");
      return NextResponse.json({ error: "Serviço de IA não configurado" }, { status: 503 });
    }

    const body: GenerateTasksRequest = await req.json();
    const { userId, level, weakAreas, completedTaskTypes, preferredTopics, count = 7 } = body;

    if (!userId || !level) {
      return NextResponse.json({ error: "userId e level são obrigatórios" }, { status: 400 });
    }

    const supabase = await createAdminClient();

    // Verificar se já existem tarefas hoje
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const { data: existing } = await supabase
      .from("tasks")
      .select("id")
      .eq("user_id", userId)
      .eq("is_daily", true)
      .gte("generated_at", today.toISOString())
      .lt("generated_at", tomorrow.toISOString());

    if (existing && existing.length > 0) {
      return NextResponse.json({ message: "Tarefas já geradas hoje", tasks: existing });
    }

    // Gerar novas tarefas com IA
    const generatedTasks = await generateDailyTasks({
      level,
      weakAreas: weakAreas ?? [],
      completedTaskTypes: completedTaskTypes ?? [],
      preferredTopics: preferredTopics ?? [],
      count,
    });

    // Calcular data de expiração (meia-noite)
    const expiresAt = new Date(tomorrow);

    if (generatedTasks.length === 0) {
      return NextResponse.json({ error: "Nenhuma tarefa gerada pela IA" }, { status: 500 });
    }

    // Verificação independente das multipla_escolha:
    // Uma segunda chamada ao Gemini confirma qual opção é de fato correta,
    // corrigindo erros factuais que a geração principal possa ter cometido.
    const mcTasks = generatedTasks.filter((t) => t.type === "multipla_escolha");
    if (mcTasks.length > 0) {
      try {
        const mcInputs = mcTasks.map((t) => {
          const c = t.content as { question?: string; options?: string[] };
          return { question: c?.question ?? "", options: c?.options ?? [] };
        });

        const verified = await verifyMultipleChoiceTasks(mcInputs);

        mcTasks.forEach((task, i) => {
          const v = verified[i];
          if (!v) return;
          const c = task.content as { options?: string[]; correct_index?: number; correct_answer?: string };
          if (!c.options) return;
          // Garantir que correct_answer pertence ao array de opções
          const safeIndex = v.correct_index >= 0 && v.correct_index < c.options.length
            ? v.correct_index
            : c.options.findIndex((o) => o === v.correct_answer);
          if (safeIndex !== -1) {
            c.correct_index  = safeIndex;
            c.correct_answer = c.options[safeIndex];
          }
        });
      } catch (err) {
        // Verificação falhou — continua com dados gerados (melhor do que bloquear)
        console.warn("[generate] verifyMultipleChoiceTasks falhou:", err);
      }
    }

    // Salvar no banco
    const tasksToInsert = generatedTasks.map((task, index) => ({
      user_id: userId,
      type: task.type ?? "multipla_escolha",
      title: task.title ?? `Tarefa ${index + 1}`,
      description: task.description ?? "",
      content: task.content ?? {},
      xp_reward: task.xp_reward ?? 10,
      difficulty: task.difficulty ?? 1,
      topic: task.topic ?? "general",
      is_daily: true,
      order_index: index,
      expires_at: expiresAt.toISOString(),
      // Primeira tarefa já desbloqueada, as demais desbloqueiam em sequência
      unlocked_at: index === 0 ? new Date().toISOString() : null,
    }));

    const { data: inserted, error } = await supabase
      .from("tasks")
      .insert(tasksToInsert)
      .select();

    if (error) {
      console.error("Erro ao inserir tarefas:", error);
      return NextResponse.json({ error: "Erro ao salvar tarefas" }, { status: 500 });
    }

    // Criar registros de progresso
    if (inserted) {
      const progressRecords = inserted.map((task) => ({
        user_id: userId,
        task_id: task.id,
        status: "pendente",
      }));

      await supabase.from("task_progress").insert(progressRecords);
    }

    return NextResponse.json({ tasks: inserted, count: inserted?.length ?? 0 });
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    console.error("[generate] erro:", msg);
    return NextResponse.json(
      { error: process.env.NODE_ENV === "development" ? msg : "Erro interno do servidor" },
      { status: 500 }
    );
  }
}
