import Link from "next/link";
import { notFound } from "next/navigation";
import { supabaseAdmin } from "@/lib/supabase";
import { updateMyTossUpAction, cancelMyTossUpAction } from "../../../actions";

export const dynamic = "force-dynamic";

export default async function EditMyDealPage({
  params,
}: {
  params: Promise<{ token: string; dealId: string }>;
}) {
  const { token, dealId } = await params;

  const { data: member } = await supabaseAdmin
    .from("members")
    .select("id, name, is_active")
    .eq("access_token", token)
    .maybeSingle();

  if (!member || !member.is_active) notFound();

  const { data: deal } = await supabaseAdmin
    .from("deals")
    .select("id, client_name, expected_headcount, notes, status, toss_up_member_id")
    .eq("id", dealId)
    .maybeSingle();

  if (!deal) notFound();
  if (deal.toss_up_member_id !== member.id) notFound();

  const editable = deal.status === "tossed_up";

  return (
    <div className="max-w-xl mx-auto p-4 md:p-8 w-full">
      <div className="mb-4">
        <Link href={`/r/${token}`} className="text-sm text-gray-500 hover:text-gray-900">
          ← マイページに戻る
        </Link>
      </div>

      <div className="card p-6">
        <h1 className="text-xl font-bold mb-1">案件を編集</h1>
        <p className="text-xs text-gray-500 mb-6">
          {member.name} さんがトスアップした案件です。
        </p>

        {!editable && (
          <div className="mb-4 p-3 rounded-lg bg-amber-50 border border-amber-200 text-sm text-amber-900">
            この案件は<b>{deal.status === "confirmed" ? "確定済み" : "キャンセル済み"}</b>のため、編集・キャンセルできません。
            内容変更が必要な場合は管理者にご連絡ください。
          </div>
        )}

        <form action={updateMyTossUpAction} className="flex flex-col gap-4">
          <input type="hidden" name="token" value={token} />
          <input type="hidden" name="deal_id" value={deal.id} />

          <div>
            <label className="label" htmlFor="client_name">
              紹介先（会社・団体名）<span className="text-red-500">*</span>
            </label>
            <input
              required
              id="client_name"
              name="client_name"
              defaultValue={deal.client_name}
              disabled={!editable}
              className="input disabled:bg-gray-100"
            />
          </div>

          <div>
            <label className="label" htmlFor="expected_headcount">
              予定人数
            </label>
            <input
              id="expected_headcount"
              name="expected_headcount"
              type="number"
              min={0}
              defaultValue={deal.expected_headcount ?? ""}
              disabled={!editable}
              className="input disabled:bg-gray-100"
            />
          </div>

          <div>
            <label className="label" htmlFor="notes">
              メモ
            </label>
            <textarea
              id="notes"
              name="notes"
              rows={3}
              defaultValue={deal.notes ?? ""}
              disabled={!editable}
              className="input disabled:bg-gray-100"
            />
          </div>

          {editable && (
            <div className="flex gap-2 pt-2">
              <button type="submit" className="btn-primary">
                保存
              </button>
              <Link href={`/r/${token}`} className="btn-secondary">
                戻る
              </Link>
            </div>
          )}
        </form>

        {editable && (
          <div className="mt-6 pt-4 border-t border-gray-200">
            <h2 className="text-sm font-semibold text-red-700 mb-2">この案件をキャンセル</h2>
            <p className="text-xs text-gray-600 mb-3">
              紹介自体が無くなった場合などに使用してください。一度キャンセルすると元に戻せません。
            </p>
            <form action={cancelMyTossUpAction}>
              <input type="hidden" name="token" value={token} />
              <input type="hidden" name="deal_id" value={deal.id} />
              <button type="submit" className="btn-danger">
                この案件をキャンセルする
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}
