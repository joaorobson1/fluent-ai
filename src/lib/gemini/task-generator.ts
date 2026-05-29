import { getModel } from "./client";
import type { TaskType, UserLevel, Task } from "@/types";
import {
  validateMultipleChoiceContent,
  validateTranslationContent,
  validateSentenceBuilderContent,
  normalizeOption,
} from "@/lib/validation";

// ── Helpers ───────────────────────────────────────────────────────────────────

function stripCodeFences(raw: string): string {
  return raw.trim().replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "").trim();
}

const getJsonModel = (temperature: number) => getModel({ temperature });

// ── Constantes ────────────────────────────────────────────────────────────────

const LEVEL_DESCRIPTIONS: Record<UserLevel, string> = {
  zero:          "absolute beginner (never studied English)",
  iniciante:     "beginner (basic greetings, present simple, numbers)",
  intermediario: "intermediate (all tenses, 2000+ vocabulary, can hold conversations)",
  avancado:      "advanced (complex grammar, idioms, near-fluent)",
};

const TOPIC_PROMPTS: Record<string, string> = {
  grammar:      "verb conjugation, tenses, sentence structure",
  vocabulary:   "common words, collocations, phrasal verbs",
  pronunciation: "word stress, phonetics",
  listening:    "listening comprehension",
  conversation: "everyday dialogues, greetings, small talk",
  business:     "professional English, emails, presentations",
  travel:       "directions, hotels, restaurants, transport",
};

