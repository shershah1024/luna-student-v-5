'use client';

import { useState } from 'react';
import { Book, ChevronDown, ChevronUp } from 'lucide-react';

interface TableCell {
  text: string;
  color?: string; // Tailwind color class like "bg-blue-100"
}

interface GrammarTableProps {
  title: string;
  headers: string[];
  rows: TableCell[][];
  caption?: string;
  notes?: string[];
  id: string;
  onComplete?: () => void;
}

export function GrammarTable({
  title,
  headers,
  rows,
  caption,
  notes,
  id,
  onComplete
}: GrammarTableProps) {
  const [isExpanded, setIsExpanded] = useState(true);

  return (
    <div className="bg-green-50 border border-green-200 rounded-lg p-4 my-4">
      <div className="mb-4">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <Book className="h-5 w-5 text-green-600" />
            <h3 className="font-semibold text-green-800">
              {title}
            </h3>
          </div>
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-1 hover:bg-green-100 rounded-md transition-colors"
          >
            {isExpanded ? (
              <ChevronUp className="h-4 w-4 text-green-600" />
            ) : (
              <ChevronDown className="h-4 w-4 text-green-600" />
            )}
          </button>
        </div>
        
        {/* Caption */}
        {caption && (
          <p className="text-green-700 text-sm mb-3 italic">
            {caption}
          </p>
        )}
        
        {isExpanded && (
          <>
            {/* Grammar Table */}
            <div className="overflow-x-auto">
              <table className="w-full border-collapse bg-white rounded-lg shadow-sm">
                <thead>
                  <tr className="bg-green-100">
                    {headers.map((header, index) => (
                      <th
                        key={index}
                        className="border border-green-200 px-4 py-2 text-left font-semibold text-green-800"
                      >
                        {header}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {rows.map((row, rowIndex) => (
                    <tr
                      key={rowIndex}
                      className="hover:bg-gray-50"
                    >
                      {row.map((cell, cellIndex) => (
                        <td
                          key={cellIndex}
                          className={`border border-green-200 px-4 py-2 text-gray-800 ${
                            cell.color || ''
                          } ${
                            cellIndex === 0 ? 'font-medium' : '' // First column slightly bold
                          }`}
                        >
                          {cell.text}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Notes Section */}
            {notes && notes.length > 0 && (
              <div className="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
                <h4 className="font-semibold text-blue-800 mb-2">Notes:</h4>
                <ul className="list-disc list-inside space-y-1">
                  {notes.map((note, index) => (
                    <li key={index} className="text-blue-700 text-sm">
                      {note}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Complete Button */}
            {onComplete && (
              <div className="mt-4 text-center">
                <button
                  onClick={onComplete}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm font-medium"
                >
                  Got it! Continue
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}