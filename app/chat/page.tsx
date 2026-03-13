/* eslint-disable @next/next/no-img-element */
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeftIcon } from "@heroicons/react/24/outline";
import { ChatWindow } from "@/components/ChatWindow";
import { ChatInput } from "@/components/ChatInput";
import type { ChatMessage } from "@/lib/openai";

export default function ChatPage() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  /** True hasta terminar scan-gmail + primera carga del agente (scraping de movimientos) */
  const [scanningMail, setScanningMail] = useState(true);

  useEffect(() => {
    // Scan Gmail (mock) into email_expenses, then load first pending expense in chat.
    const bootstrap = async () => {
      setScanningMail(true);
      setLoading(true);
      try {
        try {
          const scanRes = await fetch("/api/scan-gmail", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
          });
          if (!scanRes.ok) {
            console.warn("[chat] scan-gmail returned", scanRes.status);
          }
        } catch {
          // Network error: still try chat-agent with existing email_expenses
        }

        const res = await fetch("/api/chat-agent", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ messages: [] }),
        });
        const data = await res.json();
        if (data.assistantMessage) {
          setMessages([
            { role: "assistant", content: data.assistantMessage },
          ]);
        }
      } finally {
        setLoading(false);
        setScanningMail(false);
      }
    };

    bootstrap();
  }, []);

  const sendMessage = async () => {
    if (!input.trim()) return;
    const newMessages: ChatMessage[] = [
      ...messages,
      { role: "user", content: input.trim() },
    ];
    setMessages(newMessages);
    setInput("");
    setLoading(true);

    try {
      const res = await fetch("/api/chat-agent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: newMessages }),
      });
      const data = await res.json();

      if (data.assistantMessage) {
        if (data.resetConversation) {
          // Siguiente gasto: hilo nuevo para que el agente no mezcle respuestas
          setMessages([
            { role: "assistant", content: data.assistantMessage },
          ]);
        } else {
          setMessages((prev) => [
            ...prev,
            { role: "assistant", content: data.assistantMessage },
          ]);
        }
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen w-full items-center justify-center bg-zinc-950">
      <div className="flex h-[600px] w-full max-w-md flex-col overflow-hidden rounded-3xl border border-zinc-800 bg-zinc-900 shadow-sm">
        <div className="flex items-center border-b border-zinc-800 px-4 py-3 bg-zinc-900/80 backdrop-blur">
          <Link
            href="/dashboard"
            className="flex items-center gap-1.5 text-xs text-zinc-400 hover:text-zinc-50 transition shrink-0"
          >
            <ArrowLeftIcon className="w-4 h-4" />
            Volver
          </Link>
          <div className="flex-1 flex justify-center items-center gap-3 min-w-0">
            <div className="h-9 w-9 rounded-full bg-emerald-500 text-white flex items-center justify-center text-sm font-semibold shadow-sm shadow-emerald-500/40 shrink-0">
              S
            </div>
            <div className="min-w-0">
              <p className="text-sm font-semibold text-zinc-50">SplitIA</p>
              <p className="text-[11px] text-emerald-400">
                AI daily expense assistant
              </p>
            </div>
          </div>
        </div>
        {scanningMail ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-4 px-6 py-12">
            <div
              className="h-10 w-10 rounded-full border-2 border-zinc-600 border-t-emerald-500 animate-spin"
              aria-hidden
            />
            <div className="text-center">
              <p className="text-sm font-medium text-zinc-200">
                Escaneando movimientos del correo
              </p>
              <p className="mt-1 text-xs text-zinc-500">
                Buscando notificaciones de gastos…
              </p>
            </div>
          </div>
        ) : (
          <>
            <ChatWindow messages={messages} />
            <ChatInput
              value={input}
              onChange={setInput}
              onSend={sendMessage}
              loading={loading}
            />
          </>
        )}
      </div>
    </div>
  );
}

