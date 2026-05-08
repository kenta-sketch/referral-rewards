import Link from "next/link";
import { supabaseAdmin } from "@/lib/supabase";
import { createDealAction } from "../../actions";

export const dynamic = "force-dynamic";

export default async function NewDealPage() {
  const { data: members } = await supabaseAdmin
    .from("members")
    .select("id, name")
    .eq("is_active", true)
    .order("name");

  return (
    <div className="max-w-xl mx-auto p-4 md:p-8 w-full">
      <div className="mb-4">
        <Link href="/admin/deals" className="text-sm text-gray-500 hover:text-gray-900">
          竊・譯井ｻｶ荳隕ｧ縺ｸ
        </Link>
      </div>
      <div className="card p-6">
        <h1 className="text-xl font-bold mb-4">譯井ｻｶ繧定ｿｽ蜉</h1>
        <p className="text-xs text-gray-500 mb-4">
          邂｡逅・・°繧臥峩謗･逋ｻ骭ｲ縺吶ｋ蝣ｴ蜷医↓菴ｿ逕ｨ縲よ球蠖楢・′閾ｪ蛻・〒繝医せ繧｢繝・・縺吶ｋ蝣ｴ蜷医・蟆ら畑URL縺九ｉ縺ｩ縺・◇縲・        </p>

        <form action={createDealAction} className="flex flex-col gap-4">
          <div>
            <label className="label" htmlFor="client_name">
              邏ｹ莉句・ <span className="text-red-500">*</span>
            </label>
            <input id="client_name" name="client_name" required className="input" />
          </div>

          <div>
            <label className="label" htmlFor="toss_up_member_id">
              繝医せ繧｢繝・・閠・<span className="text-red-500">*</span>
            </label>
            <select id="toss_up_member_id" name="toss_up_member_id" required defaultValue="" className="input">
              <option value="" disabled>驕ｸ謚槭＠縺ｦ縺上□縺輔＞</option>
              {(members ?? []).map((m) => (
                <option key={m.id} value={m.id}>{m.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="label" htmlFor="expected_headcount">莠亥ｮ壻ｺｺ謨ｰ・井ｻｻ諢擾ｼ・/label>
            <input id="expected_headcount" name="expected_headcount" type="number" min={0} className="input" />
          </div>

          <div>
            <label className="label" htmlFor="notes">繝｡繝｢</label>
            <textarea id="notes" name="notes" rows={3} className="input" />
          </div>

          <div className="flex gap-2 pt-2">
            <button type="submit" className="btn-primary">霑ｽ蜉</button>
            <Link href="/admin/deals" className="btn-secondary">繧ｭ繝｣繝ｳ繧ｻ繝ｫ</Link>
          </div>
        </form>
      </div>
    </div>
  );
}

