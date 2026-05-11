import Link from "next/link";
import { notFound } from "next/navigation";
import { supabaseAdmin } from "@/lib/supabase";
import {
  formatYen,
  formatDate,
  paymentStatusLabel,
  receiptTypeLabel,
} from "@/lib/format";
import { updatePayoutAsPayerAction } from "./actions";

export const dynamic = "force-dynamic";

type Row = {
  id: string;
  member_id: string;
  amount_taxed_yen: number;
  amount_deferred_yen: number;
  receipt_type: "taxed" | "deferred";
  payment_status: "unpaid" | "scheduled" | "paid";
  scheduled_payment_date: string | null;
  paid_at: string | null;
  notes: string | null;
  deal: {
    id: string;
    client_name: string;
    actual_headcount: number | null;
    status: string;
  } | null;
};

type Member = {
  id: string;
  name: string;
  default_receipt_type: "taxed" | "deferred";
  email: string | null;
};

async function loadAll(token: string) {
  const { data: payer, error: pErr } = await supabaseAdmin
    .from("members")
    .select("id, name, is_active, is_payer")
    .eq("access_token", token)
    .maybeSingle();

  if (pErr) throw pErr;
  if (!payer || !payer.is_active || !payer.is_payer) return null;

  const [{ data: members }, { data: payouts }] = await Promise.all([
    supabaseAdmin
      .from("members")
      .select("id, name, default_receipt_type, email")
      .order("name"),
    supabaseAdmin
      .from("payouts")
      .select(
        "id, member_id, amount_taxed_yen, amount_deferred_yen, receipt_type, payment_status, scheduled_payment_date, paid_at, notes, deal:deals(id, client_name, actual_headcount, status)"
      )
      .order("scheduled_payment_date", { ascending: true, nullsFirst: false }),
  ]);

  const ps = ((payouts ?? []) as unknown as Row[]).filter(
    (p) => p.deal?.status === "confirmed"
  );

  const byMember = new Map<string, Row[]>();
  for (const p of ps) {
    const arr = byMember.get(p.member_id) ?? [];
    arr.push(p);
    byMember.set(p.member_id, arr);
  }

  const list = ((members ?? []) as Member[])
    .map((m) => {
      const items = byMember.get(m.id) ?? [];
      let unpaid = 0,
        scheduled = 0,
        paid = 0;
      for (const it of items) {
        const amt =
          it.receipt_type === "deferred" ? it.amount_deferred_yen : it.amount_taxed_yen;
        if (it.payment_status === "unpaid") unpaid += amt;
        else if (it.payment_status === "scheduled") scheduled += amt;
        else if (it.payment_status === "paid") paid += amt;
      }
      return { member: m, items, unpaid, scheduled, paid };
    })
    .filter((g) => g.items.length > 0)
    .sort((a, b) => b.unpaid + b.scheduled - (a.unpaid + a.scheduled));

  const grand = list.reduce(
    (acc, g) => {
      acc.unpaid += g.unpaid;
      acc.scheduled += g.scheduled;
      acc.paid += g.paid;
      return acc;
    },
    { unpaid: 0, scheduled: 0, paid: 0 }
  );

  return { payer, list, grand };
}

