"use client";

import { useEffect, useRef } from "react";
import { AnimatePresence, motion } from "framer-motion";
import type { TranscriptMessage } from "@/lib/types";

type TranscriptPanelProps = {
  messages: TranscriptMessage[];
  started: boolean;
};

export function TranscriptPanel({ messages, started }: TranscriptPanelProps) {
  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    listRef.current?.scrollTo({
      top: listRef.current.scrollHeight,
      behavior: "smooth",
    });
  }, [messages]);

  return (
    <section className="flex min-h-[280px] flex-col rounded-2xl border border-[#e6dcc8] bg-[#fbf8f2] p-6 shadow-[0_12px_36px_rgba(70,50,20,0.04)]">
      <p className="text-[11px] font-medium tracking-[0.28em] text-[#8a7a62]">
        LIVE TRANSCRIPT
      </p>
      <div
        ref={listRef}
        className="mt-5 max-h-[420px] flex-1 space-y-5 overflow-y-auto pr-1"
      >
        {!started && (
          <p className="max-w-sm text-[14px] leading-relaxed text-[#8a7a62]">
            Conversation will appear here as Maya speaks with the customer.
          </p>
        )}
        <AnimatePresence initial={false}>
          {messages.map((message) => (
            <motion.article
              key={message.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.32, ease: "easeOut" }}
              className="border-b border-[#efe6d6] pb-4 last:border-b-0 last:pb-0"
            >
              <p
                className={`text-[10px] font-medium tracking-[0.22em] ${
                  message.speaker === "ai"
                    ? "text-[#9a7b45]"
                    : "text-[#6a6258]"
                }`}
              >
                {message.speaker === "ai" ? "AI" : "CUSTOMER"}
              </p>
              <p className="mt-2 font-serif text-[17px] leading-7 text-[#2c261c]">
                “{message.text}”
              </p>
            </motion.article>
          ))}
        </AnimatePresence>
      </div>
    </section>
  );
}
