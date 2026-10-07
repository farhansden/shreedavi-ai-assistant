export type VoiceSessionStatus =
  | "idle"
  | "connecting"
  | "connected"
  | "live"
  | "ended"
  | "error";

export type VoiceActivity = "idle" | "listening" | "speaking";

export type SessionErrorKind = "microphone" | "connection";

export type TranscriptSpeaker = "ai" | "customer";

export type TranscriptMessage = {
  id: string;
  speaker: TranscriptSpeaker;
  text: string;
};

export type InsightKey =
  | "product"
  | "occasion"
  | "budget"
  | "timeline"
  | "visit"
  | "intent"
  | "sentiment"
  | "leadScore"
  | "leadStatus";

export type InsightItem = {
  key: InsightKey;
  label: string;
  value: string;
};

export type CallSummary = {
  customer: string;
  product: string;
  budget: string;
  occasion: string;
  timeline: string;
  visit: string;
  leadScore: string;
  lead: string;
  aiSummary: string;
  nextAction: string;
};

export type VoiceSessionEvent =
  | { type: "status"; status: VoiceSessionStatus }
  | { type: "activity"; activity: VoiceActivity }
  | { type: "transcript"; message: TranscriptMessage }
  | { type: "insight"; insight: InsightItem }
  | { type: "duration"; seconds: number }
  | { type: "summary-ready"; summary: CallSummary }
  | { type: "error"; kind: SessionErrorKind }
  | { type: "reset" };

export type VoiceSessionHandle = {
  stop: () => void;
};
