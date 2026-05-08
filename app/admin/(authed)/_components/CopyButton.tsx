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
          alert("繧ｳ繝斐・縺ｫ螟ｱ謨励＠縺ｾ縺励◆縲よ焔蜍輔〒繧ｳ繝斐・縺励※縺上□縺輔＞縲・);
        }
      }}
      className="btn-secondary text-xs whitespace-nowrap"
    >
      {copied ? "繧ｳ繝斐・貂・ : "繧ｳ繝斐・"}
    </button>
  );
}

