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
    <div className="min-h-screen text-[#f4eee6]">
      <Header status={status} />
      <motion.main
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, ease: "easeOut" }}
        className="mx-auto grid w-full max-w-[1240px] items-start gap-5 px-4 py-5 lg:grid-cols-[400px_minmax(0,1fr)] lg:px-6 lg:py-6"
      >
        <VoiceAgent
          status={status}
          activity={activity}
          durationSeconds={durationSeconds}
          errorKind={errorKind}
          onEvent={onEvent}
        />
        <div className="grid gap-5">
          <section className="desk-panel flex flex-col gap-4 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="grid flex-1 grid-cols-2 gap-x-6 gap-y-3 sm:grid-cols-4">
              {metrics.map((metric) => (
                <div key={metric.label}>
                  <p className="text-[11px] text-[#9c8e7c]">{metric.label}</p>
                  <p className="mt-0.5 text-[15px] text-[#f6efe4]">{metric.value}</p>
                </div>
              ))}
            </div>
            <button
              type="button"
              disabled={!summary}
              onClick={() => setSummaryOpen(true)}
              className="h-10 shrink-0 rounded-full border border-[rgba(224,196,138,0.35)] px-4 text-[13px] text-[#f6efe4] disabled:cursor-not-allowed disabled:opacity-35"
            >
              Call summary
            </button>
          </section>
          <TranscriptPanel messages={messages} started={started} />
          <InsightsPanel insights={insights} active={started} />
        </div>
      </motion.main>
      <CallSummaryModal
        open={summaryOpen}
        summary={summary}
        onClose={() => setSummaryOpen(false)}
      />
    </div>
  );
}
