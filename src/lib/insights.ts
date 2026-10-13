import { detectPreferredLanguage } from "./language";
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
  purchaseIntent: boolean;
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
  एक: 1,
  दो: 2,
  तीन: 3,
  चार: 4,
  पांच: 5,
  पाँच: 5,
  छह: 6,
  सात: 7,
  आठ: 8,
  नौ: 9,
  दस: 10,
  बीस: 20,
  तीस: 30,
  चालीस: 40,
  पचास: 50,
  साठ: 60,
  सत्तर: 70,
  अस्सी: 80,
  नब्बे: 90,
};

const PRODUCTS: { pattern: RegExp; label: string }[] = [
  { pattern: /\bdiamond\s+rings?\b/i, label: "Diamond Ring" },
  { pattern: /\bsolitaire\s+rings?\b/i, label: "Solitaire Ring" },
  { pattern: /\bengagement\s+rings?\b/i, label: "Engagement Ring" },
  { pattern: /\bwedding\s+rings?\b/i, label: "Wedding Ring" },
  { pattern: /\bgold\s+rings?\b/i, label: "Gold Ring" },
  { pattern: /\bplatinum\s+rings?\b/i, label: "Platinum Ring" },
  { pattern: /\bbridal\s+sets?\b/i, label: "Bridal Set" },
  { pattern: /\bwedding\s+sets?\b|\bjewellery\s+sets?\b/i, label: "Wedding Set" },
  { pattern: /ब्राइडल\s*सेट|शादी\s*सेट|ब्याव\s*र[ोा]\s*सेट|लगन\s*र[ोा]\s*सेट/, label: "Bridal Set" },
  { pattern: /\bmangalsutras?\b|मंगलसूत्र/i, label: "Mangalsutra" },
  { pattern: /\bnecklaces?\b|हार|नेकलेस/i, label: "Necklace" },
  { pattern: /\bpendants?\b|पेंडेंट|लॉकेट/i, label: "Pendant" },
  { pattern: /\bearrings?\b|बालिय(?:ाँ|ां)|इयरिंग्स/i, label: "Earrings" },
  { pattern: /\bjhumkas?\b|झुमक[ेा]/i, label: "Jhumkas" },
  { pattern: /\bbangles?\b|कंगन|चूड़(?:ी|ियाँ|ियां)/i, label: "Bangles" },
  { pattern: /\bbracelets?\b|ब्रेसलेट/i, label: "Bracelet" },
  { pattern: /\bchains?\b|चैन|चेन/i, label: "Chain" },
  { pattern: /\bchokers?\b|चोकर/i, label: "Choker" },
  { pattern: /\bpayals?\b|\banklets?\b|पायल/i, label: "Payal" },
  { pattern: /\bnose\s+rings?\b|\bnaths?\b|नथ/i, label: "Nose Ring" },
  { pattern: /\bmaang\s+tikkas?\b|\btikkas?\b|मांग\s*टीका|टीका/i, label: "Maang Tikka" },
  { pattern: /\bgold\s+coins?\b|सोने\s*का\s*सिक्का/i, label: "Gold Coin" },
  { pattern: /जेवरा?त|जेवर|आभूषण|गहने/, label: "Jewellery" },
  { pattern: /\bdiamonds?\b|हीरा|हीरे/i, label: "Diamond Jewellery" },
  { pattern: /\bsilver\b|चांदी|चाँदी/i, label: "Silver Jewellery" },
  { pattern: /\bgold\b|सोना|सोने/i, label: "Gold Jewellery" },
  { pattern: /\brings?\b|अंगूठ(?:ी|ियाँ|ियां)/i, label: "Ring" },
];

const OCCASIONS: { pattern: RegExp; label: string }[] = [
  { pattern: /\banniversar(?:y|ies)\b|सालगिरह|एनिवर्सरी/i, label: "Anniversary" },
  { pattern: /\bengagement\b|सगाई/i, label: "Engagement" },
  { pattern: /\bwedding\b|\bmarriage\b|शादी|विवाह|ब्याव|लगन/i, label: "Wedding" },
  { pattern: /\bbirthday\b|जन्मदिन|बर्थडे/i, label: "Birthday" },
  { pattern: /\bdiwali\b|दिवाली/i, label: "Diwali" },
  { pattern: /\bakshaya\s+tritiya\b|अक्षय\s*तृतीया/i, label: "Akshaya Tritiya" },
  { pattern: /\bkarva\s+chauth\b|करवा\s*चौथ/i, label: "Karva Chauth" },
  { pattern: /\bvalentine/i, label: "Valentine's Day" },
  { pattern: /\breception\b|रिसेप्शन/i, label: "Reception" },
  { pattern: /\bgift(?:ing)?\b|तोहफा|भेंट|गिफ्ट/i, label: "Gifting" },
];

