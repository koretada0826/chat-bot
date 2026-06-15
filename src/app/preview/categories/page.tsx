import { Card, Badge, PageHeader } from "@/components/ui/saas";
import { FolderTree, Plus, FileQuestion } from "lucide-react";

const CATEGORIES = [
  { name: "配送・送料", count: 12, color: "#2563eb", desc: "送料・配送日・追跡など" },
  { name: "返品・交換", count: 9, color: "#0891b2", desc: "返品条件・手続き・送料負担" },
  { name: "支払い", count: 7, color: "#16a34a", desc: "支払い方法・領収書・請求" },
  { name: "アカウント", count: 6, color: "#ea580c", desc: "ログイン・パスワード・退会" },
  { name: "商品について", count: 15, color: "#7c3aed", desc: "仕様・在庫・お手入れ" },
  { name: "定期便", count: 5, color: "#db2777", desc: "申込・変更・解約" },
];

export default function CategoriesPage() {
  const total = CATEGORIES.reduce((a, b) => a + b.count, 0);
  return (
    <div>
      <PageHeader
        icon={FolderTree}
        title="FAQカテゴリ"
        desc="FAQをグループ分けする「棚」です。カテゴリを整えると、お客様も管理側も探しやすくなります。"
        action={
          <button className="inline-flex items-center gap-1 rounded-lg bg-[var(--color-brand)] px-3 py-1.5 text-xs font-medium text-white hover:opacity-90">
            <Plus className="h-3.5 w-3.5" />
            カテゴリを追加
          </button>
        }
      />

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {CATEGORIES.map((c) => (
          <Card key={c.name} className="p-4">
            <div className="flex items-center gap-2.5">
              <span className="h-3 w-3 rounded-full" style={{ background: c.color }} />
              <p className="flex-1 text-sm font-semibold text-neutral-900">{c.name}</p>
              <Badge tone="neutral">
                <FileQuestion className="h-3 w-3" /> {c.count}
              </Badge>
            </div>
            <p className="mt-2 text-xs leading-relaxed text-neutral-500">{c.desc}</p>
          </Card>
        ))}
      </div>

      <p className="mt-3 text-xs text-neutral-500">
        全{CATEGORIES.length}カテゴリ ・ FAQ合計 {total}件（見本値。FAQ一覧では代表的なFAQのみ表示しています）
      </p>
    </div>
  );
}
