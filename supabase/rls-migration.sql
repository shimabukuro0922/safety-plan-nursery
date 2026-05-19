-- ============================================================
-- RLS セキュリティ強化マイグレーション
-- ============================================================
--
-- 目的:
--   allow_all ポリシー（全施設のデータを誰でも読み書き可能）を廃止し、
--   JWT クレームの facility_id で施設単位のアクセス制御を実現する。
--
-- 事前準備（Vercel Dashboard > Settings > Environment Variables）:
--   1. SUPABASE_URL       = https://xxxxxxxx.supabase.co
--   2. SUPABASE_ANON_KEY  = （Supabase Dashboard > Settings > API > Project API Keys > anon public）
--   3. SUPABASE_JWT_SECRET = （Supabase Dashboard > Settings > API > JWT Settings > JWT Secret）
--
-- このファイルを適用する手順:
--   Supabase Dashboard > SQL Editor で下記 SQL を実行する。
--
-- ============================================================

-- Step 1: 既存の allow_all ポリシーを削除
-- （facilities は施設コード検索・新規登録で匿名アクセスが必要なため allow_all を維持）
drop policy if exists "allow_all" on public.near_misses;
drop policy if exists "allow_all" on public.nap_checks;
drop policy if exists "allow_all" on public.staff_training;
drop policy if exists "allow_all" on public.checklist_done;
drop policy if exists "allow_all" on public.checklist_items;
drop policy if exists "allow_all" on public.children;
drop policy if exists "allow_all" on public.photo_events;
drop policy if exists "allow_all" on public.photo_meta;
drop policy if exists "allow_all" on public.seasonal_checklist_done;
drop policy if exists "allow_all" on public.annual_plans;

-- Step 2: JWT クレームの facility_id に基づくポリシーを作成
-- JWT には { "facility_id": "<uuid>", "role": "anon" } が含まれる

create policy "facility_owner" on public.near_misses
  for all
  using  (facility_id = (auth.jwt() ->> 'facility_id')::uuid)
  with check (facility_id = (auth.jwt() ->> 'facility_id')::uuid);

create policy "facility_owner" on public.nap_checks
  for all
  using  (facility_id = (auth.jwt() ->> 'facility_id')::uuid)
  with check (facility_id = (auth.jwt() ->> 'facility_id')::uuid);

create policy "facility_owner" on public.staff_training
  for all
  using  (facility_id = (auth.jwt() ->> 'facility_id')::uuid)
  with check (facility_id = (auth.jwt() ->> 'facility_id')::uuid);

create policy "facility_owner" on public.checklist_done
  for all
  using  (facility_id = (auth.jwt() ->> 'facility_id')::uuid)
  with check (facility_id = (auth.jwt() ->> 'facility_id')::uuid);

create policy "facility_owner" on public.checklist_items
  for all
  using  (facility_id = (auth.jwt() ->> 'facility_id')::uuid)
  with check (facility_id = (auth.jwt() ->> 'facility_id')::uuid);

create policy "facility_owner" on public.children
  for all
  using  (facility_id = (auth.jwt() ->> 'facility_id')::uuid)
  with check (facility_id = (auth.jwt() ->> 'facility_id')::uuid);

create policy "facility_owner" on public.photo_events
  for all
  using  (facility_id = (auth.jwt() ->> 'facility_id')::uuid)
  with check (facility_id = (auth.jwt() ->> 'facility_id')::uuid);

create policy "facility_owner" on public.photo_meta
  for all
  using  (facility_id = (auth.jwt() ->> 'facility_id')::uuid)
  with check (facility_id = (auth.jwt() ->> 'facility_id')::uuid);

create policy "facility_owner" on public.seasonal_checklist_done
  for all
  using  (facility_id = (auth.jwt() ->> 'facility_id')::uuid)
  with check (facility_id = (auth.jwt() ->> 'facility_id')::uuid);

create policy "facility_owner" on public.annual_plans
  for all
  using  (facility_id = (auth.jwt() ->> 'facility_id')::uuid)
  with check (facility_id = (auth.jwt() ->> 'facility_id')::uuid);

-- ============================================================
-- 確認クエリ（適用後に実行）
-- ============================================================
-- select tablename, policyname, cmd, qual
-- from pg_policies
-- where schemaname = 'public'
-- order by tablename;
