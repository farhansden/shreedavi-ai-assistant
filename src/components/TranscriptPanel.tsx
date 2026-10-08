"use client";

import { useEffect, useRef } from "react";
import type { TranscriptMessage } from "@/lib/types";

type TranscriptPanelProps = {
  messages: TranscriptMessage[];
  active: boolean;
};

export function TranscriptPanel({ messages, active }: TranscriptPanelProps) {
  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const node = listRef.current;
    if (!node) return;
    node.scrollTo({ top: node.scrollHeight, behavior: "smooth" });
  }, [messages]);

  return (
    <section className="panel flex min-h-[420px] flex-col p-6 sm:p-7">
      <div className="flex items-baseline justify-between gap-4">
        <h2 className="text-[12px] tracking-[0.18em] text-[#8c7040]">
          LIVE TRANSCRIPT
        </h2>
        <p className="text-[12px] text-[#8a8176]">
          {messages.length === 0 ? "Waiting" : `${messages.length} turns`}
        </p>
      </div>
      <div
        ref={listRef}
        className="desk-scroll mt-5 flex max-h-[min(560px,62vh)] min-h-[300px] flex-1 flex-col gap-5 overflow-y-auto pr-2"
        aria-label="Live transcript"
      >
        {messages.length === 0 && (
          <div className="flex flex-1 flex-col items-center justify-center px-6 py-12 text-center">
            <p className="font-serif text-[32px] text-[#2a2622]">
              {active ? "Listening for the first turn" : "Transcript is ready"}
            </p>
            <p className="mt-2 max-w-sm text-[14px] leading-6 text-[#6e665c]">
              {active
                ? "What you say, and what Maya replies, will appear here as the conversation happens."
                : "Start a conversation and each turn will be written here with its time."}
            </p>
          </div>
        )}
        {messages.map((message) => {
          const fromAssistant = message.speaker === "ai";
          return (
            <article
              key={message.id}
              className={`border-l py-1 pl-4 ${
                fromAssistant
                  ? "border-[#c4a36a]"
                  : "border-[rgba(42,38,34,0.16)]"
              }`}
            >
              <div className="flex items-baseline gap-3">
                <p
                  className={`text-[11px] tracking-[0.16em] ${
                    fromAssistant ? "text-[#8c7040]" : "text-[#5c564e]"
                  }`}
                >
                  {fromAssistant ? "AI" : "CUSTOMER"}
                </p>
                {message.timestamp ? (
                  <time className="text-[12px] tabular-nums text-[#8a8176]">
                    {message.timestamp}
                  </time>
                ) : null}
              </div>
              <p className="mt-2 text-[15px] leading-7 text-[#2a2622]">
                “{message.text}”
              </p>
            </article>
          );
        })}
      </div>
    </section>
  );
}
