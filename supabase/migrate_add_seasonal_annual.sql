-- =====================================================
-- マイグレーション：季節前チェックリスト・年間計画テーブルを追加
-- Supabase ダッシュボード → SQL Editor で実行してください
-- （既存のDBに追加する場合はこちらを使用）
-- =====================================================

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

-- Row Level Security を有効化
alter table public.seasonal_checklist_done enable row level security;
alter table public.annual_plans enable row level security;

-- anon キーで全操作を許可（施設コード = アプリレベルのアクセス制御）
create policy "allow_all" on public.seasonal_checklist_done for all using (true) with check (true);
create policy "allow_all" on public.annual_plans for all using (true) with check (true);
