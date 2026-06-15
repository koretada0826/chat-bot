// コスト暴走を防ぐハードキャップ。
// プロジェクト単位の「1日あたりトークン上限」を超えたら、AIを呼ばずに止める。
// ※ 合算はDB側の集約関数で行う（生の行取得だと1000行上限で過小集計になり、
//    高負荷時に上限が効かなくなるため）。
import type { SupabaseClient } from "@supabase/supabase-js";

const DAILY_CAP = Number(process.env.CHAT_DAILY_TOKEN_CAP ?? 500000);

export async function isOverDailyCap(
  supabase: SupabaseClient,
  projectId: string,
): Promise<boolean> {
  if (!DAILY_CAP || DAILY_CAP <= 0) return false;
  const { data, error } = await supabase.rpc("project_token_usage", {
    p_project_id: projectId,
    p_days: 1,
  });
  if (error) return false; // 集計に失敗したら止めない（可用性優先・別途監視）
  return Number(data ?? 0) >= DAILY_CAP;
}
