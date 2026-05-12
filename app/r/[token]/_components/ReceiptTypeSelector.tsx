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

  const isTaxed = current === "taxed";
  return (
    <div className="inline-block relative">
      <select
        className={`appearance-none rounded-lg border-2 text-xs font-medium px-3 py-1.5 pr-7 cursor-pointer transition shadow-sm
          disabled:bg-gray-100 disabled:text-gray-400 disabled:border-gray-200 disabled:cursor-not-allowed
          ${
            isTaxed
              ? "border-slate-700 bg-white text-slate-900 hover:bg-slate-50"
              : "border-amber-500 bg-amber-50 text-amber-900 hover:bg-amber-100"
          }`}
        value={current}
        onChange={onChange}
        disabled={disabled || pending}
      >
        <option value="taxed">即時（税込）</option>
        <option value="deferred">繰延</option>
      </select>
      <svg
        className="w-3 h-3 absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
      </svg>
    </div>
  );
}
