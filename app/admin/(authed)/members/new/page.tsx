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
          ← 担当者一覧へ
        </Link>
      </div>
      <div className="card p-6">
        <h1 className="text-xl font-bold mb-4">担当者を追加</h1>

        <form action={createMemberAction} className="flex flex-col gap-4">
          <div>
            <label className="label" htmlFor="name">
              氏名 <span className="text-red-500">*</span>
            </label>
            <input id="name" name="name" required className="input" />
          </div>

          <div>
            <label className="label" htmlFor="email">メール</label>
            <input id="email" name="email" type="email" className="input" />
          </div>

          <div>
            <label className="label" htmlFor="phone">電話</label>
            <input id="phone" name="phone" className="input" />
          </div>

          <div>
            <label className="label" htmlFor="parent_id">
              親（紹介元）
            </label>
            <select id="parent_id" name="parent_id" className="input">
              <option value="">なし（ルート＝直接紹介者）</option>
              {(members ?? []).map((m) => (
                <option key={m.id} value={m.id}>{m.name}</option>
              ))}
            </select>
            <p className="text-xs text-gray-500 mt-1">
              この人の紹介で参加した親をセレクト。ルートの場合は空のまま。
            </p>
          </div>

          <div className="flex items-center gap-2">
            <input
              id="is_closer"
              name="is_closer"
              type="checkbox"
              className="rounded border-gray-300"
            />
            <label htmlFor="is_closer" className="text-sm">
              クロージング担当者（全案件のクロージング操作ができる）
            </label>
          </div>

          <div className="flex gap-2 pt-2">
            <button type="submit" className="btn-primary">追加</button>
            <Link href="/admin/members" className="btn-secondary">キャンセル</Link>
          </div>
        </form>
      </div>
    </div>
  );
}
