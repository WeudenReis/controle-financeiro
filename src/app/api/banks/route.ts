import { NextResponse } from "next/server"

export async function GET() {
  const response = await fetch("https://brasilapi.com.br/api/banks/v1")

  if (!response.ok) {
    return NextResponse.json({ error: 'Failed to fetch banks from Brasil API' }, { status: response.status })
  }

  const banks = await response.json()
  return NextResponse.json(banks)
}
