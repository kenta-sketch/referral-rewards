import Link from "next/link";
import { notFound } from "next/navigation";
import { supabaseAdmin } from "@/lib/supabase";
import { registerTossUpAction } from "../actions";

export const dynamic = "force-dynamic";

export default async function TossUpPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const { data: member } = await supabaseAdmin
    .from("members")
    .select("id, name, is_active")
    .eq("access_token", token)
    .maybeSingle();

  if (!member || !member.is_active) notFound();

  return (
    <div className="max-w-xl mx-auto p-4 md:p-8 w-full">
      <div className="mb-4">
        <Link href={`/r/${token}`} className="text-sm text-gray-500 hover:text-gray-900">
          ← マイページに戻る
        </Link>
      </div>
      <div className="card p-6">
        <h1 className="text-xl font-bold mb-1">案件をトスアップ</h1>
        <p className="text-sm text-gray-500 mb-6">
          {member.name} さんの紹介として、新しい案件を登録します。
          確定（実施人数の入力）は管理者が行います。
        </p>

        <form action={registerTossUpAction} className="flex flex-col gap-4">
          <input type="hidden" name="token" value={token} />

          <div>
            <label className="label" htmlFor="client_name">
              紹介先（会社・団体名）<span className="text-red-500">*</span>
            </label>
            <input
              required
              id="client_name"
              name="client_name"
              className="input"
              placeholder="例：株式会社○○"
            />
          </div>

          <div>
            <label className="label" htmlFor="expected_headcount">
              予定人数（任意）
            </label>
            <input
              id="expected_headcount"
              name="expected_headcount"
              type="number"
              min={0}
              className="input"
              placeholder="例：10"
            />
            <p className="text-xs text-gray-500 mt-1">
              わかれば入れてください。最終確定は実施人数で行います。
            </p>
          </div>

          <div>
            <label className="label" htmlFor="notes">
              メモ（任意）
            </label>
            <textarea
              id="notes"
              name="notes"
              rows={3}
              className="input"
              placeholder="紹介経緯・先方担当者・希望日程など"
            />
          </div>

          <div className="flex gap-2 pt-2">
            <button type="submit" className="btn-primary">
              トスアップを登録
            </button>
            <Link href={`/r/${token}`} className="btn-secondary">
              キャンセル
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}
