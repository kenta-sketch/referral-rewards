import Link from "next/link";
import { notFound } from "next/navigation";
import { supabaseAdmin } from "@/lib/supabase";
import {
  updateMemberAction,
  regenerateMemberTokenAction,
  deleteMemberAction,
} from "../../actions";
import { CopyButton } from "../../_components/CopyButton";
import { formatYen, formatDate, dealStatusLabel } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function MemberDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const [{ data: member }, { data: candidates }, { data: payouts }, { data: tossedUpDeals }, { data: descendants }, { data: pendingRows }] =
    await Promise.all([
      supabaseAdmin.from("members").select("*").eq("id", id).maybeSingle(),
      supabaseAdmin.from("members").select("id, name").neq("id", id).order("name"),
      supabaseAdmin
        .from("payouts")
        .select("*, deal:deals(id, client_name, status, actual_headcount, meeting_date)")
        .eq("member_id", id)
        .order("created_at", { ascending: false }),
      supabaseAdmin
        .from("deals")
        .select("id, client_name, status, expected_headcount, actual_headcount, meeting_date, tossed_up_at")
        .eq("toss_up_member_id", id)
        .order("tossed_up_at", { ascending: false }),
      supabaseAdmin.rpc("get_descendants", { p_member_id: id }),
      supabaseAdmin.rpc("calc_pending_payouts", { p_member_id: id }),
    ]);

  if (!member) notFound();

  const baseOrigin = process.env.NEXT_PUBLIC_APP_ORIGIN || "";
  const fullUrl = `${baseOrigin}/r/${member.access_token}`;

  // サマリー集計
  type PayoutWithDeal = {
    id: string;
    amount_taxed_yen: number;
    amount_deferred_yen: number;
    receipt_type: "taxed" | "deferred";
    payment_status: "unpaid" | "scheduled" | "paid";
    scheduled_payment_date: string | null;
    paid_at: string | null;
    tier: number;
    deal: {
      id: string;
      client_name: string;
      status: string;
      actual_headcount: number | null;
      meeting_date: string | null;
    } | null;
  };
  const ps = (payouts ?? []) as unknown as PayoutWithDeal[];

  let chosenTotal = 0;
  let taxedTotal = 0;
  let deferredTotal = 0;
  let unpaidChosen = 0;
  let scheduledChosen = 0;
  let paidChosen = 0;

  for (const p of ps) {
    if (p.deal?.status !== "confirmed") continue;
    const chosen =
      p.receipt_type === "deferred" ? p.amount_deferred_yen : p.amount_taxed_yen;
    chosenTotal += chosen;
    taxedTotal += p.amount_taxed_yen;
    deferredTotal += p.amount_deferred_yen;
    if (p.payment_status === "unpaid") unpaidChosen += chosen;
    else if (p.payment_status === "scheduled") scheduledChosen += chosen;
    else if (p.payment_status === "paid") paidChosen += chosen;
  }

  const tossedUp = tossedUpDeals ?? [];
  const descendantCount = (descendants ?? []).length;

  const tossedUpStats = {
    inProgress: tossedUp.filter((d) => d.status === "tossed_up").length,
    confirmed: tossedUp.filter((d) => d.status === "confirmed").length,
    canceled: tossedUp.filter((d) => d.status === "canceled").length,
  };

  // 見込み（トスアップ中の予想配分）
  type PendingRow = {
    deal_id: string;
    client_name: string;
    expected_headcount: number;
    amount_taxed_yen: number;
    amount_deferred_yen: number;
  };
  const pending = ((pendingRows ?? []) as PendingRow[]).reduce(
    (acc, p) => {
      acc.taxed += p.amount_taxed_yen;
      acc.deferred += p.amount_deferred_yen;
      acc.count += 1;
      return acc;
    },
    { taxed: 0, deferred: 0, count: 0 }
  );

  return (
    <div className="max-w-4xl mx-auto p-4 md:p-8 w-full">
      <div className="mb-4">
        <Link href="/admin/members" className="text-sm text-gray-500 hover:text-gray-900">
          ← 担当者一覧へ
        </Link>
      </div>

      {/* 個別サマリー */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
        <div className="card p-4">
          <p className="text-xs text-gray-500">確定済み合計（受取選択ベース）</p>
          <p className="text-2xl font-bold mt-1">{formatYen(chosenTotal)}</p>
          <p className="text-xs text-gray-400 mt-1">
            即時 {formatYen(taxedTotal)} / 繰延 {formatYen(deferredTotal)}
          </p>
        </div>
        <div className="card p-4 bg-gradient-to-br from-blue-50 to-white border border-blue-200">
          <p className="text-xs text-blue-700 font-medium">
            見込み合計（トスアップ中・予定人数ベース） {pending.count} 件
          </p>
          <p className="text-2xl font-bold mt-1 text-blue-900">{formatYen(pending.taxed)}</p>
          <p className="text-xs text-gray-400 mt-1">
            繰延ベース {formatYen(pending.deferred)}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4">
        <div className="card p-4">
          <p className="text-xs text-gray-500">支払い内訳（選択ベース・確定済み）</p>
          <div className="flex gap-3 mt-2 text-sm">
            <span className="text-red-700">未払 {formatYen(unpaidChosen)}</span>
            <span className="text-blue-700">予定 {formatYen(scheduledChosen)}</span>
            <span className="text-green-700">支払済 {formatYen(paidChosen)}</span>
          </div>
        </div>
        <div className="card p-4">
          <p className="text-xs text-gray-500">トスアップ統計</p>
          <p className="text-sm mt-2">
            進行 {tossedUpStats.inProgress} / 確定 {tossedUpStats.confirmed}
            {tossedUpStats.canceled > 0 && ` / 取消 ${tossedUpStats.canceled}`}
            <span className="text-gray-400 ml-2">配下 {descendantCount} 名</span>
          </p>
        </div>
      </div>

      {/* 配分明細 */}
      {ps.length > 0 && (
        <div className="card mb-4 overflow-hidden">
          <div className="px-5 py-3 border-b border-gray-200 flex items-center justify-between">
            <h2 className="font-semibold">この担当者への配分</h2>
            <span className="text-xs text-gray-500">{ps.length} 件</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-xs text-gray-500">
                <tr>
                  <th className="text-left px-4 py-2 font-medium">案件</th>
                  <th className="text-center px-4 py-2 font-medium">階層</th>
                  <th className="text-right px-4 py-2 font-medium">即時</th>
                  <th className="text-right px-4 py-2 font-medium">繰延</th>
                  <th className="text-center px-4 py-2 font-medium">受取方式</th>
                  <th className="text-center px-4 py-2 font-medium">支払</th>
                </tr>
              </thead>
              <tbody>
                {ps.map((p) => (
                  <tr key={p.id} className="border-t border-gray-100">
                    <td className="px-4 py-3">
                      <p className="font-medium">{p.deal?.client_name ?? "—"}</p>
                      <p className="text-xs text-gray-400">
                        実施 {p.deal?.actual_headcount ?? "—"}名
                      </p>
                    </td>
                    <td className="px-4 py-3 text-center text-xs">tier {p.tier}</td>
                    <td className="px-4 py-3 text-right">{formatYen(p.amount_taxed_yen)}</td>
                    <td className="px-4 py-3 text-right">{formatYen(p.amount_deferred_yen)}</td>
                    <td className="px-4 py-3 text-center text-xs">
                      {p.receipt_type === "deferred" ? "繰延" : "即時"}
                    </td>
                    <td className="px-4 py-3 text-center text-xs">
                      {p.payment_status === "paid"
                        ? "済"
                        : p.payment_status === "scheduled"
                        ? "予定"
                        : "未"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 自分のトスアップ案件 */}
      {tossedUp.length > 0 && (
        <div className="card mb-4 overflow-hidden">
          <div className="px-5 py-3 border-b border-gray-200 flex items-center justify-between">
            <h2 className="font-semibold">この担当者がトスアップした案件</h2>
            <span className="text-xs text-gray-500">{tossedUp.length} 件</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-xs text-gray-500">
                <tr>
                  <th className="text-left px-4 py-2 font-medium">紹介先</th>
                  <th className="text-right px-4 py-2 font-medium">予定/実施</th>
                  <th className="text-left px-4 py-2 font-medium">打合せ</th>
                  <th className="text-center px-4 py-2 font-medium">状態</th>
                </tr>
              </thead>
              <tbody>
                {tossedUp.map((d) => {
                  const ds = dealStatusLabel(d.status);
                  return (
                    <tr key={d.id} className="border-t border-gray-100">
                      <td className="px-4 py-3">
                        <p className="font-medium">{d.client_name}</p>
                        <p className="text-xs text-gray-400">
                          {formatDate(d.tossed_up_at)}
                        </p>
                      </td>
                      <td className="px-4 py-3 text-right">
                        {d.expected_headcount ?? "—"} / {d.actual_headcount ?? "—"}
                      </td>
                      <td className="px-4 py-3 text-gray-600">{formatDate(d.meeting_date)}</td>
                      <td className="px-4 py-3 text-center">
                        <span className={`badge ${ds.cls}`}>{ds.label}</span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

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

          <div className="flex items-center gap-2">
            <input
              id="is_closer"
              name="is_closer"
              type="checkbox"
              defaultChecked={member.is_closer}
              className="rounded border-gray-300"
            />
            <label htmlFor="is_closer" className="text-sm">
              クロージング担当者（全案件のクロージング操作ができる専用ページが解放される）
            </label>
          </div>

          <div className="flex gap-2 pt-2">
            <button type="submit" className="btn-primary">保存</button>
            <Link href="/admin/members" className="btn-secondary">戻る</Link>
          </div>
        </form>
      </div>

      <div className="card p-6 mb-4 border border-red-200">
        <h2 className="font-semibold mb-2 text-red-700">担当者を削除</h2>
        <p className="text-xs text-gray-600 mb-3">
          案件が1件も紐づいていない場合のみ削除できます。紐づいている場合は「無効」のチェックを外して停止扱いにしてください。
        </p>
        <form action={deleteMemberAction}>
          <input type="hidden" name="id" value={member.id} />
          <button type="submit" className="btn-danger">この担当者を削除</button>
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
