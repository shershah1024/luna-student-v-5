'use client';

import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import { Loader2 } from 'lucide-react';

interface ClickableTextProps {
  text: string;
  testId?: string;
  userId?: string;
  language?: string; // Language code (de, en, es, fr, etc.)
  textSizeClass?: string;
  className?: string;
}

// Component for making text clickable to get word definitions
export default function ClickableText({ 
  text, 
  testId, 
  userId, 
  language = 'de', // Default to German for backward compatibility
  textSizeClass = 'text-base',
  className = ''
}: ClickableTextProps) {
  const [selectedWord, setSelectedWord] = useState<string | null>(null);
  const [definition, setDefinition] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [popupPosition, setPopupPosition] = useState({ x: 0, y: 0 });
  const popupRef = useRef<HTMLDivElement>(null);

  // Fetch definition for clicked word
  const fetchDefinition = async (word: string, x: number, y: number) => {
    setLoading(true);
    setPopupPosition({ x, y });
    
    try {
      const response = await fetch('/api/lookup-definition', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          term: word,
          context: text, // Send the full text as context for better definitions
          test_id: testId || 'default', // Use provided testId or 'default' as fallback
          language // Include language parameter
        })
      });

      if (response.ok) {
        const data = await response.json();
        setDefinition(data.definition || 'Definition not found');
      } else {
        const errorData = await response.json();
        console.error('Error response from API:', errorData);
        setDefinition('Failed to fetch definition');
      }
    } catch (error) {
      console.error('Error fetching definition:', error);
      setDefinition('Error loading definition');
    } finally {
      setLoading(false);
    }

    // Log the word lookup if userId and testId are provided
    if (userId && testId) {
      try {
        await supabase.from('word_lookups').insert({
          user_id: userId,
          test_id: testId,
          word: word,
          created_at: new Date().toISOString()
        });
      } catch (error) {
        console.error('Error logging word lookup:', error);
      }
    }
  };

  // Handle word click
  const handleWordClick = (event: React.MouseEvent, word: string) => {
    event.preventDefault();
    event.stopPropagation();
    
    // Clean the word (remove punctuation)
    const cleanWord = word.replace(/[.,!?;:'"()[\]{}]/g, '').toLowerCase();
    
    if (cleanWord === selectedWord) {
      // Close popup if clicking the same word
      setSelectedWord(null);
      setDefinition(null);
    } else {
      setSelectedWord(cleanWord);
      fetchDefinition(cleanWord, event.clientX, event.clientY);
    }
  };

  // Close popup when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (popupRef.current && !popupRef.current.contains(event.target as Node)) {
        setSelectedWord(null);
        setDefinition(null);
      }
    };

    if (selectedWord) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [selectedWord]);

  // Split text into words and render them as clickable spans
  const renderClickableText = () => {
    const words = text.split(/(\s+)/);
    
    return words.map((word, index) => {
      // Check if this is whitespace
      if (/^\s+$/.test(word)) {
        return <span key={index}>{word}</span>;
      }
      
      // Extract the clean word for comparison
      const cleanWord = word.replace(/[.,!?;:'"()[\]{}]/g, '').toLowerCase();
      const isSelected = cleanWord === selectedWord;
      
      return (
        <span
          key={index}
          onClick={(e) => handleWordClick(e, word)}
          className={`cursor-pointer hover:bg-blue-100 hover:text-blue-700 transition-colors rounded px-0.5 ${
            isSelected ? 'bg-blue-200 text-blue-800' : ''
          }`}
        >
          {word}
        </span>
      );
    });
  };

  return (
    <>
      <span className={`${textSizeClass} ${className}`}>
        {renderClickableText()}
      </span>

      {/* Definition Popup */}
      {selectedWord && (
        <div
          ref={popupRef}
          className="fixed z-50 bg-white shadow-lg rounded-lg border border-gray-200 p-4 max-w-sm"
          style={{
            left: `${Math.min(popupPosition.x, window.innerWidth - 320)}px`,
            top: `${Math.min(popupPosition.y + 20, window.innerHeight - 200)}px`
          }}
        >
          <div className="font-semibold text-gray-800 mb-2">
            {selectedWord}
          </div>
          
          {loading ? (
            <div className="flex items-center justify-center py-2">
              <Loader2 className="w-5 h-5 animate-spin text-blue-500" />
            </div>
          ) : (
            <div className="text-sm text-gray-600">
              {definition}
            </div>
          )}

          <button
            onClick={() => {
              setSelectedWord(null);
              setDefinition(null);
            }}
            className="mt-3 text-xs text-gray-500 hover:text-gray-700 underline"
          >
            Close
          </button>
        </div>
      )}
    </>
  );
}