-- =============================================================
-- 検索用の関数 ＋ 未解決質問の棚
-- =============================================================

-- 未解決質問（答えられなかった質問をためる＝改善のもと）-----------
create table unresolved_questions (
  id                  uuid primary key default gen_random_uuid(),
  project_id          uuid not null references projects(id) on delete cascade,
  session_id          uuid references chat_sessions(id) on delete set null,
  message_id          uuid references chat_messages(id) on delete set null,
  question_raw        text not null,
  question_normalized text,
  reason              text,   -- low_confidence / sensitive_topic / injection_blocked / no_source / feedback_unresolved
  best_score          numeric,
  embedding           vector(1536),
  status              text not null default 'open',  -- open / clustered / resolved / ignored
  cluster_id          uuid,
  created_at          timestamptz not null default now()
);
create index idx_unresolved_project_status on unresolved_questions(project_id, status);

alter table unresolved_questions enable row level security;
create policy unresolved_questions_select on unresolved_questions
  for select using (project_in_my_orgs(project_id));
create policy unresolved_questions_write on unresolved_questions
  for all using (project_in_my_admin_orgs(project_id))
  with check (project_in_my_admin_orgs(project_id));

-- 意味で似ているFAQを探す関数 -----------------------------------
-- 質問のベクトルを渡すと、近いFAQを similarity（0〜1, 高いほど近い）付きで返す
create or replace function match_faqs(
  p_project_id      uuid,
  p_query_embedding vector(1536),
  p_match_threshold float default 0.0,
  p_match_count     int default 5
)
returns table (faq_id uuid, question text, answer text, similarity float)
language sql stable as $$
  select f.id, f.question, f.answer,
         1 - (e.embedding <=> p_query_embedding) as similarity
  from faq_embeddings e
  join faqs f on f.id = e.faq_id
  where e.project_id = p_project_id
    and f.status = 'published'
    and 1 - (e.embedding <=> p_query_embedding) > p_match_threshold
  order by e.embedding <=> p_query_embedding
  limit p_match_count;
$$;

-- 意味で似ているドキュメント断片を探す関数（Phase 5のRAG用に先行作成）
-- ※ documents / document_chunks テーブルは Phase 5 のマイグレーションで作る予定。
--   ここでは関数だけ用意しておきたいが、テーブル未作成だと作れないため
--   Phase 5 のマイグレーションで一緒に定義する。
