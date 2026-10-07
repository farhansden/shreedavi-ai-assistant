"use client";

import { motion } from "framer-motion";
import type { VoiceActivity } from "@/lib/types";

const BARS = [18, 32, 22, 44, 28, 50, 24, 40, 20, 36, 26, 46, 18, 34, 22];

type WaveformProps = {
  activity: VoiceActivity;
};

export function Waveform({ activity }: WaveformProps) {
  const active = activity !== "idle";

  return (
    <div
      className="flex h-12 items-end justify-center gap-[5px]"
      aria-hidden="true"
    >
      {BARS.map((height, index) => (
        <motion.span
          key={index}
          className="w-[3px] rounded-full bg-[#b8955a]"
          animate={
            active
              ? {
                  height: [
                    Math.max(8, height * 0.35),
                    height,
                    Math.max(10, height * 0.45),
                  ],
                  opacity: [0.35, 0.95, 0.45],
                }
              : { height: 8, opacity: 0.28 }
          }
          transition={{
            duration: activity === "speaking" ? 0.7 : 1.15,
            repeat: Infinity,
            delay: index * 0.05,
            ease: "easeInOut",
          }}
        />
      ))}
    </div>
  );
}
