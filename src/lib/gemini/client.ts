import { GoogleGenerativeAI } from "@google/generative-ai";

if (!process.env.GEMINI_API_KEY) {
  console.error("[Gemini] GEMINI_API_KEY não configurada no .env.local");
}

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

// gemini-1.5-flash foi descontinuado.
// gemini-2.0-flash é o substituto atual — disponível em v1beta.
export const MODEL_NAME = "gemini-3.1-flash-lite";

// v1beta suporta responseMimeType, systemInstruction e todos os recursos atuais.
const REQUEST_OPTIONS = { apiVersion: "v1beta" as const };

export function getModel(config?: {
  temperature?:       number;
  jsonMode?:          boolean;
  systemInstruction?: string;
}) {
  return genAI.getGenerativeModel(
    {
      model: MODEL_NAME,
      ...(config?.systemInstruction && {
        systemInstruction: config.systemInstruction,
      }),
      generationConfig: {
        ...(config?.temperature !== undefined && {
          temperature: config.temperature,
        }),
        ...(config?.jsonMode && {
          responseMimeType: "application/json",
        }),
      },
    },
    REQUEST_OPTIONS
  );
}
