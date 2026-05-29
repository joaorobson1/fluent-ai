import { getModel } from "./client";

// Remove code fences que o Gemini pode inserir ao redor do JSON
// Ex: ```json\n{...}\n```  →  {...}
function stripCodeFences(raw: string): string {
  return raw.trim().replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "").trim();
}
import type { TaskType, UserLevel, Task } from "@/types";

// ── Constantes compartilhadas ────────────────────────────────────────────────

const LEVEL_DESCRIPTIONS: Record<UserLevel, string> = {
  zero:          "absolute beginner, knows no English at all",
  iniciante:     "beginner, knows basic greetings and simple present tense",
  intermediario: "intermediate, knows most tenses and common vocabulary",
  avancado:      "advanced, can discuss complex topics with minor errors",
};

const TOPIC_PROMPTS: Record<string, string> = {
  grammar:      "grammar rules, verb conjugation, tenses",
  vocabulary:   "common words, expressions, idioms",
  pronunciation:"phonetics, word stress, connected speech",
  listening:    "comprehension, accent recognition",
  conversation: "everyday dialogues, social situations",
  business:     "professional English, emails, meetings",
  travel:       "travel situations, asking for directions, hotels",
};

// ── Helpers ──────────────────────────────────────────────────────────────────

// Na API v1 não existe responseMimeType — JSON é garantido via instrução no prompt.
const getJsonModel = (temperature: number) => getModel({ temperature });

// ── generateDailyTasks ───────────────────────────────────────────────────────

interface GenerationParams {
  level: UserLevel;
  weakAreas: string[];
  completedTaskTypes: TaskType[];
  preferredTopics: string[];
  count: number;
}

export async function generateDailyTasks(
  params: GenerationParams
): Promise<Partial<Task>[]> {
  const { level, weakAreas, preferredTopics, count } = params;

  const taskTypes: TaskType[] = [
    "traducao",
    "multipla_escolha",
    "complete_frase",
    "montar_frase",
    "vocabulario",
    "missao_dia",
  ];

  const topics     = preferredTopics.length > 0 ? preferredTopics : ["grammar", "vocabulary"];
  const focusAreas = weakAreas.length > 0
    ? `Focus extra on these weak areas: ${weakAreas.join(", ")}.`
    : "";

  const diffRange =
    level === "zero"          ? "1-2" :
    level === "iniciante"     ? "1-3" :
    level === "intermediario" ? "2-4" : "3-5";

  const prompt = `IMPORTANT: Respond with raw JSON only. No markdown, no code fences, no explanation.

You are an English learning AI for Brazilian Portuguese speakers.
Generate exactly ${count} diverse English learning tasks for a ${LEVEL_DESCRIPTIONS[level]} student.
Topics to cover: ${topics.map(t => TOPIC_PROMPTS[t] || t).join(", ")}.
${focusAreas}

Respond with a JSON object in this exact format:
{"tasks": [ ...array of ${count} task objects... ]}

Each task object must have:
- type: one of [${taskTypes.join(", ")}]
- title: short task title in Portuguese
- description: brief description in Portuguese (max 60 chars)
- topic: the grammar/vocabulary topic covered
- difficulty: integer 1-5 (use ${diffRange})
- xp_reward: integer 10-30 based on difficulty
- content: task-specific content object (see schema below)

Content schema per type:
- traducao: {"type":"traducao","text":"...","direction":"pt_to_en","accepted_answers":["..."],"hint":"...","explanation":"..."}
- multipla_escolha: {"type":"multipla_escolha","question":"...","options":["optA","optB","optC","optD"],"correct_index":2,"correct_answer":"optC","explanation":"..."}
  RULES for multipla_escolha:
  * correct_index = 0-based position of the correct option in the options array (0=first, 1=second, 2=third, 3=fourth)
  * correct_answer = EXACT text of the correct option (must match options[correct_index] exactly)
  * Double-check: options[correct_index] === correct_answer before outputting
- complete_frase: {"type":"complete_frase","sentence_with_blank":"___ is correct","options":["a","b","c","d"],"correct_answer":"a","full_sentence":"a is correct","explanation":"..."}
- montar_frase: {"type":"montar_frase","words":["I","like","coffee"],"correct_order":[0,1,2],"translation":"Eu gosto de café"}
- vocabulario: {"type":"vocabulario","words":[{"id":"","user_id":"","word":"hello","translation":"olá","pronunciation":"heh-LOH","example_sentence":"Hello, how are you?","difficulty":1,"tags":[],"times_seen":0,"times_correct":0,"mastery_level":0,"ease_factor":2.5,"interval_days":1,"is_mastered":false,"created_at":"","updated_at":""}],"quiz_mode":"flashcard"}
- missao_dia: {"type":"missao_dia","mission":"...","steps":["step1","step2"],"xp_bonus":20}

Make tasks engaging and culturally relevant to Brazilians. Vary the task types across the ${count} tasks.`;

  const model  = getJsonModel(0.8);
  const result = await model.generateContent(prompt);
  const raw    = stripCodeFences(result.response.text());

  let tasks: Partial<Task>[] = [];

  try {
    const parsed = JSON.parse(raw) as Record<string, unknown>;
    if (Array.isArray(parsed.tasks)) {
      tasks = parsed.tasks as Partial<Task>[];
    } else {
      const firstArray = Object.values(parsed).find(Array.isArray);
      if (firstArray) tasks = firstArray as Partial<Task>[];
    }
  } catch (err) {
    console.error("[generateDailyTasks] parse error:", err, "raw:", raw.slice(0, 200));
  }

  if (tasks.length === 0) {
    throw new Error("Gemini não retornou tarefas válidas. Resposta: " + raw.slice(0, 300));
  }

  return tasks.slice(0, count);
}

