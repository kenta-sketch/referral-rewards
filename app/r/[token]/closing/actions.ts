"use server";

import { revalidatePath } from "next/cache";
import { supabaseAdmin } from "@/lib/supabase";

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
