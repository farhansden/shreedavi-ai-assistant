"use client";

import { motion } from "framer-motion";
import type { VoiceSessionStatus } from "@/lib/types";

const LINE: Record<VoiceSessionStatus, { label: string; tone: string }> = {
  idle: { label: "Line ready", tone: "bg-[#5dcaa0]" },
  connecting: { label: "Ringing", tone: "bg-[#e0c48a]" },
  connected: { label: "On a call", tone: "bg-[#5dcaa0]" },
  live: { label: "On a call", tone: "bg-[#5dcaa0]" },
  ended: { label: "Call ended", tone: "bg-[#9c8e7c]" },
  error: { label: "Line down", tone: "bg-[#e15b4c]" },
};

export function Header({ status }: { status: VoiceSessionStatus }) {
  const line = LINE[status];

  return (
    <header className="flex items-center justify-between border-b border-[rgba(224,196,138,0.14)] px-4 py-4 md:px-6">
      <div className="flex items-center gap-3">
        <span className="grid h-9 w-9 place-items-center rounded-full border border-[rgba(224,196,138,0.4)] text-[#e0c48a]">
          <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true">
            <path
              d="M8 1.2 9.7 6.1 14.8 8 9.7 9.9 8 14.8 6.3 9.9 1.2 8 6.3 6.1Z"
              fill="currentColor"
            />
          </svg>
        </span>
        <div>
          <p className="font-serif text-[22px] leading-none tracking-[0.08em] text-[#f6efe4]">
            Shreedavi
          </p>
          <p className="mt-1 text-[11px] text-[#9c8e7c]">Voice sales desk</p>
        </div>
      </div>
      <div className="flex items-center gap-2 rounded-full border border-[rgba(224,196,138,0.18)] bg-[rgba(20,18,16,0.7)] px-3 py-1.5 text-[12px] text-[#f4eee6]">
        <motion.span
          className={`h-1.5 w-1.5 rounded-full ${line.tone}`}
          animate={{ opacity: [1, 0.35, 1] }}
          transition={{ duration: 1.6, repeat: Infinity }}
        />
        {line.label}
      </div>
    </header>
  );
}
