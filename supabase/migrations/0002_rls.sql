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
