import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";
import { generateDailyTasks } from "@/lib/gemini/task-generator";
import type { GenerateTasksRequest } from "@/types";

const ALLOWED_TYPES = new Set([
  "traducao", "multipla_escolha", "complete_frase",
  "montar_frase", "vocabulario", "missao_dia",
]);

export async function POST(req: NextRequest) {
  try {
    if (!process.env.GEMINI_API_KEY) {
      return NextResponse.json({ error: "Serviço de IA não configurado" }, { status: 503 });
    }

    const body: GenerateTasksRequest = await req.json();
    const { userId, level, weakAreas, preferredTopics, count = 7 } = body;

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

    // Gerar tarefas com a IA (já sanitizadas no task-generator)
    const generatedTasks = await generateDailyTasks({
      level,
      weakAreas: weakAreas ?? [],
      completedTaskTypes: [],
      preferredTopics: preferredTopics ?? [],
      count,
    });

    if (generatedTasks.length === 0) {
      return NextResponse.json({ error: "Nenhuma tarefa válida gerada" }, { status: 500 });
    }

    // Montar registros para inserção, com defaults seguros
    const expiresAt = tomorrow.toISOString();
    const tasksToInsert = generatedTasks.map((task, index) => {
      const type = ALLOWED_TYPES.has(task.type ?? "") ? task.type! : "missao_dia";

      return {
        user_id:      userId,
        type,
        title:        (task.title ?? `Tarefa ${index + 1}`).slice(0, 100),
        description:  (task.description ?? "").slice(0, 200),
        content:      task.content ?? {},
        xp_reward:    clamp(task.xp_reward ?? 10, 5, 50),
        difficulty:   clamp(task.difficulty ?? 1, 1, 5),
        topic:        task.topic ?? "grammar",
        is_daily:     true,
        order_index:  index,
        expires_at:   expiresAt,
        unlocked_at:  index === 0 ? new Date().toISOString() : null,
      };
    });

    const { data: inserted, error } = await supabase
      .from("tasks")
      .insert(tasksToInsert)
      .select();

    if (error) {
      console.error("[generate] insert error:", error);
      return NextResponse.json({ error: "Erro ao salvar tarefas" }, { status: 500 });
    }

    // Criar registros de progresso
    if (inserted && inserted.length > 0) {
      await supabase.from("task_progress").insert(
        inserted.map((t) => ({
          user_id: userId,
          task_id: t.id,
          status: "pendente",
        }))
      );
    }

    return NextResponse.json({ tasks: inserted, count: inserted?.length ?? 0 });
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    console.error("[generate] erro:", msg);
    return NextResponse.json(
      { error: process.env.NODE_ENV === "development" ? msg : "Erro ao gerar tarefas" },
      { status: 500 }
    );
  }
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, Math.round(value)));
}
