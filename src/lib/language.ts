/**
 * Language handling for the Shreedevi voice desk.
 *
 * Inspected ElevenLabs agent widget (agent_4201m4ba9fqne4p8kpnwvftd9ksr):
 * - Primary language: en
 * - Additional language preset: hi
 * - supported_language_overrides: null
 *
 * ElevenLabs Conversational AI documents language codes such as en and hi.
 * Marwari is not a supported ASR/TTS language code. Sending an invented
 * code such as "mwr" can drop the websocket. Marwari sessions therefore
 * use Hindi (`hi`) for ASR/TTS and prompt-level Marwari instructions.
 */

export const LANGUAGE_MODES = ["auto", "en", "hi", "mwr"] as const;

export type LanguageMode = (typeof LANGUAGE_MODES)[number];

export type SpokenLanguage =
  | "English"
  | "Hindi"
  | "Hinglish"
  | "Marwari"
  | "Marwari / Hindi";

export type LanguageConfidence = "high" | "low" | "uncertain";

export type LanguageDetection = {
  language: SpokenLanguage | null;
  confidence: LanguageConfidence;
};

export type SessionOverrides = {
  agent?: {
    prompt?: { prompt: string };
    firstMessage?: string;
    language?: "en" | "hi";
  };
  asr?: {
    keywords: string[];
  };
};

export type LanguageSessionReport = {
  mode: LanguageMode;
  engineLanguage: "en" | "hi" | null;
  engineLanguageLabel: string;
  marwariFirstClass: false;
  promptOverrideAttempted: boolean;
  firstMessageOverrideAttempted: boolean;
  asrKeywordsAttempted: boolean;
  limitation: string | null;
  asrNote: string | null;
  error: string | null;
};

export const LANGUAGE_MODE_OPTIONS: {
  id: LanguageMode;
  label: string;
}[] = [
  { id: "auto", label: "Auto-detect" },
  { id: "en", label: "English" },
  { id: "hi", label: "Hindi / Hinglish" },
  { id: "mwr", label: "Marwari" },
];

const MARWARI_MARKERS: RegExp[] = [
  /थार[ोाीेैूंँ]+/,
  /म्हार[ोाीेैूंँ]+/,
  /म्ह(?:नै|ने|ैं|ें|ां)/,
  /कोनी/,
  /घण[ोाीेां]/,
  /खम्मा/,
  /केस[ोाीे]/,
  /सूं/,
  /वास्ते/,
  /आवजो/,
  /कित्त[ोाीे]/,
  /कितर[ोाीे]/,
  /ब्याव/,
  /जेवरा?त/,
  /बाईसा/,
  /राम राम सा/,
  /बणावट/,
  /ओळख/,
  /\btharo\b/i,
  /\bthari\b/i,
  /\bthare\b/i,
  /\bmharo\b/i,
  /\bmhari\b/i,
  /\bmhare\b/i,
  /\bmhane\b/i,
  /\bkoni\b/i,
  /\bghano\b/i,
  /\bghani\b/i,
  /\bkhamma\b/i,
  /\bkeso\b/i,
  /\baavjo\b/i,
  /\bbyaav\b/i,
  /\bjewraat\b/i,
];

const HINDI_MARKERS: RegExp[] = [
  /नमस्ते/,
  /चाहिए/,
  /चाहिये/,
  /देखना/,
  /कितना/,
  /कितने/,
  /कितनो/,
  /नहीं/,
  /कृपया/,
  /धन्यवाद/,
  /शुभकामना/,
  /विवाह/,
  /शादी/,
  /आभूषण/,
  /गहने/,
  /\bhai\b/i,
  /\bkya\b/i,
  /\bnahi\b/i,
  /\bnamaste\b/i,
  /\bchahiye\b/i,
  /\bkitna\b/i,
  /\bshaadi\b/i,
  /\bji\b/i,
];

const HINGLISH_MARKERS: RegExp[] = [
  /\b(haan|haaji|bhaiya|abhi|chahiye|kitna|kal|parso|achha|achchha|accha|theek|nahi|namaste|shaadi|sone|sona|kangan|matlab|bilkul|zaroor)\b/i,
];

const ENGLISH_MARKERS: RegExp[] = [
  /\b(the|and|for|with|looking|interested|wedding|gold|silver|bangles?|necklace|budget|please|thank|hello|hi)\b/i,
];

