'use client'

import { useState, useRef } from 'react'
import { X, RefreshCw, AlertCircle, TrendingDown, TrendingUp } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

interface Props {
  onClose: () => void
  onAdd: (transaction: any) => void
}

const DESPESA_CATS = [
  { name: 'Alimentação', emoji: '🍽️' },
  { name: 'Moradia',     emoji: '🏠' },
  { name: 'Transporte',  emoji: '🚗' },
  { name: 'Saúde',       emoji: '💊' },
  { name: 'Educação',    emoji: '📚' },
  { name: 'Lazer',       emoji: '🎮' },
  { name: 'Vestuário',   emoji: '👕' },
  { name: 'Assinaturas', emoji: '📱' },
  { name: 'Mercado',     emoji: '🛒' },
  { name: 'Outros',      emoji: '📦' },
]

const RECEITA_CATS = [
  { name: 'Salário',       emoji: '💰' },
  { name: 'Freelance',     emoji: '💻' },
  { name: 'Investimentos', emoji: '📈' },
  { name: 'Aluguel',       emoji: '🏘️' },
  { name: 'Bônus',         emoji: '🎁' },
  { name: 'Venda',         emoji: '🛍️' },
  { name: 'Dividendos',    emoji: '📊' },
  { name: 'Outros',        emoji: '✨' },
]

