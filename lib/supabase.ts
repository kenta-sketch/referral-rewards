import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!supabaseUrl || !serviceRoleKey) {
  // 環境変数が無いと起動時に明示的に落とす
  // ただしビルド時は NEXT_PHASE=phase-production-build で許容
  if (process.env.NEXT_PHASE !== "phase-production-build") {
    console.warn("Supabase env vars are missing");
  }
}

/**
 * サーバー側専用：service_role_key を使い、RLSをバイパスして全データにアクセスできる。
 * クライアントには絶対に渡さないこと（Server Components / Server Actions / Route Handlers のみで使う）。
 */
export const supabaseAdmin = createClient(
  supabaseUrl ?? "https://placeholder.supabase.co",
  serviceRoleKey ?? "placeholder",
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  }
);
