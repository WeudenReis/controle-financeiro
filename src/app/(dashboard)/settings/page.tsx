'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { ArrowLeft, Save, Users, LogOut, User, DollarSign, Mail, CheckCircle2, AlertCircle, Loader2, ChevronRight, ShieldAlert, X } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

function StatusAlert({ type, msg, onClose }: { type: 'success' | 'error'; msg: string; onClose?: () => void }) {
  return (
    <div className={`flex items-start gap-2.5 px-4 py-3 rounded-xl text-sm border ${
      type === 'success'
        ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-700 dark:text-emerald-400'
        : 'bg-destructive/10 border-destructive/20 text-destructive'
    }`}>
      {type === 'success'
        ? <CheckCircle2 size={15} className="flex-shrink-0 mt-0.5" />
        : <AlertCircle size={15} className="flex-shrink-0 mt-0.5" />}
      <span className="flex-1">{msg}</span>
      {onClose && <button onClick={onClose} className="flex-shrink-0 opacity-60 hover:opacity-100 transition"><X size={14} /></button>}
    </div>
  )
}

// Input com ícone — sem posicionamento absoluto conflitante
function IconInput({
  label, icon, type = 'text', placeholder, value, onChange, onKeyDown, readOnly, className = ''
}: {
  label: string
  icon: React.ReactNode
  type?: string
  placeholder?: string
  value: string
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void
  onKeyDown?: (e: React.KeyboardEvent<HTMLInputElement>) => void
  readOnly?: boolean
  className?: string
}) {
  return (
    <div>
      <label className="block text-xs font-bold text-muted-foreground uppercase tracking-wide mb-1.5">
        {label}
      </label>
      <div className={`flex items-center gap-2.5 px-3 py-3 rounded-xl border transition-all duration-200 ${
        readOnly
          ? 'opacity-60 cursor-not-allowed bg-secondary/20 border-border/50'
          : 'bg-white/60 dark:bg-white/4 border-border focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/20'
      } ${className}`}>
        <span className="text-muted-foreground flex-shrink-0">{icon}</span>
        <input
          type={type}
          placeholder={placeholder}
          value={value}
          onChange={onChange}
          onKeyDown={onKeyDown}
          readOnly={readOnly}
          className="flex-1 bg-transparent outline-none text-sm text-foreground placeholder:text-muted-foreground min-w-0"
        />
      </div>
    </div>
  )
}

