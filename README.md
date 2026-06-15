# AnswerOps AI

法人向け「問い合わせ削減AIチャットボット」SaaS。
FAQ・ドキュメント・問い合わせ履歴を活用して、問い合わせを継続的に減らすAIナレッジ運用基盤です。

技術: Next.js 16 (App Router) / TypeScript / Tailwind CSS / Supabase (Auth・Postgres・pgvector) / LLM抽象（Claude/OpenAI/Gemini）

---

## いまの状態（2026-06）

できているもの（MVPコア Phase1〜7 完成）:
- ログイン / 新規登録 / 会社・プロジェクト作成
- 管理画面（左メニュー）
- ダッシュボード（本物のKPI・推移グラフ・改善アクション）
- FAQ 作成・編集・削除・公開（保存時に意味検索ベクトル自動生成）/ カテゴリ / タグ / 辞書
- 検索（FAQキーワード＋意味検索）＋回答エンジン（辞書→ガード→検索→AI回答→回答不能判定）
- ドキュメント（PDF/Word/CSV/MD/txt）アップ → 抽出 → チャンク → embedding → RAG回答
- チャット画面（デモ）＋参照元表示＋解決/未解決フィードバック
- 質問ログ・チャット履歴 / 未解決 / 低評価
- 改善候補（未解決からAIが新FAQ案を生成 → 承認でFAQ公開）★問い合わせ削減の輪
- チャットボット設定（あいさつ・しきい値・モデル）
- 埋め込みウィジェット（widget.js を1行貼るだけで右下にチャット表示）＋許可ドメイン
- 公開チャットAPI（session / message / feedback）＋レート制限
- AIプロバイダ抽象（Claude回答 / OpenAI embedding、後で差し替え可）
- データベース（22テーブル＋RLS＋pgvector＋検索/集計関数）

まだのもの: 業界テンプレート＋初期セットアップ8ステップ / 多言語 / 本格有人チャット / 外部連携（Slack/Teams/LINE等）/ 分散レート制限 など（ロードマップ参照）

補足:
- AIの鍵（ANTHROPIC_API_KEY）が未設定でも、ピッタリ合うFAQが見つかればその答えをそのまま返します。
- 意味検索・RAGは Embedding鍵（OPENAI_API_KEY）が必要です。FAQのキーワード検索は鍵なしでも動きます。

---

## 動かすための準備（電源を入れる手順）

### 1. Supabaseの棚を用意する
1. https://supabase.com にアクセスして無料アカウントを作る
2. 「New project」で新しいプロジェクトを作る（リージョンは Tokyo 推奨）
3. しばらく待つと棚が完成する

### 2. 棚の設計図を流し込む
Supabaseの画面左「SQL Editor」を開き、次の9つのファイルの中身を**順番に**貼り付けて実行する:
1. `supabase/migrations/0001_init.sql` （棚を作る）
2. `supabase/migrations/0002_rls.sql` （鍵をかける）
3. `supabase/migrations/0003_auth_trigger.sql` （登録時の自動処理）
4. `supabase/migrations/0004_search_and_unresolved.sql` （FAQ検索関数＋未解決質問の棚）
5. `supabase/migrations/0005_analytics_and_suggestions.sql` （分析関数＋改善候補・許可ドメインの棚）
6. `supabase/migrations/0006_documents.sql` （資料の棚＋RAG検索関数＋ファイル置き場）
7. `supabase/migrations/0007_usage.sql` （使用量・コストの記録）
8. `supabase/migrations/0008_security_fixes.sql` （セキュリティ修正：漏洩防止・会社作成・各種制約）
9. `supabase/migrations/0009_security_fixes2.sql` （乗っ取り穴の封鎖・コスト集計・未解決の重複防止）

### 3. 合言葉（鍵）をメモする
`.env.example` をコピーして `.env.local` を作り、本物の値を入れる:
- `NEXT_PUBLIC_SUPABASE_URL` と `NEXT_PUBLIC_SUPABASE_ANON_KEY`
  → Supabaseの「Project Settings > API」にある
- `SUPABASE_SERVICE_ROLE_KEY`
  → 同じ画面の service_role キー（**秘密。絶対に外に出さない**）
- AIを使うとき（Phase 3以降）は `ANTHROPIC_API_KEY` など

```bash
cp .env.example .env.local
# エディタで .env.local を開いて値を入れる
```

### 4. アプリを起動する
```bash
npm install
npm run dev
```
ブラウザで http://localhost:3000 を開く → ログイン画面が出ます。
新規登録 → 会社作成 → 管理画面、と進めます。

### 5.（任意）サンプルFAQを入れる
管理画面でプロジェクトを作った後、`supabase/seed.sql` の `<PROJECT_ID>` を
自分のプロジェクトIDに置き換えてSQL Editorで実行すると、画面が埋まります。

---

## 開発ロードマップ
- Phase 1: 基盤・ログイン・管理画面 ← 完了
- Phase 2: FAQ管理・辞書・検索 ← 管理UIは完了、検索は次
- Phase 3: チャットUI・AI回答・ログ・フィードバック
- Phase 4: ダッシュボード・未解決・改善候補
- Phase 5: ドキュメント・RAG
- Phase 6: Q&A自動生成・改善提案
- Phase 7: 埋め込みウィジェット
- Phase 8: 業界テンプレート
- Phase 9: 外部連携・有人チャット・多言語

## 重要メモ
- このNext.jsは16系。`middleware`は廃止され`proxy`(`src/proxy.ts`)に改名。`params`はasync。
- embeddingモデルは固定運用（途中で変えると全ベクトル作り直しが必要）。
