import React from 'react';

export type HighlightedSegment = {
  text: string;
  highlight: boolean;
  color?: string;
  tooltip?: string;
};

export type GrammarExplanationProps = {
  segments: HighlightedSegment[];
  title?: string;
  description?: string;
  id: string;
  className?: string;
};

export const GrammarExplanation = ({ 
  segments, 
  title, 
  description, 
  id,
  className = ''
}: GrammarExplanationProps) => {
  return (
    <div className={`w-full ${className}`}>
      {title && (
        <div className="flex items-center mb-3">
          <div className="bg-black text-white w-8 h-8 rounded-full flex items-center justify-center mr-2 font-bold">
            G
          </div>
          <h3 className="text-xl font-semibold text-gray-800 font-sans">
            {title}
          </h3>
        </div>
      )}
      
      {description && (
        <p className="text-gray-700 text-sm mb-4 pl-10">
          {description}
        </p>
      )}
      
      <div className="space-y-4">
        {segments.map((segment, index) => (
          <div key={`${id}-${index}`} className="flex flex-col">
            <div className="text-base leading-relaxed whitespace-pre-line">
              <span
                className={`inline-flex items-baseline relative ${segment.highlight ? 'group cursor-help' : ''}`}
              >
                {segment.highlight ? (
                  <span 
                    className="relative z-0 inline-block px-1 py-0.5 rounded"
                    style={{
                      backgroundColor: `${segment.color || '#b3e6b3'}40`, // Add 40 (25% opacity) to color
                      border: `2px solid ${segment.color || '#b3e6b3'}`,
                    }}
                  >
                    {segment.text}
                  </span>
                ) : (
                  <span>{segment.text}</span>
                )}
                
                {segment.highlight && segment.tooltip && (
                  <div className="absolute left-1/2 -translate-x-1/2 -top-10 opacity-0 group-hover:opacity-100 group-hover:-translate-y-1 transform transition-all duration-200 ease-out z-20">
                    <div className="bg-gray-800 text-white text-xs font-medium px-3 py-1.5 rounded-lg shadow-xl whitespace-nowrap">
                      {segment.tooltip}
                      <div className="absolute left-1/2 -bottom-1.5 w-3 h-3 bg-gray-800 transform -translate-x-1/2 rotate-45"></div>
                    </div>
                  </div>
                )}
              </span>
            </div>
            {segment.highlight && segment.tooltip && (
              <div className="text-xs text-gray-600 font-medium mt-1 pl-2 border-l-2 border-gray-300">
                {segment.tooltip}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};