export default function SettingsPage() {
  const router = useRouter()
  const [fullName, setFullName]             = useState('')
  const [monthlyIncome, setMonthlyIncome]   = useState('')
  const [partnerEmail, setPartnerEmail]     = useState('')
  const [isSharedMode, setIsSharedMode]     = useState(false)
  const [userEmail, setUserEmail]           = useState('')
  const [profileLoading, setProfileLoading] = useState(true)
  const [saveLoading, setSaveLoading]       = useState(false)
  const [shareLoading, setShareLoading]     = useState(false)
  const [profileAlert, setProfileAlert]     = useState<{ type: 'success' | 'error'; msg: string } | null>(null)
  const [shareAlert, setShareAlert]         = useState<{ type: 'success' | 'error'; msg: string } | null>(null)

  useEffect(() => { loadProfile() }, [])

  async function loadProfile() {
    setProfileLoading(true)
    try {
      const supabase = createClient()
      const { data: { user }, error: uErr } = await supabase.auth.getUser()
      if (uErr || !user) { router.push('/login'); return }

      setUserEmail(user.email || '')

      const { data: profile, error } = await supabase
        .from('profiles').select('*').eq('id', user.id).single()

      if (profile) {
        setFullName(profile.full_name || '')
        setMonthlyIncome(profile.monthly_income != null ? String(profile.monthly_income) : '')
        setIsSharedMode(!!profile.group_id)
      }
      if (error && error.code !== 'PGRST116') console.error('Perfil:', error)
    } catch (e) { console.error(e) }
    finally { setProfileLoading(false) }
  }

  async function handleSaveProfile() {
    const name   = fullName.trim()
    const income = parseFloat(monthlyIncome)
    if (!name)                       return setProfileAlert({ type: 'error', msg: 'Informe um nome válido.' })
    if (isNaN(income) || income < 0) return setProfileAlert({ type: 'error', msg: 'Informe uma renda mensal válida.' })

    setSaveLoading(true); setProfileAlert(null)
    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { setProfileAlert({ type: 'error', msg: 'Sessão expirada.' }); setSaveLoading(false); return }

      const { error } = await supabase
        .from('profiles')
        .upsert({ id: user.id, full_name: name, monthly_income: income }, { onConflict: 'id' })

      if (error) throw error

      setProfileAlert({ type: 'success', msg: '✅ Perfil salvo com sucesso!' })
      setTimeout(() => setProfileAlert(null), 4000)
    } catch (e: any) {
      setProfileAlert({ type: 'error', msg: e?.message || 'Erro ao salvar. Tente novamente.' })
    } finally { setSaveLoading(false) }
  }

  async function handleShare() {
    const email = partnerEmail.trim().toLowerCase()
    if (!email || !email.includes('@')) return setShareAlert({ type: 'error', msg: 'Digite um e-mail válido.' })

    setShareLoading(true); setShareAlert(null)
    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { setShareAlert({ type: 'error', msg: 'Sessão expirada.' }); setShareLoading(false); return }

      if (email === (user.email || '').toLowerCase()) {
        setShareAlert({ type: 'error', msg: 'Você não pode compartilhar consigo mesmo.' })
        setShareLoading(false); return
      }

      const { data: partner, error: pErr } = await supabase
        .from('profiles').select('*').eq('email', email).single()

      if (pErr || !partner) {
        setShareAlert({ type: 'error', msg: 'Parceiro(a) não encontrado. Certifique-se que a pessoa já acessou o app.' })
        setShareLoading(false); return
      }

      const { data: myProfile } = await supabase.from('profiles').select('*').eq('id', user.id).single()
      let groupId = myProfile?.group_id || partner?.group_id

      if (!groupId) {
        const { data: group, error: gErr } = await supabase
          .from('groups').insert({ name: myProfile?.full_name || 'Família' }).select().single()
        if (gErr || !group) throw new Error('Não foi possível criar o grupo.')
        groupId = group.id
      }

      await supabase.from('profiles').upsert({ id: user.id,    group_id: groupId }, { onConflict: 'id' })
      await supabase.from('profiles').upsert({ id: partner.id, group_id: groupId }, { onConflict: 'id' })

      const { error: mErr } = await supabase.from('group_members').upsert([
        { group_id: groupId, user_id: user.id,    role: 'owner' },
        { group_id: groupId, user_id: partner.id, role: 'member' },
      ], { onConflict: 'group_id,user_id' })
      if (mErr) throw mErr

      setIsSharedMode(true)
      setPartnerEmail('')
      setShareAlert({ type: 'success', msg: `✅ Modo compartilhado ativado com ${partner.full_name || email}!` })
    } catch (e: any) {
      setShareAlert({ type: 'error', msg: e?.message || 'Erro ao compartilhar. Tente novamente.' })
    } finally { setShareLoading(false) }
  }

  async function handleLogout() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/login')
  }

  if (profileLoading) return (
    <div className="page-bg min-h-screen flex items-center justify-center">
      <Loader2 className="animate-spin text-primary" size={28} />
    </div>
  )

  return (
    <div className="page-bg min-h-screen">
      {/* Header */}
      <div className="glass-header sticky top-0 z-30 px-5 py-4">
        <div className="max-w-lg mx-auto flex items-center gap-3">
          <Link href="/dashboard" className="btn-ghost p-2.5">
            <ArrowLeft size={18} />
          </Link>
          <h1 className="text-lg font-bold text-foreground">Configurações</h1>
        </div>
      </div>

      <div className="max-w-lg mx-auto px-4 pt-5 pb-28 space-y-4">

        {/* ── Meu Perfil ── */}
        <section className="glass-card p-5 space-y-4">
          <h2 className="text-sm font-bold text-foreground flex items-center gap-2">
            <div className="w-7 h-7 rounded-xl bg-primary/10 flex items-center justify-center">
              <User size={14} className="text-primary" />
            </div>
            Meu perfil
          </h2>

          <div className="space-y-3">
            <IconInput
              label="Nome completo"
              icon={<User size={14} />}
              placeholder="Seu nome"
              value={fullName}
              onChange={e => setFullName(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSaveProfile()}
            />

            <IconInput
              label="Renda mensal (R$)"
              icon={<DollarSign size={14} />}
              type="number"
              placeholder="0,00"
              value={monthlyIncome}
              onChange={e => setMonthlyIncome(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSaveProfile()}
              className="text-lg font-bold"
            />

            <IconInput
              label="E-mail (Google)"
              icon={<Mail size={14} />}
              type="email"
              placeholder=""
              value={userEmail}
              onChange={() => {}}
              readOnly
            />

            {profileAlert && (
              <StatusAlert type={profileAlert.type} msg={profileAlert.msg} onClose={() => setProfileAlert(null)} />
            )}

            <button onClick={handleSaveProfile} disabled={saveLoading} className="btn-primary w-full">
              {saveLoading
                ? <><Loader2 size={16} className="animate-spin" /> Salvando...</>
                : <><Save size={16} /> Salvar perfil</>}
            </button>
          </div>
        </section>

        {/* ── Conexão Familiar ── */}
        <section className="glass-card p-5 space-y-4">
          <h2 className="text-sm font-bold text-foreground flex items-center gap-2">
            <div className="w-7 h-7 rounded-xl bg-primary/10 flex items-center justify-center">
              <Users size={14} className="text-primary" />
            </div>
            Conexão Familiar
          </h2>

          {isSharedMode ? (
            <div className="flex items-center gap-3 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl p-4">
              <CheckCircle2 size={20} className="text-emerald-500 flex-shrink-0" />
              <div>
                <p className="text-sm font-bold text-emerald-600 dark:text-emerald-400">Modo compartilhado ativo! 🎉</p>
                <p className="text-xs text-muted-foreground mt-0.5">Você está vendo as finanças do grupo.</p>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="bg-primary/5 border border-primary/15 rounded-xl p-3 text-xs text-foreground/80 leading-relaxed">
                💡 <strong>Como funciona:</strong> Seu parceiro(a) precisa ter feito login no app com o e-mail Google antes de ser conectado.
              </div>

              <IconInput
                label="E-mail do parceiro(a)"
                icon={<Mail size={14} />}
                type="email"
                placeholder="email@exemplo.com"
                value={partnerEmail}
                onChange={e => setPartnerEmail(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleShare()}
              />

              {shareAlert && (
                <StatusAlert type={shareAlert.type} msg={shareAlert.msg} onClose={() => setShareAlert(null)} />
              )}

              <button onClick={handleShare} disabled={shareLoading} className="btn-secondary w-full">
                {shareLoading
                  ? <><Loader2 size={16} className="animate-spin" /> Conectando...</>
                  : <><Users size={16} /> Compartilhar com parceiro(a)</>}
              </button>
            </div>
          )}
        </section>

        {/* ── Admin ── */}
        <section className="glass-card overflow-hidden">
          <Link href="/settings/admin" className="flex items-center justify-between px-5 py-4 hover:bg-white/30 dark:hover:bg-white/5 transition group">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-destructive/10 flex items-center justify-center">
                <ShieldAlert size={16} className="text-destructive" />
              </div>
              <div>
                <p className="text-sm font-semibold text-foreground">Painel Admin</p>
                <p className="text-xs text-muted-foreground">Gerenciar usuários e sistema</p>
              </div>
            </div>
            <ChevronRight size={15} className="text-muted-foreground group-hover:text-foreground transition" />
          </Link>
        </section>

        {/* ── Logout ── */}
        <button
          onClick={handleLogout}
          className="w-full flex items-center justify-center gap-2 py-3.5 rounded-2xl text-destructive hover:bg-destructive/10 transition font-semibold text-sm border border-destructive/20"
        >
          <LogOut size={16} /> Sair da conta
        </button>
      </div>
    </div>
  )
}
