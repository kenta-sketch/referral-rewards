import Link from "next/link";
import { notFound } from "next/navigation";
import { supabaseAdmin } from "@/lib/supabase";
import { formatDate, dealStatusLabel } from "@/lib/format";
import {
  setMeetingDateAsCloserAction,
  confirmDealAsCloserAction,
  cancelDealAsCloserAction,
} from "./actions";

export const dynamic = "force-dynamic";

type DealRow = {
  id: string;
  client_name: string;
  status: "tossed_up" | "confirmed" | "canceled";
  expected_headcount: number | null;
  actual_headcount: number | null;
  meeting_date: string | null;
  tossed_up_at: string;
  notes: string | null;
  toss_up_member: {
    id: string;
    name: string;
    parent: { id: string; name: string } | null;
  } | null;
};

async function loadAll(token: string) {
  const { data: member, error: memberErr } = await supabaseAdmin
    .from("members")
    .select("id, name, is_active, is_closer")
    .eq("access_token", token)
    .maybeSingle();

  if (memberErr) throw memberErr;
  if (!member) return null;
  if (!member.is_closer) return null;

  const { data: deals, error: dealsErr } = await supabaseAdmin
    .from("deals")
    .select(
      "id, client_name, status, expected_headcount, actual_headcount, meeting_date, tossed_up_at, notes, toss_up_member:members!toss_up_member_id(id, name, parent:members!parent_id(id, name))"
    )
    .order("meeting_date", { ascending: true, nullsFirst: false });

  if (dealsErr) throw dealsErr;

  return {
    member,
    deals: (deals ?? []) as unknown as DealRow[],
  };
}

export default async function CloserPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const data = await loadAll(token);
  if (!data) notFound();

  const { member, deals } = data;

  const today = new Date().toISOString().slice(0, 10);
  const upcoming = deals.filter(
    (d) => d.status === "tossed_up" && (!d.meeting_date || d.meeting_date >= today)
  );
  const overdue = deals.filter(
    (d) => d.status === "tossed_up" && d.meeting_date && d.meeting_date < today
  );
  const confirmed = deals.filter((d) => d.status === "confirmed");
  const canceled = deals.filter((d) => d.status === "canceled");

  return (
    <div className="max-w-5xl mx-auto p-4 md:p-8 w-full">
      <header className="mb-6 flex items-center justify-between">
        <div>
          <p className="text-xs text-purple-700 font-medium">クロージング管理</p>
          <h1 className="text-2xl font-bold">{member.name} さん</h1>
        </div>
        <Link href={`/r/${token}`} className="btn-secondary">
          マイページへ戻る
        </Link>
      </header>

      <Section title="打ち合わせ予定（直近・未確定）" deals={upcoming} token={token} mode="schedule" />
      {overdue.length > 0 && (
        <Section title="打ち合わせ日経過（要対応）" deals={overdue} token={token} mode="schedule" highlight />
      )}
      <Section title="確定済み" deals={confirmed} token={token} mode="readonly" />
      {canceled.length > 0 && (
        <Section title="キャンセル" deals={canceled} token={token} mode="readonly" />
      )}

      <p className="text-xs text-gray-400 mt-8 text-center">
        単価ルール：49名まで1人18万円 / 50名以上1人20万円。実施人数で確定すると配分が自動計算されます。
      </p>
    </div>
  );
}

function Section({
  title,
  deals,
  token,
  mode,
  highlight,
}: {
  title: string;
  deals: DealRow[];
  token: string;
  mode: "schedule" | "readonly";
  highlight?: boolean;
}) {
  return (
    <section className={`card mb-6 overflow-hidden ${highlight ? "border-amber-300" : ""}`}>
      <div className="px-5 py-3 border-b border-gray-200 flex items-center justify-between">
        <h2 className="font-semibold">{title}</h2>
        <span className="text-xs text-gray-500">{deals.length} 件</span>
      </div>
      {deals.length === 0 ? (
        <p className="p-6 text-sm text-gray-500 text-center">該当なし</p>
      ) : (
        <div className="divide-y divide-gray-100">
          {deals.map((d) => (
            <DealCard key={d.id} deal={d} token={token} mode={mode} />
          ))}
        </div>
      )}
    </section>
  );
}

