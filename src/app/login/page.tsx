'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Wallet, ArrowRight, Loader2, ShieldCheck, TrendingUp, Users } from 'lucide-react'

export default function LoginPage() {
  const [loading, setLoading] = useState(false)

  async function handleGoogleLogin() {
    setLoading(true)
    try {
      const supabase = createClient()
      await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: { redirectTo: `${window.location.origin}/auth/callback`, queryParams: { prompt: 'select_account' } }
      })
    } catch (e) {
      console.error(e)
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen page-bg flex items-center justify-center p-4 relative overflow-hidden">
      {/* Orbs decorativos */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/4 w-96 h-96 rounded-full bg-primary/10 blur-[120px]"/>
        <div className="absolute bottom-0 right-1/4 w-96 h-96 rounded-full bg-blue-500/8 blur-[120px]"/>
        <div className="absolute top-1/2 left-0 w-64 h-64 rounded-full bg-purple-500/6 blur-[100px]"/>
      </div>

      <div className="relative w-full max-w-sm space-y-4 animate-scaleIn">
        {/* Card principal */}
        <div className="glass-modal rounded-3xl p-8 shadow-2xl space-y-7">
          {/* Logo + título */}
          <div className="text-center space-y-4">
            <div className="flex justify-center">
              <div className="w-16 h-16 rounded-3xl bg-gradient-to-br from-primary to-cyan-400 flex items-center justify-center shadow-lg glow-primary animate-pulseGlow">
                <Wallet size={28} className="text-white"/>
              </div>
            </div>
            <div>
              <h1 className="text-4xl font-black gradient-text">Finanças</h1>
              <p className="text-sm text-muted-foreground mt-2 leading-relaxed">
                Controle financeiro inteligente, bonito e fácil de usar
              </p>
            </div>
          </div>

          {/* Features */}
          <div className="grid grid-cols-3 gap-3">
            {[
              {icon:'📊', label:'Relatórios'},
              {icon:'👫', label:'Compartilhe'},
              {icon:'🤖', label:'IA integrada'},
            ].map(f=>(
              <div key={f.label} className="text-center p-3 rounded-2xl bg-secondary/40">
                <div className="text-xl mb-1">{f.icon}</div>
                <p className="text-[10px] font-semibold text-muted-foreground">{f.label}</p>
              </div>
            ))}
          </div>

          {/* Botão Google */}
          <button onClick={handleGoogleLogin} disabled={loading}
            className="w-full btn-primary py-4 text-base rounded-2xl gap-3 justify-center">
            {loading ? (
              <><Loader2 size={20} className="animate-spin"/> Conectando...</>
            ) : (
              <>
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                  <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
                Entrar com Google
                <ArrowRight size={18}/>
              </>
            )}
          </button>

          {/* Segurança */}
          <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
            <ShieldCheck size={13} className="text-primary"/>
            <span>Autenticação segura • Dados protegidos com RLS</span>
          </div>
        </div>
      </div>
    </div>
  )
}
