'use client'

import { useState, useRef, useEffect } from "react"
import { MessageCircle, X, Send, Sparkles } from "lucide-react"
import { askAI } from "@/lib/ai"

type Msg = { id: string; text: string; sender: "user" | "bot" }

export default function Chatbot() {
  const [open, setOpen] = useState(false)
  const [msgs, setMsgs] = useState<Msg[]>([
    { id: "0", text: "Olá! 👋 Sou seu assistente financeiro. Como posso ajudar?", sender: "bot" }
  ])
  const [input, setInput] = useState("")
  const [loading, setLoading] = useState(false)
  const endRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (open) endRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [msgs, open])

  async function send() {
    if (!input.trim() || loading) return
    const text = input.trim()
    setInput("")
    const id = Date.now().toString()
    setMsgs(m => [...m, { id, text, sender: "user" }])
    setLoading(true)
    try {
      const reply = await askAI(text)
      setMsgs(m => [...m, { id: id + "r", text: reply, sender: "bot" }])
    } catch {
      setMsgs(m => [...m, { id: id + "r", text: "Desculpe, ocorreu um erro. Tente novamente.", sender: "bot" }])
    }
    setLoading(false)
  }

  return (
    <>
      {!open && (
        <button
          onClick={() => setOpen(true)}
          className="fixed bottom-20 right-4 md:bottom-6 md:right-6 z-50 w-12 h-12 bg-primary hover:bg-primary/90 text-primary-foreground rounded-full shadow-lg flex items-center justify-center transition-all active:scale-95 animate-pulseRing"
        >
          <MessageCircle size={22} />
        </button>
      )}

      {open && (
        <div className="fixed bottom-20 right-4 md:bottom-6 md:right-6 z-50 w-72 h-[380px] glass-card shadow-2xl flex flex-col overflow-hidden animate-slideUp">
          <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-primary/5">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-xl bg-primary/20 flex items-center justify-center">
                <Sparkles size={14} className="text-primary" />
              </div>
              <span className="text-sm font-semibold text-foreground">Assistente</span>
            </div>
            <button onClick={() => setOpen(false)} className="p-1 rounded-lg hover:bg-secondary transition text-muted-foreground">
              <X size={15} />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-3 space-y-3">
            {msgs.map(m => (
              <div key={m.id} className={`flex ${m.sender === "user" ? "justify-end" : "justify-start"}`}>
                <div className={`max-w-[85%] text-xs px-3.5 py-2.5 rounded-2xl leading-relaxed ${
                  m.sender === "user"
                    ? "bg-primary text-primary-foreground rounded-br-sm"
                    : "bg-secondary text-foreground rounded-bl-sm"
                }`}>
                  {m.text}
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex justify-start">
                <div className="bg-secondary px-4 py-3 rounded-2xl rounded-bl-sm flex gap-1.5 items-center">
                  {[0,1,2].map(i => (
                    <div key={i} className="w-1.5 h-1.5 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: `${i*0.12}s` }} />
                  ))}
                </div>
              </div>
            )}
            <div ref={endRef} />
          </div>

          <div className="p-3 border-t border-border flex gap-2">
            <input
              type="text"
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === "Enter" && send()}
              placeholder="Pergunte algo..."
              disabled={loading}
              className="input-base flex-1 text-xs py-2"
            />
            <button
              onClick={send}
              disabled={!input.trim() || loading}
              className="p-2 bg-primary rounded-xl text-primary-foreground disabled:opacity-40 transition active:scale-95"
            >
              <Send size={14} />
            </button>
          </div>
        </div>
      )}
    </>
  )
}
