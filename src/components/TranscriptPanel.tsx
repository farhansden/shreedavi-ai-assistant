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
    <section className="desk-panel flex min-h-[320px] flex-1 flex-col p-5">
      <div className="flex items-baseline justify-between">
        <h2 className="text-[15px] text-[#f6efe4]">Call log</h2>
        <p className="text-[12px] text-[#9c8e7c]">
          {messages.length === 0 ? "Waiting" : `${messages.length} turns`}
        </p>
      </div>
      <div
        ref={listRef}
        className="desk-scroll mt-4 flex max-h-[460px] flex-1 flex-col gap-3 overflow-y-auto pr-1"
      >
        {!started && (
          <div className="flex flex-1 flex-col items-center justify-center px-6 py-10 text-center">
            <p className="font-serif text-[28px] text-[#f6efe4]">Line is quiet</p>
            <p className="mt-2 max-w-xs text-[14px] leading-6 text-[#9c8e7c]">
              Start the call and this log fills with Maya and the caller, turn by turn.
            </p>
          </div>
        )}
        <AnimatePresence initial={false}>
          {messages.map((message) => {
            const fromMaya = message.speaker === "ai";
            return (
              <motion.article
                key={message.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.28, ease: "easeOut" }}
                className={`flex max-w-[92%] flex-col ${fromMaya ? "self-start" : "self-end items-end"}`}
              >
                <p className="mb-1 text-[11px] text-[#9c8e7c]">
                  {fromMaya ? "Maya" : "Caller"}
                </p>
                <p
                  className={`rounded-2xl px-3.5 py-2.5 text-[14px] leading-6 text-[#f4eee6] ${
                    fromMaya
                      ? "rounded-tl-md border border-[rgba(224,196,138,0.2)] bg-[rgba(224,196,138,0.1)]"
                      : "rounded-tr-md bg-[#2a241d]"
                  }`}
                >
                  {message.text}
                </p>
              </motion.article>
            );
          })}
        </AnimatePresence>
      </div>
    </section>
  );
}
