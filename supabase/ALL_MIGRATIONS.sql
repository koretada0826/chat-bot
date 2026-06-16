-- AnswerOps 全マイグレーション統合（Supabase SQL Editor に貼って実行する用）
-- 0001〜0009を順番に結合。


-- ====== 0001_init.sql ======
-- =============================================================
-- AnswerOps AI - 初期スキーマ (Phase 1 + 2 の土台)
-- ロボットの記憶を入れる「棚」をまとめて作る
-- =============================================================

-- 拡張機能を有効化 -------------------------------------------------
create extension if not exists "pgcrypto";   -- gen_random_uuid() 用
create extension if not exists "vector";      -- 意味検索（embedding）用 pgvector

-- 後で作るテーブルを参照するヘルパー関数を先に定義するため、本体の存在チェックを後回しにする
-- （pg_dump も使う定番設定。全statement実行後に整合する）
set check_function_bodies = off;

-- 更新日時を自動で入れる小さな部品 --------------------------------
create or replace function set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- ログイン中ユーザーが所属する組織IDを返すヘルパー（RLSで使う）----
create or replace function auth_org_ids()
returns setof uuid
language sql stable security definer set search_path = public as $$
  select organization_id
  from organization_members
  where user_id = auth.uid()
$$;

-- そのユーザーが「管理者以上」で入っている組織IDを返す -----------
create or replace function auth_admin_org_ids()
returns setof uuid
language sql stable security definer set search_path = public as $$
  select organization_id
  from organization_members
  where user_id = auth.uid() and role in ('owner','admin')
$$;

-- =============================================================
-- 1. users  （ログインした人のプロフィール。auth.usersと1:1）
-- =============================================================
create table users (
  id            uuid primary key references auth.users(id) on delete cascade,
  email         text not null,
  display_name  text,
  default_org_id uuid,
  preferences   jsonb not null default '{}',
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);
create trigger trg_users_updated before update on users
  for each row execute function set_updated_at();

-- =============================================================
-- 2. organizations （会社＝契約のいちばん大きな単位）
-- =============================================================
create table organizations (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  plan        text not null default 'free',
  settings    jsonb not null default '{}',
  created_by  uuid references users(id),
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);
create trigger trg_orgs_updated before update on organizations
  for each row execute function set_updated_at();

-- default_org_id の参照を後付け（循環参照を避けるため）
alter table users
  add constraint users_default_org_fk
  foreign key (default_org_id) references organizations(id) on delete set null;

-- =============================================================
-- 3. organization_members （誰がどの会社に・どんな役割で所属か）
-- =============================================================
create table organization_members (
  id              uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id) on delete cascade,
  user_id         uuid not null references users(id) on delete cascade,
  role            text not null default 'member',  -- owner / admin / member / viewer
  permissions     jsonb not null default '{}',
  invited_at      timestamptz,
  accepted_at     timestamptz,
  created_at      timestamptz not null default now(),
  unique (organization_id, user_id)
);
create index idx_org_members_user on organization_members(user_id);

-- =============================================================
-- 4. projects （チャットボット1体＝1プロジェクト）
-- =============================================================
create table projects (
  id                    uuid primary key default gen_random_uuid(),
  organization_id       uuid not null references organizations(id) on delete cascade,
  name                  text not null,
  use_case              text,                 -- 社外/社内/EC/情シス/人事総務/コールセンター/その他
  default_locale        text not null default 'ja',
  status                text not null default 'active',
  onboarding_step       int  not null default 0,
  onboarding_completed_at timestamptz,
  public_key            text not null unique default encode(gen_random_bytes(16),'hex'), -- 埋め込み用の公開ID
  settings              jsonb not null default '{}',
  created_at            timestamptz not null default now(),
  updated_at            timestamptz not null default now()
);
create index idx_projects_org on projects(organization_id);
create trigger trg_projects_updated before update on projects
  for each row execute function set_updated_at();

-- =============================================================
-- 5. chatbot_settings （見た目・あいさつ文・回答のしきい値。projectと1:1）
-- =============================================================
create table chatbot_settings (
  id              uuid primary key default gen_random_uuid(),
  project_id      uuid not null unique references projects(id) on delete cascade,
  theme           jsonb not null default '{}',          -- 色・位置・フォント
  greeting_message text not null default 'こんにちは！ご質問をどうぞ。',
  placeholder     text not null default 'メッセージを入力…',
  show_categories boolean not null default true,
  tau_faq_high    numeric not null default 0.82,        -- これ以上ならFAQで即答
  tau_faq_low     numeric not null default 0.70,        -- これ未満はRAGや回答不能へ
  tau_doc         numeric not null default 0.75,        -- ドキュメント採用の最低点
  llm_provider    text not null default 'claude',
  llm_model       text,
  fallback_message text not null default '登録されている情報からは確認できませんでした。お手数ですがお問い合わせください。',
  inquiry_enabled boolean not null default true,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);
