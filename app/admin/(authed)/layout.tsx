import Link from "next/link";
import { logoutAdmin } from "@/lib/auth";
import { redirect } from "next/navigation";

async function logoutAction() {
  "use server";
  await logoutAdmin();
  redirect("/admin/login");
}

export default function AuthedAdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col min-h-screen">
      <header className="bg-slate-900 text-white">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
          <Link href="/admin" className="font-bold">
            邏ｹ莉句ｱ驟ｬ邂｡逅・" "}
            <span className="text-xs font-normal text-slate-300 ml-2">邂｡逅・判髱｢</span>
          </Link>
          <nav className="flex items-center gap-1 text-sm">
            <Link href="/admin" className="px-3 py-1.5 rounded hover:bg-slate-800">
              繧ｵ繝槭Μ繝ｼ
            </Link>
            <Link href="/admin/members" className="px-3 py-1.5 rounded hover:bg-slate-800">
              諡・ｽ楢・            </Link>
            <Link href="/admin/deals" className="px-3 py-1.5 rounded hover:bg-slate-800">
              譯井ｻｶ
            </Link>
            <form action={logoutAction}>
              <button
                type="submit"
                className="px-3 py-1.5 rounded hover:bg-slate-800 text-slate-300"
              >
                繝ｭ繧ｰ繧｢繧ｦ繝・              </button>
            </form>
          </nav>
        </div>
      </header>
      <main className="flex-1">{children}</main>
    </div>
  );
}

