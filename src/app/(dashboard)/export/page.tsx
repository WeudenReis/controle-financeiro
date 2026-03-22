'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Download, FileText, FileSpreadsheet, Loader2, CheckCircle2 } from 'lucide-react'
import PageShell from '@/components/layout/page-shell'
import { generatePDF } from '@/lib/pdf'

const fmt = (v: number) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })

export default function ExportPage() {
  const [txs, setTxs] = useState<any[]>([])
  const [profile, setProfile] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [exporting, setExporting] = useState<string | null>(null)
  const [done, setDone] = useState<string | null>(null)
  const [filterMonth, setFilterMonth] = useState('')

  useEffect(() => { load() }, [])

  async function load() {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { setLoading(false); return }
    const [{ data: t }, { data: p }] = await Promise.all([
      supabase.from('transactions').select('*').eq('user_id', user.id).order('date', { ascending: false }),
      supabase.from('profiles').select('*').eq('id', user.id).single(),
    ])
    setTxs(t || [])
    setProfile(p)
    setLoading(false)
  }

  const filtered = filterMonth ? txs.filter(t => t.date.startsWith(filterMonth)) : txs

  async function exportPDF() {
    setExporting('pdf')
    try { await generatePDF(filtered, profile) } catch {}
    setExporting(null); setDone('pdf')
    setTimeout(() => setDone(null), 3000)
  }

  function exportCSV() {
    setExporting('csv')
    const header = ['Data','Descrição','Categoria','Tipo','Status','Valor','Notas']
    const rows = filtered.map(t => [
      new Date(t.date+'T12:00:00').toLocaleDateString('pt-BR'),
      `"${t.description}"`,
      t.category,
      t.type,
      t.status,
      Number(t.amount).toFixed(2),
      `"${t.notes||''}"`,
    ])
    const csv = [header, ...rows].map(r => r.join(',')).join('\n')
    const blob = new Blob(['\uFEFF'+csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url; a.download = `financas_${filterMonth||'completo'}.csv`; a.click()
    URL.revokeObjectURL(url)
    setExporting(null); setDone('csv')
    setTimeout(() => setDone(null), 3000)
  }

  const totalReceita = filtered.filter(t=>t.type==='receita').reduce((s,t)=>s+Number(t.amount),0)
  const totalDespesa = filtered.filter(t=>t.type==='despesa').reduce((s,t)=>s+Number(t.amount),0)

  return (
    <PageShell title="Exportar" icon={<Download size={20} className="text-primary" />}>
      <div className="space-y-4 pb-24 md:pb-6">
        {/* Filtro de mês */}
        <div className="glass-card p-4 flex items-center gap-3">
          <FileText size={16} className="text-primary flex-shrink-0" />
          <div className="flex-1">
            <p className="text-xs text-muted-foreground mb-1">Filtrar por mês (opcional)</p>
            <input type="month" value={filterMonth} onChange={e => setFilterMonth(e.target.value)} className="input-base py-2 text-sm" />
          </div>
          {filterMonth && (
            <button onClick={() => setFilterMonth('')} className="text-xs text-muted-foreground hover:text-foreground px-2 py-1 rounded-lg hover:bg-secondary transition">
              Limpar
            </button>
          )}
        </div>

        {/* Resumo do que será exportado */}
        {!loading && (
          <div className="glass-card p-5 space-y-3">
            <h3 className="section-title">Dados a exportar</h3>
            <div className="grid grid-cols-3 gap-3">
              {[
                { label: 'Transações', value: filtered.length, suffix: '' },
                { label: 'Receitas', value: fmt(totalReceita), suffix: '' },
                { label: 'Despesas', value: fmt(totalDespesa), suffix: '' },
              ].map(c => (
                <div key={c.label} className="bg-secondary/40 rounded-xl p-3 text-center">
                  <p className="text-xs text-muted-foreground mb-1">{c.label}</p>
                  <p className="text-sm font-bold text-foreground">{c.value}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Botões de exportação */}
        <div className="space-y-3">
          <button
            onClick={exportPDF}
            disabled={!!exporting || filtered.length === 0}
            className={`w-full flex items-center justify-center gap-3 px-5 py-4 rounded-2xl font-semibold text-sm transition-all ${
              done === 'pdf' ? 'bg-emerald-500/15 text-emerald-600 border border-emerald-500/20' : 'btn-primary'
            }`}
          >
            {exporting === 'pdf' ? <Loader2 size={18} className="animate-spin" /> :
             done === 'pdf' ? <CheckCircle2 size={18} /> : <FileText size={18} />}
            {exporting === 'pdf' ? 'Gerando PDF...' : done === 'pdf' ? 'PDF gerado!' : 'Exportar como PDF'}
          </button>

          <button
            onClick={exportCSV}
            disabled={!!exporting || filtered.length === 0}
            className={`w-full flex items-center justify-center gap-3 px-5 py-4 rounded-2xl font-semibold text-sm transition-all border ${
              done === 'csv'
                ? 'bg-emerald-500/15 text-emerald-600 border-emerald-500/20'
                : 'btn-secondary border-border'
            }`}
          >
            {exporting === 'csv' ? <Loader2 size={18} className="animate-spin" /> :
             done === 'csv' ? <CheckCircle2 size={18} /> : <FileSpreadsheet size={18} />}
            {exporting === 'csv' ? 'Gerando CSV...' : done === 'csv' ? 'CSV baixado!' : 'Exportar como CSV (Excel)'}
          </button>
        </div>

        {filtered.length === 0 && !loading && (
          <div className="glass-card p-10 text-center text-muted-foreground">
            <Download size={28} className="mx-auto mb-2 opacity-30" />
            <p className="text-sm font-medium">Nenhuma transação para exportar</p>
          </div>
        )}
      </div>
    </PageShell>
  )
}