create trigger trg_chatbot_settings_updated before update on chatbot_settings
  for each row execute function set_updated_at();

-- =============================================================
-- 6. faq_categories （FAQの分類＝クリックメニューの構造）
-- =============================================================
create table faq_categories (
  id          uuid primary key default gen_random_uuid(),
  project_id  uuid not null references projects(id) on delete cascade,
  parent_id   uuid references faq_categories(id) on delete set null,
  name        text not null,
  sort_order  int  not null default 0,
  is_public   boolean not null default true,
  icon        text,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);
create index idx_faq_cat_project on faq_categories(project_id, parent_id, sort_order);
create trigger trg_faq_cat_updated before update on faq_categories
  for each row execute function set_updated_at();

-- =============================================================
-- 7. faqs （品質保証された「正しい答え」。回答の一次ソース）
-- =============================================================
create table faqs (
  id          uuid primary key default gen_random_uuid(),
  project_id  uuid not null references projects(id) on delete cascade,
  category_id uuid references faq_categories(id) on delete set null,
  question    text not null,
  answer      text not null,
  status      text not null default 'draft',   -- draft / published / archived
  locale      text not null default 'ja',
  view_count       int not null default 0,
  resolved_count   int not null default 0,
  unresolved_count int not null default 0,
  search_vector tsvector,
  source_suggestion_id uuid,                    -- どの改善提案から作られたか（後で参照）
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);
create index idx_faqs_project_status on faqs(project_id, status);
create index idx_faqs_category on faqs(category_id);
create index idx_faqs_search on faqs using gin(search_vector);
create trigger trg_faqs_updated before update on faqs
  for each row execute function set_updated_at();

-- 質問＋答えから検索用ベクトル(tsvector)を自動生成
create or replace function faqs_search_vector_update()
returns trigger language plpgsql as $$
begin
  new.search_vector :=
    setweight(to_tsvector('simple', coalesce(new.question,'')), 'A') ||
    setweight(to_tsvector('simple', coalesce(new.answer,'')),  'B');
  return new;
end;
$$;
create trigger trg_faqs_search before insert or update of question, answer on faqs
  for each row execute function faqs_search_vector_update();

-- =============================================================
-- 8. faq_tags / faq_tag_map （横断タグ）
-- =============================================================
create table faq_tags (
  id          uuid primary key default gen_random_uuid(),
  project_id  uuid not null references projects(id) on delete cascade,
  name        text not null,
  created_at  timestamptz not null default now(),
  unique (project_id, name)
);
create table faq_tag_map (
  faq_id  uuid not null references faqs(id) on delete cascade,
  tag_id  uuid not null references faq_tags(id) on delete cascade,
  project_id uuid not null references projects(id) on delete cascade,
  primary key (faq_id, tag_id)
);
create index idx_faq_tag_map_tag on faq_tag_map(tag_id);

-- =============================================================
-- 9. faq_embeddings （FAQの意味検索ベクトル）
--    ※ embedding次元はモデルに合わせる。ここでは1536（OpenAI text-embedding-3-small）
-- =============================================================
create table faq_embeddings (
  id          uuid primary key default gen_random_uuid(),
  faq_id      uuid not null references faqs(id) on delete cascade,
  project_id  uuid not null references projects(id) on delete cascade,
  content     text not null,
  embedding   vector(1536) not null,
  model       text not null,
  created_at  timestamptz not null default now()
);
create index idx_faq_emb_project on faq_embeddings(project_id);
create index idx_faq_emb_faq on faq_embeddings(faq_id);
-- 近傍検索用インデックス（HNSW, cosine）
create index idx_faq_emb_vec on faq_embeddings using hnsw (embedding vector_cosine_ops);

