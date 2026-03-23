'use client'

import { useState, useEffect, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Calendar, Plus, Trash2, Loader2, ChevronDown, Target } from 'lucide-react'
import PageShell from '@/components/layout/page-shell'

interface Budget {
  id: string
  category: string
  limit: number
  month: string
  emoji: string
}

const fmt = (v: number) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })

const CATS = [
  { name: 'Alimentação', emoji: '🍽️' }, { name: 'Moradia', emoji: '🏠' },
  { name: 'Transporte', emoji: '🚗' }, { name: 'Saúde', emoji: '💊' },
  { name: 'Lazer', emoji: '🎮' }, { name: 'Educação', emoji: '📚' },
  { name: 'Vestuário', emoji: '👕' }, { name: 'Assinaturas', emoji: '📱' },
  { name: 'Mercado', emoji: '🛒' }, { name: 'Outros', emoji: '📦' },
]

// Componente de select customizado — sem fundo branco nativo
function CustomSelect({
  value, onChange, options
}: {
  value: string
  onChange: (v: string) => void
  options: { value: string; label: string; emoji?: string }[]
}) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const selected = options.find(o => o.value === value)

  useEffect(() => {
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen(v => !v)}
        className="w-full flex items-center gap-2.5 px-3 py-3 rounded-xl border border-border bg-secondary/40 hover:bg-secondary/70 transition text-sm text-foreground"
      >
        {selected?.emoji && <span className="text-base">{selected.emoji}</span>}
        <span className="flex-1 text-left font-medium">{selected?.label}</span>
        <ChevronDown size={15} className={`text-muted-foreground transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <div className="absolute top-full left-0 right-0 mt-1.5 z-50 glass-modal rounded-xl border border-border shadow-xl overflow-hidden max-h-56 overflow-y-auto">
          {options.map(o => (
            <button
              key={o.value}
              type="button"
              onClick={() => { onChange(o.value); setOpen(false) }}
              className={`w-full flex items-center gap-2.5 px-3 py-2.5 text-sm text-left transition-colors ${
                value === o.value
                  ? 'bg-primary/15 text-primary font-semibold'
                  : 'text-foreground hover:bg-secondary/60'
              }`}
            >
              {o.emoji && <span className="text-base">{o.emoji}</span>}
              <span>{o.label}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

export default function PlanningPage() {
  const [txs, setTxs] = useState<any[]>([])
  const [budgets, setBudgets] = useState<Budget[]>([])
  const [form, setForm] = useState({ category: 'Alimentação', limit: '', month: new Date().toISOString().slice(0, 7) })
  const [showForm, setShowForm] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    load()
    try {
      const saved = localStorage.getItem('finance_budgets')
      if (saved) setBudgets(JSON.parse(saved))
    } catch {}
    setLoading(false)
  }, [])

  async function load() {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    const { data } = await supabase.from('transactions').select('*').eq('user_id', user.id)
    setTxs(data || [])
  }

  function save(b: Budget[]) { setBudgets(b); localStorage.setItem('finance_budgets', JSON.stringify(b)) }

  function addBudget() {
    if (!form.limit || parseFloat(form.limit) <= 0) return
    const cat = CATS.find(c => c.name === form.category)
    const b: Budget = {
      id: Date.now().toString(),
      category: form.category,
      limit: parseFloat(form.limit.replace(',', '.')),
      month: form.month,
      emoji: cat?.emoji || '📦',
    }
    save([...budgets.filter(x => !(x.category === b.category && x.month === b.month)), b])
    setShowForm(false)
    setForm(f => ({ ...f, limit: '' }))
  }

  function getSpent(category: string) {
    return txs
      .filter(t => t.type === 'despesa' && t.category === category && t.date.startsWith(form.month))
      .reduce((s, t) => s + Number(t.amount), 0)
  }

  const monthBudgets = budgets.filter(b => b.month === form.month)
  const totalBudget = monthBudgets.reduce((s, b) => s + b.limit, 0)
  const totalSpent = monthBudgets.reduce((s, b) => s + getSpent(b.category), 0)

  if (loading) return (
    <PageShell title="Planejamento" icon={<Calendar size={20} className="text-primary" />}>
      <div className="flex justify-center py-20"><Loader2 className="animate-spin text-primary" size={28} /></div>
    </PageShell>
  )

  return (
    <PageShell title="Planejamento" icon={<Calendar size={20} className="text-primary" />}>
      <div className="space-y-4 pb-24 md:pb-6">

        {/* Seletor de mês */}
        <div className="glass-card p-4 flex items-center gap-3">
          <Calendar size={15} className="text-primary flex-shrink-0" />
          <label className="text-xs font-bold text-muted-foreground uppercase tracking-wide">Mês de referência</label>
          <input
            type="month"
            value={form.month}
            onChange={e => setForm(f => ({ ...f, month: e.target.value }))}
            className="ml-auto text-sm font-semibold text-foreground bg-transparent border-none outline-none"
          />
        </div>

        {/* Resumo total */}
        {monthBudgets.length > 0 && (
          <div className="glass-card p-4 space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-xs font-bold text-muted-foreground uppercase tracking-wide">Orçamento total</span>
              <span className={`text-sm font-bold ${totalSpent > totalBudget ? 'text-red-500' : 'text-primary'}`}>
                {fmt(totalSpent)} / {fmt(totalBudget)}
              </span>
            </div>
            <div className="h-2 bg-secondary rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all ${totalSpent > totalBudget ? 'bg-red-500' : 'bg-gradient-to-r from-primary to-cyan-400'}`}
                style={{ width: `${Math.min((totalSpent / totalBudget) * 100, 100)}%` }}
              />
            </div>
          </div>
        )}

        {/* Botão adicionar */}
        <button
          onClick={() => setShowForm(v => !v)}
          className={`w-full flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-semibold transition-all border-2 ${
            showForm
              ? 'border-destructive/30 bg-destructive/8 text-destructive'
              : 'border-primary/30 bg-primary/8 text-primary hover:bg-primary/12'
          }`}
        >
          <Plus size={16} className={showForm ? 'rotate-45 transition-transform' : 'transition-transform'} />
          {showForm ? 'Cancelar' : 'Definir orçamento'}
        </button>

        {/* Formulário */}
        {showForm && (
          <div className="glass-card p-5 space-y-4 animate-slideUp">
            <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
              <Target size={15} className="text-primary" /> Novo orçamento
            </h3>

            <div>
              <label className="block text-xs font-bold text-muted-foreground uppercase tracking-wide mb-1.5">Categoria</label>
              <CustomSelect
                value={form.category}
                onChange={v => setForm(f => ({ ...f, category: v }))}
                options={CATS.map(c => ({ value: c.name, label: c.name, emoji: c.emoji }))}
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-muted-foreground uppercase tracking-wide mb-1.5">Limite (R$)</label>
              <div className="flex items-center gap-2 px-3 py-3 rounded-xl border border-border bg-secondary/40 focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/15 transition">
                <span className="text-muted-foreground text-sm font-bold">R$</span>
                <input
                  type="text"
                  inputMode="decimal"
                  placeholder="0,00"
                  value={form.limit}
                  onChange={e => { const v = e.target.value; if (v === '' || /^\d*[,.]?\d{0,2}$/.test(v)) setForm(f => ({ ...f, limit: v })) }}
                  className="flex-1 bg-transparent outline-none text-sm font-semibold text-foreground placeholder:text-muted-foreground"
                />
              </div>
            </div>

            <button
              type="button"
              onClick={addBudget}
              disabled={!form.limit || parseFloat(form.limit) <= 0}
              className="btn-primary w-full justify-center disabled:opacity-40"
            >
              <Plus size={16} /> Salvar orçamento
            </button>
          </div>
        )}

        {/* Lista de orçamentos */}
        {monthBudgets.length === 0 ? (
          <div className="glass-card p-10 text-center text-muted-foreground">
            <div className="text-4xl mb-3">🗓️</div>
            <p className="font-medium text-sm">Nenhum orçamento para este mês</p>
            <p className="text-xs mt-1 opacity-70">Defina limites por categoria acima</p>
          </div>
        ) : (
          <div className="space-y-3">
            {monthBudgets.map(b => {
              const spent = getSpent(b.category)
              const pct = Math.min((spent / b.limit) * 100, 100)
              const over = spent > b.limit
              return (
                <div key={b.id} className="glass-card p-4 space-y-3">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-2xl flex items-center justify-center text-lg flex-shrink-0 ${over ? 'bg-red-500/12' : 'bg-primary/10'}`}>
                      {b.emoji}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <p className="text-sm font-bold text-foreground">{b.category}</p>
                        <button
                          onClick={() => save(budgets.filter(x => x.id !== b.id))}
                          className="p-1 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition opacity-0 group-hover:opacity-100"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                      <p className={`text-xs mt-0.5 font-medium ${over ? 'text-red-500' : 'text-muted-foreground'}`}>
                        {fmt(spent)} de {fmt(b.limit)} {over && '— Acima do limite!'}
                      </p>
                    </div>
                    <button
                      onClick={() => save(budgets.filter(x => x.id !== b.id))}
                      className="p-1.5 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>

                  <div className="space-y-1">
                    <div className="h-2 bg-secondary rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${over ? 'bg-red-500' : pct > 80 ? 'bg-amber-400' : 'bg-gradient-to-r from-primary to-cyan-400'}`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                    <p className="text-[11px] text-muted-foreground text-right">{Math.round(pct)}% utilizado</p>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </PageShell>
  )
}