// ── generateDailyTasks ────────────────────────────────────────────────────────

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

  const topics = preferredTopics.length > 0 ? preferredTopics : ["grammar", "vocabulary"];
  const topicStr = topics.map((t) => TOPIC_PROMPTS[t] || t).join(", ");
  const focusStr = weakAreas.length > 0 ? `Prioritize: ${weakAreas.join(", ")}.` : "";

  const diffRange =
    level === "zero"          ? "1-2" :
    level === "iniciante"     ? "1-3" :
    level === "intermediario" ? "2-4" : "3-5";

  const prompt = `You are a professional English teacher creating exercises for Brazilian Portuguese speakers.
Level: ${LEVEL_DESCRIPTIONS[level]}. Topics: ${topicStr}. ${focusStr}

Generate exactly ${count} tasks. Respond with ONLY a JSON object — no markdown, no explanation, no code fences.

FORMAT:
{"tasks":[...${count} task objects...]}

TASK TYPES allowed: traducao, multipla_escolha, complete_frase, montar_frase, vocabulario, missao_dia
Distribute types evenly. Avoid repeating the same type consecutively.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
SCHEMAS (use EXACT field names):
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

COMMON FIELDS (all tasks must have):
{
  "type": "<task_type>",
  "title": "<short title in Portuguese, max 40 chars>",
  "description": "<one line in Portuguese, max 60 chars>",
  "topic": "<grammar|vocabulary|pronunciation|conversation|business|travel>",
  "difficulty": <integer ${diffRange}>,
  "xp_reward": <integer 10-30>,
  "content": { ...see per-type schema below... }
}

━━ traducao ━━
content = {
  "type": "traducao",
  "direction": "pt_to_en",
  "text": "<Portuguese sentence to translate>",
  "accepted_answers": ["<correct English translation>", "<alternative 1>", "<alternative 2>"],
  "hint": "<optional grammar hint in Portuguese>",
  "explanation": "<why this answer is correct, in Portuguese>"
}
RULES:
• accepted_answers MUST have at least 2 variants (contractions, word order, synonyms)
• text must be a natural, everyday sentence
• For beginner: simple present/greetings; for intermediate+: varied tenses

━━ multipla_escolha ━━
content = {
  "type": "multipla_escolha",
  "question": "<question in Portuguese asking which English form is correct>",
  "options": ["<option A>", "<option B>", "<option C>", "<option D>"],
  "correct_index": <0-based integer — position of correct option in options array>,
  "correct_answer": "<EXACT text of the correct option — must match options[correct_index] character by character>",
  "explanation": "<grammar rule explanation in Portuguese>"
}
CRITICAL RULES for multipla_escolha:
• Think step by step:
  1. Write the question
  2. Decide the CORRECT English answer
  3. Write 3 WRONG but plausible answers (common mistakes Brazilians make)
  4. Put all 4 answers in options[] — shuffle their order
  5. Set correct_index = position of correct answer in options[] (0-based)
  6. Set correct_answer = options[correct_index] (must match EXACTLY)
• All 4 options must be DIFFERENT strings
• The correct option must be UNAMBIGUOUSLY correct English
• Wrong options must be realistic mistakes, not absurd
• VERIFY before outputting: options[correct_index] === correct_answer

━━ complete_frase ━━
content = {
  "type": "complete_frase",
  "sentence_with_blank": "<sentence with BLANK where the answer goes>",
  "options": ["<opt1>", "<opt2>", "<opt3>", "<opt4>"],
  "correct_answer": "<the word/phrase that fills the blank — must be one of options exactly>",
  "full_sentence": "<complete sentence with blank filled>",
  "explanation": "<why this answer in Portuguese>"
}
RULES:
• Use BLANK (all caps) to mark the blank
• correct_answer must be exactly one of the options strings
• Other options must be plausible wrong choices

━━ montar_frase ━━
content = {
  "type": "montar_frase",
  "words": ["word1", "word2", "word3", ...],
  "correct_order": [<0-based indices in correct order>],
  "translation": "<Portuguese translation of the complete sentence>",
  "hint": "<optional tip in Portuguese>"
}
RULES:
• words = individual words/tokens in SHUFFLED order (not the correct order)
• correct_order = indices into words[] that form the correct English sentence
• Example: words=["coffee","I","like"] → correct_order=[1,2,0] → "I like coffee"
• 3-6 words total; use natural English sentences

━━ vocabulario ━━
content = {
  "type": "vocabulario",
  "quiz_mode": "flashcard",
  "words": [
    {
      "id": "",
      "user_id": "",
      "word": "<English word>",
      "translation": "<Portuguese translation>",
      "pronunciation": "<phonetic spelling>",
      "example_sentence": "<natural English example>",
      "difficulty": <1-3>,
      "tags": ["<category>"],
      "times_seen": 0,
      "times_correct": 0,
      "mastery_level": 0,
      "ease_factor": 2.5,
      "interval_days": 1,
      "is_mastered": false,
      "created_at": "",
      "updated_at": ""
    }
  ]
}
RULES: Include 3-5 thematically related words. Words must match the level.

━━ missao_dia ━━
content = {
  "type": "missao_dia",
  "mission": "<engaging mission description in Portuguese>",
  "steps": ["<step 1>", "<step 2>", "<step 3>"],
  "xp_bonus": 20
}
RULES: Make it a fun real-world challenge (speak English for 5 minutes, label objects in English, etc.)

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
QUALITY CHECKLIST before outputting:
• Each task teaches something clear and specific
• No duplicate questions or options
• Correct answers are unambiguously correct
• Wrong answers are plausible common mistakes
• multipla_escolha: verified options[correct_index] === correct_answer
• montar_frase: correct_order indices are valid and form correct English
• traducao: accepted_answers includes both formal and informal variants
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`;

  const model = getJsonModel(0.2); // baixa temperatura = maior precisão factual
  const result = await model.generateContent(prompt);
  const raw = stripCodeFences(result.response.text());

  let tasks: Partial<Task>[] = [];

  try {
    const parsed = JSON.parse(raw) as Record<string, unknown>;
    if (Array.isArray(parsed.tasks)) {
      tasks = parsed.tasks as Partial<Task>[];
    } else {
      // Fallback: encontrar o primeiro array no objeto
      const firstArray = Object.values(parsed).find(Array.isArray);
      if (firstArray) tasks = firstArray as Partial<Task>[];
    }
  } catch (err) {
    console.error("[generateDailyTasks] parse error:", err, "\nraw preview:", raw.slice(0, 400));
    throw new Error("Falha ao interpretar resposta da IA. Tente novamente.");
  }

  if (tasks.length === 0) {
    throw new Error("A IA não retornou tarefas válidas.");
  }

  // Sanitizar e validar cada tarefa
  const sanitized = tasks
    .slice(0, count)
    .map(sanitizeTask)
    .filter((t): t is Partial<Task> => t !== null);

  if (sanitized.length === 0) {
    throw new Error("Todas as tarefas geradas falharam na validação de esquema.");
  }

  return sanitized;
}

