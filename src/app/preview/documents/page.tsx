import { Card, Badge, PageHeader } from "@/components/ui/saas";
import { FileText, Upload, CheckCircle2, Loader } from "lucide-react";

const DOCS = [
  { name: "会員ログイン・パスワードFAQ.pdf", size: "2.4 MB", pages: 18, chunks: 64, status: "取り込み済み", date: "6/10" },
  { name: "トースターXT-2023取扱説明書.pdf", size: "1.1 MB", pages: 12, chunks: 38, status: "取り込み済み", date: "6/9" },
  { name: "配送ポリシー.pdf", size: "320 KB", pages: 4, chunks: 11, status: "取り込み済み", date: "6/9" },
  { name: "返品・交換規約.docx", size: "88 KB", pages: 3, chunks: 9, status: "取り込み済み", date: "6/8" },
  { name: "2026年 料金表.pdf", size: "540 KB", pages: 2, chunks: 0, status: "処理中", date: "たった今" },
];

export default function DocumentsPage() {
  return (
    <div>
      <PageHeader
        icon={FileText}
        title="ドキュメント"
        desc="PDFやWord資料をアップロードすると、AIが中身を読み取って検索できるようにします。出典ページ付きで回答できます。"
        action={
          <button className="inline-flex items-center gap-1 rounded-lg bg-[var(--color-brand)] px-3 py-1.5 text-xs font-medium text-white hover:opacity-90">
            <Upload className="h-3.5 w-3.5" />
            資料をアップロード
          </button>
        }
      />

      {/* アップロード枠（見本） */}
      <div className="mb-4 flex flex-col items-center justify-center rounded-xl border border-dashed border-[var(--color-hairline)] bg-white px-4 py-7 text-center">
        <Upload className="h-6 w-6 text-neutral-300" />
        <p className="mt-2 text-sm text-neutral-500">ここにファイルをドラッグ＆ドロップ</p>
        <p className="mt-0.5 text-xs text-neutral-400">PDF / Word / テキスト（1ファイル最大20MB）</p>
      </div>

      <Card className="overflow-hidden p-0">
       <div className="overflow-x-auto">
        <table className="w-full min-w-[560px] text-sm">
          <thead>
            <tr className="border-b border-[var(--color-hairline)] text-left text-xs text-neutral-500">
              <th className="px-5 py-2.5 font-medium">ファイル名</th>
              <th className="px-5 py-2.5 font-medium">サイズ</th>
              <th className="px-5 py-2.5 font-medium">ページ</th>
              <th className="px-5 py-2.5 font-medium">取り込み</th>
              <th className="px-5 py-2.5 font-medium">状態</th>
            </tr>
          </thead>
          <tbody>
            {DOCS.map((d) => (
              <tr key={d.name} className="border-b border-[var(--color-hairline)] last:border-0">
                <td className="px-5 py-3">
                  <span className="flex items-center gap-2">
                    <FileText className="h-4 w-4 text-[var(--color-danger)]" />
                    <span className="font-medium text-neutral-800">{d.name}</span>
                  </span>
                </td>
                <td className="px-5 py-3 text-neutral-500">{d.size}</td>
                <td className="px-5 py-3 text-neutral-500">{d.pages}p</td>
                <td className="px-5 py-3 text-neutral-500">{d.chunks > 0 ? `${d.chunks}片` : "—"}</td>
                <td className="px-5 py-3">
                  {d.status === "取り込み済み" ? (
                    <Badge tone="success">
                      <CheckCircle2 className="h-3 w-3" /> {d.status}
                    </Badge>
                  ) : (
                    <Badge tone="warn">
                      <Loader className="h-3 w-3" /> {d.status}
                    </Badge>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
       </div>
      </Card>
      <p className="mt-3 text-xs text-neutral-500">
        ※「片（チャンク）」＝ AIが探しやすいように資料を小さく区切った単位です。
      </p>
    </div>
  );
}