const NAME_STOP =
  /^(looking|interested|thinking|planning|calling|trying|here|there|good|fine|okay|ok)$/i;

const NAME_STOP_HI =
  /^(देख|देखना|चाहिए|बात|यहाँ|वहाँ|ठीक|अच्छा)$/;

type Hit = { start: number; end: number; label: string };

function customerText(messages: TranscriptMessage[]): string {
  return messages
    .filter((message) => message.speaker === "customer")
    .map((message) => message.text)
    .join(" ");
}

function parseNumberToken(token: string): number | null {
  const cleaned = token.replace(/,/g, "");
  if (/^\d+(?:\.\d+)?$/.test(cleaned)) return Number(cleaned);
  return WORD_NUMBERS[token.toLowerCase()] ?? WORD_NUMBERS[token] ?? null;
}

function formatInr(amount: number): string {
  const rounded = Math.round(amount);
  const str = String(rounded);
  if (str.length <= 3) return `₹${str}`;
  const lastThree = str.slice(-3);
  const rest = str.slice(0, -3).replace(/\B(?=(\d{2})+(?!\d))/g, ",");
  return `₹${rest},${lastThree}`;
}

function withGlobal(pattern: RegExp): RegExp {
  const flags = pattern.flags.includes("g") ? pattern.flags : `${pattern.flags}g`;
  return new RegExp(pattern.source, flags);
}

function collectHits(
  text: string,
  rules: { pattern: RegExp; label: string }[],
): Hit[] {
  const hits: Hit[] = [];
  for (const rule of rules) {
    for (const match of text.matchAll(withGlobal(rule.pattern))) {
      const start = match.index ?? 0;
      hits.push({ start, end: start + match[0].length, label: rule.label });
    }
  }
  return hits.filter(
    (hit) =>
      !hits.some(
        (other) =>
          other !== hit &&
          other.start <= hit.start &&
          other.end >= hit.end &&
          other.end - other.start > hit.end - hit.start,
      ),
  );
}

function lastLabel(
  text: string,
  rules: { pattern: RegExp; label: string }[],
): string | null {
  const hits = collectHits(text, rules).sort((a, b) => a.start - b.start);
  return hits.at(-1)?.label ?? null;
}

