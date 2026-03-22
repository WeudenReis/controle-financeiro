/**
 * Utilitário genérico para integração com IA
 * Abstrai o provedor (OpenAI, Claude, etc.)
 * Mude apenas a implementação em /api/ai sem afetar o resto da app
 */

export interface AIPromptContext {
  totalIncome?: number
  totalExpenses?: number
  balance?: number
  transactions?: Array<{ description: string; amount: number; type: string; date: string }>
  monthYear?: string
}

export async function askAI(
  prompt: string,
  context?: AIPromptContext
): Promise<string> {
  try {
    const res = await fetch('/api/ai', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ prompt, context })
    })

    if (!res.ok) throw new Error(`AI API error: ${res.status}`)

    const { answer } = await res.json()
    return answer
  } catch (error) {
    console.error('Erro na IA:', error)
    // Retorna uma mensagem mais útil para debug em desenvolvimento
    return 'O sistema de IA está indisponível no momento. Verifique o console para mais detalhes.'
  }
}

export async function getFinancialInsights(
  context: AIPromptContext
): Promise<string> {
  const prompt = `Baseado nestas finanças do mês ${context.monthYear}:
- Receita total: R$ ${context.totalIncome}
- Despesas totais: R$ ${context.totalExpenses}
- Saldo: R$ ${context.balance}

Gere 2 dicas curtas (estilo notificação de app) para melhorar minhas finanças baseadas nesses números.`

  return askAI(prompt, context)
}
