export type LanguageTestScenario = {
  id: string;
  title: string;
  language: string;
  speak: string;
  romanized?: string;
  expect: string;
};

export const LANGUAGE_TEST_SCENARIOS: LanguageTestScenario[] = [
  {
    id: "gold-bangles",
    title: "Gold bangles",
    language: "Marwari",
    speak: "राम राम सा, म्हनै सोने रा कंगन जोइजै है। थारे शोरूम में डिजाइन दिखेगा के?",
    romanized: "Ram ram sa, mhane sone ra kangan joijai hai. Thare showroom mein design dikhega ke?",
    expect:
      "Maya should greet in Marwari and ask one follow-up about design, occasion, or budget. She must not quote a price or stock figure.",
  },
  {
    id: "wedding",
    title: "Wedding jewellery",
    language: "Marwari",
    speak: "म्हारी बेटी रो ब्याव है, पूरा ब्राइडल सेट चाहिये। सोना-हीरा दोनों चलै।",
    romanized:
      "Mhari beti ro byaav hai, poora bridal set chahiye. Sona-heera dono chalai.",
    expect:
      "Treat this as wedding / bridal jewellery. Ask one question, such as timeline or whether they want to visit the Kalyan showroom.",
  },
  {
    id: "budget-making",
    title: "Budget and making charges",
    language: "Marwari",
    speak: "म्हारो बजट पचास हजार तक है। मेकिंग चार्ज कित्तो लागै सोने रे कंगन पे?",
    romanized:
      "Mharo budget pachaas hazaar tak hai. Making charge kitto laagai sone re kangan pe?",
    expect:
      "Capture the ₹50,000 budget if transcribed. Do not invent a making-charge number. Say the showroom team can confirm current charges.",
  },
  {
    id: "mixed",
    title: "Hindi and Marwari mixed",
    language: "Marwari / Hindi",
    speak: "जी, कंगन देखना है, थारो making charge कितनो है? Weekend पे शोरूम आवूंला।",
    romanized:
      "Ji, kangan dekhna hai, tharo making charge kitno hai? Weekend pe showroom aavunla.",
    expect:
      "Stay in mixed Hindi-Marwari. Do not recast the whole reply as formal Hindi. Visit intent may appear in call notes if the transcript includes it.",
  },
  {
    id: "switch",
    title: "Switch from Marwari to Hindi",
    language: "Marwari then Hindi",
    speak: "First say: राम राम सा, म्हनै सोने रा हार जोइजै है। Then say: नहीं, हिन्दी में बात करिये।",
    expect:
      "Start in Marwari, then follow the switch into Hindi for later turns. The live log should keep each turn's original text.",
  },
  {
    id: "unclear",
    title: "Unclear speech",
    language: "Uncertain",
    speak: "Speak very softly, mix fragments, or give a one-word sound that is not clearly English, Hindi, or Marwari.",
    expect:
      "Maya should ask which language they prefer. The call log should show Language unclear rather than a guessed Marwari label.",
  },
];
