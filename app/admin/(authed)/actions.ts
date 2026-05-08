"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { supabaseAdmin } from "@/lib/supabase";
import { requireAdmin } from "@/lib/auth";

// =====================
// 繝｡繝ｳ繝舌・謫堺ｽ・// =====================

export async function createMemberAction(formData: FormData): Promise<void> {
  await requireAdmin();
  const name = String(formData.get("name") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim() || null;
  const phone = String(formData.get("phone") ?? "").trim() || null;
  const parentIdRaw = String(formData.get("parent_id") ?? "").trim();
  const parent_id = parentIdRaw || null;

  if (!name) throw new Error("豌丞錐縺ｯ蠢・医〒縺・);

  const { error } = await supabaseAdmin.from("members").insert({
    name,
    email,
    phone,
    parent_id,
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
  const notes = String(formData.get("notes") ?? "").trim() || null;

  if (!id) throw new Error("ID荳肴ｭ｣");
  if (!name) throw new Error("豌丞錐縺ｯ蠢・医〒縺・);
  if (parent_id === id) throw new Error("閾ｪ蛻・ｒ隕ｪ縺ｫ縺吶ｋ縺薙→縺ｯ縺ｧ縺阪∪縺帙ｓ");

  const { error } = await supabaseAdmin
    .from("members")
    .update({ name, email, phone, parent_id, is_active: isActive, notes })
    .eq("id", id);
  if (error) throw error;
  revalidatePath("/admin/members");
  revalidatePath(`/admin/members/${id}`);
}

export async function regenerateMemberTokenAction(formData: FormData): Promise<void> {
  await requireAdmin();
  const id = String(formData.get("id") ?? "");
  if (!id) throw new Error("ID荳肴ｭ｣");

  // Web Crypto API 縺ｧ繝ｩ繝ｳ繝繝縺ｪ繝医・繧ｯ繝ｳ繧堤函謌撰ｼ・8譁・ｭ励・hex・・  const bytes = new Uint8Array(24);
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
// 譯井ｻｶ謫堺ｽ・// =====================

export async function confirmDealAction(formData: FormData): Promise<void> {
  await requireAdmin();
  const id = String(formData.get("id") ?? "");
  const actualHeadcount = Number(formData.get("actual_headcount"));
  const closerIdRaw = String(formData.get("closer_member_id") ?? "").trim();
  const closer_member_id = closerIdRaw || null;

  if (!id) throw new Error("ID荳肴ｭ｣");
  if (!Number.isFinite(actualHeadcount) || actualHeadcount < 1) {
    throw new Error("螳滓命莠ｺ謨ｰ縺ｯ1莉･荳翫・謨ｴ謨ｰ縺ｧ蜈･蜉帙＠縺ｦ縺上□縺輔＞");
  }

  const { error } = await supabaseAdmin.rpc("confirm_deal", {
    p_deal_id: id,
    p_actual_headcount: Math.floor(actualHeadcount),
    p_closer_member_id: closer_member_id,
  });
  if (error) throw error;
  revalidatePath("/admin/deals");
  revalidatePath(`/admin/deals/${id}`);
  revalidatePath("/admin");
}

export async function cancelDealAction(formData: FormData): Promise<void> {
  await requireAdmin();
  const id = String(formData.get("id") ?? "");
  if (!id) throw new Error("ID荳肴ｭ｣");

  // 遒ｺ螳壽ｸ医∩縺九←縺・°縺ｧpayouts縺ｮ謇ｱ縺・′螟峨ｏ繧・  const { data: deal } = await supabaseAdmin
    .from("deals")
    .select("status")
    .eq("id", id)
    .maybeSingle();

  if (deal?.status === "confirmed") {
    // 驟榊・繧貞・蜑企勁
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

  if (!client_name) throw new Error("邏ｹ莉句・蜷阪・蠢・医〒縺・);
  if (!toss_up_member_id) throw new Error("繝医せ繧｢繝・・閠・・蠢・医〒縺・);

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
// 驟榊・・・ayouts・画桃菴・// =====================

export async function updatePayoutAction(formData: FormData): Promise<void> {
  await requireAdmin();
  const id = String(formData.get("id") ?? "");
  const payment_status = String(formData.get("payment_status") ?? "");
  const scheduled = String(formData.get("scheduled_payment_date") ?? "").trim() || null;
  const paid = String(formData.get("paid_at") ?? "").trim() || null;
  const notes = String(formData.get("notes") ?? "").trim() || null;

  if (!id) throw new Error("ID荳肴ｭ｣");
  if (!["unpaid", "scheduled", "paid"].includes(payment_status)) {
    throw new Error("繧ｹ繝・・繧ｿ繧ｹ荳肴ｭ｣");
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

