import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getCurrentUser, getMyOrganizations } from "@/lib/auth/context";
import { isPlatformAdmin } from "@/lib/auth/platform";
import { USD_TO_JPY } from "@/lib/usage/pricing";

function fmtTokens(n: number): string {
  return n.toLocaleString("ja-JP");
}
function fmtYen(usd: number): string {
  return `約 ${Math.round(usd * USD_TO_JPY).toLocaleString("ja-JP")} 円`;
}
function fmtUsd(usd: number): string {
  return `$${usd.toFixed(2)}`;
}

function StatCard({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="rounded-lg border border-neutral-200 bg-white p-5">
      <p className="text-sm text-neutral-500">{label}</p>
      <p className="mt-2 text-2xl font-semibold text-neutral-900">{value}</p>
      {sub && <p className="mt-1 text-xs text-neutral-400">{sub}</p>}
    </div>
  );
}

export default async function UsagePage() {
  const user = await getCurrentUser();
  const orgs = await getMyOrganizations();
  const orgId = orgs[0]?.organization_id;
  const supabase = await createClient();

  // 自社の使用量（直近30日）
  const { data: summary } = orgId
    ? await supabase.rpc("usage_summary", { p_organization_id: orgId, p_days: 30 })
    : { data: null };
  const s = (summary as { total_tokens: number; cost_usd: number; event_count: number }[] | null)?.[0];

  const { data: byDay } = orgId
    ? await supabase.rpc("usage_by_day", { p_organization_id: orgId, p_days: 30 })
    : { data: null };
  const days = (byDay as { day: string; total_tokens: number; cost_usd: number }[] | null) ?? [];

  // 運営者なら全企業の使用量も取得
  const platformAdmin = isPlatformAdmin(user?.email);
  let allOrgs: { organization_id: string; organization_name: string; total_tokens: number; cost_usd: number; event_count: number }[] = [];
  if (platformAdmin) {
    const admin = createAdminClient();
    const { data } = await admin.rpc("usage_by_organization", { p_days: 30 });
    allOrgs = (data as typeof allOrgs) ?? [];
  }

  const totalTokens = Number(s?.total_tokens ?? 0);
  const totalCost = Number(s?.cost_usd ?? 0);
  const eventCount = Number(s?.event_count ?? 0);

  return (
    <div>
      <h1 className="text-lg font-semibold text-neutral-900">使用量・コスト</h1>
      <p className="mt-1 text-sm text-neutral-500">
        AIをどれだけ使ったか（直近30日）。コストは概算です。
      </p>

      {/* 自社のサマリ */}
      <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard label="使ったトークン" value={fmtTokens(totalTokens)} sub={`AI呼び出し ${fmtTokens(eventCount)} 回`} />
        <StatCard label="概算コスト" value={fmtUsd(totalCost)} sub={fmtYen(totalCost)} />
        <StatCard label="1回あたり平均" value={eventCount ? fmtUsd(totalCost / eventCount) : "$0.00"} />
      </div>

      {/* 日別 */}
      <div className="mt-6 rounded-lg border border-neutral-200 bg-white p-5">
        <h2 className="text-sm font-semibold text-neutral-900">日別の使用量（30日）</h2>
        {days.length === 0 ? (
          <p className="mt-3 text-sm text-neutral-400">まだ使用記録がありません。</p>
        ) : (
          <table className="mt-3 w-full text-sm">
            <thead>
              <tr className="text-left text-xs text-neutral-400">
                <th className="pb-2">日付</th>
                <th className="pb-2 text-right">トークン</th>
                <th className="pb-2 text-right">コスト</th>
              </tr>
            </thead>
            <tbody>
              {days.map((d) => (
                <tr key={d.day} className="border-t border-neutral-100">
                  <td className="py-1.5 text-neutral-700">{d.day}</td>
                  <td className="py-1.5 text-right text-neutral-700">{fmtTokens(Number(d.total_tokens))}</td>
                  <td className="py-1.5 text-right text-neutral-700">{fmtUsd(Number(d.cost_usd))}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* 運営者向け：全企業の使用量 */}
      {platformAdmin && (
        <div className="mt-6 rounded-lg border border-amber-200 bg-white p-5">
          <h2 className="text-sm font-semibold text-neutral-900">
            全企業の使用量（運営者向け）
          </h2>
          <p className="mt-1 text-xs text-amber-600">
            この欄はプラットフォーム運営者だけに表示されます。
          </p>
          {allOrgs.length === 0 ? (
            <p className="mt-3 text-sm text-neutral-400">まだ使用記録がありません。</p>
          ) : (
            <table className="mt-3 w-full text-sm">
              <thead>
                <tr className="text-left text-xs text-neutral-400">
                  <th className="pb-2">企業</th>
                  <th className="pb-2 text-right">トークン</th>
                  <th className="pb-2 text-right">回数</th>
                  <th className="pb-2 text-right">コスト</th>
                  <th className="pb-2 text-right">円換算</th>
                </tr>
              </thead>
              <tbody>
                {allOrgs.map((o) => (
                  <tr key={o.organization_id} className="border-t border-neutral-100">
                    <td className="py-1.5 text-neutral-800">{o.organization_name}</td>
                    <td className="py-1.5 text-right text-neutral-700">{fmtTokens(Number(o.total_tokens))}</td>
                    <td className="py-1.5 text-right text-neutral-700">{fmtTokens(Number(o.event_count))}</td>
                    <td className="py-1.5 text-right text-neutral-700">{fmtUsd(Number(o.cost_usd))}</td>
                    <td className="py-1.5 text-right text-neutral-500">{fmtYen(Number(o.cost_usd))}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}
    </div>
  );
}
