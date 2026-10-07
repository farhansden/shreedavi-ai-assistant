"use client";

import { AnimatePresence, motion, useMotionValue, useTransform, animate } from "framer-motion";
import { useEffect, useRef } from "react";
import type { ConversationInsights } from "@/lib/insights";
import { insightRows } from "@/lib/insights";

type InsightsPanelProps = {
  insights: ConversationInsights;
  active: boolean;
};

function LeadScoreValue({ value }: { value: number }) {
  const previous = useRef(0);
  const count = useMotionValue(previous.current);
  const rounded = useTransform(count, (latest) => `${Math.round(latest)}`);

  useEffect(() => {
    const controls = animate(count, value, {
      duration: 0.8,
      ease: "easeOut",
    });
    previous.current = value;
    return () => controls.stop();
  }, [count, value]);

  return <motion.span>{rounded}</motion.span>;
}

function leadTone(status: ConversationInsights["leadStatus"]) {
  if (status === "HOT") return "text-[#f0a070]";
  if (status === "WARM") return "text-[#e0c48a]";
  return "text-[#9ec4d4]";
}

export function InsightsPanel({ insights, active }: InsightsPanelProps) {
  const rows = insightRows(insights);

  return (
    <section className="desk-panel p-5">
      <div className="flex items-baseline justify-between">
        <h2 className="text-[15px] text-[#f6efe4]">Call notes</h2>
        <p className="text-[12px] text-[#9c8e7c]">Captured on the line</p>
      </div>

      {!active ? (
        <p className="mt-4 text-[14px] leading-6 text-[#9c8e7c]">
          Product, budget, occasion and visit preference show up here as Maya hears them.
        </p>
      ) : (
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <AnimatePresence initial={false}>
            {rows.map((row) => (
              <motion.div
                key={row.key}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
                className="rounded-xl border border-[rgba(224,196,138,0.12)] bg-black/20 px-3 py-2.5"
              >
                <p className="text-[11px] text-[#9c8e7c]">{row.label}</p>
                {row.key === "leadScore" ? (
                  <div className="mt-1.5">
                    <p className="text-[15px] text-[#f6efe4]">
                      <LeadScoreValue value={insights.leadScore} />
                      <span className="text-[#9c8e7c]"> / 100</span>
                    </p>
                    <div className="mt-2 h-1 overflow-hidden rounded-full bg-white/10">
                      <motion.div
                        className="h-full rounded-full bg-[#e0c48a]"
                        initial={{ width: 0 }}
                        animate={{ width: `${insights.leadScore}%` }}
                        transition={{ duration: 0.7, ease: "easeOut" }}
                      />
                    </div>
                  </div>
                ) : row.key === "leadStatus" ? (
                  <p className={`mt-1 text-[15px] ${leadTone(insights.leadStatus)}`}>
                    {insights.leadStatus === "HOT"
                      ? "Hot lead"
                      : insights.leadStatus === "WARM"
                        ? "Warm lead"
                        : "Cold lead"}
                  </p>
                ) : (
                  <motion.p
                    key={row.value}
                    initial={{ opacity: 0, y: 3 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mt-1 text-[15px] text-[#f6efe4]"
                  >
                    {row.value}
                  </motion.p>
                )}
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}
    </section>
  );
}
