import Link from "next/link";
import { supabaseAdmin } from "@/lib/supabase";
import { formatYen, dealStatusLabel } from "@/lib/format";

export const dynamic = "force-dynamic";

async function loadStats() {
  const [
    { count: memberCount },
    { count: activeMemberCount },
    { count: dealCount },
    { count: tossedUpCount },
    { count: confirmedCount },
    { data: pendingTotalRows },
  ] = await Promise.all([
    supabaseAdmin.from("members").select("*", { count: "exact", head: true }),
    supabaseAdmin.from("members").select("*", { count: "exact", head: true }).eq("is_active", true),
    supabaseAdmin.from("deals").select("*", { count: "exact", head: true }),
    supabaseAdmin.from("deals").select("*", { count: "exact", head: true }).eq("status", "tossed_up"),
    supabaseAdmin.from("deals").select("*", { count: "exact", head: true }).eq("status", "confirmed"),
    supabaseAdmin.rpc("calc_pending_total"),
  ]);

  // 全配分の合計
  const { data: payouts } = await supabaseAdmin
    .from("payouts")
    .select("amount_taxed_yen, amount_deferred_yen, receipt_type, payment_status");

  let chosenTotal = 0;
  let taxedTotal = 0;
  let deferredTotal = 0;
  let unpaidTotal = 0;
  let paidTotal = 0;
  let scheduledTotal = 0;

  for (const p of payouts ?? []) {
    const chosen = p.receipt_type === "deferred" ? p.amount_deferred_yen : p.amount_taxed_yen;
    chosenTotal += chosen;
    taxedTotal += p.amount_taxed_yen;
    deferredTotal += p.amount_deferred_yen;
    if (p.payment_status === "unpaid") unpaidTotal += chosen;
    else if (p.payment_status === "scheduled") scheduledTotal += chosen;
    else if (p.payment_status === "paid") paidTotal += chosen;
  }

  const pendingRow = (pendingTotalRows ?? [])[0] as
    | { total_taxed_yen: number; total_deferred_yen: number; pending_count: number }
    | undefined;
  const pendingTaxed = pendingRow?.total_taxed_yen ?? 0;
  const pendingDeferred = pendingRow?.total_deferred_yen ?? 0;
  const pendingCount = pendingRow?.pending_count ?? 0;

  return {
    memberCount: memberCount ?? 0,
    activeMemberCount: activeMemberCount ?? 0,
    dealCount: dealCount ?? 0,
    tossedUpCount: tossedUpCount ?? 0,
    confirmedCount: confirmedCount ?? 0,
    chosenTotal,
    taxedTotal,
    deferredTotal,
    unpaidTotal,
    paidTotal,
    scheduledTotal,
    pendingTaxed,
    pendingDeferred,
    pendingCount,
  };
}

async function loadRecentDeals() {
  const { data } = await supabaseAdmin
    .from("deals")
    .select("*, toss_up_member:members!toss_up_member_id(id, name)")
    .order("tossed_up_at", { ascending: false })
    .limit(10);
  return (data ?? []) as Array<{
    id: string;
    client_name: string;
    status: string;
    tossed_up_at: string;
    actual_headcount: number | null;
    expected_headcount: number | null;
    toss_up_member: { id: string; name: string } | null;
  }>;
}

