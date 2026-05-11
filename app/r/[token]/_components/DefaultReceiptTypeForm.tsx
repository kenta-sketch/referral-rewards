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

  function set(value: "taxed" | "deferred") {
    if (value === current || pending) return;
    if (
      !confirm(
        value === "deferred"
          ? "基本受取を「繰延（×3・翌年以降）」に変更します。\n未払い／支払予定の配分もすべて繰延に切り替わります。\nよろしいですか？"
          : "基本受取を「即時（税込）」に変更します。\n未払い／支払予定の配分もすべて即時に切り替わります。\nよろしいですか？"
      )
    ) {
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
      }
    });
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 w-full sm:w-auto sm:min-w-[420px]">
      <button
        type="button"
        onClick={() => set("taxed")}
        disabled={pending}
        className={`px-4 py-3 rounded-lg border-2 text-left transition disabled:opacity-50 ${
          current === "taxed"
            ? "border-slate-900 bg-slate-900 text-white"
            : "border-gray-200 bg-white hover:border-gray-400"
        }`}
      >
        <div className="flex items-center gap-2">
          <span
            className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
              current === "taxed" ? "border-white bg-white" : "border-gray-300"
            }`}
          >
            {current === "taxed" && <span className="w-2 h-2 rounded-full bg-slate-900" />}
          </span>
          <p className="font-semibold text-sm">即時受取（税込）</p>
        </div>
        <p className={`text-xs mt-1 ${current === "taxed" ? "text-slate-300" : "text-gray-500"}`}>
          通常パターン
        </p>
      </button>

      <button
        type="button"
        onClick={() => set("deferred")}
        disabled={pending}
        className={`px-4 py-3 rounded-lg border-2 text-left transition disabled:opacity-50 ${
          current === "deferred"
            ? "border-amber-500 bg-amber-500 text-white"
            : "border-gray-200 bg-white hover:border-amber-300"
        }`}
      >
        <div className="flex items-center gap-2">
          <span
            className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
              current === "deferred" ? "border-white bg-white" : "border-gray-300"
            }`}
          >
            {current === "deferred" && <span className="w-2 h-2 rounded-full bg-amber-600" />}
          </span>
          <p className="font-semibold text-sm">繰延受取（×3）</p>
        </div>
        <p className={`text-xs mt-1 ${current === "deferred" ? "text-amber-50" : "text-gray-500"}`}>
          翌年以降に3倍受取
        </p>
      </button>
    </div>
  );
}
