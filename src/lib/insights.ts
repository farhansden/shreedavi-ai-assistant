import type { CallSummary, TranscriptMessage } from "./types";

export type LeadStatus = "HOT" | "WARM" | "COLD";

export type ConversationInsights = {
  customerName: string | null;
  product: string | null;
  occasion: string | null;
  budget: string | null;
  timeline: string | null;
  visit: string | null;
  showroomInterest: boolean;
  intent: string | null;
  sentiment: string | null;
  language: string | null;
  leadScore: number;
  leadStatus: LeadStatus;
};

const UNKNOWN = "Not identified";

const WORD_NUMBERS: Record<string, number> = {
  one: 1,
  two: 2,
  three: 3,
  four: 4,
  five: 5,
  six: 6,
  seven: 7,
  eight: 8,
  nine: 9,
  ten: 10,
  eleven: 11,
  twelve: 12,
  thirteen: 13,
  fourteen: 14,
  fifteen: 15,
  sixteen: 16,
  seventeen: 17,
  eighteen: 18,
  nineteen: 19,
  twenty: 20,
  thirty: 30,
  forty: 40,
  fifty: 50,
  sixty: 60,
  seventy: 70,
  eighty: 80,
  ninety: 90,
};

const PRODUCTS: { pattern: RegExp; label: string }[] = [
  { pattern: /\bdiamond\s+rings?\b/, label: "Diamond Ring" },
  { pattern: /\bsolitaire\s+rings?\b/, label: "Solitaire Ring" },
  { pattern: /\bengagement\s+rings?\b/, label: "Engagement Ring" },
  { pattern: /\bwedding\s+rings?\b/, label: "Wedding Ring" },
  { pattern: /\bgold\s+rings?\b/, label: "Gold Ring" },
  { pattern: /\bplatinum\s+rings?\b/, label: "Platinum Ring" },
  { pattern: /\brings?\b/, label: "Ring" },
  { pattern: /\bmangalsutra\b/, label: "Mangalsutra" },
  { pattern: /\bnecklace\b/, label: "Necklace" },
  { pattern: /\bpendant\b/, label: "Pendant" },
  { pattern: /\bearrings?\b/, label: "Earrings" },
  { pattern: /\bjhumkas?\b/, label: "Jhumkas" },
  { pattern: /\bbangles?\b/, label: "Bangles" },
  { pattern: /\bbracelet\b/, label: "Bracelet" },
  { pattern: /\bchain\b/, label: "Chain" },
  { pattern: /\bchoker\b/, label: "Choker" },
  { pattern: /\bpayal\b|\banklets?\b/, label: "Payal" },
  { pattern: /\bnose\s+ring\b|\bnath\b/, label: "Nose Ring" },
  { pattern: /\bmaang\s+tikka\b|\btikka\b/, label: "Maang Tikka" },
  { pattern: /\bwedding\s+set\b|\bjewellery\s+set\b/, label: "Wedding Set" },
  { pattern: /\bgold\s+coins?\b/, label: "Gold Coin" },
];

const OCCASIONS: { pattern: RegExp; label: string }[] = [
  { pattern: /\banniversar(?:y|ies)\b/, label: "Anniversary" },
  { pattern: /\bengagement\b/, label: "Engagement" },
  { pattern: /\bwedding\b/, label: "Wedding" },
  { pattern: /\bbirthday\b/, label: "Birthday" },
  { pattern: /\bdiwali\b/, label: "Diwali" },
  { pattern: /\bakshaya\s+tritiya\b/, label: "Akshaya Tritiya" },
  { pattern: /\bkarva\s+chauth\b/, label: "Karva Chauth" },
  { pattern: /\bvalentine/, label: "Valentine's Day" },
  { pattern: /\breception\b/, label: "Reception" },
];

const NAME_STOP = /^(looking|interested|thinking|planning|calling|trying|here|there|good|fine|okay|ok)$/i;

