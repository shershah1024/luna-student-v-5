function generalGuardrails(level, language) {
  const L = (level || '').toUpperCase();
  const lang = language || 'the target language';
  switch (L) {
    case 'A1':
      return `CEFR ${L} (${lang}) guardrails:\n- Use very common words; simple present; short, simple sentences.\n- Avoid subordinate clauses and complex tenses.\n- Keep topics concrete and familiar.`;
    case 'A2':
      return `CEFR ${L} (${lang}) guardrails:\n- Simple connected sentences; present/past with common time markers.\n- Avoid advanced idioms and dense academic vocabulary.\n- Everyday contexts only.`;
    case 'B1':
      return `CEFR ${L} (${lang}) guardrails:\n- Paragraph-level organization with basic connectors.\n- Allow simple subordination; keep vocabulary general.\n- Topics of familiar interest and opinions with reasons.`;
    case 'B2':
      return `CEFR ${L} (${lang}) guardrails:\n- Clear paragraphing and varied connectors; argument/explanation acceptable.\n- Some complex sentences okay; maintain clarity and precision.\n- General-interest topics, light analysis.`;
    case 'C1':
      return `CEFR ${L} (${lang}) guardrails:\n- Nuanced vocabulary; complex structures used accurately.\n- Cohesive, well-structured paragraphs.\n- Abstract/complex topics with supported points.`;
    case 'C2':
      return `CEFR ${L} (${lang}) guardrails:\n- Sophisticated style; wide lexical range; high accuracy.\n- Highly cohesive and precise.\n- Complex/abstract topics with nuanced argumentation.`;
    default:
      return `Align content to CEFR ${level} expectations in ${lang}.`;
  }
}

function writingGuardrails(level, language) {
  const base = generalGuardrails(level, language);
  switch ((level || '').toUpperCase()) {
    case 'A1': return base + '\n- Target length: ~40–80 words.';
    case 'A2': return base + '\n- Target length: ~80–120 words.';
    case 'B1': return base + '\n- Target length: ~120–180 words.';
    case 'B2': return base + '\n- Target length: ~180–250 words.';
    case 'C1': return base + '\n- Target length: ~250–350 words.';
    case 'C2': return base + '\n- Target length: ~350–500 words.';
    default: return base;
  }
}

function conversationGuardrails(level, language) {
  const base = generalGuardrails(level, language);
  switch ((level || '').toUpperCase()) {
    case 'A1': return base + '\n- Exchanges are short and formulaic; simple turns and prompts.';
    case 'A2': return base + '\n- Short connected turns; practical topics and simple requests.';
    case 'B1': return base + '\n- Extended turns with reasons/examples; straightforward connectors.';
    case 'B2': return base + '\n- Coherent turns; some nuance and contrast; appropriate register.';
    default: return base;
  }
}

function storytellingGuardrails(level, language) {
  const base = generalGuardrails(level, language);
  return base + '\n- Keep narrative devices appropriate to the level.';
}

function debateGuardrails(level, language) {
  const base = generalGuardrails(level, language);
  return base + '\n- Ensure claims/rebuttals use language complexity suitable for the level.';
}

function vocabularyGuardrails(level, language) {
  const L = (level || '').toUpperCase();
  switch (L) {
    case 'A1': return 'Choose very high-frequency words; avoid low-frequency and abstract terms.';
    case 'A2': return 'Choose common, everyday words; limited abstraction; avoid technical terms.';
    case 'B1': return 'Choose general-interest words; basic abstract terms acceptable.';
    case 'B2': return 'Choose wider general vocabulary; avoid highly specialized jargon.';
    default: return 'Ensure words match the CEFR level and remain teachable.';
  }
}

module.exports = { generalGuardrails, writingGuardrails, conversationGuardrails, storytellingGuardrails, debateGuardrails, vocabularyGuardrails };

