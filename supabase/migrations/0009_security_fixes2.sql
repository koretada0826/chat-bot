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
