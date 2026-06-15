import Link from "next/link";
import { Card, SectionHeading } from "@/components/ui/saas";
import { ImprovementSummary } from "@/components/preview/dashboard/improvement-summary";
import { KpiGrid } from "@/components/preview/dashboard/kpi-grid";
import {
  TrendChart,
  StatusDonut,
  CategoryBar,
  HourlyBar,
} from "@/components/preview/dashboard/charts";
import { ImprovementActions } from "@/components/preview/dashboard/improvement-actions";
import { TrendTopics } from "@/components/preview/dashboard/trend-topics";
import { FaqPerformanceTable } from "@/components/preview/dashboard/faq-performance-table";
import { InsightPanel } from "@/components/preview/dashboard/insight-panel";

export default function PreviewDashboard() {
  return (
    <div className="space-y-5">
      {/* 今週の改善サマリー */}
      <ImprovementSummary />

      {/* KPI 8枚 */}
      <KpiGrid />

      {/* グラフ：推移＋ステータス内訳 */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card className="p-5 lg:col-span-2">
          <SectionHeading title="質問数の推移" desc="直近14日（質問数・AI回答・未解決）" />
          <div className="mt-3">
            <TrendChart />
          </div>
        </Card>
        <Card className="p-5">
          <SectionHeading title="回答ステータス内訳" desc="直近7日" />
          <div className="mt-3">
            <StatusDonut />
          </div>
        </Card>
      </div>

      {/* グラフ：カテゴリ別＋時間帯別 */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card className="p-5">
          <SectionHeading title="カテゴリ別質問数" desc="多い順" />
          <div className="mt-3">
            <CategoryBar />
          </div>
        </Card>
        <Card className="p-5">
          <SectionHeading title="時間帯別の利用" desc="9〜21時" />
          <div className="mt-3">
            <HourlyBar />
          </div>
        </Card>
      </div>

      {/* 今やるべき改善（左）＋ インサイト（右） */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="space-y-4 lg:col-span-2">
          <Card className="p-5">
            <SectionHeading
              title="今やるべき改善"
              desc="この順に対応すると、問い合わせ削減効果が高い見込みです"
              action={
                <Link href="/preview/suggestions" className="text-xs text-[var(--color-brand)] hover:underline">
                  すべて見る →
                </Link>
              }
            />
            <div className="mt-3">
              <ImprovementActions />
            </div>
          </Card>

          <Card className="p-5">
            <SectionHeading title="トレンドトピック" desc="質問ログから抽出（オレンジ＝未解決が多い）" />
            <div className="mt-3">
              <TrendTopics />
            </div>
          </Card>
        </div>

        <Card className="p-5">
          <SectionHeading title="インサイト" />
          <div className="mt-3">
            <InsightPanel />
          </div>
        </Card>
      </div>

      {/* FAQ別パフォーマンス */}
      <Card className="p-5">
        <SectionHeading
          title="FAQ別パフォーマンス"
          desc="表示回数・解決率・低評価率から、改善すべきFAQを把握できます"
        />
        <div className="mt-3">
          <FaqPerformanceTable />
        </div>
      </Card>
    </div>
  );
}
