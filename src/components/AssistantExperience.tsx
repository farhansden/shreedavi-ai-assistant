"use client";

import { useCallback, useMemo, useRef, useState } from "react";
import { CallSummaryModal } from "@/components/CallSummaryModal";
import { Header } from "@/components/Header";
import { InsightsPanel } from "@/components/InsightsPanel";
import { TranscriptPanel } from "@/components/TranscriptPanel";
import { VoiceAgent, type VoiceAgentHandle } from "@/components/VoiceAgent";
import { releaseRecording, type CallRecording } from "@/lib/call-recording";
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
  const [recording, setRecording] = useState<CallRecording | null>(null);
  const [recordingSettled, setRecordingSettled] = useState(false);

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
        setRecording((current) => {
          releaseRecording(current);
          return null;
        });
        setRecordingSettled(false);
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

  const onRecording = useCallback((next: CallRecording | null) => {
    setRecording((current) => {
      if (current && current.url !== next?.url) releaseRecording(current);
      return next;
    });
    setRecordingSettled(true);
  }, []);

  return (
    <div className="min-h-screen text-[#f4eee6]">
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
            recording={recording}
            onRecording={onRecording}
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
          <section className="desk-panel p-5">
            <h2 className="text-[15px] text-[#f6efe4]">Call recording</h2>
            {recording ? (
              <div className="mt-4 flex flex-col gap-3">
                <audio controls src={recording.url} className="w-full" />
                <a className="download-link w-fit" href={recording.url} download={recording.filename}>
                  Download recording
                </a>
              </div>
            ) : (
              <p className="mt-3 text-[14px] leading-6 text-[#9c8e7c]">
                {status === "live" || status === "connecting"
                  ? "This call is being recorded. The file is ready to download when you end it."
                  : status === "ended" && recordingSettled
                    ? "This call could not be saved."
                    : status === "ended"
                      ? "Saving the recording…"
                      : "End a call to download the conversation."}
              </p>
            )}
          </section>
        </div>
      </main>
      <CallSummaryModal
        open={summaryOpen}
        summary={summary}
        recording={recording}
        onClose={() => setSummaryOpen(false)}
        onRestart={restart}
      />
    </div>
  );
}
