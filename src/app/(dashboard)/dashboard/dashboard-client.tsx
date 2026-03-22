'use client'

import { useState, useRef, useEffect } from 'react'
import { TrendingUp, TrendingDown, DollarSign, Plus, FileText, LogOut, Settings, Sparkles, Send } from 'lucide-react'
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts'
import TransactionForm from './transaction-form'
import TransactionList from './transaction-list'
import { generatePDF } from '@/lib/pdf'
import { askAI, getFinancialInsights } from '@/lib/ai'
import { createClient } from '@/lib/supabase/client'

interface Props {
  transactions: any[]
  profile: any
  user: any
}

export default function DashboardClient({ transactions, profile, user }: Props) {
  const [showForm, setShowForm] = useState(false)
  const [localTransactions, setLocalTransactions] = useState(transactions)
  const [aiLoading, setAiLoading] = useState(false)
  const [aiMessage, setAiMessage] = useState('')
  const [showAI, setShowAI] = useState(false)
  const [aiChat, setAiChat] = useState<Array<{ role: string; content: string }>>([])
  const chatBoxRef = useRef<HTMLDivElement>(null)

  // Cálculos
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

  // Auto-scroll do chat
  useEffect(() => {
    if (chatBoxRef.current) {
      chatBoxRef.current.scrollTop = chatBoxRef.current.scrollHeight
    }
  }, [aiChat])

  async function handleAIMessage() {
    if (!aiMessage.trim()) return

    setAiChat(prev => [...prev, { role: 'user', content: aiMessage }])
    setAiLoading(true)

    try {
      const resposta = await askAI(aiMessage, {
        totalIncome: totalReceitas,
        totalExpenses: totalDespesas,
        balance: saldo,
        monthYear: new Date().toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })
      })

      setAiChat(prev => [...prev, { role: 'assistant', content: resposta }])
    } catch (error) {
      console.error(error)
    }

    setAiMessage('')
    setAiLoading(false)
  }

  async function handleLogout() {
    const supabase = createClient()
    await supabase.auth.signOut()
    window.location.href = '/login'
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100 dark:from-slate-950 dark:via-slate-900 dark:to-slate-800 transition-colors">
      {/* Header */}
      <header className="sticky top-0 z-40 backdrop-blur-xl bg-white/30 dark:bg-slate-900/30 border-b border-white/20 dark:border-slate-800/50">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Dashboard</h1>
            <p className="text-sm text-slate-600 dark:text-slate-400">Bem-vindo, {profile?.full_name || user.email}</p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowAI(!showAI)}
              className="p-2.5 hover:bg-white/10 dark:hover:bg-slate-800/50 rounded-xl transition text-slate-700 dark:text-slate-300"
              title="Assistente IA"
            >
              <Sparkles size={20} />
            </button>
            <button
              onClick={() => window.location.href = '/settings'}
              className="p-2.5 hover:bg-white/10 dark:hover:bg-slate-800/50 rounded-xl transition text-slate-700 dark:text-slate-300"
              title="Configurações"
            >
              <Settings size={20} />
            </button>
            <button
              onClick={handleLogout}
              className="p-2.5 hover:bg-white/10 dark:hover:bg-slate-800/50 rounded-xl transition text-slate-700 dark:text-slate-300"
              title="Sair"
            >
              <LogOut size={20} />
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-10 space-y-10">
        {/* CTA Section */}
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div></div>
          <div className="flex gap-3">
            <button
              onClick={() => generatePDF(localTransactions, profile)}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/60 dark:bg-slate-800/60 hover:bg-white/80 dark:hover:bg-slate-800 text-slate-900 dark:text-white text-sm font-medium transition-all backdrop-blur"
            >
              <FileText size={18} />
              Exportar PDF
            </button>
            <button
              onClick={() => setShowForm(true)}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white text-sm font-medium transition-all shadow-lg hover:shadow-xl"
            >
              <Plus size={18} />
              Nova transação
            </button>
          </div>
        </div>

        {/* Metrics Grid */}
        <section className="grid grid-cols-1 md:grid-cols-4 gap-5">
          {/* Saldo */}
          <div className="backdrop-blur-xl bg-white/40 dark:bg-slate-800/40 border border-white/60 dark:border-slate-700/50 rounded-2xl p-6 space-y-3 hover:bg-white/50 dark:hover:bg-slate-700/50 transition">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-slate-600 dark:text-slate-400">Saldo</span>
              <DollarSign size={18} className="text-blue-600 dark:text-blue-400" />
            </div>
            <p className={`text-3xl font-bold ${saldo >= 0 ? 'text-slate-900 dark:text-white' : 'text-red-600 dark:text-red-400'}`}>
              R$ {saldo.toFixed(2)}
            </p>
            <div className="text-xs text-slate-500 dark:text-slate-400">
              {saldo >= 0 ? '↑' : '↓'} Variação disponível
            </div>
          </div>

          {/* Receitas */}
          <div className="backdrop-blur-xl bg-white/40 dark:bg-slate-800/40 border border-white/60 dark:border-slate-700/50 rounded-2xl p-6 space-y-3 hover:bg-white/50 dark:hover:bg-slate-700/50 transition">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-slate-600 dark:text-slate-400">Receitas</span>
              <TrendingUp size={18} className="text-emerald-500" />
            </div>
            <p className="text-3xl font-bold text-emerald-600 dark:text-emerald-400">R$ {totalReceitas.toFixed(2)}</p>
            <div className="text-xs text-emerald-600/70 dark:text-emerald-400/70">Mês atual</div>
          </div>

          {/* Despesas */}
          <div className="backdrop-blur-xl bg-white/40 dark:bg-slate-800/40 border border-white/60 dark:border-slate-700/50 rounded-2xl p-6 space-y-3 hover:bg-white/50 dark:hover:bg-slate-700/50 transition">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-slate-600 dark:text-slate-400">Despesas</span>
              <TrendingDown size={18} className="text-red-500" />
            </div>
            <p className="text-3xl font-bold text-red-600 dark:text-red-400">R$ {totalDespesas.toFixed(2)}</p>
            <div className="text-xs text-red-600/70 dark:text-red-400/70">Mês atual</div>
          </div>

          {/* Comprometido */}
          <div className="backdrop-blur-xl bg-white/40 dark:bg-slate-800/40 border border-white/60 dark:border-slate-700/50 rounded-2xl p-6 space-y-3 hover:bg-white/50 dark:hover:bg-slate-700/50 transition">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-slate-600 dark:text-slate-400">Comprometido</span>
              <span className="text-xs font-bold text-orange-600 dark:text-orange-400">{percentualComprometido}%</span>
            </div>
            <div className="space-y-2">
              <div className="w-full bg-white/30 dark:bg-slate-700/30 rounded-full h-2.5">
                <div
                  className="bg-gradient-to-r from-orange-500 to-red-500 h-2.5 rounded-full transition-all"
                  style={{ width: `${Math.min(percentualComprometido, 100)}%` }}
                />
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-400">da renda já gasta</p>
            </div>
          </div>
        </section>

        {/* Chart */}
        <section className="backdrop-blur-xl bg-white/40 dark:bg-slate-800/40 border border-white/60 dark:border-slate-700/50 rounded-2xl p-8">
          <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-6">Últimas 7 transações</h2>
          <ResponsiveContainer width="100%" height={250}>
            <AreaChart data={chartData}>
              <defs>
                <linearGradient id="colorValor" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.2} />
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis dataKey="date" stroke="#cbd5e1" tick={{ fill: '#94a3b8', fontSize: 12 }} />
              <YAxis stroke="#cbd5e1" tick={{ fill: '#94a3b8', fontSize: 12 }} />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'rgba(15, 23, 42, 0.9)',
                  border: '1px solid rgba(148, 163, 184, 0.2)',
                  borderRadius: '12px'
                }}
                labelStyle={{ color: '#f1f5f9' }}
                itemStyle={{ color: '#3b82f6' }}
              />
              <Area type="monotone" dataKey="valor" stroke="#3b82f6" strokeWidth={2.5} fill="url(#colorValor)" />
            </AreaChart>
          </ResponsiveContainer>
        </section>

        {/* Transaction List */}
        <TransactionList
          transactions={localTransactions}
          onUpdate={setLocalTransactions}
        />
      </main>

      {/* AI Assistant Sidebar */}
      {showAI && (
        <div className="fixed bottom-6 right-6 w-96 h-96 backdrop-blur-xl bg-white/90 dark:bg-slate-900/90 border border-white/60 dark:border-slate-700 rounded-2xl shadow-2xl flex flex-col z-50">
          <div className="p-4 border-b border-white/20 dark:border-slate-700">
            <div className="flex items-center gap-2">
              <Sparkles size={18} className="text-blue-600" />
              <h3 className="font-semibold text-slate-900 dark:text-white">Assistente Financeiro</h3>
            </div>
          </div>

          <div
            ref={chatBoxRef}
            className="flex-1 overflow-y-auto p-4 space-y-4 bg-gradient-to-b from-white/50 to-white/20 dark:from-slate-800/50 dark:to-slate-900/20"
          >
            {aiChat.length === 0 && (
              <div className="text-center text-slate-500 dark:text-slate-400 text-sm py-8">
                <p>Olá! Sou seu assistente de IA. Faça perguntas sobre suas finanças.</p>
              </div>
            )}
            {aiChat.map((msg, idx) => (
              <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div
                  className={`max-w-xs px-4 py-2 rounded-lg text-sm ${
                    msg.role === 'user'
                      ? 'bg-blue-600 text-white'
                      : 'bg-slate-200 dark:bg-slate-700 text-slate-900 dark:text-slate-100'
                  }`}
                >
                  {msg.content}
                </div>
              </div>
            ))}
            {aiLoading && (
              <div className="flex justify-start">
                <div className="bg-slate-200 dark:bg-slate-700 px-4 py-2 rounded-lg">
                  <div className="flex gap-1">
                    <div className="w-2 h-2 bg-slate-500 rounded-full animate-bounce"></div>
                    <div className="w-2 h-2 bg-slate-500 rounded-full animate-bounce delay-100"></div>
                    <div className="w-2 h-2 bg-slate-500 rounded-full animate-bounce delay-200"></div>
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="p-4 border-t border-white/20 dark:border-slate-700">
            <div className="flex gap-2">
              <input
                type="text"
                value={aiMessage}
                onChange={e => setAiMessage(e.target.value)}
                onKeyPress={e => e.key === 'Enter' && handleAIMessage()}
                placeholder="Digite sua pergunta..."
                className="flex-1 bg-white/60 dark:bg-slate-800/60 border border-white/40 dark:border-slate-600 rounded-lg px-3 py-2 text-sm text-slate-900 dark:text-white placeholder-slate-500 dark:placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                disabled={aiLoading}
              />
              <button
                onClick={handleAIMessage}
                disabled={aiLoading || !aiMessage.trim()}
                className="p-2.5 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 rounded-lg text-white transition"
              >
                <Send size={16} />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Transaction Form Modal */}
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