export default async function AdminDashboard() {
  const [stats, recentDeals] = await Promise.all([loadStats(), loadRecentDeals()]);

  return (
    <div className="max-w-6xl mx-auto p-4 md:p-8 w-full">
      <header className="mb-6 flex items-center justify-between flex-wrap gap-2">
        <h1 className="text-2xl font-bold">サマリー</h1>
        <div className="flex gap-2 flex-wrap items-center">
          <Link
            href="/admin/demo"
            className="text-xs text-gray-500 hover:text-gray-900 underline underline-offset-2"
          >
            デモ管理
          </Link>
          <Link href="/admin/deals/new" className="btn-secondary">+ 案件追加</Link>
          <Link href="/admin/members/new" className="btn-primary">+ 担当者追加</Link>
        </div>
      </header>

      <section className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        <div className="card p-4">
          <p className="text-xs text-gray-500">担当者</p>
          <p className="text-2xl font-bold">{stats.activeMemberCount}<span className="text-sm text-gray-400 font-normal"> / {stats.memberCount}</span></p>
          <p className="text-xs text-gray-400">有効 / 全体</p>
        </div>
        <div className="card p-4">
          <p className="text-xs text-gray-500">トスアップ中</p>
          <p className="text-2xl font-bold text-amber-700">{stats.tossedUpCount}</p>
          <p className="text-xs text-gray-400">確定待ち案件</p>
        </div>
        <div className="card p-4">
          <p className="text-xs text-gray-500">確定済み案件</p>
          <p className="text-2xl font-bold text-green-700">{stats.confirmedCount}</p>
          <p className="text-xs text-gray-400">配分計算済み</p>
        </div>
        <div className="card p-4">
          <p className="text-xs text-gray-500">合計案件数</p>
          <p className="text-2xl font-bold">{stats.dealCount}</p>
        </div>
      </section>

      <section className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="card p-5">
          <p className="text-xs text-gray-500">受取選択ベース合計（確定済み）</p>
          <p className="text-2xl font-bold mt-1">{formatYen(stats.chosenTotal)}</p>
          <p className="text-xs text-gray-400 mt-2">各受取者の選択を反映</p>
        </div>
        <div className="card p-5">
          <p className="text-xs text-gray-500">即時受取ベース合計（税込）</p>
          <p className="text-xl font-semibold mt-1">{formatYen(stats.taxedTotal)}</p>
        </div>
        <div className="card p-5 bg-gradient-to-br from-amber-50 to-white">
          <p className="text-xs text-amber-700">繰延（×3）ベース合計</p>
          <p className="text-xl font-semibold mt-1">{formatYen(stats.deferredTotal)}</p>
        </div>
      </section>

      {/* 見込み（トスアップ中の総額） */}
      {stats.pendingCount > 0 && (
        <section className="card mb-6 p-5 bg-gradient-to-br from-blue-50 to-white border border-blue-200">
          <div className="flex items-start justify-between gap-3 flex-wrap">
            <div>
              <p className="text-xs text-blue-700 font-medium">
                見込み合計（トスアップ中・予定人数ベース） ／ {stats.pendingCount} 件
              </p>
              <p className="text-2xl font-bold mt-1 text-blue-900">
                {formatYen(stats.pendingTaxed)}
              </p>
              <p className="text-xs text-gray-500 mt-1">
                繰延ベースなら {formatYen(stats.pendingDeferred)}
              </p>
            </div>
            <p className="text-xs text-gray-400 max-w-sm">
              ※ 確定すると人数によって金額が動きます。打ち合わせ完了でこの見込みが現実になります。
            </p>
          </div>
        </section>
      )}

      <section className="grid grid-cols-3 gap-3 mb-8 text-sm">
        <div className="card p-3 text-center">
          <p className="text-xs text-gray-500">未払い合計</p>
          <p className="font-semibold text-red-700">{formatYen(stats.unpaidTotal)}</p>
        </div>
        <div className="card p-3 text-center">
          <p className="text-xs text-gray-500">支払予定合計</p>
          <p className="font-semibold text-blue-700">{formatYen(stats.scheduledTotal)}</p>
        </div>
        <div className="card p-3 text-center">
          <p className="text-xs text-gray-500">支払済合計</p>
          <p className="font-semibold text-green-700">{formatYen(stats.paidTotal)}</p>
        </div>
      </section>

      <section className="card overflow-hidden">
        <div className="px-5 py-3 border-b border-gray-200 flex items-center justify-between">
          <h2 className="font-semibold">最近の案件</h2>
          <Link href="/admin/deals" className="text-xs text-gray-500 hover:text-gray-900">
            すべて見る →
          </Link>
        </div>
        {recentDeals.length === 0 ? (
          <p className="p-6 text-sm text-gray-500 text-center">案件がまだありません</p>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-xs text-gray-500">
              <tr>
                <th className="text-left px-4 py-2 font-medium">紹介先</th>
                <th className="text-left px-4 py-2 font-medium">トスアップ</th>
                <th className="text-right px-4 py-2 font-medium">人数</th>
                <th className="text-center px-4 py-2 font-medium">状態</th>
                <th className="text-right px-4 py-2 font-medium"></th>
              </tr>
            </thead>
            <tbody>
              {recentDeals.map((d) => {
                const ds = dealStatusLabel(d.status);
                return (
                  <tr key={d.id} className="border-t border-gray-100">
                    <td className="px-4 py-3 font-medium">{d.client_name}</td>
                    <td className="px-4 py-3 text-gray-600">{d.toss_up_member?.name ?? "—"}</td>
                    <td className="px-4 py-3 text-right">
                      {d.actual_headcount ?? d.expected_headcount ?? "—"}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className={`badge ${ds.cls}`}>{ds.label}</span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Link
                        href={`/admin/deals/${d.id}`}
                        className="text-xs text-slate-700 hover:underline"
                      >
                        詳細 →
                      </Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </section>

      <p className="text-xs text-gray-400 mt-8 text-center">
        参考：受取方式は各担当者本人がマイページから変更します
      </p>
    </div>
  );
}
