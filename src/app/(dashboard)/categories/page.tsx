'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Tag, Plus, Trash2, Loader2, Smile } from 'lucide-react'
import PageShell from '@/components/layout/page-shell'

const DEFAULT_CATS = [
  { name: 'Alimentação', type: 'despesa', emoji: '🍽️' },
  { name: 'Moradia',     type: 'despesa', emoji: '🏠' },
  { name: 'Transporte',  type: 'despesa', emoji: '🚗' },
  { name: 'Saúde',       type: 'despesa', emoji: '💊' },
  { name: 'Educação',    type: 'despesa', emoji: '📚' },
  { name: 'Lazer',       type: 'despesa', emoji: '🎮' },
  { name: 'Vestuário',   type: 'despesa', emoji: '👕' },
  { name: 'Assinaturas', type: 'despesa', emoji: '📱' },
  { name: 'Mercado',     type: 'despesa', emoji: '🛒' },
  { name: 'Outros',      type: 'despesa', emoji: '📦' },
  { name: 'Salário',     type: 'receita', emoji: '💰' },
  { name: 'Freelance',   type: 'receita', emoji: '💻' },
  { name: 'Investimentos', type: 'receita', emoji: '📈' },
  { name: 'Aluguel',     type: 'receita', emoji: '🏘️' },
  { name: 'Bônus',       type: 'receita', emoji: '🎁' },
  { name: 'Venda',       type: 'receita', emoji: '🛍️' },
  { name: 'Dividendos',  type: 'receita', emoji: '📊' },
  { name: 'Outros',      type: 'receita', emoji: '✨' },
]

const EMOJI_OPTIONS = [
  '🍽️','🏠','🚗','💊','📚','🎮','👕','📱','🛒','📦',
  '💰','💻','📈','🏘️','🎁','🛍️','📊','✨','🎯','💡',
  '🎵','✈️','🚌','⚽','🎨','🐶','🌱','☕','🎂','💎',
  '🔧','📷','🏋️','🌊','🎪','🎭','🧴','💄','👟','🏆',
]

export default function CategoriesPage() {
  const [transactions, setTransactions] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState<'despesa' | 'receita'>('despesa')
  const [customCats, setCustomCats] = useState<{ name: string; type: string; emoji: string }[]>([])

  // Form nova categoria
  const [newName, setNewName] = useState('')
  const [newType, setNewType] = useState('despesa')
  const [newEmoji, setNewEmoji] = useState('💸')
  const [showPicker, setShowPicker] = useState(false)

  useEffect(() => {
    loadData()
    try {
      const saved = localStorage.getItem('custom_categories')
      if (saved) setCustomCats(JSON.parse(saved))
    } catch {}
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
    if (!newName.trim()) return
    const cat = { name: newName.trim(), type: newType, emoji: newEmoji }
    const updated = [...customCats, cat]
    setCustomCats(updated)
    localStorage.setItem('custom_categories', JSON.stringify(updated))
    setNewName('')
    setNewEmoji(newType === 'receita' ? '💵' : '💸')
    setShowPicker(false)
  }

  function removeCategory(name: string) {
    const updated = customCats.filter(c => c.name !== name)
    setCustomCats(updated)
    localStorage.setItem('custom_categories', JSON.stringify(updated))
  }

  const allCats = [...DEFAULT_CATS, ...customCats]
  const filtered = allCats.filter(c => c.type === tab)

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

        {/* Lista */}
        <div className="glass-card divide-y divide-border/50">
          {loading ? (
            <div className="flex justify-center py-10"><Loader2 className="animate-spin text-primary" /></div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-10 text-muted-foreground text-sm">Nenhuma categoria</div>
          ) : filtered.map(cat => (
            <div key={cat.name + cat.type} className="flex items-center gap-3 px-5 py-4 group">
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
              {customCats.find(c => c.name === cat.name && c.type === cat.type) && (
                <button onClick={() => removeCategory(cat.name)}
                  className="opacity-0 group-hover:opacity-100 p-1.5 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-all ml-1">
                  <Trash2 size={14} />
                </button>
              )}
            </div>
          ))}
        </div>

        {/* Formulário nova categoria */}
        <div className="glass-card p-5 space-y-4">
          <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
            <Plus size={16} className="text-primary" /> Nova categoria
          </h3>

          {/* Emoji picker */}
          <div>
            <label className="block text-xs font-bold text-muted-foreground uppercase tracking-wide mb-2">Emoji</label>
            <button
              type="button"
              onClick={() => setShowPicker(v => !v)}
              className="flex items-center gap-2 px-3 py-2.5 rounded-xl border border-border bg-secondary/40 hover:bg-secondary/70 transition text-sm"
            >
              <span className="text-xl">{newEmoji}</span>
              <Smile size={14} className="text-muted-foreground" />
              <span className="text-muted-foreground text-xs">Escolher</span>
            </button>

            {showPicker && (
              <div className="mt-2 p-3 rounded-xl border border-border bg-secondary/30 grid grid-cols-10 gap-1.5">
                {EMOJI_OPTIONS.map(e => (
                  <button
                    key={e}
                    type="button"
                    onClick={() => { setNewEmoji(e); setShowPicker(false) }}
                    className={`text-xl p-1.5 rounded-lg hover:bg-primary/20 transition active:scale-90 ${newEmoji === e ? 'bg-primary/20 ring-1 ring-primary' : ''}`}
                  >
                    {e}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Nome */}
          <div>
            <label className="block text-xs font-bold text-muted-foreground uppercase tracking-wide mb-1.5">
              Nome *
            </label>
            <input
              type="text"
              placeholder="Ex: Academia, Pet, Viagens..."
              value={newName}
              onChange={e => setNewName(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && addCategory()}
              className="input-base w-full"
              autoComplete="off"
            />
          </div>

          {/* Tipo */}
          <div>
            <label className="block text-xs font-bold text-muted-foreground uppercase tracking-wide mb-1.5">
              Tipo
            </label>
            <div className="grid grid-cols-2 gap-2">
              {(['despesa', 'receita'] as const).map(t => (
                <button
                  key={t}
                  type="button"
                  onClick={() => {
                    setNewType(t)
                    setNewEmoji(t === 'receita' ? '💵' : '💸')
                  }}
                  className={`py-2.5 rounded-xl text-sm font-semibold border-2 transition-all ${
                    newType === t
                      ? t === 'despesa'
                        ? 'bg-red-500/10 text-red-600 dark:text-red-400 border-red-400/50'
                        : 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-400/50'
                      : 'border-transparent bg-secondary/50 text-muted-foreground hover:bg-secondary'
                  }`}
                >
                  {t === 'despesa' ? '↓ Despesa' : '↑ Receita'}
                </button>
              ))}
            </div>
          </div>

          <button
            type="button"
            onClick={addCategory}
            disabled={!newName.trim()}
            className="btn-primary w-full justify-center disabled:opacity-40"
          >
            <Plus size={16} /> Adicionar categoria
          </button>
        </div>
      </div>
    </PageShell>
  )
}
