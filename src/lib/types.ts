import type {
  LanguageConfidence as DetectedLanguageConfidence,
  LanguageSessionReport,
  SpokenLanguage,
} from "./language";

export type VoiceSessionStatus =
  | "idle"
  | "connecting"
  | "connected"
  | "live"
  | "ended"
  | "error";

export type VoiceActivity = "idle" | "listening" | "speaking";

export type SessionErrorKind = "microphone" | "connection" | "interrupted";

export type TranscriptSpeaker = "ai" | "customer";

export type SpokenLanguageLabel = SpokenLanguage;
export type LanguageConfidence = DetectedLanguageConfidence;

export type TranscriptMessage = {
  id: string;
  speaker: TranscriptSpeaker;
  text: string;
  timestamp?: string;
  language?: SpokenLanguageLabel | null;
  languageConfidence?: LanguageConfidence;
};

export type InsightKey =
  | "language"
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
  duration: string;
  language: string;
  product: string;
  occasion: string;
  budget: string;
  timeline: string;
  visit: string;
  intent: string;
  leadScore: string;
  lead: string;
  aiSummary: string;
};

export type { LanguageSessionReport };

export type VoiceSessionEvent =
  | { type: "status"; status: VoiceSessionStatus }
  | { type: "activity"; activity: VoiceActivity }
  | { type: "transcript"; message: TranscriptMessage }
  | { type: "insight"; insight: InsightItem }
  | { type: "duration"; seconds: number }
  | { type: "summary-ready"; summary: CallSummary }
  | { type: "error"; kind: SessionErrorKind }
  | { type: "language-session"; report: LanguageSessionReport }
  | { type: "reset" };

export type VoiceSessionHandle = {
  stop: () => void;
};