export default async function PayerPaymentsPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const data = await loadAll(token);
  if (!data) notFound();

  const { payer, list, grand } = data;

  return (
    <div className="max-w-6xl mx-auto p-4 md:p-8 w-full">
      <header className="mb-6 flex items-center justify-between gap-3 flex-wrap">
        <div>
          <p className="text-xs text-emerald-700 font-medium">支払い管理</p>
          <h1 className="text-2xl font-bold">{payer.name} さん</h1>
        </div>
        <Link href={`/r/${token}`} className="btn-secondary">
          マイページへ戻る
        </Link>
      </header>

      <section className="grid grid-cols-3 gap-3 mb-6">
        <div className="card p-4 text-center">
          <p className="text-xs text-gray-500">未払い合計</p>
          <p className="text-xl font-bold text-red-700">{formatYen(grand.unpaid)}</p>
        </div>
        <div className="card p-4 text-center">
          <p className="text-xs text-gray-500">支払予定合計</p>
          <p className="text-xl font-bold text-blue-700">{formatYen(grand.scheduled)}</p>
        </div>
        <div className="card p-4 text-center">
          <p className="text-xs text-gray-500">支払済合計</p>
          <p className="text-xl font-bold text-green-700">{formatYen(grand.paid)}</p>
        </div>
      </section>

      {list.length === 0 ? (
        <div className="card p-8 text-center text-sm text-gray-500">
          確定済みの配分がまだありません。
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {list.map((g) => {
            const total = g.unpaid + g.scheduled + g.paid;
            return (
              <details key={g.member.id} className="card overflow-hidden" open={g.unpaid > 0}>
                <summary className="px-5 py-4 cursor-pointer hover:bg-gray-50 list-none">
                  <div className="flex items-center justify-between gap-3 flex-wrap">
                    <div>
                      <p className="font-semibold">
                        {g.member.name}
                        <span className="badge bg-gray-100 text-gray-700 ml-2 text-xs">
                          基本: {receiptTypeLabel(g.member.default_receipt_type)}
                        </span>
                      </p>
                      <p className="text-xs text-gray-500 mt-0.5">
                        {g.items.length} 件 ／ 総額（受取選択ベース）{formatYen(total)}
                      </p>
                      {g.member.email && (
                        <p className="text-xs text-gray-400 mt-0.5">{g.member.email}</p>
                      )}
                    </div>
                    <div className="flex gap-2 text-xs flex-wrap">
                      <span className="badge bg-red-50 text-red-700 border border-red-200">
                        未払 {formatYen(g.unpaid)}
                      </span>
                      <span className="badge bg-blue-50 text-blue-700 border border-blue-200">
                        予定 {formatYen(g.scheduled)}
                      </span>
                      <span className="badge bg-green-50 text-green-700 border border-green-200">
                        済 {formatYen(g.paid)}
                      </span>
                    </div>
                  </div>
                </summary>

                <div className="border-t border-gray-200 overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50 text-xs text-gray-500">
                      <tr>
                        <th className="text-left px-4 py-2 font-medium">案件</th>
                        <th className="text-right px-4 py-2 font-medium">金額（受取選択ベース）</th>
                        <th className="text-center px-4 py-2 font-medium">支払い</th>
                        <th className="text-left px-4 py-2 font-medium">予定日 / 完了日</th>
                        <th className="text-left px-4 py-2 font-medium">操作</th>
                      </tr>
                    </thead>
                    <tbody>
                      {g.items.map((p) => {
                        const amt =
                          p.receipt_type === "deferred"
                            ? p.amount_deferred_yen
                            : p.amount_taxed_yen;
                        const ps = paymentStatusLabel(p.payment_status);
                        return (
                          <tr key={p.id} className="border-t border-gray-100 align-top">
                            <td className="px-4 py-3">
                              <p className="font-medium">{p.deal?.client_name ?? "—"}</p>
                              <p className="text-xs text-gray-400">
                                実施 {p.deal?.actual_headcount ?? "—"}名
                              </p>
                            </td>
                            <td className="px-4 py-3 text-right">
                              <p className="font-semibold">{formatYen(amt)}</p>
                              <p className="text-xs text-gray-400">
                                {p.receipt_type === "deferred" ? "繰延" : "即時"}
                              </p>
                            </td>
                            <td className="px-4 py-3 text-center">
                              <span className={`badge ${ps.cls}`}>{ps.label}</span>
                            </td>
                            <td className="px-4 py-3 text-xs text-gray-600">
                              {p.scheduled_payment_date && (
                                <p>予定: {formatDate(p.scheduled_payment_date)}</p>
                              )}
                              {p.paid_at && <p>完了: {formatDate(p.paid_at)}</p>}
                            </td>
                            <td className="px-4 py-3">
                              <details>
                                <summary className="text-xs text-slate-700 cursor-pointer hover:underline">
                                  更新
                                </summary>
                                <form
                                  action={updatePayoutAsPayerAction}
                                  className="mt-2 flex flex-col gap-2"
                                >
                                  <input type="hidden" name="token" value={token} />
                                  <input type="hidden" name="id" value={p.id} />
                                  <select
                                    name="payment_status"
                                    defaultValue={p.payment_status}
                                    className="input text-xs"
                                  >
                                    <option value="unpaid">未払い</option>
                                    <option value="scheduled">支払予定</option>
                                    <option value="paid">支払済</option>
                                  </select>
                                  <input
                                    type="date"
                                    name="scheduled_payment_date"
                                    defaultValue={p.scheduled_payment_date ?? ""}
                                    className="input text-xs"
                                  />
                                  <input
                                    type="date"
                                    name="paid_at"
                                    defaultValue={p.paid_at ?? ""}
                                    className="input text-xs"
                                  />
                                  <textarea
                                    name="notes"
                                    defaultValue={p.notes ?? ""}
                                    rows={2}
                                    className="input text-xs"
                                    placeholder="メモ"
                                  />
                                  <button type="submit" className="btn-primary text-xs">
                                    保存
                                  </button>
                                </form>
                              </details>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </details>
            );
          })}
        </div>
      )}

      <p className="text-xs text-gray-400 mt-8 text-center">
        このページは支払い担当者専用です。
      </p>
    </div>
  );
}
