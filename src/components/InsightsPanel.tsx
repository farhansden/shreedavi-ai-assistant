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
  const rounded = useTransform(
    count,
    (latest) => `${Math.round(latest)} / 100`,
  );

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

function leadLabel(status: ConversationInsights["leadStatus"]) {
  if (status === "HOT") return "🔥 HOT LEAD";
  if (status === "WARM") return "WARM LEAD";
  return "COLD LEAD";
}

export function InsightsPanel({ insights, active }: InsightsPanelProps) {
  const rows = insightRows(insights);

  return (
    <section className="flex flex-col rounded-2xl border border-[#e6dcc8] bg-[#fbf8f2] p-6 shadow-[0_12px_36px_rgba(70,50,20,0.04)]">
      <p className="text-[11px] font-medium tracking-[0.28em] text-[#8a7a62]">
        AI INSIGHTS
      </p>
      <div className="mt-5 grid gap-4">
        {!active && (
          <p className="text-[14px] leading-relaxed text-[#8a7a62]">
            Product interest, occasion, budget and visit preference will appear
            as they are identified.
          </p>
        )}
        <AnimatePresence initial={false}>
          {active &&
            rows.map((row) => (
              <motion.div
                key={row.key}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.35 }}
                className="border-b border-[#efe6d6] pb-3 last:border-b-0 last:pb-0"
              >
                <p className="text-[11px] tracking-[0.16em] text-[#8a7a62]">
                  {row.label}
                </p>
                <p
                  className={`mt-1 text-[15px] text-[#2c261c] ${
                    row.key === "leadStatus" ? "tracking-[0.08em]" : ""
                  }`}
                >
                  {row.key === "leadScore" ? (
                    <LeadScoreValue value={insights.leadScore} />
                  ) : row.key === "leadStatus" ? (
                    <motion.span
                      key={insights.leadStatus}
                      initial={
                        insights.leadStatus === "HOT"
                          ? { opacity: 0.4, scale: 0.96 }
                          : { opacity: 0.7 }
                      }
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ duration: 0.45 }}
                    >
                      {leadLabel(insights.leadStatus)}
                    </motion.span>
                  ) : (
                    <motion.span
                      key={row.value}
                      initial={{ opacity: 0, y: 4 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.28 }}
                    >
                      {row.value}
                    </motion.span>
                  )}
                </p>
              </motion.div>
            ))}
        </AnimatePresence>
      </div>
    </section>
  );
}
