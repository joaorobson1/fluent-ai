import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";
import { validateTranslation, verifyMultipleChoiceAnswer } from "@/lib/gemini/task-generator";
import type { ValidateAnswerRequest, TranslationContent, MultiplaEscolhaContent, CompleteFraseContent, MontarFraseContent } from "@/types";

export async function POST(req: NextRequest) {
  try {
    const body: ValidateAnswerRequest = await req.json();
    const { taskId, userId, answer, taskType, taskContent } = body;

    const supabase = await createAdminClient();

    let correct = false;
    let score = 0;
    let feedback = "";
    let explanation = "";
    let verifiedCorrectIndex: number | undefined = undefined;

    switch (taskType) {
      case "traducao": {
        const content = taskContent as TranslationContent;
        const userAnswer = String(answer).trim().toLowerCase();

        // Verificação rápida antes de chamar IA
        const quickMatch = content.accepted_answers.some(
          (a) => a.toLowerCase().trim() === userAnswer
        );

        if (quickMatch) {
          correct = true;
          score = 100;
          feedback = "Perfeito! Tradução correta! 🎉";
          explanation = content.explanation ?? "";
        } else {
          // Usar IA para avaliar respostas parcialmente corretas
          const result = await validateTranslation(
            String(answer),
            content.accepted_answers,
            "intermediario"
          );
          correct = result.correct;
          score = result.score;
          feedback = result.feedback;
          explanation = content.explanation ?? "";
        }
        break;
      }

      case "multipla_escolha": {
        const content = taskContent as MultiplaEscolhaContent;
        const selectedIndex = Number(answer);

        // Validação pela IA — não depende do correct_index/correct_answer armazenado,
        // que pode estar errado se a geração produziu dados inconsistentes.
        const aiVerdict = await verifyMultipleChoiceAnswer(
          content.question,
          content.options,
          selectedIndex
        );

        correct              = aiVerdict.correct;
        verifiedCorrectIndex = aiVerdict.correct_index;
        score   = correct ? 100 : 0;
        feedback = correct
          ? "Resposta certa! Excelente! 🎯"
          : `Resposta incorreta. A correta era: "${aiVerdict.correct_answer}"`;
        explanation = aiVerdict.feedback || content.explanation || "";
        break;
      }

      case "complete_frase": {
        const content = taskContent as CompleteFraseContent;
        correct = String(answer).toLowerCase().trim() === content.correct_answer.toLowerCase().trim();
        score = correct ? 100 : 0;
        feedback = correct
          ? "Correto! Muito bem! ✅"
          : `Incorreto. A resposta era: "${content.correct_answer}"`;
        explanation = content.explanation ?? "";
        break;
      }

      case "montar_frase": {
        const content = taskContent as MontarFraseContent;
        const userOrder = answer as number[];
        const correctOrder = content.correct_order;
        correct = JSON.stringify(userOrder) === JSON.stringify(correctOrder);
        score = correct ? 100 : Math.max(0, 100 - (userOrder.filter((v, i) => v !== correctOrder[i]).length * 20));
        feedback = correct
          ? "Frase montada corretamente! 🧩"
          : `Quase lá! A ordem correta era: ${correctOrder.map((i) => content.words[i]).join(" ")}`;
        break;
      }

      case "vocabulario": {
        const answers = answer as Record<string, string>;
        const total = Object.keys(answers).length;
        const correct_count = Object.values(answers).filter((v) => v === "correct").length;
        correct = correct_count === total;
        score = total > 0 ? Math.round((correct_count / total) * 100) : 0;
        feedback = correct
          ? "Vocabulário dominado! Incrível! 📚"
          : `Você acertou ${correct_count} de ${total} palavras. Continue praticando!`;
        break;
      }

      default: {
        correct = true;
        score = 100;
        feedback = "Tarefa concluída!";
      }
    }

    // XP baseado na pontuação
    const task = await supabase.from("tasks").select("xp_reward").eq("id", taskId).single();
    const baseXP = task.data?.xp_reward ?? 10;
    const xpEarned = correct ? baseXP : Math.floor(baseXP * 0.2);

    // Atualizar progresso
    await supabase
      .from("task_progress")
      .upsert({
        user_id: userId,
        task_id: taskId,
        status: correct ? "concluida" : "em_andamento",
        score,
        answer,
        ai_feedback: feedback,
        xp_earned: xpEarned,
        completed_at: correct ? new Date().toISOString() : null,
      }, { onConflict: "user_id,task_id" });

    // Se correto: desbloquear próxima tarefa
    if (correct) {
      const { data: nextTask } = await supabase
        .from("tasks")
        .select("id, order_index")
        .eq("user_id", userId)
        .is("unlocked_at", null)
        .order("order_index", { ascending: true })
        .limit(1)
        .single();

      if (nextTask) {
        await supabase
          .from("tasks")
          .update({ unlocked_at: new Date().toISOString() })
          .eq("id", nextTask.id);
      }

      // Adicionar XP ao perfil
      await supabase.rpc("add_xp", {
        p_user_id: userId,
        p_amount: xpEarned,
        p_reason: `Tarefa concluída`,
        p_task_id: taskId,
      });

      // Atualizar streak do dia
      const today = new Date().toISOString().split("T")[0];
      await supabase
        .from("streaks")
        .upsert({
          user_id: userId,
          date: today,
          tasks_done: 1,
          xp_earned: xpEarned,
        }, {
          onConflict: "user_id,date",
          ignoreDuplicates: false,
        });

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
      correct,
      score,
      feedback,
      xp_earned: xpEarned,
      explanation,
      ...(verifiedCorrectIndex !== undefined && { correct_index: verifiedCorrectIndex }),
    });
  } catch (error) {
    console.error("Erro na validação:", error);
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}
