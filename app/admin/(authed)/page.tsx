import Link from "next/link";
import { supabaseAdmin } from "@/lib/supabase";
import { formatYen, dealStatusLabel } from "@/lib/format";

export const dynamic = "force-dynamic";

async function loadStats() {
  const [{ count: memberCount }, { count: activeMemberCount }, { count: dealCount }, { count: tossedUpCount }, { count: confirmedCount }] = await Promise.all([
    supabaseAdmin.from("members").select("*", { count: "exact", head: true }),
    supabaseAdmin.from("members").select("*", { count: "exact", head: true }).eq("is_active", true),
    supabaseAdmin.from("deals").select("*", { count: "exact", head: true }),
    supabaseAdmin.from("deals").select("*", { count: "exact", head: true }).eq("status", "tossed_up"),
    supabaseAdmin.from("deals").select("*", { count: "exact", head: true }).eq("status", "confirmed"),
  ]);

  // 蜈ｨ驟榊・縺ｮ蜷郁ｨ・  const { data: payouts } = await supabaseAdmin
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
      <header className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold">繧ｵ繝槭Μ繝ｼ</h1>
        <div className="flex gap-2">
          <Link href="/admin/deals/new" className="btn-secondary">+ 譯井ｻｶ霑ｽ蜉</Link>
          <Link href="/admin/members/new" className="btn-primary">+ 諡・ｽ楢・ｿｽ蜉</Link>
        </div>
      </header>

      <section className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        <div className="card p-4">
          <p className="text-xs text-gray-500">諡・ｽ楢・/p>
          <p className="text-2xl font-bold">{stats.activeMemberCount}<span className="text-sm text-gray-400 font-normal"> / {stats.memberCount}</span></p>
          <p className="text-xs text-gray-400">譛牙柑 / 蜈ｨ菴・/p>
        </div>
        <div className="card p-4">
          <p className="text-xs text-gray-500">繝医せ繧｢繝・・荳ｭ</p>
          <p className="text-2xl font-bold text-amber-700">{stats.tossedUpCount}</p>
          <p className="text-xs text-gray-400">遒ｺ螳壼ｾ・■譯井ｻｶ</p>
        </div>
        <div className="card p-4">
          <p className="text-xs text-gray-500">遒ｺ螳壽ｸ医∩譯井ｻｶ</p>
          <p className="text-2xl font-bold text-green-700">{stats.confirmedCount}</p>
          <p className="text-xs text-gray-400">驟榊・險育ｮ玲ｸ医∩</p>
        </div>
        <div className="card p-4">
          <p className="text-xs text-gray-500">蜷郁ｨ域｡井ｻｶ謨ｰ</p>
          <p className="text-2xl font-bold">{stats.dealCount}</p>
        </div>
      </section>

      <section className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="card p-5">
          <p className="text-xs text-gray-500">蜿怜叙驕ｸ謚槭・繝ｼ繧ｹ蜷郁ｨ・/p>
          <p className="text-2xl font-bold mt-1">{formatYen(stats.chosenTotal)}</p>
          <p className="text-xs text-gray-400 mt-2">蜷・女蜿冶・・驕ｸ謚槭ｒ蜿肴丐</p>
        </div>
        <div className="card p-5">
          <p className="text-xs text-gray-500">蜊ｳ譎ょ女蜿悶・繝ｼ繧ｹ蜷郁ｨ茨ｼ育ｨ手ｾｼ・・/p>
          <p className="text-xl font-semibold mt-1">{formatYen(stats.taxedTotal)}</p>
        </div>
        <div className="card p-5 bg-gradient-to-br from-amber-50 to-white">
          <p className="text-xs text-amber-700">郢ｰ蟒ｶ・暗・・峨・繝ｼ繧ｹ蜷郁ｨ・/p>
          <p className="text-xl font-semibold mt-1">{formatYen(stats.deferredTotal)}</p>
        </div>
      </section>

      <section className="grid grid-cols-3 gap-3 mb-8 text-sm">
        <div className="card p-3 text-center">
          <p className="text-xs text-gray-500">譛ｪ謇輔＞蜷郁ｨ・/p>
          <p className="font-semibold text-red-700">{formatYen(stats.unpaidTotal)}</p>
        </div>
        <div className="card p-3 text-center">
          <p className="text-xs text-gray-500">謾ｯ謇穂ｺ亥ｮ壼粋險・/p>
          <p className="font-semibold text-blue-700">{formatYen(stats.scheduledTotal)}</p>
        </div>
        <div className="card p-3 text-center">
          <p className="text-xs text-gray-500">謾ｯ謇墓ｸ亥粋險・/p>
          <p className="font-semibold text-green-700">{formatYen(stats.paidTotal)}</p>
        </div>
      </section>

      <section className="card overflow-hidden">
        <div className="px-5 py-3 border-b border-gray-200 flex items-center justify-between">
          <h2 className="font-semibold">譛霑代・譯井ｻｶ</h2>
          <Link href="/admin/deals" className="text-xs text-gray-500 hover:text-gray-900">
            縺吶∋縺ｦ隕九ｋ 竊・          </Link>
        </div>
        {recentDeals.length === 0 ? (
          <p className="p-6 text-sm text-gray-500 text-center">譯井ｻｶ縺後∪縺縺ゅｊ縺ｾ縺帙ｓ</p>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-xs text-gray-500">
              <tr>
                <th className="text-left px-4 py-2 font-medium">邏ｹ莉句・</th>
                <th className="text-left px-4 py-2 font-medium">繝医せ繧｢繝・・</th>
                <th className="text-right px-4 py-2 font-medium">莠ｺ謨ｰ</th>
                <th className="text-center px-4 py-2 font-medium">迥ｶ諷・/th>
                <th className="text-right px-4 py-2 font-medium"></th>
              </tr>
            </thead>
            <tbody>
              {recentDeals.map((d) => {
                const ds = dealStatusLabel(d.status);
                return (
                  <tr key={d.id} className="border-t border-gray-100">
                    <td className="px-4 py-3 font-medium">{d.client_name}</td>
                    <td className="px-4 py-3 text-gray-600">{d.toss_up_member?.name ?? "窶・}</td>
                    <td className="px-4 py-3 text-right">
                      {d.actual_headcount ?? d.expected_headcount ?? "窶・}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className={`badge ${ds.cls}`}>{ds.label}</span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Link
                        href={`/admin/deals/${d.id}`}
                        className="text-xs text-slate-700 hover:underline"
                      >
                        隧ｳ邏ｰ 竊・                      </Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </section>

      <p className="text-xs text-gray-400 mt-8 text-center">
        蜿り・ｼ壼女蜿匁婿蠑上・蜷・球蠖楢・悽莠ｺ縺後・繧､繝壹・繧ｸ縺九ｉ螟画峩縺励∪縺・      </p>
    </div>
  );
}

