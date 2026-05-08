export function formatYen(amount: number | null | undefined): string {
  if (amount == null) return "窶・;
  return `ﾂ･${amount.toLocaleString("ja-JP")}`;
}

export function formatDate(d: string | Date | null | undefined): string {
  if (!d) return "窶・;
  const date = typeof d === "string" ? new Date(d) : d;
  return date.toLocaleDateString("ja-JP", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
}

export function formatDateTime(d: string | Date | null | undefined): string {
  if (!d) return "窶・;
  const date = typeof d === "string" ? new Date(d) : d;
  return date.toLocaleString("ja-JP", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function dealStatusLabel(s: string): { label: string; cls: string } {
  switch (s) {
    case "tossed_up":
      return { label: "繝医せ繧｢繝・・荳ｭ", cls: "bg-amber-100 text-amber-800" };
    case "confirmed":
      return { label: "遒ｺ螳・, cls: "bg-green-100 text-green-800" };
    case "canceled":
      return { label: "繧ｭ繝｣繝ｳ繧ｻ繝ｫ", cls: "bg-gray-100 text-gray-600" };
    default:
      return { label: s, cls: "bg-gray-100 text-gray-600" };
  }
}

export function paymentStatusLabel(s: string): { label: string; cls: string } {
  switch (s) {
    case "unpaid":
      return { label: "譛ｪ謇輔＞", cls: "bg-red-50 text-red-700 border border-red-200" };
    case "scheduled":
      return { label: "謾ｯ謇穂ｺ亥ｮ・, cls: "bg-blue-50 text-blue-700 border border-blue-200" };
    case "paid":
      return { label: "謾ｯ謇墓ｸ・, cls: "bg-green-50 text-green-700 border border-green-200" };
    default:
      return { label: s, cls: "bg-gray-100 text-gray-600" };
  }
}

export function receiptTypeLabel(s: string): string {
  return s === "deferred" ? "郢ｰ蟒ｶ・育ｿ悟ｹｴ莉･髯阪・3蛟搾ｼ・ : "蜊ｳ譎ょ女蜿厄ｼ育ｨ手ｾｼ・・;
}

