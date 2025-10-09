'use client';

import { Type } from 'lucide-react';
import { cn } from '@/lib/utils';

/**
 * Special characters configuration by language
 * Each language defines its commonly needed special characters
 */
const LANGUAGE_CHARACTERS: Record<string, string[]> = {
  german: ['ä', 'ö', 'ü', 'ß', 'Ä', 'Ö', 'Ü'],
  french: ['à', 'â', 'é', 'è', 'ê', 'ë', 'î', 'ï', 'ô', 'ù', 'û', 'ü', 'ÿ', 'ç', 'œ', 'æ'],
  spanish: ['á', 'é', 'í', 'ó', 'ú', 'ñ', 'ü', '¿', '¡'],
  portuguese: ['á', 'â', 'ã', 'à', 'é', 'ê', 'í', 'ó', 'ô', 'õ', 'ú', 'ç'],
  italian: ['à', 'è', 'é', 'ì', 'ò', 'ó', 'ù'],
};

interface SpecialCharacterToolbarProps {
  /** The language for which to show special characters */
  language: string;
  /** Callback when a character is selected */
  onCharacterSelect: (character: string) => void;
  /** Additional CSS classes */
  className?: string;
  /** Whether the toolbar is currently active */
  isActive?: boolean;
  /** Compact mode for smaller UI */
  compact?: boolean;
}

/**
 * A reusable toolbar component that provides quick access to special characters
 * for different languages. Useful for learners who may not have easy keyboard
 * access to language-specific characters.
 *
 * Usage:
 * ```tsx
 * <SpecialCharacterToolbar
 *   language="german"
 *   onCharacterSelect={(char) => insertCharacter(char)}
 * />
 * ```
 */
export function SpecialCharacterToolbar({
  language,
  onCharacterSelect,
  className,
  isActive = true,
  compact = false
}: SpecialCharacterToolbarProps) {
  // Normalize language name to lowercase for lookup
  const normalizedLanguage = language.toLowerCase();
  const characters = LANGUAGE_CHARACTERS[normalizedLanguage] || [];

  // If no characters defined for this language, don't render anything
  if (characters.length === 0) {
    return null;
  }

  const handleCharacterClick = (character: string) => {
    if (isActive) {
      onCharacterSelect(character);
    }
  };

  return (
    <div className={cn('flex items-center gap-2', className)}>
      {!compact && (
        <div className="flex items-center gap-1.5 text-sm text-gray-600">
          <Type className="h-4 w-4" />
          <span className="font-medium">Special characters:</span>
        </div>
      )}

      <div className="flex flex-wrap items-center gap-1.5">
        {characters.map((char) => (
          <button
            key={char}
            onClick={() => handleCharacterClick(char)}
            disabled={!isActive}
            className={cn(
              compact ? "w-7 h-7" : "w-8 h-8",
              "flex items-center justify-center border rounded-lg font-medium transition-all duration-200 text-sm",
              "focus:outline-none focus:ring-2 focus:ring-blue-500/20",
              isActive
                ? "bg-white border-blue-300 text-blue-700 hover:bg-blue-50 hover:border-blue-400 hover:scale-110 active:scale-95 shadow-sm"
                : "bg-slate-100 border-slate-200 text-slate-400 cursor-not-allowed"
            )}
            title={`Insert ${char}`}
          >
            {char}
          </button>
        ))}
      </div>
    </div>
  );
}