function customerText(messages: TranscriptMessage[]): string {
  return messages
    .filter((message) => message.speaker === "customer")
    .map((message) => message.text)
    .join(" ");
}

function parseNumberToken(token: string): number | null {
  const cleaned = token.replace(/,/g, "");
  if (/^\d+(?:\.\d+)?$/.test(cleaned)) return Number(cleaned);
  return WORD_NUMBERS[token.toLowerCase()] ?? null;
}

function formatInr(amount: number): string {
  const rounded = Math.round(amount);
  const str = String(rounded);
  if (str.length <= 3) return `₹${str}`;
  const lastThree = str.slice(-3);
  const rest = str.slice(0, -3).replace(/\B(?=(\d{2})+(?!\d))/g, ",");
  return `₹${rest},${lastThree}`;
}

function extractProduct(text: string): string | null {
  const lower = text.toLowerCase();
  for (const item of PRODUCTS) {
    if (item.pattern.test(lower)) return item.label;
  }
  return null;
}

function extractOccasion(text: string): string | null {
  const lower = text.toLowerCase();
  for (const item of OCCASIONS) {
    if (item.pattern.test(lower)) return item.label;
  }
  return null;
}

function extractBudget(text: string): string | null {
  const lower = text.toLowerCase();
  const lakh = lower.match(
    /(?:₹|rs\.?|rupees?)?\s*([a-z]+|\d+(?:\.\d+)?)\s*lakhs?\b/,
  );
  if (lakh) {
    const value = parseNumberToken(lakh[1]);
    if (value) return formatInr(value * 100000);
  }

  const thousand = lower.match(
    /(?:₹|rs\.?|rupees?)?\s*([a-z]+|\d+(?:\.\d+)?)\s*(?:thousand|k)\b/,
  );
  if (thousand) {
    const value = parseNumberToken(thousand[1]);
    if (value) return formatInr(value * 1000);
  }

  const rupee = lower.match(
    /(?:₹|rs\.?|rupees?)\s*([\d,]+)(?:\s*\/-)?/,
  );
  if (rupee) {
    const value = Number(rupee[1].replace(/,/g, ""));
    if (value >= 1000) return formatInr(value);
  }

  const grouped = lower.match(/\b(\d{1,2},\d{2},\d{3})\b/);
  if (grouped) {
    const value = Number(grouped[1].replace(/,/g, ""));
    if (value >= 1000) return formatInr(value);
  }

  return null;
}

function extractTimeline(text: string): string | null {
  const lower = text.toLowerCase();
  const range = lower.match(
    /(?:within\s+)?([a-z]+|\d+)\s*(?:-|–|to)\s*([a-z]+|\d+)\s*(days?|weeks?|months?)/,
  );
  if (range) {
    const a = parseNumberToken(range[1]);
    const b = parseNumberToken(range[2]);
    if (a && b) {
      const unit = range[3].replace(/s$/, "");
      const plural = `${unit}${b === 1 ? "" : "s"}`;
      return `${a}–${b} ${plural.charAt(0).toUpperCase()}${plural.slice(1)}`;
    }
  }

  const within = lower.match(
    /(?:within|in)\s+([a-z]+|\d+)\s*(days?|weeks?|months?)/,
  );
  if (within) {
    const value = parseNumberToken(within[1]);
    if (value) {
      const unit = within[2];
      return `${value} ${unit.charAt(0).toUpperCase()}${unit.slice(1)}`;
    }
  }

  if (/\bas soon as possible\b|\basap\b/.test(lower)) return "As soon as possible";
  if (/\bnext month\b/.test(lower)) return "Next month";
  if (/\bthis month\b/.test(lower)) return "This month";
  if (/\bnext week\b/.test(lower)) return "Next week";
  if (/\bthis week\b/.test(lower)) return "This week";
  return null;
}

function titleCase(value: string): string {
  return value.replace(/\b\w/g, (char) => char.toUpperCase());
}

