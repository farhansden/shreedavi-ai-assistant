"use client";

import { useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { X } from "lucide-react";
import type { CallSummary } from "@/lib/types";

type CallSummaryModalProps = {
  open: boolean;
  summary: CallSummary | null;
  onClose: () => void;
  onRestart: () => void;
};

const FIELDS: { key: keyof CallSummary; label: string }[] = [
  { key: "customer", label: "Customer" },
  { key: "duration", label: "Call Duration" },
  { key: "product", label: "Product Interest" },
  { key: "occasion", label: "Occasion" },
  { key: "budget", label: "Budget" },
  { key: "timeline", label: "Purchase Timeline" },
  { key: "visit", label: "Preferred Visit" },
  { key: "intent", label: "Intent" },
  { key: "leadScore", label: "Lead Score" },
  { key: "lead", label: "Lead Status" },
];

export function CallSummaryModal({
  open,
  summary,
  onClose,
  onRestart,
}: CallSummaryModalProps) {
  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  return (
    <AnimatePresence>
      {open && summary && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center bg-[#2a2622]/45 px-4 py-6"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
        >
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-labelledby="call-summary-title"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            transition={{ duration: 0.28, ease: "easeOut" }}
            className="panel max-h-[90vh] w-full max-w-[680px] overflow-y-auto bg-[#fbf8f3] p-7 sm:p-8"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-[11px] tracking-[0.18em] text-[#8c7040]">
                  SHREEDAVI JEWELLERS
                </p>
                <h2
                  id="call-summary-title"
                  className="mt-2 font-serif text-[40px] leading-none text-[#2a2622]"
                >
                  Call Summary
                </h2>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="rounded-full p-2 text-[#6e665c] hover:bg-[rgba(42,38,34,0.05)]"
                aria-label="Close summary"
              >
                <X size={18} strokeWidth={1.6} />
              </button>
            </div>

            <dl className="mt-7 grid grid-cols-1 gap-3 sm:grid-cols-2">
              {FIELDS.map((field) => (
                <div
                  key={field.key}
                  className="border-t border-[rgba(42,38,34,0.08)] pt-3"
                >
                  <dt className="text-[11px] tracking-[0.12em] text-[#8a8176] uppercase">
                    {field.label}
                  </dt>
                  <dd
                    className={`mt-1 text-[16px] ${
                      summary[field.key] === "Not identified"
                        ? "text-[#8a8176]"
                        : "text-[#2a2622]"
                    } ${field.key === "lead" && summary.lead.startsWith("🔥") ? "hot-lead" : ""}`}
                  >
                    {summary[field.key]}
                  </dd>
                </div>
              ))}
            </dl>

            <div className="mt-6 border-t border-[rgba(42,38,34,0.08)] pt-4">
              <p className="text-[11px] tracking-[0.16em] text-[#8c7040]">
                AI SUMMARY
              </p>
              <p className="mt-3 text-[15px] leading-7 text-[#2a2622]">
                {summary.aiSummary}
              </p>
            </div>

            <div className="mt-7 flex flex-col gap-3 sm:flex-row">
              <button type="button" onClick={onClose} className="btn-secondary">
                Close
              </button>
              <button type="button" onClick={onRestart} className="btn-quiet">
                Restart Demo
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
