import jsPDF from 'jspdf'

const fmt = (v: number) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })

export function generatePDF(transactions: any[], profile: any) {
  const doc  = new jsPDF()
  const now  = new Date()
  const mes  = now.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })
  const nome = profile?.full_name || profile?.name || 'Usuário'

  // ── Background header ──
  doc.setFillColor(15, 23, 42)
  doc.rect(0, 0, 210, 48, 'F')

  // Barra colorida esquerda
  doc.setFillColor(45, 212, 191)
  doc.rect(0, 0, 4, 48, 'F')

  // Título
  doc.setTextColor(255, 255, 255)
  doc.setFontSize(22)
  doc.setFont('helvetica', 'bold')
  doc.text('Relatório Financeiro', 12, 22)
  doc.setFontSize(11)
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(148, 163, 184)
  doc.text(mes.charAt(0).toUpperCase() + mes.slice(1), 12, 32)
  doc.text(nome, 12, 41)

  // Data geração
  doc.setFontSize(9)
  doc.setTextColor(100, 116, 139)
  doc.text(`Gerado em ${now.toLocaleDateString('pt-BR')} às ${now.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`, 198, 41, { align: 'right' })

  // ── Métricas ──
  const receitas = transactions.filter(t => t.type === 'receita').reduce((a, t) => a + Number(t.amount), 0)
  const despesas = transactions.filter(t => t.type === 'despesa').reduce((a, t) => a + Number(t.amount), 0)
  const saldo    = receitas - despesas

  const cards = [
    { label: 'RECEITAS', value: fmt(receitas), color: [16, 185, 129] as [number,number,number] },
    { label: 'DESPESAS', value: fmt(despesas), color: [239, 68,  68 ] as [number,number,number] },
    { label: 'SALDO',    value: fmt(saldo),    color: saldo >= 0 ? [45, 212, 191] as [number,number,number] : [239, 68, 68] as [number,number,number] },
  ]

  cards.forEach((card, i) => {
    const x = 12 + i * 64
    doc.setFillColor(248, 250, 252)
    doc.roundedRect(x, 54, 60, 28, 3, 3, 'F')
    doc.setFillColor(...card.color)
    doc.roundedRect(x, 54, 3, 28, 1, 1, 'F')
    doc.setFontSize(7)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(100, 116, 139)
    doc.text(card.label, x + 7, 62)
    doc.setFontSize(11)
    doc.setTextColor(...card.color)
    doc.text(card.value, x + 7, 73)
  })

  // ── Tabela de transações ──
  const startY = 90
  doc.setFillColor(15, 23, 42)
  doc.rect(12, startY, 186, 8, 'F')
  doc.setTextColor(255, 255, 255)
  doc.setFontSize(8)
  doc.setFont('helvetica', 'bold')
  doc.text('DESCRIÇÃO',  15, startY + 5.5)
  doc.text('CATEGORIA',  72, startY + 5.5)
  doc.text('STATUS',    115, startY + 5.5)
  doc.text('DATA',      143, startY + 5.5)
  doc.text('VALOR',     196, startY + 5.5, { align: 'right' })

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(8.5)
  let y = startY + 14

  transactions.forEach((t, i) => {
    if (y > 272) { doc.addPage(); y = 20 }

    if (i % 2 === 0) {
      doc.setFillColor(248, 250, 252)
      doc.rect(12, y - 5, 186, 9, 'F')
    }

    doc.setTextColor(30, 41, 59)
    doc.text((t.description || '').substring(0, 30), 15, y)
    doc.text((t.category   || '').substring(0, 18), 72, y)

    const statusColor: [number,number,number] = t.status === 'pago' ? [16,185,129] : t.status === 'agendado' ? [59,130,246] : [245,158,11]
    doc.setTextColor(...statusColor)
    doc.text(t.status || '', 115, y)

    doc.setTextColor(100, 116, 139)
    doc.text(new Date(t.date + 'T12:00:00').toLocaleDateString('pt-BR'), 143, y)

    const amtColor: [number,number,number] = t.type === 'receita' ? [16,185,129] : [239,68,68]
    doc.setTextColor(...amtColor)
    doc.text(`${t.type==='receita'?'+':'-'} ${fmt(Number(t.amount))}`, 198, y, { align: 'right' })

    y += 9
  })

  // ── Rodapé ──
  const pages = (doc as any).internal.getNumberOfPages()
  for (let p = 1; p <= pages; p++) {
    doc.setPage(p)
    doc.setFillColor(15, 23, 42)
    doc.rect(0, 285, 210, 12, 'F')
    doc.setFontSize(7)
    doc.setTextColor(100, 116, 139)
    doc.text('Finanças App — Relatório gerado automaticamente', 12, 292)
    doc.text(`Pág. ${p}/${pages}`, 198, 292, { align: 'right' })
  }

  doc.save(`relatorio-financeiro-${now.getMonth()+1}-${now.getFullYear()}.pdf`)
}
