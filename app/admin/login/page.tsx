import { redirect } from "next/navigation";
import { attemptAdminLogin, isAdminAuthenticated } from "@/lib/auth";

export const dynamic = "force-dynamic";

async function loginAction(formData: FormData) {
  "use server";
  const password = String(formData.get("password") ?? "");
  const ok = await attemptAdminLogin(password);
  if (!ok) {
    redirect("/admin/login?error=1");
  }
  redirect("/admin");
}

export default async function AdminLoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const sp = await searchParams;
  const already = await isAdminAuthenticated();
  if (already) redirect("/admin");

  return (
    <main className="flex-1 flex items-center justify-center p-6">
      <form action={loginAction} className="card p-8 w-full max-w-sm flex flex-col gap-4">
        <div className="text-center">
          <h1 className="text-xl font-bold">邂｡逅・・Ο繧ｰ繧､繝ｳ</h1>
          <p className="text-sm text-gray-500 mt-1">邏ｹ莉句ｱ驟ｬ邂｡逅・/p>
        </div>

        <div>
          <label className="label" htmlFor="password">繝代せ繝ｯ繝ｼ繝・/label>
          <input
            id="password"
            name="password"
            type="password"
            required
            autoFocus
            autoComplete="current-password"
            className="input"
          />
        </div>

        {sp?.error && (
          <p className="text-sm text-red-600 text-center">繝代せ繝ｯ繝ｼ繝峨′驕輔＞縺ｾ縺・/p>
        )}

        <button type="submit" className="btn-primary">繝ｭ繧ｰ繧､繝ｳ</button>
      </form>
    </main>
  );
}

