export const runtime = 'edge'

const SUPABASE_URL = 'https://ldabhklgrsnhdqchgpdy.supabase.co'
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxkYWJoa2xncnNuaGRxY2hncGR5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA4MzkyMzQsImV4cCI6MjA4NjQxNTIzNH0.Y5FvD9mTnIeNIoJJoqRW3CAl2fXYWWKfnpYJ4VyHmr4'

export async function POST(req: Request) {
  try {
    const body = await req.json()

    const res = await fetch(`${SUPABASE_URL}/functions/v1/ai-chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        'apikey': SUPABASE_ANON_KEY,
      },
      body: JSON.stringify(body),
    })

    const data = await res.json()
    return Response.json(data, { status: res.status })
  } catch (e: any) {
    return Response.json({ error: 'Erro ao conectar com IA' }, { status: 500 })
  }
}
