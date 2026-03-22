'use client'

import { useState, useMemo } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Trash2, TrendingUp, TrendingDown, Search } from 'lucide-react'

interface Props { initialData: any[] }

const STATUS_STYLE: Record<string, string> = {
  pago:     'bg-emerald-500/12 text-emerald-600 dark:text-emerald-400',
  pendente: 'bg-amber-500/12 text-amber-600 dark:text-amber-400',
  agendado: 'bg-blue-500/12 text-blue-600 dark:text-blue-400',
}

const fmt = (v: number) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })

export default function TransactionsTableClient({ initialData }: Props) {
  const [data, setData] = useState(initialData)
  const [search, setSearch] = useState('')
  const [filterType, setFilterType] = useState('todos')
  const [filterMonth, setFilterMonth] = useState('')
  const [deleting, setDeleting] = useState<string | null>(null)

  const filtered = useMemo(() => data.filter(t => {
    const q = search.toLowerCase()
    const matchSearch = !q || t.description?.toLowerCase().includes(q) || t.category?.toLowerCase().includes(q)
    const matchType = filterType === 'todos' || t.type === filterType
    const matchMonth = !filterMonth || t.date.startsWith(filterMonth)
    return matchSearch && matchType && matchMonth
  }), [data, search, filterType, filterMonth])

  const totalReceita = filtered.filter(t=>t.type==='receita').reduce((s,t)=>s+Number(t.amount),0)
  const totalDespesa = filtered.filter(t=>t.type==='despesa').reduce((s,t)=>s+Number(t.amount),0)

  async function handleDelete(id: string) {
    setDeleting(id)
    const supabase = createClient()
    await supabase.from('transactions').delete().eq('id', id)
    setData(d => d.filter(x => x.id !== id))
    setDeleting(null)
  }

  return (
    <div className="space-y-4">
      {/* Filtros */}
      <div className="glass-card p-4 space-y-3">
        <div className="relative">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar por descrição ou categoria..." className="input-base pl-9 text-sm" />
        </div>
        <div className="flex gap-2">
          {['todos','receita','despesa'].map(t => (
            <button key={t} onClick={() => setFilterType(t)}
              className={`text-xs px-3 py-1.5 rounded-lg font-semibold transition-all ${
                filterType === t ? 'bg-primary text-primary-foreground shadow-sm' : 'bg-secondary/50 text-muted-foreground hover:bg-secondary'
              }`}>
              {t === 'todos' ? 'Todos' : t === 'receita' ? '↑ Receitas' : '↓ Despesas'}
            </button>
          ))}
          <input type="month" value={filterMonth} onChange={e => setFilterMonth(e.target.value)} className="input-base text-xs py-1.5 flex-1 ml-1" />
        </div>
      </div>

      {/* Resumo */}
      {filtered.length > 0 && (
        <div className="grid grid-cols-3 gap-3">
          <div className="glass-card p-3 text-center">
            <p className="text-xs text-muted-foreground mb-1">Registros</p>
            <p className="text-sm font-bold text-foreground">{filtered.length}</p>
          </div>
          <div className="glass-card p-3 text-center">
            <p className="text-xs text-muted-foreground mb-1">Receitas</p>
            <p className="text-xs font-bold income-text">{fmt(totalReceita)}</p>
          </div>
          <div className="glass-card p-3 text-center">
            <p className="text-xs text-muted-foreground mb-1">Despesas</p>
            <p className="text-xs font-bold expense-text">{fmt(totalDespesa)}</p>
          </div>
        </div>
      )}

      {/* Lista */}
      <div className="glass-card divide-y divide-border/40">
        {filtered.length === 0 ? (
          <div className="text-center py-16 text-muted-foreground">
            <div className="text-4xl mb-3">📭</div>
            <p className="text-sm font-medium">Nenhuma transação encontrada</p>
          </div>
        ) : filtered.map(t => (
          <div key={t.id} className="flex items-center gap-3 px-5 py-4 hover:bg-secondary/20 transition-colors group">
            <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${t.type==='receita' ? 'bg-emerald-500/10' : 'bg-red-500/10'}`}>
              {t.type==='receita' ? <TrendingUp size={15} className="text-emerald-500" /> : <TrendingDown size={15} className="text-red-500" />}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-foreground truncate">{t.description}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{t.category} · {new Date(t.date+'T12:00:00').toLocaleDateString('pt-BR')}</p>
            </div>
            <div className="flex flex-col items-end gap-1">
              <span className={`text-sm font-bold ${t.type==='receita' ? 'income-text' : 'expense-text'}`}>
                {t.type==='receita' ? '+' : '-'}{fmt(Number(t.amount))}
              </span>
              <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${STATUS_STYLE[t.status]||''}`}>
                {t.status}
              </span>
            </div>
            <button
              onClick={() => handleDelete(t.id)}
              disabled={deleting === t.id}
              className="opacity-0 group-hover:opacity-100 p-1.5 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-all ml-1"
            >
              {deleting === t.id
                ? <span className="w-3.5 h-3.5 border-2 border-current border-t-transparent rounded-full animate-spin block" />
                : <Trash2 size={14} />}
            </button>
          </div>
        ))}
      </div>
    </div>
  )
}