-- =============================================================
-- 10. dictionary_terms （表記ゆれ・社内用語の正規化辞書）
-- =============================================================
create table dictionary_terms (
  id          uuid primary key default gen_random_uuid(),
  project_id  uuid not null references projects(id) on delete cascade,
  term        text not null,         -- 入力されうる語
  canonical   text not null,         -- 正しい形
  type        text not null default 'synonym',  -- synonym / jargon / abbrev
  enabled     boolean not null default true,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);
create index idx_dict_project on dictionary_terms(project_id, enabled);
create index idx_dict_term on dictionary_terms(project_id, term);
create trigger trg_dict_updated before update on dictionary_terms
  for each row execute function set_updated_at();

-- =============================================================
-- 11. chat_sessions （1回の会話のまとまり。匿名OK）
-- =============================================================
create table chat_sessions (
  id              uuid primary key default gen_random_uuid(),
  project_id      uuid not null references projects(id) on delete cascade,
  visitor_id      text,
  external_user_id text,             -- 会員ID/社員IDのひも付け
  page_url        text,
  user_agent      text,
  locale          text,
  status          text not null default 'open',
  started_at      timestamptz not null default now(),
  last_activity_at timestamptz not null default now()
);
create index idx_sessions_project on chat_sessions(project_id, started_at desc);
create index idx_sessions_visitor on chat_sessions(visitor_id);

-- =============================================================
-- 12. chat_messages （発言1つ1つのログ）
-- =============================================================
create table chat_messages (
  id          uuid primary key default gen_random_uuid(),
  session_id  uuid not null references chat_sessions(id) on delete cascade,
  project_id  uuid not null references projects(id) on delete cascade,
  role        text not null,        -- user / assistant / system
  content_raw text,
  content_normalized text,
  answer_type text,                 -- faq / rag / hybrid / unanswered / menu
  confidence  numeric,
  latency_ms  int,
  token_usage jsonb,
  model       text,
  created_at  timestamptz not null default now()
);
create index idx_msg_session on chat_messages(session_id, created_at);
create index idx_msg_project_time on chat_messages(project_id, created_at);
create index idx_msg_project_type on chat_messages(project_id, answer_type);

-- =============================================================
-- 13. answer_sources （回答の根拠＝どのFAQ/文章を使ったか＋点数）
-- =============================================================
create table answer_sources (
  id          uuid primary key default gen_random_uuid(),
  message_id  uuid not null references chat_messages(id) on delete cascade,
  project_id  uuid not null references projects(id) on delete cascade,
  source_type text not null,        -- faq / document
  faq_id      uuid references faqs(id) on delete set null,
  document_id uuid,                  -- documentsは後のマイグレーションで追加
  chunk_id    uuid,
  score       numeric not null,
  rank        int,
  created_at  timestamptz not null default now()
);
create index idx_ans_src_message on answer_sources(message_id);
create index idx_ans_src_project_type on answer_sources(project_id, source_type);
create index idx_ans_src_faq on answer_sources(faq_id);

-- =============================================================
-- 14. feedbacks （解決した？低評価？のフィードバック）
-- =============================================================
create table feedbacks (
  id          uuid primary key default gen_random_uuid(),
  message_id  uuid not null references chat_messages(id) on delete cascade,
  session_id  uuid not null references chat_sessions(id) on delete cascade,
  project_id  uuid not null references projects(id) on delete cascade,
  rating      text not null,        -- resolved / unresolved / up / down
  comment     text,
  created_at  timestamptz not null default now()
);
create index idx_feedback_project_rating on feedbacks(project_id, rating);
create index idx_feedback_message on feedbacks(message_id);

-- =============================================================
-- 15. bot_events （KPI集計のもとになる出来事ログ）
-- =============================================================
create table bot_events (
  id          uuid primary key default gen_random_uuid(),
  project_id  uuid not null references projects(id) on delete cascade,
  session_id  uuid references chat_sessions(id) on delete set null,
  event_type  text not null,        -- session_start / message_sent / answer_served / unanswered / feedback / escalation / menu_click / inquiry_submit
  answer_type text,
  meta        jsonb not null default '{}',
  created_at  timestamptz not null default now()
);
create index idx_events_project_type_time on bot_events(project_id, event_type, created_at);
create index idx_events_created_brin on bot_events using brin(created_at);


-- ====== 0002_rls.sql ======
-- =============================================================
-- AnswerOps AI - RLS（行レベルセキュリティ）
-- 「自分の会社の棚しか開けられない」鍵をすべてに掛ける
--
-- 方針:
--  - 管理画面はログイン中ユーザー(auth.uid())で判定
--  - 子テーブルは project_id を直接持っているので projects 経由で会社を判定
--  - 匿名の公開チャットAPIは anon キーを使わず、サーバ側(service_role)から
--    project_id を明示的に絞ってのみ読み書きする（RLSはここではバイパス）
-- =============================================================

