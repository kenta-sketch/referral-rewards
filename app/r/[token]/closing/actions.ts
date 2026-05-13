"use server";

import { revalidatePath } from "next/cache";
import { supabaseAdmin } from "@/lib/supabase";
import { sendPayoutConfirmedEmail } from "@/lib/email";

async function findCloser(token: string) {
  const { data, error } = await supabaseAdmin
    .from("members")
    .select("id, is_active, is_closer")
    .eq("access_token", token)
    .maybeSingle();
  if (error) throw error;
  if (!data) throw new Error("無効なURLです");
  if (!data.is_active) throw new Error("このアカウントは無効化されています");
  if (!data.is_closer) throw new Error("この機能はクロージング担当者専用です");
  return data;
}

export async function setMeetingDateAsCloserAction(formData: FormData): Promise<void> {
  const token = String(formData.get("token") ?? "");
  const dealId = String(formData.get("deal_id") ?? "");
  const meetingDateRaw = String(formData.get("meeting_date") ?? "").trim();
  const meeting_date = meetingDateRaw || null;

  if (!dealId) throw new Error("案件IDが不正です");

  const closer = await findCloser(token);

  const { error } = await supabaseAdmin.rpc("set_meeting_date", {
    p_deal_id: dealId,
    p_meeting_date: meeting_date,
    p_closer_member_id: closer.id,
  });
  if (error) throw error;

  revalidatePath(`/r/${token}/closing`);
}

export async function confirmDealAsCloserAction(formData: FormData): Promise<void> {
  const token = String(formData.get("token") ?? "");
  const dealId = String(formData.get("deal_id") ?? "");
  const actualHeadcount = Number(formData.get("actual_headcount"));
  const meetingDateRaw = String(formData.get("meeting_date") ?? "").trim();
  const meeting_date = meetingDateRaw || null;

  if (!dealId) throw new Error("案件IDが不正です");
  if (!Number.isFinite(actualHeadcount) || actualHeadcount < 1) {
    throw new Error("実施人数は1以上の整数で入力してください");
  }

  const closer = await findCloser(token);

  const { error } = await supabaseAdmin.rpc("confirm_deal", {
    p_deal_id: dealId,
    p_actual_headcount: Math.floor(actualHeadcount),
    p_closer_member_id: closer.id,
    p_meeting_date: meeting_date,
  });
  if (error) throw error;

  // 配分された各受取者にメール通知
  const { data: deal } = await supabaseAdmin
    .from("deals")
    .select("client_name")
    .eq("id", dealId)
    .maybeSingle();
  if (deal) {
    const { data: payouts } = await supabaseAdmin
      .from("payouts")
      .select(
        "amount_taxed_yen, amount_deferred_yen, receipt_type, member:members!member_id(name, email, access_token)"
      )
      .eq("deal_id", dealId);
    type Row = {
      amount_taxed_yen: number;
      amount_deferred_yen: number;
      receipt_type: "taxed" | "deferred";
      member: { name: string; email: string | null; access_token: string } | null;
    };
    for (const p of (payouts ?? []) as unknown as Row[]) {
      if (!p.member?.email) continue;
      const amt =
        p.receipt_type === "deferred" ? p.amount_deferred_yen : p.amount_taxed_yen;
      await sendPayoutConfirmedEmail({
        to: p.member.email,
        name: p.member.name,
        accessToken: p.member.access_token,
        clientName: deal.client_name,
        amountYen: amt,
        receiptType: p.receipt_type,
      });
    }
  }

  revalidatePath(`/r/${token}/closing`);
  revalidatePath(`/r/${token}`);
}

export async function cancelDealAsCloserAction(formData: FormData): Promise<void> {
  const token = String(formData.get("token") ?? "");
  const dealId = String(formData.get("deal_id") ?? "");
  if (!dealId) throw new Error("案件IDが不正です");

  await findCloser(token);

  // 確定済みなら配分を削除してからキャンセル
  const { data: deal } = await supabaseAdmin
    .from("deals")
    .select("status")
    .eq("id", dealId)
    .maybeSingle();

  if (deal?.status === "confirmed") {
    const { error: delErr } = await supabaseAdmin.from("payouts").delete().eq("deal_id", dealId);
    if (delErr) throw delErr;
  }

  const { error } = await supabaseAdmin
    .from("deals")
    .update({ status: "canceled" })
    .eq("id", dealId);
  if (error) throw error;

  revalidatePath(`/r/${token}/closing`);
}
