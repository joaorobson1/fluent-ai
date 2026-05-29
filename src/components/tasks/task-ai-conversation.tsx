"use client";

import { useState, useRef, useEffect } from "react";
import { motion } from "framer-motion";
import { Send, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { ConversaIAContent } from "@/types";
import { useUserStore } from "@/store/user-store";
import { cn } from "@/lib/utils";

interface Message {
  role: "user" | "assistant";
  content: string;
}

interface Props {
  content: ConversaIAContent;
  onComplete: () => void;
}

export function TaskAIConversation({ content, onComplete }: Props) {
  const { profile } = useUserStore();
  const [messages, setMessages] = useState<Message[]>([
    { role: "assistant", content: content.starter_message }
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [exchanges, setExchanges] = useState(0);
  const [completed, setCompleted] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function sendMessage() {
    if (!input.trim() || loading) return;

    const userMsg = input.trim();
    setInput("");
    const newMessages: Message[] = [...messages, { role: "user", content: userMsg }];
    setMessages(newMessages);
    setLoading(true);

    try {
      const res = await fetch("/api/ai/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: newMessages,
          scenario: content.scenario,
          level: profile?.level ?? "iniciante",
        }),
      });

      const data = await res.json();
      setMessages([...newMessages, { role: "assistant", content: data.message }]);
      const newCount = exchanges + 1;
      setExchanges(newCount);

      if (newCount >= content.min_exchanges) {
        setCompleted(true);
      }
    } catch {
      setMessages([...newMessages, { role: "assistant", content: "Sorry, I had a connection issue. Please try again!" }]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-4">
      {/* Scenario info */}
      <div className="bg-brand-500/10 border border-brand-500/20 rounded-xl p-3">
        <p className="text-xs font-semibold text-brand-400 uppercase tracking-wide mb-1">Cenário</p>
        <p className="text-sm text-slate-300">{content.scenario}</p>
        <div className="flex flex-wrap gap-1.5 mt-2">
          {content.vocabulary_focus.map((word) => (
            <span key={word} className="text-xs bg-brand-500/20 text-brand-300 px-2 py-0.5 rounded-full">
              {word}
            </span>
          ))}
        </div>
      </div>

      {/* Chat messages */}
      <div className="bg-slate-800/40 rounded-2xl border border-slate-700 p-4 h-[300px] overflow-y-auto space-y-3 no-scrollbar">
        {messages.map((msg, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className={cn("flex gap-2", msg.role === "user" ? "justify-end" : "justify-start")}
          >
            {msg.role === "assistant" && (
              <div className="w-7 h-7 bg-gradient-to-br from-brand-500 to-accent-500 rounded-full flex items-center justify-center text-xs flex-shrink-0 mt-0.5">
                🤖
              </div>
            )}
            <div className={cn(
              "max-w-[80%] px-3 py-2.5 rounded-2xl text-sm",
              msg.role === "user"
                ? "bg-brand-500 text-white rounded-br-sm"
                : "bg-slate-700 text-slate-200 rounded-bl-sm"
            )}>
              {msg.content}
            </div>
          </motion.div>
        ))}

        {loading && (
          <div className="flex gap-2 justify-start">
            <div className="w-7 h-7 bg-gradient-to-br from-brand-500 to-accent-500 rounded-full flex items-center justify-center text-xs">
              🤖
            </div>
            <div className="bg-slate-700 rounded-2xl rounded-bl-sm px-3 py-2.5 flex gap-1">
              {[0, 0.2, 0.4].map((delay, i) => (
                <motion.div
                  key={i}
                  animate={{ y: [0, -4, 0] }}
                  transition={{ repeat: Infinity, duration: 0.6, delay }}
                  className="w-1.5 h-1.5 bg-slate-400 rounded-full"
                />
              ))}
            </div>
          </div>
        )}
        <div ref={scrollRef} />
      </div>

      {/* Input */}
      {!completed ? (
        <div className="flex gap-2">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && sendMessage()}
            placeholder="Type in English..."
            className="flex-1 input-field text-sm"
            disabled={loading}
          />
          <Button onClick={sendMessage} disabled={!input.trim() || loading} size="icon" className="h-11 w-11 shrink-0">
            <Send size={16} />
          </Button>
        </div>
      ) : null}

      {completed && (
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-green-500/15 border border-green-500/30 rounded-xl p-4 text-center"
        >
          <CheckCircle className="text-green-400 mx-auto mb-2" size={24} />
          <p className="font-semibold text-green-300 mb-1">Conversa concluída!</p>
          <p className="text-sm text-slate-400 mb-3">
            Você completou {exchanges} trocas em inglês. Incrível! 🎉
          </p>
          <Button onClick={onComplete} className="gap-2">
            Continuar <CheckCircle size={16} />
          </Button>
        </motion.div>
      )}

      <p className="text-center text-xs text-slate-600">
        {exchanges}/{content.min_exchanges} trocas mínimas
      </p>
    </div>
  );
}
