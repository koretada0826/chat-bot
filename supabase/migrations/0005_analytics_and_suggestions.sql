-- =============================================================
-- 改善候補の棚 ＋ 許可ドメインの棚 ＋ 分析用の関数
-- =============================================================

-- 改善候補（AIが作る「新FAQ案」など。承認するとFAQになる）---------
create table improvement_suggestions (
  id              uuid primary key default gen_random_uuid(),
  project_id      uuid not null references projects(id) on delete cascade,
  type            text not null,    -- new_faq / improve_faq / new_document / merge_duplicate / recategorize
  priority        numeric not null default 0,
  title           text,
  summary         text,
  payload         jsonb not null default '{}',   -- 下書きFAQ（question/answer）など
  evidence        jsonb not null default '{}',   -- 代表質問・件数など
  status          text not null default 'pending', -- pending / approved / rejected / applied
  applied_faq_id  uuid references faqs(id) on delete set null,
  created_by      text not null default 'system',
  created_at      timestamptz not null default now()
);
create index idx_suggestions_project_status on improvement_suggestions(project_id, status, priority desc);

alter table improvement_suggestions enable row level security;
create policy suggestions_select on improvement_suggestions
  for select using (project_in_my_orgs(project_id));
create policy suggestions_write on improvement_suggestions
  for all using (project_in_my_admin_orgs(project_id))
  with check (project_in_my_admin_orgs(project_id));

-- 許可ドメイン（ウィジェットを表示してよいサイト）------------------
create table embed_domains (
  id          uuid primary key default gen_random_uuid(),
  project_id  uuid not null references projects(id) on delete cascade,
  domain      text not null,
  enabled     boolean not null default true,
  created_at  timestamptz not null default now(),
  unique (project_id, domain)
);
create index idx_embed_domains_project on embed_domains(project_id);

alter table embed_domains enable row level security;
create policy embed_domains_select on embed_domains
  for select using (project_in_my_orgs(project_id));
create policy embed_domains_write on embed_domains
  for all using (project_in_my_admin_orgs(project_id))
  with check (project_in_my_admin_orgs(project_id));

-- 日別の質問数（推移グラフ用）------------------------------------
create or replace function count_messages_by_day(
  p_project_id uuid,
  p_days int default 14
)
returns table (day date, cnt bigint)
language sql stable as $$
  select date_trunc('day', created_at)::date as day, count(*)::bigint as cnt
  from chat_messages
  where project_id = p_project_id
    and role = 'user'
    and created_at >= (now() - make_interval(days => p_days))
  group by 1
  order by 1
$$;

-- よくある質問ランキング（正規化された質問文でまとめる）-----------
create or replace function top_questions(
  p_project_id uuid,
  p_days int default 30,
  p_limit int default 10
)
returns table (question text, cnt bigint)
language sql stable as $$
  select coalesce(nullif(content_normalized,''), content_raw) as question,
         count(*)::bigint as cnt
  from chat_messages
  where project_id = p_project_id
    and role = 'user'
    and created_at >= (now() - make_interval(days => p_days))
  group by 1
  order by cnt desc
  limit p_limit
$$;

-- 未解決質問ランキング ------------------------------------------
create or replace function top_unresolved(
  p_project_id uuid,
  p_limit int default 10
)
returns table (question text, cnt bigint)
language sql stable as $$
  select coalesce(nullif(question_normalized,''), question_raw) as question,
         count(*)::bigint as cnt
  from unresolved_questions
  where project_id = p_project_id
    and status = 'open'
  group by 1
  order by cnt desc
  limit p_limit
$$;
