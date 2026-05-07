import Link from "next/link";
import { notFound } from "next/navigation";
import { supabaseAdmin } from "@/lib/supabase";
import { updateMemberAction, regenerateMemberTokenAction } from "../../actions";
import { CopyButton } from "../../_components/CopyButton";

export const dynamic = "force-dynamic";

export default async function MemberDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const [{ data: member }, { data: candidates }] = await Promise.all([
    supabaseAdmin.from("members").select("*").eq("id", id).maybeSingle(),
    supabaseAdmin.from("members").select("id, name").neq("id", id).order("name"),
  ]);

  if (!member) notFound();

  const baseOrigin = process.env.NEXT_PUBLIC_APP_ORIGIN || "";
  const fullUrl = `${baseOrigin}/r/${member.access_token}`;

  return (
    <div className="max-w-xl mx-auto p-4 md:p-8 w-full">
      <div className="mb-4">
        <Link href="/admin/members" className="text-sm text-gray-500 hover:text-gray-900">
          ← 担当者一覧へ
        </Link>
      </div>

      <div className="card p-6 mb-4">
        <h1 className="text-xl font-bold mb-1">{member.name}</h1>
        <p className="text-xs text-gray-500 mb-4">担当者の編集</p>

        <form action={updateMemberAction} className="flex flex-col gap-4">
          <input type="hidden" name="id" value={member.id} />

          <div>
            <label className="label" htmlFor="name">氏名 <span className="text-red-500">*</span></label>
            <input id="name" name="name" required defaultValue={member.name} className="input" />
          </div>

          <div>
            <label className="label" htmlFor="email">メール</label>
            <input id="email" name="email" type="email" defaultValue={member.email ?? ""} className="input" />
          </div>

          <div>
            <label className="label" htmlFor="phone">電話</label>
            <input id="phone" name="phone" defaultValue={member.phone ?? ""} className="input" />
          </div>

          <div>
            <label className="label" htmlFor="parent_id">親（紹介元）</label>
            <select id="parent_id" name="parent_id" defaultValue={member.parent_id ?? ""} className="input">
              <option value="">なし（ルート）</option>
              {(candidates ?? []).map((m) => (
                <option key={m.id} value={m.id}>{m.name}</option>
              ))}
            </select>
            <p className="text-xs text-gray-500 mt-1">
              親を変えても過去の確定済み案件の配分は変わりません（スナップショット保存）。
            </p>
          </div>

          <div>
            <label className="label" htmlFor="notes">メモ</label>
            <textarea id="notes" name="notes" rows={3} defaultValue={member.notes ?? ""} className="input" />
          </div>

          <div className="flex items-center gap-2">
            <input
              id="is_active"
              name="is_active"
              type="checkbox"
              defaultChecked={member.is_active}
              className="rounded border-gray-300"
            />
            <label htmlFor="is_active" className="text-sm">有効（無効化すると配分計算時にスキップされる）</label>
          </div>

          <div className="flex gap-2 pt-2">
            <button type="submit" className="btn-primary">保存</button>
            <Link href="/admin/members" className="btn-secondary">戻る</Link>
          </div>
        </form>
      </div>

      <div className="card p-6">
        <h2 className="font-semibold mb-2">専用URL</h2>
        <div className="flex gap-2 items-center mb-4">
          <code className="flex-1 text-xs bg-gray-50 border border-gray-200 rounded px-3 py-2 break-all">
            {fullUrl || `/r/${member.access_token}`}
          </code>
          <CopyButton text={fullUrl || `/r/${member.access_token}`} />
        </div>
        <form action={regenerateMemberTokenAction}>
          <input type="hidden" name="id" value={member.id} />
          <button
            type="submit"
            className="btn-danger"
            formNoValidate
          >
            URLを再発行（旧URLは無効化）
          </button>
        </form>
        <p className="text-xs text-gray-500 mt-2">
          URLが流出した疑いがあるときに使用してください。古いURLからはアクセス不可になります。
        </p>
      </div>
    </div>
  );
}
