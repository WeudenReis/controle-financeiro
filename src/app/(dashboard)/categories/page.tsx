'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Tag, Plus, Trash2, TrendingUp, TrendingDown, Loader2 } from 'lucide-react'
import PageShell from '@/components/layout/page-shell'

const DEFAULT_CATS = [
  { name: 'Alimentação', type: 'despesa', emoji: '🍽️' },
  { name: 'Moradia',     type: 'despesa', emoji: '🏠' },
  { name: 'Transporte',  type: 'despesa', emoji: '🚗' },
  { name: 'Saúde',       type: 'despesa', emoji: '💊' },
  { name: 'Educação',    type: 'despesa', emoji: '📚' },
  { name: 'Lazer',       type: 'despesa', emoji: '🎮' },
  { name: 'Vestuário',   type: 'despesa', emoji: '👕' },
  { name: 'Salário',     type: 'receita', emoji: '💰' },
  { name: 'Freelance',   type: 'receita', emoji: '💻' },
  { name: 'Investimentos', type: 'receita', emoji: '📈' },
  { name: 'Outros',      type: 'despesa', emoji: '📦' },
]

export default function CategoriesPage() {
  const [transactions, setTransactions] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [newCat, setNewCat] = useState({ name: '', type: 'despesa' })
  const [customCats, setCustomCats] = useState<{ name: string; type: string; emoji: string }[]>([])
  const [tab, setTab] = useState<'despesa' | 'receita'>('despesa')

  useEffect(() => {
    loadData()
    const saved = localStorage.getItem('custom_categories')
    if (saved) setCustomCats(JSON.parse(saved))
  }, [])

  async function loadData() {
    setLoading(true)
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { setLoading(false); return }
    const { data } = await supabase.from('transactions').select('*').eq('user_id', user.id)
    setTransactions(data || [])
    setLoading(false)
  }

  function addCategory() {
    if (!newCat.name.trim()) return
    const cat = { name: newCat.name.trim(), type: newCat.type, emoji: newCat.type === 'receita' ? '💵' : '💸' }
    const updated = [...customCats, cat]
    setCustomCats(updated)
    localStorage.setItem('custom_categories', JSON.stringify(updated))
    setNewCat({ name: '', type: 'despesa' })
  }

  function removeCategory(name: string) {
    const updated = customCats.filter(c => c.name !== name)
    setCustomCats(updated)
    localStorage.setItem('custom_categories', JSON.stringify(updated))
  }

  const allCats = [...DEFAULT_CATS, ...customCats]
  const filtered = allCats.filter(c => c.type === tab)

  // Totais por categoria
  const totals = transactions.reduce((acc: Record<string, number>, t) => {
    acc[t.category] = (acc[t.category] || 0) + Number(t.amount)
    return acc
  }, {})

  const fmt = (v: number) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })

  return (
    <PageShell title="Categorias" icon={<Tag size={20} className="text-primary" />}>
      <div className="space-y-5 pb-24 md:pb-6">
        {/* Tabs */}
        <div className="glass-card p-1.5 flex gap-1.5">
          {(['despesa','receita'] as const).map(t => (
            <button key={t} onClick={() => setTab(t)}
              className={`flex-1 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                tab === t
                  ? t === 'despesa'
                    ? 'bg-red-500/15 text-red-600 dark:text-red-400 shadow-sm'
                    : 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              {t === 'despesa' ? '↓ Despesas' : '↑ Receitas'}
            </button>
          ))}
        </div>

        {/* Lista de categorias */}
        <div className="glass-card divide-y divide-border/50">
          {loading ? (
            <div className="flex justify-center py-10"><Loader2 className="animate-spin text-primary" /></div>
          ) : filtered.map(cat => (
            <div key={cat.name} className="flex items-center gap-3 px-5 py-4 group">
              <div className={`w-10 h-10 rounded-2xl flex items-center justify-center text-lg flex-shrink-0 ${
                cat.type === 'receita' ? 'bg-emerald-500/10' : 'bg-red-500/10'
              }`}>
                {cat.emoji}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-foreground">{cat.name}</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {totals[cat.name] ? `Total: ${fmt(totals[cat.name])}` : 'Sem transações'}
                </p>
              </div>
              {totals[cat.name] && (
                <span className={`text-sm font-bold ${cat.type === 'receita' ? 'income-text' : 'expense-text'}`}>
                  {fmt(totals[cat.name])}
                </span>
              )}
              {customCats.find(c => c.name === cat.name) && (
                <button onClick={() => removeCategory(cat.name)}
                  className="opacity-0 group-hover:opacity-100 p-1.5 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-all ml-1">
                  <Trash2 size={14} />
                </button>
              )}
            </div>
          ))}
        </div>

        {/* Adicionar categoria */}
        <div className="glass-card p-5 space-y-3">
          <h3 className="section-title">Nova categoria</h3>
          <div className="flex gap-2">
            <input
              type="text"
              placeholder="Nome da categoria"
              value={newCat.name}
              onChange={e => setNewCat(n => ({ ...n, name: e.target.value }))}
              onKeyDown={e => e.key === 'Enter' && addCategory()}
              className="input-base flex-1"
            />
            <select value={newCat.type} onChange={e => setNewCat(n => ({ ...n, type: e.target.value }))} className="input-base w-32">
              <option value="despesa">Despesa</option>
              <option value="receita">Receita</option>
            </select>
          </div>
          <button onClick={addCategory} className="btn-primary w-full">
            <Plus size={16} /> Adicionar
          </button>
        </div>
      </div>
    </PageShell>
  )
}
