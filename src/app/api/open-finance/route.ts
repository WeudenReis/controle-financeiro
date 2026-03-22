import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function GET() {
  return NextResponse.json({
    status: "success",
    message: "Open Finance API Endpoint exists. Ready for provider Webhook integration.",
    theoreticalArchitecture:
      "1. Connect Widget -> 2. Auth -> 3. Webhook receives itemId -> 4. Fetch Transactions -> 5. Insert to Supabase Postgres",
  })
}

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}))
  const bankCode = String(body?.bankCode || body?.code || "").trim()

  if (!bankCode) {
    return NextResponse.json({ error: "bankCode is required" }, { status: 400 })
  }

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const bankResponse = await fetch(`https://brasilapi.com.br/api/banks/v1/${bankCode}`)
  if (!bankResponse.ok) {
    return NextResponse.json({ error: "Bank not found" }, { status: bankResponse.status })
  }

  const bank = await bankResponse.json()

  // Gera transações de exemplo para o mês atual (simulação)
  const now = new Date()
  const year = now.getFullYear()
  const month = now.getMonth()

  const categories = [
    "Alimentação",
    "Transporte",
    "Lazer",
    "Saúde",
    "Moradia",
    "Educação",
    "Supermercado",
    "Investimentos",
  ]

  const randomDate = () => {
    const day = Math.floor(Math.random() * 28) + 1
    return new Date(year, month, day)
  }

  const randomAmount = (min: number, max: number) => {
    return Number((Math.random() * (max - min) + min).toFixed(2))
  }

  const transactions = Array.from({ length: 20 }, (_, index) => {
    const type = Math.random() < 0.7 ? "despesa" : "receita"
    const category = type === "receita" ? "Salário" : categories[index % categories.length]
    const amount = type === "receita" ? randomAmount(500, 6500) : randomAmount(20, 650)

    return {
      description: `${type === "receita" ? "Recebimento" : "Compra"} - ${bank.name}`,
      amount,
      type,
      category,
      status: "pago",
      notes: "Importado via Open Finance (simulação)",
      is_recurring: false,
      date: randomDate().toISOString().split("T")[0],
      user_id: user.id,
    }
  })

  const { data: inserted, error } = await supabase
    .from("transactions")
    .insert(transactions)
    .select()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({
    status: "success",
    inserted: inserted?.length ?? 0,
    bank,
  })
}
