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
  { key: "visit", label: "Preferred visit" },
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
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/65 px-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
        >
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-labelledby="call-summary-title"
            initial={{ opacity: 0, y: 16, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10 }}
            transition={{ duration: 0.28, ease: "easeOut" }}
            className="desk-panel max-h-[90vh] w-full max-w-[640px] overflow-y-auto p-7"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-[12px] text-[#e0c48a]">After the call</p>
                <h2
                  id="call-summary-title"
                  className="mt-1 font-serif text-[32px] leading-none text-[#f6efe4]"
                >
                  Call summary
                </h2>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="rounded-full p-2 text-[#cbbfae] hover:bg-white/5"
                aria-label="Close summary"
              >
                <X size={18} strokeWidth={1.6} />
              </button>
            </div>

            <dl className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2">
              {FIELDS.map((field) => (
                <div
                  key={field.key}
                  className="rounded-xl border border-[rgba(224,196,138,0.12)] bg-black/20 px-3 py-2.5"
                >
                  <dt className="text-[11px] text-[#9c8e7c]">{field.label}</dt>
                  <dd className="mt-1 text-[15px] text-[#f6efe4]">
                    {summary[field.key]}
                  </dd>
                </div>
              ))}
            </dl>

            <div className="mt-5 rounded-xl border border-[rgba(224,196,138,0.12)] bg-black/20 px-4 py-3">
              <p className="text-[11px] text-[#9c8e7c]">What Maya heard</p>
              <p className="mt-2 text-[15px] leading-7 text-[#f4eee6]">
                {summary.aiSummary}
              </p>
            </div>

            <div className="mt-4">
              <p className="text-[11px] text-[#9c8e7c]">Next step</p>
              <p className="mt-1 text-[15px] leading-7 text-[#f4eee6]">
                {summary.nextAction}
              </p>
            </div>

            <div className="mt-6 flex flex-col gap-2 sm:flex-row">
              {["Assign to sales", "Schedule visit", "WhatsApp follow-up"].map(
                (label) => (
                  <button
                    key={label}
                    type="button"
                    className="flex-1 rounded-full border border-[rgba(224,196,138,0.28)] px-4 py-2.5 text-[13px] text-[#f6efe4] transition hover:bg-[rgba(224,196,138,0.1)]"
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
