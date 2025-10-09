import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

export type GrammarNoteSegment = {
  text: string;
  highlight?: boolean;
  color?: string;
  markdown?: string;
};

export type GrammarNoteProps = {
  segments: GrammarNoteSegment[];
  title?: string;
  description?: string;
  id: string;
  className?: string;
};

export const GrammarNote = ({ 
  segments, 
  title, 
  description, 
  id,
  className = ''
}: GrammarNoteProps) => {
  // Safety check: ensure segments is an array
  const safeSegments = Array.isArray(segments) ? segments : [];
  
  if (safeSegments.length === 0) {
    return (
      <div className={`w-full max-w-4xl my-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg ${className}`}>
        <div className="text-yellow-800 text-sm">
          ⚠️ Grammar explanation data is missing or malformed
        </div>
        {title && <div className="text-xs text-yellow-600 mt-1">Title: {title}</div>}
        {description && <div className="text-xs text-yellow-600 mt-1">Description: {description}</div>}
      </div>
    );
  }

  return (
    <div className={`w-full max-w-4xl my-6 ${className}`}>
      {title && (
        <div className="mb-5">
          <h3 className="text-xl font-bold text-gray-800 mb-2">
            {title}
          </h3>
          {description && (
            <p className="text-gray-700 text-sm leading-relaxed italic">
              {description}
            </p>
          )}
        </div>
      )}
      
      <div className="space-y-4">
        {safeSegments.map((segment, index) => (
          <div key={`${id}-${index}`} className="flex flex-col">
            {/* Text with transparent highlighting */}
            <div className="text-lg leading-relaxed mb-3">
              <span
                className={`inline-block transition-all duration-200 ${
                  segment.highlight 
                    ? 'px-3 py-2 rounded-lg font-semibold border-l-4 backdrop-blur-sm' 
                    : 'text-gray-800 font-medium'
                }`}
                style={{
                  backgroundColor: segment.highlight ? `${segment.color || '#ef4444'}10` : 'transparent',
                  borderLeftColor: segment.highlight ? (segment.color || '#ef4444') : 'transparent',
                  color: segment.highlight ? '#991b1b' : 'inherit'
                }}
              >
                {segment.text}
              </span>
            </div>
            
            {/* Transparent markdown explanation */}
            {segment.markdown && (
              <div className="ml-4 p-4 backdrop-blur-sm rounded-lg border border-white/20">
                <div className="prose prose-sm max-w-none
                    prose-headings:text-gray-800 prose-headings:font-semibold prose-headings:mb-2 prose-headings:mt-1
                    prose-p:text-gray-700 prose-p:mb-2 prose-p:leading-relaxed
                    prose-strong:text-red-700 prose-strong:font-bold prose-strong:bg-red-100/50 prose-strong:px-1 prose-strong:py-0.5 prose-strong:rounded
                    prose-em:text-gray-800 prose-em:font-medium prose-em:not-italic
                    prose-code:bg-white/30 prose-code:text-gray-800 prose-code:px-2 prose-code:py-1 prose-code:rounded prose-code:text-sm prose-code:font-mono
                    prose-ul:text-gray-700 prose-ul:mb-2
                    prose-li:text-gray-700 prose-li:mb-1 prose-li:marker:text-red-500
                    prose-blockquote:border-red-300 prose-blockquote:text-gray-700 prose-blockquote:bg-white/20 prose-blockquote:p-3 prose-blockquote:rounded-lg
                    prose-table:border-collapse prose-table:border prose-table:border-gray-300 prose-table:bg-white/40
                    prose-thead:bg-red-50/50 prose-th:border prose-th:border-gray-300 prose-th:px-3 prose-th:py-2 prose-th:font-semibold prose-th:text-gray-800
                    prose-td:border prose-td:border-gray-300 prose-td:px-3 prose-td:py-2 prose-td:text-gray-700">
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>
                    {segment.markdown}
                  </ReactMarkdown>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};