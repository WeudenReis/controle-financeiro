'use client'

import { useState, useRef, useEffect } from 'react'
import { TrendingUp, TrendingDown, DollarSign, Plus, FileText, LogOut, Settings, Sparkles, Send, X, Bell, ChevronRight } from 'lucide-react'
import { AreaChart, Area, PieChart, Pie, Cell, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from 'recharts'
import TransactionForm from './transaction-form'
import TransactionList from './transaction-list'
import { generatePDF } from '@/lib/pdf'
import { askAI } from '@/lib/ai'
import { createClient } from '@/lib/supabase/client'
import { ThemeToggle } from '@/components/ui/theme-toggle'

interface Props {
  transactions: any[]
  profile: any
  user: any
}

const COLORS = ['#2dd4bf','#3b82f6','#8b5cf6','#f59e0b','#ef4444','#10b981']
const fmt = (v: number) => v.toLocaleString('pt-BR', { style:'currency', currency:'BRL' })

export default function DashboardPremium({ transactions, profile, user }: Props) {
  const [showForm, setShowForm]   = useState(false)
  const [localTx, setLocalTx]     = useState(transactions)
  const [showAI, setShowAI]       = useState(false)
  const [aiMsg, setAiMsg]         = useState('')
  const [aiLoading, setAiLoading] = useState(false)
  const [aiChat, setAiChat]       = useState<{role:string;content:string}[]>([])
  const chatRef = useRef<HTMLDivElement>(null)

  const totalReceitas = localTx.filter(t=>t.type==='receita').reduce((s,t)=>s+Number(t.amount),0)
  const totalDespesas = localTx.filter(t=>t.type==='despesa').reduce((s,t)=>s+Number(t.amount),0)
  const saldo = totalReceitas - totalDespesas
  const pct   = totalReceitas > 0 ? Math.min(Math.round((totalDespesas/totalReceitas)*100),100) : 0

  const areaData = [...localTx].slice(0,10).reverse().map(t=>({
    date: new Date(t.date+'T12:00:00').toLocaleDateString('pt-BR',{day:'2-digit',month:'2-digit'}),
    valor: Number(t.amount),
  }))

  const pieData = Object.entries(
    localTx.filter(t=>t.type==='despesa').reduce((acc:Record<string,number>,t)=>{
      acc[t.category]=(acc[t.category]||0)+Number(t.amount); return acc
    },{})
  ).map(([name,value])=>({name,value})).sort((a,b)=>b.value-a.value).slice(0,6)

  useEffect(()=>{
    if(chatRef.current) chatRef.current.scrollTop=chatRef.current.scrollHeight
  },[aiChat])

  async function sendAI(){
    if(!aiMsg.trim()||aiLoading) return
    const msg=aiMsg.trim(); setAiChat(c=>[...c,{role:'user',content:msg}]); setAiMsg(''); setAiLoading(true)
    try {
      const res=await askAI(msg,{totalIncome:totalReceitas,totalExpenses:totalDespesas,balance:saldo,transactions:localTx,monthYear:new Date().toLocaleDateString('pt-BR',{month:'long',year:'numeric'})})
      setAiChat(c=>[...c,{role:'assistant',content:res}])
    } catch{}
    setAiLoading(false)
  }

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
            <button onClick={()=>setShowAI(!showAI)} className={`w-9 h-9 flex items-center justify-center rounded-xl transition-all ${showAI?'bg-primary/20 text-primary':'hover:bg-white/50 dark:hover:bg-white/5 text-muted-foreground'}`}>
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

        {/* ── Saldo destaque ── */}
        <div className="glass-card p-6 text-center relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-cyan-400/5"/>
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-widest mb-2">Saldo disponível</p>
          <p className={`text-4xl font-black tracking-tight ${saldo>=0?'gradient-text':'text-destructive'}`}>{fmt(saldo)}</p>
          <div className="flex justify-center gap-6 mt-4 pt-4 border-t border-border/40">
            <div className="text-center">
              <p className="text-xs text-muted-foreground mb-1">↑ Receitas</p>
              <p className="text-sm font-bold income-text">{fmt(totalReceitas)}</p>
            </div>
            <div className="w-px bg-border/50"/>
            <div className="text-center">
              <p className="text-xs text-muted-foreground mb-1">↓ Despesas</p>
              <p className="text-sm font-bold expense-text">{fmt(totalDespesas)}</p>
            </div>
          </div>
        </div>

        {/* ── Barra comprometido ── */}
        <div className="glass-card px-5 py-4">
          <div className="flex items-center justify-between mb-2.5">
            <div>
              <p className="text-sm font-semibold text-foreground">Renda comprometida</p>
              <p className="text-xs text-muted-foreground">do total de receitas</p>
            </div>
            <span className={`text-xl font-black ${pct>80?'text-destructive':pct>60?'text-amber-500':'text-primary'}`}>{pct}%</span>
          </div>
          <div className="w-full h-3 bg-secondary/70 rounded-full overflow-hidden">
            <div className={`h-full rounded-full transition-all duration-700 ${pct>80?'bg-destructive':pct>60?'bg-amber-500':'bg-gradient-to-r from-primary to-cyan-400'}`}
              style={{width:`${pct}%`}}/>
          </div>
          {pct>80 && <p className="text-xs text-destructive mt-1.5 font-medium">⚠️ Atenção: mais de 80% da renda comprometida</p>}
        </div>

        {/* ── Cards métricas ── */}
        <div className="grid grid-cols-3 gap-3">
          {[
            {label:'Receitas', value:fmt(totalReceitas), icon:TrendingUp,  color:'text-emerald-500', bg:'bg-emerald-500/10'},
            {label:'Despesas', value:fmt(totalDespesas), icon:TrendingDown, color:'text-red-500',     bg:'bg-red-500/10'},
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
                  <XAxis dataKey="date" tick={{fontSize:11,fill:'hsl(var(--muted-foreground))'}} axisLine={false} tickLine={false}/>
                  <YAxis tick={{fontSize:10,fill:'hsl(var(--muted-foreground))'}} axisLine={false} tickLine={false} width={52} tickFormatter={v=>`R$${(v/1000).toFixed(1)}k`}/>
                  <Tooltip contentStyle={{background:'hsl(var(--card))',border:'1px solid hsl(var(--border))',borderRadius:12,fontSize:12}} formatter={(v:any)=>[fmt(v),'Valor']}/>
                  <Area type="monotone" dataKey="valor" stroke="hsl(var(--primary))" strokeWidth={2.5} fill="url(#gArea)"/>
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[180px] flex items-center justify-center text-muted-foreground text-sm">Sem dados ainda</div>
            )}
          </div>

          {/* Pizza */}
          <div className="glass-card p-5">
            <h3 className="text-sm font-bold text-foreground mb-4">Despesas por categoria</h3>
            {pieData.length > 0 ? (
              <ResponsiveContainer width="100%" height={180}>
                <PieChart>
                  <Pie data={pieData} cx="45%" cy="50%" innerRadius={48} outerRadius={72} paddingAngle={3} dataKey="value" stroke="none">
                    {pieData.map((_,i)=><Cell key={i} fill={COLORS[i%COLORS.length]}/>)}
                  </Pie>
                  <Tooltip contentStyle={{background:'hsl(var(--card))',border:'1px solid hsl(var(--border))',borderRadius:12,fontSize:12}} formatter={(v:any)=>[fmt(v)]}/>
                  <Legend iconType="circle" iconSize={8} wrapperStyle={{fontSize:11}}/>
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[180px] flex items-center justify-center text-muted-foreground text-sm">Sem despesas ainda</div>
            )}
          </div>
        </div>

        {/* ── Atalhos de navegação ── */}
        <div className="glass-card divide-y divide-border/40">
          {[
            {href:'/transactions', label:'Todas as transações', sub:`${localTx.length} registros`, icon:TrendingDown, color:'text-blue-500'},
            {href:'/reports',      label:'Ver relatórios',      sub:'Análise mensal e anual',       icon:TrendingUp, color:'text-emerald-500'},
            {href:'/planning',     label:'Planejamento',        sub:'Orçamentos por categoria',     icon:DollarSign, color:'text-amber-500'},
          ].map(item=>(
            <a key={item.href} href={item.href} className="flex items-center gap-3 px-5 py-4 hover:bg-white/30 dark:hover:bg-white/5 transition-colors group">
              <div className={`w-9 h-9 rounded-xl bg-secondary/60 flex items-center justify-center flex-shrink-0`}>
                <item.icon size={16} className={item.color}/>
              </div>
              <div className="flex-1">
                <p className="text-sm font-semibold text-foreground">{item.label}</p>
                <p className="text-xs text-muted-foreground">{item.sub}</p>
              </div>
              <ChevronRight size={15} className="text-muted-foreground group-hover:text-foreground transition-colors"/>
            </a>
          ))}
        </div>

        {/* ── Lista de transações ── */}
        <TransactionList transactions={localTx} onUpdate={setLocalTx}/>
      </main>

      {/* ── AI Chat ── */}
      {showAI && (
        <div className="fixed bottom-20 md:bottom-6 right-4 md:right-6 w-80 h-[400px] glass-modal rounded-2xl shadow-2xl flex flex-col z-50 overflow-hidden animate-slideUp">
          <div className="flex items-center justify-between px-4 py-3.5 border-b border-border/50">
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-xl bg-gradient-to-br from-primary to-cyan-400 flex items-center justify-center">
                <Sparkles size={13} className="text-white"/>
              </div>
              <span className="text-sm font-bold text-foreground">Assistente IA</span>
            </div>
            <button onClick={()=>setShowAI(false)} className="p-1.5 rounded-lg hover:bg-secondary/70 transition text-muted-foreground">
              <X size={14}/>
            </button>
          </div>
          <div ref={chatRef} className="flex-1 overflow-y-auto p-4 space-y-3">
            {aiChat.length===0 && (
              <div className="text-center py-8 text-muted-foreground">
                <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-3">
                  <Sparkles size={20} className="text-primary"/>
                </div>
                <p className="text-xs font-medium">Olá! Pergunte sobre suas finanças.</p>
                <p className="text-[11px] mt-1 opacity-60">Ex: "Quanto gastei este mês?"</p>
              </div>
            )}
            {aiChat.map((m,i)=>(
              <div key={i} className={`flex ${m.role==='user'?'justify-end':'justify-start'}`}>
                <div className={`max-w-[85%] text-xs px-3.5 py-2.5 rounded-2xl leading-relaxed ${m.role==='user'?'bg-gradient-to-br from-primary to-cyan-500 text-white rounded-br-sm':'bg-secondary/80 text-foreground rounded-bl-sm'}`}>
                  {m.content}
                </div>
              </div>
            ))}
            {aiLoading && (
              <div className="flex justify-start">
                <div className="bg-secondary/80 px-4 py-3 rounded-2xl rounded-bl-sm flex gap-1.5">
                  {[0,1,2].map(i=><div key={i} className="w-1.5 h-1.5 bg-muted-foreground rounded-full animate-bounce" style={{animationDelay:`${i*0.12}s`}}/>)}
                </div>
              </div>
            )}
          </div>
          <div className="p-3 border-t border-border/50 flex gap-2">
            <input type="text" value={aiMsg} onChange={e=>setAiMsg(e.target.value)} onKeyDown={e=>e.key==='Enter'&&sendAI()}
              placeholder="Pergunte algo..." disabled={aiLoading}
              className="input-base flex-1 text-xs py-2.5"/>
            <button onClick={sendAI} disabled={aiLoading||!aiMsg.trim()}
              className="p-2.5 bg-gradient-to-br from-primary to-cyan-500 rounded-xl text-white disabled:opacity-40 transition active:scale-95">
              <Send size={14}/>
            </button>
          </div>
        </div>
      )}

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
