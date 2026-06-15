import { Card, Badge, PageHeader } from "@/components/ui/saas";
import { Users, UserPlus } from "lucide-react";

const MEMBERS = [
  { name: "山田 花子", email: "yamada@example.com", role: "オーナー", status: "有効", initial: "山" },
  { name: "佐藤 健", email: "sato@example.com", role: "管理者", status: "有効", initial: "佐" },
  { name: "鈴木 美咲", email: "suzuki@example.com", role: "メンバー", status: "有効", initial: "鈴" },
  { name: "高橋 直樹", email: "takahashi@example.com", role: "メンバー", status: "招待中", initial: "高" },
];

const ROLE_TONE: Record<string, "brand" | "ai" | "neutral"> = {
  オーナー: "brand",
  管理者: "ai",
  メンバー: "neutral",
};

export default function MembersPage() {
  return (
    <div>
      <PageHeader
        icon={Users}
        title="メンバー"
        desc="このプロジェクトを操作できる人の一覧です。役割（オーナー／管理者／メンバー）でできることが変わります。"
        action={
          <button className="inline-flex items-center gap-1 rounded-lg bg-[var(--color-brand)] px-3 py-1.5 text-xs font-medium text-white hover:opacity-90">
            <UserPlus className="h-3.5 w-3.5" />
            メンバーを招待
          </button>
        }
      />

      <Card className="overflow-hidden p-0">
       <div className="overflow-x-auto">
        <table className="w-full min-w-[460px] text-sm">
          <thead>
            <tr className="border-b border-[var(--color-hairline)] text-left text-xs text-neutral-500">
              <th className="px-5 py-2.5 font-medium">名前</th>
              <th className="px-5 py-2.5 font-medium">役割</th>
              <th className="px-5 py-2.5 font-medium">状態</th>
            </tr>
          </thead>
          <tbody>
            {MEMBERS.map((m) => (
              <tr key={m.email} className="border-b border-[var(--color-hairline)] last:border-0">
                <td className="px-5 py-3">
                  <span className="flex items-center gap-2.5">
                    <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[var(--color-brand-soft)] text-sm font-bold text-[var(--color-brand)]">
                      {m.initial}
                    </span>
                    <span>
                      <span className="block font-medium text-neutral-800">{m.name}</span>
                      <span className="block text-[11px] text-neutral-400">{m.email}</span>
                    </span>
                  </span>
                </td>
                <td className="px-5 py-3">
                  <Badge tone={ROLE_TONE[m.role]}>{m.role}</Badge>
                </td>
                <td className="px-5 py-3">
                  <Badge tone={m.status === "有効" ? "success" : "warn"}>{m.status}</Badge>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
       </div>
      </Card>

      <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-3 text-xs text-neutral-500">
        <Card className="p-3"><span className="font-semibold text-neutral-800">オーナー</span>：すべての操作・課金・メンバー管理</Card>
        <Card className="p-3"><span className="font-semibold text-neutral-800">管理者</span>：FAQ・設定の編集、運用対応</Card>
        <Card className="p-3"><span className="font-semibold text-neutral-800">メンバー</span>：閲覧と有人チャット対応</Card>
      </div>
    </div>
  );
}
