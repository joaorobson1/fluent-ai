"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronRight, SkipForward, Clock, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { TaskTranslation } from "./task-translation";
import { TaskMultipleChoice } from "./task-multiple-choice";
import { TaskCompleteFrase } from "./task-complete-frase";
import { TaskSentenceBuilder } from "./task-sentence-builder";
import { TaskAIConversation } from "./task-ai-conversation";
import type { CompleteFraseContent } from "@/types";
import type { Task } from "@/types";
import { TASK_TYPE_ICONS, TASK_TYPE_LABELS, difficultyColor } from "@/lib/utils";
import { cn } from "@/lib/utils";

interface Props {
  task: Task;
  taskNumber: number;
  totalTasks: number;
  onSubmit: (answer: unknown) => Promise<{ correct: boolean; feedback: string; xp_earned: number } | null>;
  onSkip: () => void;
  onNext: () => void;
  isSubmitting: boolean;
}

export function TaskCardWrapper({
  task, taskNumber, totalTasks, onSubmit, onSkip, onNext, isSubmitting
}: Props) {
  const [completed, setCompleted] = useState(false);
  const [result, setResult] = useState<{ correct: boolean; feedback: string; xp_earned: number } | null>(null);

  const progress = (taskNumber / totalTasks) * 100;

  async function handleSubmit(answer: unknown) {
    const res = await onSubmit(answer);
    if (res) {
      setResult(res);
      setCompleted(res.correct);
    }
    return res;
  }

  function handleNext() {
    setCompleted(false);
    setResult(null);
    onNext();
  }

  return (
    <div className="max-w-lg mx-auto">
      {/* Header */}
      <div className="mb-6 space-y-3">
        <div className="flex items-center justify-between text-xs text-slate-500">
          <span>Tarefa {taskNumber} de {totalTasks}</span>
          <div className="flex items-center gap-1.5">
            <Clock size={12} />
            <span>~1 min</span>
          </div>
        </div>
        <Progress value={progress} className="h-1.5" />
      </div>

      {/* Task card */}
      <motion.div
        key={task.id}
        initial={{ opacity: 0, y: 20, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: -20, scale: 0.98 }}
        transition={{ type: "spring", bounce: 0.3 }}
        className="card-solid p-6"
      >
        {/* Task header */}
        <div className="flex items-start gap-3 mb-6">
          <div className="w-12 h-12 bg-gradient-to-br from-brand-500/20 to-accent-500/20 rounded-xl flex items-center justify-center text-2xl flex-shrink-0">
            {TASK_TYPE_ICONS[task.type]}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-2 mb-1">
              <Badge variant="secondary">{TASK_TYPE_LABELS[task.type]}</Badge>
              <span className={cn("text-xs font-medium", difficultyColor(task.difficulty))}>
                {"★".repeat(task.difficulty)}{"☆".repeat(5 - task.difficulty)}
              </span>
            </div>
            <h2 className="font-display font-semibold text-lg text-white">{task.title}</h2>
            {task.description && (
              <p className="text-sm text-slate-400 mt-0.5">{task.description}</p>
            )}
          </div>
          <div className="xp-badge flex-shrink-0">
            <Zap size={11} />
            +{task.xp_reward}
          </div>
        </div>

        {/* Task content */}
        <AnimatePresence mode="wait">
          {task.type === "traducao" && (
            <TaskTranslation
              content={task.content as Parameters<typeof TaskTranslation>[0]["content"]}
              onSubmit={handleSubmit}
              isSubmitting={isSubmitting}
            />
          )}
          {task.type === "multipla_escolha" && (
            <TaskMultipleChoice
              content={task.content as Parameters<typeof TaskMultipleChoice>[0]["content"]}
              onSubmit={handleSubmit}
            />
          )}
          {task.type === "montar_frase" && (
            <TaskSentenceBuilder
              content={task.content as Parameters<typeof TaskSentenceBuilder>[0]["content"]}
              onSubmit={handleSubmit}
              isSubmitting={isSubmitting}
            />
          )}
          {task.type === "conversa_ia" && (
            <TaskAIConversation
              content={task.content as Parameters<typeof TaskAIConversation>[0]["content"]}
              onComplete={() => handleSubmit("completed")}
            />
          )}
          {task.type === "complete_frase" && (() => {
            const cfContent = task.content as CompleteFraseContent;
            // Se tem opções → componente interativo; caso contrário → marcar como feito
            if (Array.isArray(cfContent?.options) && cfContent.options.length > 0) {
              return (
                <TaskCompleteFrase
                  content={cfContent}
                  onSubmit={handleSubmit}
                />
              );
            }
            return (
              <div className="text-center py-8">
                <p className="text-4xl mb-3">✏️</p>
                <p className="font-semibold text-white mb-2">{task.title}</p>
                <Button onClick={() => handleSubmit("skip")} variant="outline" className="gap-2">
                  Marcar como feito <ChevronRight size={16} />
                </Button>
              </div>
            );
          })()}
          {(task.type === "missao_dia" || task.type === "vocabulario" || task.type === "listening" || task.type === "pronuncia") && (
            <div className="text-center py-8">
              <p className="text-4xl mb-3">{TASK_TYPE_ICONS[task.type]}</p>
              <p className="font-semibold text-white mb-2">{task.title}</p>
              <p className="text-slate-400 text-sm mb-6">
                {task.type === "missao_dia" ? "Complete o desafio do dia!" : "Exercício em desenvolvimento — volte em breve!"}
              </p>
              <Button onClick={() => handleSubmit("skip")} variant="outline" className="gap-2">
                Marcar como feito <ChevronRight size={16} />
              </Button>
            </div>
          )}
        </AnimatePresence>

        {/* Result + Next button */}
        {result && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-6 pt-5 border-t border-slate-800"
          >
            <Button onClick={handleNext} className="w-full gap-2" size="lg">
              {taskNumber < totalTasks ? "Próxima tarefa" : "Concluir"} <ChevronRight size={16} />
            </Button>
          </motion.div>
        )}
      </motion.div>

      {/* Skip button */}
      {!result && (
        <div className="text-center mt-4">
          <button
            onClick={onSkip}
            className="text-sm text-slate-600 hover:text-slate-400 transition-colors flex items-center gap-1 mx-auto"
          >
            <SkipForward size={14} /> Pular esta tarefa
          </button>
        </div>
      )}
    </div>
  );
}
