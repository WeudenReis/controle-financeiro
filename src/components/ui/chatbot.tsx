'use client'

import { useState, useRef, useEffect } from "react"
import { X, Send, Sparkles, Bot } from "lucide-react"
import { askAI, AIPromptContext } from "@/lib/ai"

type Msg = { id: string; text: string; sender: "user" | "bot" }

interface Props {
  context?: AIPromptContext
  inline?: boolean
  open?: boolean
  onOpenChange?: (v: boolean) => void
}

export default function Chatbot({ context, inline, open: openProp, onOpenChange }: Props) {
  const [internalOpen, setInternalOpen] = useState(false)
  const open = openProp !== undefined ? openProp : internalOpen
  const setOpen = (v: boolean) => { setInternalOpen(v); onOpenChange?.(v) }

  const [msgs, setMsgs] = useState<Msg[]>([
    { id: "0", text: "Olá! 👋 Sou sua assistente financeira com IA. Posso analisar suas finanças, sugerir economias ou responder qualquer dúvida. Como posso ajudar?", sender: "bot" }
  ])
  const [input, setInput] = useState("")
  const [loading, setLoading] = useState(false)
  const endRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (open) {
      setTimeout(() => endRef.current?.scrollIntoView({ behavior: "smooth" }), 100)
      setTimeout(() => inputRef.current?.focus(), 200)
    }
  }, [msgs, open])

  async function send() {
    if (!input.trim() || loading) return
    const text = input.trim()
    setInput("")
    const id = Date.now().toString()
    setMsgs(m => [...m, { id, text, sender: "user" }])
    setLoading(true)
    try {
      const reply = await askAI(text, context)
      setMsgs(m => [...m, { id: id + "r", text: reply, sender: "bot" }])
    } catch {
      setMsgs(m => [...m, { id: id + "r", text: "Ops, ocorreu um erro. Tente novamente.", sender: "bot" }])
    }
    setLoading(false)
  }

  const chatWindow = (
    <div className={`${inline ? 'w-full' : 'fixed bottom-20 right-4 md:bottom-6 md:right-6 z-50 w-[calc(100vw-2rem)] max-w-sm'} h-[420px] glass-card shadow-2xl flex flex-col overflow-hidden animate-slideUp`}>
      <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-primary/5 flex-shrink-0">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-primary to-cyan-400 flex items-center justify-center shadow-sm">
            <Sparkles size={14} className="text-white" />
          </div>
          <div>
            <span className="text-sm font-bold text-foreground block leading-none">Assistente IA</span>
            <span className="text-[10px] text-primary font-medium">Powered by Gemini</span>
          </div>
        </div>
        <button onClick={() => setOpen(false)} className="p-1.5 rounded-lg hover:bg-secondary transition text-muted-foreground">
          <X size={15} />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-3 space-y-3">
        {msgs.map(m => (
          <div key={m.id} className={`flex ${m.sender === "user" ? "justify-end" : "justify-start"} gap-2`}>
            {m.sender === "bot" && (
              <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-primary/20 to-cyan-400/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                <Bot size={12} className="text-primary" />
              </div>
            )}
            <div className={`max-w-[82%] text-xs px-3.5 py-2.5 rounded-2xl leading-relaxed whitespace-pre-wrap ${
              m.sender === "user"
                ? "bg-primary text-primary-foreground rounded-br-sm"
                : "bg-secondary text-foreground rounded-bl-sm"
            }`}>
              {m.text}
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex justify-start gap-2">
            <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-primary/20 to-cyan-400/20 flex items-center justify-center flex-shrink-0">
              <Bot size={12} className="text-primary" />
            </div>
            <div className="bg-secondary px-4 py-3 rounded-2xl rounded-bl-sm flex gap-1.5 items-center">
              {[0,1,2].map(i => (
                <div key={i} className="w-1.5 h-1.5 bg-primary rounded-full animate-bounce" style={{ animationDelay: `${i*0.12}s` }} />
              ))}
            </div>
          </div>
        )}
        <div ref={endRef} />
      </div>

      <div className="p-3 border-t border-border flex-shrink-0">
        <div className="flex gap-2 items-center bg-secondary/50 rounded-xl px-3 py-2">
          <input
            ref={inputRef}
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === "Enter" && !e.shiftKey && send()}
            placeholder="Pergunte sobre suas finanças..."
            className="flex-1 bg-transparent text-xs outline-none text-foreground placeholder:text-muted-foreground"
          />
          <button
            onClick={send}
            disabled={loading || !input.trim()}
            className="w-7 h-7 rounded-lg bg-primary flex items-center justify-center disabled:opacity-40 transition hover:bg-primary/90 active:scale-95 flex-shrink-0"
          >
            <Send size={12} className="text-primary-foreground" />
          </button>
        </div>
      </div>
    </div>
  )

  return (
    <>
      {!inline && !open && (
        <button
          onClick={() => setOpen(true)}
          className="fixed bottom-20 right-4 md:bottom-6 md:right-6 z-50 w-[52px] h-[52px] bg-gradient-to-br from-primary to-cyan-500 hover:opacity-90 text-white rounded-full shadow-lg shadow-primary/30 flex items-center justify-center transition-all active:scale-95 animate-pulseGlow"
          aria-label="Abrir assistente IA"
        >
          <Sparkles size={22} />
        </button>
      )}
      {!inline && open && chatWindow}
    </>
  )
}

export function useAIChat() {
  const [open, setOpen] = useState(false)
  return { open, setOpen }
}
