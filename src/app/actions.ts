'use server'
import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function addTransaction(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Usuário não autenticado.' }

  const payload = {
    description: formData.get('description') as string,
    amount: parseFloat(formData.get('amount') as string),
    type: formData.get('type') as string,
    category: formData.get('category') as string,
    status: formData.get('status') as string || 'pendente',
    notes: formData.get('notes') as string || null,
    is_recurring: formData.get('is_recurring') === 'true',
    date: formData.get('date') as string,
    user_id: user.id,
  }

  const { data, error } = await supabase.from('transactions').insert(payload).select().single()
  if (error) return { error: error.message }

  revalidatePath('/dashboard')
  return { success: true, data }
}

export async function deleteTransaction(id: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Não autenticado.' }

  const { error } = await supabase.from('transactions').delete().eq('id', id).eq('user_id', user.id)
  if (error) return { error: error.message }

  revalidatePath('/dashboard')
  return { success: true }
}

export async function updateProfile(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Não autenticado.' }

  const fullName = (formData.get('full_name') as string)?.trim()
  const monthlyIncome = parseFloat(formData.get('monthly_income') as string)

  if (!fullName) return { error: 'Nome inválido.' }
  if (isNaN(monthlyIncome) || monthlyIncome < 0) return { error: 'Renda mensal inválida.' }

  const { error } = await supabase
    .from('profiles')
    .upsert({ id: user.id, full_name: fullName, monthly_income: monthlyIncome }, { onConflict: 'id' })

  if (error) return { error: error.message }

  revalidatePath('/settings')
  return { success: true }
}

export async function shareWithPartner(partnerEmail: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Não autenticado.' }

  // Busca o perfil do parceiro pelo email
  const { data: partner, error: partnerErr } = await supabase
    .from('profiles')
    .select('*')
    .eq('email', partnerEmail.trim().toLowerCase())
    .single()

  if (partnerErr || !partner) return { error: 'Parceiro(a) não encontrado. Verifique se o e-mail está correto e se a pessoa já fez login no app.' }
  if (partner.id === user.id) return { error: 'Você não pode compartilhar consigo mesmo.' }

  // Verifica se já existe um grupo para este usuário
  const { data: myProfile } = await supabase.from('profiles').select('*').eq('id', user.id).single()
  let groupId = myProfile?.group_id || partner?.group_id

  if (!groupId) {
    // Cria novo grupo
    const { data: group, error: groupErr } = await supabase
      .from('groups')
      .insert({ name: `${myProfile?.full_name || 'Família'}` })
      .select()
      .single()
    if (groupErr || !group) return { error: 'Erro ao criar grupo compartilhado.' }
    groupId = group.id
  }

  // Atualiza ambos os perfis com o group_id
  const [r1, r2] = await Promise.all([
    supabase.from('profiles').upsert({ id: user.id, group_id: groupId }, { onConflict: 'id' }),
    supabase.from('profiles').upsert({ id: partner.id, group_id: groupId }, { onConflict: 'id' }),
  ])
  if (r1.error) return { error: r1.error.message }
  if (r2.error) return { error: r2.error.message }

  // Adiciona membros à tabela group_members (upsert para evitar duplicatas)
  const { error: membersErr } = await supabase.from('group_members').upsert([
    { group_id: groupId, user_id: user.id, role: 'owner' },
    { group_id: groupId, user_id: partner.id, role: 'member' },
  ], { onConflict: 'group_id,user_id' })

  if (membersErr) return { error: membersErr.message }

  revalidatePath('/settings')
  return { success: true }
}
