"use client";

import { useTransition } from "react";
import { changeReceiptTypeAction } from "../actions";

export function ReceiptTypeSelector({
  token,
  payoutId,
  current,
  disabled,
}: {
  token: string;
  payoutId: string;
  current: "taxed" | "deferred";
  disabled?: boolean;
}) {
  const [pending, startTransition] = useTransition();

  function onChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const value = e.target.value;
    if (value === current) return;
    const fd = new FormData();
    fd.set("token", token);
    fd.set("payout_id", payoutId);
    fd.set("receipt_type", value);
    startTransition(async () => {
      try {
        await changeReceiptTypeAction(fd);
      } catch (err) {
        alert((err as Error).message);
      }
    });
  }

  return (
    <select
      className="rounded-md border border-gray-300 text-xs px-2 py-1 disabled:bg-gray-100 disabled:text-gray-500"
      value={current}
      onChange={onChange}
      disabled={disabled || pending}
    >
      <option value="taxed">即時（税込）</option>
      <option value="deferred">繰延（×3）</option>
    </select>
  );
}
