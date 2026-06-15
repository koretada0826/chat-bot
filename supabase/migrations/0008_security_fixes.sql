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
