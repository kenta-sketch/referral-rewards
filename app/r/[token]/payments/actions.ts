"use server";

import { revalidatePath } from "next/cache";
import { supabaseAdmin } from "@/lib/supabase";

async function findPayer(token: string) {
  const { data, error } = await supabaseAdmin
    .from("members")
    .select("id, is_active, is_payer")
    .eq("access_token", token)
    .maybeSingle();
  if (error) throw error;
  if (!data) throw new Error("無効なURLです");
  if (!data.is_active) throw new Error("このアカウントは無効化されています");
  if (!data.is_payer) throw new Error("この機能は支払い担当者専用です");
  return data;
}

export async function updatePayoutAsPayerAction(formData: FormData): Promise<void> {
  const token = String(formData.get("token") ?? "");
  const id = String(formData.get("id") ?? "");
  const payment_status = String(formData.get("payment_status") ?? "");
  const scheduled = String(formData.get("scheduled_payment_date") ?? "").trim() || null;
  const paid = String(formData.get("paid_at") ?? "").trim() || null;
  const notes = String(formData.get("notes") ?? "").trim() || null;

  if (!id) throw new Error("ID不正");
  if (!["unpaid", "scheduled", "paid"].includes(payment_status)) {
    throw new Error("ステータス不正");
  }

  await findPayer(token);

  const { error } = await supabaseAdmin
    .from("payouts")
    .update({
      payment_status,
      scheduled_payment_date: scheduled,
      paid_at: paid,
      notes,
    })
    .eq("id", id);
  if (error) throw error;

  revalidatePath(`/r/${token}/payments`);
}
