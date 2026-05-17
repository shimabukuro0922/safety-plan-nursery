-- ============================================================
-- まもりすと：全テーブル RLS 設定
-- Supabase SQL Editor にコピー＆ペーストして実行してください
-- ============================================================

-- ──────────────────────────────
-- facilities
-- ──────────────────────────────
alter table facilities enable row level security;

-- 施設コードでのログイン・新規登録に必要
create policy "anon: facilities select" on facilities
  for select using (true);

create policy "anon: facilities insert" on facilities
  for insert with check (true);

create policy "anon: facilities update" on facilities
  for update using (true);

-- ──────────────────────────────
-- near_misses
-- ──────────────────────────────
alter table near_misses enable row level security;

create policy "anon: near_misses select" on near_misses
  for select using (true);

create policy "anon: near_misses insert" on near_misses
  for insert with check (true);

create policy "anon: near_misses update" on near_misses
  for update using (true);

create policy "anon: near_misses delete" on near_misses
  for delete using (true);

-- ──────────────────────────────
-- nap_checks
-- ──────────────────────────────
alter table nap_checks enable row level security;

create policy "anon: nap_checks select" on nap_checks
  for select using (true);

create policy "anon: nap_checks insert" on nap_checks
  for insert with check (true);

create policy "anon: nap_checks update" on nap_checks
  for update using (true);

create policy "anon: nap_checks delete" on nap_checks
  for delete using (true);

-- ──────────────────────────────
-- staff_training
-- ──────────────────────────────
alter table staff_training enable row level security;

create policy "anon: staff_training select" on staff_training
  for select using (true);

create policy "anon: staff_training insert" on staff_training
  for insert with check (true);

create policy "anon: staff_training update" on staff_training
  for update using (true);

create policy "anon: staff_training delete" on staff_training
  for delete using (true);

-- ──────────────────────────────
-- checklist_done
-- ──────────────────────────────
alter table checklist_done enable row level security;

create policy "anon: checklist_done select" on checklist_done
  for select using (true);

create policy "anon: checklist_done insert" on checklist_done
  for insert with check (true);

create policy "anon: checklist_done update" on checklist_done
  for update using (true);

create policy "anon: checklist_done delete" on checklist_done
  for delete using (true);

-- ──────────────────────────────
-- checklist_items
-- ──────────────────────────────
alter table checklist_items enable row level security;

create policy "anon: checklist_items select" on checklist_items
  for select using (true);

create policy "anon: checklist_items insert" on checklist_items
  for insert with check (true);

create policy "anon: checklist_items update" on checklist_items
  for update using (true);

create policy "anon: checklist_items delete" on checklist_items
  for delete using (true);

-- ──────────────────────────────
-- seasonal_checklist_done
-- ──────────────────────────────
alter table seasonal_checklist_done enable row level security;

create policy "anon: seasonal_checklist_done select" on seasonal_checklist_done
  for select using (true);

create policy "anon: seasonal_checklist_done insert" on seasonal_checklist_done
  for insert with check (true);

create policy "anon: seasonal_checklist_done update" on seasonal_checklist_done
  for update using (true);

create policy "anon: seasonal_checklist_done delete" on seasonal_checklist_done
  for delete using (true);

-- ──────────────────────────────
-- annual_plans
-- ──────────────────────────────
alter table annual_plans enable row level security;

create policy "anon: annual_plans select" on annual_plans
  for select using (true);

create policy "anon: annual_plans insert" on annual_plans
  for insert with check (true);

create policy "anon: annual_plans update" on annual_plans
  for update using (true);

create policy "anon: annual_plans delete" on annual_plans
  for delete using (true);

-- ──────────────────────────────
-- children
-- ──────────────────────────────
alter table children enable row level security;

create policy "anon: children select" on children
  for select using (true);

create policy "anon: children insert" on children
  for insert with check (true);

create policy "anon: children update" on children
  for update using (true);

create policy "anon: children delete" on children
  for delete using (true);

-- ──────────────────────────────
-- photo_events
-- ──────────────────────────────
alter table photo_events enable row level security;

create policy "anon: photo_events select" on photo_events
  for select using (true);

create policy "anon: photo_events insert" on photo_events
  for insert with check (true);

create policy "anon: photo_events update" on photo_events
  for update using (true);

create policy "anon: photo_events delete" on photo_events
  for delete using (true);

-- ──────────────────────────────
-- photo_meta
-- ──────────────────────────────
alter table photo_meta enable row level security;

create policy "anon: photo_meta select" on photo_meta
  for select using (true);

create policy "anon: photo_meta insert" on photo_meta
  for insert with check (true);

create policy "anon: photo_meta update" on photo_meta
  for update using (true);

create policy "anon: photo_meta delete" on photo_meta
  for delete using (true);
