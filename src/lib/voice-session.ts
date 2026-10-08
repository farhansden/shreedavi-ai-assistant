export function formatDuration(totalSeconds: number): string {
  const safe = Math.max(0, Math.floor(totalSeconds));
  const m = Math.floor(safe / 60)
    .toString()
    .padStart(2, "0");
  const s = (safe % 60).toString().padStart(2, "0");
  return `${m}:${s}`;
}

export function formatClock(date = new Date()): string {
  return new Intl.DateTimeFormat("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hourCycle: "h23",
  }).format(date);
}

export const INSIGHT_ORDER = [
  "product",
  "occasion",
  "budget",
  "timeline",
  "visit",
  "intent",
  "sentiment",
  "leadScore",
  "leadStatus",
] as const;

export function getVoiceAgentId(): string {
  return process.env.NEXT_PUBLIC_ELEVENLABS_AGENT_ID?.trim() ?? "";
}
