export const runtime = 'edge'

export async function POST(req: Request) {
  try {
    const { prompt, context } = await req.json()
    if (!prompt) return Response.json({ error: 'Prompt obrigatório' }, { status: 400 })

    const apiKey = process.env.GEMINI_API_KEY
    if (!apiKey) return Response.json({ error: 'Chave Gemini não configurada' }, { status: 500 })

    // Tenta gemini-2.0-flash primeiro, fallback para gemini-1.5-flash
    const models = [
      'gemini-2.0-flash',
      'gemini-1.5-flash-latest',
      'gemini-1.5-flash',
    ]

    const systemPrompt = `Você é um assistente financeiro pessoal inteligente integrado a um app brasileiro.

Dados financeiros do usuário:
- Mês: ${context?.monthYear || new Date().toLocaleDateString('pt-BR',{month:'long',year:'numeric'})}
- Receitas: R$ ${Number(context?.totalIncome||0).toLocaleString('pt-BR',{minimumFractionDigits:2})}
- Despesas: R$ ${Number(context?.totalExpenses||0).toLocaleString('pt-BR',{minimumFractionDigits:2})}
- Saldo: R$ ${Number(context?.balance||0).toLocaleString('pt-BR',{minimumFractionDigits:2})}
- Transações: ${JSON.stringify(context?.transactions||[])}

Regras: responda em português BR, seja direto (3-4 linhas), use os dados reais, 1-2 emojis.
Pergunta: "${prompt}"
Resposta:`

    let lastError = ''
    for (const model of models) {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: systemPrompt }] }],
          generationConfig: { temperature: 0.3, maxOutputTokens: 512 },
        }),
      })

      if (res.ok) {
        const data = await res.json()
        const answer = data?.candidates?.[0]?.content?.parts?.[0]?.text?.trim()
          || 'Não consegui gerar uma resposta.'
        return Response.json({ answer })
      }

      const errText = await res.text()
      lastError = `${model}: ${res.status} ${errText.slice(0,200)}`
      console.error('Gemini error:', lastError)

      // 403 em todos = chave inválida, não adianta tentar outros modelos
      if (res.status === 403) break
    }

    return Response.json({ error: `Gemini indisponível: ${lastError}` }, { status: 500 })
  } catch (e: any) {
    console.error('AI Route Error:', e)
    return Response.json({ error: 'Erro interno' }, { status: 500 })
  }
}
