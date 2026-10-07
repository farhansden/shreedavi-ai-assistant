"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { CallSummaryModal } from "@/components/CallSummaryModal";
import { Header } from "@/components/Header";
import { InsightsPanel } from "@/components/InsightsPanel";
import { TranscriptPanel } from "@/components/TranscriptPanel";
import { VoiceAgent } from "@/components/VoiceAgent";
import { buildCallSummary, displayValue, extractInsights } from "@/lib/insights";
import { formatDuration } from "@/lib/voice-session";
import type {
  CallSummary,
  SessionErrorKind,
  TranscriptMessage,
  VoiceActivity,
  VoiceSessionEvent,
  VoiceSessionStatus,
} from "@/lib/types";

export function AssistantExperience() {
  const [status, setStatus] = useState<VoiceSessionStatus>("idle");
  const [activity, setActivity] = useState<VoiceActivity>("idle");
  const [messages, setMessages] = useState<TranscriptMessage[]>([]);
  const [durationSeconds, setDurationSeconds] = useState(0);
  const [summary, setSummary] = useState<CallSummary | null>(null);
  const [summaryOpen, setSummaryOpen] = useState(false);
  const [errorKind, setErrorKind] = useState<SessionErrorKind | null>(null);

  const insights = useMemo(() => extractInsights(messages), [messages]);

  const onEvent = useCallback((event: VoiceSessionEvent) => {
    switch (event.type) {
      case "reset":
        setStatus("idle");
        setActivity("idle");
        setMessages([]);
        setDurationSeconds(0);
        setSummary(null);
        setSummaryOpen(false);
        setErrorKind(null);
        break;
      case "error":
        setStatus("error");
        setErrorKind(event.kind);
        setActivity("idle");
        break;
      case "status":
        setStatus(event.status);
        if (event.status !== "error") setErrorKind(null);
        break;
      case "activity":
        setActivity(event.activity);
        break;
      case "transcript":
        setMessages((current) => {
          const existing = current.findIndex(
            (item) => item.id === event.message.id,
          );
          if (existing === -1) return [...current, event.message];
          const next = [...current];
          next[existing] = event.message;
          return next;
        });
        break;
      case "duration":
        setDurationSeconds(event.seconds);
        break;
      default:
        break;
    }
  }, []);

  useEffect(() => {
    if (status !== "ended") return;
    setSummary(buildCallSummary(insights));
  }, [status, insights]);

  const started = status === "live" || status === "ended" || messages.length > 0;
  const metrics = useMemo(
    () => [
      { label: "Call Duration", value: formatDuration(durationSeconds) },
      {
        label: "Language",
        value: started ? displayValue(insights.language) : "—",
      },
      {
        label: "Intent",
        value: started ? displayValue(insights.intent) : "—",
      },
      {
        label: "Sentiment",
        value: started ? displayValue(insights.sentiment) : "—",
      },
    ],
    [durationSeconds, insights, started],
  );

  return (
    <div className="min-h-screen bg-[#f6f1e8] text-[#2c261c]">
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.55, ease: "easeOut" }}
      >
        <Header />
        <main className="mx-auto w-full max-w-[1440px] px-6 py-10 md:px-12 md:py-14">
          <div className="max-w-2xl">
            <p className="text-[11px] tracking-[0.28em] text-[#9a7b45]">
              AI SALES ASSISTANT
            </p>
            <h1 className="mt-3 font-serif text-[40px] leading-tight tracking-[-0.02em] text-[#2c261c] md:text-[52px]">
              Your AI Sales Executive
            </h1>
            <p className="mt-4 max-w-xl text-[16px] leading-8 text-[#6a6258]">
              A conversational AI assistant designed to engage customers,
              understand their requirements and help convert enquiries into
              showroom visits.
            </p>
          </div>

          <div className="mt-12 grid gap-6 xl:grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)]">
            <VoiceAgent
              status={status}
              activity={activity}
              durationSeconds={durationSeconds}
              errorKind={errorKind}
              onEvent={onEvent}
            />
            <div className="grid gap-6">
              <TranscriptPanel messages={messages} started={started} />
              <InsightsPanel insights={insights} active={started} />
            </div>
          </div>

          <section className="mt-8 flex flex-col gap-6 rounded-2xl border border-[#e6dcc8] bg-[#fbf8f2] px-6 py-6 shadow-[0_12px_36px_rgba(70,50,20,0.04)] md:flex-row md:items-center md:justify-between md:px-8">
            <div className="grid flex-1 grid-cols-2 gap-6 md:grid-cols-4">
              {metrics.map((metric) => (
                <div key={metric.label}>
                  <p className="text-[11px] tracking-[0.16em] text-[#8a7a62]">
                    {metric.label}
                  </p>
                  <p className="mt-1 text-[15px] text-[#2c261c]">
                    {metric.value}
                  </p>
                </div>
              ))}
            </div>
            <motion.button
              type="button"
              whileHover={{ y: -1 }}
              disabled={!summary}
              onClick={() => setSummaryOpen(true)}
              className="h-11 shrink-0 rounded-full border border-[#d9cbb0] bg-white px-6 text-[13px] tracking-[0.08em] text-[#2c261c] disabled:cursor-not-allowed disabled:opacity-40"
            >
              View Call Summary
            </motion.button>
          </section>
        </main>
      </motion.div>
      <CallSummaryModal
        open={summaryOpen}
        summary={summary}
        onClose={() => setSummaryOpen(false)}
      />
    </div>
  );
}
