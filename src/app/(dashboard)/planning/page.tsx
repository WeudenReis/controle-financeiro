'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Calendar, Plus, Trash2, Loader2, CheckCircle2 } from 'lucide-react'
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
  { name: 'Vestuário', emoji: '👕' }, { name: 'Outros', emoji: '📦' },
]

export default function PlanningPage() {
  const [txs, setTxs] = useState<any[]>([])
  const [budgets, setBudgets] = useState<Budget[]>([])
  const [form, setForm] = useState({ category: 'Alimentação', limit: '', month: new Date().toISOString().slice(0,7) })
  const [showForm, setShowForm] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    load()
    const saved = localStorage.getItem('finance_budgets')
    if (saved) setBudgets(JSON.parse(saved))
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
    if (!form.limit) return
    const cat = CATS.find(c => c.name === form.category)
    const b: Budget = {
      id: Date.now().toString(),
      category: form.category,
      limit: parseFloat(form.limit),
      month: form.month,
      emoji: cat?.emoji || '📦',
    }
    save([...budgets.filter(x => !(x.category === b.category && x.month === b.month)), b])
    setShowForm(false)
    setForm(f => ({ ...f, limit: '' }))
  }

  const currentMonth = form.month
  const monthBudgets = budgets.filter(b => b.month === currentMonth)

  function getSpent(category: string) {
    return txs.filter(t => t.type === 'despesa' && t.category === category && t.date.startsWith(currentMonth))
      .reduce((s, t) => s + Number(t.amount), 0)
  }

  const totalBudget = monthBudgets.reduce((s, b) => s + b.limit, 0)
  const totalSpent = monthBudgets.reduce((s, b) => s + getSpent(b.category), 0)

  return (
    <PageShell title="Planejamento" icon={<Calendar size={20} className="text-primary" />}>
      <div className="space-y-4 pb-24 md:pb-6">
        {/* Seletor de mês */}
        <div className="glass-card p-4 flex items-center gap-3">
          <Calendar size={16} className="text-primary flex-shrink-0" />
          <div className="flex-1">
            <p className="text-xs text-muted-foreground mb-1">Mês de referência</p>
            <input type="month" value={currentMonth} onChange={e => setForm(f => ({...f, month: e.target.value}))} className="input-base py-2 text-sm" />
          </div>
        </div>

        {/* Resumo do mês */}
        {monthBudgets.length > 0 && (
          <div className="glass-card p-5 space-y-3">
            <h3 className="section-title">Resumo do mês</h3>
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-primary/8 rounded-xl p-3 text-center">
                <p className="text-xs text-muted-foreground mb-1">Orçamento total</p>
                <p className="text-sm font-bold text-primary">{fmt(totalBudget)}</p>
              </div>
              <div className={`rounded-xl p-3 text-center ${totalSpent > totalBudget ? 'bg-destructive/8' : 'bg-emerald-500/8'}`}>
                <p className="text-xs text-muted-foreground mb-1">Gasto até agora</p>
                <p className={`text-sm font-bold ${totalSpent > totalBudget ? 'expense-text' : 'income-text'}`}>{fmt(totalSpent)}</p>
              </div>
            </div>
          </div>
        )}

        {/* Botão add */}
        <button onClick={() => setShowForm(!showForm)} className="btn-primary w-full">
          <Plus size={16} /> {showForm ? 'Cancelar' : 'Novo Orçamento'}
        </button>

        {/* Formulário */}
        {showForm && (
          <div className="glass-card p-5 space-y-3 animate-slideDown">
            <h3 className="section-title">Definir orçamento</h3>
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Categoria</label>
              <select value={form.category} onChange={e => setForm(f=>({...f, category: e.target.value}))} className="input-base">
                {CATS.map(c => <option key={c.name} value={c.name}>{c.emoji} {c.name}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Limite (R$)</label>
              <input type="number" placeholder="0,00" min="0" value={form.limit} onChange={e => setForm(f=>({...f, limit: e.target.value}))} className="input-base" />
            </div>
            <button onClick={addBudget} className="btn-primary w-full"><Plus size={16} /> Salvar orçamento</button>
          </div>
        )}

        {/* Lista de orçamentos */}
        {loading ? (
          <div className="flex justify-center py-10"><Loader2 className="animate-spin text-primary" /></div>
        ) : monthBudgets.length === 0 ? (
          <div className="glass-card p-12 text-center text-muted-foreground">
            <div className="text-4xl mb-3">📅</div>
            <p className="font-medium">Nenhum orçamento para este mês</p>
            <p className="text-xs mt-1">Defina limites por categoria</p>
          </div>
        ) : (
          <div className="space-y-3">
            {monthBudgets.map(b => {
              const spent = getSpent(b.category)
              const pct = Math.min(Math.round((spent / b.limit) * 100), 100)
              const over = spent > b.limit
              return (
                <div key={b.id} className={`glass-card p-5 space-y-3 ${over ? 'ring-2 ring-destructive/30' : ''}`}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <span className="text-xl">{b.emoji}</span>
                      <div>
                        <p className="text-sm font-bold text-foreground">{b.category}</p>
                        <p className="text-xs text-muted-foreground">{fmt(spent)} de {fmt(b.limit)}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                        over ? 'bg-destructive/15 text-destructive' : pct > 80 ? 'bg-amber-500/15 text-amber-600' : 'bg-emerald-500/15 text-emerald-600'
                      }`}>{pct}%</span>
                      <button onClick={() => save(budgets.filter(x => x.id !== b.id))} className="p-1.5 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition">
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </div>
                  <div className="w-full h-2 bg-secondary rounded-full overflow-hidden">
                    <div className={`h-full rounded-full transition-all duration-700 ${over ? 'bg-destructive' : pct > 80 ? 'bg-amber-500' : 'bg-gradient-to-r from-primary to-cyan-400'}`} style={{ width: `${pct}%` }} />
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
