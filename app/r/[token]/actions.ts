"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { supabaseAdmin } from "@/lib/supabase";

async function findMember(token: string) {
  const { data, error } = await supabaseAdmin
    .from("members")
    .select("id, is_active")
    .eq("access_token", token)
    .maybeSingle();
  if (error) throw error;
  if (!data) throw new Error("無効なURLです");
  if (!data.is_active) throw new Error("このアカウントは無効化されています");
  return data;
}

export async function registerTossUpAction(formData: FormData): Promise<void> {
  const token = String(formData.get("token") ?? "");
  const clientName = String(formData.get("client_name") ?? "").trim();
  const expectedHeadcountRaw = String(formData.get("expected_headcount") ?? "").trim();
  const notes = String(formData.get("notes") ?? "").trim();

  if (!clientName) throw new Error("紹介先名は必須です");
  const expectedHeadcount = expectedHeadcountRaw ? Number(expectedHeadcountRaw) : null;
  if (expectedHeadcount !== null && (!Number.isFinite(expectedHeadcount) || expectedHeadcount < 0)) {
    throw new Error("人数は0以上の整数で入力してください");
  }

  const member = await findMember(token);

  const { error } = await supabaseAdmin.from("deals").insert({
    client_name: clientName,
    toss_up_member_id: member.id,
    expected_headcount: expectedHeadcount,
    notes: notes || null,
    status: "tossed_up",
  });
  if (error) throw error;

  revalidatePath(`/r/${token}`);
  redirect(`/r/${token}`);
}

export async function changeReceiptTypeAction(formData: FormData): Promise<void> {
  const token = String(formData.get("token") ?? "");
  const payoutId = String(formData.get("payout_id") ?? "");
  const receiptType = String(formData.get("receipt_type") ?? "");

  if (!["taxed", "deferred"].includes(receiptType)) {
    throw new Error("受取方式が不正です");
  }

  const member = await findMember(token);

  // 自分のpayoutであることを確認
  const { data: payout, error: pErr } = await supabaseAdmin
    .from("payouts")
    .select("id, member_id, payment_status")
    .eq("id", payoutId)
    .maybeSingle();

  if (pErr) throw pErr;
  if (!payout || payout.member_id !== member.id) {
    throw new Error("対象の配分が見つかりません");
  }
  if (payout.payment_status === "paid") {
    throw new Error("支払済みの配分は変更できません");
  }

  const { error: uErr } = await supabaseAdmin
    .from("payouts")
    .update({ receipt_type: receiptType })
    .eq("id", payoutId);

  if (uErr) throw uErr;

  revalidatePath(`/r/${token}`);
}

/**
 * 担当者の基本受取方式を変更し、未払い／予定中のpayoutsも一括で同方式に切り替える
 */
export async function setDefaultReceiptTypeAction(formData: FormData): Promise<void> {
  const token = String(formData.get("token") ?? "");
  const receiptType = String(formData.get("receipt_type") ?? "");

  if (!["taxed", "deferred"].includes(receiptType)) {
    throw new Error("受取方式が不正です");
  }

  const member = await findMember(token);

  const { error } = await supabaseAdmin.rpc("set_default_receipt_type", {
    p_member_id: member.id,
    p_receipt_type: receiptType,
    p_apply_to_unpaid: true,
  });
  if (error) throw error;

  revalidatePath(`/r/${token}`);
}