-- すべての対象テーブルでRLSをON
alter table users                 enable row level security;
alter table organizations         enable row level security;
alter table organization_members  enable row level security;
alter table projects              enable row level security;
alter table chatbot_settings      enable row level security;
alter table faq_categories        enable row level security;
alter table faqs                  enable row level security;
alter table faq_tags              enable row level security;
alter table faq_tag_map           enable row level security;
alter table faq_embeddings        enable row level security;
alter table dictionary_terms      enable row level security;
alter table chat_sessions         enable row level security;
alter table chat_messages         enable row level security;
alter table answer_sources        enable row level security;
alter table feedbacks             enable row level security;
alter table bot_events            enable row level security;

-- ヘルパー: project_id がログインユーザーの所属組織のものか --------
create or replace function project_in_my_orgs(p_project_id uuid)
returns boolean
language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from projects
    where id = p_project_id
      and organization_id in (select auth_org_ids())
  )
$$;

create or replace function project_in_my_admin_orgs(p_project_id uuid)
returns boolean
language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from projects
    where id = p_project_id
      and organization_id in (select auth_admin_org_ids())
  )
$$;

-- 1. users : 本人のみ --------------------------------------------
create policy users_self_select on users
  for select using (id = auth.uid());
create policy users_self_update on users
  for update using (id = auth.uid());
create policy users_self_insert on users
  for insert with check (id = auth.uid());

-- 2. organizations : 所属組織は閲覧、管理者は更新 -----------------
create policy orgs_member_select on organizations
  for select using (id in (select auth_org_ids()));
create policy orgs_admin_update on organizations
  for update using (id in (select auth_admin_org_ids()));
create policy orgs_insert_self on organizations
  for insert with check (created_by = auth.uid());

-- 3. organization_members : 同じ組織のメンバーは閲覧、管理者は変更 --
create policy members_select on organization_members
  for select using (organization_id in (select auth_org_ids()));
create policy members_admin_write on organization_members
  for all using (organization_id in (select auth_admin_org_ids()))
  with check (organization_id in (select auth_admin_org_ids()));
-- 自分自身の最初の所属レコード作成を許可（サインアップ直後）
create policy members_self_insert on organization_members
  for insert with check (user_id = auth.uid());

-- 4. projects --------------------------------------------------
create policy projects_select on projects
  for select using (organization_id in (select auth_org_ids()));
create policy projects_admin_write on projects
  for all using (organization_id in (select auth_admin_org_ids()))
  with check (organization_id in (select auth_admin_org_ids()));

-- 共通: project_id を持つ子テーブル用ポリシーをまとめて作る -------
-- （閲覧=所属組織, 書き込み=管理者組織）
do $$
declare t text;
begin
  foreach t in array array[
    'chatbot_settings','faq_categories','faqs','faq_tags','faq_tag_map',
    'faq_embeddings','dictionary_terms','chat_sessions','chat_messages',
    'answer_sources','feedbacks','bot_events'
  ] loop
    execute format($f$
      create policy %1$s_select on %1$s
        for select using (project_in_my_orgs(project_id));
    $f$, t);
    execute format($f$
      create policy %1$s_write on %1$s
        for all using (project_in_my_admin_orgs(project_id))
        with check (project_in_my_admin_orgs(project_id));
    $f$, t);
  end loop;
end $$;


-- ====== 0003_auth_trigger.sql ======
-- =============================================================
-- サインアップ時に public.users の行を自動で作る仕掛け
-- （Supabase Authに登録 → 同時にアプリ側プロフィールも用意）
-- =============================================================
create or replace function handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.users (id, email, display_name)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'display_name', split_part(new.email,'@',1))
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function handle_new_user();


-- ====== 0004_search_and_unresolved.sql ======
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


-- ====== 0005_analytics_and_suggestions.sql ======
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


-- ====== 0006_documents.sql ======
-- =============================================================
-- ドキュメント（資料）用の棚と検索関数（RAG用）
-- =============================================================

-- ファイル保存用のバケット（非公開）------------------------------
insert into storage.buckets (id, name, public)
values ('documents', 'documents', false)
on conflict (id) do nothing;

