import { notFound } from "next/navigation";
import Link from "next/link";
import { supabaseAdmin } from "@/lib/supabase";
import {
  formatYen,
  formatDate,
  dealStatusLabel,
  paymentStatusLabel,
  receiptTypeLabel,
} from "@/lib/format";
import type { Member, Payout, Deal } from "@/lib/types";
import { ReceiptTypeSelector } from "./_components/ReceiptTypeSelector";
import { DefaultReceiptTypeForm } from "./_components/DefaultReceiptTypeForm";
import { UserGuide } from "./_components/UserGuide";

export const dynamic = "force-dynamic";

async function loadDashboard(token: string) {
  const { data: member, error: memberErr } = await supabaseAdmin
    .from("members")
    .select("*")
    .eq("access_token", token)
    .maybeSingle();

  if (memberErr) throw memberErr;
  if (!member) return null;

  const { data: payouts, error: payoutsErr } = await supabaseAdmin
    .from("payouts")
    .select("*, deal:deals(*)")
    .eq("member_id", member.id)
    .order("created_at", { ascending: false });

  if (payoutsErr) throw payoutsErr;

  const { data: tossedUpDeals, error: dealsErr } = await supabaseAdmin
    .from("deals")
    .select("*, closer_member:members!closer_member_id(id, name)")
    .eq("toss_up_member_id", member.id)
    .order("tossed_up_at", { ascending: false });

  if (dealsErr) throw dealsErr;

  // 配下メンバー（descendants）を再帰取得
  const { data: descendants } = await supabaseAdmin.rpc("get_descendants", {
    p_member_id: member.id,
  });
  const descendantIds = (descendants ?? []).map(
    (d: { id: string; depth: number }) => d.id
  );

  type DescendantDeal = Deal & {
    toss_up_member: {
      id: string;
      name: string;
      parent: { id: string; name: string } | null;
    } | null;
    closer_member: { id: string; name: string } | null;
  };

  let descendantDeals: DescendantDeal[] = [];
  if (descendantIds.length > 0) {
    const { data } = await supabaseAdmin
      .from("deals")
      .select(
        "*, toss_up_member:members!toss_up_member_id(id, name, parent:members!parent_id(id, name)), closer_member:members!closer_member_id(id, name)"
      )
      .in("toss_up_member_id", descendantIds)
      .order("tossed_up_at", { ascending: false });
    descendantDeals = (data ?? []) as unknown as DescendantDeal[];
  }

  // 見込み配分（トスアップ中・予定人数があるもの）
  const { data: pending } = await supabaseAdmin.rpc("calc_pending_payouts", {
    p_member_id: member.id,
  });
  type PendingRow = {
    deal_id: string;
    client_name: string;
    expected_headcount: number;
    meeting_date: string | null;
    tier: number;
    share_ratio: string;
    amount_taxed_yen: number;
    amount_deferred_yen: number;
  };
  const pendingPayouts = (pending ?? []) as PendingRow[];

  return {
    member: member as Member,
    payouts: (payouts ?? []) as (Payout & { deal: Deal })[],
    tossedUpDeals: (tossedUpDeals ?? []) as (Deal & {
      closer_member: { id: string; name: string } | null;
    })[],
    descendantDeals,
    pendingPayouts,
  };
}

function summarize(payouts: (Payout & { deal: Deal })[]) {
  let chosenTotal = 0;
  let taxedTotal = 0;
  let deferredTotal = 0;
  let unpaidChosen = 0;
  let paidChosen = 0;
  let scheduledChosen = 0;

  for (const p of payouts) {
    if (p.deal.status !== "confirmed") continue;
    const chosen = p.receipt_type === "deferred" ? p.amount_deferred_yen : p.amount_taxed_yen;
    chosenTotal += chosen;
    taxedTotal += p.amount_taxed_yen;
    deferredTotal += p.amount_deferred_yen;
    if (p.payment_status === "unpaid") unpaidChosen += chosen;
    else if (p.payment_status === "scheduled") scheduledChosen += chosen;
    else if (p.payment_status === "paid") paidChosen += chosen;
  }
  return { chosenTotal, taxedTotal, deferredTotal, unpaidChosen, paidChosen, scheduledChosen };
}

