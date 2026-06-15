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
