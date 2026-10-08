"use client";

import { motion } from "framer-motion";
import type { VoiceActivity, VoiceSessionStatus } from "@/lib/types";

type AiAvatarProps = {
  status: VoiceSessionStatus;
  activity: VoiceActivity;
};

export function AiAvatar({ status, activity }: AiAvatarProps) {
  const live = status === "live" || status === "connected" || status === "connecting";
  const speaking = activity === "speaking";

  return (
    <div className="relative mx-auto flex h-[148px] w-[148px] items-center justify-center">
      {[0, 1].map((ring) => (
        <motion.span
          key={ring}
          className="absolute h-[104px] w-[104px] rounded-full border border-[rgba(166,132,72,0.45)]"
          animate={
            live
              ? { scale: [1, speaking ? 1.42 : 1.24], opacity: [0.45, 0] }
              : { scale: 1, opacity: 0.35 }
          }
          transition={{
            duration: speaking ? 1.6 : 2.4,
            repeat: live ? Infinity : 0,
            delay: ring * 0.45,
            ease: "easeOut",
          }}
        />
      ))}
      <div className="relative grid h-[104px] w-[104px] place-items-center rounded-full border border-[rgba(166,132,72,0.55)] bg-[#fbf8f2] shadow-[0_10px_30px_rgba(70,48,20,0.08)]">
        <span className="font-serif text-[46px] leading-none text-[#8c7040]">M</span>
      </div>
    </div>
  );
}