export default async function MemberDashboard({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const data = await loadDashboard(token);
  if (!data) notFound();

  const { member, payouts, tossedUpDeals, descendantDeals, pendingPayouts } = data;
  const sum = summarize(payouts);

  const descendantStats = {
    tossedUp: descendantDeals.filter((d) => d.status === "tossed_up").length,
    confirmed: descendantDeals.filter((d) => d.status === "confirmed").length,
    canceled: descendantDeals.filter((d) => d.status === "canceled").length,
  };

  // 見込み合計
  const pending = pendingPayouts.reduce(
    (acc, p) => {
      acc.taxed += p.amount_taxed_yen;
      acc.deferred += p.amount_deferred_yen;
      acc.count += 1;
      return acc;
    },
    { taxed: 0, deferred: 0, count: 0 }
  );

  // 案件 → 自分の取り分マップ（確定済み payouts と 見込み pendingPayouts を統合）
  type MyShare = {
    ratio: number;
    taxed: number;
    deferred: number;
    isPending: boolean;
  };
  const myShareByDeal = new Map<string, MyShare>();
  for (const p of payouts) {
    myShareByDeal.set(p.deal.id, {
      ratio: Number(p.share_ratio),
      taxed: p.amount_taxed_yen,
      deferred: p.amount_deferred_yen,
      isPending: false,
    });
  }
  for (const p of pendingPayouts) {
    if (!myShareByDeal.has(p.deal_id)) {
      myShareByDeal.set(p.deal_id, {
        ratio: Number(p.share_ratio),
        taxed: p.amount_taxed_yen,
        deferred: p.amount_deferred_yen,
        isPending: true,
      });
    }
  }

  return (
    <div className="max-w-5xl mx-auto p-4 md:p-8 w-full">
      <header className="mb-6 flex items-center justify-between gap-4 flex-wrap">
        <div>
          <p className="text-xs text-gray-500">担当者</p>
          <h1 className="text-2xl font-bold">
            {member.name} さん
            {member.is_closer && (
              <span className="badge bg-purple-100 text-purple-800 ml-2 align-middle text-xs">
                クロージング担当者
              </span>
            )}
            {member.is_payer && (
              <span className="badge bg-emerald-100 text-emerald-800 ml-2 align-middle text-xs">
                支払い担当者
              </span>
            )}
          </h1>
        </div>
        <div className="flex gap-2 flex-wrap">
          {member.is_payer && (
            <Link href={`/r/${token}/payments`} className="btn-secondary">
              支払い管理
            </Link>
          )}
          {member.is_closer && (
            <Link href={`/r/${token}/closing`} className="btn-secondary">
              クロージング管理
            </Link>
          )}
          <Link href={`/r/${token}/toss-up`} className="btn-primary">
            + 案件をトスアップ
          </Link>
        </div>
      </header>

      {/* サマリーカード */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
        <div className="card p-5">
          <p className="text-xs text-gray-500">あなたが選択した受取総額</p>
          <p className="text-3xl font-bold mt-1">{formatYen(sum.chosenTotal)}</p>
          <p className="text-xs text-gray-400 mt-2">確定済み案件のみ</p>
        </div>
        <div className="card p-5">
          <p className="text-xs text-gray-500">即時受取（税込）でまとめると</p>
          <p className="text-2xl font-semibold mt-1">{formatYen(sum.taxedTotal)}</p>
        </div>
        <div className="card p-5 bg-gradient-to-br from-amber-50 to-white">
          <p className="text-xs text-amber-700">繰延受取（翌年以降）</p>
          <p className="text-2xl font-semibold mt-1">{formatYen(sum.deferredTotal)}</p>
        </div>
      </section>

      {/* 使い方ガイド（権限別） */}
      <UserGuide isCloser={member.is_closer} isPayer={member.is_payer} />

      {/* 基本受取方式 設定 */}
      <section className="card mb-4 p-4 flex items-center justify-between gap-3 flex-wrap">
        <div>
          <p className="text-sm font-medium">あなたの基本受取方式</p>
          <p className="text-xs text-gray-500 mt-0.5">
            この設定が新規案件のデフォルトになります。変更すると未払い／支払予定の配分も自動で切り替わります（支払済みは変わりません）。
          </p>
        </div>
        <DefaultReceiptTypeForm token={token} current={member.default_receipt_type} />
      </section>

      {/* 見込みカード（モチベーションUP用） */}
      {pending.count > 0 && (
        <section className="card mb-6 p-5 bg-gradient-to-br from-blue-50 to-white border border-blue-200">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-xs text-blue-700 font-medium">見込み（トスアップ中・予定人数ベース）</p>
              <p className="text-3xl font-bold mt-1 text-blue-900">{formatYen(pending.taxed)}</p>
              <p className="text-xs text-gray-500 mt-1">
                即時 {formatYen(pending.taxed)} / 繰延 {formatYen(pending.deferred)}
              </p>
            </div>
            <div className="text-right text-xs text-blue-700">
              <p className="font-semibold text-base">{pending.count} 件</p>
              <p>関与中</p>
            </div>
          </div>
          <p className="text-xs text-gray-400 mt-2">
            ※ 打ち合わせ完了で確定すると、この見込みが正式な金額に変わります。
          </p>
        </section>
      )}

      {/* 支払いステータス */}
      <section className="grid grid-cols-3 gap-3 mb-6 text-sm">
        <div className="card p-3 text-center">
          <p className="text-xs text-gray-500">未払い</p>
          <p className="font-semibold text-red-700">{formatYen(sum.unpaidChosen)}</p>
        </div>
        <div className="card p-3 text-center">
          <p className="text-xs text-gray-500">支払予定</p>
          <p className="font-semibold text-blue-700">{formatYen(sum.scheduledChosen)}</p>
        </div>
        <div className="card p-3 text-center">
          <p className="text-xs text-gray-500">支払済</p>
          <p className="font-semibold text-green-700">{formatYen(sum.paidChosen)}</p>
        </div>
      </section>

      {/* 報酬一覧 */}
      <section className="card mb-6 overflow-hidden">
        <div className="px-5 py-3 border-b border-gray-200 flex items-center justify-between">
          <h2 className="font-semibold">あなたへの配分</h2>
          <span className="text-xs text-gray-500">{payouts.length} 件</span>
        </div>
        {payouts.length === 0 ? (
          <p className="p-6 text-sm text-gray-500 text-center">
            まだ確定した配分はありません。
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-xs text-gray-500">
                <tr>
                  <th className="text-left px-4 py-2 font-medium">案件</th>
                  <th className="text-right px-4 py-2 font-medium">即時（税込）</th>
                  <th className="text-right px-4 py-2 font-medium">繰延</th>
                  <th className="text-center px-4 py-2 font-medium">受取方式</th>
                  <th className="text-center px-4 py-2 font-medium">支払い</th>
                </tr>
              </thead>
              <tbody>
                {payouts.map((p) => {
                  const ds = dealStatusLabel(p.deal.status);
                  const ps = paymentStatusLabel(p.payment_status);
                  return (
                    <tr key={p.id} className="border-t border-gray-100">
                      <td className="px-4 py-3">
                        <p className="font-medium">{p.deal.client_name}</p>
                        <p className="text-xs text-gray-500 mt-0.5">
                          実施 {p.deal.actual_headcount ?? "—"}名 ／{" "}
                          <span className={`badge ${ds.cls}`}>{ds.label}</span>
                        </p>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <span className={p.receipt_type === "taxed" ? "font-semibold" : "text-gray-400"}>
                          {formatYen(p.amount_taxed_yen)}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <span className={p.receipt_type === "deferred" ? "font-semibold text-amber-700" : "text-gray-400"}>
                          {formatYen(p.amount_deferred_yen)}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <ReceiptTypeSelector
                          token={token}
                          payoutId={p.id}
                          current={p.receipt_type}
                          disabled={p.payment_status === "paid"}
                        />
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className={`badge ${ps.cls}`}>{ps.label}</span>
                        {p.scheduled_payment_date && (
                          <p className="text-xs text-gray-500 mt-1">
                            予定: {formatDate(p.scheduled_payment_date)}
                          </p>
                        )}
                        {p.paid_at && (
                          <p className="text-xs text-gray-500 mt-1">
                            完了: {formatDate(p.paid_at)}
                          </p>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* トスアップ履歴 */}
      <section className="card overflow-hidden">
        <div className="px-5 py-3 border-b border-gray-200 flex items-center justify-between">
          <h2 className="font-semibold">あなたがトスアップした案件</h2>
          <span className="text-xs text-gray-500">{tossedUpDeals.length} 件</span>
        </div>
        {tossedUpDeals.length === 0 ? (
          <p className="p-6 text-sm text-gray-500 text-center">
            まだトスアップ案件はありません。
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-xs text-gray-500">
                <tr>
                  <th className="text-left px-4 py-2 font-medium">紹介先</th>
                  <th className="text-right px-4 py-2 font-medium">予定/実施</th>
                  <th className="text-left px-4 py-2 font-medium">あなたの取り分</th>
                  <th className="text-left px-4 py-2 font-medium">打ち合わせ</th>
                  <th className="text-left px-4 py-2 font-medium">クローザー</th>
                  <th className="text-center px-4 py-2 font-medium">ステータス</th>
                </tr>
              </thead>
              <tbody>
                {tossedUpDeals.map((d) => {
                  const ds = dealStatusLabel(d.status);
                  const my = myShareByDeal.get(d.id);
                  return (
                    <tr key={d.id} className="border-t border-gray-100">
                      <td className="px-4 py-3 font-medium">
                        <p>{d.client_name}</p>
                        <p className="text-xs text-gray-400">{formatDate(d.tossed_up_at)}トスアップ</p>
                      </td>
                      <td className="px-4 py-3 text-right">
                        {d.expected_headcount ?? "—"} / {d.actual_headcount ?? "—"}
                      </td>
                      <td className="px-4 py-3 text-sm">
                        {my ? (
                          <div>
                            <span
                              className={
                                my.isPending ? "text-blue-700 font-medium" : "font-medium"
                              }
                            >
                              {formatYen(my.taxed)}
                            </span>
                            {my.isPending && (
                              <span className="text-xs text-gray-400 ml-1">（見込）</span>
                            )}
                          </div>
                        ) : (
                          <span className="text-gray-400 text-xs">—</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-gray-600">{formatDate(d.meeting_date)}</td>
                      <td className="px-4 py-3 text-gray-600">{d.closer_member?.name ?? "—"}</td>
                      <td className="px-4 py-3 text-center">
                        <span className={`badge ${ds.cls}`}>{ds.label}</span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* 配下のトスアップ案件 */}
      {descendantDeals.length > 0 && (
        <section className="card mt-6 overflow-hidden">
          <div className="px-5 py-3 border-b border-gray-200 flex items-center justify-between flex-wrap gap-2">
            <h2 className="font-semibold">配下メンバーのトスアップ案件</h2>
            <div className="flex gap-2 text-xs">
              <span className="badge bg-amber-100 text-amber-800">
                トスアップ中 {descendantStats.tossedUp}
              </span>
              <span className="badge bg-green-100 text-green-800">
                確定 {descendantStats.confirmed}
              </span>
              {descendantStats.canceled > 0 && (
                <span className="badge bg-gray-100 text-gray-600">
                  キャンセル {descendantStats.canceled}
                </span>
              )}
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-xs text-gray-500">
                <tr>
                  <th className="text-left px-4 py-2 font-medium">紹介先</th>
                  <th className="text-left px-4 py-2 font-medium">トスアップ者</th>
                  <th className="text-right px-4 py-2 font-medium">予定/実施</th>
                  <th className="text-left px-4 py-2 font-medium">あなたの取り分</th>
                  <th className="text-left px-4 py-2 font-medium">打ち合わせ</th>
                  <th className="text-left px-4 py-2 font-medium">クローザー</th>
                  <th className="text-center px-4 py-2 font-medium">ステータス</th>
                </tr>
              </thead>
              <tbody>
                {descendantDeals.map((d) => {
                  const ds = dealStatusLabel(d.status);
                  const tosser = d.toss_up_member;
                  const viaParent =
                    tosser?.parent && tosser.parent.id !== member.id
                      ? tosser.parent.name
                      : null;
                  const my = myShareByDeal.get(d.id);
                  return (
                    <tr key={d.id} className="border-t border-gray-100">
                      <td className="px-4 py-3 font-medium">
                        <p>{d.client_name}</p>
                        <p className="text-xs text-gray-400">
                          {formatDate(d.tossed_up_at)}トスアップ
                        </p>
                      </td>
                      <td className="px-4 py-3">
                        <p className="text-sm">{tosser?.name ?? "—"}</p>
                        {viaParent && (
                          <p className="text-xs text-gray-400">経由：{viaParent}</p>
                        )}
                      </td>
                      <td className="px-4 py-3 text-right">
                        {d.expected_headcount ?? "—"} / {d.actual_headcount ?? "—"}
                      </td>
                      <td className="px-4 py-3 text-sm">
                        {my ? (
                          <div>
                            <span
                              className={
                                my.isPending ? "text-blue-700 font-medium" : "font-medium"
                              }
                            >
                              {formatYen(my.taxed)}
                            </span>
                            {my.isPending && (
                              <span className="text-xs text-gray-400 ml-1">（見込）</span>
                            )}
                          </div>
                        ) : (
                          <span className="text-gray-400 text-xs">—</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-gray-600">
                        {formatDate(d.meeting_date)}
                      </td>
                      <td className="px-4 py-3 text-gray-600">
                        {d.closer_member?.name ?? "—"}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className={`badge ${ds.cls}`}>{ds.label}</span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>
      )}

      <p className="text-xs text-gray-400 mt-8 text-center">
        このページはあなた専用です。URLを他人と共有しないでください。
      </p>
    </div>
  );
}
