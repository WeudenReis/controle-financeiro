'use client'

import { useState } from 'react'
import { TrendingUp, TrendingDown, DollarSign, Plus, FileText, LogOut, Settings, Sparkles } from 'lucide-react'
import { AreaChart, Area, PieChart, Pie, Cell, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from 'recharts'
import TransactionForm from './transaction-form'
import TransactionList from './transaction-list'
import { generatePDF } from '@/lib/pdf'
import { createClient } from '@/lib/supabase/client'
import { ThemeToggle } from '@/components/ui/theme-toggle'
import Chatbot, { useAIChat } from '@/components/ui/chatbot'

interface Props {
  transactions: any[]
  profile: any
  user: any
}

const COLORS = ['#2dd4bf','#3b82f6','#8b5cf6','#f59e0b','#ef4444','#10b981']
const fmt = (v: number) => v.toLocaleString('pt-BR', { style:'currency', currency:'BRL' })

export default function DashboardPremium({ transactions, profile, user }: Props) {
  const [showForm, setShowForm] = useState(false)
  const [localTx, setLocalTx]  = useState(transactions)
  const { open: showAI, setOpen: setShowAI } = useAIChat()

  const totalReceitas = localTx.filter(t=>t.type==='receita').reduce((s,t)=>s+Number(t.amount),0)
  const totalDespesas = localTx.filter(t=>t.type==='despesa').reduce((s,t)=>s+Number(t.amount),0)
  const saldo = totalReceitas - totalDespesas
  const pct   = totalReceitas > 0 ? Math.min(Math.round((totalDespesas/totalReceitas)*100),100) : 0

  const aiContext = {
    totalIncome: totalReceitas,
    totalExpenses: totalDespesas,
    balance: saldo,
    transactions: localTx,
    monthYear: new Date().toLocaleDateString('pt-BR',{month:'long',year:'numeric'})
  }

  const areaData = [...localTx].slice(0,10).reverse().map(t=>({
    date: new Date(t.date+'T12:00:00').toLocaleDateString('pt-BR',{day:'2-digit',month:'2-digit'}),
    valor: Number(t.amount),
  }))

  const pieData = Object.entries(
    localTx.filter(t=>t.type==='despesa').reduce((acc:Record<string,number>,t)=>{
      acc[t.category]=(acc[t.category]||0)+Number(t.amount); return acc
    },{})
  ).map(([name,value])=>({name,value})).sort((a,b)=>b.value-a.value).slice(0,6)

  async function handleLogout(){
    const supabase=createClient(); await supabase.auth.signOut(); window.location.href='/login'
  }

  const nome = profile?.full_name?.split(' ')[0] || user?.email?.split('@')[0] || 'você'
  const hora  = new Date().getHours()
  const saudacao = hora<12 ? 'Bom dia' : hora<18 ? 'Boa tarde' : 'Boa noite'

  return (
    <div className="page-bg min-h-screen">
      {/* Orbs de fundo decorativos */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        <div className="absolute -top-40 -left-40 w-96 h-96 rounded-full bg-primary/8 blur-[100px]"/>
        <div className="absolute top-1/2 -right-40 w-80 h-80 rounded-full bg-blue-500/6 blur-[100px]"/>
        <div className="absolute -bottom-40 left-1/3 w-72 h-72 rounded-full bg-purple-500/5 blur-[100px]"/>
      </div>

      {/* ── Header ── */}
      <header className="glass-header sticky top-0 z-40">
        <div className="max-w-6xl mx-auto px-5 py-4 flex items-center justify-between">
          <div>
            <p className="text-xs text-muted-foreground">{saudacao},</p>
            <h1 className="text-xl font-bold text-foreground leading-tight">{nome} <span className="text-primary">👋</span></h1>
          </div>
          <div className="flex items-center gap-1.5">
            <ThemeToggle isCollapsed className="w-9 h-9 p-0 justify-center rounded-xl" />
            {/* Botão IA no header — abre o mesmo chat do botão flutuante */}
            <button
              onClick={()=>setShowAI(!showAI)}
              className={`w-9 h-9 flex items-center justify-center rounded-xl transition-all ${showAI?'bg-primary/20 text-primary':'hover:bg-white/50 dark:hover:bg-white/5 text-muted-foreground'}`}
              title="Assistente IA"
            >
              <Sparkles size={17}/>
            </button>
            <button onClick={()=>window.location.href='/settings'} className="w-9 h-9 flex items-center justify-center rounded-xl hover:bg-white/50 dark:hover:bg-white/5 text-muted-foreground transition">
              <Settings size={17}/>
            </button>
            <button onClick={handleLogout} className="w-9 h-9 flex items-center justify-center rounded-xl hover:bg-destructive/10 hover:text-destructive text-muted-foreground transition">
              <LogOut size={17}/>
            </button>
          </div>
        </div>
      </header>

      <main className="relative z-10 max-w-6xl mx-auto px-4 pt-5 pb-28 md:pb-10 space-y-5">

        {/* ── Cards de resumo ── */}
        <div className="grid grid-cols-3 gap-3">
          {[
            {label:'Receitas', value:fmt(totalReceitas), icon:TrendingUp,  color:'text-primary',   bg:'bg-primary/10'},
            {label:'Despesas', value:fmt(totalDespesas), icon:TrendingDown, color:'text-red-500',   bg:'bg-red-500/10'},
            {label:'Saldo',    value:fmt(saldo),         icon:DollarSign,  color:saldo>=0?'text-primary':'text-destructive', bg:saldo>=0?'bg-primary/10':'bg-destructive/10'},
          ].map(c=>(
            <div key={c.label} className="glass-card p-4 space-y-2.5">
              <div className={`w-9 h-9 rounded-2xl ${c.bg} flex items-center justify-center`}>
                <c.icon size={16} className={c.color}/>
              </div>
              <p className="text-[11px] text-muted-foreground font-semibold uppercase tracking-wide">{c.label}</p>
              <p className={`text-xs font-bold leading-tight ${c.color}`}>{c.value}</p>
            </div>
          ))}
        </div>

        {/* ── Ações rápidas ── */}
        <div className="grid grid-cols-2 gap-3">
          <button onClick={()=>generatePDF(localTx,profile)} className="btn-secondary justify-center py-3.5 rounded-2xl text-sm gap-2">
            <FileText size={16}/> Exportar PDF
          </button>
          <button onClick={()=>setShowForm(true)} className="btn-primary justify-center py-3.5 rounded-2xl text-sm gap-2 animate-pulseGlow">
            <Plus size={16}/> Nova transação
          </button>
        </div>

        {/* ── Gráficos ── */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Área */}
          <div className="glass-card p-5">
            <h3 className="text-sm font-bold text-foreground mb-4">Últimas movimentações</h3>
            {areaData.length > 0 ? (
              <ResponsiveContainer width="100%" height={180}>
                <AreaChart data={areaData}>
                  <defs>
                    <linearGradient id="gArea" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%"  stopColor="hsl(var(--primary))" stopOpacity={0.35}/>
                      <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="date" tick={{fontSize:10}} axisLine={false} tickLine={false}/>
                  <YAxis tick={{fontSize:10}} axisLine={false} tickLine={false} width={50}
                    tickFormatter={v=>v.toLocaleString('pt-BR',{notation:'compact'})}/>
                  <Tooltip formatter={(v:any)=>fmt(v)} contentStyle={{fontSize:11,borderRadius:8}}/>
                  <Area type="monotone" dataKey="valor" stroke="hsl(var(--primary))" fill="url(#gArea)" strokeWidth={2}/>
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[180px] flex items-center justify-center text-muted-foreground text-xs">
                Sem dados ainda
              </div>
            )}
          </div>

          {/* Pizza */}
          <div className="glass-card p-5">
            <h3 className="text-sm font-bold text-foreground mb-4">Gastos por categoria</h3>
            {pieData.length > 0 ? (
              <ResponsiveContainer width="100%" height={180}>
                <PieChart>
                  <Pie data={pieData} cx="50%" cy="50%" innerRadius={45} outerRadius={70}
                    paddingAngle={3} dataKey="value">
                    {pieData.map((_,i)=><Cell key={i} fill={COLORS[i%COLORS.length]}/>)}
                  </Pie>
                  <Tooltip formatter={(v:any)=>fmt(v)} contentStyle={{fontSize:11,borderRadius:8}}/>
                  <Legend iconType="circle" iconSize={8} wrapperStyle={{fontSize:11}}/>
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[180px] flex items-center justify-center text-muted-foreground text-xs">
                Sem despesas registradas
              </div>
            )}
          </div>
        </div>

        {/* ── Barra de saúde financeira ── */}
        <div className="glass-card p-5 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-foreground">Saúde financeira</h3>
            <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${pct<70?'bg-primary/10 text-primary':pct<90?'bg-amber-500/10 text-amber-500':'bg-red-500/10 text-red-500'}`}>
              {pct<70?'Ótima 🟢':pct<90?'Atenção 🟡':'Crítica 🔴'}
            </span>
          </div>
          <div className="h-2.5 bg-secondary rounded-full overflow-hidden">
            <div className={`h-full rounded-full transition-all duration-700 ${pct<70?'bg-gradient-to-r from-primary to-cyan-400':pct<90?'bg-amber-500':'bg-red-500'}`}
              style={{width:`${pct}%`}}/>
          </div>
          <p className="text-xs text-muted-foreground">
            {pct}% da receita comprometida em despesas
            {pct>=90 && ' — considere revisar seus gastos!'}
          </p>
        </div>

        {/* ── Lista de transações ── */}
        <TransactionList transactions={localTx} onUpdate={setLocalTx}/>
      </main>

      {/* ── Chatbot unificado (botão flutuante + chat) ── */}
      <Chatbot
        open={showAI}
        onOpenChange={setShowAI}
        context={aiContext}
      />

      {/* ── Modal nova transação ── */}
      {showForm && (
        <TransactionForm
          onClose={()=>setShowForm(false)}
          onAdd={t=>{setLocalTx([t,...localTx]); setShowForm(false)}}
        />
      )}
    </div>
  )
}
