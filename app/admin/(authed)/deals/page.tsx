import Link from "next/link";
import { supabaseAdmin } from "@/lib/supabase";
import { dealStatusLabel, formatDate } from "@/lib/format";

export const dynamic = "force-dynamic";

type Row = {
  id: string;
  client_name: string;
  status: string;
  expected_headcount: number | null;
  actual_headcount: number | null;
  tossed_up_at: string;
  toss_up_member: { id: string; name: string } | null;
  closer_member: { id: string; name: string } | null;
};

async function loadDeals(): Promise<Row[]> {
  const { data, error } = await supabaseAdmin
    .from("deals")
    .select(
      "id, client_name, status, expected_headcount, actual_headcount, tossed_up_at," +
        "toss_up_member:members!toss_up_member_id(id, name)," +
        "closer_member:members!closer_member_id(id, name)"
    )
    .order("tossed_up_at", { ascending: false });
  if (error) throw error;
  return (data ?? []) as unknown as Row[];
}

export default async function DealsPage() {
  const rows = await loadDeals();

  return (
    <div className="max-w-6xl mx-auto p-4 md:p-8 w-full">
      <header className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold">案件</h1>
        <Link href="/admin/deals/new" className="btn-primary">+ 案件を追加</Link>
      </header>

      <div className="card overflow-hidden">
        {rows.length === 0 ? (
          <p className="p-6 text-sm text-gray-500 text-center">案件がまだありません</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-xs text-gray-500">
                <tr>
                  <th className="text-left px-4 py-2 font-medium">紹介先</th>
                  <th className="text-left px-4 py-2 font-medium">トスアップ</th>
                  <th className="text-left px-4 py-2 font-medium">クローザー</th>
                  <th className="text-right px-4 py-2 font-medium">予定/実施</th>
                  <th className="text-center px-4 py-2 font-medium">状態</th>
                  <th className="text-left px-4 py-2 font-medium">日付</th>
                  <th className="text-right px-4 py-2"></th>
                </tr>
              </thead>
              <tbody>
                {rows.map((d) => {
                  const ds = dealStatusLabel(d.status);
                  return (
                    <tr key={d.id} className="border-t border-gray-100">
                      <td className="px-4 py-3 font-medium">{d.client_name}</td>
                      <td className="px-4 py-3 text-gray-600">{d.toss_up_member?.name ?? "—"}</td>
                      <td className="px-4 py-3 text-gray-600">{d.closer_member?.name ?? "—"}</td>
                      <td className="px-4 py-3 text-right">
                        {d.expected_headcount ?? "—"} / {d.actual_headcount ?? "—"}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className={`badge ${ds.cls}`}>{ds.label}</span>
                      </td>
                      <td className="px-4 py-3 text-gray-600">{formatDate(d.tossed_up_at)}</td>
                      <td className="px-4 py-3 text-right">
                        <Link href={`/admin/deals/${d.id}`} className="text-xs text-slate-700 hover:underline">
                          詳細 →
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
