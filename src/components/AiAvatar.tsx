"use client";

import { motion } from "framer-motion";
import type { VoiceActivity, VoiceSessionStatus } from "@/lib/types";

type AiAvatarProps = {
  status: VoiceSessionStatus;
  activity: VoiceActivity;
};

export function AiAvatar({ status, activity }: AiAvatarProps) {
  const live = status === "live" || status === "connected";
  const speaking = activity === "speaking";
  const listening = activity === "listening";

  return (
    <div className="relative mx-auto flex h-[168px] w-[168px] items-center justify-center">
      <motion.div
        className="absolute inset-0 rounded-full border border-[rgba(184,149,90,0.18)]"
        animate={
          live
            ? { scale: [1, 1.06, 1], opacity: [0.45, 0.8, 0.45] }
            : { scale: 1, opacity: 0.5 }
        }
        transition={{ duration: 3.6, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        className="absolute inset-4 rounded-full border border-[rgba(184,149,90,0.28)]"
        animate={
          speaking
            ? { scale: [1, 1.08, 1], opacity: [0.5, 1, 0.5] }
            : listening
              ? { scale: [1, 1.03, 1], opacity: [0.55, 0.9, 0.55] }
              : { scale: 1, opacity: 0.7 }
        }
        transition={{ duration: speaking ? 1.4 : 2.8, repeat: Infinity }}
      />
      <div className="relative flex h-[108px] w-[108px] items-center justify-center rounded-full bg-[#f7f1e6] shadow-[0_10px_30px_rgba(60,45,20,0.08)]">
        <svg
          width="72"
          height="72"
          viewBox="0 0 72 72"
          fill="none"
          aria-hidden="true"
        >
          <circle cx="36" cy="36" r="31" stroke="#c4a574" strokeWidth="0.6" />
          <path
            d="M36 10 L42.4 28.2 L61 30.4 L47 42.2 L51.2 60.4 L36 50.6 L20.8 60.4 L25 42.2 L11 30.4 L29.6 28.2 Z"
            stroke="#9a7b45"
            strokeWidth="1"
            fill="rgba(184,149,90,0.08)"
          />
          <circle cx="36" cy="36" r="8" stroke="#b8955a" strokeWidth="1.1" />
          <circle cx="36" cy="36" r="2.2" fill="#b8955a" />
        </svg>
      </div>
    </div>
  );
}
