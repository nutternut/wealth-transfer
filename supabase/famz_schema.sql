-- =============================================================================
-- Wealth Transfer — Supabase schema (prefix: famz_)
-- วางรันใน Supabase SQL Editor ได้ทั้งไฟล์
-- =============================================================================

create extension if not exists "pgcrypto";

-- -----------------------------------------------------------------------------
-- Helpers: updated_at
-- -----------------------------------------------------------------------------
create or replace function public.famz_set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- -----------------------------------------------------------------------------
-- 1) famz_families — ตระกูล / workspace
-- -----------------------------------------------------------------------------
create table if not exists public.famz_families (
  id uuid primary key default gen_random_uuid(),
  owner_user_id uuid references auth.users (id) on delete set null,
  name text not null,
  note text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists famz_families_owner_user_id_idx
  on public.famz_families (owner_user_id);

drop trigger if exists famz_families_set_updated_at on public.famz_families;
create trigger famz_families_set_updated_at
  before update on public.famz_families
  for each row execute function public.famz_set_updated_at();

-- -----------------------------------------------------------------------------
-- 2) famz_members — สมาชิกในตระกูล
-- -----------------------------------------------------------------------------
create table if not exists public.famz_members (
  id uuid primary key default gen_random_uuid(),
  family_id uuid not null references public.famz_families (id) on delete cascade,
  name text not null,
  short_name text not null,
  relation text check (
    relation is null
    or relation in ('parent', 'spouse', 'child', 'sibling', 'other')
  ),
  avatar_color text,
  avatar_url text,
  sort_order int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists famz_members_family_id_idx
  on public.famz_members (family_id);

drop trigger if exists famz_members_set_updated_at on public.famz_members;
create trigger famz_members_set_updated_at
  before update on public.famz_members
  for each row execute function public.famz_set_updated_at();

-- -----------------------------------------------------------------------------
-- 3) famz_assets — ทรัพย์สิน
-- -----------------------------------------------------------------------------
create table if not exists public.famz_assets (
  id uuid primary key default gen_random_uuid(),
  family_id uuid not null references public.famz_families (id) on delete cascade,
  type text not null check (type in ('finance', 'real_estate', 'business', 'other')),
  name text not null,
  value numeric(18, 2) not null default 0,
  valuation_date text,
  plan text not null default 'undecided'
    check (plan in ('transfer', 'sell', 'keep', 'undecided')),
  documents text not null default 'incomplete'
    check (documents in ('complete', 'incomplete', 'outdated')),
  control_member_id uuid references public.famz_members (id) on delete set null,
  notes text,
  owner_entity_kind text check (
    owner_entity_kind is null
    or owner_entity_kind in ('individual', 'juristic')
  ),
  heir_count int,
  recipient_relation text check (
    recipient_relation is null
    or recipient_relation in ('spouse', 'lineal_descendant', 'ascendant', 'other')
  ),
  -- realEstate / share / otherDetails จากแอป
  details jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists famz_assets_family_id_idx
  on public.famz_assets (family_id);
create index if not exists famz_assets_type_idx
  on public.famz_assets (family_id, type);

drop trigger if exists famz_assets_set_updated_at on public.famz_assets;
create trigger famz_assets_set_updated_at
  before update on public.famz_assets
  for each row execute function public.famz_set_updated_at();

-- -----------------------------------------------------------------------------
-- 4) famz_asset_ownerships — สัดส่วนถือครอง
-- -----------------------------------------------------------------------------
create table if not exists public.famz_asset_ownerships (
  id uuid primary key default gen_random_uuid(),
  asset_id uuid not null references public.famz_assets (id) on delete cascade,
  member_id uuid not null references public.famz_members (id) on delete cascade,
  percent numeric(7, 4) not null check (percent >= 0 and percent <= 100),
  role text,
  created_at timestamptz not null default now(),
  unique (asset_id, member_id)
);

create index if not exists famz_asset_ownerships_asset_id_idx
  on public.famz_asset_ownerships (asset_id);
create index if not exists famz_asset_ownerships_member_id_idx
  on public.famz_asset_ownerships (member_id);