const DEVANAGARI = /[\u0900-\u097F]/;
const LATIN_WORD = /[A-Za-z]{2,}/;

export const JEWELLERY_ASR_KEYWORDS = [
  "Shreedevi",
  "ShreeDevi",
  "Jewellers",
  "Kalyan",
  "Maya",
  "mangalsutra",
  "jhumka",
  "kangan",
  "chudi",
  "payal",
  "making charges",
  "22 carat",
  "18 carat",
  "tharo",
  "thari",
  "mharo",
  "mhari",
  "koni",
  "ghani",
  "khamma",
  "keso",
  "byaav",
  "lagan",
  "jewar",
  "aavjo",
  "kitto",
  "कंगन",
  "चूड़ी",
  "ब्याव",
  "लगन",
  "जेवर",
  "थारो",
  "म्हारो",
  "खम्मा",
  "कोनी",
  "मेकिंग",
  "शोरूम",
  "सोना",
  "चांदी",
  "अंगूठी",
  "झुमके",
] as const;

export function countMatches(text: string, patterns: RegExp[]): number {
  let count = 0;
  for (const pattern of patterns) {
    const flags = pattern.flags.includes("g") ? pattern.flags : `${pattern.flags}g`;
    const matches = text.match(new RegExp(pattern.source, flags));
    if (matches?.length) count += matches.length;
  }
  return count;
}

export function detectSpokenLanguage(text: string): LanguageDetection {
  const spoken = text.trim();
  if (!spoken) {
    return { language: null, confidence: "uncertain" };
  }

  const tokens = spoken.split(/\s+/).filter(Boolean);
  const marwari = countMatches(spoken, MARWARI_MARKERS);
  const hindi = countMatches(spoken, HINDI_MARKERS);
  const hinglish = countMatches(spoken, HINGLISH_MARKERS);
  const english = countMatches(spoken, ENGLISH_MARKERS);
  const hasDevanagari = DEVANAGARI.test(spoken);
  const hasLatin = LATIN_WORD.test(spoken);

  if (tokens.length <= 2 && marwari === 0 && hindi === 0 && hinglish === 0 && english <= 1) {
    return { language: null, confidence: "uncertain" };
  }

  if (marwari >= 2 && hindi >= 2) {
    return { language: "Marwari / Hindi", confidence: "high" };
  }
  if (marwari >= 2) {
    return { language: "Marwari", confidence: "high" };
  }
  if (marwari === 1 && hindi >= 1) {
    return { language: "Marwari / Hindi", confidence: "low" };
  }
  if (marwari === 1) {
    return { language: "Marwari", confidence: "low" };
  }

  if (hasDevanagari && hindi >= 1) {
    return { language: "Hindi", confidence: hindi >= 2 || tokens.length >= 4 ? "high" : "low" };
  }
  if (hasDevanagari) {
    return {
      language: "Hindi",
      confidence: tokens.length >= 5 ? "low" : "uncertain",
    };
  }

  if (hasLatin && hinglish >= 1 && english >= 1) {
    return { language: "Hinglish", confidence: hinglish + english >= 3 ? "high" : "low" };
  }
  if (hasLatin && hinglish >= 2) {
    return { language: "Hinglish", confidence: "high" };
  }
  if (hasLatin && hinglish === 1) {
    return { language: "Hinglish", confidence: "low" };
  }
  if (hasLatin && english >= 2) {
    return { language: "English", confidence: "high" };
  }
  if (hasLatin && english === 1 && tokens.length >= 4) {
    return { language: "English", confidence: "low" };
  }

  return { language: null, confidence: "uncertain" };
}

