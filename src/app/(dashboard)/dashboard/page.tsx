import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import DashboardPremium from './dashboard-premium'

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  // primeiro pega o perfil; ele pode conter group_id
  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  // em seguida busca transações; se o usuário fizer parte de um grupo
  // incluímos todas as transações dos membros. caso contrário, apenas
  // as próprias.
  let transactions: any[] | null = []

  if (profile?.group_id) {
    const { data: members } = await supabase
      .from('group_members')
      .select('user_id')
      .eq('group_id', profile.group_id)

    const ids = members ? members.map((m: any) => m.user_id) : [user.id]

    const { data } = await supabase
      .from('transactions')
      .select('*')
      .in('user_id', ids)
      .order('date', { ascending: false })

    transactions = data
  } else {
    const { data } = await supabase
      .from('transactions')
      .select('*')
      .eq('user_id', user.id)
      .order('date', { ascending: false })

    transactions = data
  }

  return (
    <DashboardPremium
      transactions={transactions || []}
      profile={profile}
      user={user}
    />
  )
}