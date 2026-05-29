import { NextRequest, NextResponse } from "next/server";
import { createAdminClient, createClient } from "@/lib/supabase/server";

export async function GET(req: NextRequest) {
  const userId = req.nextUrl.searchParams.get("userId");

  if (!userId) {
    return NextResponse.json({ error: "userId é obrigatório" }, { status: 400 });
  }

  // Valida a sessão e garante que o userId bate com o usuário autenticado
  const supabaseAuth = await createClient();
  const { data: { user }, error: authError } = await supabaseAuth.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  }

  if (user.id !== userId) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 403 });
  }

  // Admin client bypassa RLS — seguro porque o userId já foi verificado acima
  const supabase = await createAdminClient();

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const { data: tasksData, error: tasksError } = await supabase
    .from("tasks")
    .select("*")
    .eq("user_id", userId)
    .eq("is_daily", true)
    .gte("generated_at", today.toISOString())
    .lt("generated_at", tomorrow.toISOString())
    .order("order_index", { ascending: true });

  if (tasksError) {
    if (process.env.NODE_ENV === "development") {
      console.error("[/api/tasks/today] tasks:", tasksError.message, tasksError.code);
    }
    return NextResponse.json({ error: tasksError.message }, { status: 500 });
  }

  const taskIds = (tasksData ?? []).map((t) => t.id);
  let progressData: unknown[] = [];

  if (taskIds.length > 0) {
    const { data, error: progressError } = await supabase
      .from("task_progress")
      .select("*")
      .eq("user_id", userId)
      .in("task_id", taskIds);

    if (progressError) {
      if (process.env.NODE_ENV === "development") {
        console.error("[/api/tasks/today] progress:", progressError.message, progressError.code);
      }
    } else {
      progressData = data ?? [];
    }
  }

  return NextResponse.json({ tasks: tasksData ?? [], progress: progressData });
}
