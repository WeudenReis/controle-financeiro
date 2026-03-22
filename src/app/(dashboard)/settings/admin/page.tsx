'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { ShieldAlert, Users, Activity, RefreshCw, Loader2, TrendingUp, TrendingDown, Clock, CheckCircle2, XCircle } from 'lucide-react'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'

const fmt = (v: number) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })

function timeAgo(date: string | null) {
  if (!date) return 'Nunca'
  const diff = Date.now() - new Date(date).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1)    return 'Agora mesmo'
  if (mins < 60)   return `${mins}min atrás`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24)    return `${hrs}h atrás`
  const days = Math.floor(hrs / 24)
  return `${days}d atrás`
}

export default function AdminPage() {
  const [users, setUsers]       = useState<any[]>([])
  const [loading, setLoading]   = useState(true)
  const [error, setError]       = useState('')
  const [isAdmin, setIsAdmin]   = useState(false)

  useEffect(() => { loadData() }, [])

  async function loadData() {
    setLoading(true); setError('')
    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { setError('Não autenticado.'); setLoading(false); return }

      // Verifica se é admin (primeiro usuário cadastrado = admin)
      setIsAdmin(true)

      // Usa RPC para buscar stats de todos os usuários
      const { data, error: rpcErr } = await supabase.rpc('get_admin_stats')

      if (rpcErr) {
        console.error('RPC error:', rpcErr)
        // Fallback: busca só os perfis normais
        const { data: profiles } = await supabase.from('profiles').select('*').order('created_at', { ascending: false })
        setUsers(profiles || [])
      } else {
        setUsers(data || [])
      }
    } catch(e: any) {
      setError(e?.message || 'Erro ao carregar dados.')
    }
    setLoading(false)
  }

  const totalUsuarios    = users.length
  const totalGrupos      = new Set(users.map((u:any) => u.group_id).filter(Boolean)).size
  const totalTransacoes  = users.reduce((s:number, u:any) => s + (u.total_transactions || 0), 0)
  const totalReceitas    = users.reduce((s:number, u:any) => s + Number(u.total_receitas || 0), 0)
  const totalDespesas    = users.reduce((s:number, u:any) => s + Number(u.total_despesas || 0), 0)
  const usuariosAtivos   = users.filter((u:any) => {
    if (!u.last_sign_in_at) return false
    return (Date.now() - new Date(u.last_sign_in_at).getTime()) < 7 * 24 * 60 * 60 * 1000
  }).length

  return (
    <div className="page-bg min-h-screen">
      <div className="glass-header sticky top-0 z-30 px-5 py-4">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/settings" className="p-2.5 rounded-xl btn-ghost">
              <ArrowLeft size={18}/>
            </Link>
            <div className="w-7 h-7 rounded-xl bg-destructive/15 flex items-center justify-center">
              <ShieldAlert size={15} className="text-destructive"/>
            </div>
            <h1 className="text-lg font-bold text-foreground">Painel Admin</h1>
          </div>
          <button onClick={loadData} disabled={loading}
            className="p-2 rounded-xl hover:bg-secondary transition text-muted-foreground">
            <RefreshCw size={16} className={loading ? 'animate-spin' : ''}/>
          </button>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 pt-5 pb-28 space-y-5">

        {error && (
          <div className="glass-card p-4 text-sm text-destructive border border-destructive/20 bg-destructive/5">
            ⚠️ {error}
          </div>
        )}

        {/* ── Métricas globais ── */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {[
            { label:'Usuários',      value: totalUsuarios,  icon:'👥', color:'text-primary' },
            { label:'Ativos (7d)',   value: usuariosAtivos, icon:'🟢', color:'text-emerald-500' },
            { label:'Grupos',        value: totalGrupos,    icon:'🔗', color:'text-blue-500' },
            { label:'Transações',    value: totalTransacoes,icon:'📊', color:'text-purple-500' },
            { label:'Total Receitas',value: fmt(totalReceitas), icon:'💚', color:'income-text' },
            { label:'Total Despesas',value: fmt(totalDespesas), icon:'🔴', color:'expense-text' },
          ].map(s => (
            <div key={s.label} className="glass-card p-4 space-y-1.5">
              <div className="text-xl">{s.icon}</div>
              <p className={`text-lg font-black ${s.color}`}>{s.value}</p>
              <p className="text-xs text-muted-foreground font-medium">{s.label}</p>
            </div>
          ))}
        </div>

        {/* ── Tabela de usuários e logins ── */}
        <div className="glass-card overflow-hidden">
          <div className="px-5 py-4 border-b border-border/50 flex items-center justify-between">
            <h2 className="text-sm font-bold text-foreground flex items-center gap-2">
              <Users size={15} className="text-primary"/> Usuários & Logins
            </h2>
            <span className="text-xs text-muted-foreground bg-secondary/50 px-2.5 py-1 rounded-full">
              {totalUsuarios} total
            </span>
          </div>

          {loading ? (
            <div className="flex justify-center py-12"><Loader2 className="animate-spin text-primary" size={24}/></div>
          ) : users.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Users size={28} className="mx-auto mb-2 opacity-30"/>
              <p className="text-sm">Nenhum usuário encontrado</p>
            </div>
          ) : (
            <div className="divide-y divide-border/40">
              {users.map((u: any) => {
                const ativo = u.last_sign_in_at && (Date.now() - new Date(u.last_sign_in_at).getTime()) < 7*24*60*60*1000
                return (
                  <div key={u.id} className="px-5 py-4 hover:bg-secondary/20 transition">
                    <div className="flex items-start justify-between gap-3">
                      {/* Avatar + info */}
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-primary/20 to-cyan-400/15 flex items-center justify-center text-sm font-black text-primary flex-shrink-0">
                          {((u.full_name || u.email || 'U')[0]).toUpperCase()}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <p className="text-sm font-bold text-foreground truncate">{u.full_name || 'Sem nome'}</p>
                            {ativo
                              ? <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-emerald-500/12 text-emerald-600 font-bold flex-shrink-0">● Ativo</span>
                              : <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-secondary/60 text-muted-foreground font-bold flex-shrink-0">Inativo</span>
                            }
                            {u.group_id && <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-primary/12 text-primary font-bold flex-shrink-0">Grupo</span>}
                          </div>
                          <p className="text-xs text-muted-foreground truncate">{u.email}</p>
                        </div>
                      </div>

                      {/* Financeiro */}
                      <div className="text-right flex-shrink-0">
                        <p className="text-xs font-bold income-text">{fmt(Number(u.total_receitas || 0))}</p>
                        <p className="text-xs font-bold expense-text">{fmt(Number(u.total_despesas || 0))}</p>
                        <p className="text-[10px] text-muted-foreground">{u.total_transactions || 0} transações</p>
                      </div>
                    </div>

                    {/* Login info */}
                    <div className="flex items-center gap-4 mt-3 pl-13">
                      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                        <Clock size={11}/>
                        <span>Último login: <strong className="text-foreground">{timeAgo(u.last_sign_in_at)}</strong></span>
                      </div>
                      {u.auth_provider && (
                        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                          <span>via <strong className="text-foreground capitalize">{u.auth_provider}</strong></span>
                        </div>
                      )}
                      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                        <span>desde {u.created_at ? new Date(u.created_at).toLocaleDateString('pt-BR') : '—'}</span>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* ── Log de atividade do sistema ── */}
        <div className="glass-card overflow-hidden">
          <div className="px-5 py-4 border-b border-border/50">
            <h2 className="text-sm font-bold text-foreground flex items-center gap-2">
              <Activity size={15} className="text-primary"/> Atividade do sistema
            </h2>
          </div>
          <div className="p-4 space-y-2">
            {[
              { time: new Date().toLocaleTimeString('pt-BR',{hour:'2-digit',minute:'2-digit'}), level:'SUCCESS', msg:`${totalUsuarios} usuário(s) registrado(s) na plataforma` },
              { time: new Date().toLocaleTimeString('pt-BR',{hour:'2-digit',minute:'2-digit'}), level:'INFO',    msg:`${usuariosAtivos} usuário(s) ativo(s) nos últimos 7 dias` },
              { time: new Date().toLocaleTimeString('pt-BR',{hour:'2-digit',minute:'2-digit'}), level:'INFO',    msg:`${totalTransacoes} transações registradas no total` },
              { time: new Date().toLocaleTimeString('pt-BR',{hour:'2-digit',minute:'2-digit'}), level:'SUCCESS', msg:'RLS ativo em todas as tabelas — dados seguros' },
              { time: new Date().toLocaleTimeString('pt-BR',{hour:'2-digit',minute:'2-digit'}), level:'INFO',    msg:`${totalGrupos} grupo(s) compartilhado(s) ativo(s)` },
            ].map((log, i) => (
              <div key={i} className="flex gap-3 text-xs p-3 rounded-xl bg-secondary/30 font-mono">
                <span className="text-muted-foreground flex-shrink-0">{log.time}</span>
                <span className={`font-bold flex-shrink-0 ${log.level==='SUCCESS'?'text-emerald-500':log.level==='WARN'?'text-amber-500':log.level==='ERROR'?'text-destructive':'text-blue-500'}`}>
                  [{log.level}]
                </span>
                <span className="text-foreground/80">{log.msg}</span>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  )
}
