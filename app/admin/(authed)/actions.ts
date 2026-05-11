"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { supabaseAdmin } from "@/lib/supabase";
import { requireAdmin } from "@/lib/auth";

// =====================
// メンバー操作
// =====================

export async function createMemberAction(formData: FormData): Promise<void> {
  await requireAdmin();
  const name = String(formData.get("name") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim() || null;
  const phone = String(formData.get("phone") ?? "").trim() || null;
  const parentIdRaw = String(formData.get("parent_id") ?? "").trim();
  const parent_id = parentIdRaw || null;
  const isCloser = formData.get("is_closer") === "on";
  const isPayer = formData.get("is_payer") === "on";

  if (!name) throw new Error("氏名は必須です");

  const { error } = await supabaseAdmin.from("members").insert({
    name,
    email,
    phone,
    parent_id,
    is_closer: isCloser,
    is_payer: isPayer,
  });
  if (error) throw error;
  revalidatePath("/admin/members");
  redirect("/admin/members");
}

export async function updateMemberAction(formData: FormData): Promise<void> {
  await requireAdmin();
  const id = String(formData.get("id") ?? "");
  const name = String(formData.get("name") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim() || null;
  const phone = String(formData.get("phone") ?? "").trim() || null;
  const parentIdRaw = String(formData.get("parent_id") ?? "").trim();
  const parent_id = parentIdRaw || null;
  const isActive = formData.get("is_active") === "on";
  const isCloser = formData.get("is_closer") === "on";
  const isPayer = formData.get("is_payer") === "on";
  const notes = String(formData.get("notes") ?? "").trim() || null;

  if (!id) throw new Error("ID不正");
  if (!name) throw new Error("氏名は必須です");
  if (parent_id === id) throw new Error("自分を親にすることはできません");

  const { error } = await supabaseAdmin
    .from("members")
    .update({
      name,
      email,
      phone,
      parent_id,
      is_active: isActive,
      is_closer: isCloser,
      is_payer: isPayer,
      notes,
    })
    .eq("id", id);
  if (error) throw error;
  revalidatePath("/admin/members");
  revalidatePath(`/admin/members/${id}`);
}

export async function deleteMemberAction(formData: FormData): Promise<void> {
  await requireAdmin();
  const id = String(formData.get("id") ?? "");
  if (!id) throw new Error("ID不正");

  const { error } = await supabaseAdmin.rpc("delete_member", { p_member_id: id });
  if (error) {
    // 案件・配分があって削除できない場合
    throw new Error(
      error.message?.includes("紐づいている")
        ? "この担当者は案件または配分に紐づいているため削除できません。代わりに「無効」にチェックを外してください。"
        : error.message
    );
  }
  revalidatePath("/admin/members");
  redirect("/admin/members");
}

export async function regenerateMemberTokenAction(formData: FormData): Promise<void> {
  await requireAdmin();
  const id = String(formData.get("id") ?? "");
  if (!id) throw new Error("ID不正");

  // Web Crypto API でランダムなトークンを生成（48文字のhex）
  const bytes = new Uint8Array(24);
  crypto.getRandomValues(bytes);
  const token = Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");

  const { error } = await supabaseAdmin
    .from("members")
    .update({ access_token: token })
    .eq("id", id);
  if (error) throw error;
  revalidatePath("/admin/members");
  revalidatePath(`/admin/members/${id}`);
}

// =====================
// 案件操作
// =====================

export async function confirmDealAction(formData: FormData): Promise<void> {
  await requireAdmin();
  const id = String(formData.get("id") ?? "");
  const actualHeadcount = Number(formData.get("actual_headcount"));
  const closerIdRaw = String(formData.get("closer_member_id") ?? "").trim();
  const closer_member_id = closerIdRaw || null;
  const meetingDateRaw = String(formData.get("meeting_date") ?? "").trim();
  const meeting_date = meetingDateRaw || null;

  if (!id) throw new Error("ID不正");
  if (!Number.isFinite(actualHeadcount) || actualHeadcount < 1) {
    throw new Error("実施人数は1以上の整数で入力してください");
  }

  const { error } = await supabaseAdmin.rpc("confirm_deal", {
    p_deal_id: id,
    p_actual_headcount: Math.floor(actualHeadcount),
    p_closer_member_id: closer_member_id,
    p_meeting_date: meeting_date,
  });
  if (error) throw error;
  revalidatePath("/admin/deals");
  revalidatePath(`/admin/deals/${id}`);
  revalidatePath("/admin");
}

export async function setMeetingDateAction(formData: FormData): Promise<void> {
  await requireAdmin();
  const id = String(formData.get("id") ?? "");
  const meetingDateRaw = String(formData.get("meeting_date") ?? "").trim();
  const meeting_date = meetingDateRaw || null;
  const closerIdRaw = String(formData.get("closer_member_id") ?? "").trim();
  const closer_member_id = closerIdRaw || null;

  if (!id) throw new Error("ID不正");

  const { error } = await supabaseAdmin.rpc("set_meeting_date", {
    p_deal_id: id,
    p_meeting_date: meeting_date,
    p_closer_member_id: closer_member_id,
  });
  if (error) throw error;
  revalidatePath("/admin/deals");
  revalidatePath(`/admin/deals/${id}`);
}

export async function cancelDealAction(formData: FormData): Promise<void> {
  await requireAdmin();
  const id = String(formData.get("id") ?? "");
  if (!id) throw new Error("ID不正");

  // 確定済みかどうかでpayoutsの扱いが変わる
  const { data: deal } = await supabaseAdmin
    .from("deals")
    .select("status")
    .eq("id", id)
    .maybeSingle();

  if (deal?.status === "confirmed") {
    // 配分を全削除
    const { error: delErr } = await supabaseAdmin.from("payouts").delete().eq("deal_id", id);
    if (delErr) throw delErr;
  }

  const { error } = await supabaseAdmin
    .from("deals")
    .update({ status: "canceled" })
    .eq("id", id);
  if (error) throw error;
  revalidatePath("/admin/deals");
  revalidatePath(`/admin/deals/${id}`);
}

export async function createDealAction(formData: FormData): Promise<void> {
  await requireAdmin();
  const client_name = String(formData.get("client_name") ?? "").trim();
  const toss_up_member_id = String(formData.get("toss_up_member_id") ?? "").trim();
  const expectedRaw = String(formData.get("expected_headcount") ?? "").trim();
  const expected_headcount = expectedRaw ? Number(expectedRaw) : null;
  const notes = String(formData.get("notes") ?? "").trim() || null;

  if (!client_name) throw new Error("紹介先名は必須です");
  if (!toss_up_member_id) throw new Error("トスアップ者は必須です");

  const { error } = await supabaseAdmin.from("deals").insert({
    client_name,
    toss_up_member_id,
    expected_headcount,
    notes,
    status: "tossed_up",
  });
  if (error) throw error;
  revalidatePath("/admin/deals");
  redirect("/admin/deals");
}

// =====================
// 配分（payouts）操作
// =====================

export async function updatePayoutAction(formData: FormData): Promise<void> {
  await requireAdmin();
  const id = String(formData.get("id") ?? "");
  const payment_status = String(formData.get("payment_status") ?? "");
  const scheduled = String(formData.get("scheduled_payment_date") ?? "").trim() || null;
  const paid = String(formData.get("paid_at") ?? "").trim() || null;
  const notes = String(formData.get("notes") ?? "").trim() || null;

  if (!id) throw new Error("ID不正");
  if (!["unpaid", "scheduled", "paid"].includes(payment_status)) {
    throw new Error("ステータス不正");
  }

  const update: Record<string, unknown> = {
    payment_status,
    scheduled_payment_date: scheduled,
    paid_at: paid,
    notes,
  };

  const { data: payout } = await supabaseAdmin
    .from("payouts")
    .select("deal_id")
    .eq("id", id)
    .maybeSingle();

  const { error } = await supabaseAdmin.from("payouts").update(update).eq("id", id);
  if (error) throw error;
  revalidatePath("/admin");
  if (payout?.deal_id) revalidatePath(`/admin/deals/${payout.deal_id}`);
}
