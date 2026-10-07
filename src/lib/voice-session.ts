export function formatDuration(totalSeconds: number): string {
  const m = Math.floor(totalSeconds / 60)
    .toString()
    .padStart(2, "0");
  const s = (totalSeconds % 60).toString().padStart(2, "0");
  return `${m}:${s}`;
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
