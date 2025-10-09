/**
 * Azure Speech Services Pronunciation Assessment supported languages
 * Based on Azure documentation and materials backend requirements
 * Format: BCP-47 language codes (language-region)
 */

export interface AzureLanguage {
  code: string;      // BCP-47 code (e.g., "de-DE")
  name: string;      // Display name (e.g., "German")
  region: string;    // Region/variant (e.g., "Germany")
  supported: boolean; // Whether pronunciation assessment is supported
}

// Languages with full pronunciation assessment support
export const AZURE_PRONUNCIATION_LANGUAGES: AzureLanguage[] = [
  // English variants
  { code: "en-US", name: "English", region: "United States", supported: true },
  { code: "en-GB", name: "English", region: "United Kingdom", supported: true },
  { code: "en-AU", name: "English", region: "Australia", supported: true },
  { code: "en-CA", name: "English", region: "Canada", supported: true },
  { code: "en-IN", name: "English", region: "India", supported: true },
  
  // German
  { code: "de-DE", name: "German", region: "Germany", supported: true },
  { code: "de-AT", name: "German", region: "Austria", supported: true },
  { code: "de-CH", name: "German", region: "Switzerland", supported: true },
  
  // Spanish variants
  { code: "es-ES", name: "Spanish", region: "Spain", supported: true },
  { code: "es-MX", name: "Spanish", region: "Mexico", supported: true },
  { code: "es-US", name: "Spanish", region: "United States", supported: true },
  { code: "es-AR", name: "Spanish", region: "Argentina", supported: true },
  
  // French variants
  { code: "fr-FR", name: "French", region: "France", supported: true },
  { code: "fr-CA", name: "French", region: "Canada", supported: true },
  
  // Chinese
  { code: "zh-CN", name: "Chinese", region: "Simplified", supported: true },
  { code: "zh-TW", name: "Chinese", region: "Traditional", supported: true },
  { code: "zh-HK", name: "Chinese", region: "Hong Kong", supported: true },
  
  // Japanese
  { code: "ja-JP", name: "Japanese", region: "Japan", supported: true },
  
  // Korean
  { code: "ko-KR", name: "Korean", region: "Korea", supported: true },
  
  // Italian
  { code: "it-IT", name: "Italian", region: "Italy", supported: true },
  
  // Portuguese
  { code: "pt-BR", name: "Portuguese", region: "Brazil", supported: true },
  { code: "pt-PT", name: "Portuguese", region: "Portugal", supported: true },
  
  // Dutch
  { code: "nl-NL", name: "Dutch", region: "Netherlands", supported: true },
  { code: "nl-BE", name: "Dutch", region: "Belgium", supported: true },
  
  // Russian
  { code: "ru-RU", name: "Russian", region: "Russia", supported: true },
  
  // Arabic
  { code: "ar-SA", name: "Arabic", region: "Saudi Arabia", supported: true },
  { code: "ar-EG", name: "Arabic", region: "Egypt", supported: true },
  { code: "ar-AE", name: "Arabic", region: "UAE", supported: true },
  
  // Hindi
  { code: "hi-IN", name: "Hindi", region: "India", supported: true },
  
  // Polish
  { code: "pl-PL", name: "Polish", region: "Poland", supported: true },
  
  // Turkish
  { code: "tr-TR", name: "Turkish", region: "Turkey", supported: true },
  
  // Swedish
  { code: "sv-SE", name: "Swedish", region: "Sweden", supported: true },
  
  // Danish
  { code: "da-DK", name: "Danish", region: "Denmark", supported: true },
  
  // Norwegian
  { code: "nb-NO", name: "Norwegian", region: "Bokmål", supported: true },
  
  // Finnish
  { code: "fi-FI", name: "Finnish", region: "Finland", supported: true }
];

/**
 * Get display label for a language
 */
export function getLanguageLabel(lang: AzureLanguage): string {
  return lang.region ? `${lang.name} (${lang.region})` : lang.name;
}

/**
 * Get language by code
 */
export function getLanguageByCode(code: string): AzureLanguage | undefined {
  return AZURE_PRONUNCIATION_LANGUAGES.find(lang => lang.code === code);
}

/**
 * Get all unique language names (without regions)
 */
export function getUniqueLanguages(): string[] {
  return [...new Set(AZURE_PRONUNCIATION_LANGUAGES.map(lang => lang.name))];
}

/**
 * Get all languages for a specific language name
 */
export function getLanguageVariants(languageName: string): AzureLanguage[] {
  return AZURE_PRONUNCIATION_LANGUAGES.filter(lang => lang.name === languageName);
}

/**
 * Default language for the application
 */
export const DEFAULT_LANGUAGE = "de-DE"; // German (Germany)

/**
 * Languages grouped by main language for UI display
 */
export const LANGUAGE_GROUPS = [
  {
    name: "Most Common",
    languages: ["en-US", "de-DE", "es-ES", "fr-FR", "zh-CN", "ja-JP"]
  },
  {
    name: "English",
    languages: ["en-US", "en-GB", "en-AU", "en-CA", "en-IN"]
  },
  {
    name: "German", 
    languages: ["de-DE", "de-AT", "de-CH"]
  },
  {
    name: "Spanish",
    languages: ["es-ES", "es-MX", "es-US", "es-AR"]
  },
  {
    name: "French",
    languages: ["fr-FR", "fr-CA"]
  },
  {
    name: "Chinese",
    languages: ["zh-CN", "zh-TW", "zh-HK"]
  },
  {
    name: "Other European",
    languages: ["it-IT", "pt-PT", "nl-NL", "pl-PL", "ru-RU", "tr-TR", "sv-SE", "da-DK", "nb-NO", "fi-FI"]
  },
  {
    name: "Other",
    languages: ["ja-JP", "ko-KR", "ar-SA", "hi-IN", "pt-BR"]
  }
];