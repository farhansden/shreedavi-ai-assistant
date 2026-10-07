"use client";

import { motion } from "framer-motion";
import type { VoiceActivity } from "@/lib/types";

const BARS = [10, 18, 14, 28, 16, 36, 22, 44, 18, 32, 14, 40, 20, 30, 12, 24, 16];

type WaveformProps = {
  activity: VoiceActivity;
};

export function Waveform({ activity }: WaveformProps) {
  const speaking = activity === "speaking";
  const active = activity !== "idle";

  return (
    <div
      className="flex h-14 items-center justify-center gap-[4px]"
      aria-hidden="true"
    >
      {BARS.map((height, index) => (
        <motion.span
          key={index}
          className={`w-[3px] rounded-full ${
            speaking ? "bg-[#f0d7a6]" : "bg-[#c4a36a]"
          }`}
          style={{ boxShadow: speaking ? "0 0 10px rgba(240,215,166,0.45)" : undefined }}
          animate={
            active
              ? {
                  height: [
                    Math.max(6, height * 0.28),
                    height,
                    Math.max(8, height * 0.4),
                  ],
                  opacity: speaking ? [0.55, 1, 0.6] : [0.3, 0.75, 0.4],
                }
              : { height: 6, opacity: 0.22 }
          }
          transition={{
            duration: speaking ? 0.55 : 1.05,
            repeat: Infinity,
            delay: index * 0.045,
            ease: "easeInOut",
          }}
        />
      ))}
    </div>
  );
}