function extractVisit(text: string): string | null {
  const lower = text.toLowerCase();
  const dayMatch = lower.match(
    /\b(monday|tuesday|wednesday|thursday|friday|saturday|sunday|tomorrow|this weekend|weekend)\b/,
  );
  const timeMatch = lower.match(
    /\b(\d{1,2})(?::(\d{2}))?\s*(am|pm)\b/,
  );
  const periodMatch = lower.match(/\b(morning|afternoon|evening|night)\b/);

  if (!dayMatch && !timeMatch && !periodMatch) return null;

  const parts: string[] = [];
  if (dayMatch) parts.push(titleCase(dayMatch[1]));
  if (timeMatch) {
    const hour = timeMatch[1];
    const minutes = timeMatch[2] ? `:${timeMatch[2]}` : "";
    parts.push(`${hour}${minutes} ${timeMatch[3].toUpperCase()}`);
  } else if (periodMatch) {
    parts.push(titleCase(periodMatch[1]));
  }

  return parts.join(" · ");
}

function extractShowroomInterest(text: string): boolean {
  return /\b(showroom|store|visit|come in|drop by|appointment|see (?:it |them )?in person|come over)\b/i.test(
    text,
  );
}

function extractName(text: string): string | null {
  const matches = text.matchAll(
    /\b(?:my name is|this is|i am|i['’]m)\s+([A-Za-z]+(?:\s+[A-Za-z]+){0,2})\b/gi,
  );
  for (const match of matches) {
    const parts = match[1].trim().split(/\s+/);
    if (parts.some((part) => NAME_STOP.test(part))) continue;
    if (!parts.every((part) => /^[A-Z][a-z]+$/.test(part))) continue;
    return parts.join(" ");
  }
  return null;
}

function extractIntent(text: string, hasProduct: boolean): string | null {
  const lower = text.toLowerCase();
  if (!lower.trim()) return null;
  if (/\b(buy|purchase|purchasing|order|booking)\b/.test(lower)) return "Purchase";
  if (hasProduct && /\b(looking for|interested|need|want|gift)\b/.test(lower)) {
    return "Purchase";
  }
  if (/\b(visit|showroom|appointment|come in)\b/.test(lower)) return "Visit";
  if (/\b(looking|interested|enquiry|inquiry|information)\b/.test(lower)) {
    return "Enquiry";
  }
  return null;
}

function extractSentiment(text: string): string | null {
  const lower = text.toLowerCase();
  if (!lower.trim()) return null;
  const negative =
    /\b(expensive|costly|too much|not sure|maybe later|don't|dont|cannot|can't|no thanks|not interested|cheap)\b/.test(
      lower,
    );
  const positive =
    /\b(thank|thanks|perfect|great|love|wonderful|yes|sure|interested|sounds good|that works|please|beautiful|nice)\b/.test(
      lower,
    );
  if (negative) return "Negative";
  if (positive) return "Positive";
  return null;
}

function extractLanguage(text: string): string | null {
  if (!text.trim()) return null;
  if (
    /\b(hai|hain|kya|chahiye|ji|accha|acha|nahi|nahin|theek|bilkul|dikhao|dekhna|kitna|aaj|kal)\b/i.test(
      text,
    )
  ) {
    return "English → Hinglish";
  }
  return "English";
}

function scoreLead(insights: {
  product: string | null;
  budget: string | null;
  timeline: string | null;
  showroomInterest: boolean;
  visit: string | null;
}): { leadScore: number; leadStatus: LeadStatus } {
  let leadScore = 0;
  if (insights.product) leadScore += 20;
  if (insights.budget) leadScore += 20;
  if (insights.timeline) leadScore += 20;
  if (insights.showroomInterest) leadScore += 20;
  if (insights.visit) leadScore += 20;
  leadScore = Math.min(100, leadScore);
  const leadStatus: LeadStatus =
    leadScore >= 70 ? "HOT" : leadScore >= 40 ? "WARM" : "COLD";
  return { leadScore, leadStatus };
}

export function displayValue(value: string | null | undefined): string {
  return value && value.trim() ? value : UNKNOWN;
}

export function extractInsights(
  messages: TranscriptMessage[],
): ConversationInsights {
  const spoken = customerText(messages);
  const product = extractProduct(spoken);
  const occasion = extractOccasion(spoken);
  const budget = extractBudget(spoken);
  const timeline = extractTimeline(spoken);
  const visit = extractVisit(spoken);
  const showroomInterest = extractShowroomInterest(spoken);
  const customerName = extractName(spoken);
  const intent = extractIntent(spoken, Boolean(product));
  const sentiment = extractSentiment(spoken);
  const language = extractLanguage(spoken);
  const { leadScore, leadStatus } = scoreLead({
    product,
    budget,
    timeline,
    showroomInterest,
    visit,
  });

  return {
    customerName,
    product,
    occasion,
    budget,
    timeline,
    visit,
    showroomInterest,
    intent,
    sentiment,
    language,
    leadScore,
    leadStatus,
  };
}

function sentenceFromFacts(insights: ConversationInsights): string {
  const clauses: string[] = [];
  if (insights.product) {
    const product = insights.product.toLowerCase();
    const productPhrase = product.endsWith("s") ? product : `a ${product}`;
    let line = `Customer is interested in purchasing ${productPhrase}`;
    if (insights.occasion) line += ` for an upcoming ${insights.occasion.toLowerCase()}`;
    line += ".";
    clauses.push(line);
  }
  if (insights.budget) {
    clauses.push(`Budget identified is ${insights.budget}.`);
  }
  if (insights.timeline) {
    clauses.push(`Purchase timeline is ${insights.timeline}.`);
  }
  if (insights.visit) {
    clauses.push(
      `Customer expressed interest in visiting the showroom ${insights.visit}.`,
    );
  } else if (insights.showroomInterest) {
    clauses.push("Customer expressed interest in visiting the showroom.");
  }
  if (clauses.length === 0) {
    return "The conversation did not identify a specific product, budget or visit preference.";
  }
  return clauses.join(" ");
}

function nextAction(insights: ConversationInsights): string {
  if (insights.visit) {
    return "Schedule the showroom visit and have the sales team confirm the appointment.";
  }
  if (insights.showroomInterest) {
    return "Follow up to confirm a convenient showroom visit time.";
  }
  if (insights.product) {
    return "Have the sales team follow up with a curated selection based on the stated interest.";
  }
  return "Follow up to understand the customer's requirements in more detail.";
}

export function buildCallSummary(
  insights: ConversationInsights,
): CallSummary {
  return {
    customer: displayValue(insights.customerName),
    product: displayValue(insights.product),
    budget: displayValue(insights.budget),
    occasion: displayValue(insights.occasion),
    timeline: displayValue(insights.timeline),
    visit: displayValue(insights.visit),
    leadScore: `${insights.leadScore} / 100`,
    lead: insights.leadStatus,
    aiSummary: sentenceFromFacts(insights),
    nextAction: nextAction(insights),
  };
}

export function insightRows(insights: ConversationInsights) {
  return [
    { key: "product", label: "Product Interest", value: displayValue(insights.product) },
    { key: "occasion", label: "Occasion", value: displayValue(insights.occasion) },
    { key: "budget", label: "Budget", value: displayValue(insights.budget) },
    {
      key: "timeline",
      label: "Purchase Timeline",
      value: displayValue(insights.timeline),
    },
    {
      key: "visit",
      label: "Preferred Visit",
      value: displayValue(insights.visit),
    },
    { key: "intent", label: "Intent", value: displayValue(insights.intent) },
    { key: "sentiment", label: "Sentiment", value: displayValue(insights.sentiment) },
    {
      key: "leadScore",
      label: "Lead Score",
      value: `${insights.leadScore} / 100`,
    },
    {
      key: "leadStatus",
      label: "Lead Status",
      value: insights.leadStatus,
    },
  ] as const;
}

export { UNKNOWN };
