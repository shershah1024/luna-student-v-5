// Detailed language codes for all language-specific features
export const LANGUAGE_CODES = {
  'en-US': { code: 'en-US', name: 'English (US)', shortCode: 'en' },
  'en-GB': { code: 'en-GB', name: 'English (UK)', shortCode: 'en' },
  'en-AU': { code: 'en-AU', name: 'English (Australia)', shortCode: 'en' },
  'en-CA': { code: 'en-CA', name: 'English (Canada)', shortCode: 'en' },
  'en-IN': { code: 'en-IN', name: 'English (India)', shortCode: 'en' },
  'es-ES': { code: 'es-ES', name: 'Spanish (Spain)', shortCode: 'es' },
  'es-MX': { code: 'es-MX', name: 'Spanish (Mexico)', shortCode: 'es' },
  'fr-FR': { code: 'fr-FR', name: 'French (France)', shortCode: 'fr' },
  'fr-CA': { code: 'fr-CA', name: 'French (Canada)', shortCode: 'fr' },
  'de-DE': { code: 'de-DE', name: 'German', shortCode: 'de' },
  'hi-IN': { code: 'hi-IN', name: 'Hindi', shortCode: 'hi' },
  'it-IT': { code: 'it-IT', name: 'Italian', shortCode: 'it' },
  'pt-BR': { code: 'pt-BR', name: 'Portuguese (Brazil)', shortCode: 'pt' },
  'pt-PT': { code: 'pt-PT', name: 'Portuguese (Portugal)', shortCode: 'pt' },
  'nl-NL': { code: 'nl-NL', name: 'Dutch', shortCode: 'nl' },
  'pl-PL': { code: 'pl-PL', name: 'Polish', shortCode: 'pl' },
  'ru-RU': { code: 'ru-RU', name: 'Russian', shortCode: 'ru' },
  'ja-JP': { code: 'ja-JP', name: 'Japanese', shortCode: 'ja' },
  'ko-KR': { code: 'ko-KR', name: 'Korean', shortCode: 'ko' },
  'zh-CN': { code: 'zh-CN', name: 'Chinese (Mandarin)', shortCode: 'zh' },
  'af-ZA': { code: 'af-ZA', name: 'Afrikaans (South Africa)', shortCode: 'af' },
  'am-ET': { code: 'am-ET', name: 'Amharic (Ethiopia)', shortCode: 'am' },
  'ar-EG': { code: 'ar-EG', name: 'Arabic (Egypt)', shortCode: 'ar' },
  'ar-SA': { code: 'ar-SA', name: 'Arabic (Saudi Arabia)', shortCode: 'ar' },
  'az-AZ': { code: 'az-AZ', name: 'Azerbaijani (Azerbaijan)', shortCode: 'az' },
  'bg-BG': { code: 'bg-BG', name: 'Bulgarian', shortCode: 'bg' },
  'ca-ES': { code: 'ca-ES', name: 'Catalan', shortCode: 'ca' },
  'zh-HK': { code: 'zh-HK', name: 'Chinese (Cantonese)', shortCode: 'zh' },
  'hr-HR': { code: 'hr-HR', name: 'Croatian', shortCode: 'hr' },
  'cs-CZ': { code: 'cs-CZ', name: 'Czech', shortCode: 'cs' },
  'da-DK': { code: 'da-DK', name: 'Danish', shortCode: 'da' },
  'fi-FI': { code: 'fi-FI', name: 'Finnish', shortCode: 'fi' },
  'el-GR': { code: 'el-GR', name: 'Greek', shortCode: 'el' },
  'he-IL': { code: 'he-IL', name: 'Hebrew', shortCode: 'he' },
  'hu-HU': { code: 'hu-HU', name: 'Hungarian', shortCode: 'hu' },
  'id-ID': { code: 'id-ID', name: 'Indonesian', shortCode: 'id' },
  'nb-NO': { code: 'nb-NO', name: 'Norwegian Bokmål', shortCode: 'nb' },
  'ro-RO': { code: 'ro-RO', name: 'Romanian', shortCode: 'ro' },
  'sk-SK': { code: 'sk-SK', name: 'Slovak', shortCode: 'sk' },
  'sv-SE': { code: 'sv-SE', name: 'Swedish', shortCode: 'sv' },
  'th-TH': { code: 'th-TH', name: 'Thai', shortCode: 'th' },
  'tr-TR': { code: 'tr-TR', name: 'Turkish', shortCode: 'tr' },
  'uk-UA': { code: 'uk-UA', name: 'Ukrainian', shortCode: 'uk' },
  'vi-VN': { code: 'vi-VN', name: 'Vietnamese', shortCode: 'vi' }
} as const;

export type LanguageCode = keyof typeof LANGUAGE_CODES;

// Simple language mapping for general use
export const SUPPORTED_LANGUAGES = {
  'en': 'English',
  'es': 'Spanish',
  'fr': 'French',
  'de': 'German',
  'hi': 'Hindi',
  'it': 'Italian',
  'pt': 'Portuguese',
  'nl': 'Dutch',
  'pl': 'Polish',
  'ru': 'Russian',
  'ja': 'Japanese',
  'ko': 'Korean',
  'zh': 'Chinese',
  'af': 'Afrikaans',
  'am': 'Amharic',
  'ar': 'Arabic',
  'az': 'Azerbaijani',
  'bg': 'Bulgarian',
  'ca': 'Catalan',
  'hr': 'Croatian',
  'cs': 'Czech',
  'da': 'Danish',
  'fi': 'Finnish',
  'el': 'Greek',
  'he': 'Hebrew',
  'hu': 'Hungarian',
  'id': 'Indonesian',
  'nb': 'Norwegian Bokmål',
  'ro': 'Romanian',
  'sk': 'Slovak',
  'sv': 'Swedish',
  'th': 'Thai',
  'tr': 'Turkish',
  'uk': 'Ukrainian',
  'vi': 'Vietnamese'
} as const;

export type SupportedLanguage = keyof typeof SUPPORTED_LANGUAGES;

// Helper functions
export const getDetailedLanguageCode = (shortCode: string): string => {
  const found = Object.values(LANGUAGE_CODES).find(lang => lang.shortCode === shortCode);
  return found ? found.code : 'en-US';
};

export const getShortLanguageCode = (detailedCode: string): string => {
  return LANGUAGE_CODES[detailedCode as LanguageCode]?.shortCode || 'en';
};

export const getLanguageDisplayName = (code: string): string => {
  if (code.includes('-')) {
    return LANGUAGE_CODES[code as LanguageCode]?.name || 'English (US)';
  }
  const found = Object.values(LANGUAGE_CODES).find(lang => lang.shortCode === code);
  return found ? found.name : 'English (US)';
};

export const getLanguageName = (code: string): string => {
  return SUPPORTED_LANGUAGES[code as SupportedLanguage] || 'English';
};
