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
} from "react";
import { ConversationProvider, useConversation } from "@elevenlabs/react";
import { AiAvatar } from "@/components/AiAvatar";
import { Waveform } from "@/components/Waveform";
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
    onEventRef.current = onEvent;

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

    const kicker = error
      ? errorKind === "microphone"
        ? "MICROPHONE NEEDED"
        : errorKind === "interrupted"
          ? "CONNECTION INTERRUPTED"
          : "UNABLE TO CONNECT"
      : connecting
        ? "CONNECTING"
        : live
          ? "LIVE CONVERSATION"
          : ended
            ? "CALL COMPLETED"
            : "READY TO TALK";

    const presence = connecting
      ? "Connecting..."
      : live
        ? activity === "speaking"
          ? "Speaking..."
          : activity === "listening"
            ? "Listening..."
            : "Connected"
        : null;

    return (
      <section className="panel px-6 py-7 sm:px-7">
        <p className="text-center text-[11px] tracking-[0.2em] text-[#8c7040]">
          {idle ? "AI SALES EXECUTIVE" : kicker}
        </p>
        <div className="mt-5">
          <AiAvatar status={status} activity={live ? activity : "idle"} />
        </div>
        <div className="mt-2 text-center">
          <h1 className="font-serif text-[52px] leading-none text-[#2a2622]">Maya</h1>
          <p className="mt-2 text-[13px] tracking-[0.08em] text-[#6e665c]">
            AI Sales Executive
          </p>
          {idle ? (
            <p className="mt-3 text-[11px] tracking-[0.18em] text-[#8c7040]">
              READY TO TALK
            </p>
          ) : null}
        </div>

        {idle && (
          <div className="mt-6 text-center">
            <p className="mx-auto max-w-[280px] text-[14px] leading-6 text-[#5c564e]">
              Conversational AI for customer outreach, lead qualification and
              showroom appointments.
            </p>
            <button
              type="button"
              onClick={startConversation}
              className="btn-primary mt-6 min-h-[64px] px-8 text-[16px]"
            >
              🎙 Talk to AI
            </button>
            <p className="mx-auto mt-4 max-w-[260px] text-[13px] leading-6 text-[#6e665c]">
              Speak naturally with the Shreedavi AI Sales Assistant.
            </p>
          </div>
        )}

        {(connecting || live || ended) && (
          <div className="mt-6 text-center">
            <p className="text-[11px] tracking-[0.16em] text-[#8a8176]">
              CALL DURATION
            </p>
            <p className="mt-1 font-serif text-[48px] tabular-nums leading-none text-[#2a2622]">
              {formatDuration(durationSeconds)}
            </p>
            <div className="mt-4">
              <Waveform
                activity={live ? activity : "idle"}
                active={live}
                readFrequency={readFrequency}
              />
            </div>
            {presence ? (
              <p className="mt-2 text-[13px] text-[#8c7040]" aria-live="polite">
                {presence}
              </p>
            ) : null}
          </div>
        )}

        {ended && (
          <p className="mx-auto mt-4 max-w-[260px] text-center text-[14px] leading-6 text-[#5c564e]">
            Conversation completed successfully.
          </p>
        )}

        {error && (
          <div className="mx-auto mt-6 max-w-[280px] text-center">
            <p className="text-[14px] leading-6 text-[#5c564e]">
              {errorKind === "microphone"
                ? "Microphone access is required to speak with the AI assistant."
                : errorKind === "interrupted"
                  ? "Connection interrupted."
                  : "Unable to connect to the AI assistant. Please try again."}
            </p>
            <button
              type="button"
              onClick={startConversation}
              className="btn-primary mt-5"
            >
              {errorKind === "microphone"
                ? "Enable Microphone"
                : errorKind === "interrupted"
                  ? "Reconnect"
                  : "Try Again"}
            </button>
          </div>
        )}

        <div className="mt-6 flex flex-col items-center gap-3">
          {(live || connecting) && (
            <button type="button" onClick={endConversation} className="btn-secondary">
              End Conversation
            </button>
          )}
          {ended && (
            <button
              type="button"
              onClick={onViewSummary}
              className="btn-primary uppercase tracking-[0.14em]"
            >
              View Call Summary
            </button>
          )}
          {!idle && (
            <button type="button" onClick={restart} className="btn-quiet">
              Restart Demo
            </button>
          )}
        </div>

        {showMeta && (
          <dl className="mt-7 grid grid-cols-2 gap-x-4 gap-y-4 border-t border-[rgba(42,38,34,0.08)] pt-5">
            <MetaItem
              label="Call status"
              value={live ? "Connected" : "Completed"}
              marked={live}
            />
            <MetaItem label="Duration" value={formatDuration(durationSeconds)} />
            <MetaItem label="Language" value={language} />
            <MetaItem label="Intent" value={intent} />
            <MetaItem label="Sentiment" value={sentiment} />
          </dl>
        )}
      </section>
    );
  },
);

function MetaItem({
  label,
  value,
  marked = false,
}: {
  label: string;
  value: string;
  marked?: boolean;
}) {
  return (
    <div>
      <dt className="text-[10px] tracking-[0.16em] text-[#8a8176] uppercase">
        {label}
      </dt>
      <dd className="mt-1 flex items-center gap-1.5 text-[14px] text-[#2a2622]">
        {marked ? <span className="status-dot text-[#3f6b52]" data-pulse="true" /> : null}
        {value}
      </dd>
    </div>
  );
}
