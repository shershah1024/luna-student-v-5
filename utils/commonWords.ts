// Language-agnostic common words filter that supports multiple languages
// Filters out common words like articles, pronouns, conjunctions, prepositions, etc.

// Common German words to skip when generating definitions
const GERMAN_COMMON_WORDS = new Set([
  // Articles
  'der', 'die', 'das', 'den', 'dem', 'des', 'ein', 'eine', 'einen', 'einem', 'eines', 'einer',
  
  // Personal pronouns
  'ich', 'du', 'er', 'sie', 'es', 'wir', 'ihr', 'sie', 
  'mich', 'dich', 'ihn', 'sie', 'es', 'uns', 'euch', 'sie',
  'mir', 'dir', 'ihm', 'ihr', 'uns', 'euch', 'ihnen',
  
  // Possessive pronouns
  'mein', 'meine', 'meiner', 'meines', 'meinem', 'meinen',
  'dein', 'deine', 'deiner', 'deines', 'deinem', 'deinen',
  'sein', 'seine', 'seiner', 'seines', 'seinem', 'seinen',
  'ihr', 'ihre', 'ihrer', 'ihres', 'ihrem', 'ihren',
  'unser', 'unsere', 'unserer', 'unseres', 'unserem', 'unseren',
  'euer', 'eure', 'eurer', 'eures', 'eurem', 'euren',
  
  // Conjunctions
  'und', 'oder', 'aber', 'denn', 'weil', 'dass', 'wenn', 'als', 'ob', 'wie',
  'sondern', 'sowie', 'sowohl', 'weder', 'noch', 'entweder', 'bevor', 'nachdem',
  'während', 'bis', 'seit', 'seitdem', 'sobald', 'solange', 'falls', 'obwohl',
  
  // Common verbs (conjugated forms)
  'ist', 'sind', 'war', 'waren', 'bin', 'bist', 'seid', 'warst', 'wart',
  'hat', 'haben', 'hatte', 'hatten', 'habe', 'hast', 'habt', 'hattest', 'hattet',
  'wird', 'werden', 'wurde', 'wurden', 'werde', 'wirst', 'werdet', 'wurdest', 'wurdet',
  'kann', 'können', 'konnte', 'konnten', 'kannst', 'könnt', 'konntest', 'konntet',
  'muss', 'müssen', 'musste', 'mussten', 'musst', 'müsst', 'musstest', 'musstet',
  'will', 'wollen', 'wollte', 'wollten', 'willst', 'wollt', 'wolltest', 'wolltet',
  'soll', 'sollen', 'sollte', 'sollten', 'sollst', 'sollt', 'solltest', 'solltet',
  'darf', 'dürfen', 'durfte', 'durften', 'darfst', 'dürft', 'durftest', 'durftet',
  'mag', 'mögen', 'mochte', 'mochten', 'magst', 'mögt', 'mochtest', 'mochtet',
  
  // Prepositions
  'auf', 'in', 'an', 'von', 'mit', 'zu', 'bei', 'nach', 'für', 'über', 'unter',
  'vor', 'hinter', 'neben', 'zwischen', 'durch', 'ohne', 'gegen', 'um', 'aus',
  'seit', 'ab', 'bis', 'während', 'trotz', 'wegen', 'statt', 'außer',
  
  // Adverbs and particles
  'nicht', 'kein', 'keine', 'keinen', 'keinem', 'keiner', 'keines',
  'ja', 'nein', 'doch', 'sehr', 'gut', 'auch', 'noch', 'schon', 'nur', 'mal',
  'ganz', 'gar', 'etwa', 'viel', 'viele', 'wenig', 'wenige', 'mehr', 'weniger',
  'immer', 'nie', 'niemals', 'oft', 'manchmal', 'selten', 'heute', 'gestern',
  'morgen', 'jetzt', 'dann', 'danach', 'vorher', 'nachher', 'bald', 'gleich',
  'hier', 'da', 'dort', 'wo', 'wohin', 'woher', 'überall', 'nirgends',
  
  // Question words
  'was', 'wer', 'wen', 'wem', 'wessen', 'wo', 'wohin', 'woher', 'wann',
  'warum', 'wie', 'welche', 'welcher', 'welches', 'welchem', 'welchen',
  
  // Numbers
  'ein', 'zwei', 'drei', 'vier', 'fünf', 'sechs', 'sieben', 'acht', 'neun', 'zehn',
  'erste', 'zweite', 'dritte', 'vierte', 'fünfte',
  
  // Other common words
  'man', 'sich', 'so', 'alle', 'alles', 'nichts', 'etwas', 'jemand', 'niemand',
  'dieser', 'diese', 'dieses', 'diesen', 'diesem', 'jener', 'jene', 'jenes',
  'machen', 'gehen', 'kommen', 'sagen', 'geben', 'nehmen', 'sehen', 'hören',
]);

