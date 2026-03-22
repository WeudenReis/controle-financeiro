export type TransactionStatus = 'pago' | 'pendente' | 'agendado';
export type TransactionType = 'receita' | 'despesa';
export type GroupRole = 'owner' | 'member';

export interface Transaction {
  id: string;
  user_id: string;
  description: string;
  amount: number;
  category: string;
  status: TransactionStatus;
  type: TransactionType;
  date: string;
  is_recurring: boolean;
  notes?: string;
  created_at: string;
}

export interface Profile {
  id: string;
  full_name: string;
  avatar_url: string;
  monthly_income: number;
  email: string;
  created_at: string;
  group_id?: string;
  partner_id?: string;
}

export interface Group {
  id: string;
  name: string;
  created_at: string;
}

export interface GroupMember {
  id: string;
  group_id: string;
  user_id: string;
  role: GroupRole;
  joined_at: string;
}
