import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";
import { validateTranslation } from "@/lib/gemini/task-generator";
import { checkAnswer, checkMultipleChoice, normalizeOption } from "@/lib/validation";
import type {
  TranslationContent,
  MultiplaEscolhaContent,
  CompleteFraseContent,
  MontarFraseContent,
} from "@/types";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json() as {
      taskId: string;
      userId: string;
      answer: unknown;
      taskType: string;
    };

    const { taskId, userId, answer, taskType } = body;

    if (!taskId || !userId || !taskType) {
      return NextResponse.json({ error: "Parâmetros obrigatórios ausentes" }, { status: 400 });
    }

    const supabase = await createAdminClient();

    // Buscar a tarefa do banco de dados — fonte de verdade autoritativa.
    // Nunca confiar no taskContent enviado pelo cliente (pode estar desatualizado ou manipulado).
    const { data: taskRow, error: taskError } = await supabase
      .from("tasks")
      .select("xp_reward, content, type")
      .eq("id", taskId)
      .single();

    if (taskError || !taskRow) {
      console.error("[validate] tarefa não encontrada:", taskId, taskError?.message);
      return NextResponse.json({ error: "Tarefa não encontrada" }, { status: 404 });
    }

    const taskContent = taskRow.content as Record<string, unknown>;
    const baseXP: number = taskRow.xp_reward ?? 10;

    let correct = false;
    let score = 0;
    let feedback = "";
    let explanation = "";
    let correctIndex: number | undefined = undefined;

    // ── Lógica de validação por tipo ────────────────────────────────────────

    switch (taskType) {

      // ── Tradução ──────────────────────────────────────────────────────────
      case "traducao": {
        const content = taskContent as TranslationContent;
        const acceptedAnswers = (content.accepted_answers ?? []).filter(Boolean);

        if (acceptedAnswers.length === 0) {
          // Dados corrompidos — dar benefício da dúvida
          correct = true;
          score = 100;
          feedback = "Resposta registrada! ✅";
          break;
        }

        const userAnswer = String(answer ?? "").trim();

        // Passo 1: correspondência determinística com normalização
        const matchResult = checkAnswer(userAnswer, acceptedAnswers);

        if (matchResult.match === "exact" || matchResult.match === "fuzzy") {
          correct = true;
          score = matchResult.score;
          feedback = matchResult.match === "exact"
            ? "Perfeito! Tradução correta! 🎉"
            : "Muito bem! Pequena variação de escrita, mas correto! ✅";
        } else {
          // Passo 2: IA para casos onde a normalização não encontrou correspondência
          // (variações semânticas legítimas que o aluno pode ter escrito corretamente)
          const aiResult = await validateTranslation(userAnswer, acceptedAnswers, "intermediario");
          correct = aiResult.correct;
          score = aiResult.score;
          feedback = aiResult.feedback;
        }

        explanation = content.explanation ?? "";
        break;
      }

      // ── Múltipla Escolha ─────────────────────────────────────────────────
      case "multipla_escolha": {
        const content = taskContent as MultiplaEscolhaContent;
        const options = (content.options ?? []) as string[];
        const selectedIdx = Number(answer);

        if (isNaN(selectedIdx) || selectedIdx < 0 || selectedIdx >= options.length) {
          correct = false;
          score = 0;
          feedback = "Índice de resposta inválido.";
          break;
        }

        const selectedOption = options[selectedIdx] ?? "";
        const correctAnswer = content.correct_answer ?? options[Number(content.correct_index)] ?? "";

        if (!correctAnswer) {
          // Sem resposta correta armazenada — benefício da dúvida
          correct = true;
          score = 100;
          feedback = "Resposta registrada! ✅";
          break;
        }

        // Comparação puramente determinística — sem chamar IA
        correct = checkMultipleChoice(selectedOption, correctAnswer);
        score = correct ? 100 : 0;

        // Encontrar o índice real da resposta correta para o frontend destacar
        correctIndex = options.findIndex(
          (o) => normalizeOption(o) === normalizeOption(correctAnswer)
        );
        if (correctIndex === -1) correctIndex = Number(content.correct_index) ?? 0;

        const correctText = options[correctIndex] ?? correctAnswer;
        feedback = correct
          ? "Resposta certa! Excelente! 🎯"
          : `Resposta incorreta. A correta era: "${correctText}"`;
        explanation = content.explanation ?? "";
        break;
      }

      // ── Complete a Frase ─────────────────────────────────────────────────
      case "complete_frase": {
        const content = taskContent as CompleteFraseContent;
        const correctAnswer = content.correct_answer ?? "";
        const userAnswer = String(answer ?? "").trim();

        // Verificar se a resposta é uma opção válida
        if (Array.isArray(content.options)) {
          // Seleção de opção → comparar com correct_answer usando normalização
          const matchResult = checkAnswer(userAnswer, [correctAnswer]);
          correct = matchResult.match !== "none";
        } else {
          // Resposta aberta
          const matchResult = checkAnswer(userAnswer, [correctAnswer]);
          correct = matchResult.match !== "none";
        }

        score = correct ? 100 : 0;
        feedback = correct
          ? "Correto! Muito bem! ✅"
          : `Incorreto. A resposta era: "${correctAnswer}"`;
        explanation = content.explanation ?? "";
        break;
      }

      // ── Montar Frase ─────────────────────────────────────────────────────
      case "montar_frase": {
        const content = taskContent as MontarFraseContent;
        const userOrder = answer as number[];
        const correctOrder = content.correct_order ?? [];
        const words = content.words ?? [];

        if (!Array.isArray(userOrder) || userOrder.length !== words.length) {
          correct = false;
          score = 0;
          feedback = "Coloque todas as palavras na frase.";
          break;
        }

        // Comparação por índice de posição
        const exactMatch = JSON.stringify(userOrder) === JSON.stringify(correctOrder);

        if (exactMatch) {
          correct = true;
          score = 100;
          feedback = "Frase montada corretamente! 🧩";
        } else {
          // Verificar se a frase formada pelo usuário é equivalente ao texto correto
          // (ex: mesmas palavras, ordem gramaticalmente válida)
          const userSentence = userOrder.map((i) => words[i] ?? "").join(" ");
          const correctSentence = correctOrder.map((i) => words[i] ?? "").join(" ");

          // Comparação de texto (ignora capitalização/espaços)
          const textMatch = normalizeOption(userSentence) === normalizeOption(correctSentence);

          if (textMatch) {
            correct = true;
            score = 100;
            feedback = "Frase correta! ✅";
          } else {
            // Score parcial: porcentagem de palavras na posição certa
            const correctPositions = userOrder.filter((v, i) => v === correctOrder[i]).length;
            score = Math.round((correctPositions / words.length) * 100);
            correct = false;
            feedback = `Quase lá! A ordem correta era: "${correctSentence}"`;
          }
        }
        break;
      }

      // ── Vocabulário ───────────────────────────────────────────────────────
      case "vocabulario": {
        const answers = answer as Record<string, string>;
        const total = Object.keys(answers ?? {}).length;
        const correctCount = Object.values(answers ?? {}).filter((v) => v === "correct").length;

        correct = total > 0 && correctCount === total;
        score = total > 0 ? Math.round((correctCount / total) * 100) : 0;
        feedback = correct
          ? "Vocabulário dominado! Incrível! 📚"
          : `Você acertou ${correctCount} de ${total} palavras. Continue praticando!`;
        break;
      }

      // ── Missão do Dia / Conversa IA / outros ─────────────────────────────
      default: {
        correct = true;
        score = 100;
        feedback = "Tarefa concluída! Ótimo trabalho! 🎉";
      }
    }

    // ── XP ───────────────────────────────────────────────────────────────────

    // Respostas parcialmente corretas (score ≥ 70) também contam como acerto
    const effectivelyCorrect = correct || score >= 70;
    const xpEarned = effectivelyCorrect ? baseXP : Math.max(1, Math.floor(baseXP * 0.1));

    // ── Atualizar progresso ───────────────────────────────────────────────────

    const status = effectivelyCorrect ? "concluida" : "em_andamento";

    await supabase
      .from("task_progress")
      .upsert(
        {
          user_id: userId,
          task_id: taskId,
          status,
          score,
          answer,
          ai_feedback: feedback,
          xp_earned: xpEarned,
          completed_at: effectivelyCorrect ? new Date().toISOString() : null,
        },
        { onConflict: "user_id,task_id" }
      );

    // ── Efeitos colaterais se correto ─────────────────────────────────────────

    if (effectivelyCorrect) {
      // Desbloquear próxima tarefa
      const { data: nextTask } = await supabase
        .from("tasks")
        .select("id")
        .eq("user_id", userId)
        .is("unlocked_at", null)
        .order("order_index", { ascending: true })
        .limit(1)
        .maybeSingle();

      if (nextTask) {
        await supabase
          .from("tasks")
          .update({ unlocked_at: new Date().toISOString() })
          .eq("id", nextTask.id);
      }

      // Adicionar XP
      await supabase.rpc("add_xp", {
        p_user_id: userId,
        p_amount: xpEarned,
        p_reason: "Tarefa concluída",
        p_task_id: taskId,
      });

      // Atualizar streak
      const today = new Date().toISOString().split("T")[0];
      await supabase
        .from("streaks")
        .upsert(
          { user_id: userId, date: today, tasks_done: 1, xp_earned: xpEarned },
          { onConflict: "user_id,date" }
        );

      // Incrementar tasks_completed no perfil
      const { data: profileRow } = await supabase
        .from("profiles")
        .select("tasks_completed")
        .eq("id", userId)
        .single();

      await supabase
        .from("profiles")
        .update({
          tasks_completed: (profileRow?.tasks_completed ?? 0) + 1,
          last_activity_at: new Date().toISOString(),
        })
        .eq("id", userId);
    }

    return NextResponse.json({
      correct: effectivelyCorrect,
      score,
      feedback,
      xp_earned: xpEarned,
      explanation,
      ...(correctIndex !== undefined && { correct_index: correctIndex }),
    });
  } catch (error) {
    console.error("[validate] erro:", error);
    return NextResponse.json({ error: "Erro interno na validação" }, { status: 500 });
  }
}