-- 資料のメタ情報 ------------------------------------------------
create table documents (
  id              uuid primary key default gen_random_uuid(),
  project_id      uuid not null references projects(id) on delete cascade,
  title           text not null,
  file_path       text,            -- Storage上のパス
  source_url      text,            -- URL取込のとき
  mime_type       text,
  file_type       text,            -- pdf / docx / csv / md / txt / url
  status          text not null default 'pending', -- pending / processing / ready / failed
  error           text,
  reference_count int not null default 0,
  chunk_count     int not null default 0,
  priority        int not null default 0,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);
create index idx_documents_project_status on documents(project_id, status);

create trigger trg_documents_updated before update on documents
  for each row execute function set_updated_at();

-- 資料を細かく区切ったかけら（チャンク）＋ベクトル ----------------
create table document_chunks (
  id            uuid primary key default gen_random_uuid(),
  document_id   uuid not null references documents(id) on delete cascade,
  project_id    uuid not null references projects(id) on delete cascade,
  chunk_index   int not null,
  content       text not null,
  heading_path  text,            -- 例「料金 > 解約 > 違約金」
  page_no       int,
  embedding     vector(1536) not null,
  token_count   int,
  created_at    timestamptz not null default now()
);
create index idx_doc_chunks_project on document_chunks(project_id);
create index idx_doc_chunks_doc on document_chunks(document_id, chunk_index);
create index idx_doc_chunks_vec on document_chunks using hnsw (embedding vector_cosine_ops);

-- 取込ジョブの履歴 ----------------------------------------------
create table document_sources (
  id              uuid primary key default gen_random_uuid(),
  document_id     uuid references documents(id) on delete cascade,
  project_id      uuid not null references projects(id) on delete cascade,
  kind            text,        -- upload / url_fetch
  status          text,
  raw_text_length int,
  started_at      timestamptz,
  finished_at     timestamptz,
  error           text,
  created_at      timestamptz not null default now()
);
create index idx_doc_sources_doc on document_sources(document_id);

-- RLS ----------------------------------------------------------
alter table documents       enable row level security;
alter table document_chunks enable row level security;
alter table document_sources enable row level security;

create policy documents_select on documents
  for select using (project_in_my_orgs(project_id));
create policy documents_write on documents
  for all using (project_in_my_admin_orgs(project_id))
  with check (project_in_my_admin_orgs(project_id));

create policy doc_chunks_select on document_chunks
  for select using (project_in_my_orgs(project_id));
create policy doc_chunks_write on document_chunks
  for all using (project_in_my_admin_orgs(project_id))
  with check (project_in_my_admin_orgs(project_id));

create policy doc_sources_select on document_sources
  for select using (project_in_my_orgs(project_id));
create policy doc_sources_write on document_sources
  for all using (project_in_my_admin_orgs(project_id))
  with check (project_in_my_admin_orgs(project_id));

-- 資料の参照回数を1つ増やす（ランキング用）----------------------
create or replace function increment_document_reference(p_document_id uuid)
returns void language sql as $$
  update documents set reference_count = reference_count + 1
  where id = p_document_id;
$$;

-- 意味で似ているチャンクを探す関数 ------------------------------
create or replace function match_document_chunks(
  p_project_id      uuid,
  p_query_embedding vector(1536),
  p_match_threshold float default 0.0,
  p_match_count     int default 5
)
returns table (
  chunk_id uuid,
  document_id uuid,
  document_title text,
  content text,
  heading_path text,
  page_no int,
  similarity float
)
language sql stable as $$
  select c.id, c.document_id, d.title, c.content, c.heading_path, c.page_no,
         1 - (c.embedding <=> p_query_embedding) as similarity
  from document_chunks c
  join documents d on d.id = c.document_id
  where c.project_id = p_project_id
    and d.status = 'ready'
    and 1 - (c.embedding <=> p_query_embedding) > p_match_threshold
  order by c.embedding <=> p_query_embedding
  limit p_match_count;
$$;


-- ====== 0007_usage.sql ======
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


-- ====== 0008_security_fixes.sql ======
-- =============================================================
-- セキュリティ修正（QA監査の指摘対応）
-- 0001〜0007 の後に適用すること
-- =============================================================

