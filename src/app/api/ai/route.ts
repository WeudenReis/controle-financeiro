export const runtime = 'edge'

const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent'

export async function POST(req: Request) {
  try {
    const { prompt, context } = await req.json()
    if (!prompt) {
      return Response.json({ error: 'Prompt é obrigatório' }, { status: 400 })
    }

    const apiKey = process.env.GEMINI_API_KEY
    if (!apiKey) {
      return Response.json({ error: 'GEMINI_API_KEY não configurada.' }, { status: 500 })
    }

    const fullPrompt = `Você é um assistente financeiro pessoal inteligente e amigável integrado a um app de controle de finanças brasileiro.

Contexto financeiro atual do usuário:
- Mês: ${context?.monthYear || 'Não informado'}
- Receitas totais: R$ ${Number(context?.totalIncome || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
- Despesas totais: R$ ${Number(context?.totalExpenses || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
- Saldo disponível: R$ ${Number(context?.balance || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
- Total de transações: ${context?.transactions?.length || 0}

Transações detalhadas (JSON):
${JSON.stringify(context?.transactions || [], null, 2)}

Diretrizes:
- Responda em português brasileiro, de forma clara e objetiva
- Use valores reais das transações acima — nunca invente números
- Seja direto: máximo 3-4 linhas por resposta
- Use emojis com moderação (1-2 por resposta)
- Se perguntar sobre gastos: some os valores do JSON e mostre o total exato
- Dê dicas práticas quando relevante
- Trate o usuário de forma próxima e amigável

Pergunta: "${prompt}"

Resposta:`

    const res = await fetch(`${GEMINI_API_URL}?key=${apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: fullPrompt }] }],
        generationConfig: {
          temperature: 0.3,
          maxOutputTokens: 512,
          topP: 0.8,
        },
        safetySettings: [
          { category: 'HARM_CATEGORY_HARASSMENT',        threshold: 'BLOCK_NONE' },
          { category: 'HARM_CATEGORY_HATE_SPEECH',       threshold: 'BLOCK_NONE' },
          { category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT', threshold: 'BLOCK_NONE' },
          { category: 'HARM_CATEGORY_DANGEROUS_CONTENT', threshold: 'BLOCK_NONE' },
        ],
      }),
    })

    if (!res.ok) {
      const errBody = await res.text()
      console.error('Gemini API error:', res.status, errBody)
      return Response.json({ error: `Gemini API error: ${res.status}` }, { status: 500 })
    }

    const data = await res.json()
    const answer = data?.candidates?.[0]?.content?.parts?.[0]?.text?.trim()
      || 'Não consegui gerar uma resposta. Tente novamente.'

    return Response.json({ answer })
  } catch (error: any) {
    console.error('AI Route Error:', error)
    return Response.json({ error: 'Erro interno ao processar a IA.' }, { status: 500 })
  }
}
