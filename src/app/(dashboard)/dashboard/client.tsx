'use client'

import { useState } from 'react'
import { TrendingUp, TrendingDown, DollarSign, Plus, FileText } from 'lucide-react'
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts'
import TransactionForm from './transaction-form'
import TransactionList from './transaction-list'
import { generatePDF } from '@/lib/pdf'

interface Props {
  transactions: any[]
  profile: any
  user: any
}

export default function DashboardClient({ transactions, profile, user }: Props) {
  const [showForm, setShowForm] = useState(false)
  const [localTransactions, setLocalTransactions] = useState(transactions)

  const salary = profile?.salary || 0
  const totalReceitas = localTransactions
    .filter(t => t.type === 'receita')
    .reduce((acc, t) => acc + Number(t.amount), 0)
  const totalDespesas = localTransactions
    .filter(t => t.type === 'despesa')
    .reduce((acc, t) => acc + Number(t.amount), 0)
  const saldo = totalReceitas - totalDespesas
  const percentualComprometido = totalReceitas > 0
    ? Math.round((totalDespesas / totalReceitas) * 100)
    : 0

  const chartData = localTransactions
    .slice(0, 7)
    .reverse()
    .map(t => ({
      date: new Date(t.date).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }),
      valor: Number(t.amount),
    }))

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Dashboard</h1>
          <p className="text-zinc-400 text-sm mt-1">Bem-vindo, {profile?.name || user.email}</p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => generatePDF(localTransactions, profile)}
            className="flex items-center gap-2 bg-zinc-800 hover:bg-zinc-700 text-white text-sm px-4 py-2 rounded-xl transition-all"
          >
            <FileText size={16} />
            Exportar PDF
          </button>
          <button
            onClick={() => setShowForm(true)}
            className="flex items-center gap-2 bg-white hover:bg-zinc-100 text-black text-sm font-medium px-4 py-2 rounded-xl transition-all"
          >
            <Plus size={16} />
            Nova transação
          </button>
        </div>
      </div>

      {/* Métricas */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-zinc-400 text-sm">Saldo</span>
            <DollarSign size={16} className="text-zinc-500" />
          </div>
          <p className={`text-2xl font-bold ${saldo >= 0 ? 'text-white' : 'text-red-400'}`}>
            R$ {saldo.toFixed(2)}
          </p>
        </div>

        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-zinc-400 text-sm">Receitas</span>
            <TrendingUp size={16} className="text-emerald-500" />
          </div>
          <p className="text-2xl font-bold text-emerald-400">R$ {totalReceitas.toFixed(2)}</p>
        </div>

        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-zinc-400 text-sm">Despesas</span>
            <TrendingDown size={16} className="text-red-500" />
          </div>
          <p className="text-2xl font-bold text-red-400">R$ {totalDespesas.toFixed(2)}</p>
        </div>

        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-zinc-400 text-sm">Comprometido</span>
            <span className="text-xs text-zinc-500">{percentualComprometido}%</span>
          </div>
          <div className="w-full bg-zinc-800 rounded-full h-2 mt-2">
            <div
              className="bg-orange-400 h-2 rounded-full transition-all"
              style={{ width: `${Math.min(percentualComprometido, 100)}%` }}
            />
          </div>
          <p className="text-sm text-zinc-400">da renda comprometida</p>
        </div>
      </div>

      {/* Gráfico */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6">
        <h2 className="text-white font-semibold mb-4">Últimas transações</h2>
        <ResponsiveContainer width="100%" height={200}>
          <AreaChart data={chartData}>
            <defs>
              <linearGradient id="colorValor" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#ffffff" stopOpacity={0.1} />
                <stop offset="95%" stopColor="#ffffff" stopOpacity={0} />
              </linearGradient>
            </defs>
            <XAxis dataKey="date" stroke="#52525b" tick={{ fill: '#71717a', fontSize: 12 }} />
            <YAxis stroke="#52525b" tick={{ fill: '#71717a', fontSize: 12 }} />
            <Tooltip
              contentStyle={{ backgroundColor: '#18181b', border: '1px solid #27272a', borderRadius: '12px' }}
              labelStyle={{ color: '#a1a1aa' }}
              itemStyle={{ color: '#ffffff' }}
            />
            <Area type="monotone" dataKey="valor" stroke="#ffffff" strokeWidth={2} fill="url(#colorValor)" />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Lista */}
      <TransactionList
        transactions={localTransactions}
        onUpdate={setLocalTransactions}
      />

      {/* Modal Form */}
      {showForm && (
        <TransactionForm
          onClose={() => setShowForm(false)}
          onAdd={(t) => {
            setLocalTransactions([t, ...localTransactions])
            setShowForm(false)
          }}
        />
      )}
    </div>
  )
}