// ── Sanitização pós-geração ───────────────────────────────────────────────────

function sanitizeTask(task: Partial<Task>): Partial<Task> | null {
  if (!task.type || !task.content) return null;

  const content = task.content as Record<string, unknown>;

  switch (task.type) {
    case "multipla_escolha":
      return sanitizeMultipleChoice(task, content);
    case "traducao":
      return sanitizeTranslation(task, content);
    case "montar_frase":
      return sanitizeSentenceBuilder(task, content);
    case "complete_frase":
      return sanitizeCompleteFrase(task, content);
    default:
      return task;
  }
}

function sanitizeMultipleChoice(task: Partial<Task>, content: Record<string, unknown>): Partial<Task> | null {
  const errors = validateMultipleChoiceContent(content);

  // Tentar auto-corrigir: derivar correct_index a partir de correct_answer
  if (errors.some((e) => e.field === "correct_index" || e.field === "correct_answer")) {
    return null; // sem correct_answer confiável, descartar
  }

  const options = content.options as string[];
  const correctAnswer = content.correct_answer as string;

  // Remover opções duplicadas
  const seen = new Set<string>();
  const deduped = options.filter((o) => {
    const norm = normalizeOption(o);
    if (seen.has(norm)) return false;
    seen.add(norm);
    return true;
  });

  // Recalcular correct_index pelo texto (mais confiável que o índice da IA)
  const realIndex = deduped.findIndex(
    (o) => normalizeOption(o) === normalizeOption(correctAnswer)
  );

  if (realIndex === -1) {
    // correct_answer não está nas opções — tarefa inválida
    console.warn("[sanitize] multipla_escolha descartada: correct_answer não está nas opções", {
      correct_answer: correctAnswer,
      options: deduped,
    });
    return null;
  }

  return {
    ...task,
    content: {
      ...content,
      options: deduped,
      correct_index: realIndex,
      correct_answer: deduped[realIndex], // usar o texto exato da opção
    },
  };
}

function sanitizeTranslation(task: Partial<Task>, content: Record<string, unknown>): Partial<Task> | null {
  const errors = validateTranslationContent(content);
  if (errors.length > 0) {
    console.warn("[sanitize] traducao inválida:", errors);
    return null;
  }

  const answers = content.accepted_answers as string[];

  // Garantir que a lista de respostas não tem duplicatas
  const unique = [...new Set(answers.map((a) => a.trim()).filter(Boolean))];
  if (unique.length === 0) return null;

  return {
    ...task,
    content: { ...content, accepted_answers: unique },
  };
}

function sanitizeSentenceBuilder(task: Partial<Task>, content: Record<string, unknown>): Partial<Task> | null {
  const errors = validateSentenceBuilderContent(content);
  if (errors.length > 0) {
    console.warn("[sanitize] montar_frase inválida:", errors);
    return null;
  }
  return task;
}

function sanitizeCompleteFrase(task: Partial<Task>, content: Record<string, unknown>): Partial<Task> | null {
  if (!content.correct_answer || !Array.isArray(content.options)) return null;

  const options = content.options as string[];
  const correctAnswer = content.correct_answer as string;

  // Verificar que correct_answer está nas opções
  const found = options.some(
    (o) => normalizeOption(o) === normalizeOption(correctAnswer)
  );

  if (!found) {
    // Tentar adicionar correct_answer às opções se houver espaço
    if (options.length < 4) {
      return {
        ...task,
        content: { ...content, options: [...options, correctAnswer] },
      };
    }
    console.warn("[sanitize] complete_frase descartada: correct_answer não nas opções");
    return null;
  }

  return task;
}

// ── verifyWhichOptionIsCorrect ────────────────────────────────────────────────
// Chamada UMA VEZ para tarefas antigas (sem correct_answer salvo).
// Temperatura próxima de zero = resposta determinística para questões gramaticais.

