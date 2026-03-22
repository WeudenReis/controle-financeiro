'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { BarChart2, TrendingUp, TrendingDown, DollarSign, Loader2 } from 'lucide-react'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, LineChart, Line, CartesianGrid } from 'recharts'
import PageShell from '@/components/layout/page-shell'

const fmt = (v: number) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
const MONTHS = ['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez']

export default function ReportsPage() {
  const [txs, setTxs] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => { load() }, [])

  async function load() {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { setLoading(false); return }
    const { data } = await supabase.from('transactions').select('*').eq('user_id', user.id).order('date', { ascending: true })
    setTxs(data || [])
    setLoading(false)
  }

  // Agrupa por mês
  const monthly = txs.reduce((acc: Record<string, { receita: number; despesa: number; saldo: number }>, t) => {
    const d = new Date(t.date + 'T12:00:00')
    const key = `${MONTHS[d.getMonth()]}/${String(d.getFullYear()).slice(2)}`
    if (!acc[key]) acc[key] = { receita: 0, despesa: 0, saldo: 0 }
    if (t.type === 'receita') acc[key].receita += Number(t.amount)
    else acc[key].despesa += Number(t.amount)
    acc[key].saldo = acc[key].receita - acc[key].despesa
    return acc
  }, {})

  const monthlyData = Object.entries(monthly).slice(-6).map(([name, v]) => ({ name, ...v }))

  // Totais gerais
  const totalReceita = txs.filter(t => t.type === 'receita').reduce((s, t) => s + Number(t.amount), 0)
  const totalDespesa = txs.filter(t => t.type === 'despesa').reduce((s, t) => s + Number(t.amount), 0)
  const saldo = totalReceita - totalDespesa

  // Top categorias de despesa
  const topCats = Object.entries(
    txs.filter(t => t.type === 'despesa').reduce((acc: Record<string, number>, t) => {
      acc[t.category] = (acc[t.category] || 0) + Number(t.amount); return acc
    }, {})
  ).sort((a, b) => b[1] - a[1]).slice(0, 5)

  const maxCat = topCats[0]?.[1] || 1

  if (loading) return (
    <PageShell title="Relatórios" icon={<BarChart2 size={20} className="text-primary" />}>
      <div className="flex justify-center py-20"><Loader2 className="animate-spin text-primary" size={28} /></div>
    </PageShell>
  )

  return (
    <PageShell title="Relatórios" icon={<BarChart2 size={20} className="text-primary" />}>
      <div className="space-y-5 pb-24 md:pb-6">
        {/* Cards resumo */}
        <div className="grid grid-cols-3 gap-3">
          {[
            { label: 'Receitas', value: fmt(totalReceita), icon: TrendingUp,   color: 'text-emerald-500', bg: 'bg-emerald-500/10' },
            { label: 'Despesas', value: fmt(totalDespesa), icon: TrendingDown, color: 'text-red-500',     bg: 'bg-red-500/10' },
            { label: 'Saldo',    value: fmt(saldo),        icon: DollarSign,   color: saldo >= 0 ? 'text-primary' : 'text-destructive', bg: saldo >= 0 ? 'bg-primary/10' : 'bg-destructive/10' },
          ].map(c => (
            <div key={c.label} className="glass-card p-4 space-y-2">
              <div className={`w-8 h-8 rounded-xl ${c.bg} flex items-center justify-center`}>
                <c.icon size={15} className={c.color} />
              </div>
              <p className="text-xs text-muted-foreground font-medium">{c.label}</p>
              <p className={`text-xs font-bold leading-tight ${c.color}`}>{c.value}</p>
            </div>
          ))}
        </div>

        {/* Gráfico mensal */}
        {monthlyData.length > 0 && (
          <div className="glass-card p-5">
            <h3 className="text-sm font-bold text-foreground mb-4">Receitas vs Despesas (6 meses)</h3>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={monthlyData} barSize={16} barGap={4}>
                <XAxis dataKey="name" tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} axisLine={false} tickLine={false} width={50} tickFormatter={v => `R$${(v/1000).toFixed(0)}k`} />
                <Tooltip
                  contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: 12, fontSize: 12 }}
                  formatter={(v: any) => [fmt(v)]}
                />
                <Bar dataKey="receita" fill="#10b981" radius={[6,6,0,0]} name="Receita" />
                <Bar dataKey="despesa" fill="#ef4444" radius={[6,6,0,0]} name="Despesa" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Saldo mensal */}
        {monthlyData.length > 0 && (
          <div className="glass-card p-5">
            <h3 className="text-sm font-bold text-foreground mb-4">Evolução do saldo</h3>
            <ResponsiveContainer width="100%" height={160}>
              <LineChart data={monthlyData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="name" tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} axisLine={false} tickLine={false} width={50} tickFormatter={v => `R$${(v/1000).toFixed(0)}k`} />
                <Tooltip contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: 12, fontSize: 12 }} formatter={(v: any) => [fmt(v)]} />
                <Line type="monotone" dataKey="saldo" stroke="hsl(var(--primary))" strokeWidth={2.5} dot={{ fill: 'hsl(var(--primary))', r: 4 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Top categorias */}
        {topCats.length > 0 && (
          <div className="glass-card p-5 space-y-3">
            <h3 className="text-sm font-bold text-foreground">Top categorias de despesa</h3>
            {topCats.map(([cat, val]) => (
              <div key={cat}>
                <div className="flex justify-between text-sm mb-1">
                  <span className="font-medium text-foreground">{cat}</span>
                  <span className="expense-text font-bold">{fmt(val)}</span>
                </div>
                <div className="w-full h-2 bg-secondary rounded-full overflow-hidden">
                  <div className="h-full bg-gradient-to-r from-red-500 to-orange-400 rounded-full transition-all" style={{ width: `${(val/maxCat)*100}%` }} />
                </div>
              </div>
            ))}
          </div>
        )}

        {txs.length === 0 && (
          <div className="glass-card p-12 text-center text-muted-foreground">
            <BarChart2 size={32} className="mx-auto mb-3 opacity-30" />
            <p className="font-medium">Nenhuma transação ainda</p>
            <p className="text-xs mt-1">Adicione transações para ver seus relatórios</p>
          </div>
        )}
      </div>
    </PageShell>
  )
}