// Common English words to skip
const ENGLISH_COMMON_WORDS = new Set([
  // Articles
  'a', 'an', 'the',
  
  // Personal pronouns
  'i', 'me', 'my', 'mine', 'myself',
  'you', 'your', 'yours', 'yourself', 'yourselves',
  'he', 'him', 'his', 'himself',
  'she', 'her', 'hers', 'herself',
  'it', 'its', 'itself',
  'we', 'us', 'our', 'ours', 'ourselves',
  'they', 'them', 'their', 'theirs', 'themselves',
  
  // Common verbs
  'is', 'am', 'are', 'was', 'were', 'be', 'been', 'being',
  'have', 'has', 'had', 'having',
  'do', 'does', 'did', 'doing',
  'will', 'would', 'shall', 'should', 'could', 'can',
  'may', 'might', 'must', 'ought',
  'make', 'made', 'making',
  'go', 'went', 'gone', 'going',
  'get', 'got', 'getting',
  'say', 'said', 'saying',
  'see', 'saw', 'seen', 'seeing',
  'know', 'knew', 'known', 'knowing',
  'think', 'thought', 'thinking',
  'take', 'took', 'taken', 'taking',
  'come', 'came', 'coming',
  'want', 'wanted', 'wanting',
  'use', 'used', 'using',
  
  // Conjunctions
  'and', 'or', 'but', 'if', 'when', 'where', 'while', 'because', 'since',
  'although', 'though', 'unless', 'until', 'whether', 'whereas', 'however',
  'therefore', 'moreover', 'furthermore', 'nevertheless', 'otherwise',
  
  // Prepositions
  'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by', 'from', 'about',
  'into', 'through', 'during', 'before', 'after', 'above', 'below',
  'between', 'under', 'over', 'among', 'around', 'behind', 'beside',
  'beneath', 'beyond', 'inside', 'outside', 'without', 'within',
  
  // Common adverbs
  'not', 'no', 'yes', 'very', 'too', 'also', 'just', 'only', 'even',
  'still', 'yet', 'already', 'now', 'then', 'here', 'there', 'where',
  'when', 'why', 'how', 'all', 'both', 'each', 'few', 'more', 'most',
  'other', 'some', 'such', 'any', 'enough', 'much', 'many', 'little',
  
  // Question words
  'what', 'which', 'who', 'whom', 'whose', 'why', 'how', 'when', 'where',
  
  // Common adjectives
  'good', 'bad', 'new', 'old', 'first', 'last', 'long', 'short', 'big',
  'small', 'large', 'great', 'little', 'own', 'other', 'same', 'different',
  
  // Numbers
  'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten',
  'first', 'second', 'third', 'fourth', 'fifth',
  
  // Other common words
  'this', 'that', 'these', 'those', 'there', 'here', 'then', 'than',
  'so', 'as', 'up', 'down', 'out', 'off', 'away', 'again', 'back',
]);

// Common Spanish words to skip
const SPANISH_COMMON_WORDS = new Set([
  // Articles
  'el', 'la', 'los', 'las', 'un', 'una', 'unos', 'unas',
  
  // Personal pronouns
  'yo', 'tú', 'él', 'ella', 'nosotros', 'nosotras', 'vosotros', 'vosotras', 'ellos', 'ellas',
  'me', 'te', 'le', 'lo', 'la', 'nos', 'os', 'les', 'los', 'las',
  'mí', 'ti', 'sí', 'conmigo', 'contigo', 'consigo',
  
  // Possessive pronouns
  'mi', 'mis', 'tu', 'tus', 'su', 'sus', 'nuestro', 'nuestra', 'nuestros', 'nuestras',
  'vuestro', 'vuestra', 'vuestros', 'vuestras', 'mío', 'mía', 'míos', 'mías',
  'tuyo', 'tuya', 'tuyos', 'tuyas', 'suyo', 'suya', 'suyos', 'suyas',
  
  // Common verbs
  'ser', 'estar', 'haber', 'tener', 'hacer', 'poder', 'decir', 'ir', 'ver', 'dar',
  'soy', 'eres', 'es', 'somos', 'sois', 'son',
  'estoy', 'estás', 'está', 'estamos', 'estáis', 'están',
  'he', 'has', 'ha', 'hemos', 'habéis', 'han',
  'tengo', 'tienes', 'tiene', 'tenemos', 'tenéis', 'tienen',
  
  // Conjunctions
  'y', 'e', 'o', 'u', 'pero', 'mas', 'sino', 'ni', 'que', 'si', 'como',
  'cuando', 'donde', 'aunque', 'porque', 'pues', 'ya', 'mientras',
  
  // Prepositions
  'a', 'ante', 'bajo', 'con', 'contra', 'de', 'desde', 'durante', 'en', 'entre',
  'hacia', 'hasta', 'mediante', 'para', 'por', 'según', 'sin', 'sobre', 'tras',
  
  // Common adverbs
  'no', 'sí', 'muy', 'más', 'menos', 'tan', 'tanto', 'mucho', 'poco',
  'bien', 'mal', 'aquí', 'ahí', 'allí', 'ahora', 'luego', 'después',
  'antes', 'siempre', 'nunca', 'jamás', 'también', 'tampoco',
]);

