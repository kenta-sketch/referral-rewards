import Link from "next/link";
import { notFound } from "next/navigation";
import { supabaseAdmin } from "@/lib/supabase";
import {
  formatYen,
  formatDate,
  dealStatusLabel,
  paymentStatusLabel,
  receiptTypeLabel,
} from "@/lib/format";
import {
  confirmDealAction,
  cancelDealAction,
  updatePayoutAction,
  setMeetingDateAction,
} from "../../actions";

export const dynamic = "force-dynamic";

export default async function DealDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [{ data: deal }, { data: members }] = await Promise.all([
    supabaseAdmin
      .from("deals")
      .select(
        "*, toss_up_member:members!toss_up_member_id(id, name), closer_member:members!closer_member_id(id, name)"
      )
      .eq("id", id)
      .maybeSingle(),
    supabaseAdmin.from("members").select("id, name").eq("is_active", true).order("name"),
  ]);

  if (!deal) notFound();

  const { data: payouts } = await supabaseAdmin
    .from("payouts")
    .select("*, member:members!member_id(id, name)")
    .eq("deal_id", id)
    .order("tier");

  const ds = dealStatusLabel(deal.status);
  const isConfirmed = deal.status === "confirmed";
  const isCanceled = deal.status === "canceled";

  return (
    <div className="max-w-4xl mx-auto p-4 md:p-8 w-full">
      <div className="mb-4">
        <Link href="/admin/deals" className="text-sm text-gray-500 hover:text-gray-900">
          ← 案件一覧へ
        </Link>
      </div>

      <div className="card p-6 mb-4">
        <div className="flex items-start justify-between gap-4 mb-2">
          <div>
            <h1 className="text-xl font-bold">{deal.client_name}</h1>
            <p className="text-xs text-gray-500 mt-1">
              トスアップ：{deal.toss_up_member?.name ?? "—"}（{formatDate(deal.tossed_up_at)}）
            </p>
          </div>
          <span className={`badge ${ds.cls}`}>{ds.label}</span>
        </div>

        <dl className="grid grid-cols-2 gap-3 text-sm mt-4">
          <div>
            <dt className="text-xs text-gray-500">予定人数</dt>
            <dd className="font-medium">{deal.expected_headcount ?? "—"}</dd>
          </div>
          <div>
            <dt className="text-xs text-gray-500">実施人数</dt>
            <dd className="font-medium">{deal.actual_headcount ?? "—"}</dd>
          </div>
          <div>
            <dt className="text-xs text-gray-500">単価（即時/繰延）</dt>
            <dd className="font-medium">
              {formatYen(deal.unit_price_taxed_yen)} / {formatYen(deal.unit_price_deferred_yen)}
            </dd>
          </div>
          <div>
            <dt className="text-xs text-gray-500">クロージング担当</dt>
            <dd className="font-medium">{deal.closer_member?.name ?? "—"}</dd>
          </div>
          <div>
            <dt className="text-xs text-gray-500">打ち合わせ日</dt>
            <dd className="font-medium">{formatDate(deal.meeting_date)}</dd>
          </div>
          {deal.notes && (
            <div className="col-span-2">
              <dt className="text-xs text-gray-500">メモ</dt>
              <dd className="text-sm whitespace-pre-wrap">{deal.notes}</dd>
            </div>
          )}
        </dl>
      </div>

      {!isCanceled && !isConfirmed && (
        <>
          <div className="card p-6 mb-4">
            <h2 className="font-semibold mb-2">打ち合わせ日を設定</h2>
            <p className="text-xs text-gray-500 mb-4">
              クロージング担当者と打ち合わせ予定日を入れておくと、トスアップ者にも進捗が伝わります（確定はまだしません）。
            </p>
            <form action={setMeetingDateAction} className="flex flex-col gap-3">
              <input type="hidden" name="id" value={deal.id} />
              <div>
                <label className="label" htmlFor="meeting_date">打ち合わせ日</label>
                <input
                  id="meeting_date"
                  name="meeting_date"
                  type="date"
                  defaultValue={deal.meeting_date ?? ""}
                  className="input"
                />
              </div>
              <div>
                <label className="label" htmlFor="closer_member_id_pre">クロージング担当（任意）</label>
                <select
                  id="closer_member_id_pre"
                  name="closer_member_id"
                  defaultValue={deal.closer_member?.id ?? ""}
                  className="input"
                >
                  <option value="">未設定</option>
                  {(members ?? []).map((m) => (
                    <option key={m.id} value={m.id}>{m.name}</option>
                  ))}
                </select>
              </div>
              <button type="submit" className="btn-secondary">打ち合わせ日を保存</button>
            </form>
          </div>

          <div className="card p-6 mb-4">
            <h2 className="font-semibold mb-2">案件を確定する</h2>
            <p className="text-xs text-gray-500 mb-4">
              打ち合わせ後、実施人数を入れて確定すると配分が自動計算されます。
              人数によって単価が変わります（49名まで18万円／50名以上20万円）。
            </p>
            <form action={confirmDealAction} className="flex flex-col gap-4">
              <input type="hidden" name="id" value={deal.id} />

              <div>
                <label className="label" htmlFor="actual_headcount">
                  実施人数 <span className="text-red-500">*</span>
                </label>
                <input
                  id="actual_headcount"
                  name="actual_headcount"
                  type="number"
                  min={1}
                  required
                  defaultValue={deal.expected_headcount ?? ""}
                  className="input"
                />
              </div>

              <div>
                <label className="label" htmlFor="closer_member_id">クローザー（任意）</label>
                <select
                  id="closer_member_id"
                  name="closer_member_id"
                  defaultValue={deal.closer_member?.id ?? ""}
                  className="input"
                >
                  <option value="">未設定</option>
                  {(members ?? []).map((m) => (
                    <option key={m.id} value={m.id}>{m.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="label" htmlFor="meeting_date_confirm">打ち合わせ日（任意）</label>
                <input
                  id="meeting_date_confirm"
                  name="meeting_date"
                  type="date"
                  defaultValue={deal.meeting_date ?? ""}
                  className="input"
                />
              </div>

              <button type="submit" className="btn-primary">確定して配分計算</button>
            </form>
            <form action={cancelDealAction} className="mt-3">
              <input type="hidden" name="id" value={deal.id} />
              <button type="submit" className="text-xs text-red-700 hover:underline">
                この案件をキャンセル
              </button>
            </form>
          </div>
        </>
      )}

      {isConfirmed && (
        <div className="card overflow-hidden mb-4">
          <div className="px-5 py-3 border-b border-gray-200 flex items-center justify-between">
            <h2 className="font-semibold">配分</h2>
            <form action={confirmDealAction}>
              <input type="hidden" name="id" value={deal.id} />
              <input
                type="hidden"
                name="actual_headcount"
                value={deal.actual_headcount ?? 0}
              />
              <input
                type="hidden"
                name="closer_member_id"
                value={deal.closer_member?.id ?? ""}
              />
              <button type="submit" className="btn-secondary text-xs">再計算</button>
            </form>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-xs text-gray-500">
                <tr>
                  <th className="text-left px-4 py-2 font-medium">受取人</th>
                  <th className="text-center px-4 py-2 font-medium">階層</th>
                  <th className="text-right px-4 py-2 font-medium">即時（税込）</th>
                  <th className="text-right px-4 py-2 font-medium">繰延（×3）</th>
                  <th className="text-center px-4 py-2 font-medium">受取選択</th>
                  <th className="text-center px-4 py-2 font-medium">支払い</th>
                </tr>
              </thead>
              <tbody>
                {(payouts ?? []).map((p) => {
                  const ps = paymentStatusLabel(p.payment_status);
                  return (
                    <tr key={p.id} className="border-t border-gray-100 align-top">
                      <td className="px-4 py-3 font-medium">{p.member?.name ?? "—"}</td>
                      <td className="px-4 py-3 text-center">tier {p.tier} ({(Number(p.share_ratio) * 100).toFixed(0)}%)</td>
                      <td className="px-4 py-3 text-right">{formatYen(p.amount_taxed_yen)}</td>
                      <td className="px-4 py-3 text-right">{formatYen(p.amount_deferred_yen)}</td>
                      <td className="px-4 py-3 text-center text-xs text-gray-600">
                        {receiptTypeLabel(p.receipt_type)}
                      </td>
                      <td className="px-4 py-3">
                        <details className="text-xs">
                          <summary className="cursor-pointer">
                            <span className={`badge ${ps.cls}`}>{ps.label}</span>
                          </summary>
                          <form action={updatePayoutAction} className="mt-2 flex flex-col gap-2">
                            <input type="hidden" name="id" value={p.id} />
                            <select name="payment_status" defaultValue={p.payment_status} className="input text-xs">
                              <option value="unpaid">未払い</option>
                              <option value="scheduled">支払予定</option>
                              <option value="paid">支払済</option>
                            </select>
                            <input
                              type="date"
                              name="scheduled_payment_date"
                              defaultValue={p.scheduled_payment_date ?? ""}
                              className="input text-xs"
                              placeholder="支払予定日"
                            />
                            <input
                              type="date"
                              name="paid_at"
                              defaultValue={p.paid_at ?? ""}
                              className="input text-xs"
                              placeholder="支払日"
                            />
                            <textarea
                              name="notes"
                              defaultValue={p.notes ?? ""}
                              rows={2}
                              className="input text-xs"
                              placeholder="メモ"
                            />
                            <button type="submit" className="btn-primary text-xs">更新</button>
                          </form>
                        </details>
                      </td>
                    </tr>
                  );
                })}
                {(!payouts || payouts.length === 0) && (
                  <tr>
                    <td colSpan={6} className="text-center text-sm text-gray-500 p-6">
                      配分データがありません
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <div className="px-5 py-3 border-t border-gray-200">
            <form action={cancelDealAction}>
              <input type="hidden" name="id" value={deal.id} />
              <button type="submit" className="text-xs text-red-700 hover:underline">
                この案件をキャンセルする（配分も削除されます）
              </button>
            </form>
          </div>
        </div>
      )}

      {isCanceled && (
        <div className="card p-6 text-center text-sm text-gray-500">
          この案件はキャンセル済みです。
        </div>
      )}
    </div>
  );
}
