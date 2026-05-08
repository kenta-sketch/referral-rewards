import Link from "next/link";
import { supabaseAdmin } from "@/lib/supabase";

export const dynamic = "force-dynamic";

type Row = {
  id: string;
  name: string;
  email: string | null;
  parent_id: string | null;
  is_active: boolean;
  access_token: string;
  created_at: string;
  parent: { id: string; name: string } | null;
};

async function loadMembers(): Promise<Row[]> {
  const { data, error } = await supabaseAdmin
    .from("members")
    .select("id, name, email, parent_id, is_active, access_token, created_at, parent:members!parent_id(id, name)")
    .order("created_at", { ascending: true });
  if (error) throw error;
  return (data ?? []) as unknown as Row[];
}

export default async function MembersPage() {
  const rows = await loadMembers();

  return (
    <div className="max-w-6xl mx-auto p-4 md:p-8 w-full">
      <header className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold">諡・ｽ楢・/h1>
        <Link href="/admin/members/new" className="btn-primary">+ 諡・ｽ楢・ｒ霑ｽ蜉</Link>
      </header>

      <div className="card overflow-hidden">
        {rows.length === 0 ? (
          <p className="p-6 text-sm text-gray-500 text-center">縺ｾ縺諡・ｽ楢・′縺・∪縺帙ｓ</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-xs text-gray-500">
                <tr>
                  <th className="text-left px-4 py-2 font-medium">豌丞錐</th>
                  <th className="text-left px-4 py-2 font-medium">隕ｪ・育ｴｹ莉句・・・/th>
                  <th className="text-left px-4 py-2 font-medium">繝｡繝ｼ繝ｫ</th>
                  <th className="text-center px-4 py-2 font-medium">迥ｶ諷・/th>
                  <th className="text-left px-4 py-2 font-medium">蟆ら畑URL</th>
                  <th className="text-right px-4 py-2 font-medium"></th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => {
                  const url = `/r/${r.access_token}`;
                  return (
                    <tr key={r.id} className="border-t border-gray-100">
                      <td className="px-4 py-3 font-medium">{r.name}</td>
                      <td className="px-4 py-3 text-gray-600">{r.parent?.name ?? "窶費ｼ医Ν繝ｼ繝茨ｼ・}</td>
                      <td className="px-4 py-3 text-gray-600">{r.email ?? "窶・}</td>
                      <td className="px-4 py-3 text-center">
                        {r.is_active ? (
                          <span className="badge bg-green-100 text-green-800">譛牙柑</span>
                        ) : (
                          <span className="badge bg-gray-100 text-gray-600">蛛懈ｭ｢</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-xs">
                        <a href={url} className="text-slate-700 hover:underline" target="_blank" rel="noreferrer">
                          {url}
                        </a>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <Link
                          href={`/admin/members/${r.id}`}
                          className="text-xs text-slate-700 hover:underline"
                        >
                          邱ｨ髮・竊・                        </Link>
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

