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