export function detectPreferredLanguage(
  texts: string[],
): LanguageDetection {
  const tallies: Record<SpokenLanguage, number> = {
    English: 0,
    Hindi: 0,
    Hinglish: 0,
    Marwari: 0,
    "Marwari / Hindi": 0,
  };
  let highHits = 0;

  for (const text of texts) {
    const result = detectSpokenLanguage(text);
    if (!result.language || result.confidence === "uncertain") continue;
    const weight = result.confidence === "high" ? 2 : 1;
    tallies[result.language] += weight;
    if (result.confidence === "high") highHits += 1;
  }

  const ranked = (Object.entries(tallies) as [SpokenLanguage, number][])
    .filter(([, score]) => score > 0)
    .sort((a, b) => b[1] - a[1]);

  if (ranked.length === 0) {
    return { language: null, confidence: "uncertain" };
  }

  const [top, score] = ranked[0];
  const mixedMarwariHindi =
    tallies.Marwari > 0 && (tallies.Hindi > 0 || tallies["Marwari / Hindi"] > 0);

  if (mixedMarwariHindi && tallies.Marwari >= score - 1) {
    return {
      language: "Marwari / Hindi",
      confidence: highHits >= 2 ? "high" : "low",
    };
  }

  return {
    language: top,
    confidence: score >= 2 || highHits >= 1 ? "high" : "low",
  };
}

export function languageBadge(detection: LanguageDetection): string | null {
  if (detection.confidence === "uncertain" || !detection.language) {
    return "Language unclear";
  }
  if (detection.confidence === "low") {
    return `Possibly ${detection.language}`;
  }
  return detection.language;
}

export function engineLanguageForMode(
  mode: LanguageMode,
): "en" | "hi" | null {
  if (mode === "en") return "en";
  if (mode === "hi" || mode === "mwr") return "hi";
  return null;
}

export function limitationForMode(mode: LanguageMode): string | null {
  if (mode === "mwr") {
    return "Marwari is not a first-class ElevenLabs ASR/TTS language. This session uses Hindi (`hi`) for recognition and speech, with Marwari instructions in the prompt. The model may transcribe Marwari as Hindi, and spoken Marwari may use Hindi phonetics. Do not treat that as fluent Marwari.";
  }
  if (mode === "hi") {
    return "Hindi is configured on this agent as language preset `hi`. Hinglish is handled in the prompt. The documented `hinglish_mode` flag is not sent because it is not a supported client override field.";
  }
  if (mode === "auto") {
    return "Auto-detect does not send an ElevenLabs language code. The agent stays on its dashboard default (English) unless it already has language detection configured. Hindi is available as a preset; Marwari is not.";
  }
  return null;
}

export function buildLanguageSessionReport(
  mode: LanguageMode,
  extras?: Partial<Pick<LanguageSessionReport, "asrNote" | "error">>,
): LanguageSessionReport {
  const engineLanguage = engineLanguageForMode(mode);
  const engineLanguageLabel =
    engineLanguage === "en"
      ? "English (en)"
      : engineLanguage === "hi"
        ? mode === "mwr"
          ? "Hindi (hi), standing in for Marwari"
          : "Hindi (hi)"
        : "Agent default (English)";

  return {
    mode,
    engineLanguage,
    engineLanguageLabel,
    marwariFirstClass: false,
    promptOverrideAttempted: true,
    firstMessageOverrideAttempted: mode !== "auto",
    asrKeywordsAttempted: true,
    limitation: limitationForMode(mode),
    asrNote: extras?.asrNote ?? null,
    error: extras?.error ?? null,
  };
}

export function summarizeAsrMetadata(metadata: unknown): string | null {
  if (!metadata || typeof metadata !== "object") return null;
  const record = metadata as Record<string, unknown>;
  const keys = ["language", "language_code", "languageCode", "provider", "model"];
  const parts: string[] = [];
  const visit = (value: unknown, prefix?: string) => {
    if (!value || typeof value !== "object") return;
    const nested = value as Record<string, unknown>;
    for (const key of keys) {
      const field = nested[key];
      if (typeof field === "string" && field.trim()) {
        parts.push(`${prefix ? `${prefix}.` : ""}${key}: ${field.trim()}`);
      }
    }
  };
  visit(record);
  for (const [key, value] of Object.entries(record)) {
    if (value && typeof value === "object") visit(value, key);
  }
  if (parts.length === 0) {
    try {
      const serialized = JSON.stringify(metadata);
      return serialized === "{}" ? null : serialized;
    } catch {
      return null;
    }
  }
  return parts.join(" · ");
}

export function formatOverrideError(error: unknown): string {
  if (typeof error === "string" && error.trim()) return error.trim();
  if (error instanceof Error && error.message.trim()) return error.message.trim();
  return "ElevenLabs rejected the language override. The call will continue with the dashboard agent settings.";
}