export default function TransactionForm({ onClose, onAdd }: Props) {
  const [loading, setLoading]     = useState(false)
  const [error, setError]         = useState('')
  const [type, setType]           = useState<'despesa' | 'receita'>('despesa')
  const [description, setDescription] = useState('')
  const [amountRaw, setAmountRaw] = useState('')   // string livre para o usuário digitar
  const [category, setCategory]   = useState('')
  const [status, setStatus]       = useState('pendente')
  const [notes, setNotes]         = useState('')
  const [recurring, setRecurring] = useState(false)
  const [date, setDate]           = useState(new Date().toISOString().split('T')[0])
  const amountRef = useRef<HTMLInputElement>(null)

  const isDespesa  = type === 'despesa'
  const categories = isDespesa ? DESPESA_CATS : RECEITA_CATS

  // Converte string do input para número
  const amountNumber = parseFloat(amountRaw.replace(',', '.'))

  function handleTypeChange(t: 'despesa' | 'receita') {
    setType(t)
    setCategory('')   // limpa categoria ao trocar de tipo
    setError('')
  }

  // Aceita apenas dígitos e vírgula/ponto — evita NaN invisível
  function handleAmountChange(e: React.ChangeEvent<HTMLInputElement>) {
    const raw = e.target.value
    // Permite: dígitos, um ponto ou vírgula decimal
    if (raw === '' || /^\d*[,.]?\d{0,2}$/.test(raw)) {
      setAmountRaw(raw)
      setError('')
    }
  }

  async function handleSubmit() {
    if (!description.trim())                return setError('Informe uma descrição.')
    if (!amountRaw || isNaN(amountNumber) || amountNumber <= 0)
                                            return setError('Informe um valor maior que zero.')
    if (!category)                          return setError('Selecione uma categoria.')

    setLoading(true); setError('')
    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { setError('Sessão expirada.'); setLoading(false); return }

      const { data, error: err } = await supabase
        .from('transactions')
        .insert({
          description: description.trim(),
          amount:      amountNumber,
          type,
          category,
          status,
          notes:       notes || null,
          is_recurring: recurring,
          date,
          user_id: user.id,
        })
        .select()
        .single()

      if (err) { setError(err.message); setLoading(false); return }
      onAdd(data)
    } catch (e: any) {
      setError(e?.message || 'Erro inesperado.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-end md:items-center justify-center"
      style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)' }}
      onClick={onClose}
    >
      <div
        className="w-full md:max-w-md rounded-t-3xl md:rounded-2xl shadow-2xl overflow-hidden animate-slideUp"
        style={{
          background: 'rgba(30, 41, 59, 0.85)',
          backdropFilter: 'blur(32px)',
          border: '1px solid rgba(255, 255, 255, 0.12)',
          WebkitBackdropFilter: 'blur(32px)',
        }}
        onClick={e => e.stopPropagation()}
      >
        {/* Handle mobile */}
        <div className="flex justify-center pt-3 pb-1 md:hidden">
          <div className="w-10 h-1 rounded-full bg-gray-500" />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between px-6 pt-4 pb-3 border-b"
          style={{ borderColor: 'rgba(255, 255, 255, 0.08)', background: 'transparent' }}>
          <h2 className="text-lg font-bold text-white">Nova Transação</h2>
          <button
            onClick={onClose}
            className="p-2 rounded-xl hover:bg-white/10 transition text-gray-400"
          >
            <X size={18} />
          </button>
        </div>

        {/* Corpo com scroll */}
        <div
          className="px-6 pb-8 space-y-5 overflow-y-auto"
          style={{ maxHeight: 'calc(90vh - 80px)' }}
        >
          <div className="pt-4" />

          {/* ── Tipo ── */}
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => handleTypeChange('despesa')}
              className={`flex items-center justify-center gap-2 py-3.5 rounded-2xl text-sm font-bold transition-all border-2 ${
                isDespesa
                  ? 'bg-red-50 text-red-600 border-red-300 dark:bg-red-500/15 dark:text-red-400 dark:border-red-500/40'
                  : 'bg-gray-100 dark:bg-gray-800 text-gray-500 border-transparent hover:bg-gray-200 dark:hover:bg-gray-700'
              }`}
            >
              <TrendingDown size={16} />
              Despesa
            </button>
            <button
              type="button"
              onClick={() => handleTypeChange('receita')}
              className={`flex items-center justify-center gap-2 py-3.5 rounded-2xl text-sm font-bold transition-all border-2 ${
                !isDespesa
                  ? 'bg-emerald-50 text-emerald-600 border-emerald-300 dark:bg-emerald-500/15 dark:text-emerald-400 dark:border-emerald-500/40'
                  : 'bg-gray-100 dark:bg-gray-800 text-gray-500 border-transparent hover:bg-gray-200 dark:hover:bg-gray-700'
              }`}
            >
              <TrendingUp size={16} />
              Receita
            </button>
          </div>

          {/* ── Banner de contexto ── */}
          <div className={`rounded-2xl px-4 py-2.5 text-xs leading-relaxed border ${
            isDespesa
              ? 'bg-red-50 border-red-100 text-red-700 dark:bg-red-500/8 dark:border-red-500/15 dark:text-red-400'
              : 'bg-emerald-50 border-emerald-100 text-emerald-700 dark:bg-emerald-500/8 dark:border-emerald-500/15 dark:text-emerald-400'
          }`}>
            {isDespesa
              ? '↓ Saída de dinheiro — algo que você gastou ou vai gastar.'
              : '↑ Entrada de dinheiro — algo que você recebeu ou vai receber.'}
          </div>

          {/* ── Descrição ── */}
          <div>
            <label className="block text-xs font-bold text-gray-400 uppercase tracking-wide mb-1.5">
              Descrição *
            </label>
            <input
              type="text"
              placeholder={isDespesa ? 'Ex: Almoço, Netflix, Conta de luz...' : 'Ex: Salário, Freela, Dividendos...'}
              value={description}
              onChange={e => { setDescription(e.target.value); setError('') }}
              className="w-full px-4 py-3 rounded-xl text-sm outline-none transition-all text-white placeholder:text-gray-500"
              style={{
                background: 'rgba(255, 255, 255, 0.08)',
                border: '1.5px solid rgba(255, 255, 255, 0.12)',
                color: 'white',
              }}
              onFocus={e => { e.target.style.borderColor = 'rgba(45,212,191,0.4)'; e.target.style.background = 'rgba(45,212,191,0.08)' }}
              onBlur={e  => { e.target.style.borderColor = 'rgba(255, 255, 255, 0.12)'; e.target.style.background = 'rgba(255, 255, 255, 0.08)' }}
            />
          </div>

          {/* ── Valor ── */}
          <div>
            <label className="block text-xs font-bold text-gray-400 uppercase tracking-wide mb-1.5">
              Valor (R$) *
            </label>
            {/* Container clicável que foca o input ao clicar em qualquer parte */}
            <div
              className={`flex items-center gap-3 px-4 py-3 rounded-xl border-2 transition-all cursor-text ${
                isDespesa
                  ? 'bg-red-50 dark:bg-red-500/8 border-red-200 dark:border-red-500/25'
                  : 'bg-emerald-50 dark:bg-emerald-500/8 border-emerald-200 dark:border-emerald-500/25'
              }`}
              onClick={() => amountRef.current?.focus()}
            >
              {/* Sinal +/- colorido */}
              <span className={`text-2xl font-black leading-none flex-shrink-0 select-none ${
                isDespesa ? 'text-red-500' : 'text-emerald-500'
              }`}>
                {isDespesa ? '−' : '+'}
              </span>

              {/* Prefixo R$ */}
              <span className="text-base font-bold text-gray-500 flex-shrink-0 select-none">
                R$
              </span>

              {/* Input de texto simples — sem type=number para evitar bugs */}
              <input
                ref={amountRef}
                type="text"
                inputMode="decimal"   // abre teclado numérico no mobile
                placeholder="0,00"
                value={amountRaw}
                onChange={handleAmountChange}
                className="flex-1 bg-transparent outline-none text-2xl font-black placeholder:text-gray-600 min-w-0"
                style={{ color: isDespesa ? '#ef4444' : '#10b981' }}
              />
            </div>
          </div>

          {/* ── Categorias ── */}
          <div>
            <label className="block text-xs font-bold text-gray-400 uppercase tracking-wide mb-2">
              Categoria *
            </label>
            <div className="grid grid-cols-4 gap-2">
              {categories.map(c => (
                <button
                  key={c.name}
                  type="button"
                  onClick={() => { setCategory(c.name); setError('') }}
                  className={`flex flex-col items-center gap-1.5 py-2.5 px-1 rounded-xl text-[11px] font-semibold transition-all border-2 ${
                    category === c.name
                      ? isDespesa
                        ? 'bg-red-50 dark:bg-red-500/12 text-red-600 dark:text-red-400 border-red-300 dark:border-red-500/40 scale-105'
                        : 'bg-emerald-50 dark:bg-emerald-500/12 text-emerald-600 dark:text-emerald-400 border-emerald-300 dark:border-emerald-500/40 scale-105'
                      : 'bg-gray-100 dark:bg-gray-800/60 text-gray-500 dark:text-gray-400 border-transparent hover:bg-gray-200 dark:hover:bg-gray-700'
                  }`}
                >
                  <span className="text-lg leading-none">{c.emoji}</span>
                  <span className="leading-tight text-center line-clamp-1">{c.name}</span>
                </button>
              ))}
            </div>
          </div>

          {/* ── Status + Data ── */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-gray-400 uppercase tracking-wide mb-1.5">
                Status
              </label>
              <select
                value={status}
                onChange={e => setStatus(e.target.value)}
                className="w-full px-3 py-3 rounded-xl text-sm outline-none border transition-all text-white"
                style={{ background: 'rgba(255, 255, 255, 0.08)', borderColor: 'rgba(255, 255, 255, 0.12)', color: 'white' }}
              >
                <option value="pendente">⏳ Pendente</option>
                <option value="pago">✅ {isDespesa ? 'Pago' : 'Recebido'}</option>
                <option value="agendado">📅 Agendado</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-400 uppercase tracking-wide mb-1.5">
                Data
              </label>
              <input
                type="date"
                value={date}
                onChange={e => setDate(e.target.value)}
                className="w-full px-3 py-3 rounded-xl text-sm outline-none border transition-all text-white"
                style={{ background: 'rgba(255, 255, 255, 0.08)', borderColor: 'rgba(255, 255, 255, 0.12)', color: 'white' }}
              />
            </div>
          </div>

          {/* ── Notas ── */}
          <div>
            <label className="block text-xs font-bold text-gray-400 uppercase tracking-wide mb-1.5">
              Notas (opcional)
            </label>
            <textarea
              placeholder="Detalhes adicionais..."
              value={notes}
              onChange={e => setNotes(e.target.value)}
              rows={2}
              className="w-full px-4 py-3 rounded-xl text-sm outline-none border transition-all resize-none text-white placeholder:text-gray-500"
              style={{ background: 'rgba(255, 255, 255, 0.08)', borderColor: 'rgba(255, 255, 255, 0.12)', color: 'white' }}
            />
          </div>

          {/* ── Recorrente ── */}
          <div
            className="flex items-center justify-between p-4 rounded-2xl cursor-pointer hover:bg-opacity-80 transition"
            style={{ background: 'rgba(255, 255, 255, 0.08)' }}
            onClick={() => setRecurring(r => !r)}
          >
            <div className="flex items-center gap-2.5">
              <RefreshCw size={15} className="text-gray-400" />
              <div>
                <p className="text-sm font-semibold text-white">Transação recorrente</p>
                <p className="text-xs text-gray-400">Repete todo mês</p>
              </div>
            </div>
            <div className={`relative w-11 h-6 rounded-full transition-colors flex-shrink-0 ${recurring ? 'bg-primary' : 'bg-gray-600'}`}>
              <div className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${recurring ? 'translate-x-5' : ''}`} />
            </div>
          </div>

          {/* ── Erro ── */}
          {error && (
            <div className="flex items-start gap-2.5 bg-red-500/10 border border-red-500/30 text-red-400 text-sm px-4 py-3 rounded-xl">
              <AlertCircle size={15} className="flex-shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {/* ── Botões ── */}
          <div className="flex gap-3 pt-1 pb-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-3.5 rounded-xl text-white font-semibold text-sm hover:bg-opacity-80 transition active:scale-95"
              style={{ background: 'rgba(255, 255, 255, 0.08)' }}
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={handleSubmit}
              disabled={loading}
              className="flex-1 px-4 py-3.5 rounded-xl font-bold text-sm text-white transition active:scale-95 disabled:opacity-50"
              style={{
                background: isDespesa
                  ? 'linear-gradient(135deg, #ef4444, #f97316)'
                  : 'linear-gradient(135deg, #10b981, #06b6d4)',
                boxShadow: isDespesa
                  ? '0 4px 14px rgba(239,68,68,0.5)'
                  : '0 4px 14px rgba(16,185,129,0.5)',
              }}
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Salvando...
                </span>
              ) : isDespesa ? '💸 Registrar Despesa' : '💰 Registrar Receita'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
