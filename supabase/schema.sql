-- =====================================================
-- 安全計画アプリ Supabase スキーマ
-- Supabase ダッシュボード → SQL Editor で実行してください
-- =====================================================

-- 施設テーブル（施設コード発行）
create table if not exists public.facilities (
  id uuid primary key default gen_random_uuid(),
  code text unique not null,
  name text not null,
  director_name text,
  phone text,
  created_at timestamptz default now()
);

-- ヒヤリハット
create table if not exists public.near_misses (
  id text primary key,
  facility_id uuid not null references public.facilities(id) on delete cascade,
  occurred_at text not null,
  scene text not null,
  what_happened text not null,
  why_it_happened text,
  what_to_change text,
  shared_with text,
  recheck_date text,
  step text not null default 'occurred',
  created_by text not null,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- 午睡見守り記録
create table if not exists public.nap_checks (
  id text primary key,
  facility_id uuid not null references public.facilities(id) on delete cascade,
  date text not null,
  checked_at text not null,
  checked_by text not null
);

-- 職員研修・資格管理
create table if not exists public.staff_training (
  id text primary key,
  facility_id uuid not null references public.facilities(id) on delete cascade,
  staff_name text not null,
  training_type text not null,
  completed_date text not null,
  expiry_date text,
  notes text,
  created_at timestamptz default now()
);

-- 月次チェック実施済み
create table if not exists public.checklist_done (
  facility_id uuid not null references public.facilities(id) on delete cascade,
  item_id text not null,
  done_at text not null,
  done_by text not null,
  notes text,
  last_marked_month text,
  primary key (facility_id, item_id)
);

-- 月次チェック項目定義
create table if not exists public.checklist_items (
  id text not null,
  facility_id uuid not null references public.facilities(id) on delete cascade,
  category_name text not null,
  title text not null,
  description text not null,
  primary key (facility_id, id)
);

-- 季節前チェックリスト 実施済み
create table if not exists public.seasonal_checklist_done (
  facility_id uuid not null references public.facilities(id) on delete cascade,
  item_key text not null,
  done_at text not null,
  done_by text not null,
  primary key (facility_id, item_key)
);

-- 年間安全カレンダー（月別）
create table if not exists public.annual_plans (
  facility_id uuid not null references public.facilities(id) on delete cascade,
  month integer not null check (month between 1 and 12),
  themes jsonb not null default '[]',
  high_risk jsonb not null default '[]',
  updated_at timestamptz default now(),
  primary key (facility_id, month)
);

-- 園児
create table if not exists public.children (
  id text primary key,
  facility_id uuid not null references public.facilities(id) on delete cascade,
  name text not null,
  class_name text not null,
  is_photo_ng boolean default false,
  ng_reason text,
  created_at timestamptz default now()
);

-- =====================================================
-- Row Level Security（施設コードがアクセス制御）
-- =====================================================
alter table public.facilities enable row level security;
alter table public.near_misses enable row level security;
alter table public.nap_checks enable row level security;
alter table public.staff_training enable row level security;
alter table public.checklist_done enable row level security;
alter table public.checklist_items enable row level security;
alter table public.children enable row level security;
alter table public.seasonal_checklist_done enable row level security;
alter table public.annual_plans enable row level security;

-- anon キーで全操作を許可（施設コード = アプリレベルのアクセス制御）
create policy "allow_all" on public.facilities for all using (true) with check (true);
create policy "allow_all" on public.near_misses for all using (true) with check (true);
create policy "allow_all" on public.nap_checks for all using (true) with check (true);
create policy "allow_all" on public.staff_training for all using (true) with check (true);
create policy "allow_all" on public.checklist_done for all using (true) with check (true);
create policy "allow_all" on public.checklist_items for all using (true) with check (true);
create policy "allow_all" on public.children for all using (true) with check (true);
create policy "allow_all" on public.seasonal_checklist_done for all using (true) with check (true);
create policy "allow_all" on public.annual_plans for all using (true) with check (true);

-- リアルタイム配信を有効化
alter publication supabase_realtime add table public.nap_checks;
alter publication supabase_realtime add table public.near_misses;
