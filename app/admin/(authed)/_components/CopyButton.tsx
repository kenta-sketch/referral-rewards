"use client";

import { useState } from "react";

export function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      type="button"
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(text);
          setCopied(true);
          setTimeout(() => setCopied(false), 1500);
        } catch {
          alert("コピーに失敗しました。手動でコピーしてください。");
        }
      }}
      className="btn-secondary text-xs whitespace-nowrap"
    >
      {copied ? "コピー済" : "コピー"}
    </button>
  );
}
