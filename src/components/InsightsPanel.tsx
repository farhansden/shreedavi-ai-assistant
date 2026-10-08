"use client";

import { animate, motion, useMotionValue, useTransform } from "framer-motion";
import { useEffect, useRef } from "react";
import {
  formatLeadStatus,
  insightRows,
  type ConversationInsights,
} from "@/lib/insights";

type InsightsPanelProps = {
  insights: ConversationInsights;
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

export function InsightsPanel({ insights }: InsightsPanelProps) {
  const rows = insightRows(insights).filter(
    (row) => row.key !== "leadScore" && row.key !== "leadStatus",
  );
  const hot = insights.leadStatus === "HOT";

  return (
    <section className="panel p-6 sm:p-7">
      <h2 className="text-[12px] tracking-[0.18em] text-[#8c7040]">AI INSIGHTS</h2>

      <div className="mt-5 flex flex-col gap-4 border-b border-[rgba(42,38,34,0.08)] pb-5 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-[11px] tracking-[0.16em] text-[#8a8176]">LEAD SCORE</p>
          <p className="mt-1 font-serif text-[42px] leading-none text-[#2a2622]">
            <LeadScoreValue value={insights.leadScore} />
            <span className="ml-1 text-[22px] text-[#8a8176]">/ 100</span>
          </p>
        </div>
        <p
          className={`text-[13px] tracking-[0.14em] text-[#8c7040] ${hot ? "hot-lead" : ""}`}
        >
          {formatLeadStatus(insights.leadStatus)}
        </p>
      </div>
      <div className="mt-3 h-1 overflow-hidden rounded-full bg-[rgba(42,38,34,0.08)]">
        <motion.div
          className="h-full rounded-full bg-[#a68448]"
          initial={false}
          animate={{ width: `${insights.leadScore}%` }}
          transition={{ duration: 0.7, ease: "easeOut" }}
        />
      </div>

      <div className="mt-5 grid gap-3 sm:grid-cols-2">
        {rows.map((row) => (
          <div
            key={row.key}
            className="border-t border-[rgba(42,38,34,0.08)] pt-3"
          >
            <p className="text-[11px] tracking-[0.12em] text-[#8a8176] uppercase">
              {row.label}
            </p>
            <p
              key={row.value}
              className={`mt-1 text-[16px] ${
                row.value === "Not identified" ? "text-[#8a8176]" : "text-[#2a2622]"
              }`}
            >
              {row.value}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}
