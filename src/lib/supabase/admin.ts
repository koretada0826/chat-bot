// サーバー専用の「強い鍵」の線。
// RLS（鍵）を飛び越えられるので、公開チャットAPIなどで
//   必ず project_id を自分で絞って使うこと。ブラウザに出さない。
import { createClient } from "@supabase/supabase-js";

export function createAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: { persistSession: false, autoRefreshToken: false },
    },
  );
}