-- -----------------------------------------------------------------------------
-- 5) famz_asset_beneficiaries — ผู้รับผลประโยชน์ / ผู้รับโอน
-- -----------------------------------------------------------------------------
create table if not exists public.famz_asset_beneficiaries (
  id uuid primary key default gen_random_uuid(),
  asset_id uuid not null references public.famz_assets (id) on delete cascade,
  member_id uuid not null references public.famz_members (id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (asset_id, member_id)
);

create index if not exists famz_asset_beneficiaries_asset_id_idx
  on public.famz_asset_beneficiaries (asset_id);

-- -----------------------------------------------------------------------------
-- 6) famz_transfer_steps — ไทม์ไลน์แผนโอน
-- -----------------------------------------------------------------------------
create table if not exists public.famz_transfer_steps (
  id uuid primary key default gen_random_uuid(),
  family_id uuid not null references public.famz_families (id) on delete cascade,
  asset_id uuid references public.famz_assets (id) on delete set null,
  year_label text not null,
  title text not null,
  note text not null default '',
  estimated_tax numeric(18, 2),
  status text not null default 'not_started'
    check (status in ('review', 'not_started', 'concept', 'done')),
  sort_order int not null default 0,
  registration_type text,
  recipient_relation text check (
    recipient_relation is null
    or recipient_relation in ('spouse', 'lineal_descendant', 'ascendant', 'other')
  ),
  transfer_amount numeric(18, 2),
  heir_count int,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists famz_transfer_steps_family_id_idx
  on public.famz_transfer_steps (family_id, sort_order);
create index if not exists famz_transfer_steps_asset_id_idx
  on public.famz_transfer_steps (asset_id);

drop trigger if exists famz_transfer_steps_set_updated_at on public.famz_transfer_steps;
create trigger famz_transfer_steps_set_updated_at
  before update on public.famz_transfer_steps
  for each row execute function public.famz_set_updated_at();

-- -----------------------------------------------------------------------------
-- 7) famz_documents — สถานะเอกสาร
-- -----------------------------------------------------------------------------
create table if not exists public.famz_documents (
  id uuid primary key default gen_random_uuid(),
  family_id uuid not null references public.famz_families (id) on delete cascade,
  name text not null,
  status text not null default 'not_started'
    check (status in ('draft', 'not_started', 'approved')),
  category text not null default 'other'
    check (category in ('will', 'gift', 'power_of_attorney', 'ownership', 'other')),
  description text not null default '',
  updated_label text,
  related_step_id uuid references public.famz_transfer_steps (id) on delete set null,
  related_asset_id uuid references public.famz_assets (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists famz_documents_family_id_idx
  on public.famz_documents (family_id);

drop trigger if exists famz_documents_set_updated_at on public.famz_documents;
create trigger famz_documents_set_updated_at
  before update on public.famz_documents
  for each row execute function public.famz_set_updated_at();

-- -----------------------------------------------------------------------------
-- 8) famz_ownership_graphs — แผนภาพถือครอง (JSONB)
-- -----------------------------------------------------------------------------
create table if not exists public.famz_ownership_graphs (
  id uuid primary key default gen_random_uuid(),
  family_id uuid not null references public.famz_families (id) on delete cascade,
  asset_id uuid not null references public.famz_assets (id) on delete cascade,
  title text not null,
  nodes jsonb not null default '[]'::jsonb,
  edges jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (asset_id)
);

create index if not exists famz_ownership_graphs_family_id_idx
  on public.famz_ownership_graphs (family_id);

drop trigger if exists famz_ownership_graphs_set_updated_at on public.famz_ownership_graphs;
create trigger famz_ownership_graphs_set_updated_at
  before update on public.famz_ownership_graphs
  for each row execute function public.famz_set_updated_at();

-- =============================================================================
-- RLS
-- เข้าถึงได้เฉพาะตระกูลที่ owner_user_id = auth.uid()
-- (ยังไม่มี auth → ใส่ owner_user_id หลัง login หรือปรับ policy ชั่วคราว)
-- =============================================================================

alter table public.famz_families enable row level security;
alter table public.famz_members enable row level security;
alter table public.famz_assets enable row level security;
alter table public.famz_asset_ownerships enable row level security;
alter table public.famz_asset_beneficiaries enable row level security;
alter table public.famz_transfer_steps enable row level security;
alter table public.famz_documents enable row level security;
alter table public.famz_ownership_graphs enable row level security;

-- helper: ตระกูลที่ user เป็นเจ้าของ
create or replace function public.famz_is_family_owner(p_family_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.famz_families f
    where f.id = p_family_id
      and f.owner_user_id = auth.uid()
  );
$$;

-- famz_families
drop policy if exists famz_families_select on public.famz_families;
drop policy if exists famz_families_insert on public.famz_families;
drop policy if exists famz_families_update on public.famz_families;
drop policy if exists famz_families_delete on public.famz_families;

create policy famz_families_select on public.famz_families
  for select using (owner_user_id = auth.uid());

create policy famz_families_insert on public.famz_families
  for insert with check (owner_user_id = auth.uid());

create policy famz_families_update on public.famz_families
  for update using (owner_user_id = auth.uid());

create policy famz_families_delete on public.famz_families
  for delete using (owner_user_id = auth.uid());

-- famz_members
drop policy if exists famz_members_all on public.famz_members;
create policy famz_members_all on public.famz_members
  for all
  using (public.famz_is_family_owner(family_id))
  with check (public.famz_is_family_owner(family_id));

-- famz_assets
drop policy if exists famz_assets_all on public.famz_assets;
create policy famz_assets_all on public.famz_assets
  for all
  using (public.famz_is_family_owner(family_id))
  with check (public.famz_is_family_owner(family_id));

-- famz_asset_ownerships (ผ่าน asset → family)
drop policy if exists famz_asset_ownerships_all on public.famz_asset_ownerships;
create policy famz_asset_ownerships_all on public.famz_asset_ownerships
  for all
  using (
    exists (
      select 1 from public.famz_assets a
      where a.id = asset_id and public.famz_is_family_owner(a.family_id)
    )
  )
  with check (
    exists (
      select 1 from public.famz_assets a
      where a.id = asset_id and public.famz_is_family_owner(a.family_id)
    )
  );

-- famz_asset_beneficiaries
drop policy if exists famz_asset_beneficiaries_all on public.famz_asset_beneficiaries;
create policy famz_asset_beneficiaries_all on public.famz_asset_beneficiaries
  for all
  using (
    exists (
      select 1 from public.famz_assets a
      where a.id = asset_id and public.famz_is_family_owner(a.family_id)
    )
  )
  with check (
    exists (
      select 1 from public.famz_assets a
      where a.id = asset_id and public.famz_is_family_owner(a.family_id)
    )
  );

-- famz_transfer_steps
drop policy if exists famz_transfer_steps_all on public.famz_transfer_steps;
create policy famz_transfer_steps_all on public.famz_transfer_steps
  for all
  using (public.famz_is_family_owner(family_id))
  with check (public.famz_is_family_owner(family_id));

-- famz_documents
drop policy if exists famz_documents_all on public.famz_documents;
create policy famz_documents_all on public.famz_documents
  for all
  using (public.famz_is_family_owner(family_id))
  with check (public.famz_is_family_owner(family_id));

-- famz_ownership_graphs
drop policy if exists famz_ownership_graphs_all on public.famz_ownership_graphs;
create policy famz_ownership_graphs_all on public.famz_ownership_graphs
  for all
  using (public.famz_is_family_owner(family_id))
  with check (public.famz_is_family_owner(family_id));

-- =============================================================================
-- Seed ตัวอย่าง (optional) — ไม่ผูก auth ก่อน; ใส่ owner_user_id ทีหลังได้
-- รันซ้ำได้: ใช้ id คงที่
-- =============================================================================

insert into public.famz_families (id, name, note)
values (
  '11111111-1111-1111-1111-111111111111',
  'ตระกูล Wealth',
  'ใช้สำหรับวางแผนโอนทรัพย์สินและประมาณการภาษี'
)
on conflict (id) do update
set name = excluded.name,
    note = excluded.note;

insert into public.famz_members (id, family_id, name, short_name, relation, sort_order) values
  ('22222222-2222-2222-2222-222222222201', '11111111-1111-1111-1111-111111111111', 'คุณพ่อ', 'พ่อ', 'parent', 1),
  ('22222222-2222-2222-2222-222222222202', '11111111-1111-1111-1111-111111111111', 'คุณแม่', 'แม่', 'parent', 2),
  ('22222222-2222-2222-2222-222222222203', '11111111-1111-1111-1111-111111111111', 'บุตรคนโต', 'คนโต', 'child', 3),
  ('22222222-2222-2222-2222-222222222204', '11111111-1111-1111-1111-111111111111', 'บุตรคนเล็ก', 'คนเล็ก', 'child', 4),
  ('22222222-2222-2222-2222-222222222205', '11111111-1111-1111-1111-111111111111', 'บุตรคนที่ 3', 'คนที่ 3', 'child', 5)
on conflict (id) do update
set name = excluded.name,
    short_name = excluded.short_name,
    relation = excluded.relation,
    sort_order = excluded.sort_order;

insert into public.famz_assets (
  id, family_id, type, name, value, valuation_date, plan, documents,
  control_member_id, owner_entity_kind, heir_count, recipient_relation, details
) values
(
  '33333333-3333-3333-3333-333333333301',
  '11111111-1111-1111-1111-111111111111',
  'finance',
  'บัญชีออมทรัพย์ XYZ',
  6200000,
  '2569-01',
  'keep',
  'complete',
  null,
  'individual',
  null,
  null,
  '{}'::jsonb
),
(
  '33333333-3333-3333-3333-333333333302',
  '11111111-1111-1111-1111-111111111111',
  'real_estate',
  'ที่ดินบางละมุง',
  38000000,
  '2565-06',
  'transfer',
  'outdated',
  null,
  'individual',
  3,
  'lineal_descendant',
  jsonb_build_object(
    'realEstate', jsonb_build_object(
      'subtype', 'land',
      'area', jsonb_build_object('rai', 2, 'ngan', 1, 'sqWah', 50),
      'appraisalPerSqWah', 40000,
      'salePrice', 40000000,
      'acquiredYearBe', 2555,
      'transferYearBe', 2571,
      'acquisitionMethod', 'purchase_or_other'
    )
  )
),
(
  '33333333-3333-3333-3333-333333333303',
  '11111111-1111-1111-1111-111111111111',
  'business',
  'หุ้นบริษัท ABC จำกัด',
  210000000,
  '2569-03',
  'undecided',
  'incomplete',
  '22222222-2222-2222-2222-222222222201',
  'individual',
  1,
  'lineal_descendant',
  jsonb_build_object(
    'share', jsonb_build_object(
      'subtype', 'unlisted',
      'companyName', 'บริษัท ABC จำกัด',
      'registeredCapital', 100000000,
      'ownershipPercent', 60,
      'parValue', 100000000,
      'bookValue', 210000000,
      'marketValue', 210000000,
      'costBasis', 60000000
    )
  )
)
on conflict (id) do update
set name = excluded.name,
    value = excluded.value,
    plan = excluded.plan,
    documents = excluded.documents,
    details = excluded.details;

-- ownership
insert into public.famz_asset_ownerships (asset_id, member_id, percent, role) values
  ('33333333-3333-3333-3333-333333333301', '22222222-2222-2222-2222-222222222201', 100, null),
  ('33333333-3333-3333-3333-333333333302', '22222222-2222-2222-2222-222222222201', 50, null),
  ('33333333-3333-3333-3333-333333333302', '22222222-2222-2222-2222-222222222202', 50, null),
  ('33333333-3333-3333-3333-333333333303', '22222222-2222-2222-2222-222222222201', 60, 'ประธาน'),
  ('33333333-3333-3333-3333-333333333303', '22222222-2222-2222-2222-222222222203', 40, null)
on conflict (asset_id, member_id) do update
set percent = excluded.percent,
    role = excluded.role;

-- beneficiaries (ที่ดิน)
insert into public.famz_asset_beneficiaries (asset_id, member_id) values
  ('33333333-3333-3333-3333-333333333302', '22222222-2222-2222-2222-222222222203'),
  ('33333333-3333-3333-3333-333333333302', '22222222-2222-2222-2222-222222222204'),
  ('33333333-3333-3333-3333-333333333302', '22222222-2222-2222-2222-222222222205')
on conflict (asset_id, member_id) do nothing;

-- transfer steps (ไทม์ไลน์)
insert into public.famz_transfer_steps (
  id, family_id, asset_id, year_label, title, note, estimated_tax, status, sort_order
) values
(
  '44444444-4444-4444-4444-444444444401',
  '11111111-1111-1111-1111-111111111111',
  '33333333-3333-3333-3333-333333333303',
  '2569',
  'โอนหุ้น ABC 10% ให้บุตรคนเล็ก',
  'ใช้สิทธิยกเว้นภาษีการให้รายปี',
  0,
  'review',
  0
),
(
  '44444444-4444-4444-4444-444444444402',
  '11111111-1111-1111-1111-111111111111',
  null,
  '2570',
  'จัดทำพินัยกรรมฉบับใหม่',
  'ต้องมีพยาน 2 คน และเอกสารพินัยกรรม',
  null,
  'not_started',
  1
),
(
  '44444444-4444-4444-4444-444444444403',
  '11111111-1111-1111-1111-111111111111',
  '33333333-3333-3333-3333-333333333302',
  '2571',
  'โอนที่ดินบางละมุงรอบที่ 1',
  'โอนส่วนบุตรคนโต — ใช้สิทธิยกเว้นรายปี',
  0,
  'not_started',
  2
),
(
  '44444444-4444-4444-4444-444444444404',
  '11111111-1111-1111-1111-111111111111',
  '33333333-3333-3333-3333-333333333302',
  '2572',
  'โอนที่ดินบางละมุงรอบที่ 2',
  'โอนส่วนบุตรคนกลาง',
  180000,
  'not_started',
  3
),
(
  '44444444-4444-4444-4444-444444444405',
  '11111111-1111-1111-1111-111111111111',
  '33333333-3333-3333-3333-333333333302',
  '2573',
  'โอนที่ดินบางละมุงรอบที่ 3',
  'โอนส่วนบุตรคนเล็ก — จบแผนที่ดิน',
  320000,
  'not_started',
  4
),
(
  '44444444-4444-4444-4444-444444444406',
  '11111111-1111-1111-1111-111111111111',
  null,
  '2574',
  'ทบทวนกรรมสิทธิ์บัญชีลงทุน',
  'ปรับสัดส่วนผู้รับผลประโยชน์ตามพินัยกรรม',
  null,
  'concept',
  5
),
(
  '44444444-4444-4444-4444-444444444407',
  '11111111-1111-1111-1111-111111111111',
  '33333333-3333-3333-3333-333333333303',
  '2575',
  'โอนหุ้น ABC เพิ่มอีก 5%',
  'หลังประเมินมูลค่ากิจการรอบใหม่',
  450000,
  'concept',
  6
),
(
  '44444444-4444-4444-4444-444444444408',
  '11111111-1111-1111-1111-111111111111',
  '33333333-3333-3333-3333-333333333303',
  'ระยะยาว',
  'ทบทวนโครงสร้างหุ้น ABC',
  'พิจารณาจัดตั้ง holding company — ปรึกษาที่ปรึกษากฎหมาย',
  null,
  'concept',
  7
)
on conflict (id) do update
set title = excluded.title,
    note = excluded.note,
    estimated_tax = excluded.estimated_tax,
    status = excluded.status,
    sort_order = excluded.sort_order;

insert into public.famz_documents (
  id, family_id, name, status, category, description, updated_label, related_step_id, related_asset_id
) values
(
  '55555555-5555-5555-5555-555555555501',
  '11111111-1111-1111-1111-111111111111',
  'หนังสือให้ (หุ้น ABC)',
  'draft',
  'gift',
  'ร่างหนังสือให้สำหรับโอนหุ้นรอบแรก',
  '2569-01',
  '44444444-4444-4444-4444-444444444401',
  '33333333-3333-3333-3333-333333333303'
),
(
  '55555555-5555-5555-5555-555555555502',
  '11111111-1111-1111-1111-111111111111',
  'พินัยกรรมฉบับใหม่',
  'not_started',
  'will',
  'รอจัดทำหลังสรุปแผนโอน',
  null,
  '44444444-4444-4444-4444-444444444402',
  null
),
(
  '55555555-5555-5555-5555-555555555503',
  '11111111-1111-1111-1111-111111111111',
  'หนังสือมอบอำนาจ',
  'approved',
  'power_of_attorney',
  'อนุมัติแล้ว',
  '2568-11',
  null,
  null
)
on conflict (id) do update
set name = excluded.name,
    status = excluded.status,
    description = excluded.description;

-- =============================================================================
-- หลัง login ครั้งแรก: ผูกตระกูล seed กับ user ของคุณ (แก้ UUID ตาม auth.users)
-- update public.famz_families
-- set owner_user_id = 'YOUR-AUTH-USER-UUID'
-- where id = '11111111-1111-1111-1111-111111111111';
-- =============================================================================
