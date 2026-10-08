"use client";

import type { VoiceSessionStatus } from "@/lib/types";

const LINE: Record<
  VoiceSessionStatus,
  { label: string; tone: string; pulse: boolean }
> = {
  idle: { label: "SYSTEM ONLINE", tone: "text-[#3f6b52]", pulse: true },
  connecting: { label: "CONNECTING", tone: "text-[#8c7040]", pulse: true },
  connected: { label: "LIVE CONVERSATION", tone: "text-[#8c7040]", pulse: true },
  live: { label: "LIVE CONVERSATION", tone: "text-[#8c7040]", pulse: true },
  ended: { label: "CALL COMPLETED", tone: "text-[#6e665c]", pulse: false },
  error: { label: "SYSTEM ONLINE", tone: "text-[#3f6b52]", pulse: true },
};

export function Header({ status }: { status: VoiceSessionStatus }) {
  const line = LINE[status];

  return (
    <header className="border-b border-[rgba(42,38,34,0.08)]">
      <div className="mx-auto flex w-full max-w-[1180px] items-center justify-between gap-6 px-5 py-5 lg:px-8">
        <div>
          <p className="font-serif text-[34px] leading-[0.85] tracking-[0.16em] text-[#2a2622]">
            SHREEDAVI
          </p>
          <p className="mt-1 font-serif text-[15px] tracking-[0.32em] text-[#8c7040]">
            JEWELLERS
          </p>
          <p className="mt-3 text-[11px] tracking-[0.2em] text-[#6e665c]">
            AI SALES ASSISTANT
          </p>
        </div>
        <div className={`flex items-center gap-2 text-[11px] tracking-[0.16em] ${line.tone}`}>
          <span className="status-dot" data-pulse={line.pulse ? "true" : "false"} />
          {line.label}
        </div>
      </div>
    </header>
  );
}
