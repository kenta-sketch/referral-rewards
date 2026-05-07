export function formatYen(amount: number | null | undefined): string {
  if (amount == null) return "—";
  return `¥${amount.toLocaleString("ja-JP")}`;
}

export function formatDate(d: string | Date | null | undefined): string {
  if (!d) return "—";
  const date = typeof d === "string" ? new Date(d) : d;
  return date.toLocaleDateString("ja-JP", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
}

export function formatDateTime(d: string | Date | null | undefined): string {
  if (!d) return "—";
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
      return { label: "トスアップ中", cls: "bg-amber-100 text-amber-800" };
    case "confirmed":
      return { label: "確定", cls: "bg-green-100 text-green-800" };
    case "canceled":
      return { label: "キャンセル", cls: "bg-gray-100 text-gray-600" };
    default:
      return { label: s, cls: "bg-gray-100 text-gray-600" };
  }
}

export function paymentStatusLabel(s: string): { label: string; cls: string } {
  switch (s) {
    case "unpaid":
      return { label: "未払い", cls: "bg-red-50 text-red-700 border border-red-200" };
    case "scheduled":
      return { label: "支払予定", cls: "bg-blue-50 text-blue-700 border border-blue-200" };
    case "paid":
      return { label: "支払済", cls: "bg-green-50 text-green-700 border border-green-200" };
    default:
      return { label: s, cls: "bg-gray-100 text-gray-600" };
  }
}

export function receiptTypeLabel(s: string): string {
  return s === "deferred" ? "繰延（翌年以降・3倍）" : "即時受取（税込）";
}