// ── verifyMultipleChoiceAnswer ───────────────────────────────────────────────
// Chamada durante a VALIDAÇÃO da resposta do aluno.
// Não confia no correct_index/correct_answer armazenado — pergunta diretamente
// ao modelo qual é a resposta certa.

export async function verifyMultipleChoiceAnswer(
  question: string,
  options: string[],
  selectedIndex: number
): Promise<{ correct: boolean; correct_index: number; correct_answer: string; feedback: string }> {
  const selected = options[selectedIndex] ?? "";

  const prompt = `You are an English language expert evaluating a multiple-choice exercise for Brazilian Portuguese speakers.

Question: "${question}"
Options: ${options.map((o, i) => `${i}="${o}"`).join(", ")}
Student selected: option ${selectedIndex} = "${selected}"

Your task:
1. Identify which option is the CORRECT English answer (grammar and meaning must be right)
2. Determine if the student's selection is correct

Rules:
- Evaluate pure English correctness only
- Return the 0-based index of the CORRECT option

Respond with raw JSON only (no markdown):
{"correct": <true|false>, "correct_index": <0-based int>, "correct_answer": "<exact option text>", "feedback": "<1 sentence in Portuguese explaining the rule>"}`;

  const model = getJsonModel(0.1);
  const result = await model.generateContent(prompt);

  try {
    const parsed = JSON.parse(stripCodeFences(result.response.text())) as {
      correct?: boolean;
      correct_index?: number;
      correct_answer?: string;
      feedback?: string;
    };
    return {
      correct:       parsed.correct       ?? false,
      correct_index: parsed.correct_index ?? 0,
      correct_answer: parsed.correct_answer ?? options[parsed.correct_index ?? 0] ?? "",
      feedback:      parsed.feedback      ?? "",
    };
  } catch {
    // Fallback seguro: não punir o aluno se a IA falhar
    return { correct: true, correct_index: selectedIndex, correct_answer: selected, feedback: "" };
  }
}

// ── verifyMultipleChoiceTasks ────────────────────────────────────────────────
// Verifica em lote qual opção é a correta para cada tarefa de múltipla escolha.
// Chamada APÓS generateDailyTasks para corrigir erros factuais da IA.

