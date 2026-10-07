"use client";

/**
 * VoiceAgent is the only integration point for the live conversational session.
 * The session client is launched from here; the rest of the product UI stays branded.
 */

import { useCallback, useEffect, useRef } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Mic, PhoneOff } from "lucide-react";
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

  const retry = () => {
    void startConversation();
  };

  const live = status === "live";
  const connecting = status === "connecting";
  const idle = status === "idle";
  const ended = status === "ended";
  const error = status === "error";

  const statusLabel = error
    ? "Unavailable"
    : connecting
      ? "CONNECTING..."
      : live
        ? "LIVE CONVERSATION"
        : ended
          ? "Call completed"
          : "Ready to talk";

  return (
    <section className="relative flex h-full min-h-[520px] flex-col overflow-hidden rounded-2xl border border-[#e6dcc8] bg-[#fbf8f2] px-8 py-8 shadow-[0_18px_50px_rgba(70,50,20,0.06)]">
      <div className="flex items-center justify-between">
        <p className="text-[11px] font-medium tracking-[0.28em] text-[#8a7a62]">
          {live ? "LIVE CONVERSATION" : "LIVE AI ASSISTANT"}
        </p>
        <div className="flex items-center gap-2 text-[12px] text-[#4a4338]">
          <span
            className={`h-1.5 w-1.5 rounded-full ${
              error
                ? "bg-[#a15c4a]"
                : connecting
                  ? "bg-[#c4a574]"
                  : live
                    ? "bg-[#3d8b63]"
                    : ended
                      ? "bg-[#8a7a62]"
                      : "bg-[#b8955a]"
            }`}
          >
            <motion.span
              className="block h-1.5 w-1.5 rounded-full bg-current"
              animate={{ opacity: [1, 0.35, 1] }}
              transition={{ duration: 1.6, repeat: Infinity }}
            />
          </span>
          <span className="tracking-[0.04em]">{statusLabel}</span>
        </div>
      </div>

      <div className="flex flex-1 flex-col items-center justify-center text-center">
        <AiAvatar status={status} activity={activity} />

        <p className="font-serif text-[28px] tracking-[0.18em] text-[#2c261c]">
          MAYA
        </p>
        <p className="mt-1 text-[13px] tracking-[0.08em] text-[#7a6e5c]">
          AI Sales Executive
        </p>

        <AnimatePresence mode="wait">
          {idle ? (
            <motion.div
              key="idle"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              className="mt-8 flex w-full max-w-sm flex-col items-center"
            >
              <p className="text-[13px] tracking-[0.18em] text-[#9a7b45]">
                AI SALES ASSISTANT
              </p>
              <p className="mt-2 text-[15px] leading-relaxed text-[#5c5348]">
                Ready to help your customers.
              </p>
              <p className="mt-3 text-[14px] leading-relaxed text-[#6a6258]">
                Talk to the Shreedevi AI Sales Assistant
              </p>
              <motion.button
                type="button"
                onClick={() => void startConversation()}
                whileHover={{ y: -1 }}
                whileTap={{ scale: 0.985 }}
                className="mt-6 inline-flex h-12 w-full items-center justify-center gap-2 rounded-full bg-[#2c261c] px-6 text-[14px] font-medium tracking-[0.08em] text-[#f7f1e6] shadow-[0_10px_24px_rgba(44,38,28,0.18)]"
              >
                <Mic size={16} strokeWidth={1.7} />
                Talk to AI
              </motion.button>
              <p className="mt-3 text-[12px] text-[#8a7a62]">
                Click to start a conversation
              </p>
            </motion.div>
          ) : live ? (
            <motion.div
              key="live"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-7 w-full max-w-sm"
            >
              <p className="text-[12px] tracking-[0.16em] text-[#8a7a62]">
                Call duration
              </p>
              <p className="mt-1 font-serif text-[34px] tabular-nums text-[#2c261c]">
                {formatDuration(durationSeconds)}
              </p>
              <div className="mt-5">
                <Waveform activity={activity} />
              </div>
              <p className="mt-4 text-[13px] tracking-[0.14em] text-[#6e6254]">
                {activity === "speaking" ? "Speaking..." : "Listening..."}
              </p>
              <motion.button
                type="button"
                onClick={endConversation}
                whileHover={{ y: -1 }}
                className="mt-6 inline-flex h-11 w-full items-center justify-center gap-2 rounded-full border border-[#d9cbb0] bg-white px-6 text-[13px] tracking-[0.08em] text-[#2c261c]"
              >
                <PhoneOff size={15} strokeWidth={1.7} />
                End Conversation
              </motion.button>
            </motion.div>
          ) : connecting ? (
            <motion.div
              key="link"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="mt-10"
            >
              <p className="text-[13px] tracking-[0.16em] text-[#7a6e5c]">
                CONNECTING...
              </p>
            </motion.div>
          ) : error ? (
            <motion.div
              key="error"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-8 flex w-full max-w-sm flex-col items-center"
            >
              <p className="text-[15px] leading-relaxed text-[#5c5348]">
                {errorKind === "microphone"
                  ? "Microphone access is required to speak with the AI assistant."
                  : "Unable to connect to the AI assistant. Please try again."}
              </p>
              <motion.button
                type="button"
                onClick={retry}
                whileHover={{ y: -1 }}
                className="mt-6 inline-flex h-11 w-full items-center justify-center rounded-full bg-[#2c261c] px-6 text-[13px] tracking-[0.08em] text-[#f7f1e6]"
              >
                Try Again
              </motion.button>
            </motion.div>
          ) : (
            <motion.div
              key="ended"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-8 flex w-full max-w-sm flex-col items-center"
            >
              <p className="text-[15px] leading-relaxed text-[#5c5348]">
                Conversation completed successfully.
              </p>
              <motion.button
                type="button"
                onClick={() => void startConversation()}
                whileHover={{ y: -1 }}
                className="mt-6 inline-flex h-12 w-full items-center justify-center gap-2 rounded-full bg-[#2c261c] px-6 text-[14px] font-medium tracking-[0.08em] text-[#f7f1e6]"
              >
                <Mic size={16} strokeWidth={1.7} />
                Talk to AI
              </motion.button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </section>
  );
}
