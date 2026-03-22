import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import TransactionsTableClient from './transactions-table'
import PageShell from '@/components/layout/page-shell'
import { ArrowLeftRight } from 'lucide-react'

export default async function TransactionsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).single()

  let transactions: any[] = []

  if (profile?.group_id) {
    const { data: members } = await supabase.from('group_members').select('user_id').eq('group_id', profile.group_id)
    const ids = members?.map((m: any) => m.user_id) || [user.id]
    const { data } = await supabase.from('transactions').select('*').in('user_id', ids).order('date', { ascending: false })
    transactions = data || []
  } else {
    const { data } = await supabase.from('transactions').select('*').eq('user_id', user.id).order('date', { ascending: false })
    transactions = data || []
  }

  return (
    <PageShell title="Transações" icon={<ArrowLeftRight size={20} className="text-primary" />}>
      <div className="pb-24 md:pb-6">
        <TransactionsTableClient initialData={transactions} />
      </div>
    </PageShell>
  )
}
