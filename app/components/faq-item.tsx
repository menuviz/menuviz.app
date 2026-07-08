"use client";

import { useState } from "react";

export function FaqItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="faq-item border-b border-hairline">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        className="flex w-full items-center justify-between gap-6 py-5 text-left text-[16px] font-medium text-mint transition-colors duration-300 hover:text-phosphor sm:text-[17px]"
      >
        {q}
        <svg
          className={`faq-icon h-4 w-4 shrink-0 text-fern transition-transform duration-300 ease-out-quart ${
            open ? "rotate-45" : ""
          }`}
          viewBox="0 0 16 16"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          aria-hidden="true"
        >
          <path d="M8 2v12M2 8h12" />
        </svg>
      </button>
      <div
        className="grid transition-[grid-template-rows] duration-300 ease-out-quart"
        style={{ gridTemplateRows: open ? "1fr" : "0fr" }}
      >
        <div className="overflow-hidden">
          <p className="max-w-[60ch] pb-6 text-[15px] leading-relaxed text-sage">{a}</p>
        </div>
      </div>
    </div>
  );
}