-- 【ブロッカー1】全社の使用量を引ける関数を service_role 限定にする
-- （SECURITY DEFINER で RLS をバイパスするため、誰でも呼べると全契約企業のコストが漏れる）
revoke execute on function usage_by_organization(int) from public;
revoke execute on function usage_by_organization(int) from anon;
revoke execute on function usage_by_organization(int) from authenticated;
-- service_role からのみ実行可能（管理画面の運営者表示はサーバー側で service_role 経由）

-- 【ブロッカー2】新規会社の作成が RLS で必ず失敗する問題を解消
-- insert ... returning した行を、メンバー登録前でも「作成者本人」が読めるようにする
create policy orgs_creator_select on organizations
  for select using (created_by = auth.uid());

-- 【整合性】フィードバックの多重投稿を防ぐ（同じ回答×同じセッションは1票）
-- ※ 制約適用前に既存の重複を1件へ統合する（重複が1件でもあると0008全体がロールバックするため）
delete from feedbacks a using feedbacks b
  where a.ctid < b.ctid and a.message_id = b.message_id and a.session_id = b.session_id;
alter table feedbacks
  add constraint feedbacks_unique_per_session unique (message_id, session_id);

-- 【設定堅牢化】しきい値は 0〜1 の範囲のみ許可（不正値で全停止/誤回答を防ぐ）
alter table chatbot_settings
  add constraint chatbot_settings_tau_high_range check (tau_faq_high >= 0 and tau_faq_high <= 1),
  add constraint chatbot_settings_tau_low_range  check (tau_faq_low  >= 0 and tau_faq_low  <= 1),
  add constraint chatbot_settings_tau_doc_range  check (tau_doc      >= 0 and tau_doc      <= 1);

-- 【重複防止】カテゴリ・辞書の同名重複を防ぐ（事前に重複統合してから制約付与）
delete from faq_categories a using faq_categories b
  where a.ctid < b.ctid and a.project_id = b.project_id and a.name = b.name;
alter table faq_categories
  add constraint faq_categories_unique_name unique (project_id, name);
delete from dictionary_terms a using dictionary_terms b
  where a.ctid < b.ctid and a.project_id = b.project_id and a.term = b.term;
alter table dictionary_terms
  add constraint dictionary_terms_unique_term unique (project_id, term);


-- ====== 0009_security_fixes2.sql ======
-- =============================================================
-- セキュリティ修正 第2弾（再監査の指摘対応）
-- 0001〜0008 の後に適用すること
-- =============================================================

-- 【ブロッカー】他社組織への「オーナー自己参加（乗っ取り）」を封じる
-- 旧 members_self_insert は user_id=auth.uid() しか見ておらず、
-- 任意の organization_id に role='owner' で自分を挿入できてしまった。
-- → 自己挿入は「自分が作成した組織で、まだメンバーが1人もいない初回登録」だけに限定する。
drop policy if exists members_self_insert on organization_members;
create policy members_self_bootstrap on organization_members
  for insert
  with check (
    user_id = auth.uid()
    and role = 'owner'
    -- その組織を作ったのが自分であること
    and exists (
      select 1 from organizations o
      where o.id = organization_id and o.created_by = auth.uid()
    )
    -- まだ誰もメンバーがいない（=初回ブートストラップ）こと
    and not exists (
      select 1 from organization_members m
      where m.organization_id = organization_members.organization_id
    )
  );
-- ※ 既存組織への招待参加は、今後 service_role 経由の別フローで実装する。

-- 【コスト上限の正確化】プロジェクトの日次トークン合計をDB側で集約して返す。
-- アプリ側で生の行を取得して合算すると PostgREST の1000行上限で頭打ちになり、
-- 高負荷時にコスト上限が機能しなくなるため、必ずこの集約関数で判定する。
create or replace function project_token_usage(
  p_project_id uuid,
  p_days int default 1
)
returns bigint
language sql stable as $$
  select coalesce(sum(total_tokens), 0)::bigint
  from usage_events
  where project_id = p_project_id
    and created_at >= (now() - make_interval(days => p_days))
$$;
-- 集計用なので匿名でも呼べてよいが、service_role経由で使う想定。

-- 【データ汚染防止】未解決質問の多重登録を防ぐ（同じ回答×同じセッションは1件）
delete from unresolved_questions a using unresolved_questions b
  where a.ctid < b.ctid
    and a.message_id is not null
    and a.message_id = b.message_id
    and a.session_id is not null
    and a.session_id = b.session_id;
create unique index unresolved_unique_msg_session
  on unresolved_questions (message_id, session_id)
  where message_id is not null and session_id is not null;