export async function verifyWhichOptionIsCorrect(
  questionOrSentence: string,
  options: string[]
): Promise<{ correct_index: number; correct_answer: string }> {
  if (options.length === 0) {
    return { correct_index: 0, correct_answer: "" };
  }

  const optionsList = options.map((o, i) => `${i}: "${o}"`).join(", ");

  const prompt = `You are an English grammar expert.
Context for Brazilian learner: "${questionOrSentence}"
Options: ${optionsList}

Which option (0-based index) is the CORRECT English answer? Consider grammar, meaning, and context.
Raw JSON only: {"correct_index": <integer 0-${options.length - 1}>, "correct_answer": "<exact text of that option>"}`;

  const model = getModel({ temperature: 0.05 });
  const result = await model.generateContent(prompt);

  try {
    const parsed = JSON.parse(stripCodeFences(result.response.text())) as {
      correct_index?: number;
      correct_answer?: string;
    };

    const idx = Math.max(0, Math.min(options.length - 1, Number(parsed.correct_index ?? 0)));
    return { correct_index: idx, correct_answer: options[idx] ?? options[0] };
  } catch {
    // Fallback absoluto — não punir o aluno se a chamada falhar
    return { correct_index: 0, correct_answer: options[0] };
  }
}

// ── validateTranslation ───────────────────────────────────────────────────────

export async function validateTranslation(
  userAnswer: string,
  acceptedAnswers: string[],
  level: UserLevel
): Promise<{ correct: boolean; score: number; feedback: string }> {
  const prompt = `You are evaluating an English translation exercise for a Brazilian ${LEVEL_DESCRIPTIONS[level]} student.

Accepted answers: ${acceptedAnswers.join(" | ")}
Student's answer: "${userAnswer}"

Evaluation criteria:
- CORRECT if: same meaning, grammatically valid English, possibly different word order or minor phrasing variation
- CORRECT if: contraction vs expanded form ("it's" = "it is")
- CORRECT if: British vs American spelling ("colour" = "color")
- PARTIALLY CORRECT (score 70-85) if: correct meaning but minor grammar error
- INCORRECT if: wrong meaning or fundamentally wrong grammar

Respond with raw JSON only:
{"correct": <boolean>, "score": <0-100>, "feedback": "<one sentence in Portuguese — encouraging even when wrong>"}`;

  const model = getJsonModel(0.1);
  const result = await model.generateContent(prompt);

  try {
    const parsed = JSON.parse(stripCodeFences(result.response.text())) as {
      correct?: boolean;
      score?: number;
      feedback?: string;
    };

    // Se o score for alto (≥70), considerar correto mesmo que o boolean diga false
    const score = typeof parsed.score === "number" ? parsed.score : 0;
    const correct = parsed.correct === true || score >= 70;

    return {
      correct,
      score,
      feedback: parsed.feedback ?? (correct ? "Muito bem!" : "Tente novamente."),
    };
  } catch {
    return { correct: false, score: 0, feedback: "Não foi possível avaliar. Tente novamente." };
  }
}

// ── getAIConversationResponse ─────────────────────────────────────────────────

export async function getAIConversationResponse(
  messages: { role: "user" | "assistant"; content: string }[],
  scenario: string,
  level: UserLevel
): Promise<string> {
  const systemInstruction = `You are an English conversation partner for a Brazilian student.
Level: ${LEVEL_DESCRIPTIONS[level]}. Scenario: ${scenario}
Rules: respond ONLY in English, max 2-3 sentences, be encouraging, stay in character.`;

  const contents = messages.map((m) => ({
    role: m.role === "assistant" ? "model" : "user",
    parts: [{ text: m.content }],
  }));

  const validContents = contents.length > 0 && contents[0].role === "model"
    ? contents.slice(1)
    : contents;

  const model = getModel({ systemInstruction, temperature: 0.7 });
  const result = await model.generateContent({ contents: validContents });
  return result.response.text() || "Could you repeat that, please?";
}

// ── generateVocabularyExplanation ─────────────────────────────────────────────

export async function generateVocabularyExplanation(
  word: string,
  level: UserLevel
): Promise<{ explanation: string; mnemonic: string; example: string }> {
  const prompt = `Explain the English word "${word}" for a Brazilian ${LEVEL_DESCRIPTIONS[level]} student.
Respond with raw JSON only:
{"explanation":"<brief in Portuguese>","mnemonic":"<memory trick, max 25 words>","example":"<natural English sentence>"}`;

  const model = getJsonModel(0.4);
  const result = await model.generateContent(prompt);

  try {
    return JSON.parse(stripCodeFences(result.response.text()));
  } catch {
    return { explanation: "", mnemonic: "", example: "" };
  }
}
