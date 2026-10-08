"use client";

/**
 * Single conversational session for the sales assistant.
 * Start and end stay on this client so the page never opens a second microphone.
 */

import {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from "react";
import { motion } from "framer-motion";
import { Phone, PhoneOff } from "lucide-react";
import { ConversationProvider, useConversation, useRawConversation } from "@elevenlabs/react";
import { AiAvatar } from "@/components/AiAvatar";
import { Waveform } from "@/components/Waveform";
import {
  hasPlaybackStream,
  releaseRecording,
  startCallRecorder,
  type CallRecording,
} from "@/lib/call-recording";
import { formatDuration, getVoiceAgentId } from "@/lib/voice-session";
import type {
  SessionErrorKind,
  VoiceActivity,
  VoiceSessionEvent,
  VoiceSessionStatus,
} from "@/lib/types";

export type VoiceAgentHandle = {
  restart: () => void;
};

type VoiceAgentProps = {
  status: VoiceSessionStatus;
  activity: VoiceActivity;
  durationSeconds: number;
  errorKind: SessionErrorKind | null;
  language: string;
  intent: string;
  sentiment: string;
  recording: CallRecording | null;
  onRecording: (recording: CallRecording | null) => void;
  onEvent: (event: VoiceSessionEvent) => void;
  onViewSummary: () => void;
};

export const VoiceAgent = forwardRef<VoiceAgentHandle, VoiceAgentProps>(
  function VoiceAgent(props, ref) {
    return (
      <ConversationProvider>
        <VoiceAgentSession {...props} ref={ref} />
      </ConversationProvider>
    );
  },
);

const VoiceAgentSession = forwardRef<VoiceAgentHandle, VoiceAgentProps>(
  function VoiceAgentSession(
    {
      status,
      activity,
      durationSeconds,
      errorKind,
      language,
      intent,
      sentiment,
      recording,
      onRecording,
      onEvent,
      onViewSummary,
    },
    ref,
  ) {
    const endedByUserRef = useRef(false);
    const wasLiveRef = useRef(false);
    const reportedErrorRef = useRef<SessionErrorKind | null>(null);
    const suppressDisconnectRef = useRef(0);
    const secondsRef = useRef(0);
    const timerRef = useRef<number | null>(null);
    const agentDraftRef = useRef<Record<string, string>>({});
    const activeAgentIdRef = useRef<string | null>(null);
    const mountedRef = useRef(true);
    const onEventRef = useRef(onEvent);
    const onRecordingRef = useRef(onRecording);
    const recordingEpochRef = useRef(0);
    onEventRef.current = onEvent;
    onRecordingRef.current = onRecording;
    const rawConversation = useRawConversation();
    const [captureState, setCaptureState] = useState<"open" | "saving" | "ready" | "missing">("open");

    const emit = useCallback((event: VoiceSessionEvent) => {
      if (!mountedRef.current) return;
      onEventRef.current(event);
    }, []);

    const clearDrafts = () => {
      agentDraftRef.current = {};
      activeAgentIdRef.current = null;
    };

    const stopTimer = () => {
      if (timerRef.current !== null) {
        window.clearInterval(timerRef.current);
        timerRef.current = null;
      }
    };

    const {
      startSession,
      endSession,
      status: sessionStatus,
      getInputByteFrequencyData,
      getOutputByteFrequencyData,
    } = useConversation({
      micMuted: false,
      onConnect: () => {
        secondsRef.current = 0;
        wasLiveRef.current = true;
        emit({ type: "duration", seconds: 0 });
        emit({ type: "status", status: "live" });
        emit({ type: "activity", activity: "listening" });
      },
      onDisconnect: (details) => {
        if (suppressDisconnectRef.current > 0) {
          suppressDisconnectRef.current -= 1;
          endedByUserRef.current = false;
          return;
        }
        if (reportedErrorRef.current) {
          const kind = reportedErrorRef.current;
          reportedErrorRef.current = null;
          wasLiveRef.current = false;
          emit({ type: "error", kind });
          emit({ type: "activity", activity: "idle" });
          return;
        }
        const interrupted = wasLiveRef.current;
        wasLiveRef.current = false;
        const intentional =
          endedByUserRef.current ||
          details.reason === "user" ||
          details.reason === "agent";
        if (intentional) {
          emit({ type: "status", status: "ended" });
          emit({ type: "activity", activity: "idle" });
          return;
        }
        emit({
          type: "error",
          kind: interrupted ? "interrupted" : "connection",
        });
        emit({ type: "activity", activity: "idle" });
      },
      onError: (message) => {
        if (endedByUserRef.current || suppressDisconnectRef.current > 0) return;
        const text = typeof message === "string" ? message : "";
        const microphoneDenied =
          /microphone|permission|notallowed|denied|getUserMedia/i.test(text);
        const kind: SessionErrorKind = microphoneDenied
          ? "microphone"
          : wasLiveRef.current
            ? "interrupted"
            : "connection";
        reportedErrorRef.current = kind;
        emit({ type: "error", kind });
        emit({ type: "activity", activity: "idle" });
        if (!microphoneDenied) wasLiveRef.current = false;
      },
      onMessage: (payload) => {
        const text = payload.message?.trim();
        if (!text) return;
        const isAgent = payload.role === "agent" || payload.source === "ai";
        if (!isAgent) {
          activeAgentIdRef.current = null;
          emit({
            type: "transcript",
            message: {
              id: `customer-${payload.event_id}`,
              speaker: "customer",
              text,
            },
          });
          return;
        }
        const streamedId = activeAgentIdRef.current;
        const responseId = payload.response_id ? `ai-${payload.response_id}` : null;
        const id =
          streamedId && agentDraftRef.current[streamedId] !== undefined
            ? streamedId
            : (responseId ?? streamedId ?? `ai-${payload.event_id}`);
        activeAgentIdRef.current = id;
        emit({
          type: "transcript",
          message: { id, speaker: "ai", text },
        });
      },
      onAgentChatResponsePart: (part) => {
        if (part.type === "start" || !activeAgentIdRef.current) {
          activeAgentIdRef.current = part.response_id
            ? `ai-${part.response_id}`
            : `ai-${part.event_id}`;
          agentDraftRef.current[activeAgentIdRef.current] = "";
        }
        const id = activeAgentIdRef.current;
        if (!id) return;
        if (part.type === "start") {
          agentDraftRef.current[id] = part.text ?? "";
        } else if (part.type === "delta") {
          agentDraftRef.current[id] = `${agentDraftRef.current[id] ?? ""}${part.text ?? ""}`;
        }
        const text = agentDraftRef.current[id]?.trim();
        if (!text) return;
        emit({
          type: "transcript",
          message: { id, speaker: "ai", text },
        });
      },
      onAgentResponseCorrection: (event) => {
        const text = event.corrected_agent_response?.trim();
        if (!text) return;
        const id = event.response_id
          ? `ai-${event.response_id}`
          : (activeAgentIdRef.current ?? `ai-${event.event_id}`);
        activeAgentIdRef.current = id;
        emit({
          type: "transcript",
          message: { id, speaker: "ai", text },
        });
      },
      onModeChange: ({ mode }) => {
        emit({
          type: "activity",
          activity: mode === "speaking" ? "speaking" : "listening",
        });
      },
    });

    useEffect(() => {
      mountedRef.current = true;
      return () => {
        mountedRef.current = false;
      };
    }, []);

    useEffect(() => {
      if (sessionStatus !== "connecting") return;
      if (status === "live" || status === "ended") return;
      emit({ type: "status", status: "connecting" });
    }, [emit, sessionStatus, status]);

    useEffect(() => {
      if (status !== "live") {
        stopTimer();
        return;
      }
      timerRef.current = window.setInterval(() => {
        secondsRef.current += 1;
        emit({ type: "duration", seconds: secondsRef.current });
      }, 1000);
      return stopTimer;
    }, [emit, status]);

    useEffect(() => {
      if (status !== "live" || !rawConversation) return;
      setCaptureState("open");
      let handle: ReturnType<typeof startCallRecorder> = null;
      let cancelled = false;
      const startedAt = Date.now();
      const begin = () => {
        if (cancelled || handle) return;
        try {
          handle = startCallRecorder(rawConversation);
        } catch {
          handle = null;
        }
      };
      if (hasPlaybackStream(rawConversation)) begin();
      const retry = window.setInterval(() => {
        if (cancelled || handle) return;
        if (hasPlaybackStream(rawConversation) || Date.now() - startedAt > 1500) begin();
      }, 200);
      const stopRetry = window.setTimeout(() => window.clearInterval(retry), 2400);
      const epoch = recordingEpochRef.current;
      return () => {
        cancelled = true;
        window.clearInterval(retry);
        window.clearTimeout(stopRetry);
        if (!handle) {
          if (epoch === recordingEpochRef.current && mountedRef.current) {
            setCaptureState("missing");
            onRecordingRef.current(null);
          }
          return;
        }
        if (mountedRef.current) setCaptureState("saving");
        void handle.stop().then((next) => {
          if (epoch !== recordingEpochRef.current || !mountedRef.current) {
            releaseRecording(next);
            return;
          }
          setCaptureState(next ? "ready" : "missing");
          onRecordingRef.current(next);
        });
      };
    }, [rawConversation, status]);

    const readFrequency = useCallback(() => {
      try {
        return activity === "speaking"
          ? getOutputByteFrequencyData()
          : getInputByteFrequencyData();
      } catch {
        return null;
      }
    }, [activity, getInputByteFrequencyData, getOutputByteFrequencyData]);

    const startConversation = useCallback(() => {
      if (status === "connecting" || status === "live") return;

      endedByUserRef.current = false;
      wasLiveRef.current = false;
      reportedErrorRef.current = null;
      suppressDisconnectRef.current = 0;
      recordingEpochRef.current += 1;
      secondsRef.current = 0;
      stopTimer();
      clearDrafts();
      emit({ type: "reset" });
      emit({ type: "status", status: "connecting" });
      emit({ type: "duration", seconds: 0 });

      const agentId = getVoiceAgentId();
      if (!agentId) {
        emit({ type: "error", kind: "connection" });
        return;
      }

      endSession();
      startSession({
        agentId,
        connectionType: "websocket",
      });
    }, [emit, endSession, startSession, status]);

    const endConversation = useCallback(() => {
      endedByUserRef.current = true;
      wasLiveRef.current = false;
      stopTimer();
      endSession();
      emit({ type: "status", status: "ended" });
      emit({ type: "activity", activity: "idle" });
    }, [emit, endSession]);

    const restart = useCallback(() => {
      const expectsDisconnect =
        sessionStatus === "connected" || sessionStatus === "connecting";
      if (expectsDisconnect) {
        suppressDisconnectRef.current += 1;
        endedByUserRef.current = true;
      } else {
        endedByUserRef.current = false;
      }
      wasLiveRef.current = false;
      reportedErrorRef.current = null;
      recordingEpochRef.current += 1;
      secondsRef.current = 0;
      stopTimer();
      clearDrafts();
      endSession();
      emit({ type: "reset" });
    }, [emit, endSession, sessionStatus]);

    useImperativeHandle(ref, () => ({ restart }), [restart]);

    const live = status === "live";
    const connecting = status === "connecting";
    const idle = status === "idle";
    const ended = status === "ended";
    const error = status === "error";
    const showMeta = live || ended;

    const statusLabel = error
      ? "Can't connect"
      : connecting
        ? "Ringing Maya"
        : live
          ? activity === "speaking"
            ? "Maya is speaking"
            : "Listening to you"
          : ended
            ? "Call ended"
            : "Ready to call";

    return (
      <section className="handset">
        <div className="handset-screen px-6 pb-6 pt-5">
          <div className="mx-auto h-1.5 w-16 rounded-full bg-white/15" />
          <div className="mt-5 flex items-center justify-between text-[12px] text-[#b7aa9a]">
            <span>Shreedavi voice</span>
            <span className="rounded-full border border-[rgba(224,196,138,0.28)] px-2 py-0.5 text-[10px] text-[#e0c48a]">
              {live ? "Recording" : "HD voice"}
            </span>
          </div>

          <div className="flex flex-1 flex-col items-center justify-center text-center">
            <AiAvatar status={status} activity={live ? activity : "idle"} />
            <p className="font-serif text-[40px] leading-none text-[#f6efe4]">Maya</p>
            <p className="mt-2 text-[13px] text-[#b7aa9a]">Sales caller · Shreedavi Jewellers</p>

            {live || ended ? (
              <p className="mt-5 font-serif text-[42px] tabular-nums leading-none text-[#f6efe4]">
                {formatDuration(durationSeconds)}
              </p>
            ) : (
              <p className="mt-4 max-w-[240px] text-[14px] leading-6 text-[#cbbfae]">
                {idle
                  ? "Place a call and speak the way you would to a salesperson on the floor."
                  : error
                    ? errorKind === "microphone"
                      ? "Microphone access is required to speak with the AI assistant."
                      : errorKind === "interrupted"
                        ? "Connection interrupted."
                        : "Unable to connect to the AI assistant. Please try again."
                    : "Connecting the line."}
              </p>
            )}

            <div className="mt-4 h-14">
              <Waveform
                activity={live ? activity : "idle"}
                active={live}
                readFrequency={readFrequency}
              />
            </div>
            <p className="text-[13px] text-[#e0c48a]" aria-live="polite">
              {statusLabel}
            </p>
          </div>

          <div className="flex flex-col items-center gap-3 pb-2">
            {live || connecting ? (
              <div className="flex flex-col items-center gap-2">
                <motion.button
                  type="button"
                  onClick={endConversation}
                  whileTap={{ scale: 0.96 }}
                  className="end-orb"
                  aria-label="End conversation"
                >
                  <PhoneOff size={26} strokeWidth={1.8} />
                </motion.button>
                <span className="text-[12px] text-[#b7aa9a]">End</span>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-2">
                <motion.button
                  type="button"
                  onClick={startConversation}
                  whileTap={{ scale: 0.96 }}
                  className="call-orb"
                  aria-label={ended || error ? "Call again" : "Talk to AI"}
                >
                  <Phone size={26} strokeWidth={1.8} />
                </motion.button>
                <span className="text-[12px] text-[#b7aa9a]">
                  {error
                    ? errorKind === "microphone"
                      ? "Enable microphone"
                      : errorKind === "interrupted"
                        ? "Reconnect"
                        : "Try again"
                    : ended
                      ? "Call again"
                      : "Talk to AI"}
                </span>
              </div>
            )}

            {ended && (
              <div className="mt-2 flex w-full flex-col items-center gap-2">
                <button
                  type="button"
                  onClick={onViewSummary}
                  className="download-link"
                >
                  View call summary
                </button>
                {recording ? (
                  <a className="download-link" href={recording.url} download={recording.filename}>
                    Download recording
                  </a>
                ) : (
                  <p className="text-[12px] text-[#9c8e7c]">
                    {captureState === "missing"
                      ? "This call could not be saved."
                      : "Saving the recording…"}
                  </p>
                )}
              </div>
            )}

            {!idle && (
              <button
                type="button"
                onClick={restart}
                className="text-[12px] tracking-[0.08em] text-[#9c8e7c]"
              >
                Restart demo
              </button>
            )}

            {showMeta && (
              <dl className="mt-2 grid w-full grid-cols-2 gap-x-3 gap-y-2 border-t border-[rgba(224,196,138,0.14)] pt-3 text-left">
                <MetaItem label="Language" value={language} />
                <MetaItem label="Intent" value={intent} />
                <MetaItem label="Sentiment" value={sentiment} />
              </dl>
            )}
            <div className="mx-auto mt-2 h-1 w-24 rounded-full bg-white/15" />
          </div>
        </div>
      </section>
    );
  },
);

function MetaItem({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-[10px] tracking-[0.14em] text-[#9c8e7c] uppercase">{label}</dt>
      <dd className="mt-0.5 text-[13px] text-[#f6efe4]">{value}</dd>
    </div>
  );
}
