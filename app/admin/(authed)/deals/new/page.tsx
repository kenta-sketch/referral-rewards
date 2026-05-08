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
          ← 案件一覧へ
        </Link>
      </div>
      <div className="card p-6">
        <h1 className="text-xl font-bold mb-4">案件を追加</h1>
        <p className="text-xs text-gray-500 mb-4">
          管理者から直接登録する場合に使用。担当者が自分でトスアップする場合は専用URLからどうぞ。
        </p>

        <form action={createDealAction} className="flex flex-col gap-4">
          <div>
            <label className="label" htmlFor="client_name">
              紹介先 <span className="text-red-500">*</span>
            </label>
            <input id="client_name" name="client_name" required className="input" />
          </div>

          <div>
            <label className="label" htmlFor="toss_up_member_id">
              トスアップ者 <span className="text-red-500">*</span>
            </label>
            <select id="toss_up_member_id" name="toss_up_member_id" required defaultValue="" className="input">
              <option value="" disabled>選択してください</option>
              {(members ?? []).map((m) => (
                <option key={m.id} value={m.id}>{m.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="label" htmlFor="expected_headcount">予定人数（任意）</label>
            <input id="expected_headcount" name="expected_headcount" type="number" min={0} className="input" />
          </div>

          <div>
            <label className="label" htmlFor="notes">メモ</label>
            <textarea id="notes" name="notes" rows={3} className="input" />
          </div>

          <div className="flex gap-2 pt-2">
            <button type="submit" className="btn-primary">追加</button>
            <Link href="/admin/deals" className="btn-secondary">キャンセル</Link>
          </div>
        </form>
      </div>
    </div>
  );
}