// Common French words to skip
const FRENCH_COMMON_WORDS = new Set([
  // Articles
  'le', 'la', 'les', 'un', 'une', 'des', 'du', 'de', "d'",
  
  // Personal pronouns
  'je', 'tu', 'il', 'elle', 'nous', 'vous', 'ils', 'elles',
  'me', 'te', 'se', 'le', 'la', 'les', 'lui', 'leur',
  'moi', 'toi', 'soi', 'eux',
  
  // Possessive pronouns
  'mon', 'ma', 'mes', 'ton', 'ta', 'tes', 'son', 'sa', 'ses',
  'notre', 'nos', 'votre', 'vos', 'leur', 'leurs',
  
  // Common verbs
  'être', 'avoir', 'faire', 'dire', 'aller', 'voir', 'savoir', 'pouvoir',
  'suis', 'es', 'est', 'sommes', 'êtes', 'sont',
  'ai', 'as', 'a', 'avons', 'avez', 'ont',
  'fais', 'fait', 'faisons', 'faites', 'font',
  
  // Conjunctions
  'et', 'ou', 'mais', 'donc', 'or', 'ni', 'car', 'que', 'si',
  'quand', 'comme', 'lorsque', 'puisque', 'quoique',
  
  // Prepositions
  'à', 'de', 'dans', 'sur', 'sous', 'avec', 'pour', 'par', 'sans',
  'vers', 'chez', 'entre', 'depuis', 'pendant', 'avant', 'après',
  
  // Common adverbs
  'ne', 'pas', 'plus', 'très', 'bien', 'mal', 'peu', 'beaucoup',
  'trop', 'assez', 'ici', 'là', 'où', 'maintenant', 'toujours',
  'jamais', 'souvent', 'parfois', 'encore', 'déjà', 'aussi',
]);

// Map of language codes to their common words sets
const COMMON_WORDS_BY_LANGUAGE: Record<string, Set<string>> = {
  'de': GERMAN_COMMON_WORDS,
  'en': ENGLISH_COMMON_WORDS,
  'es': SPANISH_COMMON_WORDS,
  'fr': FRENCH_COMMON_WORDS,
};

// Function to check if a word is common in the specified language
export function isCommonWord(word: string, language: string = 'de'): boolean {
  const commonWords = COMMON_WORDS_BY_LANGUAGE[language.toLowerCase()];
  if (!commonWords) {
    // If language not supported, don't filter any words
    return false;
  }
  return commonWords.has(word.toLowerCase());
}

// Function to extract unique words from text
export function extractUniqueWords(text: string, language: string = 'de'): string[] {
  // Split by spaces but keep spaces in the result
  const words = text.split(/(\s+)/);
  
  const uniqueWords = new Set<string>();
  
  words.forEach(word => {
    // Skip if it's just whitespace
    if (/^\s+$/.test(word)) return;
    
    // Clean the word (remove punctuation)
    const cleanWord = word.replace(/[.,!?;:"'()]/g, '').trim().toLowerCase();
    
    // Skip very short words
    if (cleanWord.length < 2) return;
    
    // Skip common words for the specified language
    if (isCommonWord(cleanWord, language)) return;
    
    uniqueWords.add(cleanWord);
  });
  
  return Array.from(uniqueWords);
}

// Export for backward compatibility (German-specific)
export { GERMAN_COMMON_WORDS };