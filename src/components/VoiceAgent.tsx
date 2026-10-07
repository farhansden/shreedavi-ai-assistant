"use client";

/**
 * VoiceAgent is the only integration point for the live conversational session.
 * The session client is launched from here; the rest of the product UI stays branded.
 */

import { useCallback, useEffect, useRef } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Phone, PhoneOff } from "lucide-react";
import {
  ConversationProvider,
  useConversation,
} from "@elevenlabs/react";
import { AiAvatar } from "@/components/AiAvatar";
import { Waveform } from "@/components/Waveform";
import { formatDuration, getVoiceAgentId } from "@/lib/voice-session";
import type {
  SessionErrorKind,
  VoiceActivity,
  VoiceSessionEvent,
  VoiceSessionStatus,
} from "@/lib/types";

type VoiceAgentProps = {
  status: VoiceSessionStatus;
  activity: VoiceActivity;
  durationSeconds: number;
  errorKind: SessionErrorKind | null;
  onEvent: (event: VoiceSessionEvent) => void;
};

export function VoiceAgent(props: VoiceAgentProps) {
  return (
    <ConversationProvider>
      <VoiceAgentSession {...props} />
    </ConversationProvider>
  );
}

function VoiceAgentSession({
  status,
  activity,
  durationSeconds,
  errorKind,
  onEvent,
}: VoiceAgentProps) {
  const endedByUserRef = useRef(false);
  const secondsRef = useRef(0);
  const agentDraftRef = useRef<Record<string, string>>({});
  const onEventRef = useRef(onEvent);
  onEventRef.current = onEvent;

  const conversation = useConversation({
    micMuted: false,
    onConnect: () => {
      onEventRef.current({ type: "status", status: "live" });
      onEventRef.current({ type: "activity", activity: "listening" });
    },
    onDisconnect: (details) => {
      if (endedByUserRef.current || details.reason === "user") {
        onEventRef.current({ type: "status", status: "ended" });
        onEventRef.current({ type: "activity", activity: "idle" });
        return;
      }
      if (details.reason === "agent") {
        onEventRef.current({ type: "status", status: "ended" });
        onEventRef.current({ type: "activity", activity: "idle" });
        return;
      }
      onEventRef.current({ type: "error", kind: "connection" });
      onEventRef.current({ type: "activity", activity: "idle" });
    },
    onError: (message) => {
      if (endedByUserRef.current) return;
      const text = typeof message === "string" ? message : "";
      const microphoneDenied = /microphone|permission|notallowed|denied|getUserMedia/i.test(
        text,
      );
      onEventRef.current({
        type: "error",
        kind: microphoneDenied ? "microphone" : "connection",
      });
    },
    onMessage: (payload) => {
      const text = payload.message?.trim();
      if (!text) return;
      const isAgent = payload.role === "agent" || payload.source === "ai";
      const id = isAgent
        ? `ai-${payload.response_id ?? payload.event_id}`
        : `customer-${payload.event_id}`;
      onEventRef.current({
        type: "transcript",
        message: {
          id,
          speaker: isAgent ? "ai" : "customer",
          text,
        },
      });
    },
    onAgentChatResponsePart: (part) => {
      const id = `ai-${part.response_id ?? part.event_id}`;
      if (part.type === "start") {
        agentDraftRef.current[id] = part.text ?? "";
      } else if (part.type === "delta") {
        agentDraftRef.current[id] = `${agentDraftRef.current[id] ?? ""}${part.text ?? ""}`;
      }
      const text = agentDraftRef.current[id]?.trim();
      if (!text) return;
      onEventRef.current({
        type: "transcript",
        message: { id, speaker: "ai", text },
      });
    },
    onAgentResponseCorrection: (event) => {
      const text = event.corrected_agent_response?.trim();
      if (!text) return;
      onEventRef.current({
        type: "transcript",
        message: {
          id: `ai-${event.response_id ?? event.event_id}`,
          speaker: "ai",
          text,
        },
      });
    },
    onModeChange: ({ mode }) => {
      onEventRef.current({
        type: "activity",
        activity: mode === "speaking" ? "speaking" : "listening",
      });
    },
  });

  useEffect(() => {
    if (conversation.status === "connecting") {
      onEventRef.current({ type: "status", status: "connecting" });
    }
  }, [conversation.status]);

  useEffect(() => {
    if (status !== "live") return;
    const timer = setInterval(() => {
      secondsRef.current += 1;
      onEventRef.current({ type: "duration", seconds: secondsRef.current });
    }, 1000);
    return () => clearInterval(timer);
  }, [status]);

  const startConversation = useCallback(() => {
    if (status === "connecting" || status === "live") return;

    endedByUserRef.current = false;
    secondsRef.current = 0;
    agentDraftRef.current = {};
    onEvent({ type: "reset" });
    onEvent({ type: "status", status: "connecting" });

    const agentId = getVoiceAgentId();
    if (!agentId) {
      onEvent({ type: "error", kind: "connection" });
      return;
    }

    conversation.startSession({
      agentId,
      connectionType: "websocket",
    });
  }, [conversation, onEvent, status]);

  const endConversation = useCallback(() => {
    endedByUserRef.current = true;
    conversation.endSession();
    onEvent({ type: "status", status: "ended" });
    onEvent({ type: "activity", activity: "idle" });
  }, [conversation, onEvent]);

  const live = status === "live";
  const connecting = status === "connecting";
  const idle = status === "idle";
  const ended = status === "ended";
  const error = status === "error";

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
          <span>Shreedevi voice</span>
          <span className="rounded-full border border-[rgba(224,196,138,0.28)] px-2 py-0.5 text-[10px] text-[#e0c48a]">
            HD voice
          </span>
        </div>

        <div className="flex flex-1 flex-col items-center justify-center text-center">
          <AiAvatar status={status} activity={activity} />
          <p className="font-serif text-[40px] leading-none text-[#f6efe4]">Maya</p>
          <p className="mt-2 text-[13px] text-[#b7aa9a]">Sales caller · Shreedevi Jewellers</p>

          <AnimatePresence mode="wait">
            {live ? (
              <motion.div
                key="live"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="mt-5"
              >
                <p className="font-serif text-[42px] tabular-nums leading-none text-[#f6efe4]">
                  {formatDuration(durationSeconds)}
                </p>
              </motion.div>
            ) : idle || ended ? (
              <motion.p
                key={idle ? "idle-copy" : "ended-copy"}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="mt-4 max-w-[240px] text-[14px] leading-6 text-[#cbbfae]"
              >
                {idle
                  ? "Place a call and speak the way you would to a salesperson on the floor."
                  : `Last call ${formatDuration(durationSeconds)}`}
              </motion.p>
            ) : (
              <span key="spacer" className="mt-4 block h-6" />
            )}
          </AnimatePresence>

          <div className="mt-4 h-14">
            <Waveform
              activity={live ? activity : connecting ? "listening" : "idle"}
            />
          </div>
          <p className="text-[13px] text-[#e0c48a]">{statusLabel}</p>
        </div>

        <div className="flex flex-col items-center pb-2">
          {error ? (
            <div className="mb-4 max-w-[260px] text-center text-[13px] leading-6 text-[#d7cbbd]">
              {errorKind === "microphone"
                ? "Allow the microphone so Maya can hear you."
                : "The line didn't connect. Try the call again."}
            </div>
          ) : null}

          <div className="flex items-end justify-center gap-10">
            {live || connecting ? (
              <div className="flex flex-col items-center gap-2">
                <motion.button
                  type="button"
                  onClick={endConversation}
                  whileTap={{ scale: 0.96 }}
                  className="end-orb"
                  aria-label="End call"
                >
                  <PhoneOff size={26} strokeWidth={1.8} />
                </motion.button>
                <span className="text-[12px] text-[#b7aa9a]">End</span>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-2">
                <motion.button
                  type="button"
                  onClick={() => void startConversation()}
                  whileTap={{ scale: 0.96 }}
                  className="call-orb"
                  aria-label={ended || error ? "Call again" : "Call Maya"}
                >
                  <Phone size={26} strokeWidth={1.8} />
                </motion.button>
                <span className="text-[12px] text-[#b7aa9a]">
                  {ended || error ? "Call again" : "Call"}
                </span>
              </div>
            )}
          </div>
          <div className="mx-auto mt-6 h-1 w-24 rounded-full bg-white/15" />
        </div>
      </div>
    </section>
  );
}
