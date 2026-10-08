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
    <section className="desk-panel p-5">
      <div className="flex items-baseline justify-between gap-4">
        <h2 className="text-[15px] text-[#f6efe4]">Call notes</h2>
        <p className={`text-[13px] ${hot ? "hot-lead text-[#f0a070]" : "text-[#e0c48a]"}`}>
          {formatLeadStatus(insights.leadStatus)}
        </p>
      </div>

      <div className="mt-4">
        <p className="text-[11px] text-[#9c8e7c]">Lead score</p>
        <p className="mt-1 text-[15px] text-[#f6efe4]">
          <LeadScoreValue value={insights.leadScore} />
          <span className="text-[#9c8e7c]"> / 100</span>
        </p>
        <div className="mt-2 h-1 overflow-hidden rounded-full bg-white/10">
          <motion.div
            className="h-full rounded-full bg-[#e0c48a]"
            initial={false}
            animate={{ width: `${insights.leadScore}%` }}
            transition={{ duration: 0.7, ease: "easeOut" }}
          />
        </div>
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        {rows.map((row) => (
          <div
            key={row.key}
            className="rounded-xl border border-[rgba(224,196,138,0.12)] bg-black/20 px-3 py-2.5"
          >
            <p className="text-[11px] text-[#9c8e7c]">{row.label}</p>
            <p
              className={`mt-1 text-[15px] ${
                row.value === "Not identified" ? "text-[#9c8e7c]" : "text-[#f6efe4]"
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
