'use client'

import { useState, useEffect, useRef } from 'react'
import { Trash2, StickyNote, Search, Filter, TrendingUp, TrendingDown } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

interface Props {
  transactions: any[]
  onUpdate: (transactions: any[]) => void
}

const STATUS_STYLE: Record<string, string> = {
  pago:      'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400',
  pendente:  'bg-amber-500/15 text-amber-600 dark:text-amber-400',
  agendado:  'bg-blue-500/15 text-blue-600 dark:text-blue-400',
}

const STATUS_LABEL: Record<string, string> = {
  pago: 'Pago', pendente: 'Pendente', agendado: 'Agendado'
}

export default function TransactionList({ transactions, onUpdate }: Props) {
  const [search, setSearch] = useState('')
  const [filterStatus, setFilterStatus] = useState('todos')
  const [filterType, setFilterType] = useState('todos')
  const [deleting, setDeleting] = useState<string | null>(null)

  const filtered = transactions.filter(t => {
    const q = search.toLowerCase()
    const matchSearch = !q || t.description?.toLowerCase().includes(q) || t.category?.toLowerCase().includes(q)
    const matchStatus = filterStatus === 'todos' || t.status === filterStatus
    const matchType = filterType === 'todos' || t.type === filterType
    return matchSearch && matchStatus && matchType
  })

  async function handleDelete(id: string) {
    setDeleting(id)
    const supabase = createClient()
    const { error } = await supabase.from('transactions').delete().eq('id', id)
    if (!error) onUpdate(transactions.filter(t => t.id !== id))
    setDeleting(null)
  }

  return (
    <section className="glass-card p-0 overflow-hidden">
      {/* Header */}
      <div className="px-5 pt-5 pb-3 border-b border-border">
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-bold text-foreground text-base flex items-center gap-2">
            <Filter size={16} className="text-primary" />
            Transações
          </h2>
          <span className="text-xs text-muted-foreground bg-secondary/50 px-2.5 py-1 rounded-full">
            {filtered.length}
          </span>
        </div>

        {/* Busca */}
        <div className="relative mb-3">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            placeholder="Buscar transação..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="input-base pl-9 text-sm py-2.5"
          />
        </div>

        {/* Filtros */}
        <div className="flex gap-2">
          {[
            { label: 'Todos', value: 'todos', group: 'type' },
            { label: '↑ Receitas', value: 'receita', group: 'type' },
            { label: '↓ Despesas', value: 'despesa', group: 'type' },
          ].map(f => (
            <button
              key={f.value}
              onClick={() => setFilterType(f.value)}
              className={`text-xs px-3 py-1.5 rounded-lg font-medium transition-all ${
                filterType === f.value
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-secondary/50 text-muted-foreground hover:bg-secondary'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Lista */}
      <div className="divide-y divide-border">
        {filtered.length === 0 ? (
          <div className="text-center py-16 text-muted-foreground">
            <div className="text-4xl mb-3">📭</div>
            <p className="text-sm font-medium">Nenhuma transação encontrada</p>
          </div>
        ) : (
          filtered.map(t => (
            <div
              key={t.id}
              className="flex items-center gap-3 px-5 py-4 hover:bg-secondary/30 transition-colors group"
            >
              {/* Ícone tipo */}
              <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${
                t.type === 'receita' ? 'bg-emerald-500/10' : 'bg-red-500/10'
              }`}>
                {t.type === 'receita'
                  ? <TrendingUp size={16} className="text-emerald-500" />
                  : <TrendingDown size={16} className="text-red-500" />
                }
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-foreground truncate">{t.description}</p>
                <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                  <span className="text-xs text-muted-foreground">{t.category}</span>
                  <span className="text-muted-foreground/40 text-xs">•</span>
                  <span className="text-xs text-muted-foreground">
                    {new Date(t.date + 'T12:00:00').toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })}
                  </span>
                  {t.is_recurring && (
                    <span className="text-xs text-primary font-medium">↻</span>
                  )}
                  {t.notes && <StickyNote size={10} className="text-muted-foreground/60" />}
                </div>
              </div>

              {/* Valor e status */}
              <div className="flex flex-col items-end gap-1">
                <span className={`text-sm font-bold tabular-nums ${
                  t.type === 'receita' ? 'income-text' : 'expense-text'
                }`}>
                  {t.type === 'receita' ? '+' : '-'} R$ {Number(t.amount).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </span>
                <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${STATUS_STYLE[t.status] || ''}`}>
                  {STATUS_LABEL[t.status] || t.status}
                </span>
              </div>

              {/* Deletar */}
              <button
                onClick={() => handleDelete(t.id)}
                disabled={deleting === t.id}
                className="opacity-0 group-hover:opacity-100 p-1.5 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-all ml-1 disabled:opacity-50"
              >
                {deleting === t.id
                  ? <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin block" />
                  : <Trash2 size={14} />
                }
              </button>
            </div>
          ))
        )}
      </div>
    </section>
  )
}
