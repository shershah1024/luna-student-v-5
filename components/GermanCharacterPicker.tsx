'use client';

import { useState } from 'react';
import { Type } from 'lucide-react';
import { cn } from '@/lib/utils';
import { utilityClasses } from '@/lib/design-tokens';

interface GermanCharacterPickerProps {
  /** Callback when a character is selected */
  onCharacterSelect: (character: string) => void;
  /** Additional CSS classes */
  className?: string;
  /** Whether the input field is currently active */
  isActive?: boolean;
}

/**
 * Component to help learners insert German special characters (umlauts and ß)
 * into their text input. Uses the same design as the FillInBlanks component.
 */
export function GermanCharacterPicker({ 
  onCharacterSelect, 
  className,
  isActive = true
}: GermanCharacterPickerProps) {
  const handleCharacterClick = (character: string) => {
    if (isActive) {
      onCharacterSelect(character);
    }
  };

  return (
    <div className={cn('text-center', className)}>
      <div className={cn(
        utilityClasses.premiumCard,
        "p-2 bg-gradient-to-br from-purple-50/50 to-pink-50/30 border border-purple-200/50 inline-block"
      )}>
        <div className="flex flex-wrap items-center gap-1.5 justify-center">
          {['ä', 'ö', 'ü', 'ß', 'Ä', 'Ö', 'Ü'].map((char) => (
            <button
              key={char}
              onClick={() => handleCharacterClick(char)}
              disabled={!isActive}
              className={cn(
                "w-7 h-7 flex items-center justify-center border rounded-lg font-medium transition-all duration-200 text-sm",
                "focus:outline-none focus:ring-2 focus:ring-purple-500/20",
                isActive
                  ? "bg-white border-purple-300 text-purple-700 hover:bg-purple-50 hover:border-purple-400 hover:scale-110 active:scale-95 shadow-sm"
                  : "bg-slate-100 border-slate-200 text-slate-400 cursor-not-allowed"
              )}
            >
              {char}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}