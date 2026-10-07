"use client";

import { AnimatePresence, motion } from "framer-motion";
import { X } from "lucide-react";
import type { CallSummary } from "@/lib/types";

type CallSummaryModalProps = {
  open: boolean;
  summary: CallSummary | null;
  onClose: () => void;
};

const FIELDS: { key: keyof CallSummary; label: string }[] = [
  { key: "customer", label: "Customer" },
  { key: "product", label: "Interest" },
  { key: "budget", label: "Budget" },
  { key: "occasion", label: "Occasion" },
  { key: "timeline", label: "Timeline" },
  { key: "visit", label: "Preferred Visit" },
  { key: "lead", label: "Lead" },
];

export function CallSummaryModal({
  open,
  summary,
  onClose,
}: CallSummaryModalProps) {
  return (
    <AnimatePresence>
      {open && summary && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center bg-[rgba(28,24,18,0.38)] px-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
        >
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-labelledby="call-summary-title"
            initial={{ opacity: 0, y: 18, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 12 }}
            transition={{ duration: 0.28, ease: "easeOut" }}
            className="max-h-[90vh] w-full max-w-[640px] overflow-y-auto rounded-2xl border border-[#e6dcc8] bg-[#fbf8f2] p-8 shadow-[0_24px_80px_rgba(40,30,10,0.18)]"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-start justify-between">
              <div>
                <p className="text-[11px] tracking-[0.28em] text-[#8a7a62]">
                  CALL SUMMARY
                </p>
                <h2
                  id="call-summary-title"
                  className="mt-2 font-serif text-[28px] text-[#2c261c]"
                >
                  Conversation overview
                </h2>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="rounded-full p-2 text-[#6e6254] hover:bg-[#f0e8d8]"
                aria-label="Close summary"
              >
                <X size={18} strokeWidth={1.6} />
              </button>
            </div>

            <dl className="mt-7 grid grid-cols-1 gap-x-8 gap-y-4 sm:grid-cols-2">
              {FIELDS.map((field) => (
                <div key={field.key} className="border-b border-[#efe6d6] pb-3">
                  <dt className="text-[11px] tracking-[0.16em] text-[#8a7a62]">
                    {field.label}
                  </dt>
                  <dd className="mt-1 text-[15px] text-[#2c261c]">
                    {summary[field.key]}
                  </dd>
                </div>
              ))}
            </dl>

            <div className="mt-7">
              <p className="text-[11px] tracking-[0.16em] text-[#8a7a62]">
                AI Summary
              </p>
              <p className="mt-2 font-serif text-[17px] leading-8 text-[#2c261c]">
                “{summary.aiSummary}”
              </p>
            </div>

            <div className="mt-6">
              <p className="text-[11px] tracking-[0.16em] text-[#8a7a62]">
                Recommended Next Action
              </p>
              <p className="mt-2 text-[15px] leading-7 text-[#3d362c]">
                {summary.nextAction}
              </p>
            </div>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              {["Assign to Sales Team", "Schedule Visit", "WhatsApp Follow-up"].map(
                (label) => (
                  <button
                    key={label}
                    type="button"
                    className="flex-1 rounded-full border border-[#d9cbb0] bg-white px-4 py-3 text-[13px] tracking-[0.04em] text-[#2c261c] transition hover:border-[#b8955a] hover:bg-[#f7f1e6]"
                  >
                    {label}
                  </button>
                ),
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
