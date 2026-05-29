import { NextRequest, NextResponse } from "next/server";
import { getAIConversationResponse } from "@/lib/gemini/task-generator";
import type { UserLevel } from "@/types";

export async function POST(req: NextRequest) {
  try {
    const { messages, scenario, level } = await req.json() as {
      messages: { role: "user" | "assistant"; content: string }[];
      scenario: string;
      level: UserLevel;
    };

    if (!messages || !scenario || !level) {
      return NextResponse.json({ error: "Parâmetros obrigatórios ausentes" }, { status: 400 });
    }

    const response = await getAIConversationResponse(messages, scenario, level);

    return NextResponse.json({ message: response });
  } catch (error) {
    console.error("Erro na conversa com IA:", error);
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}