function extractBudget(text: string): string | null {
  const rules: { pattern: RegExp; label: string }[] = [];
  const lakh =
    /(?:₹|rs\.?|rupees?|रुपये|रुपए)?\s*([a-zA-Z\u0900-\u097F]+|\d+(?:\.\d+)?)\s*(?:lakhs?\b|लाख)/gi;
  for (const match of text.matchAll(lakh)) {
    const value = parseNumberToken(match[1]);
    if (!value) continue;
    rules.push({
      pattern: new RegExp(escapeRegExp(match[0]), "i"),
      label: formatInr(value * 100000),
    });
  }

  const thousand =
    /(?:₹|rs\.?|rupees?|रुपये|रुपए)?\s*([a-zA-Z\u0900-\u097F]+|\d+(?:\.\d+)?)\s*(?:thousand\b|k\b|हज़ार|हजार)/gi;
  for (const match of text.matchAll(thousand)) {
    const value = parseNumberToken(match[1]);
    if (!value) continue;
    rules.push({
      pattern: new RegExp(escapeRegExp(match[0]), "i"),
      label: formatInr(value * 1000),
    });
  }

  const explicit =
    /(?:₹|rs\.?|rupees?)\s*([\d,]{4,})|\b(\d{1,2},\d{2},\d{3})\b|\b(\d{5,7})\b/gi;
  for (const match of text.matchAll(explicit)) {
    const raw = match[1] ?? match[2] ?? match[3];
    const value = Number(raw.replace(/,/g, ""));
    if (value < 1000) continue;
    rules.push({
      pattern: new RegExp(escapeRegExp(match[0]), "i"),
      label: formatInr(value),
    });
  }

  return lastLabel(text, rules);
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function extractTimeline(text: string): string | null {
  const rules: { pattern: RegExp; label: string }[] = [
    {
      pattern: /\b(?:in\s+the\s+next\s+|next\s+|within\s+|in\s+)?(?:two|2)\s+weeks?\b/i,
      label: "2–3 Weeks",
    },
    { pattern: /\bnext\s+month\b|अगले\s*महीने|अगला\s*महीनो/i, label: "Next Month" },
    { pattern: /\bthis\s+month\b|इस\s*महीने|इण\s*महीने/i, label: "This Month" },
    { pattern: /\bnext\s+week\b|अगले\s*हफ्ते|अगला\s*हफ्तो/i, label: "Next Week" },
    { pattern: /\bthis\s+week\b|इस\s*हफ्ते|इण\s*हफ्ते/i, label: "This Week" },
    {
      pattern: /\bas soon as possible\b|\basap\b|जल्दी\s*(?:लेना|खरीदना)|अभी\s*(?:लेना|खरीदना|लेवो)/i,
      label: "As soon as possible",
    },
  ];

  const range =
    /(?:within\s+)?([a-z]+|\d+)\s*(?:-|–|to)\s*([a-z]+|\d+)\s*(days?|weeks?|months?)/gi;
  for (const match of text.matchAll(range)) {
    const a = parseNumberToken(match[1]);
    const b = parseNumberToken(match[2]);
    if (!a || !b) continue;
    const unit = match[3].replace(/s$/, "");
    const plural = `${unit}${b === 1 ? "" : "s"}`;
    rules.push({
      pattern: new RegExp(escapeRegExp(match[0]), "i"),
      label: `${a}–${b} ${plural.charAt(0).toUpperCase()}${plural.slice(1)}`,
    });
  }

  const within = /(?:within|in)\s+([a-z]+|\d+)\s*(days?|weeks?|months?)/gi;
  for (const match of text.matchAll(within)) {
    if (/\b(?:two|2)\s+weeks?\b/i.test(match[0])) continue;
    const value = parseNumberToken(match[1]);
    if (!value) continue;
    const unit = match[2];
    rules.push({
      pattern: new RegExp(escapeRegExp(match[0]), "i"),
      label: `${value} ${unit.charAt(0).toUpperCase()}${unit.slice(1)}`,
    });
  }

  return lastLabel(text, rules);
}

function titleCase(value: string): string {
  return value.replace(/\b\w/g, (char) => char.toUpperCase());
}

function extractVisit(text: string): string | null {
  const dayPattern =
    /\b(monday|tuesday|wednesday|thursday|friday|saturday|sunday|tomorrow|this weekend|weekend|सोमवार|मंगलवार|बुधवार|गुरुवार|शुक्रवार|शनिवार|रविवार|कल|परसों|वीकेंड)(?:\s+(morning|afternoon|evening|night|सुबह|दोपहर|शाम|रात))?\b/gi;
  let day: { label: string; period?: string } | null = null;
  for (const match of text.matchAll(dayPattern)) {
    day = { label: titleCase(match[1]), period: match[2] };
  }

  const timePattern = /\b(\d{1,2})(?::(\d{2}))?\s*(am|pm)\b/gi;
  let time: string | null = null;
  for (const match of text.matchAll(timePattern)) {
    const minutes = match[2] ? `:${match[2]}` : "";
    time = `${match[1]}${minutes} ${match[3].toUpperCase()}`;
  }

  let period: string | null = day?.period ? titleCase(day.period) : null;
  if (!period) {
    const periodPattern = /\b(morning|afternoon|evening|night|सुबह|दोपहर|शाम|रात)\b/gi;
    for (const match of text.matchAll(periodPattern)) period = titleCase(match[1]);
  }

  if (!day && !time && !period) return null;
  const parts: string[] = [];
  if (day) parts.push(day.label);
  if (time) parts.push(time);
  else if (period) parts.push(period);
  const callback =
    /\b(callback|call back|phone back|वापस\s*कॉल|फोन\s*करज[ोे]|कॉलबैक)\b/i.test(
      text,
    );
  if (callback) parts.unshift("Callback");
  return parts.join(" · ");
}

function extractShowroomInterest(text: string): boolean {
  return /\b(showroom|appointment|visit|come in|drop by|see (?:it |them )?in person|come over)\b|शोरूम|दुकान|आवूंला|आऊँगा|आउंगा|मिलण/i.test(
    text,
  );
}

function extractName(text: string): string | null {
  const matches = text.matchAll(
    /\b(?:my name is|this is|i am|i['’]m|मेरा नाम|म्हारो नाम)\s+([A-Za-z\u0900-\u097F]+(?:\s+[A-Za-z\u0900-\u097F]+){0,2})\b/gi,
  );
  let name: string | null = null;
  for (const match of matches) {
    const parts = match[1].trim().split(/\s+/);
    if (parts.some((part) => NAME_STOP.test(part) || NAME_STOP_HI.test(part))) {
      continue;
    }
    if (
      !parts.every(
        (part) => /^[A-Z][a-z]+$/.test(part) || /^[\u0900-\u097F]{2,}$/.test(part),
      )
    ) {
      continue;
    }
    name = parts.join(" ");
  }
  return name;
}

function extractPurchaseIntent(text: string): boolean {
  const cleaned = text.replace(/\bnot interested\b|दिलचस्पी नहीं|कोनी चाहिए/gi, " ");
  return /\b(want to buy|looking|interested|purchase|purchasing|buy)\b|लेना है|खरीदना|चाहिए|चाहिये|लेवो है|लियो है|जोइजै/i.test(
    cleaned,
  );
}

function extractSentiment(text: string): string | null {
  if (!text.trim()) return null;
  const negative =
    /\b(expensive|costly|too much|not sure|maybe later|not interested|no thanks|cheap|don't like|dont like)\b|महंगा|महँगा|बाद में|दिलचस्पी नहीं|कोनी/gi;
  const positive =
    /\b(thank|thanks|perfect|great|love|wonderful|sure|interested|sounds good|that works|beautiful|nice|happy|good)\b|धन्यवाद|बहुत अच्छा|सुंदर|पसंद|घणी खुशी|ठीक है/gi;
  const lastNegative = [...text.matchAll(negative)].at(-1);
  const lastPositive = [...text.matchAll(positive)].at(-1);
  if (!lastNegative && !lastPositive) return null;
  if (lastNegative && lastPositive) {
    return (lastNegative.index ?? 0) > (lastPositive.index ?? 0)
      ? "Negative"
      : "Positive";
  }
  return lastNegative ? "Negative" : "Positive";
}

function extractLanguage(messages: TranscriptMessage[]): string | null {
  const spoken = messages
    .filter((message) => message.speaker === "customer")
    .map((message) => message.text);
  const detected = detectPreferredLanguage(spoken);
  if (detected.confidence !== "high" || !detected.language) return null;
  return detected.language;
}

function scoreLead(insights: {
  product: string | null;
  budget: string | null;
  timeline: string | null;
  purchaseIntent: boolean;
  showroomInterest: boolean;
}): { leadScore: number; leadStatus: LeadStatus } {
  let leadScore = 0;
  if (insights.product) leadScore += 20;
  if (insights.budget) leadScore += 20;
  if (insights.timeline) leadScore += 20;
  if (insights.purchaseIntent) leadScore += 20;
  if (insights.showroomInterest) leadScore += 20;
  leadScore = Math.min(100, leadScore);
  const leadStatus: LeadStatus =
    leadScore >= 70 ? "HOT" : leadScore >= 40 ? "WARM" : "COLD";
  return { leadScore, leadStatus };
}

export function displayValue(value: string | null | undefined): string {
  return value && value.trim() ? value : UNKNOWN;
}

export function formatLeadStatus(status: LeadStatus): string {
  if (status === "HOT") return "🔥 HOT LEAD";
  if (status === "WARM") return "WARM LEAD";
  return "COLD LEAD";
}

export function extractInsights(
  messages: TranscriptMessage[],
): ConversationInsights {
  const spoken = customerText(messages);
  const product = lastLabel(spoken, PRODUCTS);
  const occasion = lastLabel(spoken, OCCASIONS);
  const budget = extractBudget(spoken);
  const timeline = extractTimeline(spoken);
  const visit = extractVisit(spoken);
  const showroomInterest = extractShowroomInterest(spoken);
  const purchaseIntent = extractPurchaseIntent(spoken);
  const customerName = extractName(spoken);
  const sentiment = extractSentiment(spoken);
  const language = extractLanguage(messages);
  const { leadScore, leadStatus } = scoreLead({
    product,
    budget,
    timeline,
    purchaseIntent,
    showroomInterest,
  });

  return {
    customerName,
    product,
    occasion,
    budget,
    timeline,
    visit,
    showroomInterest,
    purchaseIntent,
    intent: purchaseIntent ? "Purchase" : null,
    sentiment,
    language,
    leadScore,
    leadStatus,
  };
}

function articleFor(label: string): string {
  return /^[aeiou]/i.test(label) ? "an" : "a";
}

function productPhrase(label: string): string {
  const lower = label.toLowerCase();
  if (
    lower.endsWith("jewellery") ||
    /\b(earrings|bangles|jhumkas)\b/.test(lower)
  ) {
    return lower;
  }
  return `${articleFor(lower)} ${lower}`;
}

function timelinePhrase(timeline: string): string {
  if (/^(next|this|as soon)/i.test(timeline)) return timeline.toLowerCase();
  return `within ${timeline.toLowerCase()}`;
}

function sentenceFromFacts(insights: ConversationInsights): string {
  const sentences: string[] = [];

  if (insights.product && insights.occasion) {
    sentences.push(
      `Customer is interested in ${productPhrase(insights.product)} for ${articleFor(insights.occasion)} ${insights.occasion.toLowerCase()}.`,
    );
  } else if (insights.product) {
    sentences.push(
      `Customer is interested in ${productPhrase(insights.product)}.`,
    );
  } else if (insights.occasion) {
    sentences.push(
      `The customer mentioned ${articleFor(insights.occasion)} ${insights.occasion.toLowerCase()}.`,
    );
  }

  const details: string[] = [];
  if (insights.budget) {
    details.push(`indicated a budget of approximately ${insights.budget}`);
  }
  if (insights.timeline) {
    details.push(`plans to purchase ${timelinePhrase(insights.timeline)}`);
  }
  if (details.length > 0) {
    sentences.push(`The customer ${details.join(" and ")}.`);
  }

  if (insights.showroomInterest && insights.visit) {
    sentences.push(
      `The customer expressed interest in visiting the showroom and indicated ${insights.visit} as a preferred time.`,
    );
  } else if (insights.showroomInterest) {
    sentences.push("The customer expressed interest in visiting the showroom.");
  } else if (insights.visit) {
    sentences.push(
      `The customer indicated ${insights.visit} as a preferred time.`,
    );
  }

  if (sentences.length === 0) {
    return "The conversation did not include enough detail to identify a product, budget, timeline, or visit preference.";
  }
  return sentences.join(" ");
}

export function buildCallSummary(
  insights: ConversationInsights,
  duration: string,
): CallSummary {
  return {
    customer: insights.customerName?.trim() || "Guest Customer",
    duration,
    language: displayValue(insights.language),
    product: displayValue(insights.product),
    occasion: displayValue(insights.occasion),
    budget: displayValue(insights.budget),
    timeline: displayValue(insights.timeline),
    visit: displayValue(insights.visit),
    intent: displayValue(insights.intent),
    leadScore: `${insights.leadScore} / 100`,
    lead: formatLeadStatus(insights.leadStatus),
    aiSummary: sentenceFromFacts(insights),
  };
}

export function insightRows(insights: ConversationInsights) {
  return [
    {
      key: "language",
      label: "Preferred language",
      value: displayValue(insights.language),
    },
    {
      key: "product",
      label: "Jewellery category",
      value: displayValue(insights.product),
    },
    { key: "occasion", label: "Occasion", value: displayValue(insights.occasion) },
    { key: "budget", label: "Budget", value: displayValue(insights.budget) },
    {
      key: "timeline",
      label: "Purchase Timeline",
      value: displayValue(insights.timeline),
    },
    {
      key: "visit",
      label: "Preferred visit or callback",
      value: displayValue(insights.visit),
    },
    { key: "intent", label: "Intent", value: displayValue(insights.intent) },
    {
      key: "sentiment",
      label: "Sentiment",
      value: displayValue(insights.sentiment),
    },
    {
      key: "leadScore",
      label: "Lead Score",
      value: `${insights.leadScore} / 100`,
    },
    {
      key: "leadStatus",
      label: "Lead Status",
      value: formatLeadStatus(insights.leadStatus),
    },
  ] as const;
}

export { UNKNOWN };
