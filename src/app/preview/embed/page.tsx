"use client";

import { useState } from "react";
import { Card, PageHeader } from "@/components/ui/saas";
import { Code2, Copy, Check } from "lucide-react";

// 実装に合わせた形式：自ホストの /widget.js ＋ data-project。
// 「公開URL」は本番デプロイ後の自分のサイトURL（例：https://your-app.vercel.app）。
const SNIPPET = `<script
  src="https://（あなたの公開URL）/widget.js"
  data-project="proj_ecsite_8x2k9"
  async
></script>`;

export default function EmbedPage() {
  const [copied, setCopied] = useState(false);

  function copy() {
    const done = () => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    };
    if (navigator.clipboard?.writeText) {
      navigator.clipboard.writeText(SNIPPET).then(done).catch(done);
    } else {
      // クリップボード非対応環境でも「選択」状態にして手動コピーできるように
      done();
    }
  }

  return (
    <div>
      <PageHeader
        icon={Code2}
        title="埋め込みコード"
        desc="このコードを自社サイトの HTML に貼るだけで、チャットが表示されます。プログラミングの知識はほとんど不要です。"
      />

      <Card className="p-5">
        <div className="mb-2 flex items-center justify-between">
          <p className="text-sm font-semibold text-neutral-900">サイトに貼るコード</p>
          <button
            onClick={copy}
            className="inline-flex items-center gap-1 rounded-lg bg-[var(--color-brand)] px-3 py-1.5 text-xs font-medium text-white hover:opacity-90"
          >
            {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
            {copied ? "コピーしました" : "コピー"}
          </button>
        </div>
        <pre className="overflow-x-auto rounded-lg bg-neutral-900 px-4 py-3.5 text-xs leading-relaxed text-neutral-100">
          <code>{SNIPPET}</code>
        </pre>
        <p className="mt-2 text-xs text-neutral-500">
          ※ &lt;/body&gt; の直前に貼るのがおすすめです。アプリを公開URLに出した後、その公開URLを <code>src</code> に入れて貼ると表示されます。
        </p>
      </Card>

      <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Card className="p-4">
          <p className="text-xs text-neutral-400">プロジェクトキー</p>
          <p className="mt-1 font-mono text-sm text-neutral-800">proj_ecsite_8x2k9</p>
        </Card>
        <Card className="p-4">
          <p className="text-xs text-neutral-400">表示位置</p>
          <p className="mt-1 text-sm text-neutral-800">右下</p>
        </Card>
        <Card className="p-4">
          <p className="text-xs text-neutral-400">状態</p>
          <p className="mt-1 text-sm font-medium text-[var(--color-warn)]">テスト中</p>
        </Card>
      </div>

      <Card className="mt-4 p-5">
        <p className="text-sm font-semibold text-neutral-900">かんたん3ステップ</p>
        <ol className="mt-2 space-y-1.5 text-sm text-neutral-600">
          <li>1. 上の「コピー」を押す</li>
          <li>2. 自社サイトの HTML（&lt;/body&gt; の直前）に貼り付ける</li>
          <li>3. 保存して公開 → チャットが表示されます</li>
        </ol>
      </Card>
    </div>
  );
}
