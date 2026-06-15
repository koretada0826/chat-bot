-- =============================================================
-- お試し用のサンプルデータ（任意）
-- 使い方:
--   1. まず管理画面でログイン＆「会社・プロジェクト」を作る
--   2. SupabaseのSQL Editorで下の <PROJECT_ID> を自分のprojects.idに置き換えて実行
-- ※ RLSを通すため、SupabaseダッシュボードのSQL Editor（service権限）で実行してください
-- =============================================================

-- 例: カテゴリ
insert into faq_categories (project_id, name, sort_order) values
  ('<PROJECT_ID>', '配送について', 1),
  ('<PROJECT_ID>', '返品・キャンセル', 2),
  ('<PROJECT_ID>', '会員・ログイン', 3);

-- 例: FAQ（公開状態）
insert into faqs (project_id, question, answer, status) values
  ('<PROJECT_ID>', '送料はいくらですか？', '全国一律550円です。5,000円以上のご購入で送料無料になります。', 'published'),
  ('<PROJECT_ID>', '返品はできますか？', '商品到着後7日以内で未使用の場合に限り、返品を承ります。', 'published'),
  ('<PROJECT_ID>', 'パスワードを忘れました', 'ログイン画面の「パスワードをお忘れの方」から再設定できます。', 'published');

-- 例: 辞書（表記ゆれ）
insert into dictionary_terms (project_id, term, canonical, type) values
  ('<PROJECT_ID>', '送料', '配送料', 'synonym'),
  ('<PROJECT_ID>', 'パス', 'パスワード', 'abbrev');
