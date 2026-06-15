// 辞書（表記ゆれ）で質問の言い方をそろえる部品
import type { SupabaseClient } from "@supabase/supabase-js";

// 例：「送料」→「配送料」に置き換えて、検索が当たりやすくする
export async function normalizeWithDictionary(
  supabase: SupabaseClient,
  projectId: string,
  text: string,
): Promise<string> {
  const { data: terms } = await supabase
    .from("dictionary_terms")
    .select("term, canonical")
    .eq("project_id", projectId)
    .eq("enabled", true);

  if (!terms || terms.length === 0) return text;

  let result = text;
  for (const t of terms) {
    if (!t.term || !t.canonical) continue;
    // 単純な全置換（大文字小文字は区別しない）
    result = result.split(t.term).join(t.canonical);
  }
  return result;
}
