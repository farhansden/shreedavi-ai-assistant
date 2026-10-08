"use client";

import { useCallback, useMemo, useRef, useState } from "react";
import { CallSummaryModal } from "@/components/CallSummaryModal";
import { Header } from "@/components/Header";
import { InsightsPanel } from "@/components/InsightsPanel";
import { TranscriptPanel } from "@/components/TranscriptPanel";
import { VoiceAgent, type VoiceAgentHandle } from "@/components/VoiceAgent";
import { buildCallSummary, displayValue, extractInsights } from "@/lib/insights";
import { formatClock, formatDuration } from "@/lib/voice-session";
import type {
  SessionErrorKind,
  TranscriptMessage,
  VoiceActivity,
  VoiceSessionEvent,
  VoiceSessionStatus,
} from "@/lib/types";

export function AssistantExperience() {
  const voiceRef = useRef<VoiceAgentHandle>(null);
  const [status, setStatus] = useState<VoiceSessionStatus>("idle");
  const [activity, setActivity] = useState<VoiceActivity>("idle");
  const [messages, setMessages] = useState<TranscriptMessage[]>([]);
  const [durationSeconds, setDurationSeconds] = useState(0);
  const [summaryOpen, setSummaryOpen] = useState(false);
  const [errorKind, setErrorKind] = useState<SessionErrorKind | null>(null);

  const insights = useMemo(() => extractInsights(messages), [messages]);
  const summary = useMemo(() => {
    if (status !== "ended") return null;
    return buildCallSummary(insights, formatDuration(durationSeconds));
  }, [durationSeconds, insights, status]);

  const onEvent = useCallback((event: VoiceSessionEvent) => {
    switch (event.type) {
      case "reset":
        setStatus("idle");
        setActivity("idle");
        setMessages([]);
        setDurationSeconds(0);
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
          const existing = current.findIndex((item) => item.id === event.message.id);
          if (existing === -1) {
            return [
              ...current,
              { ...event.message, timestamp: formatClock() },
            ];
          }
          if (current[existing].text === event.message.text) return current;
          const next = [...current];
          next[existing] = {
            ...event.message,
            timestamp: current[existing].timestamp ?? formatClock(),
          };
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

  const restart = useCallback(() => {
    voiceRef.current?.restart();
  }, []);

  return (
    <div className="min-h-screen text-[#2a2622]">
      <Header status={status} />
      <main className="mx-auto grid w-full max-w-[1180px] items-start gap-6 px-5 py-6 lg:grid-cols-[minmax(300px,390px)_minmax(0,1fr)] lg:px-8 lg:py-8">
        <div>
          <VoiceAgent
            ref={voiceRef}
            status={status}
            activity={activity}
            durationSeconds={durationSeconds}
            errorKind={errorKind}
            language={displayValue(insights.language)}
            intent={displayValue(insights.intent)}
            sentiment={displayValue(insights.sentiment)}
            onEvent={onEvent}
            onViewSummary={() => setSummaryOpen(true)}
          />
        </div>
        <div className="grid min-w-0 gap-6">
          <TranscriptPanel
            messages={messages}
            active={status === "live" || status === "connecting"}
          />
          <InsightsPanel insights={insights} />
        </div>
      </main>
      <div className="mx-auto w-full max-w-[1180px] px-5 pb-10 lg:px-8">
        <section
          aria-disabled="true"
          className="border border-dashed border-[rgba(42,38,34,0.16)] px-5 py-4 text-[#8a8176]"
        >
          <p className="text-[11px] tracking-[0.16em]">CALL RECORDING</p>
          <p className="mt-1 text-[13px] leading-6">
            Available when phone telephony is connected.
          </p>
        </section>
      </div>
      <CallSummaryModal
        open={summaryOpen}
        summary={summary}
        onClose={() => setSummaryOpen(false)}
        onRestart={restart}
      />
    </div>
  );
}
