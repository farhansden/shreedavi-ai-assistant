"use client";

import { useEffect, useState } from "react";
import type { VoiceActivity } from "@/lib/types";

const BAR_COUNT = 17;
const RESTING_LEVELS = Array.from({ length: BAR_COUNT }, () => 0);

type WaveformProps = {
  activity: VoiceActivity;
  active: boolean;
  readFrequency: () => Uint8Array | null;
};

export function Waveform({ activity, active, readFrequency }: WaveformProps) {
  const [levels, setLevels] = useState<number[]>(RESTING_LEVELS);

  useEffect(() => {
    if (!active) return;
    let frame = 0;
    let last = 0;
    const tick = (now: number) => {
      frame = window.requestAnimationFrame(tick);
      if (now - last < 90) return;
      last = now;
      const data = readFrequency();
      const next = Array.from({ length: BAR_COUNT }, (_, index) => {
        const breath = 0.14 + 0.08 * Math.sin(now / 320 + index * 0.55);
        if (!data?.length) return breath;
        const step = Math.max(1, data.length / BAR_COUNT);
        const start = Math.floor(index * step);
        const end = Math.min(
          data.length,
          Math.max(start + 1, Math.floor((index + 1) * step)),
        );
        let sum = 0;
        for (let cursor = start; cursor < end; cursor += 1) sum += data[cursor] ?? 0;
        const real = sum / (end - start) / 255;
        return Math.min(1, Math.max(breath * 0.45, real));
      });
      setLevels(next);
    };
    frame = window.requestAnimationFrame(tick);
    return () => window.cancelAnimationFrame(frame);
  }, [active, readFrequency]);

  useEffect(() => {
    if (active) return;
    setLevels(RESTING_LEVELS);
  }, [active]);

  return (
    <div
      className="flex h-12 items-end justify-center gap-[3px]"
      aria-hidden="true"
    >
      {levels.map((level, index) => {
        const amount = active ? Math.max(0, Math.min(1, level)) : 0;
        return (
          <span
            key={index}
            className={`w-[3px] rounded-full ${
              activity === "speaking" ? "bg-[#a68448]" : "bg-[#8d8478]"
            }`}
            style={{
              height: active ? 5 + amount * 36 : 4,
              opacity: active ? 0.4 + amount * 0.6 : 0.28,
              transition: "height 90ms linear, opacity 90ms linear",
            }}
          />
        );
      })}
    </div>
  );
}
