-- =============================================================
-- 使用量（トークン）の記録と集計
-- 「どの会社が、どれだけAIを使ったか」を1件ずつ台帳に残す
-- =============================================================

create table usage_events (
  id              uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id) on delete cascade,
  project_id      uuid references projects(id) on delete set null,
  kind            text not null,        -- llm / embedding
  feature         text,                 -- chat_answer / doc_ingest / suggestion / faq_embed / query_embed
  model           text,
  input_tokens    int not null default 0,
  output_tokens   int not null default 0,
  total_tokens    int not null default 0,
  cost_usd        numeric not null default 0,
  created_at      timestamptz not null default now()
);
create index idx_usage_org_time on usage_events(organization_id, created_at);
create index idx_usage_project_time on usage_events(project_id, created_at);
create index idx_usage_created_brin on usage_events using brin(created_at);

alter table usage_events enable row level security;

-- 自社の使用量は閲覧できる（書き込みはサーバー／管理者のみ）
create policy usage_select on usage_events
  for select using (organization_id in (select auth_org_ids()));
create policy usage_write on usage_events
  for all using (organization_id in (select auth_admin_org_ids()))
  with check (organization_id in (select auth_admin_org_ids()));

-- 会社ごとの期間集計（自社分）-----------------------------------
create or replace function usage_summary(
  p_organization_id uuid,
  p_days int default 30
)
returns table (total_tokens bigint, cost_usd numeric, event_count bigint)
language sql stable as $$
  select coalesce(sum(total_tokens),0)::bigint,
         coalesce(sum(cost_usd),0)::numeric,
         count(*)::bigint
  from usage_events
  where organization_id = p_organization_id
    and created_at >= (now() - make_interval(days => p_days))
$$;

-- 日別の使用量（自社分・推移用）---------------------------------
create or replace function usage_by_day(
  p_organization_id uuid,
  p_days int default 30
)
returns table (day date, total_tokens bigint, cost_usd numeric)
language sql stable as $$
  select date_trunc('day', created_at)::date,
         sum(total_tokens)::bigint,
         sum(cost_usd)::numeric
  from usage_events
  where organization_id = p_organization_id
    and created_at >= (now() - make_interval(days => p_days))
  group by 1
  order by 1
$$;

-- 全社の使用量ランキング（運営者用・service roleで呼ぶ）---------
create or replace function usage_by_organization(
  p_days int default 30
)
returns table (
  organization_id uuid,
  organization_name text,
  total_tokens bigint,
  cost_usd numeric,
  event_count bigint
)
language sql stable security definer set search_path = public as $$
  select o.id, o.name,
         coalesce(sum(u.total_tokens),0)::bigint,
         coalesce(sum(u.cost_usd),0)::numeric,
         count(u.id)::bigint
  from organizations o
  left join usage_events u
    on u.organization_id = o.id
   and u.created_at >= (now() - make_interval(days => p_days))
  group by o.id, o.name
  order by coalesce(sum(u.cost_usd),0) desc
$$;