function DealCard({
  deal,
  token,
  mode,
}: {
  deal: DealRow;
  token: string;
  mode: "schedule" | "readonly";
}) {
  const ds = dealStatusLabel(deal.status);
  return (
    <div className="p-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="font-semibold">{deal.client_name}</p>
          <p className="text-xs text-gray-500 mt-0.5">
            トスアップ：{deal.toss_up_member?.name ?? "—"}
            {deal.toss_up_member?.parent && (
              <span className="text-gray-400">（経由：{deal.toss_up_member.parent.name}）</span>
            )}
            （{formatDate(deal.tossed_up_at)}）
          </p>
          {deal.notes && (
            <p className="text-xs text-gray-600 mt-1 whitespace-pre-wrap">{deal.notes}</p>
          )}
        </div>
        <div className="text-right">
          <span className={`badge ${ds.cls}`}>{ds.label}</span>
          {deal.meeting_date && (
            <p className="text-xs text-gray-500 mt-1">
              打ち合わせ：{formatDate(deal.meeting_date)}
            </p>
          )}
          {deal.actual_headcount && (
            <p className="text-xs text-gray-500 mt-1">実施 {deal.actual_headcount}名</p>
          )}
        </div>
      </div>

      {mode === "schedule" && (
        <details className="mt-4 group">
          <summary className="cursor-pointer list-none">
            <span className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-slate-900 text-white text-sm font-medium hover:bg-slate-800 transition shadow-sm">
              <span>この案件を操作する</span>
              <svg
                className="w-4 h-4 group-open:rotate-180 transition-transform"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </span>
            <span className="text-xs text-gray-500 ml-3">
              打合せ日設定 / 確定（実施人数入力）/ キャンセル
            </span>
          </summary>
          <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-3">
            {/* 打ち合わせ日設定 */}
            <form action={setMeetingDateAsCloserAction} className="card p-4 bg-blue-50 border border-blue-200">
              <p className="text-sm font-semibold mb-2 text-blue-900">打ち合わせ日を更新</p>
              <input type="hidden" name="token" value={token} />
              <input type="hidden" name="deal_id" value={deal.id} />
              <input
                type="date"
                name="meeting_date"
                defaultValue={deal.meeting_date ?? ""}
                className="input text-sm mb-2"
              />
              <button type="submit" className="btn-secondary text-sm w-full">
                日付を保存
              </button>
            </form>

            {/* 確定 */}
            <form action={confirmDealAsCloserAction} className="card p-4 bg-green-50 border border-green-200">
              <p className="text-sm font-semibold mb-2 text-green-900">確定（配分計算）</p>
              <input type="hidden" name="token" value={token} />
              <input type="hidden" name="deal_id" value={deal.id} />
              <input type="hidden" name="meeting_date" value={deal.meeting_date ?? ""} />
              <input
                type="number"
                name="actual_headcount"
                min={1}
                placeholder="実施人数"
                defaultValue={deal.expected_headcount ?? ""}
                required
                className="input text-sm mb-2"
              />
              <button type="submit" className="btn-primary text-sm w-full">
                確定して配分計算
              </button>
            </form>
          </div>

          <form action={cancelDealAsCloserAction} className="mt-3">
            <input type="hidden" name="token" value={token} />
            <input type="hidden" name="deal_id" value={deal.id} />
            <button
              type="submit"
              className="text-xs px-3 py-1.5 rounded border border-red-200 text-red-700 hover:bg-red-50"
            >
              この案件をキャンセルする
            </button>
          </form>
        </details>
      )}
    </div>
  );
}
