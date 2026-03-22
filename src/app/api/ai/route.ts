export const runtime = 'edge'

export async function POST(req: Request) {
  try {
    const { prompt, context } = await req.json()
    if (!prompt) return Response.json({ error: 'Prompt obrigatório' }, { status: 400 })

    const apiKey = process.env.GEMINI_API_KEY
    if (!apiKey) return Response.json({ error: 'Chave Gemini não configurada' }, { status: 500 })

    const systemPrompt = `Você é um assistente financeiro pessoal integrado a um app brasileiro.

Dados do usuário:
- Mês: ${context?.monthYear || new Date().toLocaleDateString('pt-BR',{month:'long',year:'numeric'})}
- Receitas: R$ ${Number(context?.totalIncome||0).toLocaleString('pt-BR',{minimumFractionDigits:2})}
- Despesas: R$ ${Number(context?.totalExpenses||0).toLocaleString('pt-BR',{minimumFractionDigits:2})}
- Saldo: R$ ${Number(context?.balance||0).toLocaleString('pt-BR',{minimumFractionDigits:2})}
- Transações: ${JSON.stringify(context?.transactions||[])}

Responda em português BR, seja direto (3-4 linhas), use dados reais, 1-2 emojis.
Pergunta: "${prompt}"
Resposta:`

    // Tenta modelos em ordem — usa v1 para gemini-pro, v1beta para outros
    const attempts = [
      { url: `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}` },
      { url: `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-lite:generateContent?key=${apiKey}` },
      { url: `https://generativelanguage.googleapis.com/v1/models/gemini-pro:generateContent?key=${apiKey}` },
      { url: `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-pro:generateContent?key=${apiKey}` },
    ]

    const body = JSON.stringify({
      contents: [{ parts: [{ text: systemPrompt }] }],
      generationConfig: { temperature: 0.3, maxOutputTokens: 512 },
    })

    for (const attempt of attempts) {
      const res = await fetch(attempt.url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body,
      })

      if (res.ok) {
        const data = await res.json()
        const answer = data?.candidates?.[0]?.content?.parts?.[0]?.text?.trim()
          || 'Não consegui gerar uma resposta.'
        return Response.json({ answer })
      }

      const errText = await res.text()
      console.error(`Gemini ${attempt.url.split('/models/')[1]?.split(':')[0]}: ${res.status}`, errText.slice(0, 150))

      if (res.status === 403 || res.status === 401) {
        return Response.json({ error: 'Chave de API inválida. Verifique GEMINI_API_KEY no Vercel.' }, { status: 500 })
      }
    }

    return Response.json({ error: 'Todos os modelos Gemini falharam. Tente novamente em breve.' }, { status: 500 })
  } catch (e: any) {
    console.error('AI Route Error:', e)
    return Response.json({ error: 'Erro interno' }, { status: 500 })
  }
}