export async function verifyMultipleChoiceTasks(
  tasks: Array<{ question: string; options: string[] }>
): Promise<Array<{ correct_index: number; correct_answer: string }>> {
  if (tasks.length === 0) return [];

  const prompt = `You are an English grammar expert verifying multiple choice questions for Brazilian learners.
For each question below, determine which option is the CORRECT English answer.

${tasks.map((t, i) => `TASK ${i}:
Question: "${t.question}"
Options: ${t.options.map((o, j) => `${j}="${o}"`).join(", ")}`).join("\n\n")}

Respond with raw JSON only (no markdown):
{"results": [{"correct_index": <0-based int>, "correct_answer": "<exact option text>"}]}

One result per task in the same order. correct_answer must be the EXACT text of the correct option.`;

  const model  = getJsonModel(0.1);
  const result = await model.generateContent(prompt);

  try {
    const parsed = JSON.parse(stripCodeFences(result.response.text())) as {
      results?: Array<{ correct_index: number; correct_answer: string }>;
    };
    return parsed.results ?? [];
  } catch {
    return [];
  }
}

// ── validateTranslation ──────────────────────────────────────────────────────

export async function validateTranslation(
  userAnswer: string,
  acceptedAnswers: string[],
  level: UserLevel
): Promise<{ correct: boolean; score: number; feedback: string }> {
  const prompt = `You are evaluating an English translation exercise for a Brazilian student (${LEVEL_DESCRIPTIONS[level]}).

Accepted answers: ${acceptedAnswers.join(" | ")}
Student's answer: "${userAnswer}"

Evaluate if the answer is correct or acceptable. Consider:
- Minor spelling mistakes (1 char) as correct for beginners
- Alternative correct phrasings as correct
- Completely wrong answers as incorrect

Respond with raw JSON only, no markdown: {"correct": boolean, "score": 0-100, "feedback": "short feedback in Portuguese"}`;

  const model  = getJsonModel(0.3);
  const result = await model.generateContent(prompt);

  try {
    return JSON.parse(stripCodeFences(result.response.text()));
  } catch {
    return { correct: false, score: 0, feedback: "Não foi possível avaliar a resposta." };
  }
}

// ── getAIConversationResponse ────────────────────────────────────────────────
// Diferença Gemini vs OpenAI:
// - Gemini não tem role "system" nas mensagens — usa systemInstruction no modelo
// - Role "assistant" (OpenAI) → "model" (Gemini)
// - Sempre precisa de pelo menos uma mensagem com role "user"

export async function getAIConversationResponse(
  messages: { role: "user" | "assistant"; content: string }[],
  scenario: string,
  level: UserLevel
): Promise<string> {
  const systemInstruction = `You are an English conversation partner for a Brazilian student.
Level: ${LEVEL_DESCRIPTIONS[level]}.
Scenario: ${scenario}

Rules:
- Respond ONLY in English
- Keep responses concise (2-3 sentences max)
- Naturally correct grammar mistakes by using correct forms in your response
- Be encouraging and patient
- Stay in character for the scenario`;

  // Mapeia "assistant" → "model" para o formato do Gemini
  const contents = messages.map((m) => ({
    role:  m.role === "assistant" ? "model" : "user",
    parts: [{ text: m.content }],
  }));

  // Garante que a conversa começa com "user" (requisito do Gemini)
  const validContents =
    contents.length > 0 && contents[0].role === "model"
      ? contents.slice(1)
      : contents;

  const model = getModel({
    systemInstruction,
    temperature:     0.7,
  });

  const result = await model.generateContent({ contents: validContents });
  return (
    result.response.text() ||
    "I'm sorry, I didn't understand. Could you repeat that?"
  );
}

// ── generateVocabularyExplanation ────────────────────────────────────────────

export async function generateVocabularyExplanation(
  word: string,
  level: UserLevel
): Promise<{ explanation: string; mnemonic: string; example: string }> {
  const prompt = `Explain the English word "${word}" for a Brazilian ${LEVEL_DESCRIPTIONS[level]} student.
Respond with raw JSON only, no markdown:
{
  "explanation": "brief explanation in Portuguese",
  "mnemonic": "memory trick connecting to Portuguese (max 30 words)",
  "example": "simple example sentence in English"
}`;

  const model  = getJsonModel(0.5);
  const result = await model.generateContent(prompt);

  try {
    return JSON.parse(stripCodeFences(result.response.text()));
  } catch {
    return { explanation: "", mnemonic: "", example: "" };
  }
}
