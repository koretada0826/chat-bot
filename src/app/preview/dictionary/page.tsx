import { Card, Badge, PageHeader } from "@/components/ui/saas";
import { BookA, Plus } from "lucide-react";

const TERMS = [
  { term: "定期便", reading: "ていきびん", synonyms: ["サブスク", "定期購入", "頒布会"], note: "毎月自動でお届けするサービス" },
  { term: "海外発送", reading: "かいがいはっそう", synonyms: ["国際配送", "海外配送", "海外への発送"], note: "現在は国内のみ対応" },
  { term: "のし", reading: "のし", synonyms: ["熨斗", "ギフト包装", "ラッピング"], note: "贈答用の包装" },
  { term: "インボイス", reading: "いんぼいす", synonyms: ["適格請求書", "領収書"], note: "登録番号入りの請求書" },
  { term: "クラフトレイ", reading: "くらふとれい", synonyms: ["パンくずトレイ", "受け皿"], note: "トースターの部品名" },
];

export default function DictionaryPage() {
  return (
    <div>
      <PageHeader
        icon={BookA}
        title="用語辞書"
        desc="言い方ゆれ（同じ意味の別の言葉）を登録します。お客様が違う言葉で聞いても、AIが同じものとして答えられます。"
        action={
          <button className="inline-flex items-center gap-1 rounded-lg bg-[var(--color-brand)] px-3 py-1.5 text-xs font-medium text-white hover:opacity-90">
            <Plus className="h-3.5 w-3.5" />
            用語を追加
          </button>
        }
      />

      <div className="space-y-2.5">
        {TERMS.map((t) => (
          <Card key={t.term} className="p-4">
            <div className="flex flex-wrap items-center gap-2">
              <p className="text-sm font-semibold text-neutral-900">{t.term}</p>
              <span className="text-xs text-neutral-400">（{t.reading}）</span>
              <span className="text-neutral-300">＝</span>
              {t.synonyms.map((s) => (
                <Badge key={s} tone="brand">
                  {s}
                </Badge>
              ))}
            </div>
            <p className="mt-1.5 text-xs text-neutral-500">{t.note}</p>
          </Card>
        ))}
      </div>
      <p className="mt-3 text-xs text-neutral-400">
        例：「サブスク」と聞かれても「定期便」のFAQで答えられるようになります。
      </p>
    </div>
  );
}
