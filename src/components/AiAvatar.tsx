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
    <div className="relative mx-auto flex h-[156px] w-[156px] items-center justify-center">
      {[0, 1, 2].map((ring) => (
        <motion.span
          key={ring}
          className="absolute h-[104px] w-[104px] rounded-full border border-[rgba(224,196,138,0.45)]"
          animate={
            live
              ? { scale: [1, speaking ? 1.85 : 1.55], opacity: [0.55, 0] }
              : { scale: 1 + ring * 0.18, opacity: 0.18 }
          }
          transition={{
            duration: speaking ? 1.5 : 2.4,
            repeat: live ? Infinity : 0,
            delay: ring * 0.45,
            ease: "easeOut",
          }}
        />
      ))}
      <div className="relative grid h-[104px] w-[104px] place-items-center rounded-full border border-[rgba(224,196,138,0.55)] bg-[radial-gradient(circle_at_40%_30%,#3a3124,#16130f_70%)] shadow-[0_12px_40px_rgba(0,0,0,0.45)]">
        <span className="font-serif text-[42px] leading-none text-[#f3ddb0]">M</span>
      </div>
    </div>
  );
}
