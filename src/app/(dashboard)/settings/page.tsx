'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { ArrowLeft, Save, Users, LogOut, User, DollarSign, Mail, CheckCircle2, AlertCircle, Loader2, X, Shield, Eye, EyeOff, ChevronRight, Crown } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

function Alert({ type, msg, onClose }: { type: 'success' | 'error'; msg: string; onClose?: () => void }) {
  return (
    <div className={`flex items-start gap-2.5 px-4 py-3 rounded-xl text-sm border ${
      type === 'success'
        ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-700 dark:text-emerald-400'
        : 'bg-destructive/10 border-destructive/20 text-destructive'
    }`}>
      {type === 'success' ? <CheckCircle2 size={15} className="mt-0.5 flex-shrink-0" /> : <AlertCircle size={15} className="mt-0.5 flex-shrink-0" />}
      <span className="flex-1">{msg}</span>
      {onClose && <button onClick={onClose}><X size={13} className="opacity-60 hover:opacity-100" /></button>}
    </div>
  )
}

export default function SettingsPage() {
  const router = useRouter()
  const [fullName, setFullName]         = useState('')
  const [monthlyIncome, setMonthlyIncome] = useState('')
  const [partnerEmail, setPartnerEmail] = useState('')
  const [userEmail, setUserEmail]       = useState('')
  const [userId, setUserId]             = useState('')
  const [userRole, setUserRole]         = useState('user')
  const [isShared, setIsShared]         = useState(false)
  const [partnerName, setPartnerName]   = useState('')
  const [showIncome, setShowIncome]     = useState(false)

  // Admins can manage roles
  const [allUsers, setAllUsers]         = useState<any[]>([])

  const [saveLoading, setSaveLoading]   = useState(false)
  const [saveAlert, setSaveAlert]       = useState<{type:'success'|'error';msg:string}|null>(null)
  const [shareLoading, setShareLoading] = useState(false)
  const [shareAlert, setShareAlert]     = useState<{type:'success'|'error';msg:string}|null>(null)
  const [roleAlert, setRoleAlert]       = useState<{type:'success'|'error';msg:string}|null>(null)

  useEffect(() => {
    async function load() {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/login'); return }
      setUserEmail(user.email || '')
      setUserId(user.id)

      const { data: p } = await supabase.from('profiles').select('*').eq('id', user.id).single()
      if (p) {
        setFullName(p.full_name || '')
        setMonthlyIncome(p.monthly_income != null ? String(p.monthly_income) : '')
        setUserRole(p.role || 'user')
        if (p.group_id) {
          setIsShared(true)
          // Busca parceiro(s)
          const { data: members } = await supabase
            .from('profiles').select('full_name, email').eq('group_id', p.group_id)
          if (members) {
            const others = members.filter(m => m.email !== user.email)
            if (others.length > 0) setPartnerName(others[0].full_name || others[0].email || '')
          }
        }

        // Se admin, carrega todos os usuários
        if (p.role === 'admin') {
          const { data: users } = await supabase
            .from('profiles').select('id, full_name, email, role, monthly_income')
          if (users) setAllUsers(users)
        }
      }
    }
    load()
  }, [])

  async function handleSave() {
    const income = parseFloat(monthlyIncome.replace(',', '.'))
    if (!fullName.trim()) return setSaveAlert({ type: 'error', msg: 'Informe seu nome.' })
    if (isNaN(income) || income < 0) return setSaveAlert({ type: 'error', msg: 'Renda inválida.' })

    setSaveLoading(true); setSaveAlert(null)
    try {
      const supabase = createClient()
      const { error } = await supabase
        .from('profiles')
        .upsert({ id: userId, full_name: fullName.trim(), monthly_income: income }, { onConflict: 'id' })
      if (error) throw error
      setSaveAlert({ type: 'success', msg: '✅ Perfil salvo! Atualizando dashboard...' })
      setTimeout(() => router.refresh(), 1500)
    } catch (e: any) {
      setSaveAlert({ type: 'error', msg: e.message || 'Erro ao salvar.' })
    } finally { setSaveLoading(false) }
  }

  async function handleShare() {
    const email = partnerEmail.trim().toLowerCase()
    if (!email || !email.includes('@')) return setShareAlert({ type: 'error', msg: 'E-mail inválido.' })
    if (email === userEmail.toLowerCase()) return setShareAlert({ type: 'error', msg: 'Você não pode compartilhar consigo mesmo.' })

    setShareLoading(true); setShareAlert(null)
    try {
      const supabase = createClient()
      // Usa RPC SECURITY DEFINER que bypassa RLS para criar grupo + vincular membros
      const { data, error } = await supabase.rpc('share_with_partner', {
        owner_id: userId,
        partner_email: email,
      })
      if (error) throw error
      if (data?.error) throw new Error(data.error)

      setIsShared(true)
      setPartnerName(data?.partner_name || email)
      setPartnerEmail('')
      setShareAlert({ type: 'success', msg: `✅ Conectado com ${data?.partner_name || email}!` })
    } catch (e: any) {
      setShareAlert({ type: 'error', msg: e.message || 'Erro ao compartilhar.' })
    } finally { setShareLoading(false) }
  }

  async function handleRoleChange(targetId: string, newRole: string) {
    const supabase = createClient()
    const { error } = await supabase.from('profiles').update({ role: newRole }).eq('id', targetId)
    if (error) { setRoleAlert({ type: 'error', msg: error.message }); return }
    setAllUsers(u => u.map(x => x.id === targetId ? { ...x, role: newRole } : x))
    setRoleAlert({ type: 'success', msg: '✅ Função atualizada!' })
  }

  async function handleLogout() {
    const supabase = createClient()
    await supabase.auth.signOut({ scope: 'local' })
    // Força limpeza da sessão do Google também
    window.location.href = '/login'
  }

  return (
    <div className="page-bg min-h-screen pb-28 md:pb-10">
      {/* Header */}
      <header className="glass-header sticky top-0 z-40">
        <div className="max-w-2xl mx-auto px-5 py-4 flex items-center gap-3">
          <Link href="/dashboard" className="p-2 rounded-xl hover:bg-secondary/60 transition text-muted-foreground">
            <ArrowLeft size={18} />
          </Link>
          <div>
            <h1 className="text-lg font-bold text-foreground">Configurações</h1>
            <p className="text-xs text-muted-foreground truncate max-w-[200px]">{userEmail}</p>
          </div>
          {userRole === 'admin' && (
            <span className="ml-auto flex items-center gap-1 text-xs font-bold text-amber-500 bg-amber-500/10 px-2.5 py-1 rounded-full border border-amber-500/20">
              <Crown size={11} /> Admin
            </span>
          )}
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 pt-5 space-y-5">

        {/* Perfil */}
        <div className="glass-card p-5 space-y-4">
          <div className="flex items-center gap-2 mb-1">
            <div className="w-8 h-8 rounded-xl bg-primary/10 flex items-center justify-center">
              <User size={15} className="text-primary" />
            </div>
            <h2 className="font-bold text-foreground">Meu Perfil</h2>
          </div>

          <div>
            <label className="block text-xs font-bold text-muted-foreground uppercase tracking-wide mb-1.5">Nome completo</label>
            <div className="flex items-center gap-2.5 px-3 py-3 rounded-xl border bg-white/60 dark:bg-white/4 border-border focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/20 transition">
              <User size={15} className="text-muted-foreground flex-shrink-0" />
              <input
                type="text"
                placeholder="Seu nome"
                value={fullName}
                onChange={e => setFullName(e.target.value)}
                className="flex-1 bg-transparent outline-none text-sm text-foreground placeholder:text-muted-foreground"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-muted-foreground uppercase tracking-wide mb-1.5">Renda mensal (R$)</label>
            <div className="flex items-center gap-2.5 px-3 py-3 rounded-xl border bg-white/60 dark:bg-white/4 border-border focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/20 transition">
              <DollarSign size={15} className="text-muted-foreground flex-shrink-0" />
              <input
                type={showIncome ? 'text' : 'password'}
                placeholder="Ex: 3500"
                value={monthlyIncome}
                onChange={e => { const v = e.target.value; if(v===''||/^\d*[,.]?\d{0,2}$/.test(v)) setMonthlyIncome(v) }}
                inputMode="decimal"
                className="flex-1 bg-transparent outline-none text-sm text-foreground placeholder:text-muted-foreground"
              />
              <button onClick={() => setShowIncome(v => !v)} className="text-muted-foreground hover:text-foreground transition">
                {showIncome ? <EyeOff size={14}/> : <Eye size={14}/>}
              </button>
            </div>
            <p className="text-[11px] text-muted-foreground mt-1.5 ml-1">💡 Essa renda aparece no dashboard como base de comparação com suas despesas.</p>
          </div>

          {saveAlert && <Alert type={saveAlert.type} msg={saveAlert.msg} onClose={() => setSaveAlert(null)} />}

          <button onClick={handleSave} disabled={saveLoading} className="btn-primary w-full justify-center py-3 rounded-xl gap-2">
            {saveLoading ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
            {saveLoading ? 'Salvando...' : 'Salvar perfil'}
          </button>
        </div>

        {/* Conexão com parceiro */}
        <div className="glass-card p-5 space-y-4">
          <div className="flex items-center gap-2 mb-1">
            <div className="w-8 h-8 rounded-xl bg-blue-500/10 flex items-center justify-center">
              <Users size={15} className="text-blue-500" />
            </div>
            <h2 className="font-bold text-foreground">Conexão Familiar</h2>
            {isShared && (
              <span className="ml-auto text-xs font-bold text-emerald-500 bg-emerald-500/10 px-2 py-0.5 rounded-full">Ativo</span>
            )}
          </div>

          {isShared ? (
            <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-4 text-sm text-emerald-700 dark:text-emerald-400">
              ✅ Conectado com <strong>{partnerName}</strong>. Vocês compartilham as finanças.
            </div>
          ) : (
            <div className="bg-amber-500/8 border border-amber-500/15 rounded-xl p-3 text-xs text-amber-700 dark:text-amber-400">
              💡 <strong>Como funciona:</strong> Seu parceiro(a) precisa ter feito login no app com o e-mail Google antes de ser conectado.
            </div>
          )}

          <div>
            <label className="block text-xs font-bold text-muted-foreground uppercase tracking-wide mb-1.5">E-mail do parceiro(a)</label>
            <div className="flex items-center gap-2.5 px-3 py-3 rounded-xl border bg-white/60 dark:bg-white/4 border-border focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/20 transition">
              <Mail size={15} className="text-muted-foreground flex-shrink-0" />
              <input
                type="email"
                placeholder="email@exemplo.com"
                value={partnerEmail}
                onChange={e => setPartnerEmail(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleShare()}
                className="flex-1 bg-transparent outline-none text-sm text-foreground placeholder:text-muted-foreground"
              />
            </div>
          </div>

          {shareAlert && <Alert type={shareAlert.type} msg={shareAlert.msg} onClose={() => setShareAlert(null)} />}

          <button onClick={handleShare} disabled={shareLoading} className="btn-secondary w-full justify-center py-3 rounded-xl gap-2">
            {shareLoading ? <Loader2 size={16} className="animate-spin" /> : <Users size={16} />}
            {shareLoading ? 'Conectando...' : 'Compartilhar com parceiro(a)'}
          </button>
        </div>

        {/* Painel Admin — só visível para admin */}
        {userRole === 'admin' && (
          <div className="glass-card p-5 space-y-4">
            <div className="flex items-center gap-2 mb-1">
              <div className="w-8 h-8 rounded-xl bg-amber-500/10 flex items-center justify-center">
                <Shield size={15} className="text-amber-500" />
              </div>
              <h2 className="font-bold text-foreground">Painel Admin</h2>
              <Crown size={14} className="text-amber-500 ml-1" />
            </div>

            <p className="text-xs text-muted-foreground">Gerencie os papéis de todos os usuários da plataforma.</p>

            {roleAlert && <Alert type={roleAlert.type} msg={roleAlert.msg} onClose={() => setRoleAlert(null)} />}

            <div className="space-y-2">
              {allUsers.map(u => (
                <div key={u.id} className="flex items-center gap-3 p-3 rounded-xl bg-secondary/30 hover:bg-secondary/50 transition">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary/20 to-cyan-400/20 flex items-center justify-center flex-shrink-0">
                    <span className="text-xs font-bold text-primary">{(u.full_name || u.email || '?')[0].toUpperCase()}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-foreground truncate">{u.full_name || '—'}</p>
                    <p className="text-xs text-muted-foreground truncate">{u.email}</p>
                  </div>
                  <select
                    value={u.role || 'user'}
                    onChange={e => handleRoleChange(u.id, e.target.value)}
                    disabled={u.id === userId} // admin não muda seu próprio role
                    className="text-xs px-2 py-1.5 rounded-lg border border-border bg-secondary/50 text-foreground outline-none disabled:opacity-40"
                  >
                    <option value="user">Usuário</option>
                    <option value="admin">Admin</option>
                  </select>
                </div>
              ))}
              {allUsers.length === 0 && (
                <p className="text-xs text-muted-foreground text-center py-4">Carregando usuários...</p>
              )}
            </div>
          </div>
        )}

        {/* Sair */}
        <div className="glass-card p-5">
          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-between p-3 rounded-xl hover:bg-destructive/8 text-destructive transition group"
          >
            <div className="flex items-center gap-3">
              <LogOut size={17} />
              <div className="text-left">
                <p className="text-sm font-semibold">Sair da conta</p>
                <p className="text-xs text-muted-foreground">Desconectar de {userEmail}</p>
              </div>
            </div>
            <ChevronRight size={16} className="text-muted-foreground group-hover:translate-x-0.5 transition" />
          </button>
        </div>

      </main>
    </div>
  )
}
