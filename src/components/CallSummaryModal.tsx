"use client";

import { useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { X } from "lucide-react";
import type { CallRecording } from "@/lib/call-recording";
import type { CallSummary } from "@/lib/types";

type CallSummaryModalProps = {
  open: boolean;
  summary: CallSummary | null;
  recording: CallRecording | null;
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
  recording,
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
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/65 px-4 py-6"
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
            className="desk-panel max-h-[90vh] w-full max-w-[680px] overflow-y-auto p-7 sm:p-8"
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

            <dl className="mt-7 grid grid-cols-1 gap-3 sm:grid-cols-2">
              {FIELDS.map((field) => (
                <div
                  key={field.key}
                  className="rounded-xl border border-[rgba(224,196,138,0.12)] bg-black/20 px-3 py-2.5"
                >
                  <dt className="text-[11px] text-[#9c8e7c]">{field.label}</dt>
                  <dd
                    className={`mt-1 text-[15px] text-[#f6efe4] ${
                      field.key === "lead" && summary.lead.startsWith("🔥") ? "hot-lead" : ""
                    }`}
                  >
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

            <div className="mt-5">
              {recording ? (
                <div className="flex flex-col gap-3">
                  <audio controls src={recording.url} className="w-full" />
                  <a className="download-link" href={recording.url} download={recording.filename}>
                    Download recording
                  </a>
                </div>
              ) : (
                <p className="text-[13px] text-[#9c8e7c]">
                  The recording is saved when the call ends.
                </p>
              )}
            </div>

            <div className="mt-6 flex flex-col gap-3 sm:flex-row">
              <button
                type="button"
                onClick={onClose}
                className="rounded-full border border-[rgba(224,196,138,0.28)] px-4 py-2.5 text-[13px] text-[#f6efe4]"
              >
                Close
              </button>
              <button
                type="button"
                onClick={onRestart}
                className="rounded-full px-4 py-2.5 text-[13px] text-[#cbbfae]"
              >
                Restart demo
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
