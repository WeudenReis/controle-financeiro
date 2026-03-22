import { createClient } from './client';
import { Transaction } from '../../types/finance';

export async function getFilteredTransactions(filters: {
  category?: string;
  status?: string;
  startDate?: string;
  endDate?: string;
}) {
  const supabase = createClient();
  
  let query = supabase
    .from('transactions')
    .select('*')
    .order('date', { ascending: false });

  if (filters.category) {
    query = query.eq('category', filters.category);
  }
  
  if (filters.status) {
    query = query.eq('status', filters.status);
  }

  if (filters.startDate && filters.endDate) {
    query = query.gte('date', filters.startDate).lte('date', filters.endDate);
  }

  const { data, error } = await query;
  
  if (error) throw error;
  return data as Transaction[];
}