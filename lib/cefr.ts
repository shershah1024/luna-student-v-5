export function generalGuardrails(level?: string, language?: string) {
  const L = (level || '').toUpperCase();
  const lang = language || 'the target language';
  switch (L) {
    case 'A1':
      return `CEFR ${L} (${lang}) guardrails:
- Use very common words; simple present; short, simple sentences.
- Avoid subordinate clauses and complex tenses.
- Keep topics concrete and familiar.`;
    case 'A2':
      return `CEFR ${L} (${lang}) guardrails:
- Simple connected sentences; present/past with common time markers.
- Avoid advanced idioms and dense academic vocabulary.
- Everyday contexts only.`;
    case 'B1':
      return `CEFR ${L} (${lang}) guardrails:
- Paragraph-level organization with basic connectors.
- Allow simple subordination; keep vocabulary general.
- Topics of familiar interest and opinions with reasons.`;
    case 'B2':
      return `CEFR ${L} (${lang}) guardrails:
- Clear paragraphing and varied connectors; argument/explanation acceptable.
- Some complex sentences okay; maintain clarity and precision.
- General-interest topics, light analysis.`;
    case 'C1':
      return `CEFR ${L} (${lang}) guardrails:
- Nuanced vocabulary; complex structures used accurately.
- Cohesive, well-structured paragraphs.
- Abstract/complex topics with supported points.`;
    case 'C2':
      return `CEFR ${L} (${lang}) guardrails:
- Sophisticated style; wide lexical range; high accuracy.
- Highly cohesive and precise.
- Complex/abstract topics with nuanced argumentation.`;
    default:
      return `Align content to CEFR ${level} expectations in ${lang}.`;
  }
}

export function writingGuardrails(level?: string, language?: string) {
  const base = generalGuardrails(level, language);
  switch ((level || '').toUpperCase()) {
    case 'A1':
      return base + '\n- Target length: ~40–80 words.';
    case 'A2':
      return base + '\n- Target length: ~80–120 words.';
    case 'B1':
      return base + '\n- Target length: ~120–180 words.';
    case 'B2':
      return base + '\n- Target length: ~180–250 words.';
    case 'C1':
      return base + '\n- Target length: ~250–350 words.';
    case 'C2':
      return base + '\n- Target length: ~350–500 words.';
    default:
      return base;
  }
}

export function conversationGuardrails(level?: string, language?: string) {
  const base = generalGuardrails(level, language);
  switch ((level || '').toUpperCase()) {
    case 'A1':
      return base + '\n- Exchanges are short and formulaic; simple turns and prompts.';
    case 'A2':
      return base + '\n- Short connected turns; practical topics and simple requests.';
    case 'B1':
      return base + '\n- Extended turns with reasons/examples; straightforward connectors.';
    case 'B2':
      return base + '\n- Coherent turns; some nuance and contrast; appropriate register.';
    default:
      return base;
  }
}

export function storytellingGuardrails(level?: string, language?: string) {
  const base = generalGuardrails(level, language);
  return base + '\n- Keep narrative devices appropriate to the level.';
}

export function debateGuardrails(level?: string, language?: string) {
  const base = generalGuardrails(level, language);
  return base + '\n- Ensure claims/rebuttals use language complexity suitable for the level.';
}

export function vocabularyGuardrails(level?: string, language?: string) {
  const L = (level || '').toUpperCase();
  switch (L) {
    case 'A1':
      return 'Choose very high-frequency words; avoid low-frequency and abstract terms.';
    case 'A2':
      return 'Choose common, everyday words; limited abstraction; avoid technical terms.';
    case 'B1':
      return 'Choose general-interest words; basic abstract terms acceptable.';
    case 'B2':
      return 'Choose wider general vocabulary; avoid highly specialized jargon.';
    default:
      return 'Ensure words match the CEFR level and remain teachable.';
  }
}

