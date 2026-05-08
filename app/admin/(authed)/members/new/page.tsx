import Link from "next/link";
import { supabaseAdmin } from "@/lib/supabase";
import { createMemberAction } from "../../actions";

export const dynamic = "force-dynamic";

export default async function NewMemberPage() {
  const { data: members } = await supabaseAdmin
    .from("members")
    .select("id, name, is_active")
    .eq("is_active", true)
    .order("name");

  return (
    <div className="max-w-xl mx-auto p-4 md:p-8 w-full">
      <div className="mb-4">
        <Link href="/admin/members" className="text-sm text-gray-500 hover:text-gray-900">
          竊・諡・ｽ楢・ｸ隕ｧ縺ｸ
        </Link>
      </div>
      <div className="card p-6">
        <h1 className="text-xl font-bold mb-4">諡・ｽ楢・ｒ霑ｽ蜉</h1>

        <form action={createMemberAction} className="flex flex-col gap-4">
          <div>
            <label className="label" htmlFor="name">
              豌丞錐 <span className="text-red-500">*</span>
            </label>
            <input id="name" name="name" required className="input" />
          </div>

          <div>
            <label className="label" htmlFor="email">繝｡繝ｼ繝ｫ</label>
            <input id="email" name="email" type="email" className="input" />
          </div>

          <div>
            <label className="label" htmlFor="phone">髮ｻ隧ｱ</label>
            <input id="phone" name="phone" className="input" />
          </div>

          <div>
            <label className="label" htmlFor="parent_id">
              隕ｪ・育ｴｹ莉句・・・            </label>
            <select id="parent_id" name="parent_id" className="input">
              <option value="">縺ｪ縺暦ｼ医Ν繝ｼ繝茨ｼ晉峩謗･邏ｹ莉玖・ｼ・/option>
              {(members ?? []).map((m) => (
                <option key={m.id} value={m.id}>{m.name}</option>
              ))}
            </select>
            <p className="text-xs text-gray-500 mt-1">
              縺薙・莠ｺ縺ｮ邏ｹ莉九〒蜿ょ刈縺励◆隕ｪ繧偵そ繝ｬ繧ｯ繝医ゅΝ繝ｼ繝医・蝣ｴ蜷医・遨ｺ縺ｮ縺ｾ縺ｾ縲・            </p>
          </div>

          <div className="flex gap-2 pt-2">
            <button type="submit" className="btn-primary">霑ｽ蜉</button>
            <Link href="/admin/members" className="btn-secondary">繧ｭ繝｣繝ｳ繧ｻ繝ｫ</Link>
          </div>
        </form>
      </div>
    </div>
  );
}

