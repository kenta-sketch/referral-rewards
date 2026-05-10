"use client";

import { useTransition } from "react";
import { setDefaultReceiptTypeAction } from "../actions";

export function DefaultReceiptTypeForm({
  token,
  current,
}: {
  token: string;
  current: "taxed" | "deferred";
}) {
  const [pending, startTransition] = useTransition();

  function onChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const value = e.target.value;
    if (value === current) return;
    if (
      !confirm(
        value === "deferred"
          ? "基本受取を「繰延（×3・翌年以降）」に変更します。未払い／支払予定の配分もすべて繰延に切り替わります。よろしいですか？"
          : "基本受取を「即時（税込）」に変更します。未払い／支払予定の配分もすべて即時に切り替わります。よろしいですか？"
      )
    ) {
      e.target.value = current;
      return;
    }
    const fd = new FormData();
    fd.set("token", token);
    fd.set("receipt_type", value);
    startTransition(async () => {
      try {
        await setDefaultReceiptTypeAction(fd);
      } catch (err) {
        alert((err as Error).message);
        e.target.value = current;
      }
    });
  }

  return (
    <select
      className="rounded-md border border-gray-300 px-3 py-1.5 text-sm disabled:bg-gray-100"
      value={current}
      onChange={onChange}
      disabled={pending}
    >
      <option value="taxed">即時受取（税込・通常）</option>
      <option value="deferred">繰延受取（×3・翌年以降）</option>
    </select>
  );
}
