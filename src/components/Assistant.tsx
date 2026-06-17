"use client";

import { useEffect, useRef, useState } from "react";
import { Bot, Send, X, Sparkles, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { consultarAsistente } from "@/app/(app)/asistente/actions";

type Msg = { role: "user" | "bot"; text: string; sugerencias?: string[] };

const BIENVENIDA: Msg = {
  role: "bot",
  text:
    "¡Hola! 👋 Soy el asistente de El Surtidor. Pregúntame lo que quieras sobre tu negocio: ventas, stock, productos más vendidos, inventario y más.",
  sugerencias: [
    "¿Cuánto vendí hoy?",
    "¿Qué productos están por agotarse?",
    "¿Cuál es el producto más vendido?",
    "Valor del inventario",
  ],
};

/** Renderiza texto con **negritas** y saltos de línea. */
function RichText({ text }: { text: string }) {
  return (
    <>
      {text.split("\n").map((line, i) => (
        <p key={i} className={cn(line === "" ? "h-2" : "")}>
          {line.split(/(\*\*[^*]+\*\*)/g).map((part, j) =>
            part.startsWith("**") && part.endsWith("**") ? (
              <strong key={j} className="font-semibold">
                {part.slice(2, -2)}
              </strong>
            ) : (
              <span key={j}>{part}</span>
            )
          )}
        </p>
      ))}
    </>
  );
}

export default function Assistant() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Msg[]>([BIENVENIDA]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, loading, open]);

  async function enviar(texto: string) {
    const pregunta = texto.trim();
    if (!pregunta || loading) return;
    setInput("");
    setMessages((m) => [...m, { role: "user", text: pregunta }]);
    setLoading(true);
    try {
      const res = await consultarAsistente(pregunta);
      setMessages((m) => [...m, { role: "bot", text: res.respuesta, sugerencias: res.sugerencias }]);
    } catch {
      setMessages((m) => [...m, { role: "bot", text: "Ups, ocurrió un error al consultar. Intenta de nuevo." }]);
    } finally {
      setLoading(false);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }

  return (
    <>
      {/* Botón flotante */}
      <button
        onClick={() => setOpen((o) => !o)}
        aria-label="Asistente"
        className={cn(
          "no-print fixed bottom-5 right-5 z-40 grid h-14 w-14 place-items-center rounded-full shadow-lg transition-all",
          "bg-brand-600 text-white hover:bg-brand-700 hover:scale-105",
          open && "rotate-90 scale-95"
        )}
      >
        {open ? <X className="h-6 w-6" /> : <Bot className="h-7 w-7" />}
        {!open && (
          <span className="absolute -right-0.5 -top-0.5 grid h-5 w-5 place-items-center rounded-full bg-amber-400 text-slate-900">
            <Sparkles className="h-3 w-3" />
          </span>
        )}
      </button>

      {/* Panel de chat */}
      {open && (
        <div className="no-print fixed bottom-24 right-5 z-40 flex h-[520px] w-[min(380px,calc(100vw-2.5rem))] animate-pop flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl dark:border-slate-700 dark:bg-slate-800">
          {/* Header */}
          <div className="flex items-center gap-3 bg-gradient-to-r from-brand-700 to-brand-600 px-4 py-3 text-white">
            <div className="grid h-9 w-9 place-items-center rounded-full bg-white/20">
              <Bot className="h-5 w-5" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-semibold leading-tight">Asistente El Surtidor</p>
              <p className="flex items-center gap-1 text-[11px] text-brand-100">
                <span className="inline-block h-1.5 w-1.5 rounded-full bg-emerald-300" /> En línea · responde al instante
              </p>
            </div>
          </div>

          {/* Mensajes */}
          <div ref={scrollRef} className="flex-1 space-y-3 overflow-y-auto bg-slate-50 px-3 py-4 dark:bg-slate-900/40">
            {messages.map((m, i) => (
              <div key={i} className={cn("flex", m.role === "user" ? "justify-end" : "justify-start")}>
                <div className="max-w-[85%]">
                  <div
                    className={cn(
                      "rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed",
                      m.role === "user"
                        ? "rounded-br-md bg-brand-600 text-white"
                        : "rounded-bl-md bg-white text-slate-700 shadow-sm dark:bg-slate-700 dark:text-slate-100"
                    )}
                  >
                    <RichText text={m.text} />
                  </div>
                  {m.sugerencias && m.sugerencias.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {m.sugerencias.map((s) => (
                        <button
                          key={s}
                          onClick={() => enviar(s)}
                          className="rounded-full border border-brand-200 bg-brand-50 px-2.5 py-1 text-xs font-medium text-brand-700 transition hover:bg-brand-100 dark:border-brand-700 dark:bg-brand-900/30 dark:text-brand-300"
                        >
                          {s}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex justify-start">
                <div className="flex items-center gap-2 rounded-2xl rounded-bl-md bg-white px-3.5 py-2.5 text-sm text-slate-400 shadow-sm dark:bg-slate-700">
                  <Loader2 className="h-4 w-4 animate-spin" /> Consultando…
                </div>
              </div>
            )}
          </div>

          {/* Input */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              enviar(input);
            }}
            className="flex items-center gap-2 border-t border-slate-100 bg-white p-2.5 dark:border-slate-700 dark:bg-slate-800"
          >
            <input
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Escribe tu pregunta…"
              className="flex-1 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900 outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/30 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100"
            />
            <button
              type="submit"
              disabled={loading || !input.trim()}
              className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-brand-600 text-white transition hover:bg-brand-700 disabled:opacity-40"
            >
              <Send className="h-4 w-4" />
            </button>
          </form>
        </div>
      )}
    </>
  );
}
