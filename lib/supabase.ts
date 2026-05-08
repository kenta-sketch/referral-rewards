import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!supabaseUrl || !serviceRoleKey) {
  // 迺ｰ蠅・､画焚縺檎┌縺・→襍ｷ蜍墓凾縺ｫ譏守､ｺ逧・↓關ｽ縺ｨ縺・  // 縺溘□縺励ン繝ｫ繝画凾縺ｯ NEXT_PHASE=phase-production-build 縺ｧ險ｱ螳ｹ
  if (process.env.NEXT_PHASE !== "phase-production-build") {
    console.warn("Supabase env vars are missing");
  }
}

/**
 * 繧ｵ繝ｼ繝舌・蛛ｴ蟆ら畑・嘖ervice_role_key 繧剃ｽｿ縺・ヽLS繧偵ヰ繧､繝代せ縺励※蜈ｨ繝・・繧ｿ縺ｫ繧｢繧ｯ繧ｻ繧ｹ縺ｧ縺阪ｋ縲・ * 繧ｯ繝ｩ繧､繧｢繝ｳ繝医↓縺ｯ邨ｶ蟇ｾ縺ｫ貂｡縺輔↑縺・％縺ｨ・・erver Components / Server Actions / Route Handlers 縺ｮ縺ｿ縺ｧ菴ｿ縺・ｼ峨・ */
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

