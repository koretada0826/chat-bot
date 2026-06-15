// 未解決質問をまとめて「新FAQ案（改善候補）」を作る部品
import type { SupabaseClient } from "@supabase/supabase-js";
import { getLLMProvider } from "@/lib/llm";
import { recordLLMUsage } from "@/lib/usage/record";
import { SYSTEM_GUARD, SUGGESTION_SCHEMA, buildSuggestionPrompt } from "@/lib/llm/prompts";

// グループ化のキー（記号・空白を消して小文字化した簡易キー）
function groupKey(text: string): string {
  return text
    .toLowerCase()
    .replace(/[\s、。．，！!？?・,.「」（）()]/g, "")
    .slice(0, 60);
}

export async function generateSuggestions(
  supabase: SupabaseClient,
  projectId: string,
  organizationId: string,
): Promise<{ created: number; error?: string }> {
  // 1. 未解決質問（open）を集める
  const { data: rows } = await supabase
    .from("unresolved_questions")
    .select("id, question_raw, question_normalized")
    .eq("project_id", projectId)
    .eq("status", "open")
    .order("created_at", { ascending: false })
    .limit(200);

  if (!rows || rows.length === 0) return { created: 0 };

  // 2. 似た質問をまとめる（簡易グループ化）
  const groups = new Map<string, { examples: string[]; ids: string[] }>();
  for (const r of rows) {
    const text = r.question_normalized || r.question_raw || "";
    if (!text) continue;
    const key = groupKey(text);
    if (!key) continue;
    const g = groups.get(key) ?? { examples: [], ids: [] };
    if (g.examples.length < 5) g.examples.push(text);
    g.ids.push(r.id);
    groups.set(key, g);
  }

  // 3. 件数の多い順に、上位10グループだけAIにかける（コスト管理）
  const sorted = [...groups.values()].sort((a, b) => b.ids.length - a.ids.length).slice(0, 10);

  let created = 0;
  let firstError: string | undefined;

  for (const g of sorted) {
    try {
      const llm = getLLMProvider();
      const res = await llm.chat(
        [
          { role: "system", content: SYSTEM_GUARD },
          { role: "user", content: buildSuggestionPrompt(g.examples) },
        ],
        { jsonSchema: SUGGESTION_SCHEMA, maxTokens: 600 },
      );
      if (res.usage) {
        await recordLLMUsage(supabase, {
          organizationId,
          projectId,
          feature: "suggestion",
          model: res.model,
          inputTokens: res.usage.inputTokens,
          outputTokens: res.usage.outputTokens,
        });
      }
      const parsed = JSON.parse(res.text) as {
        canonical_question: string;
        draft_answer: string;
        suggested_category: string;
      };

      const { error } = await supabase.from("improvement_suggestions").insert({
        project_id: projectId,
        type: "new_faq",
        priority: g.ids.length,
        title: parsed.canonical_question,
        summary: `未解決 ${g.ids.length}件 をまとめた新FAQ案`,
        payload: {
          question: parsed.canonical_question,
          answer: parsed.draft_answer,
          suggested_category: parsed.suggested_category,
        },
        evidence: { count: g.ids.length, examples: g.examples },
        status: "pending",
      });
      if (error) {
        firstError = error.message;
        continue;
      }

      // この質問たちは「まとめ済み」に印をつける（次回の重複を防ぐ）
      await supabase
        .from("unresolved_questions")
        .update({ status: "clustered" })
        .in("id", g.ids);

      created++;
    } catch (e) {
      firstError = e instanceof Error ? e.message : String(e);
    }
  }

  return { created, error: created === 0 ? firstError : undefined };
}
