'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Target, Plus, Trash2, CheckCircle2, Loader2 } from 'lucide-react'
import PageShell from '@/components/layout/page-shell'

interface Goal {
  id: string
  name: string
  target: number
  current: number
  deadline: string
  emoji: string
}

const fmt = (v: number) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })

export default function GoalsPage() {
  const [goals, setGoals] = useState<Goal[]>([])
  const [form, setForm] = useState({ name: '', target: '', deadline: '', emoji: '🎯' })
  const [showForm, setShowForm] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const saved = localStorage.getItem('finance_goals')
    if (saved) setGoals(JSON.parse(saved))
    setLoading(false)
  }, [])

  function save(newGoals: Goal[]) {
    setGoals(newGoals)
    localStorage.setItem('finance_goals', JSON.stringify(newGoals))
  }

  function addGoal() {
    if (!form.name.trim() || !form.target) return
    const goal: Goal = {
      id: Date.now().toString(),
      name: form.name.trim(),
      target: parseFloat(form.target),
      current: 0,
      deadline: form.deadline,
      emoji: form.emoji,
    }
    save([...goals, goal])
    setForm({ name: '', target: '', deadline: '', emoji: '🎯' })
    setShowForm(false)
  }

  function addProgress(id: string, amount: number) {
    save(goals.map(g => g.id === id ? { ...g, current: Math.min(g.current + amount, g.target) } : g))
  }

  function removeGoal(id: string) {
    save(goals.filter(g => g.id !== id))
  }

  const EMOJIS = ['🎯','🏠','🚗','✈️','💻','📱','💍','🎓','💰','🌴','🏋️','🎸']

  return (
    <PageShell title="Metas" icon={<Target size={20} className="text-primary" />}>
      <div className="space-y-4 pb-24 md:pb-6">
        {/* Botão add */}
        <button onClick={() => setShowForm(!showForm)} className="btn-primary w-full">
          <Plus size={16} /> {showForm ? 'Cancelar' : 'Nova Meta'}
        </button>

        {/* Formulário */}
        {showForm && (
          <div className="glass-card p-5 space-y-3 animate-slideDown">
            <h3 className="section-title">Criar nova meta</h3>

            {/* Emojis */}
            <div className="flex flex-wrap gap-2">
              {EMOJIS.map(e => (
                <button key={e} onClick={() => setForm(f => ({...f, emoji: e}))}
                  className={`w-9 h-9 rounded-xl text-lg transition-all ${form.emoji === e ? 'bg-primary/20 ring-2 ring-primary scale-110' : 'bg-secondary/50 hover:bg-secondary'}`}>
                  {e}
                </button>
              ))}
            </div>

            <input type="text" placeholder="Nome da meta (ex: Viagem à Europa)" value={form.name} onChange={e => setForm(f=>({...f, name: e.target.value}))} className="input-base" />
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">Valor alvo (R$)</label>
                <input type="number" placeholder="0,00" min="0" value={form.target} onChange={e => setForm(f=>({...f, target: e.target.value}))} className="input-base" />
              </div>
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">Prazo</label>
                <input type="date" value={form.deadline} onChange={e => setForm(f=>({...f, deadline: e.target.value}))} className="input-base" />
              </div>
            </div>
            <button onClick={addGoal} className="btn-primary w-full"><Plus size={16} /> Criar meta</button>
          </div>
        )}

        {/* Lista de metas */}
        {loading ? (
          <div className="flex justify-center py-10"><Loader2 className="animate-spin text-primary" /></div>
        ) : goals.length === 0 ? (
          <div className="glass-card p-12 text-center text-muted-foreground">
            <div className="text-4xl mb-3">🎯</div>
            <p className="font-medium">Nenhuma meta criada</p>
            <p className="text-xs mt-1">Crie sua primeira meta financeira!</p>
          </div>
        ) : (
          <div className="space-y-3">
            {goals.map(goal => {
              const pct = Math.min(Math.round((goal.current / goal.target) * 100), 100)
              const done = pct >= 100
              return (
                <div key={goal.id} className={`glass-card p-5 space-y-3 ${done ? 'ring-2 ring-primary/40' : ''}`}>
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="w-11 h-11 rounded-2xl bg-primary/10 flex items-center justify-center text-2xl flex-shrink-0">{goal.emoji}</div>
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="font-bold text-sm text-foreground">{goal.name}</p>
                          {done && <CheckCircle2 size={14} className="text-primary" />}
                        </div>
                        {goal.deadline && (
                          <p className="text-xs text-muted-foreground">
                            Prazo: {new Date(goal.deadline + 'T12:00:00').toLocaleDateString('pt-BR')}
                          </p>
                        )}
                      </div>
                    </div>
                    <button onClick={() => removeGoal(goal.id)} className="p-1.5 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-all flex-shrink-0">
                      <Trash2 size={14} />
                    </button>
                  </div>

                  {/* Barra de progresso */}
                  <div>
                    <div className="flex justify-between text-xs mb-1.5">
                      <span className="text-muted-foreground">{fmt(goal.current)} de {fmt(goal.target)}</span>
                      <span className={`font-bold ${done ? 'text-primary' : 'text-foreground'}`}>{pct}%</span>
                    </div>
                    <div className="w-full h-2.5 bg-secondary rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-700 ${done ? 'bg-gradient-to-r from-primary to-cyan-400' : 'bg-gradient-to-r from-primary/70 to-primary'}`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>

                  {/* Adicionar progresso */}
                  {!done && (
                    <div className="flex gap-2">
                      {[50, 100, 500].map(v => (
                        <button key={v} onClick={() => addProgress(goal.id, v)}
                          className="flex-1 py-1.5 text-xs rounded-lg bg-primary/10 text-primary hover:bg-primary/20 transition font-semibold">
                          +{fmt(v)}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>
    </PageShell>
  )
}
