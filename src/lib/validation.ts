/**
 * Utilitários de validação e normalização de respostas.
 *
 * Filosofia: ser generoso com o aluno.
 * Pequenas diferenças de pontuação, capitalização ou acentuação
 * não devem punir uma resposta semanticamente correta.
 */

// ── Normalização ─────────────────────────────────────────────────────────────

/**
 * Normaliza um texto para comparação:
 * - lowercase
 * - remove acentos (NFD decomposition)
 * - remove pontuação terminal e interna
 * - colapsa espaços múltiplos
 */
export function normalize(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")    // remove diacríticos
    .replace(/[.,!?;:'"()\-]/g, " ")    // pontuação → espaço
    .replace(/\s+/g, " ")               // colapsa espaços
    .trim();
}

/**
 * Normalização estrita para múltipla escolha:
 * preserva a estrutura da frase mas ignora capitalização e espaços extras.
 */
export function normalizeOption(text: string): string {
  return text.toLowerCase().trim().replace(/\s+/g, " ");
}

// ── Levenshtein ───────────────────────────────────────────────────────────────

function levenshtein(a: string, b: string): number {
  if (a === b) return 0;
  if (a.length === 0) return b.length;
  if (b.length === 0) return a.length;

  const prev = Array.from({ length: b.length + 1 }, (_, i) => i);
  const curr = new Array<number>(b.length + 1);

  for (let i = 1; i <= a.length; i++) {
    curr[0] = i;
    for (let j = 1; j <= b.length; j++) {
      curr[j] = a[i - 1] === b[j - 1]
        ? prev[j - 1]
        : 1 + Math.min(prev[j], curr[j - 1], prev[j - 1]);
    }
    prev.splice(0, prev.length, ...curr);
  }
  return prev[b.length];
}

// ── Correspondência de respostas ──────────────────────────────────────────────

export type MatchQuality = "exact" | "fuzzy" | "none";

export interface MatchResult {
  match: MatchQuality;
  score: number;        // 0-100
  matchedAnswer: string; // qual accepted_answer mais se aproximou
}

/**
 * Verifica se a resposta do aluno bate com alguma das respostas aceitas.
 *
 * Níveis de tolerância:
 * - "exact"  : normalizado identico
 * - "fuzzy"  : distância Levenshtein ≤ threshold (padrão = 1 para palavras curtas, 2 para longas)
 * - "none"   : nenhuma correspondência
 */
export function checkAnswer(
  userAnswer: string,
  acceptedAnswers: string[]
): MatchResult {
  if (!userAnswer.trim() || acceptedAnswers.length === 0) {
    return { match: "none", score: 0, matchedAnswer: "" };
  }

  const normUser = normalize(userAnswer);

  // 1. Correspondência exata normalizada
  for (const accepted of acceptedAnswers) {
    if (normalize(accepted) === normUser) {
      return { match: "exact", score: 100, matchedAnswer: accepted };
    }
  }

  // 2. Fuzzy matching — tolerância adaptativa por comprimento
  let bestDist = Infinity;
  let bestAnswer = "";

  for (const accepted of acceptedAnswers) {
    const normAccepted = normalize(accepted);
    const dist = levenshtein(normUser, normAccepted);
    if (dist < bestDist) {
      bestDist = dist;
      bestAnswer = accepted;
    }
  }

  if (bestAnswer) {
    const maxLen = Math.max(normUser.length, normalize(bestAnswer).length);
    // Threshold: 1 char para respostas curtas (≤8), 2 chars para longas
    const threshold = maxLen <= 8 ? 1 : 2;

    if (bestDist <= threshold) {
      const score = Math.round((1 - bestDist / maxLen) * 100);
      return { match: "fuzzy", score: Math.max(score, 85), matchedAnswer: bestAnswer };
    }
  }

  return { match: "none", score: 0, matchedAnswer: "" };
}

// ── Validação de múltipla escolha ─────────────────────────────────────────────

/**
 * Compara a opção selecionada com a resposta correta armazenada.
 * Usa normalização para ser tolerante a diferenças de capitalização/espaço.
 */
export function checkMultipleChoice(
  selectedOption: string,
  correctAnswer: string
): boolean {
  return normalizeOption(selectedOption) === normalizeOption(correctAnswer);
}

// ── Validação de estrutura das tarefas ───────────────────────────────────────

export interface ValidationError {
  field: string;
  message: string;
}

export function validateMultipleChoiceContent(content: Record<string, unknown>): ValidationError[] {
  const errors: ValidationError[] = [];

  if (!Array.isArray(content.options) || content.options.length < 2) {
    errors.push({ field: "options", message: "Deve ter pelo menos 2 opções" });
    return errors;
  }

  const options = content.options as string[];

  // Verificar duplicatas
  const normalized = options.map(normalizeOption);
  const unique = new Set(normalized);
  if (unique.size !== options.length) {
    errors.push({ field: "options", message: "Opções duplicadas detectadas" });
  }

  // Verificar correct_answer
  if (!content.correct_answer || typeof content.correct_answer !== "string") {
    errors.push({ field: "correct_answer", message: "correct_answer é obrigatório" });
    return errors;
  }

  const correctInOptions = options.some(
    (o) => normalizeOption(o) === normalizeOption(content.correct_answer as string)
  );

  if (!correctInOptions) {
    errors.push({ field: "correct_answer", message: "correct_answer não encontrado nas opções" });
  }

  if (!content.question || typeof content.question !== "string") {
    errors.push({ field: "question", message: "question é obrigatório" });
  }

  return errors;
}

export function validateTranslationContent(content: Record<string, unknown>): ValidationError[] {
  const errors: ValidationError[] = [];

  if (!content.text || typeof content.text !== "string") {
    errors.push({ field: "text", message: "text é obrigatório" });
  }

  if (!Array.isArray(content.accepted_answers) || (content.accepted_answers as unknown[]).length === 0) {
    errors.push({ field: "accepted_answers", message: "accepted_answers deve ser um array não vazio" });
  }

  return errors;
}

export function validateSentenceBuilderContent(content: Record<string, unknown>): ValidationError[] {
  const errors: ValidationError[] = [];

  if (!Array.isArray(content.words) || (content.words as unknown[]).length < 2) {
    errors.push({ field: "words", message: "words deve ter pelo menos 2 elementos" });
    return errors;
  }

  const words = content.words as string[];

  if (!Array.isArray(content.correct_order)) {
    errors.push({ field: "correct_order", message: "correct_order é obrigatório" });
    return errors;
  }

  const order = content.correct_order as number[];

  if (order.length !== words.length) {
    errors.push({ field: "correct_order", message: "correct_order deve ter o mesmo tamanho que words" });
  }

  const validIndices = order.every((i) => typeof i === "number" && i >= 0 && i < words.length);
  if (!validIndices) {
    errors.push({ field: "correct_order", message: "correct_order contém índices fora do range" });
  }

  return errors;
}
