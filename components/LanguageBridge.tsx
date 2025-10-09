'use client';

import React from 'react';

interface Highlight {
  word: string;
  language: 'german' | 'english';
  color?: string;
}

interface LanguageBridgeProps {
  concept: string;
  germanExample: string;
  englishExample: string;
  explanation: string;
  highlights?: Highlight[];
  tip?: string;
}

/**
 * LanguageBridge Component
 * 
 * A visual comparison tool that helps A1 German learners understand language patterns
 * by comparing German structures with familiar English equivalents.
 * 
 * Features:
 * - Side-by-side German/English comparison
 * - Word highlighting with color coding
 * - Simple explanations suitable for A1 level
 * - Optional memory tips
 * - Responsive design with clear visual separation
 */
export default function LanguageBridge({ 
  concept, 
  germanExample, 
  englishExample, 
  explanation, 
  highlights = [], 
  tip 
}: LanguageBridgeProps) {
  
  // Helper function to apply highlights to text
  const applyHighlights = (text: string, language: 'german' | 'english') => {
    let highlightedText = text;
    const relevantHighlights = highlights.filter(h => h.language === language);
    
    // Sort by length descending to avoid conflicts with overlapping highlights
    relevantHighlights.sort((a, b) => b.word.length - a.word.length);
    
    relevantHighlights.forEach((highlight, index) => {
      const regex = new RegExp(`\\b${highlight.word}\\b`, 'gi');
      const color = highlight.color || (language === 'german' ? 'bg-blue-100' : 'bg-green-100');
      const replacement = `<span class="px-1 py-0.5 rounded text-sm font-medium ${color} border border-opacity-50">${highlight.word}</span>`;
      highlightedText = highlightedText.replace(regex, replacement);
    });
    
    return highlightedText;
  };

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-6 my-4 shadow-sm">
      {/* Header */}
      <div className="mb-4">
        <h3 className="text-lg font-semibold text-gray-800 mb-2">
          Language Bridge: {concept}
        </h3>
        <div className="h-1 w-16 bg-gradient-to-r from-blue-500 to-green-500 rounded"></div>
      </div>

      {/* Comparison Section */}
      <div className="grid md:grid-cols-2 gap-6 mb-4">
        {/* German Side */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-center mb-2">
            <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center mr-2">
              <span className="text-white text-xs font-bold">DE</span>
            </div>
            <h4 className="font-semibold text-blue-800">German</h4>
          </div>
          <p 
            className="text-blue-900 text-lg font-medium leading-relaxed"
            dangerouslySetInnerHTML={{ 
              __html: applyHighlights(germanExample, 'german') 
            }}
          />
        </div>

        {/* English Side */}
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="flex items-center mb-2">
            <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center mr-2">
              <span className="text-white text-xs font-bold">EN</span>
            </div>
            <h4 className="font-semibold text-green-800">English</h4>
          </div>
          <p 
            className="text-green-900 text-lg font-medium leading-relaxed"
            dangerouslySetInnerHTML={{ 
              __html: applyHighlights(englishExample, 'english') 
            }}
          />
        </div>
      </div>

      {/* Bridge Arrow */}
      <div className="flex justify-center mb-4">
        <div className="flex items-center">
          <div className="h-0.5 w-8 bg-gray-300"></div>
          <div className="mx-2 text-gray-500">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16l4-4-4-4m6 8l4-4-4-4" />
            </svg>
          </div>
          <div className="h-0.5 w-8 bg-gray-300"></div>
        </div>
      </div>

      {/* Explanation */}
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mb-4">
        <h4 className="font-semibold text-gray-800 mb-2">Understanding the Pattern</h4>
        <p className="text-gray-700 leading-relaxed">{explanation}</p>
      </div>

      {/* Optional Tip */}
      {tip && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <div className="flex items-start">
            <div className="flex-shrink-0 mr-2 mt-0.5">
              <svg className="w-5 h-5 text-yellow-600" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
            </div>
            <div>
              <h4 className="font-semibold text-yellow-800 mb-1">💡 Memory Tip</h4>
              <p className="text-yellow-700">{tip}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}