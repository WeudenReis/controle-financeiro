-- Supabase RLS policies to support the app behavior
-- Run these statements in Supabase SQL editor (Project -> SQL editor -> New query)

-- 1) Profiles: allow users to insert/update/select only their own row
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Select
CREATE POLICY "profiles_select_own" ON public.profiles
  FOR SELECT
  USING (auth.uid() = id);

-- Insert
CREATE POLICY "profiles_insert_own" ON public.profiles
  FOR INSERT
  WITH CHECK (auth.uid() = id);

-- Update
CREATE POLICY "profiles_update_own" ON public.profiles
  FOR UPDATE
  USING (auth.uid() = id);

-- 2) Transactions: allow users to insert/select/delete only their own transactions
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "transactions_select_own" ON public.transactions
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "transactions_insert_own" ON public.transactions
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "transactions_delete_own" ON public.transactions
  FOR DELETE
  USING (auth.uid() = user_id);

-- 3) Optional: group_members table (if you use it for shared groups)
ALTER TABLE public.group_members ENABLE ROW LEVEL SECURITY;

CREATE POLICY "group_members_select_own" ON public.group_members
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "group_members_insert_own" ON public.group_members
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "group_members_update_own" ON public.group_members
  FOR UPDATE
  USING (auth.uid() = user_id);

-- 4) Optional: groups table (if needed)
ALTER TABLE public.groups ENABLE ROW LEVEL SECURITY;

CREATE POLICY "groups_select_all" ON public.groups
  FOR SELECT
  USING (true);
