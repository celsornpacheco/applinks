-- Inovapet Manutenção: schema inicial (Postgres 15+ / Supabase)
-- Uma empresa, uma fábrica. Sem multi-tenant: o controle de acesso é por perfil (RLS).
-- Horários em timestamptz (UTC); datas de calendário em date no fuso America/Sao_Paulo.

create extension if not exists pgcrypto with schema extensions;  -- Supabase: extensões ficam no schema extensions

-- ───────────────────────── utilitários ─────────────────────────

create or replace function set_updated_at() returns trigger
language plpgsql set search_path = public as $$
begin
  new.updated_at := now();
  return new;
end $$;

-- ───────────────────────── pessoas e acesso ─────────────────────────

create table teams (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 1:1 com auth.users (Supabase Auth). Contas são criadas pelo admin, sem cadastro público.
create table profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null,
  email text not null unique,
  role text not null default 'requester'
    check (role in ('admin','manager','technician','requester')),
  team_id uuid references teams(id) on delete set null,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index on profiles (team_id);
create index on profiles (role) where active;

-- ───────────────────────── locais e ativos ─────────────────────────

create table sites (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  address text,
  city text,
  state char(2),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Setores / linhas, com sub-área opcional (ex.: Injeção > Linha 2)
create table areas (
  id uuid primary key default gen_random_uuid(),
  site_id uuid not null references sites(id) on delete restrict,
  parent_id uuid references areas(id) on delete restrict,
  name text not null,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (site_id, parent_id, name),
  constraint area_not_own_parent check (parent_id is distinct from id)
);
create index on areas (site_id);
create index on areas (parent_id);

-- Técnico vê só as áreas dele. Sem linhas aqui = vê todas.
create table profile_areas (
  profile_id uuid not null references profiles(id) on delete cascade,
  area_id uuid not null references areas(id) on delete cascade,
  primary key (profile_id, area_id)
);
create index on profile_areas (area_id);

-- Sistemas / tipos: Hidráulico, Pneumático, Elétrico, Refrigeração, Moldes...
create table systems (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table assets (
  id uuid primary key default gen_random_uuid(),
  area_id uuid not null references areas(id) on delete restrict,
  system_id uuid references systems(id) on delete set null,
  tag text not null unique,                       -- ex.: INJ-03
  name text not null,                             -- ex.: Injetora 03
  manufacturer text,
  model text,
  serial_number text,
  year smallint check (year between 1950 and 2100),
  criticality text not null default 'medium'
    check (criticality in ('low','medium','high','critical')),
  status text not null default 'active'
    check (status in ('active','inactive')),
  responsible_id uuid references profiles(id) on delete set null,
  photo_path text,                                -- Storage: assets/<id>/...
  qr_token text not null unique default translate(encode(extensions.gen_random_bytes(9), 'base64'), '+/', '-_'),  -- 12 caracteres, seguro em URL
  extra jsonb not null default '{}',              -- campos livres (potência, pressão, nº cavidades...)
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index on assets (area_id);
create index on assets (system_id);
create index on assets (responsible_id);
create index on assets (status, criticality);
create index assets_search on assets using gin (to_tsvector('portuguese', tag || ' ' || name || ' ' || coalesce(model,'')));

-- Paradas de máquina: base para um MTBF real (could). Registro manual ou ao abrir corretiva "máquina parada".
create table asset_downtimes (
  id uuid primary key default gen_random_uuid(),
  asset_id uuid not null references assets(id) on delete cascade,
  work_order_id uuid,                             -- FK adicionada abaixo
  started_at timestamptz not null,
  ended_at timestamptz,
  reason text,
  created_by uuid references profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  constraint downtime_order check (ended_at is null or ended_at >= started_at)
);
create index on asset_downtimes (asset_id, started_at);

-- ───────────────────────── checklists ─────────────────────────

create table checklist_templates (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  system_id uuid references systems(id) on delete set null,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index on checklist_templates (system_id);

create table checklist_items (
  id uuid primary key default gen_random_uuid(),
  template_id uuid not null references checklist_templates(id) on delete cascade,
  position int not null,
  label text not null,
  kind text not null
    check (kind in ('text','number','reading','photo','choice','yes_no')),
  options jsonb,                                  -- choice: ["Ok","Desgastado","Trocar"]
  min_value numeric,                              -- reading: faixa aceitável
  max_value numeric,
  unit text,                                      -- bar, °C, A...
  required boolean not null default false,
  critical boolean not null default false,        -- encerramento bloqueado sem este item
  archived boolean not null default false,        -- itens não são apagados: OS antigas apontam para eles
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (template_id, position) deferrable initially deferred,
  constraint reading_range check (kind <> 'reading' or min_value is null or max_value is null or min_value <= max_value),
  constraint choice_has_options check (kind <> 'choice' or jsonb_typeof(options) = 'array')
);
create index on checklist_items (template_id);

-- ───────────────────────── catálogos de chamado e SLA ─────────────────────────

create table categories (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,                      -- Mecânica, Elétrica, Vazamento, Segurança...
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Regra mais específica vence: (categoria, prioridade) > (null, prioridade)
create table sla_rules (
  id uuid primary key default gen_random_uuid(),
  category_id uuid references categories(id) on delete cascade,
  priority text not null check (priority in ('low','medium','high','urgent')),
  response_minutes int not null check (response_minutes > 0),
  resolution_minutes int not null check (resolution_minutes > 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint response_before_resolution check (response_minutes <= resolution_minutes)
);
create unique index sla_rules_unique on sla_rules (coalesce(category_id, '00000000-0000-0000-0000-000000000000'::uuid), priority);

-- ───────────────────────── planos preventivos ─────────────────────────

create table maintenance_plans (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  template_id uuid not null references checklist_templates(id) on delete restrict,
  every_n int not null check (every_n > 0),
  every_unit text not null check (every_unit in ('day','week','month','year')),
  starts_on date not null,
  ends_on date,
  estimated_minutes int check (estimated_minutes > 0),
  team_id uuid references teams(id) on delete set null,
  assignee_id uuid references profiles(id) on delete set null,
  priority text not null default 'medium' check (priority in ('low','medium','high','urgent')),
  active boolean not null default true,
  created_by uuid references profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint plan_dates check (ends_on is null or ends_on >= starts_on)
);
create index on maintenance_plans (template_id);
create index on maintenance_plans (team_id);
create index on maintenance_plans (assignee_id);
create index on maintenance_plans (active);

-- Um plano cobre um ou vários equipamentos (gera uma OS por equipamento por data)
create table plan_assets (
  plan_id uuid not null references maintenance_plans(id) on delete cascade,
  asset_id uuid not null references assets(id) on delete cascade,
  primary key (plan_id, asset_id)
);
create index on plan_assets (asset_id);

-- ───────────────────────── ordens de serviço ─────────────────────────

create sequence work_order_number_seq;

create table work_orders (
  id uuid primary key default gen_random_uuid(),  -- o app offline gera o uuid: reenvio é idempotente
  number bigint not null unique default nextval('work_order_number_seq'),
  kind text not null check (kind in ('preventive','corrective')),
  asset_id uuid references assets(id) on delete restrict,
  area_id uuid not null references areas(id) on delete restrict,
  plan_id uuid references maintenance_plans(id) on delete set null,
  template_id uuid references checklist_templates(id) on delete set null,
  category_id uuid references categories(id) on delete set null,
  title text not null,
  description text,
  priority text not null default 'medium' check (priority in ('low','medium','high','urgent')),
  status text not null default 'open'
    check (status in ('open','assigned','in_progress','waiting_material','done','cancelled')),
  origin text not null default 'web' check (origin in ('web','app','portal','qr','plan')),
  machine_stopped boolean not null default false,
  scheduled_for date,                             -- preventivas: dia previsto
  estimated_minutes int,
  opened_by uuid references profiles(id) on delete set null,
  opened_at timestamptz not null default now(),
  first_action_at timestamptz,                    -- SLA de resposta
  started_at timestamptz,
  completed_at timestamptz,                       -- SLA de solução / MTTR
  cancelled_at timestamptz,
  cancel_reason text,
  response_due_at timestamptz,
  resolution_due_at timestamptz,
  reopen_count int not null default 0,
  rating smallint check (rating between 1 and 5),
  rating_comment text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint preventive_has_plan check (kind <> 'preventive' or (plan_id is not null and scheduled_for is not null)),
  constraint cancel_has_reason check (status <> 'cancelled' or cancel_reason is not null),
  constraint done_has_time check (status <> 'done' or completed_at is not null)
);
-- O gerador de preventivas pode rodar várias vezes: nunca duplica a OS do mesmo dia.
create unique index work_orders_plan_once on work_orders (plan_id, asset_id, scheduled_for) where plan_id is not null;
create index on work_orders (asset_id, opened_at desc);
create index on work_orders (area_id);
create index on work_orders (category_id);
create index on work_orders (opened_by);
create index on work_orders (status, priority);
create index on work_orders (scheduled_for) where kind = 'preventive';
create index on work_orders (resolution_due_at) where status not in ('done','cancelled');

alter table asset_downtimes
  add constraint asset_downtimes_work_order_fk foreign key (work_order_id) references work_orders(id) on delete set null;
create index on asset_downtimes (work_order_id);

create table work_order_technicians (
  work_order_id uuid not null references work_orders(id) on delete cascade,
  profile_id uuid not null references profiles(id) on delete restrict,
  assigned_at timestamptz not null default now(),
  primary key (work_order_id, profile_id)
);
create index on work_order_technicians (profile_id);

-- Uma resposta por item por OS. O app reenvia com upsert; o mais recente (answered_at) vence.
create table checklist_answers (
  id uuid primary key default gen_random_uuid(),
  work_order_id uuid not null references work_orders(id) on delete cascade,
  item_id uuid not null references checklist_items(id) on delete restrict,
  value_text text,
  value_number numeric,
  value_bool boolean,
  out_of_range boolean not null default false,
  answered_by uuid references profiles(id) on delete set null,
  answered_at timestamptz not null default now(),  -- hora do celular, não do servidor
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (work_order_id, item_id)
);
create index on checklist_answers (item_id);

create table attachments (
  id uuid primary key default gen_random_uuid(),
  work_order_id uuid references work_orders(id) on delete cascade,
  asset_id uuid references assets(id) on delete cascade,
  checklist_item_id uuid references checklist_items(id) on delete set null,
  storage_path text not null unique,              -- Storage bucket "evidencias"
  mime_type text not null,
  size_bytes int not null check (size_bytes > 0 and size_bytes <= 10485760),
  caption text,
  uploaded_by uuid references profiles(id) on delete set null,
  taken_at timestamptz,
  created_at timestamptz not null default now(),
  constraint attachment_owner check (num_nonnulls(work_order_id, asset_id) = 1)
);
create index on attachments (work_order_id);
create index on attachments (asset_id);

create table signatures (
  id uuid primary key default gen_random_uuid(),
  work_order_id uuid not null references work_orders(id) on delete cascade,
  signer_role text not null check (signer_role in ('technician','responsible')),
  signer_name text not null,
  signer_id uuid references profiles(id) on delete set null,
  storage_path text not null,                     -- PNG da assinatura
  signed_at timestamptz not null,
  created_at timestamptz not null default now(),
  unique (work_order_id, signer_role)
);

create table time_entries (
  id uuid primary key default gen_random_uuid(),
  work_order_id uuid not null references work_orders(id) on delete cascade,
  profile_id uuid not null references profiles(id) on delete restrict,
  started_at timestamptz not null,
  ended_at timestamptz not null,
  created_at timestamptz not null default now(),
  constraint time_entry_order check (ended_at > started_at)
);
create index on time_entries (work_order_id);
create index on time_entries (profile_id, started_at);

-- Linha do tempo da OS (preenchida por trigger)
create table work_order_events (
  id bigint generated always as identity primary key,
  work_order_id uuid not null references work_orders(id) on delete cascade,
  actor_id uuid references profiles(id) on delete set null,
  kind text not null,                             -- created, status, assigned, reopened, rated, comment
  from_value text,
  to_value text,
  note text,
  created_at timestamptz not null default now()
);
create index on work_order_events (work_order_id, created_at);

-- ───────────────────────── materiais ─────────────────────────

create table materials (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  name text not null,
  unit text not null default 'un',
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table material_requests (
  id uuid primary key default gen_random_uuid(),
  work_order_id uuid not null references work_orders(id) on delete cascade,
  material_id uuid references materials(id) on delete restrict,
  free_text text,                                 -- peça ainda não cadastrada
  quantity numeric not null check (quantity > 0),
  status text not null default 'requested'
    check (status in ('requested','approved','delivered','denied')),
  unit_cost_cents int check (unit_cost_cents >= 0),
  currency char(3) not null default 'BRL',
  requested_by uuid references profiles(id) on delete set null,
  decided_by uuid references profiles(id) on delete set null,
  decided_at timestamptz,
  note text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint material_or_text check (material_id is not null or free_text is not null)
);
create index on material_requests (work_order_id);
create index on material_requests (material_id);
create index on material_requests (status);

-- ───────────────────────── documentos ─────────────────────────

create table documents (
  id uuid primary key default gen_random_uuid(),
  asset_id uuid references assets(id) on delete cascade,
  area_id uuid references areas(id) on delete cascade,
  system_id uuid references systems(id) on delete cascade,
  name text not null,
  kind text not null default 'manual' check (kind in ('manual','drawing','warranty','certificate','other')),
  storage_path text not null unique,              -- Storage bucket "documentos"
  expires_on date,
  uploaded_by uuid references profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint document_owner check (num_nonnulls(asset_id, area_id, system_id) = 1)
);
create index on documents (asset_id);
create index on documents (area_id);
create index on documents (system_id);
create index on documents (expires_on) where expires_on is not null;

-- ───────────────────────── notificações e configurações ─────────────────────────

create table notifications (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references profiles(id) on delete cascade,
  kind text not null,                             -- wo_assigned, wo_new, sla_risk, sla_breached, material_update, wo_done
  work_order_id uuid references work_orders(id) on delete cascade,
  title text not null,
  read_at timestamptz,
  created_at timestamptz not null default now()
);
create index on notifications (profile_id, created_at desc) where read_at is null;
create index on notifications (work_order_id);

-- Linha única de configurações
create table settings (
  id boolean primary key default true check (id),
  require_signature boolean not null default true,
  preventive_horizon_days int not null default 60 check (preventive_horizon_days between 7 and 400),
  sla_risk_percent int not null default 80 check (sla_risk_percent between 50 and 99),
  requester_sees_costs boolean not null default false,
  email_notifications boolean not null default false,
  updated_at timestamptz not null default now()
);
insert into settings default values;

-- updated_at em todas as tabelas que têm a coluna
do $$
declare t text;
begin
  for t in select table_name from information_schema.columns
           where table_schema = 'public' and column_name = 'updated_at'
  loop
    execute format('create trigger %I before update on %I for each row execute function set_updated_at()', t || '_updated_at', t);
  end loop;
end $$;

-- ───────────────────────── regras de negócio no banco ─────────────────────────
-- Ficam no banco porque o app offline sincroniza escrevendo direto: a regra vale para qualquer caminho.

create or replace function current_role_name() returns text
language sql stable security definer set search_path = public as $$
  select role from profiles where id = auth.uid() and active
$$;

create or replace function is_manager() returns boolean
language sql stable security definer set search_path = public as $$
  select coalesce(current_role_name() in ('admin','manager'), false)
$$;

-- Técnico pode ver a área? (sem áreas cadastradas = todas)
create or replace function can_see_area(p_area uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select not exists (select 1 from profile_areas where profile_id = auth.uid())
      or exists (select 1 from profile_areas where profile_id = auth.uid() and area_id = p_area)
$$;

create or replace function can_see_work_order(p_wo uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select case current_role_name()
    when 'admin' then true
    when 'manager' then true
    when 'technician' then exists (
      select 1 from work_orders w where w.id = p_wo and (
        exists (select 1 from work_order_technicians t where t.work_order_id = w.id and t.profile_id = auth.uid())
        or can_see_area(w.area_id)))
    when 'requester' then exists (select 1 from work_orders w where w.id = p_wo and w.opened_by = auth.uid())
    else false end
$$;

-- Regra de SLA mais específica para (categoria, prioridade)
create or replace function find_sla(p_category uuid, p_priority text)
returns sla_rules language sql stable set search_path = public as $$
  select * from sla_rules
  where priority = p_priority and (category_id = p_category or category_id is null)
  order by category_id is null
  limit 1
$$;

create or replace function work_order_before() returns trigger
language plpgsql set search_path = public as $$
declare
  r sla_rules;
  missing int;
  sig_required boolean;
begin
  -- solicitante só avalia e reabre o próprio chamado concluído; o resto da OS é da manutenção
  if tg_op = 'UPDATE' and current_role_name() = 'requester' then
    if (to_jsonb(new) - array['rating','rating_comment','status','updated_at'])
       is distinct from (to_jsonb(old) - array['rating','rating_comment','status','updated_at'])
       or (new.status is distinct from old.status and not (old.status = 'done' and new.status = 'open')) then
      raise exception 'solicitante só pode avaliar ou reabrir o chamado' using errcode = '42501';
    end if;
  end if;

  -- área vem do equipamento quando houver
  if new.asset_id is not null and (tg_op = 'INSERT' or new.asset_id is distinct from old.asset_id) then
    select area_id into new.area_id from assets where id = new.asset_id;
  end if;

  -- prazos de SLA nas corretivas: na abertura e quando muda prioridade ou categoria
  if new.kind = 'corrective' and (tg_op = 'INSERT'
       or new.priority is distinct from old.priority or new.category_id is distinct from old.category_id) then
    r := find_sla(new.category_id, new.priority);
    if r.id is not null then
      new.response_due_at := new.opened_at + make_interval(mins => r.response_minutes);
      new.resolution_due_at := new.opened_at + make_interval(mins => r.resolution_minutes);
    end if;
  end if;

  if tg_op = 'UPDATE' and new.status is distinct from old.status then
    -- reabrir: concluída/cancelada voltando para aberta
    if old.status in ('done','cancelled') and new.status in ('open','assigned','in_progress') then
      new.reopen_count := old.reopen_count + 1;
      new.completed_at := null;
      new.cancelled_at := null;
      new.cancel_reason := null;
    end if;
    if new.status = 'in_progress' and new.started_at is null then
      new.started_at := now();
    end if;
    if new.status = 'cancelled' then
      new.cancelled_at := coalesce(new.cancelled_at, now());
    end if;
    if new.status = 'done' then
      new.completed_at := coalesce(new.completed_at, now());

      -- bloqueio de encerramento: itens obrigatórios/críticos sem resposta
      select count(*) into missing
      from checklist_items i
      where i.template_id = new.template_id and not i.archived and (i.required or i.critical)
        and not exists (
          select 1 from checklist_answers a
          where a.work_order_id = new.id and a.item_id = i.id
            and (a.value_text is not null or a.value_number is not null or a.value_bool is not null
                 or exists (select 1 from attachments f where f.work_order_id = new.id and f.checklist_item_id = i.id)));
      if missing > 0 then
        raise exception 'OS #% não pode ser concluída: % item(ns) obrigatório(s) sem resposta', new.number, missing
          using errcode = 'P0001';
      end if;

      select require_signature into sig_required from settings;
      if sig_required and not exists (
           select 1 from signatures s where s.work_order_id = new.id and s.signer_role = 'technician') then
        raise exception 'OS #% não pode ser concluída: falta a assinatura do técnico', new.number
          using errcode = 'P0001';
      end if;
    end if;
  end if;

  if new.first_action_at is null and new.status <> 'open' then
    new.first_action_at := now();
  end if;
  return new;
end $$;

create trigger work_orders_before before insert or update on work_orders
  for each row execute function work_order_before();

create or replace function work_order_after() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if tg_op = 'INSERT' then
    insert into work_order_events (work_order_id, actor_id, kind, to_value)
    values (new.id, auth.uid(), 'created', new.status);
    -- chamado novo: avisa os gestores
    if new.kind = 'corrective' then
      insert into notifications (profile_id, kind, work_order_id, title)
      select p.id, 'wo_new', new.id, 'Novo chamado #' || new.number || ': ' || new.title
      from profiles p where p.active and p.role in ('admin','manager') and p.id is distinct from new.opened_by;
    end if;
  elsif new.status is distinct from old.status then
    insert into work_order_events (work_order_id, actor_id, kind, from_value, to_value)
    values (new.id, auth.uid(),
            case when old.status in ('done','cancelled') and new.status not in ('done','cancelled') then 'reopened' else 'status' end,
            old.status, new.status);
    if new.status = 'done' and new.opened_by is not null then
      insert into notifications (profile_id, kind, work_order_id, title)
      values (new.opened_by, 'wo_done', new.id, 'Chamado #' || new.number || ' concluído');
    end if;
  end if;
  if tg_op = 'UPDATE' and new.rating is distinct from old.rating then
    insert into work_order_events (work_order_id, actor_id, kind, to_value, note)
    values (new.id, auth.uid(), 'rated', new.rating::text, new.rating_comment);
  end if;
  return null;
end $$;

create trigger work_orders_after after insert or update on work_orders
  for each row execute function work_order_after();

create or replace function technician_assigned() returns trigger
language plpgsql security definer set search_path = public as $$
declare n bigint; t text;
begin
  select number, title into n, t from work_orders where id = new.work_order_id;
  insert into work_order_events (work_order_id, actor_id, kind, to_value)
  values (new.work_order_id, auth.uid(), 'assigned', new.profile_id::text);
  insert into notifications (profile_id, kind, work_order_id, title)
  values (new.profile_id, 'wo_assigned', new.work_order_id, 'OS #' || n || ' atribuída a você: ' || t);
  update work_orders set status = 'assigned' where id = new.work_order_id and status = 'open';
  return null;
end $$;

create trigger work_order_technicians_after after insert on work_order_technicians
  for each row execute function technician_assigned();

-- leitura fora da faixa
create or replace function answer_before() returns trigger
language plpgsql set search_path = public as $$
declare i checklist_items;
begin
  select * into i from checklist_items where id = new.item_id;
  new.out_of_range := i.kind = 'reading' and new.value_number is not null
    and ((i.min_value is not null and new.value_number < i.min_value)
      or (i.max_value is not null and new.value_number > i.max_value));
  -- upsert do app offline: não deixa uma resposta mais antiga sobrescrever uma mais nova
  if tg_op = 'UPDATE' and new.answered_at < old.answered_at then
    return old;
  end if;
  return new;
end $$;

create trigger checklist_answers_before before insert or update on checklist_answers
  for each row execute function answer_before();

-- ───────────────────────── geração de preventivas ─────────────────────────
-- Roda todo dia (pg_cron) e ao salvar um plano. Idempotente pelo índice work_orders_plan_once.

create or replace function generate_preventive_work_orders(p_plan uuid default null)
returns int language plpgsql security definer set search_path = public as $$
declare
  today date := (now() at time zone 'America/Sao_Paulo')::date;
  horizon date;
  created int;
begin
  select today + preventive_horizon_days into horizon from settings;

  with due as (
    select p.id as plan_id, pa.asset_id, a.area_id, p.template_id, p.name, p.priority,
           p.estimated_minutes, p.assignee_id,
           -- k * intervalo a partir do início (evita deriva no dia 31)
           (p.starts_on + k * case p.every_unit
                                when 'day' then make_interval(days => p.every_n)
                                when 'week' then make_interval(weeks => p.every_n)
                                when 'month' then make_interval(months => p.every_n)
                                when 'year' then make_interval(years => p.every_n) end)::date as on_date
    from maintenance_plans p
    join plan_assets pa on pa.plan_id = p.id
    join assets a on a.id = pa.asset_id and a.status = 'active'
    -- só os k que podem cair entre hoje e o horizonte (mês = 28..31 dias, ano = 365..366)
    cross join lateral generate_series(
      greatest(0, floor((today - p.starts_on)::numeric / (p.every_n *
        case p.every_unit when 'day' then 1 when 'week' then 7 when 'month' then 31 else 366 end)))::int,
      ceil((horizon - p.starts_on)::numeric / (p.every_n *
        case p.every_unit when 'day' then 1 when 'week' then 7 when 'month' then 28 else 365 end))::int
    ) k
    where p.active and (p_plan is null or p.id = p_plan) and p.starts_on <= horizon
  ), ins as (
    insert into work_orders (kind, plan_id, asset_id, area_id, template_id, title, priority,
                             scheduled_for, estimated_minutes, origin)
    select 'preventive', d.plan_id, d.asset_id, d.area_id, d.template_id, d.name, d.priority,
           d.on_date, d.estimated_minutes, 'plan'
    from due d join maintenance_plans p on p.id = d.plan_id
    where d.on_date >= today and d.on_date <= horizon and (p.ends_on is null or d.on_date <= p.ends_on)
    on conflict (plan_id, asset_id, scheduled_for) where plan_id is not null do nothing
    returning id, plan_id
  ), assign as (
    insert into work_order_technicians (work_order_id, profile_id)
    select ins.id, p.assignee_id from ins join maintenance_plans p on p.id = ins.plan_id
    where p.assignee_id is not null
    returning 1
  )
  select count(*) into created from ins;
  return created;
end $$;

-- Mudou periodicidade, início, equipamentos ou pausou: apaga as futuras não iniciadas e regenera.
create or replace function reschedule_plan(p_plan uuid) returns int
language plpgsql security definer set search_path = public as $$
begin
  if not is_manager() then
    raise exception 'sem permissão' using errcode = '42501';
  end if;
  delete from work_orders
  where plan_id = p_plan and status in ('open','assigned')
    and scheduled_for >= (now() at time zone 'America/Sao_Paulo')::date;
  return generate_preventive_work_orders(p_plan);
end $$;

-- SLA: avisa em risco e estourado. Roda a cada 15 min (pg_cron). Não duplica aviso.
create or replace function check_sla() returns int
language plpgsql security definer set search_path = public as $$
declare pct int; n int;
begin
  select sla_risk_percent into pct from settings;
  with hits as (
    select w.id, w.number, w.title,
      case when now() > w.resolution_due_at then 'sla_breached' else 'sla_risk' end as kind
    from work_orders w
    where w.kind = 'corrective' and w.status not in ('done','cancelled') and w.resolution_due_at is not null
      and now() >= w.opened_at + (w.resolution_due_at - w.opened_at) * pct / 100.0
  ), ins as (
    insert into notifications (profile_id, kind, work_order_id, title)
    select p.id, h.kind, h.id,
           case h.kind when 'sla_breached' then 'SLA estourado' else 'SLA em risco' end || ' #' || h.number || ': ' || h.title
    from hits h
    join profiles p on p.active and (p.role in ('admin','manager')
         or exists (select 1 from work_order_technicians t where t.work_order_id = h.id and t.profile_id = p.id))
    where not exists (select 1 from notifications n2
                      where n2.work_order_id = h.id and n2.profile_id = p.id and n2.kind = h.kind)
    returning 1
  )
  select count(*) into n from ins;
  return n;
end $$;

-- ───────────────────────── indicadores ─────────────────────────

-- MTTR por equipamento (corretivas concluídas), em horas
create or replace view v_asset_mttr with (security_invoker = true) as
select asset_id,
       count(*) as repairs,
       round(extract(epoch from avg(completed_at - opened_at)) / 3600, 2) as mttr_hours
from work_orders
where kind = 'corrective' and status = 'done' and asset_id is not null
group by asset_id;

-- MTBF por equipamento: intervalo médio entre corretivas (até haver registro de paradas)
create or replace view v_asset_mtbf with (security_invoker = true) as
select asset_id,
       count(*) as failures,
       round(extract(epoch from avg(gap)) / 3600, 2) as mtbf_hours
from (
  select asset_id, opened_at - lag(opened_at) over (partition by asset_id order by opened_at) as gap
  from work_orders where kind = 'corrective' and asset_id is not null and status <> 'cancelled'
) g
where gap is not null
group by asset_id;

-- Cumprimento de SLA por mês, prioridade e categoria
create or replace view v_sla_monthly with (security_invoker = true) as
select date_trunc('month', opened_at at time zone 'America/Sao_Paulo')::date as month,
       priority, category_id,
       count(*) as total,
       count(*) filter (where first_action_at <= response_due_at) as response_ok,
       count(*) filter (where completed_at <= resolution_due_at) as resolution_ok,
       count(*) filter (where reopen_count > 0) as reopened
from work_orders
where kind = 'corrective' and response_due_at is not null and status <> 'cancelled'
group by 1, 2, 3;

-- Aderência ao plano: preventivas previstas até hoje x concluídas no prazo
create or replace view v_plan_adherence with (security_invoker = true) as
select date_trunc('month', scheduled_for)::date as month,
       area_id,
       count(*) as planned,
       count(*) filter (where status = 'done'
         and (completed_at at time zone 'America/Sao_Paulo')::date <= scheduled_for) as on_time,
       count(*) filter (where status = 'done') as done
from work_orders
where kind = 'preventive' and status <> 'cancelled'
  and scheduled_for <= (now() at time zone 'America/Sao_Paulo')::date
group by 1, 2;

-- Horas previstas x apontadas por OS
create or replace view v_work_order_hours with (security_invoker = true) as
select w.id as work_order_id, w.estimated_minutes,
       coalesce(sum(extract(epoch from t.ended_at - t.started_at) / 60), 0)::int as logged_minutes
from work_orders w left join time_entries t on t.work_order_id = w.id
group by w.id, w.estimated_minutes;

-- ───────────────────────── acesso (RLS) ─────────────────────────
-- admin/gestor: tudo. técnico: catálogo + OS dele ou das áreas dele. solicitante: só os próprios chamados.

do $$
declare t text;
begin
  foreach t in array array[
    'teams','profiles','sites','areas','profile_areas','systems','assets','asset_downtimes',
    'checklist_templates','checklist_items','categories','sla_rules','maintenance_plans','plan_assets',
    'work_orders','work_order_technicians','checklist_answers','attachments','signatures','time_entries',
    'work_order_events','materials','material_requests','documents','notifications','settings']
  loop
    execute format('alter table %I enable row level security', t);
  end loop;
end $$;

-- catálogos: todos os usuários ativos leem, só gestores escrevem
do $$
declare t text;
begin
  foreach t in array array[
    'teams','sites','areas','systems','assets','checklist_templates','checklist_items','categories',
    'sla_rules','maintenance_plans','plan_assets','materials','documents','settings','profile_areas']
  loop
    execute format('create policy %I on %I for select to authenticated using (current_role_name() is not null)', t || '_read', t);
    execute format('create policy %I on %I for all to authenticated using (is_manager()) with check (is_manager())', t || '_write', t);
  end loop;
end $$;

-- perfis: cada um lê o próprio; todos leem nome/função (para mostrar técnico na OS); só admin altera
create policy profiles_read on profiles for select to authenticated using (current_role_name() is not null);
create policy profiles_admin on profiles for all to authenticated
  using (current_role_name() = 'admin') with check (current_role_name() = 'admin');

create policy downtimes_read on asset_downtimes for select to authenticated using (current_role_name() in ('admin','manager','technician'));
create policy downtimes_write on asset_downtimes for all to authenticated
  using (current_role_name() in ('admin','manager','technician'))
  with check (current_role_name() in ('admin','manager','technician'));

-- OS
create policy wo_read on work_orders for select to authenticated using (can_see_work_order(id));
create policy wo_insert on work_orders for insert to authenticated
  with check (current_role_name() is not null
              and (is_manager() or (kind = 'corrective' and opened_by = auth.uid())));
create policy wo_update_staff on work_orders for update to authenticated
  using (is_manager() or (current_role_name() = 'technician' and can_see_work_order(id)))
  with check (is_manager() or (current_role_name() = 'technician' and can_see_work_order(id)));
-- solicitante só avalia/reabre o próprio chamado (colunas restritas na server action)
create policy wo_update_requester on work_orders for update to authenticated
  using (current_role_name() = 'requester' and opened_by = auth.uid())
  with check (current_role_name() = 'requester' and opened_by = auth.uid());
create policy wo_delete on work_orders for delete to authenticated using (is_manager());

-- filhos da OS: quem vê a OS lê; técnico e gestor escrevem
do $$
declare t text;
begin
  foreach t in array array['work_order_technicians','checklist_answers','signatures','time_entries','material_requests','work_order_events']
  loop
    execute format('create policy %I on %I for select to authenticated using (can_see_work_order(work_order_id))', t || '_read', t);
  end loop;
  foreach t in array array['checklist_answers','signatures','time_entries','material_requests']
  loop
    execute format($p$create policy %I on %I for all to authenticated
      using (current_role_name() in ('admin','manager','technician') and can_see_work_order(work_order_id))
      with check (current_role_name() in ('admin','manager','technician') and can_see_work_order(work_order_id))$p$,
      t || '_write', t);
  end loop;
end $$;
create policy wot_write on work_order_technicians for all to authenticated using (is_manager()) with check (is_manager());
-- eventos são escritos só pelos triggers (security definer)

-- anexos: de OS (quem vê a OS; solicitante pode anexar foto no próprio chamado) ou de ativo (gestor)
create policy attachments_read on attachments for select to authenticated
  using ((work_order_id is not null and can_see_work_order(work_order_id))
         or (asset_id is not null and current_role_name() is not null));
create policy attachments_write on attachments for insert to authenticated
  with check ((work_order_id is not null and can_see_work_order(work_order_id))
              or (asset_id is not null and is_manager()));
create policy attachments_delete on attachments for delete to authenticated
  using (is_manager() or uploaded_by = auth.uid());

create policy notifications_own on notifications for select to authenticated using (profile_id = auth.uid());
create policy notifications_mark_read on notifications for update to authenticated
  using (profile_id = auth.uid()) with check (profile_id = auth.uid());

-- ───────────────────────── permissões das funções ─────────────────────────
-- Ninguém chama pela API sem login. O Supabase dá EXECUTE a anon/authenticated por padrão; tiramos.
revoke execute on function
  current_role_name(), is_manager(), can_see_area(uuid), can_see_work_order(uuid), find_sla(uuid, text),
  work_order_before(), work_order_after(), technician_assigned(), answer_before(), set_updated_at(),
  generate_preventive_work_orders(uuid), check_sla(), reschedule_plan(uuid)
from public, anon, authenticated;

-- As regras de acesso (RLS) são avaliadas como o usuário logado: ele precisa executar os ajudantes.
grant execute on function current_role_name(), is_manager(), can_see_area(uuid), can_see_work_order(uuid)
  to authenticated;
-- O gatilho work_order_before roda como quem abre o chamado e calcula o prazo com find_sla()
grant execute on function find_sla(uuid, text) to authenticated;
-- O gestor regera um plano pela tela; a função confere is_manager().
grant execute on function reschedule_plan(uuid) to authenticated;
-- Gatilhos não precisam de EXECUTE para disparar. Gerador e SLA: só pg_cron (postgres) e o servidor.
grant execute on function generate_preventive_work_orders(uuid), check_sla() to service_role;

alter default privileges in schema public revoke execute on functions from public, anon;

-- Agendamentos (Supabase: habilitar a extensão pg_cron no painel)
-- select cron.schedule('preventivas-diarias', '0 6 * * *', $$select generate_preventive_work_orders()$$);  -- 03:00 em Brasília
-- select cron.schedule('sla-15min', '*/15 * * * *', $$select check_sla()$$);
