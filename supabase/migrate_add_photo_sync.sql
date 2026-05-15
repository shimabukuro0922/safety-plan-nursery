-- =====================================================
-- マイグレーション：写真イベント・写真メタデータテーブルを追加
-- Supabase ダッシュボード → SQL Editor で実行してください
-- =====================================================

-- 写真イベント（運動会・遠足など）
create table if not exists public.photo_events (
  id text primary key,
  facility_id uuid not null references public.facilities(id) on delete cascade,
  name text not null,
  date text not null,
  class_name text not null default '',
  notes text not null default '',
  created_at timestamptz default now()
);

-- 写真メタデータ（承認状態・タグ・NGフラグ等）
create table if not exists public.photo_meta (
  id text primary key,
  facility_id uuid not null references public.facilities(id) on delete cascade,
  event_id text not null references public.photo_events(id) on delete cascade,
  filename text not null,
  taken_at text not null,
  tagged_child_ids jsonb not null default '[]',
  has_ng_child boolean not null default false,
  status text not null default 'pending',
  rejected_reason text,
  thumbnail_data_url text not null default '',
  storage_url text,
  uploaded_at text not null
);

-- インデックス（施設ごとの取得を高速化）
create index if not exists photo_events_facility_idx on public.photo_events(facility_id);
create index if not exists photo_meta_facility_idx on public.photo_meta(facility_id);
create index if not exists photo_meta_event_idx on public.photo_meta(event_id);

-- Row Level Security を有効化
alter table public.photo_events enable row level security;
alter table public.photo_meta enable row level security;

-- anon キーで全操作を許可（施設コード = アプリレベルのアクセス制御）
create policy "allow_all" on public.photo_events for all using (true) with check (true);
create policy "allow_all" on public.photo_meta for all using (true) with check (true);
